<?php
declare(strict_types=1);
require __DIR__ . '/payments-lib.php';

$action = (string)($_GET['action'] ?? '');
$config = paymentConfig();

if ($action === 'tariffs' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $public = array_map(static function(array $t): array {
        return [
            'id'=>$t['id'], 'service'=>$t['service'], 'trainer'=>$t['trainer'],
            'title'=>$t['title'], 'amount'=>$t['amount'],
        ];
    }, paymentTariffs());
    paymentJsonResponse(['ok'=>true,'tariffs'=>$public,'apiEnabled'=>paymentApiIsConfigured($config),'needsCustomerInfo'=>paymentApiIsConfigured($config) && $config['receipt_enabled']]);
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($input)) paymentJsonResponse(['ok'=>false,'error'=>'Некорректный запрос.'],400);
    $tariff = paymentTariffById(trim((string)($input['tariffId'] ?? '')));
    if (!$tariff) paymentJsonResponse(['ok'=>false,'error'=>'Такого тарифа нет. Обновите страницу и попробуйте ещё раз.'],400);

    $apiFieldsStarted = $config['api_token'] !== '' || $config['customer_code'] !== '' || $config['site_url'] !== '' || $config['receipt_enabled'];
    if (!paymentApiIsConfigured($config)) {
        if ($apiFieldsStarted) paymentJsonResponse(['ok'=>false,'error'=>'Настройка Точки заполнена не полностью. Проверьте payment.local.php.'],503);
        $fallback = (string)($tariff['fallbackUrl'] ?? '');
        if (!str_starts_with($fallback, 'https://qr.nspk.ru/')) paymentJsonResponse(['ok'=>false,'error'=>'Для этого тарифа не настроена платёжная ссылка.'],503);
        paymentJsonResponse([
            'ok'=>true,'mode'=>'legacy-link','paymentUrl'=>$fallback,
            'message'=>'Открывается существующая платёжная ссылка из PDF-прайса. Для автоматического статуса оплаты настройте API Точки и webhook.',
        ]);
    }

    $paymentLinkId = 'BELKA-' . strtoupper(bin2hex(random_bytes(10)));
    $siteUrl = $config['site_url'];
    $returnUrl = $siteUrl . '/payment-result.php?paymentLinkId=' . rawurlencode($paymentLinkId);
    $serviceLabel = $tariff['service'] === 'group' ? 'групповые занятия' : 'индивидуальные занятия';
    $purpose = mb_substrSafe('Оплата клуба «Бешеная Белка»: ' . $serviceLabel . ', ' . $tariff['title'] . ', ' . $tariff['trainer'], 0, 140);
    $amountText = number_format((int)$tariff['amount'], 2, '.', '');
    $data = [
        'customerCode' => $config['customer_code'],
        'amount' => $amountText,
        'purpose' => $purpose,
        'redirectUrl' => $returnUrl,
        'failRedirectUrl' => $returnUrl . '&payment=failed',
        'paymentMode' => $config['payment_modes'],
        'ttl' => 10080,
        'paymentLinkId' => $paymentLinkId,
    ];
    if ($config['merchant_id'] !== '') $data['merchantId'] = $config['merchant_id'];

    $apiUrl = $config['api_url'];
    if ($config['receipt_enabled']) {
        $customer = is_array($input['customer'] ?? null) ? $input['customer'] : [];
        $customerName = trim((string)($customer['name'] ?? ''));
        $customerEmail = trim((string)($customer['email'] ?? ''));
        $customerPhone = trim((string)($customer['phone'] ?? ''));
        if ($customerName === '' || strlen($customerName) > 160 || filter_var($customerEmail, FILTER_VALIDATE_EMAIL) === false || strlen($customerEmail) > 254) {
            paymentJsonResponse(['ok'=>false,'error'=>'Для электронного чека укажите имя и корректный email.'],422);
        }
        if ($customerPhone !== '' && !preg_match('/^[+0-9()\-\s]{7,25}$/', $customerPhone)) paymentJsonResponse(['ok'=>false,'error'=>'Проверьте номер телефона.'],422);
        $supplier = [
            'name'=>$config['supplier_name'],
            'taxCode'=>$config['supplier_tax_code'],
            'phone'=>$config['supplier_phone'],
        ];
        $item = [
            'vatType'=>$config['vat_type'],
            'name'=>$purpose,
            'amount'=>$amountText,
            'quantity'=>1,
            'paymentMethod'=>'full_prepayment',
            'paymentObject'=>'service',
            'measure'=>'шт.',
            'Supplier'=>$supplier,
        ];
        $data['taxSystemCode'] = $config['tax_system_code'];
        $data['Client'] = ['name'=>$customerName, 'email'=>$customerEmail];
        if ($customerPhone !== '') $data['Client']['phone'] = $customerPhone;
        $data['Items'] = [$item];
        $data['Supplier'] = $supplier;
        $apiUrl = $config['receipt_api_url'];
    }
    $result = tochkaHttpRequest('POST', $apiUrl, $config['api_token'], ['Data'=>$data]);
    if (!$result['ok']) {
        error_log('[Belka payments] Create payment failed; HTTP ' . (int)$result['status']);
        paymentJsonResponse(['ok'=>false,'error'=>$result['error']],502);
    }
    $resultData = $result['data']['Data'] ?? $result['data']['data'] ?? null;
    if (!is_array($resultData)) paymentJsonResponse(['ok'=>false,'error'=>'Точка вернула ответ в неожиданном формате.'],502);
    $paymentUrl = (string)($resultData['paymentLink'] ?? '');
    $operationId = (string)($resultData['operationId'] ?? '');
    if (!filter_var($paymentUrl, FILTER_VALIDATE_URL) || strtolower((string)parse_url($paymentUrl, PHP_URL_SCHEME)) !== 'https' || $operationId === '') {
        paymentJsonResponse(['ok'=>false,'error'=>'Точка не вернула ссылку или идентификатор платежа.'],502);
    }

    $orders = paymentReadOrders();
    $orders[] = [
        'paymentLinkId'=>$paymentLinkId, 'operationId'=>$operationId,
        'tariffId'=>$tariff['id'], 'service'=>$tariff['service'], 'trainer'=>$tariff['trainer'],
        'title'=>$tariff['title'], 'amount'=>(int)$tariff['amount'],
        'status'=>'pending', 'bankStatus'=>(string)($resultData['status'] ?? 'CREATED'),
        'paymentUrl'=>$paymentUrl, 'createdAt'=>gmdate('c'), 'updatedAt'=>gmdate('c'),
    ];
    if (count($orders) > 1500) $orders = array_slice($orders, -1500);
    if (!paymentWriteOrders($orders)) paymentJsonResponse(['ok'=>false,'error'=>'Ссылка создана, но не удалось сохранить заказ для проверки статуса. Свяжитесь с администратором сайта.'],500);
    paymentJsonResponse(['ok'=>true,'mode'=>'tochka','paymentUrl'=>$paymentUrl,'paymentLinkId'=>$paymentLinkId]);
}

if ($action === 'status' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = trim((string)($_GET['paymentLinkId'] ?? ''));
    if (!preg_match('/^BELKA-[A-F0-9]{20}$/', $id)) paymentJsonResponse(['ok'=>false,'error'=>'Некорректный идентификатор платежа.'],400);
    $order = paymentFindOrder(paymentReadOrders(), $id);
    if (!$order) paymentJsonResponse(['ok'=>false,'error'=>'Платёж пока не найден.'],404);
    paymentJsonResponse([
        'ok'=>true, 'status'=>(string)($order['status'] ?? 'pending'),
        'title'=>(string)($order['title'] ?? ''), 'amount'=>(int)($order['amount'] ?? 0),
        'updatedAt'=>(string)($order['updatedAt'] ?? ''),
    ]);
}

paymentJsonResponse(['ok'=>false,'error'=>'Неизвестное действие.'],404);

function mb_substrSafe(string $text, int $start, int $length): string {
    return function_exists('mb_substr') ? mb_substr($text, $start, $length, 'UTF-8') : substr($text, $start, $length);
}

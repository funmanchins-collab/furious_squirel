<?php
declare(strict_types=1);
require __DIR__ . '/payments-lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); header('Allow: POST'); echo 'Method Not Allowed'; exit;
}
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
$raw = trim((string)file_get_contents('php://input'));
$payload = paymentVerifyWebhookJwt($raw, paymentConfig());
if (!is_array($payload)) {
    error_log('[Belka payments] Rejected invalid Tochka webhook JWT.');
    http_response_code(400); echo 'Invalid webhook signature'; exit;
}

// Точка подписывает webhook JWT алгоритмом RS256. Обрабатываем только
// событие успешной оплаты и только заказ, который был создан этим сайтом.
$paymentLinkId = paymentFindPayloadValue($payload, ['paymentLinkId']);
$operationId = paymentFindPayloadValue($payload, ['operationId']);
$status = strtoupper((string)(paymentFindPayloadValue($payload, ['status']) ?? ''));
$amount = paymentFindPayloadValue($payload, ['amount']);
$orders = paymentReadOrders();
$order = paymentFindOrder($orders, (string)($paymentLinkId ?? ''), (string)($operationId ?? ''));

if ($order && $status === 'APPROVED') {
    $amountMatches = true;
    if ($amount !== null && is_numeric($amount)) {
        $amountMatches = abs(((float)$amount) - (float)$order['amount']) < 0.01;
    }
    $linkMatches = $paymentLinkId === null || hash_equals((string)$order['paymentLinkId'], (string)$paymentLinkId);
    $operationMatches = $operationId === null || hash_equals((string)$order['operationId'], (string)$operationId);
    if ($amountMatches && $linkMatches && $operationMatches) {
        foreach ($orders as &$item) {
            if (($item['paymentLinkId'] ?? '') === $order['paymentLinkId']) {
                $item['status'] = 'paid';
                $item['bankStatus'] = $status;
                $item['paidAt'] = gmdate('c');
                $item['updatedAt'] = gmdate('c');
                break;
            }
        }
        unset($item);
        paymentWriteOrders($orders);
    } else {
        error_log('[Belka payments] Webhook amount or identifier does not match order ' . (string)$order['paymentLinkId']);
    }
}

// Даже корректный тестовый webhook может не содержать данных сохранённого заказа.
// Возвращаем 200 на валидный JWT, чтобы Точка считала endpoint доступным.
http_response_code(200);
echo 'OK';

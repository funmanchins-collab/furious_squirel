<?php
declare(strict_types=1);

/**
 * Общие функции интеграции платежей.
 * Секретные данные хранятся в payment.local.php, а не в JavaScript.
 */
function paymentConfig(): array {
    $config = [
        'api_token' => '',
        'customer_code' => '',
        'merchant_id' => '',
        'site_url' => '',
        'api_url' => 'https://enter.tochka.com/uapi/acquiring/v1.0/payments',
        'receipt_api_url' => 'https://enter.tochka.com/uapi/acquiring/v1.0/payments_with_receipt',
        'payment_modes' => ['sbp', 'card'],
        'receipt_enabled' => false,
        'tax_system_code' => '',
        'vat_type' => '',
        'supplier_name' => '',
        'supplier_tax_code' => '',
        'supplier_phone' => '',
        'webhook_jwk' => null,
    ];
    $localFile = __DIR__ . '/payment.local.php';
    if (is_file($localFile)) {
        $local = require $localFile;
        if (is_array($local)) $config = array_replace($config, $local);
    }
    $config['api_token'] = trim((string)$config['api_token']);
    $config['customer_code'] = trim((string)$config['customer_code']);
    $config['merchant_id'] = trim((string)$config['merchant_id']);
    $config['site_url'] = rtrim(trim((string)$config['site_url']), '/');
    $config['api_url'] = trim((string)$config['api_url']);
    $config['receipt_api_url'] = trim((string)$config['receipt_api_url']);
    $config['receipt_enabled'] = (bool)$config['receipt_enabled'];
    foreach (['tax_system_code','vat_type','supplier_name','supplier_tax_code','supplier_phone'] as $key) $config[$key] = trim((string)$config[$key]);
    $allowedModes = ['sbp', 'card', 'tinkoff', 'dolyame'];
    $modes = is_array($config['payment_modes']) ? $config['payment_modes'] : ['sbp', 'card'];
    $config['payment_modes'] = array_values(array_intersect($allowedModes, array_unique($modes)));
    if (!$config['payment_modes']) $config['payment_modes'] = ['sbp', 'card'];
    return $config;
}

function paymentApiIsConfigured(array $config): bool {
    return $config['api_token'] !== ''
        && stripos($config['api_token'], 'PASTE_YOUR_') === false
        && $config['customer_code'] !== '000000000'
        && stripos($config['site_url'], 'your-domain.ru') === false
        && preg_match('/^\d{9}$/', $config['customer_code']) === 1
        && filter_var($config['site_url'], FILTER_VALIDATE_URL) !== false
        && strtolower((string)parse_url($config['site_url'], PHP_URL_SCHEME)) === 'https'
        && filter_var($config['receipt_enabled'] ? $config['receipt_api_url'] : $config['api_url'], FILTER_VALIDATE_URL) !== false
        && (!$config['receipt_enabled'] || (in_array($config['tax_system_code'], ['osn','usn_income','usn_income_outcome','esn','patent'], true)
            && in_array($config['vat_type'], ['none','vat0','vat5','vat7','vat10','vat22','vat105','vat107','vat110','vat122'], true)
            && $config['supplier_name'] !== '' && stripos($config['supplier_name'], 'ЗАПОЛНИТЬ') === false
            && preg_match('/^\d{10,12}$/', $config['supplier_tax_code']) === 1 && preg_match('/^0+$/', $config['supplier_tax_code']) !== 1
            && preg_match('/^\+?\d{10,15}$/', $config['supplier_phone']) === 1 && preg_match('/^\+?0+$/', $config['supplier_phone']) !== 1)); 
}

function paymentTariffs(): array {
    // Эти тарифы перенесены из PDF-прайса, приложенного к задаче.
    // fallbackUrl — отдельная платёжная ссылка, встроенная в строку данного тарифа в PDF.
    return [
        ['id'=>'group-senior-once','service'=>'group','trainer'=>'Старший тренер','title'=>'Разовое занятие','amount'=>1400,'fallbackUrl'=>'https://qr.nspk.ru/BS10006GLNU1G6BQ9TIATU1666MHOK5F'],
        ['id'=>'group-senior-4','service'=>'group','trainer'=>'Старший тренер','title'=>'Абонемент на 4 занятия','amount'=>4200,'fallbackUrl'=>'https://qr.nspk.ru/BS10000JA62NP25G8529SVI84JVP50MH'],
        ['id'=>'group-senior-8','service'=>'group','trainer'=>'Старший тренер','title'=>'Абонемент на 8 занятий','amount'=>6800,'fallbackUrl'=>'https://qr.nspk.ru/AS10007NN2USJVAE915P42K8E494F055'],
        ['id'=>'group-senior-12','service'=>'group','trainer'=>'Старший тренер','title'=>'Абонемент на 12 занятий','amount'=>8800,'fallbackUrl'=>'https://qr.nspk.ru/AS10004S79EGGUBH87IB9Q68NN5G5PU4'],
        ['id'=>'group-senior-unlimited','service'=>'group','trainer'=>'Старший тренер','title'=>'Безлимит на месяц','amount'=>10500,'fallbackUrl'=>'https://qr.nspk.ru/BS100018JA2SIKE890LA6F89I95TSPR1'],
        ['id'=>'group-trainer-once','service'=>'group','trainer'=>'Тренер','title'=>'Разовое занятие','amount'=>1150,'fallbackUrl'=>'https://qr.nspk.ru/BS100031A2IMUCJV81NQEISJB4BMKPOT'],
        ['id'=>'group-trainer-4','service'=>'group','trainer'=>'Тренер','title'=>'Абонемент на 4 занятия','amount'=>3500,'fallbackUrl'=>'https://qr.nspk.ru/AS100038N46M33D789M9I1RBJDEDG7S4'],
        ['id'=>'group-trainer-8','service'=>'group','trainer'=>'Тренер','title'=>'Абонемент на 8 занятий','amount'=>5600,'fallbackUrl'=>'https://qr.nspk.ru/AS10006DASQLCVED88599OK8ODKIVQNE'],
        ['id'=>'group-trainer-12','service'=>'group','trainer'=>'Тренер','title'=>'Абонемент на 12 занятий','amount'=>7200,'fallbackUrl'=>'https://qr.nspk.ru/AS10001QGM9AITVD9FC8PKAUI41ELS3Q'],
        ['id'=>'group-trainer-unlimited','service'=>'group','trainer'=>'Тренер','title'=>'Безлимит на месяц','amount'=>8800,'fallbackUrl'=>'https://qr.nspk.ru/BS10003DA01C70PL8APAE0FK2GJ7VC45'],
        ['id'=>'personal-senior-once','service'=>'individual','trainer'=>'Старший тренер','title'=>'Разовое занятие','amount'=>3500,'fallbackUrl'=>'https://qr.nspk.ru/BS10000E1R5BQM3O8FIQH8OQ8NEC6RPD'],
        ['id'=>'personal-senior-4','service'=>'individual','trainer'=>'Старший тренер','title'=>'Абонемент на 4 занятия','amount'=>12500,'fallbackUrl'=>'https://qr.nspk.ru/BS10006181SMGCTH8QCO4PC16NT851D0'],
        ['id'=>'personal-senior-8','service'=>'individual','trainer'=>'Старший тренер','title'=>'Абонемент на 8 занятий','amount'=>23000,'fallbackUrl'=>'https://qr.nspk.ru/BS10007CKFT2P8RH8B19LA525BEBKJ3D'],
        ['id'=>'personal-trainer-once','service'=>'individual','trainer'=>'Тренер','title'=>'Разовое занятие','amount'=>2500,'fallbackUrl'=>'https://qr.nspk.ru/AS10005HQTCTAHM790OAEONTOPMJLSME'],
        ['id'=>'personal-trainer-4','service'=>'individual','trainer'=>'Тренер','title'=>'Абонемент на 4 занятия','amount'=>9000,'fallbackUrl'=>'https://qr.nspk.ru/AS10006P6MCTQ2GH87UOCD74QSOKTJ85'],
        ['id'=>'personal-trainer-8','service'=>'individual','trainer'=>'Тренер','title'=>'Абонемент на 8 занятий','amount'=>16000,'fallbackUrl'=>'https://qr.nspk.ru/BS10002MD762EPU390LRMI0S84O6J935'],
    ];
}

function paymentTariffById(string $id): ?array {
    foreach (paymentTariffs() as $tariff) if (hash_equals($tariff['id'], $id)) return $tariff;
    return null;
}

function paymentJsonResponse(array $body, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function paymentOrdersPath(): string { return __DIR__ . '/storage/payments.json'; }
function paymentReadOrders(): array {
    $path = paymentOrdersPath();
    if (!is_file($path)) return [];
    $data = json_decode((string)@file_get_contents($path), true);
    return is_array($data) ? $data : [];
}
function paymentWriteOrders(array $orders): bool {
    $json = json_encode(array_values($orders), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if (!is_string($json)) return false;
    $path = paymentOrdersPath();
    $fp = @fopen($path, 'c+');
    if (!$fp) return false;
    $ok = false;
    if (flock($fp, LOCK_EX)) {
        $ok = ftruncate($fp, 0) && rewind($fp) && fwrite($fp, $json . "\n") !== false && fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
    return $ok;
}
function paymentFindOrder(array $orders, string $paymentLinkId, string $operationId = ''): ?array {
    foreach ($orders as $order) {
        if (!is_array($order)) continue;
        if ($paymentLinkId !== '' && isset($order['paymentLinkId']) && hash_equals((string)$order['paymentLinkId'], $paymentLinkId)) return $order;
        if ($operationId !== '' && isset($order['operationId']) && hash_equals((string)$order['operationId'], $operationId)) return $order;
    }
    return null;
}

function tochkaHttpRequest(string $method, string $url, string $token, ?array $body = null): array {
    if (!function_exists('openssl_verify')) return ['ok'=>false,'status'=>0,'data'=>null,'error'=>'На сервере PHP не включено расширение OpenSSL.'];
    $headers = "Authorization: Bearer " . $token . "\r\nContent-Type: application/json\r\nAccept: application/json\r\n";
    $contextOptions = [
        'http' => [
            'method' => strtoupper($method),
            'header' => $headers,
            'ignore_errors' => true,
            'timeout' => 20,
        ],
        'ssl' => ['verify_peer'=>true, 'verify_peer_name'=>true],
    ];
    if ($body !== null) $contextOptions['http']['content'] = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $context = stream_context_create($contextOptions);
    $raw = @file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    $status = 0;
    foreach ($responseHeaders as $header) if (preg_match('#^HTTP/\S+\s+(\d{3})#', $header, $m)) $status = (int)$m[1];
    $data = is_string($raw) ? json_decode($raw, true) : null;
    if ($status >= 200 && $status < 300 && is_array($data)) return ['ok'=>true,'status'=>$status,'data'=>$data,'error'=>''];
    return ['ok'=>false,'status'=>$status,'data'=>is_array($data)?$data:null,'error'=>'Банк не подтвердил создание платёжной ссылки. Проверьте токен, разрешения, customerCode, merchantId и доступные способы оплаты.'];
}

function paymentBase64UrlDecode(string $value): string|false {
    $value = strtr($value, '-_', '+/');
    $padding = strlen($value) % 4;
    if ($padding) $value .= str_repeat('=', 4 - $padding);
    return base64_decode($value, true);
}
function paymentDerLength(int $length): string {
    if ($length < 128) return chr($length);
    $bytes = '';
    while ($length > 0) { $bytes = chr($length & 0xff) . $bytes; $length >>= 8; }
    return chr(0x80 | strlen($bytes)) . $bytes;
}
function paymentDerInteger(string $bytes): string {
    $bytes = ltrim($bytes, "\x00");
    if ($bytes === '') $bytes = "\x00";
    if ((ord($bytes[0]) & 0x80) !== 0) $bytes = "\x00" . $bytes;
    return "\x02" . paymentDerLength(strlen($bytes)) . $bytes;
}
function paymentJwkToPem(array $jwk): ?string {
    if (($jwk['kty'] ?? '') !== 'RSA' || empty($jwk['n']) || empty($jwk['e'])) return null;
    $n = paymentBase64UrlDecode((string)$jwk['n']);
    $e = paymentBase64UrlDecode((string)$jwk['e']);
    if (!is_string($n) || !is_string($e)) return null;
    $rsaBody = paymentDerInteger($n) . paymentDerInteger($e);
    $rsa = "\x30" . paymentDerLength(strlen($rsaBody)) . $rsaBody;
    $algorithm = "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00";
    $bitString = "\x03" . paymentDerLength(strlen($rsa) + 1) . "\x00" . $rsa;
    $spkiBody = $algorithm . $bitString;
    $der = "\x30" . paymentDerLength(strlen($spkiBody)) . $spkiBody;
    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END PUBLIC KEY-----\n";
}
function paymentFindJwk(array $decoded, string $kid = ''): ?array {
    $keys = isset($decoded['keys']) && is_array($decoded['keys']) ? $decoded['keys'] : [$decoded];
    foreach ($keys as $key) {
        if (!is_array($key) || ($key['kty'] ?? '') !== 'RSA') continue;
        if ($kid === '' || !isset($key['kid']) || hash_equals($kid, (string)$key['kid'])) return $key;
    }
    return null;
}
function paymentWebhookJwk(string $kid, array $config): ?array {
    if (is_array($config['webhook_jwk'] ?? null)) {
        $key = paymentFindJwk($config['webhook_jwk'], $kid);
        if ($key) return $key;
    }
    $cachePath = __DIR__ . '/storage/tochka-public-key-cache.json';
    $cache = is_file($cachePath) ? json_decode((string)@file_get_contents($cachePath), true) : null;
    if (is_array($cache) && isset($cache['fetchedAt'], $cache['data']) && time() - (int)$cache['fetchedAt'] < 86400) {
        $key = paymentFindJwk((array)$cache['data'], $kid);
        if ($key) return $key;
    }
    $ctx = stream_context_create([
        'http'=>['method'=>'GET','header'=>"Accept: application/json\r\n",'timeout'=>5,'ignore_errors'=>true],
        'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true],
    ]);
    $raw = @file_get_contents('https://enter.tochka.com/doc/openapi/static/keys/public', false, $ctx);
    $remote = is_string($raw) ? json_decode($raw, true) : null;
    if (is_array($remote)) {
        @file_put_contents($cachePath, json_encode(['fetchedAt'=>time(),'data'=>$remote], JSON_UNESCAPED_SLASHES), LOCK_EX);
        $key = paymentFindJwk($remote, $kid);
        if ($key) return $key;
    }
    if (is_array($cache) && isset($cache['data'])) return paymentFindJwk((array)$cache['data'], $kid);
    return null;
}
function paymentVerifyWebhookJwt(string $jwt, array $config): ?array {
    $parts = explode('.', trim($jwt));
    if (count($parts) !== 3) return null;
    $headerRaw = paymentBase64UrlDecode($parts[0]);
    $payloadRaw = paymentBase64UrlDecode($parts[1]);
    $signature = paymentBase64UrlDecode($parts[2]);
    if (!is_string($headerRaw) || !is_string($payloadRaw) || !is_string($signature)) return null;
    $header = json_decode($headerRaw, true);
    $payload = json_decode($payloadRaw, true);
    if (!is_array($header) || !is_array($payload) || ($header['alg'] ?? '') !== 'RS256') return null;
    $jwk = paymentWebhookJwk((string)($header['kid'] ?? ''), $config);
    if (!$jwk) return null;
    $pem = paymentJwkToPem($jwk);
    if (!$pem) return null;
    $publicKey = openssl_pkey_get_public($pem);
    if ($publicKey === false) return null;
    $verified = openssl_verify($parts[0] . '.' . $parts[1], $signature, $publicKey, OPENSSL_ALGO_SHA256);
    if (is_resource($publicKey)) openssl_free_key($publicKey);
    return $verified === 1 ? $payload : null;
}
function paymentFindPayloadValue(array $payload, array $keys, int $depth = 0): ?string {
    if ($depth > 6) return null;
    foreach ($payload as $key => $value) {
        foreach ($keys as $wanted) {
            if (strcasecmp((string)$key, $wanted) === 0 && (is_string($value) || is_numeric($value))) return (string)$value;
        }
    }
    foreach ($payload as $value) if (is_array($value)) {
        $found = paymentFindPayloadValue($value, $keys, $depth + 1);
        if ($found !== null) return $found;
    }
    return null;
}

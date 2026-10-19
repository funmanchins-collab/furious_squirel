<?php
/**
 * Скопируйте этот файл как payment.local.php и заполните данными Точки.
 * Не публикуйте payment.local.php и не вставляйте токен в payments.js.
 */
return [
    // Долгоживущий JWT из интернет-банка Точка для вашего бизнеса.
    'api_token' => 'PASTE_YOUR_TOCHKA_JWT_TOKEN_HERE',

    // customerCode — 9 символов, доступен в API Точки для вашего бизнеса.
    'customer_code' => '000000000',

    // merchantId — 15 цифр. Можно оставить пустым, если у компании одна торговая точка.
    'merchant_id' => '',

    // Внешний адрес сайта на HTTPS, без слеша в конце.
    'site_url' => 'https://your-domain.ru',

    // Указывайте только способы, подключённые у вашей торговой точки.
    // sbp = СБП, card = карта, tinkoff = T-Pay, dolyame = Долями.
    'payment_modes' => ['sbp', 'card'],

    // Стандартный production endpoint. Sandbox задаётся отдельно по инструкциям банка.
    'api_url' => 'https://enter.tochka.com/uapi/acquiring/v1.0/payments',
    'receipt_api_url' => 'https://enter.tochka.com/uapi/acquiring/v1.0/payments_with_receipt',

    // Если по вашей схеме нужна фискализация, включите true после подтверждения бухгалтером.
    // До включения заполните supplier_*, tax_system_code и vat_type.
    'receipt_enabled' => false,
    'tax_system_code' => 'usn_income', // ПРИМЕР: подтвердите вашу систему налогообложения.
    'vat_type' => 'none',             // ПРИМЕР: подтвердите правильную ставку НДС.
    'supplier_name' => 'ЗАПОЛНИТЬ НАИМЕНОВАНИЕ ИП/ОРГАНИЗАЦИИ',
    'supplier_tax_code' => '0000000000', // ИНН на 10 или 12 цифр.
    'supplier_phone' => '+70000000000',

    // Необязательно: можно задать актуальный JWK в виде PHP-массива.
    // Обычно обработчик сам получает ключ с https://enter.tochka.com/doc/openapi/static/keys/public.
    'webhook_jwk' => null,
];

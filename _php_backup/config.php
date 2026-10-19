<?php
declare(strict_types=1);

const DATA_FILE = __DIR__ . '/storage/site.json';
const UPLOAD_DIR = __DIR__ . '/uploads';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
    require $localConfig;
}

if (!isset($ADMIN_PASSWORD_HASH)) {
    $ADMIN_PASSWORD_HASH = '';
}

function adminConfigured(): bool {
    global $ADMIN_PASSWORD_HASH;
    return is_string($ADMIN_PASSWORD_HASH) && $ADMIN_PASSWORD_HASH !== '';
}

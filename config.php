<?php
declare(strict_types=1);

const DATA_FILE = __DIR__ . '/storage/site.json';
const GALLERY_FILE = __DIR__ . '/storage/gallery.json';
const UPLOAD_DIR = __DIR__ . '/uploads';
const GALLERY_UPLOAD_DIR = __DIR__ . '/uploads/gallery';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_GALLERY_PHOTOS = 6;

$ADMIN_PASSWORD_HASH = '';
$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
    require $localConfig;
}

function adminConfigured(): bool {
    global $ADMIN_PASSWORD_HASH;
    return is_string($ADMIN_PASSWORD_HASH) && $ADMIN_PASSWORD_HASH !== '' && password_get_info($ADMIN_PASSWORD_HASH)['algo'] !== 0;
}

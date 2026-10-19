<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

session_name('belka_admin');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_start();

function jsonResponse(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function loadData(): array {
    if (!is_file(DATA_FILE)) return [];
    $raw = file_get_contents(DATA_FILE);
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function saveData(array $data): void {
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || file_put_contents(DATA_FILE, $json, LOCK_EX) === false) {
        throw new RuntimeException('Не удалось сохранить данные.');
    }
}

function requireAdmin(): void {
    if (empty($_SESSION['admin'])) {
        jsonResponse(['ok'=>false,'error'=>'Требуется вход'], 401);
    }
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

function requireCsrf(): void {
    $token = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals((string)($_SESSION['csrf'] ?? ''), $token)) {
        jsonResponse(['ok'=>false,'error'=>'CSRF token invalid'], 419);
    }
}

$action = (string)($_GET['action'] ?? $_POST['action'] ?? '');

if ($action === 'public' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse(['ok'=>true,'data'=>loadData()]);
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!adminConfigured()) {
        jsonResponse(['ok'=>false,'error'=>'Сначала откройте /install.php и создайте пароль администратора.'], 503);
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $password = (string)($input['password'] ?? '');
    global $ADMIN_PASSWORD_HASH;

    if (!password_verify($password, $ADMIN_PASSWORD_HASH)) {
        usleep(350000);
        jsonResponse(['ok'=>false,'error'=>'Неверный пароль'], 403);
    }

    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    jsonResponse(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
}

if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    session_unset();
    session_destroy();
    jsonResponse(['ok'=>true]);
}

if ($action === 'admin' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdmin();
    jsonResponse(['ok'=>true,'data'=>loadData(),'csrf'=>$_SESSION['csrf']]);
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin();
    requireCsrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) jsonResponse(['ok'=>false,'error'=>'Некорректный JSON'], 400);
    try {
        saveData($input);
        jsonResponse(['ok'=>true]);
    } catch (Throwable $e) {
        jsonResponse(['ok'=>false,'error'=>$e->getMessage()], 500);
    }
}

if ($action === 'upload' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAdmin();
    requireCsrf();

    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        jsonResponse(['ok'=>false,'error'=>'Файл не передан'], 400);
    }

    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        jsonResponse(['ok'=>false,'error'=>'Ошибка загрузки файла'], 400);
    }
    if (($file['size'] ?? 0) > MAX_UPLOAD_BYTES) {
        jsonResponse(['ok'=>false,'error'=>'Максимальный размер — 10 МБ'], 400);
    }

    $info = @getimagesize($file['tmp_name']);
    if (!$info || empty($info['mime'])) {
        jsonResponse(['ok'=>false,'error'=>'Разрешены только изображения'], 400);
    }

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif'
    ];
    if (!isset($allowed[$info['mime']])) {
        jsonResponse(['ok'=>false,'error'=>'Формат не поддерживается'], 400);
    }

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    $name = bin2hex(random_bytes(12)) . '.' . $allowed[$info['mime']];
    $dest = UPLOAD_DIR . '/' . $name;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        jsonResponse(['ok'=>false,'error'=>'Не удалось сохранить файл'], 500);
    }

    jsonResponse(['ok'=>true,'path'=>'uploads/'.$name]);
}

jsonResponse(['ok'=>false,'error'=>'Unknown action'], 404);

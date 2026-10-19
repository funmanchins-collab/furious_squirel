<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

if (adminConfigured()) {
    http_response_code(403);
    exit('Администратор уже настроен. Удалите install.php с сервера.');
}

$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string)($_POST['password'] ?? '');
    $password2 = (string)($_POST['password2'] ?? '');

    if (strlen($password) < 10) {
        $message = 'Пароль должен содержать минимум 10 символов.';
    } elseif ($password !== $password2) {
        $message = 'Пароли не совпадают.';
    } else {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $code = "<?php\n\$ADMIN_PASSWORD_HASH = " . var_export($hash, true) . ";\n";
        if (@file_put_contents(__DIR__ . '/config.local.php', $code, LOCK_EX) === false) {
            $message = 'Не удалось создать config.local.php. Дайте папке права на запись.';
        } else {
            header('Location: /admin/');
            exit;
        }
    }
}
?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Установка админки — Клуб Бешеной Белки</title>
<style>
body{font-family:Arial,sans-serif;background:#f3f1ef;margin:0;min-height:100vh;display:grid;place-items:center}
.card{background:#fff;max-width:420px;width:calc(100% - 32px);padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.12)}
h1{margin:0 0 10px;font-size:24px}
p{color:#666;line-height:1.5}
input{width:100%;padding:13px 14px;margin:6px 0 14px;border:1px solid #ddd;box-sizing:border-box}
button{width:100%;padding:14px;background:#ff6a00;color:#fff;border:0;font-weight:700;cursor:pointer}
.err{color:#b00020;background:#fff0f0;padding:10px;margin-bottom:14px}
small{color:#777}
</style>
</head>
<body>
<form class="card" method="post">
<h1>Установка админки</h1>
<p>Придумайте пароль администратора. После установки удалите <b>install.php</b> с сервера.</p>
<?php if ($message): ?><div class="err"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<label>Пароль</label>
<input type="password" name="password" minlength="10" required>
<label>Повтор пароля</label>
<input type="password" name="password2" minlength="10" required>
<button type="submit">Создать админку</button>
<p><small>Пароль не хранится в открытом виде — сохраняется только хеш.</small></p>
</form>
</body>
</html>

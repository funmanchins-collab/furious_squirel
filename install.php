<?php
declare(strict_types=1);

$localConfig = __DIR__ . '/config.local.php';
$message = '';
$ok = false;

if (is_file($localConfig)) {
    $message = 'Админка уже настроена. Откройте /admin/.';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string)($_POST['password'] ?? '');
    $password2 = (string)($_POST['password2'] ?? '');

    if (strlen($password) < 10) {
        $message = 'Пароль должен содержать минимум 10 символов.';
    } elseif ($password !== $password2) {
        $message = 'Пароли не совпадают.';
    } else {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $code = "<?php\n\$ADMIN_PASSWORD_HASH = " . var_export($hash, true) . ";\n";
        if (@file_put_contents($localConfig, $code, LOCK_EX) === false) {
            $message = 'Не удалось создать config.local.php. Проверьте права папки проекта в MAMP.';
        } else {
            @chmod($localConfig, 0600);
            $ok = true;
            $message = 'Готово. Теперь можно открыть админ-панель.';
        }
    }
}
?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Настройка админки — Клуб Бешеной Белки</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#151515;color:#f6f6f6;font-family:Arial,sans-serif}.card{width:min(460px,calc(100% - 32px));padding:32px;background:#202020;border:1px solid #333;box-shadow:0 24px 80px rgba(0,0,0,.35)}h1{margin:0 0 8px;font-size:28px}p{color:#bbb;line-height:1.55}label{display:block;font-weight:700;margin:18px 0 7px}input{width:100%;padding:13px 14px;background:#111;color:#fff;border:1px solid #444;outline:none}button{width:100%;margin-top:20px;padding:14px;border:0;background:#ff6a00;color:#fff;font-weight:800;cursor:pointer}.msg{margin-top:18px;padding:12px 14px;background:#2d261f;border:1px solid #5a3b20;color:#ffc58d}.ok{color:#a7e8b1;background:#17241a;border-color:#285a33}a{color:#ff9f55}
</style>
</head>
<body>
<form class="card" method="post">
<h1>Админ-панель</h1>
<p>Однократно задайте пароль. Установщик только создаёт <code>config.local.php</code> и не удаляет и не переносит файлы сайта.</p>
<?php if ($message): ?><div class="msg<?= $ok ? ' ok' : '' ?>"><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<?php if (!$ok && !is_file($localConfig)): ?>
<label for="password">Пароль</label>
<input id="password" type="password" name="password" minlength="10" required>
<label for="password2">Повтор пароля</label>
<input id="password2" type="password" name="password2" minlength="10" required>
<button type="submit">Создать доступ</button>
<?php endif; ?>
<?php if ($ok || is_file($localConfig)): ?><p><a href="admin/">Открыть админ-панель →</a></p><?php endif; ?>
</form>
</body>
</html>

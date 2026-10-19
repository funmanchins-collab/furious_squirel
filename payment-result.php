<?php
declare(strict_types=1);
$id = trim((string)($_GET['paymentLinkId'] ?? ''));
$validId = preg_match('/^BELKA-[A-F0-9]{20}$/', $id) === 1;
?><!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Статус оплаты — Бешеная Белка</title>
<style>
:root{color-scheme:dark;--accent:#ff6a00;--panel:#181818;--text:#f7f7f7;--muted:#bcbcbc}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top right,#302015 0,transparent 42%),#101010;color:var(--text);font-family:Arial,sans-serif}.card{width:min(540px,100%);padding:34px;border:1px solid #343434;border-top:4px solid var(--accent);background:var(--panel);box-shadow:0 20px 70px #0008}.logo{font-weight:900;font-size:13px;letter-spacing:2px;color:var(--accent);text-transform:uppercase}.mark{margin:26px 0 14px;width:54px;height:54px;display:grid;place-items:center;border:1px solid #454545;border-radius:50%;font-size:25px;color:var(--accent)}h1{font-size:clamp(25px,5vw,34px);margin:0 0 12px}p{color:var(--muted);line-height:1.6}.status{margin:24px 0;padding:15px 16px;border:1px solid #414141;background:#202020;line-height:1.5}.status strong{color:#fff}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}a,button{display:inline-flex;align-items:center;justify-content:center;padding:13px 17px;border:0;background:var(--accent);color:#fff;font-weight:700;text-decoration:none;cursor:pointer}a.secondary,button.secondary{background:transparent;border:1px solid #555;color:#eee}.small{font-size:12px;color:#999}.hidden{display:none}@media(max-width:480px){.card{padding:24px}.actions>*{width:100%}}
</style>
</head>
<body>
<main class="card">
<div class="logo">Клуб «Бешеная Белка»</div>
<div class="mark" id="statusMark">…</div>
<h1 id="statusTitle">Проверяем оплату</h1>
<p id="statusDescription">Не закрывайте страницу сразу после возвращения из банка. Мы ждём подтверждение от платёжной системы.</p>
<div class="status" id="statusBox" role="status" aria-live="polite"><?php if ($validId): ?>Проверяем статус платежа…<?php else: ?>Не найден идентификатор платежа. Если вы оплатили покупку, свяжитесь с клубом и сообщите время и сумму платежа.<?php endif; ?></div>
<div class="actions">
<button type="button" id="checkAgain" class="secondary<?= $validId ? '' : ' hidden' ?>">Проверить статус</button>
<a href="index.html#services">Вернуться на сайт</a>
</div>
<p class="small">Для безопасности статус определяется по подтверждению сервера, а не по параметрам в адресной строке.</p>
</main>
<?php if ($validId): ?>
<script>
(() => {
 const id = <?= json_encode($id, JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT) ?>;
 const title = document.getElementById('statusTitle');
 const description = document.getElementById('statusDescription');
 const box = document.getElementById('statusBox');
 const mark = document.getElementById('statusMark');
 const check = document.getElementById('checkAgain');
 let stopped = false;
 async function checkStatus() {
   if (stopped) return;
   check.disabled = true; check.textContent = 'Проверяем…';
   try {
     const response = await fetch('payments.php?action=status&paymentLinkId=' + encodeURIComponent(id), {cache:'no-store'});
     const payload = await response.json();
     if (!response.ok || !payload.ok) throw new Error(payload.error || 'Статус пока недоступен');
     if (payload.status === 'paid') {
       title.textContent = 'Оплата подтверждена'; mark.textContent = '✓';
       description.textContent = 'Платёж успешно подтверждён. Сохраните эту страницу до завершения записи на занятие.';
       box.textContent = (payload.title || 'Услуга') + ' — ' + Number(payload.amount || 0).toLocaleString('ru-RU') + ' ₽. Статус: оплачено.';
       stopped = true; check.classList.add('hidden'); return;
     }
     title.textContent = 'Ожидаем подтверждение'; mark.textContent = '…';
     box.textContent = 'Платёж ещё не отмечен как завершённый. Обычно статус обновляется автоматически после уведомления банка.';
   } catch (error) {
     box.textContent = 'Пока не удалось получить статус. Нажмите «Проверить статус» ещё раз чуть позже.';
   } finally {
     check.disabled = false; check.textContent = 'Проверить статус';
   }
 }
 check.addEventListener('click', checkStatus);
 checkStatus();
 let attempts = 0;
 const timer = setInterval(() => { attempts++; if (stopped || attempts >= 30) { clearInterval(timer); if (!stopped) description.textContent = 'Статус не пришёл автоматически. Нажмите «Проверить статус» или свяжитесь с клубом; повторно оплачивать услугу не нужно, пока не проверен первый платёж.'; return; } checkStatus(); }, 4000);
})();
</script>
<?php endif; ?>
</body>
</html>

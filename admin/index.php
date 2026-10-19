<?php declare(strict_types=1); ?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Админ-панель — Клуб Бешеной Белки</title>
<link rel="stylesheet" href="admin.css">
</head>
<body>
<div id="app">
  <section id="loginView" class="login-card">
    <div class="brand">КЛУБ БЕШЕНОЙ БЕЛКИ</div>
    <h1>Админ-панель</h1>
    <p>Управление сайтом и шестью альбомами галереи.</p>
    <div id="setupHint" class="hint hidden"></div>
    <form id="loginForm">
      <label for="loginPassword">Пароль администратора</label>
      <input id="loginPassword" type="password" autocomplete="current-password" required>
      <button class="btn btn-primary" type="submit">Войти</button>
      <div id="loginError" class="error"></div>
    </form>
    <a class="back-site" href="../">← Вернуться на сайт</a>
  </section>
  <div id="adminView" class="admin-layout hidden">
    <aside class="admin-sidebar">
      <div><div class="brand small">БЕШЕНАЯ БЕЛКА</div><div class="sidebar-sub">CMS</div></div>
      <nav id="tabs">
        <button data-tab="hero">Главная</button>
        <button data-tab="trainers">Тренеры</button>
        <button data-tab="services">Услуги</button>
        <button data-tab="schedule">Расписание</button>
        <button data-tab="gallery" class="active">Галерея</button>
        <button data-tab="events">Мероприятия</button>
        <button data-tab="contacts">Контакты</button>
        <button data-tab="texts">Все тексты</button>
        <button data-tab="media">Все фотографии</button>
      </nav>
      <button id="logoutBtn" class="btn btn-dark">Выйти</button>
    </aside>
    <main class="admin-main">
      <header class="topbar">
        <div><h1 id="tabTitle">Галерея</h1><p id="tabSubtitle">Управляйте всем содержимым сайта в одном месте.</p></div>
        <div class="actions"><a class="btn btn-light" href="../" target="_blank" rel="noopener">Открыть сайт</a><button id="saveBtn" class="btn btn-primary">Сохранить</button><button class="theme-toggle" id="themeToggle" type="button" aria-label="Переключить тему">
            <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="20" y2="12"/><line x1="5.6" y1="5.6" x2="4.2" y2="4.2"/><line x1="19.8" y1="19.8" x2="18.4" y2="18.4"/><line x1="5.6" y1="18.4" x2="4.2" y2="19.8"/><line x1="19.8" y1="4.2" x2="18.4" y2="5.6"/></svg>
            <svg class="icon-moon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <span class="knob"></span>
        </button></div>
      </header>
      <div id="saveStatus" class="status"></div>
      <div id="editor"></div>
    </main>
  </div>
</div>
<script src="admin.js"></script>
</body>
</html>

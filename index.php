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
    <p>Редактирование сайта без изменения HTML-кода.</p>
    <form id="loginForm">
      <label>Пароль администратора</label>
      <input id="loginPassword" type="password" autocomplete="current-password" required>
      <button class="btn btn-primary" type="submit">Войти</button>
      <div id="loginError" class="error"></div>
    </form>
  </section>

  <div id="adminView" class="admin-layout hidden">
    <aside class="admin-sidebar">
      <div>
        <div class="brand small">БЕШЕНАЯ БЕЛКА</div>
        <div class="sidebar-sub">CMS</div>
      </div>
      <nav id="tabs">
        <button data-tab="hero">Главная</button>
        <button data-tab="trainers">Тренеры</button>
        <button data-tab="services">Услуги</button>
        <button data-tab="schedule">Расписание</button>
        <button data-tab="gallery">Галерея</button>
        <button data-tab="events">Мероприятия</button>
        <button data-tab="contacts">Контакты</button>
      </nav>
      <button id="logoutBtn" class="btn btn-dark">Выйти</button>
    </aside>

    <main class="admin-main">
      <header class="topbar">
        <div>
          <h1 id="tabTitle">Главная</h1>
          <p>Изменения сохраняются в один клик.</p>
        </div>
        <div class="actions">
          <a class="btn btn-light" href="../" target="_blank">Открыть сайт</a>
          <button id="saveBtn" class="btn btn-primary">Сохранить</button>
        </div>
      </header>
      <div id="saveStatus" class="status"></div>
      <div id="editor"></div>
    </main>
  </div>
</div>
<script src="admin.js"></script>
</body>
</html>

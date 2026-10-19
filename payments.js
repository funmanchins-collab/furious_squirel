/* Оплата тарифов клуба «Бешеная Белка». Сумма и tariffId повторно проверяются PHP на сервере. */
(() => {
    const modal = document.getElementById('paymentModal');
    const titleNode = document.getElementById('paymentModalTitle');
    const listNode = document.getElementById('paymentTariffList');
    const noticeNode = document.getElementById('paymentModalNotice');
    const closeButton = document.getElementById('paymentModalClose');
    if (!modal || !listNode) return;

    let tariffs = [];
    let activeService = 'individual';
    let loaded = false;
    let needsCustomerInfo = false;

    const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const money = value => Number(value || 0).toLocaleString('ru-RU') + ' ₽';

    async function loadTariffs() {
        if (loaded) return;
        listNode.innerHTML = '<p class="payment-loading">Загружаем тарифы…</p>';
        try {
            const response = await fetch('payments.php?action=tariffs', {cache:'no-store'});
            const payload = await response.json();
            if (!response.ok || !payload.ok || !Array.isArray(payload.tariffs)) throw new Error(payload.error || 'Не удалось загрузить тарифы');
            tariffs = payload.tariffs;
            needsCustomerInfo = payload.needsCustomerInfo === true;
            const customerForm = document.getElementById('paymentCustomerInfo');
            if (customerForm) customerForm.hidden = !needsCustomerInfo;
            ['paymentCustomerName','paymentCustomerEmail'].forEach(id => { const field = document.getElementById(id); if (field) field.required = needsCustomerInfo; });
            loaded = true;
            renderTariffs();
        } catch (error) {
            listNode.innerHTML = '<p class="payment-error">Не удалось загрузить тарифы. Обновите страницу и попробуйте ещё раз.</p>';
        }
    }

    function renderTariffs() {
        const visible = tariffs.filter(item => item.service === activeService);
        if (!visible.length) {
            listNode.innerHTML = '<p class="payment-error">Для этой услуги пока нет доступных тарифов.</p>';
            return;
        }
        const groups = new Map();
        visible.forEach(item => {
            if (!groups.has(item.trainer)) groups.set(item.trainer, []);
            groups.get(item.trainer).push(item);
        });
        listNode.innerHTML = [...groups.entries()].map(([trainer, items]) => `
            <section class="payment-tariff-group">
                <h3>${esc(trainer)}</h3>
                <div class="payment-tariff-rows">
                    ${items.map(item => `
                        <div class="payment-tariff-row">
                            <div class="payment-tariff-copy">
                                <strong>${esc(item.title)}</strong>
                                <span>${esc(trainer)}</span>
                            </div>
                            <div class="payment-tariff-action">
                                <b>${money(item.amount)}</b>
                                <button type="button" class="payment-pay-button" data-payment-tariff="${esc(item.id)}">Оплатить</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `).join('');
        listNode.querySelectorAll('[data-payment-tariff]').forEach(button => {
            button.addEventListener('click', () => createPayment(button.dataset.paymentTariff, button));
        });
    }

    function openModal(service) {
        activeService = service === 'group' ? 'group' : 'individual';
        if (titleNode) titleNode.textContent = activeService === 'group' ? 'Групповые занятия' : 'Индивидуальные занятия';
        if (noticeNode) noticeNode.textContent = 'Выберите тариф. На следующем шаге откроется страница оплаты.';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (loaded) renderTariffs(); else loadTariffs();
    }

    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    async function createPayment(tariffId, button) {
        if (!tariffId || button.disabled) return;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Готовим оплату…';
        if (noticeNode) noticeNode.textContent = 'Создаём платёжную ссылку. Не нажимайте кнопку повторно.';
        try {
            const customer = {
                name: document.getElementById('paymentCustomerName')?.value.trim() || '',
                email: document.getElementById('paymentCustomerEmail')?.value.trim() || '',
                phone: document.getElementById('paymentCustomerPhone')?.value.trim() || ''
            };
            if (needsCustomerInfo && (!customer.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))) {
                throw new Error('Для оформления электронного чека укажите имя и корректный email.');
            }
            const response = await fetch('payments.php?action=create', {
                method: 'POST',
                headers: {'Content-Type':'application/json', 'Accept':'application/json'},
                body: JSON.stringify({tariffId, customer})
            });
            const payload = await response.json();
            if (!response.ok || !payload.ok || !payload.paymentUrl) throw new Error(payload.error || 'Не удалось создать оплату');
            // URL приходит либо от сервера Точки, либо является конкретной старой ссылкой из PDF.
            const url = new URL(payload.paymentUrl, window.location.href);
            if (url.protocol !== 'https:') throw new Error('Платёжная ссылка должна использовать HTTPS.');
            window.location.assign(url.href);
        } catch (error) {
            if (noticeNode) noticeNode.textContent = error.message || 'Возникла ошибка. Попробуйте ещё раз.';
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    document.addEventListener('click', event => {
        const opener = event.target.closest('[data-payment-service]');
        if (opener) {
            event.preventDefault();
            openModal(opener.dataset.paymentService);
            return;
        }
        if (event.target.closest('[data-payment-close]')) closeModal();
    });
    closeButton?.addEventListener('click', closeModal);
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
})();

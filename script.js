// ==================== ТЕМА ====================
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

const savedTheme = localStorage.getItem('belka-theme');

if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');

        localStorage.setItem(
            'belka-theme',
            body.classList.contains('dark-theme') ? 'dark' : 'light'
        );
    });
}


// ==================== САЙДБАР ====================
const sidebar = document.getElementById('sidebar');

const isHoverDevice = window.matchMedia('(hover: hover)').matches;

if (sidebar && !isHoverDevice) {
    sidebar.addEventListener('click', (e) => {
        if (e.target.closest('a') === null) {
            sidebar.classList.toggle('open');
        }
    });
}

document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', () => {
        if (!isHoverDevice && sidebar) {
            sidebar.classList.remove('open');
        }
    });
});

const navLinks = document.querySelectorAll('.sidebar a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

window.addEventListener('DOMContentLoaded', () => {
    navLinks.forEach(l => l.classList.remove('active'));

    const firstLink = document.querySelector(
        '.sidebar a[href="#hero"]'
    );

    if (firstLink) {
        firstLink.classList.add('active');
    }
});


// ==================== МОДАЛЬНОЕ ОКНО ЗАПИСИ ====================
const bookingModal = document.getElementById('bookingModal');
const openBookingBtn = document.getElementById('openBookingModal');
const openBookingBtn2 = document.getElementById('openBookingModal2');
const bookingModalOverlay = document.getElementById('bookingModalOverlay');

function openBooking() {
    if (!bookingModal) return;

    bookingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBooking() {
    if (!bookingModal) return;

    bookingModal.classList.remove('active');
    document.body.style.overflow = '';
}

openBookingBtn?.addEventListener('click', openBooking);
openBookingBtn2?.addEventListener('click', openBooking);
bookingModalOverlay?.addEventListener('click', closeBooking);


// ==================== МОДАЛЬНОЕ ОКНО КАРТЫ ====================
const mapModal = document.getElementById('mapModal');
const openMapBtn = document.getElementById('openMapModal');
const mapModalOverlay = document.getElementById('mapModalOverlay');

function openMap() {
    if (!mapModal) return;

    mapModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMap() {
    if (!mapModal) return;

    mapModal.classList.remove('active');
    document.body.style.overflow = '';
}

openMapBtn?.addEventListener('click', openMap);
mapModalOverlay?.addEventListener('click', closeMap);


// ==================== МОДАЛЬНОЕ ОКНО ПРАЙСА ====================
const priceModal = document.getElementById('priceModal');
const openPriceBtn = document.getElementById('openPriceModal');
const priceModalOverlay = document.getElementById('priceModalOverlay');
const priceModalClose = document.getElementById('priceModalClose');

function openPrice() {
    if (!priceModal) return;

    priceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePrice() {
    if (!priceModal) return;

    priceModal.classList.remove('active');
    document.body.style.overflow = '';
}

openPriceBtn?.addEventListener('click', openPrice);
priceModalOverlay?.addEventListener('click', closePrice);
priceModalClose?.addEventListener('click', closePrice);


// ==================== CALL TOAST ====================
const callToast = document.getElementById('callToast');
const callToastPhone = document.getElementById('callToastPhone');
const callToastCopy = document.getElementById('callToastCopy');

function isMobileDevice() {
    return (
        window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
            navigator.userAgent
        )
    );
}

let toastTimer;

function showCallToast(phoneNumber) {
    if (!callToast || !callToastPhone) return;

    callToastPhone.textContent = phoneNumber;
    callToast.classList.add('active');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        callToast.classList.remove('active');
    }, 8000);
}

function hideCallToast() {
    callToast?.classList.remove('active');
    clearTimeout(toastTimer);
}

function bindPhoneLinks() {
    document.querySelectorAll('.phone-link').forEach(link => {
        link.addEventListener('click', (e) => {

            if (bookingModal?.classList.contains('active')) {
                closeBooking();
            }

            if (!isMobileDevice()) {
                e.preventDefault();

                const phone =
                    link.dataset.phone ||
                    link.querySelector('.value')?.textContent?.trim() ||
                    '';

                showCallToast(phone);
            }
        });
    });
}

bindPhoneLinks();

callToastCopy?.addEventListener('click', async (e) => {
    e.stopPropagation();

    const phone = callToastPhone?.textContent || '';

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard.writeText(phone);

        } else {

            const ta = document.createElement('textarea');

            ta.value = phone;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';

            document.body.appendChild(ta);

            ta.select();

            document.execCommand('copy');

            ta.remove();
        }

        const originalText = callToastCopy.textContent;

        callToastCopy.textContent = '✓ Скопировано';

        setTimeout(() => {
            callToastCopy.textContent = originalText;
        }, 2000);

    } catch (err) {
        console.error(err);
    }
});

document.addEventListener('click', (e) => {

    if (!callToast?.classList.contains('active')) {
        return;
    }

    if (
        e.target.closest('.call-toast') ||
        e.target.closest('.phone-link')
    ) {
        return;
    }

    hideCallToast();
});


// ==================== ГАЛЕРЕЯ / ALBUM ====================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

const galleryGrid = document.getElementById('galleryGrid');

const galleryAlbum = document.getElementById('galleryAlbum');
const galleryAlbumWindow =
    document.getElementById('galleryAlbumWindow');

const galleryAlbumBackdrop =
    document.getElementById('galleryAlbumBackdrop');

const galleryAlbumGrid =
    document.getElementById('galleryAlbumGrid');

const galleryAlbumClose =
    document.getElementById('galleryAlbumClose');

const galleryAlbumCount =
    document.getElementById('galleryAlbumCount');

let galleryAlbumOpen = false;
let galleryAlbumOrigin = null;
let galleryEventsBound = false;


// ==================== ПОЛУЧЕНИЕ ФОТО ====================
function getGallerySources() {

    return [...document.querySelectorAll(
        '#galleryGrid .gallery-item img'
    )]
        .map(img => ({
            src: img.currentSrc || img.src,
            alt: img.alt || 'Фото клуба'
        }))
        .filter(item => item.src);
}


// ==================== ЦЕНТР ЯЧЕЙКИ ====================
function getCellCenter(item) {

    const rect = item.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
    };
}


// ==================== ПОДГОТОВКА MACOS-АНИМАЦИИ ====================
function prepareAlbumOrigin(item) {

    if (!galleryAlbumWindow || !item) {
        return;
    }

    const tile = getCellCenter(item);

    const win =
        galleryAlbumWindow.getBoundingClientRect();

    if (!win.width || !win.height) {
        return;
    }

    const winCenterX =
        win.left + win.width / 2;

    const winCenterY =
        win.top + win.height / 2;

    const scaleX =
        tile.width / win.width;

    const scaleY =
        tile.height / win.height;

    const scale =
        Math.max(
            0.13,
            Math.min(
                0.32,
                Math.min(scaleX, scaleY)
            )
        );

    galleryAlbumOrigin = {
        x: tile.x - winCenterX,
        y: tile.y - winCenterY,
        scale
    };

    galleryAlbumWindow.style.setProperty(
        '--album-start-x',
        `${galleryAlbumOrigin.x}px`
    );

    galleryAlbumWindow.style.setProperty(
        '--album-start-y',
        `${galleryAlbumOrigin.y}px`
    );

    galleryAlbumWindow.style.setProperty(
        '--album-start-scale',
        String(galleryAlbumOrigin.scale)
    );
}


// ==================== СОЗДАНИЕ АЛЬБОМА ====================
function renderAlbum() {

    if (!galleryAlbumGrid) {
        return;
    }

    const sources = getGallerySources();

    galleryAlbumGrid.innerHTML = sources
        .map((photo, index) => `
            <button
                class="gallery-album__photo"
                type="button"
                data-gallery-index="${index}"
                aria-label="Открыть фото ${index + 1}"
            >
                <img
                    src="${escapeHtml(photo.src)}"
                    alt="${escapeHtml(photo.alt)}"
                    loading="lazy"
                >
            </button>
        `)
        .join('');

    if (galleryAlbumCount) {

        const count = sources.length;

        const suffix =
            count === 1
                ? 'фото'
                : count >= 2 && count <= 4
                    ? 'фото'
                    : 'фотографий';

        galleryAlbumCount.textContent =
            `${count} ${suffix}`;
    }
}


// ==================== ОТКРЫТИЕ АЛЬБОМА ====================
function openGalleryAlbum(item) {

    if (!galleryAlbum || !galleryAlbumWindow) {
        return;
    }

    renderAlbum();

    galleryAlbum.classList.remove(
        'is-closing'
    );

    galleryAlbum.setAttribute(
        'aria-hidden',
        'false'
    );

    /*
     * Сначала оставляем окно доступным для расчёта
     * его реального положения.
     */
    prepareAlbumOrigin(item);

    /*
     * Два requestAnimationFrame нужны,
     * чтобы браузер успел применить
     * исходное состояние перед началом
     * анимации раскрытия.
     */
    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            galleryAlbum.classList.add('active');

            document.body.style.overflow = 'hidden';

            galleryAlbumOpen = true;

            galleryAlbumClose?.focus({
                preventScroll: true
            });
        });

    });
}


// ==================== ЗАВЕРШЕНИЕ ЗАКРЫТИЯ АЛЬБОМА ====================
function finishCloseGalleryAlbum() {

    if (!galleryAlbum) {
        return;
    }

    galleryAlbum.classList.remove(
        'active',
        'is-closing'
    );

    galleryAlbum.setAttribute(
        'aria-hidden',
        'true'
    );

    galleryAlbumOpen = false;
    galleryAlbumOrigin = null;

    if (
        !lightbox?.classList.contains('active')
    ) {
        document.body.style.overflow = '';
    }
}


// ==================== МГНОВЕННОЕ ЗАКРЫТИЕ АЛЬБОМА ====================
function closeGalleryAlbumImmediate() {

    if (!galleryAlbum) {
        return;
    }

    galleryAlbum.classList.remove(
        'active',
        'is-closing'
    );

    galleryAlbum.setAttribute(
        'aria-hidden',
        'true'
    );

    galleryAlbumOpen = false;
    galleryAlbumOrigin = null;
}


// ==================== ЗАКРЫТИЕ АЛЬБОМА (плавно) ====================
function closeGalleryAlbum() {

    if (
        !galleryAlbum ||
        !galleryAlbumOpen
    ) {
        return;
    }

    galleryAlbum.classList.add(
        'is-closing'
    );

    galleryAlbum.classList.remove(
        'active'
    );

    window.setTimeout(
        finishCloseGalleryAlbum,
        720
    );
}


// ==================== ОТКРЫТИЕ LIGHTBOX ====================
function openLightboxFromAlbum(img) {

    if (
        !lightbox ||
        !lightboxImg ||
        !img
    ) {
        return;
    }

    /*
     * Сначала мгновенно убираем альбом,
     * чтобы поверх остался только лайтбокс с одним фото.
     */
    closeGalleryAlbumImmediate();

    lightboxImg.src =
        img.currentSrc || img.src;

    lightboxImg.alt =
        img.alt || 'Просмотр фото';

    lightbox.classList.add('active');

    document.body.style.overflow = 'hidden';
}


// ==================== ЗАКРЫТИЕ LIGHTBOX ====================
function closeLightbox() {

    lightbox?.classList.remove(
        'active'
    );

    /*
     * Альбом уже закрыт — возвращаем скролл странице.
     */
    document.body.style.overflow = '';
}


// ==================== ПРИВЯЗКА ГАЛЕРЕИ ====================
function bindGallery() {

    if (
        galleryEventsBound ||
        !galleryGrid
    ) {
        return;
    }

    galleryEventsBound = true;


    // Клик по ячейке галереи
    galleryGrid.addEventListener(
        'click',
        (event) => {

            const item =
                event.target.closest(
                    '.gallery-item'
                );

            if (!item) {
                return;
            }

            event.preventDefault();

            openGalleryAlbum(item);
        }
    );


    // Клик по фотографии внутри альбома
    galleryAlbumGrid?.addEventListener(
        'click',
        (event) => {

            const photo =
                event.target.closest(
                    '.gallery-album__photo'
                );

            if (!photo) {
                return;
            }

            const img =
                photo.querySelector('img');

            openLightboxFromAlbum(img);
        }
    );
}

bindGallery();

galleryAlbumBackdrop?.addEventListener(
    'click',
    closeGalleryAlbum
);

galleryAlbumClose?.addEventListener(
    'click',
    closeGalleryAlbum
);

lightbox?.addEventListener(
    'click',
    (event) => {

        if (
            event.target === lightbox ||
            event.target === lightboxImg
        ) {
            closeLightbox();
        }
    }
);


// ==================== EXCEL ====================
const downloadScheduleBtn =
    document.getElementById('downloadSchedule');

if (downloadScheduleBtn) {

    downloadScheduleBtn.addEventListener('click', () => {

        const trainerBlocks =
            document.querySelectorAll('.schedule-trainer');

        if (!trainerBlocks.length) {
            alert('Расписание не найдено');
            return;
        }

        const wb = XLSX.utils.book_new();

        trainerBlocks.forEach(block => {

            const coachName =
                block.querySelector('.schedule-trainer__name')
                    ?.textContent.trim() || 'Тренер';

            const table =
                block.querySelector('.schedule-table');

            if (!table) return;

            const rows = [['День', 'Время', 'Группа']];
            let currentDay = '';

            table.querySelectorAll('tbody tr').forEach(tr => {

                const dayCell = tr.querySelector('.day');
                const timeCell = tr.querySelector('.time');
                const groupCell = tr.querySelector('.group-tag');

                if (dayCell) {
                    currentDay = dayCell.textContent.trim();
                }

                rows.push([
                    currentDay,
                    timeCell?.textContent.trim() || '',
                    groupCell?.textContent.trim() || ''
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(rows);

            ws['!cols'] = [
                { wch: 10 },
                { wch: 18 },
                { wch: 28 }
            ];

            // Имя листа не более 31 символа (ограничение Excel)
            const sheetName =
                coachName.substring(0, 31) || 'Лист';

            XLSX.utils.book_append_sheet(
                wb,
                ws,
                sheetName
            );
        });

        const today = new Date();

        const dateStr =
            `${today.getFullYear()}-${String(
                today.getMonth() + 1
            ).padStart(2, '0')}-${String(
                today.getDate()
            ).padStart(2, '0')}`;

        XLSX.writeFile(
            wb,
            `Расписание_Бешеная_Белка_${dateStr}.xlsx`
        );
    });
}


// ==================== КЛАВИАТУРА ====================
document.addEventListener(
    'keydown',
    (e) => {

        if (e.key !== 'Escape') {
            return;
        }


        // Lightbox
        if (
            lightbox?.classList.contains(
                'active'
            )
        ) {
            closeLightbox();
            return;
        }


        // Gallery album
        if (
            galleryAlbum?.classList.contains(
                'active'
            )
        ) {
            closeGalleryAlbum();
            return;
        }


        // Booking
        if (
            bookingModal?.classList.contains(
                'active'
            )
        ) {
            closeBooking();
            return;
        }


        // Map
        if (
            mapModal?.classList.contains(
                'active'
            )
        ) {
            closeMap();
            return;
        }


        // Price
        if (
            priceModal?.classList.contains(
                'active'
            )
        ) {
            closePrice();
            return;
        }


        // Phone toast
        if (
            callToast?.classList.contains(
                'active'
            )
        ) {
            hideCallToast();
        }
    }
);


// ==================== CMS / ЗАГРУЗКА ДАННЫХ ====================
async function loadSiteContent() {

    try {

        const r = await fetch(
            'api.php?action=public',
            {
                cache: 'no-store'
            }
        );

        const payload = await r.json();

        if (!payload.ok) {
            return;
        }

        const d =
            payload.data || {};


        // ==================== HERO ====================
        const h =
            d.hero || {};

        const titleWords =
            document.querySelectorAll(
                '.hero-title span'
            );

        if (titleWords[0]) {
            titleWords[0].textContent =
                h.titleOrange1 ||
                titleWords[0].textContent;
        }

        if (titleWords[1]) {
            titleWords[1].textContent =
                h.titleOrange2 ||
                titleWords[1].textContent;
        }

        if (titleWords[2]) {
            titleWords[2].textContent =
                h.titleWhite ||
                titleWords[2].textContent;
        }


        const subtitle =
            document.querySelector(
                '.hero-subtitle'
            );

        if (subtitle) {

            subtitle.childNodes.forEach(
                n => {

                    if (
                        n.nodeType === 3
                    ) {
                        n.textContent =
                            h.subtitle + ' ';
                    }
                }
            );
        }


        // Кнопки
        document
            .querySelectorAll(
                '#openBookingModal,#openBookingModal2'
            )
            .forEach(btn => {

                const text =
                    Array.from(
                        btn.childNodes
                    ).find(
                        n =>
                            n.nodeType === 3
                    );

                if (text) {

                    text.textContent =
                        '\n                    ' +
                        (
                            h.cta ||
                            'Записаться на тренировку'
                        ) +
                        '\n                    ';
                }
            });


        // Теги
        const tags =
            document.querySelectorAll(
                '.hero-tagline span:not(.divider)'
            );

        (h.tagline || [])
            .forEach((t, i) => {

                if (tags[i]) {
                    tags[i].textContent = t;
                }
            });


        // ==================== TRAINERS ====================
        const tg =
            document.querySelector(
                '.trainers-grid'
            );

        if (
            tg &&
            Array.isArray(d.trainers)
        ) {

            tg.innerHTML =
                d.trainers
                    .map(t => `
                        <div class="trainer-card ${t.senior ? 'senior' : ''}">
                            
                            <div class="trainer-photo">
                                ${
                                    t.image
                                        ? `
                                            <img
                                                src="${escapeHtml(t.image)}"
                                                alt="${escapeHtml(t.name || '')}"
                                            >
                                        `
                                        : escapeHtml(
                                            t.photo || ''
                                        )
                                }
                            </div>

                            <div class="trainer-name">
                                ${escapeHtml(
                                    t.name || ''
                                )}
                            </div>

                            <div class="trainer-spec">
                                ${escapeHtml(
                                    t.spec || ''
                                )}
                            </div>

                            <p class="trainer-desc">
                                ${escapeHtml(
                                    t.desc || ''
                                )}
                            </p>

                        </div>
                    `)
                    .join('');
        }


        // ==================== SERVICES ====================
        const sg =
            document.querySelector(
                '.services-grid'
            );

        if (
            sg &&
            Array.isArray(d.services)
        ) {

            sg.innerHTML =
                d.services
                    .map((s, i) => `
                        <div class="service-card">

                            <span class="service-icon">
                                ${escapeHtml(
                                    s.icon || ''
                                )}
                            </span>

                            <div class="service-title">
                                ${escapeHtml(
                                    s.title || ''
                                )}
                            </div>

                            <p class="service-intro">
                                ${escapeHtml(
                                    s.intro || ''
                                )}
                            </p>

                            <ul class="service-features">
                                ${
                                    (s.features || [])
                                        .map(
                                            x => `
                                                <li>
                                                    ${escapeHtml(x)}
                                                </li>
                                            `
                                        )
                                        .join('')
                                }
                            </ul>

                            <div class="service-price">
                                ${escapeHtml(
                                    s.price || ''
                                )}
                            </div>

                            <button class="service-link" type="button" data-payment-service="${i === 0 ? 'individual' : 'group'}">
                                Выбрать тариф
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>
                            <button class="service-booking-link" type="button" data-yclients-open>Записаться</button>

                        </div>
                    `)
                    .join('');
        }


        // ==================== SCHEDULE ====================
        // ВАЖНО: расписание НЕ рендерим здесь. Старый CMS-слой раньше
        // записывал весь массив d.schedule в первый tbody, из-за чего
        // у Фёдора на короткое время появлялось расписание всех тренеров.
        // Единственный renderer расписания находится ниже в этом файле.
        // Это исключает промежуточное смешивание блоков и задержку до
        // следующей перерисовки.


        // ==================== GALLERY ====================
        const gg =
            document.querySelector(
                '.gallery-grid'
            );

        if (
            gg &&
            Array.isArray(d.gallery)
        ) {

            gg.innerHTML =
                d.gallery
                    .map(x => `
                        <button
                            class="gallery-item"
                            type="button"
                            aria-label="Открыть альбом: ${escapeHtml(x.alt || '')}"
                        >
                            <img
                                src="${escapeHtml(
                                    x.src
                                )}"
                                alt="${escapeHtml(
                                    x.alt || ''
                                )}"
                                loading="lazy"
                            >
                        </button>
                    `)
                    .join('');

            bindGallery();
        }


        // ==================== EVENTS ====================
        const eg =
            document.querySelector(
                '.events-grid'
            );

        if (
            eg &&
            Array.isArray(d.events)
        ) {

            eg.innerHTML =
                d.events
                    .map(e => `
                        <div class="event-card">

                            <div class="event-date">

                                <span class="day">
                                    ${escapeHtml(
                                        e.day
                                    )}
                                </span>

                                <span class="month">
                                    ${escapeHtml(
                                        e.month
                                    )}
                                </span>

                                <span class="year">
                                    ${escapeHtml(
                                        e.year
                                    )}
                                </span>

                            </div>


                            <div class="event-content">

                                <span
                                    class="event-badge ${
                                        e.badgeType === 'soon'
                                            ? 'soon'
                                            : ''
                                    }"
                                >
                                    ${escapeHtml(
                                        e.badge
                                    )}
                                </span>

                                <h3 class="event-title">
                                    ${escapeHtml(
                                        e.title
                                    )}
                                </h3>

                                <div class="event-meta">

                                    <span>
                                        ${escapeHtml((d.static?.events?.locationPrefix ?? '📍 '))}
                                        ${escapeHtml(e.place)}
                                    </span>

                                    <span>
                                        ${escapeHtml((d.static?.events?.timePrefix ?? '🕐 '))}
                                        ${escapeHtml(e.time)}
                                    </span>

                                </div>

                                <p class="event-desc">
                                    ${escapeHtml(
                                        e.desc
                                    )}
                                </p>

                            </div>

                        </div>
                    `)
                    .join('');
        }


        // ==================== CONTACTS ====================
        const c =
            d.contacts || {};


        // Телефон
        document
            .querySelectorAll(
                '.phone-link'
            )
            .forEach(a => {

                a.href =
                    'tel:' +
                    (c.phoneTel || '');

                a.dataset.phone =
                    c.phone || '';

                const v =
                    a.querySelector(
                        '.value'
                    );

                if (v) {
                    v.textContent =
                        c.phone || '';
                }
            });


        // Адрес
        const addrBtn =
            document.getElementById(
                'openMapModal'
            );

        if (addrBtn) {

            const v =
                addrBtn.querySelector(
                    '.value'
                );

            if (v) {

                v.innerHTML =
                    escapeHtml(
                        c.address || ''
                    ) +
                    '<br>' +
                    escapeHtml(
                        c.venue || ''
                    );
            }
        }


        // VK
        const vkLinks = [
            ...document.querySelectorAll(
                'a[href*="vk.ru/ffurious_squirrel_club"],a[href*="vk.me/ffurious_squirrel_club"]'
            )
        ];

        vkLinks.forEach(a => {

            if (
                a.href.includes(
                    'vk.me'
                )
            ) {

                a.href =
                    'https://vk.me/ffurious_squirrel_club';

            } else {

                a.href =
                    c.vk || a.href;
            }

            const v =
                a.querySelector(
                    '.value'
                );

            if (v) {

                v.textContent =
                    c.vkName || '';
            }
        });


        // Адрес в map modal
        const mapModalAddress =
            document.querySelector(
                '.map-modal__address'
            );

        if (mapModalAddress) {

            mapModalAddress.textContent =
                `${c.address || ''}, ${c.venue || ''}`;
        }


        // Yandex Map iframe
        const mapIframe =
            document.querySelector(
                '.map-modal__frame iframe'
            );

        if (
            mapIframe &&
            c.mapText
        ) {

            mapIframe.src =
                'https://yandex.ru/map-widget/v1/?text=' +
                encodeURIComponent(
                    c.mapText
                ) +
                '&z=17';
        }


        // Кнопка открытия карты
        const mapOpen =
            document.querySelector(
                '.map-open-btn'
            );

        if (mapOpen) {

            mapOpen.href =
                'https://yandex.ru/maps/?text=' +
                encodeURIComponent(
                    c.mapText || ''
                );
        }


        // ==================== FOOTER ====================
        const footer =
            document.querySelector(
                'footer'
            );

        if (footer) {

            footer.childNodes[0].textContent =
                (d.footer || '') +
                '\n            ';
        }


        if (window.applyFullCms) window.applyFullCms(d);

    } catch (err) {

        console.warn(
            'CMS data not loaded:',
            err
        );
    }
}


// ==================== ЭКРАНИРОВАНИЕ HTML ====================
function escapeHtml(value = '') {

    return String(value).replace(
        /[&<>"']/g,
        c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[c])
    );
}


// ==================== ЗАПУСК CMS ====================
// Отключено: CMS (PHP) временно убрана для демо
// window.addEventListener(
//     'DOMContentLoaded',
//     () => loadSiteContent()
// );


// ==================== ПРЕДЗАГРУЗКА ФОНОВ ====================
(() => {

    const backgrounds = [

        'images/backgrounds/hero-light.png',
        'images/backgrounds/hero-dark.png',

        'images/backgrounds/trainers-light.png',
        'images/backgrounds/trainers-dark.png',

        'images/backgrounds/common-light.png',
        'images/backgrounds/common-dark.png',

        'images/backgrounds/events-light.png',
        'images/backgrounds/events-dark.png'

    ];


    backgrounds.forEach(src => {

        const img = new Image();

        img.decoding = 'async';

        img.src = src;
    });

})();

/* ================================================================
   КЛУБ БЕШЕНОЙ БЕЛКИ — ПОЛНЫЙ КОНТЕНТНЫЙ CMS-СЛОЙ
   Не удаляет существующую верстку: только применяет сохранённые тексты и медиа.
   ================================================================ */
(() => {
    const get = (obj, path, fallback='') => path.split('.').reduce((o,k)=>o && o[k] !== undefined ? o[k] : undefined, obj) ?? fallback;
    const directText = (el, value) => {
        if (!el) return;
        Array.from(el.childNodes)
            .filter(node => node.nodeType === 3)
            .forEach(node => node.remove());
        el.appendChild(document.createTextNode(value));
    };
    const setText = (selector, value) => {
        const el=document.querySelector(selector); if(el) el.textContent=String(value ?? '');
    };
    const setDirectText = (selector, value) => directText(document.querySelector(selector), String(value ?? ''));
    const setImg = (selector, src, alt) => { const el=document.querySelector(selector); if(!el || !src)return; el.src=src; if(alt!==undefined)el.alt=String(alt); };
    const setLink = (selector, href) => { const el=document.querySelector(selector); if(el && href) el.href=href; };

    window.applyFullCms = function(d) {
        const st=d?.static||{}; const c=d?.contacts||{}; const m=d?.media||{};
        // Fixed media: both header/sidebar logos + price + all themed section photos.
        setImg('.sidebar-logo img', m.logo||'logo.png', 'Клуб Бешеной Белки');
        setImg('.hero-logo img', m.logo||'logo.png', 'Бешеная Белка');
        setImg('.price-modal__frame img', m.price||'images/price/price.png', 'Прайс клуба Бешеной Белки');
        const vars={
            '--hero-photo': [m.heroLight,m.heroDark], '--trainers-photo':[m.trainersLight,m.trainersDark], '--common-photo':[m.commonLight,m.commonDark], '--events-photo':[m.eventsLight,m.eventsDark]
        };
        const root=document.documentElement;
        for(const [name, pair] of Object.entries(vars)){ if(pair[0])root.style.setProperty(name,`url("${pair[0]}")`); root.style.setProperty(name+'-dark',pair[1]?`url("${pair[1]}")`:root.style.getPropertyValue(name)); }
        let style=document.getElementById('cms-media-overrides');
        if(!style){ style=document.createElement('style'); style.id='cms-media-overrides'; document.head.appendChild(style); }
        style.textContent=`body.dark-theme{--hero-photo:url("${m.heroDark||m.heroLight||'images/backgrounds/hero-dark.png'}");--trainers-photo:url("${m.trainersDark||m.trainersLight||'images/backgrounds/trainers-dark.png'}");--common-photo:url("${m.commonDark||m.commonLight||'images/backgrounds/common-dark.png'}");--events-photo:url("${m.eventsDark||m.eventsLight||'images/backgrounds/events-dark.png'}")}body:not(.dark-theme){--hero-photo:url("${m.heroLight||'images/backgrounds/hero-light.png'}");--trainers-photo:url("${m.trainersLight||'images/backgrounds/trainers-light.png'}");--common-photo:url("${m.commonLight||'images/backgrounds/common-light.png'}");--events-photo:url("${m.eventsLight||'images/backgrounds/events-light.png'}")}`;

        // Navigation
        const nav=st.nav||{}; const navMap=[['hero','home'],['trainers','trainers'],['services','services'],['schedule','schedule'],['gallery','gallery'],['events','events'],['contacts','contacts']];
        navMap.forEach(([id,key])=>{const el=document.querySelector(`.sidebar a[href="#${id}"] .label`); if(el&&nav[key]!==undefined)el.textContent=nav[key];});
        // Hero
        const h=d.hero||{}, words=document.querySelectorAll('.hero-title span');
        [h.titleOrange1,h.titleOrange2,h.titleWhite].forEach((v,i)=>{if(words[i]&&v!==undefined)words[i].textContent=v;});
        setDirectText('.hero-subtitle', st.hero?.subtitle ?? h.subtitle ?? '');
        ['#openBookingModal','#openBookingModal2'].forEach(sel=>setDirectText(sel,h.cta||st.hero?.cta||'Записаться на тренировку'));
        const tags=document.querySelectorAll('.hero-tagline span:not(.divider)'); (h.tagline||[]).forEach((v,i)=>{if(tags[i])tags[i].textContent=v;});
        // Static section labels.
        const sec=st.sections||{}; [['#trainers .section-title','trainersTitle'],['#trainers .section-subtitle','trainersSubtitle'],['#services .section-title','servicesTitle'],['#services .section-subtitle','servicesSubtitle'],['#schedule .section-title','scheduleTitle'],['#schedule .section-subtitle','scheduleSubtitle'],['#gallery .section-title','galleryTitle'],['#gallery .section-subtitle','gallerySubtitle'],['#events .section-title','eventsTitle'],['#events .section-subtitle','eventsSubtitle'],['#contacts .section-title','contactsTitle'],['#contacts .section-subtitle','contactsSubtitle']].forEach(([q,k])=>{if(sec[k]!==undefined)setText(q,sec[k]);});
        const sch=st.schedule||{};
        ['kids','junior','senior','mix','prep'].forEach((type)=>{const key={kids:'legendKids',junior:'legendJunior',senior:'legendSenior',mix:'legendMix',prep:'legendPrep'}[type]; const el=document.querySelector(`#schedule .legend-item .legend-text-${type}`); if(el&&sch[key]!==undefined)el.textContent=sch[key];});
        const leg=document.querySelectorAll('#schedule .legend-item'); [sch.legendKids,sch.legendJunior,sch.legendSenior,sch.legendMix,sch.legendPrep].forEach((v,i)=>{if(leg[i]&&v!==undefined){const span=leg[i].querySelector('span:last-child');if(span)span.textContent=v;}});
        setDirectText('#downloadSchedule',sch.download||'Скачать в Excel');
        const note=document.querySelector('.schedule-note'); if(note){const strong=note.querySelector('strong'); if(strong&&sch.noteStrong!==undefined)strong.textContent=sch.noteStrong; const br=strong?.nextElementSibling; let textNode=br?.nextSibling; if(textNode&&textNode.nodeType===3&&sch.noteText!==undefined) textNode.textContent='\n                '+sch.noteText+'\n            ';}
        // Contacts: keep existing data-driven values but allow labels/hints/CTA to be edited.
        const cs=st.contacts||{}; const cards=document.querySelectorAll('#contacts .contact-item');
        cards.forEach(card=>{const label=card.querySelector('.label'); const hint=card.querySelector('.map-hint'); if(card.classList.contains('phone-link')){if(label&&cs.phoneLabel!==undefined)label.textContent=cs.phoneLabel;if(hint&&cs.phoneHint!==undefined)hint.textContent=cs.phoneHint;} else if(card.classList.contains('contact-item--button')){if(label&&cs.addressLabel!==undefined)label.textContent=cs.addressLabel;if(hint&&cs.addressHint!==undefined)hint.textContent=cs.addressHint;} else {if(label&&cs.vkLabel!==undefined)label.textContent=cs.vkLabel;}});
        setDirectText('#contacts #openBookingModal2',cs.cta||h.cta||'Записаться на тренировку');
        setLink('#contacts .phone-link', 'tel:'+(c.phoneTel||'')); setLink('#contacts .contact-item[href^="https://vk.ru"]',c.vk||'');
        // Booking / map / toast / gallery modal static text.
        const b=st.booking||{}; setText('#bookingModal .booking-modal__title',b.title); setText('#bookingModal .booking-modal__subtitle',b.subtitle);
        setText('#bookingModal .phone-link .booking-option__title',b.phoneTitle); setText('#bookingModal .phone-link .booking-option__desc',b.phoneDesc||c.phone||'');
        setText('#bookingModal .booking-option:not(.phone-link) .booking-option__title',b.vkTitle); setText('#bookingModal .booking-option:not(.phone-link) .booking-option__desc',b.vkDesc); const bookingVk=document.querySelector('#bookingModal .booking-option:not(.phone-link)'); setLink('#bookingModal .booking-option:not(.phone-link)', c.vk || 'https://vk.ru/ffurious_squirrel_club');
        const map=st.map||{}; setText('#mapModal .map-modal__title',map.title); setDirectText('#mapModal .map-open-btn',map.openButton);
        const toast=st.callToast||{}; setText('#callToast .call-toast__title',toast.title); setText('#callToast .call-toast__text',toast.text); setDirectText('#callToastCopy',toast.copy);
        const gm=st.galleryModal||{}; setText('#galleryAlbum .gallery-album__eyebrow',gm.eyebrow); setText('#galleryAlbumTitle',gm.emptyTitle);
        const foot=st.footer||{}; const misc=st.misc||{}; setDirectText('#openPriceModal',misc.priceButton||'Прайс'); setText('footer .cms-footer-copy',foot.copyright||d.footer||''); setText('footer .cms-footer-vk-prefix',foot.vkPrefix||'Мы в'); setText('footer .cms-footer-vk-link',foot.vkSuffix||'ВКонтакте'); setLink('footer .cms-footer-vk-link',c.vk||''); setText('footer .cms-admin-link',foot.admin||'Для администратора');
    };

    window.cmsImagePath = (d,key,fallback) => String(d?.media?.[key] || fallback || '');
})();

/* ================================================================
   КЛУБ БЕШЕНОЙ БЕЛКИ — ДОБАВЛЕННЫЙ CMS-СЛОЙ
   Существующая логика сайта выше не удаляется.
   ================================================================ */
(() => {
    let albums = [];
    let cmsStatic = {};
    const grid = document.getElementById('galleryGrid');
    const albumTitle = document.getElementById('galleryAlbumTitle');

    function renderCmsGallery() {
        if (!grid || !Array.isArray(albums)) return;
        const openText = cmsStatic?.gallery?.open || 'Открыть альбом';
        grid.innerHTML = albums.map((album, index) => {
            const cover = album?.photos?.[album.photos.length - 1]?.path
                || `images/galery/${index + 1}.jpg`;
            return `<button class="gallery-item" type="button" data-album-index="${index}" aria-label="Открыть альбом: ${escapeHtml(album.title || '')}">
                <img src="${escapeHtml(cover)}" alt="${escapeHtml(album.title || '')}" loading="lazy">
                <span class="gallery-cell-overlay">
                    <span class="gallery-cell-title">${escapeHtml(album.title || '')}</span>
                    <span class="gallery-cell-open">${escapeHtml(openText)}</span>
                </span>
            </button>`;
        }).join('');
    }

    async function loadCmsGallery() {
        try {
            const r = await fetch('api.php?action=publicGallery', {cache:'no-store'});
            const data = await r.json();
            if (!data.ok || !Array.isArray(data.albums) || data.albums.length !== 6) return;
            cmsStatic=data.static||{};
            albums = data.albums.map((a, i) => ({
                id: a.id || `album-${i+1}`,
                title: a.title || `Альбом ${i+1}`,
                photos: Array.isArray(a.photos) ? a.photos.slice(-6) : []
            }));
            renderCmsGallery();
        } catch (err) {
            console.warn('CMS gallery not loaded:', err);
        }
    }

    const originalOpenGalleryAlbum = window.openGalleryAlbum;
    if (typeof originalOpenGalleryAlbum === 'function') {
        window.openGalleryAlbum = function(item) {
            const idx = Number(item?.dataset?.albumIndex);
            const album = Number.isInteger(idx) ? albums[idx] : null;
            if (!album || !Array.isArray(album.photos)) return originalOpenGalleryAlbum(item);
            if (albumTitle) albumTitle.textContent = album.title;
            const modalGrid = document.getElementById('galleryAlbumGrid');
            const modal = document.getElementById('galleryAlbum');
            const win = document.getElementById('galleryAlbumWindow');
            if (!modalGrid || !modal || !win) return;
            modalGrid.innerHTML = album.photos.map((photo, i) => `<button class="gallery-album__photo" type="button" data-gallery-index="${i}" aria-label="Открыть фото ${i+1}">
                <img src="${escapeHtml(photo.path)}" alt="${escapeHtml(photo.alt || album.title)}" loading="lazy">
            </button>`).join('');
            const count = album.photos.length; const gm=cmsStatic?.gallery||{};
            const countWord = count===1?(gm.countOne||'фото'):(count>=2&&count<=4?(gm.countFew||'фото'):(gm.countMany||'фотографий'));
            const countNode = document.getElementById('galleryAlbumCount');
            if (countNode) countNode.textContent = `${count} ${countWord}`;
            modal.classList.remove('is-closing');
            modal.setAttribute('aria-hidden','false');
            const tile = item.getBoundingClientRect();
            const wr = win.getBoundingClientRect();
            if (wr.width && wr.height) {
                win.style.setProperty('--album-start-x', `${tile.left + tile.width/2 - (wr.left+wr.width/2)}px`);
                win.style.setProperty('--album-start-y', `${tile.top + tile.height/2 - (wr.top+wr.height/2)}px`);
                win.style.setProperty('--album-start-scale', String(Math.max(.13,Math.min(.32,Math.min(tile.width/wr.width,tile.height/wr.height)))));
            }
            requestAnimationFrame(()=>requestAnimationFrame(()=>{
                modal.classList.add('active');
                document.body.style.overflow='hidden';
            }));
        };
    }

    const originalLoadSiteContent = window.loadSiteContent;
    if (typeof originalLoadSiteContent === 'function') {
        // Оставляем старые сервисные картинки и ссылки, даже когда включён CMS-рендер.
        const restoreServiceLinks = async () => {
            try {
                const r = await fetch('api.php?action=public', {cache:'no-store'});
                const payload = await r.json();
                const services = payload?.data?.services;
                if (!Array.isArray(services)) return;
                const cmsText = payload?.data?.static?.services?.linkText || 'Записаться';
                const meta = Array.isArray(payload?.serviceMeta) ? payload.serviceMeta : [];
                document.querySelectorAll('.service-card').forEach((card, i) => {
                    const s = services[i];
                    const m = Array.isArray(meta) ? (meta[i] || {}) : {};
                    if (!s) return;
                    let photo = card.querySelector('.service-photo');
                    if (!photo) { photo = document.createElement('div'); photo.className='service-photo'; card.prepend(photo); }
                    if (m.image) photo.innerHTML = `<img src="${escapeHtml(m.image)}" alt="${escapeHtml(s.title || '')}" loading="lazy">`;
                    let link = card.querySelector('.service-link');
                    if (!link || link.tagName !== 'BUTTON') {
                        const button = document.createElement('button');
                        button.type = 'button'; button.className = 'service-link';
                        if (link) link.replaceWith(button); else card.append(button);
                        link = button;
                    }
                    link.removeAttribute('href'); link.removeAttribute('target'); link.removeAttribute('rel');
                    link.dataset.paymentService = i === 0 ? 'individual' : 'group';
                    link.innerHTML = 'Выбрать тариф <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
                });
            } catch {}
        };
        window.addEventListener('DOMContentLoaded', async () => {
            try { await originalLoadSiteContent(); await restoreServiceLinks(); } catch {}
            await loadCmsGallery();
        });
    } else {
        window.addEventListener('DOMContentLoaded', loadCmsGallery);
    }

    // Добавляем ссылку для администратора, не вмешиваясь в существующую разметку футера.
    const addAdminLink = () => {
        const footer = document.querySelector('footer');
        if (!footer || footer.querySelector('.cms-admin-link')) return;
        const wrap = document.createElement('span');
        wrap.className='cms-admin-link-wrap';
        wrap.innerHTML='<a class="cms-admin-link" href="admin/" title="Админ-панель">Для администратора</a>';
        footer.appendChild(wrap);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addAdminLink, {once:true}); else addAdminLink();
})();

/* ============================================================
   ДОПОЛНЕНИЕ: ФИНАЛЬНАЯ ФИКСАЦИЯ UI РАСПИСАНИЯ
   Не заменяет существующий CMS-код — только нормализует DOM после него.
   ============================================================ */
(() => {
    'use strict';

    const legendKeys = [
        'legendKids',
        'legendJunior',
        'legendSenior',
        'legendMix',
        'legendPrep'
    ];

    function getScheduleStatic(data) {
        return data && data.static && data.static.schedule
            ? data.static.schedule
            : {};
    }

    function normalizeLegend(data) {
        const items = document.querySelectorAll('#schedule .schedule-legend .legend-item');
        if (!items.length) return;

        const scheduleStatic = getScheduleStatic(data);

        items.forEach((item, index) => {
            const dot = item.querySelector('.legend-dot');
            const oldLabel = item.querySelector('.legend-label');
            const textNodes = Array.from(item.childNodes).filter(node => node.nodeType === 3);

            let label = scheduleStatic[legendKeys[index]];

            if (label === undefined) {
                if (oldLabel) {
                    label = oldLabel.textContent.trim();
                } else {
                    label = textNodes.map(node => node.textContent).join(' ').trim();
                }
            }

            textNodes.forEach(node => node.remove());
            if (oldLabel) oldLabel.remove();

            if (dot) {
                /* Старый CMS-код мог записать весь текст прямо внутрь цветной точки. */
                dot.textContent = '';
            }

            const labelNode = document.createElement('span');
            labelNode.className = 'legend-label';
            labelNode.textContent = String(label ?? '');
            item.appendChild(labelNode);
        });
    }

    function normalizeDownloadButton(data) {
        const button = document.getElementById('downloadSchedule');
        if (!button) return;

        const scheduleStatic = getScheduleStatic(data);
        const configuredLabel = scheduleStatic.download;

        let label = configuredLabel;
        if (label === undefined) {
            const existing = Array.from(button.childNodes)
                .filter(node => node.nodeType === 3)
                .map(node => node.textContent.trim())
                .filter(Boolean)
                .join(' ')
                .trim();
            label = existing || 'Скачать в Excel';
        }

        /* Удаляем все прямые текстовые узлы, включая пробелы вокруг SVG. */
        Array.from(button.childNodes)
            .filter(node => node.nodeType === 3)
            .forEach(node => node.remove());

        /* Сохраняем SVG-иконку и добавляем ровно один текстовый узел. */
        button.appendChild(document.createTextNode(String(label ?? '')));
        button.setAttribute('aria-label', String(label ?? 'Скачать в Excel'));
    }

    function normalizeScheduleUi(data) {
        normalizeLegend(data);
        normalizeDownloadButton(data);
        document.querySelectorAll('.schedule-trainer').forEach(trainer => {
            if (typeof window.addScheduleMobileHint === 'function') {
                window.addScheduleMobileHint(trainer);
            } else if (!trainer.querySelector('.schedule-mobile-hint')) {
                const hint = document.createElement('div');
                hint.className = 'schedule-mobile-hint';
                hint.setAttribute('aria-hidden', 'true');
                hint.innerHTML = '<span class="schedule-mobile-hint__text">← СМАХНИТЕ ВЛЕВО / ВПРАВО, ЧТОБЫ УВИДЕТЬ ВСЮ ТАБЛИЦУ →</span>';
                trainer.appendChild(hint);
            }
        });
    }

    /* Перехватываем существующий CMS-рендер: сначала работает старый код,
       затем безопасно приводим проблемные элементы к корректной структуре. */
    const previousApplyFullCms = window.applyFullCms;
    if (typeof previousApplyFullCms === 'function') {
        window.applyFullCms = function (data) {
            previousApplyFullCms(data);
            normalizeScheduleUi(data);
        };
    }

    const boot = () => normalizeScheduleUi(null);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();

/* ============================================================
   FINAL ADD-ONLY PATCH: SCHEDULE NORMALIZER
   Удаляет ненужную колонку тренера из любой версии таблицы,
   включая таблицы, которые были перерисованы CMS/API.
   ============================================================ */
(function () {
    'use strict';

    let resizeTimer = null;
    let rafPending = false;

    function normalizeTable(table) {
        if (!table) return;

        /* Всегда оставляем только 3 колонки: День / Время / Группа. */
        const headRow = table.querySelector('thead tr');
        if (headRow) {
            Array.from(headRow.children).slice(3).forEach(cell => cell.remove());
        }

        table.querySelectorAll('tbody tr').forEach(row => {
            Array.from(row.children).forEach(cell => {
                if (cell.classList.contains('coach')) {
                    cell.remove();
                }
            });

            while (row.children.length > 3) {
                row.lastElementChild?.remove();
            }
        });

        table.dataset.scheduleColumnsNormalized = 'true';
    }

    function updateHint(trainer) {
        const wrapper = trainer.querySelector('.schedule-wrapper');
        const hint = trainer.querySelector('.schedule-mobile-hint');
        if (!wrapper || !hint) return;

        const canScroll = wrapper.scrollWidth > wrapper.clientWidth + 2;
        const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

        /* Подсказка нужна только там, где действительно есть что листать. */
        const shouldShow = isTouchDevice && canScroll;
        if (hint.hidden !== !shouldShow) {
            hint.hidden = !shouldShow;
        }
    }

    function normalizeAllSchedules() {
        const tables = document.querySelectorAll('#schedule .schedule-table');
        tables.forEach(normalizeTable);

        document.querySelectorAll('#schedule .schedule-trainer').forEach(updateHint);
    }

    function scheduleNormalize() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            normalizeAllSchedules();
        });
    }

    function init() {
        normalizeAllSchedules();

        const container = document.querySelector('#schedule .schedule-trainers');
        if (container) {
            const observer = new MutationObserver(scheduleNormalize);
            observer.observe(container, { childList: true, subtree: true });
        }

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(normalizeAllSchedules, 120);
        }, { passive: true });

        window.addEventListener('orientationchange', () => {
            setTimeout(normalizeAllSchedules, 150);
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

/* ============================================================
   ADD-ONLY PATCH: НАДЁЖНОЕ ЗАКРЫТИЕ АЛЬБОМА ИЗ CMS
   CMS-версия openGalleryAlbum ранее не обновляла флаг
   galleryAlbumOpen, поэтому штатная функция закрытия могла
   сразу выйти. Здесь не заменяем исходный код — только
   добавляем независимый обработчик.
   ============================================================ */
(() => {
    'use strict';

    const forceCloseAlbum = () => {
        const modal = document.getElementById('galleryAlbum');
        if (!modal) return;

        modal.classList.remove('active', 'is-closing');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    document.addEventListener('click', (event) => {
        if (event.target.closest('#galleryAlbumClose, #galleryAlbumBackdrop')) {
            forceCloseAlbum();
        }
    }, true);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modal = document.getElementById('galleryAlbum');
            if (modal?.classList.contains('active') || modal?.classList.contains('is-closing')) {
                forceCloseAlbum();
            }
        }
    });
})();


/* ============================================================
   ADD-ONLY PATCH: ЖЁСТКАЯ СОРТИРОВКА РАСПИСАНИЯ НА САЙТЕ
   Исправляет старые/хаотично сохранённые дни даже без повторного
   входа в админку. Для каждой таблицы порядок всегда Пн -> Вс,
   внутри дня — по времени.
   ============================================================ */
(() => {
  'use strict';

  const dayOrder = new Map([
    ['пн', 0], ['понедельник', 0],
    ['вт', 1], ['вторник', 1],
    ['ср', 2], ['среда', 2],
    ['чт', 3], ['четверг', 3],
    ['пт', 4], ['пятница', 4],
    ['сб', 5], ['суббота', 5],
    ['вс', 6], ['воскресенье', 6]
  ]);

  function dayIndex(value) {
    const key = String(value ?? '').trim().toLowerCase().replace(/ё/g, 'е');
    return dayOrder.get(key) ?? 99;
  }

  function timeValue(value) {
    const m = String(value ?? '').match(/(\d{1,2})\s*:\s*(\d{2})/);
    return m ? (+m[1] * 60 + +m[2]) : 9999;
  }

  function normalizeTableOrder(table) {
    const tbody = table?.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (!rows.length) return;

    let currentDay = '';
    const items = rows.map(row => {
      const dayCell = row.querySelector('.day');
      if (dayCell) currentDay = dayCell.textContent.trim();
      const time = row.querySelector('.time')?.textContent.trim() || '';
      const group = row.querySelector('.group-tag')?.textContent.trim() || '';
      const groupCell = row.querySelector('.group-tag')?.parentElement;
      return { day: currentDay, time, group, row, groupCell };
    });

    const sorted = [...items].sort((a, b) => {
      const d = dayIndex(a.day) - dayIndex(b.day);
      if (d) return d;
      return timeValue(a.time) - timeValue(b.time);
    });

    const isSame = sorted.every((item, i) => item.row === items[i].row);
    if (isSame) return;

    const groups = [];
    for (const item of sorted) {
      let group = groups[groups.length - 1];
      if (!group || group.day !== item.day) {
        group = { day: item.day, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }

    const fragment = document.createDocumentFragment();
    groups.forEach(group => {
      group.items.forEach((item, index) => {
        const row = item.row;
        if (index === 0) {
          const oldDay = row.querySelector('.day');
          if (oldDay) {
            oldDay.textContent = group.day;
            oldDay.rowSpan = group.items.length;
          } else {
            const day = document.createElement('td');
            day.className = 'day';
            day.rowSpan = group.items.length;
            day.textContent = group.day;
            row.insertBefore(day, row.firstElementChild);
          }
        } else {
          row.querySelector('.day')?.remove();
        }
        fragment.appendChild(row);
      });
    });

    tbody.replaceChildren(fragment);
    table.dataset.scheduleOrderFixed = 'true';
  }

  function fixAll() {
    document.querySelectorAll('#schedule .schedule-table').forEach(normalizeTableOrder);
  }

  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(fixAll, 0);
  };

  function init() {
    fixAll();
    const container = document.querySelector('#schedule .schedule-trainers');
    if (container) {
      const observer = new MutationObserver(schedule);
      observer.observe(container, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* ============================================================
   ИСПРАВЛЕНИЕ: ЕДИНЫЙ И ПОСЛЕДОВАТЕЛЬНЫЙ СИНХРОНИЗАТОР РАСПИСАНИЯ
   Один renderer, без параллельных запросов и без отката к старому
   снимку данных. После сохранения админки обновление приходит сразу
   через BroadcastChannel, а для других устройств остаётся резервный
   опрос API.
   ============================================================ */
(() => {
  'use strict';

  const DAY_ORDER = new Map([
    ['пн',0], ['понедельник',0],
    ['вт',1], ['вторник',1],
    ['ср',2], ['среда',2],
    ['чт',3], ['четверг',3],
    ['пт',4], ['пятница',4],
    ['сб',5], ['суббота',5],
    ['вс',6], ['воскресенье',6]
  ]);

  const normalize = value => String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const escapeHtmlValue = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const timeValue = value => {
    const match = String(value ?? '').match(/(\d{1,2})\s*:\s*(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : 9999;
  };

  function trainerEntries(list) {
    return (Array.isArray(list) ? list : [])
      .map((trainer, index) => {
        const full = String(trainer?.name ?? '').trim();
        const parts = normalize(full).split(' ').filter(Boolean);
        return {
          index,
          full,
          norm: normalize(full),
          first: parts[0] || '',
          last: parts[parts.length - 1] || parts[0] || '',
          spec: String(trainer?.spec ?? 'Тренер').trim() || 'Тренер'
        };
      })
      .filter(trainer => trainer.full);
  }

  function resolveTrainer(value, trainers) {
    const raw = normalize(value);
    if (!raw) return null;

    const exact = trainers.filter(trainer => trainer.norm === raw);
    if (exact.length === 1) return exact[0];

    const tokenMatches = trainers.filter(trainer =>
      trainer.first === raw || trainer.last === raw
    );

    return tokenMatches.length === 1 ? tokenMatches[0] : null;
  }

  function rowData(row) {
    if (!Array.isArray(row) || row.length < 5) return null;
    const dayKey = normalize(row[0]);
    const dayIndex = DAY_ORDER.get(dayKey);
    if (dayIndex == null) return null;

    return {
      day: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][dayIndex],
      dayIndex,
      time: String(row[1] ?? '').trim(),
      group: String(row[2] ?? '').trim(),
      coach: String(row[3] ?? '').trim(),
      type: String(row[4] ?? 'mix').trim() || 'mix'
    };
  }

  function renderDynamicSchedule(data) {
    const container = document.querySelector('#schedule .schedule-trainers');
    if (!container || !data) return;

    const trainers = trainerEntries(data.trainers);
    const groups = new Map();

    (Array.isArray(data.schedule) ? data.schedule : []).forEach(rawRow => {
      const row = rowData(rawRow);
      if (!row) return;

      const trainer = resolveTrainer(row.coach, trainers);
      if (!trainer) return;

      row.coach = trainer.full;
      if (!groups.has(trainer.full)) groups.set(trainer.full, []);
      groups.get(trainer.full).push(row);
    });

    const totalRows = Array.from(groups.values())
      .reduce((sum, rows) => sum + rows.length, 0);

    const totalCounter = document.querySelector('#schedule .schedule-total-count');
    if (totalCounter) totalCounter.textContent = `Всего занятий: ${totalRows}`;

    const fragment = document.createDocumentFragment();

    trainers.forEach(trainer => {
      const rows = groups.get(trainer.full);
      if (!rows || !rows.length) return;

      rows.sort((a, b) =>
        (a.dayIndex - b.dayIndex) ||
        (timeValue(a.time) - timeValue(b.time)) ||
        String(a.group).localeCompare(String(b.group), 'ru')
      );

      const block = document.createElement('div');
      block.className = 'schedule-trainer';
      block.dataset.coach = trainer.full;
      block.dataset.rowCount = String(rows.length);

      const header = document.createElement('div');
      header.className = 'schedule-trainer__header';
      header.innerHTML =
        `<span class="schedule-trainer__name">${escapeHtmlValue(trainer.full)}</span>` +
        `<span class="schedule-trainer__spec">${escapeHtmlValue(trainer.spec)}</span>`;

      const wrapper = document.createElement('div');
      wrapper.className = 'schedule-wrapper';

      const table = document.createElement('table');
      table.className = 'schedule-table';
      table.innerHTML =
        '<thead><tr><th>День</th><th>Время</th><th>Группа</th></tr></thead>';

      const tbody = document.createElement('tbody');
      const dayCounts = {};
      const seen = {};

      rows.forEach(row => {
        dayCounts[row.day] = (dayCounts[row.day] || 0) + 1;
      });

      rows.forEach(item => {
        const tr = document.createElement('tr');

        if (!seen[item.day]) {
          const day = document.createElement('td');
          day.className = 'day';
          day.rowSpan = dayCounts[item.day];
          day.textContent = item.day;
          tr.appendChild(day);
          seen[item.day] = true;
        }

        const time = document.createElement('td');
        time.className = 'time';
        time.textContent = item.time;

        const groupCell = document.createElement('td');
        const group = document.createElement('span');
        group.className = `group-tag ${item.type}`;
        group.textContent = item.group;
        groupCell.appendChild(group);

        tr.appendChild(time);
        tr.appendChild(groupCell);
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      wrapper.appendChild(table);
      block.appendChild(header);
      block.appendChild(wrapper);

      const hint = document.createElement('div');
      hint.className = 'schedule-mobile-hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.innerHTML =
        '<span class="schedule-mobile-hint__text">← СМАХНИТЕ ВЛЕВО / ВПРАВО, ЧТОБЫ УВИДЕТЬ ВСЮ ТАБЛИЦУ →</span>';
      block.appendChild(hint);

      fragment.appendChild(block);
    });

    // Атомарно заменяем весь набор расписания одним DOM-оператором.
    container.replaceChildren(fragment);

    window.dispatchEvent(new CustomEvent('belka:schedule-rendered', {
      detail: { total: totalRows }
    }));
  }

  let lastSignature = '';
  let activeRequest = null;
  let requestId = 0;
  let pollTimer = 0;
  const POLL_INTERVAL = 1000;

  // Один публичный renderer: все источники обновления используют
  // одну и ту же функцию и никогда не пишут расписание напрямую в DOM.
  window.belkaRenderScheduleData = renderDynamicSchedule;

  async function refreshDynamicSchedule(force = false) {
    const currentId = ++requestId;

    if (activeRequest) {
      try { activeRequest.abort(); } catch {}
    }

    activeRequest = new AbortController();

    try {
      const response = await fetch('api.php?action=public', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: activeRequest.signal
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();

      // Более старый ответ никогда не может перезаписать более новый.
      if (currentId !== requestId) return;
      if (!payload?.ok || !payload.data) return;

      const data = payload.data;
      const signature = JSON.stringify({
        trainers: data.trainers || [],
        schedule: data.schedule || []
      });

      if (!force && signature === lastSignature) return;

      lastSignature = signature;
      renderDynamicSchedule(data);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.warn('[schedule-sync] Не удалось обновить расписание:', error);
      }
    } finally {
      if (currentId === requestId) activeRequest = null;
    }
  }

  function startPolling() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(async () => {
      await refreshDynamicSchedule(false);
      startPolling();
    }, POLL_INTERVAL);
  }

  // Мгновенная связь между вкладкой админки и вкладкой сайта
  // при открытии их на одном домене в одном браузере.
  try {
    const channel = new BroadcastChannel('belka-site-sync');
    channel.addEventListener('message', event => {
      if (event?.data?.type !== 'schedule-updated' &&
          event?.data?.type !== 'site-updated') return;

      // В админке передаётся уже сохранённый снимок расписания.
      // Рендерим его сразу, без ожидания нового HTTP-запроса.
      const snapshot = event.data?.snapshot;
      if (snapshot?.trainers && Array.isArray(snapshot.schedule)) {
        const signature = JSON.stringify({
          trainers: snapshot.trainers || [],
          schedule: snapshot.schedule || []
        });
        if (signature !== lastSignature) {
          lastSignature = signature;
          renderDynamicSchedule(snapshot);
        }
        return;
      }

      refreshDynamicSchedule(true);
    });
  } catch {}

  // Запасной вариант для браузеров без BroadcastChannel.
  window.addEventListener('storage', event => {
    if (event.key !== 'belka-site-updated' || !event.newValue) return;

    try {
      const message = JSON.parse(event.newValue);
      const snapshot = message?.snapshot;
      if (snapshot?.trainers && Array.isArray(snapshot.schedule)) {
        const signature = JSON.stringify({
          trainers: snapshot.trainers || [],
          schedule: snapshot.schedule || []
        });
        if (signature !== lastSignature) {
          lastSignature = signature;
          renderDynamicSchedule(snapshot);
        }
        return;
      }
    } catch {}

    refreshDynamicSchedule(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshDynamicSchedule(true);
  });

  window.belkaRefreshSchedule = () => refreshDynamicSchedule(true);

  function init() {
    refreshDynamicSchedule(true);
    startPolling();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
// ==================== YCLIENTS ====================

document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-yclients-open]');
    if (!trigger) return;

    e.preventDefault();

    // Открываем виджет YCLIENTS
    if (window.yWidget && typeof window.yWidget.show === 'function') {
        window.yWidget.show('https://n2618148.yclients.ru/');
    } else {
        // Фолбэк — если виджет ещё не загрузился, открываем ссылку
        window.open('https://n2618148.yclients.ru/', '_blank');
    }
});
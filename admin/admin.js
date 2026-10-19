const state={data:null,gallery:[],serviceMeta:[],csrf:'',tab:'gallery'};
const $=s=>document.querySelector(s);
function notifySiteUpdated(){
  const stamp=String(Date.now());
  const snapshot = state?.data && {
    trainers: Array.isArray(state.data.trainers) ? state.data.trainers : [],
    schedule: Array.isArray(state.data.schedule) ? state.data.schedule : []
  };
  const message = {type:'schedule-updated', stamp, snapshot};

  // На том же браузере расписание меняется мгновенно: сайт получает
  // уже сохранённые данные и не ждёт повторного HTTP-запроса.
  try{localStorage.setItem('belka-site-updated', JSON.stringify(message));}catch{}
  try{
    const channel=new BroadcastChannel('belka-site-sync');
    channel.postMessage(message);
    channel.close();
  }catch{}
}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

async function api(url,opt={}){
  const r=await fetch(url,opt);
  const d=await r.json().catch(()=>({ok:false,error:`Сервер вернул не JSON (HTTP ${r.status})`}));
  if(!r.ok) throw new Error(d.error||`Ошибка HTTP ${r.status}`);
  return d;
}
function setStatus(msg,good=false){const e=$('#saveStatus');e.textContent=msg;e.className='status '+(good?'good':'');}

async function prepareUploadFile(file){
  if(!file || file.type==='image/gif' || file.size<=1800000) return file;
  try{
    const bitmap=await createImageBitmap(file);
    const max=2200; const scale=Math.min(1,max/bitmap.width,max/bitmap.height);
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d',{alpha:true}); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close?.();
    let quality=.84, blob=null;
    for(let i=0;i<4;i++){ blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality)); if(blob && blob.size<=1750000) break; quality-=.08; }
    if(!blob) return file;
    const base=(file.name||'image').replace(/\.[^.]+$/,''); return new File([blob],base+'.webp',{type:'image/webp',lastModified:Date.now()});
  }catch{return file;}
}

function setNested(obj,path,val){const p=path.split('.');let t=obj;for(let i=0;i<p.length-1;i++){if(!(p[i] in t))t[p[i]]={};t=t[p[i]];}t[p[p.length-1]]=val;}
function field(label,path,val){return `<label>${label}<input data-path="${esc(path)}" value="${esc(val)}"></label>`}
function area(label,path,val){return `<label>${label}<textarea data-path="${esc(path)}">${esc(val)}</textarea></label>`}
function addButtons(){document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.add;if(k==='trainers')state.data.trainers.push({name:'Новый тренер',spec:'Тренер',photo:'⭐',image:'',desc:'',senior:false});if(k==='services'){state.data.services.push({icon:'🎯',title:'Новая услуга',intro:'',features:[],price:'',image:'',link:''});state.serviceMeta.push({image:'',link:''});}if(k==='events')state.data.events.push({day:'01',month:'Янв',year:'2027',badge:'Скоро',badgeType:'soon',title:'Новое мероприятие',place:'Тюмень',time:'12:00',desc:''});render();}));}
function bindDataInputs(){document.querySelectorAll('[data-path]').forEach(e=>{const fn=()=>{const path=e.dataset.path;const value=e.type==='checkbox'?e.checked:e.value;if(path.startsWith('serviceMeta.')){const p=path.split('.');const i=+p[1],k=p.slice(2).join('.');state.serviceMeta[i]??={};state.serviceMeta[i][k]=value;}else setNested(state.data,path,value);};e.addEventListener('input',fn);e.addEventListener('change',fn);});}

function renderHero(){const h=state.data.hero||{};$('#editor').innerHTML=`<div class="panel"><div class="grid2">${field('Первая строка','hero.titleOrange1',h.titleOrange1)}${field('Вторая строка','hero.titleOrange2',h.titleOrange2)}${field('Третья строка','hero.titleWhite',h.titleWhite)}${field('Подзаголовок','hero.subtitle',h.subtitle)}${field('Текст кнопки','hero.cta',h.cta)}${field('Слоган 1','hero.tagline.0',(h.tagline||[])[0])}${field('Слоган 2','hero.tagline.1',(h.tagline||[])[1])}${field('Слоган 3','hero.tagline.2',(h.tagline||[])[2])}</div></div>`;bindDataInputs();}
function renderTrainers(){const a=state.data.trainers||[];$('#editor').innerHTML=`<div class="panel">${a.map((t,i)=>{const img=t.image||`images/treners/rushania.png`;return `<div class="item-card" data-i="${i}"><div class="item-head"><h3>${esc(t.name||'Новый тренер')}</h3><button type="button" class="btn btn-danger" data-del="trainers" data-i="${i}">Удалить</button></div><div class="media-editor-inline"><img src="../${esc(img)}" alt=""><div><strong>Фотография тренера</strong><div class="muted">Изображение можно заменить прямо здесь. Исходный файл не удаляется.</div><div class="inline-actions"><label class="upload-btn">Заменить фото<input type="file" accept="image/*" data-media-kind="trainer" data-media-index="${i}"></label><button type="button" class="btn btn-dark reset-media" data-media-kind="trainer" data-media-index="${i}">Вернуть исходное</button></div></div></div><div class="grid2">${field('Имя',`trainers.${i}.name`,t.name)}${field('Должность',`trainers.${i}.spec`,t.spec)}${field('Эмодзи/заполнитель',`trainers.${i}.photo`,t.photo)}</div>${area('Описание',`trainers.${i}.desc`,t.desc)}<label class="check"><input type="checkbox" data-path="trainers.${i}.senior" ${t.senior?'checked':''}> Старший тренер</label></div>`}).join('')}<button type="button" class="btn btn-light" data-add="trainers">＋ Добавить тренера</button></div>`;bindCommonList();bindMediaInputs();}
function renderServices(){const a=state.data.services||[];const m=state.serviceMeta||[];$('#editor').innerHTML=`<div class="panel">${a.map((s,i)=>{const meta=m[i]||{};const img=meta.image||s.image||`images/services/${i===0?'individual':'group'}.png`;return `<div class="item-card"><div class="item-head"><h3>${esc(s.title||'Новая услуга')}</h3><button class="btn btn-danger" data-del="services" data-i="${i}">Удалить</button></div><div class="media-editor-inline"><img src="../${esc(img)}" alt=""><div><strong>Фотография услуги</strong><div class="muted">Можно заменить файл без переименования. Исходная картинка останется в проекте.</div><div class="inline-actions"><label class="upload-btn">Заменить фото<input type="file" accept="image/*" data-media-kind="service" data-media-index="${i}"></label><button type="button" class="btn btn-dark reset-media" data-media-kind="service" data-media-index="${i}">Вернуть исходное</button></div></div></div><div class="grid2">${field('Иконка',`services.${i}.icon`,s.icon)}${field('Название',`services.${i}.title`,s.title)}${field('Стоимость',`services.${i}.price`,s.price)}${field('Ссылка кнопки',`serviceMeta.${i}.link`,meta.link||'')}</div>${area('Описание',`services.${i}.intro`,s.intro)}${area('Пункты (каждый с новой строки)',`services.${i}.featuresText`,(s.features||[]).join('\n'))}</div>`;}).join('')}<button type="button" class="btn btn-light" data-add="services">＋ Добавить услугу</button></div>`;document.querySelectorAll('[data-path$="featuresText"]').forEach(e=>e.addEventListener('input',()=>{const i=+e.dataset.path.split('.')[1];state.data.services[i].features=e.value.split('\n').map(x=>x.trim()).filter(Boolean);}));document.querySelectorAll('[data-path^="serviceMeta."]').forEach(e=>e.addEventListener('input',()=>{const i=+e.dataset.path.split('.')[1],k=e.dataset.path.split('.')[2];state.serviceMeta[i]??={};state.serviceMeta[i][k]=e.value;}));bindDataInputs();addButtons();bindDelete();bindMediaInputs();}
function renderSchedule(){const rows=state.data.schedule||[];$('#editor').innerHTML=`<div class="panel"><div class="table-wrap"><table><thead><tr><th>День</th><th>Время</th><th>Группа</th><th>Тренер</th><th>Тип</th><th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr data-i="${i}"><td><input data-s="0" value="${esc(r[0])}"></td><td><input data-s="1" value="${esc(r[1])}"></td><td><input data-s="2" value="${esc(r[2])}"></td><td><input data-s="3" value="${esc(r[3])}"></td><td><select data-s="4">${['kids','junior','senior','mix','prep'].map(o=>`<option value="${o}" ${r[4]===o?'selected':''}>${o}</option>`).join('')}</select></td><td><button class="btn btn-danger" data-del="schedule" data-i="${i}">×</button></td></tr>`).join('')}</tbody></table></div><button type="button" class="btn btn-light" data-add="schedule">＋ Добавить строку</button></div>`;document.querySelectorAll('tr[data-i] [data-s]').forEach(e=>e.addEventListener('input',()=>{const tr=e.closest('tr'),i=+tr.dataset.i;state.data.schedule[i][+e.dataset.s]=e.value;}));document.querySelectorAll('tr[data-i] select').forEach(e=>e.addEventListener('change',()=>{const tr=e.closest('tr'),i=+tr.dataset.i;state.data.schedule[i][4]=e.value;}));document.querySelector('[data-add="schedule"]').addEventListener('click',()=>{state.data.schedule.push(['Пн','10:00 – 11:00','Новая группа','Тренер','mix']);render();});bindDelete();}
function renderEvents(){const a=state.data.events||[];$('#editor').innerHTML=`<div class="panel">${a.map((e,i)=>`<div class="item-card"><div class="item-head"><h3>${esc(e.title||'Новое мероприятие')}</h3><button class="btn btn-danger" data-del="events" data-i="${i}">Удалить</button></div><div class="grid3">${field('День',`events.${i}.day`,e.day)}${field('Месяц',`events.${i}.month`,e.month)}${field('Год',`events.${i}.year`,e.year)}${field('Плашка',`events.${i}.badge`,e.badge)}${field('Место',`events.${i}.place`,e.place)}${field('Время',`events.${i}.time`,e.time)}</div>${field('Название',`events.${i}.title`,e.title)}${area('Описание',`events.${i}.desc`,e.desc)}<label>Тип плашки<select data-path="events.${i}.badgeType"><option value="" ${!e.badgeType?'selected':''}>Обычная</option><option value="soon" ${e.badgeType==='soon'?'selected':''}>Скоро</option></select></label></div>`).join('')}<button type="button" class="btn btn-light" data-add="events">＋ Добавить мероприятие</button></div>`;bindDataInputs();addButtons();bindDelete();}
function renderContacts(){const c=state.data.contacts||{};$('#editor').innerHTML=`<div class="panel"><div class="grid2">${field('Телефон','contacts.phone',c.phone)}${field('Телефон для tel:','contacts.phoneTel',c.phoneTel)}${field('Адрес','contacts.address',c.address)}${field('Площадка','contacts.venue',c.venue)}${field('Ссылка ВКонтакте','contacts.vk',c.vk)}${field('Текст ВКонтакте','contacts.vkName',c.vkName)}${field('Текст для карты','contacts.mapText',c.mapText)}${field('Текст футера','footer',state.data.footer)}</div></div>`;bindDataInputs();}


function renderTexts(){
  const s=state.data.static||{}; const rows=[];
  const groups=[
    ['Навигация','nav',[['home','Главная'],['trainers','Тренера'],['services','Услуги'],['schedule','Расписание'],['gallery','Галерея'],['events','Мероприятия'],['contacts','Контакты']]],
    ['Заголовки разделов','sections',[['trainersTitle','Тренеры'],['trainersSubtitle','Подзаголовок тренеров'],['servicesTitle','Услуги'],['servicesSubtitle','Подзаголовок услуг'],['scheduleTitle','Расписание'],['scheduleSubtitle','Подзаголовок расписания'],['galleryTitle','Галерея'],['gallerySubtitle','Подзаголовок галереи'],['eventsTitle','Турниры и мероприятия'],['eventsSubtitle','Подзаголовок мероприятий'],['contactsTitle','Контакты'],['contactsSubtitle','Подзаголовок контактов']]],
    ['Услуги','services',[['linkText','Текст кнопки услуги']]],
    ['Расписание','schedule',[['tableDay','Заголовок «День»'],['tableTime','Заголовок «Время»'],['tableGroup','Заголовок «Группа»'],['tableCoach','Заголовок «Тренер»'],['legendKids','Ninja Kids'],['legendJunior','Младшие'],['legendSenior','Старшие'],['legendMix','Смешанные'],['legendPrep','Подготовительная'],['download','Кнопка скачивания'],['noteStrong','Важное предупреждение'],['noteText','Примечание']]],
    ['Галерея','gallery',[['open','Кнопка открытия альбома'],['albumEyebrow','Надпись над альбомом'],['empty','Нет фотографий'],['lightboxAlt','Alt фото'],['countOne','1 фото'],['countFew','2–4 фото'],['countMany','5–6 фото']]],
    ['Мероприятия','events',[['locationPrefix','Префикс места'],['timePrefix','Префикс времени']]],
    ['Контакты и кнопки','contacts',[['phoneLabel','Подпись телефона'],['phoneHint','Подсказка телефона'],['addressLabel','Подпись адреса'],['addressHint','Подсказка адреса'],['vkLabel','Подпись ВКонтакте'],['cta','Кнопка записи']]],
    ['Окно записи','booking',[['title','Заголовок'],['subtitle','Подзаголовок'],['phoneTitle','Телефон'],['phoneDesc','Описание телефона'],['vkTitle','ВК'],['vkDesc','Описание ВК']]],
    ['Карта','map',[['title','Заголовок карты'],['openButton','Кнопка открытия карты']]],
    ['Уведомление звонка','callToast',[['title','Заголовок'],['text','Текст'],['copy','Кнопка копирования']]],
    ['Модальное окно галереи','galleryModal',[['eyebrow','Надпись'],['emptyTitle','Заголовок по умолчанию']]],
    ['Футер','footer',[['copyright','Копирайт'],['vkPrefix','Перед ссылкой ВК'],['vkSuffix','Текст ссылки ВК'],['admin','Ссылка админа']]],
    ['Главный экран','hero',[['subtitle','Подзаголовок'],['cta','Кнопка записи']]],
    ['Прочее','misc',[['sidebarBrand','Текст бренда в сайдбаре'],['priceButton','Кнопка «Прайс»']]]
  ];
  $('#editor').innerHTML='<div class="panel">'+groups.map(([title,group,items])=>`<div class="text-group"><div class="item-head"><h3>${esc(title)}</h3></div><div class="grid2">${items.map(([k,label])=>field(label,`static.${group}.${k}`,s[group]?.[k]||'')).join('')}</div></div>`).join('')+'</div>';bindDataInputs();
}

const fixedMedia=[
  ['logo','Логотип','logo.png'],['price','Прайс','images/price/price.png'],['heroLight','Фон главной — светлая тема','images/backgrounds/hero-light.png'],['heroDark','Фон главной — тёмная тема','images/backgrounds/hero-dark.png'],['trainersLight','Фон тренеров — светлая тема','images/backgrounds/trainers-light.png'],['trainersDark','Фон тренеров — тёмная тема','images/backgrounds/trainers-dark.png'],['commonLight','Общий фон — светлая тема','images/backgrounds/common-light.png'],['commonDark','Общий фон — тёмная тема','images/backgrounds/common-dark.png'],['eventsLight','Фон мероприятий — светлая тема','images/backgrounds/events-light.png'],['eventsDark','Фон мероприятий — тёмная тема','images/backgrounds/events-dark.png']
];
function renderMedia(){const m=state.data.media||{};const tr=state.data.trainers||[];const sv=state.services||[];let html='<div class="panel"><div class="media-section"><h3>Основные изображения сайта</h3><div class="media-library-grid">';html+=fixedMedia.map(([key,label,original])=>`<div class="media-library-card"><img src="../${esc(m[key]||original)}" alt=""><div class="media-library-info"><strong>${esc(label)}</strong><span>${esc(m[key]||original)}</span><div class="inline-actions"><label class="upload-btn">Заменить<input type="file" accept="image/*" data-media-kind="fixed" data-media-key="${key}"></label><button class="btn btn-dark reset-media" data-media-kind="fixed" data-media-key="${key}">Вернуть исходное</button></div></div></div>`).join('');html+='</div></div><div class="media-section"><h3>Фотографии тренеров</h3><div class="media-library-grid">';html+=tr.map((t,i)=>`<div class="media-library-card"><img src="../${esc(t.image||'images/treners/rushania.png')}" alt=""><div class="media-library-info"><strong>${esc(t.name||`Тренер ${i+1}`)}</strong><span>${esc(t.image||'images/treners/rushania.png')}</span><div class="inline-actions"><label class="upload-btn">Заменить<input type="file" accept="image/*" data-media-kind="trainer" data-media-index="${i}"></label><button class="btn btn-dark reset-media" data-media-kind="trainer" data-media-index="${i}">Вернуть исходное</button></div></div></div>`).join('');html+='</div></div><div class="media-section"><h3>Фотографии услуг</h3><div class="media-library-grid">';html+=(state.data.services||[]).map((s,i)=>{const mm=state.serviceMeta[i]||{};const img=mm.image||s.image||`images/services/${i===0?'individual':'group'}.png`;return `<div class="media-library-card"><img src="../${esc(img)}" alt=""><div class="media-library-info"><strong>${esc(s.title||`Услуга ${i+1}`)}</strong><span>${esc(img)}</span><div class="inline-actions"><label class="upload-btn">Заменить<input type="file" accept="image/*" data-media-kind="service" data-media-index="${i}"></label><button class="btn btn-dark reset-media" data-media-kind="service" data-media-index="${i}">Вернуть исходное</button></div></div></div>`}).join('');html+='</div></div><div class="media-note">Галерея управляется отдельно в разделе «Галерея»: там 6 альбомов и максимум 6 последних фотографий в каждом.</div></div>';$('#editor').innerHTML=html;bindMediaInputs();}
function bindMediaInputs(){document.querySelectorAll('[data-media-kind]').forEach(el=>{if(el.tagName==='INPUT'&&el.type==='file')el.addEventListener('change',async()=>{const f=el.files?.[0];if(!f)return;const prepared=await prepareUploadFile(f);const fd=new FormData();fd.append('image',prepared,prepared.name);fd.append('kind',el.dataset.mediaKind);if(el.dataset.mediaIndex!==undefined)fd.append('index',el.dataset.mediaIndex);if(el.dataset.mediaKey)fd.append('key',el.dataset.mediaKey);try{setStatus('Загрузка изображения…');const r=await api('../api.php?action=mediaUpload',{method:'POST',headers:{'X-CSRF-Token':state.csrf},body:fd});state.data=r.data;state.serviceMeta=r.serviceMeta||state.serviceMeta;render();setStatus('Изображение обновлено ✓',true);}catch(e){setStatus(e.message);}});});document.querySelectorAll('.reset-media').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Вернуть исходное изображение?'))return;try{const body={kind:b.dataset.mediaKind};if(b.dataset.mediaIndex!==undefined)body.index=+b.dataset.mediaIndex;if(b.dataset.mediaKey)body.key=b.dataset.mediaKey;const r=await api('../api.php?action=mediaDelete',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:JSON.stringify(body)});state.data=r.data;state.serviceMeta=r.serviceMeta||state.serviceMeta;render();setStatus('Исходное изображение восстановлено ✓',true);}catch(e){setStatus(e.message);}}));}

function renderGallery(){
  $('#editor').innerHTML=`<div class="gallery-help"><strong>Как это работает:</strong> выбираешь нужный альбом → выбираешь несколько фотографий → жмёшь «Загрузить». Названия файлов не важны. На сайте автоматически показываются максимум 6 последних фото в каждом альбоме.</div><div class="album-grid">${state.gallery.map((a,ai)=>`<section class="album-card"><div class="album-top"><div><div class="eyebrow">АЛЬБОМ ${ai+1}</div><h2>${esc(a.title)}</h2><span>${a.photos.length}/6 фото</span></div><div class="album-actions"><button class="btn btn-light rename-album" data-album="${ai}">Переименовать</button><label class="upload-btn">＋ Загрузить фото<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" data-upload-album="${ai}"></label></div></div><div class="photo-grid">${a.photos.map((p,pi)=>`<div class="photo-card"><img src="../${esc(p.path)}" alt="${esc(p.alt||a.title)}" loading="lazy"><div class="photo-meta"><span title="${esc(p.alt||'')}">${esc(p.alt||'Фото')}</span><button class="btn btn-light edit-photo" data-album="${ai}" data-photo="${pi}">Изменить</button><button class="btn btn-danger delete-photo" data-album="${ai}" data-photo="${pi}">Удалить</button></div></div>`).join('')||'<div class="empty-photo">В альбоме пока нет фотографий.</div>'}</div></section>`).join('')}</div>`;
  document.querySelectorAll('[data-upload-album]').forEach(input=>input.addEventListener('change',async e=>{const files=[...e.target.files];if(!files.length)return;let uploaded=0;try{for(const file of files){setStatus(`Загрузка ${uploaded+1} из ${files.length}: ${file.name}`);const prepared=await prepareUploadFile(file);const fd=new FormData();fd.append('album',e.target.dataset.uploadAlbum);fd.append('images[]',prepared,prepared.name);const r=await api('../api.php?action=uploadGallery',{method:'POST',headers:{'X-CSRF-Token':state.csrf},body:fd});state.gallery=r.gallery;uploaded+=r.added.length;}renderGallery();setStatus(`Готово: загружено ${uploaded}. В альбоме хранится максимум 6.`,true);}catch(err){renderGallery();setStatus(`Загрузка остановлена: ${err.message}`);}}));
  document.querySelectorAll('.edit-photo').forEach(b=>b.addEventListener('click',async e=>{const album=+e.currentTarget.dataset.album,photo=+e.currentTarget.dataset.photo;const p=state.gallery[album]?.photos?.[photo];if(!p)return;const alt=prompt('Описание / ALT фотографии:',p.alt||'');if(alt===null)return;const caption=prompt('Подпись под фотографией:',p.caption||'');if(caption===null)return;try{const r=await api('../api.php?action=galleryEditPhoto',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:JSON.stringify({album,photo,alt,caption})});state.gallery=r.gallery;renderGallery();setStatus('Данные фотографии сохранены ✓',true);}catch(err){setStatus(err.message);}}));
  document.querySelectorAll('.delete-photo').forEach(b=>b.addEventListener('click',async e=>{const album=+e.currentTarget.dataset.album,photo=+e.currentTarget.dataset.photo;if(!confirm('Удалить это фото из альбома? Исходные фотографии сайта не затрагиваются.'))return;try{const r=await api('../api.php?action=galleryDeletePhoto',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:JSON.stringify({album,photo})});state.gallery=r.gallery;renderGallery();setStatus('Фото удалено.',true);}catch(err){setStatus(err.message);}}));
  document.querySelectorAll('.rename-album').forEach(b=>b.addEventListener('click',async e=>{const album=+e.currentTarget.dataset.album;const title=prompt('Название альбома:',state.gallery[album].title);if(title===null)return;try{const r=await api('../api.php?action=galleryRename',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:JSON.stringify({album,title})});state.gallery=r.gallery;renderGallery();setStatus('Название сохранено.',true);}catch(err){setStatus(err.message);}}));
}
function bindDelete(){document.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.del,i=+b.dataset.i;if(!confirm('Удалить этот элемент?'))return;if(k==='schedule')state.data.schedule.splice(i,1);else {state.data[k].splice(i,1); if(k==='services') state.serviceMeta.splice(i,1);} render();}));}
function bindCommonList(){bindDataInputs();addButtons();bindDelete();}
function render(){if(!state.data)return;const f={hero:renderHero,trainers:renderTrainers,services:renderServices,schedule:renderSchedule,gallery:renderGallery,events:renderEvents,contacts:renderContacts,texts:renderTexts,media:renderMedia}[state.tab];if(f)f();}

async function boot(){
  try{const r=await api('../api.php?action=admin');state.data=r.data;state.gallery=r.gallery;state.serviceMeta=r.serviceMeta||[];state.csrf=r.csrf;showAdmin();}
  catch(e){$('#loginView').classList.remove('hidden');try{const probe=await fetch('../api.php?action=publicGallery',{cache:'no-store'});if(probe.ok){const t=await probe.text();if(t.trim().startsWith('{')){} } }catch{};
    $('#setupHint').classList.remove('hidden'); $('#setupHint').innerHTML=`Админка не настроена? Откройте <a href="../install.php">install.php</a>.`;
  }
}
function showAdmin(){$('#loginView').classList.add('hidden');$('#adminView').classList.remove('hidden');selectTab('gallery');}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();$('#loginError').textContent='';try{const r=await api('../api.php?action=login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#loginPassword').value})});state.csrf=r.csrf;const d=await api('../api.php?action=admin');state.data=d.data;state.gallery=d.gallery;state.serviceMeta=d.serviceMeta||[];state.csrf=d.csrf;showAdmin();}catch(err){$('#loginError').textContent=err.message;}});
$('#logoutBtn').addEventListener('click',async()=>{await api('../api.php?action=logout',{method:'POST'}).catch(()=>{});location.reload();});
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
function selectTab(tab){state.tab=tab;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#tabTitle').textContent={hero:'Главная',trainers:'Тренеры',services:'Услуги',schedule:'Расписание',gallery:'Галерея',events:'Мероприятия',contacts:'Контакты',texts:'Все тексты',media:'Все фотографии'}[tab];$('#tabSubtitle').textContent=tab==='gallery'?'Каждый альбом хранит только 6 последних фотографий.':'Изменения сохраняются в один клик.';render();}
$('#saveBtn').addEventListener('click',async()=>{try{state.data.services=(state.data.services||[]).map(s=>{const copy={...s};delete copy.featuresText;return copy;});const r=await api('../api.php?action=save',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:JSON.stringify(state.data)});if(state.serviceMeta)await api('../api.php?action=serviceMetaSave',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:JSON.stringify(state.serviceMeta)});if(r.ok){notifySiteUpdated();setStatus('Изменения сохранены ✓',true);}}catch(e){setStatus(e.message);}});
boot();

/* ============================================================
   ДОПОЛНЕНИЕ: корректное редактирование подписи кнопки Excel.
   Разрешает сохранить пустую строку без возврата старого текста.
   ============================================================ */
(() => {
    const originalSaveButtonHandlerGuard = true;
    /* Ничего не переопределяем: сохранение state.data.static.schedule.download
       уже реализовано через data-path. Этот блок оставлен как совместимый marker,
       чтобы дополнительные CMS-слои не возвращали значение по умолчанию. */
    void originalSaveButtonHandlerGuard;
})();


/* ============================================================
   ADD-ONLY PATCH: ДИНАМИЧЕСКОЕ РАСПИСАНИЕ ПО СПИСКУ ТРЕНЕРОВ
   Тренер в расписании всегда проверяется по данным state.data.trainers.
   Можно вводить полное имя, имя или фамилию. Новая таблица на сайте
   появляется только для реально существующего тренера из списка «Тренеры».
   ============================================================ */
(() => {
  'use strict';

  const norm = value => String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const dayMap = new Map([
    ['пн',0],['понедельник',0],['вт',1],['вторник',1],
    ['ср',2],['среда',2],['чт',3],['четверг',3],
    ['пт',4],['пятница',4],['сб',5],['суббота',5],
    ['вс',6],['воскресенье',6]
  ]);
  const dayCanonical = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  function trainerEntries() {
    const trainers = Array.isArray(state?.data?.trainers) ? state.data.trainers : [];
    return trainers.map((trainer, index) => {
      const full = String(trainer?.name ?? '').trim();
      const parts = norm(full).split(' ').filter(Boolean);
      return {
        index,
        full,
        normFull: norm(full),
        first: parts[0] || '',
        last: parts.length > 1 ? parts[parts.length - 1] : parts[0] || '',
        tokens: new Set(parts)
      };
    }).filter(x => x.full);
  }

  function resolveTrainer(value) {
    const raw = norm(value);
    if (!raw) return {ok:false, reason:'empty'};
    const entries = trainerEntries();
    const exact = entries.filter(e => e.normFull === raw);
    if (exact.length === 1) return {ok:true, entry:exact[0]};

    const tokenMatches = entries.filter(e => e.first === raw || e.last === raw);
    if (tokenMatches.length === 1) return {ok:true, entry:tokenMatches[0]};
    if (tokenMatches.length > 1) return {ok:false, reason:'ambiguous', matches:tokenMatches};
    return {ok:false, reason:'not_found'};
  }

  function normalizeDay(value) {
    const key = norm(value);
    const index = dayMap.get(key);
    return index == null ? '' : dayCanonical[index];
  }

  function timeValue(value) {
    const m = String(value ?? '').match(/(\d{1,2})\s*:\s*(\d{2})/);
    return m ? (+m[1] * 60 + +m[2]) : 9999;
  }

  function normalizeScheduleState() {
    if (!Array.isArray(state?.data?.schedule)) return {ok:true, changed:false};
    let changed = false;
    let invalid = null;

    const normalized = state.data.schedule.map((row, index) => {
      if (!Array.isArray(row)) return row;
      const copy = row.slice();
      const day = normalizeDay(copy[0]);
      if (!day) invalid ??= {index, reason:'day', value:String(copy[0] ?? '')};
      else if (copy[0] !== day) { copy[0] = day; changed = true; }

      const trainerResult = resolveTrainer(copy[3]);
      if (trainerResult.ok) {
        if (copy[3] !== trainerResult.entry.full) { copy[3] = trainerResult.entry.full; changed = true; }
      } else if (String(copy[3] ?? '').trim()) {
        if (!invalid) invalid = {index, reason:trainerResult.reason, value:String(copy[3] ?? '').trim(), matches:trainerResult.matches};
      } else if (!invalid) {
        invalid = {index, reason:'empty', value:''};
      }
      return copy;
    });

    normalized.sort((a,b) => {
      const da = dayMap.get(norm(a?.[0])) ?? 99;
      const db = dayMap.get(norm(b?.[0])) ?? 99;
      if (da !== db) return da - db;
      const ta = timeValue(a?.[1]);
      const tb = timeValue(b?.[1]);
      if (ta !== tb) return ta - tb;
      return String(a?.[3] ?? '').localeCompare(String(b?.[3] ?? ''), 'ru');
    });

    const before = JSON.stringify(state.data.schedule);
    const after = JSON.stringify(normalized);
    if (before !== after) {
      state.data.schedule = normalized;
      changed = true;
    }
    return {ok:!invalid, changed, invalid};
  }

  function addTrainerChooser() {
    if (state?.tab !== 'schedule') return;
    const panel = document.querySelector('#editor .panel');
    const addButton = panel?.querySelector('[data-add="schedule"]');
    if (!panel || !addButton) return;

    let box = panel.querySelector('.schedule-trainer-chooser');
    if (!box) {
      box = document.createElement('div');
      box.className = 'schedule-trainer-chooser';
      panel.insertBefore(box, addButton);
    }

    const entries = trainerEntries();
    const previous = window.__scheduleSelectedTrainerFull || '';
    const signature = entries.map(entry => entry.full).join('||');

    // ВАЖНО: MutationObserver следит за #editor. Раньше каждый его вызов
    // заново записывал box.innerHTML, из-за чего список тренеров постоянно
    // пересоздавался и выпадающее меню закрывалось сразу после открытия.
    // Теперь перерисовываем селект только если сам список тренеров изменился
    // или если блок ещё ни разу не был создан.
    if (box.dataset.trainerSignature !== signature || !box.querySelector('#scheduleAddTrainer')) {
      box.innerHTML = `
        <label>
          Добавлять новую строку для
          <select id="scheduleAddTrainer">
            ${entries.map(entry => `<option value="${esc(entry.full)}">${esc(entry.full)}</option>`).join('')}
          </select>
        </label>
        <span>Выбирается только тренер из раздела «Тренеры». В строке можно указать имя или фамилию.</span>
      `;
      box.dataset.trainerSignature = signature;
    }

    const select = box.querySelector('#scheduleAddTrainer');
    if (!select) return;
    if (previous && entries.some(e => e.full === previous)) {
      select.value = previous;
    } else if (!select.value && entries[0]) {
      select.value = entries[0].full;
    }
    window.__scheduleSelectedTrainerFull = select.value || entries[0]?.full || '';

    if (select.dataset.bound !== '1') {
      select.dataset.bound = '1';
      select.addEventListener('change', () => {
        window.__scheduleSelectedTrainerFull = select.value;
      });
    }
  }

  function decorateTrainerInputs() {
    if (state?.tab !== 'schedule') return;
    const entries = trainerEntries();
    let datalist = document.getElementById('scheduleTrainerNames');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'scheduleTrainerNames';
      document.body.appendChild(datalist);
    }
    const values = new Set();
    entries.forEach(entry => {
      values.add(entry.full);
      if (entry.first) values.add(entry.first);
      if (entry.last) values.add(entry.last);
    });
    datalist.innerHTML = Array.from(values).map(v => `<option value="${esc(v)}"></option>`).join('');

    document.querySelectorAll('#editor tr[data-i] input[data-s="3"]').forEach(input => {
      input.setAttribute('list','scheduleTrainerNames');
      input.setAttribute('placeholder','Имя или фамилия');
      input.setAttribute('autocomplete','off');
      if (input.dataset.dynamicCoachBound === '1') return;
      input.dataset.dynamicCoachBound = '1';
      const apply = () => {
        const result = resolveTrainer(input.value);
        if (!result.ok) return;
        input.value = result.entry.full;
        const tr = input.closest('tr');
        const index = Number(tr?.dataset.i);
        if (Number.isInteger(index) && state?.data?.schedule?.[index]) {
          state.data.schedule[index][3] = result.entry.full;
        }
      };
      input.addEventListener('blur', apply);
      input.addEventListener('change', apply);
    });
  }

  function patchAfterRender() {
    if (state?.tab !== 'schedule') return;
    addTrainerChooser();
    decorateTrainerInputs();
  }

  const editor = document.getElementById('editor');
  if (editor) {
    const observer = new MutationObserver(() => {
      clearTimeout(window.__dynamicScheduleAdminTimer);
      window.__dynamicScheduleAdminTimer = setTimeout(patchAfterRender, 0);
    });
    observer.observe(editor, {childList:true, subtree:true});
  }

  // Безопасное добавление строки. Не пытаемся угадывать «последнюю» строку
  // после сортировки: сразу создаём новую запись с выбранным тренером.
  // Это исключает ситуацию, когда после добавления одна строка получает не того
  // тренера, а последующая нормализация визуально смешивает блоки расписания.
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-add="schedule"]');
    if (!button || state?.tab !== 'schedule') return;

    event.preventDefault();
    event.stopPropagation();

    const entries = trainerEntries();
    const selected = window.__scheduleSelectedTrainerFull || entries[0]?.full || '';
    if (!selected) {
      setStatus('Сначала добавьте хотя бы одного тренера во вкладке «Тренеры».');
      return;
    }

    if (!Array.isArray(state?.data?.schedule)) state.data.schedule = [];
    state.data.schedule.push(['Пн', '10:00 – 11:00', 'Новая группа', selected, 'mix']);

    const result = normalizeScheduleState();
    renderSchedule();

    if (!result.ok) {
      const bad = result.invalid?.value || 'неизвестный тренер';
      setStatus(`Ошибка: тренер «${bad}» отсутствует в разделе «Тренеры». Сначала добавьте его там.`);
    }

    setTimeout(patchAfterRender, 0);
  }, false);

  // Перед основным сохранением: ни одной строки с несуществующим тренером.
  const saveButton = document.getElementById('saveBtn');
  if (saveButton) {
    saveButton.addEventListener('click', event => {
      const result = normalizeScheduleState();
      if (!result.ok) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const bad = result.invalid?.value || 'пустое значение';
        let hint = `Ошибка: тренер «${bad}» не найден. Добавьте тренера во вкладке «Тренеры», затем укажите его имя или фамилию.`;
        if (result.invalid?.reason === 'ambiguous') hint = `Ошибка: значение «${bad}» совпадает с несколькими тренерами. Укажите полное имя и фамилию.`;
        setStatus(hint);
        renderSchedule();
        setTimeout(patchAfterRender, 0);
        return;
      }
    }, true);
  }

  const initial = () => {
    try { normalizeScheduleState(); } catch {}
    setTimeout(patchAfterRender, 50);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initial, {once:true});
  else initial();
})();

/* ============================================================
   ADD-ONLY PATCH: АВТОСОХРАНЕНИЕ АДМИН-ПАНЕЛИ
   Все изменения полей сохраняются автоматически с задержкой.
   Кнопка «Сохранить» остаётся как ручной резерв.
   ============================================================ */
(() => {
  'use strict';

  const AUTOSAVE_DELAY = 300;
  let timer = 0;
  let saving = false;
  let pending = false;

  function autoStatus(message, good = false) {
    const e = document.getElementById('saveStatus');
    if (!e) return;
    e.textContent = message;
    e.className = 'status ' + (good ? 'good' : '');
  }

  function scheduleAutoSave() {
    pending = true;
    clearTimeout(timer);
    timer = setTimeout(runAutoSave, AUTOSAVE_DELAY);
    autoStatus('Автосохранение…');
  }

  async function runAutoSave() {
    if (!pending || !state.data || saving) return;
    pending = false;

    try {
      if (typeof normalizeScheduleState === 'function') {
        const result = normalizeScheduleState();
        if (!result.ok) {
          const bad = result.invalid?.value || 'пустое значение';
          let hint = `Ошибка автосохранения: тренер «${bad}» не найден. Добавьте тренера во вкладке «Тренеры».`;
          if (result.invalid?.reason === 'ambiguous') {
            hint = `Ошибка автосохранения: «${bad}» совпадает с несколькими тренерами. Укажите полное имя и фамилию.`;
          }
          autoStatus(hint, false);
          return;
        }
      }

      saving = true;
      autoStatus('Автосохранение…');

      const payload = JSON.parse(JSON.stringify(state.data));
      payload.services = (payload.services || []).map(s => {
        const copy = {...s};
        delete copy.featuresText;
        return copy;
      });

      const r = await api('../api.php?action=save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': state.csrf
        },
        body: JSON.stringify(payload)
      });

      if (state.serviceMeta) {
        await api('../api.php?action=serviceMetaSave', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': state.csrf
          },
          body: JSON.stringify(state.serviceMeta)
        });
      }

      if (r?.ok) { notifySiteUpdated(); autoStatus('Автосохранение выполнено ✓', true); }
      else autoStatus('Автосохранение не подтверждено', false);
    } catch (error) {
      pending = true;
      autoStatus(`Автосохранение не удалось: ${error.message}`, false);
    } finally {
      saving = false;
    }
  }

  function markChanged() {
    if (!state.data) return;
    scheduleAutoSave();
  }

  const editor = document.getElementById('editor');
  if (editor) {
    editor.addEventListener('input', markChanged, true);
    editor.addEventListener('change', markChanged, true);

    editor.addEventListener('click', event => {
      if (event.target.closest('[data-add]') || event.target.closest('[data-del]')) {
        setTimeout(markChanged, 120);
      }
    }, true);
  }

  const tabs = document.getElementById('tabs');
  if (tabs) {
    tabs.addEventListener('click', () => {
      if (pending) {
        clearTimeout(timer);
        runAutoSave();
      }
    }, true);
  }

  const saveButton = document.getElementById('saveBtn');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      clearTimeout(timer);
      pending = false;
    }, true);
  }

  window.__belkaAutoSave = {
    schedule: scheduleAutoSave,
    saveNow: runAutoSave
  };
})();

/* ============================================================
   ADD-ONLY PATCH: РАСПИСАНИЕ В АДМИНКЕ ПО ТРЕНЕРАМ
   Каждый тренер получает отдельный блок со своим расписанием.
   ============================================================ */
(() => {
  'use strict';

  const dayOrder = new Map([
    ['пн', 0], ['понедельник', 0], ['вт', 1], ['вторник', 1],
    ['ср', 2], ['среда', 2], ['чт', 3], ['четверг', 3],
    ['пт', 4], ['пятница', 4], ['сб', 5], ['суббота', 5],
    ['вс', 6], ['воскресенье', 6]
  ]);
  const norm = value => String(value ?? '')
    .trim().toLowerCase().replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9]+/gi, ' ').replace(/\s+/g, ' ').trim();
  const dayValue = value => dayOrder.get(norm(value)) ?? 99;
  const timeValue = value => {
    const m = String(value ?? '').match(/(\d{1,2})\s*:\s*(\d{2})/);
    return m ? (+m[1] * 60 + +m[2]) : 9999;
  };

  function trainerList() {
    return (Array.isArray(state?.data?.trainers) ? state.data.trainers : [])
      .map((t, index) => ({
        index,
        name: String(t?.name ?? '').trim(),
        spec: String(t?.spec ?? 'Тренер').trim() || 'Тренер'
      }))
      .filter(t => t.name);
  }

  function resolveTrainerName(value, trainers) {
    const raw = norm(value);
    if (!raw) return null;
    const exact = trainers.filter(t => norm(t.name) === raw);
    if (exact.length === 1) return exact[0];

    const matches = trainers.filter(t => {
      const parts = norm(t.name).split(' ').filter(Boolean);
      const first = parts[0] || '';
      const last = parts[parts.length - 1] || first;
      return raw === first || raw === last;
    });
    return matches.length === 1 ? matches[0] : null;
  }

  function renderScheduleGrouped() {
    const rows = Array.isArray(state?.data?.schedule) ? state.data.schedule : [];
    const trainers = trainerList();
    const grouped = new Map(trainers.map(t => [norm(t.name), []]));

    rows.forEach((row, index) => {
      if (!Array.isArray(row)) return;
      const trainer = resolveTrainerName(row[3], trainers);
      if (!trainer) return;
      // Показываем строку в блоке реального тренера, даже если в старых данных
      // сохранено только имя или фамилия вместо полного ФИО.
      const target = grouped.get(norm(trainer.name));
      if (target) target.push({ row, index });
    });

    grouped.forEach(list => list.sort((a, b) => {
      const d = dayValue(a.row?.[0]) - dayValue(b.row?.[0]);
      if (d) return d;
      const t = timeValue(a.row?.[1]) - timeValue(b.row?.[1]);
      if (t) return t;
      return String(a.row?.[2] ?? '').localeCompare(String(b.row?.[2] ?? ''), 'ru');
    }));

    const typeOptions = ['kids','junior','senior','mix','prep'];
    const blocks = trainers.map(trainer => {
      const list = grouped.get(norm(trainer.name)) || [];
      const body = list.length ? list.map(({row, index}) => `
        <tr data-i="${index}">
          <td><input data-s="0" value="${esc(row[0])}" placeholder="Пн"></td>
          <td><input data-s="1" value="${esc(row[1])}" placeholder="09:00 – 10:00"></td>
          <td><input data-s="2" value="${esc(row[2])}" placeholder="Название группы"></td>
          <td><select data-s="4">${typeOptions.map(o => `<option value="${o}" ${row[4] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></td>
          <td><button class="btn btn-danger" type="button" data-del="schedule" data-i="${index}">×</button></td>
        </tr>`).join('') : `
        <tr><td colspan="5" class="schedule-empty-row">У этого тренера пока нет занятий.</td></tr>`;

      return `<section class="admin-schedule-trainer" data-trainer="${esc(trainer.name)}">
        <div class="admin-schedule-trainer-head">
          <div><div class="admin-schedule-trainer-name">${esc(trainer.name)}</div><div class="admin-schedule-trainer-spec">${esc(trainer.spec)}</div></div>
          <span class="admin-schedule-count">${list.length} ${list.length === 1 ? 'занятие' : (list.length >= 2 && list.length <= 4 ? 'занятия' : 'занятий')}</span>
        </div>
        <div class="table-wrap admin-schedule-table-wrap">
          <table class="admin-schedule-table">
            <thead><tr><th>День</th><th>Время</th><th>Группа</th><th>Тип</th><th></th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </section>`;
    }).join('');

    $('#editor').innerHTML = `<div class="panel admin-schedule-panel">
      <div class="admin-schedule-intro">
        <div><strong>Расписание по тренерам</strong><span>Каждый блок ниже относится только к одному тренеру. Новые строки добавляются в выбранный блок после проверки по списку «Тренеры».</span></div>
      </div>
      <div class="admin-schedule-trainers-list">${blocks || '<div class="schedule-empty">Сначала добавьте хотя бы одного тренера во вкладке «Тренеры».</div>'}</div>
      <button type="button" class="btn btn-light" data-add="schedule">＋ Добавить строку</button>
    </div>`;

    document.querySelectorAll('#editor .admin-schedule-table tr[data-i] [data-s]').forEach(el => {
      const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(eventName, () => {
        const tr = el.closest('tr');
        const index = Number(tr?.dataset.i);
        if (!Number.isInteger(index) || !state?.data?.schedule?.[index]) return;
        state.data.schedule[index][Number(el.dataset.s)] = el.type === 'checkbox' ? el.checked : el.value;
      });
    });

    if (typeof bindDelete === 'function') bindDelete();
  }

  // Переназначаем только отрисовку раздела «Расписание». Остальная CMS-логика не меняется.
  window.renderSchedule = renderScheduleGrouped;

  // render() обращается к глобальной функции renderSchedule по имени; синхронизируем привязку.
  try { renderSchedule = renderScheduleGrouped; } catch (_) {}

  // Перерисовать блок после загрузки, если пользователь уже открыл расписание.
  if (state?.tab === 'schedule') {
    setTimeout(renderScheduleGrouped, 0);
  }
})();

/* ============================================================
   ADD-ONLY PATCH: ТЕМА АДМИН-ПАНЕЛИ = ТЕМА ПОЛЬЗОВАТЕЛЬСКОГО САЙТА
   Используется тот же localStorage key: belka-theme.
   ============================================================ */
(() => {
  'use strict';
  const body = document.body;
  const toggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('belka-theme');
  if (savedTheme === 'dark') body.classList.add('dark-theme');
  else body.classList.remove('dark-theme');

  if (toggle) {
    toggle.addEventListener('click', () => {
      body.classList.toggle('dark-theme');
      localStorage.setItem('belka-theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
  }
})();


/* ============================================================
   ADD-ONLY PATCH: ЕДИНЫЙ СЧЁТЧИК РАСПИСАНИЯ
   Админка и пользовательский сайт используют один storage/site.json.
   ============================================================ */
(() => {
  'use strict';
  function decorateAdminScheduleTotal() {
    if (typeof state === 'undefined' || state?.tab !== 'schedule') return;
    const panel = document.querySelector('#editor .admin-schedule-panel');
    if (!panel) return;
    const rows = Array.isArray(state?.data?.schedule) ? state.data.schedule : [];
    const trainers = Array.isArray(state?.data?.trainers) ? state.data.trainers : [];
    let total = panel.querySelector('.admin-schedule-total');
    if (!total) {
      total = document.createElement('div');
      total.className = 'admin-schedule-total';
      const intro = panel.querySelector('.admin-schedule-intro');
      if (intro) intro.appendChild(total); else panel.prepend(total);
    }
    const counts = new Map();
    trainers.forEach(t => counts.set(String(t?.name || ''), 0));
    const norm = v => String(v ?? '').toLowerCase().replace(/ё/g,'е').trim().replace(/\s+/g,' ');
    const entries = trainers.map(t => {
      const full = String(t?.name || '').trim();
      const p = norm(full).split(' ').filter(Boolean);
      return {full,norm:norm(full),first:p[0]||'',last:p[p.length-1]||p[0]||''};
    });
    rows.forEach(r => {
      const raw = norm(r?.[3]);
      const exact = entries.find(e => e.norm === raw);
      const m = exact || entries.find(e => e.first === raw || e.last === raw);
      if (m) counts.set(m.full, (counts.get(m.full)||0)+1);
    });
    const parts = entries.map(e => `${e.full}: ${counts.get(e.full)||0}`).join(' · ');
    total.textContent = `Всего занятий: ${rows.length}${parts ? ' — ' + parts : ''}`;
  }
  const originalRender = window.renderSchedule;
  if (typeof originalRender === 'function') {
    window.renderSchedule = function() { originalRender(); requestAnimationFrame(decorateAdminScheduleTotal); };
    try { renderSchedule = window.renderSchedule; } catch (_) {}
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(decorateAdminScheduleTotal, 50), {once:true});
  document.addEventListener('input', () => { if (typeof state !== 'undefined' && state?.tab === 'schedule') decorateAdminScheduleTotal(); }, {capture:true});
  document.addEventListener('change', () => { if (typeof state !== 'undefined' && state?.tab === 'schedule') decorateAdminScheduleTotal(); }, {capture:true});
  window.addEventListener('belka:schedule-saved', () => setTimeout(decorateAdminScheduleTotal, 50));
})();

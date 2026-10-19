const state = {data:null, csrf:'', tab:'hero'};
const $ = (s)=>document.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const htmlAttr = esc;

async function api(url, options={}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(()=>({ok:false,error:'Некорректный ответ сервера'}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}
function setStatus(msg, good=false){ $('#saveStatus').textContent=msg; $('#saveStatus').style.color=good?'#2f9e44':'#ff6a00'; }

async function uploadImage(file){
  const fd=new FormData();
  fd.append('image',file);
  const r=await fetch('../api.php?action=upload',{
    method:'POST',
    headers:{'X-CSRF-Token':state.csrf},
    body:fd
  });
  const data=await r.json().catch(()=>({ok:false,error:'Некорректный ответ сервера'}));
  if(!r.ok || !data.ok) throw new Error(data.error||'Ошибка загрузки');
  return data.path;
}

async function boot(){
  try{
    const r = await api('../api.php?action=admin');
    state.data=r.data; state.csrf=r.csrf;
    showAdmin();
  }catch(e){
    $('#loginView').classList.remove('hidden');
  }
}

function showAdmin(){
  $('#loginView').classList.add('hidden');
  $('#adminView').classList.remove('hidden');
  selectTab('hero');
}

$('#loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  $('#loginError').textContent='';
  try{
    const r=await api('../api.php?action=login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:$('#loginPassword').value})
    });
    state.csrf=r.csrf;
    const d=await api('../api.php?action=admin');
    state.data=d.data; state.csrf=d.csrf;
    showAdmin();
  }catch(err){ $('#loginError').textContent=err.message; }
});

$('#logoutBtn').addEventListener('click', async ()=>{
  await api('../api.php?action=logout',{method:'POST'}).catch(()=>{});
  location.reload();
});

document.querySelectorAll('#tabs button').forEach(btn=>{
  btn.addEventListener('click',()=>selectTab(btn.dataset.tab));
});
function selectTab(tab){
  state.tab=tab;
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  $('#tabTitle').textContent={
    hero:'Главная',trainers:'Тренеры',services:'Услуги',schedule:'Расписание',
    gallery:'Галерея',events:'Мероприятия',contacts:'Контакты'
  }[tab];
  render();
}

function addListButton(label,onClick){return `<button type="button" class="btn btn-light add-btn">${label}</button>`}
function textField(label,path,value,cls=''){
  return `<label>${label}<input class="${cls}" data-path="${path}" value="${htmlAttr(value??'')}"></label>`;
}
function areaField(label,path,value){
  return `<label>${label}<textarea data-path="${path}">${esc(value??'')}</textarea></label>`;
}
function uploadRow(targetSelector){
  return `<div class="muted">Фото можно указать путём <code>images/...</code> или загрузить через кнопку.</div>`;
}

function renderHero(){
  const h=state.data.hero||{};
  $('#editor').innerHTML=`<div class="panel">
   <div class="grid2">
    ${textField('Первая строка', 'hero.titleOrange1', h.titleOrange1)}
    ${textField('Вторая строка', 'hero.titleOrange2', h.titleOrange2)}
    ${textField('Третья строка', 'hero.titleWhite', h.titleWhite)}
    ${textField('Подзаголовок','hero.subtitle',h.subtitle)}
    ${textField('Текст кнопки','hero.cta',h.cta)}
    ${textField('Слоган 1','hero.tagline.0',(h.tagline||[])[0])}
    ${textField('Слоган 2','hero.tagline.1',(h.tagline||[])[1])}
    ${textField('Слоган 3','hero.tagline.2',(h.tagline||[])[2])}
   </div>
  </div>`;
}

function renderTrainers(){
 const list=state.data.trainers||[];
 $('#editor').innerHTML=`<div class="panel">${list.map((x,i)=>`
  <div class="item-card trainer-item" data-index="${i}">
   <div class="item-head"><h3>${esc(x.name||'Новый тренер')}</h3><div class="row-actions"><button class="btn btn-danger delete-trainer">Удалить</button></div></div>
   <div class="grid2">
    ${textField('Имя','name',x.name)}
    ${textField('Должность','spec',x.spec)}
    ${textField('Эмодзи/заполнитель','photo',x.photo)}
    ${textField('Путь к фото','image',x.image)}
    <div><label>Загрузить фото<input type="file" class="upload-trainer" accept="image/jpeg,image/png,image/webp,image/gif"></label><div class="muted">После загрузки путь заполнится автоматически.</div></div>
   </div>
   ${areaField('Описание','desc',x.desc)}
   <label class="check"><input type="checkbox" class="senior" ${x.senior?'checked':''}> Показывать плашку «Старший тренер»</label>
  </div>`).join('')}
  ${addListButton('＋ Добавить тренера')}
 </div>`;
 document.querySelector('.add-btn').addEventListener('click',()=>{state.data.trainers.push({name:'Новый тренер',spec:'Тренер',photo:'⭐',image:'',desc:'',senior:false});render();});
 document.querySelectorAll('.delete-trainer').forEach(btn=>btn.addEventListener('click',e=>{
   state.data.trainers.splice(+e.target.closest('.trainer-item').dataset.index,1); render();
 }));
 bindItemInputs('.trainer-item',(item,i)=>{
   const t=state.data.trainers[i];
   item.querySelectorAll('[data-path]').forEach(inp=>setNested(t,inp.dataset.path,inp.value));
   t.senior=item.querySelector('.senior').checked;
 });
 document.querySelectorAll('.upload-trainer').forEach(inp=>inp.addEventListener('change',async e=>{
   const item=e.target.closest('.trainer-item'), i=+item.dataset.index, file=e.target.files[0];
   if(!file) return;
   try{
     setStatus('Загрузка фото…');
     state.data.trainers[i].image=await uploadImage(file);
     render();
     setStatus('Фото загружено. Нажмите «Сохранить».',true);
   }catch(err){ setStatus(err.message,false); }
 }));
}

function renderServices(){
 const list=state.data.services||[];
 $('#editor').innerHTML=`<div class="panel">${list.map((x,i)=>`
  <div class="item-card service-item" data-index="${i}">
   <div class="item-head"><h3>${esc(x.title||'Новая услуга')}</h3><button class="btn btn-danger delete-service">Удалить</button></div>
   <div class="grid2">${textField('Иконка','icon',x.icon)}${textField('Название','title',x.title)}${textField('Стоимость','price',x.price)}</div>
   ${areaField('Описание','intro',x.intro)}
   ${areaField('Пункты (каждый с новой строки)','features', (x.features||[]).join('\n'))}
  </div>`).join('')}${addListButton('＋ Добавить услугу')}</div>`;
 document.querySelector('.add-btn').addEventListener('click',()=>{state.data.services.push({icon:'🎯',title:'Новая услуга',intro:'',features:[],price:''});render();});
 document.querySelectorAll('.delete-service').forEach(btn=>btn.addEventListener('click',e=>{state.data.services.splice(+e.target.closest('.service-item').dataset.index,1);render();}));
 bindItemInputs('.service-item',(item,i)=>{
   const t=state.data.services[i];
   t.icon=item.querySelector('[data-path="icon"]').value;
   t.title=item.querySelector('[data-path="title"]').value;
   t.price=item.querySelector('[data-path="price"]').value;
   t.intro=item.querySelector('[data-path="intro"]').value;
   t.features=item.querySelector('[data-path="features"]').value.split('\n').map(s=>s.trim()).filter(Boolean);
 });
}

function renderSchedule(){
 const rows=state.data.schedule||[];
 const opts=['kids','junior','senior','mix','prep'];
 $('#editor').innerHTML=`<div class="panel">
  <div class="table-wrap"><table class="schedule-editor"><thead><tr><th>День</th><th>Время</th><th>Группа</th><th>Тренер</th><th>Тип</th><th></th></tr></thead>
  <tbody>${rows.map((r,i)=>`<tr data-index="${i}">
   <td><input class="day" value="${htmlAttr(r[0])}"></td>
   <td><input class="time" value="${htmlAttr(r[1])}"></td>
   <td><input class="group" value="${htmlAttr(r[2])}"></td>
   <td><input class="coach" value="${htmlAttr(r[3])}"></td>
   <td><select class="type">${opts.map(o=>`<option value="${o}" ${r[4]===o?'selected':''}>${o}</option>`).join('')}</select></td>
   <td><button class="btn btn-danger delete-row">×</button></td>
  </tr>`).join('')}</tbody></table></div>
  <div style="margin-top:15px">${addListButton('＋ Добавить строку')}</div>
 </div>`;
 document.querySelector('.add-btn').addEventListener('click',()=>{state.data.schedule.push(['Пн','10:00 – 11:00','Новая группа','Тренер','mix']);render();});
 document.querySelectorAll('.delete-row').forEach(btn=>btn.addEventListener('click',e=>{state.data.schedule.splice(+e.target.closest('tr').dataset.index,1);render();}));
 document.querySelectorAll('tbody tr').forEach(tr=>{
   tr.querySelectorAll('input,select').forEach(inp=>inp.addEventListener('input',syncSchedule));
   tr.querySelectorAll('select').forEach(inp=>inp.addEventListener('change',syncSchedule));
 });
}
function syncSchedule(){
 document.querySelectorAll('.schedule-editor tbody tr').forEach(tr=>{
   const i=+tr.dataset.index;
   state.data.schedule[i]=[
     tr.querySelector('.day').value,tr.querySelector('.time').value,tr.querySelector('.group').value,
     tr.querySelector('.coach').value,tr.querySelector('.type').value
   ];
 });
}

function renderGallery(){
 const list=state.data.gallery||[];
 $('#editor').innerHTML=`<div class="panel">${list.map((x,i)=>`
  <div class="item-card gallery-item-editor" data-index="${i}">
   <div class="item-head"><h3>Фото ${i+1}</h3><button class="btn btn-danger delete-gallery">Удалить</button></div>
   <div class="grid2">
     <div>${textField('Путь / URL','src',x.src)}<img class="gallery-thumb" src="../${htmlAttr(x.src)}" onerror="this.style.opacity='.2'">
       <label>Загрузить новое фото<input type="file" class="upload-gallery" accept="image/jpeg,image/png,image/webp,image/gif"></label>
     </div>
     <div>${textField('Подпись','caption',x.caption)}${textField('ALT','alt',x.alt)}</div>
   </div>
  </div>`).join('')}${addListButton('＋ Добавить фото')}</div>`;
 document.querySelector('.add-btn').addEventListener('click',()=>{state.data.gallery.push({src:'images/1.jpg',alt:'Новое фото',caption:'Новое фото'});render();});
 document.querySelectorAll('.delete-gallery').forEach(btn=>btn.addEventListener('click',e=>{state.data.gallery.splice(+e.target.closest('.gallery-item-editor').dataset.index,1);render();}));
 bindItemInputs('.gallery-item-editor',(item,i)=>{
   state.data.gallery[i].src=item.querySelector('[data-path="src"]').value;
   state.data.gallery[i].caption=item.querySelector('[data-path="caption"]').value;
   state.data.gallery[i].alt=item.querySelector('[data-path="alt"]').value;
 });
 document.querySelectorAll('.upload-gallery').forEach(inp=>inp.addEventListener('change',async e=>{
   const item=e.target.closest('.gallery-item-editor'), i=+item.dataset.index, file=e.target.files[0];
   if(!file) return;
   try{
     setStatus('Загрузка фото…');
     state.data.gallery[i].src=await uploadImage(file);
     render();
     setStatus('Фото загружено. Нажмите «Сохранить».',true);
   }catch(err){ setStatus(err.message,false); }
 }));
}

function renderEvents(){
 const list=state.data.events||[];
 $('#editor').innerHTML=`<div class="panel">${list.map((x,i)=>`
  <div class="item-card event-item" data-index="${i}">
   <div class="item-head"><h3>${esc(x.title||'Новое мероприятие')}</h3><button class="btn btn-danger delete-event">Удалить</button></div>
   <div class="grid3">
    ${textField('День','day',x.day)}${textField('Месяц','month',x.month)}${textField('Год','year',x.year)}
    ${textField('Плашка','badge',x.badge)}${textField('Место','place',x.place)}${textField('Время','time',x.time)}
   </div>
   ${textField('Название','title',x.title)}
   ${areaField('Описание','desc',x.desc)}
   <label>Тип плашки<select data-path="badgeType"><option value="" ${!x.badgeType?'selected':''}>Обычная</option><option value="soon" ${x.badgeType==='soon'?'selected':''}>Скоро</option></select></label>
  </div>`).join('')}${addListButton('＋ Добавить мероприятие')}</div>`;
 document.querySelector('.add-btn').addEventListener('click',()=>{state.data.events.push({day:'01',month:'Янв',year:'2027',badge:'Скоро',badgeType:'soon',title:'Новое мероприятие',place:'Тюмень',time:'12:00',desc:''});render();});
 document.querySelectorAll('.delete-event').forEach(btn=>btn.addEventListener('click',e=>{state.data.events.splice(+e.target.closest('.event-item').dataset.index,1);render();}));
 bindItemInputs('.event-item',(item,i)=>{
  const t=state.data.events[i];
  ['day','month','year','badge','place','time','title','desc','badgeType'].forEach(k=>t[k]=item.querySelector(`[data-path="${k}"]`).value);
 });
}

function renderContacts(){
 const c=state.data.contacts||{};
 $('#editor').innerHTML=`<div class="panel"><div class="grid2">
  ${textField('Телефон','contacts.phone',c.phone)}
  ${textField('Телефон для tel:','contacts.phoneTel',c.phoneTel)}
  ${textField('Адрес','contacts.address',c.address)}
  ${textField('Площадка','contacts.venue',c.venue)}
  ${textField('Ссылка ВКонтакте','contacts.vk',c.vk)}
  ${textField('Текст ВКонтакте','contacts.vkName',c.vkName)}
  ${textField('Текст для карты','contacts.mapText',c.mapText)}
  ${textField('Текст футера','footer',state.data.footer)}
 </div></div>`;
 document.querySelectorAll('[data-path]').forEach(inp=>{
   inp.addEventListener('input',()=>setNested(state.data,inp.dataset.path,inp.value));
 });
}

function bindItemInputs(selector,fn){
 document.querySelectorAll(selector).forEach(item=>{
  item.querySelectorAll('input,textarea,select').forEach(inp=>{
   inp.addEventListener('input',()=>fn(item,+item.dataset.index));
   inp.addEventListener('change',()=>fn(item,+item.dataset.index));
  });
 });
}
function setNested(obj,path,value){
 const parts=path.split('.');
 let t=obj;
 for(let i=0;i<parts.length-1;i++){
   const p=parts[i];
   if(!(p in t)) t[p]={};
   t=t[p];
 }
 t[parts.at(-1)] = value;
}

function render(){
 if(!state.data)return;
 ({hero:renderHero,trainers:renderTrainers,services:renderServices,schedule:renderSchedule,gallery:renderGallery,events:renderEvents,contacts:renderContacts}[state.tab])();
}

$('#saveBtn').addEventListener('click',async()=>{
 try{
   syncSchedule();
   const r=await api('../api.php?action=save',{
     method:'POST',
     headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},
     body:JSON.stringify(state.data)
   });
   if(r.ok){setStatus('Сохранено ✓',true);}
 }catch(e){setStatus(e.message,false);}
});

boot();

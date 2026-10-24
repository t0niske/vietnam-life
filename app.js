(function(){
'use strict';
/* ---------- icons ---------- */
const P={
home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
receipt:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
chart:'<path d="M4 20h16"/><path d="M7 16v-4M11 16V9M15 16v-6M19 16V6"/>',
house:'<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
plug:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M10 8h4M12 12v5M10 15h4"/>',
utensils:'<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10"/><path d="M17 3c-2 2-2 6 0 8v10"/>',
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
plane:'<path d="M2.5 13.5 21 4l-4.5 17-4-7-6.5-2.5z"/><path d="m12.5 14 4-6"/>',
heart:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z"/>',
note:'<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
wallet:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/><path d="M6 6l9-3 2 3"/>',
clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
chev:'<path d="m9 6 6 6-6 6"/>',chevd:'<path d="m6 9 6 6 6-6"/>',chevl:'<path d="m15 6-6 6 6 6"/>',
arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
plus:'<path d="M12 5v14M5 12h14"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
check:'<path d="m5 12 5 5 9-10"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
sim:'<path d="M7 3h7l4 4v14H7z"/><rect x="9.5" y="11" width="6" height="6" rx="1"/>',
bus:'<rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 11h16M7 17v3M17 17v3"/><circle cx="8" cy="14" r=".6"/><circle cx="16" cy="14" r=".6"/>',
visa:'<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',
bank:'<path d="M3 9 12 4l9 5"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>',
bag:'<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
grid:'<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/>',
drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r=".8"/>',
recycle:'<circle cx="12" cy="12" r="8.5"/><path d="M9 15V9h3.5a2 2 0 0 1 0 4H9"/>',
wrench:'<path d="M4 20h16"/><path d="M6 20V10l6-5 6 5v10"/><circle cx="12" cy="13" r="2"/>',
dollar:'<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5v11"/>',
bed:'<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
area:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
yoga:'<circle cx="12" cy="5" r="2"/><path d="M4 21c2-1 3-4 3-4l5-2 5 2s1 3 3 4M12 7v8M7 11l5-2 5 2"/>',
briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
mountain:'<path d="M3 20 9.5 8l4 7 2-3L21 20z"/>',
umbrella:'<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/>',
sight:'<path d="M3 20h18M5 20V10l7-6 7 6v10M9 20v-6h6v6"/>',
shield:'<path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>',
camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8.5 7 10 4h4l1.5 3"/><circle cx="12" cy="13.5" r="3.5"/>',
book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',
star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
down:'<path d="M12 5v14M6 13l6 6 6-6"/>',upa:'<path d="M12 19V5M6 11l6-6 6 6"/>',
sun:'<circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>'
};
const ic=(n,cls)=>`<svg class="i ${cls||''}" viewBox="0 0 24 24" aria-hidden="true">${P[n]||P.star}</svg>`;
const IMG=window.VL_IMG||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(s,r)=>(r||document).querySelector(s);

/* ---------- constants ---------- */
const CATS=[['Аренда','#3aa465'],['Питание','#f5a63c'],['Кафе и рестораны','#a8cf6a'],['Транспорт','#f2784b'],['Путешествия','#4ea6dc'],['Коммуналка','#f07a9a'],['Здоровье','#8f7be0'],['Другое','#c9c9c4']];
const catColor=c=>(CATS.find(x=>x[0]===c)||CATS[CATS.length-1])[1];
const MONTHS=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MSHORT=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const MGEN=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WD=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const WDL=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const EVT={sport:['yoga','Спорт'],work:['briefcase','Работа'],flight:['plane','Перелёт'],sight:['sight','Экскурсия'],beach:['umbrella','Отдых'],health:['heart','Здоровье'],other:['star','Другое']};
const EVTCOL={flight:'#e8484a',sight:'#2f9e5b',sport:'#2f9e5b',beach:'#3c6b48',work:'#555',health:'#e8484a',other:'#6b62d9'};
const UTIL=[['electricity','Электричество','bolt'],['water','Вода','drop'],['internet','Интернет','wifi'],['garbage','Вывоз мусора','recycle'],['service','Сервис (condo)','wrench']];
const USEFUL=[['sim','Сим-карты','sim'],['transport','Транспорт','bus'],['visa','Визы','visa'],['medicine','Медицина','heart'],['banks','Банки','bank'],['shopping','Шопинг','bag'],['hacks','Лайфхаки','spark'],['services','Сервисы','grid']];
const GOAL_ICONS=['shield','mountain','camera','book','plane','house','heart','star','wallet'];
const MEALT=['Завтрак','Обед','Ужин','Перекус'];
// currency: symbol, default account name
const CUR={VND:['₫','Донги'],RUB:['₽','Рубли'],KZT:['₸','Тенге'],USD:['$','Доллары'],EUR:['€','Евро'],THB:['฿','Баты']};
const NAV=[['home','Главная','home'],['expenses','Расходы','receipt'],['money','Доходы и счета','wallet'],['analytics','Аналитика','chart'],['housing','Жилье','house'],['utilities','Коммуналка','plug'],['food','Питание','utensils'],['goals','Цели','target'],['calendar','Календарь','calendar'],['trips','Путешествия','plane'],['health','Здоровье','heart'],['fitness','Физформа','yoga'],['notes','Заметки','note'],['useful','Полезное','doc'],['settings','Настройки','settings']];
const SECS=['expenses','incomes','accounts','transfers','utilities','apartments','goals','events','trips','meals','notes','health','weights','useful','settings'];

/* ---------- helpers ---------- */
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const mkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1);
const shiftM=(k,n)=>{const [y,m]=k.split('-').map(Number);return mkey(new Date(y,m-1+n,1))};
const mlabel=k=>{const [y,m]=k.split('-').map(Number);return MONTHS[m-1]+' '+y};
const mshort=k=>MSHORT[Number(k.split('-')[1])-1];
const fmt=n=>Math.round(Number(n)||0).toLocaleString('ru-RU').replace(/ | /g,' ');
const vnd=n=>fmt(n)+' ₫';
const usd=n=>'≈ '+fmt((Number(n)||0)/(S.settings.rate||25000))+' $';
const dshort=s=>{const d=parse(s);return d.getDate()+' '+MGEN[d.getMonth()].slice(0,3)};
const plural=(n,a,b,c)=>{n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>new Date(new Date().setHours(0,0,0,0));
const daysTo=s=>Math.round((parse(s)-today())/864e5);
const pct=(a,b)=>b?Math.min(100,Math.round(a/b*100)):0;
const NB=String.fromCharCode(160);
const cash=(n,c)=>(Number(n)||0).toLocaleString('ru-RU',{maximumFractionDigits:c==='USD'||c==='EUR'?2:0}).replace(/\s/g,NB)+NB+(CUR[c]||CUR.VND)[0];
const rateText=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:n>=100?0:n>=1?2:4}).replace(/\s/g,NB);

/* ---------- state & storage ---------- */
const S={expenses:[],incomes:[],accounts:[],transfers:[],utilities:[],apartments:[],goals:[],events:[],trips:[],meals:{days:[]},notes:[],health:[],weights:[],useful:{},settings:{city:'Нячанг',temp:32,feels:36,rate:25000,budget:70000000,kwhPrice:3000,quote:'«Больше жизни, меньше суеты»',name:''}};
let db=null, mode='loading', loaded=false, introDone=false;
/* cloud mode (Supabase): signed-in members share one copy of the data; the Telegram bot writes there too */
let sb=null, user=null, dbKind='';
function cloudDb(){return{
  doc:path=>({set:b=>sb.from('vl_sections').upsert({sec:path.split('/').pop(),body:b}).then(r=>{if(r.error)throw r.error})}),
  collection:()=>({onSnapshot(cb,err){
    const pull=()=>sb.from('vl_sections').select('sec,body').then(({data,error})=>{if(error)return err(error);cb({docs:data.map(r=>({id:r.sec,data:()=>r.body}))})});
    pull();
    sb.channel('vl-sections').on('postgres_changes',{event:'*',schema:'public',table:'vl_sections'},ch=>{const r=ch.new;if(r&&r.sec)cb({docs:[{id:r.sec,data:()=>r.body}]})}).subscribe();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
  }})
}}
const LS='vietnam-life-v1';
function lsGet(){try{return JSON.parse(localStorage.getItem(LS)||'null')}catch(e){return null}}
function lsSet(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
function body(sec){const v=S[sec];return Array.isArray(v)?{items:v}:v}
function apply(sec,b){if(!b)return;S[sec]=Array.isArray(S[sec])?(b.items||[]):Object.assign(sec==='settings'?{...S.settings}:{},b)}
function save(sec){
  if(mode==='db'&&db){db.doc('vl/'+sec).set(JSON.parse(JSON.stringify(body(sec)))).catch(e=>toast('Не удалось сохранить: '+(e&&e.message||e&&e.code||'ошибка')))}
  else lsSet();
  render();
}
function loadDemo(){const d=makeDemo(new Date());SECS.forEach(s=>{apply(s,Array.isArray(d[s])?{items:d[s]}:d[s]);});SECS.forEach(s=>{if(mode==='db'&&db)db.doc('vl/'+s).set(JSON.parse(JSON.stringify(body(s)))).catch(()=>{})});if(mode!=='db')lsSet();render();toast('Пример данных загружен')}
async function init(){
  render();
  let d=null;
  try{ d=window.claude&&window.claude.use?await window.claude.use('db'):null }catch(e){d=null}
  if(d)dbKind='artifact';
  else if(window.supabase&&window.VL_SUPABASE){
    try{
      sb=window.supabase.createClient(VL_SUPABASE.url,VL_SUPABASE.key);
      const {data}=await sb.auth.getSession();user=data.session?data.session.user:null;
      sb.auth.onAuthStateChange((ev,ses)=>{const u=ses?ses.user:null;if((u&&u.id)!==(user&&user.id))location.reload()});
      if(user){d=cloudDb();dbKind='cloud'}
    }catch(e){sb=null}
  }
  if(d){
    db=d;mode='db';
    db.collection('vl').onSnapshot(snap=>{
      snap.docs.forEach(doc=>{const id=doc.id||(doc.ref&&doc.ref.id)||String(doc.path||'').split('/').pop();if(SECS.includes(id))apply(id,doc.data())});
      loaded=true;render();
    },err=>{toast('База недоступна, сохраняю в этом браузере');fallback()});
  } else fallback();
}
function fallback(){mode='local';const l=lsGet();if(l){Object.keys(S).forEach(k=>{if(l[k]!=null)S[k]=l[k]})}else{const d=makeDemo(new Date());Object.keys(d).forEach(k=>S[k]=d[k]);lsSet()}loaded=true;render()}

/* ---------- derived ---------- */
const monthExp=k=>S.expenses.filter(e=>String(e.date).startsWith(k));
const sum=a=>a.reduce((s,e)=>s+(Number(e.amount)||0),0);
const byCat=list=>{const m={};list.forEach(e=>{m[e.cat]=(m[e.cat]||0)+(Number(e.amount)||0)});return CATS.map(c=>[c[0],m[c[0]]||0,c[1]]).concat(Object.keys(m).filter(k=>!CATS.find(c=>c[0]===k)).map(k=>[k,m[k],'#999'])).filter(x=>x[1]>0)};
const utilTotal=u=>UTIL.reduce((s,[k])=>s+(Number(u[k])||0),0);
const curApt=()=>S.apartments.find(a=>a.current)||S.apartments[0];
const nextTrip=()=>S.trips.filter(t=>daysTo(t.to||t.from)>=0).sort((a,b)=>a.from<b.from?-1:1)[0];
const imgFor=k=>IMG[k]||'';
// ₫ for one unit of a currency: the rate from the settings, otherwise today's rate loaded from the internet
const setRate=c=>c==='VND'?1:c==='USD'?Number(S.settings.rate)||0:Number((S.settings.rates||{})[c])||0;
const rateOf=c=>setRate(c)||Number(U.live[c])||0;
function loadLive(){
  const need=Object.keys(CUR).filter(c=>c!=='VND'&&!(c in U.live));if(!need.length)return;
  need.forEach(c=>U.live[c]=0);
  Promise.all(need.map(c=>fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/'+c.toLowerCase()+'.json').then(r=>r.json()).then(j=>{U.live[c]=Number((j[c.toLowerCase()]||{}).vnd)||0}).catch(()=>{}))).then(render);
}
// money left on each account: opening balance plus everything that came in and went out (the bot counts the same way)
const balances=()=>S.accounts.map(a=>{
  let bal=Number(a.start)||0;
  S.incomes.forEach(i=>{if(i.acc===a.id)bal+=Number(i.amount)||0});
  S.transfers.forEach(t=>{if(t.from===a.id)bal-=Number(t.out)||0;if(t.to===a.id)bal+=Number(t.in)||0;if(t.feeAcc===a.id)bal-=Number(t.fee)||0});
  S.expenses.forEach(e=>{if(e.acc===a.id)bal-=Number(e.cur&&e.cur!=='VND'?e.orig:e.amount)||0});
  return {acc:a,bal};
});
const accById=id=>S.accounts.find(a=>a.id===id);
// the account for a currency: the first one in it, or a new one named after the currency
function accFor(c){let a=S.accounts.find(x=>x.cur===c);if(!a){a={id:uid(),name:CUR[c][1],cur:c,start:0};S.accounts.push(a);save('accounts')}return a}
// 3D icon (Blender render) for the dashboard stat cards, falls back to the line icon
const ib3=(k,c)=>IMG['ic_'+k]?`<img class="ib3d" src="${IMG['ic_'+k]}" alt="">`:`<div class="ib ${c}">${ic(k)}</div>`;

/* ---------- UI state ---------- */
const U={route:'home',donutMonth:null,utilMonth:null,day:(new Date().getDay()+6)%7,expMonth:mkey(new Date()),expCat:'',anMonth:mkey(new Date()),monMonth:mkey(new Date()),calMonth:mkey(new Date()),q:'',live:{}};
try{const r=(location.hash||'').slice(1);if(NAV.find(n=>n[0]===r))U.route=r}catch(e){}
window.addEventListener('hashchange',()=>{const r=location.hash.slice(1);if(NAV.find(n=>n[0]===r)){U.route=r;render();window.scrollTo(0,0)}});

/* ---------- shell ---------- */
function shell(){
  const t=new Date();
  const dstr=WDL[t.getDay()]+', '+t.getDate()+' '+MGEN[t.getMonth()]+' '+t.getFullYear();
  const s=S.settings;
  return `<div class="app">
  <aside class="side" id="side">
    <div class="brand">${IMG.logo?`<img src="${IMG.logo}" alt="">`:''}<b>Vietnam Life</b><small>Plan. Live. Explore.</small></div>
    <nav class="nav">${NAV.map(n=>`<a href="#${n[0]}" class="${U.route===n[0]?'on':''}">${ic(n[2])}<span>${n[1]}</span></a>`).join('')}</nav>
    <div class="side-foot">${IMG.palms?`<img src="${IMG.palms}" alt="">`:''}<div class="quote"><b>Хорошая жизнь</b>не случается случайно,<br>она планируется 🌴</div></div>
  </aside>
  <main class="main">
    <header class="hero" style="background-image:url('${IMG.hero||''}')">
      <button class="burger" id="burger" aria-label="Меню">${ic('menu')}</button>
      <div class="hello"><h1>Xin chào${s.name?', '+esc(s.name):''}! ${ic('sun','sun')}</h1><p>Хорошего дня во Вьетнаме!<br>${esc(s.quote)}</p></div>
      <div class="hero-r">
        <div class="hero-row">
          <div class="wx"><svg class="ic" viewBox="0 0 48 48"><circle cx="20" cy="18" r="8" fill="#ffd54a"/><g stroke="#ffd54a" stroke-width="2.4" stroke-linecap="round"><path d="M20 4v3M8 8l2 2M32 8l-2 2M6 18h3"/></g><path d="M14 38h22a7 7 0 0 0 0-14 9 9 0 0 0-17 3 6 6 0 0 0-5 11z" fill="#fff"/></svg>
            <div><span class="t">${esc(s.temp)}°</span> &nbsp;${esc(s.city)}<br>Сейчас солнечно<br>Ощущается как ${esc(s.feels)}°</div></div>
          <div class="dt"><b>${dstr}</b>Жизнь прекрасна здесь 🌴</div>
          <div class="avatar">${IMG.avatar?`<img src="${IMG.avatar}" alt="">`:''}${ic('chevd')}</div>
        </div>
        <div class="search">${ic('search')}<input id="q" placeholder="Новые места. Новые цели. Та же мы, только счастливее 💚" value="${esc(U.q)}" autocomplete="off"><div id="sres"></div></div>
      </div>
    </header>
    <div class="page" id="page"></div>
    <div class="status">${dbKind==='cloud'?'Данные синхронизируются через облако · '+esc(user.email):mode==='db'?'Данные сохраняются в облаке артефакта и видны всем, с кем вы поделитесь страницей.':mode==='local'?'Данные сохраняются в этом браузере.':'Загрузка данных…'}</div>
  </main></div>`;
}

/* ---------- dashboard ---------- */
function donutSVG(parts,size,w){
  const r=(size-w)/2,C=2*Math.PI*r,tot=parts.reduce((s,p)=>s+p[1],0)||1;let off=0;
  const seg=parts.map(p=>{const len=p[1]/tot*C;const s=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${p[2]}" stroke-width="${w}" stroke-dasharray="${Math.max(0,len-1.5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})"/>`;off+=len;return s}).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#eeece5" stroke-width="${w}"/>${seg}</svg>`;
}
function home(){
  const mk=mkey(new Date()),cur=monthExp(mk),tot=sum(cur),prev=sum(monthExp(shiftM(mk,-1)));
  const diff=prev?Math.round((tot-prev)/prev*100):0;
  const spark=[];for(let i=8;i>=0;i--)spark.push(sum(monthExp(shiftM(mk,-i))));
  const smax=Math.max(...spark,1);
  const budget=Number(S.settings.budget)||0,left=budget-tot;
  const t=new Date(),dim=new Date(t.getFullYear(),t.getMonth()+1,0).getDate(),dleft=dim-t.getDate()+1;
  const goal=S.goals.find(g=>g.featured)||S.goals[0];
  const nt=nextTrip();
  // donut
  const dm=U.donutMonth||mk; const dlist=byCat(monthExp(dm)); const dtot=sum(monthExp(dm));
  const mopts=[0,-1,-2,-3,-4,-5].map(n=>shiftM(mk,n));
  // apt
  const a=curApt();
  // utilities
  const us=[...S.utilities].sort((x,y)=>x.month<y.month?-1:1);
  const um=U.utilMonth&&us.find(u=>u.month===U.utilMonth)?U.utilMonth:(us.length?us[us.length-1].month:null);
  const uc=us.find(u=>u.month===um),ui=us.findIndex(u=>u.month===um),up=ui>0?us[ui-1]:null;
  const ut=uc?utilTotal(uc):0,upd=up&&utilTotal(up)?Math.round((ut-utilTotal(up))/utilTotal(up)*100):null;
  const last5=us.slice(Math.max(0,ui-4),ui+1);const umax=Math.max(4000000,...last5.map(utilTotal));const ustep=Math.ceil(umax/4/1000000)*1000000;
  // food
  const day=S.meals.days&&S.meals.days[U.day];
  // events
  const evs=S.events.filter(e=>daysTo(e.date)>=0).sort((x,y)=>(x.date+x.from)<(y.date+y.from)?-1:1).slice(0,5);
  // trips
  const trips=S.trips.filter(t=>daysTo(t.to||t.from)>=0).sort((x,y)=>x.from<y.from?-1:1).slice(0,3);
  const t0=trips[0];
  const goals=S.goals.slice(0,4);
  const notes=S.notes.slice(0,5);
  return `
  <div class="row r4">
    <div class="card stat">${ib3("wallet","g")}<div class="body"><h4>Расходы в этом месяце</h4><div class="big num">${vnd(tot)}</div><div class="usd num">${usd(tot)}</div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:4px"><div style="font-size:11px;padding-bottom:2px">${prev?`<b class="${diff>0?'up':'down'}">${ic(diff>0?'upa':'down')} ${diff>0?'+':''}${diff}%</b> <span class="muted" style="color:#444">к прошлому месяцу</span>`:'<span class="muted">Нет данных за прошлый месяц</span>'}</div>
      <div class="spark">${spark.map(v=>`<i style="height:${Math.max(4,v/smax*40)}px"></i>`).join('')}</div></div></div></div>
    <div class="card stat">${ib3("clock","o")}<div class="body"><h4>Осталось до конца месяца</h4><div class="big num" style="${left<0?'color:var(--red)':''}">${vnd(left)}</div><div class="usd num">${usd(left)}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:14px"><div class="bar" style="flex:1"><i style="width:${budget?Math.max(0,100-pct(tot,budget)):0}%"></i></div><span style="font-size:11px;color:#444">${dleft} ${plural(dleft,'день','дня','дней')}</span></div></div></div>
    <div class="card stat">${ib3("target","r")}<div class="body"><h4>Моя цель</h4>${goal?`<div style="font-size:12.5px;margin:10px 0 8px">${esc(goal.title)}</div><div class="num" style="font-size:11.5px">${fmt(goal.saved)} $ / ${fmt(goal.target)} $</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px"><div class="bar" style="flex:1"><i style="width:${pct(goal.saved,goal.target)}%"></i></div><span style="font-size:10px;color:#666">${pct(goal.saved,goal.target)}%</span></div>`:'<div class="muted" style="margin-top:10px">Добавьте первую цель</div>'}</div>
      ${goal?`<img class="thumb" src="${imgFor(goal.img||'bali')}" alt="">`:''}</div>
    <div class="card stat">${ib3("calendar","p")}<div class="body"><h4>Скоро в планах</h4>${nt?`<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px"><b style="font-size:14px;font-weight:600">${esc(nt.city)}</b><span style="color:var(--blue);margin-right:6px">${ic('plane')}</span></div><div style="font-size:11.5px;color:#555;margin-top:4px">${dshort(nt.from)} – ${dshort(nt.to)}</div>`:'<div class="muted" style="margin-top:10px">Поездок пока нет</div>'}</div>
      ${nt?`<div class="thumbwrap"><img class="thumb" src="${imgFor(nt.img==='trip1'?'danang_card':nt.img)}" alt="" style="width:106px;height:98px"><span class="badge">${tripBadge(nt)}</span></div>`:''}</div>
  </div>

  <div class="row r3a">
    <div class="card"><div class="chd"><div class="ib b">${ic('wallet')}</div><h3>Расходы</h3><div class="sp"><select class="sel" data-act="donutMonth" aria-label="Месяц">${mopts.map((k,i)=>`<option value="${k}" ${k===dm?'selected':''}>${i===0?'Этот месяц':mlabel(k)}</option>`).join('')}</select></div></div>
      <div class="donutwrap"><div class="donut">${donutSVG(dlist,200,40)}<div class="c"><div><b class="num">${vnd(dtot)}</b><span>${dm===mk?'в этом месяце':mlabel(dm)}</span></div></div></div>
      <div><div class="legend">${dlist.length?dlist.map(c=>`<div><i style="background:${c[2]}"></i><span>${esc(c[0])}</span><span class="num">${pct(c[1],dtot)}%</span><span class="v num">${vnd(c[1])}</span></div>`).join(''):'<span class="muted">Нет расходов за этот месяц</span>'}</div>
      <div style="text-align:right;margin-top:16px"><a class="link" href="#expenses">Все категории ${ic('arrow')}</a></div></div></div></div>
    <div class="card"><div class="chd"><div class="ib g">${ic('house')}</div><div><h3>Жилье</h3><div class="sub">История наших квартир</div></div></div>
      ${a?`<div class="apt-photo"><img src="${imgFor(a.img||'apt_main')}" alt="">${a.current?'<span class="tag">Текущая</span>':''}<div class="info"><b>${esc(a.city)}, ${esc(a.name)}</b><div class="p num">${vnd(a.price)} / месяц</div><div class="apt-meta"><span>${ic('bed')}${a.rooms} ${plural(a.rooms,'комната','комнаты','комнат')}</span><span>${ic('area')}${a.area} м²</span><span>${ic('eye')}${esc(a.view)}</span></div></div></div>
      <div class="thumbs">${['apt1','apt2','apt3','apt4'].map(k=>`<img src="${imgFor(k)}" alt="">`).join('')}</div>`:'<div class="empty">Добавьте квартиру в разделе «Жилье»</div>'}
      <div style="text-align:right"><a class="link" href="#housing">Все квартиры ${ic('arrow')}</a></div></div>
    <div class="card"><div class="chd"><div class="ib p">${ic('bolt')}</div><h3>Коммуналка</h3><div class="sp"><select class="sel" data-act="utilMonth" aria-label="Месяц">${us.slice().reverse().map(u=>`<option value="${u.month}" ${u.month===um?'selected':''}>${mlabel(u.month)}</option>`).join('')||'<option>Нет данных</option>'}</select></div></div>
      ${uc?`<div class="util"><div><div class="big num" style="font-size:20px;font-weight:700">${vnd(ut)}</div><div class="usd num" style="font-size:11.5px;color:#555">${usd(ut)}</div>
        <div style="font-size:11px;margin-top:6px">${upd!==null?`<b class="${upd>0?'up':'down'}">${ic(upd>0?'upa':'down')} ${upd>0?'+':''}${upd}%</b> <span style="color:#444;font-size:10px">чем в прошлом месяце</span>`:''}</div>
        <div class="ubars"><div class="uaxis">${[4,3,2,1,0].map(i=>`<span>${i?Math.round(ustep*i/1e6)+'M':'0'}</span>`).join('')}</div>
        <div class="ucols">${last5.map(u=>`<div class="${u.month===um?'on':''}"><i style="height:${utilTotal(u)/(ustep*4)*100}%"></i><span>${mshort(u.month)}</span></div>`).join('')}</div></div></div>
        <div class="ulist">${UTIL.map(([k,l,i])=>`<div>${ic(i)}<span>${l}</span><span class="num">${vnd(uc[k])}</span></div>`).join('')}</div></div>`:'<div class="empty">Добавьте показания в разделе «Коммуналка»</div>'}
    </div>
  </div>

  <div class="row r3b">
    <div class="card"><div class="chd"><div class="ib o">${ic('utensils')}</div><div><h3>Питание</h3><div class="sub">План на неделю</div></div><a class="link sp" href="#food">Перейти ${ic('arrow')}</a></div>
      <div class="days">${(S.meals.days||[]).map((d,i)=>`<button data-act="day" data-i="${i}" class="${i===U.day?'on':''}">${d.day}</button>`).join('')}</div>
      ${day?`<div class="meals">${day.items.map((m,j)=>`<button class="meal" data-act="meal" data-d="${U.day}" data-j="${j}"><img src="${imgFor('food'+(j+1))}" alt=""><b>${MEALT[j]}</b><span>${esc(m.name)}${m.desc?'<br>'+esc(m.desc):''}</span></button>`).join('')}</div>`:'<div class="empty">План питания пуст</div>'}</div>
    <div class="card"><div class="chd"><div class="ib r">${ic('calendar')}</div><div><h3>Календарь</h3><div class="sub">${mlabel(mk)}</div></div><div class="sp"><button class="btn" data-act="addEvent">${ic('plus')} Добавить</button></div></div>
      ${evs.length?evs.map(e=>{const d=parse(e.date);const [i]=EVT[e.type]||EVT.other;return `<div class="ev"><div class="d"><b>${d.getDate()}</b><small>${WD[d.getDay()]}</small></div><span style="color:${EVTCOL[e.type]||'#555'}">${ic(i)}</span><div class="t">${esc(e.title)}<small>${e.from?esc(e.from)+(e.to?' – '+esc(e.to):''):'На весь день'}</small></div><button class="chk ${e.done?'on':''}" data-act="toggleEvent" data-id="${e.id}" aria-label="Отметить">${e.done?ic('check'):''}</button></div>`}).join(''):'<div class="empty">Ближайших дел нет</div>'}
      <div style="text-align:right;margin-top:2px"><a class="link" href="#calendar">Все события ${ic('arrow')}</a></div></div>
    <div class="card"><div class="chd"><div class="ib b">${ic('plane')}</div><div><h3>Путешествия</h3><div class="sub">Ближайшие поездки</div></div><a class="link sp" href="#trips">Все поездки ${ic('arrow')}</a></div>
      ${trips.length?`<div class="trips">${trips.map((t,i)=>`<a class="trip" href="#trips"><img src="${imgFor(t.img||'trip1')}" alt=""><div class="tx"><b>${esc(t.city)}</b><span>${i===0?dshort(t.from)+' – '+dshort(t.to)+' '+parse(t.from).getFullYear():MONTHS[parse(t.from).getMonth()]+' '+parse(t.from).getFullYear()}</span></div>${i===0?`<span class="badge">${tripBadge(t)}</span>`:''}</a>`).join('')}</div>
      <div class="tcheck"><div class="tlist">${(t0.checklist||[]).slice(0,5).map((c,j)=>`<label><button class="chk ${c.d?'on':''}" data-act="tripCheck" data-id="${t0.id}" data-j="${j}">${c.d?ic('check'):''}</button>${esc(c.t)}</label>`).join('')}</div>${IMG.map?`<img class="tmap" src="${IMG.map}" alt="">`:''}</div>`:'<div class="empty">Запланируйте поездку</div>'}</div>
  </div>

  <div class="row r3c">
    <div class="card"><div class="chd"><div class="ib r">${ic('target')}</div><h3>Цели</h3><span style="font-size:10px;color:#666">${S.goals.length} ${plural(S.goals.length,'активная цель','активные цели','активных целей')}</span><a class="link sp" href="#goals">Все цели ${ic('arrow')}</a></div>
      <div class="goals">${goals.map(g=>`<a class="goal" href="#goals"><div class="ib" style="background:${g.color}22;color:${g.color}">${ic(g.icon)}</div><div><div class="top"><span title="${esc(g.title)}">${esc(g.title)}</span><div class="bar"><i style="width:${pct(g.saved,g.target)}%;background:${g.color}"></i></div><em>${pct(g.saved,g.target)}%</em></div><div class="amt num">${fmt(g.saved)} $ / ${fmt(g.target)} $</div></div></a>`).join('')||'<div class="empty">Целей пока нет</div>'}</div></div>
    <div class="card"><div class="chd"><div class="ib y">${ic('bulb')}</div><h3>Полезное</h3></div>
      <div class="tiles">${USEFUL.map(([k,l,i])=>`<button class="tile" data-act="useful" data-k="${k}">${ic(i)}${l}</button>`).join('')}</div></div>
    <div class="card"><div class="chd"><div class="ib" style="background:#f0efe9;color:#5b615a">${ic('note')}</div><h3>Заметки</h3><a class="link sp" href="#notes">Все заметки ${ic('arrow')}</a></div>
      <div class="notes"><div class="nlist">${notes.map(n=>`<label class="${n.done?'done':''}"><button class="chk ${n.done?'on':''}" data-act="toggleNote" data-id="${n.id}">${n.done?ic('check'):''}</button><span>${esc(n.text)}</span></label>`).join('')||'<div class="muted">Заметок нет</div>'}</div>
      ${IMG.notes_photo?`<img class="nphoto" src="${IMG.notes_photo}" alt="">`:''}</div></div>
  </div>`;
}
function tripBadge(t){const d=daysTo(t.from);if(d>0)return d+' '+plural(d,'день','дня','дней');if(daysTo(t.to)>=0)return 'В пути';return 'Прошла'}

/* ---------- expenses page ---------- */
function expensesPage(){
  const k=U.expMonth;let list=monthExp(k);if(U.expCat)list=list.filter(e=>e.cat===U.expCat);
  list=list.slice().sort((a,b)=>a.date<b.date?1:-1);
  const months=[...new Set(S.expenses.map(e=>String(e.date).slice(0,7)).concat([mkey(new Date())]))].sort().reverse();
  const tot=sum(list);
  return `<div class="ptitle"><h2>Расходы</h2><select class="sel" data-act="expMonth">${months.map(m=>`<option value="${m}" ${m===k?'selected':''}>${mlabel(m)}</option>`).join('')}</select>
    <select class="sel" data-act="expCat"><option value="">Все категории</option>${CATS.map(c=>`<option ${c[0]===U.expCat?'selected':''}>${c[0]}</option>`).join('')}</select>
    <div class="sp"><button class="btn" data-act="addExpense">${ic('plus')} Добавить расход</button></div></div>
  <div class="kpis"><div class="card kpi"><small>Итого за ${mlabel(k).toLowerCase()}</small><b class="num">${vnd(tot)}</b><span class="muted num">${usd(tot)}</span></div>
    <div class="card kpi"><small>Записей</small><b class="num">${list.length}</b></div>
    <div class="card kpi"><small>Средний расход в день</small><b class="num">${vnd(tot/(k===mkey(new Date())?new Date().getDate():new Date(+k.slice(0,4),+k.slice(5),0).getDate()))}</b></div>
    <div class="card kpi"><small>Бюджет на месяц</small><b class="num">${vnd(S.settings.budget)}</b><span class="muted">использовано ${pct(sum(monthExp(k)),S.settings.budget)}%</span></div></div>
  <div class="card">${list.length?`<div class="tbl-wrap"><table><thead><tr><th>Дата</th><th>Категория</th><th>Описание</th><th class="r">Сумма</th><th class="r">В $</th><th></th></tr></thead><tbody>
  ${list.map(e=>`<tr><td class="num">${dshort(e.date)}</td><td><span class="dot" style="background:${catColor(e.cat)}"></span>${esc(e.cat)}</td><td>${esc(e.note)}</td><td class="r num"><b>${vnd(e.amount)}</b></td><td class="r num muted">${fmt(e.amount/S.settings.rate)} $</td><td><div class="acts"><button data-act="editExpense" data-id="${e.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delExpense" data-id="${e.id}" aria-label="Удалить">${ic('trash')}</button></div></td></tr>`).join('')}
  </tbody></table></div>`:'<div class="empty">За этот месяц расходов нет. Нажмите «Добавить расход», чтобы записать первый.</div>'}</div>`;
}

/* ---------- incomes, accounts, exchanges ---------- */
function moneyPage(){
  loadLive();
  const k=U.monMonth,inc=S.incomes.filter(i=>String(i.date).startsWith(k)).sort((a,b)=>a.date<b.date?1:-1);
  const got=inc.reduce((s,i)=>s+(Number(i.vnd)||0),0),spent=sum(monthExp(k)),diff=got-spent;
  const bals=balances(),total=bals.reduce((s,b)=>s+b.bal*rateOf(b.acc.cur),0);
  const months=[...new Set(S.incomes.concat(S.expenses).map(e=>String(e.date).slice(0,7)).concat([mkey(new Date())]))].sort().reverse();
  const tr=S.transfers.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,10);
  const accN=id=>{const a=accById(id);return a?esc(a.name):'—'};
  const accC=id=>(accById(id)||{}).cur||'VND';
  const rateNote=c=>{const r=rateOf(c);return r?'курс '+rateText(r)+(setRate(c)?'':', сегодняшний'):'курс не задан'};
  return `<div class="ptitle"><h2>Доходы и счета</h2><select class="sel" data-act="monMonth">${months.map(m=>`<option value="${m}" ${m===k?'selected':''}>${mlabel(m)}</option>`).join('')}</select>
    <div class="sp"><button class="btn ghost" data-act="addAccount">${ic('plus')} Счёт</button><button class="btn ghost" data-act="addTransfer">${ic('arrow')} Обмен</button><button class="btn" data-act="addIncome">${ic('plus')} Добавить доход</button></div></div>
  <div class="kpis"><div class="card kpi"><small>Доходы за ${mlabel(k).toLowerCase()}</small><b class="num">${vnd(got)}</b><span class="muted num">${usd(got)}</span></div>
    <div class="card kpi"><small>Расходы за ${mlabel(k).toLowerCase()}</small><b class="num">${vnd(spent)}</b><span class="muted num">${usd(spent)}</span></div>
    <div class="card kpi"><small>Разница</small><b class="num">${diff<0?'−':diff>0?'+':''}${vnd(Math.abs(diff))}</b><span class="${diff<0?'up':'down'}">${diff<0?'тратим больше, чем получаем':'в плюсе'}</span></div>
    <div class="card kpi"><small>Всего на счетах</small><b class="num">${vnd(total)}</b><span class="muted">${S.accounts.length} ${plural(S.accounts.length,'счёт','счёта','счетов')}</span></div></div>
  <div class="gridc">${bals.map(({acc:a,bal})=>`<div class="card"><div class="chd"><div class="ib g">${ic('wallet')}</div><div><h3>${esc(a.name)}</h3><div class="sub">${(CUR[a.cur]||CUR.VND)[1]} · ${esc(a.cur)}</div></div>
    <div class="acts sp"><button data-act="editAccount" data-id="${a.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delAccount" data-id="${a.id}" aria-label="Удалить">${ic('trash')}</button></div></div>
    <div class="num" style="font-size:20px;font-weight:700">${cash(bal,a.cur)}</div>
    <div class="muted num" style="font-size:11.5px;margin-top:4px">${a.cur==='VND'?usd(bal):rateOf(a.cur)?'≈ '+vnd(bal*rateOf(a.cur))+' · '+rateNote(a.cur):'курс не задан'}</div></div>`).join('')||'<div class="card empty">Счетов пока нет. Добавьте счёт или запишите доход: счёт в его валюте появится сам.</div>'}</div>
  <div class="card"><div class="chd"><h3>Доходы за ${mlabel(k).toLowerCase()}</h3></div>${inc.length?`<div class="tbl-wrap"><table><thead><tr><th>Дата</th><th>Источник</th><th>Счёт</th><th class="r">Сумма</th><th class="r">В донгах</th><th></th></tr></thead><tbody>
  ${inc.map(i=>`<tr><td class="num">${dshort(i.date)}</td><td>${esc(i.source)}</td><td>${accN(i.acc)}</td><td class="r num"><b>${cash(i.amount,i.cur)}</b></td><td class="r num muted">${vnd(i.vnd)}</td><td><div class="acts"><button data-act="editIncome" data-id="${i.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delIncome" data-id="${i.id}" aria-label="Удалить">${ic('trash')}</button></div></td></tr>`).join('')}
  </tbody></table></div>`:'<div class="empty">За этот месяц доходов нет. Нажмите «Добавить доход» или скажите боту: «пришла зарплата 180 тысяч рублей».</div>'}</div>
  <div class="card"><div class="chd"><h3>Обмены и переводы</h3></div>${tr.length?`<div class="tbl-wrap"><table><thead><tr><th>Дата</th><th>Отдали</th><th>Получили</th><th class="r">Курс</th><th class="r">Комиссия</th><th></th></tr></thead><tbody>
  ${tr.map(t=>{const fc=accC(t.from),tc=accC(t.to),k2=t.out?t.in/t.out:0;return `<tr><td class="num">${dshort(t.date)}</td><td>${cash(t.out,fc)}<br><small class="muted">${accN(t.from)}</small></td><td>${cash(t.in,tc)}<br><small class="muted">${accN(t.to)}</small></td>
    <td class="r num">${fc===tc||!k2?'—':k2>=1?'1 '+CUR[fc][0]+' = '+rateText(k2)+' '+CUR[tc][0]:'1 '+CUR[tc][0]+' = '+rateText(1/k2)+' '+CUR[fc][0]}</td><td class="r num">${t.fee?cash(t.fee,t.feeCur||fc):'—'}</td>
    <td><div class="acts"><button data-act="editTransfer" data-id="${t.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delTransfer" data-id="${t.id}" aria-label="Удалить">${ic('trash')}</button></div></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Обменов пока нет. Например: «поменял 50 тысяч рублей на тенге, получил 270 тысяч, комиссия 500 рублей».</div>'}</div>
  <div class="card"><div class="chd"><div class="ib y">${ic('dollar')}</div><h3>Курсы валют</h3></div>
    <form id="ratef"><div class="fgrid rates">${Object.keys(CUR).filter(c=>c!=='VND').map(c=>`<label class="field">1 ${CUR[c][0]} (${c}), ₫<input name="${c}" type="number" step="any" value="${setRate(c)||''}" placeholder="${U.live[c]?'сегодня '+rateText(U.live[c]):''}"></label>`).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn" type="submit">${ic('check')} Сохранить</button><button class="btn ghost" type="button" data-act="liveRates">Подставить сегодняшние</button></div></form>
    <p class="muted" style="font-size:11px;margin:10px 0 0">Пустое поле — сайт и бот берут сегодняшний курс из интернета. Заполненное — ваш курс, например курс обменника.</p></div>`;
}

/* ---------- analytics ---------- */
function analyticsPage(){
  const k=U.anMonth;const cur=monthExp(k),prevL=monthExp(shiftM(k,-1));const tot=sum(cur),prev=sum(prevL);
  const months=[];for(let i=11;i>=0;i--)months.push(shiftM(k,-i));const vals=months.map(m=>sum(monthExp(m)));const mx=Math.max(...vals,1);
  const nz=vals.filter(v=>v>0);const avg=nz.length?sum(nz.map(v=>({amount:v})))/nz.length:0;
  const cats=byCat(cur),pc=Object.fromEntries(byCat(prevL).map(c=>[c[0],c[1]]));
  const top=cur.slice().sort((a,b)=>b.amount-a.amount).slice(0,6);
  const rent=cats.find(c=>c[0]==='Аренда');
  return `<div class="ptitle"><h2>Аналитика</h2><select class="sel" data-act="anMonth">${months.slice().reverse().map(m=>`<option value="${m}" ${m===k?'selected':''}>${mlabel(m)}</option>`).join('')}</select></div>
  <div class="kpis"><div class="card kpi"><small>Расходы за месяц</small><b class="num">${vnd(tot)}</b><span class="${tot>prev?'up':'down'}">${prev?(tot>prev?'+':'')+Math.round((tot-prev)/prev*100)+'% к прошлому месяцу':'—'}</span></div>
  <div class="card kpi"><small>Средний месяц (за год)</small><b class="num">${vnd(avg)}</b><span class="muted num">${usd(avg)}</span></div>
  <div class="card kpi"><small>Доля жилья</small><b class="num">${rent?pct(rent[1],tot):0}%</b><span class="muted">аренда от всех трат</span></div>
  <div class="card kpi"><small>Всего за 12 месяцев</small><b class="num">${vnd(vals.reduce((a,b)=>a+b,0))}</b><span class="muted num">${usd(vals.reduce((a,b)=>a+b,0))}</span></div></div>
  <div class="card"><div class="chd"><h3>Расходы по месяцам</h3></div><div class="mbars">${months.map((m,i)=>`<div class="${m===k?'on':''}"><em>${vals[i]?(vals[i]/1e6).toFixed(1)+'M':''}</em><i style="height:${vals[i]/mx*85}%"></i></div>`).join('')}</div><div class="mlabels">${months.map(m=>`<span>${mshort(m)}</span>`).join('')}</div></div>
  <div class="grid2"><div class="card"><div class="chd"><h3>Категории за ${mlabel(k).toLowerCase()}</h3></div>
    ${cats.length?cats.map(c=>{const p=pc[c[0]]||0,d=p?Math.round((c[1]-p)/p*100):null;return `<div class="hbar"><span><span class="dot" style="background:${c[2]}"></span>${esc(c[0])}</span><div class="bar" style="height:10px"><i style="width:${pct(c[1],cats[0][1]&&Math.max(...cats.map(x=>x[1])))}%;background:${c[2]}"></i></div><span class="num" style="text-align:right">${vnd(c[1])}<br><small class="${d>0?'up':'down'}">${d===null?'':(d>0?'+':'')+d+'%'}</small></span></div>`}).join(''):'<div class="empty">Нет данных</div>'}</div>
  <div class="card"><div class="chd"><h3>Крупнейшие траты</h3></div>${top.length?`<table><tbody>${top.map(e=>`<tr><td>${dshort(e.date)}</td><td><span class="dot" style="background:${catColor(e.cat)}"></span>${esc(e.note||e.cat)}</td><td class="r num"><b>${vnd(e.amount)}</b></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Нет данных</div>'}
  <div class="chd" style="margin-top:18px"><h3>Структура</h3></div><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div class="donut" style="width:150px;height:150px">${donutSVG(cats,150,28)}</div><div class="legend" style="flex:1;min-width:200px">${cats.map(c=>`<div style="grid-template-columns:12px 1fr 40px"><i style="background:${c[2]}"></i><span>${esc(c[0])}</span><span class="num">${pct(c[1],tot)}%</span></div>`).join('')}</div></div></div></div>`;
}

/* ---------- housing ---------- */
function months(a){const f=parse(a.from),t=a.to?parse(a.to):today();return Math.max(1,Math.round((t-f)/(30.44*864e5)))}
function housingPage(){
  const list=S.apartments.slice().sort((a,b)=>(b.current-a.current)||(a.from<b.from?1:-1));
  const paid=list.reduce((s,a)=>s+months(a)*a.price,0);
  const a=curApt();
  return `<div class="ptitle"><h2>Жилье</h2><div class="sp"><button class="btn" data-act="addApt">${ic('plus')} Добавить квартиру</button></div></div>
  <div class="kpis"><div class="card kpi"><small>Текущая аренда</small><b class="num">${a?vnd(a.price):'—'}</b><span class="muted num">${a?usd(a.price)+' / месяц':''}</span></div>
  <div class="card kpi"><small>Квартир за всё время</small><b class="num">${list.length}</b></div>
  <div class="card kpi"><small>Всего на аренду</small><b class="num">${vnd(paid)}</b><span class="muted num">${usd(paid)}</span></div>
  <div class="card kpi"><small>Аренда + коммуналка в месяц</small><b class="num">${vnd((a?a.price:0)+(S.utilities.length?utilTotal(S.utilities.slice().sort((x,y)=>x.month<y.month?1:-1)[0]):0))}</b><span class="muted">по последнему счёту</span></div></div>
  <div class="gridc">${list.map(a=>`<div class="card apt-card"><img class="cover" src="${imgFor(a.img||'apt1')}" alt="">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><b style="font-size:14px">${esc(a.city)}, ${esc(a.name)}</b>${a.current?'<span class="chip g">Текущая</span>':''}</div>
    <div class="num" style="font-size:16px;font-weight:700;margin:4px 0">${vnd(a.price)} <span class="muted" style="font-size:11px;font-weight:400">/ месяц</span></div>
    <div class="apt-meta"><span>${ic('bed')}${a.rooms} комн.</span><span>${ic('area')}${a.area} м²</span><span>${ic('eye')}${esc(a.view)}</span></div>
    <div style="font-size:11.5px;color:#555;margin-top:8px">${a.from?dshort(a.from)+' '+parse(a.from).getFullYear():''} – ${a.to?dshort(a.to)+' '+parse(a.to).getFullYear():'сейчас'} · ${months(a)} мес. · всего ${vnd(months(a)*a.price)}</div>
    ${a.deposit?`<div style="font-size:11.5px;color:#555">Депозит: ${vnd(a.deposit)}</div>`:''}
    ${a.note?`<div style="font-size:12px;margin-top:6px">${esc(a.note)}</div>`:''}
    <div class="acts" style="margin-top:8px"><button data-act="editApt" data-id="${a.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delApt" data-id="${a.id}" aria-label="Удалить">${ic('trash')}</button></div></div>`).join('')||'<div class="card empty">Квартир пока нет</div>'}</div>`;
}

/* ---------- utilities ---------- */
function utilitiesPage(){
  const us=S.utilities.slice().sort((a,b)=>a.month<b.month?-1:1);const mx=Math.max(...us.map(utilTotal),1);
  const last=us[us.length-1];const avg=us.length?us.reduce((s,u)=>s+utilTotal(u),0)/us.length:0;
  const kp=Number(S.settings.kwhPrice)||0;
  return `<div class="ptitle"><h2>Коммуналка</h2><div class="sp"><button class="btn" data-act="addUtil">${ic('plus')} Добавить месяц</button></div></div>
  <div class="kpis"><div class="card kpi"><small>Последний счёт</small><b class="num">${last?vnd(utilTotal(last)):'—'}</b><span class="muted">${last?mlabel(last.month):''}</span></div>
  <div class="card kpi"><small>В среднем в месяц</small><b class="num">${vnd(avg)}</b><span class="muted num">${usd(avg)}</span></div>
  <div class="card kpi"><small>Электричество, последний месяц</small><b class="num">${last&&last.kwh?last.kwh+' кВт·ч':'—'}</b><span class="muted">${last&&last.kwh?'≈ '+fmt(last.electricity/last.kwh)+' ₫ за кВт·ч':''}</span></div></div>
  <div class="grid2"><div class="card"><div class="chd"><h3>Динамика</h3></div>${us.length?`<div class="mbars">${us.slice(-12).map(u=>`<div class="${u===last?'on':''}"><em>${(utilTotal(u)/1e6).toFixed(2)}M</em><i style="height:${utilTotal(u)/mx*85}%"></i></div>`).join('')}</div><div class="mlabels">${us.slice(-12).map(u=>`<span>${mshort(u.month)}</span>`).join('')}</div>`:'<div class="empty">Нет данных</div>'}</div>
  <div class="card"><div class="chd"><div class="ib y">${ic('bolt')}</div><h3>Калькулятор электричества</h3></div>
    <div class="fgrid"><label class="field">Показание в начале, кВт·ч<input type="number" id="kw1" value="0"></label><label class="field">Показание в конце, кВт·ч<input type="number" id="kw2" value="350"></label>
    <label class="field">Цена за кВт·ч, ₫<input type="number" id="kwp" value="${kp}"></label><label class="field">Вода + интернет + сервис, ₫<input type="number" id="kwo" value="${last?utilTotal(last)-last.electricity:0}"></label></div>
    <div id="kwres" style="margin-top:12px;font-size:13px"></div>
    <p class="muted" style="font-size:11px">Цену за кВт·ч уточняйте у арендодателя: в квартирах её часто ставят выше государственного тарифа.</p></div></div>
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Месяц</th>${UTIL.map(u=>`<th class="r">${u[1]}</th>`).join('')}<th class="r">кВт·ч</th><th class="r">Итого</th><th></th></tr></thead><tbody>
  ${us.slice().reverse().map(u=>`<tr><td>${mlabel(u.month)}</td>${UTIL.map(([k])=>`<td class="r num">${fmt(u[k])}</td>`).join('')}<td class="r num">${u.kwh||'—'}</td><td class="r num"><b>${vnd(utilTotal(u))}</b></td><td><div class="acts"><button data-act="editUtil" data-id="${u.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delUtil" data-id="${u.id}" aria-label="Удалить">${ic('trash')}</button></div></td></tr>`).join('')}
  </tbody></table></div></div>`;
}
function kwCalc(){const a=+($('#kw1')||{}).value||0,b=+($('#kw2')||{}).value||0,p=+($('#kwp')||{}).value||0,o=+($('#kwo')||{}).value||0;const r=$('#kwres');if(!r)return;const k=Math.max(0,b-a);r.innerHTML=`Расход: <b>${k} кВт·ч</b> → электричество <b class="num">${vnd(k*p)}</b><br>Итого коммуналка: <b class="num">${vnd(k*p+o)}</b> <span class="muted num">${usd(k*p+o)}</span>`}

/* ---------- food ---------- */
function foodPage(){
  const days=S.meals.days||[];
  return `<div class="ptitle"><h2>Питание</h2><span class="muted">План на неделю. Нажмите на блюдо, чтобы изменить.</span></div>
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>День</th>${MEALT.map((m,j)=>`<th><img src="${imgFor('food'+(j+1))}" alt="" style="width:46px;height:32px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px">${m}</th>`).join('')}<th class="r">ккал</th></tr></thead><tbody>
  ${days.map((d,i)=>`<tr${i===(new Date().getDay()+6)%7?' style="background:#f4faf5"':''}><td><b>${d.day}</b></td>${d.items.map((m,j)=>`<td style="cursor:pointer" data-act="meal" data-d="${i}" data-j="${j}">${esc(m.name)}<br><small class="muted">${esc(m.desc)}</small></td>`).join('')}<td class="r num">${d.items.reduce((s,m)=>s+(+m.kcal||0),0)}</td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="card"><div class="chd"><h3>Принципы правильного питания в жару</h3></div><ul style="margin:0;padding-left:18px;line-height:1.7;font-size:12.5px">
  <li>2,5–3 литра воды в день, больше — при активности на солнце.</li><li>Белок в каждом приёме пищи: рыба, курица, тофу, яйца.</li><li>Местные фрукты вместо сладостей: манго, драгонфрут, папайя.</li><li>Супы на бульоне (фо, бун) — лёгкий и сытный обед.</li><li>Меньше жареного и сладких напитков с сиропом.</li></ul></div>`;
}

/* ---------- goals ---------- */
function goalsPage(){
  return `<div class="ptitle"><h2>Цели</h2><div class="sp"><button class="btn" data-act="addGoal">${ic('plus')} Новая цель</button></div></div>
  <div class="gridc">${S.goals.map(g=>`<div class="card"><div class="chd"><div class="ib" style="background:${g.color}22;color:${g.color}">${ic(g.icon)}</div><div><h3>${esc(g.title)}</h3><div class="sub">${g.featured?'Главная цель':''}</div></div></div>
  <div class="num" style="font-size:20px;font-weight:700">${fmt(g.saved)} $ <span class="muted" style="font-size:13px;font-weight:400">из ${fmt(g.target)} $</span></div>
  <div class="bar" style="height:8px;margin:10px 0"><i style="width:${pct(g.saved,g.target)}%;background:${g.color}"></i></div>
  <div style="display:flex;justify-content:space-between;font-size:11.5px" class="muted"><span>${pct(g.saved,g.target)}%</span><span>осталось ${fmt(Math.max(0,g.target-g.saved))} $ ≈ ${vnd(Math.max(0,g.target-g.saved)*S.settings.rate)}</span></div>
  <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" data-act="contrib" data-id="${g.id}">${ic('plus')} Пополнить</button><div class="acts" style="margin-left:auto"><button data-act="editGoal" data-id="${g.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delGoal" data-id="${g.id}" aria-label="Удалить">${ic('trash')}</button></div></div></div>`).join('')||'<div class="card empty">Целей пока нет</div>'}</div>`;
}

/* ---------- calendar ---------- */
function calendarPage(){
  const k=U.calMonth;const [y,m]=k.split('-').map(Number);const first=new Date(y,m-1,1);const start=new Date(first);start.setDate(1-((first.getDay()+6)%7));
  const cells=[];for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells.push(d)}
  const tIso=iso(today());
  const up=S.events.filter(e=>daysTo(e.date)>=0).sort((a,b)=>(a.date+a.from)<(b.date+b.from)?-1:1);
  return `<div class="ptitle"><h2>Календарь</h2><button class="btn ghost" data-act="calPrev" aria-label="Предыдущий месяц">${ic('chevl')}</button><b>${mlabel(k)}</b><button class="btn ghost" data-act="calNext" aria-label="Следующий месяц">${ic('chev')}</button><div class="sp"><button class="btn" data-act="addEvent">${ic('plus')} Добавить</button></div></div>
  <div class="card" style="overflow-x:auto"><div class="calgrid">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="h">${d}</div>`).join('')}
  ${cells.map(d=>{const di=iso(d);const ev=S.events.filter(e=>e.date===di);const tr=S.trips.filter(t=>t.from<=di&&di<=(t.to||t.from));return `<div class="c ${d.getMonth()!==m-1?'out':''} ${di===tIso?'today':''}" data-act="addEvent" data-date="${di}"><b>${d.getDate()}</b>${tr.map(t=>`<span class="ctrip">✈ ${esc(t.city)}</span>`).join('')}${ev.map(e=>`<span data-act="editEvent" data-id="${e.id}">${e.from?esc(e.from)+' ':''}${esc(e.title)}</span>`).join('')}</div>`}).join('')}</div></div>
  <div class="card"><div class="chd"><h3>Ближайшие события</h3></div>${up.map(e=>{const d=parse(e.date);const [i,l]=EVT[e.type]||EVT.other;return `<div class="ev" style="grid-template-columns:44px 26px 1fr 20px 70px"><div class="d"><b>${d.getDate()}</b><small>${WD[d.getDay()]} ${MSHORT[d.getMonth()]}</small></div><span style="color:${EVTCOL[e.type]}">${ic(i)}</span><div class="t">${esc(e.title)}<small>${l} · ${e.from?esc(e.from)+(e.to?' – '+esc(e.to):''):'На весь день'}</small></div><button class="chk ${e.done?'on':''}" data-act="toggleEvent" data-id="${e.id}" aria-label="Отметить">${e.done?ic('check'):''}</button><div class="acts"><button data-act="editEvent" data-id="${e.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delEvent" data-id="${e.id}" aria-label="Удалить">${ic('trash')}</button></div></div>`}).join('')||'<div class="empty">Нет запланированных дел</div>'}</div>`;
}

/* ---------- trips ---------- */
function tripsPage(){
  const list=S.trips.slice().sort((a,b)=>a.from<b.from?-1:1);
  return `<div class="ptitle"><h2>Путешествия</h2><div class="sp"><button class="btn" data-act="addTrip">${ic('plus')} Новая поездка</button></div></div>
  <div class="gridc">${list.map(t=>{const sp=sum(S.expenses.filter(e=>e.cat==='Путешествия'&&e.date>=shiftM(t.from.slice(0,7),-1)&&e.date<=t.to));return `<div class="card"><div class="trip" style="height:150px;cursor:default"><img src="${imgFor(t.img||'trip1')}" alt=""><div class="tx"><b style="font-size:16px">${esc(t.city)}</b><span>${dshort(t.from)} – ${dshort(t.to)} ${parse(t.from).getFullYear()}</span></div><span class="badge">${tripBadge(t)}</span></div>
  <div style="display:flex;justify-content:space-between;font-size:12px;margin:10px 0 6px"><span class="muted">Бюджет</span><b class="num">${vnd(t.budget)}</b></div>
  ${t.note?`<div style="font-size:12px;margin-bottom:8px">${esc(t.note)}</div>`:''}
  <div class="tlist">${(t.checklist||[]).map((c,j)=>`<label><button class="chk ${c.d?'on':''}" data-act="tripCheck" data-id="${t.id}" data-j="${j}">${c.d?ic('check'):''}</button>${esc(c.t)}</label>`).join('')}</div>
  <div style="display:flex;gap:6px;margin-top:10px"><input class="sel" style="flex:1;min-width:0" placeholder="Новый пункт чек-листа" id="ck-${t.id}"><button class="btn ghost" data-act="addCheck" data-id="${t.id}">${ic('plus')}</button></div>
  <div class="acts" style="margin-top:8px"><button data-act="editTrip" data-id="${t.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delTrip" data-id="${t.id}" aria-label="Удалить">${ic('trash')}</button></div></div>`}).join('')||'<div class="card empty">Поездок пока нет</div>'}</div>`;
}

/* ---------- health / notes / useful / settings ---------- */
function healthPage(){
  const l=S.health.slice().sort((a,b)=>a.date<b.date?1:-1);
  return `<div class="ptitle"><h2>Здоровье</h2><div class="sp"><button class="btn" data-act="addHealth">${ic('plus')} Добавить запись</button></div></div>
  <div class="card">${l.length?`<div class="tbl-wrap"><table><thead><tr><th>Дата</th><th>Тип</th><th>Запись</th><th>Заметка</th><th class="r">Стоимость</th><th></th></tr></thead><tbody>${l.map(h=>`<tr><td>${dshort(h.date)} ${parse(h.date).getFullYear()}${daysTo(h.date)>0?' <span class="chip g">скоро</span>':''}</td><td><span class="chip">${esc(h.kind)}</span></td><td>${esc(h.title)}</td><td class="muted">${esc(h.note)}</td><td class="r num">${h.cost?vnd(h.cost):'—'}</td><td><div class="acts"><button data-act="editHealth" data-id="${h.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delHealth" data-id="${h.id}" aria-label="Удалить">${ic('trash')}</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Записей пока нет: визиты к врачу, прививки, страховка.</div>'}</div>`;
}
/* ---------- fitness: weight log ---------- */
const kg=n=>(Number(n)||0).toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1})+NB+'кг';
const kgDiff=n=>(n>0?'+':n<0?'−':'')+kg(Math.abs(n));
// weight on the last weighing on or before a day
const kgAt=(l,day)=>{const x=l.filter(w=>w.date<=day);return x.length?Number(x[x.length-1].kg):null};
function weightChart(l){
  if(l.length<2)return '<div class="empty">Чтобы увидеть график, нужно хотя бы два взвешивания.</div>';
  // drawn at about the card's real width, so text and dots keep their size on any screen
  const vw=window.innerWidth||1200,W=Math.round(Math.max(300,Math.min(1240,vw>1024?vw-330:vw-70))),H=vw<560?170:210,px=34,py=18,v=l.map(w=>Number(w.kg)),lo=Math.floor(Math.min(...v)-0.5),hi=Math.ceil(Math.max(...v)+0.5);
  const t0=parse(l[0].date).getTime(),t1=Math.max(parse(l[l.length-1].date).getTime(),t0+864e5);
  const x=d=>px+6+(parse(d).getTime()-t0)/(t1-t0)*(W-px-14),y=k=>py+(hi-k)/(hi-lo)*(H-2*py-14);
  const pts=l.map(w=>x(w.date).toFixed(1)+','+y(Number(w.kg)).toFixed(1)).join(' ');
  const grid=[hi,(hi+lo)/2,lo].map(k=>`<line x1="${px}" x2="${W-8}" y1="${y(k)}" y2="${y(k)}" stroke="#eeece5"/><text x="${px-6}" y="${y(k)+4}" text-anchor="end" font-size="11" fill="#8a8f87">${k.toLocaleString('ru-RU',{maximumFractionDigits:1})}</text>`).join('');
  const g=Number(S.settings.weightGoal);
  const goal=g&&g>=lo&&g<=hi?`<line x1="${px}" x2="${W-8}" y1="${y(g)}" y2="${y(g)}" stroke="#2f9e5b" stroke-dasharray="4 4"/>`:'';
  const dl=(d,a)=>`<text x="${x(d).toFixed(1)}" y="${H-4}" text-anchor="${a}" font-size="11" fill="#8a8f87">${dshort(d)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${grid}${goal}${dl(l[0].date,'start')}${dl(l[l.length-1].date,'end')}<polyline points="${pts}" fill="none" stroke="#2f9e5b" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${l.map(w=>`<circle cx="${x(w.date).toFixed(1)}" cy="${y(Number(w.kg)).toFixed(1)}" r="3.2" fill="#fff" stroke="#2f9e5b" stroke-width="2"/>`).join('')}</svg>`;
}
function fitnessPage(){
  const l=S.weights.slice().sort((a,b)=>a.date<b.date?-1:1),last=l[l.length-1];
  const ago=last?-daysTo(last.date):null,day=n=>iso(new Date(today().getTime()-n*864e5));
  const ch=n=>{const p=kgAt(l,day(n));return last&&p!=null&&l[0].date<=day(n)?Number(last.kg)-p:null};
  const c7=ch(7),c30=ch(30),goal=Number(S.settings.weightGoal)||0;
  const rows=l.slice().reverse().slice(0,30);
  // green is a step towards the goal (or down, when there is no goal yet)
  const good=d=>goal&&last&&goal>Number(last.kg)?d>0:d<0;
  return `<div class="ptitle"><h2>Физическая форма</h2><div class="sp"><button class="btn ghost" data-act="weightGoal">${ic('target')} Цель</button><button class="btn" data-act="addWeight">${ic('plus')} Записать вес</button></div></div>
  <div class="kpis"><div class="card kpi"><small>Текущий вес</small><b class="num">${last?kg(last.kg):'—'}</b><span class="${ago>2?'up':'muted'}">${last?(ago===0?'сегодня':ago===1?'вчера':ago+' '+plural(ago,'день','дня','дней')+' назад'):'взвешиваний пока нет'}</span></div>
    <div class="card kpi"><small>За неделю</small><b class="num">${c7==null?'—':kgDiff(c7)}</b><span class="muted">${c7==null?'мало данных':c7<0?'вес снижается':c7>0?'вес растёт':'без изменений'}</span></div>
    <div class="card kpi"><small>За месяц</small><b class="num">${c30==null?'—':kgDiff(c30)}</b><span class="muted">${c30==null?'мало данных':'с '+dshort(day(30))}</span></div>
    <div class="card kpi"><small>Цель</small><b class="num">${goal?kg(goal):'—'}</b><span class="muted">${goal&&last?(Math.abs(last.kg-goal)<0.05?'цель достигнута 🎉':'осталось '+kg(Math.abs(last.kg-goal))):'нажмите «Цель», чтобы задать'}</span></div></div>
  <div class="card"><div class="chd"><div class="ib g">${ic('chart')}</div><h3>Динамика веса</h3></div>${weightChart(l.slice(-60))}</div>
  <div class="card"><div class="chd"><h3>Взвешивания</h3></div>${rows.length?`<div class="tbl-wrap"><table><thead><tr><th>Дата</th><th class="r">Вес</th><th class="r">Изменение</th><th>Заметка</th><th></th></tr></thead><tbody>
  ${rows.map(w=>{const i=l.indexOf(w),d=i>0?Number(w.kg)-Number(l[i-1].kg):null;return `<tr><td class="num">${dshort(w.date)} ${parse(w.date).getFullYear()}</td><td class="r num"><b>${kg(w.kg)}</b></td><td class="r num ${d==null||!d?'muted':good(d)?'down':'up'}">${d==null?'—':kgDiff(d)}</td><td class="muted">${esc(w.note)}</td><td><div class="acts"><button data-act="editWeight" data-id="${w.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delWeight" data-id="${w.id}" aria-label="Удалить">${ic('trash')}</button></div></td></tr>`}).join('')}
  </tbody></table></div>`:'<div class="empty">Запишите первый вес кнопкой выше или скажите боту: «вес 78,4».</div>'}
  <p class="muted" style="font-size:11px;margin:12px 0 0">Telegram-бот напомнит взвеситься, если записей не было больше двух дней.</p></div>`;
}
function notesPage(){
  return `<div class="ptitle"><h2>Заметки</h2></div>
  <div class="card"><div style="display:flex;gap:8px;margin-bottom:14px"><input class="sel" id="newnote" style="flex:1;height:36px;min-width:0" placeholder="Что нужно сделать?"><button class="btn" data-act="addNote">${ic('plus')} Добавить</button></div>
  <div class="nlist" style="font-size:13px;gap:4px">${S.notes.map(n=>`<div style="display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid var(--line)"><button class="chk ${n.done?'on':''}" data-act="toggleNote" data-id="${n.id}">${n.done?ic('check'):''}</button><span style="flex:1;${n.done?'color:var(--muted);text-decoration:line-through':''}">${esc(n.text)}</span><div class="acts"><button data-act="editNote" data-id="${n.id}" aria-label="Изменить">${ic('edit')}</button><button data-act="delNote" data-id="${n.id}" aria-label="Удалить">${ic('trash')}</button></div></div>`).join('')||'<div class="empty">Список пуст</div>'}</div></div>`;
}
function usefulPage(){
  return `<div class="ptitle"><h2>Полезное</h2><span class="muted">Своя шпаргалка по жизни во Вьетнаме. Текст можно редактировать.</span></div>
  <div class="gridc">${USEFUL.map(([k,l,i])=>`<div class="card"><div class="chd"><div class="ib y">${ic(i)}</div><h3>${l}</h3><button class="btn ghost sp" data-act="useful" data-k="${k}">${ic('edit')} Изменить</button></div><div style="font-size:12.5px;white-space:pre-wrap;line-height:1.55">${esc(S.useful[k]||'Пока пусто')}</div></div>`).join('')}</div>`;
}
function accountCard(){
  if(!user)return `<div class="card"><div class="chd"><div class="ib g">${ic('home')}</div><div><h3>Вход и синхронизация</h3><div class="sub">Общие данные на всех устройствах и Telegram-бот</div></div></div>
  <form id="loginf" class="fgrid"><label class="field full">Email участника<input name="email" id="login-email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
  <div class="full"><button class="btn" type="submit">${ic('arrow')} Получить ссылку для входа</button></div></form>
  <p class="muted" style="font-size:11.5px;margin:10px 0 0">На почту придёт ссылка: откройте её на этом устройстве. Войти могут только адреса из списка участников.</p></div>`;
  return `<div class="card"><div class="chd"><div class="ib g">${ic('check')}</div><div><h3>Вы вошли</h3><div class="sub">${esc(user.email)}</div></div><button class="btn ghost sp" data-act="logout">Выйти</button></div>
  <p style="font-size:12.5px;margin:0 0 10px">Telegram-бот <b>@${VL_SUPABASE.bot}</b> принимает голосовые и текст, сам заполняет все разделы сайта, напоминает о делах и присылает отчёты.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="tgLink">${ic('plane')} Подключить Telegram</button><button class="btn ghost" data-act="pushLocal">Перенести данные из этого браузера</button></div>
  <div id="tgbox"></div></div>`;
}
function settingsPage(){
  const s=S.settings;
  return `<div class="ptitle"><h2>Настройки</h2></div>
  <div class="grid2"><div class="card"><div class="chd"><h3>Основное</h3></div><form id="setf" class="fgrid">
  <label class="field">Имя для приветствия<input name="name" id="s-name" value="${esc(s.name)}"></label>
  <label class="field">Город<input name="city" id="s-city" value="${esc(s.city)}"></label>
  <label class="field">Температура, °C<input name="temp" id="s-temp" type="number" value="${esc(s.temp)}"></label>
  <label class="field">Ощущается как, °C<input name="feels" id="s-feels" type="number" value="${esc(s.feels)}"></label>
  <label class="field">Курс: донгов за 1 $<input name="rate" id="s-rate" type="number" value="${esc(s.rate)}"></label>
  <label class="field">Бюджет на месяц, ₫<input name="budget" id="s-budget" type="number" value="${esc(s.budget)}"></label>
  <label class="field">Цена кВт·ч, ₫<input name="kwhPrice" id="s-kwh" type="number" value="${esc(s.kwhPrice)}"></label>
  <label class="field full">Девиз под приветствием<input name="quote" id="s-quote" value="${esc(s.quote)}"></label>
  <div class="full"><button class="btn" type="submit">${ic('check')} Сохранить</button></div></form></div>
  ${sb?accountCard():''}
  <div class="card"><div class="chd"><h3>Данные</h3></div><p style="font-size:12.5px;margin-top:0">${dbKind==='cloud'?'Данные хранятся в облаке и общие для всех участников. Telegram-бот добавляет записи сюда же.':mode==='db'?'Данные хранятся в базе этого артефакта. Поделитесь страницей с партнёром (уровень «Участник» или выше), и вы будете вести бюджет вместе.':'Данные хранятся в этом браузере.'}</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="exportJson">${ic('copy')} Экспорт в JSON</button><button class="btn ghost" data-act="importJson">Импорт из JSON</button><button class="btn danger" data-act="resetDemo">Загрузить пример из макета</button><button class="btn danger" data-act="clearAll">Очистить всё</button></div>
  <textarea id="jsonbox" class="notearea" style="margin-top:12px;min-height:140px" placeholder="Здесь появится JSON для копирования, или вставьте сюда JSON для импорта" hidden></textarea>
  <div id="confirm"></div></div></div>`;
}

/* ---------- render ---------- */
const PAGES={home,expenses:expensesPage,money:moneyPage,fitness:fitnessPage,analytics:analyticsPage,housing:housingPage,utilities:utilitiesPage,food:foodPage,goals:goalsPage,calendar:calendarPage,trips:tripsPage,health:healthPage,notes:notesPage,useful:usefulPage,settings:settingsPage};
let rootEl;
function render(){
  if(!rootEl)return;
  const ae=document.activeElement,aid=ae&&ae.id,pos=ae&&ae.selectionStart;
  rootEl.innerHTML=shell();
  $('#page').innerHTML=(PAGES[U.route]||home)();
  if(U.route==='utilities')kwCalc();
  // entrance animation only once, after the data is loaded: every click re-renders the whole page
  if(loaded&&!introDone){introDone=true;rootEl.classList.add("intro");setTimeout(()=>rootEl.classList.remove("intro"),1400)}
  if(aid&&document.getElementById(aid)){const el=document.getElementById(aid);el.focus();try{if(pos!=null)el.setSelectionRange(pos,pos)}catch(e){}}
  if(U.q)searchRender();
}

/* ---------- search ---------- */
function searchRender(){
  const box=$('#sres');if(!box)return;const q=U.q.trim().toLowerCase();if(!q){box.innerHTML='';return}
  const r=[];
  S.expenses.forEach(e=>{if((e.note+' '+e.cat).toLowerCase().includes(q))r.push(['expenses',e.note||e.cat,dshort(e.date)+' · '+vnd(e.amount)])});
  S.events.forEach(e=>{if(e.title.toLowerCase().includes(q))r.push(['calendar',e.title,dshort(e.date)])});
  S.notes.forEach(e=>{if(e.text.toLowerCase().includes(q))r.push(['notes',e.text,'Заметка'])});
  S.incomes.forEach(e=>{if(String(e.source).toLowerCase().includes(q))r.push(['money',e.source,dshort(e.date)+' · '+cash(e.amount,e.cur)])});
  S.goals.forEach(e=>{if(e.title.toLowerCase().includes(q))r.push(['goals',e.title,'Цель'])});
  S.trips.forEach(e=>{if(e.city.toLowerCase().includes(q))r.push(['trips',e.city,'Поездка'])});
  S.apartments.forEach(e=>{if((e.city+' '+e.name).toLowerCase().includes(q))r.push(['housing',e.city+', '+e.name,'Квартира'])});
  NAV.forEach(n=>{if(n[1].toLowerCase().includes(q))r.push([n[0],n[1],'Раздел'])});
  box.innerHTML=`<div class="sres">${r.slice(0,12).map(x=>`<a href="#${x[0]}" data-act="clearq"><span>${esc(x[1])}</span><em>${esc(x[2])}</em></a>`).join('')||'<a><span>Ничего не найдено</span></a>'}</div>`;
}

/* ---------- modal form ---------- */
function form(title,fields,vals,onSave,onDel){
  const bg=document.createElement('div');bg.className='modal-bg';
  bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><form class="fgrid">${fields.map(f=>{const v=vals[f.k]!=null?vals[f.k]:(f.def!=null?f.def:'');const id='f-'+f.k;
    if(f.t==='select')return `<label class="field ${f.full?'full':''}">${f.l}<select id="${id}" name="${f.k}">${f.o.map(o=>{const [val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(lab)}</option>`}).join('')}</select></label>`;
    if(f.t==='check')return `<label class="field ${f.full?'full':''}" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="${id}" name="${f.k}" ${v?'checked':''}>${f.l}</label>`;
    if(f.t==='area')return `<label class="field full">${f.l}<textarea id="${id}" name="${f.k}" rows="6">${esc(v)}</textarea></label>`;
    return `<label class="field ${f.full?'full':''}">${f.l}<input id="${id}" name="${f.k}" type="${f.t||'text'}" value="${esc(v)}" ${f.req?'required':''} ${f.t==='number'?'step="any"':''}></label>`}).join('')}
    <div class="mfoot full">${onDel?`<button type="button" class="btn danger l" data-x="del">${ic('trash')} Удалить</button>`:''}<button type="button" class="btn ghost" data-x="cancel">Отмена</button><button class="btn" type="submit">${ic('check')} Сохранить</button></div></form></div>`;
  document.body.appendChild(bg);
  const close=()=>bg.remove();
  bg.addEventListener('click',e=>{if(e.target===bg)close();const x=e.target.closest('[data-x]');if(!x)return;if(x.dataset.x==='cancel')close();if(x.dataset.x==='del'){if(x.dataset.sure){onDel();close()}else{x.dataset.sure='1';x.innerHTML='Точно удалить?'}}});
  bg.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const o={};fields.forEach(f=>{const el=bg.querySelector('#f-'+f.k);o[f.k]=f.t==='check'?el.checked:f.t==='number'?(el.value===''?0:Number(el.value)):el.value.trim()});onSave(o);close()});
  const first=bg.querySelector('input,select,textarea');if(first)first.focus();
  document.addEventListener('keydown',function k(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',k)}});
}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
const upsert=(sec,item)=>{const a=S[sec];const i=a.findIndex(x=>x.id===item.id);if(i>=0)a[i]=item;else a.push(item);save(sec)};
const remove=(sec,id)=>{S[sec]=S[sec].filter(x=>x.id!==id);save(sec)};
const find=(sec,id)=>S[sec].find(x=>x.id===id);

const F={
 expense:[{k:'date',l:'Дата',t:'date',req:1},{k:'amount',l:'Сумма, ₫',t:'number',req:1},{k:'cat',l:'Категория',t:'select',o:CATS.map(c=>c[0]),full:1},{k:'note',l:'Описание',full:1}],
 apt:[{k:'city',l:'Город',req:1},{k:'name',l:'Название / район',req:1},{k:'price',l:'Аренда в месяц, ₫',t:'number'},{k:'deposit',l:'Депозит, ₫',t:'number'},{k:'rooms',l:'Комнат',t:'number'},{k:'area',l:'Площадь, м²',t:'number'},{k:'view',l:'Вид',full:1},{k:'from',l:'Заехали',t:'date'},{k:'to',l:'Выехали',t:'date'},{k:'img',l:'Фото',t:'select',o:[['apt_main','Фото 1'],['apt1','Фото 2'],['apt2','Фото 3'],['apt3','Фото 4'],['apt4','Фото 5']]},{k:'current',l:'Живём сейчас',t:'check'},{k:'note',l:'Заметка',full:1}],
 util:[{k:'month',l:'Месяц',t:'month',req:1},{k:'kwh',l:'Электричество, кВт·ч',t:'number'},...UTIL.map(([k,l])=>({k,l:l+', ₫',t:'number'}))],
 goal:[{k:'title',l:'Цель',req:1,full:1},{k:'saved',l:'Накоплено, $',t:'number'},{k:'target',l:'Нужно, $',t:'number'},{k:'color',l:'Цвет',t:'select',o:[['#2f9e5b','Зелёный'],['#e8484a','Красный'],['#f5a63c','Оранжевый'],['#4c7fe0','Синий'],['#6b62d9','Фиолетовый']]},{k:'icon',l:'Иконка',t:'select',o:GOAL_ICONS},{k:'featured',l:'Показывать на главной',t:'check',full:1}],
 event:[{k:'title',l:'Название',req:1,full:1},{k:'date',l:'Дата',t:'date',req:1},{k:'type',l:'Тип',t:'select',o:Object.entries(EVT).map(([k,v])=>[k,v[1]])},{k:'from',l:'Начало (пусто — весь день)',t:'time'},{k:'to',l:'Конец',t:'time'}],
 trip:[{k:'city',l:'Куда',req:1,full:1},{k:'from',l:'С',t:'date',req:1},{k:'to',l:'По',t:'date',req:1},{k:'budget',l:'Бюджет, ₫',t:'number'},{k:'img',l:'Фото',t:'select',o:[['trip1','Горы и море'],['trip2','Закат'],['trip3','Скалы'],['danang_card','Пляж']]},{k:'note',l:'Заметки',full:1}],
 health:[{k:'date',l:'Дата',t:'date',req:1},{k:'kind',l:'Тип',t:'select',o:['Врач','Анализы','Прививка','Страховка','Спорт','Другое']},{k:'title',l:'Запись',req:1,full:1},{k:'cost',l:'Стоимость, ₫',t:'number'},{k:'note',l:'Заметка'}],
 weight:[{k:'date',l:'Дата',t:'date',req:1},{k:'kg',l:'Вес, кг',t:'number',req:1},{k:'note',l:'Заметка',full:1}],
 account:[{k:'name',l:'Название',req:1,full:1},{k:'cur',l:'Валюта',t:'select',o:Object.keys(CUR).map(c=>[c,CUR[c][1]+' '+CUR[c][0]])},{k:'start',l:'Начальный остаток',t:'number'}]
};
// lists of accounts change, so these forms are built when opened
const accOpts=(c,none)=>(none?[['',none]]:[]).concat(S.accounts.filter(a=>!c||a.cur===c).map(a=>[a.id,a.name+' · '+(CUR[a.cur]||CUR.VND)[0]]));
const incomeF=()=>[{k:'date',l:'Дата',t:'date',req:1},{k:'amount',l:'Сумма',t:'number',req:1},{k:'cur',l:'Валюта',t:'select',o:Object.keys(CUR).map(c=>[c,CUR[c][1]+' '+CUR[c][0]])},{k:'acc',l:'Счёт',t:'select',o:accOpts('','Счёт в этой валюте')},{k:'source',l:'Источник',full:1}];
const transferF=()=>[{k:'date',l:'Дата',t:'date',req:1},{k:'note',l:'Заметка'},{k:'from',l:'Откуда',t:'select',o:accOpts()},{k:'out',l:'Отдали',t:'number',req:1},{k:'to',l:'Куда',t:'select',o:accOpts()},{k:'in',l:'Получили',t:'number',req:1},{k:'fee',l:'Комиссия (в валюте «откуда»)',t:'number',full:1}];
const expenseF=()=>S.accounts.some(a=>a.cur==='VND')?F.expense.concat([{k:'acc',l:'Счёт',t:'select',o:accOpts('VND','Не указан'),full:1}]):F.expense;
// a dong amount for an income: the rate from the settings, otherwise today's rate
const incomeVnd=o=>{const r=rateOf(o.cur);return {...o,acc:o.acc||accFor(o.cur).id,rate:r,vnd:Math.round((Number(o.amount)||0)*r)}};
const transferFee=o=>({...o,feeCur:o.fee?(accById(o.from)||{}).cur||'':'',feeAcc:o.fee?o.from:''});

/* ---------- actions ---------- */
function act(a,el){
  const id=el.dataset.id;
  switch(a){
  case 'day':U.day=+el.dataset.i;render();break;
  case 'meal':{const d=+el.dataset.d,j=+el.dataset.j;const m=S.meals.days[d].items[j];form(MEALT[j]+', '+S.meals.days[d].day,[{k:'name',l:'Блюдо',req:1,full:1},{k:'desc',l:'Дополнение',full:1},{k:'kcal',l:'Калории',t:'number'}],m,o=>{S.meals.days[d].items[j]=o;save('meals')});break}
  case 'addExpense':form('Новый расход',expenseF(),{date:iso(new Date()),cat:U.expCat||'Питание'},o=>{upsert('expenses',{id:uid(),...o});toast('Расход добавлен')});break;
  case 'editExpense':{const e=find('expenses',id);form('Расход',expenseF(),e,o=>upsert('expenses',{...e,...o}),()=>remove('expenses',id));break}
  case 'addIncome':form('Новый доход',incomeF(),{date:iso(new Date()),cur:'RUB',source:'Зарплата'},o=>{if(o.cur!=='VND'&&!rateOf(o.cur)){toast('Курс '+o.cur+' неизвестен: задайте его в блоке «Курсы валют»');return}upsert('incomes',{id:uid(),...incomeVnd(o)});toast('Доход добавлен')});break;
  // an edited income keeps the rate it was saved with, unless its currency changed
  case 'editIncome':{const e=find('incomes',id);form('Доход',incomeF(),e,o=>{const v=incomeVnd(o);if(o.cur===e.cur&&e.rate){v.rate=e.rate;v.vnd=Math.round((Number(o.amount)||0)*e.rate)}upsert('incomes',{...e,...v})},()=>remove('incomes',id));break}
  case 'delIncome':remove('incomes',id);toast('Удалено');break;
  // one weighing per day: a second one the same day replaces it
  case 'addWeight':{const l=S.weights;form('Вес',F.weight,{date:iso(new Date()),kg:l.length?l.slice().sort((a,b)=>a.date<b.date?1:-1)[0].kg:''},o=>{const ex=l.find(w=>w.date===o.date);upsert('weights',{id:ex?ex.id:uid(),...o});toast('Вес записан')});break}
  case 'editWeight':{const e=find('weights',id);form('Вес',F.weight,e,o=>upsert('weights',{...e,...o}),()=>remove('weights',id));break}
  case 'delWeight':remove('weights',id);break;
  case 'weightGoal':form('Цель по весу',[{k:'weightGoal',l:'Желаемый вес, кг',t:'number',full:1}],{weightGoal:S.settings.weightGoal||''},o=>{S.settings={...S.settings,weightGoal:o.weightGoal};save('settings')});break;
  case 'addAccount':form('Новый счёт',F.account,{cur:'VND',start:0},o=>upsert('accounts',{id:uid(),...o}));break;
  case 'editAccount':{const e=find('accounts',id);form('Счёт',F.account,e,o=>upsert('accounts',{...e,...o}),()=>remove('accounts',id));break}
  case 'delAccount':remove('accounts',id);break;
  case 'addTransfer':if(!S.accounts.length){toast('Сначала добавьте счета, между которыми был обмен');break}
    form('Обмен или перевод',transferF(),{date:iso(new Date()),from:S.accounts[0].id,to:(S.accounts[1]||S.accounts[0]).id},o=>upsert('transfers',{id:uid(),...transferFee(o)}));break;
  case 'editTransfer':{const e=find('transfers',id);form('Обмен или перевод',transferF(),e,o=>upsert('transfers',{...e,...transferFee(o)}),()=>remove('transfers',id));break}
  case 'delTransfer':remove('transfers',id);break;
  case 'liveRates':{const f=$('#ratef');Object.keys(CUR).forEach(c=>{const el=f&&f.elements[c];if(el&&U.live[c])el.value=Math.round(U.live[c]*100)/100});toast(Object.values(U.live).some(Boolean)?'Подставлены сегодняшние курсы, нажмите «Сохранить»':'Курсы ещё загружаются, попробуйте через секунду');break}
  case 'delExpense':remove('expenses',id);toast('Удалено');break;
  case 'addApt':form('Новая квартира',F.apt,{img:'apt1',rooms:1,from:iso(new Date())},o=>{if(o.current)S.apartments.forEach(x=>x.current=false);upsert('apartments',{id:uid(),...o})});break;
  case 'editApt':{const e=find('apartments',id);form('Квартира',F.apt,e,o=>{if(o.current)S.apartments.forEach(x=>{if(x.id!==id)x.current=false});upsert('apartments',{...e,...o})},()=>remove('apartments',id));break}
  case 'delApt':remove('apartments',id);break;
  case 'addUtil':form('Коммуналка за месяц',F.util,{month:mkey(new Date()),internet:250000,garbage:120000},o=>{const ex=S.utilities.find(u=>u.month===o.month);upsert('utilities',{id:ex?ex.id:uid(),...o})});break;
  case 'editUtil':{const e=find('utilities',id);form('Коммуналка',F.util,e,o=>upsert('utilities',{...e,...o}),()=>remove('utilities',id));break}
  case 'delUtil':remove('utilities',id);break;
  case 'addGoal':form('Новая цель',F.goal,{color:'#2f9e5b',icon:'star',saved:0},o=>{if(o.featured)S.goals.forEach(x=>x.featured=false);upsert('goals',{id:uid(),...o})});break;
  case 'editGoal':{const e=find('goals',id);form('Цель',F.goal,e,o=>{if(o.featured)S.goals.forEach(x=>{if(x.id!==id)x.featured=false});upsert('goals',{...e,...o})},()=>remove('goals',id));break}
  case 'delGoal':remove('goals',id);break;
  case 'contrib':{const e=find('goals',id);form('Пополнить: '+e.title,[{k:'add',l:'Сумма, $',t:'number',req:1,full:1}],{},o=>{e.saved=(+e.saved||0)+(+o.add||0);save('goals');toast('Цель пополнена')});break}
  case 'addEvent':form('Новое событие',F.event,{date:el.dataset.date||iso(new Date()),type:'other'},o=>upsert('events',{id:uid(),done:false,...o}));break;
  case 'editEvent':{const e=find('events',id);form('Событие',F.event,e,o=>upsert('events',{...e,...o}),()=>remove('events',id));break}
  case 'delEvent':remove('events',id);break;
  case 'toggleEvent':{const e=find('events',id);e.done=!e.done;save('events');break}
  case 'calPrev':U.calMonth=shiftM(U.calMonth,-1);render();break;
  case 'calNext':U.calMonth=shiftM(U.calMonth,1);render();break;
  case 'addTrip':form('Новая поездка',F.trip,{img:'trip1'},o=>upsert('trips',{id:uid(),checklist:[{t:'Купить билеты',d:false},{t:'Забронировать отель',d:false},{t:'Составить маршрут',d:false},{t:'Оформить страховку',d:false}],...o}));break;
  case 'editTrip':{const e=find('trips',id);form('Поездка',F.trip,e,o=>upsert('trips',{...e,...o}),()=>remove('trips',id));break}
  case 'delTrip':remove('trips',id);break;
  case 'tripCheck':{const t=find('trips',id);const c=t.checklist[+el.dataset.j];c.d=!c.d;save('trips');break}
  case 'addCheck':{const inp=document.getElementById('ck-'+id);const v=inp&&inp.value.trim();if(v){find('trips',id).checklist.push({t:v,d:false});save('trips')}break}
  case 'addHealth':form('Новая запись',F.health,{date:iso(new Date()),kind:'Врач'},o=>upsert('health',{id:uid(),...o}));break;
  case 'editHealth':{const e=find('health',id);form('Запись',F.health,e,o=>upsert('health',{...e,...o}),()=>remove('health',id));break}
  case 'delHealth':remove('health',id);break;
  case 'addNote':{const v=$('#newnote').value.trim();if(v){S.notes.unshift({id:uid(),text:v,done:false});save('notes')}break}
  case 'toggleNote':{const n=find('notes',id);n.done=!n.done;save('notes');break}
  case 'editNote':{const n=find('notes',id);form('Заметка',[{k:'text',l:'Текст',req:1,full:1}],n,o=>upsert('notes',{...n,...o}),()=>remove('notes',id));break}
  case 'delNote':remove('notes',id);break;
  case 'useful':{const k=el.dataset.k;const l=USEFUL.find(u=>u[0]===k);form(l[1],[{k:'text',l:'Заметки',t:'area'}],{text:S.useful[k]||''},o=>{S.useful={...S.useful,[k]:o.text};save('useful')});break}
  case 'clearq':U.q='';break;
  case 'logout':sb.auth.signOut();break;
  case 'tgLink':{const code=Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6);
    sb.from('vl_tg_codes').insert({code,email:user.email}).then(({error})=>{const b=$('#tgbox');if(!b)return;if(error){toast('Не получилось: '+error.message);return}
      const url='https://t.me/'+VL_SUPABASE.bot+'?start='+code;b.innerHTML=`<div style="margin-top:12px;padding:12px;border-radius:10px;background:var(--green-soft);font-size:12.5px">Откройте ссылку и нажмите «Start» в Telegram (действует 15 минут):<br><a class="link" style="margin-top:6px;color:var(--green)" href="${url}" target="_blank" rel="noopener">${url} ${ic('arrow')}</a></div>`})}break;
  case 'pushLocal':{const l=lsGet();if(!l){toast('В этом браузере нет сохранённых данных');break}
    confirmBox('Заменить облачные данные данными из этого браузера?',()=>{SECS.forEach(k=>{if(l[k]!=null){S[k]=l[k];db.doc('vl/'+k).set(JSON.parse(JSON.stringify(body(k)))).catch(e=>toast('Ошибка: '+e.message))}});render();toast('Данные перенесены в облако')});break}
  case 'exportJson':{const b=$('#jsonbox');b.hidden=false;b.value=JSON.stringify(S,null,1);b.select();try{navigator.clipboard.writeText(b.value).then(()=>toast('JSON скопирован'),()=>toast('Выделите и скопируйте текст'))}catch(e){}break}
  case 'importJson':{const b=$('#jsonbox');if(b.hidden||!b.value.trim()){b.hidden=false;b.value='';b.focus();toast('Вставьте JSON и нажмите «Импорт» ещё раз');break}try{const d=JSON.parse(b.value);SECS.forEach(s=>{if(d[s]!=null){S[s]=d[s];save(s)}});toast('Данные импортированы')}catch(e){toast('Это не похоже на корректный JSON')}break}
  case 'resetDemo':confirmBox('Заменить все данные примером из макета?',()=>loadDemo());break;
  case 'clearAll':confirmBox('Удалить все записи? Настройки останутся.',()=>{['expenses','incomes','accounts','transfers','utilities','apartments','goals','events','trips','notes','health','weights'].forEach(s=>{S[s]=[];save(s)});toast('Данные очищены')});break;
  }
}
function confirmBox(msg,fn){const c=$('#confirm');c.innerHTML=`<div style="margin-top:12px;padding:12px;border-radius:10px;background:#fdf1f0;font-size:12.5px">${esc(msg)}<div style="display:flex;gap:8px;margin-top:8px"><button class="btn danger" id="cy">Да</button><button class="btn ghost" id="cn">Отмена</button></div></div>`;$('#cy').onclick=()=>{c.innerHTML='';fn()};$('#cn').onclick=()=>c.innerHTML=''}

function bind(){
  rootEl.addEventListener('click',e=>{
    if(e.target.closest('#burger')){$('#side').classList.toggle('open');return}
    const el=e.target.closest('[data-act]');
    if(!el){if(!e.target.closest('.search')&&U.q){U.q='';const b=$('#sres');if(b)b.innerHTML=''}return}
    if(el.tagName==='SELECT')return;
    if(el.tagName==='LABEL')return;
    e.preventDefault&&el.tagName!=='A'&&e.preventDefault();
    e.stopPropagation();
    act(el.dataset.act,el);
  });
  // the weight chart is drawn for the screen width
  let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(U.route==='fitness')render()},200)});
  rootEl.addEventListener('change',e=>{const el=e.target;const a=el.dataset&&el.dataset.act;if(!a)return;if(a in U){U[a]=el.value;render()}});
  rootEl.addEventListener('input',e=>{if(e.target.id==='q'){U.q=e.target.value;searchRender()}if(/^kw/.test(e.target.id))kwCalc()});
  rootEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='newnote'){e.preventDefault();act('addNote',e.target)}if(e.key==='Enter'&&e.target.id&&e.target.id.startsWith('ck-')){e.preventDefault();act('addCheck',{dataset:{id:e.target.id.slice(3)}})}});
  rootEl.addEventListener('submit',e=>{if(e.target.id==='loginf'){e.preventDefault();const email=e.target.email.value.trim();const btn=e.target.querySelector('button');btn.disabled=true;
      sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}}).then(({error})=>{btn.disabled=false;toast(error?(/closed|закрыта|Database error/i.test(error.message)?'Этого адреса нет в списке участников':'Ошибка: '+error.message):'Ссылка для входа отправлена на '+email)});return}
    if(e.target.id==='setf'){e.preventDefault();const fd=new FormData(e.target);const o={};fd.forEach((v,k)=>o[k]=['temp','feels','rate','budget','kwhPrice'].includes(k)?Number(v):v);S.settings={...S.settings,...o};save('settings');toast('Сохранено')}
    // currency rates: the dollar is the old "rate" setting, the rest live in settings.rates; an empty field means today's rate
    if(e.target.id==='ratef'){e.preventDefault();const fd=new FormData(e.target);const rates={};fd.forEach((v,k)=>{if(k!=='USD'&&Number(v))rates[k]=Number(v)});
      S.settings={...S.settings,rates,rate:Number(fd.get('USD'))||S.settings.rate};save('settings');toast('Курсы сохранены')}});
}
document.addEventListener('DOMContentLoaded',()=>{rootEl=document.getElementById('root');bind();init()});
if(document.readyState!=='loading'){rootEl=document.getElementById('root');bind();init()}
})();

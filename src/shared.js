import { DateTime } from 'luxon';
export const zone='America/New_York';
export const today=()=>DateTime.now().setZone(zone).toISODate();
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const emptyContent={hero:{image:'/public/images/masjid-hero.png',imageAlt:''},jummah:{dateLabel:'',shifts:[]},news:[],events:[],programs:[],settings:{}};
export async function request(url,options={}) {
  const res=await fetch(url,{cache:'no-store',...options});
  const data=await res.json();if(!res.ok)throw Object.assign(new Error(data.error||'Request failed'),{status:res.status});return data;
}
function readCache(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function saveCache(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Storage can be disabled. */}}
export async function loadContent() {
  try {const value=await request('/api/content');saveCache('icm-connected-published',value);return value.content;}
  catch{return readCache('icm-connected-published')?.content||structuredClone(emptyContent);}
}
export async function loadMonth(month) {
  const key='icm-connected-prayers-'+month;
  try{const result=await request('/api/prayers?month='+encodeURIComponent(month));saveCache(key,result);return result;}
  catch(e){const saved=readCache(key);if(saved)return {...saved,stale:true,error:'Offline: displaying the last saved official schedule'};throw e;}
}
export function watchContent(render) {
  let previous='',busy=false;
  async function update(){if(busy)return;busy=true;try{const content=await loadContent(),serialized=JSON.stringify(content);if(serialized!==previous){previous=serialized;render(content);}}finally{busy=false;}}
  update();const timer=setInterval(()=>{if(!document.hidden)update();},15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
  window.addEventListener('online',update);return ()=>clearInterval(timer);
}
export function prayerInstant(day,time) {return DateTime.fromFormat(day+' '+time,'yyyy-MM-dd h:mm a',{zone,locale:'en-US'}).toMillis();}
export function contentLinks(content) {
  const s=content.settings||{};
  document.querySelectorAll('[data-newsletter-link]').forEach(link=>{if(s.newsletterUrl)link.href=s.newsletterUrl;});
  document.querySelectorAll('a[href="https://www.icmnc.org/donate/"], a[href="./donate.html"], a[href="/donate.html"]').forEach(link=>link.setAttribute('data-donation-link',''));
  document.querySelectorAll('[data-donation-link]').forEach(link=>{if(s.donationUrl)link.href=s.donationUrl;});
  for(const link of document.querySelectorAll('.socials a')){const name=link.getAttribute('aria-label')?.toLowerCase();if(name in s){if(s[name])link.href=s[name];else link.removeAttribute('href');}}
}
export function articleLink(item){return '/news.html#'+encodeURIComponent(item.id);}

export async function renderWebsitePrayers() {
  const day=today();let rows=[];
  try {const result=await loadMonth(day.slice(0,7));rows=result.rows;
    const target=document.querySelector('[data-page-prayers]');
    if(target)target.title=result.stale?'Last saved official WordPress schedule':'Official ICM WordPress schedule';
  }catch{/* Show unavailable rather than invented times. */}
  const row=rows.find(r=>r.key===day),keys=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
  keys.forEach(k=>document.querySelectorAll(`[data-prayer-time="${k}"]`).forEach(el=>el.textContent=row?.[k]||'—'));
  const table=document.querySelector('[data-page-prayers]');
  if(table)table.innerHTML=row?keys.map(k=>`<div class="schedule-row"><span>${k[0].toUpperCase()+k.slice(1)}</span><strong>${esc(row[k])}${k!=='sunrise'?` · Iqamah ${esc(row[k+'Iqamah'])}`:''}</strong></div>`).join(''):'<p>The official prayer schedule is temporarily unavailable.</p>';
  let next=rows.flatMap(r=>keys.filter(k=>k!=='sunrise').map(k=>({key:k,label:r[k],time:prayerInstant(r.key,r[k])}))).find(r=>r.time>Date.now());
  if(!next&&row){try{const tomorrow=DateTime.fromISO(day,{zone}).plus({days:1}).toISODate();const m=await loadMonth(tomorrow.slice(0,7));const r=m.rows.find(r=>r.key===tomorrow);if(r)next={key:'fajr',label:r.fajr,time:prayerInstant(r.key,r.fajr)};}catch{}}
  const set=(s,v)=>document.querySelectorAll(s).forEach(el=>el.textContent=v);
  set('[data-next-name]',next?next.key[0].toUpperCase()+next.key.slice(1):'Schedule unavailable');set('[data-next-time]',next?.label||'—');
  document.querySelectorAll('[data-countdown]').forEach(el=>el.setAttribute('aria-label',next?`Time remaining until ${next.key[0].toUpperCase()+next.key.slice(1)}`:'Prayer countdown unavailable'));
  document.querySelectorAll('[data-prayer-tile]').forEach(el=>el.classList.toggle('active',el.dataset.prayerTile===next?.key));
  clearInterval(renderWebsitePrayers.timer);
  const tick=()=>{const seconds=next?Math.max(0,Math.ceil((next.time-Date.now())/1000)):0;set('[data-countdown-hours]',String(Math.floor(seconds/3600)).padStart(2,'0'));set('[data-countdown-minutes]',String(Math.floor(seconds%3600/60)).padStart(2,'0'));set('[data-countdown-seconds]',String(seconds%60).padStart(2,'0'));if(next&&seconds===0){clearInterval(renderWebsitePrayers.timer);renderWebsitePrayers();}};
  tick();renderWebsitePrayers.timer=setInterval(tick,1000);
}

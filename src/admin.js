import { request,esc,today } from './shared.js';
let session,state,revision,dirty=false,prayerRows=[],prayerMonth=today().slice(0,7);
const app=document.querySelector('[data-cms-app]'),status=document.querySelector('[data-status]');
const say=(message)=>status.textContent=message;
const field=(path,label,value,type='text')=>`<label class="cms-field"><span>${esc(label)}</span><input type="${type}" data-path="${path}" value="${esc(value)}"></label>`;
const area=(path,label,value)=>`<label class="cms-field cms-field-wide"><span>${esc(label)}</span><textarea data-path="${path}">${esc(value)}</textarea></label>`;
const panel=(title,body,actions='')=>`<section class="cms-panel"><header><h2>${esc(title)}</h2>${actions}</header><div class="cms-grid">${body}</div></section>`;
const button=(action,label,extra='')=>`<button type="button" data-action="${action}" ${extra}>${esc(label)}</button>`;
async function api(url,method='GET',data){return request(url,{method,headers:{'content-type':'application/json','x-csrf-token':session?.csrf||''},...(data?{body:JSON.stringify(data)}:{})});}
function loginView(){
  document.querySelectorAll('[data-editor-action]').forEach(e=>e.hidden=true);
  app.innerHTML=panel('Sign in',`<form id="login"><label class="cms-field">Username<input name="username" autocomplete="username" required></label><label class="cms-field">Password<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Sign in</button></form>`);
}
function set(path,value){const parts=path.split('.');let target=state;for(const part of parts.slice(0,-1))target=target[part];target[parts.at(-1)]=value;dirty=true;}
const upload=path=>`<label class="cms-field">Upload image (PNG, JPEG, WebP · max 1.5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="${path}"></label>`;
document.addEventListener('change',async e=>{
 if(!e.target.dataset.upload)return;const file=e.target.files[0];if(!file)return;
 try{if(file.size>1500000)throw new Error('Image must be smaller than 1.5 MB');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
 const r=await api('/api/admin/media','POST',{mime:file.type,data});set(e.target.dataset.upload,r.url);render();say('Image uploaded. Save your draft or publish when ready.');
 }catch(err){say(err.message);}
});
function render(){
 document.querySelectorAll('[data-editor-action]').forEach(e=>e.hidden=false);
 app.innerHTML=panel('News & newsletters',state.news.map((n,i)=>`<article class="cms-item cms-field-wide"><header><strong>${esc(n.title)}</strong>${button('remove','Remove',`data-group="news" data-index="${i}"`)}</header><div class="cms-grid">
 ${field(`news.${i}.title`,'Title',n.title)}${field(`news.${i}.date`,'Issue date',n.date,'date')}
 <label class="cms-field">Type<select data-path="news.${i}.kind"><option value="news" ${n.kind==='news'?'selected':''}>News</option><option value="newsletter" ${n.kind==='newsletter'?'selected':''}>Newsletter</option></select></label>
 ${area(`news.${i}.summary`,'Summary',n.summary)}${area(`news.${i}.body`,'Full text',n.body)}
 ${field(`news.${i}.image`,'Image URL',n.image)}${upload(`news.${i}.image`)}${field(`news.${i}.imageAlt`,'Image description',n.imageAlt)}
 ${field(`news.${i}.url`,'Original newsletter / registration URL (optional)',n.url)}
 </div></article>`).join(''),button('add-news','Add news')+button('add-newsletter','Add newsletter'))+
 panel("Jumu’ah",field('jummah.dateLabel','Friday date / label',state.jummah.dateLabel)+state.jummah.shifts.map((s,i)=>`<article class="cms-item cms-field-wide">${button('remove','Remove shift',`data-group="jummah" data-index="${i}"`)}<div class="cms-grid">${Object.keys(s).map(k=>field(`jummah.shifts.${i}.${k}`,k,s[k])).join('')}</div></article>`).join(''),button('add-jummah','Add shift'))+
 panel('Events',state.events.map((e,i)=>`<article class="cms-item cms-field-wide">${button('remove','Remove event',`data-group="events" data-index="${i}"`)}<div class="cms-grid">${['title','date','time','location','description','url'].map(k=>field(`events.${i}.${k}`,k,e[k],k==='date'?'date':'text')).join('')}</div></article>`).join(''),button('add-event','Add event'))+
 panel('Programs',state.programs.map((e,i)=>`<article class="cms-item cms-field-wide">${button('remove','Remove program',`data-group="programs" data-index="${i}"`)}<div class="cms-grid">${['title','description','schedule','url','category'].map(k=>field(`programs.${i}.${k}`,k,e[k])).join('')}</div></article>`).join(''),button('add-program','Add program'))+
 panel('Shared links & contact details',Object.keys(state.settings).map(k=>field('settings.'+k,k,state.settings[k])).join(''))+
 panel('Homepage image',field('hero.image','Image URL',state.hero.image)+upload('hero.image')+field('hero.imageAlt','Image description',state.hero.imageAlt))+
 panel('Official WordPress prayer schedule',`<p class="cms-field-wide">WordPress controls the official times. Sync reads the existing ICM timetable. Changes here are proposals for the WordPress editor, and do not publish to visitors.</p><label class="cms-field">Month<input id="prayer-month" type="month" value="${prayerMonth}"></label><div>${button('schedule','Load month')}${button('sync','Sync from WordPress')} <a href="https://www.icmnc.org/wp-admin/admin.php?page=dpt" target="_blank" rel="noopener">Open WordPress prayer editor</a></div><p id="prayer-status" class="cms-field-wide"></p><div id="prayer-table" class="cms-field-wide" style="overflow:auto"></div>${button('proposal','Save schedule proposal')}${button('export-proposal','Download proposal')}`) +
 panel('Publishing history',`<div id="revisions" class="cms-field-wide"></div>`,button('history','Load history'));
}
async function load(){const r=await api('/api/admin/content');state=r.content;revision=r.revision;dirty=false;render();say('Draft loaded. Publish makes these changes available to both the website and app.');}
async function save(publish){const r=await api('/api/admin/content','PUT',{content:state,revision,publish});state=r.content;revision=r.revision;dirty=false;say(publish?'Published to website and app. Open screens refresh within 15 seconds.':'Draft saved. Public content is unchanged.');}
function scheduleTable(){document.querySelector('#prayer-table').innerHTML=`<table><thead><tr><th>Date</th>${['fajr','fajrIqamah','sunrise','dhuhr','dhuhrIqamah','asr','asrIqamah','maghrib','maghribIqamah','isha','ishaIqamah'].map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>${prayerRows.map((r,i)=>`<tr><td>${r.key}<br>${esc(r.hijri)}</td>${['fajr','fajrIqamah','sunrise','dhuhr','dhuhrIqamah','asr','asrIqamah','maghrib','maghribIqamah','isha','ishaIqamah'].map(k=>`<td><input aria-label="${r.key} ${k}" style="width:105px" data-prayer-index="${i}" data-prayer-field="${k}" value="${esc(r[k])}"></td>`).join('')}</tr>`).join('')}</tbody></table>`;}
document.addEventListener('submit',async e=>{if(e.target.id!=='login')return;e.preventDefault();try{session=await api('/api/login','POST',Object.fromEntries(new FormData(e.target)));await load();}catch(err){say(err.message);}});
document.addEventListener('input',e=>{if(e.target.dataset.path)set(e.target.dataset.path,e.target.value);if(e.target.dataset.prayerField)prayerRows[Number(e.target.dataset.prayerIndex)][e.target.dataset.prayerField]=e.target.value;});
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 const a=el.dataset.action;el.disabled=true;
 try{
  if(a==='save'||a==='publish')await save(a==='publish');
  if(a==='reload'){if(!dirty||confirm('Discard your unsaved content changes?'))await load();}
  if(a==='logout'){await api('/api/logout','POST',{});session=null;state=null;loginView();say('Signed out.');}
  if(a==='add-news'||a==='add-newsletter'){state.news.unshift({id:crypto.randomUUID(),title:'New '+(a==='add-newsletter'?'newsletter':'announcement'),date:today(),summary:'',body:'',image:'/public/news/ramadan.png',imageAlt:'',kind:a==='add-newsletter'?'newsletter':'news',icon:'megaphone',url:''});dirty=true;render();}
  if(a==='add-event'){state.events.push({id:crypto.randomUUID(),title:'New event',date:today(),time:'',location:'ICM',description:'',url:''});dirty=true;render();}
  if(a==='add-program'){state.programs.push({id:crypto.randomUUID(),title:'New program',description:'',schedule:'',url:'',category:'Community Programs'});dirty=true;render();}
  if(a==='add-jummah'){state.jummah.shifts.push({shift:String(state.jummah.shifts.length+1),time:'1:00 PM',speaker:'',topic:''});dirty=true;render();}
  if(a==='remove'){const list=el.dataset.group==='jummah'?state.jummah.shifts:state[el.dataset.group];list.splice(Number(el.dataset.index),1);dirty=true;render();}
  if(a==='history'){const list=await api('/api/admin/revisions');document.querySelector('#revisions').innerHTML=list.map(r=>`<p>${esc(r.created)} · ${esc(r.actor)} · ${esc(r.action)} ${button('restore','Restore as draft',`data-id="${r.id}"`)}</p>`).join('')||'No saved revisions yet.';}
  if(a==='restore'){if(dirty&&!confirm('Replace unsaved content with this revision?'))return;const r=await api('/api/admin/restore','POST',{id:Number(el.dataset.id),revision});state=r.content;revision=r.revision;dirty=false;render();say('Revision restored as a draft. Publish when ready.');}
  if(a==='schedule'||a==='sync'){
   prayerMonth=document.querySelector('#prayer-month').value;
   const r=await api((a==='sync'?'/api/admin/prayers/sync':'/api/prayers')+'?month='+prayerMonth,a==='sync'?'POST':'GET');
   const proposal=await api('/api/admin/prayers/proposal?month='+prayerMonth);
   prayerRows=proposal?.rows||r.rows;
   document.querySelector('#prayer-status').textContent=(r.stale?'Cached official schedule':'Synced official schedule')+' · '+r.syncedAt+(proposal?' · Saved proposal loaded for editing':'');
   scheduleTable();
  }
  if(a==='proposal'){if(!prayerRows.length)throw new Error('Load a month first.');const r=await api('/api/admin/prayers/proposal','PUT',{month:prayerMonth,rows:prayerRows});say(r.message);}
  if(a==='export-proposal'){if(!prayerRows.length)throw new Error('Load a month first.');const blob=new Blob([JSON.stringify({month:prayerMonth,status:'proposal-only',source:'WordPress',rows:prayerRows},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='icm-prayer-proposal-'+prayerMonth+'.json';link.click();URL.revokeObjectURL(url);say('Proposal downloaded for review. Apply approved changes in WordPress, then sync.');}
 }catch(err){say(err.message);if(err.status===401)loginView();}finally{el.disabled=false;}
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
async function boot(){try{session=await request('/api/session');await load();}catch{loginView();say('Sign in to manage the connected website and app.');}}
boot();

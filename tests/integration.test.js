import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { load } from 'cheerio';
import { DateTime } from 'luxon';
import { createApp } from '../server.js';
import { parseTimetable,prayerService } from '../backend/prayers.js';
import { seed } from '../backend/seed.js';
import { openStore } from '../backend/store.js';
import { prayerInstant } from '../src/shared.js';

function fixture(month='2026-09') {
  const first=DateTime.fromISO(month+'-01',{locale:'en-US'});
  return '<table>'+Array.from({length:first.daysInMonth},(_,i)=>`<tr><td>${first.plus({days:i}).toFormat('cccc, LLLL d, yyyy')} <p class="hijriDate">26 Rabī al-Awwal 1448</p></td><td>Tuesday</td>${['5:26 AM','6:00 AM','6:52 AM','1:14 PM','1:35 PM','5:45 PM','6:00 PM','7:34 PM','7:41 PM','9:02 PM','9:15 PM'].map(t=>`<td>${t}</td>`).join('')}</tr>`).join('')+'</table>';
}
test('official importer preserves all 11 times and Unicode; rejects wrong year and truncated months',()=>{
 const rows=parseTimetable(fixture(),'2026-09');
 assert.equal(rows.length,30);assert.equal(rows[7].dhuhr,'1:14 PM');assert.equal(rows[7].hijri,'26 Rabī al-Awwal 1448');assert.equal(rows[7].ishaIqamah,'9:15 PM');
 assert.throws(()=>parseTimetable(fixture(),'2027-09'),/different month\/year/);
 assert.throws(()=>parseTimetable(fixture().replace(/<tr>[\s\S]*?<\/tr>/,''),'2026-09'),/incomplete/);
});
test('failed refresh retains last verified official month and marks it stale',async()=>{
 const store=openStore(':memory:',seed());let fail=false;
 const service=prayerService(store,async()=>{if(fail)throw new Error('offline');return new Response(fixture());});
 const fresh=await service.get('2026-09');fail=true;const cached=await service.get('2026-09',true);
 assert.equal(cached.stale,true);assert.deepEqual(cached.rows,fresh.rows);assert.equal(cached.error,'offline');store.db.close();
});
test('New York schedule instants handle DST without depending on device timezone',()=>{
 assert.equal(new Date(prayerInstant('2026-03-07','6:00 AM')).toISOString(),'2026-03-07T11:00:00.000Z');
 assert.equal(new Date(prayerInstant('2026-03-08','6:00 AM')).toISOString(),'2026-03-08T10:00:00.000Z');
});
test('verified original mobile prototype keeps valid scripts and shared API hooks',()=>{
 const html=readFileSync(new URL('../mobile-app/assets/prototype/icm-mobile-app.html',import.meta.url),'utf8'),$=load(html);
 $('script:not([src])').each((_,script)=>{const source=$(script).html();if(source?.trim())new Script(source);});
 assert.match(html,/ICM_PRAYER_API_URL/);assert.match(html,/apiUrl\.searchParams\.set\("month", key\)/);assert.match(html,/setInterval\(\(\) => \{ if \(!document\.hidden\) loadWebsiteCms\(\); \}, 15000\)/);
});
test('login, CSRF, drafts, publishing, revision conflicts, restore, proposals, and private files',async(t)=>{
 const app=createApp({dbPath:':memory:',fetcher:async()=>new Response(fixture())});
 app.store.addUser('review-admin','test-password-for-integration');
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>app.server.close(()=>{app.store.db.close();resolve();})));
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=(p,options={})=>fetch(base+p,options);
 assert.equal((await call('/api/content')).headers.get('access-control-allow-origin'),'*');
 assert.equal((await call('/api/content',{method:'OPTIONS'})).status,204);
 assert.equal((await call('/api/admin/content')).headers.get('access-control-allow-origin'),null);
 assert.equal((await call('/api/admin/content')).status,401);
 const login=await call('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'review-admin',password:'test-password-for-integration'})});
 assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0],session=await login.json();
 const headers={'content-type':'application/json',cookie,'x-csrf-token':session.csrf};
 let draft=await (await call('/api/admin/content',{headers})).json();
 draft.content.news.unshift({id:randomUUID(),title:'Connected newsletter',date:'2026-09-08',summary:'Shared across both clients',body:'Complete newsletter',image:'/public/news/ramadan.png',imageAlt:'',kind:'newsletter',icon:'megaphone',url:''});
 const payload={content:draft.content,revision:draft.revision,publish:false};
 assert.equal((await call('/api/admin/content',{method:'PUT',headers:{'content-type':'application/json',cookie},body:JSON.stringify(payload)})).status,403);
 let save=await call('/api/admin/content',{method:'PUT',headers,body:JSON.stringify(payload)});assert.equal(save.status,200);draft=await save.json();
 assert.equal((await (await call('/api/cms')).json()).news.length,0);
 assert.equal((await call('/api/admin/content',{method:'PUT',headers,body:JSON.stringify(payload)})).status,409);
 const published=await call('/api/admin/content',{method:'PUT',headers,body:JSON.stringify({content:draft.content,revision:draft.revision,publish:true})});assert.equal(published.status,200);draft=await published.json();
 const site=await (await call('/api/cms')).json(),mobile=await (await call('/api/content')).json();assert.deepEqual(site.news,mobile.content.news);assert.equal(site.news[0].title,'Connected newsletter');
 const appContent=await (await call('/api/mobile-content')).json();
 assert.equal(appContent.schemaVersion,1);assert.equal(appContent.site.address,mobile.content.settings.address);assert.equal(appContent.donation.url,mobile.content.settings.donationUrl);assert.equal(appContent.prayerTimes.apiUrl,'/api/prayers');assert.ok(appContent.news.some(item=>item.title==='Connected newsletter'));assert.ok(appContent.news.some(item=>item.id.startsWith('program-')));
 const bad=structuredClone(draft.content);bad.settings.donationUrl='javascript:alert(1)';
 assert.equal((await call('/api/admin/content',{method:'PUT',headers,body:JSON.stringify({content:bad,revision:draft.revision})})).status,400);
 const schedule=await (await call('/api/prayers?month=2026-09')).json();const rows=structuredClone(schedule.rows);rows[0].fajrIqamah='6:10 AM';
 assert.equal((await call('/api/admin/prayers/proposal',{method:'PUT',headers,body:JSON.stringify({month:'2026-09',rows})})).status,200);
 assert.equal((await (await call('/api/prayers?month=2026-09')).json()).rows[0].fajrIqamah,'6:00 AM');
 assert.equal((await call('/api/admin/content',{method:'PUT',headers:{...headers,origin:'https://evil.example'},body:JSON.stringify(payload)})).status,403);
 for(const p of ['/server.js','/data/cms.json','/.git/config','/runtime/icm.sqlite','/package.json'])assert.equal((await call(p)).status,404,p);
 for(const p of ['/','/admin','/calendar.html'])assert.equal((await call(p)).status,200,p);
 assert.equal((await call('/api/logout',{method:'POST',headers})).status,200);assert.equal((await call('/api/admin/content',{headers})).status,401);
});

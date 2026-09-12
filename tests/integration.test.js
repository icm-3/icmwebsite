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
 const fallback=readFileSync(new URL('../mobile-app/assets/prototype/assets/content/fallback-content.txt',import.meta.url),'utf8');
 const fallbackTimetable=readFileSync(new URL('../mobile-app/assets/prototype/assets/content/fallback-timetable.txt',import.meta.url),'utf8');
 $('script:not([src])').each((_,script)=>{const source=$(script).html();if(source?.trim())new Script(source);});
 assert.match(html,/ICM_PRAYER_API_URL/);assert.match(html,/apiUrl\.searchParams\.set\("month", key\)/);assert.match(html,/setInterval\(\(\) => \{ if \(!document\.hidden\) loadWebsiteCms\(\); \}, 15000\)/);
 assert.match(html,/id="newsletterSubscribe"/);assert.match(html,/plainBodyText/);assert.match(html,/id="qiblaManualHeading"/);assert.match(html,/reading\?\.status === "starting" \|\| reading\?\.status === "live"/);assert.doesNotMatch(html,/item\.image \|\| "assets\/news\/ramadan\.png"/);assert.match(fallback,/newsletterUrl: "https:\/\/lp\.constantcontactpages\.com\/su\/4AalmfK\/ICMweekly"/);assert.match(fallback,/news: \[\]/);assert.match(fallback,/shifts: \[\]/);
 assert.match(fallbackTimetable,/Rabī al-Awwal/);assert.doesNotMatch(fallbackTimetable,/RabÄ/);
});
test('connected website uses the latest organization frontend and shared data routes',()=>{
 const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const news=readFileSync(new URL('../news.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const pages=readFileSync(new URL('../src/pages.js',import.meta.url),'utf8');
 const site=readFileSync(new URL('../src/site.js',import.meta.url),'utf8');
 assert.match(home,/masjid-interior-hero-clean\.png/);
 assert.match(home,/styles\.css\?v=20260807-isha-gap-v102/);
 assert.match(news,/data-newsletter-link/);
 assert.match(main,/loadMonth\(selectedKey\.slice/);
 assert.match(pages,/loadMonth\(key\.slice/);
 assert.match(site,/fetch\(`\/api\/prayers\?month=/);
 assert.doesNotMatch(main,/content\.events\?\.length \? content\.events : defaultContent\.events/);
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
 const login=await call('/api/login',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({username:'review-admin',password:'test-password-for-integration'})});
 assert.equal(login.status,200);const cookieHeader=login.headers.get('set-cookie');
 assert.match(cookieHeader,/HttpOnly/i);assert.match(cookieHeader,/SameSite=Strict/i);assert.match(cookieHeader,/Path=\//i);
 const cookie=cookieHeader.split(';')[0],session=await login.json();
 const headers={'content-type':'application/json',cookie,'x-csrf-token':session.csrf,origin:base};
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
 assert.equal(appContent.schemaVersion,1);assert.equal(appContent.site.address,mobile.content.settings.address);assert.equal(appContent.site.websiteUrl,'https://www.icmnc.org/');assert.equal(appContent.site.newsletterUrl,mobile.content.settings.newsletterUrl);assert.equal(appContent.donation.url,mobile.content.settings.donationUrl);assert.equal(appContent.prayerTimes.apiUrl,'/api/prayers');assert.equal(appContent.news.find(item=>item.title==='Connected newsletter').body,'Complete newsletter');assert.ok(appContent.news.some(item=>item.id.startsWith('program-')));assert.deepEqual(appContent.jummah.shifts,[]);
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(12)]);
 const media=await call('/api/admin/media',{method:'POST',headers,body:JSON.stringify({mime:'image/png',data:png.toString('base64')})});
 assert.equal(media.status,201);const mediaUrl=(await media.json()).url,mediaRead=await call(mediaUrl);assert.equal(mediaRead.status,200);assert.equal(mediaRead.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await mediaRead.arrayBuffer()),png);
 assert.equal((await call('/api/admin/media',{method:'POST',headers,body:JSON.stringify({mime:'image/png',data:Buffer.alloc(20).toString('base64')})})).status,400);
 const bad=structuredClone(draft.content);bad.settings.donationUrl='javascript:alert(1)';
 assert.equal((await call('/api/admin/content',{method:'PUT',headers,body:JSON.stringify({content:bad,revision:draft.revision})})).status,400);
 const schedule=await (await call('/api/prayers?month=2026-09')).json();const rows=structuredClone(schedule.rows);rows[0].fajrIqamah='6:10 AM';
 assert.equal((await call('/api/admin/prayers/proposal',{method:'PUT',headers,body:JSON.stringify({month:'2026-09',rows})})).status,200);
 assert.equal((await (await call('/api/prayers?month=2026-09')).json()).rows[0].fajrIqamah,'6:00 AM');
 assert.equal((await call('/api/admin/prayers/proposal',{method:'PUT',headers,body:JSON.stringify({month:'2026-09',rows:rows.slice(1)})})).status,400);
 assert.equal((await call('/api/prayers?month=bad-month')).status,400);
 assert.equal((await call('/api/admin/content',{method:'PUT',headers:{...headers,origin:'https://evil.example'},body:JSON.stringify(payload)})).status,403);
 for(const p of ['/server.js','/data/cms.json','/.git/config','/runtime/icm.sqlite','/package.json'])assert.equal((await call(p)).status,404,p);
 for(const p of ['/','/admin','/calendar.html','/prayer-times.html','/financial-aid.html','/food-pantry.html','/volunteer.html','/al-falah-quran-school.html','/al-mizaan-academy.html','/nibraas-institute.html','/social-welfare-services.html','/public/programs/al-falah-quran-school.png','/public/docs/monthly-prayer-time-icm.pdf'])assert.equal((await call(p)).status,200,p);
 const donation=await call('/donate.html',{redirect:'manual'});assert.equal(donation.status,302);assert.equal(donation.headers.get('location'),'https://www.icmnc.org/donate/');
 assert.equal((await call('/api/logout',{method:'POST',headers})).status,200);assert.equal((await call('/api/admin/content',{headers})).status,401);
});

test('CMS bundle exposes the complete plain-language editing workflow',()=>{
 const source=readFileSync(new URL('../src/admin.js',import.meta.url),'utf8');
 for(const label of ['Add newsletter','Add announcement','Add shift','Add event','Add program','Publish to website + app','Sync from WordPress','Save correction proposal','Publishing history'])assert.match(source,new RegExp(label.replace(/[+]/g,'\\+')));
 assert.match(source,/confirm\(`Remove/);assert.match(source,/Unsaved changes/);assert.match(source,/Move up/);assert.match(source,/Image must be smaller than 1\.5 MB/);
});

import { load } from 'cheerio';
import { DateTime } from 'luxon';
import { monthSchema, prayerFields, prayerRow } from './schema.js';

export const WORDPRESS='https://www.icmnc.org';
export function parseTimetable(html,month) {
  monthSchema.parse(month);
  const $=load(html),rows=[];
  $('tr').each((_,tr)=>{
    const cells=$(tr).find('td');
    if(cells.length<13) return;
    const first=cells.eq(0).clone();first.find('p').remove();
    const d=DateTime.fromFormat(first.text().trim(),'cccc, LLLL d, yyyy',{locale:'en-US',zone:'America/New_York'});
    if(!d.isValid) throw new Error('WordPress returned an unrecognized date. Previous schedule retained.');
    const key=d.toISODate();
    if(!key.startsWith(month)) throw new Error('WordPress returned a different month/year. Previous schedule retained.');
    const row={key,day:cells.eq(1).text().trim(),hijri:cells.eq(0).find('.hijriDate').text().trim()};
    prayerFields.forEach((field,i)=>row[field]=cells.eq(i+2).text().replace(/\s+/g,' ').trim());
    rows.push(prayerRow.parse(row));
  });
  const expected=DateTime.fromISO(month+'-01').daysInMonth;
  if(rows.length!==expected||new Set(rows.map(r=>r.key)).size!==expected) throw new Error('WordPress returned an incomplete schedule. Previous schedule retained.');
  return rows.sort((a,b)=>a.key.localeCompare(b.key));
}

export function prayerService(store,fetcher=fetch) {
  const active=new Map(),lastAttempt=new Map();
  async function sync(month) {
    monthSchema.parse(month);
    if(active.has(month)) return active.get(month);
    const job=(async()=>{
      lastAttempt.set(month,Date.now());
      const url=new URL('/wp-admin/admin-ajax.php',WORDPRESS);
      url.search=new URLSearchParams({action:'get_monthly_timetable',month:String(Number(month.slice(5))),display:'monthly'}).toString();
      try {
        const response=await fetcher(url,{signal:AbortSignal.timeout(15000),headers:{'user-agent':'ICM-Connected/1.0 prayer schedule reader'}});
        if(!response.ok) throw new Error('WordPress schedule is temporarily unavailable.');
        const html=await response.text();
        if(html.length>1000000) throw new Error('WordPress response exceeded the expected size.');
        store.putSchedule(month,parseTimetable(html,month));
        return {...store.schedule(month),stale:false,source:WORDPRESS+'/monthly-prayer-time/'};
      } catch(e) {
        store.db.prepare('UPDATE schedules SET error=? WHERE month=?').run(e.message,month);
        throw e;
      } finally {active.delete(month);}
    })();
    active.set(month,job);return job;
  }
  async function get(month,force=false) {
    monthSchema.parse(month);
    let saved=store.schedule(month);
    let stale=!saved||Date.now()-Date.parse(saved.syncedAt)>300000||!!saved.error;
    if(force||(stale&&Date.now()-(lastAttempt.get(month)||0)>60000)) {
      try {return await sync(month);} catch(e) {
        saved=store.schedule(month);
        stale=true;
        if(!saved) throw Object.assign(new Error(e.message),{status:503});
      }
    }
    if(!saved) throw Object.assign(new Error('Schedule unavailable; try again shortly.'),{status:503});
    return {...saved,stale,source:WORDPRESS+'/monthly-prayer-time/'};
  }
  return {get,sync};
}

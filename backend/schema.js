import { z } from 'zod';
import { DateTime } from 'luxon';

const text = z.string().max(10000);
const date = z.string().refine(v => /^\d{4}-\d{2}-\d{2}$/.test(v) && DateTime.fromISO(v).isValid, 'Use a valid YYYY-MM-DD date');
const url = z.string().max(2000).refine(v => !v || /^\/(?!\/)/.test(v) || /^https:\/\//.test(v), 'Use an HTTPS URL or a path starting with /');
const item = z.object({pinned:z.boolean().optional(),archived:z.boolean().optional(),category:text.optional(),issueDate:z.union([date,z.literal('')]).optional(),sourceUrl:url.optional(),id:z.string().uuid(),title:text.min(1),date:z.union([date,z.literal('')]),summary:text,body:text.default(''),image:url.default(''),imageAlt:text.default(''),kind:z.enum(['news','newsletter']).default('news'),icon:z.enum(['megaphone','shopping-bag','users-round','moon-star','book-open','hand-heart']).default('megaphone'),url:url.default('')});
export const contentSchema = z.object({
  hero:z.object({image:url,imageAlt:text}),
  jummah:z.object({dateLabel:text,sourceUrl:url.optional(),shifts:z.array(z.object({shift:text,time:text,speaker:text,topic:text})).max(12)}),
  news:z.array(item).max(500),
  events:z.array(z.object({id:z.string().uuid(),title:text.min(1),date,time:text,location:text,description:text,sourceUrl:url.optional(),url:url.default(''),image:url.default(''),imageAlt:text.default('')})).max(500),
  programs:z.array(z.object({id:z.string().uuid(),title:text.min(1),description:text,schedule:text,url,category:text})).max(100),
  settings:z.object({donationUrl:url,newsletterUrl:url,contactEmail:z.string().email(),address:text,facebook:url,instagram:url,youtube:url}),
}).strict().superRefine((content,ctx)=>{
  content.news.forEach((entry,index)=>{if(entry.image&&!entry.imageAlt.trim())ctx.addIssue({code:'custom',path:['news',index,'imageAlt'],message:'Describe the image before publishing'});});
  content.events.forEach((entry,index)=>{if(entry.image&&!entry.imageAlt.trim())ctx.addIssue({code:'custom',path:['events',index,'imageAlt'],message:'Describe the image before publishing'});});
  if(content.hero.image&&!content.hero.imageAlt.trim())ctx.addIssue({code:'custom',path:['hero','imageAlt'],message:'Describe the image before publishing'});
});

export const prayerFields=['fajr','fajrIqamah','sunrise','dhuhr','dhuhrIqamah','asr','asrIqamah','maghrib','maghribIqamah','isha','ishaIqamah'];
const time=z.string().regex(/^(?:[1-9]|1[0-2]):[0-5]\d (?:AM|PM)$/);
export const prayerRow=z.object({key:date,day:text,hijri:text,...Object.fromEntries(prayerFields.map(k=>[k,time]))});
export const monthSchema=z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);

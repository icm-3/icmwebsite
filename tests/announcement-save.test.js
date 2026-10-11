import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAnnouncementSave, normalizeNewsItems, findEvergreenAnnouncement, todayDateKey, sortNewsEntries } from '../src/content-utils.js';
const original = {news:[{id:'friday-announcements',pinned:true,title:'Friday Announcements',date:'2026-10-02',image:'sheet.jpg',summary:'Original'}],events:[]};
const now = new Date('2026-10-05T02:00:00Z');
test('editing bulletin automatically dates in Morrisville time and archives prior edition',()=>{
 const edited=structuredClone(original);edited.news[0].summary='New edition';
 const saved=prepareAnnouncementSave(edited,original,now);
 assert.equal(saved.news[0].date,'2026-10-04');
 assert.equal(saved.news[1].summary,'Original');assert.equal(saved.news[1].date,'2026-10-02');assert.equal(saved.news[1].archived,true);assert.equal(saved.news[1].pinned,false);
 assert.equal(original.news.length,1);
 assert.deepEqual(prepareAnnouncementSave(saved,saved,new Date('2026-10-06')),saved);
 assert.equal(normalizeNewsItems(saved.news)[1].pinned,false);
 assert.equal(findEvergreenAnnouncement([saved.news[1]]),null);
});
test('no-op and unrelated edits do not bump bulletin date or archive',()=>{
 const edited=structuredClone(original);edited.events.push({title:'New event'});
 assert.deepEqual(prepareAnnouncementSave(edited,original,now),edited);
});
test('image and edition date edits count, deleted/absent bulletin is safe',()=>{
 for(const [key,value] of [['image','new.jpg'],['issueDate','2026-10-09'],['sourceUrl','https://www.icmnc.org/new']]){
 const edited=structuredClone(original);edited.news[0][key]=value;
 assert.equal(prepareAnnouncementSave(edited,original,now).news[0].date,'2026-10-04');
 }
 assert.deepEqual(prepareAnnouncementSave({news:[]},original,now),{news:[]});
 assert.deepEqual(normalizeNewsItems([],original.news),[]);
});
test('pin sorts above newer posts and timezone boundary is correct',()=>{
 const items=[{item:{date:'2026-10-09'}},{item:original.news[0]}];
 assert.equal(sortNewsEntries(items,Date.parse)[0].item.id,'friday-announcements');
 assert.equal(todayDateKey(new Date('2026-10-05T03:59:00Z')),'2026-10-04');
 assert.equal(todayDateKey(new Date('2026-10-05T04:00:00Z')),'2026-10-05');
});

// The shared CMS must retain the presentation metadata when validating a save.
import { seed } from '../backend/seed.js';
import { contentSchema } from '../backend/schema.js';
import { mobileContent } from '../backend/mobile.js';
test('connected CMS accepts archived editions and retains app announcement metadata',()=>{
 const before=contentSchema.parse(seed());
 const edited=structuredClone(before);
 const bulletin=findEvergreenAnnouncement(edited.news);
 bulletin.summary='Updated edition';
 const saved=contentSchema.parse(prepareAnnouncementSave(edited,before,now));
 const archive=saved.news.at(-1);
 assert.equal(archive.archived,true);
 assert.notEqual(archive.id,bulletin.id);
 assert.equal(saved.news.length,before.news.length+1);
 const mobile=mobileContent(saved);
 const pinned=mobile.news.find(item=>item.id===bulletin.id);
 assert.equal(pinned.pinned,true);
 assert.equal(pinned.category,bulletin.category);
 assert.equal(pinned.sourceUrl,bulletin.sourceUrl);
 assert.equal(mobile.news.find(item=>item.id===archive.id).archived,true);
 assert.ok(saved.news.some(item=>item.date===''));
});

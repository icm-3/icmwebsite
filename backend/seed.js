import { readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { randomUUID } from 'node:crypto';
export function seed() {
  const original=JSON.parse(readFileSync(new URL('../data/cms.json',import.meta.url),'utf8'));
  const $=load(readFileSync(new URL('../programs.html',import.meta.url),'utf8'));
  return {
    hero:{...original.hero,image:original.hero.image.replace('./','/')},
    jummah:original.jummah, news:original.news,events:original.events,
    programs:$('.program-card').toArray().map(el=>({id:randomUUID(),title:$(el).find('h3').text(),description:$(el).find('p').first().text(),schedule:$(el).find('li').toArray().map(item=>$(item).text()).join(' · '),url:String($(el).find('a').attr('href')||'').replace(/^\.\//,'/'),category:$(el).closest('.page-band').find('h2').text()})),
    settings:{donationUrl:'https://www.icmnc.org/donate/',newsletterUrl:'https://lp.constantcontactpages.com/su/4AalmfK/ICMweekly',contactEmail:'contact@icmnc.org',address:'107 Quail Fields Ct, Morrisville, NC 27560',facebook:'https://www.facebook.com/ICMMASJID/',instagram:'https://www.instagram.com/icmmasjid/',youtube:'https://www.youtube.com/@islamiccenterofmorrisville1071'},
  };
}

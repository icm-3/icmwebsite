import { initMobileNav } from "./nav.js";
import { watchContent, contentLinks, esc } from './shared.js';

initMobileNav();
watchContent(content=>{
 contentLinks(content);
 const grids=document.querySelectorAll('.program-grid');
 if(grids.length){
  const categories=['Education','Community Programs'];
  grids.forEach((grid,i)=>grid.innerHTML=content.programs.filter(p=>i===0?p.category==='Education':p.category!=='Education').map(p=>`<article class="program-card"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span>${esc(p.schedule)}</span><a href="${esc(p.url)}" target="_blank" rel="noopener">Learn more</a></article>`).join(''));
 }
 const contact=document.querySelectorAll('#contact .feature-card p');
 if(contact.length>=2){contact[0].textContent=content.settings.address;contact[1].textContent=content.settings.contactEmail;}
});

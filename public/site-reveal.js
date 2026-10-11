// Shared by every public page. Static content stays visible; fetched regions own their skeletons.
const main = document.querySelector('main');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (main) {
  const seen = new WeakSet(), images = new WeakSet(), active = new Set();
  const selector = '.feature-card,.program-card,.news-feature:not(.news-feature-skeleton),.donation-fieldset,.donation-summary,.bio-panel,.info-card,.prayer-section,.page-hero,.calendar-day:not(.calendar-day-skeleton),.page-split,.prayer-times-table tbody tr';
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (reduced.matches || target.contains(document.activeElement)) continue;
      const motion=target.animate([{ opacity: 0, transform: 'translateY(40px)' },{ opacity: 1, transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.23,1,.32,1)' });
      active.add(motion); motion.onfinish=()=>active.delete(motion);
    }
  }, { threshold: 0, rootMargin: '0px 0px -64px 0px' }) : null;
  function register() {
    const candidates=[...main.querySelectorAll(selector),...main.querySelectorAll(':scope > section')].filter(node=>!node.querySelector(selector));
    for(const node of candidates){
      if(seen.has(node)||!node.getClientRects().length||node.closest('[aria-busy="true"],.is-skeleton'))continue;
      seen.add(node); if(!reduced.matches)observer?.observe(node);
    }
    for(const img of main.querySelectorAll('img')){
      if(images.has(img))continue;images.add(img);
      if(img.complete)continue;
      img.dataset.loadReveal='';img.dataset.loadState='pending';
      const settle=()=>{img.dataset.loadState=img.naturalWidth?'loaded':'error';};
      img.addEventListener('load',settle,{once:true});img.addEventListener('error',settle,{once:true});
    }
  }
  register();
  const mutations=new MutationObserver(register);mutations.observe(main,{childList:true,subtree:true});
  reduced.addEventListener('change',()=>{if(reduced.matches){for(const animation of active)animation.cancel();active.clear();}});
  document.addEventListener('focusin',event=>{for(const animation of active)if(animation.effect?.target?.contains(event.target)){animation.cancel();active.delete(animation);}});
}

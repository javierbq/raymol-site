// Raymol.io — progressive enhancement. Each init is a no-op if its element is absent.
'use strict';

function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if(!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

function initCompare(){
  document.querySelectorAll('.compare-slider').forEach(el => {
    const handle = el.querySelector('.compare-handle');
    if(!handle) return;
    let dragging = false;
    const setPos = pct => {
      pct = Math.max(0, Math.min(100, pct));
      el.style.setProperty('--pos', pct + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(pct)));
    };
    const fromX = clientX => {
      const r = el.getBoundingClientRect();
      setPos(((clientX - r.left) / r.width) * 100);
    };
    el.addEventListener('pointerdown', e => { dragging = true; el.setPointerCapture(e.pointerId); fromX(e.clientX); });
    el.addEventListener('pointermove', e => { if(dragging) fromX(e.clientX); });
    el.addEventListener('pointerup', () => { dragging = false; });
    handle.addEventListener('keydown', e => {
      const cur = parseFloat(el.style.getPropertyValue('--pos')) || 50;
      if(e.key === 'ArrowLeft'){ setPos(cur - 4); e.preventDefault(); }
      if(e.key === 'ArrowRight'){ setPos(cur + 4); e.preventDefault(); }
    });
    setPos(50);
  });
}

function initReveal(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

function initCarousel(){
  document.querySelectorAll('.carousel').forEach(car => {
    const slides = Array.from(car.querySelectorAll('.carousel-slide'));
    const dots = Array.from(car.querySelectorAll('.dot'));
    if(slides.length < 2) return;
    let i = 0;
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      dots.forEach((d, k) => d.classList.toggle('active', k === i));
    };
    car.querySelector('.carousel-arrow.next')?.addEventListener('click', () => show(i + 1));
    car.querySelector('.carousel-arrow.prev')?.addEventListener('click', () => show(i - 1));
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    show(0);
  });
}

function initHeroCarousel(){
  const car = document.querySelector('.theme-carousel');
  if(!car) return;
  const slides = Array.from(car.querySelectorAll('.tc-slide'));
  const dots = Array.from(car.querySelectorAll('.tc-dot'));
  const label = car.querySelector('.tc-label');
  const names = ['Classic', 'Paper', 'Sunset', 'Dawn'];
  if(slides.length < 2) return;
  let i = 0, timer = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const show = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
    if(label && names[i]) label.textContent = names[i];
  };
  const restart = () => { if(reduce) return; clearInterval(timer); timer = setInterval(() => show(i + 1), 3800); };
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); restart(); }));
  show(0);
  restart();
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroCarousel();
  initCompare();
  initCarousel();
  initReveal();
});

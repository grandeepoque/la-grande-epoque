// =============================================
//  LA GRANDE ÉPOQUE — script.js
// =============================================

// ---------- Navbar : fond au scroll ----------
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });


// ---------- Parallaxe hero ----------
const heroBgWrap = document.getElementById('hero-bg-wrap');

if (heroBgWrap) {
  window.addEventListener('scroll', () => {
    // Décalage = 35% de la distance scrollée → effet subtil et fluide
    const offset = window.scrollY * 0.35;
    heroBgWrap.style.transform = `translateY(${offset}px)`;
  }, { passive: true });
}


// ---------- Menu burger (mobile) ----------
const burger = document.getElementById('burger');
const navMobile = document.getElementById('nav-mobile');

if (burger && navMobile) {
  burger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => navMobile.classList.remove('open'));
  });

  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) navMobile.classList.remove('open');
  });
}


// ---------- Animations au scroll (Intersection Observer) ----------
const fadeEls = document.querySelectorAll(
  '.concert-item, .membre-card, .album-card, .bio-text, .section-header'
);

fadeEls.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

fadeEls.forEach(el => observer.observe(el));


// ---------- Lien actif dans la nav ----------
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinksAll.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (activeLink) activeLink.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(section => sectionObserver.observe(section));

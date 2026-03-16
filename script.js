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


// ---------- Concerts (Songkick + scraping HTML) ----------
const CONCERTS_MAX = 4;
const SONGKICK_ARTIST_PAGE = 'https://www.songkick.com/fr/artists/8227628-la-grande-epoque';
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // Utilisé pour contourner les restrictions CORS (pas garanti à 100%)

const concertsListEl = document.getElementById('concerts-list');

function formatFrenchDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return { weekday: '', day: '', month: '', year: '' };

  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'short' });
  const day = date.toLocaleDateString('fr-FR', { day: '2-digit' });
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });
  const year = date.toLocaleDateString('fr-FR', { year: 'numeric' });
  return { weekday, day, month, year };
}

function renderEmptyMessage(message) {
  if (!concertsListEl) return;
  concertsListEl.innerHTML = `
    <div class="concert-empty">
      <p class="concert-empty-text">${message}</p>
    </div>
  `;
}

function renderConcerts(concerts) {
  if (!concertsListEl) return;

  if (!concerts.length) {
    renderEmptyMessage('De nouveaux concerts à venir, restez connectés.');
    return;
  }

  concertsListEl.innerHTML = concerts.map(concert => {
    const { weekday, day, month, year } = formatFrenchDate(concert.date);
    const locationLine = concert.city ? `${concert.venue} · ${concert.city}` : concert.venue;

    return `
      <div class="concert-item">
        <div class="concert-date">
          <span class="date-weekday">${weekday}</span>
          <span class="date-day">${day}</span>
          <span class="date-month">${month}</span>
          <span class="date-year">${year}</span>
        </div>
        <div class="concert-info">
          <h3 class="concert-venue">${concert.venue}</h3>
          <p class="concert-location">${locationLine}</p>
        </div>
        <div class="concert-meta">
          <span class="concert-time">${concert.time || '—'}</span>
        </div>
        <a href="${concert.link}" class="btn btn-sm" target="_blank" rel="noopener">Billets</a>
      </div>
    `;
  }).join('');

  const newItems = concertsListEl.querySelectorAll('.concert-item');
  newItems.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

function parseSongkickEvents(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // Songkick utilise une section « À venir » (coming-up) avec une liste d'événements
  const items = Array.from(doc.querySelectorAll('#coming-up .event-listing-item'));

  const events = items.map(item => {
    const linkEl = item.querySelector('.event-details.concert');
    const dateEl = item.querySelector('time[datetime]');
    const venueEl = item.querySelector('.secondary-detail');
    const locationEl = item.querySelector('.primary-detail');

    const date = dateEl?.getAttribute('datetime') || '';
    const venue = venueEl?.textContent.trim() || 'Lieu à venir';
    const city = locationEl?.textContent.trim() || '';
    const link = linkEl ? new URL(linkEl.getAttribute('href'), 'https://www.songkick.com').toString() : SONGKICK_ARTIST_PAGE;

    return { date, venue, city, link };
  }).filter(evt => evt.date);

  return events;
}

async function loadSongkickConcerts() {
  if (!concertsListEl) return;

  renderEmptyMessage('Chargement des prochaines dates…');

  const url = `${CORS_PROXY}${encodeURIComponent(SONGKICK_ARTIST_PAGE)}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const events = parseSongkickEvents(html);

    const upcoming = events
      .map(evt => ({
        ...evt,
        dateObj: new Date(evt.date)
      }))
      .filter(evt => evt.dateObj >= new Date(new Date().toISOString().slice(0, 10)))
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, CONCERTS_MAX)
      .map(evt => ({
        date: evt.date,
        venue: evt.venue,
        city: evt.city,
        time: '',
        link: evt.link
      }));

    renderConcerts(upcoming);
  } catch (err) {
    console.error('Erreur chargement Songkick :', err);
    renderEmptyMessage('Impossible de charger les dates pour le moment. Réessayez plus tard.');
  }
}

loadSongkickConcerts();

/* app.js — Rando Var PWA */

/* BASE détecté automatiquement :
   - GitHub Pages  : /verdonargens
   - Local (file:) : vide
   - Local (http)  : chemin courant */
const BASE = (() => {
  if (location.protocol === 'file:') return '.';
  const p = location.pathname;
  // Retire le /index.html final si présent
  const clean = p.endsWith('/index.html') ? p.slice(0, -10) : p;
  // Retire le slash final
  return clean.replace(/\/$/, '') || '';
})();

const WEBMASTER = 'webmaster@clubrando.fr';

let allSorties = [];
let currentFilter = 'tous';

/* ===== UTILITAIRES ===== */
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const mois = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const dt = new Date(iso + 'T00:00:00');
  return jours[dt.getDay()] + ' ' + parseInt(d) + ' ' + mois[parseInt(m)-1] + ' ' + y;
}
function fmtDay(iso) { return iso ? iso.split('-')[2].replace(/^0/, '') : ''; }
function fmtMon(iso) {
  if (!iso) return '';
  const mois = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  return mois[parseInt(iso.split('-')[1]) - 1];
}
function badgeHtml(d) {
  const map = {
    facile:    ['badge-facile',    'Facile'],
    moyen:     ['badge-moyen',     'Moyen'],
    difficile: ['badge-difficile', 'Difficile']
  };
  const [cls, lbl] = map[d] || ['badge-moyen', '?'];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

/* Considère toutes les sorties comme affichables —
   tri par date, les passées en dernier */
function isFuture(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(iso + 'T00:00:00') >= today;
}

/* ===== CHARGEMENT DES DONNÉES ===== */
async function loadSorties() {
  const url = BASE + '/sorties/2025.json';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
    allSorties = await r.json();
    console.log('[Rando Var] ' + allSorties.length + ' sorties chargées depuis ' + url);
    renderAccueil();
    renderAgenda();
  } catch (e) {
    console.error('[Rando Var] Erreur chargement sorties:', e);
    document.getElementById('hero-title').textContent = 'Erreur de chargement';
    document.getElementById('hero-sub').textContent   = e.message;
  }
}

/* ===== NAVIGATION ===== */
function navTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('detail-screen').classList.remove('active');
  document.getElementById('form-screen').classList.remove('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const screenMap = {
    accueil: 's-accueil',
    agenda:  's-agenda',
    carte:   's-carte',
    infos:   's-infos'
  };
  const topTitles = {
    's-accueil': { title: 'Rando Var',   sub: 'Club de randonnée de Carcès' },
    's-agenda':  { title: 'Agenda',       sub: 'Sorties à venir' },
    's-carte':   { title: 'Carte',        sub: 'Randonnées du Var' },
    's-infos':   { title: 'Infos',        sub: 'Club & ressources' }
  };

  const screenId = screenMap[id] || id;
  const screen   = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    const btn = document.getElementById('nb-' + id);
    if (btn) btn.classList.add('active');
    const t = topTitles[screenId];
    if (t) {
      document.getElementById('topbar-title').textContent = t.title;
      document.getElementById('topbar-sub').textContent   = t.sub;
    }
  }
  document.getElementById('screen').scrollTop = 0;
}

/* ===== STOCKAGE INDEX POUR ONCLICK ===== */
/* On stocke les sorties dans un tableau global indexé
   pour éviter les problèmes d'échappement JSON dans les attributs HTML */
window._sortieIndex = [];

function cardHtml(s) {
  const idx = window._sortieIndex.length;
  window._sortieIndex.push(s);
  return `<div class="rando-card" onclick="showDetailByIndex(${idx})">
    <div class="date-col">
      <div class="date-day">${fmtDay(s.date)}</div>
      <div class="date-mon">${fmtMon(s.date)}</div>
    </div>
    <div class="rando-info">
      <div class="rando-name">${s.intitule}</div>
      <div class="rando-meta">${s.distance_km} km · ${s.denivele_m} m · ${badgeHtml(s.difficulte)}</div>
    </div>
    <i class="ti ti-chevron-right chevron" aria-hidden="true"></i>
  </div>`;
}

function showDetailByIndex(idx) {
  showDetail(window._sortieIndex[idx]);
}

/* ===== ACCUEIL ===== */
function renderAccueil() {
  window._sortieIndex = [];

  const futures = allSorties
    .filter(s => isFuture(s.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const passees = allSorties
    .filter(s => !isFuture(s.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const prochaine = futures[0];

  if (prochaine) {
    const dateStr = fmtDate(prochaine.date);
    document.getElementById('hero-eyebrow').textContent =
      'Prochaine sortie · ' + dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('hero-title').textContent = prochaine.intitule;
    document.getElementById('hero-sub').textContent   = 'Animateur · ' + prochaine.animateur;
    document.getElementById('hero-chips').innerHTML   =
      `<span class="chip"><i class="ti ti-map-2" aria-hidden="true"></i> ${prochaine.distance_km} km</span>` +
      `<span class="chip"><i class="ti ti-trending-up" aria-hidden="true"></i> ${prochaine.denivele_m} m</span>` +
      `<span class="chip"><i class="ti ti-clock" aria-hidden="true"></i> Départ ${prochaine.depart_carces}</span>` +
      badgeHtml(prochaine.difficulte);

    const heroIdx = window._sortieIndex.length;
    window._sortieIndex.push(prochaine);
    document.getElementById('hero-card').onclick = () => showDetailByIndex(heroIdx);
  } else {
    document.getElementById('hero-eyebrow').textContent = 'Aucune sortie prévue';
    document.getElementById('hero-title').textContent   = 'Calendrier à venir';
    document.getElementById('hero-sub').textContent     = '';
    document.getElementById('hero-chips').innerHTML     = '';
    document.getElementById('hero-card').onclick        = null;
  }

  const nextCards = document.getElementById('next-cards');
  if (futures.length > 1) {
    nextCards.innerHTML = futures.slice(1, 4).map(s => cardHtml(s)).join('');
  } else {
    nextCards.innerHTML = '<div style="padding:16px;font-size:13px;color:#aaa;">Aucune autre sortie planifiée.</div>';
  }

  const lastCard = document.getElementById('last-card');
  if (passees[0]) {
    lastCard.innerHTML = cardHtml(passees[0]);
  } else {
    lastCard.innerHTML = '<div style="padding:16px;font-size:13px;color:#aaa;">Aucune sortie passée.</div>';
  }
}

/* ===== AGENDA ===== */
function renderAgenda() {
  window._sortieIndex = [];

  const filtered = allSorties
    .filter(s => isFuture(s.date))
    .filter(s => currentFilter === 'tous' || s.difficulte === currentFilter)
    .sort((a, b) => a.date.localeCompare(b.date));

  const byMonth = {};
  filtered.forEach(s => {
    const key = s.date.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  });

  const moisNoms = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  let html = '';
  Object.entries(byMonth).forEach(([key, sorties]) => {
    const [y, m] = key.split('-');
    html += `<div class="section-title">${moisNoms[parseInt(m)]} ${y}</div>`;
    html += sorties.map(s => cardHtml(s)).join('');
  });

  if (!html) {
    html = '<div style="padding:24px;text-align:center;color:#aaa;font-size:13px;">Aucune sortie pour ce niveau de difficulté.</div>';
  }
  document.getElementById('agenda-list').innerHTML = html;
}

function setFiltre(btn, diff) {
  currentFilter = diff;
  document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderAgenda();
}

/* ===== FICHE DÉTAIL ===== */
function showDetail(s) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById('form-screen').classList.remove('active');
  document.getElementById('detail-screen').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('topbar-title').textContent = 'Fiche rando';
  document.getElementById('topbar-sub').textContent   = '';

  const dateStr = fmtDate(s.date);
  document.getElementById('d-date').textContent  = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  document.getElementById('d-title').textContent = s.intitule;
  document.getElementById('d-badge').innerHTML   = badgeHtml(s.difficulte);
  document.getElementById('d-dist').textContent  = s.distance_km + ' km';
  document.getElementById('d-den').textContent   = s.denivele_m + ' m';
  document.getElementById('d-ar').textContent    = s.distance_ar_km ? s.distance_ar_km + ' km' : '—';
  document.getElementById('d-dep1').textContent  = s.depart_carces;
  document.getElementById('d-dep2').textContent  = s.depart_rando;
  document.getElementById('d-lieu').textContent  = s.point_depart;

  const covEl = document.getElementById('d-covoit');
  covEl.textContent  = s.covoiturage ? 'Disponible' : 'Non prévu';
  covEl.style.color  = s.covoiturage ? '#1D9E75' : '#888';

  document.getElementById('d-pts').innerHTML =
    (s.points_remarquables || []).map(p => `<span class="pt-pill">${p}</span>`).join('');

  document.getElementById('d-av').textContent       = s.animateur.split(' ').map(w => w[0]).join('').toUpperCase();
  document.getElementById('d-anim-name').textContent = s.animateur;
  document.getElementById('d-anim-tel').textContent  = s.telephone || '';

  document.getElementById('screen').scrollTop = 0;
}

function hideDetail() {
  document.getElementById('detail-screen').classList.remove('active');
  navTo('accueil');
}

/* ===== ESPACE ANIMATEUR ===== */
function openFormulaire() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('detail-screen').classList.remove('active');
  document.getElementById('form-screen').classList.add('active');
  document.getElementById('topbar-title').textContent = 'Proposer une rando';
  document.getElementById('topbar-sub').textContent   = 'Espace animateur';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen').scrollTop = 0;
}

function closeFormulaire() {
  document.getElementById('form-screen').classList.remove('active');
  navTo('infos');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  navTo('accueil');
  loadSorties();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const swPath = BASE + '/sw.js';
    const swScope = BASE + '/';
    navigator.serviceWorker.register(swPath, { scope: swScope })
      .then(reg => console.log('[SW] Enregistré, scope:', reg.scope))
      .catch(err => console.error('[SW] Erreur:', err));
  }
});

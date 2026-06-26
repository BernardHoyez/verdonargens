/* app.js — Rando Var PWA */

const BASE = '/verdonargens';
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
function fmtDay(iso)   { return iso ? iso.split('-')[2].replace(/^0/,'') : ''; }
function fmtMon(iso)   {
  if (!iso) return '';
  const mois = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  return mois[parseInt(iso.split('-')[1])-1];
}
function badgeHtml(d)  {
  const map = { facile: ['badge-facile','Facile'], moyen: ['badge-moyen','Moyen'], difficile: ['badge-difficile','Difficile'] };
  const [cls, lbl] = map[d] || ['badge-moyen','?'];
  return `<span class="badge ${cls}">${lbl}</span>`;
}
function isFuture(iso) { return new Date(iso + 'T00:00:00') >= new Date(new Date().toDateString()); }

/* ===== CHARGEMENT DES DONNÉES ===== */
async function loadSorties() {
  try {
    const r = await fetch(BASE + '/sorties/2025.json');
    allSorties = await r.json();
    renderAccueil();
    renderAgenda();
  } catch(e) {
    console.error('Erreur chargement sorties:', e);
  }
}

/* ===== NAVIGATION ===== */
function navTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('detail-screen').classList.remove('active');
  document.getElementById('form-screen').classList.remove('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const screenMap = {
    'accueil': 's-accueil',
    'agenda':  's-agenda',
    'carte':   's-carte',
    'infos':   's-infos'
  };
  const topTitles = {
    's-accueil': { title: 'Rando Var',        sub: 'Club de randonnée de Carcès' },
    's-agenda':  { title: 'Agenda',            sub: 'Sorties à venir' },
    's-carte':   { title: 'Carte',             sub: 'Randonnées du Var' },
    's-infos':   { title: 'Infos',             sub: 'Club & ressources' }
  };

  const screenId = screenMap[id] || id;
  const screen = document.getElementById(screenId);
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

/* ===== ACCUEIL ===== */
function renderAccueil() {
  const futures  = allSorties.filter(s => isFuture(s.date)).sort((a,b) => a.date.localeCompare(b.date));
  const passees  = allSorties.filter(s => !isFuture(s.date)).sort((a,b) => b.date.localeCompare(a.date));
  const prochaine = futures[0];

  if (prochaine) {
    document.getElementById('hero-eyebrow').textContent = fmtDate(prochaine.date).charAt(0).toUpperCase() + fmtDate(prochaine.date).slice(1);
    document.getElementById('hero-title').textContent   = prochaine.intitule;
    document.getElementById('hero-sub').textContent     = 'Animateur · ' + prochaine.animateur;
    document.getElementById('hero-chips').innerHTML =
      `<span class="chip"><i class="ti ti-map-2" aria-hidden="true"></i> ${prochaine.distance_km} km</span>` +
      `<span class="chip"><i class="ti ti-trending-up" aria-hidden="true"></i> ${prochaine.denivele_m} m</span>` +
      `<span class="chip"><i class="ti ti-clock" aria-hidden="true"></i> Départ ${prochaine.depart_carces}</span>` +
      badgeHtml(prochaine.difficulte);
    document.getElementById('hero-card').onclick = () => showDetail(prochaine);
  }

  const nextCards = document.getElementById('next-cards');
  nextCards.innerHTML = futures.slice(1, 4).map(s => cardHtml(s)).join('');

  const lastCard = document.getElementById('last-card');
  if (passees[0]) {
    lastCard.innerHTML = cardHtml(passees[0]);
  }
}

function cardHtml(s) {
  return `<div class="rando-card" onclick="showDetail(${JSON.stringify(s).replace(/"/g,'&quot;')})">
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

/* ===== AGENDA ===== */
function renderAgenda() {
  const filtered = allSorties
    .filter(s => isFuture(s.date))
    .filter(s => currentFilter === 'tous' || s.difficulte === currentFilter)
    .sort((a,b) => a.date.localeCompare(b.date));

  const byMonth = {};
  filtered.forEach(s => {
    const key = s.date.slice(0,7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  });

  const moisNoms = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  let html = '';
  Object.entries(byMonth).forEach(([key, sorties]) => {
    const [y, m] = key.split('-');
    html += `<div class="section-title">${moisNoms[parseInt(m)]} ${y}</div>`;
    html += sorties.map(s => cardHtml(s)).join('');
  });
  if (!html) html = '<div style="padding:24px;text-align:center;color:#aaa;font-size:13px;">Aucune sortie pour ce niveau</div>';
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
  if (typeof s === 'string') s = JSON.parse(s);
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById('form-screen').classList.remove('active');
  document.getElementById('detail-screen').classList.add('active');

  document.getElementById('topbar-title').textContent = 'Fiche rando';
  document.getElementById('topbar-sub').textContent   = '';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('d-date').textContent  = fmtDate(s.date).charAt(0).toUpperCase() + fmtDate(s.date).slice(1);
  document.getElementById('d-title').textContent = s.intitule;
  document.getElementById('d-badge').innerHTML   = badgeHtml(s.difficulte);
  document.getElementById('d-dist').textContent  = s.distance_km + ' km';
  document.getElementById('d-den').textContent   = s.denivele_m + ' m';
  document.getElementById('d-ar').textContent    = (s.distance_ar_km || '—') + (s.distance_ar_km ? ' km' : '');
  document.getElementById('d-dep1').textContent  = s.depart_carces;
  document.getElementById('d-dep2').textContent  = s.depart_rando;
  document.getElementById('d-lieu').textContent  = s.point_depart;

  const covEl = document.getElementById('d-covoit');
  covEl.textContent = s.covoiturage ? 'Disponible' : 'Non prévu';
  covEl.style.color = s.covoiturage ? '#1D9E75' : '#888';

  document.getElementById('d-pts').innerHTML = (s.points_remarquables || []).map(p => `<span class="pt-pill">${p}</span>`).join('');
  document.getElementById('d-av').textContent = s.animateur.split(' ').map(w => w[0]).join('').toUpperCase();
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
  loadSorties();
  navTo('accueil');

  /* Service Worker */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(BASE + '/sw.js', { scope: BASE + '/' })
      .then(reg => console.log('[SW] Enregistré, scope:', reg.scope))
      .catch(err => console.error('[SW] Erreur:', err));
  }
});

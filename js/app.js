/* app.js — Rando Var PWA
   Fetch robuste : construit l'URL depuis location.href
   pour fonctionner sur GitHub Pages ET en local. */

let allSorties = [];
let currentFilter = 'tous';
window._sortieIndex = [];

/* ===== CONSTRUCTION URL JSON ===== */
function getJsonUrl() {
  /* On construit le chemin absolu vers sorties/2025.json
     en partant de l'URL de la page courante.
     Ex : https://bernardhoyez.github.io/verdonargens/index.html
     →   https://bernardhoyez.github.io/verdonargens/sorties/2025.json */
  let base = location.href;
  /* Supprimer query string et hash */
  base = base.split('?')[0].split('#')[0];
  /* Supprimer le fichier final (index.html ou autre) */
  base = base.substring(0, base.lastIndexOf('/') + 1);
  return base + 'sorties/2025.json';
}

/* ===== UTILITAIRES ===== */
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const mois  = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  const jours = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  const dt = new Date(iso + 'T00:00:00');
  return jours[dt.getDay()] + ' ' + parseInt(d) + ' ' + mois[parseInt(m)-1] + ' ' + y;
}
function fmtDay(iso) { return iso ? String(parseInt(iso.split('-')[2])) : ''; }
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
function isFuture(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(iso + 'T00:00:00') >= today;
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

/* ===== CHARGEMENT ===== */
async function loadSorties() {
  const url = getJsonUrl();
  console.log('[Rando Var] Fetch :', url);

  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' pour ' + url);
    allSorties = await r.json();
    console.log('[Rando Var]', allSorties.length, 'sorties chargées.');
    renderAccueil();
    renderAgenda();
  } catch(e) {
    console.error('[Rando Var] Erreur :', e.message);
    document.getElementById('hero-eyebrow').textContent = '⚠ Erreur de chargement';
    document.getElementById('hero-title').textContent   = e.message;
    document.getElementById('hero-sub').textContent     = 'URL tentée : ' + url;
    document.getElementById('hero-chips').innerHTML     = '';
  }
}


/* ===== BANNIÈRES WEBMASTER ===== */
async function loadBannieres() {
  const url = getJsonUrl().replace('sorties/2025.json', 'sorties/bannieres.json');
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return;
    const bannieres = await r.json();
    const today = new Date(); today.setHours(0,0,0,0);
    const dismisses = JSON.parse(localStorage.getItem('var_banniere_dismissed') || '[]');

    const actives = bannieres.filter(b =>
      b.actif &&
      !dismisses.includes(b.id) &&
      (!b.date_fin || new Date(b.date_fin + 'T00:00:00') >= today)
    );

    const wrap = document.getElementById('banniere-wrap');
    if (!wrap || !actives.length) return;

    wrap.innerHTML = actives.map(b => `
      <div class="banniere banniere-${b.type}" id="ban-${b.id}">
        <i class="ti ${b.icone}" aria-hidden="true"></i>
        <div class="banniere-content">
          ${b.texte}
          ${b.lien ? `<br><a class="banniere-lien" href="${b.lien}">${b.lien_label || 'En savoir plus'}</a>` : ''}
        </div>
        <button class="banniere-close" onclick="dismissBanniere('${b.id}')" aria-label="Fermer">×</button>
      </div>
    `).join('');
  } catch(e) {
    /* Bannières optionnelles — pas d'erreur si absent */
  }
}

function dismissBanniere(id) {
  const el = document.getElementById('ban-' + id);
  if (el) el.style.display = 'none';
  try {
    const dismisses = JSON.parse(localStorage.getItem('var_banniere_dismissed') || '[]');
    dismisses.push(id);
    localStorage.setItem('var_banniere_dismissed', JSON.stringify(dismisses));
  } catch(e) {}
}

/* ===== NAVIGATION ===== */
function navTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('detail-screen').classList.remove('active');
  document.getElementById('form-screen').classList.remove('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const map = { accueil:'s-accueil', agenda:'s-agenda', carte:'s-carte', infos:'s-infos' };
  const titles = {
    's-accueil': { title:'Rando Var',  sub:'Club de randonnée de Carcès' },
    's-agenda':  { title:'Agenda',     sub:'Sorties à venir' },
    's-carte':   { title:'Carte',      sub:'Randonnées du Var' },
    's-infos':   { title:'Infos',      sub:'Club & ressources' }
  };
  const sid = map[id] || id;
  const el  = document.getElementById(sid);
  if (el) el.classList.add('active');
  const btn = document.getElementById('nb-' + id);
  if (btn) btn.classList.add('active');
  const t = titles[sid];
  if (t) {
    document.getElementById('topbar-title').textContent = t.title;
    document.getElementById('topbar-sub').textContent   = t.sub;
  }
  document.getElementById('screen').scrollTop = 0;
}

/* ===== CARDS ===== */
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
function showDetailByIndex(idx) { showDetail(window._sortieIndex[idx]); }

/* ===== ACCUEIL ===== */
function renderAccueil() {
  window._sortieIndex = [];
  const futures = allSorties.filter(s => isFuture(s.date)).sort((a,b) => a.date.localeCompare(b.date));
  const passees = allSorties.filter(s => !isFuture(s.date)).sort((a,b) => b.date.localeCompare(a.date));
  const p = futures[0];

  if (p) {
    document.getElementById('hero-eyebrow').textContent = 'Prochaine sortie · ' + capitalize(fmtDate(p.date));
    document.getElementById('hero-title').textContent   = p.intitule;
    document.getElementById('hero-sub').textContent     = 'Animateur · ' + p.animateur;
    document.getElementById('hero-chips').innerHTML     =
      `<span class="chip"><i class="ti ti-map-2" aria-hidden="true"></i> ${p.distance_km} km</span>` +
      `<span class="chip"><i class="ti ti-trending-up" aria-hidden="true"></i> ${p.denivele_m} m</span>` +
      `<span class="chip"><i class="ti ti-clock" aria-hidden="true"></i> Départ ${p.depart_carces}</span>` +
      badgeHtml(p.difficulte);
    const hi = window._sortieIndex.length;
    window._sortieIndex.push(p);
    document.getElementById('hero-card').onclick = () => showDetailByIndex(hi);
  } else {
    document.getElementById('hero-eyebrow').textContent = 'Aucune sortie prévue';
    document.getElementById('hero-title').textContent   = 'Calendrier à venir';
    document.getElementById('hero-sub').textContent     = '';
    document.getElementById('hero-chips').innerHTML     = '';
  }

  const nc = document.getElementById('next-cards');
  nc.innerHTML = futures.length > 1
    ? futures.slice(1, 4).map(s => cardHtml(s)).join('')
    : '<div style="padding:16px;font-size:13px;color:#aaa;">Aucune autre sortie planifiée.</div>';

  const lc = document.getElementById('last-card');
  lc.innerHTML = passees[0]
    ? cardHtml(passees[0])
    : '<div style="padding:16px;font-size:13px;color:#aaa;">Aucune sortie passée.</div>';
}

/* ===== AGENDA ===== */
function renderAgenda() {
  window._sortieIndex = [];
  const filtered = allSorties
    .filter(s => isFuture(s.date))
    .filter(s => currentFilter === 'tous' || s.difficulte === currentFilter)
    .sort((a,b) => a.date.localeCompare(b.date));

  const byMonth = {};
  filtered.forEach(s => {
    const k = s.date.slice(0, 7);
    if (!byMonth[k]) byMonth[k] = [];
    byMonth[k].push(s);
  });

  const moisNoms = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  let html = '';
  Object.entries(byMonth).forEach(([k, sorties]) => {
    const [y, m] = k.split('-');
    html += `<div class="section-title">${moisNoms[parseInt(m)]} ${y}</div>`;
    html += sorties.map(s => cardHtml(s)).join('');
  });
  document.getElementById('agenda-list').innerHTML = html ||
    '<div style="padding:24px;text-align:center;color:#aaa;font-size:13px;">Aucune sortie pour ce niveau.</div>';
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

  document.getElementById('d-date').textContent       = capitalize(fmtDate(s.date));
  document.getElementById('d-title').textContent      = s.intitule;
  document.getElementById('d-badge').innerHTML        = badgeHtml(s.difficulte);
  document.getElementById('d-dist').textContent       = s.distance_km + ' km';
  document.getElementById('d-den').textContent        = s.denivele_m + ' m';
  document.getElementById('d-ar').textContent         = s.distance_ar_km ? s.distance_ar_km + ' km' : '—';
  document.getElementById('d-dep1').textContent       = s.depart_carces;
  document.getElementById('d-dep2').textContent       = s.depart_rando;
  document.getElementById('d-lieu').textContent       = s.point_depart;
  const cov = document.getElementById('d-covoit');
  cov.textContent = s.covoiturage ? 'Disponible' : 'Non prévu';
  cov.style.color = s.covoiturage ? '#1D9E75' : '#888';
  document.getElementById('d-pts').innerHTML =
    (s.points_remarquables || []).map(p => `<span class="pt-pill">${p}</span>`).join('');
  document.getElementById('d-av').textContent        = s.animateur.split(' ').map(w => w[0]).join('').toUpperCase();
  document.getElementById('d-anim-name').textContent = s.animateur;
  document.getElementById('d-anim-tel').textContent  = s.telephone || '';
  document.getElementById('screen').scrollTop = 0;
}
function hideDetail() {
  document.getElementById('detail-screen').classList.remove('active');
  navTo('accueil');
}

/* ===== FORMULAIRE ===== */
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
  loadBannieres();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js')
      .then(r => console.log('[SW] scope:', r.scope))
      .catch(e => console.error('[SW] erreur:', e));
  }
});

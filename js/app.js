/* app.js — Rando Var PWA
   Fetch robuste : construit l'URL depuis location.href
   pour fonctionner sur GitHub Pages ET en local. */

/* Données par jour */
let sorties = {
  dimanche: [],
  mercredi: [],
  vendredi: [],
  sejours:  []
};
let jourActif  = 'tous';   /* filtre jour */
let diffActif  = 'tous';   /* filtre difficulté */
window._sortieIndex = [];

/* Toutes les sorties fusionnées avec tag jour */
function allSorties() {
  const res = [];
  ['dimanche','mercredi','vendredi'].forEach(j => {
    sorties[j].forEach(s => res.push({ ...s, _jour: j }));
  });
  return res;
}

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
function baseUrl() {
  let base = location.href.split('?')[0].split('#')[0];
  base = base.substring(0, base.lastIndexOf('/') + 1);
  return base;
}
async function fetchJson(filename) {
  const url = baseUrl() + 'sorties/' + filename;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch(e) {
    console.warn('[Rando Var] Impossible de charger', filename, ':', e.message);
    return [];
  }
}

async function loadSorties() {
  /* Chargement parallèle des 3 fichiers jour */
  const [dim, mer, ven] = await Promise.all([
    fetchJson('2025.json'),
    fetchJson('mercredi-2026-T4.json'),
    fetchJson('vendredi-2026-T4.json')
  ]);
  sorties.dimanche = dim;
  sorties.mercredi = mer;
  sorties.vendredi = ven;

  const total = dim.length + mer.length + ven.length;
  console.log('[Rando Var]', total, 'sorties chargées (dim:', dim.length, 'mer:', mer.length, 'ven:', ven.length, ')');

  renderAccueil();
  renderAgenda();
}


/* ===== GÉOLOCALISATION GPS ===== */
const UMAP_BASE = 'https://umap.openstreetmap.fr/fr/map/assemblage-des-randonnees-var_705776';
let gpsWatch = null;

function maPosition() {
  const btn   = document.getElementById('btn-gps');
  const label = document.getElementById('gps-label');
  const iframe = document.getElementById('carte-iframe');

  if (!navigator.geolocation) {
    alert('La géolocalisation n\'est pas disponible sur cet appareil.');
    return;
  }

  /* Si déjà en suivi → arrêter */
  if (gpsWatch !== null) {
    navigator.geolocation.clearWatch(gpsWatch);
    gpsWatch = null;
    label.textContent = 'Me localiser';
    btn.style.background = '#1D9E75';
    btn.querySelector('i').className = 'ti ti-current-location';
    return;
  }

  /* Démarrer la localisation */
  label.textContent = 'Localisation…';
  btn.style.background = '#BA7517';
  btn.querySelector('i').className = 'ti ti-loader';

  navigator.geolocation.getCurrentPosition(
    /* Succès */
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lon = pos.coords.longitude.toFixed(6);
      const acc = Math.round(pos.coords.accuracy);

      /* Centrer uMap sur la position GPS au zoom 16 */
      const url = UMAP_BASE
        + '?scaleControl=false&miniMap=false&scrollWheelZoom=true'
        + '&zoomControl=true&allowEdit=false&moreControl=false'
        + '&searchControl=false&tilelayersControl=false'
        + '&embedControl=false&datalayersControl=false'
        + '&onLoadPanel=none&captionBar=false'
        + '#16/' + lat + '/' + lon;

      if (iframe) iframe.src = url;

      label.textContent = 'Suivi actif';
      btn.style.background = '#0F6E56';
      btn.querySelector('i').className = 'ti ti-current-location';

      /* Afficher la précision brièvement */
      const info = document.createElement('div');
      info.textContent = '📍 Précision ±' + acc + ' m';
      info.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);'
        + 'background:rgba(15,110,86,.92);color:#fff;padding:7px 14px;border-radius:20px;'
        + 'font-size:12px;z-index:999;pointer-events:none';
      document.body.appendChild(info);
      setTimeout(() => info.remove(), 3000);

      /* Suivi continu toutes les 10 secondes */
      gpsWatch = navigator.geolocation.watchPosition(
        (p) => {
          const la = p.coords.latitude.toFixed(6);
          const lo = p.coords.longitude.toFixed(6);
          if (iframe) {
            iframe.src = UMAP_BASE
              + '?scaleControl=false&miniMap=false&scrollWheelZoom=true'
              + '&zoomControl=true&allowEdit=false&moreControl=false'
              + '&searchControl=false&tilelayersControl=false'
              + '&embedControl=false&datalayersControl=false'
              + '&onLoadPanel=none&captionBar=false'
              + '#16/' + la + '/' + lo;
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    },
    /* Erreur */
    (err) => {
      label.textContent = 'Me localiser';
      btn.style.background = '#1D9E75';
      btn.querySelector('i').className = 'ti ti-current-location';
      const msgs = {
        1: 'Permission refusée. Autorisez la localisation dans les paramètres du navigateur.',
        2: 'Position indisponible. Vérifiez que le GPS est activé.',
        3: 'Délai dépassé. Réessayez en extérieur.'
      };
      alert(msgs[err.code] || 'Erreur de géolocalisation.');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

/* Arrêter le suivi GPS si on quitte l'onglet carte */
function stopGps() {
  if (gpsWatch !== null) {
    navigator.geolocation.clearWatch(gpsWatch);
    gpsWatch = null;
    const label = document.getElementById('gps-label');
    const btn   = document.getElementById('btn-gps');
    if (label) label.textContent = 'Me localiser';
    if (btn)   { btn.style.background = '#1D9E75'; btn.querySelector('i').className = 'ti ti-current-location'; }
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

/* ===== BANDEAU PHOTO ===== */
const BANDEAU_PHOTOS = [
  'bandeau/bandeau-calanques1.jpg',
  'bandeau/bandeau-calanques2.jpg',
  'bandeau/bandeau-verdon.jpg'
];

async function initBandeau() {
  const img = document.getElementById('bandeau-img');
  if (!img) return;

  /* Vérifier si evenement.jpg existe dans /bandeau */
  const eventUrl = baseUrl() + 'bandeau/evenement.jpg';
  try {
    const r = await fetch(eventUrl, { method: 'HEAD', cache: 'no-store' });
    if (r.ok) {
      img.src = eventUrl;
      console.log('[Bandeau] Image événement chargée');
      return;
    }
  } catch(e) { /* pas d'image événement */ }

  /* Sinon : choisir aléatoirement parmi les photos */
  const idx = Math.floor(Math.random() * BANDEAU_PHOTOS.length);
  img.src = baseUrl() + BANDEAU_PHOTOS[idx];
  console.log('[Bandeau] Photo aléatoire :', BANDEAU_PHOTOS[idx]);
}

function heroBandeauClick() {
  /* Clic sur le bandeau → aller à l'agenda */
  navTo('agenda');
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
  /* Arrêter GPS si on quitte la carte */
  if (sid !== 's-carte') stopGps();
}

/* ===== CARDS ===== */
function cardHtml(s) {
  const idx = window._sortieIndex.length;
  window._sortieIndex.push(s);
  const jour = s._jour || '';
  const jourBadge = jour
    ? `<span style="background:${jourColor(jour)}18;color:${jourColor(jour)};font-size:10px;font-weight:600;padding:1px 6px;border-radius:8px;margin-right:4px">${jourLabel(jour)}</span>`
    : '';
  const meta = s.distance_km
    ? `${jourBadge}${s.distance_km} km · ${s.denivele_m} m · ${badgeHtml(s.difficulte)}`
    : `${jourBadge}${badgeHtml(s.difficulte)}`;
  return `<div class="rando-card" onclick="showDetailByIndex(${idx})">
    <div class="date-col">
      <div class="date-day">${fmtDay(s.date)}</div>
      <div class="date-mon">${fmtMon(s.date)}</div>
    </div>
    <div class="rando-info">
      <div class="rando-name">${s.intitule}</div>
      <div class="rando-meta">${meta}</div>
    </div>
    <i class="ti ti-chevron-right chevron" aria-hidden="true"></i>
  </div>`;
}
function showDetailByIndex(idx) { showDetail(window._sortieIndex[idx]); }

/* Etiquette jour */
function jourLabel(j) {
  return { dimanche:'Dim.', mercredi:'Mer.', vendredi:'Ven.' }[j] || '';
}
function jourColor(j) {
  return { dimanche:'#1D9E75', mercredi:'#0C447C', vendredi:'#BA7517' }[j] || '#888';
}

/* ===== SKELETON LOADING ===== */
function skeletonCard() {
  return `<div class="rando-card" style="pointer-events:none">
    <div class="date-col">
      <div class="skeleton" style="width:28px;height:22px;margin:0 auto 4px"></div>
      <div class="skeleton" style="width:24px;height:10px;margin:0 auto"></div>
    </div>
    <div class="rando-info">
      <div class="skeleton" style="height:13px;width:75%;margin-bottom:6px"></div>
      <div class="skeleton" style="height:11px;width:50%"></div>
    </div>
  </div>`;
}
function showSkeletons() {
  const nc = document.getElementById('next-cards');
  const lc = document.getElementById('last-card');
  if (nc) nc.innerHTML = skeletonCard() + skeletonCard() + skeletonCard();
  if (lc) lc.innerHTML = skeletonCard();
  const ht = document.getElementById('hero-title');
  const he = document.getElementById('hero-eyebrow');
  if (ht) { ht.innerHTML = '<div class="skeleton" style="height:20px;width:70%;margin-bottom:6px"></div>'; ht.style.opacity='1'; }
  if (he) he.innerHTML = '<div class="skeleton" style="height:11px;width:40%"></div>';
}

/* ===== ACCUEIL ===== */
function renderAccueil() {
  window._sortieIndex = [];
  const all = allSorties();
  const futures = all.filter(s => isFuture(s.date)).sort((a,b) => a.date.localeCompare(b.date));
  const passees = all.filter(s => !isFuture(s.date)).sort((a,b) => b.date.localeCompare(a.date));
  const p = futures[0];

  if (p) {
    document.getElementById('hero-eyebrow').textContent = 'Prochaine sortie · ' + capitalize(fmtDate(p.date));
    const htEl = document.getElementById('hero-title');
  htEl.textContent = p.intitule;
  htEl.style.opacity = '1';
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
    const htEl2 = document.getElementById('hero-title');
    htEl2.textContent = 'Calendrier à venir';
    htEl2.style.opacity = '1';
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

  /* Filtres combinés : jour + difficulté */
  let all = allSorties().filter(s => isFuture(s.date));

  if (jourActif !== 'tous') {
    all = all.filter(s => s._jour === jourActif);
  }
  if (diffActif !== 'tous') {
    all = all.filter(s => s.difficulte === diffActif);
  }
  all.sort((a, b) => a.date.localeCompare(b.date));

  /* Regroupement par mois */
  const byMonth = {};
  all.forEach(s => {
    const k = s.date.slice(0, 7);
    if (!byMonth[k]) byMonth[k] = [];
    byMonth[k].push(s);
  });

  const moisNoms = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  let html = '';
  Object.entries(byMonth).forEach(([k, liste]) => {
    const [y, m] = k.split('-');
    html += `<div class="section-title">${moisNoms[parseInt(m)]} ${y}</div>`;
    html += liste.map(s => cardHtml(s)).join('');
  });

  document.getElementById('agenda-list').innerHTML = html ||
    '<div style="padding:24px;text-align:center;color:#aaa;font-size:13px;">Aucune sortie pour ces critères.</div>';

  /* Mise à jour du sous-titre topbar */
  const total = all.length;
  const sub = document.getElementById('topbar-sub');
  if (sub && document.getElementById('nb-agenda').classList.contains('active')) {
    sub.textContent = total + ' sortie' + (total > 1 ? 's' : '') + ' à venir';
  }
}

function setFiltreJour(btn, jour) {
  jourActif = jour;
  document.querySelectorAll('.filtre-jour').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderAgenda();
}

function setFiltreDiff(btn, diff) {
  diffActif = diff;
  document.querySelectorAll('.filtre-diff').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderAgenda();
}

/* ===== FICHE DÉTAIL ===== */
function penibiliteHtml(p) {
  const n = parseInt(p) || 0;
  return '<span style="color:#BA7517;font-size:14px;letter-spacing:1px">'
    + '★'.repeat(n) + '<span style="opacity:.25">' + '★'.repeat(3-n) + '</span></span>';
}

function showDetail(s) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById('form-screen').classList.remove('active');
  document.getElementById('detail-screen').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('topbar-title').textContent = 'Fiche rando';
  document.getElementById('topbar-sub').textContent   = '';

  document.getElementById('d-date').textContent        = capitalize(fmtDate(s.date));
  document.getElementById('d-title').textContent       = s.intitule;
  document.getElementById('d-badges').innerHTML        =
    badgeHtml(s.difficulte) + ' ' + penibiliteHtml(s.penibilite) +
    (s.ibp ? ` <span style="background:#f0f0ec;color:#555;font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px">IBP ${s.ibp}</span>` : '');
  document.getElementById('d-dist').textContent        = s.distance_km ? s.distance_km + ' km' : '—';
  document.getElementById('d-den').textContent          = s.denivele_m ? s.denivele_m + ' m' : '—';
  document.getElementById('d-ar').textContent          = s.distance_ar_km ? s.distance_ar_km + ' km' : '—';
  document.getElementById('d-dep1').textContent        = s.depart_carces;
  document.getElementById('d-dep2').textContent        = s.depart_rando;
  document.getElementById('d-lieu').textContent        = s.point_depart;
  // Coordonnées GPS → lien Maps
  const coordEl = document.getElementById('d-coords');
  if (s.coords_depart) {
    const [lat, lon] = s.coords_depart.split(',').map(v => v.trim());
    coordEl.innerHTML = `<a href="https://maps.google.com/?q=${lat},${lon}" target="_blank" rel="noopener"
      style="color:#1D9E75;text-decoration:none;font-size:12px">
      <i class="ti ti-map-pin" style="font-size:13px;vertical-align:-2px"></i> ${s.coords_depart}
    </a>`;
  } else { coordEl.textContent = '—'; }
  const cov = document.getElementById('d-covoit');
  cov.textContent = s.covoiturage_euros ? s.covoiturage_euros + ' €' : 'Non prévu';
  cov.style.color = s.covoiturage_euros ? '#1D9E75' : '#888';
  document.getElementById('d-pts').textContent = s.points_remarquables || '—';
  // Notes
  const notesEl = document.getElementById('d-notes-block');
  if (s.notes && s.notes.trim()) {
    notesEl.style.display = '';
    document.getElementById('d-notes').textContent = s.notes;
  } else { notesEl.style.display = 'none'; }
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
  showSkeletons();
  initBandeau();
  loadSorties();
  loadBannieres();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js')
      .then(r => console.log('[SW] scope:', r.scope))
      .catch(e => console.error('[SW] erreur:', e));
  }

  /* Disparition du splash screen */
  const splash = document.getElementById('app-splash');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('fade');
      setTimeout(() => splash.remove(), 320);
    }, 400);
  }
});

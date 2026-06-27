/* formulaire.js — Espace animateur : saisie d'une nouvelle randonnée */

let fStep = 0;
let fDiff = '';
let fCovoit = true;
let fPts = [];

const WEBMASTER_EMAIL = 'bhoyez@gmail.com';
const stepLabels = [
  '<strong>Étape 1/3</strong> — La randonnée',
  '<strong>Étape 2/3</strong> — Logistique & animateur',
  '<strong>Étape 3/3</strong> — Récapitulatif & envoi',
  '<strong>Terminé</strong>'
];

function fVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function fShow(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? 'block' : 'none';
}

function setFDiff(d) {
  fDiff = d;
  ['facile','moyen','difficile'].forEach(x => {
    const b = document.getElementById('fdf-' + x);
    if (b) b.className = 'diff-btn' + (d === x ? ' sel-' + x : '');
  });
  fShow('ferr-diff', false);
}

function setFCovoit(val) {
  fCovoit = val;
  const oui = document.getElementById('fcv-oui');
  const non = document.getElementById('fcv-non');
  if (oui) oui.className = 'covoit-btn' + (val ? ' sel' : '');
  if (non) non.className = 'covoit-btn' + (!val ? ' sel' : '');
}

function fAddPt() {
  const inp = document.getElementById('fpt-input');
  if (!inp) return;
  const val = inp.value.trim();
  if (!val) return;
  fPts.push(val);
  fRenderPts();
  inp.value = '';
}

function fRemovePt(i) { fPts.splice(i, 1); fRenderPts(); }

function fRenderPts() {
  const wrap = document.getElementById('fpts-list');
  if (!wrap) return;
  wrap.innerHTML = fPts.map((p, i) =>
    `<span class="pt-tag">${p}<button onclick="fRemovePt(${i})" aria-label="Supprimer">×</button></span>`
  ).join('');
}

function fBuildData() {
  const dateVal = fVal('ff-date');
  const titre   = fVal('ff-titre');
  const slug    = titre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/-$/, '');
  return {
    id:               dateVal + '-' + slug,
    date:             dateVal,
    intitule:         titre,
    difficulte:       fDiff || 'moyen',
    distance_km:      parseFloat(fVal('ff-dist')) || 0,
    denivele_m:       parseInt(fVal('ff-den'))   || 0,
    points_remarquables: fPts,
    depart_carces:    document.getElementById('ff-dep1').value || '08:00',
    depart_rando:     document.getElementById('ff-dep2').value || '09:00',
    point_depart:     fVal('ff-lieu'),
    distance_ar_km:   parseFloat(fVal('ff-ar')) || 0,
    covoiturage:      fCovoit,
    animateur:        fVal('ff-anim'),
    telephone:        fVal('ff-tel'),
    trace_gpx:        'traces/futures/' + dateVal + '-' + slug + '.gpx'
  };
}

function fFmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const mois = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  return parseInt(d) + ' ' + mois[parseInt(m)-1] + ' ' + y;
}

function fValidate0() {
  let ok = true;
  if (!fVal('ff-date'))  { fShow('ferr-date', true);  ok = false; } else fShow('ferr-date', false);
  if (!fVal('ff-titre')) { fShow('ferr-titre', true); ok = false; } else fShow('ferr-titre', false);
  if (!fDiff)            { fShow('ferr-diff', true);  ok = false; } else fShow('ferr-diff', false);
  if (!fVal('ff-dist'))  { fShow('ferr-dist', true);  ok = false; } else fShow('ferr-dist', false);
  return ok;
}

function fValidate1() {
  let ok = true;
  if (!fVal('ff-lieu')) { fShow('ferr-lieu', true); ok = false; } else fShow('ferr-lieu', false);
  if (!fVal('ff-anim')) { fShow('ferr-anim', true); ok = false; } else fShow('ferr-anim', false);
  return ok;
}

function fBuildRecap() {
  const d = fBuildData();
  const diffLabels = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
  const rows = [
    ['Date',            fFmtDate(d.date)],
    ['Intitulé',        d.intitule],
    ['Difficulté',      diffLabels[d.difficulte] || d.difficulte],
    ['Distance',        d.distance_km + ' km'],
    ['Dénivelé',        d.denivele_m + ' m'],
    ['Départ Carcès',   d.depart_carces],
    ['Départ rando',    d.depart_rando],
    ['Point de départ', d.point_depart],
    ['Trajet AR',       d.distance_ar_km ? d.distance_ar_km + ' km' : '—'],
    ['Covoiturage',     d.covoiturage ? 'Disponible' : 'Non prévu'],
    ['Animateur',       d.animateur],
    ['Téléphone',       d.telephone || '—'],
    ['Points remarquables', d.points_remarquables.length ? d.points_remarquables.join(', ') : '—']
  ];
  const el = document.getElementById('f-recap');
  if (el) el.innerHTML = rows.map(([l, v]) =>
    `<div class="recap-row"><span class="recap-label">${l}</span><span class="recap-val">${v}</span></div>`
  ).join('');
}

function fSendEmail() {
  const d = fBuildData();
  const json = JSON.stringify(d, null, 2);
  const diffLabels = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
  const sujet = encodeURIComponent('[Rando] ' + d.intitule + ' \u2014 ' + fFmtDate(d.date));
  const corps = encodeURIComponent(
    'Bonjour,\n\nVoici la fiche de la randonn\u00e9e \u00e0 publier sur le site.\n\n'
    + '=== FICHE RANDO ===\n'
    + 'Date           : ' + fFmtDate(d.date) + '\n'
    + 'Intitul\u00e9       : ' + d.intitule + '\n'
    + 'Difficult\u00e9     : ' + (diffLabels[d.difficulte] || d.difficulte) + '\n'
    + 'Distance       : ' + d.distance_km + ' km\n'
    + 'D\u00e9nivel\u00e9       : ' + d.denivele_m + ' m\n'
    + 'D\u00e9part Carc\u00e8s  : ' + d.depart_carces + '\n'
    + 'D\u00e9part rando   : ' + d.depart_rando + '\n'
    + 'Point de d\u00e9part: ' + d.point_depart + '\n'
    + 'Trajet AR      : ' + (d.distance_ar_km || '\u2014') + (d.distance_ar_km ? ' km' : '') + '\n'
    + 'Covoiturage    : ' + (d.covoiturage ? 'Oui' : 'Non') + '\n'
    + 'Animateur      : ' + d.animateur + '\n'
    + 'T\u00e9l\u00e9phone      : ' + (d.telephone || '\u2014') + '\n'
    + 'Points notables: ' + (d.points_remarquables.join(', ') || '\u2014') + '\n\n'
    + '=== JSON \u00e0 AJOUTER dans sorties/2025.json ===\n'
    + 'Ouvrir le fichier sorties/2025.json sur GitHub.\n'
    + 'Trouver le dernier bloc } avant le crochet fermant ].\n'
    + 'Ajouter une virgule apr\u00e8s ce }, puis coller le bloc ci-dessous :\n\n'
    + ',\n'
    + json + '\n\n'
    + 'Cordialement,\n' + d.animateur
  );
  window.location.href = 'mailto:' + WEBMASTER_EMAIL + '?subject=' + sujet + '&body=' + corps;
}

function fGoStep(n) {
  const prev = document.getElementById('fstep' + fStep);
  if (prev) prev.style.display = 'none';

  const dot = document.getElementById('fdot' + fStep);
  if (dot) {
    dot.classList.remove('active');
    if (n > fStep) dot.classList.add('done');
  }

  fStep = n;

  const next = document.getElementById('fstep' + fStep);
  if (next) next.style.display = 'block';

  const ndot = document.getElementById('fdot' + fStep);
  if (ndot) ndot.classList.add('active');

  const lbl = document.getElementById('fstep-label');
  if (lbl) lbl.innerHTML = stepLabels[fStep];

  const backBtn  = document.getElementById('fbtn-back');
  const nextBtn  = document.getElementById('fbtn-next');
  const footer   = document.getElementById('fform-footer');

  if (backBtn) backBtn.style.display = (fStep > 0 && fStep < 3) ? 'block' : 'none';

  if (fStep === 2) {
    fBuildRecap();
    if (nextBtn) { nextBtn.textContent = 'Envoyer au webmaster ✉'; nextBtn.className = 'btn-primary'; }
    if (footer) footer.style.display = 'flex';
  } else if (fStep === 3) {
    if (footer) footer.style.display = 'none';
    fSendEmail();
  } else {
    if (nextBtn) { nextBtn.textContent = 'Suivant →'; nextBtn.className = 'btn-primary'; }
    if (footer) footer.style.display = 'flex';
  }
}

function fNextStep() {
  if (fStep === 0 && !fValidate0()) return;
  if (fStep === 1 && !fValidate1()) return;
  if (fStep < 3) fGoStep(fStep + 1);
}

function fPrevStep() {
  if (fStep > 0) fGoStep(fStep - 1);
}

function fReset() {
  fStep = 0; fDiff = ''; fCovoit = true; fPts = [];
  ['ff-date','ff-titre','ff-dist','ff-den','ff-lieu','ff-ar','ff-anim','ff-tel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const dep1 = document.getElementById('ff-dep1'); if (dep1) dep1.value = '08:00';
  const dep2 = document.getElementById('ff-dep2'); if (dep2) dep2.value = '09:00';
  fRenderPts();
  ['facile','moyen','difficile'].forEach(x => {
    const b = document.getElementById('fdf-' + x);
    if (b) b.className = 'diff-btn';
  });
  [0,1,2,3].forEach(i => {
    const dot  = document.getElementById('fdot'  + i);
    const step = document.getElementById('fstep' + i);
    if (dot)  dot.className  = 'step-dot' + (i === 0 ? ' active' : '');
    if (step) step.style.display = i === 0 ? 'block' : 'none';
  });
  const lbl = document.getElementById('fstep-label');
  if (lbl) lbl.innerHTML = stepLabels[0];
  const backBtn = document.getElementById('fbtn-back');
  const nextBtn = document.getElementById('fbtn-next');
  const footer  = document.getElementById('fform-footer');
  if (backBtn) backBtn.style.display = 'none';
  if (nextBtn) { nextBtn.textContent = 'Suivant →'; }
  if (footer)  footer.style.display = 'flex';
  setFCovoit(true);
}

document.addEventListener('DOMContentLoaded', () => {
  const ptInput = document.getElementById('fpt-input');
  if (ptInput) ptInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fAddPt(); } });
  setFCovoit(true);
});

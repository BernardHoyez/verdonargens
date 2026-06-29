/* formulaire.js — Espace animateur : saisie d'une nouvelle randonnée
   Champs : date, intitulé, difficulté, pénibilité, IBP, distance,
            dénivelé, points remarquables, départ Carcès, départ rando,
            point départ, coordonnées GPS, distance AR, covoiturage €,
            animateur, téléphone, notes */

let fStep = 0;
let fDiff = '';
let fPenib = 0;
let fPts = '';
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

/* ── Difficulté ── */
function setFDiff(d) {
  fDiff = d;
  ['facile','moyen','difficile'].forEach(x => {
    const b = document.getElementById('fdf-' + x);
    if (b) b.className = 'diff-btn' + (d === x ? ' sel-' + x : '');
  });
  fShow('ferr-diff', false);
}

/* ── Pénibilité ── */
function setFPenib(n) {
  fPenib = n;
  for (let i = 1; i <= 3; i++) {
    const b = document.getElementById('fpen-' + i);
    if (b) {
      b.style.color  = i <= n ? '#BA7517' : '#ddd';
      b.style.opacity = i <= n ? '1' : '0.5';
    }
  }
  fShow('ferr-penib', false);
}

/* ── Validation ── */
function fValidate0() {
  let ok = true;
  if (!fVal('ff-date'))    { fShow('ferr-date', true);  ok = false; } else fShow('ferr-date', false);
  if (!fVal('ff-titre'))   { fShow('ferr-titre', true); ok = false; } else fShow('ferr-titre', false);
  if (!fDiff)              { fShow('ferr-diff', true);  ok = false; } else fShow('ferr-diff', false);
  if (!fPenib)             { fShow('ferr-penib', true); ok = false; } else fShow('ferr-penib', false);
  if (!fVal('ff-dist'))    { fShow('ferr-dist', true);  ok = false; } else fShow('ferr-dist', false);
  if (!fVal('ff-den'))     { fShow('ferr-den', true);   ok = false; } else fShow('ferr-den', false);
  return ok;
}
function fValidate1() {
  let ok = true;
  if (!fVal('ff-lieu'))    { fShow('ferr-lieu', true);  ok = false; } else fShow('ferr-lieu', false);
  if (!fVal('ff-anim'))    { fShow('ferr-anim', true);  ok = false; } else fShow('ferr-anim', false);
  return ok;
}

/* ── Construction de l'objet données ── */
function fBuildData() {
  const dateVal = fVal('ff-date');
  const titre   = fVal('ff-titre');
  const slug    = titre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/-$/, '');
  return {
    id:               dateVal + '-' + slug,
    date:             dateVal,
    intitule:         titre.slice(0, 50),
    difficulte:       fDiff || 'moyen',
    penibilite:       fPenib,
    ibp:              parseInt(fVal('ff-ibp')) || 0,
    distance_km:      parseInt(fVal('ff-dist')) || 0,
    denivele_m:       parseInt(fVal('ff-den'))  || 0,
    points_remarquables: fVal('ff-pts').slice(0, 100),
    depart_carces:    document.getElementById('ff-dep1').value || '08:00',
    depart_rando:     document.getElementById('ff-dep2').value || '09:00',
    point_depart:     fVal('ff-lieu').slice(0, 50),
    coords_depart:    fVal('ff-coords'),
    distance_ar_km:   parseInt(fVal('ff-ar'))   || 0,
    covoiturage_euros: parseInt(fVal('ff-covoit')) || 0,
    animateur:        fVal('ff-anim').slice(0, 20),
    telephone:        fVal('ff-tel'),
    notes:            fVal('ff-notes').slice(0, 100),
    trace_gpx:        'traces/futures/' + dateVal + '-' + slug + '.gpx'
  };
}

function fFmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const mois = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  return parseInt(d) + ' ' + mois[parseInt(m)-1] + ' ' + y;
}

function fPenibLabel(n) { return { 1:'* (faible)', 2:'** (modérée)', 3:'*** (élevée)' }[n] || '—'; }
function fDiffLabel(d)  { return { facile:'Facile', moyen:'Moyen', difficile:'Difficile' }[d] || d; }

/* ── Récapitulatif ── */
function fBuildRecap() {
  const d = fBuildData();
  const rows = [
    ['Date',            fFmtDate(d.date)],
    ['Intitulé',        d.intitule],
    ['Difficulté',      fDiffLabel(d.difficulte)],
    ['Pénibilité',      fPenibLabel(d.penibilite)],
    ['Indice IBP',      d.ibp || '—'],
    ['Distance',        d.distance_km + ' km'],
    ['Dénivelé',        d.denivele_m + ' m'],
    ['Points remarquables', d.points_remarquables || '—'],
    ['Départ Carcès',   d.depart_carces],
    ['Départ rando',    d.depart_rando],
    ['Point de départ', d.point_depart],
    ['Coordonnées GPS', d.coords_depart || '—'],
    ['Trajet AR',       d.distance_ar_km ? d.distance_ar_km + ' km' : '—'],
    ['Covoiturage',     d.covoiturage_euros ? d.covoiturage_euros + ' €' : '—'],
    ['Animateur',       d.animateur],
    ['Téléphone',       d.telephone || '—'],
    ['Notes',           d.notes || '—'],
  ];
  const el = document.getElementById('f-recap');
  if (el) el.innerHTML = rows.map(([l, v]) =>
    `<div class="recap-row"><span class="recap-label">${l}</span><span class="recap-val">${v}</span></div>`
  ).join('');
}

/* ── Email ── */
function fSendEmail() {
  const d = fBuildData();
  const json = JSON.stringify(d, null, 2);
  const sujet = encodeURIComponent('[Rando] ' + d.intitule + ' — ' + fFmtDate(d.date));
  const corps = encodeURIComponent(
    'Bonjour,\n\nVoici la fiche de la randonnée à publier sur le site.\n\n'
    + '=== FICHE RANDO ===\n'
    + 'Date              : ' + fFmtDate(d.date) + '\n'
    + 'Intitulé          : ' + d.intitule + '\n'
    + 'Difficulté        : ' + fDiffLabel(d.difficulte) + '\n'
    + 'Pénibilité        : ' + fPenibLabel(d.penibilite) + '\n'
    + 'Indice IBP        : ' + (d.ibp || '—') + '\n'
    + 'Distance          : ' + d.distance_km + ' km\n'
    + 'Dénivelé          : ' + d.denivele_m + ' m\n'
    + 'Points remarquables: ' + (d.points_remarquables || '—') + '\n'
    + 'Départ Carcès     : ' + d.depart_carces + '\n'
    + 'Départ rando      : ' + d.depart_rando + '\n'
    + 'Point de départ   : ' + d.point_depart + '\n'
    + 'Coordonnées GPS   : ' + (d.coords_depart || '—') + '\n'
    + 'Trajet AR         : ' + (d.distance_ar_km ? d.distance_ar_km + ' km' : '—') + '\n'
    + 'Covoiturage       : ' + (d.covoiturage_euros ? d.covoiturage_euros + ' €' : '—') + '\n'
    + 'Animateur         : ' + d.animateur + '\n'
    + 'Téléphone         : ' + (d.telephone || '—') + '\n'
    + 'Notes             : ' + (d.notes || '—') + '\n\n'
    + '=== JSON à AJOUTER dans sorties/2025.json ===\n'
    + 'Insérer ce bloc après la dernière entrée du fichier,\n'
    + 'précédé d\'une virgule sur la ligne précédente :\n\n'
    + ',\n'
    + json + '\n\n'
    + 'Cordialement,\n' + d.animateur
  );
  window.location.href = 'mailto:' + WEBMASTER_EMAIL + '?subject=' + sujet + '&body=' + corps;
}

/* ── Navigation entre étapes ── */
function fGoStep(n) {
  const prev = document.getElementById('fstep' + fStep);
  if (prev) prev.style.display = 'none';
  const dot = document.getElementById('fdot' + fStep);
  if (dot) { dot.classList.remove('active'); if (n > fStep) dot.classList.add('done'); }
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
    if (nextBtn) nextBtn.textContent = 'Envoyer au webmaster ✉';
    if (footer)  footer.style.display = 'flex';
  } else if (fStep === 3) {
    if (footer) footer.style.display = 'none';
    fSendEmail();
  } else {
    if (nextBtn) nextBtn.textContent = 'Suivant →';
    if (footer)  footer.style.display = 'flex';
  }
}
function fNextStep() {
  if (fStep === 0 && !fValidate0()) return;
  if (fStep === 1 && !fValidate1()) return;
  if (fStep < 3) fGoStep(fStep + 1);
}
function fPrevStep() { if (fStep > 0) fGoStep(fStep - 1); }

/* ── Reset ── */
function fReset() {
  fStep = 0; fDiff = ''; fPenib = 0;
  ['ff-date','ff-titre','ff-ibp','ff-dist','ff-den','ff-pts',
   'ff-lieu','ff-coords','ff-ar','ff-covoit','ff-anim','ff-tel','ff-notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const dep1 = document.getElementById('ff-dep1'); if (dep1) dep1.value = '08:00';
  const dep2 = document.getElementById('ff-dep2'); if (dep2) dep2.value = '09:00';
  ['facile','moyen','difficile'].forEach(x => {
    const b = document.getElementById('fdf-' + x); if (b) b.className = 'diff-btn';
  });
  for (let i = 1; i <= 3; i++) {
    const b = document.getElementById('fpen-' + i);
    if (b) { b.style.color = '#ddd'; b.style.opacity = '0.5'; }
  }
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
  if (nextBtn) nextBtn.textContent = 'Suivant →';
  if (footer)  footer.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  // Compteurs de caractères
  [['ff-titre', 50], ['ff-pts', 100], ['ff-lieu', 50], ['ff-anim', 20], ['ff-notes', 100]].forEach(([id, max]) => {
    const el = document.getElementById(id);
    const ct = document.getElementById(id + '-count');
    if (el && ct) {
      el.addEventListener('input', () => {
        const rem = max - el.value.length;
        ct.textContent = rem;
        ct.style.color = rem < 10 ? '#c0392b' : '#aaa';
      });
    }
  });
});

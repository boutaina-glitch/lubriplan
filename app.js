/ LubriPlan — app.js
// ✅ Filtre par machine (localisation)
// ✅ Planning par semaines S1-S52 avec couleurs (G=jaune, V=rouge/bleu)
// ✅ Export Excel coloré par semaines
// ✅ Historique restructuré en tableau
// ✅ localStorage : toutes les modifications sauvegardées
// ✅ FIX: Recherche activée + filtres combinés (machine + type + criticité...)
// ✅ FIX: Historique affiche la date exacte du cochage (pas undefined)

const LS_TASKS = 'lubriplan_tasks';
const LS_USERS = 'lubriplan_users';

const FREQ_M   = { Hebdomadaire:.25, Mensuelle:1, Bimestrielle:2, Trimestrielle:3, Semestrielle:6, Annuelle:12 };
const MONTHS_S = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const MONTHS_F = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

let tasks = [], users = [], currentUser = null;
let editTaskIdx = -1, editUserIdx = -1;
let sortCol = 'crit', sortAsc = true;
let calYear = new Date().getFullYear();
let cfCb = null, currentView = 'liste';
let calFilterMachine = '';
let calViewType = 'graisse'; // 'graisse' ou 'vidange'

// ── ÉTAT DES FILTRES (persistant entre renders) ──────────
// On stocke les valeurs des filtres dans un objet pour ne pas
// les perdre lors du re-render (getElementById peut retourner null
// si le DOM vient d'être reconstruit).
let filterState = {
  fltCrit: '',
  fltType: '',
  fltTech: '',
  fltStat: '',
  fltMach: '',
  srch: ''
};

// ── DONNÉES PAR DÉFAUT ──────────────────────────────────
Trimestrielle', techId:T, date:'2026-02-20', loc:'Zone piquage',      dur:'45 min', note:'Vidange réducteur entraînement tête de piquage.', done:false, hist:[] },
Mensuelle',     techId:T, date:'2026-01-20', loc:'Zone piquage',      dur:'20 min', note:'Graissage roulements arbres piquage et pliage.', done:false, hist:[] },
Trimestrielle', techId:T, date:'2026-02-20', loc:'Zone piquage',      dur:'15 min', note:'Graissage chaînes convoyeur alimentation.', done:false, hist:[] },
;
    const savedTasks = localStorage.getItem(LS_TASKS);
TASKS); localStorage.removeItem(LS_USERS);
);
}

// ── AUTH ────────────────────────────────────────────────
loginUser').value.trim();
  const pwd      = document.getElementById('loginPwd').value;
  const errEl    = document.getElementById('loginErr');
loginPwd').value = ''; document.getElementById('loginPwd').focus(); return;
  }
  currentUser = u;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('userAv').textContent   = initials(currentUser.name);
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Admin' : 'Technicien';
  filterState = { fltCrit:'', fltType:'', fltTech:'', fltStat:'', fltMach:'', srch:'' };
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginUser').value = ''; document.getElementById('loginPwd').value = '';
  document.getElementById('loginErr').textContent = '';
}
const isAdmin = () => currentUser && currentUser.role === 'admin';

// ── NAVIGATION ───────────────────────────────────────────
function switchView(v) {
  currentView = v; closeDp();
  // Réinitialiser les filtres lors du changement de vue
  filterState = { fltCrit:'', fltType:'', fltTech:'', fltStat:'', fltMach:'', srch:'' };
  ['liste','planning','techniciens','historique','utilisateurs'].forEach(id => {
    const el = document.getElementById('nav_'+id);
    if (el) el.classList.toggle('active', id === v);
  });
  const titles = { liste:'Planning des tâches', planning:'Planning annuel', techniciens:'Vue par technicien', historique:'Historique des interventions', utilisateurs:'Gestion des utilisateurs' };
  const subs   = { liste:'Triées par criticité', planning:'Calendrier par semaines', techniciens:'Charge de travail', historique:'Interventions effectuées', utilisateurs:'Comptes et rôles' };
  document.getElementById('pageTitle').textContent = titles[v] || v;
  document.getElementById('pageSub').textContent   = subs[v]  || '';
  render();
}

// ── RENDER ───────────────────────────────────────────────
function render() {
  const c = document.getElementById('content');
  if      (currentView === 'liste')        c.innerHTML = buildListView();
  else if (currentView === 'planning')     c.innerHTML = buildCalView();
  else if (currentView === 'techniciens')  c.innerHTML = buildTechView();
  else if (currentView === 'historique')   c.innerHTML = buildHistView();
  else if (currentView === 'utilisateurs') c.innerHTML = buildUserView();

  // Après reconstruction du DOM, restaurer les valeurs des filtres
  if (currentView === 'liste') restoreFilterState();
}

// ── RESTAURATION DES FILTRES APRÈS RE-RENDER ────────────
// Le DOM est reconstruit à chaque render() via innerHTML.
// On relit filterState pour remettre les valeurs dans les selects/input.
function restoreFilterState() {
  const ids = ['fltCrit','fltType','fltTech','fltStat','fltMach','srch'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') el.value = filterState[id] || '';
    else el.value = filterState[id] || '';
  });
}

// ── LECTURE DES FILTRES ET SAUVEGARDE DANS filterState ──
// À appeler avant chaque accès aux valeurs des filtres.
function syncFilterState() {
  const ids = ['fltCrit','fltType','fltTech','fltStat','fltMach','srch'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) filterState[id] = el.value;
  });
}

// ── CALLBACK UNIFIÉ pour tous les changements de filtre ──
function onFilterChange() {
  syncFilterState();
  render();
}

// ── HELPERS ──────────────────────────────────────────────
function fmtD(d) {
  // FIX: Gestion robuste des dates — évite "undefined" dans l'historique
  if (!d || d === 'undefined' || d === 'null') return '—';
  const s = String(d).trim();
  // Format ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const p = s.split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
  }
  // Format déjà dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // Timestamp numérique
  if (!isNaN(Number(s))) {
    const dt = new Date(Number(s));
    if (!isNaN(dt)) {
      const dd = String(dt.getDate()).padStart(2,'0');
      const mm = String(dt.getMonth()+1).padStart(2,'0');
      return `${dd}/${mm}/${dt.getFullYear()}`;
    }
  }
  return '—';
}

// FIX: today() retourne toujours une date ISO valide (yyyy-mm-dd)
function today() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function esc(s)   { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function initials(n) { return String(n||'').split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2); }
function getTechName(id) { const u = users.find(x => x.id === id); return u ? u.name : '—'; }
function getTechOptions(selId) {
  return users.filter(u => u.role==='tech' && u.active)
    .map(u => `<option value="${u.id}"${u.id===selId?' selected':''}>${u.name}</option>`).join('');
}
function getStatus(t) {
  if (t.done) return 'done';
  const d = new Date(t.date), n = new Date(); n.setHours(0,0,0,0);
  const diff = (d - n) / 86400000;
  if (diff < 0) return 'late'; if (diff <= 14) return 'soon'; return 'pending';
}
const sLabel = s => ({done:'Effectué',late:'En retard',soon:'Bientôt',pending:'Planifié'})[s];
const sClass = s => ({done:'s-done',late:'s-late',soon:'s-soon',pending:'s-pend'})[s];
const cLabel = c => ({1:'Critique',2:'Haute',3:'Moyenne',4:'Faible'})[c] || c;
const cClass = c => 'c' + c;
const tClass = t => t === 'Huile' ? 't-oil' : 't-grease';

function getStats() {
  const list  = isAdmin() ? tasks : tasks.filter(t => t.techId === currentUser.id);
  const total = list.length, done = list.filter(t=>t.done).length;
  const late  = list.filter(t=>getStatus(t)==='late').length;
  const soon  = list.filter(t=>getStatus(t)==='soon').length;
  const crit1 = list.filter(t=>t.crit===1).length;
  return { total, done, late, soon, crit1, pct: total ? Math.round(done/total*100) : 0 };
}

// ── FIX: getFiltered() lit depuis filterState (pas getElementById) ──
// Permet la combinaison de plusieurs filtres simultanément
// et fonctionne correctement même après un re-render.
function getFiltered() {
  // Synchroniser depuis le DOM si les éléments existent encore
  syncFilterState();

  const fc  = filterState.fltCrit  || '';
  const ft  = filterState.fltType  || '';
  const fth = filterState.fltTech  || '';
  const fs  = filterState.fltStat  || '';
  const fm  = filterState.fltMach  || '';
  const q   = (filterState.srch    || '').toLowerCase().trim();

  let list = isAdmin() ? tasks : tasks.filter(t => t.techId === currentUser.id);

  return list.filter(t => {
    const s = getStatus(t);
    // Filtre machine/localisation
    if (fm && t.loc !== fm) return false;
    // Filtre criticité
    if (fc && String(t.crit) !== String(fc)) return false;
    // Filtre type (Huile / Graisse)
    if (ft && t.type !== ft) return false;
    // Filtre technicien
    if (fth && String(t.techId) !== String(fth)) return false;
    // Filtre statut
    if (fs && s !== fs) return false;
    // Recherche textuelle (multi-champs)
    if (q) {
      const searchFields = [
        t.comp, t.prod, t.loc, t.note, t.freq, t.qty, t.type,
        getTechName(t.techId), cLabel(t.crit), sLabel(getStatus(t)), fmtD(t.date)
      ].map(x => (x||'').toLowerCase());
      if (!searchFields.some(f => f.includes(q))) return false;
    }
    return true;
  }).sort((a,b) => {
    let va=a[sortCol], vb=b[sortCol];
    if (['crit','id'].includes(sortCol)) { va=+va; vb=+vb; }
    if (sortCol==='date') { va=new Date(va); vb=new Date(vb); }
    if (va<vb) return sortAsc?-1:1; if (va>vb) return sortAsc?1:-1; return a.crit-b.crit;
  });
}

function srt(col) {
  syncFilterState();
  if (sortCol===col) sortAsc=!sortAsc; else { sortCol=col; sortAsc=true; }
  render();
}

// ── LIST VIEW ────────────────────────────────────────────
function buildListView() {
  const s=getStats(), all=getFiltered(), techs=users.filter(u=>u.role==='tech'&&u.active);
  const machines=getMachineList();

  // Compte les filtres actifs pour le badge
  const activeFilters = [filterState.fltCrit, filterState.fltType, filterState.fltTech,
    filterState.fltStat, filterState.fltMach, filterState.srch].filter(Boolean).length;

  const statsHTML=`<div class="stats-grid">
    <div class="stat-card sc-blue"><div class="stat-label">Total tâches</div><div class="stat-value">${s.total}</div><div class="stat-sub">${s.pct}% complété</div><div class="prog-bar"><div class="prog-fill" style="width:${s.pct}%"></div></div></div>
    <div class="stat-card sc-green"><div class="stat-label">Effectuées</div><div class="stat-value" style="color:var(--green)">${s.done}</div><div class="stat-sub">cette période</div></div>
    <div class="stat-card sc-red"><div class="stat-label">En retard</div><div class="stat-value" style="color:var(--red)">${s.late}</div><div class="stat-sub">${s.late>0?'Action requise':'Aucun retard'}</div></div>
    <div class="stat-card sc-orange"><div class="stat-label">Échéance proche</div><div class="stat-value" style="color:var(--orange)">${s.soon}</div><div class="stat-sub">dans 14 jours</div></div>
    <div class="stat-card sc-yellow"><div class="stat-label">Criticité 1</div><div class="stat-value" style="color:var(--red)">${s.crit1}</div><div class="stat-sub">équipements critiques</div></div>
  </div>`;

  const adminBtns=isAdmin()?`<div class="ctrl-actions">
    <button class="btn btn-s btn-sm" onclick="resetDone()">↺ Réinitialiser</button>
    <div class="export-group">
      <button class="btn btn-s btn-sm" onclick="exportCSV()">📤 CSV</button>
      <button class="btn btn-s btn-sm" onclick="exportXLSX()">📊 Excel</button>
    </div>
    <button class="btn btn-s btn-sm" onclick="document.getElementById('fileInput').click()">📥 Import</button>
    <button class="btn btn-p" onclick="openTaskModal()">+ Nouvelle tâche</button>
  </div>`:'';

  const techFilter=isAdmin()?`<select id="fltTech" onchange="onFilterChange()">
    <option value="">Tous techniciens</option>
    ${techs.map(u=>`<option value="${u.id}"${String(filterState.fltTech)===String(u.id)?' selected':''}>${u.name}</option>`).join('')}
  </select>`:'';

  const machineFilter=`<select id="fltMach" onchange="onFilterChange()" style="max-width:200px">
    <option value="">Toutes machines</option>
    ${machines.map(m=>`<option value="${esc(m)}"${filterState.fltMach===m?' selected':''}>${esc(m)}</option>`).join('')}
  </select>`;

  // FIX: Indicateur visuel du nombre de filtres actifs
  const filterBadge = activeFilters > 0
    ? `<span style="display:inline-flex;align-items:center;justify-content:center;background:var(--accent,#3182CE);color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;margin-left:4px">${activeFilters}</span>`
    : '';
  const resetBtn = activeFilters > 0
    ? `<button class="btn btn-s btn-sm" onclick="clearAllFilters()" style="color:var(--red);border-color:var(--red)" title="Effacer tous les filtres">✕ Filtres${filterBadge}</button>`
    : '';

  const ctrlHTML=`<div class="ctrl-bar">
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input type="text" id="srch" placeholder="Rechercher composant, type, technicien…"
        value="${esc(filterState.srch)}"
        oninput="onFilterChange()"/>
    </div>
    ${machineFilter}
    <select id="fltCrit" onchange="onFilterChange()">
      <option value="">Toutes criticités</option>
      <option value="1"${filterState.fltCrit==='1'?' selected':''}>🔴 Critique</option>
      <option value="2"${filterState.fltCrit==='2'?' selected':''}>🟠 Haute</option>
      <option value="3"${filterState.fltCrit==='3'?' selected':''}>🟡 Moyenne</option>
      <option value="4"${filterState.fltCrit==='4'?' selected':''}>🟢 Faible</option>
    </select>
    <select id="fltType" onchange="onFilterChange()">
      <option value="">Tous types</option>
      <option value="Huile"${filterState.fltType==='Huile'?' selected':''}>Huile</option>
      <option value="Graisse"${filterState.fltType==='Graisse'?' selected':''}>Graisse</option>
    </select>
    ${techFilter}
    <select id="fltStat" onchange="onFilterChange()">
      <option value="">Tous statuts</option>
      <option value="late"${filterState.fltStat==='late'?' selected':''}>En retard</option>
      <option value="soon"${filterState.fltStat==='soon'?' selected':''}>Bientôt</option>
      <option value="pending"${filterState.fltStat==='pending'?' selected':''}>Planifié</option>
      <option value="done"${filterState.fltStat==='done'?' selected':''}>Effectué</option>
    </select>
    ${resetBtn}
    ${adminBtns}
  </div>`;

  // Résumé des filtres actifs
  const filterSummary = buildFilterSummary();

  const th=(k,l)=>`<th class="${sortCol===k?'sorted':''}" onclick="srt('${k}')">${l}${sortCol===k?' '+(sortAsc?'↑':'↓'):''}</th>`;
  const theadHTML=`${th('comp','Composant')} ${th('crit','Criticité')} ${th('type','Type')} ${th('prod','Produit')} ${th('freq','Fréquence')} ${isAdmin()?th('techId','Technicien'):''} ${th('date','Échéance')} <th>Statut</th> <th style="text-align:center">Fait</th> ${isAdmin()?'<th></th>':''}`;

  const rows=all.length?all.map(t=>{
    const si=tasks.indexOf(t), st=getStatus(t), canCheck=isAdmin()||t.techId===currentUser.id;
    return`<tr style="cursor:pointer" onclick="openDp(${si})">
      <td onclick="event.stopPropagation()"><div class="comp-name">${esc(t.comp)}</div>${t.loc?`<div class="comp-loc">📍 ${esc(t.loc)}</div>`:''}</td>
      <td><span class="badge ${cClass(t.crit)}">${t.crit} — ${cLabel(t.crit)}</span></td>
      <td><span class="badge ${tClass(t.type)}">${t.type}</span></td>
      <td><div style="font-size:12px;font-weight:500">${esc(t.prod)}</div><div style="font-size:11px;color:var(--text3)">${esc(t.qty||'')}</div></td>
      <td style="font-size:12px">${t.freq}</td>
      ${isAdmin()?`<td style="font-size:12px">${esc(getTechName(t.techId))}</td>`:''}
      <td style="font-size:12px;font-family:var(--mono)">${fmtD(t.date)}</td>
      <td><span class="badge ${sClass(st)}">${sLabel(st)}</span></td>
      <td class="chk-wrap" onclick="event.stopPropagation()"><input type="checkbox" ${t.done?'checked':''} ${canCheck?'':'disabled'} onchange="toggleDone(${si},this)"/></td>
      ${isAdmin()?`<td onclick="event.stopPropagation()"><div style="display:flex;gap:4px"><button class="btn-icon" onclick="openTaskModal(${si})">✏</button><button class="btn-icon" onclick="delTask(${si})" style="color:var(--red)">🗑</button></div></td>`:''}
    </tr>`;
  }).join(''):`<tr><td colspan="10"><div class="empty"><div class="empty-icon">🔍</div><p>Aucune tâche trouvée${activeFilters>0?' — <a href="#" onclick="clearAllFilters();return false;" style="color:var(--accent)">Effacer les filtres</a>':''}</p></div></td></tr>`;

  return statsHTML + ctrlHTML + filterSummary + `<div class="tbl-wrap"><table><thead><tr>${theadHTML}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ── RÉSUMÉ DES FILTRES ACTIFS ────────────────────────────
function buildFilterSummary() {
  const parts = [];
  if (filterState.fltMach)  parts.push(`Machine : <strong>${esc(filterState.fltMach)}</strong>`);
  if (filterState.fltCrit)  parts.push(`Criticité : <strong>${cLabel(+filterState.fltCrit)}</strong>`);
  if (filterState.fltType)  parts.push(`Type : <strong>${esc(filterState.fltType)}</strong>`);
  if (filterState.fltTech) {
    const u = users.find(x => String(x.id) === String(filterState.fltTech));
    if (u) parts.push(`Technicien : <strong>${esc(u.name)}</strong>`);
  }
  if (filterState.fltStat)  parts.push(`Statut : <strong>${sLabel(filterState.fltStat)}</strong>`);
  if (filterState.srch)     parts.push(`Recherche : <strong>"${esc(filterState.srch)}"</strong>`);
  if (!parts.length) return '';
  return `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#EBF8FF;border:1px solid #BEE3F8;border-radius:6px;margin-bottom:10px;font-size:12px;color:#2C5282">
    <span style="font-weight:600">🔎 Filtres actifs :</span>
    ${parts.join('<span style="color:#90CDF4;margin:0 2px">·</span>')}
    <button onclick="clearAllFilters()" style="margin-left:auto;background:none;border:1px solid #3182CE;color:#3182CE;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px">✕ Tout effacer</button>
  </div>`;
}

// ── EFFACER TOUS LES FILTRES ─────────────────────────────
function clearAllFilters() {
  filterState = { fltCrit:'', fltType:'', fltTech:'', fltStat:'', fltMach:'', srch:'' };
  render();
}

// ── CALCUL NUMÉRO DE SEMAINE ISO ────────────────────────
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Recalcul propre des semaines actives
function getActiveWeeksClean(t, yr) {
  if (!t.date) return new Set();
  const base = new Date(t.date + 'T00:00:00');
  if (isNaN(base)) return new Set();
  const weeks = new Set();

  if (t.freq === 'Hebdomadaire') {
    let cur = new Date(base);
    while (cur.getFullYear() <= yr) {
      if (cur.getFullYear() === yr) weeks.add(getWeekNumber(cur));
      cur.setDate(cur.getDate() + 7);
      if (weeks.size > 52) break;
    }
  } else {
    const ivMonths = Math.round(FREQ_M[t.freq] || 12);
    let cur = new Date(base);
    for (let i = 0; i < 50; i++) {
      if (cur.getFullYear() > yr) break;
      if (cur.getFullYear() === yr) weeks.add(getWeekNumber(cur));
      cur.setMonth(cur.getMonth() + ivMonths);
    }
  }
  return weeks;
}

// ── CALENDAR VIEW (PLANNING PAR SEMAINES) ───────────────
function buildCalView() {
  const machines = getMachineList();
  const TOTAL_WEEKS = 52;
  const weeks = Array.from({length: TOTAL_WEEKS}, (_, i) => i + 1);

cal-tab-active':''}" onclick="calViewType='graisse';render()">🟡 Planning Graissage</button>
cal-tab-active':''}" onclick="calViewType='vidange';render()">🔴 Planning Vidange / Huile</button>
this.value;render()" style="font-family:var(--font);font-size:13px;padding:6px 12px;border:1px solid var(--border2);border-radius:var(--r);background:var(--surface);color:var(--text);outline:none;height:34px">
calFilterMachine===m?' selected':''}>${esc(m)}</option>`).join('')}
downloadMachinePlanning('${esc(calFilterMachine).replace(/'/g,"\\'")}')">📥 Télécharger planning machine</button>`
)">📥 Télécharger tout (Excel)</button>`;
/span>
      <button onclick="calYear++;render()">Suivant ▶</button>
align-items:center;flex-wrap:wrap">
border:1px solid #B8860B"></span>G — Graissage planifié</span>
border:1px solid #9B1C1C"></span>G — Semaine courante / urgente</span>
border:1px solid #276749"></span>G — Effectué</span>`
border:1px solid #9B1C1C"></span>V — Vidange planifiée</span>
border:1px solid #2C5282"></span>V — Vidange effectuée</span>`
  displayTasks = displayTasks.filter(t => isGraisse ? t.type === 'Graisse' : t.type === 'Huile');

  if (!displayTasks.length) {
    return header + tabsHTML + `<div class="empty"><div class="empty-icon">📅</div><p>Aucune tâche ${isGraisse?'de graissage':'de vidange'} trouvée</p></div>`;
  }

  const now = new Date();
  const currentWeek = getWeekNumber(now);

  const byMachine = {};
  displayTasks.forEach(t => {
    if (!byMachine[t.comp]) byMachine[t.comp] = [];
    byMachine[t.comp].push(t);
  });

  const monthWeekRanges = [];
  for (let mo = 0; mo < 12; mo++) {
    const firstDay = new Date(calYear, mo, 1);
    const lastDay  = new Date(calYear, mo + 1, 0);
    const wStart = getWeekNumber(firstDay);
    const wEnd   = getWeekNumber(lastDay);
    monthWeekRanges.push({ mo, wStart, wEnd, label: MONTHS_S[mo] });
  }

  const monthHeaderCells = monthWeekRanges.map(m => {
    const span = Math.max(1, m.wEnd - m.wStart + 1);
    return `<th colspan="${span}" style="background:#1a365d;color:#fff;text-align:center;font-size:11px;font-weight:700;border:1px solid #2d4a7a;padding:4px 2px;letter-spacing:0.5px">${m.label}</th>`;
  }).join('');

  const weekHeaderCells = weeks.map(w => {
    const isCur = w === currentWeek && calYear === now.getFullYear();
    return `<th style="background:${isCur?'#E53E3E':'#2d4a7a'};color:#fff;text-align:center;font-size:10px;font-weight:600;border:1px solid #1a365d;min-width:22px;width:22px;padding:3px 1px">S${w}</th>`;
  }).join('');

  let rowsHTML = '';
  const machineNames = Object.keys(byMachine).sort();

  machineNames.forEach((machineName, mIdx) => {
    const machineTasks = byMachine[machineName];
    const rowSpan = machineTasks.length;
    const rowBg = mIdx % 2 === 0 ? '#f8fafc' : '#fff';

    machineTasks.forEach((t, tIdx) => {
      const si = tasks.indexOf(t);
      const activeWeeks = getActiveWeeksClean(t, calYear);

/td>`;
padding:1px">
w})" title="${esc(t.comp)} — ${t.freq} — S${w}" style="background:${bg};border:1px solid ${border};color:${color};width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;margin:auto;cursor:pointer;border-radius:2px;user-select:none">${content}</div>
background:#edf2f7">
weight:800;color:#1a365d;text-transform:uppercase;letter-spacing:0.5px">${esc(machineName)}</div>
4a5568;white-space:nowrap;min-width:120px">${esc(t.prod||t.note.substring(0,30)+(t.note.length>30?'…':''))}</td>
4a5568;white-space:nowrap">${t.freq}</td>
4a5568;white-space:nowrap;min-width:120px">${esc(t.prod||t.note.substring(0,30)+(t.note.length>30?'…':''))}</td>
4a5568;white-space:nowrap">${t.freq}</td>
collapse;width:100%;font-family:var(--font)">
color:#fff;padding:8px 12px;font-size:12px;font-weight:700;border:1px solid #2d4a7a;text-align:left;min-width:160px">ÉQUIPEMENT</th>
color:#fff;padding:8px 12px;font-size:12px;font-weight:700;border:1px solid #2d4a7a;text-align:left;min-width:130px">LUBRIFIANT</th>
color:#fff;padding:8px 12px;font-size:12px;font-weight:700;border:1px solid #2d4a7a;text-align:left;min-width:100px">FRÉQUENCE</th>
strong> (S${week}) comme effectué ?`,
      // FIX: Enregistrer la date exacte du cochage (pas une date aléatoire)
      tasks[si].hist.push(today());
      saveTasks(); toast('Tâche marquée effectuée'); render();
    }
  );
}

function calClick(si) {
  const t=tasks[si], canCheck=isAdmin()||t.techId===currentUser.id;
  if(!canCheck){toast('Vous ne pouvez cocher que vos propres tâches','err');return;}
  showCf('Confirmer intervention',`Marquer <strong>${esc(t.comp)}</strong> comme effectué ?`,()=>{
    tasks[si].done=true;
    // FIX: Date exacte du cochage
    tasks[si].hist.push(today());
    saveTasks(); toast('Tâche marquée effectuée'); render();
  });
}

// ── TÉLÉCHARGEMENT EXCEL COLORÉ PAR SEMAINES ────────────
function downloadMachinePlanning(machineName) {
  const machineTasks = tasks.filter(t => t.loc === machineName);
  if (!machineTasks.length) { toast('Aucune tâche pour cette machine', 'err'); return; }
  if (typeof XLSX === 'undefined') { toast('Bibliothèque Excel non chargée', 'err'); return; }

  const wb = XLSX.utils.book_new();
  const TOTAL_WEEKS = 52;
  const weeks = Array.from({length: TOTAL_WEEKS}, (_, i) => i + 1);
  const now = new Date();
  const currentWeek = getWeekNumber(now);

  const wsInfo = XLSX.utils.aoa_to_sheet([
    ['PLANNING DE GRAISSAGE & VIDANGE',''],
    ['Machine :', machineName],
    ['Exporté le :', fmtD(today())],
    ['Année :', calYear],
    ['Technicien(s) :', [...new Set(machineTasks.map(t=>getTechName(t.techId)))].join(', ')],
  ]);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Infos');

  buildWeeklySheet(wb, machineTasks.filter(t => t.type === 'Graisse'), weeks, calYear, currentWeek, `Graissage ${calYear}`, 'G',
    { planned:'FFFF00', done:'92D050', late:'FF0000', header:'1A365D', headerFont:'FFFFFF' }
  );

  buildWeeklySheet(wb, machineTasks.filter(t => t.type === 'Huile'), weeks, calYear, currentWeek, `Vidange ${calYear}`, 'V',
    { planned:'FF0000', done:'00B0F0', late:'FF6600', header:'1A365D', headerFont:'FFFFFF' }
  );

  const histHeader = ['Date','Équipement','Type','Produit','Technicien','Statut'];
  const histRows = [];
  machineTasks.forEach(t => {
    (t.hist||[]).forEach(d => {
      // FIX: Ne pas afficher "—" si la date est valide
      const dateStr = fmtD(d);
      histRows.push([dateStr !== '—' ? dateStr : 'Date inconnue', t.comp, t.type, t.prod||'—', getTechName(t.techId), 'Effectué']);
    });
  });
  if (!histRows.length) histRows.push(['Aucune intervention enregistrée','','','','','']);
  const wsHist = XLSX.utils.aoa_to_sheet([histHeader, ...histRows]);
  wsHist['!cols'] = [{wch:14},{wch:25},{wch:10},{wch:28},{wch:18},{wch:12}];
  styleHeaderRow(wsHist, histHeader.length, '1A365D', 'FFFFFF');
  XLSX.utils.book_append_sheet(wb, wsHist, 'Historique');

  const safeName = machineName.replace(/[/\\:*?"<>|]/g,'_');
  XLSX.writeFile(wb, `LubriPlan_${safeName}_${calYear}.xlsx`);
  toast(`📊 Planning "${machineName}" téléchargé`);
}

function buildWeeklySheet(wb, taskList, weeks, yr, currentWeek, sheetName, letter, colors) {
  const aoa = [];

  const monthRow = ['ÉQUIPEMENT', 'LUBRIFIANT', 'FRÉQUENCE'];
  const now = new Date();
  const monthWeekMap = {};
  for (let mo = 0; mo < 12; mo++) {
    const firstDay = new Date(yr, mo, 1);
    const lastDay  = new Date(yr, mo + 1, 0);
    let wS = getWeekNumber(firstDay), wE = getWeekNumber(lastDay);
    if (wS > wE) wE = wS;
    for (let w = wS; w <= wE && w <= 52; w++) {
      if (!monthWeekMap[w]) monthWeekMap[w] = mo;
    }
  }
  weeks.forEach(w => {
    const mo = monthWeekMap[w] !== undefined ? monthWeekMap[w] : -1;
    monthRow.push(mo >= 0 ? MONTHS_S[mo] : '');
  });
  aoa.push(monthRow);

  const weekRow = ['ÉQUIPEMENT', 'LUBRIFIANT', 'FRÉQUENCE', ...weeks.map(w => `S${w}`)];
  aoa.push(weekRow);

  const byMachine = {};
  taskList.forEach(t => { if (!byMachine[t.comp]) byMachine[t.comp] = []; byMachine[t.comp].push(t); });

  Object.keys(byMachine).sort().forEach(machineName => {
    byMachine[machineName].forEach(t => {
      const activeWeeks = getActiveWeeksClean(t, yr);
      const row = [machineName, t.prod || t.note.substring(0,40), t.freq];
      weeks.forEach(w => {
        if (!activeWeeks.has(w)) { row.push(''); return; }
        row.push(letter);
      });
      aoa.push(row);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  aoa.forEach((rowData, ri) => {
    rowData.forEach((cell, ci) => {
      const ref = XLSX.utils.encode_cell({r: ri, c: ci});
      if (!ws[ref]) return;

      let fgColor = null, fontColor = 'FF000000', bold = false;

      if (ri === 0) {
        fgColor = colors.header; fontColor = colors.headerFont; bold = true;
      } else if (ri === 1) {
        if (ci < 3) { fgColor = colors.header; fontColor = colors.headerFont; bold = true; }
        else {
          const weekNum = ci - 2;
          fgColor = weekNum === currentWeek && yr === now.getFullYear() ? 'E53E3E' : '2D4A7A';
          fontColor = 'FFFFFFFF'; bold = true;
        }
      } else if (ri >= 2) {
        if (ci === 0) { fgColor = 'EDF2F7'; bold = true; }
        else if (ci === 1 || ci === 2) { fgColor = 'F7FAFC'; }
        else if (cell === letter) {
          const weekNum = ci - 2;
          const isPast = weekNum < currentWeek && yr === now.getFullYear();
          const isCur  = weekNum === currentWeek && yr === now.getFullYear();
          fgColor = isCur ? 'E53E3E' : isPast ? colors.late : colors.planned;
          fontColor = (colors.planned === 'FFFF00' && !isCur && !isPast) ? 'FF7B341E' : 'FFFFFFFF';
          bold = true;
        }
      }

      if (fgColor) {
        ws[ref].s = {
          fill: { patternType: 'solid', fgColor: { rgb: fgColor } },
          font: { bold, color: { rgb: fontColor }, sz: 9, name: 'Calibri' },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top:    { style: 'thin', color: { rgb: 'CBD5E0' } },
            bottom: { style: 'thin', color: { rgb: 'CBD5E0' } },
            left:   { style: 'thin', color: { rgb: 'CBD5E0' } },
            right:  { style: 'thin', color: { rgb: 'CBD5E0' } }
          }
        };
      }
    });
  });

  ws['!cols'] = [
    {wch:22}, {wch:28}, {wch:14},
    ...Array(52).fill({wch:4})
  ];
aoa.length-2).fill({hpt:15})];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
CBD5E0'}}, bottom:{style:'thin',color:{rgb:'CBD5E0'}}, left:{style:'thin',color:{rgb:'CBD5E0'}}, right:{style:'thin',color:{rgb:'CBD5E0'}} }
i+1);
machineName => {
replace(/[/\\:*?"<>[\]]/g,'_');

    buildWeeklySheet(wb, machineTasks.filter(t=>t.type==='Graisse'), weeks, calYear, currentWeek,
=='Huile'), weeks, calYear, currentWeek,
  const recapHeader = ['Machine','Localisation','Criticité','Type','Produit','Fréquence','Technicien','Prochaine échéance','Statut'];
  const recapRows = tasks.map(t => [t.comp, t.loc||'', cLabel(t.crit), t.type, t.prod, t.freq, getTechName(t.techId), fmtD(t.date), sLabel(getStatus(t))]);
  const wsRecap = XLSX.utils.aoa_to_sheet([recapHeader, ...recapRows]);
  wsRecap['!cols'] = [{wch:22},{wch:18},{wch:12},{wch:10},{wch:25},{wch:14},{wch:18},{wch:14},{wch:12}];
  styleHeaderRow(wsRecap, recapHeader.length, '1A365D', 'FFFFFF');
  XLSX.utils.book_append_sheet(wb, wsRecap, 'Récapitulatif');

  XLSX.writeFile(wb, `LubriPlan_Planning_Complet_${calYear}.xlsx`);
  toast('📊 Planning complet téléchargé');
}

// ── TECH VIEW ────────────────────────────────────────────
function buildTechView() {
  const techs=users.filter(u=>u.role==='tech'&&u.active);
  if(!techs.length)return`<div class="empty"><div class="empty-icon">👷</div><p>Aucun technicien</p></div>`;
  const cards=techs.map(u=>{
    const tlist=tasks.filter(t=>t.techId===u.id).sort((a,b)=>a.crit-b.crit);
    const done=tlist.filter(t=>t.done).length, pct=tlist.length?Math.round(done/tlist.length*100):0;
    const taskRows=tlist.map(t=>{
      const si=tasks.indexOf(t), s=getStatus(t), canCheck=isAdmin()||t.techId===currentUser.id;
      return`<div class="tech-task"><span class="badge ${cClass(t.crit)}" style="font-size:10px;padding:1px 5px">${t.crit}</span><span class="tech-task-name">${esc(t.comp.substring(0,25))}${t.comp.length>25?'…':''}</span><span class="badge ${sClass(s)}" style="font-size:10px">${sLabel(s)}</span><input type="checkbox" ${t.done?'checked':''} ${canCheck?'':'disabled'} onchange="toggleDone(${si},this)"/></div>`;
    }).join('');
    return`<div class="tech-card"><div class="tech-card-header"><div class="tech-av">${initials(u.name)}</div><div><div class="tech-name">${esc(u.name)}</div><div class="tech-count">${u.spec||''} — ${tlist.length} tâche${tlist.length>1?'s':''}</div></div></div><div class="tech-tasks">${taskRows||'<div style="padding:10px 16px;font-size:12px;color:var(--text3)">Aucune tâche assignée</div>'}</div><div class="tech-prog"><div class="tech-prog-label"><span>Progression</span><span>${pct}%</span></div><div class="prog-bar" style="height:6px"><div class="prog-fill" style="width:${pct}%"></div></div></div></div>`;
  }).join('');
  return`<div class="tech-grid">${cards}</div>`;
}

// ── HISTORY VIEW ─────────────────────────────────────────
function buildHistView() {
  const list = isAdmin() ? tasks : tasks.filter(t => t.techId === currentUser.id);
  const all = [];
  list.forEach(t => {
    (t.hist||[]).forEach(d => {
      // FIX: Ignorer les entrées vides/invalides dans l'historique
      if (d && d !== 'undefined' && d !== 'null' && String(d).trim() !== '') {
        all.push({d: String(d).trim(), t});
      }
    });
  });
  all.sort((a,b) => new Date(b.d) - new Date(a.d));

  if (!all.length) return `<div class="empty"><div class="empty-icon">🕐</div><p>Aucune intervention enregistrée</p></div>`;

  const totalInterv = all.length;
  const thisMonth = all.filter(({d}) => {
    const dt = new Date(d);
    if (isNaN(dt)) return false;
totalInterv}</div>
thisMonth}</div>
byType.Huile}</div>
byType.Graisse}</div>
        <div class="hist-stat-lbl">Graissages</div>
      </div>
    </div>`;

  const tableRows = all.map(({d, t}, idx) => {
    const rowBg = idx % 2 === 0 ? '#f8fafc' : '#fff';
    const typeColor = t.type === 'Huile' ? '#3182CE' : '#D69E2E';
    const typeBg    = t.type === 'Huile' ? '#EBF8FF' : '#FFFFF0';
    const critColor = ({1:'#E53E3E',2:'#DD6B20',3:'#D69E2E',4:'#38A169'})[t.crit] || '#718096';
    // FIX: fmtD gère maintenant tous les formats et ne retourne plus "undefined"
    const dateDisplay = fmtD(d);
    return `<tr style="background:${rowBg};border-bottom:1px solid #e2e8f0">
      <td style="padding:10px 14px;font-size:12px;font-family:var(--mono);font-weight:600;color:#2d3748;white-space:nowrap;border-right:1px solid #e2e8f0">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:8px;height:8px;border-radius:50%;background:#38A169;flex-shrink:0"></div>
          ${dateDisplay}
weight:700;color:#1a365d">${esc(t.comp)}</div>
718096;margin-top:2px">📍 ${esc(t.loc||'—')}</div>
padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:${typeBg};color:${typeColor};border:1px solid ${typeColor}30">${t.type}</span>
4a5568;border-right:1px solid #e2e8f0">${esc(t.prod||'—')}</td>
4a5568;border-right:1px solid #e2e8f0">${esc(t.freq)}</td>
4a5568;border-right:1px solid #e2e8f0">${esc(getTechName(t.techId))}</td>
items:center;gap:6px">
border-radius:50%;background:${critColor}"></div>
critColor};font-weight:600">${cLabel(t.crit)}</span>
collapse:collapse">
size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">DATE</th>
size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">ÉQUIPEMENT</th>
size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">TYPE</th>
size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">PRODUIT</th>
size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">FRÉQUENCE</th>
size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">TECHNICIEN</th>
size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px">CRITICITÉ</th>
──────────────
Accès refusé</p></div>`;
'av-tech'}">${initials(u.name)}</div><div class="user-info"><div class="user-fullname">${esc(u.name)} ${isMe?'<span style="font-size:10px;color:var(--text3)">(vous)</span>':''}</div><div class="user-detail">@${esc(u.login)} · ${esc(u.spec||'')}</div><div class="user-badges"><span class="badge ${u.role==='admin'?'b-admin':'b-tech'}">${u.role==='admin'?'Admin':'Technicien'}</span>${u.role==='tech'?`<span style="font-size:11px;color:var(--text3)">${tc} tâche${tc>1?'s':''}</span>`:''} ${!u.active?'<span class="badge s-late">Désactivé</span>':''}</div></div><div class="user-actions"><button class="btn-icon" onclick="openUserModal(${i})">✏</button>${!isMe?`<button class="btn-icon" onclick="toggleUserActive(${i})" style="color:${u.active?'var(--orange)':'var(--green)'}">${u.active?'⏸':'▶'}</button>`:''} ${!isMe&&u.role!=='admin'?`<button class="btn-icon" onclick="delUser(${i})" style="color:var(--red)">🗑</button>`:''}</div></div>`;
content:flex-end;margin-bottom:16px"><button class="btn btn-p" onclick="openUserModal()">+ Ajouter un utilisateur</button></div><div class="user-grid">${cards}</div>`;
}

// ── DETAIL PANEL ─────────────────────────────────────────
).textContent=t.comp;
  document.getElementById('dp-s').innerHTML=`<span class="badge ${cClass(t.crit)}">${t.crit} — ${cLabel(t.crit)}</span> &nbsp; <span class="badge ${sClass(s)}">${sLabel(s)}</span>`;
span>`],['Référence',esc(t.prod)],['Quantité',esc(t.qty||'—')],['Fréquence',t.freq],['Technicien',esc(getTechName(t.techId))],['Échéance',fmtD(t.date)],['Durée',esc(t.dur||'—')],['Localisation',esc(t.loc||'—')]];
  // FIX: Affichage de l'historique avec dates correctes
  const histH=(t.hist||[]).filter(d=>d&&d!=='undefined'&&d!=='null'&&String(d).trim()!=='').length
    ? (t.hist||[]).filter(d=>d&&d!=='undefined'&&d!=='null'&&String(d).trim()!=='')
var(--text3)">Aucune intervention</div>';
  document.getElementById('dp-b').innerHTML=`<div class="dp-section"><div class="dp-section-title">Informations</div>${info.map(([k,v])=>`<div class="dp-row"><span class="dp-key">${k}</span><span class="dp-val">${v}</span></div>`).join('')}</div>${t.note?`<div class="dp-section"><div class="dp-section-title">Remarques</div><div style="font-size:13px;color:var(--text2);line-height:1.6">${esc(t.note)}</div></div>`:''}<div class="dp-section"><div class="dp-section-title">Historique</div>${histH}</div>`;
  document.getElementById('dp-f').innerHTML=isAdmin()?`<button class="btn btn-s" style="flex:1" onclick="openTaskModal(${si});closeDp()">✏ Modifier</button><button class="btn btn-d" style="flex:1" onclick="delTask(${si})">🗑 Supprimer</button>`:'';
  document.getElementById('dpOverlay').classList.add('open');
  document.getElementById('dpPanel').classList.add('open');
}
function closeDp() { document.getElementById('dpOverlay').classList.remove('open'); document.getElementById('dpPanel').classList.remove('open'); }

// ── TASK MODAL ───────────────────────────────────────────
return;}
taskModalTitle').textContent=t?`Modifier : ${t.comp}`:'Nouvelle tâche';
  document.getElementById('fComp').value=t?t.comp:''; document.getElementById('fCrit').value=t?t.crit:1;
  document.getElementById('fType').value=t?t.type:'Huile'; document.getElementById('fProd').value=t?t.prod:'';
  document.getElementById('fQty').value=t?t.qty||'':''; document.getElementById('fFreq').value=t?t.freq:'Trimestrielle';
  document.getElementById('fDate').value=t?t.date:today(); document.getElementById('fDur').value=t?t.dur||'':'';
  document.getElementById('fLoc').value=t?t.loc||'':''; document.getElementById('fNote').value=t?t.note||'':'';
  document.getElementById('fTech').innerHTML='<option value="">— Non assigné —</option>'+getTechOptions(t?t.techId:null);
  updProdLbl(); document.getElementById('taskModal').classList.add('open');
  setTimeout(()=>document.getElementById('fComp').focus(),100);
}
function closeTaskModal() { document.getElementById('taskModal').classList.remove('open'); }
function updProdLbl() {
  const v=document.getElementById('fType')?.value; if(!v)return;
  document.getElementById('prodLbl').textContent=v==='Huile'?'Référence huile *':'Référence graisse *';
  document.getElementById('fProd').placeholder=v==='Huile'?'ex: Shell Omala S2 GX 220':'ex: SKF LGMT 3';
}
function saveTask() {
  const comp=document.getElementById('fComp').value.trim(), date=document.getElementById('fDate').value;
editTaskIdx].id:nextTaskId(),comp,prod:document.getElementById('fProd').value.trim(),crit:+document.getElementById('fCrit').value,type:document.getElementById('fType').value,qty:document.getElementById('fQty').value.trim(),freq:document.getElementById('fFreq').value,date,techId:+document.getElementById('fTech').value||null,dur:document.getElementById('fDur').value.trim(),loc:document.getElementById('fLoc').value.trim(),note:document.getElementById('fNote').value.trim(),done:editTaskIdx>=0?tasks[editTaskIdx].done:false,hist:editTaskIdx>=0?tasks[editTaskIdx].hist:[]};
─────────────
userModalTitle').textContent=u?`Modifier : ${u.name}`:'Nouvel utilisateur';
  document.getElementById('uName').value=u?u.name:''; document.getElementById('uLogin').value=u?u.login:'';
  document.getElementById('uRole').value=u?u.role:'tech'; document.getElementById('uSpec').value=u?u.spec||'':'';
  document.getElementById('uPwd').value=''; document.getElementById('uPwd2').value='';
  document.getElementById('pwdLbl').textContent=u?'Nouveau mot de passe (laisser vide = inchangé)':'Mot de passe *';
  document.getElementById('uPwd2Row').style.display=u?'none':'block';
  document.getElementById('userModal').classList.add('open');
  setTimeout(()=>document.getElementById('uName').focus(),100);
}
function closeUserModal() { document.getElementById('userModal').classList.remove('open'); }
function saveUser() {
  const name=document.getElementById('uName').value.trim(), login=document.getElementById('uLogin').value.trim();
  const role=document.getElementById('uRole').value, spec=document.getElementById('uSpec').value.trim();
  const pwd=document.getElementById('uPwd').value, pwd2=document.getElementById('uPwd2').value;
=login&&i!==editUserIdx)){toast('Identifiant déjà utilisé','err');return;}
  if(editUserIdx<0&&!pwd){toast('Mot de passe requis','err');return;}
  if(editUserIdx<0&&pwd!==pwd2){toast('Les mots de passe ne correspondent pas','err');return;}
  if(editUserIdx>=0){users[editUserIdx]={...users[editUserIdx],name,login,role,spec};if(pwd)users[editUserIdx].pwd=pwd;}
  else users.push({id:nextUserId(),name,login,role,spec,pwd,active:true});
  saveUsers(); closeUserModal(); toast(editUserIdx>=0?'Utilisateur modifié ✓':'Utilisateur créé ✓'); render();
active=!users[i].active;saveUsers();toast(users[i].active?'Activé':'Désactivé','warn');render();}
`Supprimer <strong>${esc(users[i].name)}</strong> ?`,()=>{users.splice(i,1);saveUsers();toast('Supprimé','warn');render();});}

// ── ACTIONS ──────────────────────────────────────────────
function toggleDone(si, el) {
  const t = tasks[si];
  if (!isAdmin() && t.techId !== currentUser.id) {
    el.checked = t.done;
    toast('Vous ne pouvez cocher que vos tâches','err');
    return;
  }
  t.done = el.checked;
  if (el.checked) {
    // FIX: Enregistrer la date exacte du jour du cochage (format ISO yyyy-mm-dd)
    const dateAujourd = today();
    t.hist.push(dateAujourd);
    toast(`✓ Tâche marquée effectuée le ${fmtD(dateAujourd)}`);
  } else {
    toast('Tâche réouverte','warn');
  }
  saveTasks();
  render();
}

function delTask(si){closeDp();showCf('Supprimer la tâche',`Supprimer <strong>${esc(tasks[si].comp)}</strong> ?`,()=>{tasks.splice(si,1);saveTasks();toast('Supprimée','warn');render();});}
function resetDone(){showCf('Nouvelle période','Remettre toutes les tâches en Planifié ?',()=>{tasks.forEach(t=>t.done=false);saveTasks();toast('Période réinitialisée');render();});}

// ── EXPORT CSV ───────────────────────────────────────────
function q(s){return'"'+String(s||'').replace(/"/g,'""')+'"';}
function exportCSV(){
  const h=['ID','Composant','Criticité','Type','Produit','Quantité','Fréquence','Technicien','Échéance','Localisation','Durée','Remarques','Effectué','Historique'];
  const rows=tasks.map(t=>[t.id,q(t.comp),t.crit,t.type,q(t.prod),q(t.qty||''),t.freq,q(getTechName(t.techId)),t.date,q(t.loc||''),q(t.dur||''),q(t.note||''),t.done?'Oui':'Non',(t.hist||[]).filter(d=>d&&d!=='undefined').join(';')]);
  const csv=[h,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  a.download=`lubriplan_${today()}.csv`;a.click();toast('Export CSV téléchargé');
}

// ── EXPORT EXCEL GLOBAL ──────────────────────────────────
function exportXLSX() {
  if (typeof XLSX === 'undefined') { toast('Bibliothèque Excel non chargée', 'err'); return; }
  const wb = XLSX.utils.book_new();
  const header = ['ID','Composant','Criticité','Type','Produit','Quantité','Fréquence','Technicien','Échéance','Localisation','Durée','Remarques','Effectué','Historique'];
  const rows = tasks.map(t => [
    t.id, t.comp, cLabel(t.crit), t.type, t.prod, t.qty||'', t.freq,
    getTechName(t.techId), fmtD(t.date), t.loc||'', t.dur||'', t.note||'',
    t.done?'Oui':'Non',
    // FIX: Filtrer les dates invalides dans l'export
    (t.hist||[]).filter(d=>d&&d!=='undefined'&&d!=='null').map(fmtD).filter(d=>d!=='—').join(' | ')
header, ...rows]);
  ws['!cols'] = [5,25,12,10,25,10,14,18,12,20,10,30,10,20].map(w=>({wch:w}));
wb, ws, 'Tâches');
  XLSX.writeFile(wb, `LubriPlan_Export_${today()}.xlsx`);
─────
.toLowerCase();
array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
      if(rows.length<2){toast('Fichier vide ou invalide','err');return;}
h).toLowerCase().trim());
null||c===undefined))return;
includes(k));if(idx>=0&&row[idx]!==undefined&&row[idx]!=='')return String(row[idx]).trim();}return'';};
        const parseDate=(val)=>{if(!val)return today();if(typeof val==='number'){const d=new Date(Math.round((val-25569)*86400*1000));return d.toISOString().split('T')[0];}const s=String(val).trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const[dd,mm,yyyy]=s.split('/');return`${yyyy}-${mm}-${dd}`;}if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;return today();};
        const comp=get(['composant','équipement','equipement','component','nom','machine']);
        if(!comp)return;
        const crit=Math.min(4,Math.max(1,parseInt(get(['criticité','criticite','crit','priorité','priorite']))||3));
includes('graisse')?'Graisse':'Huile';
        const freqRaw=get(['fréquence','frequence','freq']); const freqMap={'hebdo':'Hebdomadaire','mensuel':'Mensuelle','bimest':'Bimestrielle','trimest':'Trimestrielle','semest':'Semestrielle','annuel':'Annuelle'};
freqRaw.toLowerCase().includes(k)){freq=v;break;}}
        const date=parseDate(get(['échéance','echeance','date','prochaine']));
        const doneRaw=get(['effectué','effectue','fait','done','statut']); const done=['oui','yes','1','true','effectué','effectue'].includes(doneRaw.toLowerCase());
        tasks.push({id:nextTaskId(),comp,crit,type,prod:get(['produit','référence','reference','réf','ref','lubrifiant','huile']),qty:get(['quantité','quantite','qté','qte','qty']),freq,date,techId:null,dur:get(['durée','duree','dur','temps']),loc:get(['localisation','local','emplacement','zone','lieu']),note:get(['remarque','note','commentaire','observation']),done,hist:done?[date]:[]});
;
\n').slice(1).filter(l=>l.trim()); let count=0;
replace(/^"|"$/g,'').replace(/""/g,'"'));
      if(cols.length<9)return;
      tasks.push({id:nextTaskId(),comp:cols[1],crit:+cols[2]||1,type:cols[3]||'Huile',prod:cols[4],qty:cols[5],freq:cols[6],techId:null,date:cols[8],loc:cols[9]||'',dur:cols[10]||'',note:cols[11]||'',done:cols[12]==='Oui',hist:(cols[13]||'').split(';').filter(d=>d&&d!=='undefined')});

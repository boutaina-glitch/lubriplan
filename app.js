// LubriPlan — app.js
// ✅ Filtre par machine (localisation)
// ✅ Export Excel (.xlsx) et CSV
// ✅ Import Excel (.xlsx) et CSV
// ✅ Téléchargement planning par machine
// ✅ Recherche fonctionnelle
// ✅ localStorage : toutes les modifications sauvegardées

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

// ── DONNÉES PAR DÉFAUT ──────────────────────────────────
function defaultUsers() {
  return [
    { id:1, name:'Administrateur', login:'admin',    pwd:'admin123', role:'admin', spec:'Gestion',    active:true },
    { id:2, name:'Laawam.b',       login:'laawam.b', pwd:'tech1234', role:'tech',  spec:'Graisseur',  active:true }
  ];
}

function defaultTasks() {
  const T = 2; // techId Laawam.b
  return [
    // ── FFG 924 ──────────────────────────────────────────────────────────────
    { id:1,  comp:'FFG 924', crit:1, type:'Huile',   prod:'',  qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-15', loc:'Atelier FFG',       dur:'45 min', note:'Vidange boîte de vitesses principale — vérifier niveau avant démarrage.', done:false, hist:[] },
    { id:2,  comp:'FFG 924', crit:1, type:'Graisse', prod:'',  qty:'',      freq:'Hebdomadaire',  techId:T, date:'2026-01-05', loc:'Atelier FFG',       dur:'20 min', note:'Graissage roulements arbres impression + encrage.', done:false, hist:[] },
    { id:3,  comp:'FFG 924', crit:2, type:'Huile',   prod:'',  qty:'',      freq:'Trimestrielle', techId:T, date:'2026-01-15', loc:'Atelier FFG',       dur:'30 min', note:'Vidange réducteur section découpe.', done:false, hist:[] },
    { id:4,  comp:'FFG 924', crit:2, type:'Graisse', prod:'',  qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-15', loc:'Atelier FFG',       dur:'20 min', note:'Graissage chaînes transmission et galets guidage.', done:false, hist:[] },

    // ── DRO HQP ──────────────────────────────────────────────────────────────
    { id:5,  comp:'DRO HQP', crit:1, type:'Huile',   prod:'',  qty:'',      freq:'Trimestrielle', techId:T, date:'2026-02-01', loc:'Zone DRO',          dur:'1h',     note:'Vidange complète huile hydraulique — remplacer filtre retour.', done:false, hist:[] },
    { id:6,  comp:'DRO HQP', crit:2, type:'Graisse', prod:'',  qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-20', loc:'Zone DRO',          dur:'25 min', note:'Graissage roulements rouleaux transport.', done:false, hist:[] },
    { id:7,  comp:'DRO HQP', crit:2, type:'Huile',   prod:'',  qty:'',      freq:'Semestrielle',  techId:T, date:'2026-03-01', loc:'Zone DRO',          dur:'45 min', note:'Vidange réducteur entraînement principal.', done:false, hist:[] },

    // ── DRO 1 ────────────────────────────────────────────────────────────────
    { id:8,  comp:'DRO 1',   crit:1, type:'Huile',   prod:'',  qty:'',      freq:'Trimestrielle', techId:T, date:'2026-02-10', loc:'Zone DRO',          dur:'1h',     note:'Vidange huile hydraulique centrale — contrôler pression circuit.', done:false, hist:[] },
    { id:9,  comp:'DRO 1',   crit:2, type:'Graisse', prod:'',  qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-25', loc:'Zone DRO',          dur:'20 min', note:'Graissage roulements cylindres presseurs.', done:false, hist:[] },
    { id:10, comp:'DRO 1',   crit:3, type:'Graisse', prod:'',  qty:'',      freq:'Trimestrielle', techId:T, date:'2026-02-10', loc:'Zone DRO',          dur:'20 min', note:'Graissage guidages linéaires table de réception.', done:false, hist:[] },

    // ── ONDULEUSE ────────────────────────────────────────────────────────────
    { id:11, comp:'ONDULEUSE', crit:1, type:'Huile',   prod:'',qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-10', loc:'Salle onduleuse',   dur:'1h30',   note:'Vidange huile réducteurs rouleaux cannelés — CRITIQUE: ne pas démarrer sans vérification.', done:false, hist:[] },
    { id:12, comp:'ONDULEUSE', crit:1, type:'Graisse', prod:'',qty:'',      freq:'Hebdomadaire',  techId:T, date:'2026-01-05', loc:'Salle onduleuse',   dur:'30 min', note:'Graissage roulements rouleaux cannelés haut et bas.', done:false, hist:[] },
    { id:13, comp:'ONDULEUSE', crit:1, type:'Huile',   prod:'',qty:'',      freq:'Trimestrielle', techId:T, date:'2026-03-01', loc:'Salle onduleuse',   dur:'1h',     note:'Vidange boîte vitesses entraînement principal.', done:false, hist:[] },
    { id:14, comp:'ONDULEUSE', crit:2, type:'Graisse', prod:'',qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-10', loc:'Salle onduleuse',   dur:'30 min', note:'Graissage chaînes, tendeurs et pignons de transmission.', done:false, hist:[] },
    { id:15, comp:'ONDULEUSE', crit:2, type:'Huile',   prod:'',qty:'',      freq:'Semestrielle',  techId:T, date:'2026-06-01', loc:'Salle onduleuse',   dur:'45 min', note:'Vidange réducteur table chauffante.', done:false, hist:[] },

    // ── MARTIN 1224 ──────────────────────────────────────────────────────────
    { id:16, comp:'MARTIN 1224', crit:1, type:'Huile',   prod:'',qty:'',   freq:'Mensuelle',     techId:T, date:'2026-01-20', loc:'Atelier Martin',    dur:'1h',     note:'Vidange huile boîte de vitesses — contrôler niveau huile lubrification automatique.', done:false, hist:[] },
    { id:17, comp:'MARTIN 1224', crit:1, type:'Graisse', prod:'',qty:'',   freq:'Hebdomadaire',  techId:T, date:'2026-01-06', loc:'Atelier Martin',    dur:'25 min', note:'Graissage roulements arbres impression 4 couleurs.', done:false, hist:[] },
    { id:18, comp:'MARTIN 1224', crit:2, type:'Huile',   prod:'',qty:'',   freq:'Trimestrielle', techId:T, date:'2026-03-15', loc:'Atelier Martin',    dur:'45 min', note:'Vidange réducteur section découpe rotative.', done:false, hist:[] },
    { id:19, comp:'MARTIN 1224', crit:2, type:'Graisse', prod:'',qty:'',   freq:'Mensuelle',     techId:T, date:'2026-01-20', loc:'Atelier Martin',    dur:'25 min', note:'Graissage chaînes et pignons transmission générale.', done:false, hist:[] },
    { id:20, comp:'MARTIN 1224', crit:3, type:'Graisse', prod:'',qty:'',   freq:'Trimestrielle', techId:T, date:'2026-02-20', loc:'Atelier Martin',    dur:'20 min', note:'Graissage guidages barres de liasse et table de sortie.', done:false, hist:[] },

    // ── MARTIN 924 ───────────────────────────────────────────────────────────
    { id:21, comp:'MARTIN 924', crit:1, type:'Huile',   prod:'',qty:'',    freq:'Mensuelle',     techId:T, date:'2026-01-22', loc:'Atelier Martin',    dur:'50 min', note:'Vidange huile boîte de vitesses principale.', done:false, hist:[] },
    { id:22, comp:'MARTIN 924', crit:1, type:'Graisse', prod:'',qty:'',    freq:'Hebdomadaire',  techId:T, date:'2026-01-06', loc:'Atelier Martin',    dur:'20 min', note:'Graissage roulements arbres impression.', done:false, hist:[] },
    { id:23, comp:'MARTIN 924', crit:2, type:'Huile',   prod:'',qty:'',    freq:'Trimestrielle', techId:T, date:'2026-03-22', loc:'Atelier Martin',    dur:'40 min', note:'Vidange réducteur section découpe.', done:false, hist:[] },
    { id:24, comp:'MARTIN 924', crit:2, type:'Graisse', prod:'',qty:'',    freq:'Mensuelle',     techId:T, date:'2026-01-22', loc:'Atelier Martin',    dur:'20 min', note:'Graissage chaînes et pignons.', done:false, hist:[] },

    // ── 1224 IMPRIMANTE ──────────────────────────────────────────────────────
    { id:25, comp:'1224 IMPRIMANTE', crit:1, type:'Huile',   prod:'',qty:'', freq:'Mensuelle',   techId:T, date:'2026-01-18', loc:'Zone impression',   dur:'45 min', note:'Vidange huile centrale lubrification — vérifier filtres.', done:false, hist:[] },
    { id:26, comp:'1224 IMPRIMANTE', crit:1, type:'Graisse', prod:'',qty:'', freq:'Hebdomadaire',techId:T, date:'2026-01-05', loc:'Zone impression',   dur:'20 min', note:'Graissage roulements cylindres impression et contre-pression.', done:false, hist:[] },
    { id:27, comp:'1224 IMPRIMANTE', crit:2, type:'Graisse', prod:'',qty:'', freq:'Mensuelle',   techId:T, date:'2026-01-18', loc:'Zone impression',   dur:'20 min', note:'Graissage chaînes encrage et transmission teinte.', done:false, hist:[] },
    { id:28, comp:'1224 IMPRIMANTE', crit:3, type:'Huile',   prod:'',qty:'', freq:'Semestrielle',techId:T, date:'2026-06-15', loc:'Zone impression',   dur:'30 min', note:'Vidange réducteur groupe encrage.', done:false, hist:[] },

    // ── KLETT ────────────────────────────────────────────────────────────────
    { id:29, comp:'KLETT', crit:1, type:'Huile',   prod:'',qty:'',          freq:'Trimestrielle', techId:T, date:'2026-02-05', loc:'Zone collage',      dur:'45 min', note:'Vidange réducteur principal entraînement — contrôler étanchéité joints.', done:false, hist:[] },
    { id:30, comp:'KLETT', crit:2, type:'Graisse', prod:'',qty:'',          freq:'Mensuelle',     techId:T, date:'2026-01-12', loc:'Zone collage',      dur:'20 min', note:'Graissage roulements arbres encolleuse.', done:false, hist:[] },
    { id:31, comp:'KLETT', crit:3, type:'Graisse', prod:'',qty:'',          freq:'Trimestrielle', techId:T, date:'2026-02-05', loc:'Zone collage',      dur:'15 min', note:'Graissage guidages table pliage.', done:false, hist:[] },

    // ── MINILINE ─────────────────────────────────────────────────────────────
    { id:32, comp:'MINILINE', crit:2, type:'Huile',   prod:'',qty:'',       freq:'Trimestrielle', techId:T, date:'2026-02-15', loc:'Ligne mini',        dur:'30 min', note:'Vidange réducteur entraînement bande.', done:false, hist:[] },
    { id:33, comp:'MINILINE', crit:2, type:'Graisse', prod:'',qty:'',       freq:'Mensuelle',     techId:T, date:'2026-01-15', loc:'Ligne mini',        dur:'15 min', note:'Graissage roulements rouleaux convoyeur.', done:false, hist:[] },
    { id:34, comp:'MINILINE', crit:3, type:'Graisse', prod:'',qty:'',       freq:'Trimestrielle', techId:T, date:'2026-02-15', loc:'Ligne mini',        dur:'15 min', note:'Graissage chaînes et guidages latéraux.', done:false, hist:[] },

    // ── LANGSTONE ────────────────────────────────────────────────────────────
    { id:35, comp:'LANGSTONE', crit:1, type:'Huile',   prod:'',qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-25', loc:'Atelier Langstone', dur:'1h',     note:'Vidange huile boîte de vitesses + vérification niveau huile hydraulique.', done:false, hist:[] },
    { id:36, comp:'LANGSTONE', crit:1, type:'Graisse', prod:'',qty:'',      freq:'Hebdomadaire',  techId:T, date:'2026-01-05', loc:'Atelier Langstone', dur:'25 min', note:'Graissage roulements rouleaux cannelés et rouleaux de chauffage.', done:false, hist:[] },
    { id:37, comp:'LANGSTONE', crit:2, type:'Huile',   prod:'',qty:'',      freq:'Semestrielle',  techId:T, date:'2026-06-01', loc:'Atelier Langstone', dur:'45 min', note:'Vidange réducteur table de coupe transversale.', done:false, hist:[] },
    { id:38, comp:'LANGSTONE', crit:2, type:'Graisse', prod:'',qty:'',      freq:'Mensuelle',     techId:T, date:'2026-01-25', loc:'Atelier Langstone', dur:'25 min', note:'Graissage chaînes transmission et tendeurs.', done:false, hist:[] },

    // ── BOBST LILA ───────────────────────────────────────────────────────────
    { id:39, comp:'BOBST LILA', crit:1, type:'Huile',   prod:'',qty:'',     freq:'Trimestrielle', techId:T, date:'2026-03-01', loc:'Zone Bobst',        dur:'1h30',   note:'Vidange huile centrale lubrification — CRITIQUE: respecter préconisations Bobst.', done:false, hist:[] },
    { id:40, comp:'BOBST LILA', crit:1, type:'Graisse', prod:'',qty:'',     freq:'Mensuelle',     techId:T, date:'2026-01-08', loc:'Zone Bobst',        dur:'30 min', note:'Graissage roulements platine et mécanisme de frappe.', done:false, hist:[] },
    { id:41, comp:'BOBST LILA', crit:2, type:'Huile',   prod:'',qty:'',     freq:'Semestrielle',  techId:T, date:'2026-06-01', loc:'Zone Bobst',        dur:'1h',     note:'Vidange réducteur principal alimentation feuilles.', done:false, hist:[] },
    { id:42, comp:'BOBST LILA', crit:2, type:'Graisse', prod:'',qty:'',     freq:'Mensuelle',     techId:T, date:'2026-01-08', loc:'Zone Bobst',        dur:'20 min', note:'Graissage guidages colonnes platine.', done:false, hist:[] },
    { id:43, comp:'BOBST LILA', crit:3, type:'Graisse', prod:'',qty:'',     freq:'Trimestrielle', techId:T, date:'2026-03-01', loc:'Zone Bobst',        dur:'20 min', note:'Graissage chaînes convoyeur réception.', done:false, hist:[] },

    // ── PICEUSE GAZELLA ──────────────────────────────────────────────────────
    { id:44, comp:'PICEUSE GAZELLA', crit:2, type:'Huile',   prod:'',qty:'',freq:'Trimestrielle', techId:T, date:'2026-02-20', loc:'Zone piquage',      dur:'45 min', note:'Vidange réducteur entraînement tête de piquage.', done:false, hist:[] },
    { id:45, comp:'PICEUSE GAZELLA', crit:2, type:'Graisse', prod:'',qty:'',freq:'Mensuelle',     techId:T, date:'2026-01-20', loc:'Zone piquage',      dur:'20 min', note:'Graissage roulements arbres piquage et pliage.', done:false, hist:[] },
    { id:46, comp:'PICEUSE GAZELLA', crit:3, type:'Graisse', prod:'',qty:'',freq:'Trimestrielle', techId:T, date:'2026-02-20', loc:'Zone piquage',      dur:'15 min', note:'Graissage chaînes convoyeur alimentation.', done:false, hist:[] },

    // ── BOBST VISION ────────────────────────────────────────────────────────
    { id:47, comp:'BOBST VISION', crit:1, type:'Huile',   prod:'',qty:'',   freq:'Trimestrielle', techId:T, date:'2026-03-10', loc:'Zone Bobst',        dur:'1h30',   note:'Vidange huile centrale lubrification — CRITIQUE: respecter préconisations Bobst Vision.', done:false, hist:[] },
    { id:48, comp:'BOBST VISION', crit:1, type:'Graisse', prod:'',qty:'',   freq:'Mensuelle',     techId:T, date:'2026-01-10', loc:'Zone Bobst',        dur:'30 min', note:'Graissage roulements platine, mécanisme refoulage et alimentation.', done:false, hist:[] },
    { id:49, comp:'BOBST VISION', crit:2, type:'Huile',   prod:'',qty:'',   freq:'Semestrielle',  techId:T, date:'2026-06-10', loc:'Zone Bobst',        dur:'1h',     note:'Vidange réducteur principal + vérification circuit hydraulique.', done:false, hist:[] },
    { id:50, comp:'BOBST VISION', crit:2, type:'Graisse', prod:'',qty:'',   freq:'Mensuelle',     techId:T, date:'2026-01-10', loc:'Zone Bobst',        dur:'25 min', note:'Graissage guidages colonnes et glissières platine.', done:false, hist:[] },
    { id:51, comp:'BOBST VISION', crit:3, type:'Graisse', prod:'',qty:'',   freq:'Trimestrielle', techId:T, date:'2026-03-10', loc:'Zone Bobst',        dur:'15 min', note:'Graissage chaînes convoyeur sortie et réception boîtes.', done:false, hist:[] },
  ];
}

// ── SAUVEGARDE localStorage ─────────────────────────────
function loadData() {
  try {
    const savedUsers = localStorage.getItem(LS_USERS);
    const savedTasks = localStorage.getItem(LS_TASKS);
    users = savedUsers ? JSON.parse(savedUsers) : defaultUsers();
    tasks = savedTasks ? JSON.parse(savedTasks) : defaultTasks();
  } catch(e) {
    users = defaultUsers();
    tasks = defaultTasks();
  }
}

function saveUsers() {
  try { localStorage.setItem(LS_USERS, JSON.stringify(users)); } catch(e) {}
}

function saveTasks() {
  try { localStorage.setItem(LS_TASKS, JSON.stringify(tasks)); } catch(e) {}
}

function resetAllData() {
  showCf('Réinitialiser toutes les données', 'Supprimer toutes les tâches et revenir aux données par défaut ?', () => {
    localStorage.removeItem(LS_TASKS);
    localStorage.removeItem(LS_USERS);
    loadData();
    toast('Données réinitialisées');
    render();
  });
}

const nextTaskId = () => tasks.reduce((m,t) => Math.max(m,t.id), 0) + 1;
const nextUserId = () => users.reduce((m,u) => Math.max(m,u.id), 0) + 1;

// ── LISTE DES MACHINES (unique, triée) — basée sur t.loc ─
function getMachineList() {
  return [...new Set(tasks.map(t => t.loc).filter(Boolean))].sort();
}

// ── AUTH ────────────────────────────────────────────────
function doLogin() {
  const loginVal = document.getElementById('loginUser').value.trim();
  const pwd      = document.getElementById('loginPwd').value;
  const errEl    = document.getElementById('loginErr');
  errEl.textContent = '';
  if (!loginVal || !pwd) { errEl.textContent = 'Veuillez remplir tous les champs.'; return; }
  const u = users.find(x => x.login === loginVal && x.active);
  if (!u || u.pwd !== pwd) {
    errEl.textContent = '❌ Identifiant ou mot de passe incorrect.';
    document.getElementById('loginPwd').value = '';
    document.getElementById('loginPwd').focus();
    return;
  }
  currentUser = u;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('userAv').textContent   = initials(currentUser.name);
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Admin' : 'Technicien';
  switchView('liste');
}

function doLogout() {
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPwd').value  = '';
  document.getElementById('loginErr').textContent = '';
}

const isAdmin = () => currentUser && currentUser.role === 'admin';

// ── NAVIGATION ───────────────────────────────────────────
function switchView(v) {
  currentView = v; closeDp();
  ['liste','planning','techniciens','historique','utilisateurs'].forEach(id => {
    const el = document.getElementById('nav_'+id);
    if (el) el.classList.toggle('active', id === v);
  });
  const titles = { liste:'Planning des tâches', planning:'Planning annuel', techniciens:'Vue par technicien', historique:'Historique des interventions', utilisateurs:'Gestion des utilisateurs' };
  const subs   = { liste:'Triées par criticité', planning:'Calendrier mensuel', techniciens:'Charge de travail', historique:'Interventions effectuées', utilisateurs:'Comptes et rôles' };
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
}

// ── HELPERS ──────────────────────────────────────────────
function fmtD(d)  { if (!d) return '—'; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
function today()  { return new Date().toISOString().split('T')[0]; }
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

// ── GET FILTERED (filtre machine basé sur t.loc) ─────────
function getFiltered() {
  const fc  = document.getElementById('fltCrit')?.value || '';
  const ft  = document.getElementById('fltType')?.value || '';
  const fth = document.getElementById('fltTech')?.value || '';
  const fs  = document.getElementById('fltStat')?.value || '';
  const fm  = document.getElementById('fltMach')?.value || '';
  const q   = (document.getElementById('srch')?.value || '').toLowerCase().trim();
  let list  = isAdmin() ? tasks : tasks.filter(t => t.techId === currentUser.id);
  return list.filter(t => {
    const s = getStatus(t);
    // Filtre machine (localisation)
    if (fm && t.loc !== fm) return false;
    // Filtre criticité
    if (fc && t.crit != fc) return false;
    // Filtre type
    if (ft && t.type !== ft) return false;
    // Filtre technicien
    if (fth && t.techId != fth) return false;
    // Filtre statut
    if (fs && s !== fs) return false;
    // Recherche texte
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

function srt(col) { if (sortCol===col) sortAsc=!sortAsc; else { sortCol=col; sortAsc=true; } render(); }

// ── LIST VIEW ────────────────────────────────────────────
function buildListView() {
  const s=getStats(), all=getFiltered(), techs=users.filter(u=>u.role==='tech'&&u.active);
  const machines=getMachineList();

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

  const techFilter=isAdmin()?`<select id="fltTech" onchange="render()"><option value="">Tous techniciens</option>${techs.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select>`:'';

  // Filtre machine basé sur la localisation (t.loc)
  const machineFilter=`<select id="fltMach" onchange="render()" style="max-width:200px"><option value="">Toutes machines</option>${machines.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}</select>`;

  const ctrlHTML=`<div class="ctrl-bar">
    <div class="search-wrap"><span class="search-icon">🔍</span><input type="text" id="srch" placeholder="Rechercher..." oninput="render()"/></div>
    ${machineFilter}
    <select id="fltCrit" onchange="render()"><option value="">Toutes criticités</option><option value="1">🔴 Critique</option><option value="2">🟠 Haute</option><option value="3">🟡 Moyenne</option><option value="4">🟢 Faible</option></select>
    <select id="fltType" onchange="render()"><option value="">Tous types</option><option value="Huile">Huile</option><option value="Graisse">Graisse</option></select>
    ${techFilter}
    <select id="fltStat" onchange="render()"><option value="">Tous statuts</option><option value="late">En retard</option><option value="soon">Bientôt</option><option value="pending">Planifié</option><option value="done">Effectué</option></select>
    ${adminBtns}
  </div>`;

  const th=(k,l)=>`<th class="${sortCol===k?'sorted':''}" onclick="srt('${k}')">${l}${sortCol===k?' '+(sortAsc?'↑':'↓'):''}</th>`;
  const theadHTML=`${th('comp','Composant')} ${th('crit','Criticité')} ${th('type','Type')} ${th('prod','Produit')} ${th('freq','Fréquence')} ${isAdmin()?th('techId','Technicien'):''} ${th('date','Échéance')} <th>Statut</th> <th style="text-align:center">Fait</th> ${isAdmin()?'<th></th>':''}`;
  const rows=all.length?all.map(t=>{
    const si=tasks.indexOf(t), s=getStatus(t), canCheck=isAdmin()||t.techId===currentUser.id;
    return`<tr style="cursor:pointer" onclick="openDp(${si})">
      <td onclick="event.stopPropagation()"><div class="comp-name">${esc(t.comp)}</div>${t.loc?`<div class="comp-loc">📍 ${esc(t.loc)}</div>`:''}</td>
      <td><span class="badge ${cClass(t.crit)}">${t.crit} — ${cLabel(t.crit)}</span></td>
      <td><span class="badge ${tClass(t.type)}">${t.type}</span></td>
      <td><div style="font-size:12px;font-weight:500">${esc(t.prod)}</div><div style="font-size:11px;color:var(--text3)">${esc(t.qty||'')}</div></td>
      <td style="font-size:12px">${t.freq}</td>
      ${isAdmin()?`<td style="font-size:12px">${esc(getTechName(t.techId))}</td>`:''}
      <td style="font-size:12px;font-family:var(--mono)">${fmtD(t.date)}</td>
      <td><span class="badge ${sClass(s)}">${sLabel(s)}</span></td>
      <td class="chk-wrap" onclick="event.stopPropagation()"><input type="checkbox" ${t.done?'checked':''} ${canCheck?'':'disabled'} onchange="toggleDone(${si},this)"/></td>
      ${isAdmin()?`<td onclick="event.stopPropagation()"><div style="display:flex;gap:4px"><button class="btn-icon" onclick="openTaskModal(${si})">✏</button><button class="btn-icon" onclick="delTask(${si})" style="color:var(--red)">🗑</button></div></td>`:''}
    </tr>`;
  }).join(''):`<tr><td colspan="10"><div class="empty"><div class="empty-icon">🔍</div><p>Aucune tâche trouvée</p></div></td></tr>`;
  return statsHTML+ctrlHTML+`<div class="tbl-wrap"><table><thead><tr>${theadHTML}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ── CALENDAR VIEW ────────────────────────────────────────
function buildCalView() {
  const machines = getMachineList(); // basé sur t.loc

  // Sélecteur machine pour le planning (valeurs = t.loc)
  const machSelect = `<select id="calMachFilter" onchange="calFilterMachine=this.value;render()" style="font-family:var(--font);font-size:13px;padding:6px 12px;border:1px solid var(--border2);border-radius:var(--r);background:var(--surface);color:var(--text);outline:none;height:34px">
    <option value="">Toutes les machines</option>
    ${machines.map(m=>`<option value="${esc(m)}"${calFilterMachine===m?' selected':''}>${esc(m)}</option>`).join('')}
  </select>`;

  const dlBtn = calFilterMachine
    ? `<button class="btn btn-s btn-sm" onclick="downloadMachinePlanning('${esc(calFilterMachine).replace(/'/g,"\\'")}')">📥 Télécharger planning machine</button>`
    : `<button class="btn btn-s btn-sm" onclick="downloadAllPlannings()">📥 Télécharger tout (Excel)</button>`;

  const header=`<div class="cal-header">
    <div class="year-nav">
      <button onclick="calYear--;render()">◀ Précédent</button>
      <span class="year-label">${calYear}</span>
      <button onclick="calYear++;render()">Suivant ▶</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      ${machSelect}
      ${dlBtn}
    </div>
    <div class="cal-legend">
      <span><span class="leg-dot" style="background:#185FA5"></span>Planifié</span>
      <span><span class="leg-dot" style="background:var(--green)"></span>Effectué</span>
      <span><span class="leg-dot" style="background:var(--red)"></span>En retard</span>
    </div>
  </div>`;

  // ✅ CORRECTION : filtre par t.loc (localisation) et non t.comp
  let displayTasks = calFilterMachine
    ? tasks.filter(t => t.loc === calFilterMachine)
    : (isAdmin() ? tasks : tasks.filter(t => t.techId === currentUser.id));

  const now=new Date();
  const ths=`<th>Composant</th>${MONTHS_S.map(m=>`<th>${m}</th>`).join('')}`;
  const rows=displayTasks.map(t=>{
    const si=tasks.indexOf(t);
    const cells=Array.from({length:12},(_,mo)=>{
      if(!isInMonth(t,mo,calYear))return`<td><div style="display:flex;align-items:center;justify-content:center"><div class="cal-dot d-empty"></div></div></td>`;
      const isLate=!t.done&&new Date(calYear,mo+1,0)<now;
      const cls=t.done?'d-done':isLate?'d-late':'d-sched';
      return`<td><div style="display:flex;align-items:center;justify-content:center"><div class="cal-dot ${cls}" onclick="calClick(${si})" title="${esc(t.prod)}">${t.done?'✓':isLate?'!':''}</div></div></td>`;
    }).join('');
    return`<tr><td><div style="font-size:12px;font-weight:500"><span class="badge ${cClass(t.crit)}" style="font-size:10px;padding:1px 5px;margin-right:4px">${t.crit}</span>${esc(t.comp.substring(0,22))}${t.comp.length>22?'…':''}</div><div style="font-size:10px;color:var(--text3)">${esc(getTechName(t.techId))}</div></td>${cells}</tr>`;
  }).join('');
  return header+`<div class="cal-scroll"><table class="cal-table"><thead><tr>${ths}</tr></thead><tbody>${rows||'<tr><td colspan="13"><div class="empty"><div class="empty-icon">📅</div><p>Aucune tâche pour cette machine</p></div></td></tr>'}</tbody></table></div>`;
}

function isInMonth(t,mo,yr) {
  if(!t.date)return false; const base=new Date(t.date); if(isNaN(base))return false;
  const iv=FREQ_M[t.freq]||12;
  for(let off=0;off<120;off++){const d=new Date(base);d.setMonth(d.getMonth()+off*iv);if(d.getFullYear()===yr&&d.getMonth()===mo)return true;if(d.getFullYear()>yr)break;}
  return false;
}
function calClick(si) {
  const t=tasks[si], canCheck=isAdmin()||t.techId===currentUser.id;
  if(!canCheck){toast('Vous ne pouvez cocher que vos propres tâches','err');return;}
  showCf('Confirmer intervention',`Marquer <strong>${esc(t.comp)}</strong> comme effectué ?`,()=>{
    tasks[si].done=true; tasks[si].hist.push(today()); saveTasks(); toast('Tâche marquée effectuée'); render();
  });
}

// ── TÉLÉCHARGEMENT PLANNING PAR MACHINE ─────────────────
// ✅ CORRECTION : filtre par t.loc (localisation) au lieu de t.comp
function downloadMachinePlanning(machineName) {
  const machineTasks = tasks.filter(t => t.loc === machineName);
  if (!machineTasks.length) { toast('Aucune tâche pour cette machine', 'err'); return; }

  if (typeof XLSX === 'undefined') { toast('Bibliothèque Excel non chargée', 'err'); return; }

  const wb = XLSX.utils.book_new();

  // Feuille 1 : Infos machine
  const infoRows = [
    ['PLANNING DE GRAISSAGE & VIDANGE', ''],
    ['Machine :', machineName],
    ['Exporté le :', fmtD(today())],
    ['Année :', calYear],
    [''],
    ['Technicien(s) :', [...new Set(machineTasks.map(t=>getTechName(t.techId)))].join(', ')],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Infos');

  // Feuille 2 : Tâches détaillées
  const header = ['Composant','Criticité','Type','Produit','Quantité','Fréquence','Technicien','Prochaine échéance','Localisation','Durée','Remarques','Statut'];
  const rows = machineTasks.map(t => [
    t.comp, cLabel(t.crit), t.type, t.prod, t.qty||'', t.freq,
    getTechName(t.techId), fmtD(t.date), t.loc||'', t.dur||'', t.note||'',
    sLabel(getStatus(t))
  ]);
  const wsTasks = XLSX.utils.aoa_to_sheet([header, ...rows]);
  wsTasks['!cols'] = [20,12,10,25,10,14,18,14,18,10,30,12].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Tâches');

  // Feuille 3 : Calendrier mensuel pour l'année
  const calHeader = ['Composant', ...MONTHS_F];
  const calRows = machineTasks.map(t => {
    const row = [t.comp];
    for (let mo = 0; mo < 12; mo++) {
      row.push(isInMonth(t, mo, calYear) ? (t.done ? '✓ Effectué' : 'À faire') : '');
    }
    return row;
  });
  const wsCal = XLSX.utils.aoa_to_sheet([calHeader, ...calRows]);
  wsCal['!cols'] = [{wch:25}, ...Array(12).fill({wch:12})];
  XLSX.utils.book_append_sheet(wb, wsCal, `Planning ${calYear}`);

  // Feuille 4 : Historique
  const histHeader = ['Composant','Date intervention','Produit','Technicien','Remarques'];
  const histRows = [];
  machineTasks.forEach(t => {
    (t.hist||[]).forEach(d => histRows.push([t.comp, fmtD(d), t.prod, getTechName(t.techId), t.note||'']));
  });
  if (histRows.length) {
    const wsHist = XLSX.utils.aoa_to_sheet([histHeader, ...histRows]);
    wsHist['!cols'] = [{wch:25},{wch:14},{wch:25},{wch:18},{wch:30}];
    XLSX.utils.book_append_sheet(wb, wsHist, 'Historique');
  }

  const safeName = machineName.replace(/[/\\:*?"<>|]/g,'_');
  XLSX.writeFile(wb, `LubriPlan_${safeName}_${calYear}.xlsx`);
  toast(`📊 Planning "${machineName}" téléchargé`);
}

// ✅ CORRECTION : filtre par t.loc (localisation) au lieu de t.comp
function downloadAllPlannings() {
  if (typeof XLSX === 'undefined') { toast('Bibliothèque Excel non chargée', 'err'); return; }
  const wb = XLSX.utils.book_new();

  // Une feuille par localisation/machine
  getMachineList().forEach(machineName => {
    const machineTasks = tasks.filter(t => t.loc === machineName);
    const calHeader = ['Composant', 'Type', 'Produit', 'Fréquence', 'Technicien', ...MONTHS_F, 'Statut'];
    const calRows = machineTasks.map(t => {
      const row = [t.comp, t.type, t.prod, t.freq, getTechName(t.techId)];
      for (let mo = 0; mo < 12; mo++) {
        row.push(isInMonth(t, mo, calYear) ? (t.done ? '✓' : '●') : '');
      }
      row.push(sLabel(getStatus(t)));
      return row;
    });
    const ws = XLSX.utils.aoa_to_sheet([calHeader, ...calRows]);
    ws['!cols'] = [{wch:22},{wch:10},{wch:22},{wch:14},{wch:18},...Array(12).fill({wch:6}),{wch:12}];
    const sheetName = machineName.substring(0,31).replace(/[/\\:*?"<>[\]]/g,'_');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Récapitulatif
  const recapHeader = ['Machine','Criticité','Type','Produit','Fréquence','Technicien','Prochaine échéance','Statut'];
  const recapRows = tasks.map(t => [t.comp, cLabel(t.crit), t.type, t.prod, t.freq, getTechName(t.techId), fmtD(t.date), sLabel(getStatus(t))]);
  const wsRecap = XLSX.utils.aoa_to_sheet([recapHeader, ...recapRows]);
  wsRecap['!cols'] = [{wch:25},{wch:12},{wch:10},{wch:25},{wch:14},{wch:18},{wch:14},{wch:12}];
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
  const list=isAdmin()?tasks:tasks.filter(t=>t.techId===currentUser.id);
  const all=[]; list.forEach(t=>(t.hist||[]).forEach(d=>all.push({d,t}))); all.sort((a,b)=>new Date(b.d)-new Date(a.d));
  if(!all.length)return`<div class="empty"><div class="empty-icon">🕐</div><p>Aucune intervention enregistrée</p></div>`;
  const items=all.map(({d,t})=>`<div class="hist-item"><div class="hist-date">${fmtD(d)}</div><div style="display:flex;flex-direction:column;align-items:center"><div class="hist-dot"></div></div><div class="hist-cont"><div class="hist-comp">${esc(t.comp)}</div><div class="hist-det"><span class="badge ${tClass(t.type)}" style="font-size:10px">${t.type}</span> ${esc(t.prod)} — ${esc(getTechName(t.techId))} ${t.qty?`— <strong>${esc(t.qty)}</strong>`:''}</div>${t.note?`<div style="font-size:11px;color:var(--text3);margin-top:3px;font-style:italic">${esc(t.note)}</div>`:''}</div></div>`).join('');
  return`<div class="hist-wrap">${items}</div>`;
}

// ── USER VIEW ────────────────────────────────────────────
function buildUserView() {
  if(!isAdmin())return`<div class="empty"><div class="empty-icon">🔒</div><p>Accès refusé</p></div>`;
  const cards=users.map((u,i)=>{
    const tc=tasks.filter(t=>t.techId===u.id).length, isMe=u.id===currentUser.id;
    return`<div class="user-card"><div class="user-av-lg ${u.role==='admin'?'av-admin':'av-tech'}">${initials(u.name)}</div><div class="user-info"><div class="user-fullname">${esc(u.name)} ${isMe?'<span style="font-size:10px;color:var(--text3)">(vous)</span>':''}</div><div class="user-detail">@${esc(u.login)} · ${esc(u.spec||'')}</div><div class="user-badges"><span class="badge ${u.role==='admin'?'b-admin':'b-tech'}">${u.role==='admin'?'Admin':'Technicien'}</span>${u.role==='tech'?`<span style="font-size:11px;color:var(--text3)">${tc} tâche${tc>1?'s':''}</span>`:''} ${!u.active?'<span class="badge s-late">Désactivé</span>':''}</div></div><div class="user-actions"><button class="btn-icon" onclick="openUserModal(${i})">✏</button>${!isMe?`<button class="btn-icon" onclick="toggleUserActive(${i})" style="color:${u.active?'var(--orange)':'var(--green)'}">${u.active?'⏸':'▶'}</button>`:''} ${!isMe&&u.role!=='admin'?`<button class="btn-icon" onclick="delUser(${i})" style="color:var(--red)">🗑</button>`:''}</div></div>`;
  }).join('');
  return`<div style="display:flex;justify-content:flex-end;margin-bottom:16px"><button class="btn btn-p" onclick="openUserModal()">+ Ajouter un utilisateur</button></div><div class="user-grid">${cards}</div>`;
}

// ── DETAIL PANEL ─────────────────────────────────────────
function openDp(si) {
  const t=tasks[si], s=getStatus(t);
  document.getElementById('dp-t').textContent=t.comp;
  document.getElementById('dp-s').innerHTML=`<span class="badge ${cClass(t.crit)}">${t.crit} — ${cLabel(t.crit)}</span> &nbsp; <span class="badge ${sClass(s)}">${sLabel(s)}</span>`;
  const info=[['Type',`<span class="badge ${tClass(t.type)}">${t.type}</span>`],['Référence',esc(t.prod)],['Quantité',esc(t.qty||'—')],['Fréquence',t.freq],['Technicien',esc(getTechName(t.techId))],['Échéance',fmtD(t.date)],['Durée',esc(t.dur||'—')],['Localisation',esc(t.loc||'—')]];
  const histH=(t.hist||[]).length?(t.hist||[]).map(d=>`<div class="hist-entry">✓ Effectué le ${fmtD(d)}</div>`).join(''):'<div style="font-size:12px;color:var(--text3)">Aucune intervention</div>';
  document.getElementById('dp-b').innerHTML=`<div class="dp-section"><div class="dp-section-title">Informations</div>${info.map(([k,v])=>`<div class="dp-row"><span class="dp-key">${k}</span><span class="dp-val">${v}</span></div>`).join('')}</div>${t.note?`<div class="dp-section"><div class="dp-section-title">Remarques</div><div style="font-size:13px;color:var(--text2);line-height:1.6">${esc(t.note)}</div></div>`:''}<div class="dp-section"><div class="dp-section-title">Historique</div>${histH}</div>`;
  document.getElementById('dp-f').innerHTML=isAdmin()?`<button class="btn btn-s" style="flex:1" onclick="openTaskModal(${si});closeDp()">✏ Modifier</button><button class="btn btn-d" style="flex:1" onclick="delTask(${si})">🗑 Supprimer</button>`:'';
  document.getElementById('dpOverlay').classList.add('open');
  document.getElementById('dpPanel').classList.add('open');
}
function closeDp() { document.getElementById('dpOverlay').classList.remove('open'); document.getElementById('dpPanel').classList.remove('open'); }

// ── TASK MODAL ───────────────────────────────────────────
function openTaskModal(idx=-1) {
  if(!isAdmin()){toast('Réservé aux administrateurs','err');return;}
  editTaskIdx=idx; const t=idx>=0?tasks[idx]:null;
  document.getElementById('taskModalTitle').textContent=t?`Modifier : ${t.comp}`:'Nouvelle tâche';
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
  if(!comp){toast('Nom du composant requis','err');return;} if(!date){toast('Date requise','err');return;}
  const t={id:editTaskIdx>=0?tasks[editTaskIdx].id:nextTaskId(),comp,prod:document.getElementById('fProd').value.trim(),crit:+document.getElementById('fCrit').value,type:document.getElementById('fType').value,qty:document.getElementById('fQty').value.trim(),freq:document.getElementById('fFreq').value,date,techId:+document.getElementById('fTech').value||null,dur:document.getElementById('fDur').value.trim(),loc:document.getElementById('fLoc').value.trim(),note:document.getElementById('fNote').value.trim(),done:editTaskIdx>=0?tasks[editTaskIdx].done:false,hist:editTaskIdx>=0?tasks[editTaskIdx].hist:[]};
  if(editTaskIdx>=0) tasks[editTaskIdx]=t; else tasks.push(t);
  saveTasks(); closeTaskModal(); toast(editTaskIdx>=0?'Tâche modifiée ✓':'Tâche ajoutée ✓'); render();
}

// ── USER MODAL ───────────────────────────────────────────
function openUserModal(idx=-1) {
  editUserIdx=idx; const u=idx>=0?users[idx]:null;
  document.getElementById('userModalTitle').textContent=u?`Modifier : ${u.name}`:'Nouvel utilisateur';
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
  if(!name||!login){toast('Nom et identifiant requis','err');return;}
  if(users.find((u,i)=>u.login===login&&i!==editUserIdx)){toast('Identifiant déjà utilisé','err');return;}
  if(editUserIdx<0&&!pwd){toast('Mot de passe requis','err');return;}
  if(editUserIdx<0&&pwd!==pwd2){toast('Les mots de passe ne correspondent pas','err');return;}
  if(editUserIdx>=0){users[editUserIdx]={...users[editUserIdx],name,login,role,spec};if(pwd)users[editUserIdx].pwd=pwd;}
  else users.push({id:nextUserId(),name,login,role,spec,pwd,active:true});
  saveUsers(); closeUserModal(); toast(editUserIdx>=0?'Utilisateur modifié ✓':'Utilisateur créé ✓'); render();
}
function toggleUserActive(i){users[i].active=!users[i].active;saveUsers();toast(users[i].active?'Activé':'Désactivé','warn');render();}
function delUser(i){showCf('Supprimer',`Supprimer <strong>${esc(users[i].name)}</strong> ?`,()=>{users.splice(i,1);saveUsers();toast('Supprimé','warn');render();});}

// ── ACTIONS ──────────────────────────────────────────────
function toggleDone(si,el) {
  const t=tasks[si];
  if(!isAdmin()&&t.techId!==currentUser.id){el.checked=t.done;toast('Vous ne pouvez cocher que vos tâches','err');return;}
  t.done=el.checked;
  if(el.checked){t.hist.push(today());toast('✓ Tâche marquée effectuée');}else toast('Tâche réouverte','warn');
  saveTasks(); render();
}
function delTask(si){closeDp();showCf('Supprimer la tâche',`Supprimer <strong>${esc(tasks[si].comp)}</strong> ?`,()=>{tasks.splice(si,1);saveTasks();toast('Supprimée','warn');render();});}
function resetDone(){showCf('Nouvelle période','Remettre toutes les tâches en Planifié ?',()=>{tasks.forEach(t=>t.done=false);saveTasks();toast('Période réinitialisée');render();});}

// ── EXPORT CSV ───────────────────────────────────────────
function q(s){return'"'+String(s||'').replace(/"/g,'""')+'"';}
function exportCSV(){
  const h=['ID','Composant','Criticité','Type','Produit','Quantité','Fréquence','Technicien','Échéance','Localisation','Durée','Remarques','Effectué','Historique'];
  const rows=tasks.map(t=>[t.id,q(t.comp),t.crit,t.type,q(t.prod),q(t.qty||''),t.freq,q(getTechName(t.techId)),t.date,q(t.loc||''),q(t.dur||''),q(t.note||''),t.done?'Oui':'Non',(t.hist||[]).join(';')]);
  const csv=[h,...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  a.download=`lubriplan_${today()}.csv`;a.click();toast('Export CSV téléchargé');
}

// ── EXPORT EXCEL (XLSX) ──────────────────────────────────
function exportXLSX() {
  if (typeof XLSX === 'undefined') { toast('Bibliothèque Excel non chargée', 'err'); return; }
  const wb = XLSX.utils.book_new();

  // Feuille 1 : Toutes les tâches
  const header = ['ID','Composant','Criticité','Type','Produit','Quantité','Fréquence','Technicien','Échéance','Localisation','Durée','Remarques','Effectué','Historique'];
  const rows = tasks.map(t => [
    t.id, t.comp, cLabel(t.crit), t.type, t.prod, t.qty||'',
    t.freq, getTechName(t.techId), fmtD(t.date),
    t.loc||'', t.dur||'', t.note||'',
    t.done ? 'Oui' : 'Non',
    (t.hist||[]).map(fmtD).join(' | ')
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [5,25,12,10,25,10,14,18,12,20,10,30,10,20].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ws, 'Tâches');

  // Feuille 2 : Planning annuel
  const planHeader = ['Machine','Type','Produit','Fréquence','Technicien',...MONTHS_F];
  const planRows = tasks.map(t => {
    const row = [t.comp, t.type, t.prod, t.freq, getTechName(t.techId)];
    for (let mo = 0; mo < 12; mo++) {
      row.push(isInMonth(t, mo, new Date().getFullYear()) ? (t.done ? '✓' : '●') : '');
    }
    return row;
  });
  const wsPlan = XLSX.utils.aoa_to_sheet([planHeader, ...planRows]);
  wsPlan['!cols'] = [{wch:25},{wch:10},{wch:22},{wch:14},{wch:18},...Array(12).fill({wch:10})];
  XLSX.utils.book_append_sheet(wb, wsPlan, `Planning ${new Date().getFullYear()}`);

  // Feuille 3 : Statistiques
  const statRows = [
    ['Statistiques LubriPlan', ''],
    ['Total tâches', tasks.length],
    ['Tâches effectuées', tasks.filter(t=>t.done).length],
    ['Tâches en retard', tasks.filter(t=>getStatus(t)==='late').length],
    ['Échéance proche (14j)', tasks.filter(t=>getStatus(t)==='soon').length],
    ['Criticité 1 (critique)', tasks.filter(t=>t.crit===1).length],
    [''],
    ['Par technicien','Nb tâches','Effectuées'],
    ...users.filter(u=>u.role==='tech').map(u => {
      const tl = tasks.filter(t=>t.techId===u.id);
      return [u.name, tl.length, tl.filter(t=>t.done).length];
    })
  ];
  const wsStat = XLSX.utils.aoa_to_sheet(statRows);
  wsStat['!cols'] = [{wch:28},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb, wsStat, 'Statistiques');

  XLSX.writeFile(wb, `LubriPlan_Export_${today()}.xlsx`);
  toast('📊 Export Excel téléchargé');
}

// ── IMPORT EXCEL / CSV ───────────────────────────────────
function importFile(e) {
  const file=e.target.files[0]; if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='xlsx'||ext==='xls') importXLSX_file(file);
  else importCSVfile(file);
  e.target.value='';
}

function importXLSX_file(file) {
  const reader=new FileReader();
  reader.onload=function(ev){
    try {
      const data=new Uint8Array(ev.target.result);
      const wb=XLSX.read(data,{type:'array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
      if(rows.length<2){toast('Fichier vide ou invalide','err');return;}
      const header=rows[0].map(h=>String(h).toLowerCase().trim());
      let count=0;
      rows.slice(1).forEach(row=>{
        if(row.every(c=>c===''||c===null||c===undefined))return;
        const get=(keys)=>{
          for(const k of keys){const idx=header.findIndex(h=>h.includes(k));if(idx>=0&&row[idx]!==undefined&&row[idx]!=='')return String(row[idx]).trim();}
          return'';
        };
        const parseDate=(val)=>{
          if(!val)return today();
          if(typeof val==='number'){const d=new Date(Math.round((val-25569)*86400*1000));return d.toISOString().split('T')[0];}
          const s=String(val).trim();
          if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const[dd,mm,yyyy]=s.split('/');return`${yyyy}-${mm}-${dd}`;}
          if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
          return today();
        };
        const comp=get(['composant','équipement','equipement','component','nom','machine']);
        if(!comp)return;
        const critRaw=get(['criticité','criticite','crit','priorité','priorite']);
        const crit=Math.min(4,Math.max(1,parseInt(critRaw)||3));
        const typeRaw=get(['type']);
        const type=typeRaw.toLowerCase().includes('graisse')?'Graisse':'Huile';
        const freqRaw=get(['fréquence','frequence','freq','periodicité','periodicite']);
        const freqMap={'hebdo':'Hebdomadaire','mensuel':'Mensuelle','bimest':'Bimestrielle','trimest':'Trimestrielle','semest':'Semestrielle','annuel':'Annuelle'};
        let freq='Trimestrielle';
        for(const[k,v]of Object.entries(freqMap)){if(freqRaw.toLowerCase().includes(k)){freq=v;break;}}
        const date=parseDate(get(['échéance','echeance','date','prochaine']));
        const doneRaw=get(['effectué','effectue','fait','done','statut']);
        const done=['oui','yes','1','true','effectué','effectue'].includes(doneRaw.toLowerCase());
        tasks.push({id:nextTaskId(),comp,crit,type,prod:get(['produit','référence','reference','réf','ref','lubrifiant','huile']),qty:get(['quantité','quantite','qté','qte','qty']),freq,date,techId:null,dur:get(['durée','duree','dur','temps']),loc:get(['localisation','local','emplacement','zone','lieu']),note:get(['remarque','note','commentaire','observation']),done,hist:done?[date]:[]});
        count++;
      });
      saveTasks(); toast(`✓ ${count} tâche(s) importée(s) depuis Excel`); render();
    }catch(err){toast('Erreur Excel : '+err.message,'err');}
  };
  reader.readAsArrayBuffer(file);
}

function importCSVfile(file) {
  const reader=new FileReader();
  reader.onload=ev=>{
    const lines=ev.target.result.split('\n').slice(1).filter(l=>l.trim());
    let count=0;
    lines.forEach(line=>{
      const cols=line.split(',').map(x=>x.replace(/^"|"$/g,'').replace(/""/g,'"'));
      if(cols.length<9)return;
      tasks.push({id:nextTaskId(),comp:cols[1],crit:+cols[2]||1,type:cols[3]||'Huile',prod:cols[4],qty:cols[5],freq:cols[6],techId:null,date:cols[8],loc:cols[9]||'',dur:cols[10]||'',note:cols[11]||'',done:cols[12]==='Oui',hist:(cols[13]||'').split(';').filter(Boolean)});
      count++;
    });
    saveTasks(); toast(`✓ ${count} tâche(s) importée(s) depuis CSV`); render();
  };
  reader.readAsText(file);
}

// ── CONFIRM & TOAST ──────────────────────────────────────
function showCf(title,body,cb){document.getElementById('cfTitle').textContent=title;document.getElementById('cfBody').innerHTML=body;cfCb=cb;document.getElementById('confirmModal').classList.add('open');}
function closeCf(){document.getElementById('confirmModal').classList.remove('open');cfCb=null;}
document.getElementById('cfBtn').onclick=()=>{if(cfCb)cfCb();closeCf();};
function toast(msg,type='ok'){
  const c=document.getElementById('toastC'),el=document.createElement('div');
  el.className=`toast ${type}`;el.innerHTML=`<span>${type==='ok'?'✓':type==='err'?'✕':'⚠'}</span> ${msg}`;c.appendChild(el);
  setTimeout(()=>{el.style.transition='all .3s';el.style.opacity='0';el.style.transform='translateX(20px)';setTimeout(()=>el.remove(),300);},3000);
}

// ── KEYBOARD ─────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(document.getElementById('confirmModal').classList.contains('open'))closeCf();
    else if(document.getElementById('taskModal').classList.contains('open'))closeTaskModal();
    else if(document.getElementById('userModal').classList.contains('open'))closeUserModal();
    else closeDp();
  }
});

// ── BOOT ─────────────────────────────────────────────────
loadData();

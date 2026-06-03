// LubriPlan — app.js v3
// ✅ Recherche lettre par lettre sans perte de focus (DOM partiel)
// ✅ Excel structuré exactement comme les photos
// ✅ Décembre correctement inclus (fix semaine ISO)
// ✅ Couleurs exactes : G=jaune/#FFD700, V=rouge/#DC2626, effectué V=bleu/#38BDF8

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
let calViewType = 'graisse';

let filterState = {
  fltCrit: '', fltType: '', fltTech: '', fltStat: '', fltMach: '', srch: ''
};

// ── DONNÉES PAR DÉFAUT ──────────────────────────────────
function defaultUsers() {
  return [
    { id:1, name:'Administrateur', login:'admin',    pwd:'admin123', role:'admin', spec:'Gestion',   active:true },
    { id:2, name:'Laawam.b',       login:'laawam.b', pwd:'tech1234', role:'tech',  spec:'Graisseur', active:true }
  ];
}

function defaultTasks() {
  const T = 2;
  return [
    { id:1,  comp:'FFG 924', crit:1, type:'Huile',   prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-15',loc:'Atelier FFG',      dur:'45 min',note:'Vidange boîte de vitesses principale — vérifier niveau avant démarrage.',done:false,hist:[]},
    { id:2,  comp:'FFG 924', crit:1, type:'Graisse', prod:'',qty:'',freq:'Hebdomadaire', techId:T,date:'2026-01-05',loc:'Atelier FFG',      dur:'20 min',note:'Graissage roulements arbres impression + encrage.',done:false,hist:[]},
    { id:3,  comp:'FFG 924', crit:2, type:'Huile',   prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-01-15',loc:'Atelier FFG',      dur:'30 min',note:'Vidange réducteur section découpe.',done:false,hist:[]},
    { id:4,  comp:'FFG 924', crit:2, type:'Graisse', prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-15',loc:'Atelier FFG',      dur:'20 min',note:'Graissage chaînes transmission et galets guidage.',done:false,hist:[]},
    { id:5,  comp:'DRO HQP', crit:1, type:'Huile',   prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-01',loc:'Zone DRO',         dur:'1h',    note:'Vidange complète huile hydraulique — remplacer filtre retour.',done:false,hist:[]},
    { id:6,  comp:'DRO HQP', crit:2, type:'Graisse', prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-20',loc:'Zone DRO',         dur:'25 min',note:'Graissage roulements rouleaux transport.',done:false,hist:[]},
    { id:7,  comp:'DRO HQP', crit:2, type:'Huile',   prod:'',qty:'',freq:'Semestrielle', techId:T,date:'2026-03-01',loc:'Zone DRO',         dur:'45 min',note:'Vidange réducteur entraînement principal.',done:false,hist:[]},
    { id:8,  comp:'DRO 1',   crit:1, type:'Huile',   prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-10',loc:'Zone DRO',         dur:'1h',    note:'Vidange huile hydraulique centrale — contrôler pression circuit.',done:false,hist:[]},
    { id:9,  comp:'DRO 1',   crit:2, type:'Graisse', prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-25',loc:'Zone DRO',         dur:'20 min',note:'Graissage roulements cylindres presseurs.',done:false,hist:[]},
    { id:10, comp:'DRO 1',   crit:3, type:'Graisse', prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-10',loc:'Zone DRO',         dur:'20 min',note:'Graissage guidages linéaires table de réception.',done:false,hist:[]},
    { id:11, comp:'ONDULEUSE',crit:1, type:'Huile',   prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-10',loc:'Salle onduleuse', dur:'1h30',  note:'Vidange huile réducteurs rouleaux cannelés — CRITIQUE.',done:false,hist:[]},
    { id:12, comp:'ONDULEUSE',crit:1, type:'Graisse', prod:'',qty:'',freq:'Hebdomadaire', techId:T,date:'2026-01-05',loc:'Salle onduleuse', dur:'30 min',note:'Graissage roulements rouleaux cannelés haut et bas.',done:false,hist:[]},
    { id:13, comp:'ONDULEUSE',crit:1, type:'Huile',   prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-03-01',loc:'Salle onduleuse', dur:'1h',    note:'Vidange boîte vitesses entraînement principal.',done:false,hist:[]},
    { id:14, comp:'ONDULEUSE',crit:2, type:'Graisse', prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-10',loc:'Salle onduleuse', dur:'30 min',note:'Graissage chaînes, tendeurs et pignons de transmission.',done:false,hist:[]},
    { id:15, comp:'ONDULEUSE',crit:2, type:'Huile',   prod:'',qty:'',freq:'Semestrielle', techId:T,date:'2026-06-01',loc:'Salle onduleuse', dur:'45 min',note:'Vidange réducteur table chauffante.',done:false,hist:[]},
    { id:16, comp:'MARTIN 1224',crit:1,type:'Huile',  prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-20',loc:'Atelier Martin',  dur:'1h',    note:'Vidange huile boîte de vitesses.',done:false,hist:[]},
    { id:17, comp:'MARTIN 1224',crit:1,type:'Graisse',prod:'',qty:'',freq:'Hebdomadaire', techId:T,date:'2026-01-06',loc:'Atelier Martin',  dur:'25 min',note:'Graissage roulements arbres impression 4 couleurs.',done:false,hist:[]},
    { id:18, comp:'MARTIN 1224',crit:2,type:'Huile',  prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-03-15',loc:'Atelier Martin',  dur:'45 min',note:'Vidange réducteur section découpe rotative.',done:false,hist:[]},
    { id:19, comp:'MARTIN 1224',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-20',loc:'Atelier Martin',  dur:'25 min',note:'Graissage chaînes et pignons transmission générale.',done:false,hist:[]},
    { id:20, comp:'MARTIN 1224',crit:3,type:'Graisse',prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-20',loc:'Atelier Martin',  dur:'20 min',note:'Graissage guidages barres de liasse.',done:false,hist:[]},
    { id:21, comp:'MARTIN 924', crit:1,type:'Huile',  prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-22',loc:'Atelier Martin',  dur:'50 min',note:'Vidange huile boîte de vitesses principale.',done:false,hist:[]},
    { id:22, comp:'MARTIN 924', crit:1,type:'Graisse',prod:'',qty:'',freq:'Hebdomadaire', techId:T,date:'2026-01-06',loc:'Atelier Martin',  dur:'20 min',note:'Graissage roulements arbres impression.',done:false,hist:[]},
    { id:23, comp:'MARTIN 924', crit:2,type:'Huile',  prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-03-22',loc:'Atelier Martin',  dur:'40 min',note:'Vidange réducteur section découpe.',done:false,hist:[]},
    { id:24, comp:'MARTIN 924', crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-22',loc:'Atelier Martin',  dur:'20 min',note:'Graissage chaînes et pignons.',done:false,hist:[]},
    { id:25, comp:'1224 IMPRIMANTE',crit:1,type:'Huile',  prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-18',loc:'Zone impression', dur:'45 min',note:'Vidange huile centrale lubrification.',done:false,hist:[]},
    { id:26, comp:'1224 IMPRIMANTE',crit:1,type:'Graisse',prod:'',qty:'',freq:'Hebdomadaire', techId:T,date:'2026-01-05',loc:'Zone impression', dur:'20 min',note:'Graissage roulements cylindres impression.',done:false,hist:[]},
    { id:27, comp:'1224 IMPRIMANTE',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-18',loc:'Zone impression', dur:'20 min',note:'Graissage chaînes encrage.',done:false,hist:[]},
    { id:28, comp:'1224 IMPRIMANTE',crit:3,type:'Huile',  prod:'',qty:'',freq:'Semestrielle', techId:T,date:'2026-06-15',loc:'Zone impression', dur:'30 min',note:'Vidange réducteur groupe encrage.',done:false,hist:[]},
    { id:29, comp:'KLETT',crit:1,type:'Huile',  prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-05',loc:'Zone collage',     dur:'45 min',note:'Vidange réducteur principal.',done:false,hist:[]},
    { id:30, comp:'KLETT',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-12',loc:'Zone collage',     dur:'20 min',note:'Graissage roulements arbres encolleuse.',done:false,hist:[]},
    { id:31, comp:'KLETT',crit:3,type:'Graisse',prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-05',loc:'Zone collage',     dur:'15 min',note:'Graissage guidages table pliage.',done:false,hist:[]},
    { id:32, comp:'MINILINE',crit:2,type:'Huile',  prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-15',loc:'Ligne mini',      dur:'30 min',note:'Vidange réducteur entraînement bande.',done:false,hist:[]},
    { id:33, comp:'MINILINE',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-15',loc:'Ligne mini',      dur:'15 min',note:'Graissage roulements rouleaux convoyeur.',done:false,hist:[]},
    { id:34, comp:'MINILINE',crit:3,type:'Graisse',prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-15',loc:'Ligne mini',      dur:'15 min',note:'Graissage chaînes et guidages latéraux.',done:false,hist:[]},
    { id:35, comp:'LANGSTONE',crit:1,type:'Huile',  prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-25',loc:'Atelier Langstone',dur:'1h',  note:'Vidange huile boîte de vitesses.',done:false,hist:[]},
    { id:36, comp:'LANGSTONE',crit:1,type:'Graisse',prod:'',qty:'',freq:'Hebdomadaire', techId:T,date:'2026-01-05',loc:'Atelier Langstone',dur:'25 min',note:'Graissage roulements rouleaux cannelés.',done:false,hist:[]},
    { id:37, comp:'LANGSTONE',crit:2,type:'Huile',  prod:'',qty:'',freq:'Semestrielle', techId:T,date:'2026-06-01',loc:'Atelier Langstone',dur:'45 min',note:'Vidange réducteur table de coupe.',done:false,hist:[]},
    { id:38, comp:'LANGSTONE',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-25',loc:'Atelier Langstone',dur:'25 min',note:'Graissage chaînes transmission.',done:false,hist:[]},
    { id:39, comp:'BOBST LILA',crit:1,type:'Huile',  prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-03-01',loc:'Zone Bobst',      dur:'1h30',  note:'Vidange huile centrale lubrification — CRITIQUE.',done:false,hist:[]},
    { id:40, comp:'BOBST LILA',crit:1,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-08',loc:'Zone Bobst',      dur:'30 min',note:'Graissage roulements platine.',done:false,hist:[]},
    { id:41, comp:'BOBST LILA',crit:2,type:'Huile',  prod:'',qty:'',freq:'Semestrielle', techId:T,date:'2026-06-01',loc:'Zone Bobst',      dur:'1h',    note:'Vidange réducteur principal alimentation.',done:false,hist:[]},
    { id:42, comp:'BOBST LILA',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-08',loc:'Zone Bobst',      dur:'20 min',note:'Graissage guidages colonnes platine.',done:false,hist:[]},
    { id:43, comp:'BOBST LILA',crit:3,type:'Graisse',prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-03-01',loc:'Zone Bobst',      dur:'20 min',note:'Graissage chaînes convoyeur réception.',done:false,hist:[]},
    { id:44, comp:'PICEUSE GAZELLA',crit:2,type:'Huile',  prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-20',loc:'Zone piquage',   dur:'45 min',note:'Vidange réducteur tête de piquage.',done:false,hist:[]},
    { id:45, comp:'PICEUSE GAZELLA',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-20',loc:'Zone piquage',   dur:'20 min',note:'Graissage roulements arbres piquage.',done:false,hist:[]},
    { id:46, comp:'PICEUSE GAZELLA',crit:3,type:'Graisse',prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-02-20',loc:'Zone piquage',   dur:'15 min',note:'Graissage chaînes convoyeur alimentation.',done:false,hist:[]},
    { id:47, comp:'BOBST VISION',crit:1,type:'Huile',  prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-03-10',loc:'Zone Bobst',      dur:'1h30',  note:'Vidange huile centrale lubrification — CRITIQUE.',done:false,hist:[]},
    { id:48, comp:'BOBST VISION',crit:1,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-10',loc:'Zone Bobst',      dur:'30 min',note:'Graissage roulements platine et mécanisme.',done:false,hist:[]},
    { id:49, comp:'BOBST VISION',crit:2,type:'Huile',  prod:'',qty:'',freq:'Semestrielle', techId:T,date:'2026-06-10',loc:'Zone Bobst',      dur:'1h',    note:'Vidange réducteur principal.',done:false,hist:[]},
    { id:50, comp:'BOBST VISION',crit:2,type:'Graisse',prod:'',qty:'',freq:'Mensuelle',    techId:T,date:'2026-01-10',loc:'Zone Bobst',      dur:'25 min',note:'Graissage guidages colonnes et glissières.',done:false,hist:[]},
    { id:51, comp:'BOBST VISION',crit:3,type:'Graisse',prod:'',qty:'',freq:'Trimestrielle',techId:T,date:'2026-03-10',loc:'Zone Bobst',      dur:'15 min',note:'Graissage chaînes convoyeur sortie.',done:false,hist:[]},
  ];
}

// ── SAUVEGARDE ──────────────────────────────────────────
function loadData() {
  try {
    const su = localStorage.getItem(LS_USERS), st = localStorage.getItem(LS_TASKS);
    users = su ? JSON.parse(su) : defaultUsers();
    tasks = st ? JSON.parse(st) : defaultTasks();
  } catch(e) { users = defaultUsers(); tasks = defaultTasks(); }
}
function saveUsers() { try { localStorage.setItem(LS_USERS, JSON.stringify(users)); } catch(e) {} }
function saveTasks() { try { localStorage.setItem(LS_TASKS, JSON.stringify(tasks)); } catch(e) {} }
function resetAllData() {
  showCf('Réinitialiser toutes les données','Supprimer toutes les tâches et revenir aux données par défaut ?',()=>{
    localStorage.removeItem(LS_TASKS); localStorage.removeItem(LS_USERS);
    loadData(); toast('Données réinitialisées'); render();
  });
}
const nextTaskId = () => tasks.reduce((m,t)=>Math.max(m,t.id),0)+1;
const nextUserId = () => users.reduce((m,u)=>Math.max(m,u.id),0)+1;

function getMachineList() {
  return [...new Set(tasks.map(t=>t.loc).filter(Boolean))].sort();
}

// ── AUTH ────────────────────────────────────────────────
function doLogin() {
  const loginVal=document.getElementById('loginUser').value.trim();
  const pwd=document.getElementById('loginPwd').value;
  const errEl=document.getElementById('loginErr');
  errEl.textContent='';
  if(!loginVal||!pwd){errEl.textContent='Veuillez remplir tous les champs.';return;}
  const u=users.find(x=>x.login===loginVal&&x.active);
  if(!u||u.pwd!==pwd){
    errEl.textContent='❌ Identifiant ou mot de passe incorrect.';
    document.getElementById('loginPwd').value='';document.getElementById('loginPwd').focus();return;
  }
  currentUser=u;
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('userAv').textContent=initials(currentUser.name);
  document.getElementById('userName').textContent=currentUser.name;
  document.getElementById('userRole').textContent=currentUser.role==='admin'?'Admin':'Technicien';
  switchView('liste');
}
function doLogout() {
  currentUser=null;
  filterState={fltCrit:'',fltType:'',fltTech:'',fltStat:'',fltMach:'',srch:''};
  document.getElementById('app').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginUser').value='';document.getElementById('loginPwd').value='';
  document.getElementById('loginErr').textContent='';
}
const isAdmin=()=>currentUser&&currentUser.role==='admin';

// ── NAVIGATION ───────────────────────────────────────────
function switchView(v) {
  currentView=v; closeDp();
  filterState={fltCrit:'',fltType:'',fltTech:'',fltStat:'',fltMach:'',srch:''};
  ['liste','planning','techniciens','historique','utilisateurs'].forEach(id=>{
    const el=document.getElementById('nav_'+id);
    if(el) el.classList.toggle('active',id===v);
  });
  const titles={liste:'Planning des tâches',planning:'Planning annuel',techniciens:'Vue par technicien',historique:'Historique des interventions',utilisateurs:'Gestion des utilisateurs'};
  const subs={liste:'Triées par criticité',planning:'Calendrier par semaines',techniciens:'Charge de travail',historique:'Interventions effectuées',utilisateurs:'Comptes et rôles'};
  document.getElementById('pageTitle').textContent=titles[v]||v;
  document.getElementById('pageSub').textContent=subs[v]||'';
  render();
}

// ── RENDER ───────────────────────────────────────────────
function render() {
  const c=document.getElementById('content');
  if      (currentView==='liste')        c.innerHTML=buildListView();
  else if (currentView==='planning')     c.innerHTML=buildCalView();
  else if (currentView==='techniciens')  c.innerHTML=buildTechView();
  else if (currentView==='historique')   c.innerHTML=buildHistView();
  else if (currentView==='utilisateurs') c.innerHTML=buildUserView();
  if(currentView==='liste') restoreFilterState();
}

// ══════════════════════════════════════════════════════════
// FIX RECHERCHE : mise à jour partielle — le champ garde le focus
// ══════════════════════════════════════════════════════════
function onFilterChange() {
  syncFilterState();
  if(currentView==='liste'&&document.getElementById('listTbody')) {
    updateListPartial();
  } else {
    render();
    if(currentView==='liste') restoreFilterState();
  }
}

function updateListPartial() {
  const all=getFiltered();
  const af=[filterState.fltCrit,filterState.fltType,filterState.fltTech,
    filterState.fltStat,filterState.fltMach,filterState.srch].filter(Boolean).length;
  const tbody=document.getElementById('listTbody');
  if(tbody) tbody.innerHTML=buildTableRows(all,af);
  const summaryEl=document.getElementById('filterSummary');
  if(summaryEl) summaryEl.innerHTML=buildFilterSummary();
  const rb=document.getElementById('filterResetBtn');
  if(rb) rb.style.display=af>0?'':'none';
}

function buildTableRows(all,activeFilters) {
  if(!all.length) return `<tr><td colspan="10"><div class="empty"><div class="empty-icon">🔍</div><p>Aucune tâche trouvée${activeFilters>0?' — <a href="#" onclick="clearAllFilters();return false;" style="color:var(--accent)">Effacer les filtres</a>':''}</p></div></td></tr>`;
  return all.map(t=>{
    const si=tasks.indexOf(t),st=getStatus(t),canCheck=isAdmin()||t.techId===currentUser.id;
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
  }).join('');
}

function restoreFilterState() {
  ['fltCrit','fltType','fltTech','fltStat','fltMach','srch'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value=filterState[id]||'';
  });
}
function syncFilterState() {
  ['fltCrit','fltType','fltTech','fltStat','fltMach','srch'].forEach(id=>{
    const el=document.getElementById(id); if(el) filterState[id]=el.value;
  });
}

// ── HELPERS ──────────────────────────────────────────────
function fmtD(d) {
  if(!d||d==='undefined'||d==='null') return '—';
  const s=String(d).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const p=s.split('-');return`${p[2]}/${p[1]}/${p[0]}`;}
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  if(!isNaN(Number(s))){const dt=new Date(Number(s));if(!isNaN(dt)){return`${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;}}
  return '—';
}
function today() {
  const d=new Date();
  return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function initials(n){return String(n||'').split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2);}
function getTechName(id){const u=users.find(x=>x.id===id);return u?u.name:'—';}
function getTechOptions(selId){return users.filter(u=>u.role==='tech'&&u.active).map(u=>`<option value="${u.id}"${u.id===selId?' selected':''}>${u.name}</option>`).join('');}
function getStatus(t){
  if(t.done) return 'done';
  const d=new Date(t.date),n=new Date();n.setHours(0,0,0,0);
  const diff=(d-n)/86400000;
  if(diff<0) return 'late'; if(diff<=14) return 'soon'; return 'pending';
}
const sLabel=s=>({done:'Effectué',late:'En retard',soon:'Bientôt',pending:'Planifié'})[s];
const sClass=s=>({done:'s-done',late:'s-late',soon:'s-soon',pending:'s-pend'})[s];
const cLabel=c=>({1:'Critique',2:'Haute',3:'Moyenne',4:'Faible'})[c]||c;
const cClass=c=>'c'+c;
const tClass=t=>t==='Huile'?'t-oil':'t-grease';

function getStats(){
  const list=isAdmin()?tasks:tasks.filter(t=>t.techId===currentUser.id);
  const total=list.length,done=list.filter(t=>t.done).length;
  const late=list.filter(t=>getStatus(t)==='late').length;
  const soon=list.filter(t=>getStatus(t)==='soon').length;
  const crit1=list.filter(t=>t.crit===1).length;
  return{total,done,late,soon,crit1,pct:total?Math.round(done/total*100):0};
}
function getFiltered(){
  syncFilterState();
  const fc=filterState.fltCrit||'',ft=filterState.fltType||'',fth=filterState.fltTech||'';
  const fs=filterState.fltStat||'',fm=filterState.fltMach||'',q=(filterState.srch||'').toLowerCase().trim();
  let list=isAdmin()?tasks:tasks.filter(t=>t.techId===currentUser.id);
  return list.filter(t=>{
    const s=getStatus(t);
    if(fm&&t.loc!==fm) return false;
    if(fc&&String(t.crit)!==String(fc)) return false;
    if(ft&&t.type!==ft) return false;
    if(fth&&String(t.techId)!==String(fth)) return false;
    if(fs&&s!==fs) return false;
    if(q){
      const sf=[t.comp,t.prod,t.loc,t.note,t.freq,t.qty,t.type,getTechName(t.techId),cLabel(t.crit),sLabel(getStatus(t)),fmtD(t.date)].map(x=>(x||'').toLowerCase());
      if(!sf.some(f=>f.includes(q))) return false;
    }
    return true;
  }).sort((a,b)=>{
    let va=a[sortCol],vb=b[sortCol];
    if(['crit','id'].includes(sortCol)){va=+va;vb=+vb;}
    if(sortCol==='date'){va=new Date(va);vb=new Date(vb);}
    if(va<vb) return sortAsc?-1:1; if(va>vb) return sortAsc?1:-1; return a.crit-b.crit;
  });
}
function srt(col){syncFilterState();if(sortCol===col)sortAsc=!sortAsc;else{sortCol=col;sortAsc=true;}render();}

// ── LIST VIEW ────────────────────────────────────────────
function buildListView(){
  const s=getStats(),all=getFiltered(),techs=users.filter(u=>u.role==='tech'&&u.active);
  const machines=getMachineList();
  const af=[filterState.fltCrit,filterState.fltType,filterState.fltTech,filterState.fltStat,filterState.fltMach,filterState.srch].filter(Boolean).length;
  const statsHTML=`<div class="stats-grid" id="statsGrid">
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
  const techFilter=isAdmin()?`<select id="fltTech" onchange="onFilterChange()"><option value="">Tous techniciens</option>${techs.map(u=>`<option value="${u.id}"${String(filterState.fltTech)===String(u.id)?' selected':''}>${u.name}</option>`).join('')}</select>`:'';
  const machineFilter=`<select id="fltMach" onchange="onFilterChange()" style="max-width:200px"><option value="">Toutes machines</option>${machines.map(m=>`<option value="${esc(m)}"${filterState.fltMach===m?' selected':''}>${esc(m)}</option>`).join('')}</select>`;
  const badge=af>0?`<span style="display:inline-flex;align-items:center;justify-content:center;background:var(--accent,#3182CE);color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;margin-left:4px">${af}</span>`:'';
  const ctrlHTML=`<div class="ctrl-bar">
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input type="text" id="srch" placeholder="Rechercher composant, type, technicien…"
        value="${esc(filterState.srch)}" autocomplete="off" autocorrect="off"
        autocapitalize="off" spellcheck="false"
        oninput="onFilterChange()" onkeydown="event.stopPropagation()"/>
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
    <button id="filterResetBtn" class="btn btn-s btn-sm" onclick="clearAllFilters()" style="color:var(--red);border-color:var(--red);${af===0?'display:none':''}" title="Effacer tous les filtres">✕ Filtres${badge}</button>
    ${adminBtns}
  </div>`;
  const th=(k,l)=>`<th class="${sortCol===k?'sorted':''}" onclick="srt('${k}')">${l}${sortCol===k?' '+(sortAsc?'↑':'↓'):''}</th>`;
  const theadHTML=`${th('comp','Composant')} ${th('crit','Criticité')} ${th('type','Type')} ${th('prod','Produit')} ${th('freq','Fréquence')} ${isAdmin()?th('techId','Technicien'):''} ${th('date','Échéance')} <th>Statut</th> <th style="text-align:center">Fait</th> ${isAdmin()?'<th></th>':''}`;
  return statsHTML+ctrlHTML+`<div id="filterSummary">${buildFilterSummary()}</div>`+`<div class="tbl-wrap"><table><thead><tr>${theadHTML}</tr></thead><tbody id="listTbody">${buildTableRows(all,af)}</tbody></table></div>`;
}

function buildFilterSummary(){
  const parts=[];
  if(filterState.fltMach)  parts.push(`Machine : <strong>${esc(filterState.fltMach)}</strong>`);
  if(filterState.fltCrit)  parts.push(`Criticité : <strong>${cLabel(+filterState.fltCrit)}</strong>`);
  if(filterState.fltType)  parts.push(`Type : <strong>${esc(filterState.fltType)}</strong>`);
  if(filterState.fltTech){const u=users.find(x=>String(x.id)===String(filterState.fltTech));if(u)parts.push(`Technicien : <strong>${esc(u.name)}</strong>`);}
  if(filterState.fltStat)  parts.push(`Statut : <strong>${sLabel(filterState.fltStat)}</strong>`);
  if(filterState.srch)     parts.push(`Recherche : <strong>"${esc(filterState.srch)}"</strong>`);
  if(!parts.length) return '';
  return`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#EBF8FF;border:1px solid #BEE3F8;border-radius:6px;margin-bottom:10px;font-size:12px;color:#2C5282">
    <span style="font-weight:600">🔎 Filtres actifs :</span>
    ${parts.join('<span style="color:#90CDF4;margin:0 2px">·</span>')}
    <button onclick="clearAllFilters()" style="margin-left:auto;background:none;border:1px solid #3182CE;color:#3182CE;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px">✕ Tout effacer</button>
  </div>`;
}
function clearAllFilters(){filterState={fltCrit:'',fltType:'',fltTech:'',fltStat:'',fltMach:'',srch:''};render();}

// ── SEMAINE ISO ─────────────────────────────────────────
function getWeekNumber(date) {
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d-yearStart)/86400000)+1)/7);
}

function getActiveWeeksClean(t,yr){
  if(!t.date) return new Set();
  const base=new Date(t.date+'T00:00:00');
  if(isNaN(base)) return new Set();
  const weeks=new Set();
  if(t.freq==='Hebdomadaire'){
    let cur=new Date(base);
    while(cur.getFullYear()<=yr){
      if(cur.getFullYear()===yr) weeks.add(getWeekNumber(cur));
      cur.setDate(cur.getDate()+7);
      if(weeks.size>52) break;
    }
  } else {
    const iv=Math.round(FREQ_M[t.freq]||12);
    let cur=new Date(base);
    for(let i=0;i<50;i++){
      if(cur.getFullYear()>yr) break;
      if(cur.getFullYear()===yr) weeks.add(getWeekNumber(cur));
      cur.setMonth(cur.getMonth()+iv);
    }
  }
  return weeks;
}

// ── FIX DÉCEMBRE : calcul exact semaines par mois ───────
// On génère S1..S52 en déterminant pour chaque semaine
// à quel mois elle appartient (par son lundi).
function buildMonthWeekMap(yr) {
  const map = {}; // weekNum → monthIndex (0-11)
  for (let w = 1; w <= 52; w++) {
    // Trouver le lundi de la semaine w de l'année yr
    const simple = new Date(yr, 0, 1 + (w - 1) * 7);
    const dow = simple.getDay() || 7;
    const monday = new Date(simple);
    monday.setDate(simple.getDate() - dow + 1);
    // Si ce lundi n'est pas dans yr, on prend le jeudi (milieu de semaine ISO)
    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);
    map[w] = thursday.getMonth(); // mois 0-11
  }
  return map;
}

// Construit les plages de semaines par mois pour les en-têtes
function buildMonthRanges(yr) {
  const mwMap = buildMonthWeekMap(yr);
  const ranges = Array.from({length:12}, (_, mo) => ({mo, weeks:[]}));
  for (let w = 1; w <= 52; w++) {
    const mo = mwMap[w];
    if (mo !== undefined && mo >= 0 && mo <= 11) ranges[mo].weeks.push(w);
  }
  // Filtrer les mois vides et calculer wStart/wEnd
  return ranges
    .filter(r => r.weeks.length > 0)
    .map(r => ({mo: r.mo, wStart: r.weeks[0], wEnd: r.weeks[r.weeks.length-1], count: r.weeks.length}));
}

// ── CALENDAR VIEW ────────────────────────────────────────
function buildCalView(){
  const machines=getMachineList();
  const weeks=Array.from({length:52},(_,i)=>i+1);
  const tabsHTML=`<div class="cal-tabs">
    <button class="cal-tab ${calViewType==='graisse'?'cal-tab-active':''}" onclick="calViewType='graisse';render()">🟡 Planning Graissage</button>
    <button class="cal-tab ${calViewType==='vidange'?'cal-tab-active':''}" onclick="calViewType='vidange';render()">🔴 Planning Vidange / Huile</button>
  </div>`;
  const machSelect=`<select id="calMachFilter" onchange="calFilterMachine=this.value;render()" style="font-family:var(--font);font-size:13px;padding:6px 12px;border:1px solid var(--border2);border-radius:var(--r);background:var(--surface);color:var(--text);outline:none;height:34px">
    <option value="">Toutes les machines</option>
    ${machines.map(m=>`<option value="${esc(m)}"${calFilterMachine===m?' selected':''}>${esc(m)}</option>`).join('')}
  </select>`;
  const dlBtn=calFilterMachine
    ?`<button class="btn btn-s btn-sm" onclick="downloadMachinePlanning('${esc(calFilterMachine).replace(/'/g,"\\'")}')">📥 Télécharger planning machine</button>`
    :`<button class="btn btn-s btn-sm" onclick="downloadAllPlannings()">📥 Télécharger tout (Excel)</button>`;
  const isGraisse=calViewType==='graisse';
  const header=`<div class="cal-header">
    <div class="year-nav">
      <button onclick="calYear--;render()">◀ Précédent</button>
      <span class="year-label">${calYear}</span>
      <button onclick="calYear++;render()">Suivant ▶</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${machSelect}${dlBtn}</div>
    <div class="cal-legend">
      ${isGraisse
        ?`<span><span class="leg-sq" style="background:#FFD700;border:1px solid #B8860B"></span>G — Graissage planifié</span>
          <span><span class="leg-sq" style="background:#E53E3E;border:1px solid #9B1C1C"></span>G — Semaine courante</span>
          <span><span class="leg-sq" style="background:#38A169;border:1px solid #276749"></span>G — Effectué</span>`
        :`<span><span class="leg-sq" style="background:#DC2626;border:1px solid #9B1C1C"></span>V — Vidange planifiée</span>
          <span><span class="leg-sq" style="background:#38BDF8;border:1px solid #0284C7"></span>V — Effectuée</span>`
      }
    </div>
  </div>`;
  let displayTasks=calFilterMachine?tasks.filter(t=>t.loc===calFilterMachine):(isAdmin()?tasks:tasks.filter(t=>t.techId===currentUser.id));
  displayTasks=displayTasks.filter(t=>isGraisse?t.type==='Graisse':t.type==='Huile');
  if(!displayTasks.length) return header+tabsHTML+`<div class="empty"><div class="empty-icon">📅</div><p>Aucune tâche ${isGraisse?'de graissage':'de vidange'} trouvée</p></div>`;
  const now=new Date(), currentWeek=getWeekNumber(now);
  const byMachine={};
  displayTasks.forEach(t=>{if(!byMachine[t.comp])byMachine[t.comp]=[];byMachine[t.comp].push(t);});
  const monthRanges=buildMonthRanges(calYear);
  const monthHeaderCells=monthRanges.map(m=>`<th colspan="${m.count}" style="background:#1a365d;color:#fff;text-align:center;font-size:11px;font-weight:700;border:1px solid #2d4a7a;padding:4px 2px;letter-spacing:0.5px">${MONTHS_S[m.mo]}</th>`).join('');
  const weekHeaderCells=weeks.map(w=>{
    const isCur=w===currentWeek&&calYear===now.getFullYear();
    return`<th style="background:${isCur?'#E53E3E':'#2d4a7a'};color:#fff;text-align:center;font-size:10px;font-weight:600;border:1px solid #1a365d;min-width:22px;width:22px;padding:3px 1px">S${w}</th>`;
  }).join('');
  let rowsHTML='';
  const machineNames=Object.keys(byMachine).sort();
  machineNames.forEach((machineName,mIdx)=>{
    const machineTasks=byMachine[machineName], rowBg=mIdx%2===0?'#f8fafc':'#fff';
    machineTasks.forEach((t,tIdx)=>{
      const si=tasks.indexOf(t), activeWeeks=getActiveWeeksClean(t,calYear);
      const weekCells=weeks.map(w=>{
        if(!activeWeeks.has(w)) return`<td style="border:1px solid #e2e8f0;background:${rowBg}"></td>`;
        const isCur=w===currentWeek&&calYear===now.getFullYear();
        const isPast=w<currentWeek&&calYear===now.getFullYear();
        let bg,border,color,content=isGraisse?'G':'V';
        if(t.done){bg=isGraisse?'#38A169':'#38BDF8';border=isGraisse?'#276749':'#0284C7';color='#fff';}
        else if(isCur){bg='#E53E3E';border='#9B1C1C';color='#fff';}
        else if(isPast&&t.crit===1){bg='#E53E3E';border='#9B1C1C';color='#fff';}
        else if(isPast){bg=isGraisse?'#F6AD55':'#FC8181';border=isGraisse?'#C05621':'#9B1C1C';color='#7B341E';}
        else{bg=isGraisse?'#FFD700':'#DC2626';border=isGraisse?'#B8860B':'#9B1C1C';color=isGraisse?'#7B341E':'#fff';}
        return`<td style="border:1px solid #e2e8f0;background:${rowBg};padding:1px"><div onclick="calClickWeek(${si},${w})" title="${esc(t.comp)} — ${t.freq} — S${w}" style="background:${bg};border:1px solid ${border};color:${color};width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;margin:auto;cursor:pointer;border-radius:2px;user-select:none">${content}</div></td>`;
      }).join('');
      if(tIdx===0){
        rowsHTML+=`<tr style="background:${rowBg}"><td rowspan="${machineTasks.length}" style="border:1px solid #cbd5e0;border-right:2px solid #2d4a7a;padding:6px 10px;vertical-align:middle;background:#edf2f7"><div style="font-size:12px;font-weight:800;color:#1a365d;text-transform:uppercase;letter-spacing:0.5px">${esc(machineName)}</div></td><td style="border:1px solid #cbd5e0;padding:4px 8px;font-size:11px;color:#4a5568;white-space:nowrap;min-width:120px">${esc(t.prod||t.note.substring(0,30)+(t.note.length>30?'…':''))}</td><td style="border:1px solid #cbd5e0;padding:4px 8px;font-size:11px;color:#4a5568;white-space:nowrap">${t.freq}</td>${weekCells}</tr>`;
      } else {
        rowsHTML+=`<tr style="background:${rowBg}"><td style="border:1px solid #cbd5e0;padding:4px 8px;font-size:11px;color:#4a5568;white-space:nowrap;min-width:120px">${esc(t.prod||t.note.substring(0,30)+(t.note.length>30?'…':''))}</td><td style="border:1px solid #cbd5e0;padding:4px 8px;font-size:11px;color:#4a5568;white-space:nowrap">${t.freq}</td>${weekCells}</tr>`;
      }
    });
  });
  return header+tabsHTML+`<div class="cal-scroll" style="margin-top:0"><table style="border-collapse:collapse;width:100%;font-family:var(--font)"><thead><tr><th rowspan="2" style="background:#1a365d;color:#fff;padding:8px 12px;font-size:12px;font-weight:700;border:1px solid #2d4a7a;text-align:left;min-width:160px">ÉQUIPEMENT</th><th rowspan="2" style="background:#1a365d;color:#fff;padding:8px 12px;font-size:12px;font-weight:700;border:1px solid #2d4a7a;text-align:left;min-width:130px">LUBRIFIANT</th><th rowspan="2" style="background:#1a365d;color:#fff;padding:8px 12px;font-size:12px;font-weight:700;border:1px solid #2d4a7a;text-align:left;min-width:100px">FRÉQUENCE</th>${monthHeaderCells}</tr><tr>${weekHeaderCells}</tr></thead><tbody>${rowsHTML}</tbody></table></div>`;
}

function calClickWeek(si,week){
  const t=tasks[si],canCheck=isAdmin()||t.techId===currentUser.id;
  if(!canCheck){toast('Vous ne pouvez cocher que vos propres tâches','err');return;}
  showCf('Confirmer intervention',`Marquer <strong>${esc(t.comp)}</strong> (S${week}) comme effectué ?`,()=>{
    tasks[si].done=true; tasks[si].hist.push(today()); saveTasks(); toast('Tâche marquée effectuée'); render();
  });
}
function calClick(si){
  const t=tasks[si],canCheck=isAdmin()||t.techId===currentUser.id;
  if(!canCheck){toast('Vous ne pouvez cocher que vos propres tâches','err');return;}
  showCf('Confirmer intervention',`Marquer <strong>${esc(t.comp)}</strong> comme effectué ?`,()=>{
    tasks[si].done=true; tasks[si].hist.push(today()); saveTasks(); toast('Tâche marquée effectuée'); render();
  });
}

// ══════════════════════════════════════════════════════════
// ── EXCEL : structure et couleurs exactes des photos ─────
//
//  STRUCTURE (photos) :
//  Col A : EQUIPEMENT  (gras, centré vertical, regroupé)
//  Col B : SOUS-EQUIPEMENT
//  Col C : LUBRIFIANT
//  Col D.. : S1 S2 S3 … S52  (3.2 chars de large)
//
//  Ligne 1 : noms des mois (colspan simulé, fond bleu nuit)
//  Ligne 2 : S1..S52 (fond noir/bleu très sombre)
//
//  COULEURS exactes :
//  G planifié futur    → #FFD700 fond, #000000 texte (photo 1 : jaune vif + G noir)
//  G semaine courante  → #E53E3E fond, #FFFFFF texte
//  G passé non fait    → #E53E3E fond, #FFFFFF texte
//  G effectué          → #22C55E fond, #FFFFFF texte
//
//  V planifié futur    → #DC2626 fond, #FFFFFF texte (photo 2 : rouge vif + V blanc)
//  V semaine courante  → #DC2626 fond, #FFFFFF texte
//  V passé non fait    → #991B1B fond, #FFFFFF texte
//  V effectué          → #38BDF8 fond, #FFFFFF texte (photo 2 : bleu ciel + V blanc)
//
//  Fond lignes données → #FFFFFF (blanc pur, pas de gris entre semaines)
//  Colonne EQUIPEMENT  → #EFF6FF fond, #1E3A5F texte, gras, centré
// ══════════════════════════════════════════════════════════

// Style en-tête générique (fond bleu nuit)
function xlsHeaderStyle(sz) {
  return {
    fill:{patternType:'solid',fgColor:{rgb:'1E3A5F'}},
    font:{bold:true,color:{rgb:'FFFFFF'},sz:sz||10,name:'Calibri'},
    alignment:{horizontal:'center',vertical:'center',wrapText:false},
    border:{top:{style:'medium',color:{rgb:'0F2340'}},bottom:{style:'medium',color:{rgb:'0F2340'}},left:{style:'thin',color:{rgb:'2D5282'}},right:{style:'thin',color:{rgb:'2D5282'}}}
  };
}
function xlsDataStyle(bg,bold,color,sz,halign) {
  const thin={style:'thin',color:{rgb:'D1D5DB'}};
  return {
    fill:{patternType:'solid',fgColor:{rgb:bg||'FFFFFF'}},
    font:{bold:!!bold,color:{rgb:color||'374151'},sz:sz||9,name:'Calibri'},
    alignment:{horizontal:halign||'left',vertical:'center',wrapText:false},
    border:{top:thin,bottom:thin,left:thin,right:thin}
  };
}
function xlsCellStyle(bg,fg,sz) {
  const thin={style:'thin',color:{rgb:'D1D5DB'}};
  return {
    fill:{patternType:'solid',fgColor:{rgb:bg}},
    font:{bold:true,color:{rgb:fg},sz:sz||9,name:'Calibri'},
    alignment:{horizontal:'center',vertical:'center',wrapText:false},
    border:{top:thin,bottom:thin,left:thin,right:thin}
  };
}

function applyBaseTableStyle(ws,headerRow,dataRows,colCount) {
  // En-tête
  for(let ci=0;ci<colCount;ci++){
    const ref=XLSX.utils.encode_cell({r:0,c:ci});
    if(!ws[ref]) ws[ref]={t:'s',v:''};
    ws[ref].s=xlsHeaderStyle(10);
  }
  // Données
  for(let ri=0;ri<dataRows;ri++){
    const bg=ri%2===0?'FFFFFF':'F8FAFC';
    for(let ci=0;ci<colCount;ci++){
      const ref=XLSX.utils.encode_cell({r:ri+1,c:ci});
      if(!ws[ref]) ws[ref]={t:'s',v:''};
      if(!ws[ref].s) ws[ref].s=xlsDataStyle(bg,false,'374151',9,'left');
    }
  }
}

function downloadMachinePlanning(machineName) {
  const machineTasks=tasks.filter(t=>t.loc===machineName);
  if(!machineTasks.length){toast('Aucune tâche pour cette machine','err');return;}
  if(typeof XLSX==='undefined'){toast('Bibliothèque Excel non chargée','err');return;}
  const wb=XLSX.utils.book_new();
  const weeks=Array.from({length:52},(_,i)=>i+1);
  const now=new Date(), currentWeek=getWeekNumber(now);

  // ── Feuille Base_Equipements ──
  const infoH=['ÉQUIPEMENT','SOUS-ÉQUIPEMENT','LUBRIFIANT','FRÉQUENCE','TECHNICIEN','PROCHAINE ÉCHÉANCE','STATUT'];
  const infoR=machineTasks.map(t=>[t.comp,t.note?t.note.substring(0,50):'',t.prod||'',t.freq,getTechName(t.techId),fmtD(t.date),sLabel(getStatus(t))]);
  const wsInfo=XLSX.utils.aoa_to_sheet([infoH,...infoR]);
  wsInfo['!cols']=[{wch:22},{wch:38},{wch:24},{wch:14},{wch:18},{wch:14},{wch:12}];
  applyBaseTableStyle(wsInfo,infoH,infoR.length,infoH.length);
  XLSX.utils.book_append_sheet(wb,wsInfo,'Base_Equipements');

  // ── Feuilles Planning ──
  const graisses=machineTasks.filter(t=>t.type==='Graisse');
  const huiles  =machineTasks.filter(t=>t.type==='Huile');
  if(graisses.length) buildWeeklySheet(wb,graisses,weeks,calYear,currentWeek,`Planning_Graissage_${calYear}`,'G');
  if(huiles.length)   buildWeeklySheet(wb,huiles,  weeks,calYear,currentWeek,`Planning_Vidange_${calYear}`,  'V');

  // ── Feuille Historique ──
  const histH=['DATE','ÉQUIPEMENT','LOCALISATION','TYPE','PRODUIT','TECHNICIEN','STATUT'];
  const histR=[];
  machineTasks.forEach(t=>(t.hist||[]).forEach(d=>{const ds=fmtD(d);if(ds!=='—')histR.push([ds,t.comp,t.loc||'',t.type,t.prod||'—',getTechName(t.techId),'Effectué']);}));
  if(!histR.length) histR.push(['Aucune intervention enregistrée','','','','','','']);
  const wsHist=XLSX.utils.aoa_to_sheet([histH,...histR]);
  wsHist['!cols']=[{wch:14},{wch:22},{wch:16},{wch:10},{wch:24},{wch:18},{wch:12}];
  applyBaseTableStyle(wsHist,histH,histR.length,histH.length);
  XLSX.utils.book_append_sheet(wb,wsHist,'Historique');

  const safeName=machineName.replace(/[/\\:*?"<>|]/g,'_');
  XLSX.writeFile(wb,`LubriPlan_${safeName}_${calYear}.xlsx`);
  toast(`📊 Planning "${machineName}" téléchargé`);
}

// ══════════════════════════════════════════════════════════
// buildWeeklySheet — génère la feuille planning hebdo
// Exactement comme les photos :
//  - Ligne 1 : mois (fond bleu nuit, regroupés)
//  - Ligne 2 : S1..S52 (fond très sombre, semaine courante rouge)
//  - Données : EQUIPEMENT | SOUS-EQUIPEMENT | LUBRIFIANT | S1..S52
//  - Cellules G/V colorées selon état
// ══════════════════════════════════════════════════════════
function buildWeeklySheet(wb,taskList,weeks,yr,currentWeek,sheetName,letter) {
  if(!taskList.length) return;
  const now=new Date();

  // Palettes couleurs exactes photos
  const PAL = {
    G: {
      future:  {bg:'FFD700', fg:'000000'}, // jaune vif, texte noir (photo 1)
      current: {bg:'E53E3E', fg:'FFFFFF'}, // rouge, blanc
      past:    {bg:'E53E3E', fg:'FFFFFF'}, // rouge, blanc
      done:    {bg:'22C55E', fg:'FFFFFF'}, // vert, blanc
    },
    V: {
      future:  {bg:'DC2626', fg:'FFFFFF'}, // rouge vif, blanc (photo 2)
      current: {bg:'DC2626', fg:'FFFFFF'}, // idem
      past:    {bg:'991B1B', fg:'FFFFFF'}, // rouge sombre, blanc
      done:    {bg:'38BDF8', fg:'FFFFFF'}, // bleu ciel, blanc (photo 2)
    }
  };
  const C=PAL[letter];

  // Mapping semaine → mois (fix Décembre)
  const mwMap=buildMonthWeekMap(yr);
  const monthRanges=buildMonthRanges(yr);

  // Regroupement par équipement
  const byMachine={};
  taskList.forEach(t=>{if(!byMachine[t.comp])byMachine[t.comp]=[];byMachine[t.comp].push(t);});
  const machineOrder=Object.keys(byMachine).sort();

  // ── Construction AOA ──
  const aoa=[];

  // Ligne 0 — Mois
  // On crée un mapping colonne → label mois (seulement la 1ère colonne du mois)
  const moLabelAtCol = {}; // ci (offset 3) → nom mois ou ''
  monthRanges.forEach(mr => {
    moLabelAtCol[mr.wStart] = MONTHS_S[mr.mo];
    for(let w=mr.wStart+1;w<=mr.wEnd;w++) moLabelAtCol[w]='';
  });
  const moRow = ['EQUIPEMENT','SOUS-EQUIPEMENT','LUBRIFIANT'];
  weeks.forEach(w => moRow.push(moLabelAtCol[w] !== undefined ? moLabelAtCol[w] : ''));
  aoa.push(moRow);

  // Ligne 1 — Semaines
  aoa.push(['EQUIPEMENT','SOUS-EQUIPEMENT','LUBRIFIANT',...weeks.map(w=>`S${w}`)]);

  // Lignes de données
  const rowMeta = []; // {groupIdx, isFirstInGroup, task}
  let groupIdx=0;
  machineOrder.forEach(mn => {
    byMachine[mn].forEach((t,ti) => {
      rowMeta.push({groupIdx, isFirstInGroup:ti===0, task:t, machineName:mn});
    });
    groupIdx++;
  });

  rowMeta.forEach(({groupIdx:gi,isFirstInGroup:isFirst,task:t,machineName:mn}) => {
    const aw=getActiveWeeksClean(t,yr);
    const subEquip=t.note?t.note.substring(0,55)+(t.note.length>55?'…':''):'';
    const row=[isFirst?mn:'', subEquip, t.prod||''];
    weeks.forEach(w => row.push(aw.has(w)?letter:''));
    aoa.push(row);
  });

  const ws=XLSX.utils.aoa_to_sheet(aoa);
  const totalRows=aoa.length;
  const totalCols=3+52;

  // ── Styles ──
  const thin={style:'thin',color:{rgb:'E5E7EB'}};
  const thinBorder={top:thin,bottom:thin,left:thin,right:thin};
  const thickRight={top:thin,bottom:thin,left:thin,right:{style:'medium',color:{rgb:'374151'}}};

  for(let ri=0;ri<totalRows;ri++){
    for(let ci=0;ci<totalCols;ci++){
      const ref=XLSX.utils.encode_cell({r:ri,c:ci});
      if(!ws[ref]) ws[ref]={t:'s',v:''};
      const cellVal=aoa[ri]?aoa[ri][ci]:'';

      if(ri===0){
        // ── Ligne mois ──
        // Couleur légèrement différente par mois pour la lisibilité
        const moColors=['1E3A5F','1B4571','183D65','153459'];
        const w=ci-2; // offset
        const mo=ci>=3?mwMap[w]:null;
        const moBg=mo!==undefined?moColors[mo%moColors.length]:'1E3A5F';
        ws[ref].s={
          fill:{patternType:'solid',fgColor:{rgb:ci<3?'1E3A5F':moBg}},
          font:{bold:true,color:{rgb:'FFFFFF'},sz:ci<3?10:9,name:'Calibri'},
          alignment:{horizontal:'center',vertical:'center',wrapText:false},
          border:ci===2?thickRight:thinBorder
        };

      } else if(ri===1){
        // ── Ligne semaines ──
        const wn=ci-2;
        const isCurW=(wn===currentWeek&&yr===now.getFullYear());
        let bgW,fgW;
        if(ci<3){bgW='1E3A5F';fgW='FFFFFF';}
        else if(isCurW){bgW='E53E3E';fgW='FFFFFF';}
        else{bgW='111827';fgW='FFFFFF';} // quasi-noir comme dans les photos
        ws[ref].s={
          fill:{patternType:'solid',fgColor:{rgb:bgW}},
          font:{bold:true,color:{rgb:fgW},sz:8,name:'Calibri'},
          alignment:{horizontal:'center',vertical:'center',wrapText:false},
          border:ci===2?thickRight:thinBorder
        };

      } else {
        // ── Lignes de données ──
        const meta=rowMeta[ri-2];
        const gi=meta?meta.groupIdx:0;
        // Alternance par groupe d'équipement (blanc / gris très très clair)
        const rowBg=gi%2===0?'FFFFFF':'F9FAFB';

        if(ci===0){
          // EQUIPEMENT — fond bleu pâle si nom, sinon rowBg
          const hasName=cellVal&&String(cellVal).trim()!=='';
          ws[ref].s={
            fill:{patternType:'solid',fgColor:{rgb:hasName?'EFF6FF':rowBg}},
            font:{bold:hasName,color:{rgb:hasName?'1E3A5F':'6B7280'},sz:9,name:'Calibri'},
            alignment:{horizontal:'center',vertical:'center',wrapText:false},
            border:{top:thin,bottom:thin,left:thin,right:{style:'thin',color:{rgb:'BFDBFE'}}}
          };
        } else if(ci===1){
          // SOUS-EQUIPEMENT
          ws[ref].s={
            fill:{patternType:'solid',fgColor:{rgb:rowBg}},
            font:{sz:8,name:'Calibri',color:{rgb:'374151'}},
            alignment:{horizontal:'left',vertical:'center',wrapText:false},
            border:thinBorder
          };
        } else if(ci===2){
          // LUBRIFIANT
          const hasLub=cellVal&&String(cellVal).trim()!=='';
          ws[ref].s={
            fill:{patternType:'solid',fgColor:{rgb:rowBg}},
            font:{bold:hasLub,sz:8,name:'Calibri',color:{rgb:hasLub?'1E40AF':'9CA3AF'}},
            alignment:{horizontal:'left',vertical:'center',wrapText:false},
            border:thickRight
          };
        } else {
          // Colonnes semaines
          const wn=ci-2;
          const isCurW=(wn===currentWeek&&yr===now.getFullYear());
          const isPastW=(wn<currentWeek&&yr===now.getFullYear());
          const taskForRow=meta?meta.task:null;
          const isDone=taskForRow?taskForRow.done:false;
          const hasCell=(cellVal===letter);

          if(hasCell){
            let pal;
            if(isDone)          pal=C.done;
            else if(isCurW)     pal=C.current;
            else if(isPastW)    pal=C.past;
            else                pal=C.future;
            ws[ref].s={
              fill:{patternType:'solid',fgColor:{rgb:pal.bg}},
              font:{bold:true,color:{rgb:pal.fg},sz:9,name:'Calibri'},
              alignment:{horizontal:'center',vertical:'center',wrapText:false},
              border:thinBorder
            };
          } else {
            ws[ref].s={
              fill:{patternType:'solid',fgColor:{rgb:rowBg}},
              font:{sz:8},
              border:thinBorder
            };
          }
        }
      }
    }
  }

  // ── Largeurs colonnes (comme photos) ──
  ws['!cols']=[
    {wch:20}, // EQUIPEMENT
    {wch:34}, // SOUS-EQUIPEMENT
    {wch:22}, // LUBRIFIANT
    ...Array(52).fill({wch:3.0}) // Semaines ultra-étroites
  ];
  // ── Hauteurs ──
  ws['!rows']=[{hpt:18},{hpt:14},...Array(aoa.length-2).fill({hpt:15})];
  // ── Freeze panes ──
  ws['!freeze']={xSplit:3,ySplit:2};

  XLSX.utils.book_append_sheet(wb,ws,sheetName);
}

function downloadAllPlannings(){
  if(typeof XLSX==='undefined'){toast('Bibliothèque Excel non chargée','err');return;}
  const wb=XLSX.utils.book_new();
  const weeks=Array.from({length:52},(_,i)=>i+1);
  const now=new Date(), currentWeek=getWeekNumber(now);
  const recapH=['ÉQUIPEMENT','LOCALISATION','CRITICITÉ','TYPE','PRODUIT','FRÉQUENCE','TECHNICIEN','PROCHAINE ÉCHÉANCE','STATUT'];
  const recapR=tasks.map(t=>[t.comp,t.loc||'',cLabel(t.crit),t.type,t.prod||'',t.freq,getTechName(t.techId),fmtD(t.date),sLabel(getStatus(t))]);
  const wsRecap=XLSX.utils.aoa_to_sheet([recapH,...recapR]);
  wsRecap['!cols']=[{wch:22},{wch:18},{wch:12},{wch:10},{wch:25},{wch:14},{wch:18},{wch:14},{wch:12}];
  applyBaseTableStyle(wsRecap,recapH,recapR.length,recapH.length);
  XLSX.utils.book_append_sheet(wb,wsRecap,'Base_Equipements');
  const allG=tasks.filter(t=>t.type==='Graisse'), allH=tasks.filter(t=>t.type==='Huile');
  if(allG.length) buildWeeklySheet(wb,allG,weeks,calYear,currentWeek,`Planning_Graissage_${calYear}`,'G');
  if(allH.length) buildWeeklySheet(wb,allH,weeks,calYear,currentWeek,`Planning_Vidange_${calYear}`,'V');
  XLSX.writeFile(wb,`LubriPlan_Planning_Complet_${calYear}.xlsx`);
  toast('📊 Planning complet téléchargé');
}

// ── TECH VIEW ────────────────────────────────────────────
function buildTechView(){
  const techs=users.filter(u=>u.role==='tech'&&u.active);
  if(!techs.length)return`<div class="empty"><div class="empty-icon">👷</div><p>Aucun technicien</p></div>`;
  const cards=techs.map(u=>{
    const tlist=tasks.filter(t=>t.techId===u.id).sort((a,b)=>a.crit-b.crit);
    const done=tlist.filter(t=>t.done).length,pct=tlist.length?Math.round(done/tlist.length*100):0;
    const taskRows=tlist.map(t=>{
      const si=tasks.indexOf(t),s=getStatus(t),canCheck=isAdmin()||t.techId===currentUser.id;
      return`<div class="tech-task"><span class="badge ${cClass(t.crit)}" style="font-size:10px;padding:1px 5px">${t.crit}</span><span class="tech-task-name">${esc(t.comp.substring(0,25))}${t.comp.length>25?'…':''}</span><span class="badge ${sClass(s)}" style="font-size:10px">${sLabel(s)}</span><input type="checkbox" ${t.done?'checked':''} ${canCheck?'':'disabled'} onchange="toggleDone(${si},this)"/></div>`;
    }).join('');
    return`<div class="tech-card"><div class="tech-card-header"><div class="tech-av">${initials(u.name)}</div><div><div class="tech-name">${esc(u.name)}</div><div class="tech-count">${u.spec||''} — ${tlist.length} tâche${tlist.length>1?'s':''}</div></div></div><div class="tech-tasks">${taskRows||'<div style="padding:10px 16px;font-size:12px;color:var(--text3)">Aucune tâche assignée</div>'}</div><div class="tech-prog"><div class="tech-prog-label"><span>Progression</span><span>${pct}%</span></div><div class="prog-bar" style="height:6px"><div class="prog-fill" style="width:${pct}%"></div></div></div></div>`;
  }).join('');
  return`<div class="tech-grid">${cards}</div>`;
}

// ── HISTORY VIEW ─────────────────────────────────────────
function buildHistView(){
  const list=isAdmin()?tasks:tasks.filter(t=>t.techId===currentUser.id);
  const all=[];
  list.forEach(t=>(t.hist||[]).forEach(d=>{if(d&&d!=='undefined'&&d!=='null'&&String(d).trim()!=='')all.push({d:String(d).trim(),t});}));
  all.sort((a,b)=>new Date(b.d)-new Date(a.d));
  if(!all.length)return`<div class="empty"><div class="empty-icon">🕐</div><p>Aucune intervention enregistrée</p></div>`;
  const totalInterv=all.length;
  const thisMonth=all.filter(({d})=>{const dt=new Date(d);return!isNaN(dt)&&dt.getMonth()===new Date().getMonth()&&dt.getFullYear()===new Date().getFullYear();}).length;
  const byType={Huile:all.filter(({t})=>t.type==='Huile').length,Graisse:all.filter(({t})=>t.type==='Graisse').length};
  const statsBar=`<div class="hist-stats-bar"><div class="hist-stat-item"><div class="hist-stat-val">${totalInterv}</div><div class="hist-stat-lbl">Total interventions</div></div><div class="hist-stat-sep"></div><div class="hist-stat-item"><div class="hist-stat-val" style="color:var(--green)">${thisMonth}</div><div class="hist-stat-lbl">Ce mois-ci</div></div><div class="hist-stat-sep"></div><div class="hist-stat-item"><div class="hist-stat-val" style="color:#3182CE">${byType.Huile}</div><div class="hist-stat-lbl">Vidanges huile</div></div><div class="hist-stat-sep"></div><div class="hist-stat-item"><div class="hist-stat-val" style="color:#D69E2E">${byType.Graisse}</div><div class="hist-stat-lbl">Graissages</div></div></div>`;
  const tableRows=all.map(({d,t},idx)=>{
    const rowBg=idx%2===0?'#f8fafc':'#fff';
    const typeColor=t.type==='Huile'?'#3182CE':'#D69E2E';
    const typeBg=t.type==='Huile'?'#EBF8FF':'#FFFFF0';
    const critColor=({1:'#E53E3E',2:'#DD6B20',3:'#D69E2E',4:'#38A169'})[t.crit]||'#718096';
    return`<tr style="background:${rowBg};border-bottom:1px solid #e2e8f0">
      <td style="padding:10px 14px;font-size:12px;font-family:var(--mono);font-weight:600;color:#2d3748;white-space:nowrap;border-right:1px solid #e2e8f0"><div style="display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;border-radius:50%;background:#38A169;flex-shrink:0"></div>${fmtD(d)}</div></td>
      <td style="padding:10px 14px;border-right:1px solid #e2e8f0"><div style="font-size:13px;font-weight:700;color:#1a365d">${esc(t.comp)}</div><div style="font-size:11px;color:#718096;margin-top:2px">📍 ${esc(t.loc||'—')}</div></td>
      <td style="padding:10px 14px;border-right:1px solid #e2e8f0"><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:${typeBg};color:${typeColor};border:1px solid ${typeColor}30">${t.type}</span></td>
      <td style="padding:10px 14px;font-size:12px;color:#4a5568;border-right:1px solid #e2e8f0">${esc(t.prod||'—')}</td>
      <td style="padding:10px 14px;font-size:12px;color:#4a5568;border-right:1px solid #e2e8f0">${esc(t.freq)}</td>
      <td style="padding:10px 14px;font-size:12px;color:#4a5568;border-right:1px solid #e2e8f0">${esc(getTechName(t.techId))}</td>
      <td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;border-radius:50%;background:${critColor}"></div><span style="font-size:11px;color:${critColor};font-weight:600">${cLabel(t.crit)}</span></div></td>
    </tr>`;
  }).join('');
  return`${statsBar}<div class="tbl-wrap" style="margin-top:16px"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#1a365d"><th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">DATE</th><th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">ÉQUIPEMENT</th><th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">TYPE</th><th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">PRODUIT</th><th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">FRÉQUENCE</th><th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid #2d4a7a">TECHNICIEN</th><th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px">CRITICITÉ</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
}

// ── USER VIEW ────────────────────────────────────────────
function buildUserView(){
  if(!isAdmin())return`<div class="empty"><div class="empty-icon">🔒</div><p>Accès refusé</p></div>`;
  const cards=users.map((u,i)=>{
    const tc=tasks.filter(t=>t.techId===u.id).length,isMe=u.id===currentUser.id;
    return`<div class="user-card"><div class="user-av-lg ${u.role==='admin'?'av-admin':'av-tech'}">${initials(u.name)}</div><div class="user-info"><div class="user-fullname">${esc(u.name)} ${isMe?'<span style="font-size:10px;color:var(--text3)">(vous)</span>':''}</div><div class="user-detail">@${esc(u.login)} · ${esc(u.spec||'')}</div><div class="user-badges"><span class="badge ${u.role==='admin'?'b-admin':'b-tech'}">${u.role==='admin'?'Admin':'Technicien'}</span>${u.role==='tech'?`<span style="font-size:11px;color:var(--text3)">${tc} tâche${tc>1?'s':''}</span>`:''} ${!u.active?'<span class="badge s-late">Désactivé</span>':''}</div></div><div class="user-actions"><button class="btn-icon" onclick="openUserModal(${i})">✏</button>${!isMe?`<button class="btn-icon" onclick="toggleUserActive(${i})" style="color:${u.active?'var(--orange)':'var(--green)'}">${u.active?'⏸':'▶'}</button>`:''} ${!isMe&&u.role!=='admin'?`<button class="btn-icon" onclick="delUser(${i})" style="color:var(--red)">🗑</button>`:''}</div></div>`;
  }).join('');
  return`<div style="display:flex;justify-content:flex-end;margin-bottom:16px"><button class="btn btn-p" onclick="openUserModal()">+ Ajouter un utilisateur</button></div><div class="user-grid">${cards}</div>`;
}

// ── DETAIL PANEL ─────────────────────────────────────────
function openDp(si){
  const t=tasks[si],s=getStatus(t);
  document.getElementById('dp-t').textContent=t.comp;
  document.getElementById('dp-s').innerHTML=`<span class="badge ${cClass(t.crit)}">${t.crit} — ${cLabel(t.crit)}</span> &nbsp; <span class="badge ${sClass(s)}">${sLabel(s)}</span>`;
  const info=[['Type',`<span class="badge ${tClass(t.type)}">${t.type}</span>`],['Référence',esc(t.prod)],['Quantité',esc(t.qty||'—')],['Fréquence',t.freq],['Technicien',esc(getTechName(t.techId))],['Échéance',fmtD(t.date)],['Durée',esc(t.dur||'—')],['Localisation',esc(t.loc||'—')]];
  const histH=(t.hist||[]).filter(d=>d&&d!=='undefined'&&d!=='null'&&String(d).trim()!=='').length
    ?(t.hist||[]).filter(d=>d&&d!=='undefined'&&d!=='null'&&String(d).trim()!=='').map(d=>`<div class="hist-entry">✓ Effectué le ${fmtD(d)}</div>`).join('')
    :'<div style="font-size:12px;color:var(--text3)">Aucune intervention</div>';
  document.getElementById('dp-b').innerHTML=`<div class="dp-section"><div class="dp-section-title">Informations</div>${info.map(([k,v])=>`<div class="dp-row"><span class="dp-key">${k}</span><span class="dp-val">${v}</span></div>`).join('')}</div>${t.note?`<div class="dp-section"><div class="dp-section-title">Remarques</div><div style="font-size:13px;color:var(--text2);line-height:1.6">${esc(t.note)}</div></div>`:''}<div class="dp-section"><div class="dp-section-title">Historique</div>${histH}</div>`;
  document.getElementById('dp-f').innerHTML=isAdmin()?`<button class="btn btn-s" style="flex:1" onclick="openTaskModal(${si});closeDp()">✏ Modifier</button><button class="btn btn-d" style="flex:1" onclick="delTask(${si})">🗑 Supprimer</button>`:'';
  document.getElementById('dpOverlay').classList.add('open');
  document.getElementById('dpPanel').classList.add('open');
}
function closeDp(){document.getElementById('dpOverlay').classList.remove('open');document.getElementById('dpPanel').classList.remove('open');}

// ── TASK MODAL ───────────────────────────────────────────
function openTaskModal(idx=-1){
  if(!isAdmin()){toast('Réservé aux administrateurs','err');return;}
  editTaskIdx=idx;const t=idx>=0?tasks[idx]:null;
  document.getElementById('taskModalTitle').textContent=t?`Modifier : ${t.comp}`:'Nouvelle tâche';
  document.getElementById('fComp').value=t?t.comp:'';document.getElementById('fCrit').value=t?t.crit:1;
  document.getElementById('fType').value=t?t.type:'Huile';document.getElementById('fProd').value=t?t.prod:'';
  document.getElementById('fQty').value=t?t.qty||'':'';document.getElementById('fFreq').value=t?t.freq:'Trimestrielle';
  document.getElementById('fDate').value=t?t.date:today();document.getElementById('fDur').value=t?t.dur||'':'';
  document.getElementById('fLoc').value=t?t.loc||'':'';document.getElementById('fNote').value=t?t.note||'':'';
  document.getElementById('fTech').innerHTML='<option value="">— Non assigné —</option>'+getTechOptions(t?t.techId:null);
  updProdLbl();document.getElementById('taskModal').classList.add('open');
  setTimeout(()=>document.getElementById('fComp').focus(),100);
}
function closeTaskModal(){document.getElementById('taskModal').classList.remove('open');}
function updProdLbl(){
  const v=document.getElementById('fType')?.value;if(!v)return;
  document.getElementById('prodLbl').textContent=v==='Huile'?'Référence huile *':'Référence graisse *';
  document.getElementById('fProd').placeholder=v==='Huile'?'ex: Shell Omala S2 GX 220':'ex: SKF LGMT 3';
}
function saveTask(){
  const comp=document.getElementById('fComp').value.trim(),date=document.getElementById('fDate').value;
  if(!comp){toast('Nom du composant requis','err');return;}if(!date){toast('Date requise','err');return;}
  const t={id:editTaskIdx>=0?tasks[editTaskIdx].id:nextTaskId(),comp,prod:document.getElementById('fProd').value.trim(),crit:+document.getElementById('fCrit').value,type:document.getElementById('fType').value,qty:document.getElementById('fQty').value.trim(),freq:document.getElementById('fFreq').value,date,techId:+document.getElementById('fTech').value||null,dur:document.getElementById('fDur').value.trim(),loc:document.getElementById('fLoc').value.trim(),note:document.getElementById('fNote').value.trim(),done:editTaskIdx>=0?tasks[editTaskIdx].done:false,hist:editTaskIdx>=0?tasks[editTaskIdx].hist:[]};
  if(editTaskIdx>=0)tasks[editTaskIdx]=t;else tasks.push(t);
  saveTasks();closeTaskModal();toast(editTaskIdx>=0?'Tâche modifiée ✓':'Tâche ajoutée ✓');render();
}

// ── USER MODAL ───────────────────────────────────────────
function openUserModal(idx=-1){
  editUserIdx=idx;const u=idx>=0?users[idx]:null;
  document.getElementById('userModalTitle').textContent=u?`Modifier : ${u.name}`:'Nouvel utilisateur';
  document.getElementById('uName').value=u?u.name:'';document.getElementById('uLogin').value=u?u.login:'';
  document.getElementById('uRole').value=u?u.role:'tech';document.getElementById('uSpec').value=u?u.spec||'':'';
  document.getElementById('uPwd').value='';document.getElementById('uPwd2').value='';
  document.getElementById('pwdLbl').textContent=u?'Nouveau mot de passe (laisser vide = inchangé)':'Mot de passe *';
  document.getElementById('uPwd2Row').style.display=u?'none':'block';
  document.getElementById('userModal').classList.add('open');
  setTimeout(()=>document.getElementById('uName').focus(),100);
}
function closeUserModal(){document.getElementById('userModal').classList.remove('open');}
function saveUser(){
  const name=document.getElementById('uName').value.trim(),login=document.getElementById('uLogin').value.trim();
  const role=document.getElementById('uRole').value,spec=document.getElementById('uSpec').value.trim();
  const pwd=document.getElementById('uPwd').value,pwd2=document.getElementById('uPwd2').value;
  if(!name||!login){toast('Nom et identifiant requis','err');return;}
  if(users.find((u,i)=>u.login===login&&i!==editUserIdx)){toast('Identifiant déjà utilisé','err');return;}
  if(editUserIdx<0&&!pwd){toast('Mot de passe requis','err');return;}
  if(editUserIdx<0&&pwd!==pwd2){toast('Les mots de passe ne correspondent pas','err');return;}
  if(editUserIdx>=0){users[editUserIdx]={...users[editUserIdx],name,login,role,spec};if(pwd)users[editUserIdx].pwd=pwd;}
  else users.push({id:nextUserId(),name,login,role,spec,pwd,active:true});
  saveUsers();closeUserModal();toast(editUserIdx>=0?'Utilisateur modifié ✓':'Utilisateur créé ✓');render();
}
function toggleUserActive(i){users[i].active=!users[i].active;saveUsers();toast(users[i].active?'Activé':'Désactivé','warn');render();}
function delUser(i){showCf('Supprimer',`Supprimer <strong>${esc(users[i].name)}</strong> ?`,()=>{users.splice(i,1);saveUsers();toast('Supprimé','warn');render();});}

// ── ACTIONS ──────────────────────────────────────────────
function toggleDone(si,el){
  const t=tasks[si];
  if(!isAdmin()&&t.techId!==currentUser.id){el.checked=t.done;toast('Vous ne pouvez cocher que vos tâches','err');return;}
  t.done=el.checked;
  if(el.checked){const d=today();t.hist.push(d);toast(`✓ Tâche marquée effectuée le ${fmtD(d)}`);}
  else toast('Tâche réouverte','warn');
  saveTasks();render();
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
function exportXLSX(){
  if(typeof XLSX==='undefined'){toast('Bibliothèque Excel non chargée','err');return;}
  const wb=XLSX.utils.book_new();
  const header=['ID','Composant','Criticité','Type','Produit','Quantité','Fréquence','Technicien','Échéance','Localisation','Durée','Remarques','Effectué','Historique'];
  const rows=tasks.map(t=>[t.id,t.comp,cLabel(t.crit),t.type,t.prod,t.qty||'',t.freq,getTechName(t.techId),fmtD(t.date),t.loc||'',t.dur||'',t.note||'',t.done?'Oui':'Non',(t.hist||[]).filter(d=>d&&d!=='undefined'&&d!=='null').map(fmtD).filter(d=>d!=='—').join(' | ')]);
  const ws=XLSX.utils.aoa_to_sheet([header,...rows]);
  ws['!cols']=[5,25,12,10,25,10,14,18,12,20,10,30,10,20].map(w=>({wch:w}));
  applyBaseTableStyle(ws,header,rows.length,header.length);
  XLSX.utils.book_append_sheet(wb,ws,'Tâches');
  XLSX.writeFile(wb,`LubriPlan_Export_${today()}.xlsx`);
  toast('📊 Export Excel téléchargé');
}

// ── IMPORT ───────────────────────────────────────────────
function importFile(e){
  const file=e.target.files[0];if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='xlsx'||ext==='xls')importXLSX_file(file);else importCSVfile(file);
  e.target.value='';
}
function importXLSX_file(file){
  const reader=new FileReader();
  reader.onload=function(ev){
    try{
      const data=new Uint8Array(ev.target.result);
      const wb=XLSX.read(data,{type:'array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
      if(rows.length<2){toast('Fichier vide ou invalide','err');return;}
      const header=rows[0].map(h=>String(h).toLowerCase().trim());
      let count=0;
      rows.slice(1).forEach(row=>{
        if(row.every(c=>c===''||c===null||c===undefined))return;
        const get=(keys)=>{for(const k of keys){const idx=header.findIndex(h=>h.includes(k));if(idx>=0&&row[idx]!==undefined&&row[idx]!=='')return String(row[idx]).trim();}return'';};
        const parseDate=(val)=>{if(!val)return today();if(typeof val==='number'){const d=new Date(Math.round((val-25569)*86400*1000));return d.toISOString().split('T')[0];}const s=String(val).trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const[dd,mm,yyyy]=s.split('/');return`${yyyy}-${mm}-${dd}`;}if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;return today();};
        const comp=get(['composant','équipement','equipement','component','nom','machine']);
        if(!comp)return;
        const crit=Math.min(4,Math.max(1,parseInt(get(['criticité','criticite','crit','priorité','priorite']))||3));
        const typeRaw=get(['type']);const type=typeRaw.toLowerCase().includes('graisse')?'Graisse':'Huile';
        const freqRaw=get(['fréquence','frequence','freq']);const freqMap={'hebdo':'Hebdomadaire','mensuel':'Mensuelle','bimest':'Bimestrielle','trimest':'Trimestrielle','semest':'Semestrielle','annuel':'Annuelle'};
        let freq='Trimestrielle';for(const[k,v]of Object.entries(freqMap)){if(freqRaw.toLowerCase().includes(k)){freq=v;break;}}
        const date=parseDate(get(['échéance','echeance','date','prochaine']));
        const doneRaw=get(['effectué','effectue','fait','done','statut']);const done=['oui','yes','1','true','effectué','effectue'].includes(doneRaw.toLowerCase());
        tasks.push({id:nextTaskId(),comp,crit,type,prod:get(['produit','référence','reference','réf','ref','lubrifiant','huile']),qty:get(['quantité','quantite','qté','qte','qty']),freq,date,techId:null,dur:get(['durée','duree','dur','temps']),loc:get(['localisation','local','emplacement','zone','lieu']),note:get(['remarque','note','commentaire','observation']),done,hist:done?[date]:[]});
        count++;
      });
      saveTasks();toast(`✓ ${count} tâche(s) importée(s) depuis Excel`);render();
    }catch(err){toast('Erreur Excel : '+err.message,'err');}
  };
  reader.readAsArrayBuffer(file);
}
function importCSVfile(file){
  const reader=new FileReader();
  reader.onload=ev=>{
    const lines=ev.target.result.split('\n').slice(1).filter(l=>l.trim());let count=0;
    lines.forEach(line=>{
      const cols=line.split(',').map(x=>x.replace(/^"|"$/g,'').replace(/""/g,'"'));
      if(cols.length<9)return;
      tasks.push({id:nextTaskId(),comp:cols[1],crit:+cols[2]||1,type:cols[3]||'Huile',prod:cols[4],qty:cols[5],freq:cols[6],techId:null,date:cols[8],loc:cols[9]||'',dur:cols[10]||'',note:cols[11]||'',done:cols[12]==='Oui',hist:(cols[13]||'').split(';').filter(d=>d&&d!=='undefined')});
      count++;
    });
    saveTasks();toast(`✓ ${count} tâche(s) importée(s) depuis CSV`);render();
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



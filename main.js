// ── INIT LOAD ──
document.addEventListener('DOMContentLoaded', () => {
  // Load Theme
  const savedColor = localStorage.getItem('cosmo_theme');
  if (savedColor) {
    document.documentElement.style.setProperty('--c1', savedColor);
    document.getElementById('theme-color').value = savedColor;
  }
  
  updateXPUI();
  buildObjList();
  buildNavMissions();
  populateCompareDropdown();
  document.getElementById('nav-obj-count').textContent=Object.keys(OBJECTS).length;
  openObject('Земля', false);
});


// ── BUILD UI ELEMENTS ──
function buildObjList(){
  const el = document.getElementById('obj-list');
  el.innerHTML='';
  for(const [catLabel,names] of Object.entries(CATEGORIES)){
    el.innerHTML+=`<div class="cat-label">${catLabel}</div>`;
    for(const name of names){
      const d=OBJECTS[name];if(!d)continue;
      el.innerHTML+=`<div class="obj-item ${name===currentObj?'active':''}" onclick="openObject('${name.replace(/'/g,'\\\'')}')" >
        <div class="obj-thumb"><img src="${d.img}" alt="${name}" loading="lazy"></div>
        <div class="obj-info"><div class="name">${name}</div><div class="type">${d.badge}</div></div>
      </div>`;
    }
  }
}

function buildNavMissions(){
  const el = document.getElementById('nav-missions-list');
  const activeMissions = MISSIONS.filter(m=>m.status==='active').slice(0,5);
  // Optional chaining is fine, simply fallback to an empty string if element doesn't exist
  if (!el) return;
  el.innerHTML = activeMissions.map(m=>{
    const colors={active:'#22c55e',completed:'rgba(221,238,255,.4)',future:'#a855f7'};
    const c = colors[m.status]||'#00d2ff';
    return `<div class="mission-dot" onclick="openObject('${m.target.replace(/'/g,'\\\'')}')" >
      <div class="mdot" style="background:${c};box-shadow:0 0 5px ${c};animation:pulse 2s infinite"></div>
      <div class="mname">${m.name.split(' ')[0]}</div>
      <span class="tip" style="min-width:210px;">🚀 ${m.name} · ${m.target} · ${m.shortDesc}</span>
    </div>`;
  }).join('');
}


// ── OPEN OBJECT ──
window.openObject = function(name, awardXp = true){
  currentObj = name;
  const d = OBJECTS[name];
  if(!d)return;
  
  if (awardXp && !viewedSet.has(name)) {
    addXP(10, `Досліджено: ${name}`);
  }

  document.getElementById('planet-img').src = d.img;
  document.getElementById('planet-img').alt = name;
  document.getElementById('planet-title').textContent = name;
  document.getElementById('planet-category').textContent = d.category;
  document.getElementById('planet-desc').textContent = d.desc;
  document.getElementById('top-title').textContent = name;
  document.getElementById('top-badge').textContent = d.badge;
  document.getElementById('top-category').textContent = d.category;

  // Stats
  const sr=document.getElementById('stats-row');
  sr.innerHTML=d.stats.map(s=>`<div class="stat-card"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`).join('');

  // Forum info
  document.getElementById('forum-obj-name').textContent = name;
  document.getElementById('forum-obj-category').textContent = d.category;
  document.getElementById('forum-obj-img').src = d.img;
  document.getElementById('forum-obj-img').alt = name;
  document.getElementById('compose-obj-name').textContent = name;
  document.getElementById('forum-context').innerHTML = `Ви зараз обговорюєте <strong>${name}</strong> — ${d.category.toLowerCase()}. ${d.desc.split('.')[0]}.`;

  buildMissionsForObject();
  buildGallery();
  populateCompareDropdown();
  renderCompare();
  buildObjList();
  loadPosts();
  viewedSet.add(name);
  
  const ev=document.getElementById('nav-viewed');
  if(ev)ev.textContent=viewedSet.size;
  
  if (awardXp) showToast(`🔭 Відкрито: ${name}`,`🪐`);
};

// ── TABS ──
function setContentTab(tab,e){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  if(e&&e.target)e.target.classList.add('active');
  ['info','gallery','compare','missions','forum','threed'].forEach(s=>{
    const el=document.getElementById(s+'-section');
    if(el)el.style.display = (s===tab) ? 'block' : 'none';
  });
  if(tab==='threed'&&!is3DInitialized){init3DSolarSystem();is3DInitialized=true;}
}

// ── GALLERY GENERATOR ──
function buildGallery() {
  const grid = document.getElementById('gallery-grid');
  const d = OBJECTS[currentObj];
  if(!d) return;

  const filters = [
    {name: "Оптичний (True Color)", css: ""},
    {name: "Радіодіапазон", css: "filter: grayscale(1) contrast(1.5);"},
    {name: "Інфрачервоний", css: "filter: hue-rotate(180deg) saturate(2);"},
    {name: "Ультрафіолет", css: "filter: invert(1) hue-rotate(90deg);"},
    {name: "Пиловий спектр", css: "filter: sepia(1) saturate(3) hue-rotate(-30deg);"},
    {name: "Рентгенівський", css: "filter: contrast(2) brightness(1.5) grayscale(0.8) hue-rotate(240deg);"}
  ];

  grid.innerHTML = filters.map(f => `
    <div class="gal-item" onclick="showToast('Аналіз: ${f.name}', '📸'); addXP(2, 'Спектральний аналіз')">
      <img src="${d.img}" alt="${currentObj} — ${f.name}" loading="lazy" style="${f.css}">
      <div class="gal-filter-name">${f.name}</div>
    </div>
  `).join('');
}


// ── COMPARE SYSTEM ──
function populateCompareDropdown() {
  const sel = document.getElementById('compare-select');
  const names = Object.keys(OBJECTS).filter(k => k !== currentObj);
  sel.innerHTML = names.map(k => `<option value="${k}">${k}</option>`).join('');
  // pick a smart default: prefer Місяць if available, else first option
  if (names.includes("Місяць")) sel.value = "Місяць";
  else if (names.includes("Марс")) sel.value = "Марс";
  else sel.value = names[0];
}

function renderCompare() {
  const obj1 = OBJECTS[currentObj];
  const targetName = document.getElementById('compare-select').value;
  const obj2 = OBJECTS[targetName];

  if (!obj1 || !obj2) return;

  document.getElementById('comp-th-1').textContent = currentObj;
  document.getElementById('comp-th-2').textContent = targetName;

  // Build Table
  const tbody = document.getElementById('compare-tbody');
  
  // Try to match stats by label
  let rowsHtml = '';
  const labels1 = obj1.stats.map(s => s.label);
  const labels2 = obj2.stats.map(s => s.label);
  const commonLabels = [...new Set([...labels1, ...labels2])].slice(0, 5); // max 5

  commonLabels.forEach(lbl => {
    let val1 = obj1.stats.find(s => s.label === lbl)?.value || "Немає даних";
    let val2 = obj2.stats.find(s => s.label === lbl)?.value || "Немає даних";
    rowsHtml += `<tr>
      <td><strong>${val1}</strong></td>
      <td style="text-align:center; color:var(--c1); font-family:var(--font-display); text-transform:uppercase;">${lbl}</td>
      <td style="text-align:right;"><strong>${val2}</strong></td>
    </tr>`;
  });
  tbody.innerHTML = rowsHtml;

  // Visual Size Comp
  const visWrap = document.getElementById('compare-visual');
  let s1 = obj1.rawSize || 1;
  let s2 = obj2.rawSize || 1;
  
  // Normalize sizes for visual display (logarithmic scale approach so Sun doesn't break UI)
  let maxPx = 180;
  let minPx = 20;
  
  let scale1, scale2;
  if (s1 === s2) { scale1 = 100; scale2 = 100; }
  else if (s1 > s2) { scale1 = maxPx; scale2 = Math.max(minPx, (s2/s1) * maxPx); }
  else { scale2 = maxPx; scale1 = Math.max(minPx, (s1/s2) * maxPx); }

  // Adjust extreme differences (like Sun vs ISS) using math.log
  if (Math.abs(s1 - s2) > 100000) {
     scale1 = Math.max(minPx, Math.log10(s1) * 15);
     scale2 = Math.max(minPx, Math.log10(s2) * 15);
  }

  visWrap.innerHTML = `
    <div class="comp-orb-wrap">
      <div class="comp-orb" style="width:${scale1}px; height:${scale1}px;"><img src="${obj1.img}" alt="${currentObj}" loading="lazy"></div>
      <div class="comp-name">${currentObj}</div>
    </div>
    <div style="font-family:var(--font-display); font-size:24px; color:var(--muted);">VS</div>
    <div class="comp-orb-wrap">
      <div class="comp-orb" style="width:${scale2}px; height:${scale2}px;"><img src="${obj2.img}" alt="${targetName}" loading="lazy"></div>
      <div class="comp-name">${targetName}</div>
    </div>
  `;
}


// ── QUIZ ACADEMY ──
const QUIZ_POOL = [
  {q: "Яка планета найгарячіша у Сонячній системі?", a: ["Венера", "Меркурій", "Марс", "Юпітер"], correct: 0},
  {q: "Яка планета обертається «на боці»?", a: ["Уран", "Нептун", "Сатурн", "Земля"], correct: 0},
  {q: "Де знаходиться найбільший вулкан системи (Олімп)?", a: ["Марс", "Венера", "Каллісто", "Місяць"], correct: 0},
  {q: "Скільки триває один рік на Плутоні?", a: ["248 земних років", "10 земних років", "88 днів", "1000 років"], correct: 0},
  {q: "Яка галактика найближча до нашої?", a: ["Андромеда", "Трикутник", "Сомбреро", "Магелланові Хмари"], correct: 0}
];

let currentQuiz = null;

function startQuiz() {
  openModal('quiz-overlay');
  currentQuiz = QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
  
  document.getElementById('quiz-q').textContent = currentQuiz.q;
  const optsContainer = document.getElementById('quiz-opts');
  optsContainer.innerHTML = '';
  
  // Shuffle options
  let shuffledOpts = currentQuiz.a.map((opt, idx) => ({text: opt, isCorrect: idx === currentQuiz.correct}))
                                   .sort(() => Math.random() - 0.5);

  shuffledOpts.forEach(opt => {
    let btn = document.createElement('button');
    btn.className = 'quiz-btn';
    btn.textContent = opt.text;
    btn.onclick = () => answerQuiz(btn, opt.isCorrect);
    optsContainer.appendChild(btn);
  });
}

function answerQuiz(btn, isCorrect) {
  // Disable all
  const btns = document.getElementById('quiz-opts').querySelectorAll('.quiz-btn');
  btns.forEach(b => b.style.pointerEvents = 'none');

  if (isCorrect) {
    btn.classList.add('correct');
    showToast("Правильно! +50 XP", "🎉");
    addXP(50);
  } else {
    btn.classList.add('wrong');
    // highlight correct
    btns.forEach(b => {
      if(b.textContent === currentQuiz.a[currentQuiz.correct]) b.classList.add('correct');
    });
    showToast("Неправильно. Спробуй ще завтра!", "❌");
  }
  
  setTimeout(() => closeModal('quiz-overlay'), 2000);
}


// ── MODALS & UTILS ──
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function resetAllData() {
  if(confirm("Ви впевнені? Весь досвід та повідомлення форуму будуть видалені!")) {
    localStorage.clear();
    location.reload();
  }
}

// ── MISSIONS ──
function buildMissionsForObject(){
  const el = document.getElementById('missions-grid');
  let relevant = MISSIONS.filter(m=>m.target===currentObj||m.target.includes(currentObj));
  if(relevant.length===0) relevant = MISSIONS; 
  el.innerHTML = relevant.map(m=>{
    const statusLabel={active:'АКТИВНА',completed:'ЗАВЕРШЕНА',future:'МАЙБУТНЯ'}[m.status]||m.status;
    const cardClass={active:'active-mission',completed:'completed-mission',future:'future-mission'}[m.status]||'';
    const progressW = m.status==='completed'?100:(m.status==='future'?m.progress:m.progress);
    return `<div class="mission-card ${cardClass}">
      <div class="mc-header">
        <div class="mc-title">${m.name}</div>
        <div class="mc-status ${m.status}">${statusLabel}</div>
      </div>
      <div class="mc-agency">${m.agency} · ${m.launchYear}–${m.endYear}</div>
      <div style="margin-bottom:8px;font-size:12px;color:var(--c1);font-family:var(--font-display);letter-spacing:.5px;">${m.shortDesc}</div>
      <div class="mc-desc">${m.desc}</div>
      <div class="mc-facts">${m.facts.map(f=>`<span class="mc-fact">${f}</span>`).join('')}</div>
      ${m.status!=='future'?`<div class="mc-progress-wrap">
        <div class="mc-progress-label"><span>ПРОГРЕС</span><span>${progressW}%</span></div>
        <div class="mc-progress-bar"><div class="mc-progress-fill" style="width:${progressW}%"></div></div>
      </div>`:''}
    </div>`;
  }).join('');
}

// ── FORUM ──
function postMsg(){
  const nick=document.getElementById('nick').value.trim()||'Анонім';
  const msg=document.getElementById('msg-input').value.trim();
  if(!msg)return;
  const key='forum_'+currentObj;
  const posts=JSON.parse(localStorage.getItem(key)||'[]');
  posts.push({nick,msg,obj:currentObj,time:new Date().toLocaleTimeString('uk',{hour:'2-digit',minute:'2-digit'})});
  localStorage.setItem(key,JSON.stringify(posts));
  document.getElementById('msg-input').value='';
  loadPosts();
  addXP(15, "Повідомлення надіслано");
}

function loadPosts(){
  const key='forum_'+currentObj;
  const posts=JSON.parse(localStorage.getItem(key)||'[]');
  const el=document.getElementById('posts-list');
  if(!posts.length){
    el.innerHTML=`<div class="empty-posts"><span class="ep-icon">🌌</span>Поки ніхто не писав про ${currentObj}<div class="ep-hint">Будьте першим дослідником!</div></div>`;
    return;
  }
  el.innerHTML=posts.slice().reverse().map(p=>`<div class="post-item">
    <div class="post-meta"><span class="pnick">${escHtml(p.nick)}</span><span class="ptime">${p.time||''}</span></div>
    <div class="pobj-tag">📍 ${escHtml(p.obj||currentObj)}</div>
    <div class="post-text">${escHtml(p.msg)}</div>
  </div>`).join('');
}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
document.getElementById('msg-input').addEventListener('keydown',e=>{if(e.key==='Enter')postMsg();});

// ── TICKER ──
function buildTicker() {
  const facts = Object.entries(OBJECTS).filter(([,v]) => v.funFact).map(([name,v]) => `<span>★</span>${name}: ${v.funFact}`);
  const doubled = [...facts, ...facts]; // seamless loop
  document.getElementById('ticker-inner').innerHTML = doubled.map(f => `<span class="ticker-item"><span>★</span>${f.replace('<span>★</span>','')}</span>`).join('');
}

// ── FAVORITES ──
let favorites = JSON.parse(localStorage.getItem('cosmo_favs') || '[]');

function toggleFav(name, e) {
  e.stopPropagation();
  if (favorites.includes(name)) {
    favorites = favorites.filter(f => f !== name);
  } else {
    favorites.push(name);
    showToast(`⭐ Додано до обраних: ${name}`, '⭐');
    addXP(5, 'Додано до обраних');
  }
  localStorage.setItem('cosmo_favs', JSON.stringify(favorites));
  buildObjList();
  buildFavSection();
}

function buildFavSection() {
  const el = document.getElementById('fav-section');
  if (!el) return;
  if (!favorites.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="fav-section-label">⭐ Обрані</div>` +
    favorites.map(name => {
      const d = OBJECTS[name]; if(!d) return '';
      return `<div class="fav-item" onclick="openObject('${name.replace(/'/g,"\\'")}')">
        <div class="fav-thumb"><img src="${d.img}" alt="${name}" loading="lazy"></div>
        <span>${name}</span>
        <span style="margin-left:auto;font-size:11px;opacity:.5;cursor:pointer;" onclick="toggleFav('${name.replace(/'/g,"\\'")}', event)">✕</span>
        <span class="tip">${d.category}</span>
      </div>`;
    }).join('');
}

// ── SEARCH / FILTER ──
function filterObjList(query) {
  const q = query.trim().toLowerCase();
  const el = document.getElementById('obj-list');
  if (!q) { buildObjList(); return; }

  const matches = Object.entries(OBJECTS).filter(([name, d]) =>
    name.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q) ||
    d.badge.toLowerCase().includes(q)
  );

  if (!matches.length) {
    el.innerHTML = `<div class="no-results">🌌 Нічого не знайдено</div>`;
    return;
  }

  el.innerHTML = matches.map(([name, d]) => `
    <div class="obj-item ${name === currentObj ? 'active' : ''}" onclick="openObject('${name.replace(/'/g,"\\'")}')">
      <div class="obj-thumb"><img src="${d.img}" alt="${name}" loading="lazy"></div>
      <div class="obj-info"><div class="name">${name}</div><div class="type">${d.badge}</div></div>
      <span class="fav-star ${favorites.includes(name)?'starred':''}" onclick="toggleFav('${name.replace(/'/g,"\\'")}',event)">★</span>
    </div>`).join('');
}

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'r' || e.key === 'R') toggleRandom();
  if (e.key === 'Escape') {
    ['surprise-overlay','quiz-overlay','settings-overlay'].forEach(id => {
      document.getElementById(id)?.classList.remove('active');
    });
  }
});

// ── FADE TRANSITION ON OBJECT OPEN ──
const _origOpenObject = window.openObject;
window.openObject = function(name, awardXp = true) {
  const orb = document.getElementById('planet-img')?.parentElement;
  if (orb) {
    orb.classList.add('fade-out');
    setTimeout(() => {
      _origOpenObject(name, awardXp);
      orb.classList.remove('fade-out');
    }, 220);
  } else {
    _origOpenObject(name, awardXp);
  }
};

// ── PATCH buildObjList to add fav stars ──
const _origBuildObjList = buildObjList;
buildObjList = function() {
  const el = document.getElementById('obj-list');
  el.innerHTML = '';
  for (const [catLabel, names] of Object.entries(CATEGORIES)) {
    el.innerHTML += `<div class="cat-label">${catLabel}</div>`;
    for (const name of names) {
      const d = OBJECTS[name]; if (!d) continue;
      el.innerHTML += `<div class="obj-item ${name===currentObj?'active':''}" onclick="openObject('${name.replace(/'/g,"\\'")}')">
        <div class="obj-thumb"><img src="${d.img}" alt="${name}" loading="lazy"></div>
        <div class="obj-info"><div class="name">${name}</div><div class="type">${d.badge}</div></div>
        <span class="fav-star ${favorites.includes(name)?'starred':''}" onclick="toggleFav('${name.replace(/'/g,"\\'")}',event)">★</span>
      </div>`;
    }
  }
  buildFavSection();
};

// ── INIT extras ──
document.addEventListener('DOMContentLoaded', () => {
  buildTicker();
  buildFavSection();
});

// ── CLOCK ──
function updateClock(){
  const now=new Date();
  const hh=String(now.getUTCHours()).padStart(2,'0');
  const mm=String(now.getUTCMinutes()).padStart(2,'0');
  const ss=String(now.getUTCSeconds()).padStart(2,'0');
  const el=document.getElementById('nav-time');if(el)el.textContent=hh+':'+mm+':'+ss;
  const days=['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];
  const months=['Січ','Лют','Бер','Кві','Тра','Чер','Лип','Сер','Вер','Жов','Лис','Гру'];
  const de=document.getElementById('nav-date');
  if(de)de.textContent=days[now.getUTCDay()]+' '+now.getUTCDate()+' '+months[now.getUTCMonth()];
}
setInterval(updateClock,1000);updateClock();

// ── TOAST ──
let toastTimer;
function showToast(msg,icon='🚀'){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  document.getElementById('toast-icon').textContent=icon;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

// ── RANDOM & SURPRISE ──
function toggleRandom(){
  const names=Object.keys(OBJECTS);
  let pick;
  do{pick=names[Math.floor(Math.random()*names.length)];}while(pick===currentObj&&names.length>1);
  openObject(pick);
}

const ALL_FACTS = Object.entries(OBJECTS).filter(([,v])=>v.funFact).map(([name,v])=>({name,fact:v.funFact,img:v.img}));
function showSurprise(){
  const f = ALL_FACTS[Math.floor(Math.random()*ALL_FACTS.length)];
  document.getElementById('surprise-title').textContent = f.name;
  document.getElementById('surprise-fact').textContent = f.fact;
  openModal('surprise-overlay');
  addXP(5, "Новий факт знайдено");
}
function showSurpriseForCurrent(){
  const d = OBJECTS[currentObj];
  if(!d||!d.funFact) return showSurprise();
  document.getElementById('surprise-title').textContent = `✨ ${currentObj}`;
  document.getElementById('surprise-fact').textContent = d.funFact;
  openModal('surprise-overlay');
  addXP(5, "Секрет об'єкта розкрито");
}


// ── 3D SOLAR SYSTEM ──
let isAutoPilot = false;
let solarGroupMain;

function toggleAutoPilot() {
  isAutoPilot = !isAutoPilot;
  const btn = document.getElementById('btn-autopilot');
  if(isAutoPilot) {
    btn.classList.add('active');
    btn.textContent = 'Автопілот: УВІМК';
    showToast("Автопілот увімкнено. Розпочато екскурсію.", "🛸");
  } else {
    btn.classList.remove('active');
    btn.textContent = 'Автопілот: ВИМК';
  }
}

function init3DSolarSystem(){
  const container=document.getElementById('threed-canvas-container');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45,container.clientWidth/container.clientHeight,.1,2000);
  camera.position.set(0,90,160);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(container.clientWidth,container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  container.appendChild(renderer.domElement);
  
  solarGroupMain = new THREE.Group();
  scene.add(solarGroupMain);
  const pointLight=new THREE.PointLight(0xfff4cc,3,600);scene.add(pointLight);
  scene.add(new THREE.AmbientLight(0x111828,.8));

  const sunGeo=new THREE.SphereGeometry(13,32,32);
  const sunMat=new THREE.MeshBasicMaterial({color:0xffcc22});
  const sun=new THREE.Mesh(sunGeo,sunMat);solarGroupMain.add(sun);

  const coronaGeo=new THREE.SphereGeometry(16,32,32);
  const coronaMat=new THREE.MeshBasicMaterial({color:0xff9900,transparent:true,opacity:.12,side:THREE.BackSide});
  solarGroupMain.add(new THREE.Mesh(coronaGeo,coronaMat));

  const planetsData=[
    {name:'Mercury',color:0x8a8a8a,dist:22,size:1.1,speed:.04},
    {name:'Venus',color:0xe8c56a,dist:32,size:2.1,speed:.016},
    {name:'Earth',color:0x2e6fb5,dist:48,size:2.3,speed:.011},
    {name:'Mars',color:0xc1440e,dist:64,size:1.7,speed:.008},
    {name:'Jupiter',color:0xd4a574,dist:96,size:7,speed:.003},
    {name:'Saturn',color:0xc8b560,dist:130,size:5.5,speed:.0013},
    {name:'Uranus',color:0x7de8e8,dist:158,size:3.5,speed:.0007},
    {name:'Neptune',color:0x3f54ba,dist:182,size:3.2,speed:.0004},
  ];

  const planets=[];
  planetsData.forEach(p=>{
    const geo=new THREE.SphereGeometry(p.size,24,24);
    const mat=new THREE.MeshStandardMaterial({color:p.color,roughness:.75,metalness:.1});
    const mesh=new THREE.Mesh(geo,mat);
    const pivot=new THREE.Group();mesh.position.x=p.dist;pivot.add(mesh);solarGroupMain.add(pivot);
    
    const ring=new THREE.RingGeometry(p.dist-.15,p.dist+.15,80);
    const ringMat=new THREE.MeshBasicMaterial({color:0x00d2ff,transparent:true,opacity:.06,side:THREE.DoubleSide});
    const ringMesh=new THREE.Mesh(ring,ringMat);ringMesh.rotation.x=Math.PI/2;solarGroupMain.add(ringMesh);
    
    if(p.name==='Saturn'){
      const sr=new THREE.RingGeometry(7,13,64);
      const srm=new THREE.MeshBasicMaterial({color:0xd4bf8a,transparent:true,opacity:.4,side:THREE.DoubleSide});
      const srMesh=new THREE.Mesh(sr,srm);srMesh.rotation.x=Math.PI/3;mesh.add(srMesh);
    }
    planets.push({pivot,mesh,speed:p.speed});
  });

  let time = 0;
  function animate(){
    requestAnimationFrame(animate);
    planets.forEach(p=>{p.pivot.rotation.y+=p.speed;p.mesh.rotation.y+=.015;});
    sun.rotation.y+=.004;
    
    if (isAutoPilot) {
      time += 0.005;
      camera.position.x = Math.sin(time) * 160;
      camera.position.z = Math.cos(time) * 160;
      camera.position.y = 90 + Math.sin(time * 2) * 30;
      camera.lookAt(0,0,0);
    }

    renderer.render(scene,camera);
  }
  animate();
  
  window.addEventListener('resize',()=>{
    if(container.clientWidth>0){camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();renderer.setSize(container.clientWidth,container.clientHeight);}
  });
  
  let isDragging=false,prev={x:0,y:0};
  container.addEventListener('mousedown',()=>isDragging=true);
  container.addEventListener('mouseup',()=>isDragging=false);
  container.addEventListener('mouseleave',()=>isDragging=false);
  container.addEventListener('mousemove',e=>{
    if(isDragging && !isAutoPilot){
      solarGroupMain.rotation.y+=(e.offsetX-prev.x)*.008;
      solarGroupMain.rotation.x+=(e.offsetY-prev.y)*.008;
    }
    prev={x:e.offsetX,y:e.offsetY};
  });
  container.addEventListener('wheel',e=>{
    if(!isAutoPilot) {
      camera.position.z=Math.max(60,Math.min(350,camera.position.z+e.deltaY*.2));
      camera.position.y=Math.max(20,Math.min(200,camera.position.y+e.deltaY*.08));
    }
    e.preventDefault();
  },{passive:false});
}

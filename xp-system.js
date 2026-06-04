// ── GAMIFICATION (XP SYSTEM) ──
let userXP = parseInt(localStorage.getItem('cosmo_xp')) || 0;
let _lastRankName = null;

const RANKS = [
  { max: 50,    name: "Новачок",         desc: "Ти тільки починаєш свою космічну подорож. Досліджуй об'єкти, щоб підвищитися!",  icon: "rookie",   color: "#8899aa" },
  { max: 150,   name: "Спостерігач",     desc: "Ти почав помічати деталі Всесвіту. Непогано для початку!",                       icon: "observer",  color: "#22c55e" },
  { max: 300,   name: "Дослідник",       desc: "Ти активно вивчаєш Сонячну систему. Галактика чекає!",                           icon: "explorer",  color: "#00d2ff" },
  { max: 600,   name: "Навігатор",       desc: "Ти орієнтуєшся в зірках краще за більшість. Курс прокладено!",                   icon: "navigator", color: "#a855f7" },
  { max: 1000,  name: "Капітан",         desc: "Капітан зоряного флоту! Твій екіпаж вірить тобі.",                               icon: "captain",   color: "#f97316" },
  { max: 2000,  name: "Адмірал",         desc: "Адмірал космосу! Цілі флоти підкоряються твоїй волі.",                          icon: "admiral",   color: "#f43f5e" },
  { max: 99999, name: "Легенда Всесвіту",desc: "Ти досяг вершини. Всесвіт схиляється перед тобою.",                              icon: "legend",    color: "#ffd700" }
];

// ── SVG RANK BADGE RENDERER ──
function drawRankBadge(canvas, rankObj, size=48){
  if(!canvas) return;
  const c = canvas.getContext('2d');
  const s = size;
  canvas.width = s; canvas.height = s;
  const cx = s/2, cy = s/2, r = s*0.44;
  const col = rankObj.color;

  // Outer ring
  const ring = c.createRadialGradient(cx,cy,r*0.7,cx,cy,r);
  ring.addColorStop(0, col+'44'); ring.addColorStop(1, col+'00');
  c.beginPath(); c.arc(cx,cy,r+4,0,Math.PI*2);
  c.fillStyle = ring; c.fill();

  // Shield / star shape based on icon
  const ico = rankObj.icon;
  c.save(); c.translate(cx,cy);

  if(ico==='rookie'){
    // Simple circle
    const g=c.createRadialGradient(0,0,2,0,0,r);
    g.addColorStop(0,'#cdd'); g.addColorStop(1,col);
    c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.fillStyle=g; c.fill();
    c.strokeStyle='#fff3'; c.lineWidth=1.5; c.stroke();
    c.fillStyle='#fff'; c.font=`bold ${s*0.35}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('N',0,1);
  } else if(ico==='observer'){
    // Pentagon
    drawPoly(c,0,0,r,5,-Math.PI/2,col);
    c.fillStyle='#fff'; c.font=`bold ${s*0.3}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('👁',0,2);
  } else if(ico==='explorer'){
    // Hexagon
    drawPoly(c,0,0,r,6,0,col);
    c.fillStyle='#fff'; c.font=`${s*0.32}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('🔭',0,2);
  } else if(ico==='navigator'){
    // Star 6-point
    drawStar(c,0,0,r,r*0.5,6,col);
    c.fillStyle='#fff'; c.font=`${s*0.32}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('🧭',0,2);
  } else if(ico==='captain'){
    // Star 8-point
    drawStar(c,0,0,r,r*0.55,8,col);
    c.fillStyle='#fff'; c.font=`${s*0.3}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('⚓',0,2);
  } else if(ico==='admiral'){
    // Star 10-point with glow
    c.shadowColor=col; c.shadowBlur=12;
    drawStar(c,0,0,r,r*0.45,10,col);
    c.shadowBlur=0;
    c.fillStyle='#fff'; c.font=`${s*0.3}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('🎖️',0,2);
  } else if(ico==='legend'){
    // Crown shape
    c.shadowColor='#ffd700'; c.shadowBlur=20;
    drawCrown(c,0,0,r,col);
    c.shadowBlur=0;
    c.fillStyle='#fff'; c.font=`${s*0.28}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText('👑',0,4);
  }
  c.restore();
}

function drawPoly(c,x,y,r,sides,startAngle,col){
  const g=c.createLinearGradient(x-r,y-r,x+r,y+r);
  g.addColorStop(0,col+'ee'); g.addColorStop(1,col+'88');
  c.beginPath();
  for(let i=0;i<sides;i++){
    const a=startAngle+i*(Math.PI*2/sides);
    i===0?c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r):c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
  }
  c.closePath(); c.fillStyle=g; c.fill();
  c.strokeStyle='#fff3'; c.lineWidth=1.2; c.stroke();
}

function drawStar(c,x,y,outerR,innerR,points,col){
  const g=c.createRadialGradient(x,y,innerR*0.3,x,y,outerR);
  g.addColorStop(0,col+'ff'); g.addColorStop(1,col+'99');
  c.beginPath();
  for(let i=0;i<points*2;i++){
    const a=(i*Math.PI/points)-Math.PI/2;
    const r2=i%2===0?outerR:innerR;
    i===0?c.moveTo(x+Math.cos(a)*r2,y+Math.sin(a)*r2):c.lineTo(x+Math.cos(a)*r2,y+Math.sin(a)*r2);
  }
  c.closePath(); c.fillStyle=g; c.fill();
  c.strokeStyle='#fff4'; c.lineWidth=1; c.stroke();
}

function drawCrown(c,x,y,r,col){
  const g=c.createLinearGradient(x,y-r,x,y+r*0.5);
  g.addColorStop(0,'#ffd700'); g.addColorStop(1,col);
  c.fillStyle=g;
  // Crown base
  c.beginPath();
  c.moveTo(x-r,y+r*0.3); c.lineTo(x-r,y-r*0.2);
  c.lineTo(x-r*0.6,y-r*0.6); c.lineTo(x-r*0.2,y-r*0.1);
  c.lineTo(x,y-r); c.lineTo(x+r*0.2,y-r*0.1);
  c.lineTo(x+r*0.6,y-r*0.6); c.lineTo(x+r,y-r*0.2);
  c.lineTo(x+r,y+r*0.3); c.closePath();
  c.fill(); c.strokeStyle='#fff5'; c.lineWidth=1.2; c.stroke();
}

function addXP(amount, reason = "") {
  const prevRank = RANKS.find(r => userXP < r.max) || RANKS[RANKS.length-1];
  userXP += amount;
  localStorage.setItem('cosmo_xp', userXP);
  const newRank = RANKS.find(r => userXP < r.max) || RANKS[RANKS.length-1];
  updateXPUI();
  if (reason) showToast(`+${amount} XP: ${reason}`, `⭐`);
  // Rank-up popup
  if(newRank.name !== prevRank.name){
    setTimeout(()=>showRankUp(newRank), 600);
  }
}

function showRankUp(rankObj){
  document.getElementById('rankup-rank-name').textContent = rankObj.name;
  document.getElementById('rankup-rank-name').style.color = '';
  document.getElementById('rankup-rank-name').style.background = `linear-gradient(90deg,${rankObj.color},var(--c2))`;
  document.getElementById('rankup-rank-name').style.webkitBackgroundClip = 'text';
  document.getElementById('rankup-rank-name').style.webkitTextFillColor = 'transparent';
  document.getElementById('rankup-rank-desc').textContent = rankObj.desc;
  // Draw big badge
  const bigCanvas = document.getElementById('rankup-badge-img');
  bigCanvas.style.display = 'block';
  // Reuse canvas trick — swap to actual canvas
  document.getElementById('rankup-badge-img').outerHTML = '<canvas id="rankup-badge-img" class="rankup-badge-big" style="display:block;margin:0 auto 10px;"></canvas>';
  setTimeout(()=>{
    const bc = document.getElementById('rankup-badge-img');
    drawRankBadge(bc, rankObj, 120);
    bc.style.filter = `drop-shadow(0 0 30px ${rankObj.color}) drop-shadow(0 0 10px ${rankObj.color})`;
    bc.style.animation = 'rankup-pop .6s cubic-bezier(.34,1.56,.64,1)';
  },50);
  openModal('rankup-overlay');
  launchConfetti(rankObj.color);
  showToast(`🎉 Новий ранг: ${rankObj.name}!`, '🏆');
}

function launchConfetti(col){
  const canvas = document.getElementById('rankup-confetti');
  if(!canvas) return;
  const c = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400, H = canvas.offsetHeight || 300;
  canvas.width=W; canvas.height=H;
  let pieces = [];
  const colors=[col,'#fff','#ffd700','#a855f7','#00d2ff'];
  for(let i=0;i<80;i++) pieces.push({
    x:Math.random()*W, y:-10-Math.random()*30,
    vx:(Math.random()-.5)*4, vy:2+Math.random()*4,
    r:3+Math.random()*5, col:colors[Math.floor(Math.random()*colors.length)],
    rot:Math.random()*Math.PI, rotV:(Math.random()-.5)*0.2, life:1
  });
  let frame=0;
  function draw(){
    c.clearRect(0,0,W,H);
    pieces.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.rot+=p.rotV; p.life-=0.008;
      c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
      c.globalAlpha=Math.max(0,p.life);
      c.fillStyle=p.col;
      c.fillRect(-p.r/2,-p.r/2,p.r,p.r);
      c.restore();
    });
    pieces=pieces.filter(p=>p.life>0&&p.y<H+20);
    if(pieces.length>0&&frame<200){ frame++; requestAnimationFrame(draw); }
    else c.clearRect(0,0,W,H);
  }
  draw();
}

function showRankDetails(){
  const rank = RANKS.find(r=>userXP<r.max)||RANKS[RANKS.length-1];
  showRankUp(rank);
}

function updateXPUI() {
  let level = Math.floor(Math.sqrt(userXP / 10)) + 1;
  let currentRank = RANKS.find(r => userXP < r.max) || RANKS[RANKS.length - 1];
  let currentLevelXP = 10 * Math.pow(level - 1, 2);
  let nextLevelXP = 10 * Math.pow(level, 2);
  let progress = ((userXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  document.getElementById('xp-level').textContent = `Lvl ${level}`;
  document.getElementById('xp-rank').textContent = currentRank.name;
  document.getElementById('xp-fill').style.width = `${Math.min(100, Math.max(0, progress))}%`;
  // Draw rank badge
  const bc = document.getElementById('rank-badge-canvas');
  if(bc){ drawRankBadge(bc, currentRank, 48); bc.style.filter=`drop-shadow(0 0 8px ${currentRank.color})`; }
}

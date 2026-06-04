// ═══════════════════════════════════════════════════════
// ☄️  METEOR SHOOTER GAME — HARDCORE EDITION v2
// ═══════════════════════════════════════════════════════
(function(){
  // ── State ──
  let gCanvas, gCtx, gW, gH;
  let gameRunning = false;
  let gameRAF = null;
  let score=0, hiScore=0, lives=3, wave=1;
  let totalKills=0, totalShots=0, maxCombo=0;
  let ship, bullets=[], meteors=[], particles=[], stars=[], pickups=[], enemyBullets=[];
  let shootCooldown=0, gameOver=false, invincible=0, waveClearing=false, lastTime=0;
  // WASD movement
  const keys={};
  // Combo system
  let combo=1, comboTimer=0;
  // Powerups active
  let puShield=0, puRapid=0, puBomb=0;
  let mouseX=0, mouseY=0;
  let screenShake=0;
  let bgScrollY=0;

  // ── Open / close ──
  window.openGameModal = function(){
    openModal('game-overlay');
    initGameCanvas();
    document.getElementById('game-hiscore-val').textContent = hiScore;
  };
  window.closeGameModal = function(){
    closeModal('game-overlay');
    if(gameRAF){ cancelAnimationFrame(gameRAF); gameRAF=null; }
    gameRunning=false;
    removeKeyListeners();
  };

  function addKeyListeners(){
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }
  function removeKeyListeners(){
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }
  function onKeyDown(e){
    keys[e.code]=true;
    if(e.code==='Space'&&gameRunning){ e.preventDefault(); tryShoot(); }
    if(e.code==='KeyB'&&gameRunning){ e.preventDefault(); activateBomb(); }
  }
  function onKeyUp(e){ keys[e.code]=false; }

  function initGameCanvas(){
    gCanvas=document.getElementById('gameCanvas');
    gCtx=gCanvas.getContext('2d');
    resizeGame();
    window.addEventListener('resize', resizeGame);
    addKeyListeners();

    gCanvas.addEventListener('mousemove', e=>{
      const rect=gCanvas.getBoundingClientRect();
      mouseX=e.clientX-rect.left; mouseY=e.clientY-rect.top;
      if(gameRunning&&ship){
        ship.angle=Math.atan2(mouseY-ship.y, mouseX-ship.x)+Math.PI/2;
      }
    });
    gCanvas.addEventListener('mousedown', e=>{ if(gameRunning) tryShoot(); });
    gCanvas.addEventListener('touchmove', e=>{
      if(!gameRunning) return; e.preventDefault();
      const rect=gCanvas.getBoundingClientRect();
      const t=e.touches[0];
      mouseX=t.clientX-rect.left; mouseY=t.clientY-rect.top;
      if(ship){ ship.angle=Math.atan2(mouseY-ship.y, mouseX-ship.x)+Math.PI/2; }
      tryShoot();
    },{passive:false});
    gCanvas.addEventListener('touchstart', e=>{
      if(!gameRunning) return; e.preventDefault();
      const rect=gCanvas.getBoundingClientRect();
      mouseX=e.touches[0].clientX-rect.left; mouseY=e.touches[0].clientY-rect.top;
      tryShoot();
    },{passive:false});
  }

  function resizeGame(){
    if(!gCanvas) return;
    const parent=gCanvas.parentElement;
    gCanvas.width=parent.clientWidth;
    gCanvas.height=parent.clientHeight-46;
    gW=gCanvas.width; gH=gCanvas.height;
    if(ship){ ship.x=Math.min(ship.x,gW-20); ship.y=Math.min(ship.y,gH-20); }
    makeGameStars();
  }

  function makeGameStars(){
    stars=[];
    const n=Math.floor(gW*gH/3500);
    for(let i=0;i<n;i++) stars.push({
      x:Math.random()*gW, y:Math.random()*gH,
      r:Math.random()*1.4+0.2, a:Math.random(), da:(Math.random()-.5)*0.01,
      speed:Math.random()*0.4+0.1
    });
  }

  // ── Start ──
  window.startGame=function(){
    score=0; lives=3; wave=1; gameOver=false;
    totalKills=0; totalShots=0; maxCombo=0;
    bullets=[]; meteors=[]; particles=[]; pickups=[]; enemyBullets=[];
    shootCooldown=0; invincible=0; waveClearing=false;
    combo=1; comboTimer=0; puShield=0; puRapid=0; puBomb=0; screenShake=0;
    ship={x:gW/2, y:gH*0.72, r:16, angle:-Math.PI/2, vx:0, vy:0, thrustFx:0};
    mouseX=gW/2; mouseY=gH*0.3;
    updateHUD();
    document.getElementById('game-start-screen').style.display='none';
    document.getElementById('game-over-screen').style.display='none';
    document.getElementById('game-wave-screen').style.display='none';
    spawnWave(1);
    gameRunning=true;
    if(gameRAF) cancelAnimationFrame(gameRAF);
    lastTime=performance.now();
    gameRAF=requestAnimationFrame(gameLoop);
    showWaveBanner('ХВИЛЯ 1','ПОЧИНАЙ!');
  };

  // ── Wave difficulty config ──
  function waveConfig(w){
    return {
      count: 3+w*2+Math.floor(w/3),
      hasShooters: w>=3,
      hasArmored: w>=4,
      hasFast: w>=2,
      shooterChance: Math.min(0.35, w*0.05),
      armoredChance: Math.min(0.3, (w-3)*0.06),
      fastChance: Math.min(0.3, (w-1)*0.05),
      meteorSpeed: 0.55+w*0.09,
      shootFreq: Math.max(80, 200-w*12),
    };
  }

  function spawnWave(w){
    meteors=[]; enemyBullets=[];
    const cfg=waveConfig(w);
    for(let i=0;i<cfg.count;i++) spawnMeteor(w,cfg);
  }

  function spawnMeteor(w, cfg, x, y, size){
    const r=Math.random();
    let type='normal';
    if(cfg&&cfg.hasShooters&&Math.random()<cfg.shooterChance) type='shooter';
    else if(cfg&&cfg.hasArmored&&Math.random()<cfg.armoredChance) type='armored';
    else if(cfg&&cfg.hasFast&&Math.random()<cfg.fastChance) type='fast';

    const sz = size||(Math.random()<0.3?'large':Math.random()<0.55?'medium':'small');
    const radii={large:40+Math.random()*14, medium:23+Math.random()*9, small:12+Math.random()*5};
    const mr=radii[sz];

    let mx,my;
    if(x!==undefined){ mx=x; my=y; }
    else {
      // Spawn from edges or top
      const edge=Math.floor(Math.random()*4);
      if(edge===0){mx=Math.random()*gW; my=-mr;}
      else if(edge===1){mx=gW+mr; my=Math.random()*gH*0.7;}
      else if(edge===2){mx=-mr; my=Math.random()*gH*0.7;}
      else{mx=Math.random()*gW; my=-mr-Math.random()*80;}
    }

    const baseSpeed=(cfg?cfg.meteorSpeed:0.8)*(type==='fast'?2.2:1)*(sz==='small'?1.4:sz==='medium'?1:0.7);
    // Aim roughly toward middle/ship area
    const targetX=gW/2+(Math.random()-.5)*gW*0.5;
    const targetY=gH*0.5+(Math.random()-.5)*gH*0.3;
    const ang=Math.atan2(targetY-my, targetX-mx);
    const speed=baseSpeed*(0.7+Math.random()*0.6);

    const sides=7+Math.floor(Math.random()*5);
    const jagged=Array.from({length:sides},(_,i)=>{
      const a=(i/sides)*Math.PI*2;
      const d=mr*(0.72+Math.random()*0.36);
      return{a,d};
    });

    const cols={normal:['#8B4513','#A0522D','#CD853F','#7a4030','#9c6644'],
                shooter:['#c0392b','#e74c3c','#922b21'],
                armored:['#6c3483','#9b59b6','#512e5f'],
                fast:['#1a5276','#2980b9','#154360']};
    const col=(cols[type]||cols.normal)[Math.floor(Math.random()*(cols[type]||cols.normal).length)];

    const baseHp={large:3,medium:2,small:1};
    const hpMult={normal:1,shooter:1,armored:3,fast:1};
    const hp=(baseHp[sz]||1)*(hpMult[type]||1)+(w>5?1:0);

    meteors.push({
      x:mx,y:my, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed,
      r:mr, sz, col, type, jagged, rot:0, rotSpeed:(Math.random()-.5)*0.025,
      hp, maxHp:hp, shootTimer:40+Math.floor(Math.random()*60),
      age:0, glowPulse:Math.random()*Math.PI*2
    });
  }

  // ── Shoot ──
  function tryShoot(){
    const cd = puRapid>0 ? 4 : 14;
    if(shootCooldown>0) return;
    shootCooldown=cd;
    totalShots++;
    const bx=ship.x+Math.cos(ship.angle-Math.PI/2)*ship.r;
    const by=ship.y+Math.sin(ship.angle-Math.PI/2)*ship.r;
    const spd=14;
    bullets.push({x:bx,y:by,vx:Math.cos(ship.angle-Math.PI/2)*spd,vy:Math.sin(ship.angle-Math.PI/2)*spd,life:60,trail:[]});
    // Spread shot if rapid fire
    if(puRapid>0){
      for(const off of[-0.18,0.18]){
        const a=ship.angle-Math.PI/2+off;
        bullets.push({x:bx,y:by,vx:Math.cos(a)*spd*0.85,vy:Math.sin(a)*spd*0.85,life:50,trail:[]});
      }
    }
    for(let i=0;i<5;i++) particles.push(mkP(bx,by,'#fff',1.8,3));
  }

  // ── Bomb ──
  function activateBomb(){
    if(puBomb<=0) return;
    puBomb=0;
    screenShake=20;
    // Explode all visible meteors
    for(const m of meteors){
      explodeMeteor(m);
      score+=m.sz==='large'?15:m.sz==='medium'?35:80;
      totalKills++;
    }
    meteors=[]; enemyBullets=[];
    // Shockwave
    for(let i=0;i<60;i++) particles.push(mkP(gW/2,gH/2,Math.random()<0.5?'#00d2ff':'#fff',12,25));
    updateHUD();
    showFloatText(gW/2,gH/2,'💥 БОМБА!','#f97316',32);
  }

  // ── Particle helper ──
  function mkP(x,y,col,speed,life,vxe=0,vye=0){
    const a=Math.random()*Math.PI*2;
    const s=speed*(0.4+Math.random()*0.8);
    return{x,y,vx:Math.cos(a)*s+vxe,vy:Math.sin(a)*s+vye,col,life,maxLife:life,r:Math.random()*2.8+0.6};
  }

  // ── Float text ──
  let floatTexts=[];
  function showFloatText(x,y,text,col,size=18){
    floatTexts.push({x,y,text,col,size,life:50,maxLife:50,vy:-1.2});
  }

  // ── Explosions ──
  function explodeMeteor(m){
    const n=m.sz==='large'?20:m.sz==='medium'?12:7;
    const baseCol=m.type==='shooter'?'#e74c3c':m.type==='armored'?'#9b59b6':m.type==='fast'?'#2980b9':m.col;
    for(let i=0;i<n;i++) particles.push(mkP(m.x,m.y,Math.random()<0.5?baseCol:'#ffaa44',3+Math.random()*3,25+Math.random()*20));
    for(let i=0;i<7;i++) particles.push(mkP(m.x,m.y,'#fff',6,10));
    screenShake=Math.max(screenShake, m.sz==='large'?8:m.sz==='medium'?4:2);
  }
  function explodeShip(){
    for(let i=0;i<35;i++) particles.push(mkP(ship.x,ship.y,Math.random()<0.5?'#00d2ff':'#fff',5+Math.random()*3,40+Math.random()*20));
    for(let i=0;i<12;i++) particles.push(mkP(ship.x,ship.y,'#f97316',3,22));
    screenShake=20;
  }

  // ── Pickups ──
  function spawnPickup(x,y){
    if(Math.random()>0.35) return;
    const types=['shield','rapid','bomb','life','score'];
    const weights=[25,30,15,10,20];
    let roll=Math.random()*100, cum=0, t='score';
    for(let i=0;i<types.length;i++){ cum+=weights[i]; if(roll<cum){t=types[i];break;} }
    pickups.push({x,y,type:t,vy:-0.5,vx:(Math.random()-.5)*0.8,life:320,r:13,pulse:Math.random()*Math.PI*2});
  }

  // ── Main loop ──
  function gameLoop(now){
    const dt=Math.min((now-lastTime)/16.67, 2.5);
    lastTime=now;
    update(dt);
    draw();
    if(gameRunning) gameRAF=requestAnimationFrame(gameLoop);
  }

  function update(dt){
    if(gameOver) return;
    bgScrollY=(bgScrollY+0.3*dt)%gH;
    if(screenShake>0) screenShake=Math.max(0,screenShake-dt*1.2);
    if(shootCooldown>0) shootCooldown-=dt;
    if(invincible>0) invincible-=dt;
    if(puShield>0){ puShield-=dt; if(puShield<=0){ puShield=0; updatePUDisplay(); } }
    if(puRapid>0){ puRapid-=dt; if(puRapid<=0){ puRapid=0; updatePUDisplay(); } }
    if(comboTimer>0){ comboTimer-=dt; if(comboTimer<=0){ combo=1; updateComboHUD(); } }

    // WASD ship movement
    const spd=3.5;
    const acc=0.22;
    if(keys['KeyW']||keys['ArrowUp'])    ship.vy-=acc*dt;
    if(keys['KeyS']||keys['ArrowDown'])  ship.vy+=acc*dt;
    if(keys['KeyA']||keys['ArrowLeft'])  ship.vx-=acc*dt;
    if(keys['KeyD']||keys['ArrowRight']) ship.vx+=acc*dt;
    // Friction
    ship.vx*=Math.pow(0.88,dt); ship.vy*=Math.pow(0.88,dt);
    // Max speed
    const spd2=Math.hypot(ship.vx,ship.vy);
    if(spd2>spd){ ship.vx=(ship.vx/spd2)*spd; ship.vy=(ship.vy/spd2)*spd; }
    ship.x+=ship.vx*dt; ship.y+=ship.vy*dt;
    // Wrap
    if(ship.x<-ship.r)ship.x=gW+ship.r; else if(ship.x>gW+ship.r)ship.x=-ship.r;
    if(ship.y<-ship.r)ship.y=gH+ship.r; else if(ship.y>gH+ship.r)ship.y=-ship.r;
    // Angle toward mouse
    ship.angle=Math.atan2(mouseY-ship.y, mouseX-ship.x)+Math.PI/2;
    ship.thrustFx=spd2>0.3?1:0;

    // Bullets
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.trail.push({x:b.x,y:b.y});
      if(b.trail.length>9) b.trail.shift();
      b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
      if(b.x<-10||b.x>gW+10||b.y<-10||b.y>gH+10||b.life<=0){ bullets.splice(i,1); }
    }

    // Enemy bullets
    for(let i=enemyBullets.length-1;i>=0;i--){
      const b=enemyBullets[i];
      b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
      if(b.x<-20||b.x>gW+20||b.y<-20||b.y>gH+20||b.life<=0){ enemyBullets.splice(i,1); continue; }
      // Hit ship
      if(invincible<=0&&puShield<=0&&Math.hypot(b.x-ship.x,b.y-ship.y)<ship.r+5){
        enemyBullets.splice(i,1);
        takeDamage();
      }
    }

    // Pickups
    for(let i=pickups.length-1;i>=0;i--){
      const p=pickups[i];
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; p.pulse+=0.07*dt;
      if(p.life<=0||p.y>gH+20){ pickups.splice(i,1); continue; }
      // Ship collect
      if(Math.hypot(p.x-ship.x,p.y-ship.y)<ship.r+p.r+4){
        collectPickup(p);
        pickups.splice(i,1);
      }
    }

    // Meteors
    for(let i=meteors.length-1;i>=0;i--){
      const m=meteors[i];
      m.x+=m.vx*dt; m.y+=m.vy*dt; m.rot+=m.rotSpeed*dt; m.age+=dt; m.glowPulse+=0.05*dt;
      // Wrap
      if(m.x<-m.r-10)m.x=gW+m.r; else if(m.x>gW+m.r+10)m.x=-m.r;
      if(m.y<-m.r-10)m.y=gH+m.r; else if(m.y>gH+m.r+10)m.y=-m.r;

      // Shooter fires at ship
      if(m.type==='shooter'){
        m.shootTimer-=dt;
        if(m.shootTimer<=0){
          m.shootTimer=waveConfig(wave).shootFreq*(0.7+Math.random()*0.6);
          const a2=Math.atan2(ship.y-m.y,ship.x-m.x);
          const espd=3.5+wave*0.15;
          enemyBullets.push({x:m.x,y:m.y,vx:Math.cos(a2)*espd,vy:Math.sin(a2)*espd,life:120,r:5,col:'#e74c3c'});
        }
      }

      // Bullet collision
      let destroyed=false;
      for(let j=bullets.length-1;j>=0;j--){
        const b=bullets[j];
        if(Math.hypot(b.x-m.x,b.y-m.y)<m.r){
          bullets.splice(j,1);
          m.hp--;
          for(let k=0;k<6;k++) particles.push(mkP(b.x,b.y,'#ffdd88',4,12));
          if(m.hp<=0){
            explodeMeteor(m);
            // Combo
            combo++; comboTimer=90;
            if(combo>maxCombo) maxCombo=combo;
            updateComboHUD();
            const mult=Math.min(combo,8);
            const base=m.sz==='large'?20:m.sz==='medium'?50:100;
            const pts=base*(m.type==='armored'?3:m.type==='shooter'?2:1)*mult;
            score+=pts;
            totalKills++;
            showFloatText(m.x,m.y-m.r,`+${pts}`,combo>3?'#ffd700':'#fff', combo>5?22:16);
            // Split
            if(m.sz==='large'){ spawnMeteor(wave,waveConfig(wave),m.x,m.y,'medium'); spawnMeteor(wave,waveConfig(wave),m.x,m.y,'medium'); }
            else if(m.sz==='medium'){ spawnMeteor(wave,waveConfig(wave),m.x,m.y,'small'); spawnMeteor(wave,waveConfig(wave),m.x,m.y,'small'); }
            spawnPickup(m.x,m.y);
            meteors.splice(i,1);
            destroyed=true;
            updateHUD();
            break;
          } else {
            // Hit flash
            showFloatText(m.x,m.y,'HIT!','#fff',13);
          }
          break;
        }
      }
      if(destroyed) continue;

      // Meteor hits ship
      if(invincible<=0&&Math.hypot(ship.x-m.x,ship.y-m.y)<ship.r+m.r-6){
        if(puShield>0){ // Shield absorbs
          puShield=0; invincible=60; screenShake=10;
          showFloatText(ship.x,ship.y-30,'ЩИТБОКУ!','#00d2ff',16);
          for(let k=0;k<15;k++) particles.push(mkP(ship.x,ship.y,'#00d2ff',5,15));
          updatePUDisplay();
        } else {
          takeDamage();
          // Push meteor back
          const ang2=Math.atan2(m.y-ship.y,m.x-ship.x);
          m.vx+=Math.cos(ang2)*3; m.vy+=Math.sin(ang2)*3;
        }
      }
    }

    // Particles
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=Math.pow(0.94,dt); p.vy*=Math.pow(0.94,dt);
      p.life-=dt; if(p.life<=0) particles.splice(i,1);
    }

    // Float texts
    for(let i=floatTexts.length-1;i>=0;i--){
      const t=floatTexts[i];
      t.y+=t.vy*dt; t.life-=dt; if(t.life<=0) floatTexts.splice(i,1);
    }

    // Stars
    for(const s of stars){ s.a+=s.da*dt; if(s.a<0.05||s.a>1)s.da*=-1; }

    // Next wave
    if(!waveClearing&&meteors.length===0&&pickups.length===0&&enemyBullets.length===0){
      waveClearing=true; wave++;
      const cfg=waveConfig(wave);
      const subLines=['НЕБЕЗПЕКА ЗРОСТАЄ!','ВОНИ СТРІЛЯЮТЬ!','БРОНЬОВАНІ АСТЕРОЇДИ!','ХАОС ПОЧИНАЄТЬСЯ!','БОГ РЕЖИМ...'];
      const sub=wave>=3?subLines[Math.min(wave-3,subLines.length-1)]:'';
      updateHUD();
      showWaveBanner(`ХВИЛЯ ${wave}`, sub);
      setTimeout(()=>{ spawnWave(wave); waveClearing=false; }, 2400);
    }
  }

  function takeDamage(){
    lives--; invincible=130; combo=1; comboTimer=0;
    explodeShip(); updateHUD(); updateComboHUD();
    if(lives<=0){ endGame(); }
  }

  function collectPickup(p){
    const msgs={shield:'🛡️ ЩИТ!',rapid:'⚡ ШВИДКИЙ ВОГОНЬ!',bomb:'💣 БОМБА ГОТОВА!',life:'❤️ +LIFE!',score:'💫 БОНУС ОЧКИ!'};
    showToast(msgs[p.type]||'Бонус','⭐');
    if(p.type==='shield'){ puShield=300; }
    else if(p.type==='rapid'){ puRapid=200; }
    else if(p.type==='bomb'){ puBomb=1; }
    else if(p.type==='life'&&lives<5){ lives++; updateHUD(); }
    else if(p.type==='score'){ score+=500*combo; showFloatText(p.x,p.y-20,'★ +500!','#ffd700',20); updateHUD(); }
    updatePUDisplay();
  }

  // ── Drawing ──
  function draw(){
    const c=gCtx;
    // Screen shake
    c.save();
    if(screenShake>0){
      c.translate((Math.random()-.5)*screenShake*0.8,(Math.random()-.5)*screenShake*0.8);
    }
    c.clearRect(-50,-50,gW+100,gH+100);

    // Deep space BG with scroll
    const grad=c.createLinearGradient(0,0,0,gH);
    grad.addColorStop(0,'#020610'); grad.addColorStop(0.5,'#040a18'); grad.addColorStop(1,'#020408');
    c.fillStyle=grad; c.fillRect(-50,-50,gW+100,gH+100);

    // Scrolling star layers (parallax)
    for(const s of stars){
      s.y=(s.y+s.speed*(gameRunning?1:0))%gH;
      if(s.y<0)s.y=gH;
      c.beginPath(); c.arc(s.x,s.y,s.r,0,Math.PI*2);
      c.fillStyle=`rgba(200,225,255,${s.a.toFixed(2)})`; c.fill();
    }

    // Nebula
    drawNebula(c);

    // Pickups
    for(const p of pickups) drawPickup(c,p);

    // Particles
    for(const p of particles){
      const alpha=(p.life/p.maxLife);
      c.globalAlpha=Math.max(0,alpha);
      c.beginPath(); c.arc(p.x,p.y,p.r*alpha,0,Math.PI*2);
      c.fillStyle=p.col; c.fill();
    }
    c.globalAlpha=1;

    // Enemy bullets
    for(const b of enemyBullets){
      const bg2=c.createRadialGradient(b.x,b.y,0,b.x,b.y,10);
      bg2.addColorStop(0,'rgba(231,76,60,0.95)'); bg2.addColorStop(1,'rgba(231,76,60,0)');
      c.beginPath(); c.arc(b.x,b.y,10,0,Math.PI*2); c.fillStyle=bg2; c.fill();
      c.beginPath(); c.arc(b.x,b.y,4,0,Math.PI*2); c.fillStyle='#ff9999'; c.fill();
    }

    // Player bullets
    for(const b of bullets){
      for(let i=0;i<b.trail.length;i++){
        const t=b.trail[i]; const a=(i/b.trail.length)*0.6;
        c.beginPath(); c.arc(t.x,t.y,2,0,Math.PI*2);
        c.fillStyle=`rgba(0,210,255,${a.toFixed(2)})`; c.fill();
      }
      const bg3=c.createRadialGradient(b.x,b.y,0,b.x,b.y,9);
      bg3.addColorStop(0,'rgba(0,230,255,0.95)'); bg3.addColorStop(1,'rgba(0,210,255,0)');
      c.beginPath(); c.arc(b.x,b.y,9,0,Math.PI*2); c.fillStyle=bg3; c.fill();
      c.beginPath(); c.arc(b.x,b.y,3.5,0,Math.PI*2); c.fillStyle='#fff'; c.fill();
    }

    // Meteors
    for(const m of meteors) drawMeteor(c,m);

    // Shield bubble
    if(puShield>0){
      const a2=Math.min(1,(puShield/300))*0.4+0.1;
      const sg=c.createRadialGradient(ship.x,ship.y,ship.r,ship.x,ship.y,ship.r+14);
      sg.addColorStop(0,`rgba(0,210,255,${a2})`); sg.addColorStop(1,'rgba(0,210,255,0)');
      c.beginPath(); c.arc(ship.x,ship.y,ship.r+14,0,Math.PI*2); c.fillStyle=sg; c.fill();
      c.beginPath(); c.arc(ship.x,ship.y,ship.r+12,0,Math.PI*2);
      c.strokeStyle=`rgba(0,210,255,${a2*2})`; c.lineWidth=2; c.stroke();
    }

    // Ship
    if(invincible<=0||Math.floor(invincible/5)%2===0) drawShip(c);

    // Float texts
    for(const t of floatTexts){
      const a2=t.life/t.maxLife;
      c.globalAlpha=Math.max(0,a2);
      c.font=`bold ${t.size}px var(--font-display, sans-serif)`;
      c.fillStyle=t.col; c.textAlign='center'; c.textBaseline='middle';
      c.shadowColor=t.col; c.shadowBlur=8;
      c.fillText(t.text,t.x,t.y);
      c.shadowBlur=0;
    }
    c.globalAlpha=1; c.textAlign='left'; c.textBaseline='alphabetic';

    c.restore(); // end screen shake
  }

  function drawNebula(c){
    const n1=c.createRadialGradient(gW*0.12,gH*0.18,0,gW*0.12,gH*0.18,gW*0.28);
    n1.addColorStop(0,'rgba(168,85,247,0.05)'); n1.addColorStop(1,'rgba(168,85,247,0)');
    c.fillStyle=n1; c.fillRect(0,0,gW,gH);
    const n2=c.createRadialGradient(gW*0.82,gH*0.65,0,gW*0.82,gH*0.65,gW*0.22);
    n2.addColorStop(0,'rgba(0,210,255,0.04)'); n2.addColorStop(1,'rgba(0,210,255,0)');
    c.fillStyle=n2; c.fillRect(0,0,gW,gH);
  }

  function drawPickup(c,p){
    const a2=Math.min(1,p.life/60)*0.9;
    const pulse=Math.sin(p.pulse)*0.3+0.7;
    const icons={shield:'🛡️',rapid:'⚡',bomb:'💣',life:'❤️',score:'★'};
    const colors={shield:'#00d2ff',rapid:'#ffd700',bomb:'#f97316',life:'#f43f5e',score:'#a855f7'};
    const col=colors[p.type]||'#fff';
    // Glow ring
    c.save();
    c.globalAlpha=a2*pulse;
    const pg=c.createRadialGradient(p.x,p.y,2,p.x,p.y,p.r+8);
    pg.addColorStop(0,col+'99'); pg.addColorStop(1,col+'00');
    c.beginPath(); c.arc(p.x,p.y,p.r+8,0,Math.PI*2); c.fillStyle=pg; c.fill();
    c.beginPath(); c.arc(p.x,p.y,p.r,0,Math.PI*2);
    c.strokeStyle=col; c.lineWidth=2; c.stroke();
    c.font=`${p.r*1.3}px sans-serif`; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(icons[p.type]||'?',p.x,p.y);
    c.restore();
  }

  function drawMeteor(c,m){
    c.save(); c.translate(m.x,m.y); c.rotate(m.rot);
    const pulse=Math.sin(m.glowPulse)*0.5+0.5;
    const typeGlows={shooter:'rgba(231,76,60,',armored:'rgba(155,89,182,',fast:'rgba(41,128,185,',normal:'rgba(200,120,60,'};
    const glowBase=typeGlows[m.type]||typeGlows.normal;

    // Outer glow
    const glow=c.createRadialGradient(0,0,m.r*0.3,0,0,m.r*1.6);
    glow.addColorStop(0,glowBase+(0.1+pulse*0.1)+')'); glow.addColorStop(1,glowBase+'0)');
    c.beginPath();
    for(let i=0;i<m.jagged.length;i++){
      const pt=m.jagged[i];
      const nx=Math.cos(pt.a)*m.r*1.6, ny=Math.sin(pt.a)*m.r*1.6;
      i===0?c.moveTo(nx,ny):c.lineTo(nx,ny);
    }
    c.closePath(); c.fillStyle=glow; c.fill();

    // Body
    c.beginPath();
    for(let i=0;i<m.jagged.length;i++){
      const pt=m.jagged[i];
      const nx=Math.cos(pt.a)*pt.d, ny=Math.sin(pt.a)*pt.d;
      i===0?c.moveTo(nx,ny):c.lineTo(nx,ny);
    }
    c.closePath();
    const rg=c.createRadialGradient(-m.r*0.25,-m.r*0.3,m.r*0.08,0,0,m.r);
    if(m.type==='armored'){
      rg.addColorStop(0,'#d7bde2'); rg.addColorStop(0.4,m.col); rg.addColorStop(1,'#1a0a2a');
    } else if(m.type==='shooter'){
      rg.addColorStop(0,'#f1948a'); rg.addColorStop(0.4,m.col); rg.addColorStop(1,'#280a0a');
    } else if(m.type==='fast'){
      rg.addColorStop(0,'#85c1e9'); rg.addColorStop(0.4,m.col); rg.addColorStop(1,'#0a1620');
    } else {
      rg.addColorStop(0,'#c8956a'); rg.addColorStop(0.4,m.col); rg.addColorStop(1,'#2a1408');
    }
    c.fillStyle=rg; c.fill();
    c.strokeStyle='rgba(0,0,0,0.5)'; c.lineWidth=1.5; c.stroke();

    // Armored plating overlay
    if(m.type==='armored'){
      for(let i=0;i<4;i++){
        const pa=i*Math.PI/2+m.rot*0.3;
        const px2=Math.cos(pa)*m.r*0.5, py2=Math.sin(pa)*m.r*0.5;
        c.beginPath(); c.arc(px2,py2,m.r*0.22,0,Math.PI*2);
        c.strokeStyle='rgba(200,150,255,0.4)'; c.lineWidth=2; c.stroke();
      }
    }
    // Shooter danger glow
    if(m.type==='shooter'){
      c.beginPath(); c.arc(0,0,m.r*0.35,0,Math.PI*2);
      c.fillStyle=`rgba(231,76,60,${0.3+pulse*0.3})`; c.fill();
    }
    // Fast speed lines
    if(m.type==='fast'){
      c.strokeStyle='rgba(41,128,185,0.5)'; c.lineWidth=1.5;
      for(let i=0;i<3;i++){
        const a3=i*Math.PI*2/3;
        c.beginPath(); c.moveTo(Math.cos(a3)*m.r,Math.sin(a3)*m.r);
        c.lineTo(Math.cos(a3)*m.r*1.8,Math.sin(a3)*m.r*1.8); c.stroke();
      }
    }

    // Craters
    const cc=m.sz==='large'?4:m.sz==='medium'?2:1;
    for(let i=0;i<cc;i++){
      const cx2=Math.cos(i*1.8)*m.r*0.35, cy2=Math.sin(i*2.1+0.5)*m.r*0.35;
      const cr=m.r*(0.09+i*0.035);
      c.beginPath(); c.arc(cx2,cy2,cr,0,Math.PI*2); c.fillStyle='rgba(0,0,0,0.32)'; c.fill();
      c.beginPath(); c.arc(cx2-cr*0.3,cy2-cr*0.3,cr*0.4,0,Math.PI*2); c.fillStyle='rgba(255,255,255,0.1)'; c.fill();
    }
    c.beginPath(); c.arc(-m.r*0.22,-m.r*0.28,m.r*0.26,0,Math.PI*2); c.fillStyle='rgba(255,255,255,0.07)'; c.fill();

    // HP bar
    if(m.hp>1||m.maxHp>1){
      const bw=m.r*2; const bh=4;
      const bx2=-m.r; const by2=-m.r-10;
      c.fillStyle='rgba(0,0,0,0.5)'; c.fillRect(bx2,by2,bw,bh);
      const hpCol=m.type==='armored'?'#9b59b6':m.type==='shooter'?'#e74c3c':'#22c55e';
      c.fillStyle=hpCol; c.fillRect(bx2,by2,bw*(m.hp/m.maxHp),bh);
    }
    c.restore();
  }

  function drawShip(c){
    c.save(); c.translate(ship.x,ship.y); c.rotate(ship.angle);
    const moving=ship.thrustFx>0;

    // Engine glow
    if(moving){
      const eg=c.createRadialGradient(0,18,0,0,18,26);
      eg.addColorStop(0,'rgba(0,200,255,0.6)'); eg.addColorStop(1,'rgba(0,200,255,0)');
      c.beginPath(); c.arc(0,18,26,0,Math.PI*2); c.fillStyle=eg; c.fill();
    }

    // ── Among-Us crewmate body ──
    const bodyColor=puRapid>0?'#f39c12':puShield>0?'#2980b9':'#c8312a';
    const shadowColor=puRapid>0?'#9a6000':puShield>0?'#1a5276':'#7a1a14';
    const backpackColor=puRapid>0?'#d68910':puShield>0?'#21618c':'#a02824';

    c.beginPath(); c.ellipse(9,4,7,9,0,0,Math.PI*2); c.fillStyle=backpackColor; c.fill();
    c.beginPath();
    c.moveTo(-10,-14); c.quadraticCurveTo(-14,-14,-14,-8); c.lineTo(-14,8);
    c.quadraticCurveTo(-14,16,-8,16); c.lineTo(8,16);
    c.quadraticCurveTo(14,16,14,8); c.lineTo(14,-2);
    c.quadraticCurveTo(14,-14,4,-14); c.closePath();
    c.fillStyle=bodyColor; c.fill();
    c.beginPath();
    c.moveTo(6,-14); c.lineTo(14,-2); c.quadraticCurveTo(14,8,8,14); c.lineTo(6,14);
    c.quadraticCurveTo(10,4,10,-8); c.closePath();
    c.fillStyle=shadowColor; c.fill();

    // Visor
    c.beginPath(); c.ellipse(-2,-8,9,6,0.15,0,Math.PI*2); c.fillStyle='#7de8ff'; c.fill();
    c.beginPath(); c.ellipse(-5,-10,4,2.5,-0.3,0,Math.PI*2); c.fillStyle='rgba(255,255,255,0.45)'; c.fill();

    // Legs
    c.fillStyle=bodyColor;
    c.beginPath(); c.roundRect(-9,12,7,9,3); c.fill();
    c.beginPath(); c.roundRect(2,12,7,9,3); c.fill();
    c.fillStyle=shadowColor;
    c.beginPath(); c.roundRect(-1,12,3,9,2); c.fill();

    // Flame
    const flameH=(moving?18:9)+Math.random()*6;
    const fg=c.createLinearGradient(0,18,0,18+flameH);
    fg.addColorStop(0,puRapid>0?'rgba(255,200,0,0.95)':'rgba(0,220,255,0.95)');
    fg.addColorStop(0.5,puRapid>0?'rgba(255,100,0,0.6)':'rgba(100,180,255,0.6)');
    fg.addColorStop(1,'rgba(0,0,0,0)');
    c.beginPath(); c.moveTo(-5,18); c.quadraticCurveTo(0,18+flameH+5,5,18); c.fillStyle=fg; c.fill();

    // Aim line
    c.setLineDash([4,10]); c.lineWidth=1;
    c.strokeStyle='rgba(0,210,255,0.2)';
    c.beginPath(); c.moveTo(0,-ship.r-4); c.lineTo(0,-Math.max(gW,gH)); c.stroke();
    c.setLineDash([]);
    c.restore();
  }

  function updateHUD(){
    document.getElementById('game-score-val').textContent=score;
    if(score>hiScore){ hiScore=score; localStorage.setItem('cosmo_game_hi',hiScore); }
    document.getElementById('game-hiscore-val').textContent=hiScore;
    document.getElementById('game-wave-val').textContent=wave;
    const ld=document.getElementById('game-lives-display');
    ld.innerHTML='';
    for(let i=0;i<lives;i++) ld.innerHTML+='<span style="font-size:18px;">🚀</span>';
    for(let i=lives;i<5;i++) ld.innerHTML+='<span style="font-size:18px;opacity:0.15;">🚀</span>';
  }

  function updateComboHUD(){
    const cd=document.getElementById('game-combo-display');
    const cv=document.getElementById('game-combo-val');
    if(combo>1){ cd.style.display=''; cv.textContent=`x${combo}`; }
    else { cd.style.display='none'; }
  }

  function updatePUDisplay(){
    const sEl=document.getElementById('pu-shield'); const rEl=document.getElementById('pu-rapid'); const bEl=document.getElementById('pu-bomb');
    sEl.classList.toggle('active',puShield>0);
    rEl.classList.toggle('active',puRapid>0);
    bEl.classList.toggle('active',puBomb>0);
  }

  function showWaveBanner(text,sub=''){
    const ws=document.getElementById('game-wave-screen');
    const wt=document.getElementById('game-wave-text');
    const wsub=document.getElementById('game-wave-sub');
    ws.style.display='flex';
    wt.textContent=text; wt.style.opacity='1';
    wsub.textContent=sub; wsub.style.opacity=sub?'1':'0';
    setTimeout(()=>{ wt.style.opacity='0'; wsub.style.opacity='0'; setTimeout(()=>ws.style.display='none',350); }, 2000);
  }

  function endGame(){
    gameRunning=false; gameOver=true;
    const xpEarned=Math.floor(score/8)+wave*8+maxCombo*3;
    const acc=totalShots>0?Math.round(totalKills/totalShots*100):0;
    setTimeout(()=>{
      document.getElementById('game-over-screen').style.display='flex';
      document.getElementById('game-over-score').textContent=score;
      document.getElementById('game-over-hiscore').textContent=hiScore;
      document.getElementById('game-over-stats').innerHTML=
        `Хвиля досягнута: ${wave} &nbsp;|&nbsp; Знищено: ${totalKills} &nbsp;|&nbsp; Макс. комбо: x${maxCombo}<br>Точність: ${acc}%`;
      document.getElementById('game-over-xp').textContent=`+${xpEarned} XP зароблено!`;
      if(typeof addXP==='function') addXP(xpEarned,'Метеоритна Атака');
    }, 900);
  }

  hiScore=parseInt(localStorage.getItem('cosmo_game_hi'))||0;
})();

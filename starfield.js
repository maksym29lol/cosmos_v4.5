// ── STARFIELD ANIMATION ──
let globalStarSpeed = 1;
(function(){
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  function makeStars(){
    stars=[];
    const count = Math.floor((canvas.width*canvas.height)/4000);
    for(let i=0;i<count;i++){
      stars.push({
        x:Math.random()*canvas.width,y:Math.random()*canvas.height,
        r:Math.random()*1.2+.2,
        a:Math.random(),da:(Math.random()-.5)*.008,
        baseSpeed:Math.random()*.15+.05
      });
    }
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(s=>{
      s.a+=s.da;
      if(s.a<=0||s.a>=1)s.da*=-1;
      s.y -= (s.baseSpeed * globalStarSpeed);
      if(s.y<0){s.y=canvas.height;s.x=Math.random()*canvas.width;}
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,230,255,${s.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize();makeStars();draw();
  window.addEventListener('resize',()=>{resize();makeStars();});
})();

function updateStarSpeed(val) {
  globalStarSpeed = parseFloat(val);
}

function changeThemeColor(hex) {
  document.documentElement.style.setProperty('--c1', hex);
  localStorage.setItem('cosmo_theme', hex);
}

// ── LOCK ───────────────────────────────────────────────────────────────────
let pinBuf='',pinMode='verify';

// ── HAPTIC FEEDBACK ────────────────────────────────────────────────────────
function haptic(type){
  // Try Vibration API (Android Chrome)
  if(navigator.vibrate){
    if(type==='tap')navigator.vibrate(25);
    else if(type==='error')navigator.vibrate([40,30,40]);
    else if(type==='unlock')navigator.vibrate([20,50,25,50,35]);
    return;
  }
  // Fallback: AudioContext click for devices without vibration API
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);
    if(type==='tap'){
      osc.frequency.value=180;gain.gain.setValueAtTime(.04,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.05);
    }else if(type==='error'){
      osc.frequency.value=120;gain.gain.setValueAtTime(.06,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);
    }else if(type==='unlock'){
      osc.frequency.value=220;gain.gain.setValueAtTime(.04,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+.15);
      gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);
    }
    osc.start(ctx.currentTime);osc.stop(ctx.currentTime+.25);
  }catch(e){}
}

// ── COIN ANIMATION ─────────────────────────────────────────────────────────
function animateCoin(){
  const coin=document.getElementById('lk-coin');if(!coin)return;
  coin.classList.remove('coin-anim');
  void coin.offsetWidth;
  coin.classList.add('coin-anim');
}

// ── PARTICLES ─────────────────────────────────────────────────────────────
let particlesRunning=false;
function startParticles(){
  const canvas=document.getElementById('lock-canvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth||window.innerWidth;
  canvas.height=canvas.offsetHeight||window.innerHeight;
  const particles=Array.from({length:38},()=>({
    x:Math.random()*canvas.width,
    y:canvas.height+Math.random()*100,
    r:Math.random()*3+1.2,
    speed:Math.random()*.7+.35,
    opacity:Math.random()*.5+.15,
    drift:(Math.random()-.5)*.3
  }));
  particlesRunning=true;
  function draw(){
    if(!particlesRunning)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(212,175,55,${p.opacity})`;ctx.fill();
      p.y-=p.speed;p.x+=p.drift;
      if(p.y<-10){p.y=canvas.height+10;p.x=Math.random()*canvas.width;}
    });
    requestAnimationFrame(draw);
  }
  draw();
}
function stopParticles(){particlesRunning=false;const c=document.getElementById('lock-canvas');if(c){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);}}

// ── PIN LENGTH ─────────────────────────────────────────────────────────────
function getPinLen(){return D.settings.pin?D.settings.pin.length:4;}
function setupPinDots(){
  const len=getPinLen();
  for(let i=0;i<6;i++){
    const d=document.getElementById('pd'+i);
    if(d)d.style.display=i<len?'':'none';
  }
}

function initLock(){
  if(!D.settings.pin||D.settings.pinEnabled===false){unlock();return;}
  pinBuf='';pinMode='verify';
  setupPinDots();
  updateDots();
  startParticles();
  document.querySelectorAll('.pkey[data-k]').forEach(el=>{
    el.addEventListener('click',()=>{
      const len=getPinLen();
      if(pinBuf.length<len){
        pinBuf+=el.dataset.k;
        haptic('tap');
        animateCoin();
        updateDots();
        if(pinBuf.length===len)setTimeout(checkPin,120);
      }
    });
  });
  document.getElementById('pdel').addEventListener('click',()=>{
    if(pinBuf.length){pinBuf=pinBuf.slice(0,-1);updateDots();document.getElementById('pin-err').textContent='';haptic('tap');}
  });
}
function updateDots(cls=''){
  const len=getPinLen();
  for(let i=0;i<len;i++){const d=document.getElementById('pd'+i);if(d)d.className='pd'+(i<pinBuf.length?' on':'')+(cls?' '+cls:'');}
}
function checkPin(){
  if(pinBuf===D.settings.pin){haptic('unlock');doRippleUnlock();}
  else{
    haptic('error');
    updateDots('err');
    document.getElementById('pin-err').textContent='PIN errato. Riprova.';
    setTimeout(()=>{pinBuf='';updateDots();document.getElementById('pin-err').textContent='';},1000);
  }
}
function doRippleUnlock(){
  const ov=document.getElementById('ripple-overlay');
  const fd=document.getElementById('lock-fadeout');
  ov.style.display='block';ov.innerHTML='';
  const circle=document.createElement('div');
  circle.className='ripple-circle';
  const size=Math.max(window.innerWidth,window.innerHeight)*2.2;
  circle.style.cssText=`width:${size}px;height:${size}px;left:${window.innerWidth/2-size/2}px;top:${window.innerHeight/2-size/2}px;`;
  ov.appendChild(circle);
  // Phase 1: ripple expands (0-750ms)
  // Phase 2: fade to black starts at 600ms
  setTimeout(()=>{
    fd.style.opacity='1';
  },600);
  // Phase 3: swap screens at 1000ms (under the black overlay)
  setTimeout(()=>{
    stopParticles();
    unlock();
  },1000);
  // Phase 4: fade black out revealing app (1050ms)
  setTimeout(()=>{
    ov.style.display='none';ov.innerHTML='';
    fd.style.transition='opacity .5s cubic-bezier(.4,0,.2,1)';
    fd.style.opacity='0';
  },1050);
}
function unlock(){
  document.getElementById('lock').style.display='none';
  document.getElementById('app').style.display='flex';
  showScr('dashboard');renderSettings();
  if(typeof gapi!=='undefined'&&typeof google!=='undefined'){
    setTimeout(driveInit,500);
  }else{
    window.addEventListener('load',()=>setTimeout(driveInit,500));
  }
  setTimeout(showOnboarding,600);
}

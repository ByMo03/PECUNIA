// ── TOUR STEPS ─────────────────────────────────────────────────────────────
// To update: add/remove/edit steps in this array only
const TOUR_STEPS=[
  {id:'dashboard',title:'Dashboard',
   desc:'La schermata principale mostra il patrimonio netto, entrate e uscite del mese e il budget.',
   selector:'#scr-dashboard .bal-card',screen:'dashboard'},
  {id:'accounts',title:'Conti',
   desc:'Vedi tutti i tuoi conti con il saldo aggiornato. Tocca il chip + per aggiungerne uno nuovo.',
   selector:'#d-accs',screen:'dashboard'},
  {id:'fab',title:'Aggiungi transazione',
   desc:'Il pulsante + in basso a destra apre il menu per aggiungere spese, entrate o trasferimenti.',
   selector:'#fab',screen:'dashboard'},
  {id:'transactions',title:'Movimenti',
   desc:'Tutte le transazioni. Filtra per tipo, cerca con la lente, naviga tra i mesi con le frecce.',
   selector:'#scr-transactions .fchips',screen:'transactions'},
  {id:'stats',title:'Statistiche',
   desc:'Grafici per settimana, mese o anno. Seleziona un conto specifico dal menu a tendina.',
   selector:'.prd-sel',screen:'stats'},
  {id:'charts',title:'Grafici disponibili',
   desc:'Spese per categoria, entrate vs uscite, andamento saldo e confronto con il periodo precedente.',
   selector:'#ch-pie',screen:'stats'},
  {id:'groups',title:'Gruppi e Debiti',
   desc:'Tieni traccia di chi deve cosa a chi. Crea gruppi per dividere spese, registra debiti semplici.',
   selector:'.fchip[data-gt="groups"]',screen:'groups'},
  {id:'calculator',title:'Calcolatrice',
   desc:'Il tasto accanto al campo importo apre una calcolatrice. Calcola ad esempio 10x4 e il risultato va nel campo.',
   selector:'#fab',screen:'dashboard'},
  {id:'settings',title:'Impostazioni',
   desc:'Gestisci conti, categorie, rubrica, budget, valuta, PIN e backup su Google Drive.',
   selector:'#ni-settings',screen:'settings'},
  {id:'drive',title:'Google Drive',
   desc:"Connetti Google Drive per salvare automaticamente tutti i dati. L'icona in alto mostra lo stato sync.",
   selector:'#drive-status',screen:'settings'},
];

// ── TOUR STATE ──────────────────────────────────────────────────────────────
let tourStep=0,tourActive=false;

function showOnboarding(){
  const needTour=!D.tour||(!D.tour.completed&&!D.tour.skipped);
  // pinEnabled is set in migration for existing users — only undefined for brand new installs
  const needPin=D.settings.pinEnabled===undefined;
  if(needTour){
    document.getElementById('ovl-onboarding').style.display='flex';
    const tb=document.getElementById('onb-tour-box');if(tb)tb.style.display='';
    const pb=document.getElementById('onb-pin-box');if(pb)pb.style.display='none';
  }else if(needPin){
    document.getElementById('ovl-onboarding').style.display='flex';
    const tb=document.getElementById('onb-tour-box');if(tb)tb.style.display='none';
    const pb=document.getElementById('onb-pin-box');if(pb)pb.style.display='';
  }else{
    // Nothing to show — make sure overlay is hidden
    document.getElementById('ovl-onboarding').style.display='none';
  }
}
function startTour(){
  document.getElementById('ovl-onboarding').style.display='none';
  tourStep=0;tourActive=true;
  document.getElementById('tour-overlay').classList.add('active');
  showTourStep();
}
function skipTour(){
  document.getElementById('tour-overlay').classList.remove('active');
  tourActive=false;
  if(!D.tour)D.tour={};
  D.tour.skipped=true;
  saveData();
  if(D.settings.pinEnabled===undefined){
    const tb=document.getElementById('onb-tour-box');if(tb)tb.style.display='none';
    const pb=document.getElementById('onb-pin-box');if(pb)pb.style.display='';
  }else{
    document.getElementById('ovl-onboarding').style.display='none';
  }
}
function tourNext(){
  if(tourStep<TOUR_STEPS.length-1){tourStep++;showTourStep();}
  else finishTour();
}
function tourPrev(){
  if(tourStep>0){tourStep--;showTourStep();}
}
function finishTour(){
  document.getElementById('tour-overlay').classList.remove('active');
  tourActive=false;
  if(!D.tour)D.tour={};
  D.tour.completed=true;D.tour.skipped=false;
  saveData();
  toast('Tour completato! Ritrovi la guida nelle Impostazioni.');
  setTimeout(showPinOnboarding,500);
}
function showTourStep(){
  const step=TOUR_STEPS[tourStep];if(!step)return;
  if(step.screen&&step.screen!==curScr)showScr(step.screen);
  const pct=((tourStep+1)/TOUR_STEPS.length*100).toFixed(0);
  document.getElementById('tour-progress-fill').style.width=pct+'%';
  document.getElementById('tour-step-lbl').textContent=(tourStep+1)+' di '+TOUR_STEPS.length;
  document.getElementById('tour-title').textContent=step.title;
  document.getElementById('tour-desc').textContent=step.desc;
  document.getElementById('tour-prev-btn').style.opacity=tourStep===0?'0.3':'1';
  document.getElementById('tour-prev-btn').disabled=tourStep===0;
  document.getElementById('tour-next-btn').textContent=tourStep===TOUR_STEPS.length-1?'Fine':'Avanti';
  setTimeout(()=>positionTourSpotlight(step),350);
}
function positionTourSpotlight(step){
  const el=document.querySelector(step.selector);
  const spl=document.getElementById('tour-spotlight');
  const tip=document.getElementById('tour-tooltip');
  if(!el){spl.style.display='none';positionTooltipCenter(tip);return;}
  spl.style.display='block';
  const r=el.getBoundingClientRect();
  const pad=20;
  const cx=r.left+r.width/2;
  const cy=r.top+r.height/2;
  const radius=Math.max(r.width,r.height)/2+pad;
  const size=radius*2;
  spl.style.width=size+'px';spl.style.height=size+'px';
  spl.style.left=(cx-radius)+'px';spl.style.top=(cy-radius)+'px';
  spl.style.boxShadow='0 0 0 9999px rgba(0,0,0,.75),0 0 '+pad+'px '+(pad/2)+'px rgba(0,0,0,.25)';
  const tipH=150;
  const tipW=Math.min(300,window.innerWidth-32);
  const spaceBelow=window.innerHeight-(cy+radius+16);
  const spaceAbove=cy-radius-16;
  let tipTop=spaceBelow>=tipH||spaceBelow>=spaceAbove?cy+radius+14:cy-radius-tipH-14;
  let tipLeft=Math.max(16,Math.min(cx-tipW/2,window.innerWidth-tipW-16));
  tipTop=Math.max(16,Math.min(tipTop,window.innerHeight-tipH-16));
  tip.style.cssText=`left:${tipLeft}px;top:${tipTop}px;width:${tipW}px;animation:none;`;
  void tip.offsetWidth;
  tip.style.animation='tourFadeIn .25s ease forwards';
}
function positionTooltipCenter(tip){
  const tipW=Math.min(300,window.innerWidth-32);
  tip.style.cssText=`left:${(window.innerWidth-tipW)/2}px;top:${(window.innerHeight-180)/2}px;width:${tipW}px;`;
}
function renderGuideSub(){
  const b=document.getElementById('sub-guide-body');
  b.innerHTML='<div class="set-list" style="margin:14px">'+
    TOUR_STEPS.map((s,i)=>`<div class="guide-step">
      <div class="guide-step-num">Step ${i+1} di ${TOUR_STEPS.length}</div>
      <div class="guide-step-title">${s.title}</div>
      <div class="guide-step-desc">${s.desc}</div>
    </div>`).join('')+
  '</div>';
}
function animateCounter(elId,targetVal){
  const el=document.getElementById(elId);if(!el)return;
  const dur=500;const start=Date.now();
  function tick(){
    const p=Math.min((Date.now()-start)/dur,1);
    const e=1-Math.pow(1-p,3);
    el.textContent=fmt(targetVal*e);
    if(p<1)requestAnimationFrame(tick);
    else el.textContent=fmt(targetVal);
  }
  requestAnimationFrame(tick);
}

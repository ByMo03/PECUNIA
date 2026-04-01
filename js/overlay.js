// ── OVERLAY HELPERS ────────────────────────────────────────────────────────
function openOvl(id){document.getElementById(id).classList.add('open');}
function closeOvl(id){document.getElementById(id).classList.remove('open');}
function ovlClick(e,id){if(e.target===document.getElementById(id))closeOvl(id);}
function confirm2(ttl,msg,cb,cbCancel){
  document.getElementById('conf-ttl').textContent=ttl;
  document.getElementById('conf-msg').textContent=msg;
  const ok=document.getElementById('conf-ok');
  ok.onclick=()=>{closeOvl('ovl-conf');cb();};
  const cancel=document.getElementById('conf-cancel');
  if(cancel)cancel.onclick=()=>{closeOvl('ovl-conf');if(cbCancel)cbCancel();};
  openOvl('ovl-conf');
}

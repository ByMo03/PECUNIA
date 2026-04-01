// ── CONTACTS / RUBRICA ─────────────────────────────────────────────────────
function getOrAddContact(name){
  name=name.trim();if(!name)return null;
  if(!D.contacts)D.contacts=[];
  let c=D.contacts.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!c){c={id:uid(),name,phone:'',notes:''};D.contacts.push(c);saveData();}
  return c;
}
function filterContacts(inputId,listId){
  const q=document.getElementById(inputId).value.trim().toLowerCase();
  const list=document.getElementById(listId);if(!list)return;
  if(!q){list.innerHTML='';return;}
  const matches=(D.contacts||[]).filter(c=>c.name.toLowerCase().includes(q)).slice(0,6);
  list.innerHTML=matches.map(c=>`<div class="person-chip" onclick="selectContact('${inputId}','${c.name}','${listId}')"><span class="person-chip-nm">${c.name}</span></div>`).join('');
}
function selectContact(inputId,name,listId){
  document.getElementById(inputId).value=name;
  document.getElementById(listId).innerHTML='';
  if(inputId==='grp-member-inp')addGrpMember();
}

// ── CONTACTS / RUBRICA SUB ────────────────────────────────────────────────
let contactEditId=null;
function renderContactsSub(){
  const b=document.getElementById('sub-contacts-body');
  const contacts=D.contacts||[];
  if(!contacts.length){
    b.innerHTML='<div class="empty"><div class="empty-ic">📒</div><div class="empty-ttl">Nessun contatto</div><div class="empty-sub">Aggiungi contatti dalla rubrica</div></div>';
    return;
  }
  const sorted=[...contacts].sort((a,b)=>a.name.localeCompare(b.name));
  b.innerHTML='<div class="set-list" style="margin:14px">'+sorted.map(c=>`
    <div class="item-row" onclick="openContactSh('${c.id}')">
      <div class="item-ic" style="background:var(--wrn-g);font-size:20px">👤</div>
      <div class="item-tx">
        <div class="item-nm">${c.name}</div>
        <div class="item-sb">${c.phone?'📞 '+c.phone:''}${c.phone&&c.notes?' · ':''}${c.notes||(!c.phone?'Nessuna nota':'')}</div>
      </div>
      <div style="color:var(--tt);font-size:18px">›</div>
    </div>`).join('')+'</div>';
}
function openContactSh(id=null){
  contactEditId=id;
  const c=id?(D.contacts||[]).find(x=>x.id===id):null;
  document.getElementById('sh-contact-ttl').textContent=id?'Modifica contatto':'Nuovo contatto';
  document.getElementById('contact-del-btn').style.display=id?'':'none';
  document.getElementById('contact-name').value=c?c.name:'';
  document.getElementById('contact-phone').value=c?c.phone||'':'';
  document.getElementById('contact-notes').value=c?c.notes||'':'';
  openOvl('ovl-contact');
}
function saveContact(){
  const name=document.getElementById('contact-name').value.trim();
  if(!name){toast('⚠️ Inserisci un nome');return;}
  const phone=document.getElementById('contact-phone').value.trim();
  const notes=document.getElementById('contact-notes').value.trim();
  if(!D.contacts)D.contacts=[];
  if(contactEditId){
    const c=D.contacts.find(x=>x.id===contactEditId);
    if(c)Object.assign(c,{name,phone,notes});
  }else{
    D.contacts.push({id:uid(),name,phone,notes});
  }
  saveData();closeOvl('ovl-contact');
  if(curSub==='sub-contacts')renderContactsSub();
  renderSettings();
  toast(contactEditId?'✅ Contatto aggiornato':'✅ Contatto aggiunto');
}
function delContact(){
  confirm2('Elimina contatto','Il contatto verrà rimosso dalla rubrica.',()=>{
    D.contacts=D.contacts.filter(x=>x.id!==contactEditId);
    saveData();closeOvl('ovl-contact');
    renderContactsSub();renderSettings();
    toast('🗑️ Contatto eliminato');
  });
}

// ── PROFILE / ANAGRAFICA ──────────────────────────────────────────────────
function renderProfileSub(){
  const b=document.getElementById('sub-profile-body');
  const p=D.profile||{};
  b.innerHTML=`<div class="fs">
    <div style="font-size:13px;color:var(--ts);line-height:1.5">Il tuo nome verrà usato nei gruppi per identificarti automaticamente.</div>
    <div class="fg"><div class="flbl">Nome</div><input type="text" class="fi" id="profile-fn" placeholder="Mario" value="${p.firstName||''}"></div>
    <div class="fg"><div class="flbl">Cognome</div><input type="text" class="fi" id="profile-ln" placeholder="Rossi" value="${p.lastName||''}"></div>
    <div class="fg"><div class="flbl">Telefono (opzionale)</div><input type="tel" class="fi" id="profile-ph" placeholder="+39 ..." value="${p.phone||''}"></div>
    <button class="btn btn-p" onclick="saveProfile()">Salva</button>
  </div>`;
}
function saveProfile(){
  const fn=document.getElementById('profile-fn').value.trim();
  const ln=document.getElementById('profile-ln').value.trim();
  const ph=document.getElementById('profile-ph').value.trim();
  if(!fn&&!ln){toast('⚠️ Inserisci almeno il nome');return;}
  if(!D.profile)D.profile={};
  D.profile.firstName=fn;
  D.profile.lastName=ln;
  D.profile.phone=ph;
  D.profile.profileBannerDismissed=true;
  saveData();
  renderSettings();
  if(curScr==='dashboard')renderDash();
  toast('✅ Profilo salvato');
  goBack();
}

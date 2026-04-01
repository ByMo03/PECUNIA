// ── GOOGLE DRIVE ───────────────────────────────────────────────────────────
let driveConnected=false,driveFileId=null,driveTokenClient=null,driveSyncTimer=null,driveTokenExpiry=0,driveRefreshTimer=null;
const DRIVE_FILE_ID_KEY='finanza_drive_file_id';
const DRIVE_TOKEN_EXPIRY_KEY='finanza_drive_token_expiry';

// Internal token storage
let _driveAccessToken=null;
function driveGetToken(){
  const t=gapi.client.getToken();
  return t?t.access_token:(_driveAccessToken||null);
}

function driveInit(){
  driveFileId=localStorage.getItem(DRIVE_FILE_ID_KEY)||null;
  gapi.load('client',async()=>{
    try{
      await gapi.client.init({});
      await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    }catch(e){console.warn('gapi init warning:',e);}
    // Init token client
    driveTokenClient=google.accounts.oauth2.initTokenClient({
      client_id:CLIENT_ID,
      scope:DRIVE_SCOPE,
      callback:(resp)=>{
        if(resp.error){
          if(resp.error==='interaction_required'||resp.error==='login_required'||resp.error==='access_denied'){
            driveConnected=false;_driveAccessToken=null;driveSetStatus('disconnected');renderSettings();
          }else{driveSetStatus('error');}
          return;
        }
        _driveAccessToken=resp.access_token;
        driveConnected=true;
        const expiry=Date.now()+(resp.expires_in||3600)*1000;
        driveTokenExpiry=expiry;
        localStorage.setItem('finanza_drive_token',resp.access_token);
        localStorage.setItem(DRIVE_TOKEN_EXPIRY_KEY,String(expiry));
        driveSetStatus('connected');
        renderSettings();
        scheduleTokenRefresh(3000);
        setTimeout(()=>{driveFirstSync();migrateExistingReceipts();processPendingDeletions();},500);
      }
    });
    // Check stored token
    const storedToken=localStorage.getItem('finanza_drive_token');
    const storedExpiry=parseInt(localStorage.getItem(DRIVE_TOKEN_EXPIRY_KEY)||'0');
    if(storedToken){
      const remaining=storedExpiry-Date.now();
      if(remaining>60000){
        gapi.client.setToken({access_token:storedToken});
        _driveAccessToken=storedToken;
        driveConnected=true;driveTokenExpiry=storedExpiry;
        driveSetStatus('connected');renderSettings();
        driveSyncNow();
        const refreshIn=Math.max(0,Math.min(remaining-300000,3000000));
        scheduleTokenRefresh(refreshIn/1000);
      }else{
        driveSetStatus('syncing');
        driveSilentRefresh();
      }
    }
  });
}

function scheduleTokenRefresh(inSeconds){
  clearTimeout(driveRefreshTimer);
  driveRefreshTimer=setTimeout(()=>{
    if(driveConnected)driveSilentRefresh();
  },inSeconds*1000);
}

function driveSilentRefresh(){
  if(!driveTokenClient)return;
  try{
    // prompt:'' means no UI — fails silently if session expired
    driveTokenClient.requestAccessToken({prompt:''});
  }catch(e){
    console.warn('Silent refresh failed:',e);
    driveConnected=false;driveSetStatus('disconnected');renderSettings();
  }
}

function driveStatusClick(){
  if(driveConnected){
    confirm2('Google Drive','Vuoi disconnettere il backup su Google Drive?',()=>{
      driveDisconnect();
    });
  }else{
    // Update icon immediately to show feedback
    driveSetStatus('syncing');
    setTimeout(driveConnect,100);
  }
}

function driveConnect(){
  if(driveTokenClient){
    driveTokenClient.requestAccessToken({prompt:'consent'});
    return;
  }
  // Not ready yet — init and retry
  driveSetStatus('syncing');
  driveInit();
  let attempts=0;
  const retry=setInterval(()=>{
    attempts++;
    if(driveTokenClient){
      clearInterval(retry);
      driveTokenClient.requestAccessToken({prompt:'consent'});
    }else if(attempts>=24){
      clearInterval(retry);
      driveSetStatus('disconnected');
      toast('⚠️ Script Google non disponibili. Controlla la connessione e ricarica la pagina.');
    }
  },500);
}

function driveDisconnect(){
  google.accounts.oauth2.revoke(gapi.client.getToken()?.access_token||'',()=>{});
  gapi.client.setToken(null);
  driveConnected=false;driveFileId=null;_driveAccessToken=null;
  clearTimeout(driveRefreshTimer);
  localStorage.removeItem('finanza_drive_token');
  localStorage.removeItem(DRIVE_TOKEN_EXPIRY_KEY);
  localStorage.removeItem(DRIVE_FILE_ID_KEY);
  driveSetStatus('disconnected');
  renderSettings();
  toast('☁️ Drive disconnesso');
}

function driveSetStatus(state){
  const el=document.getElementById('drive-status');
  if(!el)return;
  el.className='';el.classList.add(state);
  const pending=(D&&D.pendingDeletions&&D.pendingDeletions.length)||0;
  const badge=pending>0?` <span style="background:var(--exp);color:#fff;border-radius:50%;font-size:9px;padding:1px 4px;font-weight:800;">${pending}</span>`:'';
  const labels={connected:'☁️ Sync',syncing:'<span class="spin">↻</span> Sync',error:'⚠️ Drive',disconnected:'☁️ Drive'};
  el.innerHTML=(labels[state]||'☁️ Drive')+badge;
}

function driveSyncDebounced(){
  if(!driveConnected)return;
  clearTimeout(driveSyncTimer);
  driveSyncTimer=setTimeout(driveSyncNow,1500);
}

async function driveSyncNow(){
  if(!driveConnected)return;
  driveSetStatus('syncing');
  try{
    const token=driveGetToken();
    if(!token){driveSetStatus('error');return;}
    localStorage.setItem('finanza_drive_token',token.access_token);
    const content=JSON.stringify(D,null,2);
    const blob=new Blob([content],{type:'application/json'});
    if(driveFileId){
      // Update existing file
      const form=new FormData();
      form.append('metadata',new Blob([JSON.stringify({name:DRIVE_FILENAME})],{type:'application/json'}));
      form.append('file',blob);
      const resp=await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`,{
        method:'PATCH',
        headers:{Authorization:'Bearer '+(token.access_token||token)},
        body:form
      });
      if(!resp.ok)throw new Error('Update failed: '+resp.status);
    }else{
      // Create new file
      const form=new FormData();
      form.append('metadata',new Blob([JSON.stringify({name:DRIVE_FILENAME,mimeType:'application/json'})],{type:'application/json'}));
      form.append('file',blob);
      const resp=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{
        method:'POST',
        headers:{Authorization:'Bearer '+(token.access_token||token)},
        body:form
      });
      if(!resp.ok)throw new Error('Create failed: '+resp.status);
      const data=await resp.json();
      driveFileId=data.id;
      localStorage.setItem(DRIVE_FILE_ID_KEY,driveFileId);
    }
    driveSetStatus('connected');
    toast('☁️ Salvato su Drive');
  }catch(e){
    // Check if it's an auth error (401) — try silent refresh
    if(e&&(e.status===401||String(e).includes('401')||String(e).includes('invalid_token'))){
      driveConnected=false;driveSetStatus('disconnected');
      toast('🔄 Sessione Drive scaduta — riconnessione in corso...');
      setTimeout(()=>{if(driveTokenClient)driveSilentRefresh();},800);
    }else{
      driveSetStatus('error');
      toast('❌ Errore sincronizzazione Drive');
    }
    console.error('Drive sync error:',e);
  }
}

async function driveFirstSync(){
  // On first connect, check if a backup already exists on Drive
  try{
    const token=driveGetToken();
    if(!token)return;
    // Search for existing file
    const fsResp=await gapi.client.drive.files.list({
      q:`name='${DRIVE_FILENAME}' and trashed=false`,
      fields:'files(id,name,modifiedTime)',
      spaces:'drive'
    });
    const files=fsResp.result.files;
    if(files&&files.length>0){
      const file=files[0];
      driveFileId=file.id;
      localStorage.setItem(DRIVE_FILE_ID_KEY,driveFileId);
      // Ask user if they want to restore
      confirm2('Backup trovato su Drive',
        `Trovato un backup del ${new Date(file.modifiedTime).toLocaleDateString('it-IT')}. Vuoi ripristinarlo? I dati attuali verranno sostituiti.`,
        async()=>{await driveRestore();}
      );
    }else{
      // No backup yet, create one
      driveSyncNow();
    }
  }catch(e){
    console.error('Drive firstSync error:',e);
    driveSyncNow();
  }
}

async function driveRestore(){
  try{
    driveSetStatus('syncing');
    const token=driveGetToken();
    if(!token||!driveFileId){toast('⚠️ Nessun file da ripristinare');return;}
    const resp=await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,{
      headers:{Authorization:'Bearer '+(token.access_token||token)}
    });
    if(!resp.ok)throw new Error('Download failed');
    const data=await resp.json();
    // Migrate data for compatibility
    D=migrateData(data);
    localStorage.setItem(SK,JSON.stringify(D));
    driveSetStatus('connected');
    toast('✅ Dati ripristinati da Drive');
    // Reload UI
    showScr('dashboard');
    renderSettings();
  }catch(e){
    driveSetStatus('error');
    toast('❌ Errore ripristino da Drive');
    console.error('Drive restore error:',e);
  }
}

// ── DRIVE RECEIPT DELETION ────────────────────────────────────────────────────
async function deleteFromDrive(fileId){
  try{
    const t=gapi.client.getToken();if(!t||!t.access_token)return false;
    const resp=await fetch('https://www.googleapis.com/drive/v3/files/'+fileId,{
      method:'DELETE',headers:{Authorization:'Bearer '+t.access_token}
    });
    return resp.ok||resp.status===204||resp.status===404;
  }catch(e){console.warn('Drive delete error:',e);return false;}
}
function queueDriveDelete(fileId){
  if(!fileId)return;
  if(!D.pendingDeletions)D.pendingDeletions=[];
  if(!D.pendingDeletions.includes(fileId))D.pendingDeletions.push(fileId);
}
async function processPendingDeletions(){
  if(!driveConnected||!D.pendingDeletions||!D.pendingDeletions.length)return;
  const toDelete=[...D.pendingDeletions];
  let done=0;
  for(const fid of toDelete){
    const ok=await deleteFromDrive(fid);
    if(ok){D.pendingDeletions=D.pendingDeletions.filter(id=>id!==fid);done++;}
  }
  if(done>0){saveData();driveSetStatus('connected');}
}
function getTxReceiptFileIds(tx){
  if(!tx||!tx.receipts)return[];
  return tx.receipts.map(r=>r.driveFileId).filter(Boolean);
}
function confirmDeleteReceiptsFromDrive(fileIds,onDone,onCancel){
  if(!fileIds||!fileIds.length){if(onDone)onDone();return;}
  const plural=fileIds.length>1?fileIds.length+' foto':'la foto';
  confirm2(
    'Elimina da Drive',
    'Vuoi eliminare anche '+plural+' da Google Drive?',
    ()=>{
      if(driveConnected){
        fileIds.forEach(fid=>deleteFromDrive(fid).then(ok=>{if(!ok)queueDriveDelete(fid);}));
      }else{
        fileIds.forEach(fid=>queueDriveDelete(fid));
        saveData();driveSetStatus('disconnected');
        toast('Eliminazione in coda per la prossima connessione Drive');
      }
      if(onDone)onDone();
    },
    ()=>{if(onCancel)onCancel();}
  );
}

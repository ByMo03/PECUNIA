// ── RECEIPTS ────────────────────────────────────────────────────────────────
window._pendingReceipts=[];

// ── RECEIPT NAME GENERATOR ────────────────────────────────────────────────
function buildReceiptName(txCtx, fileExt){
  // Get transaction context for naming: Date_Type_Account_Amount
  let date=today(),typeStr='Allegato',accName='',amtStr='';
  if(txCtx==='tx'){
    const dateEl=document.getElementById('tx-date');
    if(dateEl&&dateEl.value)date=dateEl.value;
    const typeEl=document.querySelector('#ovl-tx .ty-btn.act');
    if(typeEl)typeStr=typeEl.textContent.includes('Spesa')?'Uscita':'Entrata';
    const accEl=document.querySelector('#tx-accs .as-it.sel');
    if(accEl){const nm=accEl.querySelector('.as-nm');if(nm)accName=nm.textContent.replace(/\s+/g,'');}
    const amtEl=document.getElementById('tx-amt');
    if(amtEl&&amtEl.value)amtStr=parseFloat(amtEl.value).toFixed(2);
  }
  const parts=[date,typeStr,accName,amtStr].filter(Boolean);
  return parts.join('_')+(fileExt?'.'+fileExt:'');
}

// ── COMPRESS IMAGE ─────────────────────────────────────────────────────────
async function compressImage(dataUrl, maxW, quality){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      let w=img.width,h=img.height;
      if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      res(canvas.toDataURL('image/jpeg',quality));
    };
    img.src=dataUrl;
  });
}

// ── RENDER RECEIPT THUMBNAILS ──────────────────────────────────────────────
function renderReceiptThumbs(ctx, receipts){
  const row=document.getElementById(ctx+'-rcpts');
  if(!row)return;
  row.innerHTML='';
  (receipts||[]).forEach((r,i)=>{
    const wrap=document.createElement('div');
    wrap.style.position='relative';
    wrap.className=r.uploading?'rcpt-uploading':'';
    if(r.type==='pdf'){
      const d=document.createElement('div');
      d.className='rcpt-thumb-pdf';
      d.innerHTML='<span>📄</span><span>PDF</span>';
      d.onclick=()=>viewReceipt(ctx,i);
      wrap.appendChild(d);
    }else{
      const src=r.dataUrl||'';
      const d=document.createElement('div');
      d.style.cssText='width:64px;height:64px;border-radius:10px;overflow:hidden;border:1.5px solid var(--bd);cursor:pointer;background:var(--sf2);display:flex;align-items:center;justify-content:center;font-size:22px;';
      if(src){const img=document.createElement('img');img.src=src;img.style.cssText='width:100%;height:100%;object-fit:cover;';d.appendChild(img);}
      else d.textContent='🖼️';
      d.onclick=()=>viewReceipt(ctx,i);
      wrap.appendChild(d);
    }
    if(r.uploading){
      const spin=document.createElement('div');
      spin.className='rcpt-spin';
      spin.innerHTML='<span class="rcpt-spin-icon">⟳</span>';
      wrap.appendChild(spin);
    }
    const del=document.createElement('div');
    del.style.cssText='position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:var(--exp);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;color:#fff;font-weight:800;z-index:2;';
    del.textContent='x';
    const ii=i;
    del.onclick=(e)=>{e.stopPropagation();removeReceipt(ctx,ii);};
    wrap.appendChild(del);
    row.appendChild(wrap);
  });
  const addBtn=document.createElement('div');
  addBtn.className='rcpt-add';addBtn.textContent='+';
  addBtn.onclick=()=>document.getElementById(ctx+'-rcpt-inp').click();
  row.appendChild(addBtn);
}

function removeReceipt(ctx,idx){
  if(ctx==='tx'&&txEditId){
    const tx=D.transactions.find(t=>t.id===txEditId);
    if(tx&&tx.receipts){
      const rcpt=tx.receipts[idx];
      const fileId=rcpt?rcpt.driveFileId:null;
      tx.receipts.splice(idx,1);
      saveData();renderReceiptThumbs(ctx,tx.receipts);
      if(fileId)confirmDeleteReceiptsFromDrive([fileId],()=>{saveData();driveSetStatus(driveConnected?'connected':'disconnected');});
    }
  }else{
    if(window._pendingReceipts)window._pendingReceipts.splice(idx,1);
    renderReceiptThumbs(ctx,window._pendingReceipts||[]);
  }
}

function viewReceipt(ctx,idx){
  let receipts=[];
  if(ctx==='tx'&&txEditId){const tx=D.transactions.find(t=>t.id===txEditId);receipts=tx?tx.receipts||[]:[]}
  else receipts=window._pendingReceipts||[];
  const r=receipts[idx];if(!r)return;
  if(r.driveFileId){
    // Open directly from Drive
    window.open('https://drive.google.com/file/d/'+r.driveFileId+'/view','_blank');
  }else if(r.dataUrl){
    if(r.type==='pdf'){
      const a=document.createElement('a');a.href=r.dataUrl;a.download=r.name||'ricevuta.pdf';a.click();
    }else{
      const w=window.open('','_blank');
      if(w){w.document.write('<html><body style="margin:0;background:#000"><img src="'+r.dataUrl+'" style="max-width:100%;max-height:100vh;display:block;margin:auto"></body></html>');w.document.close();}
    }
  }else{
    toast('Foto non disponibile');
  }
}

async function addReceipts(ctx, input){
  const files=Array.from(input.files);if(!files.length)return;
  if(!window._pendingReceipts)window._pendingReceipts=[];
  for(const file of files){
    const isPdf=file.type==='application/pdf';
    toast('Compressione in corso...');
    // Read file
    const rawDataUrl=await new Promise(res=>{
      const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(file);
    });
    // Compress images, keep PDFs as-is
    const dataUrl=isPdf?rawDataUrl:await compressImage(rawDataUrl,1200,0.8);
    // Build meaningful name
    const ext=isPdf?'pdf':'jpg';
    const name=buildReceiptName(ctx,ext);
    const rcpt={id:uid(),name,type:isPdf?'pdf':'image',dataUrl,driveFileId:null,uploading:false};
    // Add to list
    if(ctx==='tx'&&txEditId){
      const tx=D.transactions.find(t=>t.id===txEditId);
      if(tx){if(!tx.receipts)tx.receipts=[];tx.receipts.push(rcpt);renderReceiptThumbs(ctx,tx.receipts);}
    }else{
      window._pendingReceipts.push(rcpt);
      renderReceiptThumbs(ctx,window._pendingReceipts);
    }
    if(driveConnected){
      // Show spinner
      rcpt.uploading=true;
      renderReceiptThumbs(ctx,ctx==='tx'&&txEditId?D.transactions.find(t=>t.id===txEditId)?.receipts||[]:window._pendingReceipts||[]);
      await uploadReceiptToDrive(rcpt,name);
      rcpt.uploading=false;
      if(ctx==='tx'&&txEditId)saveData();
      renderReceiptThumbs(ctx,ctx==='tx'&&txEditId?D.transactions.find(t=>t.id===txEditId)?.receipts||[]:window._pendingReceipts||[]);
    }else{
      toast('Drive non connesso: foto salvata temporaneamente in locale');
    }
  }
  input.value='';
  toast('Allegati pronti');
}

async function uploadReceiptToDrive(rcpt, customName){
  try{
    const t=gapi.client.getToken();if(!t||!t.access_token)return false;const token=t;
    const folderId=await getDriveFolderId('Finanza/Ricevute');
    if(!folderId)return false;
    const blob=dataURLtoBlob(rcpt.dataUrl);
    const fileName=customName||rcpt.name||rcpt.id;
    const form=new FormData();
    form.append('metadata',new Blob([JSON.stringify({name:fileName,parents:[folderId]})],{type:'application/json'}));
    form.append('file',blob);
    const resp=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{
      method:'POST',headers:{Authorization:'Bearer '+(token.access_token||token)},body:form
    });
    if(resp.ok){
      const d=await resp.json();
      rcpt.driveFileId=d.id;
      delete rcpt.dataUrl; // Remove from JSON to keep it light
      delete rcpt.pendingMigration;
      return true;
    }
  }catch(e){console.error('Receipt upload error:',e);}
  return false;
}

// ── AUTO-MIGRATE EXISTING RECEIPTS ─────────────────────────────────────────
async function migrateExistingReceipts(){
  if(!driveConnected||D.receiptsMigrated)return;
  const toMigrate=[];
  D.transactions.forEach(tx=>{
    (tx.receipts||[]).forEach(r=>{
      if(r.pendingMigration&&r.dataUrl)toMigrate.push({tx,r});
    });
  });
  if(!toMigrate.length){D.receiptsMigrated=true;saveData();return;}
  toast('Migrazione foto su Drive in corso...');
  let done=0;
  for(const{tx,r} of toMigrate){
    const ok=await uploadReceiptToDrive(r,r.name||buildMigrationName(tx,r));
    if(ok)done++;
  }
  D.receiptsMigrated=true;
  saveData();
  if(done>0)toast('Migrate '+done+' foto su Drive');
}

function buildMigrationName(tx,r){
  const typeStr=tx.type==='expense'?'Uscita':'Entrata';
  const acc=getAcc(tx.accountId);
  const accName=(acc.name||'').replace(/\s+/g,'');
  const amtStr=parseFloat(tx.amount).toFixed(2);
  return tx.date+'_'+typeStr+'_'+accName+'_'+amtStr+(r.type==='pdf'?'.pdf':'.jpg');
}

async function getDriveFolderId(path){
  const t=gapi.client.getToken();if(!t||!t.access_token)return null;
  const parts=path.split('/');let parentId='root';
  for(const part of parts){
    const resp=await gapi.client.drive.files.list({
      q:`name='${part}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields:'files(id)'
    });
    if(resp.result.files&&resp.result.files.length>0){
      parentId=resp.result.files[0].id;
    }else{
      const cr=await gapi.client.drive.files.create({
        resource:{name:part,mimeType:'application/vnd.google-apps.folder',parents:[parentId]},
        fields:'id'
      });
      parentId=cr.result.id;
    }
  }
  return parentId;
}

function dataURLtoBlob(dataUrl){
  const arr=dataUrl.split(','),mime=arr[0].match(/:(.*?);/)[1];
  const bstr=atob(arr[1]);let n=bstr.length;const u8=new Uint8Array(n);
  while(n--)u8[n]=bstr.charCodeAt(n);
  return new Blob([u8],{type:mime});
}

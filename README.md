[README.md](https://github.com/user-attachments/files/26372837/README.md)
# 🪙 PECUNIA — Gestione Finanziaria Personale

> App web progressiva (PWA) per la gestione delle finanze personali. Single-file HTML, deployata su GitHub Pages con sincronizzazione automatica su Google Drive.

**🔗 Link app:** [https://bymo03.github.io/PECUNIA](https://bymo03.github.io/PECUNIA)

---

## 📋 Indice

- [Requisiti](#requisiti)
- [Primo avvio](#primo-avvio)
- [Schermata di blocco e PIN](#schermata-di-blocco-e-pin)
- [Dashboard](#dashboard)
- [Movimenti](#movimenti)
- [Statistiche](#statistiche)
- [Gruppi e Debiti](#gruppi-e-debiti)
- [Impostazioni](#impostazioni)
- [Google Drive](#google-drive)
- [Tour guidato e guida](#tour-guidato-e-guida)
- [Note tecniche](#note-tecniche)
- [Changelog](#changelog)

---

## Requisiti

- Browser moderno con supporto JavaScript (Chrome consigliato, sia mobile che desktop)
- Connessione internet per il backup su Google Drive
- Account Google per la sincronizzazione cloud (opzionale ma consigliato)
- L'app deve essere aperta tramite URL HTTPS — **non funziona aperta come file locale** (`file://`) per limitazioni di Google OAuth

---

## Primo avvio

Al primo avvio l'app propone due schermate di benvenuto in sequenza:

1. **Tour guidato** — scegli *"Inizia il tour"* per una visita guidata interattiva di tutte le funzioni, oppure *"Salta per ora"* per entrare direttamente nell'app. Il tour è sempre recuperabile da Impostazioni → Guida.

2. **Protezione PIN** — scegli se proteggere l'accesso con un PIN numerico. Puoi configurarlo o disattivarlo in qualsiasi momento da Impostazioni → Sicurezza.

---

## Schermata di blocco e PIN

La schermata di blocco protegge l'accesso all'app con un PIN a 4 o 6 cifre.

### Caratteristiche visive
- **Particelle dorate** fluttuanti sullo sfondo
- **Monetina animata** 🪙 che ruota ad ogni tasto premuto
- **Ripple dorato** all'sblocco con dissolvenza fluida verso l'app

### Feedback aptico
| Azione | Vibrazione |
|--------|-----------|
| Tasto premuto | Breve click |
| PIN errato | Pattern doppio |
| Sblocco | Pattern ascendente |

### Gestione PIN
- **PIN predefinito:** `1234`
- Cambio PIN: Impostazioni → Sicurezza → Modifica PIN
- Scegli tra **4 o 6 cifre** dalla stessa schermata
- **Disattivare il PIN:** Impostazioni → Sicurezza → toggle *PIN attivo*

---

## Dashboard

La schermata principale mostra una panoramica completa delle tue finanze.

### Elementi presenti
- **Patrimonio netto totale** — somma di tutti i conti
- **Entrate e uscite del mese corrente**
- **Budget mensile** — barra di avanzamento con percentuale di utilizzo (se impostato)
- **Risparmio mensile** — mostrato quando le spese sono sotto il budget
- **Conti** — chip scorrevoli con saldo aggiornato per ogni conto
- **Ultimi movimenti** — le transazioni più recenti

### Riordino conti
Tieni premuto a lungo su un chip conto per attivare la **modalità riordino**:
- Lo sfondo della riga cambia colore e appaiono le maniglie ☰ su ogni chip
- Trascina i chip nella posizione desiderata
- Tocca fuori dalla riga conti per uscire e salvare automaticamente
- L'ordine è salvato su Google Drive e persiste tra le sessioni
- La sezione Impostazioni → Conti mantiene sempre l'ordine originale di creazione

### Banner anagrafica
Se il profilo (nome e cognome) non è ancora compilato, appare un banner in cima che invita a completarlo. Serve principalmente per i Gruppi. Tocca il banner per andare direttamente alla sezione Anagrafica.

---

## Movimenti

Tutte le transazioni, filtrabili e navigabili per mese.

### Aggiungere una transazione
Tocca il pulsante **+** in basso a destra e scegli tra:
- **Spesa** — uscita da un conto
- **Entrata** — accredito su un conto
- **Trasferimento** — spostamento di denaro tra due conti (il patrimonio totale non cambia)

Per ogni transazione puoi inserire: importo, categoria, conto, data, note e allegati (foto/PDF dello scontrino).

### Calcolatrice integrata 🧮
Tocca l'icona 🧮 accanto al campo importo per aprire la calcolatrice. Puoi fare calcoli (es. `45 × 3`) e il risultato viene inserito automaticamente nel campo.

### Filtri disponibili
| Chip | Contenuto |
|------|-----------|
| Tutte | Tutte le transazioni (esclusi i transfer-in) |
| Uscite | Solo spese |
| Entrate | Solo entrate |
| ⇄ Trasferimenti | Solo trasferimenti |
| 🔄 Previste | Ricorrenti future del mese (toggle on/off) |

### Chip "🔄 Previste"
Attivando questo chip vengono mostrate le transazioni ricorrenti **non ancora generate** per il mese corrente, con bordo tratteggiato e label "Prevista". Vengono incluse anche nei totali della dashboard. Lo stato del toggle è persistente.

### Ricerca e filtri avanzati
Tocca 🔍 nell'header per aprire il pannello di ricerca con filtri per: testo, tipo, conto, categoria e intervallo di date.

### Badge allegati
Le transazioni con allegati mostrano una piccola icona 📎 accanto al nome della categoria.

### Ordine di visualizzazione
Le transazioni sono ordinate per **data discendente**, poi per **timestamp di inserimento** (la più recente appare per prima).

---

## Statistiche

Grafici e analisi delle tue finanze per periodo.

### Periodi disponibili
- **Settimana** — 7 giorni con dettaglio giornaliero
- **Mese** — suddiviso per settimane
- **Anno** — suddiviso per mesi

Naviga tra i periodi con le frecce ‹ ›.

### Filtro per conto
Seleziona un conto specifico dal menu a tendina per vedere le statistiche filtrate.

### Chip "🔄 Ricorrenti"
Se attivato, aggiunge ai grafici e ai totali le ricorrenti **future non ancora generate** del periodo selezionato. Utile per avere una previsione completa del mese.

### Grafici disponibili
| Grafico | Descrizione |
|---------|-------------|
| Spese per categoria | Grafico a ciambella con legenda e percentuali |
| Entrate vs Uscite | Barre affiancate per settimana/mese/anno |
| Andamento saldo | Linea del saldo nel tempo |
| Confronto periodo | Confronto con il periodo precedente (barre o linee) |
| Top categorie | Classifica delle categorie di spesa più usate |

---

## Gruppi e Debiti

Gestione delle spese condivise e dei debiti personali. Funziona solo come **strumento di calcolo e promemoria** — le transazioni nei conti vengono create solo quando sei direttamente coinvolto.

### Debiti semplici

**"Mi devono soldi"** (tu hai già pagato):
1. Crea il debito → si apre il picker per registrare subito l'**uscita** nel tuo conto
2. Quando la persona salda → si crea automaticamente un'**entrata**

**"Devo soldi a qualcuno"** (hai pagato loro):
1. Crea il debito → nessuna transazione immediata
2. Quando salda il tuo debito → si apre il picker per registrare l'**uscita**

### Gruppi (stile Tricount)

I gruppi permettono di dividere spese tra più persone e calcolare automaticamente chi deve cosa a chi.

**Creazione gruppo:**
- Il tuo nome (da Anagrafica) viene aggiunto automaticamente come primo membro
- Puoi rimuoverti se gestisci il gruppo per altri
- Scegli emoji, nome e aggiungi membri dalla rubrica o manualmente

**Aggiunta spesa:**
- Seleziona chi ha pagato, importo, divisione (uguale o personalizzata), data
- Se **sei tu il payer** → il picker si apre per registrare l'uscita nel tuo conto
- Se **non sei il payer** → nessuna transazione immediata

**Saldo:**
Quando si preme "Salda" su un pagamento dovuto:
- **Qualcuno ti paga** → entrata automatica con categoria "Rimborso"
- **Tu paghi qualcuno** → picker per registrare l'uscita
- **Due altri membri** → aggiorna solo i saldi del gruppo, nessuna transazione

**Riepilogo personale:**
In cima al dettaglio del gruppo vedi subito quanto ti devono o devi complessivamente.

---

## Impostazioni

### Profilo → Anagrafica
Nome, cognome e telefono. Il nome viene usato nei Gruppi per identificarti automaticamente.

### Finanze
| Sezione | Funzione |
|---------|----------|
| Conti | Aggiungi/modifica/elimina conti (con emoji, colore, saldo iniziale) |
| Categorie | Tutte le categorie sono modificabili — tocca qualsiasi categoria per cambiare nome ed emoji |
| Rubrica | Contatti salvati, usabili nei Gruppi e Debiti |
| Ricorrenti | Gestione delle spese/entrate automatiche |
| Budget mensile | Imposta un limite di spesa mensile |

### Ricorrenti — funzionalità
- **Titolo** libero + categoria (come le transazioni normali)
- **Frequenza:** ogni giorno, settimana, mese, anno
- **Giorno del mese** (opzionale, per mensili/annuali): seleziona dal calendario a griglia. Se il giorno non esiste nel mese (es. 31 febbraio), usa l'**ultimo giorno del mese** (standard Stripe/banche)
- Le transazioni generate prendono il titolo della ricorrente come descrizione

### Preferenze
- **Valuta** — cambia il simbolo della valuta (€, $, £, ...)

### Sicurezza
- **Modifica PIN** — cambia il PIN e la lunghezza (4 o 6 cifre)
- **Toggle PIN attivo** — disattiva il PIN per aprire l'app senza schermata di blocco

### Dati
| Azione | Descrizione |
|--------|-------------|
| Esporta CSV | Esporta tutte le transazioni in formato CSV |
| Importa CSV | Importa transazioni da un file CSV (duplicati esclusi automaticamente) |
| Esporta PDF | Genera un riepilogo finanziario in PDF |
| Cancella tutti i dati | Elimina tutti i dati locali (richiede conferma) |

### Google Drive
Backup automatico su Google Drive ad ogni modifica. Vedi sezione dedicata.

### Guida
- **Inizia tour guidato** — riparte il tour interattivo dall'inizio
- **Mini manuale** — elenco completo di tutti gli step del tour, consultabile offline

---

## Allegati (Foto e PDF)

Ogni transazione può avere allegati (scontrini, ricevute, PDF).

- **Compressione automatica** — le immagini vengono ridimensionate a max 1200px e compresse all'80% prima del caricamento
- **Salvate solo su Drive** — non nel JSON locale, per mantenere il file di backup leggero
- **Visualizzazione** — tocca il thumbnail per aprire il file direttamente su Google Drive
- **Se Drive non è connesso** — l'app chiede conferma prima di salvare la transazione senza foto; la foto può essere aggiunta in seguito

---

## Google Drive

### Connessione
1. Vai su Impostazioni → Google Drive
2. Tocca la nuvoletta ☁️ nell'header o il pulsante nella sezione Drive
3. Accedi con il tuo account Google e autorizza l'app
4. La sincronizzazione è automatica ad ogni modifica

> ⚠️ **Importante:** l'autenticazione Google funziona **solo da URL HTTPS** (`https://bymo03.github.io/PECUNIA`). Aprire il file HTML in locale causa l'errore `400: invalid_request`.

### Struttura su Drive
```
Google Drive/
└── Finanza/
    ├── finanza_backup.json    ← dati dell'app
    └── Ricevute/
        ├── 2024-03-15_Uscita_Bancomat_45.50.jpg
        ├── 2024-03-20_Entrata_Contanti_100.00.jpg
        └── ...
```

### Nomenclatura foto
Le foto vengono nominate automaticamente: `Data_Tipo_Conto_Importo.jpg`
es. `2024-03-15_Uscita_Bancomat_45.50.jpg`

### Token e sessione
- Il token di accesso viene rinnovato **automaticamente ogni 50 minuti**
- Al riavvio dell'app il token viene ripristinato dal localStorage se ancora valido
- Se la sessione scade, l'app tenta un rinnovo silenzioso senza mostrare popup

---

## Tour guidato e guida

Il tour interattivo mostra le funzioni principali una alla volta con uno **spotlight** circolare sull'elemento reale dell'app.

### Controlli del tour
- **Avanti / Indietro** per navigare tra gli step
- **Salta** per interrompere il tour in qualsiasi momento
- **Barra di avanzamento** in cima al tooltip

### Riprendere il tour
Impostazioni → Guida → *Inizia tour guidato* (riparte sempre dall'inizio)

### Mini manuale
Impostazioni → Guida → *Mini manuale* — elenco completo di tutti gli step consultabile offline senza avviare il tour.

---

## Note tecniche

| Parametro | Valore |
|-----------|--------|
| Tipo | PWA (Progressive Web App) |
| Architettura | Single HTML file |
| Storage locale | `localStorage` (chiave: `finanza_v1`) |
| Storage cloud | Google Drive (file JSON + cartella Ricevute) |
| Schema dati | v8 (con migrazione automatica da v1) |
| PIN default | `1234` |
| Google OAuth Client ID | `472780980276-j7tadqv8v4f33thsnpkfhlggmrssmoee.apps.googleusercontent.com` |
| Librerie esterne | Chart.js 4.4.1, Google APIs (gapi + GSI) |

### Installazione come PWA
Su mobile (Chrome/Safari) tocca il menu del browser → *"Aggiungi alla schermata Home"* per installare PECUNIA come app nativa.

---

## Changelog

### v2.1 (corrente)
- Riordino conti sulla dashboard con drag & drop (long press per attivare)
- Ordine conti salvato su Google Drive (schema v9)

### v2.0 (legacy)
- Rinomina da "Finanza" a **PECUNIA**
- Schermata di blocco completamente ridisegnata (particelle, monetina animata, ripple dorato)
- Feedback aptico su PIN
- Tour guidato interattivo con spotlight
- Mini manuale nelle impostazioni
- Transizioni slide orizzontali tra schermate
- Grafici animati con contatori numerici
- Anagrafica profilo (nome usato nei Gruppi)
- PIN opzionale (attivabile/disattivabile)
- PIN a 4 o 6 cifre
- Ricorrenti: titolo, giorno del mese, visualizzazione nei grafici
- Chip "🔄 Previste" nei Movimenti
- Chip "🔄 Ricorrenti" nelle Statistiche
- Compressione automatica foto (max 1200px, 80%)
- Migrazione automatica foto esistenti su Drive
- Nomenclatura intelligente delle foto su Drive
- Badge 📎 sulle transazioni con allegati
- Visualizzazione foto direttamente da Drive
- Ordine movimenti per timestamp di inserimento
- Rubrica contatti
- Import CSV con deduplicazione automatica
- Tutte le categorie modificabili
- Eliminazione categorie con avviso transazioni collegate
- Logica Gruppi e Debiti completamente rivista
- Rinnovo silenzioso token Google Drive

### v1.1
- Dashboard con budget e risparmio mensile
- Trasferimenti tra conti
- Statistiche con grafici multipli
- Ricorrenti automatiche
- Google Drive sync
- Gruppi & Debiti stile Tricount
- Export CSV e PDF
- Calcolatrice integrata
- Ricerca avanzata con filtri
- Top categorie personalizzabile
- Confronto periodi

---

*PECUNIA è un progetto personale. I dati sono salvati localmente e su Google Drive del proprietario dell'account.*

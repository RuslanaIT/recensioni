# Contest Recensioni · Doppio Malto Milano Duomo

Sito per il contest recensioni: carichi l'export settimanale delle recensioni Google (CSV), ogni recensione a 5 stelle viene attribuita a un collaboratore, e il sito calcola classifica, punti, premi del mese e report.

- **Chiunque abbia il link** vede la settimana, il totale e i premi, e può scaricare PDF ed Excel.
- **Solo chi ha la chiave** (`ADMIN_KEY`) può salvare o rimuovere settimane.

## Cosa c'è nella cartella

| File | A cosa serve |
|---|---|
| `index.html` | Lo strumento completo (grafica Doppio Malto, logica del contest, report PDF ed Excel) |
| `shim.js` | Collega la pagina all'API di salvataggio e ai download del browser |
| `api/settimane.js` | API che salva le settimane nel database (lettura libera, scrittura con chiave) |
| `vercel.json` | Impedisce che il sito venga indicizzato da Google |
| `backup/settimana-2026-W41.json` | Copia della settimana 41 già salvata |

## Messa online su Vercel (circa 10 minuti)

1. **Carica il progetto**
   - Da GitHub: crea un repository con questa cartella, poi su vercel.com → *Add New → Project* → importa il repository → *Deploy*.
   - Oppure da terminale, dentro la cartella: `npx vercel` e segui le domande.
2. **Collega il database** (serve per il totale condiviso)
   - Nel progetto su Vercel: *Storage* (o *Marketplace*) → **Upstash for Redis** → *Create* → collegalo al progetto.
   - Vercel aggiunge da solo le variabili `KV_REST_API_URL` e `KV_REST_API_TOKEN` (vanno bene anche `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`).
3. **Imposta la chiave per salvare**
   - *Settings → Environment Variables* → aggiungi `ADMIN_KEY` con una password a tua scelta.
4. **Rifai il deploy** (*Deployments → … → Redeploy*) perché le variabili vengano lette.
5. **Rimetti la settimana 41 nel totale**: apri il sito (si apre già con la settimana 41 d'esempio, con le correzioni) e premi **3 · Salva nel totale**. La prima volta il sito chiede la chiave: inserisci `ADMIN_KEY`. Il browser la ricorda.

## Uso settimanale

1. **Carica CSV** con tutte le stelle (1–5): le 5 stelle vanno nel contest, le altre servono per la media.
2. Controlla le attribuzioni (filtra Bassa / Molto bassa / Ipotesi) e correggi dal menu della riga.
3. **Salva nel totale**: parte la finestra di 3 giorni per segnalare errori.
4. **Report PDF** o **Excel** della settimana; dalla scheda *Totale e download* scarichi il mese.

Regole (modificabili in *Impostazioni*): punti 5/3/1 se il rating della settimana è almeno 4,5; premi del mese (buoni Amazon 70/50/25 €) solo con rating del mese superiore a 4,5 **e** almeno 200 recensioni a 5 stelle.

## Note

- Senza database collegato il sito funziona lo stesso, ma le settimane salvate restano solo nel browser di chi le salva.
- Le correzioni a mano e le impostazioni restano nel browser di chi le fa.
- Il sito contiene nomi di clienti e collaboratori: condividi il link solo con chi serve. Non è indicizzato dai motori di ricerca.

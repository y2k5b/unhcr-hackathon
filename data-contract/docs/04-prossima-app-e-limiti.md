# Preparazione della futura applicazione

## Viste previste

1. **Globale:** paesi, copertura dei dati, volumi, segnalazioni aperte.
2. **Paese:** uffici e confronto contestualizzato nel tempo.
3. **Ufficio:** operatori, attività e casi da approfondire.
4. **Operatore:** sezioni separate per interviste e decisioni, secondo i ruoli effettivi.
5. **Caso:** sequenza completa, evidenze, output AI, prima e ultima decisione, eventuale riferimento e audit.

La mappa mostra le città delle tre sedi messicane riportate dalla pagina pubblica UNHCR. I puntini sono centri cittadini approssimativi, non coordinate degli edifici. Cinque paesi restano senza uffici nei dati dimostrativi; la Palestina richiede una distinzione esplicita per il mandato UNRWA.

## Componenti già preparati

- Contratti di dati separati dalla tecnologia del frontend.
- ID stabili per filtrare e collegare le viste.
- Dati sintetici caricabili come collezioni JSON.
- Versioni AI e snapshot dei fatti.
- Eventi per ricostruire i passaggi prima/dopo Cashy.
- Responsabile della segnalazione e struttura della risoluzione.
- Caso non verificato e sentiment non valutabile, per evitare una demo composta soltanto da dati perfetti.

## Da implementare nell’app

- Persistenza, login e autorizzazioni per ruolo/ambito.
- Protezione lato server della prima opinione prima di rivelare Cashy.
- Separazione tra dati interni completi e dati restituiti al browser nelle diverse fasi. Non caricare subito tutti questi JSON nella schermata dell’operatore: contengono AI e riferimenti da tenere nascosti fino al momento corretto.
- Registro eventi scritto dal server insieme alle modifiche, senza affidarsi all’orologio del browser; politiche di conservazione e protezione delle revisioni.
- Bozze, annullamenti, correzioni, riassegnazioni e altri stati del flusso.
- Collegamento al campione S8, senza esporre o usare i target come input del modello.
- Analisi sentiment effettiva, con verifica linguistica e umana; gestione delle rianalisi come nuovi risultati versionati.
- Calibrazione e documentazione di qualsiasi modello eventualmente costruito.
- Esportazioni tabellari compatibili con Power BI.
- Campionamento di audit, stime statistiche e valutazione dell’interfaccia.

## Scelte ancora da concordare

- Il sentiment analizzerà note, trascrizione o entrambi? In questa demo analizza solo note simulate dell’intervistatore.
- Quali ruoli possono accedere al dettaglio della singola attività? Il brief richiede che gli operatori non siano identificabili nelle analisi; la demo usa alias fittizi. Nel prodotto serviranno permessi di approfondimento, aggregazioni e limiti per gruppi piccoli.
- Chi stabilisce il riferimento e con quale procedura? Qui è una determinazione fittizia indipendente.
- Quali informazioni su fondi e controlli amministrativi sono realmente disponibili al decisore? Sono necessarie per confronti corretti.
- Quali soglie, volumi minimi e tempi di presa in carico rendono utile un allarme?
- Saranno gestiti uffici multinazionali? Questa v0.1 usa la gerarchia semplificata richiesta.

## Per la consegna hackathon

Il brief richiede repository riutilizzabile, demo di cinque minuti e nota di due pagine con contrasto, misura, campione e interpretazione dei risultati. Questa cartella è la base dati del progetto; non costituisce ancora quella consegna completa.

Per riprendere in una nuova chat, indica questa cartella e chiedi di leggere README e documenti prima di creare l’app. Non è necessario rigenerare gli esempi o scegliere ora framework, database o hosting.

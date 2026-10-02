# Regole del flusso

## Decisione prima e dopo l’AI

1. L’intervista viene completata e i fatti sono salvati in uno snapshot identificabile.
2. Il decisore legge i fatti senza raccomandazione, ragionamento di Cashy o determinazione di riferimento.
3. Salva prima decisione e motivazione. Il backend futuro ne conferma la registrazione.
4. Solo dopo può ricevere e visualizzare gli output di Cashy.
5. Registra giudizi distinti sul ragionamento e sulla raccomandazione.
6. Salva decisione finale e motivazione, anche in caso di accordo.
7. Se disponibile, una revisione separata collega il riferimento e rende classificabile l’audit.
8. Un segnale rilevante viene assegnato a un supervisore, che lo approfondisce e documenta l’esito.

La data di generazione di Cashy può precedere la prima decisione: ciò che conta è che l’operatore non abbia avuto accesso agli output. Nasconderli solo graficamente nel browser non basterà; il server dovrà autorizzarne l’accesso dopo il salvataggio iniziale.

## Invarianti

- Ogni ID è univoco nel suo tipo. Ogni collegamento risolve un record esistente.
- Intervista, AI, decisione, revisione e segnalazione appartengono allo stesso caso.
- Intervistatore e decisore devono avere il ruolo e l’assegnazione pertinenti alla data dell’attività. Possono essere la stessa persona.
- L’ufficio di decisione può differire dall’ufficio dell’intervista: conta l’assegnazione di chi decide.
- La prima opinione precede strettamente la prima esposizione all’AI.
- Entrambi i giudizi avvengono dopo l’esposizione e prima della finalizzazione.
- L’intervista e lo snapshot devono esistere prima di generare l’AI e prima di leggere il caso.
- Il giudizio sulla raccomandazione, nel contratto v0.1, rappresenta la posizione al momento della finalizzazione. `agree` deve corrispondere allo stesso esito finale; `disagree` all’esito opposto. `partly_agree` e `cannot_assess` non forzano un esito.
- La motivazione finale è sempre obbligatoria; dissentire non deve costare più passaggi che cambiare idea per seguire Cashy.
- Un riferimento non può essere prodotto dallo stesso operatore che si sta valutando. La demo usa un supervisore distinto.
- La compatibilità di policy, fondi e controlli amministrativi tra decisione e riferimento è verificata.
- Le correzioni sono nuovi record con `supersedes_*`; non si modifica la storia in silenzio. Catene e revisioni devono essere lineari, senza cicli.
- Gli eventi di salvataggio e visualizzazione devono concordare con attore, orario, caso e valori conservati nei record.
- Sentiment mancante, errore e testo non valutabile sono stati espliciti, mai “neutro” per default.
- Le segnalazioni chiuse devono avere una risoluzione e un responsabile abilitato.

## Stati futuri

Questa versione rappresenta interviste complete e decisioni finalizzate. Nel prodotto serviranno anche bozze, abbandono della valutazione, correzioni, rianalisi del sentiment, nuove esecuzioni AI, assegnazioni e riassegnazioni delle segnalazioni. Saranno transizioni esplicite, con nuovi eventi; non vanno simulate cancellando campi obbligatori.

Anche letture di dettaglio, esportazioni, cambi di autorizzazioni e accessi falliti andranno registrati dal backend se rilevanti al modello di audit concordato. I log non dovranno replicare indiscriminatamente dati familiari o testi sensibili.

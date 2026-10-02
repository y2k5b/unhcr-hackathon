# Modello dati

Campi tecnici in inglese, descrizioni di supervisione in italiano e brevi estratti sintetici delle interviste in spagnolo. Schema v0.1.0, date ISO 8601 in UTC. Gli enum `include` / `exclude` descrivono il target binario del brief; non rappresentano l’effettivo pagamento. Una riserva può appartenere a `exclude` nel target della challenge senza significare che il bisogno sia assente.

## Collegamenti

```text
country ← office ← operator.assignments
                     ↓
household_id ← case_id ← interview
                         ├─ household_snapshot
                         ├─ text_material
                         └─ sentiment_analysis
interview ← ai_assessment (answer + reasoning)
interview + ai_assessment ← decision
decision ← reference_review (facoltativa)
decision ← audit_issue → supervisor
ogni passaggio rilevante → audit_event
```

`case_id` identifica una pratica di valutazione; `household_id` un nucleo pseudonimo. Lo stesso nucleo può essere rivalutato in casi distinti. In questa base il fascicolo minimo è contenuto nell’intervista; un’anagrafica familiare autonoma potrà essere aggiunta senza cambiare questi collegamenti.

## Organizzazione

`countries`, `offices`, `operators`, `supervisors`, `services` sono anagrafiche separate. `assignments` conserva l’ufficio e l’intervallo di assegnazione; gli intervalli sono `[valid_from, valid_until)`, con `null` per l’assegnazione in corso. Ogni attività salva anche il proprio `location`, per non essere riassegnata retroattivamente quando l’operatore cambia ufficio.

I ruoli attuali sono `interviewer` e `eligibility_decider`. I supervisori hanno ambito `global`, `country` oppure `office`; le liste esplicitano i limiti negli ultimi due casi. Gli ID sono fittizi nella demo. In un uso reale, pseudonimizzazione e piccoli gruppi non garantiscono da soli anonimato.

`parent_office_id` permette una gerarchia interna di uffici. La v0.1 assegna un ufficio a un solo paese: uffici multinazionali e strutture regionali sono un’estensione futura, non una descrizione completa dell’organigramma UNHCR.

## Fase 1: intervista in loco

| Campo | Significato |
|---|---|
| `interviewer_id` | Chi conduce il colloquio |
| `started_at`, `completed_at`, `mode`, `language` | Quando, come e in quale lingua |
| `household_snapshot` | Versione dei fatti mostrabile al decisore prima di Cashy |
| `household_snapshot.evidence` | Elementi identificabili ai quali riferire le motivazioni |
| `text_material` | Note o trascrizione, con indicazione di chi parla |
| `sentiment_analysis` | Esito, metodo, fonte testuale e limiti |
| `supersedes_interview_id` | Intervista precedente rettificata; `null` per la prima versione |

Il campo `household_snapshot` contiene solo un minimo dimostrativo, non tutte le 26 colonne S8. Quando si collega il campione ufficiale, conservare valori e nomi originali in uno snapshot separato e versionato. Non usare `EligibilityTarget` o `Elegibilidad` come input o testo visibile prima della decisione: codificano l’esito. La determinazione di riferimento deve restare separata.

### Sentiment

- `status`: `available`, `pending`, `not_assessable`, `error`.
- `result.label`: `positive`, `neutral`, `negative`, `mixed`.
- `result.polarity`: da -1 a +1; polarità del testo, non voto di professionalità.
- `confidence`: da 0 a 1 solo se disponibile e giustificabile; qui è `null`.
- `evidence_segment_ids`: passaggi che motivano il risultato.
- `target`: linguaggio dell’intervistatore. Il sentimento espresso dalla famiglia non viene attribuito all’operatore.
- `analyzer`: metodo e versione. Qui ogni risultato è simulato.

`available` richiede risultato e data. Negli altri stati il risultato è `null` e c’è una motivazione. `pending` non ha data di analisi, `not_assessable` ed `error` conservano la data del tentativo. Le note scritte non provano come si sia svolto il colloquio.

## Output di Cashy

`ai_assessment` conserva input e versione esatta degli output mostrati. `answer.engine` identifica il modello che formula la raccomandazione; `reasoning.engine` il generatore della spiegazione, con eventuale versione del prompt. Non sono la stessa cosa.

`answer.uncertainty` può contenere una probabilità di inclusione e un riferimento alla sua calibrazione. Nella demo non ci sono probabilità né punteggi predetti: sono `null`. Una probabilità di inclusione non è automaticamente la probabilità che l’AI abbia ragione.

Le eventuali “sfumature” della raccomandazione vanno derivate da informazioni documentate su incertezza, evidenze mancanti o criteri applicati, non inventate dal testo della spiegazione.

## Fase 4: decisione

| Blocco | Significato |
|---|---|
| `context` | Versione delle regole, contesto di fondi e controlli amministrativi |
| `independent_assessment` | Fatti visualizzati, prima opinione, motivazione e fiducia autovalutata |
| `ai_exposure` | Prima esposizione alla specifica versione di Cashy |
| `reasoning_judgment` | Giudizio sulla spiegazione |
| `answer_judgment` | Giudizio sulla raccomandazione |
| `final_assessment` | Esito finale e motivazione obbligatoria |
| `supersedes_decision_id` | Eventuale decisione rettificata, senza sovrascrivere l’originale |

`correctness_rating` usa una scala 1–5: 1 certamente scorretto, 2 probabilmente scorretto, 3 incerto, 4 probabilmente corretto, 5 certamente corretto. È il giudizio soggettivo dell’operatore; `cannot_assess` richiede `null`. Non dimostra la correttezza reale. `self_confidence` usa 1 molto bassa → 5 molto alta ed è facoltativa (`null`).

Ogni motivazione contiene codici, testo libero ed eventuali riferimenti alle evidenze. I codici consentono aggregazioni; il testo conserva ciò che conta nel singolo caso. Gli indicatori `changed_after_ai` e `final_agrees_with_ai` si calcolano: non vengono duplicati nel record, evitando incoerenze.

## Revisione e segnalazioni

`reference_review` collega una determinazione indipendente, il suo autore, fonte, data, versione e contesto. L’assenza del record significa “non verificato”. Non usare la decisione finale dell’operatore come riferimento per valutare quella stessa decisione.

La v0.1 ammette solo `simulated_adjudication`: per riferimenti reali va esteso esplicitamente lo schema. `supersedes_review_id` permette rettifiche conservando lo storico. Il riferimento corrente è quello non sostituito da una revisione successiva.

`audit_issue` trasforma un segnale in lavoro assegnato: responsabile, scadenza, stato, eventi a supporto e risoluzione. La chiusura richiede autore, esito, spiegazione e seguito. I JSON non applicano notifiche o autorizzazioni; ne definiscono i dati.

## Registro eventi

`audit_event` contiene autore, momento, azione, entità, caso e payload minimo. `sequence` e `previous_event_id` permettono di controllare l’ordine del campione. I riferimenti negli oggetti permettono di ricostruire il percorso senza duplicare tutti i testi.

Un JSON modificabile **non è un registro immutabile**: append-only, transazioni, controlli d’accesso e protezione dalle manomissioni richiedono il backend. Il registro dimostrativo copre i passaggi presenti, non ogni possibile evento del futuro prodotto.

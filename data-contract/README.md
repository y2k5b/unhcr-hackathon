# Cashy Audit — struttura dati v0.1

Base locale per la futura applicazione di supervisione: **Globale → Paese → Ufficio → Operatore → Attività → Audit**.

Questa versione definisce i dati e contiene esempi JSON verificabili. Non è ancora un’applicazione, non chiama modelli AI e non è stata pubblicata su GitHub.

## Apri prima questi file

- `examples/02-interviews.json`: fase 1, colloquio in loco, dati del caso e sentiment.
- `examples/04-decisions.json`: fase 4, prima opinione, rivelazione di Cashy, due giudizi distinti e decisione finale motivata.
- `examples/06-audit-events.json`: cronologia delle azioni.
- `docs/01-modello-dati.md`: significato dei campi e collegamenti.

**“1” e “4” sono le fasi del processo descritto nel brief**, non il numero di record né il rapporto tra interviste e decisioni. Una nuova valutazione dello stesso caso è un nuovo record.

## Contenuto

```text
cashy-audit-data/
  README.md
  manifest.json                   Inventario e risultati attesi delle fixture
  schemas/                        7 JSON Schema, uno per tipo di record
  examples/
    01-organization.json          Paesi, uffici, operatori, supervisori, servizi
    02-interviews.json            Interviste e sentiment
    03-ai-assessments.json        Risposta e ragionamento distinti di Cashy
    04-decisions.json             Decisioni prima e dopo l’AI
    05-reference-reviews.json     Riferimenti indipendenti, se disponibili
    06-audit-events.json          Eventi in ordine cronologico
    07-audit-issues.json          Segnalazioni assegnate a un supervisore
  docs/
    01-modello-dati.md
    02-regole-del-flusso.md
    03-metriche-audit.md
    04-prossima-app-e-limiti.md
  scripts/
    validate.py                   Controlli strutturali e tra i record
```

## Esempi inclusi

I fascicoli, gli operatori e gli esiti sono **inventati e marcati `synthetic_demo`**: 6 paesi, 3 uffici messicani, 2 operatori fittizi, 1 supervisore globale, 5 interviste, 5 output AI, 5 decisioni, 4 verifiche e 1 segnalazione aperta.

| Decisione | Parere preliminare | Parere Cashy | Esito finale | Riferimento demo | Esito audit |
|---|---|---|---|---|---|
| 01 | include | exclude | include | include | Correzione corretta dell’AI |
| 02 | include | exclude | exclude | include | Over-reliance |
| 03 | exclude | include | include | include | Accettazione corretta |
| 04 | exclude | include | exclude | include | Under-reliance |
| 05 | include | include | include | Assente | Non verificabile |

Il caso 03 mostra che si può condividere la risposta e condividere solo in parte il ragionamento. Il caso 05 ha anche un sentiment non valutabile: un dato assente non viene trasformato in zero o in “neutro”. Gli esempi sono volutamente piccoli e non rappresentativi.

Queste fixture sono dati dimostrativi scritti a mano, **non righe del campione S8 e non risultati sperimentali**. Servono a verificare il contratto e la futura interfaccia. Per lo studio della challenge usare il campione S8 e i materiali rilasciati; eventuali testi simulati devono restare riconoscibili. Nessuna determinazione di eleggibilità reale viene effettuata qui.

## Verifica

Da questa cartella, con Python 3.10 o successivo:

```sh
python3 scripts/validate.py
python3 scripts/validate.py --self-test
```

Non servono dipendenze esterne. Il validatore applica il profilo di JSON Schema usato qui e controlla collegamenti, ruoli, sequenza temporale, coerenza degli eventi e riferimenti. Non è una libreria universale JSON Schema; i file `.schema.json` sono anche utilizzabili con un validatore Draft 2020-12 standard. I test negativi verificano che modifiche incoerenti vengano rifiutate.

## Decisioni progettuali

- Operatore intervistatore e operatore decisore sono indipendenti. Un operatore può avere uno o entrambi i ruoli.
- Gli ID collegano collezioni separate: la gerarchia visuale non richiede di annidare tutti i dati in un unico JSON enorme.
- Prima opinione e motivazione vengono conservate prima della prima esposizione a Cashy.
- Ragionamento e raccomandazione ricevono giudizi separati.
- La motivazione finale è obbligatoria per tutti: accordo, disaccordo e cambiamento.
- “Corretto” richiede un riferimento indipendente e compatibile con il contesto del caso.
- Nessuna classifica unica della persona; sentiment, decisioni e anomalie restano distinti.
- Le tre sedi messicane e le città sono documentate nella pagina pubblica UNHCR. Le coordinate rappresentano i centri approssimativi delle città e non gli edifici. Gli altri paesi non hanno uffici nel campione. La Palestina è mostrata separatamente: il mandato per i rifugiati palestinesi è di UNRWA.

## Fonte e ambito

[Cashy Oversight Challenge — flusso e track](https://maldonam.github.io/public/#tracks), [requisiti](https://maldonam.github.io/public/#rules), [dati](https://maldonam.github.io/public/#data), consultati nella conversazione il 1 ottobre 2026.

La v0.1 prepara soprattutto il monitor istituzionale e la registrazione del workflow. Per completare un toolkit di audit serviranno protocollo sperimentale, campionamento, intervalli di confidenza con gestione del clustering per operatore e stima del campione necessario. Vedi `docs/03-metriche-audit.md`.

## Aggiornamento geografico demo

Messico: Rappresentanza a Città del Messico, ufficio sul campo a Ciudad Juárez e sottoufficio a Monterrey. Fonte: https://www.unhcr.org/operational/operations/mexico. Gli altri cinque paesi nella navigazione non contengono uffici demo. La pagina UNHCR https://www.unhcr.org/where-we-work/countries/state-palestine precisa il ruolo di UNRWA per i rifugiati palestinesi. Nessun nome di operatore rappresenta personale reale.

Gli orari sono registrati in UTC nei JSON e mostrati nell’interfaccia nel fuso di Città del Messico. Le note di intervista e le motivazioni formali sono presentate in inglese per la demo.

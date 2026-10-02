# Contesto per lo sviluppo successivo

Leggere README.md e docs/ prima di modificare il contratto o costruire l’app.

- Questa cartella contiene la base dati v0.1 della dashboard di auditing Cashy.
- Utenti principali: supervisori istituzionali. Navigazione prevista: globale, paese, ufficio, operatore, attività.
- Paesi, nomi e città delle tre sedi messicane derivano da una pagina pubblica UNHCR. Nomi degli operatori, casi, colloqui, motivazioni e risultati sono fixture inventate: non sono un’anagrafica del personale UNHCR, righe S8 o risultati di modelli.
- Intervistatore e decisore sono ruoli separati, eventualmente svolti dalla stessa persona.
- Salvare il giudizio iniziale prima di rivelare qualsiasi output AI; giudicare ragionamento e risposta separatamente.
- Motivazione finale obbligatoria per accordo e disaccordo. Nessuna penalità implicita per dissentire.
- Non esporre output AI o riferimenti indipendenti nel browser del decisore prima della fase consentita.
- Correttezza e reliance richiedono un riferimento indipendente; sentiment e accordo non sono voti sulla persona.
- Preservare record ed eventi precedenti durante le revisioni. Il registro JSON non offre immutabilità.
- Mantenere gli esempi allineati agli schemi e al manifest. Eseguire `python3 scripts/validate.py --self-test` dopo modifiche ai dati.
- Non pubblicare o caricare dati reali. I puntini geografici approssimano il centro delle città delle sedi documentate; non rappresentano la posizione degli edifici.
- Non scegliere o installare framework finché non viene richiesta la realizzazione dell’app.

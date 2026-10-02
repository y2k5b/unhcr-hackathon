# Metriche dell’audit

Siano `I` la decisione iniziale, `A` la raccomandazione AI, `F` la decisione finale, `R` il riferimento indipendente. “Corretto” significa concorde con il riferimento istituzionale applicabile, non verità sul bisogno della famiglia.

## Misure senza riferimento

- Accordo iniziale: `I == A`.
- Cambiamento dopo l’AI: `I != F`.
- Adesione finale: `F == A`.
- Override: `F != A`.
- Cambiamento verso l’AI: `I != A` e `F == A`. Denominatore naturale: casi con disaccordo iniziale, non tutti i casi.
- Direzione del cambiamento: include → exclude oppure exclude → include.
- Gap di giudizio: rating sul ragionamento meno rating sulla risposta, solo se entrambi disponibili.
- Tempi: prima valutazione, lettura AI, finalizzazione. Descrivono il processo, non la qualità da soli.

Un alto accordo o un alto numero di override non sono automaticamente buoni o cattivi. Un confronto prima/dopo registra una sequenza ma non dimostra da solo un effetto causale dell’AI.

## Misure con riferimento

| Condizione | Categoria | Denominatore del tasso |
|---|---|---|
| `A != R` e `F == R` | Correct override | Casi verificati con `A != R` |
| `A != R` e `F == A` | Over-reliance | Casi verificati con `A != R` |
| `A == R` e `F == R` | Correct acceptance | Casi verificati con `A == R` |
| `A == R` e `F != R` | Under-reliance | Casi verificati con `A == R` |

La partizione vale per esiti binari definitivi. Se in futuro aggiungiamo “rinvia”, “richiedi informazioni” o astensione, occorre una categoria separata e una regola esplicita sul denominatore.

Ulteriori misure:

- Accuratezza finale: `F == R` sui casi verificati.
- Accuratezza iniziale: `I == R` sugli stessi casi.
- Passaggio corretto → errato: `I == R` e `F != R`.
- Passaggio errato → corretto: `I != R` e `F == R`.
- Direzione dell’errore AI: falsa inclusione (`A=include, R=exclude`) o falsa esclusione (`A=exclude, R=include`).
- Copertura della revisione: casi con riferimento utilizzabile / casi finalizzati.

Non includere i casi non verificati nei denominatori di correttezza. Mostrare sempre conteggio, denominatore, numero di operatori e copertura; denominatore zero significa `null`/“non stimabile”, mai 0%.

## Aggregazioni

Filtri previsti: paese, ufficio dell’attività, operatore pseudonimo, periodo, fascia di vulnerabilità, direzione dell’errore, versione AI e contesto decisionale. Interviste e decisioni hanno denominatori diversi. Le attività pregresse restano attribuite all’ufficio di allora.

Le decisioni ripetute dello stesso operatore non sono osservazioni indipendenti. Per uno studio: analisi al livello del partecipante o modelli/bootstrap raggruppati per partecipante. Gli intervalli descrittivi Wilson sui conteggi non sostituiscono la gestione del clustering per il confronto tra condizioni. Riportare intervalli di confidenza, contrasto predefinito, dimensione minima dell’effetto rilevabile e piano del campione; non potenza post hoc.

Le revisioni selezionate solo su anomalie possono distorcere i tassi. Prevedere anche un campione di audit con selezione documentata. Il confronto tra uffici deve tenere conto di composizione dei casi, contesto, versioni AI e quantità di dati. Un calo degli override è un segnale da spiegare, non una prova automatica di peggioramento.

## Stato della v0.1

Il validatore calcola soltanto la categoria attesa dei cinque scenari. Non produce stime di performance, graduatorie, intervalli statistici o soglie di allarme reali. Tutti i riferimenti delle fixture sono include: per uno studio o una demo estesa servono anche riferimenti exclude e ambedue le direzioni di errore.

/**
 * UNHCR Kenya Operation - Explainable AI (XAI) Decision Tree Knowledge Base
 * Standard: Inter-Agency Cash Working Group (CWG) & Minimum Expenditure Basket (MEB) Turkana / Garissa
 */

export const XAI_DECISION_RULES = {
  "REQ-2026-089": {
    familyTitle: "Nucleo Familiare di M. A. K.",
    proGresId: "KEN-KAK-2023-00492",
    headOfHousehold: "M. A. K. (38 anni)",
    originLocation: "Sudan · Darfur Occidentale (fuga da conflitto armato)",
    compositionDetail: "6 individui: 1 donna adulta capofamiglia sola, 5 minori a carico (età 2, 5, 8, 11 e 14 anni)",
    healthCondition: "Patologia cronica respiratoria severa (asma cronico persistente certificato dal presidio sanitario UNHCR/IRC)",
    caregiverBurden: "Genitore unico: cura esclusiva di 5 bambini, assenza di co-tutori o rete familiare estesa nel campo",
    shelterLocation: "Campo di Kakuma · Settore 3, Blocco 8, Rifugio T-14",
    displacementTime: "34 mesi di permanenza continuativa (sfollamento prolungato)",
    economicStatus: "Zero entrate stabili; $150 di assistenza pregressa una tantum (maggio 2026, oltre 90 giorni fa)",
    mebTarget: "$900 / mese (Paniere di spesa essenziale per 6 persone nel distretto di Turkana West)",
    
    // Step-by-step XAI Decision Tree Pathway
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione del Nucleo Familiare (Paniere Alimentare Base)",
        conditionEvaluated: "Nucleo = 6 persone (fascia > 5 componenti)",
        outcomeText: "Allocazione base di sussistenza MEB per nuclei numerosi",
        financialImpact: 500,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1: Baseline calcolata su 2.100 kcal/die/persona"
      },
      {
        stepNumber: 2,
        criterion: "Vulnerabilità Sanitaria Certificata (PSN-MED)",
        conditionEvaluated: "Presenza nel fascicolo di patologia cronica con piano terapeutico attivo",
        outcomeText: "Integrazione farmaceutica, visite al presidio e nutrizione specifica",
        financialImpact: 150,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-PSN-04: Supporto cronicità e costi indiretti di cura"
      },
      {
        stepNumber: 3,
        criterion: "Struttura Monoparentale ad Alto Carico di Cura (PSN-SP)",
        conditionEvaluated: "Genitore unico con più di 3 minori a carico (indice di dipendenza 5.0)",
        outcomeText: "Integrazione tutela e protezione dell'infanzia (vestiario, igiene, scuola)",
        financialImpact: 150,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-CP-02: Mitigazione rischio di lavoro minorile e mancata scolarizzazione"
      },
      {
        stepNumber: 4,
        criterion: "Verifica Saturazione Aiuti e Integrità Biometrica",
        conditionEvaluated: "Aiuti ultimi 90gg ($150) < soglia $200; nessun duplicato biometrico nei database BIMS/proGres",
        outcomeText: "Requisiti di ammissibilità pienamente soddisfatti (Nessuna decurtazione)",
        financialImpact: 0,
        currencySymbol: "",
        impactType: "neutral",
        ruleRef: "UNHCR-FIN-09: Controllo sovrapposizioni e anti-frode"
      }
    ],

    recommendedAmount: 800,
    rationaleSummary: "Il modello suggerisce l'importo standard per nuclei superiori a 5 persone con vulnerabilità medica cronica e genitore unico ad alta priorità. L'importo di $800 copre l'88% del paniere MEB essenziale per 6 persone a Kakuma.",
    counterfactualAnalysis: [
      { condition: "Senza la vulnerabilità medica cronica a carico", calculatedAmount: 650, delta: "-$150" },
      { condition: "Con nucleo ridotto a 3 persone (1 adulto + 2 minori)", calculatedAmount: 450, delta: "-$350" },
      { condition: "Se gli aiuti ricevuti negli ultimi 90 giorni superassero $400", calculatedAmount: 400, delta: "-$400" }
    ],
    interviewFocusPoints: [
      "Verificare continuità disponibilità inalatori presso la clinica di Kakuma 3.",
      "Accertare frequenza scolastica dei 3 minori in età scolare (scuola primaria Angelina Jolie).",
      "Confermare la delega per il ritiro del voucher al punto di distribuzione della Zona 3."
    ]
  },

  "REQ-2026-090": {
    familyTitle: "Nucleo Familiare di A. O. N.",
    proGresId: "KEN-KAL-2026-00118",
    headOfHousehold: "A. O. N. (29 anni)",
    originLocation: "Sud Sudan · Equatoria Centrale",
    compositionDetail: "4 individui: capofamiglia con 1 figlio biologico e 2 minori non accompagnati accolti in affido provvisorio",
    healthCondition: "Nessuna patologia cronica registrata; accertamenti nutrizionali nella norma",
    caregiverBurden: "Tutela di 2 minori non accompagnati (UASC) ricongiunti durante il transito di frontiera a Nadapal",
    shelterLocation: "Kalobeyei Integrated Settlement · Villaggio 2, Tracciato B",
    displacementTime: "8 mesi di permanenza (nuovo arrivo, inserimento recente)",
    economicStatus: "Zero entrate stabili; $0 aiuti monetari pregressi (prima assegnazione CBI)",
    mebTarget: "$600 / mese (Paniere di spesa per 4 persone)",
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione del Nucleo Familiare (Paniere Base)",
        conditionEvaluated: "Nucleo = 4 persone",
        outcomeText: "Quota base di sussistenza MEB per 4 componenti",
        financialImpact: 400,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1: Quota alimentare e beni di prima necessità"
      },
      {
        stepNumber: 2,
        criterion: "Tutela di Minori Non Accompagnati (PSN-UASC)",
        conditionEvaluated: "Presenza di 2 minori non accompagnati con certificato di affidamento provvisorio",
        outcomeText: "Sussidio di sostegno all'affido familiare ($100 per minore) per corredo e accoglienza",
        financialImpact: 200,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-CP-05: Indennità per famiglie affidatarie comunitarie"
      },
      {
        stepNumber: 3,
        criterion: "Verifica Primi Mesi di Insediamento",
        conditionEvaluated: "Permanenza < 12 mesi senza altri aiuti erogati",
        outcomeText: "Conferma piena idoneità senza decurtazioni di reddito",
        financialImpact: 0,
        currencySymbol: "",
        impactType: "neutral",
        ruleRef: "UNHCR-NEW-01: Priorità ai nuclei di recente ingresso"
      }
    ],
    recommendedAmount: 600,
    rationaleSummary: "Importo raccomandato a copertura totale del fabbisogno per 4 individui con quota aggiuntiva per i due minori accolti in affidamento temporaneo.",
    counterfactualAnalysis: [
      { condition: "Senza i minori in affido (nucleo di 2 persone)", calculatedAmount: 250, delta: "-$350" },
      { condition: "Se fosse presente anche una patologia cronica", calculatedAmount: 750, delta: "+$150" }
    ],
    interviewFocusPoints: [
      "Verificare la scadenza del certificato di affidamento provvisorio (validità residua 60 giorni).",
      "Monitorare inserimento scolastico dei minori accolti a Kalobeyei."
    ]
  },

  "REQ-2026-091": {
    familyTitle: "Fascicolo Individuale di F. H. D.",
    proGresId: "KEN-DAD-2021-09821",
    headOfHousehold: "F. H. D. (44 anni)",
    originLocation: "Somalia · Kismayo",
    compositionDetail: "1 individuo (adulto singolo)",
    healthCondition: "Buone condizioni generali; nessun bisogno medico cronico",
    caregiverBurden: "Nessun minore o familiare a carico",
    shelterLocation: "Campo di Dadaab · Hagadera, Blocco C-4",
    displacementTime: "52 mesi di permanenza a Dadaab",
    economicStatus: "Ricevuti $400 negli ultimi 90 giorni; segnalata attività informale di commercio al mercato",
    mebTarget: "$180 / mese (Paniere individuale)",
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione del Nucleo Familiare",
        conditionEvaluated: "Nucleo = 1 persona",
        outcomeText: "Quota teorica base: $150",
        financialImpact: 150,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1: Baseline individuo singolo"
      },
      {
        stepNumber: 2,
        criterion: "Saturazione Assistenza Pregressa e Capacità di Spesa",
        conditionEvaluated: "Assistenza ricevuta negli ultimi 90gg pari a $400 (superiore al plafond di $200)",
        outcomeText: "Applicazione clausola di rotazione dei beneficiari: saturazione raggiunta",
        financialImpact: -150,
        currencySymbol: "-$",
        impactType: "decrement",
        ruleRef: "UNHCR-FIN-04: Soglia rotazione per destinare risorse a nuclei senza reddito"
      }
    ],
    recommendedAmount: 0,
    rationaleSummary: "Erogazione non raccomandata per questo ciclo mensile per superamento della soglia di aiuti recenti e presenza di entrate informali, al fine di garantire equità distributiva.",
    counterfactualAnalysis: [
      { condition: "Se gli aiuti negli ultimi 90 giorni fossero inferiori a $200", calculatedAmount: 150, delta: "+$150" },
      { condition: "In caso di insorgenza di vulnerabilità medica certificata", calculatedAmount: 300, delta: "+$300" }
    ],
    interviewFocusPoints: [
      "Illustrare con tatto le ragioni della rotazione periodica dell'aiuto economico.",
      "Informare sulla possibilità di ripresentare domanda nel ciclo del prossimo trimestre."
    ]
  },

  "REQ-2026-092": {
    familyTitle: "Nucleo Familiare di J. B. M.",
    proGresId: "KEN-KAK-2024-03102",
    headOfHousehold: "J. B. M. (46 anni)",
    originLocation: "RD Congo · Kivu Nord",
    compositionDetail: "7 individui: 2 adulti e 5 figli a carico",
    healthCondition: "Disabilità motoria permanente a carico del capofamiglia (necessità sedia a rotelle e assistenza)",
    caregiverBurden: "2 adulti, 5 minori; persona con disabilità grave nel nucleo",
    shelterLocation: "Campo di Kakuma · Settore 1, Blocco 2",
    displacementTime: "19 mesi di permanenza",
    economicStatus: "$200 ricevuti in precedenza; nessun reddito da lavoro a causa della mobilità ridotta",
    mebTarget: "$1,050 / mese",
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione del Nucleo (7 persone)",
        conditionEvaluated: "Nucleo molto numeroso (7 persone)",
        outcomeText: "Quota base sussistenza MEB per 7 membri",
        financialImpact: 550,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1: Baseline nucleo 7+ componenti"
      },
      {
        stepNumber: 2,
        criterion: "Disabilità Motoria Grave (PSN-DIS)",
        conditionEvaluated: "Disabilità accertata con impatto su mobilità e autosufficienza",
        outcomeText: "Integrazione per ausili, trasporto assistito e barriere architettoniche",
        financialImpact: 150,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-DIS-01: Fondo inclusione disabilità"
      },
      {
        stepNumber: 3,
        criterion: "Controllo Biometrico di Sicurezza del Fascicolo",
        conditionEvaluated: "Allerta sistema: possibile sovrapposizione d'identità biometrica con pratica REQ-2025-771",
        outcomeText: "Necessaria verifica de-duplicazione con operatore prima dello sblocco fondi",
        financialImpact: 0,
        currencySymbol: "",
        impactType: "warning",
        ruleRef: "BIMS-KEN-DUP: Protocollo anti-duplicazione biometrica"
      }
    ],
    recommendedAmount: 700,
    rationaleSummary: "Profilo ad altissima vulnerabilità per disabilità e numerosità. L'algoritmo calcola $700 ma segnala la necessità di verifica biometrica al banco prima dell'autorizzazione finale.",
    counterfactualAnalysis: [
      { condition: "A seguito di verifica biometrica positiva (nessun duplicato)", calculatedAmount: 700, delta: "Convalida immediata" },
      { condition: "In caso di riscontro di doppio fascicolo attivo", calculatedAmount: 0, delta: "Fascicolo accorpato" }
    ],
    interviewFocusPoints: [
      "Effettuare nuova scansione biometrica rapida di conferma al desk.",
      "Verificare lo stato della carrozzina fornita dal partner ortopedico a Kakuma 1."
    ]
  },

  "REQ-2026-093": {
    familyTitle: "Nucleo Familiare di S. T. G.",
    proGresId: "KEN-DAD-2024-01984",
    headOfHousehold: "S. T. G. (26 anni)",
    originLocation: "Etiopia · Regione Oromia",
    compositionDetail: "3 individui: donna sola incinta con 2 bambini di 3 e 5 anni",
    healthCondition: "Gravidanza documentata al secondo trimestre (visite prenatali attive)",
    caregiverBurden: "Donna sola capofamiglia con bambini piccoli",
    shelterLocation: "Campo di Dadaab · Ifo, Settore 4",
    displacementTime: "27 mesi di permanenza",
    economicStatus: "$100 ricevuti in passato; nessuna entrata formale",
    mebTarget: "$480 / mese",
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione del Nucleo (3 persone)",
        conditionEvaluated: "Nucleo = 3 persone",
        outcomeText: "Quota base sussistenza MEB",
        financialImpact: 350,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1"
      },
      {
        stepNumber: 2,
        criterion: "Gravidanza in Corso e Nutrizione Materna (PSN-MN)",
        conditionEvaluated: "Stato di gravidanza certificato dal centro materno-infantile di Ifo",
        outcomeText: "Integrazione per integratori nutrizionali e visite ostetriche",
        financialImpact: 100,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-NUT-02: Supporto primi 1.000 giorni"
      },
      {
        stepNumber: 3,
        criterion: "Capofamiglia Donna Sola (PSN-FHH)",
        conditionEvaluated: "Nucleo a conduzione femminile senza altri adulti residenti",
        outcomeText: "Integrazione tutela e beni per la prima infanzia",
        financialImpact: 50,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-GEN-03: Protezione nuclei a conduzione femminile"
      }
    ],
    recommendedAmount: 500,
    rationaleSummary: "Sussidio raccomandato a garanzia della sicurezza alimentare materna e dell'accesso continuativo ai servizi sanitari di Ifo.",
    counterfactualAnalysis: [
      { condition: "Senza gravidanza in corso", calculatedAmount: 400, delta: "-$100" }
    ],
    interviewFocusPoints: [
      "Verificare il calendario delle visite ostetriche presso l'ambulatorio di Ifo.",
      "Accertare il fabbisogno di kit di igiene post-natale."
    ]
  },

  "REQ-2026-094": {
    familyTitle: "Nucleo Familiare di R. N. I.",
    proGresId: "KEN-KAL-2022-04519",
    headOfHousehold: "R. N. I. (51 anni)",
    originLocation: "Burundi · Muyinga",
    compositionDetail: "5 individui: 2 adulti, 2 minori e 1 genitore anziano non autosufficiente (78 anni)",
    healthCondition: "Anziano a carico con fragilità geriatrica e mobilità ridotta",
    caregiverBurden: "Cura contemporanea di minori e genitore anziano",
    shelterLocation: "Kalobeyei Integrated Settlement · Villaggio 1, Tracciato A",
    displacementTime: "41 mesi di permanenza",
    economicStatus: "Segnalazione di incongruenza: dichiarato reddito $40/mese vs $130/mese da database livelihood",
    mebTarget: "$750 / mese",
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione Nucleo (5 persone)",
        conditionEvaluated: "Nucleo = 5 persone",
        outcomeText: "Quota base MEB per 5 membri",
        financialImpact: 400,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1"
      },
      {
        stepNumber: 2,
        criterion: "Persona Anziana a Carico (PSN-ELD)",
        conditionEvaluated: "Presenza di persona > 75 anni con limitazioni funzionali",
        outcomeText: "Integrazione geriatrica per alimentazione specifica e ausili",
        financialImpact: 100,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-ELD-01: Tutela persone anziane sfollate"
      },
      {
        stepNumber: 3,
        criterion: "Verifica Incongruenza Reddituale",
        conditionEvaluated: "Discrepanza tra importo dichiarato e registrazione del programma orti comunitari",
        outcomeText: "Applicata detrazione prudenziale di $50 in attesa di chiarimento al colloquio",
        financialImpact: -50,
        currencySymbol: "-$",
        impactType: "decrement",
        ruleRef: "CWG-KEN-INC: Riconciliazione entrate da sussistenza"
      }
    ],
    recommendedAmount: 450,
    rationaleSummary: "Caso idoneo ma con necessità di chiarimento tra il reddito dichiarato e quello registrato nel programma livelihood di Kalobeyei.",
    counterfactualAnalysis: [
      { condition: "Se il colloquio conferma reddito nullo o < $50", calculatedAmount: 500, delta: "+$50" },
      { condition: "Se viene confermato reddito stabile da commercio > $130", calculatedAmount: 350, delta: "-$100" }
    ],
    interviewFocusPoints: [
      "Chiarire l'effettiva resa economica della partecipazione all'orto comunitario.",
      "Verificare l'accesso dell'anziano alle visite domiciliari del personale medico."
    ]
  },

  "REQ-2026-095": {
    familyTitle: "Nucleo Familiare di H. Y. A.",
    proGresId: "KEN-KAK-2026-00412",
    headOfHousehold: "H. Y. A. (23 anni)",
    originLocation: "Sudan · Khartoum",
    compositionDetail: "2 individui: giovane coppia di fratelli recentemente giunti al campo",
    healthCondition: "Condizioni generali buone",
    caregiverBurden: "Due giovani adulti autosufficienti",
    shelterLocation: "Campo di Kakuma · Settore 2, Blocco 6",
    displacementTime: "6 mesi di permanenza (nuovi arrivati)",
    economicStatus: "$0 aiuti ricevuti; nessuna entrata",
    mebTarget: "$300 / mese",
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione del Nucleo (2 persone)",
        conditionEvaluated: "Nucleo = 2 persone",
        outcomeText: "Quota base di sussistenza essenziale",
        financialImpact: 250,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1"
      },
      {
        stepNumber: 2,
        criterion: "Verifica Bisogni Specifici",
        conditionEvaluated: "Nessuna patologia o vulnerabilità di protezione rilevata",
        outcomeText: "Mantenuta quota base senza integrazioni",
        financialImpact: 0,
        currencySymbol: "",
        impactType: "neutral",
        ruleRef: "UNHCR-STD: Valutazione standard"
      }
    ],
    recommendedAmount: 250,
    rationaleSummary: "Assegnazione base di accoglienza per 2 giovani adulti privi di altre fonti di sussistenza, già autorizzata nel ciclo corrente.",
    counterfactualAnalysis: [
      { condition: "Con un nucleo allargato a 4 componenti", calculatedAmount: 450, delta: "+$200" }
    ],
    interviewFocusPoints: [
      "Orientamento ai corsi di formazione professionale e borse di studio UNHCR/DAFI.",
      "Verifica iscrizione all'anagrafe del campo per assegnazione riparo definitivo."
    ]
  },

  "REQ-2026-096": {
    familyTitle: "Nucleo Familiare di K. M. O.",
    proGresId: "KEN-DAD-2025-06781",
    headOfHousehold: "K. M. O. (49 anni)",
    originLocation: "Somalia · Bassa Juba",
    compositionDetail: "8 individui: 2 adulti, 3 minori biologici e 3 minori non accompagnati (nipoti orfani)",
    healthCondition: "Patologia cronica respiratoria e cardiaca a carico del capofamiglia",
    caregiverBurden: "Tutela di 6 minori complessivi (inclusi 3 orfani)",
    shelterLocation: "Campo di Dadaab · Dagahaley, Blocco H-12",
    displacementTime: "14 mesi di permanenza",
    economicStatus: "$0 aiuti pregressi nel trimestre; vulnerabilità economica estrema",
    mebTarget: "$1,250 / mese",
    decisionTreeSteps: [
      {
        stepNumber: 1,
        criterion: "Dimensione del Nucleo (8 persone)",
        conditionEvaluated: "Nucleo esteso (8 componenti)",
        outcomeText: "Quota base di sussistenza per nucleo numeroso",
        financialImpact: 600,
        currencySymbol: "$",
        impactType: "base",
        ruleRef: "CWG-KEN-R1: Limite base MEB per nuclei 8+"
      },
      {
        stepNumber: 2,
        criterion: "Vulnerabilità Medica Cronica (PSN-MED)",
        conditionEvaluated: "Capofamiglia con patologia cardiaca documentata",
        outcomeText: "Integrazione sanitaria e supporto terapeutico continuo",
        financialImpact: 150,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-PSN-04"
      },
      {
        stepNumber: 3,
        criterion: "Tutela Multipla di Orfani / Minori Non Accompagnati (PSN-UASC)",
        conditionEvaluated: "Presenza di 3 minori orfani a carico oltre ai figli biologici",
        outcomeText: "Integrazione tutela infanzia e affido comunitario ($150 per minore orfano)",
        financialImpact: 450,
        currencySymbol: "+$",
        impactType: "increment",
        ruleRef: "UNHCR-CP-05: Massimo scaglione di protezione per famiglie affidatarie"
      }
    ],
    recommendedAmount: 1200,
    rationaleSummary: "Priorità massima assoluta. Famiglia numerosa con 3 orfani accolti e grave fragilità sanitaria del capofamiglia. Raccomandata la quota massima autorizzabile di $1,200.",
    counterfactualAnalysis: [
      { condition: "Senza la patologia cronica", calculatedAmount: 1050, delta: "-$150" },
      { condition: "Senza i minori in affido comunitario", calculatedAmount: 600, delta: "-$600" }
    ],
    interviewFocusPoints: [
      "Coordinamento urgente con il team di Protezione Minori (Child Protection) di Dagahaley.",
      "Verifica fornitura farmaci salvavita presso l'ospedale di Medici Senza Frontiere a Dagahaley."
    ]
  }
}

export function getXaiExplanation(caseId) {
  return XAI_DECISION_RULES[caseId] || XAI_DECISION_RULES["REQ-2026-089"]
}

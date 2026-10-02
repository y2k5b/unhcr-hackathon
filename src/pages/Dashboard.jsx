import React, { useEffect, useMemo, useRef, useState } from 'react';
import mockData from '../mockData.json';
import {
  Users,
  Baby,
  Accessibility,
  ShieldAlert,
  ShieldCheck,
  HeartPulse,
  Utensils,
  Home,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Clock,
  Globe,
  CalendarDays,
  Search,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
 
/* ========================================================================== */
/*  Design tokens (ricavati da help.unhcr.org)                                */
/*                                                                            */
/*  blu UNHCR    #0072BC  barra principale, link, azioni primarie             */
/*  blu scuro    #18375F  barra secondaria, pittogrammi, testi forti          */
/*  azzurro      #EFF7FE  sfondo di card e box                                */
/*  bordo azz.   #7DB2DC  bordi dei box informativi                           */
/*  giallo avv.  #FFF799  box di avviso (bordo #E6BF00)                       */
/*  grigio fascia #E5E5E5 fasce di contenuto                                  */
/*  inchiostro   #1A1A1A  testo, titoli, linee sotto i titoli, input          */
/* ========================================================================== */
 
// Sostituisci con il font ufficiale UNHCR se disponibile nel progetto.
const FONT_STACK = "'Inter', 'Helvetica Neue', Arial, sans-serif";
 
const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#18375F]';
 
/* ========================================================================== */
/*  Configurazione                                                            */
/* ========================================================================== */
 
const META = mockData.meta ?? {};
 
// Sotto questa soglia il parere dell'AI non viene mostrato e il caso è "complicato".
const CONFIDENCE_THRESHOLD = META.confidence_threshold ?? 0.7;
 
// Lunghezza minima del commento richiesto prima di inviare la decisione.
const MIN_COMMENT = META.min_comment_length ?? 15;
 
// Nei casi complicati nascondi anche gli elementi estratti dal modello
// (considerati parte del suo parere). Metti false per mostrarli comunque.
const HIDE_FACTORS_WHEN_LOW_CONFIDENCE = true;
 
/* ========================================================================== */
/*  Helper e dizionari                                                        */
/* ========================================================================== */
 
const humanize = (s) => {
  const t = String(s).replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};
 
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
 
const opposite = (d) => (d === 'INCLUDE' ? 'EXCLUDE' : 'INCLUDE');
 
const DECISIONS = {
  INCLUDE: {
    label: 'Inclusione',
    verb: 'Includere il nucleo',
    desc: 'Il nucleo entra nel programma di assistenza.',
    icon: Plus,
    chip: 'bg-[#EFF7FE] text-[#00538A] border-[#7DB2DC]',
  },
  EXCLUDE: {
    label: 'Esclusione',
    verb: 'Escludere il nucleo',
    desc: 'Il nucleo non rientra nel programma in questo momento.',
    icon: Minus,
    chip: 'bg-[#EDEDED] text-[#1A1A1A] border-[#9E9E9E]',
  },
};
 
const DIMENSIONS = {
  health: { label: 'Salute', icon: HeartPulse },
  safety: { label: 'Sicurezza', icon: ShieldCheck },
  food: { label: 'Alimentazione', icon: Utensils },
  shelter: { label: 'Alloggio', icon: Home },
};
 
const DIM_LEVELS = {
  critical: { label: 'Critico', icon: AlertTriangle, box: 'bg-[#FDECEA] border-[#F1B5AE]', text: 'text-[#8A1C12]' },
  attention: { label: 'Da monitorare', icon: AlertCircle, box: 'bg-[#FFF799] border-[#E6BF00]', text: 'text-[#4A3B00]' },
  stable: { label: 'Stabile', icon: CheckCircle2, box: 'bg-[#E8F5EC] border-[#A9D8BA]', text: 'text-[#1D5E36]' },
};
 
/* ========================================================================== */
/*  Componenti base                                                           */
/* ========================================================================== */
 
/* Segnaposto tipografico: sostituisci con il logo ufficiale UNHCR (SVG). */
function Wordmark() {
  return (
    <div className="flex items-center gap-4 text-white">
      <div className="leading-none">
        <div className="text-[28px] font-black tracking-tight">UNHCR</div>
        <div className="text-[10px] font-semibold mt-1">The UN Refugee Agency</div>
      </div>
      <span className="h-9 w-px bg-white/70" aria-hidden="true" />
      <span className="text-2xl font-semibold">Valutazione dei casi</span>
    </div>
  );
}
 
/* Box di avviso giallo, come "All UNHCR services are FREE of charge". */
function Notice({ title, children, variant = 'warning' }) {
  const styles =
    variant === 'info' ? 'bg-[#EFF7FE] border-[#7DB2DC]' : 'bg-[#FFF799] border-[#E6BF00]';
  return (
    <div role="note" className={`flex gap-3 rounded border p-4 text-[#1A1A1A] ${styles}`}>
      <Info className="w-5 h-5 mt-0.5 shrink-0 text-[#18375F]" aria-hidden="true" />
      <div>
        <p className="font-bold">{title}</p>
        {children && <p className="mt-1 leading-relaxed">{children}</p>}
      </div>
    </div>
  );
}
 
/* Titolo di sezione con linea sotto, come "Help by topic". */
function SectionTitle({ children, id }) {
  return (
    <h3 id={id} className="text-2xl font-bold text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-3">
      {children}
    </h3>
  );
}
 
function Fact({ icon: Icon, label, value, warn = false }) {
  return (
    <div className="flex items-center gap-3 rounded bg-white p-3">
      <span
        className={`w-11 h-11 shrink-0 rounded flex items-center justify-center ${
          warn ? 'bg-[#FFF799] text-[#4A3B00]' : 'bg-[#EFF7FE] text-[#18375F]'
        }`}
      >
        <Icon className="w-6 h-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-sm text-[#4D4D4D]">{label}</div>
        <div className="mt-0.5 font-bold text-[#1A1A1A] break-words">{value}</div>
      </div>
    </div>
  );
}
 
function DecisionTag({ decision, large = false }) {
  const d = DECISIONS[decision];
  if (!d) return null;
  const Icon = d.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-bold ${d.chip} ${
        large ? 'px-3 py-1.5 text-lg' : 'px-2 py-0.5 text-sm'
      }`}
    >
      <Icon className={large ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
      {d.label}
    </span>
  );
}
 
/* ========================================================================== */
/*  Barra di avanzamento (barra secondaria blu scuro)                         */
/* ========================================================================== */
 
function ProgressBar({ done, total }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div className="w-full text-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-bold">Avanzamento</span>
        <span className="tabular-nums">
          <b>{done}</b> di {total} casi valutati
        </span>
      </div>
      <div
        className="mt-2 h-3 rounded-sm bg-[#3B5F8A] overflow-hidden"
        role="progressbar"
        aria-label="Casi valutati"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div
          className="h-full bg-white transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
 
/* ========================================================================== */
/*  Coda: nessun punteggio, nessuna priorità, nessun indizio sul parere AI    */
/* ========================================================================== */
 
function CaseRow({ req, selected, inProgress, onSelect }) {
  const ho = req.human_oversight;
  const completed = ho.status === 'COMPLETED';
 
  return (
    <button
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`w-full text-left rounded border-2 px-4 py-3.5 transition-colors ${FOCUS} ${
        selected
          ? 'bg-white border-[#0072BC] shadow-[inset_6px_0_0_#0072BC]'
          : 'bg-[#EFF7FE] border-[#B9D6EE] hover:border-[#0072BC]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pl-1">
          <div className="font-bold text-[#0072BC] text-lg leading-tight">{req.case_id}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[#4D4D4D]">
            <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{req.demographics.family_size} {req.demographics.family_size === 1 ? 'persona' : 'persone'}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[#4D4D4D]">
            <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{req.demographics.origin_country}</span>
          </div>
        </div>
 
        <div className="shrink-0">
          {completed ? (
            <DecisionTag decision={ho.final_decision} />
          ) : inProgress ? (
            <span className="inline-block rounded border border-[#7DB2DC] bg-white px-2 py-0.5 text-sm font-bold text-[#00538A]">
              Da confermare
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
 
/* ========================================================================== */
/*  Elementi a favore dell'inclusione / dell'esclusione                       */
/*  (estratti dal modello, ma la UI non lo dichiara)                          */
/* ========================================================================== */
 
function FactorColumn({ title, icon: Icon, tile, bar, items }) {
  return (
    <div>
      <h4 className="flex items-center gap-2.5 text-lg font-bold">
        <span className={`w-8 h-8 rounded flex items-center justify-center ${tile}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        {title}
        <span className="text-[#4D4D4D] font-normal">({items.length})</span>
      </h4>
      {items.length === 0 ? (
        <p className="mt-3 text-[#4D4D4D]">Nessun elemento rilevato.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((f) => (
            <li key={f.key} className={`rounded border border-l-[6px] border-[#D9D9D9] bg-white p-4 ${bar}`}>
              <p className="font-bold">{f.label ?? humanize(f.key)}</p>
              {f.detail && <p className="mt-1 text-sm text-[#4D4D4D] leading-relaxed">{f.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
 
/* ========================================================================== */
/*  Parere dell'AI (mostrato solo dopo l'invio della valutazione)             */
/* ========================================================================== */
 
function AiOpinion({ ai, score }) {
  return (
    <div className="rounded border-2 border-[#18375F] bg-white p-5">
      <div className="flex items-center gap-2 font-bold text-[#18375F]">
        <Sparkles className="w-5 h-5" aria-hidden="true" />
        Parere dell&apos;AI
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-[#4D4D4D]">Raccomanda</span>
        <DecisionTag decision={ai.recommendation} large />
      </div>
      <p className="mt-4 leading-relaxed">{ai.comment}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#D9D9D9] pt-4">
        <div>
          <dt className="text-sm text-[#4D4D4D]">Indice di vulnerabilità</dt>
          <dd className="text-xl font-black text-[#18375F] tabular-nums">
            {score}
            <span className="text-sm font-semibold text-[#4D4D4D]"> su 100</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-[#4D4D4D]">Affidabilità</dt>
          <dd className="text-xl font-black text-[#18375F] tabular-nums">{Math.round(ai.confidence * 100)}%</dd>
        </div>
      </dl>
      {META.model && (
        <p className="mt-3 text-xs text-[#4D4D4D]">
          {META.model.name}, versione {META.model.version}.
        </p>
      )}
    </div>
  );
}
 
/* ========================================================================== */
/*  Feedback sull'esercitazione (caso già chiuso)                             */
/* ========================================================================== */
 
function Feedback({ cal, ho, ai, aiAvailable }) {
  const ex = cal.explanation;
  const reference = cal.reference_decision;
  const correct = ho.final_decision === reference;
  const changedFromCorrect = ho.initial_decision === reference && ho.final_decision !== reference;
  const agreedWithWrongAi = aiAvailable && ho.ai_agreement === 'AGREE' && ai.recommendation !== reference;
  const aiCorrect = aiAvailable && ai.recommendation === reference;
 
  return (
    <section aria-labelledby="fb-title" className="rounded border-2 border-[#18375F] bg-white overflow-hidden">
      <div className={`p-5 sm:p-6 border-b-2 border-[#18375F] ${correct ? 'bg-[#E8F5EC]' : 'bg-[#FFF799]'}`}>
        <p className="text-sm font-bold text-[#18375F]">
          Esercitazione: caso già chiuso il {fmtDate(cal.closed_on)}
        </p>
        <h3 id="fb-title" className="mt-1 flex items-center gap-2 text-2xl font-bold">
          {correct ? (
            <CheckCircle2 className="w-7 h-7 text-[#1D5E36]" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-7 h-7 text-[#4A3B00]" aria-hidden="true" />
          )}
          {correct ? 'Risposta corretta' : 'Risposta non corretta'}
        </h3>
        <p className="mt-2 leading-relaxed">
          Questo caso era già stato deciso e inserito tra quelli reali a scopo di formazione. {ex.summary}
        </p>
 
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <div className="text-xs text-[#4D4D4D]">Valutazione iniziale</div>
            <div className="mt-1"><DecisionTag decision={ho.initial_decision} /></div>
          </div>
          <div>
            <div className="text-xs text-[#4D4D4D]">Decisione finale</div>
            <div className="mt-1"><DecisionTag decision={ho.final_decision} /></div>
          </div>
          <div>
            <div className="text-xs text-[#4D4D4D]">Risposta corretta</div>
            <div className="mt-1"><DecisionTag decision={reference} /></div>
          </div>
        </div>
      </div>
 
      <div className="p-5 sm:p-6 space-y-8">
        {(changedFromCorrect || agreedWithWrongAi) && (
          <Notice
            title={
              changedFromCorrect
                ? 'La tua valutazione iniziale era corretta'
                : "Hai concordato con un parere dell'AI non corretto"
            }
          >
            {changedFromCorrect
              ? "Dopo aver visto il parere dell'AI hai cambiato decisione. Prima di cambiare idea, verifica quali elementi nuovi giustificano il cambio."
              : "Quando il parere dell'AI e la tua lettura del fascicolo divergono, riesamina gli elementi prima di concordare."}
          </Notice>
        )}
 
        <div>
          <h4 className="text-lg font-bold">Perché questa è la risposta corretta</h4>
          <div className="mt-3 space-y-4 leading-relaxed max-w-3xl">
            {ex.rationale.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
 
        <div>
          <h4 className="text-lg font-bold">Gli elementi decisivi</h4>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {ex.key_points.map((k) => (
              <li key={k.title} className="rounded border border-[#7DB2DC] bg-[#EFF7FE] p-4">
                <p className="font-bold text-[#18375F]">{k.title}</p>
                <p className="mt-1 text-sm leading-relaxed">{k.text}</p>
              </li>
            ))}
          </ul>
        </div>
 
        <div>
          <h4 className="text-lg font-bold">Errori da evitare</h4>
          <ul className="mt-3 space-y-2">
            {ex.pitfalls.map((p) => (
              <li key={p} className="flex items-start gap-3 leading-relaxed">
                <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#18375F] shrink-0" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>
 
        <div>
          <h4 className="text-lg font-bold">E il parere dell&apos;AI?</h4>
          {aiAvailable && (
            <p
              className={`mt-3 inline-block rounded border px-3 py-1 text-sm font-bold ${
                aiCorrect
                  ? 'bg-[#E8F5EC] border-[#A9D8BA] text-[#1D5E36]'
                  : 'bg-[#FFF799] border-[#E6BF00] text-[#4A3B00]'
              }`}
            >
              {aiCorrect ? "Il parere dell'AI era corretto" : "Il parere dell'AI non era corretto"}
            </p>
          )}
          <p className="mt-3 leading-relaxed max-w-3xl">{ex.ai_note}</p>
        </div>
      </div>
    </section>
  );
}
 
/* ========================================================================== */
/*  Dashboard                                                                 */
/* ========================================================================== */
 
export default function Dashboard() {
  const firstPending = mockData.cases.find((c) => c.human_oversight.status === 'PENDING');
 
  const [cases, setCases] = useState(mockData.cases);
  const [selectedId, setSelectedId] = useState((firstPending ?? mockData.cases[0])?.case_id);
  const [tab, setTab] = useState('PENDING');
  const [query, setQuery] = useState('');
 
  // Bozza di valutazione prima dell'invio: { [caseId]: { decision, comment } }
  const [inputs, setInputs] = useState({});
  // Valutazione inviata e BLOCCATA, in attesa che l'operatore risponda al parere dell'AI:
  // { [caseId]: { decision, comment } }
  const [submitted, setSubmitted] = useState({});
  const [focusId, setFocusId] = useState(null);
 
  const detailRef = useRef(null);
  const completionRef = useRef(null);
 
  const activeCase = cases.find((c) => c.case_id === selectedId);
 
  /* -- liste ---------------------------------------------------------------- */
 
  const pendingCases = useMemo(
    () => cases.filter((c) => c.human_oversight.status === 'PENDING'),
    [cases]
  );
  const completedCases = useMemo(
    () =>
      cases
        .filter((c) => c.human_oversight.status === 'COMPLETED')
        .sort((a, b) => (b.human_oversight.reviewed_at ?? '').localeCompare(a.human_oversight.reviewed_at ?? '')),
    [cases]
  );
 
  const visibleCases = useMemo(() => {
    const list = tab === 'PENDING' ? pendingCases : completedCases;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      [c.case_id, c.demographics.name_hash, c.demographics.origin_country].join(' ').toLowerCase().includes(q)
    );
  }, [tab, query, pendingCases, completedCases]);
 
  /* -- stato del caso attivo ------------------------------------------------ */
 
  const ho = activeCase?.human_oversight;
  const ai = activeCase?.ai_assessment;
  const completed = ho?.status === 'COMPLETED';
  const aiAvailable = !!ai && ai.confidence >= CONFIDENCE_THRESHOLD;
  const complicated = !!ai && !aiAvailable;
 
  const sub = completed
    ? { decision: ho.initial_decision, comment: ho.initial_comment }
    : submitted[selectedId];
 
  // DECIDE: valutazione cieca  |  REVIEW: parere AI visibile, in attesa di concordare  |  DONE
  const stage = completed ? 'DONE' : sub ? 'REVIEW' : 'DECIDE';
 
  const input = inputs[selectedId] ?? { decision: null, comment: '' };
  const commentLength = input.comment.trim().length;
  const canSubmit = stage === 'DECIDE' && !!input.decision && commentLength >= MIN_COMMENT;
 
  const factors = activeCase?.factors ?? [];
  const byWeight = (a, b) => b.weight - a.weight;
  const proInclude = factors.filter((f) => f.direction === 'INCLUDE').sort(byWeight);
  const proExclude = factors.filter((f) => f.direction === 'EXCLUDE').sort(byWeight);
  const showFactors = factors.length > 0 && (!complicated || !HIDE_FACTORS_WHEN_LOW_CONFIDENCE);
 
  const dimensions = Object.entries(activeCase?.vulnerability_profile.dimensions ?? {});
  const minors = activeCase?.demographics.unaccompanied_minors ?? 0;
  const cal = activeCase?.calibration;
 
  /* -- azioni --------------------------------------------------------------- */
 
  const selectCase = (id) => {
    setSelectedId(id);
 
    // Su schermi stretti il dettaglio sta sotto la lista: portaci l'utente.
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      );
    }
  };
 
  const setInput = (patch) =>
    setInputs((all) => ({ ...all, [selectedId]: { ...input, ...patch } }));
 
  const finalize = (id, evaluation, finalDecision, agreement) => {
    setCases((all) =>
      all.map((c) =>
        c.case_id === id
          ? {
              ...c,
              human_oversight: {
                status: 'COMPLETED',
                initial_decision: evaluation.decision,
                initial_comment: evaluation.comment,
                ai_agreement: agreement,
                final_decision: finalDecision,
                reviewed_at: new Date().toISOString(),
              },
            }
          : c
      )
    );
    const drop = (obj) => {
      const next = { ...obj };
      delete next[id];
      return next;
    };
    setSubmitted(drop);
    setInputs(drop);
    setFocusId(id);
  };
 
  // 1) L'operatore invia decisione + commento. Da qui la valutazione iniziale non è più modificabile.
  const submitEvaluation = () => {
    if (!canSubmit) return;
    const evaluation = { decision: input.decision, comment: input.comment.trim() };
    if (!aiAvailable) {
      // Caso complicato: nessun parere dell'AI, la decisione è definitiva.
      finalize(selectedId, evaluation, evaluation.decision, 'NOT_AVAILABLE');
    } else {
      setSubmitted((s) => ({ ...s, [selectedId]: evaluation }));
    }
  };
 
  // 2) Dopo aver visto il parere dell'AI, l'operatore concorda o no.
  const answerAgreement = (agree) => {
    const finalDecision = agree ? ai.recommendation : opposite(ai.recommendation);
    finalize(selectedId, sub, finalDecision, agree ? 'AGREE' : 'DISAGREE');
  };
 
  // Dopo la conferma sposta il focus sul riepilogo (o sul feedback dell'esercitazione).
  useEffect(() => {
    if (!focusId) return;
    completionRef.current?.focus();
    setFocusId(null);
  }, [focusId, cases]);
 
  const nextPending = pendingCases.find((c) => c.case_id !== selectedId);
  const goToNext = () => {
    if (!nextPending) return;
    setTab('PENDING');
    selectCase(nextPending.case_id);
  };
 
  /* ====================================================================== */
 
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]" style={{ fontFamily: FONT_STACK }}>
      {/* Intestazione: barra blu + barra blu scuro (rimuovi se l'app ne ha già una) */}
      <header>
        <div className="bg-[#0072BC] border-b-2 border-[#005a96]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
            <Wordmark />
            <div className="hidden sm:inline-flex items-center gap-2 rounded bg-white px-4 py-2 font-bold text-[#0072BC]">
              <Globe className="w-5 h-5" aria-hidden="true" />
              {META.operation ?? 'Operazione'}
            </div>
          </div>
        </div>
 
        <div className="bg-[#18375F]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4">
            <div className="max-w-3xl">
              <ProgressBar done={completedCases.length} total={cases.length} />
            </div>
          </div>
        </div>
      </header>
 
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        <nav aria-label="Percorso" className="flex items-center gap-2 text-sm">
          <Home className="w-4 h-4 text-[#0072BC]" aria-hidden="true" />
          <span className="text-[#0072BC]">Valutazione dei casi</span>
          <span className="text-[#4D4D4D]" aria-hidden="true">/</span>
          <span>Nuclei familiari</span>
        </nav>
 
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold border-b-2 border-[#1A1A1A] pb-4">
          Valutazione dei nuclei familiari
        </h1>
        <p className="mt-4 text-lg max-w-3xl leading-relaxed">
          Leggi il fascicolo, scrivi il tuo commento e scegli se includere o escludere il nucleo dal programma di
          assistenza. Solo dopo l&apos;invio vedrai il parere dell&apos;AI, quando è disponibile.
        </p>
        <p className="mt-2 flex items-start gap-2 max-w-3xl text-[#4D4D4D]">
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-[#18375F]" aria-hidden="true" />
          Tra i casi possono esserci casi già chiusi, inseriti a scopo di formazione. Se ne incontri uno, vedrai
          subito la risposta corretta con una spiegazione dettagliata.
        </p>
 
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-8 lg:gap-10">
          {/* ============================ Coda ============================ */}
          <aside aria-label="Coda di valutazione" className="lg:sticky lg:top-4 lg:self-start">
            <h2 className="text-xl font-bold">Coda di valutazione</h2>
            <p className="mt-1 text-[#4D4D4D]">
              <b className="text-[#1A1A1A] text-2xl">{pendingCases.length}</b> nuclei da valutare
            </p>
 
            {/* Ricerca: bordo scuro da 2px come "Search for a country" */}
            <div className="relative mt-4">
              <label htmlFor="search" className="sr-only">Cerca per ID o paese</label>
              <input
                id="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca per ID o paese"
                className={`w-full rounded border-2 border-[#1A1A1A] bg-white py-3 pl-4 pr-11 text-base placeholder:text-[#6B6B6B] ${FOCUS}`}
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]" aria-hidden="true" />
            </div>
 
            {/* Schede: stile della barra lingue */}
            <div className="mt-4 flex gap-1 rounded bg-[#EFF7FE] p-1.5 text-sm" role="tablist">
              {[
                ['PENDING', `Da valutare (${pendingCases.length})`],
                ['COMPLETED', `Completati (${completedCases.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`flex-1 rounded px-3 py-2 font-bold ${FOCUS} ${
                    tab === key
                      ? 'bg-white text-[#0072BC] shadow-[0_1px_3px_rgba(0,0,0,0.25)]'
                      : 'text-[#0072BC] hover:bg-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
 
            <div className="mt-4 space-y-3 lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto lg:pr-1 lg:-mr-1">
              {visibleCases.length === 0 ? (
                <p className="rounded border-2 border-dashed border-[#B9D6EE] p-6 text-center text-[#4D4D4D]">
                  {query
                    ? 'Nessun nucleo corrisponde alla ricerca.'
                    : tab === 'PENDING'
                    ? 'Hai valutato tutti i nuclei.'
                    : 'Nessun nucleo completato finora.'}
                </p>
              ) : (
                visibleCases.map((req) => (
                  <CaseRow
                    key={req.case_id}
                    req={req}
                    selected={selectedId === req.case_id}
                    inProgress={!!submitted[req.case_id]}
                    onSelect={() => selectCase(req.case_id)}
                  />
                ))
              )}
            </div>
          </aside>
 
          {/* ======================= Dettaglio caso ======================= */}
          {activeCase ? (
            <section ref={detailRef} aria-labelledby="case-title" className="min-w-0 scroll-mt-4">
              {/* Profilo anonimizzato (fascia grigia) */}
              <div className="rounded bg-[#E5E5E5] p-5 sm:p-8">
                <div className="flex items-center gap-5">
                  <div className="w-[72px] h-[72px] shrink-0 rounded border-2 border-[#0072BC] bg-[#EFF7FE] text-[#18375F] flex items-center justify-center">
                    <Users className="w-10 h-10" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <h2 id="case-title" className="text-3xl font-bold leading-tight">
                        Nucleo {activeCase.demographics.name_hash}
                      </h2>
                      <span className="rounded border border-[#1A1A1A]/40 bg-white px-3 py-1 text-sm font-bold">
                        ID {activeCase.case_id}
                      </span>
                    </div>
                    <p className="mt-1 text-[#4D4D4D]">Nucleo familiare anonimizzato</p>
                  </div>
                </div>
 
                <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <Fact icon={Users} label="Componenti" value={activeCase.demographics.family_size} />
                  <Fact icon={Baby} label="Minori di 18 anni" value={activeCase.demographics.children_under_18} />
                  <Fact
                    icon={ShieldAlert}
                    label="Minori non accompagnati"
                    value={activeCase.demographics.unaccompanied_minors}
                    warn={minors > 0}
                  />
                  <Fact icon={Accessibility} label="Persone con disabilità" value={activeCase.demographics.members_with_disability} />
                  <Fact icon={Globe} label="Paese di origine" value={activeCase.demographics.origin_country} />
                  <Fact icon={MapPin} label="Campo attuale" value={activeCase.demographics.current_camp} />
                  <Fact icon={Clock} label="Sfollati da" value={`${activeCase.demographics.months_displaced} mesi`} />
                  <Fact icon={CalendarDays} label="Registrati il" value={fmtDate(activeCase.demographics.registered_on)} />
                </dl>
              </div>
 
              {/* Segnalazioni per l'operatore */}
              {(complicated || (stage !== 'DONE' && minors > 0)) && (
                <div className="mt-6 space-y-3">
                  {complicated && (
                    <Notice title="Caso complicato">
                      {stage === 'DONE'
                        ? "Per questo caso il parere dell'AI non era disponibile."
                        : "Per questo caso il parere dell'AI non è disponibile. Leggi con attenzione tutto il fascicolo e, se hai dubbi, confrontati con un collega prima di decidere."}
                    </Notice>
                  )}
                  {stage !== 'DONE' && minors > 0 && (
                    <Notice
                      title={`Il nucleo accoglie ${minors} ${minors === 1 ? 'minore non accompagnato' : 'minori non accompagnati'}`}
                    >
                      Verifica che le tutele di protezione siano attive.
                    </Notice>
                  )}
                </div>
              )}
 
              <div className="mt-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-10 xl:gap-12">
                {/* ------------------- Colonna sinistra: fascicolo ------------------- */}
                <div className="min-w-0 space-y-12">
                  {/* Feedback dell'esercitazione: subito dopo la decisione finale */}
                  {stage === 'DONE' && cal && (
                    <div ref={completionRef} tabIndex={-1} className="outline-none">
                      <Feedback cal={cal} ho={ho} ai={ai} aiAvailable={aiAvailable} />
                    </div>
                  )}
 
                  {dimensions.length > 0 && (
                    <section aria-labelledby="dim-title">
                      <SectionTitle id="dim-title">Situazione del nucleo</SectionTitle>
                      <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dimensions.map(([key, dim]) => {
                          const meta = DIMENSIONS[key] ?? { label: humanize(key), icon: Info };
                          const s = DIM_LEVELS[dim.level] ?? DIM_LEVELS.stable;
                          const Icon = meta.icon;
                          const StatusIcon = s.icon;
                          return (
                            <li key={key} className={`rounded border p-4 ${s.box}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2 font-bold">
                                  <Icon className="w-5 h-5 text-[#18375F]" aria-hidden="true" />
                                  {meta.label}
                                </span>
                                <span className={`flex items-center gap-1 text-sm font-bold ${s.text}`}>
                                  <StatusIcon className="w-4 h-4" aria-hidden="true" />
                                  {s.label}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed">{dim.note}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}
 
                  {showFactors && (
                    <section aria-labelledby="factors-title">
                      <SectionTitle id="factors-title">
                        Elementi a favore dell&apos;inclusione e dell&apos;esclusione
                      </SectionTitle>
                      <p className="mt-4 text-[#4D4D4D] max-w-2xl leading-relaxed">
                        Sono ordinati per rilevanza. Non indicano di per sé una decisione: sta a te pesarli.
                      </p>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FactorColumn
                          title="A favore dell'inclusione"
                          icon={Plus}
                          tile="bg-[#EFF7FE] text-[#00538A]"
                          bar="border-l-[#0072BC]"
                          items={proInclude}
                        />
                        <FactorColumn
                          title="A favore dell'esclusione"
                          icon={Minus}
                          tile="bg-[#EDEDED] text-[#1A1A1A]"
                          bar="border-l-[#6B6B6B]"
                          items={proExclude}
                        />
                      </div>
                    </section>
                  )}
                </div>
 
                {/* ------------------- Colonna destra: decisione ------------------- */}
                <aside
                  aria-labelledby="action-title"
                  className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto self-start"
                >
                  {/* Box azzurro con bordo, come "I need help with Registration in:" */}
                  <div className="rounded border-2 border-[#7DB2DC] bg-[#EFF7FE] p-6 sm:p-7">
                    <h3 id="action-title" className="text-xl font-bold leading-snug">
                      Decisione per <span className="text-[#0072BC]">{activeCase.case_id}</span>
                    </h3>
 
                    {/* ---------- Fase 1: valutazione cieca ---------- */}
                    {stage === 'DECIDE' && (
                      <div className="mt-5 space-y-6">
                        <p className="leading-relaxed">
                          {aiAvailable
                            ? "Scrivi il tuo commento e scegli una decisione. Dopo l'invio vedrai il parere dell'AI."
                            : "Per questo caso non c'è un parere dell'AI: la decisione che invii è definitiva."}
                        </p>
 
                        <fieldset>
                          <legend className="font-bold mb-2">La tua decisione</legend>
                          <div className="space-y-3">
                            {['INCLUDE', 'EXCLUDE'].map((key) => {
                              const d = DECISIONS[key];
                              const Icon = d.icon;
                              return (
                                <label key={key} className="block cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`decision-${selectedId}`}
                                    value={key}
                                    checked={input.decision === key}
                                    onChange={() => setInput({ decision: key })}
                                    className="peer sr-only"
                                  />
                                  <span className="flex items-start gap-3 rounded border-2 border-[#B9D6EE] bg-white p-4 hover:border-[#0072BC] peer-checked:border-[#0072BC] peer-checked:shadow-[inset_6px_0_0_#0072BC] peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#18375F]">
                                    <span className="w-9 h-9 shrink-0 rounded bg-[#EFF7FE] text-[#18375F] flex items-center justify-center ml-1">
                                      <Icon className="w-5 h-5" aria-hidden="true" />
                                    </span>
                                    <span>
                                      <span className="block font-bold">{d.verb}</span>
                                      <span className="block text-sm text-[#4D4D4D] mt-0.5">{d.desc}</span>
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
 
                        <div>
                          <label htmlFor="comment" className="block font-bold mb-1">
                            Commento (obbligatorio)
                          </label>
                          <p id="comment-hint" className="text-sm text-[#4D4D4D] mb-2">
                            Spiega in poche righe cosa ha pesato di più nella tua valutazione.
                          </p>
                          <textarea
                            id="comment"
                            rows={5}
                            value={input.comment}
                            onChange={(e) => setInput({ comment: e.target.value })}
                            aria-describedby="comment-hint comment-count"
                            className={`w-full resize-none rounded border-2 border-[#1A1A1A] bg-white p-4 placeholder:text-[#6B6B6B] ${FOCUS}`}
                            placeholder="Scrivi qui il tuo commento."
                          />
                          <p id="comment-count" className="mt-1 text-sm text-[#4D4D4D]">
                            {commentLength >= MIN_COMMENT
                              ? 'Commento sufficiente.'
                              : `Servono almeno ${MIN_COMMENT} caratteri (${commentLength}/${MIN_COMMENT}).`}
                          </p>
                        </div>
 
                        <div>
                          <button
                            onClick={submitEvaluation}
                            disabled={!canSubmit}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded bg-[#0072BC] px-5 py-4 text-lg font-bold text-white hover:bg-[#005a96] disabled:bg-[#D9D9D9] disabled:text-[#6B6B6B] disabled:cursor-not-allowed ${FOCUS}`}
                          >
                            {aiAvailable ? 'Invia la valutazione' : 'Invia la decisione definitiva'}
                            <ArrowRight className="w-5 h-5" aria-hidden="true" />
                          </button>
                          <p className="mt-2 text-sm text-[#4D4D4D] text-center">
                            {aiAvailable
                              ? 'Dopo l\'invio non potrai più modificare la valutazione iniziale.'
                              : 'Dopo l\'invio la decisione non potrà più essere modificata.'}
                          </p>
                        </div>
                      </div>
                    )}
 
                    {/* ---------- Fase 2: parere AI e risposta dell'operatore ---------- */}
                    {stage === 'REVIEW' && (
                      <div className="mt-5 space-y-6">
                        <div className="rounded border border-[#7DB2DC] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">La tua valutazione</span>
                            <DecisionTag decision={sub.decision} />
                          </div>
                          <p className="mt-3 leading-relaxed">{sub.comment}</p>
                          <p className="mt-2 text-sm text-[#4D4D4D]">Inviata: non è più modificabile.</p>
                        </div>
 
                        <AiOpinion ai={ai} score={activeCase.vulnerability_profile.overall_score} />
 
                        <fieldset>
                          <legend className="font-bold mb-3">Sei d&apos;accordo con il parere dell&apos;AI?</legend>
                          <div className="space-y-3">
                            <button
                              onClick={() => answerAgreement(true)}
                              className={`w-full text-left rounded border-2 border-[#0072BC] bg-[#0072BC] p-4 text-white hover:bg-[#005a96] ${FOCUS}`}
                            >
                              <span className="block text-lg font-bold">Concordo</span>
                              <span className="block text-sm mt-0.5">
                                Decisione finale: {DECISIONS[ai.recommendation].label}
                              </span>
                            </button>
                            <button
                              onClick={() => answerAgreement(false)}
                              className={`w-full text-left rounded border-2 border-[#0072BC] bg-white p-4 text-[#0072BC] hover:bg-[#EFF7FE] ${FOCUS}`}
                            >
                              <span className="block text-lg font-bold">Non concordo</span>
                              <span className="block text-sm mt-0.5">
                                Decisione finale: {DECISIONS[opposite(ai.recommendation)].label}
                              </span>
                            </button>
                          </div>
                        </fieldset>
                      </div>
                    )}
 
                    {/* ---------- Fase 3: riepilogo ---------- */}
                    {stage === 'DONE' && (
                      <div className="mt-5 space-y-6">
                        <div
                          ref={cal ? null : completionRef}
                          tabIndex={-1}
                          className="rounded border border-[#A9D8BA] bg-[#E8F5EC] p-5 outline-none"
                        >
                          <div className="flex items-center gap-2 font-bold text-[#1D5E36]">
                            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                            Decisione registrata
                          </div>
                          <div className="mt-3">
                            <DecisionTag decision={ho.final_decision} large />
                          </div>
                          <p className="mt-3 text-[#1A1A1A]">
                            {ho.ai_agreement === 'AGREE' && "Hai concordato con il parere dell'AI."}
                            {ho.ai_agreement === 'DISAGREE' && "Non hai concordato con il parere dell'AI."}
                            {ho.ai_agreement === 'NOT_AVAILABLE' && "Il parere dell'AI non era disponibile per questo caso."}
                          </p>
                          {ho.reviewed_at && (
                            <p className="mt-1 text-sm text-[#4D4D4D]">Registrata il {fmtDate(ho.reviewed_at)}.</p>
                          )}
                        </div>
 
                        <div className="rounded border border-[#7DB2DC] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">La tua valutazione iniziale</span>
                            <DecisionTag decision={ho.initial_decision} />
                          </div>
                          <p className="mt-3 leading-relaxed">{ho.initial_comment}</p>
                        </div>
 
                        {aiAvailable && (
                          <AiOpinion ai={ai} score={activeCase.vulnerability_profile.overall_score} />
                        )}
 
                        {nextPending && (
                          <button
                            onClick={goToNext}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded bg-[#0072BC] px-5 py-4 text-lg font-bold text-white hover:bg-[#005a96] ${FOCUS}`}
                          >
                            Passa al prossimo caso
                            <ArrowRight className="w-5 h-5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </section>
          ) : (
            <div className="rounded border-2 border-dashed border-[#B9D6EE] p-10 text-center text-[#4D4D4D]">
              Seleziona un nucleo familiare dalla coda per aprire il fascicolo.
            </div>
          )}
        </div>
 
        {META.disclaimer && <p className="mt-12 text-sm text-[#4D4D4D]">{META.disclaimer}</p>}
      </main>
    </div>
  );
}

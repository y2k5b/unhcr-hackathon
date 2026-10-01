import React, { useMemo, useRef, useState } from 'react';
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
  Wand2,
  ClipboardList,
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
/*  Configurazione letta da mockData.json                                     */
/* ========================================================================== */
 
const META = mockData.meta ?? {};
const TOTAL_FUND = META.fund?.total_usd ?? 0;
const MAX_BUDGET = META.budget?.max_usd ?? 1500;
const STEP = META.budget?.step_usd ?? 50;
const THRESHOLDS = {
  high: META.score_thresholds?.high ?? 75,
  medium: META.score_thresholds?.medium ?? 50,
};
const LOW_CONFIDENCE = 0.75;
 
/* ========================================================================== */
/*  Helper e dizionari                                                        */
/* ========================================================================== */
 
const usd = (n) => `$${Number(n || 0).toLocaleString('it-IT')}`;
 
const humanize = (s) => {
  const t = String(s).replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};
 
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
 
const byScore = (a, b) =>
  b.vulnerability_profile.overall_score - a.vulnerability_profile.overall_score;
 
const LEVELS = {
  high: {
    short: 'Alta',
    long: 'Priorità alta',
    hint: 'Richiede un intervento rapido.',
    chip: 'bg-[#FDECEA] text-[#8A1C12] border-[#F1B5AE]',
  },
  medium: {
    short: 'Media',
    long: 'Priorità media',
    hint: 'Da valutare a breve.',
    chip: 'bg-[#FFF3C4] text-[#6B4E00] border-[#E6BF00]',
  },
  standard: {
    short: 'Standard',
    long: 'Priorità standard',
    hint: 'Situazione più stabile.',
    chip: 'bg-[#EFF7FE] text-[#00538A] border-[#7DB2DC]',
  },
};
 
const getLevel = (score) =>
  score >= THRESHOLDS.high ? LEVELS.high : score >= THRESHOLDS.medium ? LEVELS.medium : LEVELS.standard;
 
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
 
const PRIORITIES = {
  urgent: { label: 'Urgente', chip: LEVELS.high.chip },
  soon: { label: 'A breve', chip: LEVELS.medium.chip },
  routine: { label: 'Di routine', chip: LEVELS.standard.chip },
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
      <span className="text-2xl font-semibold">Aiuti in denaro</span>
    </div>
  );
}
 
/* Box di avviso giallo, come "All UNHCR services are FREE of charge". */
function Notice({ title, children, variant = 'warning' }) {
  const styles =
    variant === 'info'
      ? 'bg-[#EFF7FE] border-[#7DB2DC]'
      : 'bg-[#FFF799] border-[#E6BF00]';
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
function SectionTitle({ icon: Icon, children, id }) {
  return (
    <h3 id={id} className="flex items-center gap-2.5 text-2xl font-bold text-[#1A1A1A] border-b-2 border-[#1A1A1A] pb-3">
      {Icon && <Icon className="w-6 h-6 text-[#18375F]" aria-hidden="true" />}
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
 
/* ========================================================================== */
/*  Barra del fondo (barra secondaria blu scuro)                              */
/* ========================================================================== */
 
function FundBar({ total, allocated, selection }) {
  const pct = (v) => (total > 0 ? Math.min(100, Math.max(0, (v / total) * 100)) : 0);
  const sel = Math.min(selection, Math.max(total - allocated, 0));
  const available = Math.max(total - allocated - sel, 0);
 
  return (
    <div className="w-full text-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-bold">Fondo di assistenza</span>
        <span className="tabular-nums">
          <b>{usd(allocated)}</b> assegnati su {usd(total)}
        </span>
      </div>
      <div
        className="mt-2 h-3 rounded-sm bg-[#3B5F8A] overflow-hidden flex"
        role="progressbar"
        aria-label="Fondo assegnato"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={allocated}
      >
        <div className="h-full bg-white transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct(allocated)}%` }} />
        <div className="h-full bg-[#FFD100] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${pct(sel)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white" />Già assegnato</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FFD100]" />Questa erogazione</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#3B5F8A] border border-white/40" />Disponibile {usd(available)}</span>
      </div>
    </div>
  );
}
 
/* ========================================================================== */
/*  Coda di triage                                                            */
/* ========================================================================== */
 
function CaseRow({ req, selected, draft, onSelect }) {
  const level = getLevel(req.vulnerability_profile.overall_score);
  const pending = req.human_oversight.status === 'PENDING';
 
  return (
    <button
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`w-full text-left rounded border-2 px-4 py-3.5 transition-colors ${FOCUS} ${
        selected
          ? 'bg-white border-[#0072BC] shadow-[inset_6px_0_0_#0072BC] pl-6'
          : 'bg-[#EFF7FE] border-[#B9D6EE] hover:border-[#0072BC]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-[#0072BC] text-lg leading-tight">{req.case_id}</div>
          <div className="mt-1.5 flex items-center gap-2 text-[#4D4D4D]">
            <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{req.demographics.family_size} persone</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[#4D4D4D]">
            <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{req.demographics.origin_country}</span>
          </div>
        </div>
 
        <div className="flex flex-col items-end gap-2 shrink-0">
          {pending ? (
            <span className={`inline-flex items-baseline gap-1.5 rounded border px-2 py-1 font-bold ${level.chip}`}>
              {req.vulnerability_profile.overall_score}
              <span className="text-xs font-semibold">{level.short}</span>
              <span className="sr-only">, {level.long}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border border-[#A9D8BA] bg-[#E8F5EC] px-2 py-1 text-sm font-bold text-[#1D5E36]">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              {usd(req.human_oversight.final_amount)}
            </span>
          )}
          {pending && draft !== undefined && (
            <span className="rounded bg-[#FFF799] border border-[#E6BF00] px-2 py-0.5 text-xs font-bold text-[#4A3B00]">
              Bozza {usd(draft)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
 
/* ========================================================================== */
/*  Valutazione AI                                                            */
/* ========================================================================== */
 
function ScoreScale({ score }) {
  const { high, medium } = THRESHOLDS;
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="flex h-4 overflow-hidden rounded-sm border border-[#1A1A1A]/40">
          <div className="bg-[#CFE3F4]" style={{ width: `${medium}%` }} />
          <div className="bg-[#FFE98A]" style={{ width: `${high - medium}%` }} />
          <div className="bg-[#F5B7B0]" style={{ width: `${100 - high}%` }} />
        </div>
        <div
          className="absolute -top-1.5 h-7 w-1.5 -translate-x-1/2 rounded-sm bg-[#18375F] outline outline-2 outline-white"
          style={{ left: `${score}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-2 flex text-xs font-semibold text-[#4D4D4D]">
        <div style={{ width: `${medium}%` }} className="whitespace-nowrap">Standard 0–{medium - 1}</div>
        <div style={{ width: `${high - medium}%` }} className="whitespace-nowrap">Media {medium}–{high - 1}</div>
        <div style={{ width: `${100 - high}%` }} className="whitespace-nowrap">Alta {high}–100</div>
      </div>
    </div>
  );
}
 
/* Grafico divergente: fattori negativi a sinistra, positivi a destra. */
function FactorBars({ features, baseline, score }) {
  const sorted = [...features].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const max = Math.max(...sorted.map((f) => Math.abs(f.impact)), 1);
 
  return (
    <div>
      <p className="text-[#4D4D4D] leading-relaxed max-w-2xl">
        Si parte da <b className="text-[#1A1A1A]">{baseline} punti</b>, la media dei nuclei valutati. Ogni
        fattore aggiunge o toglie punti. Un fattore &quot;positivo&quot; non è un giudizio sulla famiglia:
        indica quanto pesa sulla priorità di intervento.
      </p>
 
      <div className="mt-6 grid grid-cols-2 gap-6 text-sm font-bold">
        <div className="flex items-center gap-2 text-[#1D5E36]">
          <span className="w-3 h-3 rounded-sm bg-[#1B8A5A]" aria-hidden="true" />
          Fattori negativi
          <span className="font-normal text-[#4D4D4D] hidden sm:inline">(riducono)</span>
        </div>
        <div className="flex items-center justify-end gap-2 text-[#00538A] text-right">
          <span className="font-normal text-[#4D4D4D] hidden sm:inline">(aumentano)</span>
          Fattori positivi
          <span className="w-3 h-3 rounded-sm bg-[#0072BC]" aria-hidden="true" />
        </div>
      </div>
 
      <ul className="mt-4 space-y-5">
        {sorted.map((f) => {
          const positive = f.impact > 0;
          const width = `${(Math.abs(f.impact) / max) * 100}%`;
          return (
            <li key={f.feature}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-bold text-[#1A1A1A]">{f.label ?? humanize(f.feature)}</span>
                <span className={`shrink-0 font-bold tabular-nums ${positive ? 'text-[#00538A]' : 'text-[#1D5E36]'}`}>
                  {positive ? '+' : '−'}
                  {Math.abs(f.impact)} punti
                </span>
              </div>
              {f.detail && <p className="text-sm text-[#4D4D4D] mt-0.5">{f.detail}</p>}
              <div className="relative mt-2 grid grid-cols-2 h-3">
                <span className="absolute left-1/2 -top-1 -bottom-1 w-0.5 -translate-x-1/2 bg-[#1A1A1A]" aria-hidden="true" />
                <div className="bg-[#EAEFF4] rounded-l-sm flex justify-end overflow-hidden">
                  {!positive && <div className="h-full bg-[#1B8A5A]" style={{ width }} />}
                </div>
                <div className="bg-[#EAEFF4] rounded-r-sm overflow-hidden">
                  {positive && <div className="h-full bg-[#0072BC]" style={{ width }} />}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
 
      <div className="mt-6 flex items-baseline justify-between border-t-2 border-[#1A1A1A] pt-3">
        <span className="font-bold">Punteggio finale</span>
        <span className="text-2xl font-black text-[#18375F] tabular-nums">
          {score} <span className="text-base font-semibold text-[#4D4D4D]">su 100</span>
        </span>
      </div>
    </div>
  );
}
 
/* ========================================================================== */
/*  Dashboard                                                                 */
/* ========================================================================== */
 
export default function Dashboard() {
  const firstCase = mockData.cases[0];
 
  const [cases, setCases] = useState(mockData.cases);
  const [selectedId, setSelectedId] = useState(firstCase?.case_id);
  const [tab, setTab] = useState('PENDING');
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState({}); // bozze create da "Distribuisci fondi"
  const [notice, setNotice] = useState(null);
 
  // Human-in-the-loop
  const [manualBudget, setManualBudget] = useState(firstCase?.ai_assessment.suggested_amount_usd ?? 0);
  const [manualReason, setManualReason] = useState('');
 
  const detailRef = useRef(null);
 
  const activeCase = cases.find((c) => c.case_id === selectedId);
  const isPending = activeCase?.human_oversight.status === 'PENDING';
 
  const pendingCases = useMemo(
    () => cases.filter((c) => c.human_oversight.status === 'PENDING').sort(byScore),
    [cases]
  );
  const approvedCases = useMemo(
    () => cases.filter((c) => c.human_oversight.status !== 'PENDING').sort(byScore),
    [cases]
  );
 
  const visibleCases = useMemo(() => {
    const list = tab === 'PENDING' ? pendingCases : approvedCases;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      [c.case_id, c.demographics.name_hash, c.demographics.origin_country]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [tab, query, pendingCases, approvedCases]);
 
  const allocated = approvedCases.reduce((s, c) => s + (c.human_oversight.final_amount || 0), 0);
  const remaining = TOTAL_FUND - allocated;
 
  const suggested = activeCase?.ai_assessment.suggested_amount_usd ?? 0;
  const differs = manualBudget !== suggested;
  const overBudget = manualBudget > remaining;
  const reasonMissing = differs && !manualReason.trim();
  const canConfirm = isPending && !reasonMissing && !overBudget;
 
  /* -- azioni --------------------------------------------------------------- */
 
  const selectCase = (id) => {
    const c = cases.find((x) => x.case_id === id);
    setSelectedId(id);
    setManualBudget(drafts[id] ?? c?.ai_assessment.suggested_amount_usd ?? 0);
    setManualReason('');
    setNotice(null);
 
    // Su schermi stretti il dettaglio sta sotto la lista: portaci l'utente.
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      );
    }
  };
 
  const handleAllocation = () => {
    if (!canConfirm) return;
 
    const updated = cases.map((c) =>
      c.case_id === selectedId
        ? {
            ...c,
            human_oversight: {
              status: 'APPROVED',
              final_amount: manualBudget,
              reason: manualReason.trim(),
              reviewed_at: new Date().toISOString(),
            },
          }
        : c
    );
    setCases(updated);
    setDrafts((d) => {
      const next = { ...d };
      delete next[selectedId];
      return next;
    });
 
    // Passa al nucleo successivo più urgente
    const next = updated.filter((c) => c.human_oversight.status === 'PENDING').sort(byScore)[0];
    if (next) {
      setSelectedId(next.case_id);
      setManualBudget(drafts[next.case_id] ?? next.ai_assessment.suggested_amount_usd);
      setManualReason('');
    }
    setNotice({ title: `Erogazione di ${usd(manualBudget)} confermata per ${selectedId}.` });
  };
 
  // Non approva nulla: prepara bozze che l'operatore conferma caso per caso.
  const autoDistribute = () => {
    if (!pendingCases.length) return;
    const totalSuggested = pendingCases.reduce((s, c) => s + c.ai_assessment.suggested_amount_usd, 0);
    const scale = totalSuggested <= remaining ? 1 : Math.max(remaining, 0) / totalSuggested;
 
    const next = {};
    pendingCases.forEach((c) => {
      const raw = c.ai_assessment.suggested_amount_usd * scale;
      next[c.case_id] = Math.min(MAX_BUDGET, scale === 1 ? raw : Math.floor(raw / STEP) * STEP);
    });
    setDrafts(next);
    if (isPending && next[selectedId] !== undefined) setManualBudget(next[selectedId]);
 
    setNotice(
      scale === 1
        ? {
            title: `Bozze create per ${pendingCases.length} nuclei`,
            text: 'Le raccomandazioni dell\'AI rientrano nel fondo disponibile. Conferma ogni caso per erogare.',
          }
        : {
            title: `Bozze create per ${pendingCases.length} nuclei`,
            text: `Le raccomandazioni superano il fondo disponibile (${usd(remaining)}), quindi sono state ridotte in proporzione. Conferma ogni caso per erogare.`,
          }
    );
  };
 
  /* -- dati derivati per il caso attivo ------------------------------------- */
 
  const score = activeCase?.vulnerability_profile.overall_score ?? 0;
  const level = getLevel(score);
  const features = activeCase?.xai_explanation.feature_importances ?? [];
  const dimensions = Object.entries(activeCase?.vulnerability_profile.dimensions ?? {});
  const plan = activeCase?.ai_assessment.mitigation_plan ?? [];
  const confidence = activeCase?.ai_assessment.confidence;
  const delta = manualBudget - suggested;
  const suggestedPct = (suggested / MAX_BUDGET) * 100;
  const budgetPct = (manualBudget / MAX_BUDGET) * 100;
  const minors = activeCase?.demographics.unaccompanied_minors ?? 0;
 
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]" style={{ fontFamily: FONT_STACK }}>
      {/* Stile dello slider: piatto, con bordo scuro come i campi UNHCR */}
      <style>{`
        .unhcr-range{-webkit-appearance:none;appearance:none;width:100%;height:14px;border:2px solid #1A1A1A;border-radius:4px;cursor:pointer;background:#fff}
        .unhcr-range::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:4px;background:#0072BC;border:3px solid #fff;box-shadow:0 0 0 2px #18375F}
        .unhcr-range::-moz-range-thumb{width:22px;height:22px;border-radius:4px;background:#0072BC;border:3px solid #fff;box-shadow:0 0 0 2px #18375F}
        .unhcr-range:focus-visible{outline:3px solid #18375F;outline-offset:6px}
      `}</style>
 
      {/* ---------------------------------------------------------------- */}
      {/* Intestazione: barra blu + barra blu scuro (rimuovi se l'app ne ha già una) */}
      {/* ---------------------------------------------------------------- */}
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
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
            <div className="flex-1 max-w-3xl">
              <FundBar total={TOTAL_FUND} allocated={allocated} selection={isPending ? manualBudget : 0} />
            </div>
            <button
              onClick={autoDistribute}
              disabled={!pendingCases.length}
              className="inline-flex items-center justify-center gap-3 rounded border-2 border-white bg-[#EFF7FE] px-5 py-3 font-bold text-[#0072BC] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FFD100]"
            >
              Distribuisci fondi
              <span className="w-6 h-6 rounded-full bg-[#0072BC] text-white flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </button>
          </div>
        </div>
      </header>
 
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        <nav aria-label="Percorso" className="flex items-center gap-2 text-sm">
          <Home className="w-4 h-4 text-[#0072BC]" aria-hidden="true" />
          <span className="text-[#0072BC]">Aiuti in denaro</span>
          <span className="text-[#4D4D4D]" aria-hidden="true">/</span>
          <span>Valutazione dei nuclei</span>
        </nav>
 
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold border-b-2 border-[#1A1A1A] pb-4">
          Valutazione dei nuclei familiari
        </h1>
        <p className="mt-4 text-lg max-w-3xl leading-relaxed">
          Rivedi la raccomandazione dell&apos;AI e decidi l&apos;importo da erogare a ogni nucleo. La decisione
          finale è sempre tua.
        </p>
 
        {notice && (
          <div className="mt-6" aria-live="polite">
            <Notice variant="info" title={notice.title}>
              {notice.text}
            </Notice>
          </div>
        )}
 
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-8 lg:gap-10">
          {/* ============================ Coda ============================ */}
          <aside aria-label="Coda di valutazione" className="lg:sticky lg:top-4 lg:self-start">
            <h2 className="text-xl font-bold">Coda di valutazione</h2>
            <p className="mt-1 text-[#4D4D4D]">
              <b className="text-[#1A1A1A] text-2xl">{pendingCases.length}</b> nuclei in attesa
            </p>
 
            {/* Ricerca: bordo scuro da 2px come "Search for a country" */}
            <div className="relative mt-4">
              <label htmlFor="search" className="sr-only">Cerca per ID, codice o paese</label>
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
                ['PENDING', `In attesa (${pendingCases.length})`],
                ['APPROVED', `Erogati (${approvedCases.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`flex-1 rounded px-3 py-2 font-bold ${FOCUS} ${
                    tab === key ? 'bg-white text-[#0072BC] shadow-[0_1px_3px_rgba(0,0,0,0.25)]' : 'text-[#0072BC] hover:bg-white/60'
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
                    ? 'Tutti i nuclei sono stati processati.'
                    : 'Nessuna erogazione confermata finora.'}
                </p>
              ) : (
                visibleCases.map((req) => (
                  <CaseRow
                    key={req.case_id}
                    req={req}
                    selected={selectedId === req.case_id}
                    draft={drafts[req.case_id]}
                    onSelect={() => selectCase(req.case_id)}
                  />
                ))
              )}
            </div>
          </aside>
 
          {/* ======================= Profilo famiglia ====================== */}
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
 
              {/* Avvisi che richiedono attenzione dell'operatore */}
              {isPending && (minors > 0 || (confidence != null && confidence < LOW_CONFIDENCE)) && (
                <div className="mt-6 space-y-3">
                  {minors > 0 && (
                    <Notice
                      title={`Il nucleo accoglie ${minors} ${minors === 1 ? 'minore non accompagnato' : 'minori non accompagnati'}`}
                    >
                      Prima di erogare, verifica che le tutele di protezione siano attive.
                    </Notice>
                  )}
                  {confidence != null && confidence < LOW_CONFIDENCE && (
                    <Notice title={`Affidabilità del modello ridotta (${Math.round(confidence * 100)}%)`}>
                      Alcuni dati del fascicolo potrebbero essere incompleti. Controlla con attenzione la raccomandazione.
                    </Notice>
                  )}
                </div>
              )}
 
              <div className="mt-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-10 xl:gap-12">
                {/* ------------ Colonna sinistra: valutazione AI ------------ */}
                <div className="min-w-0 space-y-12">
                  <section aria-labelledby="ai-title">
                    <SectionTitle id="ai-title">Valutazione AI della vulnerabilità</SectionTitle>
 
                    <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
                      <div className="flex items-end gap-2">
                        <span className="text-7xl font-black leading-none text-[#18375F] tabular-nums">{score}</span>
                        <span className="pb-1 text-xl font-semibold text-[#4D4D4D]">/100</span>
                      </div>
                      <div className="pb-1">
                        <span className={`inline-block rounded border px-3 py-1 font-bold ${level.chip}`}>
                          {level.long}
                        </span>
                        <p className="mt-1 text-sm text-[#4D4D4D]">{level.hint}</p>
                      </div>
                    </div>
 
                    <ScoreScale score={score} />
 
                    <p className="mt-6 text-lg leading-relaxed max-w-2xl">
                      {activeCase.xai_explanation.operator_summary}
                    </p>
 
                    {dimensions.length > 0 && (
                      <>
                        <h4 className="mt-8 mb-3 font-bold text-lg">Salute e sicurezza</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      </>
                    )}
                  </section>
 
                  <section aria-labelledby="why-title">
                    <SectionTitle id="why-title" icon={Info}>Perché questo punteggio?</SectionTitle>
                    <div className="mt-6">
                      <FactorBars
                        features={features}
                        baseline={activeCase.xai_explanation.baseline_score ?? 50}
                        score={score}
                      />
                    </div>
                    {META.model && (
                      <p className="mt-4 text-sm text-[#4D4D4D]">
                        Valutazione generata da: {META.model.name}, versione {META.model.version}.
                      </p>
                    )}
                  </section>
 
                  {plan.length > 0 && (
                    <section aria-labelledby="plan-title">
                      <SectionTitle id="plan-title" icon={ClipboardList}>Piano di mitigazione suggerito</SectionTitle>
                      <ul className="mt-2">
                        {plan.map((item) => {
                          const p = PRIORITIES[item.priority] ?? PRIORITIES.routine;
                          return (
                            <li
                              key={item.action}
                              className="flex items-start justify-between gap-4 border-b border-[#D9D9D9] py-4"
                            >
                              <span className="leading-relaxed">{item.action}</span>
                              <span className={`shrink-0 rounded border px-2.5 py-0.5 text-sm font-bold ${p.chip}`}>
                                {p.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </div>
 
                {/* ------------ Colonna destra: pannello azione (HITL) ------------ */}
                <aside aria-labelledby="action-title" className="xl:sticky xl:top-4 self-start">
                  {/* Box azzurro con bordo, come "I need help with Registration in:" */}
                  <div className="rounded border-2 border-[#7DB2DC] bg-[#EFF7FE] p-6 sm:p-7">
                    <h3 id="action-title" className="text-xl font-bold leading-snug">
                      Erogazione per <span className="text-[#0072BC]">{activeCase.case_id}</span>
                    </h3>
 
                    {isPending ? (
                      <div className="mt-6 space-y-7">
                        {/* Raccomandazione AI */}
                        <div>
                          <div className="text-[#4D4D4D]">Importo raccomandato dall&apos;AI</div>
                          <div className="mt-1 text-5xl font-black text-[#18375F] tabular-nums">{usd(suggested)}</div>
                          {confidence != null && (
                            <div className="mt-1 text-sm text-[#4D4D4D]">
                              Affidabilità del modello: {Math.round(confidence * 100)}%
                            </div>
                          )}
                        </div>
 
                        {/* Slider */}
                        <div>
                          <div className="flex items-baseline justify-between gap-3 mb-3">
                            <label htmlFor="budget" className="font-bold">Importo da erogare</label>
                            <span className="text-2xl font-black tabular-nums">{usd(manualBudget)}</span>
                          </div>
 
                          <input
                            id="budget"
                            type="range"
                            className="unhcr-range"
                            min="0"
                            max={MAX_BUDGET}
                            step={STEP}
                            value={manualBudget}
                            onChange={(e) => setManualBudget(Number(e.target.value))}
                            style={{ background: `linear-gradient(to right, #7DB2DC ${budgetPct}%, #fff ${budgetPct}%)` }}
                            aria-valuetext={usd(manualBudget)}
                          />
 
                          {/* Segno della raccomandazione AI */}
                          <div className="relative h-7 mt-2" aria-hidden="true">
                            <div
                              className="absolute flex flex-col items-center -translate-x-1/2"
                              style={{ left: `calc(${suggestedPct}% + ${14 - suggestedPct * 0.28}px)` }}
                            >
                              <span className="w-0.5 h-2 bg-[#1A1A1A]" />
                              <span className="text-xs font-bold whitespace-nowrap">AI</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm text-[#4D4D4D] -mt-1">
                            <span>{usd(0)}</span>
                            <span>{usd(MAX_BUDGET)}</span>
                          </div>
 
                          <div className="mt-4">
                            {differs ? (
                              <span className="inline-block rounded border border-[#E6BF00] bg-[#FFF799] px-3 py-1 text-sm font-bold text-[#4A3B00]">
                                {delta > 0 ? '+' : '−'}
                                {usd(Math.abs(delta))} rispetto alla raccomandazione
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded border border-[#A9D8BA] bg-[#E8F5EC] px-3 py-1 text-sm font-bold text-[#1D5E36]">
                                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                                In linea con la raccomandazione
                              </span>
                            )}
                          </div>
 
                          {overBudget ? (
                            <div className="mt-4" role="alert">
                              <Notice title="Importo oltre il fondo disponibile">
                                Restano {usd(Math.max(remaining, 0))}. Riduci l&apos;importo per poter confermare.
                              </Notice>
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-[#4D4D4D]">
                              Dopo questa erogazione restano <b className="text-[#1A1A1A]">{usd(remaining - manualBudget)}</b> nel fondo.
                            </p>
                          )}
                        </div>
 
                        {/* Motivazione */}
                        <div>
                          <label htmlFor="reason" className="block font-bold mb-2">
                            {differs ? 'Motivo della modifica (obbligatorio)' : 'Note per il fascicolo (facoltative)'}
                          </label>
                          <textarea
                            id="reason"
                            rows={4}
                            value={manualReason}
                            onChange={(e) => setManualReason(e.target.value)}
                            aria-invalid={reasonMissing}
                            placeholder={
                              differs
                                ? "Spiega perché l'importo è diverso da quello raccomandato dall'AI."
                                : 'Aggiungi eventuali note operative.'
                            }
                            className={`w-full resize-none rounded border-2 bg-white p-4 placeholder:text-[#6B6B6B] ${FOCUS} ${
                              reasonMissing ? 'border-[#E6BF00]' : 'border-[#1A1A1A]'
                            }`}
                          />
                        </div>
 
                        {/* Conferma */}
                        <div>
                          <button
                            onClick={handleAllocation}
                            disabled={!canConfirm}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded bg-[#0072BC] px-5 py-4 text-lg font-bold text-white hover:bg-[#005a96] disabled:bg-[#D9D9D9] disabled:text-[#6B6B6B] disabled:cursor-not-allowed ${FOCUS}`}
                          >
                            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                            Conferma erogazione di {usd(manualBudget)}
                          </button>
                          {reasonMissing && (
                            <p className="mt-2 text-sm text-[#4D4D4D] text-center">
                              Inserisci il motivo della modifica per poter confermare.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-center py-4">
                        <div className="mx-auto w-14 h-14 rounded-full bg-[#E8F5EC] text-[#1D5E36] flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                        </div>
                        <h4 className="mt-4 text-xl font-bold">Erogazione approvata</h4>
                        <p className="mt-2 text-5xl font-black text-[#18375F] tabular-nums">
                          {usd(activeCase.human_oversight.final_amount)}
                        </p>
                        <p className="mt-3 text-[#4D4D4D]">
                          {activeCase.human_oversight.final_amount === suggested
                            ? "Importo in linea con la raccomandazione dell'AI."
                            : `Raccomandazione dell'AI: ${usd(suggested)}.`}
                        </p>
                        {activeCase.human_oversight.reviewed_at && (
                          <p className="mt-1 text-sm text-[#4D4D4D]">
                            Confermata il {fmtDate(activeCase.human_oversight.reviewed_at)}.
                          </p>
                        )}
                        {activeCase.human_oversight.reason && (
                          <blockquote className="mt-5 rounded border border-[#7DB2DC] bg-white p-4 text-left leading-relaxed">
                            {activeCase.human_oversight.reason}
                          </blockquote>
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
 
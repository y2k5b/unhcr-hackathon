import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Wallet,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Clock,
  Globe,
  CalendarDays,
  Search,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  FileText,
  Package,
  GraduationCap,
  Puzzle,
  Languages,
  ChevronDown,
} from 'lucide-react';

/* ========================================================================== */
/*  Design tokens (ricavati da help.unhcr.org)                                */
/*                                                                            */
/*  blu UNHCR    #0072BC  barra principale, link, azioni primarie             */
/*  blu scuro    #18375F  barra secondaria, pittogrammi, testi forti          */
/*  azzurro      #EFF7FE  sfondo di card e box                                */
/*  bordo azz.   #7DB2DC  bordi dei box informativi                           */
/*  giallo UNHCR #FFD500  barra di avanzamento                                */
/*  giallo avv.  #FFF799  box di avviso (bordo #E6BF00)                       */
/*  viola        #6B4FA3  casi complicati (solo per questo scopo)             */
/*  verde/rosso           elementi a favore di inclusione / esclusione        */
/*  grigio fascia #E5E5E5 fasce di contenuto                                  */
/*  inchiostro   #1A1A1A  testo, titoli, linee sotto i titoli, input          */
/* ========================================================================== */

// Sostituisci con il font ufficiale UNHCR se disponibile nel progetto.
const FONT_STACK = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#18375F]';

// Variante del focus per gli elementi su fondo blu scuro.
const FOCUS_ON_DARK =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white';

const UNHCR_YELLOW = '#FFD500';

/* ========================================================================== */
/*  Configurazione                                                            */
/* ========================================================================== */

const META = mockData.meta ?? {};

// Sotto questa soglia il parere dell'AI non viene mostrato e il caso è "complicato".
const CONFIDENCE_THRESHOLD = META.confidence_threshold ?? 0.7;

// Lunghezza minima dei commenti richiesti (valutazione e motivazione del dissenso).
const MIN_COMMENT = META.min_comment_length ?? 15;

// Nei casi complicati nascondi le colonne "a favore di inclusione / esclusione"
// (considerate parte del parere del modello). I dati del fascicolo restano tutti
// visibili, per categoria, senza indicazione di direzione, peso o avvisi.
const HIDE_FACTORS_WHEN_LOW_CONFIDENCE = true;

/* ========================================================================== */
/*  Lingue dell'interfaccia                                                   */
/*  Per ora funziona solo l'inglese: le altre sono elencate ma non            */
/*  selezionabili. Per attivarne una, imposta available: true e fornisci i    */
/*  testi tradotti.                                                           */
/* ========================================================================== */

const LANGUAGES = [
  { code: 'en', label: 'English', available: true },
  { code: 'it', label: 'Italiano', available: false },
  { code: 'fr', label: 'Français', available: false },
  { code: 'es', label: 'Español', available: false },
];

const DEFAULT_LANGUAGE = 'en';

/* ========================================================================== */
/*  Helper e dizionari                                                        */
/* ========================================================================== */

const humanize = (s) => {
  const t = String(s).replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

const opposite = (d) => (d === 'INCLUDE' ? 'EXCLUDE' : 'INCLUDE');

const isComplicated = (c) => !!c.ai_assessment && c.ai_assessment.confidence < CONFIDENCE_THRESHOLD;

const DECISIONS = {
  INCLUDE: {
    label: 'Inclusion',
    verb: 'Include the household',
    desc: 'The household joins the assistance programme.',
    icon: UserCheck,
    chip: 'bg-[#E8F5EC] text-[#1D5E36] border-[#A9D8BA]',
    tile: 'bg-[#E8F5EC] text-[#1D5E36]',
    title: 'text-[#1D5E36]',
    card: 'border-[#A9D8BA] hover:border-[#2E8B57] peer-checked:border-[#2E8B57] peer-checked:bg-[#E8F5EC] peer-checked:shadow-[inset_6px_0_0_#2E8B57]',
  },
  EXCLUDE: {
    label: 'Exclusion',
    verb: 'Exclude the household',
    desc: 'The household does not join the programme for now.',
    icon: UserX,
    chip: 'bg-[#FDECEA] text-[#8A1C12] border-[#F1B5AE]',
    tile: 'bg-[#FDECEA] text-[#8A1C12]',
    title: 'text-[#8A1C12]',
    card: 'border-[#F1B5AE] hover:border-[#C0392B] peer-checked:border-[#C0392B] peer-checked:bg-[#FDECEA] peer-checked:shadow-[inset_6px_0_0_#C0392B]',
  },
};

const DIMENSIONS = {
  health: { label: 'Health', icon: HeartPulse },
  safety: { label: 'Safety', icon: ShieldCheck },
  food: { label: 'Food', icon: Utensils },
  shelter: { label: 'Shelter', icon: Home },
};

const DIM_LEVELS = {
  critical: { label: 'Critical', icon: AlertTriangle, box: 'bg-[#FDECEA] border-[#F1B5AE]', text: 'text-[#8A1C12]' },
  attention: { label: 'Monitor', icon: AlertCircle, box: 'bg-[#FFF799] border-[#E6BF00]', text: 'text-[#4A3B00]' },
  stable: { label: 'Stable', icon: CheckCircle2, box: 'bg-[#E8F5EC] border-[#A9D8BA]', text: 'text-[#1D5E36]' },
};

/* -- Fascicolo completo (casi complicati) ---------------------------------- */

const AREAS = {
  household: { label: 'Household composition', icon: Users },
  health: { label: 'Health', icon: HeartPulse },
  safety: { label: 'Safety and protection', icon: ShieldCheck },
  food: { label: 'Food', icon: Utensils },
  shelter: { label: 'Shelter', icon: Home },
  economy: { label: 'Income and support', icon: Wallet },
  assistance: { label: 'Assistance received', icon: Package },
  documents: { label: 'Documents and registration', icon: FileText },
  other: { label: 'Other information', icon: Info },
};

const AREA_ORDER = ['household', 'health', 'safety', 'food', 'shelter', 'economy', 'assistance', 'documents', 'other'];

// Se un caso non ha il campo "dossier", i dati vengono ricavati da "factors":
// qui si indica a quale area appartiene ciascun elemento. Le chiavi non
// elencate finiscono in "Other information".
const FACTOR_AREA = {
  chronic_illness: 'health',
  disability: 'health',
  health_concern: 'health',
  health_access: 'health',
  reduced_mobility: 'health',
  unaccompanied_minors: 'safety',
  single_caregiver: 'safety',
  no_support_network: 'safety',
  food_insecurity: 'food',
  recent_assistance: 'assistance',
  shelter_conditions: 'shelter',
  stable_housing: 'shelter',
  large_family_size: 'household',
  small_household: 'household',
  no_income: 'economy',
  has_income: 'economy',
  reported_income: 'economy',
  regular_remittances: 'economy',
  community_support: 'economy',
  documented_status: 'documents',
};

// Nei casi complicati si mostrano solo i dati: niente livelli (critico, da
// monitorare...), note di sintesi o segnalazioni sulle singole voci, che
// orienterebbero la decisione.
const buildAreas = (c) => {
  const rowsByArea = {};
  const add = (area, row) => {
    rowsByArea[area] = rowsByArea[area] || [];
    rowsByArea[area].push(row);
  };

  if (c.dossier) {
    Object.entries(c.dossier).forEach(([area, rows]) =>
      rows.forEach((r) => add(area, { label: r.label, value: r.value }))
    );
  } else {
    (c.factors ?? []).forEach((f) =>
      add(FACTOR_AREA[f.key] ?? 'other', { label: f.label ?? humanize(f.key), value: f.detail ?? '' })
    );
  }

  // Eventuali categorie non previste dal dizionario non vanno perse.
  const extra = Object.keys(rowsByArea).filter((k) => !AREAS[k]);
  return [...AREA_ORDER, ...extra]
    .map((key) => ({
      key,
      label: AREAS[key]?.label ?? humanize(key),
      icon: AREAS[key]?.icon ?? Info,
      rows: rowsByArea[key] ?? [],
    }))
    .filter((a) => a.rows.length > 0);
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
      <span className="text-2xl font-semibold">Case assessment</span>
    </div>
  );
}

/*
  Box di avviso. Ogni variante ha un significato diverso, così non si confondono:
  - warning      giallo   → attenzione operativa (es. minori non accompagnati)
  - info         azzurro  → informazione generica
  - training     azzurro con bordo scuro → casi di esercitazione
*/
const NOTICE_STYLES = {
  warning: { box: 'border bg-[#FFF799] border-[#E6BF00]', icon: 'text-[#18375F]' },
  info: { box: 'border bg-[#EFF7FE] border-[#7DB2DC]', icon: 'text-[#18375F]' },
  training: { box: 'border-2 bg-[#EFF7FE] border-[#18375F]', icon: 'text-[#18375F]' },
};

function Notice({ title, children, variant = 'warning', icon: Icon = Info }) {
  const s = NOTICE_STYLES[variant] ?? NOTICE_STYLES.warning;
  return (
    <div role="note" className={`flex gap-3 rounded p-4 text-[#1A1A1A] ${s.box}`}>
      <Icon className={`w-6 h-6 mt-0.5 shrink-0 ${s.icon}`} aria-hidden="true" />
      <div>
        <p className="font-bold text-lg leading-snug">{title}</p>
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

/* dt e dd sono figli diretti del div (struttura valida dentro <dl>); l'icona sta nel dt. */
function Fact({ icon: Icon, label, value, warn = false }) {
  return (
    <div className="relative flex min-h-[4.25rem] flex-col justify-center rounded bg-white py-3 pr-3 pl-[4.25rem] leading-tight">
      <dt className="text-sm text-[#4D4D4D] break-words hyphens-auto">
        <span
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded flex items-center justify-center ${
            warn ? 'bg-[#FFF799] text-[#4A3B00]' : 'bg-[#EFF7FE] text-[#18375F]'
          }`}
          aria-hidden="true"
        >
          <Icon className="w-6 h-6" />
        </span>
        {label}
      </dt>
      <dd className="mt-0.5 font-bold text-[#1A1A1A] break-words">{value}</dd>
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

/*
  Casi complicati. L'icona è un pezzo di puzzle: il quadro non si compone da
  solo e va ricostruito dall'operatore. Stessa icona nella coda e nel dettaglio.
*/
const ComplicatedIcon = Puzzle;

/* Etichetta nella coda. */
function ComplicatedTag() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-[#6B4FA3] px-2 py-0.5 text-sm font-bold text-white">
      <ComplicatedIcon className="w-4 h-4" aria-hidden="true" />
      Complicated case
    </span>
  );
}

/* Indicatore leggero dentro la card del caso, in alto a destra. */
function ComplicatedBadge({ id, done }) {
  return (
    <div
      id={id}
      className="inline-flex items-start gap-2 rounded border border-[#C9BBE3] bg-[#F7F4FB] px-3 py-2 text-[#4B2E83]"
    >
      <ComplicatedIcon className="w-5 h-5 mt-px shrink-0" aria-hidden="true" />
      <div className="leading-tight">
        <p className="font-bold">Complicated case</p>
        <p className="text-sm">{done ? 'The AI opinion was not available' : 'No AI opinion available'}</p>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Barra di avanzamento (barra secondaria blu scuro, riempimento giallo)     */
/* ========================================================================== */

function ProgressBar({ done, total }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div className="w-full text-white">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-bold" id="progress-label">Progress</span>
        <span className="tabular-nums" aria-hidden="true">
          <b>{done}</b> of {total} cases assessed
        </span>
      </div>
      <div
        className="mt-2 h-3 rounded-sm bg-[#3B5F8A] overflow-hidden"
        role="progressbar"
        aria-labelledby="progress-label"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} cases assessed`}
      >
        <div
          className="h-full transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%`, backgroundColor: UNHCR_YELLOW }}
        />
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Selettore della lingua (barra blu scuro)                                  */
/* ========================================================================== */

function LanguageSelect({ value, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-3 text-white">
      <label htmlFor="language" className="font-bold">
        Language
      </label>
      <div className="relative">
        <Languages
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          aria-hidden="true"
        />
        <select
          id="language"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby="language-hint"
          className={`min-h-[44px] cursor-pointer appearance-none rounded border-2 border-white bg-[#18375F] py-2 pl-10 pr-10 font-bold text-white hover:bg-[#22487A] ${FOCUS_ON_DARK}`}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} lang={l.code} disabled={!l.available}>
              {l.available ? l.label : `${l.label} (coming soon)`}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5"
          aria-hidden="true"
        />
      </div>
      <p id="language-hint" className="sr-only">
        Only English is available for now.
      </p>
    </div>
  );
}

/* ========================================================================== */
/*  Coda: nessun punteggio, nessuna priorità, nessun indizio sul parere AI    */
/*  (unica eccezione: i casi complicati, con etichetta e colore viola)        */
/* ========================================================================== */

function CaseRow({ req, selected, inProgress, onSelect }) {
  const ho = req.human_oversight;
  const completed = ho.status === 'COMPLETED';
  const complicated = isComplicated(req);

  const tone = complicated
    ? selected
      ? 'bg-white border-[#6B4FA3] shadow-[inset_6px_0_0_#6B4FA3]'
      : 'bg-[#F1ECF8] border-[#C9BBE3] shadow-[inset_6px_0_0_#8C74BD] hover:border-[#6B4FA3]'
    : selected
    ? 'bg-white border-[#0072BC] shadow-[inset_6px_0_0_#0072BC]'
    : 'bg-[#EFF7FE] border-[#B9D6EE] hover:border-[#0072BC]';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      aria-controls="case-detail"
      className={`w-full text-left rounded border-2 px-4 py-3.5 transition-colors ${FOCUS} ${tone}`}
    >
      {complicated && (
        <div className="pl-1 mb-2">
          <ComplicatedTag />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pl-1">
          <div className={`font-bold text-lg leading-tight ${complicated ? 'text-[#4B2E83]' : 'text-[#0072BC]'}`}>
            {req.case_id}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[#4D4D4D]">
            <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{plural(req.demographics.family_size, 'person', 'people')}</span>
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
              To confirm
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

const FACTOR_TONES = {
  INCLUDE: { tile: 'bg-[#E8F5EC] text-[#1D5E36]', bar: 'border-l-[#2E8B57]' },
  EXCLUDE: { tile: 'bg-[#FDECEA] text-[#8A1C12]', bar: 'border-l-[#C0392B]' },
};

function FactorColumn({ title, icon: Icon, tone, items }) {
  const t = FACTOR_TONES[tone];
  return (
    <div>
      <h4 className="flex items-center gap-2.5 text-lg font-bold">
        <span className={`w-8 h-8 rounded flex items-center justify-center ${t.tile}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        {title}
        <span className="text-[#4D4D4D] font-normal">({items.length})</span>
      </h4>
      {items.length === 0 ? (
        <p className="mt-3 text-[#4D4D4D]">No elements found.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((f) => (
            <li key={f.key} className={`rounded border border-l-[6px] border-[#D9D9D9] bg-white p-4 ${t.bar}`}>
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
/*  Fascicolo completo (solo casi complicati)                                 */
/*  Solo dati, raggruppati per categoria, in righe "voce: valore".            */
/*  Nessun suggerimento, avviso, livello o segnalazione.                      */
/* ========================================================================== */

function Dossier({ areas }) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
      {areas.map((a) => {
        const Icon = a.icon;
        const headId = `area-${a.key}`;
        return (
          <section
            key={a.key}
            aria-labelledby={headId}
            className="rounded border border-[#B9D6EE] bg-white overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-[#B9D6EE] bg-[#EFF7FE] px-4 py-3">
              <span className="w-8 h-8 shrink-0 rounded bg-white text-[#18375F] flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <h4 id={headId} className="font-bold text-lg leading-tight">
                {a.label}
              </h4>
            </div>

            <dl className="px-4 pb-1 divide-y divide-[#E5E5E5]">
              {a.rows.map((r) => (
                <div
                  key={r.label}
                  className="py-2.5 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
                >
                  <dt className="text-sm text-[#4D4D4D] sm:pt-0.5">{r.label}</dt>
                  <dd className="mt-0.5 sm:mt-0 leading-snug">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

/* ========================================================================== */
/*  Parere dell'AI (mostrato solo dopo l'invio della valutazione)             */
/* ========================================================================== */

function AiOpinion({ ai, score }) {
  return (
    <div className="rounded border-2 border-[#18375F] bg-white p-5">
      <h4 className="flex items-center gap-2 font-bold text-[#18375F]">
        <Sparkles className="w-5 h-5" aria-hidden="true" />
        AI opinion
      </h4>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-[#4D4D4D]">Recommends</span>
        <DecisionTag decision={ai.recommendation} large />
      </div>
      <p className="mt-4 leading-relaxed">{ai.comment}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#D9D9D9] pt-4">
        <div>
          <dt className="text-sm text-[#4D4D4D]">Vulnerability index</dt>
          <dd className="text-xl font-black text-[#18375F] tabular-nums">
            {score}
            <span className="text-sm font-semibold text-[#4D4D4D]"> out of 100</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-[#4D4D4D]">Confidence</dt>
          <dd className="text-xl font-black text-[#18375F] tabular-nums">{Math.round(ai.confidence * 100)}%</dd>
        </div>
      </dl>
      {META.model && (
        <p className="mt-3 text-xs text-[#4D4D4D]">
          {META.model.name}, version {META.model.version}.
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
          Training exercise: case already closed on {fmtDate(cal.closed_on)}
        </p>
        <h3 id="fb-title" className="mt-1 flex items-center gap-2 text-2xl font-bold">
          {correct ? (
            <CheckCircle2 className="w-7 h-7 text-[#1D5E36]" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-7 h-7 text-[#4A3B00]" aria-hidden="true" />
          )}
          {correct ? 'Correct answer' : 'Incorrect answer'}
        </h3>
        <p className="mt-2 leading-relaxed">
          This case had already been decided and was added to the live queue for training. {ex.summary}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-xs text-[#4D4D4D]">Initial assessment</dt>
            <dd className="mt-1"><DecisionTag decision={ho.initial_decision} /></dd>
          </div>
          <div>
            <dt className="text-xs text-[#4D4D4D]">Final decision</dt>
            <dd className="mt-1"><DecisionTag decision={ho.final_decision} /></dd>
          </div>
          <div>
            <dt className="text-xs text-[#4D4D4D]">Correct answer</dt>
            <dd className="mt-1"><DecisionTag decision={reference} /></dd>
          </div>
        </dl>
      </div>

      <div className="p-5 sm:p-6 space-y-8">
        {(changedFromCorrect || agreedWithWrongAi) && (
          <Notice
            title={
              changedFromCorrect
                ? 'Your initial assessment was correct'
                : 'You agreed with an incorrect AI opinion'
            }
          >
            {changedFromCorrect
              ? 'You changed your decision after seeing the AI opinion. Before changing your mind, check which new elements justify the change.'
              : 'When the AI opinion and your reading of the case file diverge, go back over the evidence before agreeing.'}
          </Notice>
        )}

        <div>
          <h4 className="text-lg font-bold">Why this is the correct answer</h4>
          <div className="mt-3 space-y-4 leading-relaxed max-w-3xl">
            {ex.rationale.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold">The decisive elements</h4>
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
          <h4 className="text-lg font-bold">Mistakes to avoid</h4>
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
          <h4 className="text-lg font-bold">What about the AI opinion?</h4>
          {aiAvailable && (
            <p
              className={`mt-3 inline-block rounded border px-3 py-1 text-sm font-bold ${
                aiCorrect
                  ? 'bg-[#E8F5EC] border-[#A9D8BA] text-[#1D5E36]'
                  : 'bg-[#FFF799] border-[#E6BF00] text-[#4A3B00]'
              }`}
            >
              {aiCorrect ? 'The AI opinion was correct' : 'The AI opinion was not correct'}
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

const TABS = ['PENDING', 'COMPLETED'];

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
  // Risposta al parere dell'AI: { [caseId]: { disagreeing, comment } }
  // "comment" è la seconda motivazione, richiesta solo se l'operatore non concorda.
  const [review, setReview] = useState({});
  // Dove spostare il focus dopo un'azione che fa sparire il pulsante premuto.
  const [pendingFocus, setPendingFocus] = useState(null);

  // Lingua dell'interfaccia e messaggi per i lettori di schermo.
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [announcement, setAnnouncement] = useState('');

  const detailRef = useRef(null);
  const completionRef = useRef(null);
  const reviewRef = useRef(null);
  const listRef = useRef(null);
  const tabRefs = useRef({});

  /* -- lingua e accessibilità --------------------------------------------- */

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (code) => {
    if (LANGUAGES.find((l) => l.code === code)?.available) setLanguage(code);
  };

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Svuota e riscrive il messaggio, così anche un testo identico viene riletto.
  const announce = useCallback((msg) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(msg), 50);
  }, []);

  // Su desktop l'area scorrevole della coda si ferma al bordo inferiore dello schermo
  // (non della pagina), qualunque sia la posizione di scroll.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;
    const fit = () => {
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        el.style.maxHeight = '';
        return;
      }
      const top = el.getBoundingClientRect().top;
      el.style.maxHeight = `${Math.max(160, window.innerHeight - top - 16)}px`;
    };
    fit();
    window.addEventListener('scroll', fit, { passive: true });
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('scroll', fit);
      window.removeEventListener('resize', fit);
    };
  }, []);

  const activeCase = cases.find((c) => c.case_id === selectedId);

  // Il titolo della scheda del browser dice quale caso è aperto.
  useEffect(() => {
    document.title = activeCase ? `Case ${activeCase.case_id} | Case assessment` : 'Case assessment';
  }, [activeCase]);

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
    return list.filter((c) => [c.case_id, c.demographics.origin_country].join(' ').toLowerCase().includes(q));
  }, [tab, query, pendingCases, completedCases]);

  // Risultati della ricerca annunciati quando l'utente smette di scrivere.
  useEffect(() => {
    if (!query.trim()) return undefined;
    const t = window.setTimeout(
      () => announce(visibleCases.length === 0 ? 'No cases found.' : `${plural(visibleCases.length, 'case', 'cases')} found.`),
      600
    );
    return () => window.clearTimeout(t);
  }, [query, visibleCases.length, announce]);

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
  const commentOk = commentLength >= MIN_COMMENT;
  const canSubmit = stage === 'DECIDE' && !!input.decision && commentOk;

  const rev = review[selectedId] ?? { disagreeing: false, comment: '' };
  const disagreeLength = rev.comment.trim().length;
  const disagreeOk = disagreeLength >= MIN_COMMENT;
  const canConfirmDisagree = stage === 'REVIEW' && rev.disagreeing && disagreeOk;

  const factors = activeCase?.factors ?? [];
  const byWeight = (a, b) => b.weight - a.weight;
  const proInclude = factors.filter((f) => f.direction === 'INCLUDE').sort(byWeight);
  const proExclude = factors.filter((f) => f.direction === 'EXCLUDE').sort(byWeight);
  const showFactors = factors.length > 0 && (!complicated || !HIDE_FACTORS_WHEN_LOW_CONFIDENCE);

  const dimensions = Object.entries(activeCase?.vulnerability_profile.dimensions ?? {});
  const areas = useMemo(() => (activeCase && complicated ? buildAreas(activeCase) : []), [activeCase, complicated]);
  const minors = activeCase?.demographics.unaccompanied_minors ?? 0;
  const cal = activeCase?.calibration;

  // Spiega ai lettori di schermo perché il pulsante di invio è disattivato.
  const submitHint = [
    !input.decision && 'Choose a decision.',
    !commentOk && `Write a comment of at least ${MIN_COMMENT} characters.`,
  ]
    .filter(Boolean)
    .join(' ');

  /* -- azioni --------------------------------------------------------------- */

  const selectCase = (id) => {
    setSelectedId(id);
    announce(`Case ${id} opened.`);

    // Su schermi stretti il dettaglio sta sotto la lista: portaci l'utente.
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' })
      );
    }
  };

  const setInput = (patch) =>
    setInputs((all) => ({ ...all, [selectedId]: { ...input, ...patch } }));

  const setRev = (patch) =>
    setReview((all) => ({ ...all, [selectedId]: { ...rev, ...patch } }));

  const finalize = (id, evaluation, finalDecision, agreement, disagreementComment = null) => {
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
                disagreement_comment: disagreementComment,
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
    setReview(drop);
    setPendingFocus('completion');
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
      setPendingFocus('review');
    }
  };

  // 2a) Dopo aver visto il parere dell'AI, l'operatore concorda: decisione immediata.
  const agreeWithAi = () => {
    finalize(selectedId, sub, ai.recommendation, 'AGREE');
  };

  // 2b) Se non concorda, deve motivare perché il modello non ha ragione.
  const disagreeWithAi = () => {
    if (!canConfirmDisagree) return;
    finalize(selectedId, sub, opposite(ai.recommendation), 'DISAGREE', rev.comment.trim());
  };

  // Dopo l'invio o la conferma il pulsante premuto sparisce: il focus va sul
  // parere dell'AI o sul riepilogo (o sul feedback dell'esercitazione).
  useEffect(() => {
    if (!pendingFocus) return;
    const target = { review: reviewRef, completion: completionRef, detail: detailRef }[pendingFocus]?.current;
    target?.focus();
    target?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
    setPendingFocus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFocus, cases, submitted, selectedId]);

  const nextPending = pendingCases.find((c) => c.case_id !== selectedId);
  const goToNext = () => {
    if (!nextPending) return;
    setTab('PENDING');
    selectCase(nextPending.case_id);
    // Il pulsante sparisce con il cambio di caso: il focus va all'inizio del nuovo caso.
    setPendingFocus('detail');
  };

  // Schede con le frecce, Home e Fine (pattern ARIA "tabs").
  const onTabKeyDown = (e) => {
    const i = TABS.indexOf(tab);
    const next = {
      ArrowRight: TABS[(i + 1) % TABS.length],
      ArrowLeft: TABS[(i - 1 + TABS.length) % TABS.length],
      Home: TABS[0],
      End: TABS[TABS.length - 1],
    }[e.key];
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const skipLink = `sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-[#0072BC] focus:shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${FOCUS}`;

  /* ====================================================================== */

  return (
    <div lang={language} className="min-h-screen bg-white text-[#1A1A1A]" style={{ fontFamily: FONT_STACK }}>
      <a href="#case-detail" className={skipLink}>
        Skip to the open case
      </a>
      <a href="#case-queue" className={skipLink}>
        Skip to the case queue
      </a>

      {/* Messaggi per i lettori di schermo */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Intestazione: barra blu + barra blu scuro (rimuovi se l'app ne ha già una) */}
      <header>
        <div className="bg-[#0072BC] border-b-2 border-[#005a96]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
            <Wordmark />
            <div className="hidden sm:inline-flex items-center gap-2 rounded bg-white px-4 py-2 font-bold text-[#0072BC]">
              <Globe className="w-5 h-5" aria-hidden="true" />
              {META.operation ?? 'Operation'}
            </div>
          </div>
        </div>

        <div className="bg-[#18375F]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="w-full max-w-3xl">
              <ProgressBar done={completedCases.length} total={cases.length} />
            </div>
            <LanguageSelect value={language} onChange={changeLanguage} />
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li className="flex items-center gap-2">
              <Home className="w-4 h-4 text-[#0072BC]" aria-hidden="true" />
              <span className="text-[#0072BC]">Case assessment</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#4D4D4D]" aria-hidden="true">/</span>
              <span aria-current="page">Households</span>
            </li>
          </ol>
        </nav>

        <h1 className="mt-4 text-3xl sm:text-4xl font-bold border-b-2 border-[#1A1A1A] pb-4">
          Household assessment
        </h1>
        <p className="mt-4 text-lg max-w-3xl leading-relaxed">
          Read the case file, write your comment and choose whether to include or exclude the household from the
          assistance programme. You will see the AI opinion, when available, only after you submit.
        </p>
        <div className="mt-5 max-w-3xl">
          <Notice variant="training" icon={GraduationCap} title="Some cases are training exercises">
            The queue includes cases that have already been closed, added for training. If you come across one, you
            will see the correct answer with a detailed explanation right after your decision.
          </Notice>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-8 lg:gap-10">
          {/* ============================ Coda ============================ */}
          <aside
            id="case-queue"
            tabIndex={-1}
            aria-labelledby="queue-title"
            className="lg:sticky lg:top-4 lg:self-start scroll-mt-4 outline-none"
          >
            <h2 id="queue-title" className="text-xl font-bold">Case queue</h2>
            <p className="mt-1 text-[#4D4D4D]">
              <b className="text-[#1A1A1A] text-2xl">{pendingCases.length}</b>{' '}
              {pendingCases.length === 1 ? 'household' : 'households'} to assess
            </p>

            {/* Ricerca: bordo scuro da 2px come "Search for a country" */}
            <div className="relative mt-3" role="search">
              <label htmlFor="search" className="sr-only">Search by ID or country</label>
              <input
                id="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID or country"
                className={`w-full rounded border-2 border-[#1A1A1A] bg-white py-2.5 pl-4 pr-11 text-base placeholder:text-[#6B6B6B] ${FOCUS}`}
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]" aria-hidden="true" />
            </div>

            {/* Schede: stile della barra lingue */}
            <div
              className="mt-3 flex gap-1 rounded bg-[#EFF7FE] p-1 text-sm"
              role="tablist"
              aria-label="Case lists"
              onKeyDown={onTabKeyDown}
            >
              {[
                ['PENDING', `To assess (${pendingCases.length})`],
                ['COMPLETED', `Completed (${completedCases.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  ref={(el) => {
                    tabRefs.current[key] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={tab === key}
                  aria-controls="queue-panel"
                  tabIndex={tab === key ? 0 : -1}
                  onClick={() => setTab(key)}
                  className={`flex-1 min-h-[44px] rounded px-3 py-1.5 font-bold ${FOCUS} ${
                    tab === key
                      ? 'bg-white text-[#0072BC] shadow-[0_1px_3px_rgba(0,0,0,0.25)]'
                      : 'text-[#0072BC] hover:bg-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              ref={listRef}
              id="queue-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className="mt-3 lg:overflow-y-auto lg:pr-1 lg:-mr-1"
            >
              {visibleCases.length === 0 ? (
                <p className="rounded border-2 border-dashed border-[#B9D6EE] p-6 text-center text-[#4D4D4D]">
                  {query
                    ? 'No households match your search.'
                    : tab === 'PENDING'
                    ? 'You have assessed every household.'
                    : 'No households completed yet.'}
                </p>
              ) : (
                <ul className="space-y-3">
                  {visibleCases.map((req) => (
                    <li key={req.case_id}>
                      <CaseRow
                        req={req}
                        selected={selectedId === req.case_id}
                        inProgress={!!submitted[req.case_id]}
                        onSelect={() => selectCase(req.case_id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* ======================= Dettaglio caso ======================= */}
          {activeCase ? (
            <section
              ref={detailRef}
              id="case-detail"
              tabIndex={-1}
              aria-labelledby="case-title"
              aria-describedby={complicated ? 'complicated-note' : undefined}
              className="min-w-0 scroll-mt-4 outline-none"
            >
              {/* Profilo anonimizzato (fascia grigia); nei casi complicati l'indicatore sta in alto a destra */}
              <div className="rounded bg-[#E5E5E5] p-5 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-5 min-w-0">
                    <div
                      className={`w-[72px] h-[72px] shrink-0 rounded border-2 bg-[#EFF7FE] text-[#18375F] flex items-center justify-center ${
                        complicated ? 'border-[#6B4FA3]' : 'border-[#0072BC]'
                      }`}
                    >
                      <Users className="w-10 h-10" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 id="case-title" className="text-3xl font-bold leading-tight">
                        Case {activeCase.case_id}
                      </h2>
                      <p className="mt-1 text-[#4D4D4D]">Anonymised household</p>
                    </div>
                  </div>
                  {complicated && <ComplicatedBadge id="complicated-note" done={stage === 'DONE'} />}
                </div>

                <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <Fact icon={Users} label="Members" value={activeCase.demographics.family_size} />
                  <Fact icon={Baby} label="Children under 18" value={activeCase.demographics.children_under_18} />
                  <Fact
                    icon={ShieldAlert}
                    label="Unaccompanied minors"
                    value={activeCase.demographics.unaccompanied_minors}
                    warn={minors > 0}
                  />
                  <Fact icon={Accessibility} label="People with disabilities" value={activeCase.demographics.members_with_disability} />
                  <Fact icon={Globe} label="Country of origin" value={activeCase.demographics.origin_country} />
                  <Fact icon={MapPin} label="Current location" value={activeCase.demographics.current_camp} />
                  <Fact icon={Clock} label="Displaced for" value={plural(activeCase.demographics.months_displaced, 'month', 'months')} />
                  <Fact icon={CalendarDays} label="Registered on" value={fmtDate(activeCase.demographics.registered_on)} />
                </dl>
              </div>

              {/* Segnalazioni per l'operatore */}
              {stage !== 'DONE' && minors > 0 && (
                <div className="mt-6">
                  <Notice
                    title={`The household is hosting ${plural(minors, 'unaccompanied minor', 'unaccompanied minors')}`}
                  >
                    Check that child protection safeguards are in place.
                  </Notice>
                </div>
              )}

              <div className="mt-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-10 xl:gap-12">
                {/* ------------------- Colonna sinistra: fascicolo ------------------- */}
                <div className="min-w-0 space-y-12">
                  {/* Feedback dell'esercitazione: subito dopo la decisione finale */}
                  {stage === 'DONE' && cal && (
                    <div ref={completionRef} tabIndex={-1} className="outline-none scroll-mt-4">
                      <Feedback cal={cal} ho={ho} ai={ai} aiAvailable={aiAvailable} />
                    </div>
                  )}

                  {/* Caso complicato: fascicolo completo, per categoria, solo dati */}
                  {complicated && areas.length > 0 && (
                    <section aria-labelledby="dossier-title">
                      <SectionTitle id="dossier-title">Full household case file</SectionTitle>
                      <Dossier areas={areas} />
                    </section>
                  )}

                  {/* Caso normale: sintesi per dimensione */}
                  {!complicated && dimensions.length > 0 && (
                    <section aria-labelledby="dim-title">
                      <SectionTitle id="dim-title">Household situation</SectionTitle>
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
                        Elements in favour of inclusion and exclusion
                      </SectionTitle>
                      <p className="mt-4 text-[#4D4D4D] max-w-2xl leading-relaxed">
                        They are sorted by relevance. On their own they do not point to a decision: weighing them is
                        up to you.
                      </p>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FactorColumn
                          title="In favour of inclusion"
                          icon={UserCheck}
                          tone="INCLUDE"
                          items={proInclude}
                        />
                        <FactorColumn
                          title="In favour of exclusion"
                          icon={UserX}
                          tone="EXCLUDE"
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
                      Decision for <span className="text-[#0072BC]">{activeCase.case_id}</span>
                    </h3>

                    {/* ---------- Fase 1: valutazione cieca ---------- */}
                    {stage === 'DECIDE' && (
                      <div className="mt-5 space-y-6">
                        <p className="leading-relaxed">
                          {aiAvailable
                            ? 'Write your comment and choose a decision. You will see the AI opinion after you submit.'
                            : 'There is no AI opinion for this case: the decision you submit is final.'}
                        </p>

                        <fieldset>
                          <legend className="font-bold mb-2">
                            Your decision <span className="font-normal text-[#4D4D4D]">(required)</span>
                          </legend>
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
                                    aria-describedby={`decision-${key}-desc`}
                                    className="peer sr-only"
                                  />
                                  <span className={`flex items-start gap-3 rounded border-2 bg-white p-4 ${d.card} peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#18375F]`}>
                                    <span className={`w-9 h-9 shrink-0 rounded flex items-center justify-center ml-1 ${d.tile}`}>
                                      <Icon className="w-5 h-5" aria-hidden="true" />
                                    </span>
                                    <span>
                                      <span className={`flex items-center gap-2 font-bold ${d.title}`}>
                                        {d.verb}
                                        {input.decision === key && (
                                          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                                        )}
                                      </span>
                                      <span id={`decision-${key}-desc`} className="block text-sm text-[#4D4D4D] mt-0.5">
                                        {d.desc}
                                      </span>
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>

                        <div>
                          <label htmlFor="comment" className="block font-bold mb-1">
                            Comment <span className="font-normal text-[#4D4D4D]">(required)</span>
                          </label>
                          <p id="comment-hint" className="text-sm text-[#4D4D4D] mb-2">
                            Explain in a few lines what weighed most in your assessment.
                          </p>
                          <textarea
                            id="comment"
                            rows={5}
                            required
                            aria-required="true"
                            value={input.comment}
                            onChange={(e) => setInput({ comment: e.target.value })}
                            aria-describedby="comment-hint comment-count"
                            className={`w-full resize-y rounded border-2 border-[#1A1A1A] bg-white p-4 placeholder:text-[#6B6B6B] ${FOCUS}`}
                            placeholder="Write your comment here."
                          />
                          <p id="comment-count" className="mt-1 text-sm text-[#4D4D4D]">
                            {commentOk
                              ? 'Comment is long enough.'
                              : `At least ${MIN_COMMENT} characters needed (${commentLength}/${MIN_COMMENT}).`}
                          </p>
                          {/* Annuncia solo il raggiungimento della soglia, non ogni tasto */}
                          <p className="sr-only" aria-live="polite">
                            {commentOk ? 'Comment is long enough.' : ''}
                          </p>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={submitEvaluation}
                            disabled={!canSubmit}
                            aria-describedby={canSubmit ? undefined : 'submit-hint'}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded bg-[#0072BC] px-5 py-4 text-lg font-bold text-white hover:bg-[#005a96] disabled:bg-[#D9D9D9] disabled:text-[#6B6B6B] disabled:cursor-not-allowed ${FOCUS}`}
                          >
                            {aiAvailable ? 'Submit assessment' : 'Submit final decision'}
                            <ArrowRight className="w-5 h-5" aria-hidden="true" />
                          </button>
                          <p id="submit-hint" className="sr-only">
                            {submitHint}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ---------- Fase 2: parere AI e risposta dell'operatore ---------- */}
                    {stage === 'REVIEW' && (
                      <div className="mt-5 space-y-6">
                        <div className="rounded border border-[#7DB2DC] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">Your assessment</span>
                            <DecisionTag decision={sub.decision} />
                          </div>
                          <p className="mt-3 leading-relaxed">{sub.comment}</p>
                          <p className="mt-2 text-sm text-[#4D4D4D]">Submitted: it can no longer be changed.</p>
                        </div>

                        <div ref={reviewRef} tabIndex={-1} className="outline-none scroll-mt-4">
                          <AiOpinion ai={ai} score={activeCase.vulnerability_profile.overall_score} />
                        </div>

                        <fieldset>
                          <legend className="font-bold mb-3">Do you agree with the AI opinion?</legend>
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={agreeWithAi}
                              className={`w-full text-left rounded border-2 border-[#0072BC] bg-[#0072BC] p-4 text-white hover:bg-[#005a96] ${FOCUS}`}
                            >
                              <span className="block text-lg font-bold">I agree</span>
                              <span className="block text-sm mt-0.5">
                                Final decision: {DECISIONS[ai.recommendation].label}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRev({ disagreeing: !rev.disagreeing })}
                              aria-expanded={rev.disagreeing}
                              aria-controls="disagree-panel"
                              className={`w-full text-left rounded border-2 border-[#0072BC] p-4 ${FOCUS} ${
                                rev.disagreeing
                                  ? 'bg-white text-[#18375F] shadow-[inset_6px_0_0_#0072BC]'
                                  : 'bg-white text-[#0072BC] hover:bg-[#EFF7FE]'
                              }`}
                            >
                              <span className="block text-lg font-bold">I disagree</span>
                              <span className="block text-sm mt-0.5">
                                Final decision: {DECISIONS[opposite(ai.recommendation)].label}. A reason is required.
                              </span>
                            </button>

                            {rev.disagreeing && (
                              <div id="disagree-panel" className="rounded border-2 border-[#0072BC] bg-white p-4">
                                <label htmlFor="disagree-comment" className="block font-bold mb-1">
                                  Why is the AI opinion wrong?
                                </label>
                                <p id="disagree-hint" className="text-sm text-[#4D4D4D] mb-2">
                                  Say what you think the model misjudged or did not take into account.
                                </p>
                                <textarea
                                  id="disagree-comment"
                                  rows={4}
                                  autoFocus
                                  required
                                  aria-required="true"
                                  value={rev.comment}
                                  onChange={(e) => setRev({ comment: e.target.value })}
                                  aria-describedby="disagree-hint disagree-count"
                                  className={`w-full resize-y rounded border-2 border-[#1A1A1A] bg-white p-3 placeholder:text-[#6B6B6B] ${FOCUS}`}
                                  placeholder="Write your reason here."
                                />
                                <p id="disagree-count" className="mt-1 text-sm text-[#4D4D4D]">
                                  {disagreeOk
                                    ? 'Reason is long enough.'
                                    : `At least ${MIN_COMMENT} characters needed (${disagreeLength}/${MIN_COMMENT}).`}
                                </p>
                                <p className="sr-only" aria-live="polite">
                                  {disagreeOk ? 'Reason is long enough.' : ''}
                                </p>
                                <button
                                  type="button"
                                  onClick={disagreeWithAi}
                                  disabled={!canConfirmDisagree}
                                  aria-describedby={canConfirmDisagree ? undefined : 'disagree-submit-hint'}
                                  className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded bg-[#0072BC] px-5 py-3 text-lg font-bold text-white hover:bg-[#005a96] disabled:bg-[#D9D9D9] disabled:text-[#6B6B6B] disabled:cursor-not-allowed ${FOCUS}`}
                                >
                                  Confirm final decision
                                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                </button>
                                <p id="disagree-submit-hint" className="sr-only">
                                  Write a reason of at least {MIN_COMMENT} characters.
                                </p>
                              </div>
                            )}
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
                          className="rounded border border-[#A9D8BA] bg-[#E8F5EC] p-5 outline-none scroll-mt-4"
                        >
                          <h4 className="flex items-center gap-2 font-bold text-[#1D5E36]">
                            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                            Decision recorded
                          </h4>
                          <div className="mt-3">
                            <DecisionTag decision={ho.final_decision} large />
                          </div>
                          <p className="mt-3 text-[#1A1A1A]">
                            {ho.ai_agreement === 'AGREE' && 'You agreed with the AI opinion.'}
                            {ho.ai_agreement === 'DISAGREE' && 'You did not agree with the AI opinion.'}
                            {ho.ai_agreement === 'NOT_AVAILABLE' && 'The AI opinion was not available for this case.'}
                          </p>
                          {ho.reviewed_at && (
                            <p className="mt-1 text-sm text-[#4D4D4D]">Recorded on {fmtDate(ho.reviewed_at)}.</p>
                          )}
                        </div>

                        <div className="rounded border border-[#7DB2DC] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">Your initial assessment</span>
                            <DecisionTag decision={ho.initial_decision} />
                          </div>
                          <p className="mt-3 leading-relaxed">{ho.initial_comment}</p>
                        </div>

                        {ho.ai_agreement === 'DISAGREE' && ho.disagreement_comment && (
                          <div className="rounded border border-[#7DB2DC] bg-white p-4">
                            <span className="font-bold">Why you disagreed with the AI</span>
                            <p className="mt-3 leading-relaxed">{ho.disagreement_comment}</p>
                          </div>
                        )}

                        {aiAvailable && (
                          <AiOpinion ai={ai} score={activeCase.vulnerability_profile.overall_score} />
                        )}

                        {nextPending && (
                          <button
                            type="button"
                            onClick={goToNext}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded bg-[#0072BC] px-5 py-4 text-lg font-bold text-white hover:bg-[#005a96] ${FOCUS}`}
                          >
                            Go to the next case
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
            <div
              id="case-detail"
              tabIndex={-1}
              className="rounded border-2 border-dashed border-[#B9D6EE] p-10 text-center text-[#4D4D4D] outline-none"
            >
              Select a household from the queue to open its case file.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
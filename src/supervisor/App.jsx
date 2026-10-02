import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mockData from './mockData-2.json';
import {
  LayoutDashboard,
  ClipboardCheck,
  MessageSquareText,
  Scale,
  Activity,
  CircleHelp,
  Menu,
  X,
  Download,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  Globe2,
  Languages,
  ArrowLeft,
  Check,
  CheckCircle2,
  Star,
  Flag,
  Repeat,
  Clock,
  MapPin,
  Target,
  TrendingDown,
  UsersRound,
  Building2,
  ShieldCheck,
  Layers,
} from 'lucide-react';

/* ========================================================================== */
/*  Decision monitor                                                          */
/*                                                                            */
/*  How operators and Cashy decide together, measured against an independent  */
/*  reference. One file: data helpers, metrics, charts, map, pages and        */
/*  styles. All data comes from MockData-2.json.                              */
/*                                                                            */
/*  Pages:   Overview · Decisions · Interviews · Equity · Drift               */
/*  Scope:   global > country > office > operator, shared by every page       */
/* ========================================================================== */

const META = mockData.meta;
const FONT_STACK = "'Inter', 'Helvetica Neue', Arial, sans-serif";

/* ========================================================================== */
/*  Scenarios and metrics                                                     */
/*                                                                            */
/*  Y   = independent reference outcome (the household's real need)           */
/*  AI  = Cashy's recommendation                                              */
/*  H   = the operator's final decision (H0 = initial, before seeing Cashy)   */
/* ========================================================================== */

const SCENARIOS = {
  appropriate_reliance: {
    label: 'Appropriate reliance',
    short: 'Appropriate reliance',
    color: 'blue',
    ai: 'correct',
    operator: 'agrees',
    formula: 'H = AI = Y',
    description: 'Cashy is right and the operator agrees. The system works as intended.',
  },
  harmful_override: {
    label: 'Harmful override',
    short: 'Harmful override',
    color: 'amber',
    ai: 'correct',
    operator: 'disagrees',
    formula: 'H ≠ AI, H ≠ Y',
    description: 'Cashy is right but the operator overrides it and gets it wrong, ignoring a valid signal.',
  },
  appropriate_override: {
    label: 'Appropriate override',
    short: 'Appropriate override',
    color: 'teal',
    ai: 'incorrect',
    operator: 'disagrees',
    formula: 'H ≠ AI, H = Y',
    description: 'Cashy is wrong and the operator corrects it. This is the main metric to maximise.',
  },
  over_reliance: {
    label: 'Over-reliance',
    short: 'Over-reliance',
    color: 'red',
    ai: 'incorrect',
    operator: 'agrees',
    formula: 'H = AI ≠ Y',
    description: 'Cashy is wrong and the operator follows it. This is the critical problem to mitigate.',
  },
  unverified: {
    label: 'Unverified',
    short: 'Unverified',
    color: 'gray',
    description: 'No valid independent reference is available, so the case cannot be scored.',
  },
};
const SCENARIO_ORDER = ['appropriate_reliance', 'harmful_override', 'appropriate_override', 'over_reliance'];

const GROUP_ATTRIBUTES = {
  head_sex: {
    label: 'Sex of household head',
    values: { female: 'Woman-headed', male: 'Man-headed' },
  },
  disability_in_household: {
    label: 'Disability in household',
    values: { true: 'With disability', false: 'No disability' },
  },
  displacement_status: {
    label: 'Displacement status',
    values: { refugee: 'Refugee', asylum_seeker: 'Asylum seeker', internally_displaced: 'Internally displaced' },
  },
  head_age_band: {
    label: 'Age of household head',
    values: { '18-29': '18–29 years', '30-49': '30–49 years', '50+': '50 years and over' },
  },
};

const LIVELIHOOD_LABELS = {
  smallholder_farming: 'Smallholder farming',
  informal_trade: 'Informal trade',
  wage_labour: 'Wage labour',
  caregiving_no_income: 'Caregiving, no income',
  remittances_other: 'Remittances and other',
};
const POVERTY_LABELS = { below_poverty_line: 'below poverty line', above_poverty_line: 'above poverty line' };
const SENTIMENT_LABELS = { negative: 'Negative', neutral: 'Neutral', positive: 'Positive', mixed: 'Mixed' };

const pct = (p, digits = 0) => (p == null || Number.isNaN(p) ? '—' : `${(p * 100).toFixed(digits)}%`);
const rate = (n, total) => (total ? pct(n / total) : '—');

function currentRecords(records, supersedesField) {
  const replaced = new Set(records.map((r) => r[supersedesField]).filter(Boolean));
  return records.filter((r) => !replaced.has(r.id));
}

function scenarioOf(decision, ai, review) {
  if (!review || !ai) return 'unverified';
  const contextMatches = ['policy_version', 'funding_context_id', 'administrative_context_id'].every(
    (key) => decision.context[key] === review.reference_standard[key]
  );
  if (!contextMatches || !review.reference_standard.is_independent_of_final_decision) return 'unverified';
  const reference = review.reference_standard.outcome;
  return ai.answer.recommendation === reference
    ? decision.final_assessment.outcome === reference
      ? 'appropriate_reliance'
      : 'harmful_override'
    : decision.final_assessment.outcome === reference
    ? 'appropriate_override'
    : 'over_reliance';
}

const DAY = 86400000;
const WEEK0 = Date.parse(`${META.period.start}T00:00:00Z`);
const weekOf = (iso) => Math.floor((Date.parse(iso) - WEEK0) / (7 * DAY));
const WEEKS = Math.max(1, weekOf(`${META.as_of}T23:59:00Z`) + 1);
const weekStart = (w) => new Date(WEEK0 + w * 7 * DAY);

function enrichDecisions(data) {
  const reviews = currentRecords(data.reviews, 'supersedes_review_id');
  return currentRecords(data.decisions, 'supersedes_decision_id').map((decision) => {
    const ai = data.ais.find((a) => a.id === decision.ai_exposure.ai_assessment_id);
    const review = reviews.find((r) => r.decision_id === decision.id);
    const interview = data.interviews.find((i) => i.id === decision.interview_id);
    const scenario = scenarioOf(decision, ai, review);
    const verified = scenario !== 'unverified';
    const truth = verified ? review.reference_standard.outcome : null;
    const profile = interview?.household_snapshot ?? {};
    const initial = decision.independent_assessment.outcome;
    const final = decision.final_assessment.outcome;
    return {
      ...decision,
      ai,
      review,
      interview,
      profile,
      category: scenario,
      verified,
      truth,
      changed: initial !== final,
      initialRight: verified ? initial === truth : null,
      aiRight: verified ? ai.answer.recommendation === truth : null,
      finalRight: verified ? final === truth : null,
      week: weekOf(decision.final_assessment.finalized_at),
      at: Date.parse(decision.final_assessment.finalized_at),
      deliberation: (Date.parse(decision.final_assessment.finalized_at) - Date.parse(decision.ai_exposure.revealed_at)) / 1000,
      cluster: `${profile.livelihood}|${profile.poverty_band}`,
    };
  });
}

function inScope(record, scope, activity = 'decision') {
  if (scope.type === 'country') return record.location.country_id === scope.id;
  if (scope.type === 'office') return record.location.office_id === scope.id;
  if (scope.type === 'operator') return (activity === 'interview' ? record.interviewer_id : record.operator_id) === scope.id;
  return true;
}

/* -- Statistics -------------------------------------------------------------- */

function wilson(n, total) {
  if (!total) return null;
  const z = 1.959963984540054;
  const p = n / total;
  const denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denominator;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

// A proportion with its denominator and a 95% Wilson interval.
const prop = (n, d) => ({ n, d, p: d ? n / d : null, ci: wilson(n, d) });

const median = (values) => {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function summarize(rows) {
  const counts = Object.fromEntries(Object.keys(SCENARIOS).map((k) => [k, rows.filter((r) => r.category === k).length]));
  const verifiedRows = rows.filter((r) => r.verified);
  const aiWrong = counts.appropriate_override + counts.over_reliance;
  const aiRight = counts.appropriate_reliance + counts.harmful_override;
  const harmfulSwitch = verifiedRows.filter((r) => r.category === 'over_reliance' && r.initialRight).length;
  return {
    total: rows.length,
    counts,
    verified: verifiedRows.length,
    aiWrong,
    aiRight,
    harmfulSwitch,
    changed: rows.filter((r) => r.changed).length,
    changedToAi: rows.filter((r) => r.changed && r.final_assessment.outcome === r.ai?.answer.recommendation).length,
    operators: new Set(rows.map((r) => r.operator_id)).size,
    correction: prop(counts.appropriate_override, aiWrong), // P(H=Y | AI≠Y)
    overReliance: prop(counts.over_reliance, aiWrong), //       P(H≠Y | AI≠Y)
    reliance: prop(counts.appropriate_reliance, aiRight), //    P(H=Y | AI=Y)
    harmfulOverride: prop(counts.harmful_override, aiRight), // P(H≠Y | AI=Y)
    accInitial: prop(verifiedRows.filter((r) => r.initialRight).length, verifiedRows.length),
    accAi: prop(verifiedRows.filter((r) => r.aiRight).length, verifiedRows.length),
    accFinal: prop(verifiedRows.filter((r) => r.finalRight).length, verifiedRows.length),
    medianDeliberation: median(rows.map((r) => r.deliberation)),
  };
}

/* -- Weekly series ----------------------------------------------------------- */

function weeklySeries(rows, window = 3) {
  return Array.from({ length: WEEKS }, (_, w) => {
    const inWeek = rows.filter((r) => r.week === w);
    const windowed = rows.filter((r) => r.week <= w && r.week > w - window);
    return {
      week: w,
      start: weekStart(w),
      rows: inWeek.length,
      counts: summarize(inWeek).counts,
      stats: summarize(windowed),
      own: summarize(inWeek),
    };
  });
}

/* -- Fairness: Equal Opportunity of Correction -------------------------------
   For each group a:  P(H = Y | AI ≠ Y, A = a)  (correction rate)
   and, as a mirror image:  P(H = Y | AI = Y, A = a)  (reliance rate).          */

function groupStats(rows, accessor, labels) {
  const verified = rows.filter((r) => r.verified);
  return Object.entries(labels).map(([key, label]) => {
    const group = verified.filter((r) => String(accessor(r)) === key);
    const s = summarize(group);
    const fn = group.filter((r) => r.aiWrong === undefined && r.ai.answer.recommendation === 'exclude' && r.truth === 'include');
    const fnFixed = fn.filter((r) => r.final_assessment.outcome === 'include').length;
    return {
      key,
      label,
      n: group.length,
      correction: s.correction,
      reliance: s.reliance,
      counts: s.counts,
      falseNegatives: prop(fnFixed, fn.length),
      aiError: prop(s.aiWrong, group.length),
    };
  });
}

function parityGap(groups, key = 'correction') {
  const usable = groups.filter((g) => g[key].d >= 5);
  if (usable.length < 2) return null;
  const sorted = [...usable].sort((a, b) => a[key].p - b[key].p);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  const overlap = low[key].ci[1] >= high[key].ci[0];
  return { low, high, gap: high[key].p - low[key].p, overlap };
}

/* -- Blind spots --------------------------------------------------------------
   Where do the appropriate overrides concentrate? A cluster that holds most of
   them points to a systematic model limit that operators are compensating for. */

function blindSpots(rows, thresholds) {
  const verified = rows.filter((r) => r.verified);
  const overrides = verified.filter((r) => r.category === 'appropriate_override');
  const clusters = {};
  verified.forEach((r) => {
    (clusters[r.cluster] = clusters[r.cluster] || []).push(r);
  });
  return Object.entries(clusters)
    .map(([key, group]) => {
      const [livelihood, poverty] = key.split('|');
      const s = summarize(group);
      const share = overrides.length ? s.counts.appropriate_override / overrides.length : 0;
      const casesShare = verified.length ? group.length / verified.length : 0;
      const falseNeg = group.filter((r) => r.category === 'appropriate_override' && r.ai.answer.recommendation === 'exclude').length;
      return {
        key,
        label: `${LIVELIHOOD_LABELS[livelihood] ?? livelihood} · ${POVERTY_LABELS[poverty] ?? poverty}`,
        n: group.length,
        overrides: s.counts.appropriate_override,
        aiError: prop(s.aiWrong, group.length),
        share,
        casesShare,
        lift: casesShare ? share / casesShare : 0,
        falseNegativeShare: s.counts.appropriate_override ? falseNeg / s.counts.appropriate_override : 0,
        flagged: share >= thresholds.min_share && s.counts.appropriate_override >= thresholds.min_cases,
      };
    })
    .sort((a, b) => b.share - a.share);
}

/* -- Drift: CUSUM on the correction rate -------------------------------------
   Bernoulli CUSUM, one observation per case where Cashy was wrong. It detects a
   drop in the correction rate from p0 (network baseline) to p1 = p0 - shift.
   Signal when the statistic S exceeds the decision limit h.                    */

function cusumBaseline(allRows, cfg) {
  const base = allRows.filter((r) => r.category === 'appropriate_override' || r.category === 'over_reliance').filter((r) => r.week < cfg.baseline_weeks);
  const n = base.length;
  const k = base.filter((r) => r.category === 'appropriate_override').length;
  const p0 = Math.min(0.95, Math.max(0.2, n ? k / n : 0.7));
  return { p0, p1: Math.max(0.05, p0 - cfg.target_shift), n };
}

function cusum(rows, { p0, p1 }, cfg) {
  const success = Math.log(p1 / p0);
  const failure = Math.log((1 - p1) / (1 - p0));
  const obs = rows
    .filter((r) => r.category === 'appropriate_override' || r.category === 'over_reliance')
    .sort((a, b) => a.at - b.at);
  let s = 0;
  let signalAt = null;
  const points = obs.map((r, i) => {
    const corrected = r.category === 'appropriate_override';
    s = Math.max(0, s + (corrected ? success : failure));
    if (signalAt == null && s > cfg.h) signalAt = i;
    return { i, at: r.at, corrected, s, id: r.id };
  });
  const peak = points.reduce((m, p) => Math.max(m, p.s), 0);
  const last = points.length ? points[points.length - 1].s : 0;
  let status = 'in_control';
  if (signalAt != null) status = last > cfg.h ? 'signal' : 'recovering';
  else if (peak >= cfg.h * cfg.watch_fraction || last >= cfg.h * cfg.watch_fraction) status = 'watch';
  return { points, signalAt, status, last, peak };
}

/* -- Histograms -------------------------------------------------------------- */

function histogram(values, edges) {
  const bins = edges.slice(0, -1).map((lo, i) => ({ lo, hi: edges[i + 1], items: [] }));
  values.forEach((v) => {
    const i = bins.findIndex((b, idx) => v >= b.lo && (v < b.hi || idx === bins.length - 1));
    if (i >= 0) bins[i].items.push(v);
  });
  return bins;
}

function csv(rows) {
  const quote = (value) => {
    let text = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const fields = ['case', 'country', 'office', 'operator', 'initial', 'ai', 'ai_confidence', 'final', 'reference', 'scenario', 'changed', 'final_rationale'];
  return (
    '\uFEFF' +
    [
      fields,
      ...rows.map((r) => [
        r.case_id,
        r.location.country_id,
        r.location.office_id,
        r.operator_id,
        r.independent_assessment.outcome,
        r.ai?.answer.recommendation,
        r.ai?.answer.confidence,
        r.final_assessment.outcome,
        r.review?.reference_standard.outcome,
        r.category,
        r.changed ? 'yes' : 'no',
        r.final_assessment.justification.text,
      ]),
    ]
      .map((row) => row.map(quote).join(';'))
      .join('\r\n')
  );
}


/* ========================================================================== */
/*  Data helpers                                                              */
/* ========================================================================== */

const organization = mockData.organization;
const OFFICES = organization.offices;
const THRESHOLDS = META.thresholds;
const CUSUM_CFG = THRESHOLDS.cusum;
const allDecisions = enrichDecisions(mockData);
const allInterviews = mockData.interviews;

const nameOf = (type, id) => {
  const item = organization[type]?.find((entry) => entry.id === id);
  return item?.display_name || item?.display_alias || id;
};
const shortCase = (id) => `CASE ${id.split('-').at(-1).padStart(4, '0')}`;
const formatter = (opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts });
const FMT_DAY = formatter({ day: 'numeric', month: 'short' });
const FMT_FULL = formatter({ day: 'numeric', month: 'short', year: 'numeric' });
const FMT_TIME = formatter({ day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const formatDay = (d) => FMT_DAY.format(new Date(d));
const formatDate = (d, time = false) => (time ? `${FMT_TIME.format(new Date(d))} UTC` : FMT_FULL.format(new Date(d)));
const outcomeLabel = (value) => (value === 'include' ? 'Eligible' : value === 'exclude' ? 'Not eligible' : 'Unavailable');
const POSITIONS = { agree: 'Agrees', disagree: 'Disagrees', partly_agree: 'Partly agrees', cannot_assess: 'Cannot assess' };
const durationLabel = (sec) => (sec == null ? '—' : sec >= 90 ? `${Math.round(sec / 60)} min` : `${Math.round(sec)} s`);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function download(content, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* The case timeline is derived from the timestamps stored on each record. */
function timelineFor(row) {
  const events = [];
  const interview = row.interview;
  if (interview) {
    events.push({ at: interview.conducted_at, title: 'Interview completed', actor: nameOf('operators', interview.interviewer_id) });
    if (interview.sentiment_analysis.status === 'available') {
      events.push({ at: Date.parse(interview.conducted_at) + 20 * 60000, title: 'Sentiment recorded', actor: 'Language service', detail: SENTIMENT_LABELS[interview.sentiment_analysis.result.label] });
    }
  }
  events.push({ at: row.ai.generated_at, title: 'Cashy recommendation generated', actor: 'Cashy', detail: `${outcomeLabel(row.ai.answer.recommendation)} · confidence ${pct(row.ai.answer.confidence)}` });
  events.push({ at: row.independent_assessment.submitted_at, title: 'Initial assessment submitted', actor: nameOf('operators', row.operator_id), detail: outcomeLabel(row.independent_assessment.outcome) });
  events.push({ at: row.ai_exposure.revealed_at, title: 'Cashy recommendation shown to the operator', actor: 'System' });
  events.push({ at: row.final_assessment.finalized_at, title: 'Decision finalised', actor: nameOf('operators', row.operator_id), detail: outcomeLabel(row.final_assessment.outcome) });
  if (row.review) events.push({ at: row.review.recorded_at, title: 'Independent reference recorded', actor: META.reference_sources[row.review.reference_standard.source] ?? 'Reviewer', detail: outcomeLabel(row.review.reference_standard.outcome) });
  return events.map((e) => ({ ...e, at: new Date(e.at).toISOString() })).sort((a, b) => a.at.localeCompare(b.at));
}

/* -- Drift, computed once for every office -------------------------------- */

const BASELINE = cusumBaseline(allDecisions, CUSUM_CFG);
const OFFICE_DRIFT = Object.fromEntries(
  OFFICES.map((o) => [o.id, cusum(allDecisions.filter((d) => d.location.office_id === o.id), BASELINE, CUSUM_CFG)])
);
const DRIFT_RANK = { signal: 3, recovering: 2, watch: 1, in_control: 0 };
const DRIFT_INFO = {
  signal: { label: 'Signal', tone: 'red' },
  recovering: { label: 'Recovering', tone: 'amber' },
  watch: { label: 'Watch', tone: 'amber' },
  in_control: { label: 'In control', tone: 'teal' },
};

/* -- Languages ------------------------------------------------------------- */
/* Only English is implemented. The others are listed but cannot be selected. */

const LANGUAGES = [
  { code: 'en', label: 'English', available: true },
  { code: 'it', label: 'Italiano', available: false },
  { code: 'fr', label: 'Français', available: false },
  { code: 'es', label: 'Español', available: false },
];
const DEFAULT_LANGUAGE = 'en';

/* -- Routing ------------------------------------------------------------------ */

const PAGES = [
  ['overview', 'Overview', LayoutDashboard],
  ['decisions', 'Decisions', ClipboardCheck],
  ['interviews', 'Interviews', MessageSquareText],
  ['equity', 'Equity and blind spots', Scale],
  ['drift', 'Process drift', Activity],
];
const SCOPE_COLLECTION = { country: 'countries', office: 'offices', operator: 'operators' };

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [pagePart, query = ''] = raw.split('?');
  const page = PAGES.some(([key]) => key === pagePart) ? pagePart : 'overview';
  const params = new URLSearchParams(query);
  const [type, id] = (params.get('scope') || '').split(':');
  const valid = SCOPE_COLLECTION[type] && organization[SCOPE_COLLECTION[type]].some((item) => item.id === id);
  const scenario = SCENARIOS[params.get('scenario')] ? params.get('scenario') : 'all';
  return { page, scope: valid ? { type, id } : { type: 'global' }, scenario };
}

function hashFor(page, scope, scenario) {
  const params = [];
  if (scope.type !== 'global') params.push(`scope=${scope.type}:${scope.id}`);
  if (scenario && scenario !== 'all') params.push(`scenario=${scenario}`);
  return `#/${page}${params.length ? `?${params.join('&')}` : ''}`;
}

function officeOfScope(scope) {
  if (scope.type === 'office') return scope.id;
  if (scope.type === 'operator') return organization.operators.find((p) => p.id === scope.id)?.assignments[0]?.office_id ?? null;
  return null;
}
function countryOfScope(scope) {
  if (scope.type === 'country') return scope.id;
  const office = officeOfScope(scope);
  return office ? OFFICES.find((o) => o.id === office)?.country_id ?? null : null;
}


const STYLES = `
.dm{--ink:#14283a; --ink2:#34495e; --muted:#5b6f82; --line:#dfe6ed; --soft:#f3f6fa; --bg:#f2f5f9; --navy:#18375F; --unhcr:#0072BC; --focus:#0a5fa8; --blue:#2f6fb5; --blue-bg:#e8f1fa; --blue-ink:#1f5490; --teal:#0e8a73; --teal-bg:#e3f4ef; --teal-ink:#0a6b59; --red:#c0392f; --red-bg:#fbeceb; --red-ink:#9b2a22; --amber:#c27a08; --amber-bg:#fdf3e1; --amber-ink:#85520a; --violet:#6b4fa3; --violet-bg:#f0ecf8; --violet-ink:#523a85; --slate:#6f8194; --slate-bg:#edf1f5; --slate-ink:#44566a; --gray:#8b9aa8; --gray-bg:#eef1f4; --gray-ink:#4f6070; font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-size:16px; color:var(--ink); background:var(--bg); min-height:100vh; line-height:1.5; -webkit-font-smoothing:antialiased;}
.dm *{box-sizing:border-box}
.dm h1,.dm h2,.dm h3,.dm h4,.dm p,.dm dl,.dm dd,.dm ul,.dm ol,.dm figure{margin:0;padding:0}
.dm ul,.dm ol{list-style:none}
.dm button,.dm input,.dm select,.dm textarea{font:inherit;color:inherit}
.dm button{cursor:pointer;border:0;background:none;padding:0}
.dm button:disabled{cursor:not-allowed;opacity:.45}
.dm a{color:inherit;text-decoration:none}
.dm svg{flex-shrink:0}
.dm :focus-visible{outline:3px solid var(--focus);outline-offset:2px;border-radius:4px}
.dm code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.82em;background:var(--soft);border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:var(--ink2);white-space:nowrap}
.dm .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.dm .nowrap{white-space:nowrap}
.dm .muted{color:var(--muted)}
.dm .skip-link{position:fixed;top:-100px;left:12px;z-index:200;background:#fff;color:var(--unhcr);font-weight:700;padding:12px 16px;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.3)}
.dm .skip-link:focus{top:12px}
/* ---- Top bar ---- */
.dm .top{position:sticky;top:0;z-index:40;background:var(--unhcr);color:#fff;border-bottom:2px solid #005a96;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 24px;min-height:64px}
.dm .top-left{display:flex;align-items:center;gap:16px;min-width:0}
.dm .wordmark{display:flex;align-items:center;gap:14px}
.dm .wordmark-logo{line-height:1}
.dm .wordmark-logo strong{display:block;font-size:24px;font-weight:900;letter-spacing:-.5px}
.dm .wordmark-logo small{display:block;font-size:9px;font-weight:600;margin-top:3px}
.dm .wordmark-rule{width:1px;height:30px;background:rgba(255,255,255,.7)}
.dm .wordmark-title{font-size:20px;font-weight:600;white-space:nowrap}
.dm .top-right{display:flex;align-items:center;gap:20px}
.dm .return-link{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.875rem;padding:8px 4px;border-bottom:1px solid transparent}
.dm .return-link:hover{border-bottom-color:#fff}
.dm .top :focus-visible{outline-color:#fff}
.dm .language{display:flex;align-items:center;gap:10px;font-size:.875rem;font-weight:600}
.dm .language-field{position:relative;display:flex;align-items:center}
.dm .language-field>svg{position:absolute;left:10px;pointer-events:none}
.dm .language-field>svg:last-child{left:auto;right:9px}
.dm .language select{max-width:156px;text-overflow:ellipsis;appearance:none;background:rgba(255,255,255,.12);color:#fff;border:2px solid #fff;border-radius:6px;min-height:40px;padding:6px 32px 6px 34px;font-weight:700;cursor:pointer}
.dm .language select option{color:var(--ink);background:#fff}
.dm .menu-button{display:none;color:#fff;width:40px;height:40px;border-radius:6px;place-items:center}
.dm .menu-button:hover{background:rgba(255,255,255,.14)}
/* ---- Layout ---- */
.dm .layout{display:grid;grid-template-columns:236px minmax(0,1fr);align-items:start}
.dm .sidebar{position:sticky;top:64px;height:calc(100vh - 64px);background:var(--navy);color:#cfe0f1;display:flex;flex-direction:column;padding:22px 14px 16px;overflow-y:auto}
.dm .sidebar-title{padding:0 12px 18px;border-bottom:1px solid rgba(255,255,255,.14);margin-bottom:18px}
.dm .sidebar-title strong{display:block;color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:-.2px}
.dm .sidebar-title small{display:block;font-size:.75rem;color:#9fb8d2;margin-top:3px}
.dm .sidebar nav{display:flex;flex-direction:column;gap:4px}
.dm .nav-link{display:flex;align-items:center;gap:12px;padding:12px;border-radius:8px;font-size:.9rem;font-weight:500;color:#cfe0f1;min-height:44px}
.dm .nav-link:hover{background:rgba(255,255,255,.09);color:#fff}
.dm .nav-link.active{background:#fff;color:var(--navy);font-weight:700}
.dm .sidebar :focus-visible{outline-color:#fff}
.dm .nav-link.active:focus-visible{outline-color:#9fd0f5}
.dm .sidebar-bottom{margin-top:auto;padding-top:24px;display:flex;flex-direction:column;gap:12px}
.dm .guide-link{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid rgba(255,255,255,.28);border-radius:8px;font-size:.875rem;font-weight:600;color:#fff;min-height:44px}
.dm .guide-link:hover{background:rgba(255,255,255,.1)}
.dm .period{font-size:.75rem;color:#9fb8d2;padding:0 4px;line-height:1.6}
.dm .scrim{display:none}
.dm .main-shell{min-width:0}
.dm .main{max-width:1440px;margin:0 auto;padding:24px 32px 8px;outline:none}
.dm .breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:.8125rem;color:var(--muted);margin-bottom:10px}
.dm .breadcrumb button{color:var(--unhcr);font-weight:600;padding:2px 0}
.dm .breadcrumb button:hover{text-decoration:underline}
.dm .breadcrumb [aria-current]{color:var(--ink2);font-weight:600}
.dm .page-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px;flex-wrap:wrap}
.dm .page-heading h1{font-size:2rem;line-height:1.2;font-weight:700;letter-spacing:-.6px}
.dm .page-heading p{color:var(--muted);margin-top:6px;max-width:680px}
.dm .heading-actions{display:flex;gap:10px;flex-wrap:wrap}
.dm .button{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:9px 14px;min-height:42px;border-radius:6px;font-size:.875rem;font-weight:600;white-space:nowrap}
.dm .button.secondary{background:#fff;border:1px solid #c5d1dc;color:var(--ink2)}
.dm .button.secondary:hover{background:var(--blue-bg);border-color:var(--blue)}
.dm .button.text-button{color:var(--unhcr);min-height:36px;padding:6px 10px}
.dm .button.text-button:hover{background:var(--blue-bg)}
.dm .icon-button{display:grid;place-items:center;width:36px;height:36px;border-radius:6px;color:var(--ink2)}
.dm .icon-button:hover:not(:disabled){background:var(--soft)}
/* ---- Scope bar ---- */
.dm .scope-bar{display:flex;flex-wrap:wrap;gap:14px 18px;align-items:flex-end;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin-bottom:20px}
.dm .scope-label{display:flex;align-items:center;gap:8px;font-size:.8125rem;font-weight:700;color:var(--ink2);align-self:center}
.dm .scope-field{display:flex;flex-direction:column;gap:4px;font-size:.75rem;font-weight:600;color:var(--muted);min-width:170px}
.dm .scope-field select{min-height:40px}
.dm .scope-reset{align-self:center;margin-left:auto}
.dm select{border:1px solid #c5d1dc;border-radius:6px;min-height:40px;background:#fff;color:var(--ink);padding:6px 30px 6px 10px;font-size:.875rem;max-width:100%}
.dm select:disabled{background:var(--soft);color:var(--muted)}
/* ---- Panels and grids ---- */
.dm .grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:20px;margin-bottom:20px}
.dm .c4{grid-column:span 4}
.dm .c5{grid-column:span 5}
.dm .c6{grid-column:span 6}
.dm .c7{grid-column:span 7}
.dm .c8{grid-column:span 8}
.dm .stack{display:flex;flex-direction:column;gap:20px}
.dm .stack>.panel{flex:1}
.dm .section-gap{height:20px}
.dm .panel{background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 2px rgba(20,40,58,.04);min-width:0;overflow:hidden;display:flex;flex-direction:column}
.dm .panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:18px 20px 12px}
.dm .panel-heading h2{font-size:1.0625rem;font-weight:700;letter-spacing:-.2px;line-height:1.3}
.dm .panel-heading p{font-size:.8125rem;color:var(--muted);margin-top:3px}
.dm .panel-body{padding:0 20px 16px}
.dm .panel-footnote{display:flex;align-items:flex-start;gap:8px;padding:11px 20px;background:#f8fafc;border-top:1px solid var(--line);color:var(--muted);font-size:.75rem;line-height:1.5;margin-top:auto}
.dm .panel-footnote svg{margin-top:2px}
.dm .panel-footnote.standalone{border:1px solid var(--line);border-radius:10px;margin:0 0 20px}
.dm .info-strip{display:flex;align-items:flex-start;gap:10px;background:var(--blue-bg);border:1px solid #bcd4ec;border-radius:8px;padding:11px 14px;margin-bottom:16px;color:var(--blue-ink);font-size:.875rem}
.dm .info-strip svg{margin-top:3px}
.dm .mini-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;border-top:1px solid #edf1f5;padding-top:12px}
.dm .mini-stats dt{font-size:.75rem;color:var(--muted)}
.dm .mini-stats dd{font-size:1.4rem;font-weight:700;letter-spacing:-.5px;margin:0}
.dm .mini-stats dd small{display:block;font-size:.72rem;font-weight:400;color:var(--muted);letter-spacing:0}
.dm .insight{font-size:.875rem;color:var(--ink2);background:var(--soft);border-radius:8px;padding:10px 12px;margin-top:10px}
.dm .chart-note{font-size:.75rem;color:var(--muted);margin-top:8px;display:flex;align-items:center;gap:8px}
.dm .chart-note .dash{display:inline-block;width:18px;border-top:2px dashed var(--ink2)}
.dm .empty{padding:44px 20px;text-align:center;color:var(--muted)}
.dm .empty svg{margin-bottom:10px}
.dm .empty h3{font-size:1rem;color:var(--ink2);margin-bottom:4px}
/* ---- KPI ---- */
.dm .kpi-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px;margin-bottom:20px}
.dm .kpi-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}
.dm .kpi{position:relative;background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 16px 12px;text-align:left;display:flex;flex-direction:column;gap:4px;min-width:0;box-shadow:0 1px 2px rgba(20,40,58,.04)}
.dm .kpi.clickable:hover{border-color:var(--unhcr);box-shadow:0 2px 8px rgba(0,114,188,.15)}
.dm .kpi-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.8125rem;font-weight:600;color:var(--ink2)}
.dm .kpi-icon{width:30px;height:30px;border-radius:8px;display:grid;place-items:center}
.dm .kpi-value{font-size:2.125rem;font-weight:700;letter-spacing:-1px;line-height:1.1;margin-top:2px;color:var(--ink)}
.dm .kpi-badge{align-self:flex-start;font-size:.6875rem;font-weight:700;border-radius:999px;padding:2px 9px}
.dm .kpi p{font-size:.78rem;color:var(--muted);line-height:1.4}
.dm .kpi-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}
.dm .kpi-chips span{font-size:.72rem;background:var(--soft);border-radius:999px;padding:2px 8px;color:var(--ink2);white-space:nowrap}
.dm .sparkline{width:100%;height:30px;margin-top:auto;padding-top:6px;overflow:visible}
.dm .spark-empty{height:30px}
.dm .spark-line{fill:none;stroke-width:2;stroke:var(--spark);stroke-linejoin:round}
.dm .spark-area{fill:var(--spark);opacity:.12}
.dm .spark-dot{fill:none;stroke:var(--spark);stroke-width:7;stroke-linecap:round}
.dm .sparkline.teal{--spark:var(--teal)}
.dm .sparkline.red{--spark:var(--red)}
.dm .sparkline.blue{--spark:var(--blue)}
.dm .sparkline.violet{--spark:var(--violet)}
.dm .sparkline.amber{--spark:var(--amber)}
/* ---- Tones (badges, icons, swatches) ---- */
.dm .blue{color:var(--blue-ink);background:var(--blue-bg)}
.dm .teal{color:var(--teal-ink);background:var(--teal-bg)}
.dm .red{color:var(--red-ink);background:var(--red-bg)}
.dm .amber{color:var(--amber-ink);background:var(--amber-bg)}
.dm .violet{color:var(--violet-ink);background:var(--violet-bg)}
.dm .slate{color:var(--slate-ink);background:var(--slate-bg)}
.dm .gray{color:var(--gray-ink);background:var(--gray-bg)}
.dm .badge{display:inline-flex;align-items:center;gap:6px;font-size:.75rem;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap}
.dm .legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:8px 20px 14px;font-size:.75rem;color:var(--ink2)}
.dm .panel-body .legend{padding:10px 0 0}
.dm .legend li{display:flex;align-items:center;gap:6px}
.dm .swatch{display:inline-block;width:10px;height:10px;border-radius:3px;background:currentColor}
.dm .swatch.blue{background:var(--blue)}
.dm .swatch.teal{background:var(--teal)}
.dm .swatch.red{background:var(--red)}
.dm .swatch.amber{background:var(--amber)}
.dm .swatch.violet{background:var(--violet)}
.dm .swatch.slate{background:var(--slate)}
.dm .swatch.gray{background:var(--gray)}
.dm .swatch.flowsame{background:#cbd6e2}
.dm .ring{display:inline-block;width:12px;height:12px;border-radius:50%;border:3px solid var(--red);background:transparent}
.dm .ring.amber{border-color:var(--amber);background:transparent}
.dm .ring.red{background:transparent}
.dm .fill-blue{fill:var(--blue)}
.dm .fill-teal{fill:var(--teal)}
.dm .fill-red{fill:var(--red)}
.dm .fill-amber{fill:var(--amber)}
.dm .fill-violet{fill:var(--violet)}
.dm .fill-slate{fill:var(--slate)}
.dm .fill-gray{fill:var(--gray)}
.dm .bg-blue{background:var(--blue)}
.dm .bg-teal{background:var(--teal)}
.dm .bg-red{background:var(--red)}
.dm .bg-amber{background:var(--amber)}
.dm .bg-violet{background:var(--violet)}
.dm .bg-slate{background:var(--slate)}
.dm .bg-gray{background:var(--gray)}
/* ---- Charts ---- */
.dm .chart{position:relative;width:100%}
.dm .chart svg{display:block;overflow:visible}
.dm .chart-tip{position:absolute;z-index:20;pointer-events:none;background:var(--navy);color:#fff;border-radius:8px;padding:8px 10px;font-size:.75rem;line-height:1.45;box-shadow:0 6px 18px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:2px;white-space:nowrap;transform:translate(14px,-110%)}
.dm .chart-tip.left{transform:translate(calc(-100% - 14px),-110%)}
.dm .chart-tip strong{font-size:.78rem}
.dm .chart-tip .swatch{margin-right:6px}
.dm .axis-text{font-size:11px;fill:var(--muted)}
.dm .bar-title{font-size:13px;font-weight:600;fill:var(--ink)}
.dm .bar-value{font-size:14px;font-weight:700;fill:var(--ink)}
.dm .grid-line{stroke:#e6ecf2;stroke-width:1}
.dm .ref-line{stroke:var(--ink2);stroke-width:1.5;stroke-dasharray:5 4}
.dm .track{fill:#e9eef4}
.dm .whisker line{stroke:var(--ink);stroke-width:1.5}
.dm .line{fill:none;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.dm .line.strong{stroke-width:3.4}
.dm .line.teal{stroke:var(--teal)}
.dm .line.violet{stroke:var(--violet)}
.dm .line.slate{stroke:var(--slate)}
.dm .line.red{stroke:var(--red)}
.dm .line.slate{stroke-dasharray:6 4}
.dm .dot{stroke:#fff;stroke-width:2}
.dm .dot.teal{fill:var(--teal)}
.dm .dot.violet{fill:var(--violet)}
.dm .dot.slate{fill:var(--slate)}
.dm .dot.blue{fill:var(--blue)}
.dm .ci-line{stroke-width:3;stroke-linecap:round;opacity:.5}
.dm .ci-line.teal{stroke:var(--teal)}
.dm .ci-line.blue{stroke:var(--blue)}
.dm .violet-text{fill:var(--violet-ink)}
.dm .red-text{fill:var(--red-ink)}
.dm .strong-text{font-weight:700}
.dm .ribbon{opacity:.85}
.dm .ribbon:hover{opacity:1}
.dm .flow-same{fill:#d3dde8}
.dm .flow-improved{fill:var(--teal)}
.dm .flow-harmed{fill:var(--red)}
.dm .flow-unverified{fill:var(--violet);opacity:.7}
.dm .node{fill:var(--navy)}
.dm .limit-zone{fill:var(--red);opacity:.07}
.dm .limit-line{stroke:var(--red);stroke-width:1.6;stroke-dasharray:6 4}
.dm .watch-line{stroke:var(--amber);stroke-width:1.2;stroke-dasharray:2 4}
.dm .signal-line{stroke:var(--red);stroke-width:1.5}
.dm .cusum-line{fill:none;stroke:var(--navy);stroke-width:2.2;stroke-linejoin:round}
.dm .obs-ok{fill:var(--teal);stroke:#fff;stroke-width:1.2}
.dm .obs-miss{fill:var(--red);stroke:#fff;stroke-width:1.2}
.dm .vol-bar{fill:#c5d2df}
/* ---- HTML bars ---- */
.dm .sbar{display:flex;border-radius:999px;overflow:hidden;background:#e9eef4;min-width:60px}
.dm .sbar>span{display:block;height:100%}
.dm .entity-list{padding:2px 12px 6px;display:flex;flex-direction:column}
.dm .stack-row{display:grid;grid-template-columns:minmax(110px,34%) minmax(0,1fr);align-items:center;gap:6px 14px;padding:11px 8px;text-align:left;border-radius:8px;width:100%}
.dm .stack-row.clickable{grid-template-columns:minmax(110px,34%) minmax(0,1fr) 16px}
.dm .stack-row.clickable:hover{background:var(--blue-bg)}
.dm .stack-row+.stack-row{border-top:1px solid #edf1f5}
.dm .stack-label{display:flex;flex-direction:column;min-width:0}
.dm .stack-label strong{font-size:.875rem;font-weight:600;color:var(--ink)}
.dm .stack-label small{font-size:.72rem;color:var(--muted)}
.dm .stack-bar{display:flex;height:14px;border-radius:999px;overflow:hidden;background:#e9eef4}
.dm .stack-bar>span{display:block;height:100%}
.dm .stack-row>svg{color:var(--muted)}
.dm .meter-row{display:grid;grid-template-columns:minmax(110px,40%) minmax(0,1fr) 44px;gap:12px;align-items:center;padding:11px 8px}
.dm .meter-row+.meter-row{border-top:1px solid #edf1f5}
.dm .meter-label{display:flex;flex-direction:column}
.dm .meter-label strong{font-size:.875rem;font-weight:600}
.dm .meter-label small{font-size:.72rem;color:var(--muted)}
.dm .meter{height:12px;border-radius:999px;background:#e9eef4;overflow:hidden}
.dm .meter i{display:block;height:100%;background:var(--teal);border-radius:999px}
.dm .meter-row b{text-align:right;font-size:.9rem}
/* ---- Scenario matrix ---- */
.dm .matrix{display:grid;grid-template-columns:96px minmax(0,1fr) minmax(0,1fr);gap:12px;padding:4px 20px 18px}
.dm .matrix-col{font-size:.8125rem;font-weight:700;color:var(--ink2);padding:0 4px 2px;display:flex;flex-direction:column;gap:3px}
.dm .matrix-row{display:flex;flex-direction:column;justify-content:center;font-size:.8125rem;color:var(--ink2)}
.dm .matrix-row small{color:var(--muted);font-size:.72rem}
.dm .cell{position:relative;text-align:left;border-radius:12px;padding:14px 14px 12px;border:1.5px solid transparent;display:flex;flex-direction:column;gap:4px;min-height:200px;min-width:0}
.dm .cell:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(20,40,58,.12)}
.dm .cell.blue{background:var(--blue-bg);border-color:#bcd4ec;color:var(--ink)}
.dm .cell.amber{background:var(--amber-bg);border-color:#f0d6a4;color:var(--ink)}
.dm .cell.teal{background:var(--teal-bg);border-color:#a8dccf;color:var(--ink)}
.dm .cell.red{background:var(--red-bg);border-color:#f0b8b3;color:var(--ink)}
.dm .cell.primary{border:2.5px solid var(--teal);box-shadow:0 0 0 3px rgba(14,138,115,.12)}
.dm .cell-top{display:flex;align-items:center;gap:7px;font-size:.9rem}
.dm .cell.blue .cell-top{color:var(--blue-ink)}
.dm .cell.amber .cell-top{color:var(--amber-ink)}
.dm .cell.teal .cell-top{color:var(--teal-ink)}
.dm .cell.red .cell-top{color:var(--red-ink)}
.dm .cell-alias{font-size:.72rem;color:var(--red-ink);margin-top:-3px;margin-left:24px;font-weight:600}
.dm .cell-tag{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;font-size:.6875rem;font-weight:700;background:var(--teal);color:#fff;border-radius:999px;padding:2px 9px}
.dm .cell-tag.critical{background:var(--red)}
.dm .cell-count{font-size:2.4rem;font-weight:700;letter-spacing:-1px;line-height:1.1}
.dm .cell-rate{font-size:.8rem;color:var(--ink2)}
.dm .cell-rate b{font-size:.95rem}
.dm .cell-track{display:block;height:7px;border-radius:999px;background:rgba(20,40,58,.1);overflow:hidden;margin:2px 0}
.dm .cell-track i{display:block;height:100%;border-radius:999px}
.dm .cell.blue .cell-track i{background:var(--blue)}
.dm .cell.amber .cell-track i{background:var(--amber)}
.dm .cell.teal .cell-track i{background:var(--teal)}
.dm .cell.red .cell-track i{background:var(--red)}
.dm .cell-ci{font-size:.72rem;color:var(--muted)}
.dm .cell small{font-size:.78rem;color:var(--ink2);line-height:1.4;margin-top:2px}
.dm .cell-note{font-size:.75rem;font-weight:600;color:var(--red-ink);background:rgba(255,255,255,.7);border-radius:6px;padding:4px 8px;margin-top:4px}
/* ---- Map ---- */
.dm .geo-map{position:relative;width:100%;background:#eaf2f9;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.dm .geo-map svg{display:block}
.dm .map-land{fill:#d9e2eb}
.dm .map-country{fill:#cbd6e2;stroke:#fff;stroke-width:.4}
.dm .map-country.has-data{fill:#a9c6e0}
.dm .map-country.selected{fill:#6fa3d0}
.dm .map-bubble{cursor:pointer}
.dm .map-bubble:focus-visible{outline:none}
.dm .map-bubble:focus-visible .bubble{stroke:var(--navy);stroke-width:3px}
.dm .bubble{stroke:#fff;opacity:.95}
.dm .map-bubble.selected .bubble{stroke:var(--navy)}
.dm .bubble-count{font-weight:700;fill:#fff;pointer-events:none}
.dm .bubble-label{font-weight:600;fill:var(--navy);paint-order:stroke;stroke:#fff;stroke-linejoin:round;pointer-events:none}
.dm .drift-ring{fill:none}
.dm .drift-ring.signal{stroke:var(--red)}
.dm .drift-ring.watch{stroke:var(--amber)}
.dm .map-legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 20px;padding:10px 20px 14px;font-size:.75rem;color:var(--ink2)}
.dm .map-legend .legend{padding:0}
.dm .map-legend-title{font-weight:700}
/* ---- Tabs / chips ---- */
.dm .segmented{display:inline-flex;flex-wrap:wrap;gap:4px;background:#e4ebf2;border-radius:10px;padding:4px}
.dm .segmented button{padding:8px 14px;border-radius:7px;font-size:.875rem;font-weight:600;color:var(--blue-ink);min-height:40px}
.dm .segmented button:hover{background:rgba(255,255,255,.6)}
.dm .segmented button.active{background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);color:var(--navy)}
.dm .tab-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
.dm .chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.dm .chip{display:inline-flex;align-items:center;gap:7px;border:1.5px solid #c5d1dc;background:#fff;border-radius:999px;padding:7px 14px;font-size:.8125rem;font-weight:600;color:var(--ink2);min-height:38px}
.dm .chip:hover{border-color:var(--unhcr)}
.dm .chip b{background:var(--soft);border-radius:999px;padding:0 8px;font-size:.78rem}
.dm .chip.active{background:var(--navy);border-color:var(--navy);color:#fff}
.dm .chip.active b{background:rgba(255,255,255,.2)}
/* ---- Tables ---- */
.dm .table-toolbar{display:flex;align-items:center;gap:12px;padding:0 20px 14px;flex-wrap:wrap}
.dm .search-field{display:flex;align-items:center;gap:8px;flex:1;max-width:440px;min-width:200px;border:1px solid #c5d1dc;border-radius:6px;background:#fff;padding:0 12px;color:var(--muted)}
.dm .search-field input{border:0;background:transparent;min-width:0;width:100%;height:40px;outline:none;color:var(--ink)}
.dm .search-field:focus-within{border-color:var(--focus);box-shadow:0 0 0 2px rgba(10,95,168,.25)}
.dm .table-scroll{overflow-x:auto;max-width:100%}
.dm table{border-collapse:collapse;width:100%;font-size:.875rem;text-align:left}
.dm th{font-size:.72rem;letter-spacing:.4px;font-weight:700;text-transform:uppercase;background:#f6f8fb;color:var(--muted);padding:11px 12px;white-space:nowrap;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.dm td{padding:12px;border-bottom:1px solid #edf1f5;vertical-align:top;color:var(--ink2)}
.dm td:first-child,.dm th:first-child{padding-left:20px}
.dm td:last-child,.dm th:last-child{padding-right:20px}
.dm tbody tr:last-child td{border-bottom:0}
.dm tbody tr:hover{background:#fafcfe}
.dm tr.row-active{background:var(--blue-bg)}
.dm td small{display:block;color:var(--muted);font-size:.75rem;margin-top:2px}
.dm .case-link{font-weight:700;color:var(--unhcr);text-align:left;white-space:nowrap}
.dm .case-link:hover{text-decoration:underline}
.dm .operator-link{text-align:left;color:var(--ink2);white-space:nowrap}
.dm .operator-link:hover{color:var(--unhcr);text-decoration:underline}
.dm .outcome{white-space:nowrap;font-weight:600}
.dm .outcome.include{color:var(--teal-ink)}
.dm .outcome.exclude{color:var(--slate-ink)}
.dm .change-label{color:var(--violet-ink)!important;font-weight:600}
.dm .conf{display:block;height:5px;width:64px;border-radius:999px;background:#e1e8ef;margin-top:6px;overflow:hidden}
.dm .conf.wide{width:100%;height:7px;margin:8px 0 2px}
.dm .conf i{display:block;height:100%;background:var(--violet);border-radius:999px}
.dm .summary-cell{min-width:280px;max-width:480px}
.dm .pagination{display:flex;justify-content:center;align-items:center;gap:12px;padding:12px;font-size:.8125rem;color:var(--muted);border-top:1px solid #edf1f5}
/* ---- Equity ---- */
.dm .explainer{margin-bottom:0}
.dm .note-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:8px}
.dm .note-icon{width:34px;height:34px;border-radius:9px;display:grid;place-items:center}
.dm .note-card h2{font-size:1rem;font-weight:700}
.dm .note-card p{font-size:.875rem;color:var(--ink2)}
.dm .note-card small{font-size:.78rem;color:var(--muted)}
.dm .formula{display:block;white-space:normal;font-size:.9rem;padding:8px 10px;background:var(--teal-bg);border-color:#a8dccf;color:var(--teal-ink);font-weight:600}
.dm .callout{display:flex;gap:12px;background:var(--violet-bg);border:1px solid #cdbfe6;border-left:5px solid var(--violet);border-radius:10px;padding:14px 16px;margin-bottom:14px;color:var(--violet-ink)}
.dm .callout svg{margin-top:2px}
.dm .callout strong{display:block;font-size:1rem;color:var(--ink);margin-bottom:3px}
.dm .callout p{font-size:.875rem;color:var(--ink2)}
.dm .spot-head{display:flex;justify-content:space-between;font-size:.72rem;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:var(--muted);padding:6px 0;border-bottom:1px solid var(--line)}
.dm .spots li{display:grid;grid-template-columns:minmax(150px,36%) minmax(0,1fr);gap:16px;align-items:center;padding:10px 0;border-bottom:1px solid #edf1f5}
.dm .spots li.flagged{background:linear-gradient(90deg,var(--violet-bg),transparent 60%)}
.dm .spot-label{display:flex;flex-direction:column;min-width:0}
.dm .spot-label strong{font-size:.875rem;font-weight:600}
.dm .spot-label small{font-size:.72rem;color:var(--muted)}
.dm .spot-bars{display:flex;flex-direction:column;gap:5px}
.dm .spot-bar{display:flex;align-items:center;gap:8px;height:12px}
.dm .spot-bar i{display:block;height:12px;border-radius:999px;min-width:2px}
.dm .spot-bar b{font-size:.75rem;color:var(--ink2);min-width:34px}
/* ---- Drift ---- */
.dm .drift-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:20px;margin-bottom:20px}
.dm .drift-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}
.dm .drift-card.signal{border-color:#e7a29c;box-shadow:0 0 0 3px rgba(192,57,47,.1)}
.dm .drift-card.watch,.dm .drift-card.recovering{border-color:#efce93}
.dm .drift-card header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.dm .drift-card h3{font-size:1.1rem;font-weight:700}
.dm .drift-card header small{color:var(--muted);font-size:.78rem}
.dm .drift-message{font-size:.84rem;color:var(--ink2);line-height:1.5}
.dm .drift-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;border-top:1px solid #edf1f5;padding-top:10px;margin-top:2px}
.dm .drift-stats dt{font-size:.72rem;color:var(--muted)}
.dm .drift-stats dd{font-size:1.1rem;font-weight:700;margin:0}
.dm .drift-stats dd small{display:block;font-size:.7rem;font-weight:400;color:var(--muted)}
/* ---- Dialogs ---- */
.dm .detail-dialog{border:1px solid #cdd8e3;border-radius:14px;padding:0;width:min(900px,calc(100vw - 32px));max-height:calc(100dvh - 40px);background:#fff;color:var(--ink);box-shadow:0 24px 80px rgba(16,40,70,.35);overscroll-behavior:contain;overflow:hidden}
.dm .detail-dialog[open]{display:flex}
.dm .detail-dialog::backdrop{background:rgba(14,41,59,.55);backdrop-filter:blur(2px)}
.dm .dialog-inner{display:flex;flex-direction:column;width:100%;min-height:0}
.dm .dialog-header{padding:20px 24px 16px;display:flex;justify-content:space-between;align-items:center;gap:14px}
.dm .dialog-header h2{font-size:1.4rem;font-weight:700}
.dm .dialog-header p{font-size:.8125rem;color:var(--muted);margin-top:3px}
.dm .dialog-header-actions{display:flex;align-items:center;gap:12px}
.dm .tabs{display:flex;padding:0 24px;gap:22px;border-top:1px solid #edf1f5;border-bottom:1px solid var(--line);background:#fafcfe;overflow-x:auto}
.dm .tabs button{display:flex;align-items:center;gap:8px;padding:13px 0;border-bottom:3px solid transparent;color:var(--muted);font-size:.875rem;font-weight:600;white-space:nowrap;min-height:44px}
.dm .tabs button.active{border-color:var(--unhcr);color:var(--unhcr)}
.dm .dialog-body{padding:20px 24px 26px;overflow-y:auto;min-height:0}
.dm .section-label{display:block;font-size:.6875rem;letter-spacing:.8px;font-weight:700;color:var(--muted);margin-bottom:8px}
.dm .case-summary{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:16px}
.dm .case-summary>p{font-size:1rem;color:var(--ink)}
.dm .inline-meta{display:flex;gap:16px;flex-wrap:wrap;font-size:.78rem;color:var(--muted);margin-top:12px}
.dm .inline-meta span{display:flex;align-items:center;gap:6px}
.dm .detail-title{font-size:1rem;font-weight:700;margin:22px 0 12px}
.dm .decision-path{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.dm .decision-step{border:1px solid var(--line);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:4px}
.dm .decision-step.final{background:var(--teal-bg);border-color:#a8dccf}
.dm .step-label{font-size:.75rem;color:var(--muted);font-weight:600}
.dm .decision-step strong{font-size:1.2rem}
.dm .decision-step strong.include{color:var(--teal-ink)}
.dm .decision-step strong.exclude{color:var(--slate-ink)}
.dm .decision-step small{font-size:.75rem;color:var(--muted)}
.dm .scenario-box{margin-top:16px;border-radius:10px;padding:14px 16px;border:1px solid transparent;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.dm .scenario-box.blue{background:var(--blue-bg);border-color:#bcd4ec}
.dm .scenario-box.amber{background:var(--amber-bg);border-color:#f0d6a4}
.dm .scenario-box.teal{background:var(--teal-bg);border-color:#a8dccf}
.dm .scenario-box.red{background:var(--red-bg);border-color:#f0b8b3}
.dm .scenario-box.gray{background:var(--gray-bg);border-color:#d5dce3}
.dm .scenario-box strong{font-size:1.05rem;color:var(--ink)}
.dm .scenario-box p{font-size:.875rem;color:var(--ink2)}
.dm .small-muted{font-size:.8rem!important;color:var(--muted)!important}
.dm .two-column{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.dm .detail-block{margin-top:18px}
.dm .detail-block h3{font-size:.875rem;font-weight:700;margin-bottom:6px}
.dm .detail-block p{font-size:.9rem;color:var(--ink2)}
.dm .reference-box{margin-top:20px;display:flex;gap:12px;padding:16px;background:var(--soft);border:1px solid var(--line);border-radius:10px;color:var(--muted)}
.dm .reference-box.reviewed{background:var(--teal-bg);border-color:#a8dccf;color:var(--teal-ink)}
.dm .reference-box h3{font-size:.9rem;color:var(--ink);margin-bottom:4px}
.dm .reference-box p{font-size:.85rem;color:var(--ink2)}
.dm .reference-box small{display:block;font-size:.75rem;color:var(--muted);margin-top:6px}
.dm .detail-dialog blockquote{margin:18px 0 0;border-left:4px solid #d8b379;background:#fdf8ef;padding:16px 18px;line-height:1.7;color:#6f5a3f}
.dm .detail-dialog blockquote span{display:block;color:#8a7457;font-size:.68rem;letter-spacing:.7px;margin-bottom:6px;font-weight:700}
.dm .sentiment-result{margin-top:18px;border:1px solid var(--line);border-radius:10px;padding:16px}
.dm .sentiment-head{display:flex;justify-content:space-between;align-items:center}
.dm .sentiment-head h3{font-size:.95rem}
.dm .sentiment-scale{height:8px;margin-top:24px;background:linear-gradient(90deg,#e1a487,#dde6e3,#6fb7a4);border-radius:8px;position:relative}
.dm .sentiment-scale>span{position:absolute;top:50%;transform:translate(-50%,-50%);height:18px;width:18px;border-radius:50%;background:#fff;border:3px solid var(--navy);box-shadow:0 1px 5px rgba(0,0,0,.25)}
.dm .scale-labels{display:flex;justify-content:space-between;color:var(--muted);font-size:.72rem;margin-top:8px}
.dm .facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 20px;margin-top:18px}
.dm .facts dt{font-size:.72rem;color:var(--muted)}
.dm .facts dd{font-size:.9rem;font-weight:600}
.dm .timeline-intro{font-size:.875rem;color:var(--muted);margin-bottom:18px}
.dm .timeline li{position:relative;display:flex;gap:14px;padding:0 0 20px}
.dm .timeline li:not(:last-child)::before{content:'';position:absolute;left:10px;top:22px;bottom:0;width:2px;background:#dbe5ee}
.dm .timeline-point{display:grid;place-items:center;border:2px solid var(--teal);color:var(--teal);background:#fff;width:22px;height:22px;border-radius:50%;flex-shrink:0}
.dm .timeline li>div{flex:1;min-width:0}
.dm .timeline-title{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.dm .timeline-title strong{font-size:.9rem}
.dm .timeline-title time{font-size:.75rem;color:var(--muted)}
.dm .timeline li p{font-size:.8rem;color:var(--muted);margin-top:2px}
.dm .guide-body section+section{margin-top:22px}
.dm .guide-body h3{font-size:1rem;font-weight:700;margin-bottom:8px}
.dm .guide-body p{font-size:.9rem;color:var(--ink2);margin-top:8px}
.dm .defs{display:flex;flex-direction:column;gap:10px}
.dm .defs div{display:grid;grid-template-columns:110px minmax(0,1fr);gap:12px;font-size:.9rem}
.dm .defs dt{font-weight:700;color:var(--navy)}
.dm .defs dd{color:var(--ink2)}
.dm .guide-table{font-size:.85rem}
.dm .guide-table td:first-child,.dm .guide-table th:first-child{padding-left:8px}
.dm .plain{display:flex;flex-direction:column;gap:6px;font-size:.9rem;color:var(--ink2);list-style:disc;padding-left:20px}
.dm .plain li{display:list-item}
/* ---- Footer ---- */
.dm .footer{display:flex;gap:18px;flex-wrap:wrap;align-items:center;padding:20px 0 24px;font-size:.75rem;color:var(--muted)}
.dm .footer span:first-child{flex:1}
/* ---- Responsive ---- */
@media (max-width:1280px){.dm .kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.dm .kpi-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:1180px){.dm .c4,.dm .c6{grid-column:span 6}
.dm .c5,.dm .c7,.dm .c8{grid-column:span 12}
.dm .explainer .c4{grid-column:span 12}
.dm .main{padding:20px 22px 8px}}
@media (max-width:900px){.dm .layout{grid-template-columns:minmax(0,1fr)}
.dm .sidebar{position:fixed;top:64px;left:0;bottom:0;width:260px;height:auto;z-index:60;transform:translateX(-100%);transition:transform .2s}
.dm .sidebar.open{transform:none;box-shadow:0 0 40px rgba(0,0,0,.4)}
.dm .scrim{display:block;position:fixed;inset:64px 0 0;background:rgba(14,41,59,.5);z-index:55}
.dm .menu-button{display:grid}
.dm .wordmark-title{display:none}
.dm .wordmark-rule{display:none}}
@media (max-width:760px){.dm .c4,.dm .c6{grid-column:span 12}
.dm .kpi-grid,.dm .kpi-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}
.dm .top{padding:8px 14px}
.dm .top-right{gap:10px}
.dm .return-link span{display:none}
.dm .language label{display:none}
.dm .language select{max-width:104px;padding-left:12px;padding-right:26px}
.dm .language-field>svg:first-child{display:none}
.dm .wordmark-logo small{display:none}
.dm .main{padding:16px 14px 8px}
.dm .page-heading h1{font-size:1.6rem}
.dm .matrix{grid-template-columns:minmax(0,1fr);padding:4px 14px 16px}
.dm .matrix-corner,.dm .matrix-col{display:none}
.dm .matrix-row{margin-top:6px}
.dm .cell{min-height:0}
.dm .drift-grid{grid-template-columns:minmax(0,1fr)}
.dm .drift-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
.dm .decision-path,.dm .two-column,.dm .facts{grid-template-columns:minmax(0,1fr)}
.dm .stack-row,.dm .stack-row.clickable{grid-template-columns:minmax(0,1fr)}
.dm .stack-row>svg{display:none}
.dm .spots li{grid-template-columns:minmax(0,1fr)}
.dm .scope-field{min-width:calc(50% - 10px);flex:1}
.dm .defs div{grid-template-columns:minmax(0,1fr);gap:2px}
.dm .detail-dialog{width:calc(100vw - 12px);max-height:calc(100dvh - 12px)}
.dm .dialog-header{padding:16px}
.dm .dialog-body{padding:16px}
.dm .tabs{padding:0 16px}}
@media (max-width:480px){.dm .kpi-grid,.dm .kpi-grid.four{grid-template-columns:minmax(0,1fr)}}
@media (prefers-reduced-motion:reduce){.dm *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
`;


/* ========================================================================== */
/*  Interface building blocks                                                 */
/* ========================================================================== */

const Badge = ({ tone = 'gray', children, className = '' }) => <span className={`badge ${tone} ${className}`}>{children}</span>;

const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-');

function Panel({ title, subtitle, action, className = '', children, footnote }) {
  const id = `panel-${slug(title)}`;
  return (
    <section className={`panel ${className}`} aria-labelledby={id}>
      <div className="panel-heading">
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
      {footnote && (
        <div className="panel-footnote">
          <Info size={14} aria-hidden="true" />
          <span>{footnote}</span>
        </div>
      )}
    </section>
  );
}

function Empty({ title = 'No results', text = 'Try changing the filters or the search.' }) {
  return (
    <div className="empty">
      <Search size={26} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} className={value === key ? 'active' : ''} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="icon-button" aria-label="Previous page" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={18} />
      </button>
      <span>
        Page {page + 1} of {pages}
      </span>
      <button type="button" className="icon-button" aria-label="Next page" disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map(([color, label]) => (
        <li key={label}>
          <i className={`swatch ${color}`} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

/* Language control. English is the default; the other languages are not implemented. */
function LanguageSelect({ value, onChange }) {
  return (
    <div className="language">
      <label htmlFor="language">Language</label>
      <div className="language-field">
        <Languages size={17} aria-hidden="true" />
        <select id="language" value={value} onChange={(e) => onChange(e.target.value)} aria-describedby="language-hint">
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} lang={l.code} disabled={!l.available}>
              {l.available ? l.label : `${l.label} (coming soon)`}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
      <p id="language-hint" className="sr-only">
        Only English is available for now.
      </p>
    </div>
  );
}

/* -- KPI card with optional sparkline ------------------------------------- */

function Sparkline({ values, tone = 'blue', label }) {
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return <span className="spark-empty" aria-hidden="true" />;
  const lo = Math.min(...pts.map((p) => p[1]));
  const hi = Math.max(...pts.map((p) => p[1]));
  const x = (i) => 2 + (i / (values.length - 1)) * 96;
  const y = (v) => 24 - ((v - lo) / (hi - lo || 1)) * 20;
  const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const last = pts[pts.length - 1];
  return (
    <svg className={`sparkline ${tone}`} viewBox="0 0 100 28" preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={`${d}L${x(last[0])},28L${x(pts[0][0])},28Z`} className="spark-area" />
      <path d={d} className="spark-line" vectorEffect="non-scaling-stroke" />
      <path d={`M${x(last[0])},${y(last[1])}h0`} className="spark-dot" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Kpi({ title, value, caption, tone = 'blue', icon: Icon, spark, sparkLabel, badge, children, onClick }) {
  const body = (
    <>
      <div className="kpi-top">
        <span>{title}</span>
        <span className={`kpi-icon ${tone}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <strong className="kpi-value">{value}</strong>
      {badge && <span className={`kpi-badge ${tone}`}>{badge}</span>}
      <p>{caption}</p>
      {children}
      {spark && <Sparkline values={spark} tone={tone} label={sparkLabel} />}
    </>
  );
  return onClick ? (
    <button type="button" className="kpi clickable" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="kpi">{body}</div>
  );
}

/* Optional browser capability. The app works normally when it is unavailable. */
function useWebMcp() {
  useEffect(() => {
    if (!document.modelContext?.registerTool) return undefined;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        document.modelContext.registerTool(
          {
            name: 'read_decision_summary',
            title: 'Read decision summary',
            description: 'Returns sample dashboard counts for global, country, office or operator scope. Does not change data or navigation.',
            inputSchema: {
              type: 'object',
              properties: { scope: { type: 'string', enum: ['global', 'country', 'office', 'operator'] }, id: { type: 'string' } },
              required: ['scope'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute(input) {
              if (!input || typeof input !== 'object' || Object.keys(input).some((k) => !['scope', 'id'].includes(k)) || !['global', 'country', 'office', 'operator'].includes(input.scope)) throw Error('Invalid scope.');
              const collection = SCOPE_COLLECTION[input.scope];
              if (collection && !organization[collection].some((r) => r.id === input.id)) throw Error('Identifier not found in this scope.');
              const scope = { type: input.scope, id: input.id };
              const rows = allDecisions.filter((r) => inScope(r, scope));
              const s = summarize(rows);
              return {
                data_origin: 'sample_data',
                scope: input.scope,
                id: input.id || null,
                decisions: rows.length,
                interviews: allInterviews.filter((r) => inScope(r, scope, 'interview')).length,
                verified: s.verified,
                counts: s.counts,
                correction_rate: s.correction.p,
                over_reliance_rate: s.overReliance.p,
                accuracy: { initial: s.accInitial.p, cashy: s.accAi.p, final: s.accFinal.p },
              };
            },
          },
          { signal: lifecycle.signal }
        )
      ).catch(() => {});
    } catch {
      /* Optional capability; no impact on the human interface. */
    }
    return () => lifecycle.abort();
  }, []);
}


/* ========================================================================== */
/*  Charts (plain SVG, no chart library)                                      */
/* ========================================================================== */

const SCEN_FILL = (key) => `fill-${SCENARIOS[key].color}`;

/* Measures its container, then renders an SVG at the exact size. */
function Chart({ height, label, children }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  const [tip, setTip] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => setW(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const show = useCallback((e, content) => {
    const box = ref.current?.getBoundingClientRect();
    if (box) setTip({ x: e.clientX - box.left, y: e.clientY - box.top, content });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return (
    <div className="chart" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={label}>
          {children({ w, show, hide })}
        </svg>
      )}
      {tip && (
        <div className={`chart-tip ${tip.x > w / 2 ? 'left' : 'right'}`} style={{ left: tip.x, top: tip.y }} role="presentation">
          {tip.content}
        </div>
      )}
    </div>
  );
}

const niceTicks = (max, count = 4) => {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500];
  const step = steps.find((s) => max / s <= count) ?? 1000;
  const n = Math.max(1, Math.ceil(max / step));
  return Array.from({ length: n + 1 }, (_, i) => i * step);
};

/* -- Weekly decisions by scenario (stacked columns) ------------------------- */

function WeeklyScenarioBars({ series }) {
  const order = ['appropriate_reliance', 'harmful_override', 'over_reliance', 'appropriate_override'];
  const totals = series.map((s) => order.reduce((a, k) => a + s.counts[k], 0));
  const ticks = niceTicks(Math.max(4, ...totals));
  const top = ticks[ticks.length - 1];
  const summary = `Verified decisions per week by scenario, from ${formatDay(series[0].start)} to ${formatDay(series[series.length - 1].start)}.`;
  return (
    <Chart height={236} label={summary}>
      {({ w, show, hide }) => {
        const m = { l: 30, r: 6, t: 10, b: 26 };
        const iw = w - m.l - m.r;
        const ih = 236 - m.t - m.b;
        const band = iw / series.length;
        const bw = Math.min(30, band * 0.7);
        const y = (v) => m.t + ih - (v / top) * ih;
        return (
          <g>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} className="grid-line" />
                <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="axis-text">
                  {t}
                </text>
              </g>
            ))}
            {series.map((s, i) => {
              let acc = 0;
              const x = m.l + band * i + (band - bw) / 2;
              const verified = totals[i];
              const tipContent = (
                <>
                  <strong>
                    Week of {formatDay(s.start)}
                  </strong>
                  {order.map((k) => (
                    <span key={k}>
                      <i className={`swatch ${SCENARIOS[k].color}`} />
                      {SCENARIOS[k].short}: {s.counts[k]}
                    </span>
                  ))}
                  <span>Corrected: {rate(s.counts.appropriate_override, s.counts.appropriate_override + s.counts.over_reliance)} of Cashy errors</span>
                </>
              );
              return (
                <g key={i} onMouseMove={(e) => show(e, tipContent)} onMouseLeave={hide}>
                  <rect x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" />
                  {order.map((k) => {
                    const c = s.counts[k];
                    if (!c) return null;
                    const y0 = y(acc);
                    const y1 = y(acc + c);
                    acc += c;
                    return <rect key={k} x={x} y={y1} width={bw} height={Math.max(0, y0 - y1 - 0.8)} rx="1.5" className={SCEN_FILL(k)} />;
                  })}
                  {i % 2 === 0 && (
                    <text x={x + bw / 2} y={236 - 8} textAnchor="middle" className="axis-text">
                      {formatDay(s.start)}
                    </text>
                  )}
                  {verified === 0 && null}
                </g>
              );
            })}
          </g>
        );
      }}
    </Chart>
  );
}

/* -- Accuracy over time: operator alone, Cashy alone, final decision ---------- */

const ACC_LINES = [
  ['accInitial', 'Operator alone (before Cashy)', 'slate'],
  ['accAi', 'Cashy alone', 'violet'],
  ['accFinal', 'Final decision', 'teal'],
];

function AccuracyLines({ series }) {
  const usable = series.filter((s) => s.stats.verified >= 8);
  const values = usable.flatMap((s) => ACC_LINES.map(([k]) => s.stats[k].p));
  const lo = values.length ? Math.max(0, Math.floor((Math.min(...values) - 0.04) * 10) / 10) : 0.5;
  const ticks = [lo, lo + (1 - lo) / 2, 1];
  return (
    <Chart height={236} label="Weekly accuracy against the independent reference for the operator alone, Cashy alone and the final decision, using a rolling three-week window.">
      {({ w, show, hide }) => {
        const m = { l: 38, r: 10, t: 10, b: 26 };
        const iw = w - m.l - m.r;
        const ih = 236 - m.t - m.b;
        const x = (i) => m.l + (i + 0.5) * (iw / series.length);
        const y = (v) => m.t + ih - ((v - lo) / (1 - lo)) * ih;
        return (
          <g>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} className="grid-line" />
                <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="axis-text">
                  {Math.round(t * 100)}%
                </text>
              </g>
            ))}
            {ACC_LINES.map(([key, label, tone]) => {
              const pts = series.map((s, i) => (s.stats.verified >= 8 ? [x(i), y(s.stats[key].p)] : null)).filter(Boolean);
              if (pts.length < 2) return null;
              return (
                <g key={key}>
                  <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')} className={`line ${tone} ${key === 'accFinal' ? 'strong' : ''}`} />
                  <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" className={`dot ${tone}`} />
                </g>
              );
            })}
            {series.map((s, i) => (
              <g key={i}>
                {i % 2 === 0 && (
                  <text x={x(i)} y={236 - 8} textAnchor="middle" className="axis-text">
                    {formatDay(s.start)}
                  </text>
                )}
                <rect
                  x={x(i) - iw / series.length / 2}
                  y={m.t}
                  width={iw / series.length}
                  height={ih}
                  fill="transparent"
                  onMouseMove={(e) =>
                    show(
                      e,
                      <>
                        <strong>3 weeks to {formatDay(new Date(s.start.getTime() + 6 * DAY))}</strong>
                        {s.stats.verified >= 8 ? (
                          ACC_LINES.map(([k, label, tone]) => (
                            <span key={k}>
                              <i className={`swatch ${tone}`} />
                              {label}: {pct(s.stats[k].p)}
                            </span>
                          ))
                        ) : (
                          <span>Too few verified cases ({s.stats.verified})</span>
                        )}
                      </>
                    )
                  }
                  onMouseLeave={hide}
                />
              </g>
            ))}
          </g>
        );
      }}
    </Chart>
  );
}

/* -- Three horizontal bars with confidence whiskers ------------------------- */

function AccuracyBars({ stats }) {
  const rowsData = [
    ['Operator alone', 'before seeing Cashy', stats.accInitial, 'slate'],
    ['Cashy alone', 'recommendation', stats.accAi, 'violet'],
    ['Final decision', 'after seeing Cashy', stats.accFinal, 'teal'],
  ];
  return (
    <Chart height={186} label={`Accuracy against the independent reference: operator alone ${pct(stats.accInitial.p)}, Cashy alone ${pct(stats.accAi.p)}, final decision ${pct(stats.accFinal.p)}.`}>
      {({ w }) => {
        const m = { l: 4, r: 52 };
        const x = (v) => m.l + v * (w - m.l - m.r);
        return (
          <g>
            {rowsData.map(([title, sub, s, tone], i) => {
              const y = 6 + i * 60;
              return (
                <g key={title}>
                  <text x={m.l} y={y + 11} className="bar-title">
                    {title}
                  </text>
                  <text x={m.l + 96} y={y + 11} className="axis-text">
                    {sub}
                  </text>
                  <rect x={m.l} y={y + 20} width={w - m.l - m.r} height="14" rx="7" className="track" />
                  {s.p != null && <rect x={m.l} y={y + 20} width={Math.max(8, x(s.p) - m.l)} height="14" rx="7" className={`fill-${tone}`} />}
                  {s.ci && (
                    <g className="whisker">
                      <line x1={x(s.ci[0])} x2={x(s.ci[1])} y1={y + 27} y2={y + 27} />
                      <line x1={x(s.ci[0])} x2={x(s.ci[0])} y1={y + 22} y2={y + 32} />
                      <line x1={x(s.ci[1])} x2={x(s.ci[1])} y1={y + 22} y2={y + 32} />
                    </g>
                  )}
                  <text x={w - 2} y={y + 32} textAnchor="end" className="bar-value">
                    {pct(s.p)}
                  </text>
                  <text x={m.l} y={y + 50} className="axis-text">
                    {s.n} of {s.d} verified cases{s.ci ? ` · 95% CI ${pct(s.ci[0])}–${pct(s.ci[1])}` : ''}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }}
    </Chart>
  );
}

/* -- Alluvial: initial assessment -> final decision --------------------------- */

const FLOW_KINDS = {
  same: { label: 'Unchanged', cls: 'flow-same' },
  improved: { label: 'Changed, final matches the reference', cls: 'flow-improved' },
  harmed: { label: 'Changed, final misses the reference', cls: 'flow-harmed' },
  unverified: { label: 'Changed, no reference', cls: 'flow-unverified' },
};

function FlowChart({ rows }) {
  const ks = ['include', 'exclude'];
  const flows = [];
  const counts = {};
  rows.forEach((r) => {
    const a = r.independent_assessment.outcome;
    const b = r.final_assessment.outcome;
    const kind = a === b ? 'same' : r.verified ? (r.finalRight ? 'improved' : 'harmed') : 'unverified';
    counts[`${a}>${b}>${kind}`] = (counts[`${a}>${b}>${kind}`] || 0) + 1;
  });
  ks.forEach((a) => ks.forEach((b) => Object.keys(FLOW_KINDS).forEach((kind) => {
    const n = counts[`${a}>${b}>${kind}`];
    if (n) flows.push({ a, b, kind, n });
  })));
  const leftTotals = Object.fromEntries(ks.map((k) => [k, flows.filter((f) => f.a === k).reduce((s, f) => s + f.n, 0)]));
  const rightTotals = Object.fromEntries(ks.map((k) => [k, flows.filter((f) => f.b === k).reduce((s, f) => s + f.n, 0)]));
  const total = rows.length || 1;
  const H = 230;
  return (
    <Chart height={H} label={`How decisions move from the operator's initial assessment to the final decision. ${rows.filter((r) => r.changed).length} of ${rows.length} changed.`}>
      {({ w, show, hide }) => {
        const nodeW = 12;
        const labelW = 92;
        const x0 = labelW;
        const x1 = w - labelW - nodeW;
        const gap = 18;
        const k = (H - 34 - gap) / total;
        const lPos = {};
        const rPos = {};
        let ly = 6;
        let ry = 6;
        ks.forEach((key) => {
          lPos[key] = { y: ly, h: leftTotals[key] * k, off: 0 };
          ly += leftTotals[key] * k + gap;
          rPos[key] = { y: ry, h: rightTotals[key] * k, off: 0 };
          ry += rightTotals[key] * k + gap;
        });
        const ribbons = flows.map((f) => {
          const h = f.n * k;
          const ya = lPos[f.a].y + lPos[f.a].off;
          const yb = rPos[f.b].y + rPos[f.b].off;
          lPos[f.a].off += h;
          rPos[f.b].off += h;
          const xs = x0 + nodeW;
          const xe = x1;
          const xm = (xs + xe) / 2;
          return { ...f, d: `M${xs},${ya}C${xm},${ya} ${xm},${yb} ${xe},${yb}L${xe},${yb + h}C${xm},${yb + h} ${xm},${ya + h} ${xs},${ya + h}Z` };
        });
        return (
          <g>
            <text x={x0 + nodeW / 2} y={H - 2} textAnchor="middle" className="axis-text">Initial assessment</text>
            <text x={x1 + nodeW / 2} y={H - 2} textAnchor="middle" className="axis-text">Final decision</text>
            {ribbons.map((r) => (
              <path
                key={`${r.a}${r.b}${r.kind}`}
                d={r.d}
                className={`ribbon ${FLOW_KINDS[r.kind].cls}`}
                onMouseMove={(e) =>
                  show(
                    e,
                    <>
                      <strong>
                        {outcomeLabel(r.a)} → {outcomeLabel(r.b)}
                      </strong>
                      <span>{FLOW_KINDS[r.kind].label}</span>
                      <span>{plural(r.n, 'decision', 'decisions')}</span>
                    </>
                  )
                }
                onMouseLeave={hide}
              />
            ))}
            {ks.map((key) => (
              <g key={key}>
                <rect x={x0} y={lPos[key].y} width={nodeW} height={Math.max(2, lPos[key].h)} rx="2" className="node" />
                <text x={x0 - 8} y={lPos[key].y + lPos[key].h / 2 - 2} textAnchor="end" className="bar-title">
                  {outcomeLabel(key)}
                </text>
                <text x={x0 - 8} y={lPos[key].y + lPos[key].h / 2 + 13} textAnchor="end" className="axis-text">
                  {leftTotals[key]}
                </text>
                <rect x={x1} y={rPos[key].y} width={nodeW} height={Math.max(2, rPos[key].h)} rx="2" className="node" />
                <text x={x1 + nodeW + 8} y={rPos[key].y + rPos[key].h / 2 - 2} className="bar-title">
                  {outcomeLabel(key)}
                </text>
                <text x={x1 + nodeW + 8} y={rPos[key].y + rPos[key].h / 2 + 13} className="axis-text">
                  {rightTotals[key]}
                </text>
              </g>
            ))}
          </g>
        );
      }}
    </Chart>
  );
}

/* -- Cashy confidence vs operator response ------------------------------------ */

const CONF_EDGES = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0001];

function ConfidenceChart({ rows }) {
  const bins = CONF_EDGES.slice(0, -1).map((lo, i) => {
    const hi = CONF_EDGES[i + 1];
    const inBin = rows.filter((r) => r.ai && r.ai.answer.confidence >= lo && r.ai.answer.confidence < hi);
    const verified = inBin.filter((r) => r.verified);
    const overrides = inBin.filter((r) => r.final_assessment.outcome !== r.ai.answer.recommendation).length;
    return {
      lo,
      label: `${Math.round(lo * 100)}–${Math.min(100, Math.round(hi * 100))}%`,
      right: verified.filter((r) => r.aiRight).length,
      wrong: verified.filter((r) => !r.aiRight).length,
      n: inBin.length,
      overrideRate: inBin.length ? overrides / inBin.length : null,
      overrides,
    };
  });
  const maxCount = Math.max(4, ...bins.map((b) => b.right + b.wrong));
  const ticks = niceTicks(maxCount);
  const top = ticks[ticks.length - 1];
  return (
    <Chart height={248} label="Verified cases by Cashy confidence, split by whether Cashy was right, with the share of cases in which the operator overrode Cashy.">
      {({ w, show, hide }) => {
        const m = { l: 32, r: 40, t: 12, b: 30 };
        const iw = w - m.l - m.r;
        const ih = 248 - m.t - m.b;
        const band = iw / bins.length;
        const bw = Math.min(54, band * 0.6);
        const y = (v) => m.t + ih - (v / top) * ih;
        const yr = (p) => m.t + ih - p * ih;
        const linePts = bins.map((b, i) => (b.overrideRate == null ? null : [m.l + band * i + band / 2, yr(b.overrideRate)])).filter(Boolean);
        return (
          <g>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} className="grid-line" />
                <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="axis-text">{t}</text>
              </g>
            ))}
            {[0, 0.5, 1].map((p) => (
              <text key={p} x={w - m.r + 6} y={yr(p) + 4} className="axis-text violet-text">{Math.round(p * 100)}%</text>
            ))}
            {bins.map((b, i) => {
              const x = m.l + band * i + (band - bw) / 2;
              const yRight = y(b.right);
              const yWrong = y(b.right + b.wrong);
              return (
                <g
                  key={b.label}
                  onMouseMove={(e) =>
                    show(
                      e,
                      <>
                        <strong>Confidence {b.label}</strong>
                        <span><i className="swatch blue" />Cashy right: {b.right}</span>
                        <span><i className="swatch red" />Cashy wrong: {b.wrong}</span>
                        <span><i className="swatch violet" />Operator overrode Cashy: {pct(b.overrideRate)} ({b.overrides} of {b.n})</span>
                      </>
                    )
                  }
                  onMouseLeave={hide}
                >
                  <rect x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" />
                  <rect x={x} y={yRight} width={bw} height={Math.max(0, y(0) - yRight)} className="fill-blue" rx="2" />
                  <rect x={x} y={yWrong} width={bw} height={Math.max(0, yRight - yWrong - 0.8)} className="fill-red" rx="2" />
                  <text x={m.l + band * i + band / 2} y={248 - 10} textAnchor="middle" className="axis-text">{b.label}</text>
                </g>
              );
            })}
            {linePts.length > 1 && <path d={linePts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')} className="line violet" />}
            {linePts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" className="dot violet" />)}
          </g>
        );
      }}
    </Chart>
  );
}

/* -- Dot plot with 95% intervals (fairness) ----------------------------------- */

function DotPlot({ groups, metric, overall, tone }) {
  const rowH = 46;
  const H = groups.length * rowH + 30;
  return (
    <Chart height={H} label={`${metric === 'correction' ? 'Correction rate' : 'Reliance rate'} by group with 95% confidence intervals.`}>
      {({ w, show, hide }) => {
        const labelW = Math.min(170, w * 0.36);
        const m = { l: labelW, r: 46, t: 6 };
        const x = (v) => m.l + v * (w - m.l - m.r);
        return (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={m.t} y2={H - 24} className="grid-line" />
                <text x={x(t)} y={H - 8} textAnchor="middle" className="axis-text">{Math.round(t * 100)}%</text>
              </g>
            ))}
            {overall?.p != null && (
              <g>
                <line x1={x(overall.p)} x2={x(overall.p)} y1={m.t} y2={H - 24} className="ref-line" />
              </g>
            )}
            {groups.map((g, i) => {
              const s = g[metric];
              const cy = m.t + i * rowH + rowH / 2;
              return (
                <g
                  key={g.key}
                  onMouseMove={(e) =>
                    show(
                      e,
                      <>
                        <strong>{g.label}</strong>
                        <span>{s.n} of {s.d} cases</span>
                        {s.ci && <span>95% CI {pct(s.ci[0])}–{pct(s.ci[1])}</span>}
                      </>
                    )
                  }
                  onMouseLeave={hide}
                >
                  <rect x="0" y={cy - rowH / 2} width={w} height={rowH} fill="transparent" />
                  <text x="0" y={cy - 3} className="bar-title">{g.label}</text>
                  <text x="0" y={cy + 13} className="axis-text">{s.d} cases</text>
                  {s.d >= 5 && s.ci ? (
                    <>
                      <line x1={x(s.ci[0])} x2={x(s.ci[1])} y1={cy} y2={cy} className={`ci-line ${tone}`} />
                      <circle cx={x(s.p)} cy={cy} r="6.5" className={`dot ${tone}`} />
                      <text x={w - 2} y={cy + 4} textAnchor="end" className="bar-value">{pct(s.p)}</text>
                    </>
                  ) : (
                    <text x={x(0)} y={cy + 4} className="axis-text">Too few cases to estimate</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      }}
    </Chart>
  );
}

/* -- Simple histogram ---------------------------------------------------------- */

function Histogram({ bins, tone = 'blue', height = 190, label, unit = 'cases', marker }) {
  const ticks = niceTicks(Math.max(4, ...bins.map((b) => b.count)));
  const top = ticks[ticks.length - 1];
  return (
    <Chart height={height} label={label}>
      {({ w, show, hide }) => {
        const m = { l: 28, r: 6, t: 10, b: 26 };
        const iw = w - m.l - m.r;
        const ih = height - m.t - m.b;
        const band = iw / bins.length;
        const y = (v) => m.t + ih - (v / top) * ih;
        return (
          <g>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} className="grid-line" />
                <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="axis-text">{t}</text>
              </g>
            ))}
            {bins.map((b, i) => (
              <g key={b.label} onMouseMove={(e) => show(e, <><strong>{b.label}</strong><span>{plural(b.count, unit.replace(/s$/, ''), unit)}</span></>)} onMouseLeave={hide}>
                <rect x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" />
                <rect x={m.l + band * i + 2} y={y(b.count)} width={Math.max(2, band - 4)} height={Math.max(0, y(0) - y(b.count))} rx="2" className={`fill-${tone}`} />
                <text x={m.l + band * i + band / 2} y={height - 8} textAnchor="middle" className="axis-text">{b.label}</text>
              </g>
            ))}
            {marker && (
              <g>
                <line x1={m.l + marker.at * band} x2={m.l + marker.at * band} y1={m.t} y2={m.t + ih} className="ref-line" />
                <text x={m.l + marker.at * band + 4} y={m.t + 10} className="axis-text">{marker.label}</text>
              </g>
            )}
          </g>
        );
      }}
    </Chart>
  );
}

/* -- CUSUM chart for one office ----------------------------------------------- */

function CusumChart({ drift, volume, label }) {
  const H = 214;
  const maxVol = Math.max(3, ...volume);
  return (
    <Chart height={H} label={label}>
      {({ w, show, hide }) => {
        const m = { l: 30, r: 8, t: 10, b: 20 };
        const t0 = WEEK0;
        const t1 = WEEK0 + WEEKS * 7 * DAY;
        const x = (t) => m.l + ((t - t0) / (t1 - t0)) * (w - m.l - m.r);
        const topH = 112;
        const base = m.t + topH;
        const ymax = Math.max(CUSUM_CFG.h * 1.35, drift.peak * 1.08);
        const y = (v) => base - (v / ymax) * topH;
        const volTop = base + 18;
        const volH = H - volTop - m.b;
        const band = (w - m.l - m.r) / WEEKS;
        let d = `M${x(t0).toFixed(1)},${y(0)}`;
        let prev = 0;
        drift.points.forEach((p) => {
          d += `L${x(p.at).toFixed(1)},${y(prev).toFixed(1)}L${x(p.at).toFixed(1)},${y(p.s).toFixed(1)}`;
          prev = p.s;
        });
        d += `L${x(t1).toFixed(1)},${y(prev).toFixed(1)}`;
        const signal = drift.signalAt != null ? drift.points[drift.signalAt] : null;
        return (
          <g>
            <rect x={m.l} y={m.t} width={w - m.l - m.r} height={y(CUSUM_CFG.h) - m.t} className="limit-zone" />
            <line x1={m.l} x2={w - m.r} y1={y(0)} y2={y(0)} className="grid-line" />
            <line x1={m.l} x2={w - m.r} y1={y(CUSUM_CFG.h * CUSUM_CFG.watch_fraction)} y2={y(CUSUM_CFG.h * CUSUM_CFG.watch_fraction)} className="watch-line" />
            <line x1={m.l} x2={w - m.r} y1={y(CUSUM_CFG.h)} y2={y(CUSUM_CFG.h)} className="limit-line" />
            <text x={m.l - 6} y={y(0) + 4} textAnchor="end" className="axis-text">0</text>
            <text x={m.l - 6} y={y(CUSUM_CFG.h) + 4} textAnchor="end" className="axis-text red-text">{CUSUM_CFG.h}</text>
            <text x={m.l + 4} y={y(CUSUM_CFG.h) - 5} className="axis-text red-text">Decision limit</text>
            <path d={d} className="cusum-line" />
            {signal && (
              <g>
                <line x1={x(signal.at)} x2={x(signal.at)} y1={m.t} y2={base} className="signal-line" />
                <text x={x(signal.at) + (x(signal.at) > w * 0.7 ? -5 : 5)} y={m.t + 11} textAnchor={x(signal.at) > w * 0.7 ? 'end' : 'start'} className="axis-text red-text strong-text">
                  Signal {formatDay(signal.at)}
                </text>
              </g>
            )}
            {drift.points.map((p) => (
              <circle
                key={p.id}
                cx={x(p.at)}
                cy={y(p.s)}
                r="3.2"
                className={p.corrected ? 'obs-ok' : 'obs-miss'}
                onMouseMove={(e) =>
                  show(
                    e,
                    <>
                      <strong>{formatDay(p.at)}</strong>
                      <span>{p.corrected ? 'Cashy error corrected' : 'Cashy error followed'}</span>
                      <span>CUSUM {p.s.toFixed(2)} (limit {CUSUM_CFG.h})</span>
                    </>
                  )
                }
                onMouseLeave={hide}
              />
            ))}
            {volume.map((v, i) => {
              const bh = (v / maxVol) * volH;
              return (
                <g key={i} onMouseMove={(e) => show(e, <><strong>Week of {formatDay(weekStart(i))}</strong><span>{plural(v, 'decision', 'decisions')}</span></>)} onMouseLeave={hide}>
                  <rect x={m.l + band * i + 1.5} y={volTop + volH - bh} width={Math.max(2, band - 3)} height={Math.max(0, bh)} rx="1.5" className="vol-bar" />
                  {i % 3 === 0 && <text x={m.l + band * i + band / 2} y={H - 5} textAnchor="middle" className="axis-text">{formatDay(weekStart(i))}</text>}
                </g>
              );
            })}
            <text x={m.l - 6} y={volTop + 8} textAnchor="end" className="axis-text">{maxVol}</text>
            <text x={m.l - 6} y={volTop + volH} textAnchor="end" className="axis-text">0</text>
          </g>
        );
      }}
    </Chart>
  );
}

/* -- HTML bar helpers ------------------------------------------------------------ */

function ScenarioBar({ counts, height = 10 }) {
  const total = SCENARIO_ORDER.reduce((a, k) => a + counts[k], 0);
  return (
    <div className="sbar" style={{ height }} role="img" aria-label={SCENARIO_ORDER.map((k) => `${SCENARIOS[k].short} ${counts[k]}`).join(', ')}>
      {total === 0 ? <span className="sbar-empty" /> : SCENARIO_ORDER.map((k) => counts[k] > 0 && <span key={k} className={`bg-${SCENARIOS[k].color}`} style={{ width: `${(counts[k] / total) * 100}%` }} title={`${SCENARIOS[k].short}: ${counts[k]}`} />)}
    </div>
  );
}

function StackRow({ label, segments, total, onClick, sub }) {
  const content = (
    <>
      <span className="stack-label">
        <strong>{label}</strong>
        {sub && <small>{sub}</small>}
      </span>
      <span className="stack-bar" role="img" aria-label={segments.map((s) => `${s.label} ${s.n}`).join(', ')}>
        {segments.map((s) => s.n > 0 && <span key={s.label} className={`bg-${s.color}`} style={{ width: `${(s.n / (total || 1)) * 100}%` }} title={`${s.label}: ${s.n}`} />)}
      </span>
    </>
  );
  return onClick ? (
    <button type="button" className="stack-row clickable" onClick={onClick}>{content}<ChevronRight size={16} aria-hidden="true" /></button>
  ) : (
    <div className="stack-row">{content}</div>
  );
}


/* ========================================================================== */
/*  Map                                                                       */
/*  Natural Earth projection; country shapes and the projection settings come */
/*  from MockData-2.json (geo). Bubbles: size = decisions, colour = share of  */
/*  Cashy errors the operators corrected, ring = process drift status.        */
/* ========================================================================== */

function naturalEarthRaw(lambda, phi) {
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return [
    lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
    phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))),
  ];
}
function projectPoint(lon, lat) {
  const { scale, translate } = mockData.geo.projection;
  const [rx, ry] = naturalEarthRaw((lon * Math.PI) / 180, (lat * Math.PI) / 180);
  return [translate[0] + scale * rx, translate[1] - scale * ry];
}

const MAP_ASPECT = 0.4;
// The sample covers the Americas, East Africa and the Middle East, so the first view is framed on them.
const WORLD_VIEW = [150, 82, 620, 620 * MAP_ASPECT];

const correctionTone = (stats) => (stats.correction.d < 5 ? 'gray' : stats.correction.p >= 0.7 ? 'teal' : stats.correction.p >= 0.5 ? 'amber' : 'red');
const worstDrift = (officeIds) => officeIds.reduce((w, id) => (DRIFT_RANK[OFFICE_DRIFT[id].status] > DRIFT_RANK[w] ? OFFICE_DRIFT[id].status : w), 'in_control');

function GeoMap({ scope, onSelect }) {
  const geo = mockData.geo;
  const ref = useRef(null);
  const [w, setW] = useState(0);
  const [tip, setTip] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => setW(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const countryId = countryOfScope(scope);
  const zoomed = organization.countries.find((c) => c.id === countryId);
  let view = WORLD_VIEW;
  if (zoomed && geo.countries[zoomed.iso2]) {
    const [bx0, by0, bx1, by1] = geo.countries[zoomed.iso2].bbox;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const vw = Math.max(110, (bx1 - bx0) * 2.7, ((by1 - by0) * 2.7) / MAP_ASPECT);
    view = [cx - vw / 2, cy - (vw * MAP_ASPECT) / 2, vw, vw * MAP_ASPECT];
  }
  const height = Math.round(Math.max(220, w * MAP_ASPECT));
  const unit = w ? view[2] / w : 1; // viewBox units per screen pixel
  const selectedOffice = officeOfScope(scope);

  const bubbles = zoomed
    ? OFFICES.filter((o) => o.country_id === zoomed.id).map((o) => {
        const rows = allDecisions.filter((d) => d.location.office_id === o.id);
        return { type: 'office', id: o.id, name: o.city, pos: projectPoint(o.lon, o.lat), rows, drift: OFFICE_DRIFT[o.id].status };
      })
    : organization.countries
        .filter((c) => OFFICES.some((o) => o.country_id === c.id))
        .map((c) => {
          const offices = OFFICES.filter((o) => o.country_id === c.id);
          const pts = offices.map((o) => projectPoint(o.lon, o.lat));
          return {
            type: 'country',
            id: c.id,
            name: c.display_name,
            pos: [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length],
            rows: allDecisions.filter((d) => d.location.country_id === c.id),
            drift: worstDrift(offices.map((o) => o.id)),
            offices: offices.length,
          };
        });

  const show = (e, content) => {
    const box = ref.current?.getBoundingClientRect();
    if (box) setTip({ x: e.clientX - box.left, y: e.clientY - box.top, content });
  };

  return (
    <div className="geo-map" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} viewBox={view.join(' ')} role="group" aria-label="Map of operations. Each bubble is a country or office; select one to filter the dashboard.">
          <path d={geo.land} className="map-land" />
          {Object.entries(geo.countries).map(([iso, c]) => {
            const country = organization.countries.find((x) => x.iso2 === iso);
            const hasData = country && OFFICES.some((o) => o.country_id === country.id);
            return <path key={iso} d={c.d} className={`map-country ${hasData ? 'has-data' : ''} ${country && country.id === countryId ? 'selected' : ''}`} />;
          })}
          {bubbles.map((b) => {
            const stats = summarize(b.rows);
            const tone = correctionTone(stats);
            const r = (b.type === 'office' ? 11 + Math.sqrt(b.rows.length) * 1.3 : 9 + Math.sqrt(b.rows.length) * 1.1) * unit;
            const selected = b.type === 'office' && b.id === selectedOffice;
            const aria = `${b.name}: ${plural(b.rows.length, 'decision', 'decisions')}, ${pct(stats.correction.p)} of Cashy errors corrected`;
            return (
              <g
                key={b.id}
                className={`map-bubble ${selected ? 'selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-label={aria}
                onClick={() => onSelect(b.type, b.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(b.type, b.id);
                  }
                }}
                onMouseMove={(e) =>
                  show(
                    e,
                    <>
                      <strong>{b.name}</strong>
                      <span>{plural(b.rows.length, 'decision', 'decisions')}{b.offices ? ` · ${plural(b.offices, 'office', 'offices')}` : ''}</span>
                      <span>Cashy errors corrected: {pct(stats.correction.p)} ({stats.correction.n} of {stats.correction.d})</span>
                      <span>Drift: {DRIFT_INFO[b.drift].label}</span>
                    </>
                  )
                }
                onMouseLeave={() => setTip(null)}
              >
                {(b.drift === 'signal' || b.drift === 'watch') && (
                  <circle cx={b.pos[0]} cy={b.pos[1]} r={r + 4 * unit} className={`drift-ring ${b.drift}`} strokeWidth={2.5 * unit} />
                )}
                <circle cx={b.pos[0]} cy={b.pos[1]} r={r} className={`bubble fill-${tone}`} strokeWidth={(selected ? 3 : 1.5) * unit} />
                <text x={b.pos[0]} y={b.pos[1] + 4 * unit} textAnchor="middle" className="bubble-count" style={{ fontSize: `${12 * unit}px` }}>
                  {b.rows.length}
                </text>
                <text x={b.pos[0]} y={b.pos[1] + r + 13 * unit} textAnchor="middle" className="bubble-label" style={{ fontSize: `${11.5 * unit}px`, strokeWidth: 3 * unit }}>
                  {b.name}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {tip && (
        <div className={`chart-tip ${tip.x > w / 2 ? 'left' : 'right'}`} style={{ left: tip.x, top: tip.y }} role="presentation">
          {tip.content}
        </div>
      )}
    </div>
  );
}

function MapLegend() {
  return (
    <div className="map-legend">
      <span className="map-legend-title">Cashy errors corrected</span>
      <ul className="legend">
        <li><i className="swatch teal" />70% or more</li>
        <li><i className="swatch amber" />50–69%</li>
        <li><i className="swatch red" />under 50%</li>
        <li><i className="swatch gray" />fewer than 5 errors</li>
      </ul>
      <ul className="legend">
        <li><i className="ring red" />Drift signal</li>
        <li><i className="ring amber" />Watch</li>
      </ul>
    </div>
  );
}


/* ========================================================================== */
/*  Overview                                                                  */
/* ========================================================================== */

const SCENARIO_ICON = { appropriate_reliance: CheckCircle2, harmful_override: X, appropriate_override: Star, over_reliance: Flag };

function ScenarioMatrix({ stats, onOpen }) {
  const cells = {
    appropriate_reliance: { p: stats.reliance, basis: 'of cases where Cashy was right' },
    harmful_override: { p: stats.harmfulOverride, basis: 'of cases where Cashy was right' },
    over_reliance: { p: stats.overReliance, basis: 'of cases where Cashy was wrong' },
    appropriate_override: { p: stats.correction, basis: 'of cases where Cashy was wrong' },
  };
  const rowsDef = [
    { title: 'Cashy was right', sub: `${stats.aiRight} verified cases`, keys: ['appropriate_reliance', 'harmful_override'] },
    { title: 'Cashy was wrong', sub: `${stats.aiWrong} verified cases`, keys: ['over_reliance', 'appropriate_override'] },
  ];
  return (
    <div className="matrix" role="group" aria-label="Four scenarios of operator and Cashy interaction">
      <div className="matrix-corner" />
      <div className="matrix-col">Operator follows Cashy <code>H = AI</code></div>
      <div className="matrix-col">Operator overrides Cashy <code>H ≠ AI</code></div>
      {rowsDef.map((row) => (
        <React.Fragment key={row.title}>
          <div className="matrix-row">
            <strong>{row.title}</strong>
            <small>{row.sub}</small>
          </div>
          {row.keys.map((key) => {
            const info = SCENARIOS[key];
            const { p, basis } = cells[key];
            const Icon = SCENARIO_ICON[key];
            return (
              <button type="button" key={key} className={`cell ${info.color} ${key === 'appropriate_override' ? 'primary' : ''}`} onClick={() => onOpen(key)}>
                <span className="cell-top">
                  <Icon size={17} aria-hidden="true" />
                  <strong>{key === 'over_reliance' ? 'Over-reliance' : info.label}</strong>
                </span>
                {key === 'over_reliance' && <span className="cell-alias">Harmful switch</span>}
                {key === 'appropriate_override' && <span className="cell-tag"><Star size={12} aria-hidden="true" />Main metric · maximise</span>}
                {key === 'over_reliance' && <span className="cell-tag critical"><Flag size={12} aria-hidden="true" />Critical · mitigate</span>}
                <span className="cell-count">{stats.counts[key]}</span>
                <span className="cell-rate">
                  <b>{pct(p.p)}</b> {basis}
                </span>
                <span className="cell-track"><i style={{ width: `${(p.p ?? 0) * 100}%` }} /></span>
                <span className="cell-ci">{p.ci ? `95% CI ${pct(p.ci[0])}–${pct(p.ci[1])}` : 'No cases'} · <code>{info.formula}</code></span>
                <small>{info.description}</small>
                {key === 'over_reliance' && stats.counts.over_reliance > 0 && (
                  <span className="cell-note">
                    {stats.harmfulSwitch} of {stats.counts.over_reliance} were harmful switches: the operator was initially right.
                  </span>
                )}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function EntityPanel({ scope, navigate }) {
  let items;
  let title;
  let subtitle;
  if (scope.type === 'global') {
    title = 'Countries';
    subtitle = 'Select a country to filter every page';
    items = organization.countries
      .filter((c) => OFFICES.some((o) => o.country_id === c.id))
      .map((c) => ({ type: 'country', id: c.id, name: c.display_name, sub: `${plural(OFFICES.filter((o) => o.country_id === c.id).length, 'office', 'offices')}`, rows: allDecisions.filter((d) => d.location.country_id === c.id) }));
  } else if (scope.type === 'country') {
    title = 'Offices';
    subtitle = `In ${nameOf('countries', scope.id)}`;
    items = OFFICES.filter((o) => o.country_id === scope.id).map((o) => ({ type: 'office', id: o.id, name: o.city, sub: 'Office', rows: allDecisions.filter((d) => d.location.office_id === o.id), drift: OFFICE_DRIFT[o.id].status }));
  } else {
    const officeId = officeOfScope(scope);
    title = 'Operators';
    subtitle = `Decision makers in ${nameOf('offices', officeId)}`;
    items = organization.operators
      .filter((p) => p.roles.includes('eligibility_decider') && p.assignments.some((a) => a.office_id === officeId))
      .map((p) => ({ type: 'operator', id: p.id, name: p.display_alias, sub: 'Eligibility decisions', rows: allDecisions.filter((d) => d.operator_id === p.id) }));
  }
  return (
    <Panel title={title} subtitle={subtitle} className="entity-panel" footnote="Bars show verified decisions by scenario. Select a row to filter the dashboard.">
      <div className="entity-list">
        {items.map((item) => {
          const s = summarize(item.rows);
          return (
            <StackRow
              key={item.id}
              label={item.name}
              sub={`${plural(item.rows.length, 'decision', 'decisions')} · corrected ${pct(s.correction.p)}`}
              total={SCENARIO_ORDER.reduce((a, k) => a + s.counts[k], 0)}
              segments={SCENARIO_ORDER.map((k) => ({ label: SCENARIOS[k].short, color: SCENARIOS[k].color, n: s.counts[k] }))}
              onClick={() => navigate('overview', { type: item.type, id: item.id })}
            />
          );
        })}
      </div>
      <Legend items={SCENARIO_ORDER.map((k) => [SCENARIOS[k].color, SCENARIOS[k].short])} />
    </Panel>
  );
}

function OverviewPage({ rows, scope, navigate }) {
  const S = useMemo(() => summarize(rows), [rows]);
  const series = useMemo(() => weeklySeries(rows, 3), [rows]);
  const scopeOffices = scope.type === 'global' ? OFFICES : scope.type === 'country' ? OFFICES.filter((o) => o.country_id === scope.id) : OFFICES.filter((o) => o.id === officeOfScope(scope));
  const statuses = scopeOffices.map((o) => OFFICE_DRIFT[o.id].status);
  const signals = statuses.filter((s) => s === 'signal').length;
  const watch = statuses.filter((s) => s === 'watch' || s === 'recovering').length;
  const spark = (pick, minD) => series.map((s) => (pick(s.stats).d >= minD ? pick(s.stats).p : null));
  const diff = (a, b) => Math.round((a - b) * 100);
  const sign = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
  const agreedFirst = rows.filter((r) => r.independent_assessment.outcome === r.ai?.answer.recommendation).length;
  const disagreedFirst = rows.length - agreedFirst;
  const switched = rows.filter((r) => r.independent_assessment.outcome !== r.ai?.answer.recommendation && r.final_assessment.outcome === r.ai?.answer.recommendation).length;
  const gainOverOperator = S.accFinal.p != null ? diff(S.accFinal.p, S.accInitial.p) : null;
  const gainOverCashy = S.accFinal.p != null ? diff(S.accFinal.p, S.accAi.p) : null;
  const openScenario = (key) => navigate('decisions', scope, key);

  return (
    <>
      {S.verified < 12 && (
        <div className="info-strip" role="note">
          <Info size={16} aria-hidden="true" />
          <p>Only {S.verified} verified cases in this scope. Percentages are unstable; read the confidence intervals.</p>
        </div>
      )}

      <div className="kpi-grid">
        <Kpi
          title="Final decision accuracy"
          value={pct(S.accFinal.p)}
          tone="teal"
          icon={Target}
          caption={`${S.accFinal.n} of ${S.verified} verified decisions match the reference`}
          spark={spark((s) => s.accFinal, 8)}
          sparkLabel="Weekly final decision accuracy"
        >
          <div className="kpi-chips">
            <span>Operator alone {pct(S.accInitial.p)}</span>
            <span>Cashy alone {pct(S.accAi.p)}</span>
          </div>
        </Kpi>
        <Kpi
          title="Appropriate override rate"
          value={pct(S.correction.p)}
          tone="teal"
          icon={Star}
          badge="Main metric"
          caption={`${S.correction.n} of ${S.correction.d} Cashy errors were corrected`}
          spark={spark((s) => s.correction, 4)}
          sparkLabel="Rolling three-week appropriate override rate"
        />
        <Kpi
          title="Over-reliance rate"
          value={pct(S.overReliance.p)}
          tone="red"
          icon={Flag}
          badge="Mitigate"
          caption={`${S.overReliance.n} of ${S.overReliance.d} Cashy errors were followed`}
          spark={spark((s) => s.overReliance, 4)}
          sparkLabel="Rolling three-week over-reliance rate"
        >
          <div className="kpi-chips">
            <span>{S.harmfulSwitch} harmful {S.harmfulSwitch === 1 ? 'switch' : 'switches'}</span>
          </div>
        </Kpi>
        <Kpi
          title="Changed after seeing Cashy"
          value={rate(S.changed, S.total)}
          tone="violet"
          icon={Repeat}
          caption={`${S.changed} of ${S.total} decisions differ from the initial assessment`}
        >
          <div className="kpi-chips">
            <span>{S.changedToAi} toward Cashy</span>
            <span>Median {durationLabel(S.medianDeliberation)} to decide</span>
          </div>
        </Kpi>
        <Kpi
          title="Process drift"
          value={signals ? plural(signals, 'signal', 'signals') : watch ? 'Watch' : 'In control'}
          tone={signals ? 'red' : watch ? 'amber' : 'teal'}
          icon={TrendingDown}
          caption={`${plural(scopeOffices.length, 'office', 'offices')} monitored · ${watch} on watch`}
          onClick={() => navigate('drift', scope)}
        />
      </div>

      <div className="grid">
        <Panel
          title="Four ways operators and Cashy interact"
          subtitle="Each verified decision falls in exactly one cell, judged against the independent reference"
          className="c7"
          footnote={`${S.counts.unverified} unverified ${S.counts.unverified === 1 ? 'case is' : 'cases are'} left out. Rates use separate denominators: cases where Cashy was right (top row) and wrong (bottom row). Select a cell to see its cases.`}
        >
          <ScenarioMatrix stats={S} onOpen={openScenario} />
        </Panel>

        <Panel title="Does Cashy help?" subtitle="Accuracy against the independent reference" className="c5">
          <div className="panel-body">
            <AccuracyBars stats={S} />
            {gainOverOperator != null && (
              <p className="insight">
                Final decisions are <b>{sign(gainOverOperator)} points</b> against the operator alone and <b>{sign(gainOverCashy)} points</b> against Cashy alone.
                {S.accFinal.p > Math.max(S.accInitial.p, S.accAi.p) ? ' The pair does better than either on its own.' : ' The pair does not beat the better of the two on its own.'}
              </p>
            )}
            <dl className="mini-stats">
              <div><dt>Agreed at first look</dt><dd>{rate(agreedFirst, rows.length)}<small>{agreedFirst} of {rows.length} decisions</small></dd></div>
              <div><dt>Gave way to Cashy</dt><dd>{rate(switched, disagreedFirst)}<small>{switched} of {disagreedFirst} initial disagreements</small></dd></div>
            </dl>
          </div>
        </Panel>

        <Panel title="Verified decisions per week" subtitle="By scenario" className="c6" action={null}>
          <div className="panel-body">
            <WeeklyScenarioBars series={series} />
            <Legend items={SCENARIO_ORDER.map((k) => [SCENARIOS[k].color, SCENARIOS[k].short])} />
          </div>
        </Panel>

        <Panel title="Accuracy over time" subtitle="Rolling three-week window" className="c6">
          <div className="panel-body">
            <AccuracyLines series={series} />
            <Legend items={ACC_LINES.map(([, label, tone]) => [tone, label])} />
          </div>
        </Panel>

        <Panel
          title="Where decisions happen"
          subtitle={scope.type === 'global' ? 'Select a country to zoom in' : 'Select an office to filter'}
          className="c7"
          action={scope.type !== 'global' && <button type="button" className="button text-button" onClick={() => navigate('overview', { type: 'global' })}>Back to world</button>}
        >
          <GeoMap scope={scope} onSelect={(type, id) => navigate('overview', { type, id })} />
          <MapLegend />
        </Panel>

        <div className="c5">
          <EntityPanel scope={scope} navigate={navigate} />
        </div>

        <Panel title="How decisions change" subtitle="Initial assessment to final decision" className="c5" footnote="Changes are judged against the independent reference when one exists.">
          <div className="panel-body">
            <FlowChart rows={rows} />
            <Legend items={[['flowsame', 'Unchanged'], ['teal', 'Changed, now matches the reference'], ['red', 'Changed, now misses the reference'], ['violet', 'Changed, no reference']]} />
          </div>
        </Panel>

        <Panel title="Cashy confidence and operator response" subtitle="Do operators override more when Cashy is less sure?" className="c7">
          <div className="panel-body">
            <ConfidenceChart rows={rows} />
            <Legend items={[['blue', 'Cashy right'], ['red', 'Cashy wrong'], ['violet', 'Share of cases the operator overrode (right axis)']]} />
          </div>
        </Panel>
      </div>
    </>
  );
}


/* ========================================================================== */
/*  Decisions                                                                 */
/* ========================================================================== */

const PAGE_SIZE = 15;
const DECISION_BY_INTERVIEW = Object.fromEntries(allDecisions.map((d) => [d.interview_id, d]));

function Outcome({ value }) {
  return <span className={`outcome ${value}`}>{outcomeLabel(value)}</span>;
}

function DecisionsPage({ rows, scenario, onScenario, onOpen, navigate }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(0);
  const counts = useMemo(() => summarize(rows).counts, [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => (scenario === 'all' || r.category === scenario) && `${shortCase(r.case_id)} ${nameOf('operators', r.operator_id)} ${nameOf('offices', r.location.office_id)}`.toLowerCase().includes(q));
    const sorted = [...list];
    if (sort === 'recent') sorted.sort((a, b) => b.at - a.at);
    if (sort === 'confidence_high') sorted.sort((a, b) => b.ai.answer.confidence - a.ai.answer.confidence);
    if (sort === 'confidence_low') sorted.sort((a, b) => a.ai.answer.confidence - b.ai.answer.confidence);
    if (sort === 'deliberation') sorted.sort((a, b) => a.deliberation - b.deliberation);
    return sorted;
  }, [rows, scenario, query, sort]);
  useEffect(() => setPage(0), [rows, scenario, query, sort]);
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div className="chip-row" role="group" aria-label="Filter by scenario">
        <button type="button" className={`chip ${scenario === 'all' ? 'active' : ''}`} aria-pressed={scenario === 'all'} onClick={() => onScenario('all')}>
          All <b>{rows.length}</b>
        </button>
        {Object.entries(SCENARIOS).map(([key, info]) => (
          <button type="button" key={key} className={`chip ${info.color} ${scenario === key ? 'active' : ''}`} aria-pressed={scenario === key} onClick={() => onScenario(key)}>
            <i className={`swatch ${info.color}`} aria-hidden="true" />
            {info.short} <b>{counts[key]}</b>
          </button>
        ))}
      </div>

      <Panel
        title="Decision register"
        subtitle={`${filtered.length} of ${rows.length} decisions in scope`}
        action={<button type="button" className="button text-button" onClick={() => download(csv(filtered), 'decisions-filtered.csv', 'text/csv;charset=utf-8')}><Download size={15} aria-hidden="true" />CSV</button>}
        footnote="A decision is scored against the case's independent reference, not against an absolute measure of need."
      >
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <input aria-label="Search decisions" placeholder="Search case, operator or office…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select aria-label="Sort decisions" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Most recent first</option>
            <option value="confidence_high">Cashy confidence, high to low</option>
            <option value="confidence_low">Cashy confidence, low to high</option>
            <option value="deliberation">Fastest to decide first</option>
          </select>
        </div>
        {visible.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Operator</th>
                  <th>Initial</th>
                  <th>Cashy</th>
                  <th>Final</th>
                  <th>Reference</th>
                  <th>Scenario</th>
                  <th><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button type="button" className="case-link" onClick={() => onOpen({ decision: r })}>{shortCase(r.case_id)}</button>
                      <small>{nameOf('offices', r.location.office_id)} · {formatDay(r.at)}</small>
                    </td>
                    <td>
                      <button type="button" className="operator-link" onClick={() => navigate('decisions', { type: 'operator', id: r.operator_id })}>{nameOf('operators', r.operator_id)}</button>
                      <small>{durationLabel(r.deliberation)} to decide</small>
                    </td>
                    <td><Outcome value={r.independent_assessment.outcome} /></td>
                    <td>
                      <Outcome value={r.ai.answer.recommendation} />
                      <span className="conf" title={`Confidence ${pct(r.ai.answer.confidence)}`}><i style={{ width: `${r.ai.answer.confidence * 100}%` }} /></span>
                    </td>
                    <td>
                      <Outcome value={r.final_assessment.outcome} />
                      {r.changed && <small className="change-label">Changed</small>}
                    </td>
                    <td>{r.review ? <Outcome value={r.review.reference_standard.outcome} /> : <span className="muted">None</span>}</td>
                    <td><Badge tone={SCENARIOS[r.category].color}>{SCENARIOS[r.category].short}</Badge></td>
                    <td>
                      <button type="button" className="icon-button" aria-label={`Open ${shortCase(r.case_id)}`} onClick={() => onOpen({ decision: r })}><ChevronRight size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Panel>
    </>
  );
}

/* ========================================================================== */
/*  Interviews                                                                */
/* ========================================================================== */

const SENTIMENT_COLOR = { negative: 'red', neutral: 'slate', positive: 'teal', mixed: 'amber' };

function InterviewsPage({ interviews, onOpen, navigate, scope }) {
  const [query, setQuery] = useState('');
  const [sentiment, setSentiment] = useState('all');
  const [page, setPage] = useState(0);
  const available = interviews.filter((i) => i.sentiment_analysis.status === 'available');
  const negative = available.filter((i) => i.sentiment_analysis.result.label === 'negative').length;
  const pending = interviews.filter((i) => !DECISION_BY_INTERVIEW[i.id]).length;
  const avgDuration = interviews.length ? interviews.reduce((s, i) => s + i.duration_min, 0) / interviews.length : 0;

  const durationBins = histogram(interviews.map((i) => i.duration_min), [10, 20, 30, 40, 50, 70]).map((b) => ({ label: `${b.lo}–${b.hi - 1 === 69 ? '70' : b.hi}`, count: b.items.length }));
  const weekly = Array.from({ length: WEEKS }, (_, w) => ({ label: formatDay(weekStart(w)), count: interviews.filter((i) => weekOf(i.conducted_at) === w).length }));

  const groupBy = scope.type === 'global' || scope.type === 'country' ? 'office' : 'interviewer';
  const groups = (groupBy === 'office'
    ? OFFICES.filter((o) => scope.type === 'global' || o.country_id === scope.id).map((o) => ({ id: o.id, name: o.city, items: interviews.filter((i) => i.location.office_id === o.id) }))
    : [...new Set(interviews.map((i) => i.interviewer_id))].map((id) => ({ id, name: nameOf('operators', id), items: interviews.filter((i) => i.interviewer_id === id) }))
  ).filter((g) => g.items.length);

  const filtered = interviews
    .filter((i) => (sentiment === 'all' || (sentiment === 'unavailable' ? i.sentiment_analysis.status !== 'available' : i.sentiment_analysis.result?.label === sentiment)) && `${shortCase(i.case_id)} ${nameOf('operators', i.interviewer_id)} ${nameOf('offices', i.location.office_id)} ${i.household_snapshot.summary}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.conducted_at.localeCompare(a.conducted_at));
  useEffect(() => setPage(0), [interviews, query, sentiment]);
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div className="kpi-grid four">
        <Kpi title="Interviews" value={interviews.length} tone="blue" icon={MessageSquareText} caption={`${pending} still waiting for a decision`} />
        <Kpi title="Average length" value={`${Math.round(avgDuration)} min`} tone="teal" icon={Clock} caption={`Median ${Math.round(median(interviews.map((i) => i.duration_min)) ?? 0)} min`} />
        <Kpi title="Negative sentiment" value={rate(negative, available.length)} tone="red" icon={Flag} caption={`${negative} of ${available.length} interviews with sentiment recorded`} />
        <Kpi title="Languages" value={new Set(interviews.map((i) => i.language)).size} tone="violet" icon={Globe2} caption={[...new Set(interviews.map((i) => i.language))].join(', ')} />
      </div>

      <div className="grid">
        <Panel title="Sentiment by source" subtitle={groupBy === 'office' ? 'Interviews per office' : 'Interviews per interviewer'} className="c5">
          <div className="entity-list">
            {groups.map((g) => (
              <StackRow
                key={g.id}
                label={g.name}
                sub={plural(g.items.length, 'interview', 'interviews')}
                total={g.items.length}
                segments={[...Object.keys(SENTIMENT_LABELS).map((k) => ({ label: SENTIMENT_LABELS[k], color: SENTIMENT_COLOR[k], n: g.items.filter((i) => i.sentiment_analysis.result?.label === k).length })), { label: 'Unavailable', color: 'gray', n: g.items.filter((i) => i.sentiment_analysis.status !== 'available').length }]}
                onClick={groupBy === 'office' ? () => navigate('interviews', { type: 'office', id: g.id }) : undefined}
              />
            ))}
          </div>
          <Legend items={[...Object.entries(SENTIMENT_LABELS).map(([k, l]) => [SENTIMENT_COLOR[k], l]), ['gray', 'Unavailable']]} />
        </Panel>

        <div className="c7 stack">
          <Panel title="Interviews per week" subtitle="By date conducted">
            <div className="panel-body">
              <Histogram bins={weekly} tone="blue" height={150} unit="interviews" label="Interviews conducted per week" />
            </div>
          </Panel>
          <Panel title="Interview length" subtitle="Minutes">
            <div className="panel-body">
              <Histogram bins={durationBins} tone="teal" height={150} unit="interviews" label="Distribution of interview length in minutes" />
            </div>
          </Panel>
        </div>
      </div>

      <div className="section-gap" />
      <Panel
        title="Interview list"
        subtitle={`${filtered.length} interviews · sentiment is read from the interviewer's notes`}
        action={<button type="button" className="button text-button" onClick={() => download(JSON.stringify(filtered, null, 2), 'interviews-filtered.json')}><Download size={15} aria-hidden="true" />JSON</button>}
        footnote="Sentiment is a signal about text. These notes do not capture the full interview or assess the person."
      >
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <input aria-label="Search interviews" placeholder="Search case, interviewer, office or household…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select aria-label="Filter sentiment" value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
            <option value="all">All sentiment labels</option>
            {Object.entries(SENTIMENT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        {visible.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Case</th><th>Household</th><th>Sentiment</th><th>Length</th><th>Interviewer</th><th><span className="sr-only">Open</span></th></tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <button type="button" className="case-link" onClick={() => onOpen({ interview: i, decision: DECISION_BY_INTERVIEW[i.id], tab: 'interview' })}>{shortCase(i.case_id)}</button>
                      <small>{nameOf('offices', i.location.office_id)} · {formatDay(i.conducted_at)}</small>
                    </td>
                    <td className="summary-cell">{i.household_snapshot.summary}</td>
                    <td>{i.sentiment_analysis.status === 'available' ? <Badge tone={SENTIMENT_COLOR[i.sentiment_analysis.result.label]}>{SENTIMENT_LABELS[i.sentiment_analysis.result.label]}</Badge> : <Badge tone="gray">Unavailable</Badge>}</td>
                    <td className="nowrap">{i.duration_min} min<small>{i.language}</small></td>
                    <td><button type="button" className="operator-link" onClick={() => navigate('interviews', { type: 'operator', id: i.interviewer_id })}>{nameOf('operators', i.interviewer_id)}</button></td>
                    <td><button type="button" className="icon-button" aria-label={`Open ${shortCase(i.case_id)}`} onClick={() => onOpen({ interview: i, decision: DECISION_BY_INTERVIEW[i.id], tab: 'interview' })}><ChevronRight size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Panel>
    </>
  );
}

/* ========================================================================== */
/*  Equity and blind spots                                                    */
/* ========================================================================== */

function parityVerdict(gp) {
  if (!gp) return { tone: 'gray', label: 'Too few cases' };
  if (gp.gap < THRESHOLDS.parity_gap) return { tone: 'teal', label: 'Parity holds' };
  if (gp.overlap) return { tone: 'amber', label: 'Gap within sampling uncertainty' };
  return { tone: 'red', label: 'Gap exceeds sampling uncertainty' };
}

function EquityPage({ rows }) {
  const [attr, setAttr] = useState('head_sex');
  const verified = useMemo(() => rows.filter((r) => r.verified), [rows]);
  const overall = useMemo(() => summarize(rows), [rows]);
  const allGroups = useMemo(() => Object.fromEntries(Object.entries(GROUP_ATTRIBUTES).map(([k, a]) => [k, groupStats(rows, (r) => r.profile[k], a.values)])), [rows]);
  const groups = allGroups[attr];
  const gap = parityGap(groups);
  const verdict = parityVerdict(gap);
  const spots = useMemo(() => blindSpots(rows, THRESHOLDS.blind_spot), [rows]);
  const flagged = spots.filter((s) => s.flagged);
  const shown = spots.filter((s) => s.n >= 5).slice(0, 7);

  return (
    <>
      <div className="grid explainer">
        <section className="note-card c4">
          <span className="note-icon teal"><Scale size={18} aria-hidden="true" /></span>
          <h2>The question</h2>
          <p>Is the operator equally good at correcting Cashy's mistakes for every group of households?</p>
          <code className="formula">P(H = Y | AI ≠ Y, A = a)</code>
          <small>Equal Opportunity of Correction: the share of Cashy errors the operator fixes, compared across groups A.</small>
        </section>
        <section className="note-card c4">
          <span className="note-icon amber"><Info size={18} aria-hidden="true" /></span>
          <h2>Why not equal approval rates</h2>
          <p>Statistical parity would force the same acceptance rate in every group. In a crisis, need is rarely spread evenly, so equalising rates could push out the most vulnerable group. We compare errors corrected among households that need help instead.</p>
        </section>
        <section className="note-card c4">
          <span className="note-icon violet"><Layers size={18} aria-hidden="true" /></span>
          <h2>How to read the gaps</h2>
          <p>A gap under {Math.round(THRESHOLDS.parity_gap * 100)} points counts as parity. Larger gaps are flagged, and marked stronger when the 95% intervals do not overlap. Small groups give wide intervals: treat them as questions to investigate, not verdicts.</p>
        </section>
      </div>

      <div className="section-gap" />
      <Panel title="Gap overview" subtitle="Largest difference in correction rate between groups, per attribute" footnote="Verified cases only. Intervals are descriptive Wilson intervals, not adjusted for repeated assessments by the same operator.">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Attribute</th><th>Lowest correction rate</th><th>Highest correction rate</th><th>Gap</th><th>Reading</th></tr>
            </thead>
            <tbody>
              {Object.entries(GROUP_ATTRIBUTES).map(([k, a]) => {
                const g = parityGap(allGroups[k]);
                const v = parityVerdict(g);
                return (
                  <tr key={k} className={k === attr ? 'row-active' : ''}>
                    <td><button type="button" className="case-link" onClick={() => setAttr(k)}>{a.label}</button></td>
                    <td>{g ? <>{g.low.label} <b>{pct(g.low.correction.p)}</b></> : '—'}</td>
                    <td>{g ? <>{g.high.label} <b>{pct(g.high.correction.p)}</b></> : '—'}</td>
                    <td><b>{g ? `${Math.round(g.gap * 100)} pts` : '—'}</b></td>
                    <td><Badge tone={v.tone}>{v.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="section-gap" />
      <div className="tab-row">
        <SegmentedControl label="Attribute" value={attr} onChange={setAttr} options={Object.entries(GROUP_ATTRIBUTES).map(([k, a]) => [k, a.label])} />
        <Badge tone={verdict.tone}>{verdict.label}{gap ? ` · ${Math.round(gap.gap * 100)} pts` : ''}</Badge>
      </div>

      <div className="grid">
        <Panel title="Correction rate" subtitle="Cashy was wrong: how often the operator fixed it" className="c6">
          <div className="panel-body">
            <DotPlot groups={groups} metric="correction" overall={overall.correction} tone="teal" />
            <p className="chart-note"><i className="dash" aria-hidden="true" /> Dashed line: all groups, {pct(overall.correction.p)}</p>
          </div>
        </Panel>
        <Panel title="Reliance rate" subtitle="Cashy was right: how often the operator agreed" className="c6">
          <div className="panel-body">
            <DotPlot groups={groups} metric="reliance" overall={overall.reliance} tone="blue" />
            <p className="chart-note"><i className="dash" aria-hidden="true" /> Dashed line: all groups, {pct(overall.reliance.p)}</p>
          </div>
        </Panel>
        <Panel title="Scenario mix by group" subtitle="Share of verified decisions" className="c7">
          <div className="entity-list">
            {groups.map((g) => (
              <StackRow
                key={g.key}
                label={g.label}
                sub={`${g.n} verified · Cashy wrong ${pct(g.aiError.p)}`}
                total={SCENARIO_ORDER.reduce((a, k) => a + g.counts[k], 0)}
                segments={SCENARIO_ORDER.map((k) => ({ label: SCENARIOS[k].short, color: SCENARIOS[k].color, n: g.counts[k] }))}
              />
            ))}
          </div>
          <Legend items={SCENARIO_ORDER.map((k) => [SCENARIOS[k].color, SCENARIOS[k].short])} />
        </Panel>
        <Panel title="False negatives rescued" subtitle="Cashy said not eligible, the household was eligible" className="c5">
          <div className="entity-list">
            {groups.map((g) => (
              <div className="meter-row" key={g.key}>
                <span className="meter-label"><strong>{g.label}</strong><small>{g.falseNegatives.n} of {g.falseNegatives.d}</small></span>
                <span className="meter"><i style={{ width: `${(g.falseNegatives.p ?? 0) * 100}%` }} /></span>
                <b>{g.falseNegatives.d ? pct(g.falseNegatives.p) : '—'}</b>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="section-gap" />
      <Panel
        title="Blind spots in the model"
        subtitle="Where operators' appropriate overrides concentrate"
        action={<Badge tone="violet">For the data science team</Badge>}
        footnote="This is not a judgement on operators. It marks a limit of the model that operators are compensating for, to be weighed in the next training cycle."
      >
        <div className="panel-body">
          {flagged.length ? (
            flagged.map((s) => (
              <div className="callout" key={s.key} role="note">
                <Flag size={20} aria-hidden="true" />
                <div>
                  <strong>{s.label}</strong>
                  <p>
                    This group holds <b>{pct(s.share)}</b> of all appropriate overrides but only <b>{pct(s.casesShare)}</b> of verified cases ({s.lift.toFixed(1)}× its size). Cashy is wrong on <b>{pct(s.aiError.p)}</b> of these households, and {pct(s.falseNegativeShare)} of the corrections are households Cashy would have excluded. Operators are compensating for a systematic limit of the model.
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="insight">No cluster holds {pct(THRESHOLDS.blind_spot.min_share)} or more of the appropriate overrides in this scope.</p>
          )}
          <div className="spot-head" aria-hidden="true">
            <span>Cluster</span>
            <span>Share of all appropriate overrides · Share of verified cases</span>
          </div>
          <ul className="spots">
            {shown.map((s) => (
              <li key={s.key} className={s.flagged ? 'flagged' : ''}>
                <span className="spot-label">
                  <strong>{s.label}</strong>
                  <small>{s.n} cases · Cashy wrong {pct(s.aiError.p)}</small>
                </span>
                <span className="spot-bars">
                  <span className="spot-bar"><i className="bg-teal" style={{ width: `${s.share * 100}%` }} /><b>{pct(s.share)}</b></span>
                  <span className="spot-bar"><i className="bg-slate" style={{ width: `${s.casesShare * 100}%` }} /><b>{pct(s.casesShare)}</b></span>
                </span>
              </li>
            ))}
          </ul>
          <Legend items={[['teal', 'Share of appropriate overrides'], ['slate', 'Share of verified cases']]} />
        </div>
      </Panel>
    </>
  );
}

/* ========================================================================== */
/*  Process drift                                                             */
/* ========================================================================== */

function DriftCard({ office }) {
  const drift = OFFICE_DRIFT[office.id];
  const rows = useMemo(() => allDecisions.filter((d) => d.location.office_id === office.id), [office.id]);
  const volume = useMemo(() => Array.from({ length: WEEKS }, (_, w) => rows.filter((r) => r.week === w).length), [rows]);
  const s = summarize(rows);
  const info = DRIFT_INFO[drift.status];
  const country = organization.countries.find((c) => c.id === office.country_id);
  const recent = drift.points.slice(-10);
  const recentRate = recent.length ? recent.filter((p) => p.corrected).length / recent.length : null;
  const early = rows.filter((r) => r.week < CUSUM_CFG.baseline_weeks);
  const late = rows.filter((r) => r.week >= WEEKS - 5);
  const perWeek = (list, weeks) => (list.length / weeks).toFixed(1);
  const dEarly = median(early.map((r) => r.deliberation));
  const dLate = median(late.map((r) => r.deliberation));
  const signal = drift.signalAt != null ? drift.points[drift.signalAt] : null;
  const messages = {
    signal: `Signal raised on ${signal ? formatDay(signal.at) : ''}. Over the last ${recent.length} Cashy errors the office corrected ${pct(recentRate)}, against a network baseline of ${pct(BASELINE.p0)}. Raised to the regional lead for ${country.region}: possible drop in attention or case overload.`,
    recovering: `A signal was raised on ${signal ? formatDay(signal.at) : ''} and corrections have since recovered.`,
    watch: `Evidence of a drop is building but has not crossed the limit. Last ${recent.length} Cashy errors: ${pct(recentRate)} corrected, against a baseline of ${pct(BASELINE.p0)}.`,
    in_control: `Corrections are in line with the network baseline of ${pct(BASELINE.p0)}.`,
  };
  const label = `${office.city} correction drift. Status: ${info.label}. ${messages[drift.status]}`;
  return (
    <article className={`drift-card ${drift.status}`}>
      <header>
        <div>
          <h3>{office.city}</h3>
          <small>{country.display_name} · {plural(rows.length, 'decision', 'decisions')}</small>
        </div>
        <Badge tone={info.tone}>{info.label}</Badge>
      </header>
      <p className="drift-message">{messages[drift.status]}</p>
      <CusumChart drift={drift} volume={volume} label={label} />
      <dl className="drift-stats">
        <div><dt>Corrected, whole period</dt><dd>{pct(s.correction.p)}<small>{s.correction.n} of {s.correction.d}</small></dd></div>
        <div><dt>Cases per week</dt><dd>{perWeek(late, 5)}<small>{perWeek(early, CUSUM_CFG.baseline_weeks)} in the first {CUSUM_CFG.baseline_weeks} weeks</small></dd></div>
        <div><dt>Median time to decide</dt><dd>{durationLabel(dLate)}<small>{durationLabel(dEarly)} earlier</small></dd></div>
      </dl>
    </article>
  );
}

function DriftPage({ scope }) {
  const officeId = officeOfScope(scope);
  const list = scope.type === 'global' ? OFFICES : scope.type === 'country' ? OFFICES.filter((o) => o.country_id === scope.id) : OFFICES.filter((o) => o.id === officeId);
  const ordered = [...list].sort((a, b) => DRIFT_RANK[OFFICE_DRIFT[b.id].status] - DRIFT_RANK[OFFICE_DRIFT[a.id].status]);
  const counts = (st) => list.filter((o) => OFFICE_DRIFT[o.id].status === st).length;
  return (
    <>
      <div className="grid explainer">
        <section className="note-card c4">
          <span className="note-icon teal"><Target size={18} aria-hidden="true" /></span>
          <h2>What is tracked</h2>
          <p>Every case where Cashy was wrong is one observation: did the operator correct it or follow it? A healthy office corrects at about the network baseline of <b>{pct(BASELINE.p0)}</b>.</p>
        </section>
        <section className="note-card c4">
          <span className="note-icon amber"><TrendingDown size={18} aria-hidden="true" /></span>
          <h2>How the line works</h2>
          <p>The CUSUM line adds up evidence that corrections have fallen by {Math.round(CUSUM_CFG.target_shift * 100)} points or more. It stays near zero while the office is steady, and climbs after each missed correction.</p>
        </section>
        <section className="note-card c4">
          <span className="note-icon red"><Flag size={18} aria-hidden="true" /></span>
          <h2>What happens at the limit</h2>
          <p>A signal goes to the regional lead, never to the operator. It points to a possible drop in attention or overloaded casework in the office, not to individual blame.</p>
        </section>
      </div>

      <div className="kpi-grid four">
        <Kpi title="Offices monitored" value={list.length} tone="blue" icon={Building2} caption={scope.type === 'operator' ? 'Office-level view of this operator' : 'In the selected scope'} />
        <Kpi title="Signals" value={counts('signal')} tone={counts('signal') ? 'red' : 'teal'} icon={Flag} caption="Above the decision limit now" />
        <Kpi title="Watch or recovering" value={counts('watch') + counts('recovering')} tone="amber" icon={Activity} caption={`Past ${Math.round(CUSUM_CFG.watch_fraction * 100)}% of the limit`} />
        <Kpi title="Network baseline" value={pct(BASELINE.p0)} tone="teal" icon={Target} caption={`Corrections in the first ${CUSUM_CFG.baseline_weeks} weeks (${BASELINE.n} Cashy errors). Alarm level: ${pct(BASELINE.p1)}`} />
      </div>

      <div className="drift-grid">
        {ordered.map((o) => <DriftCard key={o.id} office={o} />)}
      </div>
      <div className="panel-footnote standalone">
        <Info size={14} aria-hidden="true" />
        <span>Bernoulli CUSUM on verified cases where Cashy was wrong, ordered by decision time. Decision limit {CUSUM_CFG.h}. Gray bars show cases decided per week. Dots on the line: teal = corrected, red = followed.</span>
      </div>
    </>
  );
}


/* ========================================================================== */
/*  Dialogs                                                                   */
/* ========================================================================== */

function useDialog(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!el.open) el.showModal();
    const close = () => onClose();
    el.addEventListener('close', close);
    return () => {
      el.removeEventListener('close', close);
      if (el.open) el.close();
    };
  }, [onClose]);
  const onClick = (e) => {
    if (e.target === ref.current) ref.current.close();
  };
  return { ref, onClick };
}

function DetailDialog({ selected, onClose }) {
  const { ref, onClick } = useDialog(onClose);
  const row = selected.decision;
  const interview = selected.interview ?? row?.interview;
  const [tab, setTab] = useState(selected.tab ?? (row ? 'decision' : 'interview'));
  const tabs = [row && ['decision', 'Decision', ClipboardCheck], interview && ['interview', 'Interview', MessageSquareText], row && ['timeline', 'Timeline', Clock]].filter(Boolean);
  const info = row ? SCENARIOS[row.category] : null;
  const caseId = row?.case_id ?? interview?.case_id;
  const profile = interview?.household_snapshot;
  return (
    <dialog ref={ref} className="detail-dialog" aria-labelledby="dialog-title" onClick={onClick}>
      <div className="dialog-inner">
        <header className="dialog-header">
          <div>
            <h2 id="dialog-title">{shortCase(caseId)}</h2>
            <p>{row ? `${nameOf('offices', row.location.office_id)} · ${nameOf('countries', row.location.country_id)}` : `${nameOf('offices', interview.location.office_id)} · interview only`}</p>
          </div>
          <div className="dialog-header-actions">
            {info && <Badge tone={info.color}>{info.label}</Badge>}
            <button type="button" className="icon-button" aria-label="Close" onClick={() => ref.current.close()}><X size={20} /></button>
          </div>
        </header>
        <div className="tabs" role="tablist" aria-label="Case sections">
          {tabs.map(([key, label, Icon]) => (
            <button type="button" key={key} role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              <Icon size={16} aria-hidden="true" />{label}
            </button>
          ))}
        </div>
        <div className="dialog-body" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'decision' && row && (
            <>
              <div className="case-summary">
                <span className="section-label">HOUSEHOLD</span>
                <p>{profile?.summary}</p>
              </div>
              <h3 className="detail-title">Decision path</h3>
              <div className="decision-path">
                <div className="decision-step">
                  <span className="step-label">1 · Operator, before Cashy</span>
                  <strong className={row.independent_assessment.outcome}>{outcomeLabel(row.independent_assessment.outcome)}</strong>
                  <small>{nameOf('operators', row.operator_id)}</small>
                </div>
                <div className="decision-step ai">
                  <span className="step-label">2 · Cashy recommendation</span>
                  <strong className={row.ai.answer.recommendation}>{outcomeLabel(row.ai.answer.recommendation)}</strong>
                  <span className="conf wide" title={`Confidence ${pct(row.ai.answer.confidence)}`}><i style={{ width: `${row.ai.answer.confidence * 100}%` }} /></span>
                  <small>Confidence {pct(row.ai.answer.confidence)}</small>
                </div>
                <div className="decision-step final">
                  <span className="step-label">3 · Final decision</span>
                  <strong className={row.final_assessment.outcome}>{outcomeLabel(row.final_assessment.outcome)}</strong>
                  <small>{row.changed ? 'Changed after seeing Cashy' : 'Same as the initial assessment'} · {durationLabel(row.deliberation)} to decide</small>
                </div>
              </div>

              <div className={`scenario-box ${info.color}`}>
                <span className="section-label">WHAT THIS CASE SHOWS</span>
                <strong>{info.label}{row.category === 'over_reliance' ? ' (harmful switch)' : ''}</strong>
                <p>{info.description}</p>
                {info.formula && <code>{info.formula}</code>}
                {row.category === 'over_reliance' && row.initialRight && <p className="small-muted">The operator had the right answer before seeing Cashy and switched to the wrong one.</p>}
              </div>

              <div className="two-column">
                <div className="detail-block">
                  <h3>Final rationale</h3>
                  <p>{row.final_assessment.justification.text}</p>
                </div>
                <div className="detail-block">
                  <h3>Operator's view of Cashy</h3>
                  <p>{POSITIONS[row.ai_judgment?.position] ?? '—'}</p>
                </div>
              </div>

              <div className={`reference-box ${row.review ? 'reviewed' : ''}`}>
                <ShieldCheck size={20} aria-hidden="true" />
                <div>
                  <h3>{row.review ? 'Independent reference' : 'No independent reference'}</h3>
                  {row.review ? (
                    <>
                      <p>Reference outcome: <b>{outcomeLabel(row.review.reference_standard.outcome)}</b> · {META.reference_sources[row.review.reference_standard.source] ?? row.review.reference_standard.source}</p>
                      <small>Recorded {formatDate(row.review.recorded_at, true)}{row.verified ? '' : ' · not counted: policy version or independence check failed'}</small>
                    </>
                  ) : (
                    <p>Without a reference this case cannot be scored, so it stays out of the scenario rates.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'interview' && interview && (
            <>
              <div className="case-summary">
                <span className="section-label">HOUSEHOLD</span>
                <p>{profile.summary}</p>
                <div className="inline-meta">
                  <span><UsersRound size={14} aria-hidden="true" />{nameOf('operators', interview.interviewer_id)}</span>
                  <span><Clock size={14} aria-hidden="true" />{interview.duration_min} min · {interview.language}</span>
                  <span><MapPin size={14} aria-hidden="true" />{nameOf('offices', interview.location.office_id)}</span>
                </div>
              </div>
              <blockquote>
                <span>FROM THE INTERVIEWER'S NOTES</span>
                {interview.text_material.segments[0].text}
              </blockquote>
              <div className="sentiment-result">
                <div className="sentiment-head">
                  <h3>Sentiment</h3>
                  {interview.sentiment_analysis.status === 'available' ? <Badge tone={SENTIMENT_COLOR[interview.sentiment_analysis.result.label]}>{SENTIMENT_LABELS[interview.sentiment_analysis.result.label]}</Badge> : <Badge tone="gray">Unavailable</Badge>}
                </div>
                {interview.sentiment_analysis.status === 'available' && (
                  <>
                    <div className="sentiment-scale" role="img" aria-label={`Sentiment score ${interview.sentiment_analysis.result.score} on a scale from -1 to 1`}>
                      <span style={{ left: `${(interview.sentiment_analysis.result.score + 1) * 50}%` }} />
                    </div>
                    <div className="scale-labels"><span>Negative</span><span>Neutral</span><span>Positive</span></div>
                  </>
                )}
              </div>
              <dl className="facts">
                <div><dt>Household size</dt><dd>{profile.household_size}</dd></div>
                <div><dt>Head of household</dt><dd>{GROUP_ATTRIBUTES.head_sex.values[profile.head_sex]}, {profile.head_age_band}</dd></div>
                <div><dt>Status</dt><dd>{GROUP_ATTRIBUTES.displacement_status.values[profile.displacement_status]}</dd></div>
                <div><dt>Livelihood</dt><dd>{LIVELIHOOD_LABELS[profile.livelihood]}, {POVERTY_LABELS[profile.poverty_band]}</dd></div>
                <div><dt>Disability in household</dt><dd>{profile.disability_in_household ? 'Yes' : 'No'}</dd></div>
              </dl>
            </>
          )}

          {tab === 'timeline' && row && (
            <>
              <p className="timeline-intro">Every step of this case, in order. Times are in UTC.</p>
              <ol className="timeline">
                {timelineFor(row).map((e) => (
                  <li key={`${e.at}-${e.title}`}>
                    <span className="timeline-point"><Check size={11} aria-hidden="true" /></span>
                    <div>
                      <div className="timeline-title"><strong>{e.title}</strong><time dateTime={e.at}>{formatDate(e.at, true)}</time></div>
                      <p>{e.actor}{e.detail ? ` · ${e.detail}` : ''}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

function GuideDialog({ onClose }) {
  const { ref, onClick } = useDialog(onClose);
  return (
    <dialog ref={ref} className="detail-dialog guide" aria-labelledby="guide-title" onClick={onClick}>
      <div className="dialog-inner">
        <header className="dialog-header">
          <div>
            <h2 id="guide-title">How to read this dashboard</h2>
            <p>Definitions, formulas and limits of the data</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={() => ref.current.close()}><X size={20} /></button>
        </header>
        <div className="dialog-body guide-body">
          <section>
            <h3>Three decisions per case</h3>
            <dl className="defs">
              <div><dt>Y</dt><dd>The independent reference: the household's real need. It is known with certainty only in training drills and independent panel reviews.</dd></div>
              <div><dt>AI</dt><dd>Cashy's recommendation, with a confidence value.</dd></div>
              <div><dt>H</dt><dd>The operator's final decision. H0 is their assessment before they see Cashy.</dd></div>
            </dl>
          </section>
          <section>
            <h3>Four scenarios</h3>
            <table className="guide-table">
              <thead><tr><th>Scenario</th><th>Cashy</th><th>Operator</th><th>Rule</th></tr></thead>
              <tbody>
                {SCENARIO_ORDER.map((k) => (
                  <tr key={k}>
                    <td><Badge tone={SCENARIOS[k].color}>{k === 'over_reliance' ? 'Over-reliance (harmful switch)' : SCENARIOS[k].label}</Badge></td>
                    <td>{SCENARIOS[k].ai === 'correct' ? 'Right' : 'Wrong'}</td>
                    <td>{SCENARIOS[k].operator === 'agrees' ? 'Follows' : 'Overrides'}</td>
                    <td><code>{SCENARIOS[k].formula}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><b>Appropriate override</b> is the main metric to maximise: operator attention is containing the limits of the model. <b>Over-reliance</b> is the critical problem to mitigate. When the operator was right before seeing Cashy and switched, it is a <b>harmful switch</b>.</p>
          </section>
          <section>
            <h3>Rates</h3>
            <dl className="defs">
              <div><dt>Correction</dt><dd><code>P(H = Y | AI ≠ Y)</code> Appropriate overrides among cases where Cashy was wrong.</dd></div>
              <div><dt>Reliance</dt><dd><code>P(H = Y | AI = Y)</code> Appropriate reliance among cases where Cashy was right.</dd></div>
              <div><dt>Accuracy</dt><dd>Share of verified cases where the operator alone, Cashy alone, or the final decision matches Y.</dd></div>
            </dl>
          </section>
          <section>
            <h3>Equity</h3>
            <p>The check is the <b>Equal Opportunity of Correction</b>: <code>P(H = Y | AI ≠ Y, A = a)</code> should be equal across groups A. We do not force equal approval rates, because need is not spread evenly and equalising rates could exclude the most vulnerable group. The mirror image, <code>P(H = Y | AI = Y, A = a)</code>, is shown as the reliance rate.</p>
          </section>
          <section>
            <h3>Blind spots and drift</h3>
            <p>A <b>blind spot</b> is a cluster that holds at least {pct(THRESHOLDS.blind_spot.min_share)} of all appropriate overrides: operators are compensating for a limit of the model, which is a topic for the next training cycle. <b>Drift</b> uses a CUSUM chart on the correction rate: it adds up evidence that corrections fell by {Math.round(CUSUM_CFG.target_shift * 100)} points or more, and signals the regional lead when it crosses the limit of {CUSUM_CFG.h}.</p>
          </section>
          <section>
            <h3>Limits of the data</h3>
            <ul className="plain">
              <li>Only cases with a valid independent reference are scored. A reference under another policy version, or not independent of the final decision, does not count.</li>
              <li>Intervals are 95% Wilson intervals. They are descriptive and not adjusted for repeated assessments by the same operator.</li>
              <li>Map bubbles sit on approximate city centres, not exact office locations. Countries without offices have no data.</li>
              <li>All households, operators and decisions are sample data. No real household is shown.</li>
            </ul>
          </section>
        </div>
      </div>
    </dialog>
  );
}


/* ========================================================================== */
/*  App shell                                                                 */
/* ========================================================================== */

function ScopeBar({ scope, page, navigate }) {
  const countryId = countryOfScope(scope);
  const officeId = officeOfScope(scope);
  const countries = organization.countries.filter((c) => OFFICES.some((o) => o.country_id === c.id));
  const offices = OFFICES.filter((o) => o.country_id === countryId);
  const operators = organization.operators.filter((p) => p.assignments.some((a) => a.office_id === officeId));
  return (
    <div className="scope-bar" role="group" aria-label="Scope: filters every page">
      <span className="scope-label"><Layers size={16} aria-hidden="true" />Scope</span>
      <label className="scope-field">
        Country
        <select value={countryId ?? ''} onChange={(e) => navigate(page, e.target.value ? { type: 'country', id: e.target.value } : { type: 'global' })}>
          <option value="">All countries</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
        </select>
      </label>
      <label className="scope-field">
        Office
        <select value={officeId ?? ''} disabled={!countryId} onChange={(e) => navigate(page, e.target.value ? { type: 'office', id: e.target.value } : { type: 'country', id: countryId })}>
          <option value="">All offices</option>
          {offices.map((o) => <option key={o.id} value={o.id}>{o.city}</option>)}
        </select>
      </label>
      <label className="scope-field">
        Operator
        <select value={scope.type === 'operator' ? scope.id : ''} disabled={!officeId} onChange={(e) => navigate(page, e.target.value ? { type: 'operator', id: e.target.value } : { type: 'office', id: officeId })}>
          <option value="">All operators</option>
          {operators.map((p) => <option key={p.id} value={p.id}>{p.display_alias} · {p.roles.includes('interviewer') ? 'interviews' : 'decisions'}</option>)}
        </select>
      </label>
      {scope.type !== 'global' && (
        <button type="button" className="button text-button scope-reset" onClick={() => navigate(page, { type: 'global' })}>Clear scope</button>
      )}
    </div>
  );
}

const PAGE_TEXT = {
  overview: ['Overview', 'How operators and Cashy decide together, measured against an independent reference.'],
  decisions: ['Decisions', "Every decision, from the operator's first view to the final outcome."],
  interviews: ['Interviews', 'On-site interviews and language signals.'],
  equity: ['Equity and blind spots', 'Is the operator equally good at correcting Cashy for every group, and where does the model fall short?'],
  drift: ['Process drift', 'Are corrections slipping in any office?'],
};

export default function Dashboard() {
  const [route, setRoute] = useState(parseRoute);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [guide, setGuide] = useState(false);
  const lastPage = useRef(route.page);
  useWebMcp();

  useEffect(() => {
    const onHash = () => {
      const next = parseRoute();
      setRoute(next);
      setMenuOpen(false);
      setSelected(null);
      if (next.page !== lastPage.current) {
        window.scrollTo(0, 0);
        lastPage.current = next.page;
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const changeLanguage = (code) => {
    if (LANGUAGES.find((l) => l.code === code)?.available) setLanguage(code);
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const { page, scope, scenario } = route;
  const navigate = useCallback(
    (to, nextScope = scope, nextScenario) => {
      const hash = hashFor(to, nextScope, nextScenario);
      if (window.location.hash === hash) setRoute(parseRoute());
      else window.location.hash = hash;
    },
    [scope]
  );

  const rows = useMemo(() => allDecisions.filter((d) => inScope(d, scope)), [scope.type, scope.id]);
  const interviews = useMemo(() => allInterviews.filter((i) => inScope(i, scope, 'interview')), [scope.type, scope.id]);
  const openCase = useCallback((s) => setSelected(s), []);
  const closeCase = useCallback(() => setSelected(null), []);
  const closeGuide = useCallback(() => setGuide(false), []);

  const countryId = countryOfScope(scope);
  const officeId = officeOfScope(scope);
  const [title, subtitle] = PAGE_TEXT[page];
  const crumbs = [
    ['World', { type: 'global' }],
    countryId && [nameOf('countries', countryId), { type: 'country', id: countryId }],
    officeId && [nameOf('offices', officeId), { type: 'office', id: officeId }],
    scope.type === 'operator' && [nameOf('operators', scope.id), scope],
  ].filter(Boolean);
  const scopeKey = `${scope.type}-${scope.id ?? ''}`;

  return (
    <div className="dm" lang={language}>
      <style>{STYLES}</style>
      <a className="skip-link" href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>
        Skip to content
      </a>

      <header className="top">
        <div className="top-left">
          <button type="button" className="menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="wordmark">
            <div className="wordmark-logo">
              <strong>UNHCR</strong>
              <small>The UN Refugee Agency</small>
            </div>
            <span className="wordmark-rule" aria-hidden="true" />
            <span className="wordmark-title">{META.title}</span>
          </div>
        </div>
        <div className="top-right">
          <LanguageSelect value={language} onChange={changeLanguage} />
          <a href="/" className="return-link"><ArrowLeft size={16} aria-hidden="true" /><span>Return to assessment</span></a>
        </div>
      </header>

      <div className="layout">
        {menuOpen && <button type="button" className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
        <aside id="sidebar" className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="sidebar-title">
            <strong>{META.title}</strong>
            <small>{META.model.name} · model {META.model.version}</small>
          </div>
          <nav aria-label="Main">
            {PAGES.map(([key, label, Icon]) => (
              <a key={key} href={hashFor(key, scope)} className={`nav-link ${page === key ? 'active' : ''}`} aria-current={page === key ? 'page' : undefined}>
                <Icon size={19} aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button type="button" className="guide-link" onClick={() => { setMenuOpen(false); setGuide(true); }}>
              <CircleHelp size={19} aria-hidden="true" />
              How to read this
            </button>
            <p className="period">
              {formatDate(META.period.start)} to {formatDate(META.period.end)}
              <br />
              {plural(allDecisions.length, 'decision', 'decisions')} · {plural(allInterviews.length, 'interview', 'interviews')}
            </p>
          </div>
        </aside>

        <div className="main-shell">
          <main id="main-content" className="main" tabIndex={-1}>
            <nav className="breadcrumb" aria-label="Scope">
              {crumbs.map(([label, target], i) => (
                <React.Fragment key={label}>
                  {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
                  {i === crumbs.length - 1 ? <span aria-current="location">{label}</span> : <button type="button" onClick={() => navigate(page, target)}>{label}</button>}
                </React.Fragment>
              ))}
            </nav>

            <div className="page-heading">
              <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
              <div className="heading-actions">
                {rows.length > 0 && (page === 'overview' || page === 'decisions') && (
                  <button type="button" className="button secondary" onClick={() => download(csv(rows), 'decisions.csv', 'text/csv;charset=utf-8')}><Download size={16} aria-hidden="true" />Export CSV</button>
                )}
              </div>
            </div>

            <ScopeBar scope={scope} page={page} navigate={navigate} />

            {page === 'overview' && (rows.length ? <OverviewPage key={scopeKey} rows={rows} scope={scope} navigate={navigate} /> : <Panel title="No decisions in this scope"><Empty title="No decisions recorded" text="This operator conducts interviews. Open the Interviews page to see their activity." /></Panel>)}
            {page === 'decisions' && <DecisionsPage key={scopeKey} rows={rows} scenario={scenario} onScenario={(k) => navigate('decisions', scope, k)} onOpen={openCase} navigate={navigate} />}
            {page === 'interviews' && <InterviewsPage key={scopeKey} interviews={interviews} onOpen={openCase} navigate={navigate} scope={scope} />}
            {page === 'equity' && (rows.length ? <EquityPage key={scopeKey} rows={rows} /> : <Panel title="No decisions in this scope"><Empty title="No decisions recorded" text="Choose a country, an office or an operator who makes eligibility decisions." /></Panel>)}
            {page === 'drift' && <DriftPage key={scopeKey} scope={scope} />}

            <footer className="footer">
              <span>UNHCR · {META.title}</span>
              <span>Sample data · no real households</span>
              <span>Data as of {formatDate(META.as_of)}</span>
            </footer>
          </main>
        </div>
      </div>

      {selected && <DetailDialog selected={selected} onClose={closeCase} />}
      {guide && <GuideDialog onClose={closeGuide} />}
    </div>
  );
}
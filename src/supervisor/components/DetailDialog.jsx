import { useEffect, useRef, useState } from 'react';
import { X, Check, ShieldCheck, MessageSquareText, ClipboardCheck, FileClock, Info, UserRound, Clock3 } from 'lucide-react';
import { data, nameOf, shortCase, outcome, position, formatDate, actionLabels } from '../data';
import { categoryInfo } from '../metrics.mjs';
import { Badge } from './ui';

export default function DetailDialog({ selected, onClose, localEvents }) {
  const ref = useRef(); const [tab, setTab] = useState(selected.tab || 'decision');
  const decision = selected.decision; const interview = selected.interview || decision?.interview;
  const caseId = interview.case_id;
  useEffect(() => { const dialog = ref.current; dialog.showModal(); const close = () => onClose(); dialog.addEventListener('close', close); return () => dialog.removeEventListener('close', close); }, [onClose]);
  const close = () => ref.current.close();
  const events = [...data.events, ...localEvents].filter(e => e.case_id === caseId).sort((a,b) => a.occurred_at.localeCompare(b.occurred_at));
  const info = decision && categoryInfo[decision.category];
  const tabs = [['decision','Decision',ClipboardCheck],['interview','Interview and sentiment',MessageSquareText],['timeline','Timeline',FileClock]].filter(([key]) => key !== 'decision' || decision);
  const navigateTabs = (event, key) => {
    const index = tabs.findIndex(([id]) => id === key);
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setTab(tabs[next][0]);
    ref.current.querySelector(`#tab-${tabs[next][0]}`).focus();
  };
  return <dialog ref={ref} className="detail-dialog" aria-labelledby="case-dialog-title" onClick={e => { if (e.target === ref.current) close(); }}><div className="dialog-inner">
    <header className="dialog-header"><div><div className="eyebrow">AUDIT CASE FILE</div><h2 id="case-dialog-title">{shortCase(caseId)}</h2><p>{nameOf('offices', interview.location.office_id)} · {formatDate(interview.completed_at)}</p></div><div className="dialog-header-actions">{info && <Badge tone={info.color}>{info.label}</Badge>}<button className="icon-button" aria-label="Close details" onClick={close}><X size={21}/></button></div></header>
    <div className="tabs" role="tablist" aria-label="Case file sections">{tabs.map(([key,label,Icon]) => <button key={key} id={`tab-${key}`} role="tab" tabIndex={tab === key ? 0 : -1} onKeyDown={event => navigateTabs(event, key)} aria-selected={tab === key} aria-controls={`panel-${key}`} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={16}/>{label}</button>)}</div>
    <div className="dialog-body" id={`panel-${tab}`} role="tabpanel" tabIndex={0} aria-labelledby={`tab-${tab}`}>
      {tab === 'decision' && decision && <>
        <div className="case-summary"><span className="section-label">HOUSEHOLD DETAILS</span><p>{interview.household_snapshot.summary}</p><div className="inline-meta"><span>{interview.household_snapshot.household_size} members</span><span><UserRound size={14}/>{nameOf('operators', decision.operator_id)}</span></div></div>
        <h3 className="detail-section-title">Decision path</h3><div className="decision-path">{[['01','Operator’s preliminary assessment',decision.independent_assessment.outcome,decision.independent_assessment.submitted_at,'Assessment recorded before AI'],['02','Cashy eligibility recommendation',decision.ai.answer.recommendation,decision.ai_exposure.first_revealed_at,'Shown after the initial assessment'],['03','Final determination',decision.final_assessment.outcome,decision.final_assessment.submitted_at, decision.changed ? 'Operator changes assessment' : 'Initial assessment confirmed']].map(([n,label,value,time,note]) => <div className={`decision-step step-${n}`} key={n}><span className="step-number">{n}</span><span className="step-label">{label}</span><strong className={value}>{outcome(value)}</strong><small><Clock3 size={12}/>{formatDate(time,true)}</small><p>{note}</p></div>)}</div>
        <div className="two-column"><section className="detail-block"><h3>Initial rationale</h3><p>{decision.independent_assessment.justification.text}</p><div className="inline-meta">Self-rated confidence: {decision.independent_assessment.self_confidence ?? '—'} / 5</div></section><section className="detail-block"><h3>Final rationale</h3><p>{decision.final_assessment.justification.text}</p></section></div>
        <h3 className="detail-section-title">Two separate judgments about AI</h3><div className="two-column">{[['Reasoning',decision.reasoning_judgment],['Recommendation',decision.answer_judgment]].map(([label,judgment]) => <section className="judgment-block" key={label}><span className="section-label">{label}</span><strong>{position(judgment.position)}</strong><div className="rating-row" aria-label={`Rating ${judgment.correctness_rating ?? 'unavailable'} of 5`}>{[1,2,3,4,5].map(n => <i key={n} className={n <= judgment.correctness_rating ? 'filled' : ''}/>)}<span>{judgment.correctness_rating ?? '—'}/5</span></div><p>{judgment.explanation}</p></section>)}</div>
        <details className="expandable"><summary>Read Cashy’s full reasoning</summary><p>{decision.ai.reasoning.text}</p><div className="inline-meta">Answer engine: {decision.ai.answer.engine.version} · Reasoning engine: {decision.ai.reasoning.engine.version}</div><p className="small-muted">Uncertainty: unavailable in this simulated sample.</p></details>
        <div className={`reference-box ${decision.review ? 'reviewed' : ''}`}><ShieldCheck size={22}/><div><h3>{decision.review ? `Independent reference: ${outcome(decision.review.reference_standard.outcome)}` : 'Independent reference unavailable'}</h3><p>{decision.review ? decision.review.reference_standard.note : 'We can observe agreement and changes, but cannot determine whether the decision was correct.'}</p>{decision.review && <small>{nameOf('supervisors',decision.review.reviewer_id)} · {formatDate(decision.review.recorded_at,true)}</small>}</div></div>
      </>}
      {tab === 'interview' && <>
        <div className="case-summary"><span className="section-label">ON-SITE INTERVIEW</span><p>{interview.household_snapshot.summary}</p><div className="inline-meta"><span><UserRound size={14}/>{nameOf('operators',interview.interviewer_id)}</span><span>{formatDate(interview.started_at,true)}</span><span>Language: {interview.language === 'en' ? 'English' : interview.language === 'es' ? 'Spanish' : interview.language}</span></div></div>
        <section className="sentiment-result"><span className="section-label">SENTIMENT IN INTERVIEWER LANGUAGE</span><div className="sentiment-head"><h3>{interview.sentiment_analysis.result ? ({negative:'Negative polarity signal',neutral:'Neutral language',positive:'Positive polarity signal',mixed:'Mixed polarity'})[interview.sentiment_analysis.result.label] : 'Unavailable'}</h3><Badge tone={interview.sentiment_analysis.result?.label === 'negative' ? 'amber' : 'gray'}>{interview.sentiment_analysis.result?.polarity ?? '—'}</Badge></div><p>{interview.sentiment_analysis.result?.explanation || interview.sentiment_analysis.unavailable_reason}</p>{interview.sentiment_analysis.result && <><div className="sentiment-scale"><span style={{left:`${(interview.sentiment_analysis.result.polarity+1)*50}%`}}/></div><div className="scale-labels"><span>−1 · Negative</span><span>0 · Neutral</span><span>+1 · Positive</span></div></>}</section>
        <h3 className="detail-section-title">Analysed text</h3>{interview.text_material.segments.map(s => <blockquote key={s.id}><span>Simulated notes · {s.speaker === 'interviewer' ? 'Interviewer' : 'Household'}</span>“{s.text}”</blockquote>)}
        <div className="reference-box"><Info size={21}/><div><h3>A signal to interpret</h3><p>Sentiment describes the text. It does not prove how the operator behaved during the interview and is not a personal rating.</p><small>Simulated analysis · {interview.sentiment_analysis.analyzer.version} · Confidence unavailable</small></div></div>
      </>}
      {tab === 'timeline' && <><p className="timeline-intro">All recorded steps for this case, from interview to review. Times are in Mexico City time.</p><ol className="timeline">{events.map(e => <li key={e.id}><span className="timeline-point"><Check size={11}/></span><div><div className="timeline-title"><strong>{actionLabels[e.action] || e.action}</strong><time>{formatDate(e.occurred_at,true)}</time></div><p>{e.actor.kind === 'operator' ? nameOf('operators',e.actor.id) : e.actor.kind === 'supervisor' ? nameOf('supervisors',e.actor.id) : 'Automated demo service'}{e.source === 'local_browser' ? ' · Local change' : ''}</p>{e.payload.note && <small>{e.payload.note}</small>}</div></li>)}</ol></>}
    </div><div className="dialog-footer"><span>Synthetic case · Oversight only</span><button className="button secondary" onClick={close}>Close case</button></div>
  </div></dialog>;
}

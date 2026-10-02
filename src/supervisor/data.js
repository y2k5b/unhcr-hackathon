import organization from '../../data-contract/examples/01-organization.json';
import interviews from '../../data-contract/examples/02-interviews.json';
import ais from '../../data-contract/examples/03-ai-assessments.json';
import decisions from '../../data-contract/examples/04-decisions.json';
import reviews from '../../data-contract/examples/05-reference-reviews.json';
import events from '../../data-contract/examples/06-audit-events.json';
import issues from '../../data-contract/examples/07-audit-issues.json';
import { enrichDecisions } from './metrics.mjs';
export const data = { organization, interviews, ais, decisions, reviews, events, issues };
export const allDecisions = enrichDecisions(data);
export const nameOf = (type, id) => {
  const item = organization[type]?.find(item => item.id === id);
  return item?.display_name || item?.display_alias || id;
};
export const shortCase = id => `CASE ${id.split('-').at(-1).padStart(3, '0')}`;
export const formatDate = (date, time = false) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: time ? undefined : 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}), timeZone: 'America/Mexico_City' }).format(new Date(date));
export const outcome = value => value === 'include' ? 'Eligible' : value === 'exclude' ? 'Not eligible' : 'Unavailable';
export const position = value => ({ agree: 'Agree', disagree: 'Disagree', partly_agree: 'Partly agree', cannot_assess: 'Cannot assess' })[value];
export const actionLabels = { interview_completed: 'Interview completed', sentiment_recorded: 'Sentiment recorded', ai_generated: 'Cashy output generated', case_viewed: 'Case facts viewed', independent_assessment_submitted: 'Initial assessment submitted', ai_revealed: 'Cashy shown to operator', reasoning_judged: 'Reasoning assessed', answer_judged: 'Recommendation assessed', decision_finalized: 'Decision finalised', reference_review_recorded: 'Independent reference recorded', audit_issue_opened: 'Alert opened', audit_issue_claimed: 'Alert assigned', audit_issue_resolved: 'Alert closed' };

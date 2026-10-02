export const categoryInfo = {
  correct_override: { label: 'Correct override', short: 'Correct override', color: 'teal', description: 'The operator corrects an incorrect recommendation.' },
  over_reliance: { label: 'Over-reliance', short: 'Over-reliance', color: 'red', description: 'The operator follows an incorrect recommendation.' },
  correct_acceptance: { label: 'Correct acceptance', short: 'Correct acceptance', color: 'blue', description: 'The operator follows a correct recommendation.' },
  under_reliance: { label: 'Under-reliance', short: 'Under-reliance', color: 'amber', description: 'The operator rejects a correct recommendation.' },
  unverified: { label: 'Unverified', short: 'Unverified', color: 'gray', description: 'No independent reference is available.' },
};

export function currentRecords(records, supersedesField) {
  const replaced = new Set(records.map(r => r[supersedesField]).filter(Boolean));
  return records.filter(r => !replaced.has(r.id));
}

export function category(decision, ai, review) {
  if (!review || !ai) return 'unverified';
  const contextMatches = ['policy_version', 'funding_context_id', 'administrative_context_id'].every(key => decision.context[key] === review.reference_standard[key]);
  if (!contextMatches || !review.reference_standard.is_independent_of_final_decision) return 'unverified';
  const reference = review.reference_standard.outcome;
  return ai.answer.recommendation === reference
    ? (decision.final_assessment.outcome === reference ? 'correct_acceptance' : 'under_reliance')
    : (decision.final_assessment.outcome === reference ? 'correct_override' : 'over_reliance');
}

export function enrichDecisions(data) {
  const reviews = currentRecords(data.reviews, 'supersedes_review_id');
  return currentRecords(data.decisions, 'supersedes_decision_id').map(decision => {
    const ai = data.ais.find(a => a.id === decision.ai_exposure.ai_assessment_id);
    const review = reviews.find(r => r.decision_id === decision.id);
    const interview = data.interviews.find(i => i.id === decision.interview_id);
    return { ...decision, ai, review, interview, category: category(decision, ai, review), changed: decision.independent_assessment.outcome !== decision.final_assessment.outcome };
  });
}

export function inScope(record, scope, activity = 'decision') {
  if (scope.type === 'country') return record.location.country_id === scope.id;
  if (scope.type === 'office') return record.location.office_id === scope.id;
  if (scope.type === 'operator') return (activity === 'interview' ? record.interviewer_id : record.operator_id) === scope.id;
  return true;
}

export const rate = (n, total) => total ? `${Math.round(n / total * 100)}%` : '—';

export function wilson(n, total) {
  if (!total) return null;
  const z = 1.959963984540054, p = n / total, denominator = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

export function summarize(rows) {
  const counts = Object.fromEntries(Object.keys(categoryInfo).map(k => [k, rows.filter(r => r.category === k).length]));
  const discordant = counts.correct_override + counts.over_reliance;
  const concordant = counts.correct_acceptance + counts.under_reliance;
  return { counts, discordant, concordant, verified: discordant + concordant, changed: rows.filter(r => r.changed).length, operators: new Set(rows.map(r => r.operator_id)).size };
}

export function csv(rows) {
  const quote = value => {
    let text = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const fields = ['case', 'country', 'office', 'operator', 'initial', 'ai', 'final', 'reference', 'audit', 'changed', 'final_rationale'];
  return '\uFEFF' + [fields, ...rows.map(r => [r.case_id, r.location.country_id, r.location.office_id, r.operator_id, r.independent_assessment.outcome, r.ai?.answer.recommendation, r.final_assessment.outcome, r.review?.reference_standard.outcome, r.category, r.changed ? 'yes' : 'no', r.final_assessment.justification.text])].map(row => row.map(quote).join(';')).join('\r\n');
}

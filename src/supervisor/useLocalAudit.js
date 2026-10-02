import { useState } from 'react';
import { data } from './data';
const KEY = 'cashy-oversight-local-audit-v1';
function load() {
  try { const raw = localStorage.getItem(KEY); if (!raw) return { overrides: {}, events: [] }; const stored = JSON.parse(raw); if (!stored || !stored.overrides || !Array.isArray(stored.events)) throw Error('Invalid format'); for (const [id, issue] of Object.entries(stored.overrides)) { if (!data.issues.some(i => i.id === id) || issue.id !== id || !['open','in_review','closed'].includes(issue.status) || (issue.status === 'closed' && !issue.resolution?.explanation)) throw Error('Invalid alert'); } return stored; } catch { return { overrides: {}, events: [], error: 'Local changes cannot be read. The original sample is shown; you can reset the demo under Data and methodology.' }; }
}
export function useLocalAudit() {
  const [state, setState] = useState(load);
  function persist(next) { localStorage.setItem(KEY, JSON.stringify(next)); setState(next); }
  const issues = data.issues.map(i => state.overrides[i.id] || i);
  function updateIssue(id, action, resolution) {
    const issue = issues.find(i => i.id === id);
    if (!issue) throw Error('Alert not found.');
    if (action === 'claim' && issue.status !== 'open') throw Error('The alert is not open.');
    if (action === 'resolve' && issue.status !== 'in_review') throw Error('Assign the alert before resolving it.');
    if (!['claim','resolve'].includes(action)) throw Error('Action unavailable.');
    if (action === 'resolve' && (!resolution?.explanation?.trim() || !resolution?.follow_up?.trim() || !['confirmed','dismissed','insufficient_evidence'].includes(resolution.outcome))) throw Error('Complete the outcome, rationale and follow-up.');
    const now = new Date().toISOString();
    const updated = { ...issue, status: action === 'claim' ? 'in_review' : 'closed', resolution: action === 'resolve' ? { ...resolution, explanation: resolution.explanation.trim(), follow_up: resolution.follow_up.trim(), resolved_at: now, resolved_by: 'supervisor-demo-01' } : null };
    const event = { id: `local-${crypto.randomUUID()}`, occurred_at: now, actor: { kind: 'supervisor', id: 'supervisor-demo-01' }, action: action === 'claim' ? 'audit_issue_claimed' : 'audit_issue_resolved', entity: { kind: 'audit_issue', id }, case_id: issue.case_id, payload: { note: action === 'claim' ? 'Assigned in this browser.' : updated.resolution.explanation }, source: 'local_browser' };
    try { persist({ overrides: { ...state.overrides, [id]: updated }, events: [...state.events, event] }); } catch { throw Error('Local save failed. The browser may be blocking storage.'); }
  }
  function reset() { localStorage.removeItem(KEY); setState({ overrides: {}, events: [] }); }
  return { issues, localEvents: state.events, error: state.error, updateIssue, reset };
}

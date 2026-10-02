import { useEffect, useRef } from 'react';
import { data, allDecisions } from './data';
import { inScope, summarize } from './metrics.mjs';

// Optional browser capability. The app works normally when it is unavailable.
export function useWebMcp(issues) {
  const current = useRef(issues);
  useEffect(() => { current.current = issues; }, [issues]);
  useEffect(() => {
    if (!document.modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: 'read_audit_summary',
        title: 'Read audit summary',
        description: 'Returns synthetic dashboard counts for global, country, office or operator scope. Does not change data or navigation.',
        inputSchema: { type: 'object', properties: { scope: { type: 'string', enum: ['global','country','office','operator'] }, id: { type: 'string' } }, required: ['scope'], additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== 'object' || Object.keys(input).some(k => !['scope','id'].includes(k)) || !['global','country','office','operator'].includes(input.scope)) throw Error('Invalid scope.');
          const collection = {country:'countries',office:'offices',operator:'operators'}[input.scope];
          if (collection && !data.organization[collection].some(r => r.id === input.id)) throw Error('Identifier not found in this scope.');
          const scope = {type:input.scope,id:input.id};
          const rows = allDecisions.filter(r => inScope(r,scope));
          return { data_origin:'synthetic_demo', scope:input.scope, id:input.id || null, decisions:rows.length, interviews:data.interviews.filter(r => inScope(r,scope,'interview')).length, open_issues:current.current.filter(i => i.status !== 'closed' && rows.some(d => d.id === i.decision_id)).length, ...summarize(rows) };
        },
      }, {signal:lifecycle.signal})).catch(() => {});
    } catch { /* Optional capability; no impact on the human interface. */ }
    return () => lifecycle.abort();
  },[]);
}

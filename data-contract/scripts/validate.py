#!/usr/bin/env python3
"""Validate the schema profile used by this project and cross-record invariants.

Standard library only. Not a general-purpose JSON Schema implementation.
"""
from pathlib import Path
from datetime import datetime
from copy import deepcopy
import argparse
import json
import math
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
KEYWORDS = {'$schema', 'title', 'description', 'type', 'properties', 'required',
            'additionalProperties', 'items', 'minItems', 'uniqueItems', 'minLength',
            'pattern', 'format', 'enum', 'const', 'minimum', 'maximum', 'anyOf'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def timestamp(value):
    require(bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})', value)), f'Data non ISO 8601: {value}')
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


def check_profile(schema):
    require(not set(schema) - KEYWORDS, f'Keyword schema non supportate: {set(schema) - KEYWORDS}')
    require(schema.get('format', 'date-time') == 'date-time', 'Formato non supportato')
    for child in schema.get('properties', {}).values():
        check_profile(child)
    if 'items' in schema:
        check_profile(schema['items'])
    for child in schema.get('anyOf', []):
        check_profile(child)


def validate_shape(value, schema, path='$'):
    if 'anyOf' in schema:
        matched = False
        for branch in schema['anyOf']:
            try:
                validate_shape(value, branch, path)
                matched = True
                break
            except ValueError:
                pass
        require(matched, f'{path}: nessuna alternativa valida')
    if 'const' in schema:
        require(value == schema['const'], f'{path}: valore costante errato')
        if type(value) is bool or type(schema['const']) is bool:
            require(type(value) is type(schema['const']), f'{path}: booleano non valido')
    if 'enum' in schema:
        require(value in schema['enum'], f'{path}: valore non ammesso: {value}')
    kind = schema.get('type')
    checks = {'object': isinstance(value, dict), 'array': isinstance(value, list),
              'string': isinstance(value, str), 'number': type(value) in (int, float),
              'integer': type(value) in (int, float) and math.isfinite(value) and value == int(value) if type(value) in (int, float) else False,
              'null': value is None, 'boolean': type(value) is bool}
    if kind:
        require(kind in checks and checks[kind], f'{path}: atteso {kind}')
    if isinstance(value, dict):
        props = schema.get('properties', {})
        require(set(schema.get('required', [])) <= set(value), f'{path}: campi obbligatori mancanti')
        if schema.get('additionalProperties') is False:
            require(set(value) <= set(props), f'{path}: campi inattesi: {set(value) - set(props)}')
        for key in value.keys() & props.keys():
            validate_shape(value[key], props[key], f'{path}.{key}')
    if isinstance(value, list):
        require(len(value) >= schema.get('minItems', 0), f'{path}: lista troppo corta')
        if schema.get('uniqueItems'):
            require(len({json.dumps(x, sort_keys=True) for x in value}) == len(value), f'{path}: duplicati')
        if 'items' in schema:
            for i, item in enumerate(value):
                validate_shape(item, schema['items'], f'{path}[{i}]')
    if isinstance(value, str):
        require(len(value) >= schema.get('minLength', 0), f'{path}: testo vuoto')
        if 'pattern' in schema:
            require(re.search(schema['pattern'], value) is not None, f'{path}: formato stringa errato')
        if schema.get('format') == 'date-time':
            timestamp(value)
    if type(value) in (int, float):
        require(math.isfinite(value), f'{path}: numero non finito')
        require(value >= schema.get('minimum', -math.inf), f'{path}: sotto il minimo')
        require(value <= schema.get('maximum', math.inf), f'{path}: sopra il massimo')


def index(records):
    result = {r['id']: r for r in records}
    require(len(result) == len(records), 'ID duplicato')
    return result


def load():
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    data = {}
    schemas = {}
    for collection in manifest['collections']:
        name = Path(collection['schema']).name.removesuffix('.schema.json')
        data[name] = json.loads((ROOT / collection['path']).read_text())
        schemas[name] = json.loads((ROOT / collection['schema']).read_text())
        check_profile(schemas[name])
    return manifest, data, schemas


def validate(data, schemas):
    for name, records in data.items():
        items = [records] if name == 'organization' else records
        require(isinstance(items, list), f'{name}: attesa collezione')
        for record in items:
            validate_shape(record, schemas[name], name)

    org = data['organization']
    countries, offices, operators, supervisors, services = [index(org[k]) for k in ('countries', 'offices', 'operators', 'supervisors', 'services')]
    interviews, ais, decisions, reviews, events, issues = [index(data[k]) for k in ('interview', 'ai-assessment', 'decision', 'reference-review', 'audit-event', 'audit-issue')]
    entities = {'interview': interviews, 'ai_assessment': ais, 'decision': decisions, 'reference_review': reviews, 'audit_issue': issues}
    actors = {'operator': operators, 'supervisor': supervisors, 'service': services}

    def same_case(*records):
        require(len({r['case_id'] for r in records}) == 1, 'Collegamento tra casi diversi')

    def location_valid(loc):
        require(loc['office_id'] in offices and offices[loc['office_id']]['country_id'] == loc['country_id'], 'Ufficio/paese incoerente')

    def operator_valid(op_id, role, loc, at):
        location_valid(loc)
        require(op_id in operators and role in operators[op_id]['roles'], 'Ruolo operatore non valido')
        require(any(a['office_id'] == loc['office_id'] and timestamp(a['valid_from']) <= timestamp(at) and (a['valid_until'] is None or timestamp(at) < timestamp(a['valid_until'])) for a in operators[op_id]['assignments']), 'Operatore non assegnato all’ufficio alla data indicata')

    def supervisor_valid(sup_id, loc):
        require(sup_id in supervisors, 'Supervisore inesistente')
        scope = supervisors[sup_id]['scope']
        require(scope['level'] == 'global' or (scope['level'] == 'country' and loc['country_id'] in scope['country_ids']) or (scope['level'] == 'office' and loc['office_id'] in scope['office_ids']), 'Supervisore fuori ambito')

    def event_matches(eid, action, record, entity_kind, at, actor_id, outcome=None, position=None, related=None):
        require(eid in events, 'Evento richiesto assente')
        e = events[eid]
        require(e['action'] == action and e['entity'] == {'kind': entity_kind, 'id': record['id']}, 'Evento/entità incoerente')
        same_case(e, record)
        require(timestamp(e['occurred_at']) == timestamp(at) and e['actor']['id'] == actor_id, 'Evento/autore/orario incoerente')
        for key, val in [('outcome', outcome), ('position', position), ('related_record_id', related)]:
            require(e['payload'][key] == val, f'Evento/{key} incoerente')

    def action_for(record, action):
        found = [e for e in events.values() if e['entity']['id'] == record['id'] and e['action'] == action]
        require(len(found) == 1, f'{record["id"]}: atteso un evento {action}')
        return found[0]['id']

    for office in offices.values():
        require(office['country_id'] in countries, 'Paese inesistente')
        loc = office['location']
        require((loc['latitude'] is None) == (loc['longitude'] is None), 'Coordinate incomplete')
        require((loc['source'] == 'not_provided') == (loc['latitude'] is None), 'Fonte coordinate incoerente')
        require(loc['source'] != 'verified_public_source' or loc['source_url'] is not None, 'Fonte geografica assente')
        seen = {office['id']}; parent = office['parent_office_id']
        while parent:
            require(parent in offices and parent not in seen, 'Gerarchia uffici ciclica o inesistente')
            require(offices[parent]['country_id'] == office['country_id'], 'Uffici genitore/figlio in paesi diversi')
            seen.add(parent); parent = offices[parent]['parent_office_id']
    for op in operators.values():
        for assignment in op['assignments']:
            require(assignment['office_id'] in offices, 'Assegnazione a ufficio inesistente')
            require(assignment['valid_until'] is None or timestamp(assignment['valid_from']) < timestamp(assignment['valid_until']), 'Intervallo assegnazione non valido')
    for sup in supervisors.values():
        scope = sup['scope']
        require(set(scope['country_ids']) <= set(countries) and set(scope['office_ids']) <= set(offices), 'Ambito supervisore inesistente')
        require(scope['level'] != 'country' or bool(scope['country_ids']), 'Ambito paese vuoto')
        require(scope['level'] != 'office' or bool(scope['office_ids']), 'Ambito ufficio vuoto')

    previous = None; previous_time = None
    for seq, e in enumerate(data['audit-event'], 1):
        require(e['sequence'] == seq and e['previous_event_id'] == previous, 'Catena eventi incoerente')
        at = timestamp(e['occurred_at'])
        require(previous_time is None or at >= previous_time, 'Ordine temporale eventi errato')
        require(e['actor']['id'] in actors[e['actor']['kind']], 'Autore evento sconosciuto')
        expected_kind = 'service' if e['action'] in ('sentiment_recorded', 'ai_generated', 'audit_issue_opened') else ('supervisor' if e['action'] == 'reference_review_recorded' else 'operator')
        require(e['actor']['kind'] == expected_kind, 'Tipo di autore non valido per l’azione')
        require(e['entity']['id'] in entities[e['entity']['kind']], 'Entità evento inesistente')
        same_case(e, entities[e['entity']['kind']][e['entity']['id']])
        previous = e['id']; previous_time = at

    for interview in interviews.values():
        operator_valid(interview['interviewer_id'], 'interviewer', interview['location'], interview['started_at'])
        require(timestamp(interview['started_at']) < timestamp(interview['completed_at']), 'Durata intervista non valida')
        index(interview['household_snapshot']['evidence'])
        segments = index(interview['text_material']['segments']); sentiment = interview['sentiment_analysis']
        require(sentiment['source_material_id'] == interview['text_material']['id'], 'Fonte sentiment incoerente')
        if sentiment['status'] == 'available':
            require(sentiment['result'] is not None and sentiment['analyzed_at'] is not None and sentiment['unavailable_reason'] is None, 'Sentiment disponibile incompleto')
            require(set(sentiment['result']['evidence_segment_ids']) <= {k for k,v in segments.items() if v['speaker'] == 'interviewer'}, 'Sentiment attribuito a un parlante errato')
        else:
            require(sentiment['result'] is None and bool(sentiment['unavailable_reason']), 'Sentiment non disponibile incoerente')
            require((sentiment['status'] == 'pending') == (sentiment['analyzed_at'] is None), 'Data tentativo sentiment incoerente')
        event_matches(action_for(interview, 'interview_completed'), 'interview_completed', interview, 'interview', interview['completed_at'], interview['interviewer_id'])
        if sentiment['analyzed_at']:
            require(timestamp(sentiment['analyzed_at']) >= timestamp(interview['completed_at']), 'Analisi precedente al testo completo')
            eid = action_for(interview, 'sentiment_recorded')
            event_matches(eid, 'sentiment_recorded', interview, 'interview', sentiment['analyzed_at'], events[eid]['actor']['id'], related=sentiment['id'])

    for ai in ais.values():
        require(ai['interview_id'] in interviews, 'Intervista AI inesistente')
        interview = interviews[ai['interview_id']]; same_case(ai, interview)
        require(ai['input_snapshot_id'] == interview['household_snapshot']['id'], 'Snapshot AI incoerente')
        require(timestamp(ai['generated_at']) >= timestamp(interview['completed_at']), 'AI precedente all’intervista')
        require(set(ai['reasoning']['evidence_ids']) <= set(index(interview['household_snapshot']['evidence'])), 'Evidenze AI inesistenti')
        u = ai['answer']['uncertainty']
        require((u['status'] == 'not_available') == (u['probability_inclusion'] is None), 'Probabilità/indisponibilità incoerenti')
        require(u['status'] != 'calibrated' or u['calibration_reference'] is not None, 'Calibrazione senza riferimento')
        eid = action_for(ai, 'ai_generated')
        event_matches(eid, 'ai_generated', ai, 'ai_assessment', ai['generated_at'], events[eid]['actor']['id'])

    for decision in decisions.values():
        require(decision['interview_id'] in interviews, 'Intervista decisione inesistente')
        interview = interviews[decision['interview_id']]; initial = decision['independent_assessment']; exposure = decision['ai_exposure']; final = decision['final_assessment']
        require(exposure['ai_assessment_id'] in ais, 'Valutazione AI inesistente')
        ai = ais[exposure['ai_assessment_id']]
        same_case(decision, interview, ai)
        require(ai['interview_id'] == interview['id'], 'AI di un’altra intervista')
        operator_valid(decision['operator_id'], 'eligibility_decider', decision['location'], initial['viewed_at'])
        require(initial['snapshot_id'] == ai['input_snapshot_id'], 'Snapshot iniziale diverso dall’input AI')
        require(timestamp(interview['completed_at']) <= timestamp(initial['viewed_at']) <= timestamp(initial['submitted_at']) < timestamp(exposure['first_revealed_at']), 'Prima opinione non indipendente o cronologia non valida')
        require(timestamp(ai['generated_at']) <= timestamp(exposure['first_revealed_at']), 'AI rivelata prima della generazione')
        evidence = set(index(interview['household_snapshot']['evidence']))
        for assessment in (initial, final):
            require(set(assessment['justification']['evidence_ids']) <= evidence, 'Motivazione con evidenza inesistente')
        for name in ('reasoning_judgment', 'answer_judgment'):
            judgment = decision[name]
            require(timestamp(exposure['first_revealed_at']) <= timestamp(judgment['submitted_at']) <= timestamp(final['submitted_at']), 'Giudizio fuori sequenza')
            require((judgment['position'] == 'cannot_assess') == (judgment['correctness_rating'] is None), 'Rating/valutabilità incoerenti')
            event_matches(judgment['event_id'], 'reasoning_judged' if name == 'reasoning_judgment' else 'answer_judged', decision, 'decision', judgment['submitted_at'], decision['operator_id'], position=judgment['position'])
        position = decision['answer_judgment']['position']
        if position in ('agree', 'disagree'):
            require((position == 'agree') == (final['outcome'] == ai['answer']['recommendation']), 'Giudizio sulla risposta incoerente con l’esito finale')
        event_matches(initial['view_event_id'], 'case_viewed', decision, 'decision', initial['viewed_at'], decision['operator_id'], related=initial['snapshot_id'])
        event_matches(initial['event_id'], 'independent_assessment_submitted', decision, 'decision', initial['submitted_at'], decision['operator_id'], outcome=initial['outcome'])
        event_matches(exposure['event_id'], 'ai_revealed', decision, 'decision', exposure['first_revealed_at'], decision['operator_id'], related=ai['id'])
        event_matches(final['event_id'], 'decision_finalized', decision, 'decision', final['submitted_at'], decision['operator_id'], outcome=final['outcome'])

    for review in reviews.values():
        require(review['decision_id'] in decisions, 'Decisione della revisione inesistente')
        d = decisions[review['decision_id']]; same_case(d, review)
        supervisor_valid(review['reviewer_id'], d['location'])
        require(review['reviewer_id'] != d['operator_id'], 'Revisione non indipendente')
        require(timestamp(review['recorded_at']) >= timestamp(d['final_assessment']['submitted_at']), 'Riferimento rivelato prima della decisione')
        for key in ('policy_version', 'funding_context_id', 'administrative_context_id'):
            require(review['reference_standard'][key] == d['context'][key], 'Riferimento incompatibile con il contesto')
        event_matches(action_for(review, 'reference_review_recorded'), 'reference_review_recorded', review, 'reference_review', review['recorded_at'], review['reviewer_id'], outcome=review['reference_standard']['outcome'])

    # Revisions form linear chains and never erase earlier records.
    for collection, field, time_field in [(interviews, 'supersedes_interview_id', 'completed_at'), (decisions, 'supersedes_decision_id', None), (reviews, 'supersedes_review_id', 'recorded_at')]:
        superseded = set()
        for record in collection.values():
            prior_id = record[field]
            if prior_id:
                require(prior_id in collection and prior_id not in superseded, 'Revisione assente o ramificata')
                prior = collection[prior_id]; same_case(record, prior)
                require(field != 'supersedes_review_id' or record['decision_id'] == prior['decision_id'], 'Revisione di una decisione diversa')
                at = record[time_field] if time_field else record['final_assessment']['submitted_at']
                before = prior[time_field] if time_field else prior['final_assessment']['submitted_at']
                require(timestamp(at) > timestamp(before), 'Revisione ciclica o non successiva')
                superseded.add(prior_id)

    superseded_reviews = {r['supersedes_review_id'] for r in reviews.values()}
    current_reviews = {}
    for r in reviews.values():
        if r['id'] not in superseded_reviews:
            require(r['decision_id'] not in current_reviews, 'Più riferimenti correnti per una decisione')
            current_reviews[r['decision_id']] = r
    categories = {}
    for d in decisions.values():
        if d['id'] not in current_reviews:
            categories[d['id']] = 'unverified'
            continue
        reference = current_reviews[d['id']]['reference_standard']['outcome']
        ai = ais[d['ai_exposure']['ai_assessment_id']]['answer']['recommendation']; final = d['final_assessment']['outcome']
        categories[d['id']] = ('correct_acceptance' if final == reference else 'under_reliance') if ai == reference else ('correct_override' if final == reference else 'over_reliance')

    for issue in issues.values():
        require(issue['decision_id'] in decisions, 'Decisione segnalazione inesistente')
        d = decisions[issue['decision_id']]; same_case(issue, d)
        supervisor_valid(issue['owner_supervisor_id'], d['location'])
        require(timestamp(issue['opened_at']) >= timestamp(d['final_assessment']['submitted_at']), 'Segnalazione precedente alla decisione')
        if issue['due_at']:
            require(timestamp(issue['due_at']) >= timestamp(issue['opened_at']), 'Scadenza precedente alla segnalazione')
        for eid in issue['evidence_event_ids']:
            require(eid in events, 'Evidenza audit mancante'); same_case(events[eid], issue)
            require(timestamp(events[eid]['occurred_at']) <= timestamp(issue['opened_at']), 'Segnalazione basata su un evento futuro')
        if issue['reference_review_id']:
            require(issue['reference_review_id'] in reviews, 'Riferimento segnalazione inesistente')
            r = reviews[issue['reference_review_id']]
            require(r['decision_id'] == d['id'], 'Riferimento segnalazione di altra decisione')
        if issue['signal_type'] == 'reviewed_over_reliance':
            require(issue['reference_review_id'] is not None, 'Over-reliance senza riferimento')
            r = reviews[issue['reference_review_id']]['reference_standard']['outcome']
            a = ais[d['ai_exposure']['ai_assessment_id']]['answer']['recommendation']
            require(a != r and d['final_assessment']['outcome'] == a, 'Segnalazione over-reliance non supportata')
        require((issue['status'] == 'closed') == (issue['resolution'] is not None), 'Chiusura/risoluzione incoerente')
        if issue['resolution']:
            supervisor_valid(issue['resolution']['resolved_by'], d['location'])
            require(timestamp(issue['resolution']['resolved_at']) >= timestamp(issue['opened_at']), 'Risoluzione precedente alla segnalazione')
        eid = action_for(issue, 'audit_issue_opened')
        event_matches(eid, 'audit_issue_opened', issue, 'audit_issue', issue['opened_at'], events[eid]['actor']['id'], related=issue['reference_review_id'])
    return categories


def self_test(data, schemas):
    def set_path(path, value):
        def mutate(candidate):
            target = candidate
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = value
        return mutate
    mutations = {
        'sentiment fuori scala': set_path(['interview', 0, 'sentiment_analysis', 'result', 'polarity'], 8),
        'sentiment assente trattato come disponibile': set_path(['interview', 4, 'sentiment_analysis', 'status'], 'available'),
        'AI di altro caso': set_path(['decision', 0, 'ai_exposure', 'ai_assessment_id'], 'ai-demo-02'),
        'prima opinione dopo AI': set_path(['decision', 0, 'independent_assessment', 'submitted_at'], '2026-10-01T08:19:00Z'),
        'motivazione finale vuota': set_path(['decision', 0, 'final_assessment', 'justification', 'text'], ''),
        'unico giudizio al posto di due': lambda c: c['decision'][0].pop('reasoning_judgment'),
        'evento mancante': set_path(['decision', 0, 'independent_assessment', 'event_id'], 'event-missing'),
        'registro autore errato': set_path(['audit-event', 0, 'actor', 'id'], 'operator-demo-02'),
        'operatore senza ruolo': set_path(['decision', 0, 'operator_id'], 'operator-demo-01'),
        'evento duplicato': lambda c: c['audit-event'].append(deepcopy(c['audit-event'][0])),
        'riferimento con policy diversa': set_path(['reference-review', 0, 'reference_standard', 'policy_version'], 'other-policy'),
        'segnalazione chiusa senza esito': set_path(['audit-issue', 0, 'status'], 'closed'),
    }
    for name, mutate in mutations.items():
        candidate = deepcopy(data); mutate(candidate)
        try:
            validate(candidate, schemas)
        except (ValueError, KeyError):
            continue
        raise ValueError(f'Test negativo non rilevato: {name}')
    print(f'OK: {len(mutations)} incoerenze intenzionali rifiutate.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    manifest, data, schemas = load()
    categories = validate(data, schemas)
    require(categories == manifest['expected_audit_categories'], 'Classificazione diversa dai cinque scenari attesi')
    print('OK: 7 collezioni, schemi e collegamenti verificati.')
    print(f'OK: {len(data["audit-event"])} eventi coerenti e ordinati.')
    for decision, category in categories.items():
        print(f'  {decision}: {category}')
    if args.self_test:
        self_test(data, schemas)
    print('Solo fixture sintetiche: nessuna stima di performance reale.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError) as exc:
        print(f'ERRORE: {exc}', file=sys.stderr)
        sys.exit(1)

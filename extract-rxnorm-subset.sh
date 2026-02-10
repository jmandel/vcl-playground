#!/usr/bin/env bash
# Extract a pain-management-focused subset of RxNorm for the VCL tutorial.
# Outputs rxnorm-subset.json with concepts, edges, and literal properties.
# Includes up to 5 alternate designations per concept as literal property
# "designation" to support queries like designation/"ibuprofen".
#
# Usage: ./extract-rxnorm-subset.sh [path-to-rxnorm.db]
# Default DB: ~/hobby/FHIRsmith/data/terminology-cache/rxnorm_02022026.db
#
# To tweak: edit the seed ingredient/dose form lists in the SQL below.

set -euo pipefail

DB="${1:-$HOME/hobby/FHIRsmith/data/terminology-cache/rxnorm_02022026.db}"
OUT="$(dirname "$0")/rxnorm-subset.json"

if [ ! -f "$DB" ]; then
  echo "Error: database not found at $DB" >&2
  exit 1
fi

echo "Extracting from: $DB"
echo "Output: $OUT"

sqlite3 "$DB" <<'SQL' > "$OUT"
-- Pain-management RxNorm subset: seeds → SCDCs → SCDs → SBDs → BNs etc.
-- Property IDs (hardcoded from property_def for performance):
--   1=isa, 2=TTY, 6=has_ingredient, 7=tradename_of, 10=has_precise_ingredient,
--   15=has_dose_form, 18=has_ingredients, 23=consists_of
WITH
  seeds(concept_id) AS (
    SELECT concept_id FROM concept WHERE code IN (
      '161',    -- acetaminophen
      '5640',   -- ibuprofen
      '1191',   -- aspirin
      '7258',   -- naproxen
      '1886',   -- caffeine
      '5489'    -- hydrocodone
    ) AND active = 1
  ),
  dose_forms(concept_id) AS (
    SELECT concept_id FROM concept WHERE code IN (
      '317541', -- Oral Tablet
      '316965', -- Oral Capsule
      '316968', -- Oral Solution
      '91058'   -- Chewable Tablet
    ) AND active = 1
  ),
  scdcs(concept_id) AS (
    SELECT DISTINCT ce.source_concept_id FROM concept_edge ce
    JOIN seeds s ON s.concept_id = ce.target_concept_id
    WHERE ce.property_id = 6 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.source_concept_id AND cl.property_id = 2 AND cl.value_text = 'SCDC')
  ),
  scds(concept_id) AS (
    SELECT DISTINCT ce.source_concept_id FROM concept_edge ce
    JOIN scdcs s ON s.concept_id = ce.target_concept_id
    WHERE ce.property_id = 23 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_edge ce2 JOIN dose_forms df ON df.concept_id = ce2.target_concept_id WHERE ce2.source_concept_id = ce.source_concept_id AND ce2.property_id = 15 AND ce2.active = 1)
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.source_concept_id AND cl.property_id = 2 AND cl.value_text = 'SCD')
  ),
  sbds(concept_id) AS (
    SELECT DISTINCT ce.source_concept_id FROM concept_edge ce
    JOIN scds s ON s.concept_id = ce.target_concept_id
    WHERE ce.property_id = 7 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.source_concept_id AND cl.property_id = 2 AND cl.value_text = 'SBD')
  ),
  bns(concept_id) AS (
    SELECT DISTINCT ce.target_concept_id FROM concept_edge ce
    JOIN sbds s ON s.concept_id = ce.source_concept_id
    WHERE ce.property_id = 6 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.target_concept_id AND cl.property_id = 2 AND cl.value_text = 'BN')
  ),
  sbdcs(concept_id) AS (
    SELECT DISTINCT ce.target_concept_id FROM concept_edge ce
    JOIN sbds s ON s.concept_id = ce.source_concept_id
    WHERE ce.property_id = 23 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.target_concept_id AND cl.property_id = 2 AND cl.value_text = 'SBDC')
  ),
  mins(concept_id) AS (
    SELECT DISTINCT ce.target_concept_id FROM concept_edge ce
    JOIN scds s ON s.concept_id = ce.source_concept_id
    WHERE ce.property_id = 18 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.target_concept_id AND cl.property_id = 2 AND cl.value_text = 'MIN')
  ),
  pins(concept_id) AS (
    SELECT DISTINCT ce.target_concept_id FROM concept_edge ce
    JOIN scdcs s ON s.concept_id = ce.source_concept_id
    WHERE ce.property_id = 10 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.target_concept_id AND cl.property_id = 2 AND cl.value_text = 'PIN')
  ),
  scdfs(concept_id) AS (
    SELECT DISTINCT ce.target_concept_id FROM concept_edge ce
    JOIN scds s ON s.concept_id = ce.source_concept_id
    WHERE ce.property_id = 1 AND ce.active = 1
    AND EXISTS (SELECT 1 FROM concept_literal cl WHERE cl.source_concept_id = ce.target_concept_id AND cl.property_id = 2 AND cl.value_text = 'SCDF')
  ),
  all_ids(concept_id) AS (
    SELECT concept_id FROM seeds
    UNION SELECT concept_id FROM dose_forms
    UNION SELECT concept_id FROM scdcs
    UNION SELECT concept_id FROM scds
    UNION SELECT concept_id FROM sbds
    UNION SELECT concept_id FROM bns
    UNION SELECT concept_id FROM sbdcs
    UNION SELECT concept_id FROM mins
    UNION SELECT concept_id FROM pins
    UNION SELECT concept_id FROM scdfs
  ),
  designation_candidates(concept_id, value, preferred, designation_id) AS (
    SELECT d.concept_id, d.value, COALESCE(d.preferred, 0), d.designation_id
    FROM designation d
    JOIN all_ids ai ON ai.concept_id = d.concept_id
    WHERE d.active = 1
      AND d.value IS NOT NULL
      AND TRIM(d.value) <> ''
  ),
  designation_distinct(concept_id, value, preferred, designation_id) AS (
    SELECT concept_id, value, MAX(preferred) AS preferred, MIN(designation_id) AS designation_id
    FROM designation_candidates
    GROUP BY concept_id, value
  ),
  designation_ranked(concept_id, value, rn) AS (
    SELECT concept_id, value,
           ROW_NUMBER() OVER (PARTITION BY concept_id ORDER BY preferred DESC, designation_id ASC) AS rn
    FROM designation_distinct
  )
SELECT json_object(
  'system', 'http://www.nlm.nih.gov/research/umls/rxnorm',
  'version', '02022026',
  'concepts', (
    SELECT json_group_array(json_object(
      'code', c.code,
      'display', c.display,
      'tty', cl.value_text,
      'active', CASE WHEN c.active = 1 THEN json('true') ELSE json('false') END
    ))
    FROM concept c
    JOIN all_ids ai ON ai.concept_id = c.concept_id
    JOIN concept_literal cl ON cl.source_concept_id = c.concept_id AND cl.property_id = 2
  ),
  'edges', (
    SELECT json_group_array(json_object(
      'source', src.code,
      'property', pd.code,
      'target', tgt.code
    ))
    FROM concept_edge ce
    JOIN all_ids ai_src ON ai_src.concept_id = ce.source_concept_id
    JOIN all_ids ai_tgt ON ai_tgt.concept_id = ce.target_concept_id
    JOIN concept src ON src.concept_id = ce.source_concept_id
    JOIN concept tgt ON tgt.concept_id = ce.target_concept_id
    JOIN property_def pd ON pd.property_id = ce.property_id
    WHERE ce.active = 1 AND pd.code != 'inverse_isa'
  ),
  'literals', (
    SELECT json_group_array(json_object(
      'code', lit.code,
      'property', lit.property,
      'value', lit.value
    ))
    FROM (
      SELECT c.code AS code, pd.code AS property, cl.value_text AS value
      FROM concept_literal cl
      JOIN all_ids ai ON ai.concept_id = cl.source_concept_id
      JOIN concept c ON c.concept_id = cl.source_concept_id
      JOIN property_def pd ON pd.property_id = cl.property_id
      WHERE cl.active = 1
        AND pd.code IN ('TTY', 'RXN_STRENGTH', 'RXTERM_FORM', 'RXN_AVAILABLE_STRENGTH',
                         'RXN_HUMAN_DRUG', 'RXN_BN_CARDINALITY', 'RXN_QUANTITY',
                         'RXN_IN_EXPRESSED_FLAG', 'RXN_VET_DRUG')
      UNION ALL
      SELECT c.code AS code, 'designation' AS property, dr.value AS value
      FROM designation_ranked dr
      JOIN concept c ON c.concept_id = dr.concept_id
      WHERE dr.rn <= 5
    ) lit
  )
);
SQL

echo ""
echo "Extraction complete."
python3 -c "
import json, os
with open('$OUT') as f:
    data = json.load(f)
concepts = data['concepts']
edges = data['edges']
literals = data['literals']
from collections import Counter
tty = Counter(c['tty'] for c in concepts)
ep = Counter(e['property'] for e in edges)
lp = Counter(l['property'] for l in literals)
print(f'File: {os.path.getsize(\"$OUT\"):,} bytes')
print(f'Concepts: {len(concepts)}')
for t,n in sorted(tty.items()): print(f'  {t}: {n}')
print(f'Edges: {len(edges)}')
for p,n in sorted(ep.items()): print(f'  {p}: {n}')
print(f'Literals: {len(literals)}')
for p,n in sorted(lp.items()): print(f'  {p}: {n}')
"

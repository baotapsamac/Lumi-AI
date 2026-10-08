# Lumi-AI — Release Candidate Checklist

This document defines **release gates**, not a claim that all gates have passed.

## Required before production release

- [ ] GitHub Actions build and regression checks PASS on the **exact** release commit.
- [ ] DOCX paragraph/table extraction tested against fixture files, including empty cells, merged cells, nested tables, headings and lists.
- [ ] DOCX containing images, drawings or unsupported embedded objects is handled without silently dropping content. Current behavior blocks some media documents.
- [ ] A real long DOCX Golden Test preserves every learner-facing source block, order and heading.
- [ ] Question stems, distractors, answers and feedback checked for source provenance and educational validity by a human reviewer.
- [ ] Per-question edit, approve, reject and regenerate workflow acceptance tested. Regenerate is not yet implemented.
- [ ] Project save, reload and import tested across a browser restart; document large-project storage limits.
- [ ] Generated .h5p opens in Lumi Desktop, shows tables, renders Vietnamese controls and supports retries.
- [ ] Generated .h5p imports and runs in target Moodle version.
- [ ] No secrets/tokens are embedded in H5P or exported project files.
- [ ] Tag a release only after all mandatory checks pass.

## Known limitations

- Structured table output exists; merged cells, nested tables and advanced formatting are not guaranteed.
- DOCX images and drawing objects currently block import rather than being embedded.
- The static regression gate checks source-code patterns; it is not a replacement for end-to-end tests.
- Final cumulative assessment, question regeneration and complete media preservation are still pending.
- Current .lumiai.json project format stores the materialized plan, not an immutable original DOCX archive.
- H5P package validation is not equivalent to Lumi/Moodle runtime acceptance.

## Recommended release labeling

Use **pre-release / technical preview** until the above acceptance tests pass.

# Accepted DOCX source → Blueprint-only review

The existing `lesson:ai` CLI can consume **previously accepted parser artifacts** without parsing or rewriting a DOCX:

```sh
npm run lesson:ai -- path/to/accepted-parser-artifacts profile.json request.json output-directory --parsed-source --blueprint-only
```

The input directory must contain `structured-source.json`, `source-segments.json`, and `preservation-audit.json`. Parser status must be successful; the independent audit must pass with zero text loss. Segment IDs, text, UTF-16 offsets, filename/table/row/hierarchy origins pass through unchanged. Invalid or failed parser acceptance is rejected; there is no fallback to plain-text reindexing. The CLI rejects direct binary DOCX input and requires blueprint-only mode for accepted DOCX sources.

Real execution requires `AI_API_KEY` or `OPENAI_API_KEY`, `AI_MODEL` or `OPENAI_MODEL`, and `AI_ENDPOINT`, `AI_BASE_URL`, or `OPENAI_BASE_URL`. Provider configuration remains centralized; no model or endpoint is guessed. Temperature, timeout, and attempts retain the existing configurable defaults. `run-metadata.json` and benchmark reports contain only public, redacted configuration. Existing provider-decline, transport-error, invalid-output, and quality-failure states remain distinct. There are no real provider calls in tests.

## Optional media suggestions

A CourseProfile must explicitly add `media-placeholder` to `interactionPolicy.allowedTypes`. The default four activity types are unchanged. A placeholder is a LessonBlueprint activity with:

- `type: "media-placeholder"`
- `mediaType: "image" | "video"`
- `purpose`, `suggestedContent`, `outcomeIds`, and `bloomLevel`
- `sourceRefs` and exact source `evidence`

URLs, raw H5P params, other media types, empty fields, invalid source references, mismatched evidence and invented quotes are rejected. Placeholders are selective suggestions rather than required items in every chapter. They do not supply reading content, satisfy learning outcomes, dilute Accordion ratios, reset question streaks, or count as questions. A placeholder-only chapter fails quality validation. A blueprint containing placeholders is ineligible for H5P compilation; no BookSchema or H5P content type has been added.

## Coverage and human review

Accepted-source runs enable the unused-important-source gate. Association and nonempty paragraph segments are conservatively treated as substantive; table header/section row segments are still reported. `covered`, `partially-covered`, and `unused` refer only to the union of exact quoted characters. Duplicate evidence cannot inflate coverage. These labels do not establish semantic completeness or accuracy; both require human review. Media evidence cannot supply substantive source coverage.

Blueprint-only reports include question answers/distractors/Bloom/outcomes/source evidence, TrueFalse correction/justification, chapter positions of media suggestions, source coverage, quality issues, and an editable human-review form. Human scores, correction counts, estimated edit time, media-kept/removed counts, and Editing Effort remain null until reviewed. Reports distinguish `REAL_PROVIDER` from `TEST_FIXTURE`; mock/unit tests never demonstrate real-provider acceptance.

This implementation does not change the DOCX parser, compiler, bundled libraries, or golden archive. It adds no media fetching, uploads, H5P generation for DOCX trials, or UI work.

# Automated H5P pipeline

The production path is intentionally split from the legacy editor export.

```
approved materialized plan
  -> plan validation
  -> multi-chapter H5P compiler
  -> Vietnamese InteractiveBook/MultiChoice UI
  -> merge public/h5p/interactive-book-libraries.zip
  -> package validation
  -> .h5p Blob + machine-readable report
  -> Lumi/Moodle runtime acceptance
```

## API

`runMaterializedH5PPipeline(title, plan, libraryBundleUrl?)` returns:

- `blob`: full portable H5P package, or `null` when a FAIL/BLOCK gate is hit.
- `report`: checks, inventory, and package readiness gates.

The compiler accepts multiple chapters. A materialized multiple-choice block can contain multiple questions. Per-answer `feedback` is mapped to H5P.MultiChoice `chosenFeedback`.

The package declares and validates the exact baseline dependencies used by the project:
AdvancedText 1.1, MultiChoice 1.16, FontAwesome 4.5, JoubelUI 1.3, Transition 1.0, FontIcons 1.0, Question 1.5, Column 1.18 and InteractiveBook 1.11.

Validation checks plan integrity, embedded dependency folders, each direct dependency's `library.json` identity/version, declared JS/CSS assets, Vietnamese package language, chapter count, assessment inventory and known German UI remnants.

## Compatibility

Do not remove or rename `generateH5PPackage(title, content)` in `src/utils/h5p-generator.ts`. Existing editor callers continue to use it. It remains a single-chapter compatibility API and now emits Vietnamese UI strings.

## Publication gate

A package-layer PASS does not imply runtime or publication PASS. Lumi/Moodle import, rendering, keyboard/focus, scoring/retry/feedback and accessibility remain runtime acceptance checks.

# Pattern templates

Reference implementations for quality-gate patterns catalogued in
`config/standards.json`. Consumers copy-and-adapt these into their own repos
when the corresponding checklist item has `maturity: "template-available"`.

## Directory layout

```
templates/patterns/
  <pattern-id>/
    README.md                 # pattern intent + integration + meta-principles footer
    python/                   # reference implementation (when stack-applicable)
      ...
    typescript/               # reference implementation OR concept-only README
      ...
```

One subdirectory per catalog item; the directory name equals the item's `id`
field in `config/standards.json`.

## Required README content

Every `<pattern-id>/README.md` MUST contain:

1. **Intent.** What the pattern does and which defect class it prevents —
   phrased generically, without naming origin projects, commit SHAs, or issue
   numbers in the body text.
2. **Integration shape.** What the consumer wires up, where the gate runs
   (pre-commit / pre-push / CI), and what the failure mode looks like.
3. **Scope-discipline note where applicable.** For patterns whose test locks a
   narrow surface (canonical identifier presence, a single seed integer, etc.),
   call out the lock surface explicitly so future extenders don't widen it.
   Patterns citing `mp-churn-bait-discipline` in the footer MUST carry a
   "Scope discipline" anchor; the footer gate enforces this.
4. **Provenance (one line, optional).** If the template is adapted from an
   external source, a single line of the form `adapted from <source>@<sha>`
   near the top. This is the ONLY place in the repo where origin-project names
   are permitted.
5. **Meta-principles footer.** A terminal section of the form:

   ```markdown
   ## Design principles this template obeys

   This pattern follows: `mp-...`, `mp-...` — see
   [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.
   ```

   At least one `mp-*` principle must be cited. Every cited ID must exist in
   `docs/patterns/meta-principles.md` (the authoritative set).

## Enforcement

`scripts/verify-pattern-footers.ts` runs on every `npm run test` invocation.
It rejects any `<pattern-id>/README.md` that lacks the footer section, cites
zero `mp-*` principles, references a typo'd principle, or cites
`mp-churn-bait-discipline` without a "Scope discipline" anchor.

New meta-principles added under `docs/patterns/meta-principles.md` are picked
up automatically — the gate parses the authoritative set from that doc.

## Stack coverage convention

Python and TypeScript are the lead implementation stacks. Where a pattern is
listed in `config/standards.json` with `appliesTo.stacks` including multiple
stacks but the catalog entry notes `All (concept); <stack> (impl)`, ship a
working reference for the implementation stack only. Other stacks receive a
README that describes the shape of the port (which ecosystem tool to use,
where to place the gate) rather than a skeleton that will drift.

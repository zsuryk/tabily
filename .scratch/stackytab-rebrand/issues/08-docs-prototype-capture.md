# 08 — Docs + prototype capture

**What to build:** The record catches up with the validated multi-stack model: ADR-0001 is superseded (revised or replaced by a multi-stack ADR recording the per-stack accordion, gutters, ghost columns, and stack drop/reorder decisions); `CONTEXT.md`'s glossary is updated — stacks are plural, one expanded pane per stack, plus the new terms (gutter, ghost column, stack drop, stack reorder). Per the prototype skill, `prototype/` is captured as a primary source: committed to a throwaway branch (not main) with a pointer to that branch recorded on this ticket.

**Blocked by:** 04

**Status:** ready-for-agent

- [x] An ADR records the multi-stack decision and marks ADR-0001 superseded
- [x] The CONTEXT.md glossary matches the implemented model (plural stacks, per-stack expanded pane, gutter, ghost column, stack drop/reorder)
- [x] `prototype/` lives on a throwaway branch, and this ticket records the branch name and a pointer to it

## Comments

- Completed 2026-08-02.
- ADR part was already in place from ticket 04's work: ADR-0004 (`docs/adr/0004-multi-stack-model.md`) records the multi-stack row-of-accordions decision and supersedes ADR-0001, which carries the "**Superseded by ADR-0004**" marker. Glossary terms in `CONTEXT.md` (Stack, Gutter, Ghost column, Stack drop, Stack reorder, Expand, …) match the implemented model; no edits needed.
- Prototype capture: `prototype/` (the UI prototype validated by tickets 04–07) now lives on throwaway branch **`prototype/stackytab-rebrand`** (HEAD `15dfd67`), where it was committed with a `CAPTURE.md` recording the question it answered, the verdict, and pointers to ADR-0004 and the implementation tickets. Main commit `115bbfd` removes the prototype; main keeps only the validated decision.
- This ticket's checklist was partially complete on arrival (ADR + glossary done); the branch capture was the remaining work.

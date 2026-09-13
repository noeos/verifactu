---
id: ARCH-DOC-0008
title: Dynamic flows
status: approved
authority: normative
owner: architecture-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ARCH-DOC-0005, DOM-DOC-0002]
historical-inputs: [REV-015, REV-042]
---

# Dynamic flows

Every flow uses the canonical transition registry and names transaction and
network boundaries. Mandatory scenarios are:

1. alta/anulación/event preparation, head confirmation, artifact production,
   applicable signing, evidence verification and atomic commit;
2. validation rejection before any effect;
3. stale head, concurrent append and abandoned preparation;
4. provider timeout/cancellation/malformed or swapped signed bytes;
5. outbox lease, durable attempt, one network observation and correlated result;
6. TLS/SOAP/business rejection, partial line results and persisted wait;
7. lost response, restart, consultation and reconciliation-before-resend;
8. inspection/export, backup/restore and corruption/rollback detection;
9. edition coexistence/migration and certificate rotation/expiry.

Each sequence lists preconditions, exact inputs/outputs, ownership transfers,
durable facts after each step, cancellation points, prohibited observations and
the only safe next action after a crash. A happy-path diagram without its
paired negative/recovery sequence is incomplete.

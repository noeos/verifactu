---
id: ADR-0043
title: npm trusted OIDC-only publication
status: proposed
authority: decision
owner: release-owner
created: 2026-09-12
last-reviewed: 2026-09-12
dependencies: [ADR-0032, ADR-0034, ADR-0037, ADR-0042]
sources: [SRC-0056, SRC-0068, SRC-0070]
historical-inputs: [REV-069, REV-075, REV-078, REV-082]
---

# ADR-0043: npm trusted OIDC-only publication

Production has no persistent `NPM_TOKEN`. Each exact public scoped package is
pre-created/claimed by authorized organization ownership, configured for the
specific repository, workflow filename and GitHub environment, and published
from an eligible hosted runner using short-lived OIDC and provenance.

The privileged job receives only contents read and id-token write, no PR/cache
input, and revalidates tag/SHA/version/package/access/ownership immediately before
each publish. Logs retain claims/results without tokens or sensitive identity.

Wrong package/repo/workflow/environment/ref/audience, transferred namespace,
unexpected owner or provenance absence blocks. Recovery revokes sessions/owners/
trusted publisher and re-establishes it through independently verified account
custody; token fallback needs a new emergency decision.

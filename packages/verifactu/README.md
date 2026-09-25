# `@noeos/verifactu`

This private `0.0.0-development` package contains the P4-A domain core and
staged JSON codec under active development. Internal constructors validate
domain values and immutable relationships; they are not yet part of the package
entrypoint and do not enable fiscal issuance, AEAT communication, storage, clock
access, or publication. The pinned edition remains a verification candidate
with `creationAllowed=false`.

The package has no stable compatibility promise or release authorization. Its
current public surface is defined by `src/index.ts` and must pass the protected
P4 assurance gates before any later wave can depend on it.

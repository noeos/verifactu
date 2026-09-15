# Contract generation component

`xml-parser.mjs` is a bounded namespace-aware UTF-8 parser for authenticated
regulatory XML. It rejects malformed or forbidden character/entity references,
invalid QName and namespace bindings, DTD/entity/XInclude/PI/network/path,
ambiguity and resource failures. Only the exact pinned W3C XMLDSig DTD is
neutralized before parsing, without expansion or resolution. Twenty positive,
adversarial and boundary cases exercise this surface without network access.

`generate-contracts.mjs` closes the offline XSD/WSDL graph and deterministically
derives structural graph, field constraints, catalogue and SOAP binding records,
an immutable blocked candidate descriptor and six closed public contract schemas.
It authenticates every source, both custody manifests and their closure before
parsing; the candidate binds all three digests. `generate:checked-in` compares
exact bytes/file sets, rejects unexpected nested schema members and exercises
candidate/active lifecycle constraints. These are structural contracts, not P4
fiscal behavior; missing official semantic authorities keep `creationAllowed`
false.

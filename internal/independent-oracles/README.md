# Independent oracles

Production packages can never import this directory. Reference implementations
use separately admitted tools and cannot call production code as their
expected-value oracle.

`regulatory_contract_oracle.py` runs only on pinned Python 3.13.15 stdlib Expat.
It independently authenticates all source objects, parses the official technical
graph, compares exact snapshot/document/import/field/facet/catalogue/SOAP and
artifact identities, and must catch all ten defects in the declarative seed
manifest. It performs no network access and makes no legal-independence or
complete fiscal-semantic claim.

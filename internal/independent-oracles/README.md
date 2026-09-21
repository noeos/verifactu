# Independent oracles

`internal/independent-oracles/oracle.py` is a separate Python implementation of
source/manifest/output verification. It does not import the Node generator,
production packages or generated intermediates. Its seeded mutations are
deliberately detected and retained as evidence.

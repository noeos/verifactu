# XML provider

This directory is the isolated XML/XSD provider boundary. `provider.mjs`
performs byte and resource preflight, verifies the pinned schema closure, and
maps every provider failure to a fail-closed result. `worker.mjs` invokes the
admitted Python/lxml engine in isolated mode with a closed in-memory resolver;
it never accepts filesystem or network fallback.

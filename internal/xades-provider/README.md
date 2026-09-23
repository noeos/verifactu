# XAdES provider

The P4-D envelope inspector runs in an isolated Python/lxml process. It receives
only XML bytes and a closed reference policy; no key bytes, trust store, network
configuration or caller-selected algorithm is accepted. It rejects DTD/entity
markup, malformed UTF-8, duplicate signed-target IDs, wrapping, external or
ambiguous references, and transform drift before a signature result is trusted.

# Seguridad XML y red

Estado: **normativo**

XML, WSDL, XSD, SOAP y respuestas se consideran hostiles incluso desde TLS válido. Parser sin DTD/XXE/XInclude, límites previos, namespaces exactos y resolución de imports local.

Se prueban entity expansion, external entity, quadratic blowup, documentos profundos, atributos masivos, Unicode inválido, wrapping de firma, referencias duplicadas y trailing data.

La red usa TLS verificado, hostname oficial, CA del sistema gobernada, certificados cliente mediante provider, timeouts y tamaño máximo. Proxies requieren configuración explícita y evidencia; no pueden desactivar TLS.

SSRF se evita con endpoints por edición y resolución controlada. Redirects, downgrade, HTTP plano, algoritmo obsoleto y certificado inválido fallan cerrados.

Mensajes externos se saneán antes de logs o diagnósticos; los bytes originales permanecen solo en almacenamiento protegido.

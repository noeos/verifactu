# Integraciones con Verification Engine y Facturación

Estado: **normativo**

## Verification Engine

`verifactu` importa únicamente su API pública. Le entrega un modelo regulatorio ya validado mediante un perfil versionado que produce bytes internos exactos. El motor aporta evidencia genérica; no calcula ni interpreta por sí mismo la huella oficial RRSIF.

## Facturación

El host proporciona una orden regulatoria, transacción de persistencia, identidad, reloj, certificado y transporte según modalidad. Recibe resultado, QR, evidencia y estado; no recibe acceso a mutar registros confirmados.

La factura solo se publica cuando `verifactu` confirma la precondición regulatoria. El host conserva referencias opacas a registros, no copias editables de las reglas.

## B2B y Backoffice

La integración B2B puede compartir identidad de factura, pero no usa el envío AEAT RRSIF como canal de entrega. Backoffice no recibe privilegios ni acceso interno; cualquier consumidor usa los mismos contratos públicos.

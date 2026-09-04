# Firma electrónica

Estado: **normativo**

La firma es obligatoria para altas, anulaciones y eventos conservados por un sistema NO VERI*FACTU. Mientras un sistema actúa como VERI*FACTU queda bajo la excepción del artículo 3 de la Orden HAC/1177/2024 y no se generan firmas regulatorias innecesarias.

## Perfil fijado

- XAdES Enveloped conforme a ETSI EN 319 132/ETSI TS 101 903, clase mínima EPES.
- Política AGE con OID `urn:oid:2.16.724.1.3.1.1.2.1.9` y URL `https://sede.administracion.gob.es/politica_de_firma_anexo_1.pdf`.
- El digest de esa política usa el identificador XMLDSig SHA-1 y valor `G7roucf600+f03r/o0bAOQ6WAs0=` exclusivamente para identificar la política; no autoriza SHA-1 para firmar el registro.
- Firma del registro con RSA y hash SHA-256. La implementación acepta para verificación los algoritmos RSA admitidos por la política/ETSI de la edición, pero su perfil de emisión es único y seguro.
- Clave RSA de producción: mínimo Noeos 2048 bits aunque la especificación AEAT admita 1024; no se reduce por compatibilidad.
- Timestamp TSA no es obligatorio; si el host lo aporta, solo se admite un XAdES-T válido sin debilitar EPES.
- Certificado cualificado vigente, no revocado ni caducado en la fecha del registro, perteneciente al obligado o a representante autorizado y emitido por prestador cualificado de la lista de confianza UE/EEE.

Se firma el nodo completo `RegistroAlta`, `RegistroAnulacion` o `RegistroEvento`; nunca los contenedores superiores `RegFactuSistemaFacturacion` o `RegistroFactura`. La firma se inserta en su hijo `Signature` conforme al XSD.

## Reglas

- No se implementan primitivas criptográficas propias.
- Los bytes XML firmados, parámetros de política, cadena de certificados, evidencias de vigencia disponibles y firma resultante se conservan exactamente.
- Toda referencia se resuelve dentro del documento esperado y por identidad única.
- Se rechazan referencias duplicadas, externas, vacías ambiguas y signature wrapping.
- Verificar cubre referencias, transforms, digest, criptografía, nodo comprometido, certificado, perfil, política y validez temporal; “firma matemática válida” no equivale por sí sola a registro conforme.
- Un algoritmo o certificado no permitido produce invalidez, no fallback.

Se mantienen vectores AEAT de registro sin firmar/firmado y casos de alteración de nodo, namespace, atributo, certificado, algoritmo, digest, política y tiempo. Las comprobaciones externas de revocación son opt-in, cacheables y con resultado `indeterminate` cuando no haya evidencia; nunca convierten un fallo de red en firma válida.

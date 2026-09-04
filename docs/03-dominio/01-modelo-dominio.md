# Modelo de dominio

Estado: **normativo**

## Agregados

- **RegulatoryEdition:** fuentes, catálogos, contratos y reglas inmutables.
- **ProducerIdentity:** productor y versión declarada.
- **Taxpayer:** obligado tributario al que pertenecen registros.
- **Installation:** instancia identificable del SIF.
- **Sequence:** ámbito ordenado de encadenamiento.
- **BillingRecord:** alta o anulación con representación oficial.
- **EventRecord:** evento RRSIF con cadena y firma aplicables.
- **Submission:** lote VERI*FACTU de bytes inmutables.
- **Exchange:** petición, respuesta y clasificación.
- **ComplianceEvidence:** prueba técnica enlazada a la edición y release.

## Invariantes

Toda entidad tiene identidad explícita y versión. Un registro pertenece exactamente a obligado, instalación, edición, modalidad y secuencia. Los objetos aceptados son inmutables. Ninguna transición destruye historia. Los valores oficiales se conservan separados de metadatos internos.

Los modelos comerciales del host no atraviesan la frontera: se convierten en una orden regulatoria estricta con solo los datos necesarios.

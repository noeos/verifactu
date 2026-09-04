# Registro de fuentes y versiones

Estado: **normativo**

El manifiesto [`../../regulatory/sources.json`](../../regulatory/sources.json) fija la edición de contratos XML aprobada. Cada entrada contiene:

- ID estable y título;
- autoridad y nivel;
- URI ELI o URL oficial;
- identificador BOE o versión AEAT;
- edición común, fecha de consulta y URL base oficial;
- SHA-256 y SHA-512 de los bytes conservados;
- formato y tamaño;
- condiciones de reutilización y atribución;
- relación `supersedes`/`supersededBy`;
- requisitos afectados;
- resultado de revisión y responsable.

Las leyes se referencian por publicación y no se relicencian. El manifiesto de planificación ya contiene los digests SHA-256 y SHA-512 de WSDL/XSD. Al comenzar implementación, el importador materializa esos bytes en `regulatory/snapshots/aeat-rrsif-1.0/`; catálogos y tipos se generan en directorios separados y reproducen su derivación.

Los documentos explicativos se fijan por versión visible: servicios web 1.0.3 (28-07-2025), huella 0.1.2 (27-08-2024), firma 0.1.5 (06-03-2025), QR 0.5.0 (10-12-2025), validaciones 1.2.2, FAQ de desarrolladores 1.3 (04-12-2025) y ejemplos de declaración responsable 0.5.1. Un cambio de cualquiera de esas versiones abre revisión aunque los contratos XML no cambien.

Una URL que cambia manteniendo nombre genera alerta de drift; nunca actualiza automáticamente la edición aprobada.

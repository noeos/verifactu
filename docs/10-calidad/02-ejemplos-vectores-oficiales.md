# Ejemplos y vectores oficiales

Estado: **normativo**

Cada ejemplo AEAT conserva bytes, fuente, actualización y digest. Se ejecuta primero sin modificar. Si requiere adaptación de transporte, la transformación se documenta y el payload oficial permanece intacto.

La suite comparará:

- valores semánticos esperados;
- XML byte/estructura conforme a autoridad aplicable;
- preimage y huella;
- firma y referencias;
- contenido QR y decodificación;
- request, response y clasificación;
- biblioteca, CLI y referencia independiente.

Vectores propios se etiquetan `derived` o `noeos`. No se usa el término “oficial” para un caso inventado. Manifiesto y archivos se distribuyen con el paquete para consumidores y otras implementaciones.

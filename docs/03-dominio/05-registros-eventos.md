# Registros de eventos

Estado: **normativo**

El registro de eventos documenta la operativa NO VERI*FACTU. VERI*FACTU está exceptuado mientras remite efectivamente. Cada evento usa `IDVersion=1.0` y contiene, en orden: `SistemaInformatico`, `ObligadoEmision`, emisor tercero/destinatario opcional, `FechaHoraHusoGenEvento`, `TipoEvento`, datos específicos opcionales, otros datos opcionales, encadenamiento, `TipoHuella=01`, `HuellaEvento` y firma XAdES obligatoria.

## Eventos mínimos

- inicio y fin de funcionamiento como NO VERI*FACTU;
- lanzamiento de detección de anomalías de registros de facturación y evento;
- cada anomalía detectada en integridad, firma, cadena o cronología;
- restauración de copia de seguridad gestionada por el SIF;
- exportación de registros de facturación;
- exportación de registros de evento;
- resumen periódico de eventos.

El catálogo de códigos y los bloques específicos se generan de `EventosSIF.xsd`; el texto humano nunca sustituye esos códigos.

## Periodicidad cerrada

Por cada seis horas en que el sistema haya estado operativo y disponible se genera al menos un resumen desde el anterior o desde el inicio. Se genera incluso sin eventos y también inmediatamente antes de cerrar o apagar. El reloj contabiliza tiempo operativo, sobrevive reinicios y no desplaza el vencimiento por fallos; una recuperación emite en orden el resumen vencido antes de continuar.

## Principios

- Solo se emiten eventos definidos; no se inventan códigos genéricos que oculten significado.
- Un evento periódico se programa mediante reloj explícito y solo se considera emitido tras persistencia correcta.
- Fallos de verificación, exportación, restauración o integridad generan el evento aplicable sin borrar el fallo original; cambios de configuración solo generan evento si encajan en el catálogo normativo.
- El evento no incluye secretos ni más datos personales de los obligatorios.
- La generación es append-only e idempotente.

Un host NO VERI*FACTU que no pueda demostrar su registro de eventos no supera conformidad, aunque sus facturas individuales tengan huella válida.

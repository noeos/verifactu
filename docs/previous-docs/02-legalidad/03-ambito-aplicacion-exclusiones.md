# Ámbito de aplicación y exclusiones

Estado: **normativo**

La aplicabilidad no se reduce a un booleano calculado con datos incompletos. El host aporta hechos declarados y `verifactu` evalúa reglas expresas o devuelve indeterminado.

## Dimensiones

- condición y residencia del obligado;
- impuesto y régimen aplicable;
- territorio común o régimen foral;
- inclusión o exclusión por SII u otro sistema;
- actividad y operación;
- obligación de expedir factura;
- uso real de un sistema informático;
- factura completa, simplificada, rectificativa u otro supuesto;
- expedición por destinatario o tercero;
- modalidad y periodo.

## Decisión mínima

El evaluador devuelve `applicable`, `notApplicable` o `indeterminate`, más reglas evaluadas y hechos faltantes. Para `applicable` deben constar, como mínimo: uso de SIF, categoría del obligado del artículo 3.1, territorio, no inclusión en SII, operación dentro del ámbito y ausencia de resolución de no aplicación. `notApplicable` exige una exclusión demostrada. Cualquier otro caso es `indeterminate` y bloquea una afirmación de conformidad.

Sujetos incluidos: contribuyentes del Impuesto sobre Sociedades salvo entidades totalmente exentas y con alcance limitado para parcialmente exentas; personas físicas con actividades económicas; no residentes con establecimiento permanente; y entidades en atribución de rentas con actividad económica. Productores y comercializadores quedan incluidos respecto de producción/comercialización.

Exclusiones explícitas que el motor debe poder representar: llevanza SII del artículo 62.6 RIVA; operaciones de las disposiciones adicionales tercera y sexta del Reglamento de facturación; operaciones documentadas por establecimientos permanentes en el extranjero; determinados supuestos de expedición material por destinatario/tercero que lleven SII; y resoluciones individuales/sectoriales del artículo 5.

## Fronteras

País Vasco/Navarra solo quedan bajo este RRSIF cuando el obligado tiene domicilio fiscal en territorio común según la regla estatal; no se implementa normativa foral. Las referencias IVA se trasladan por mandato reglamentario a IGIC e IPSI, pero sus claves y reglas se mantienen diferenciadas. TicketBAI, Batuz, FACe, FACeB2B y otras integraciones externas no se asumen equivalentes ni excluyentes sin fuente exacta.

El componente no decide hechos jurídicos que el consumidor no pueda demostrar. Los datos ausentes producen diagnóstico y no una presunción favorable.

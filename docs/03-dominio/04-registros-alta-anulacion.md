# Registros de alta y anulación

Estado: **normativo**

Los campos, tipos, longitudes, cardinalidades, condicionales y catálogos se generan desde los XSD fijados en [`../../regulatory/sources.json`](../../regulatory/sources.json). El modelo interno no admite propiedades desconocidas ni valores “comodín”; las reglas cruzadas proceden del documento AEAT de validaciones 1.2.2.

## Alta

Se genera automática y atómicamente de forma simultánea o inmediatamente anterior a expedir la factura. Su orden XML de nivel superior es:

`IDVersion(1.0)`, `IDFactura`, `RefExterna?`, `NombreRazonEmisor`, `Subsanacion?`, `RechazoPrevio?`, `TipoFactura`, `TipoRectificativa?`, `FacturasRectificadas?`, `FacturasSustituidas?`, `ImporteRectificacion?`, `FechaOperacion?`, `DescripcionOperacion`, `FacturaSimplificadaArt7273?`, `FacturaSinIdentifDestinatarioArt61d?`, `Macrodato?`, `EmitidaPorTerceroODestinatario?`, `Tercero?`, `Destinatarios?`, `Cupon?`, `Desglose`, `CuotaTotal`, `ImporteTotal`, `Encadenamiento`, `SistemaInformatico`, `FechaHoraHusoGenRegistro`, `NumRegistroAcuerdoFacturacion?`, `IdAcuerdoSistemaInformatico?`, `TipoHuella`, `Huella`, `Signature?`.

`IDFactura` es la terna `IDEmisorFactura + NumSerieFactura + FechaExpedicionFactura`. Todos los importes del registro se expresan en euros; la conversión desde la divisa de la factura es responsabilidad del dato fiscal de entrada y debe quedar trazada.

## Anulación

Se genera cuando una factura se emitió erróneamente y debe anularse su registro de alta. Su orden XML es:

`IDVersion(1.0)`, `IDFactura`, `RefExterna?`, `SinRegistroPrevio?`, `RechazoPrevio?`, `GeneradoPor?`, `Generador?`, `Encadenamiento`, `SistemaInformatico`, `FechaHoraHusoGenRegistro`, `TipoHuella`, `Huella`, `Signature?`.

`IDFactura` identifica la factura anulada con `IDEmisorFacturaAnulada`, `NumSerieFacturaAnulada` y `FechaExpedicionFacturaAnulada`. La anulación no elimina, sustituye ni oculta el alta. `SinRegistroPrevio` y `RechazoPrevio` solo se aceptan en las casuísticas oficiales. Una repetición se clasifica por idempotencia y no crea una segunda historia divergente.

## Resultado

La creación devuelve bytes oficiales, modelo interpretado, huella, enlace, evidencia interna y diagnósticos. Ningún valor parcial se publica como registro confirmado si falla validación, huella, firma exigida o persistencia atómica. La aceptación AEAT es un estado posterior y no altera los bytes confirmados.

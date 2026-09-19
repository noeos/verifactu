# Frontera entre factura y registro

Estado: **normativo**

La aplicación consumidora es responsable de construir y autorizar la factura. `verifactu` recibe una orden de expedición con los hechos fiscales necesarios, valida su suficiencia y crea el registro de alta y el QR antes de confirmar éxito.

## Contrato de simultaneidad

La factura no puede considerarse expedida si falla la creación, persistencia o firma exigida del registro. La integración debe coordinar ambos resultados en una unidad atómica o en un protocolo de recuperación que nunca exponga una factura definitiva sin registro.

Tras el alta:

- no se reescriben número, fecha, importes ni identidad;
- una corrección comercial produce el documento y registro que legalmente corresponda;
- una anulación produce un nuevo registro;
- el PDF o representación visual consume el QR ya generado y no recalcula datos regulatorios.

La biblioteca no calcula políticas comerciales ni decide si una operación real debió existir.

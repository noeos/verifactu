# Mapa de facturación y obligaciones

Estado: **normativo**

## Tres objetos distintos

1. La aplicación comercial decide y expide la factura.
2. `verifactu` crea simultáneamente el registro RRSIF y sus elementos de seguridad.
3. En operaciones B2B sujetas, otro sistema entrega la factura electrónica al destinatario y gestiona sus estados.

El registro RRSIF no es una factura electrónica y contiene solo la información exigida para su finalidad. La misma operación puede originar ambos flujos sin que sean intercambiables.

## Propiedad

| Información o decisión                              | Propietario                            |
| --------------------------------------------------- | -------------------------------------- |
| Datos comerciales, cálculo, numeración y expedición | `facturacion` o aplicación consumidora |
| Validez y representación de campos RRSIF            | `verifactu`                            |
| Huella, firma, QR, XML y respuesta AEAT             | `verifactu`                            |
| Evidencia genérica adicional                        | `verification-engine`                  |
| Entrega B2B y estados comerciales de pago           | fuera de este repositorio              |

La aplicación consumidora no duplica reglas RRSIF. `verifactu` no corrige decisiones comerciales: rechaza entradas incompletas o incompatibles mediante resultados estructurados.

# Privacidad y datos

Estado: **normativo**

El componente procesa datos fiscales por cuenta del host. No crea cuentas, perfiles comerciales ni telemetría. El host determina base jurídica, roles, destinatarios y periodos; `verifactu` aporta minimización y controles técnicos.

## Clasificación

- públicos: esquemas, catálogos, fuentes y versiones;
- internos: configuración no secreta, métricas agregadas;
- confidenciales: registros, XML, respuestas, identidades e importes;
- secretos: claves, PIN, tokens y material de autenticación.

Logs y eventos usan correlaciones opacas. No contienen NIF, nombres, direcciones, conceptos, importes ni cuerpos. Diagnóstico detallado sensible se conserva solo en canal protegido y con política explícita.

Fixtures son sintéticos y reservan dominios/identidades de ejemplo. Exportación y soporte aplican minimización. Borrado o anonimización no puede destruir evidencia que deba conservarse legalmente.

# Modelo de amenazas

Estado: **normativo**

## Activos

Registros, orden, huellas, firmas, claves, certificados, respuestas AEAT, identidad del sistema, fuentes regulatorias, contratos, paquetes, expediente y disponibilidad de operación.

## Adversarios y fallos

- usuario o administrador que intenta ocultar/modificar ventas;
- integración defectuosa que omite rutas;
- proceso, host o dependencia comprometidos;
- atacante de red o endpoint;
- entrada XML/JSON hostil;
- robo/sustitución de certificado;
- insider con acceso a almacenamiento;
- rollback, backup corrupto o reloj incorrecto;
- fuente oficial cambiada o suplantada;
- cadena de suministro o cuenta GitHub/npm comprometida.

## Objetivos

Prevenir o detectar omisión, interpolación, alteración, borrado, fork, replay, suplantación, exfiltración y afirmaciones sin evidencia. El modelo no presume invulnerable el host; documenta qué garantías requieren controles externos y cómo se prueban.

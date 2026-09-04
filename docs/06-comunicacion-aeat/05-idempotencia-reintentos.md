# Idempotencia y reintentos

Estado: **normativo de diseño**

La clave idempotente deriva de identidad estable del trabajo y digest de los bytes, no de número de intento. Se asigna antes del primer envío y se conserva.

Un reintento:

- usa exactamente petición y certificado/política compatibles;
- incrementa contador durable;
- registra causa y tiempo;
- respeta orden, backoff, jitter acotado y límites;
- no reinterpreta timeout como rechazo;
- cesa ante aceptación, fallo permanente, expiración de política o intervención requerida.

El reloj y generador de jitter son capacidades inyectadas y registradas; las pruebas usan versiones deterministas. Reiniciar proceso no reinicia intentos ni duplica trabajo.

Reconciliación consulta o reenvía solo cuando el protocolo oficial lo permite. Nunca crea un registro nuevo para resolver incertidumbre de transporte.

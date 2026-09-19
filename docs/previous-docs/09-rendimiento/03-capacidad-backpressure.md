# Capacidad y backpressure

Estado: **normativo**

Se presupuestan por separado CPU, memoria, almacenamiento, firma y AEAT. La capacidad efectiva es la menor de esas etapas.

Colas tienen límites de tamaño, edad e intentos observables. Al alcanzar umbral, el sistema reduce admisión o bloquea nuevas expediciones según modalidad y garantía disponible; nunca descarta trabajo.

Backpressure se propaga desde almacenamiento, signer y transporte hasta el productor. Los batches se crean incrementalmente y respetan orden. Métricas agregadas: backlog, edad máxima, throughput, latencias, retries, estados y saturación, sin datos fiscales.

El runbook definirá umbrales de aviso, crítico y bloqueo tras medir baseline. Pruebas de capacidad incluyen AEAT lenta, HSM lento, disco lleno, 24 h de indisponibilidad simulada y recuperación sin tormenta de reintentos.

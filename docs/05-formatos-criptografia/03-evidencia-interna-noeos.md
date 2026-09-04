# Evidencia interna Noeos

Estado: **normativo de diseño**

Tras validar un registro oficial, el perfil `es.noeos.verifactu.record@1.0.0` producirá una representación canónica interna y la entregará a `verification-engine`. La evidencia vinculará edición, obligado opaco, instalación, clase, identidad de registro, bytes oficiales y huella.

El `contextId` será estable y no contendrá datos personales directos; `sequenceId` será opaco y separado por obligado/instalación; `recordId` no revelará NIF ni contenido.

La evidencia interna permite detectar alteraciones, demostrar procesamiento y verificar expedientes, pero no reemplaza requisitos RRSIF. Cambiar la representación crea nueva versión de perfil. Cambiar framing exige nuevo protocolo del motor.

Los diagnósticos del motor se envuelven con contexto regulatorio sin cambiar sus códigos ni exponer payload.

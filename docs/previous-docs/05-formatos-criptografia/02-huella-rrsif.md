# Huella RRSIF

Estado: **normativo**

La edición `aeat-rrsif-1.0@2026-09-03` usa `TipoHuella=01`: SHA-256 sobre una cadena UTF-8 y salida hexadecimal en mayúsculas de exactamente 64 caracteres. No se aplica canonicalización XML ni JSON.

## Preimagen exacta

Cada par usa `NombreCampo=valor`; los pares se concatenan con `&`, sin separador inicial o final. El nombre respeta exactamente la etiqueta AEAT. El valor es el contenido XML después de eliminar solo espacios iniciales y finales. Un campo ausente o vacío aporta el nombre y `=`. Los importes admitidos por XSD con uno o dos decimales se comprometen con la representación presente en XML: `123.1` y `123.10` son ambos lexemas admisibles, pero cada uno produce la huella que corresponda a su propia cadena. El verificador nunca normaliza un XML ya emitido para hacerlo coincidir.

Alta, en orden:

```text
IDEmisorFactura=<v>&NumSerieFactura=<v>&FechaExpedicionFactura=<v>&TipoFactura=<v>&CuotaTotal=<v>&ImporteTotal=<v>&Huella=<anterior-o-vacío>&FechaHoraHusoGenRegistro=<v>
```

Anulación, en orden:

```text
IDEmisorFacturaAnulada=<v>&NumSerieFacturaAnulada=<v>&FechaExpedicionFacturaAnulada=<v>&Huella=<anterior-o-vacío>&FechaHoraHusoGenRegistro=<v>
```

Evento, en orden:

```text
NIF=<productor-o-vacío>&ID=<productor-alternativo-o-vacío>&IdSistemaInformatico=<v>&Version=<v>&NumeroInstalacion=<v>&NIF=<obligado>&TipoEvento=<v>&HuellaEvento=<anterior-o-vacío>&FechaHoraHusoGenEvento=<v>
```

Los dos primeros identificadores del productor son excluyentes en el XML, pero ambos nombres aparecen en la preimagen; el no utilizado queda vacío. En génesis, `PrimerRegistro=S` o `PrimerEvento=S` sustituye el bloque anterior, pero el par `Huella=`/`HuellaEvento=` continúa en la preimagen.

## Vector obligatorio de alta génesis

La cadena oficial del caso base comienza con los valores `89890001K`, `12345678/G33`, `01-01-2024`, `F1`, `12.35`, `123.45`, huella anterior vacía y `2024-01-01T19:20:30+01:00`. El resultado esperado es:

```text
3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60
```

Este vector, los casos de alta sucesiva y anulación de AEAT, y vectores propios de evento DEBEN ejecutarse contra implementación productiva y referencia independiente.

## Invariantes

- Solo una edición selecciona campos y orden.
- SHA-256 se usa donde lo exige la edición; no se sustituye por otro algoritmo “más fuerte”.
- La huella previa procede del registro cronológicamente anterior de la cadena del obligado, incluyendo altas y anulaciones.
- Se conserva la representación exacta emitida suficiente para reproducir la preimagen.
- Verificación recalcula desde los datos oficiales y compara formato y longitud antes del valor.
- Alterar cualquier campo comprometido invalida la huella; alterar un campo no comprometido puede dejarla igual y debe detectarse mediante firma NO VERI*FACTU o evidencia interna, según corresponda.

Esta huella no es `contentDigest`, `recordDigest` ni `linkDigest` de Verification Engine. La documentación y tipos impedirán mezclarlos.

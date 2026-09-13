# Serialización oficial

Estado: **normativo de diseño**

Cada valor que participa en XML, huella, firma o QR tendrá una representación única derivada de la fuente oficial. El dominio conserva valor semántico y representación; no aplica conversiones implícitas del lenguaje.

Se cerrarán para cada campo: encoding, longitud, orden, cardinalidad, separadores, escaping, whitespace, ausencia frente a vacío, mayúsculas, Unicode, decimal, signo, redondeo, fecha, hora y zona.

## Reglas

- UTF-8 estricto, sin BOM salvo exigencia expresa.
- Prohibidos `NaN`, infinitos, fechas locales ambiguas y números binarios para importes contractuales.
- Los importes se representan como decimales validados, no como `number` flotante.
- No se normaliza Unicode ni whitespace sin fuente.
- El orden de objeto JavaScript no determina XML o huella.
- Parsear y reserializar no se presume byte-identidad; los bytes enviados se conservan.

Los ejemplos oficiales se convierten en vectores byte a byte, incluidos límites 0/1/máximo y valores multibyte.

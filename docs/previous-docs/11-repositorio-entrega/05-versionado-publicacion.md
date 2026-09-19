# Versionado y publicación

Estado: **normativo**

Biblioteca y CLI comparten SemVer. Release inicial estable será `1.0.0` solo al cerrar todo el alcance. No se publican versiones estables que oculten capacidades obligatorias como “futuras”. Pre-releases `-rc.N` sirven para verificar exactamente el candidato completo.

Paquetes:

- `@noeos/verifactu` con exports raíz, `schemas`, `editions`, `catalogs` y `vectors`;
- `@noeos/verifactu-cli` con binario `noeos-verifactu` y dependencia exacta del primero.

Se publican en npm público mediante OIDC y provenance, nunca token persistente. Versión, tag, changelog, expediente, contratos y packages deben coincidir.

Un breaking change técnico o regulatorio incrementa versión conforme a SemVer y nueva edición. Una corrección no reinterpreta evidencia histórica sin versión.

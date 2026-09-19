# Release candidate y release estable

Estado: **normativo**

## Candidate

Tag SSH firmado `vX.Y.Z-rc.N`, descendiente de `main`, árbol limpio y versión exacta. Ejecuta todos los gates, crea tarballs/checksums/SBOM/attestations y, si está habilitado, publica en entorno `npm-staging` con aprobación protegida.

## Estable

Tag SSH firmado `vX.Y.Z`. Repite desde cero seguridad, conformidad, performance oficial, portal AEAT, packaging y consumers. `npm-production` restringe tags estables, impide bypass y requiere aprobación. Publica por OIDC y crea GitHub Release con assets y expediente.

No se promociona un artefacto local diferente. El stable se construye desde el tag y se verifica después desde npm. Cualquier diferencia, job indeterminado o gate ausente aborta antes de afirmar publicación completa.

# Calidad de contratos generados

Estado: **normativo**

CI verifica snapshots, hashes, generación, checksums, inventarios y trazabilidad sin acceso a red. Una modificación manual de un derivado se detecta porque la regeneración cambia sus bytes.

La suite cubre manifiestos malformados, digest incorrecto, archivo truncado, imports externos, DTD/XXE, namespaces ambiguos, declaraciones duplicadas, path traversal, symlinks y drift. También repite la generación en entornos limpios para demostrar determinismo.

Cada contrato debe mapear a una fuente y cada fuente debe tener evaluación. Un elemento no parseable, una contradicción normativa o una regla sin localizador bloquea la edición; no se convierte en un valor permisivo ni se marca como completado.

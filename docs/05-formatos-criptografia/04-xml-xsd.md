# XML y XSD

Estado: **normativo de diseño**

Los XSD oficiales son autoridad de estructura para su versión, complementados por reglas documentales y de servicio. Se preservarán namespace, `schemaLocation` cuando proceda, orden, tipos, restricciones y versión.

## Seguridad

- DTD, entidades externas, XInclude y resolución de red desactivados.
- Límites de bytes, profundidad, nodos, atributos, texto y diagnósticos antes de asignación grande.
- Parser y serializer separados; no se firma una representación reconstruida sin contrato.
- XPath y selección de nodos no aceptan expresiones del consumidor.
- Documentos con contenido tras la raíz, encoding incoherente o namespace ambiguo se rechazan.

## Compatibilidad

Cada servicio se vincula a WSDL/XSD por digest. Importaciones relativas se resuelven solo dentro del snapshot permitido. Una versión oficial nueva no reemplaza archivos antiguos; se añade como edición y se ejecuta diff estructural.

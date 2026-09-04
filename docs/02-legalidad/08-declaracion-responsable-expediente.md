# Declaración responsable y expediente

Estado: **normativo**

`verifactu` es un componente, no necesariamente el SIF final. Su documentación distinguirá:

- expediente de conformidad del componente;
- kit y resultado de conformidad del adaptador/host;
- declaración responsable del producto o SIF integrado cuando proceda.

El expediente por versión incluirá identidad del productor, nombre y versión exactos, modalidades, arquitectura relevante, fuentes y ediciones, matriz de requisitos, resultados de pruebas, vectores, compatibilidad, SBOM, procedencia, riesgos conocidos, limitaciones, instrucciones de integración y hash del release.

## Contenido obligatorio y orden

La plantilla comienza con `DECLARACIÓN RESPONSABLE DEL SISTEMA INFORMÁTICO DE FACTURACIÓN` y contiene, con el literal descriptor oficial antes de cada dato:

1. nombre comercial del SIF;
2. código de producto único del productor;
3. versión completa;
4. componentes hardware/software, descripción y funciones;
5. si solo puede funcionar como VERI*FACTU;
6. si admite varios obligados;
7. tipos de firma usados fuera de VERI*FACTU;
8. nombre/razón social del productor;
9. NIF español o identificación extranjera con tipo y país;
10. dirección postal completa;
11. declaración expresa de cumplimiento del artículo 29.2.j LGT, RRSIF, Orden y especificaciones AEAT;
12. fecha completa y lugar —localidad y país— de suscripción.

El anexo recomendado incorpora otros contactos, URLs del productor/producto/histórico, explicación requisito por requisito y datos adicionales. La declaración queda accesible de forma rápida, fácil, intuitiva, legible e individualizada dentro del SIF y se entrega al comercializador y cliente en formato común y gratuito. Se conserva cada versión y cada declaración de componentes de terceros.

La plantilla del repositorio no se firmará ni publicará como declaración de un SIF integrado inexistente. La release del componente genera un borrador claramente rotulado y un kit para que el productor del SIF integrado complete identidad, arquitectura y responsabilidad. Una actualización que altere cumplimiento genera nueva versión y expediente; nunca se edita retroactivamente el anterior.

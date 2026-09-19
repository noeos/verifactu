# Certificados y claves

Estado: **normativo de diseño**

Las claves privadas permanecen en el proveedor seleccionado por el operador: almacén del sistema, HSM, tarjeta u otro dispositivo conforme. El núcleo recibe un handle opaco y una operación de firma; nunca bytes exportables.

La política valida identidad autorizada, emisor/cadena, periodo, algoritmo, uso de clave, revocación cuando sea exigible, propósito y entorno. Se registra la huella del certificado público utilizado sin incluirlo completo en logs.

## Ciclo de vida

- alta con prueba de capacidad;
- selección determinista entre certificados elegibles;
- aviso previo de caducidad;
- rotación con frontera de registro clara;
- revocación y bloqueo;
- recuperación sin copiar clave fuera de su protección;
- destrucción conforme a política.

Fallos del proveedor no degradan a firma software ni a otra identidad. La modalidad que exige firma bloquea hasta recuperar una capacidad válida.

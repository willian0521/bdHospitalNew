**Normalización hasta 3FN — bdHospital**

Este modelo relacional separa claramente las entidades principales: `Usuario`, `Paciente`, `Expediente` y `Tratamiento`. Cada tabla representa una sola entidad con atributos que dependen exclusivamente de la clave primaria de la tabla, por lo que se evita la redundancia de datos.

Justificación breve:
- Primera forma normal (1FN): Todas las tablas almacenan valores atómicos (sin listas ni campos repetidos). Por ejemplo, nombres y apellidos se guardan en columnas separadas.
- Segunda forma normal (2FN): Las tablas con claves compuestas no tienen dependencias parciales; las claves principales son atómicas en este diseño (p. ej. `IdExpediente`, `IdTratamiento`, `DNI` en `Paciente`).
- Tercera forma normal (3FN): No existen dependencias transitivas entre atributos no clave; atributos como `Nombre` o `Rol` dependen directamente de la PK de `Usuario`, y no de otro atributo no clave.

Conclusión: El esquema actual cumple 3FN para las necesidades del proyecto (entidades separadas, claves primarias únicas, y FK para relaciones). Si se agregan atributos compuestos o historiales adicionales, se evaluará desnormalizar o añadir tablas auxiliares según rendimiento.

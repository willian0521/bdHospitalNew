# GestionAtencionHospital

Sistema de Gestión de Cola de Atención en un Hospital. Programa que simula el sistema de atención de pacientes en un hospital, usando estructuras de datos para manejar prioridad de atención y el historial de pacientes.

## Requerimientos Cumplidos

- **Modelo ER y Relacional**: Entidades Usuario, Paciente, Medico, Consulta, HistorialClinico.
- **Normalización**: Hasta 3FN.
- **Base de Datos**: SQL Server con tablas, claves primarias/foráneas.
- **Datos**: Más de 50 registros distribuidos.
- **Procedimientos Almacenados**: RegistrarPaciente, AsignarConsulta.
- **Consultas**: 5 consultas con JOIN, WHERE, GROUP BY.
- **Backend**: Node.js con Express, actualizado para SQL Server.
- **Frontend**: HTML/CSS/JS intacto.

## Instalación y Configuración

### Backend

1. Instalar dependencias:
   ```
   cd backend
   npm install
   ```

2. Configurar BD en SQL Server:
   - Crear BD `GestionAtencionHospital`.
   - Ejecutar el script en `database_schema.txt` en SSMS.

3. Configurar conexión en `backend/.env`:
   - Para local: `DB_CONNECTION_STRING=Server=localhost\\SQLEXPRESS;Database=GestionAtencionHospital;Trusted_Connection=True;`
   - Para Azure: Copiar connection string de Azure Portal.

4. Ejecutar backend:
   ```
   npm run dev
   ```
   Servidor en http://localhost:5000.

### Frontend

Abrir `frontend/index.html` en navegador. Las páginas usan fetch a http://localhost:5000/api/pacientes.

## Notas

- Si hay problemas de conexión a SQL Server local, verifica configuración de TCP/IP, puerto 1433, y servicios.
- El proyecto usa autenticación integrada de Windows por defecto.
- Para producción, cambiar a autenticación SQL o Azure.

## Estructura del Proyecto

- `backend/`: API Node.js.
- `frontend/`: Interfaz web.
- `database_schema.txt`: Script de BD.

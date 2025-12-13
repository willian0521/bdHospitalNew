# Sistema de Gestión Hospitalaria

Sistema de gestión hospitalaria con roles de usuario: Administrador, Médico y Recepcionista.

## Requerimientos Cumplidos

- **Situación**: Gestión de atención hospitalaria con tres niveles de usuarios.
- **Modelo ER**: Entidades Usuario, Paciente, Expediente, Tratamiento.
- **Modelo Relacional**: Tablas con PK/FK, normalización 3FN.
- **Base de Datos**: SQL Server con BD `bdHospital`.
- **Datos**: Más de 50 registros distribuidos.
- **Procedimientos Almacenados**: sp_RegistrarExpediente, sp_RegistrarTratamiento, sp_CerrarExpediente, sp_HistorialPorDNI.
- **Consultas**: 5 consultas con JOIN, WHERE, GROUP BY, subconsultas.
- **Backend**: Node.js con Express y mssql.
- **Frontend**: HTML/CSS/JS con autenticación por roles.

## Instalación y Configuración

### Backend

1. Instalar dependencias:
   ```
   cd backend
   npm install
   ```

2. Configurar BD en SQL Server:
   - Crear BD `bdHospital`.
   - Ejecutar el script en `database_schema.txt` en SSMS.

3. Configurar conexión en `backend/.env`:
   ```
   DB_SERVER=localhost
   DB_PORT=1433
   DB_NAME=bdHospital
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   ```

4. Ejecutar backend:
   ```
   npm start
   ```
   Servidor en http://localhost:5000.

### Frontend

Abrir `frontend/index.html` en navegador. Requiere login con código de empleado y contraseña.

## Roles y Funcionalidades

- **Administrador**: Gestión de usuarios, registro de pacientes, lista de espera, historial médico, dashboard.
- **Médico**: Lista de espera, atender expedientes, tratamientos, historial médico, dashboard.
- **Recepcionista**: Registro de pacientes, expedientes.

## Estructura del Proyecto

- `backend/`: API Node.js.
- `frontend/`: Interfaz web.
- `database_schema.txt`: Script de BD.

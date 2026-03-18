-- Created by GitHub Copilot in SSMS - review carefully before executing

-- ============================================================
-- BASE DE DATOS: bdHospital2
-- Sistema de Gestión de Consultas Médicas (SmartClinic DB)
-- Proyecto Final - Administración de Base de Datos II
-- Ing. Naomy Ríos
-- SCRIPT CORREGIDO - Orden de ejecución optimizado
-- ============================================================

-- Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'bdHospital2')
    CREATE DATABASE bdHospital2;
GO

USE bdHospital2;
GO

-- ============================================================
-- SECCIÓN 1: CREACIÓN DE TABLAS PRINCIPALES
-- ============================================================

-- Eliminar tablas existentes (en orden inverso por dependencias)
IF OBJECT_ID('Tratamiento','U') IS NOT NULL DROP TABLE Tratamiento;
IF OBJECT_ID('Expediente','U') IS NOT NULL DROP TABLE Expediente;
IF OBJECT_ID('Paciente','U') IS NOT NULL DROP TABLE Paciente;
IF OBJECT_ID('Usuario','U') IS NOT NULL DROP TABLE Usuario;
IF OBJECT_ID('AuditoriaExpediente','U') IS NOT NULL DROP TABLE AuditoriaExpediente;
IF OBJECT_ID('AuditoriaUsuario','U') IS NOT NULL DROP TABLE AuditoriaUsuario;
GO

-- Tabla Usuario
CREATE TABLE Usuario (
    DNI            NVARCHAR(20)  NOT NULL CONSTRAINT PK_Usuario PRIMARY KEY,
    Nombre         NVARCHAR(100) NOT NULL,
    Apellido       NVARCHAR(100) NOT NULL,
    Rol            NVARCHAR(20)  NOT NULL
                   CONSTRAINT CK_Usuario_Rol CHECK (Rol IN ('Admin','Medico','Recepcionista')),
    TipoMedico     NVARCHAR(50)  NULL,
    CodigoEmpleado NVARCHAR(20)  NOT NULL CONSTRAINT UQ_Usuario_Codigo UNIQUE,
    Contrasena     NVARCHAR(255) NOT NULL,
    Activo         BIT           NOT NULL CONSTRAINT DF_Usuario_Activo DEFAULT 1
);
GO

-- Tabla Paciente
CREATE TABLE Paciente (
    DNI              NVARCHAR(20)  NOT NULL CONSTRAINT PK_Paciente PRIMARY KEY,
    Nombre           NVARCHAR(100) NOT NULL,
    Apellido         NVARCHAR(100) NOT NULL,
    FechaNacimiento  DATE          NOT NULL,
    Sexo             NVARCHAR(1)   NULL,
    Direccion        NVARCHAR(255) NULL,
    Telefono         NVARCHAR(20)  NULL,
    Email            NVARCHAR(100) NULL
);
GO

-- Tabla Expediente
CREATE TABLE Expediente (
    IdExpediente    INT           NOT NULL IDENTITY(1,1) CONSTRAINT PK_Expediente PRIMARY KEY,
    DNI             NVARCHAR(20)  NOT NULL,
    CodigoEmpleado  NVARCHAR(20)  NOT NULL,
    FechaRegistro   DATETIME      NOT NULL CONSTRAINT DF_Expediente_Fecha DEFAULT GETDATE(),
    Estado          NVARCHAR(20)  NOT NULL
                    CONSTRAINT CK_Expediente_Estado CHECK (Estado IN ('En espera','Atendiendo','Atendido'))
                    CONSTRAINT DF_Expediente_Estado DEFAULT 'En espera',
    Urgencia        INT           NOT NULL CONSTRAINT DF_Expediente_Urgencia DEFAULT 2
                    CONSTRAINT CK_Expediente_Urgencia CHECK (Urgencia BETWEEN 1 AND 3),
    MotivoConsulta  NVARCHAR(255) NULL,
    FechaCierre     DATETIME      NULL,
    CONSTRAINT FK_Expediente_Paciente  FOREIGN KEY (DNI)            REFERENCES Paciente(DNI),
    CONSTRAINT FK_Expediente_Usuario   FOREIGN KEY (CodigoEmpleado) REFERENCES Usuario(CodigoEmpleado)
);
GO

-- Tabla Tratamiento
CREATE TABLE Tratamiento (
    IdTratamiento   INT           NOT NULL IDENTITY(1,1) CONSTRAINT PK_Tratamiento PRIMARY KEY,
    IdExpediente    INT           NOT NULL,
    CodigoEmpleado  NVARCHAR(20)  NOT NULL,
    Diagnostico     NVARCHAR(255) NULL,
    Tratamiento     NVARCHAR(255) NULL,
    FechaRegistro   DATETIME      NOT NULL CONSTRAINT DF_Tratamiento_Fecha DEFAULT GETDATE(),
    CONSTRAINT FK_Tratamiento_Expediente FOREIGN KEY (IdExpediente)   REFERENCES Expediente(IdExpediente),
    CONSTRAINT FK_Tratamiento_Usuario    FOREIGN KEY (CodigoEmpleado) REFERENCES Usuario(CodigoEmpleado)
);
GO

-- ============================================================
-- SECCIÓN 2: TABLAS DE AUDITORÍA (ANTES DE LAS VISTAS)
-- ============================================================

-- Tabla de auditoría de expedientes
CREATE TABLE AuditoriaExpediente (
    IdAuditoria     INT           NOT NULL IDENTITY(1,1) CONSTRAINT PK_Auditoria PRIMARY KEY,
    IdExpediente    INT           NOT NULL,
    EstadoAnterior  NVARCHAR(20)  NULL,
    EstadoNuevo     NVARCHAR(20)  NOT NULL,
    FechaCambio     DATETIME      NOT NULL DEFAULT GETDATE(),
    UsuarioSistema  NVARCHAR(128) NOT NULL DEFAULT SYSTEM_USER
);
GO

-- Tabla de auditoría de usuarios
CREATE TABLE AuditoriaUsuario (
    IdAuditoria    INT           NOT NULL IDENTITY(1,1) CONSTRAINT PK_AudUsuario PRIMARY KEY,
    DNI            NVARCHAR(20)  NOT NULL,
    Operacion      NVARCHAR(10)  NOT NULL,
    CampoModificado NVARCHAR(50) NULL,
    ValorAnterior  NVARCHAR(255) NULL,
    ValorNuevo     NVARCHAR(255) NULL,
    FechaCambio    DATETIME      NOT NULL DEFAULT GETDATE(),
    UsuarioSistema NVARCHAR(128) NOT NULL DEFAULT SYSTEM_USER
);
GO

-- ============================================================
-- SECCIÓN 3: ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================

CREATE INDEX IX_Expediente_DNI ON Expediente(DNI);
GO

CREATE INDEX IX_Expediente_Estado ON Expediente(Estado);
GO

CREATE INDEX IX_Expediente_Estado_Urgencia ON Expediente(Estado, Urgencia DESC);
GO

CREATE INDEX IX_Tratamiento_Expediente ON Tratamiento(IdExpediente);
GO

CREATE INDEX IX_Tratamiento_Medico ON Tratamiento(CodigoEmpleado);
GO

CREATE INDEX IX_Paciente_Nombre ON Paciente(Nombre, Apellido);
GO

-- ============================================================
-- SECCIÓN 4: VISTAS (CON GO ENTRE CADA UNA)
-- ============================================================

CREATE VIEW ListaEspera AS
SELECT
    e.IdExpediente,
    p.DNI,
    p.Nombre,
    p.Apellido,
    e.FechaRegistro,
    e.MotivoConsulta,
    e.Estado,
    e.Urgencia,
    u.Nombre AS Recepcionista
FROM Expediente e
JOIN Paciente p ON e.DNI = p.DNI
JOIN Usuario u  ON e.CodigoEmpleado = u.CodigoEmpleado
WHERE e.Estado IN ('En espera','Atendiendo');
GO

CREATE VIEW HistorialMedico AS
SELECT
    e.IdExpediente,
    p.DNI,
    p.Nombre,
    p.Apellido,
    e.FechaRegistro,
    e.FechaCierre,
    e.MotivoConsulta,
    t.Diagnostico,
    t.Tratamiento,
    u.Nombre AS Recepcionista,
    um.Nombre AS Medico
FROM Expediente e
JOIN  Paciente  p  ON e.DNI             = p.DNI
JOIN  Usuario   u  ON e.CodigoEmpleado  = u.CodigoEmpleado
LEFT JOIN Tratamiento t  ON e.IdExpediente = t.IdExpediente
LEFT JOIN Usuario    um  ON t.CodigoEmpleado = um.CodigoEmpleado
WHERE e.Estado = 'Atendido';
GO

CREATE VIEW ReporteMedicos AS
SELECT
    u.CodigoEmpleado,
    u.Nombre + ' ' + u.Apellido AS NombreCompleto,
    u.TipoMedico,
    COUNT(t.IdTratamiento) AS TotalTratamientos,
    COUNT(DISTINCT t.IdExpediente) AS PacientesAtendidos
FROM Usuario u
LEFT JOIN Tratamiento t ON u.CodigoEmpleado = t.CodigoEmpleado
WHERE u.Rol = 'Medico'
GROUP BY u.CodigoEmpleado, u.Nombre, u.Apellido, u.TipoMedico;
GO

CREATE VIEW HistorialTransacciones AS
SELECT
    e.IdExpediente,
    p.Nombre + ' ' + p.Apellido  AS Paciente,
    p.DNI,
    e.FechaRegistro              AS FechaApertura,
    e.FechaCierre,
    DATEDIFF(MINUTE, e.FechaRegistro, e.FechaCierre) AS DuracionMinutos,
    t.Diagnostico,
    t.Tratamiento,
    u.Nombre + ' ' + u.Apellido  AS Medico,
    u.TipoMedico,
    CASE e.Urgencia
        WHEN 1 THEN 'Alta'
        WHEN 2 THEN 'Media'
        ELSE        'Baja'
    END AS NivelUrgencia
FROM Expediente  e
JOIN Paciente    p ON e.DNI            = p.DNI
JOIN Tratamiento t ON e.IdExpediente   = t.IdExpediente
JOIN Usuario     u ON t.CodigoEmpleado = u.CodigoEmpleado
WHERE e.Estado = 'Atendido';
GO

CREATE VIEW VistaAuditoria AS
SELECT
    'Expediente'      AS Entidad,
    CAST(IdExpediente AS NVARCHAR) AS IdReferencia,
    EstadoAnterior    AS ValorAnterior,
    EstadoNuevo       AS ValorNuevo,
    'Estado'          AS Campo,
    FechaCambio,
    UsuarioSistema
FROM AuditoriaExpediente
UNION ALL
SELECT
    'Usuario'         AS Entidad,
    DNI               AS IdReferencia,
    ValorAnterior,
    ValorNuevo,
    CampoModificado   AS Campo,
    FechaCambio,
    UsuarioSistema
FROM AuditoriaUsuario;
GO

-- ============================================================
-- SECCIÓN 5: PROCEDIMIENTOS ALMACENADOS
-- ============================================================

CREATE OR ALTER PROCEDURE sp_RegistrarPaciente
    @DNI             NVARCHAR(20),
    @Nombre          NVARCHAR(100),
    @Apellido        NVARCHAR(100),
    @FechaNacimiento DATE,
    @Sexo            NVARCHAR(1)   = NULL,
    @Direccion       NVARCHAR(255) = NULL,
    @Telefono        NVARCHAR(20)  = NULL,
    @Email           NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM Paciente WHERE DNI = @DNI)
        BEGIN
            RAISERROR('Paciente ya registrado con DNI: %s', 16, 1, @DNI);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO Paciente (DNI, Nombre, Apellido, FechaNacimiento, Sexo, Direccion, Telefono, Email)
        VALUES (@DNI, @Nombre, @Apellido, @FechaNacimiento, @Sexo, @Direccion, @Telefono, @Email);

        COMMIT TRANSACTION;
        SELECT @DNI AS DNI, 'Paciente registrado exitosamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_RegistrarExpediente
    @DNI            NVARCHAR(20),
    @CodigoEmpleado NVARCHAR(20),
    @MotivoConsulta NVARCHAR(255),
    @Urgencia       INT = 2
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Paciente WHERE DNI = @DNI)
        BEGIN
            RAISERROR('Paciente no encontrado con DNI: %s', 16, 1, @DNI);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF NOT EXISTS (SELECT 1 FROM Usuario WHERE CodigoEmpleado = @CodigoEmpleado AND Activo = 1)
        BEGIN
            RAISERROR('Empleado no encontrado o inactivo', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        INSERT INTO Expediente (DNI, CodigoEmpleado, MotivoConsulta, Urgencia)
        VALUES (@DNI, @CodigoEmpleado, @MotivoConsulta, @Urgencia);

        COMMIT TRANSACTION;
        SELECT SCOPE_IDENTITY() AS IdExpediente, 'Expediente registrado exitosamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_RegistrarTratamiento
    @IdExpediente   INT,
    @CodigoMedico   NVARCHAR(20),
    @Diagnostico    NVARCHAR(255),
    @Tratamiento    NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Expediente WHERE IdExpediente = @IdExpediente AND Estado <> 'Atendido')
        BEGIN
            RAISERROR('Expediente no encontrado o ya cerrado', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE Expediente
        SET Estado = 'Atendiendo'
        WHERE IdExpediente = @IdExpediente;

        INSERT INTO Tratamiento (IdExpediente, CodigoEmpleado, Diagnostico, Tratamiento)
        VALUES (@IdExpediente, @CodigoMedico, @Diagnostico, @Tratamiento);

        COMMIT TRANSACTION;
        SELECT SCOPE_IDENTITY() AS IdTratamiento, 'Tratamiento registrado exitosamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_CerrarExpediente
    @IdExpediente INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Tratamiento WHERE IdExpediente = @IdExpediente)
        BEGIN
            RAISERROR('No se puede cerrar un expediente sin tratamiento registrado', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE Expediente
        SET Estado = 'Atendido', FechaCierre = GETDATE()
        WHERE IdExpediente = @IdExpediente;

        COMMIT TRANSACTION;
        SELECT 'Expediente cerrado exitosamente' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_HistorialPorDNI
    @DNI NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.DNI,
        p.Nombre + ' ' + p.Apellido AS NombrePaciente,
        e.IdExpediente,
        e.FechaRegistro,
        e.FechaCierre,
        e.Estado,
        e.MotivoConsulta,
        t.Diagnostico,
        t.Tratamiento,
        um.Nombre + ' ' + um.Apellido AS Medico
    FROM Paciente p
    INNER JOIN Expediente e  ON p.DNI = e.DNI
    LEFT  JOIN Tratamiento t ON e.IdExpediente = t.IdExpediente
    LEFT  JOIN Usuario um    ON t.CodigoEmpleado = um.CodigoEmpleado
    WHERE p.DNI = @DNI
    ORDER BY e.FechaRegistro DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_RegTratamientoYCerrar
    @IdExpediente   INT,
    @CodigoMedico   NVARCHAR(20),
    @Diagnostico    NVARCHAR(255),
    @Tratamiento    NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Expediente WHERE IdExpediente = @IdExpediente)
        BEGIN
            RAISERROR('Expediente no encontrado con ID: %d', 16, 1, @IdExpediente);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM Expediente WHERE IdExpediente = @IdExpediente AND Estado = 'Atendido')
        BEGIN
            RAISERROR('El expediente ya está cerrado y no puede modificarse.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF NOT EXISTS (
            SELECT 1 FROM Usuario
            WHERE CodigoEmpleado = @CodigoMedico
              AND Rol = 'Medico'
              AND Activo = 1
        )
        BEGIN
            RAISERROR('Médico no encontrado o inactivo: %s', 16, 1, @CodigoMedico);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @IdTratamiento INT;
        INSERT INTO Tratamiento (IdExpediente, CodigoEmpleado, Diagnostico, Tratamiento)
        VALUES (@IdExpediente, @CodigoMedico, @Diagnostico, @Tratamiento);
        SET @IdTratamiento = SCOPE_IDENTITY();

        UPDATE Expediente
        SET Estado = 'Atendido', FechaCierre = GETDATE()
        WHERE IdExpediente = @IdExpediente;

        COMMIT TRANSACTION;

        SELECT
            @IdTratamiento  AS IdTratamiento,
            @IdExpediente   AS IdExpediente,
            'Tratamiento registrado y expediente cerrado exitosamente' AS Mensaje;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO

-- ============================================================
-- SECCIÓN 6: TRIGGERS
-- ============================================================

CREATE OR ALTER TRIGGER trg_Expediente_AuditarEstado
ON Expediente
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(Estado)
    BEGIN
        INSERT INTO AuditoriaExpediente (IdExpediente, EstadoAnterior, EstadoNuevo)
        SELECT
            i.IdExpediente,
            d.Estado AS EstadoAnterior,
            i.Estado AS EstadoNuevo
        FROM inserted i
        JOIN deleted  d ON i.IdExpediente = d.IdExpediente
        WHERE i.Estado <> d.Estado;
    END
END;
GO

CREATE OR ALTER TRIGGER trg_Expediente_ProtegerCerrado
ON Expediente
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM deleted d
        JOIN inserted i ON d.IdExpediente = i.IdExpediente
        WHERE d.Estado = 'Atendido'
          AND i.Estado <> 'Atendido'
    )
    BEGIN
        RAISERROR('No se permite modificar el estado de un expediente ya cerrado.', 16, 1);
        RETURN;
    END

    UPDATE e
    SET
        e.Estado         = i.Estado,
        e.FechaCierre    = i.FechaCierre,
        e.MotivoConsulta = i.MotivoConsulta,
        e.Urgencia       = i.Urgencia,
        e.CodigoEmpleado = i.CodigoEmpleado
    FROM Expediente e
    JOIN inserted i ON e.IdExpediente = i.IdExpediente;
END;
GO

CREATE OR ALTER TRIGGER trg_Usuario_AuditarCambios
ON Usuario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO AuditoriaUsuario (DNI, Operacion, CampoModificado, ValorNuevo)
        SELECT DNI, 'INSERT', 'Rol', Rol FROM inserted;
    END

    ELSE IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO AuditoriaUsuario (DNI, Operacion, CampoModificado, ValorAnterior)
        SELECT DNI, 'DELETE', 'Todo', CodigoEmpleado FROM deleted;
    END

    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO AuditoriaUsuario (DNI, Operacion, CampoModificado, ValorAnterior, ValorNuevo)
        SELECT i.DNI, 'UPDATE', 'Activo',
               CAST(d.Activo AS NVARCHAR), CAST(i.Activo AS NVARCHAR)
        FROM inserted i JOIN deleted d ON i.DNI = d.DNI
        WHERE i.Activo <> d.Activo;

        INSERT INTO AuditoriaUsuario (DNI, Operacion, CampoModificado, ValorAnterior, ValorNuevo)
        SELECT i.DNI, 'UPDATE', 'Rol', d.Rol, i.Rol
        FROM inserted i JOIN deleted d ON i.DNI = d.DNI
        WHERE i.Rol <> d.Rol;
    END
END;
GO

-- ============================================================
-- SECCIÓN 7: SEGURIDAD - LOGINS, USUARIOS Y ROLES
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_admin')
    CREATE LOGIN login_admin WITH PASSWORD = 'Admin@12345!';
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_medico')
    CREATE LOGIN login_medico WITH PASSWORD = 'Medico@12345!';
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_recep')
    CREATE LOGIN login_recep WITH PASSWORD = 'Recep@12345!';
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_admin')
    CREATE USER usr_admin FOR LOGIN login_admin;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_medico')
    CREATE USER usr_medico FOR LOGIN login_medico;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_recep')
    CREATE USER usr_recep FOR LOGIN login_recep;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_admin' AND type = 'R')
    CREATE ROLE rol_admin;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_medico' AND type = 'R')
    CREATE ROLE rol_medico;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_recepcionista' AND type = 'R')
    CREATE ROLE rol_recepcionista;
GO

-- ============================================================
-- SECCIÓN 8: PERMISOS (DESPUÉS DE CREAR TODOS LOS OBJETOS)
-- ============================================================

-- Permisos para rol_admin
GRANT SELECT, INSERT, UPDATE, DELETE ON Usuario      TO rol_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON Paciente     TO rol_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON Expediente   TO rol_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON Tratamiento  TO rol_admin;
GRANT SELECT ON AuditoriaExpediente      TO rol_admin;
GRANT SELECT ON AuditoriaUsuario         TO rol_admin;
GRANT SELECT ON ListaEspera              TO rol_admin;
GRANT SELECT ON HistorialMedico          TO rol_admin;
GRANT SELECT ON ReporteMedicos           TO rol_admin;
GRANT SELECT ON HistorialTransacciones   TO rol_admin;
GRANT SELECT ON VistaAuditoria           TO rol_admin;
GRANT EXECUTE ON sp_RegistrarPaciente           TO rol_admin;
GRANT EXECUTE ON sp_RegistrarExpediente         TO rol_admin;
GRANT EXECUTE ON sp_RegistrarTratamiento        TO rol_admin;
GRANT EXECUTE ON sp_CerrarExpediente            TO rol_admin;
GRANT EXECUTE ON sp_HistorialPorDNI             TO rol_admin;
GRANT EXECUTE ON sp_RegTratamientoYCerrar TO rol_admin;
GO

-- Permisos para rol_medico
GRANT SELECT          ON Paciente     TO rol_medico;
GRANT SELECT, UPDATE  ON Expediente   TO rol_medico;
GRANT SELECT, INSERT  ON Tratamiento  TO rol_medico;
GRANT SELECT ON ListaEspera           TO rol_medico;
GRANT SELECT ON HistorialMedico       TO rol_medico;
GRANT SELECT ON HistorialTransacciones TO rol_medico;
GRANT EXECUTE ON sp_RegistrarTratamiento        TO rol_medico;
GRANT EXECUTE ON sp_CerrarExpediente            TO rol_medico;
GRANT EXECUTE ON sp_HistorialPorDNI             TO rol_medico;
GRANT EXECUTE ON sp_RegTratamientoYCerrar TO rol_medico;
DENY SELECT, INSERT, UPDATE, DELETE ON Usuario TO rol_medico;
GO

-- Permisos para rol_recepcionista
GRANT SELECT, INSERT ON Paciente    TO rol_recepcionista;
GRANT SELECT, INSERT ON Expediente  TO rol_recepcionista;
GRANT SELECT ON ListaEspera         TO rol_recepcionista;
GRANT EXECUTE ON sp_RegistrarPaciente   TO rol_recepcionista;
GRANT EXECUTE ON sp_RegistrarExpediente TO rol_recepcionista;
DENY SELECT, INSERT, UPDATE, DELETE ON Tratamiento TO rol_recepcionista;
DENY SELECT, INSERT, UPDATE, DELETE ON Usuario     TO rol_recepcionista;
DENY SELECT ON AuditoriaExpediente     TO rol_recepcionista;
DENY SELECT ON AuditoriaUsuario        TO rol_recepcionista;
GO

-- Asignar usuarios a roles
ALTER ROLE rol_admin         ADD MEMBER usr_admin;
ALTER ROLE rol_medico        ADD MEMBER usr_medico;
ALTER ROLE rol_recepcionista ADD MEMBER usr_recep;
GO

-- ============================================================
-- SECCIÓN 9: DATOS DE PRUEBA
-- ============================================================

INSERT INTO Usuario (DNI, Nombre, Apellido, Rol, TipoMedico, CodigoEmpleado, Contrasena) VALUES
('12345678', 'Diego',     'Martínez',  'Admin',          NULL,           'DM001',  'password1'),
('87654321', 'Carlos',    'Reyes',     'Medico',         'General',      'MED001', 'password2'),
('11223344', 'Sofia',     'Hernández', 'Recepcionista',  NULL,           'REC001', 'password3'),
('44332211', 'Laura',     'Gutiérrez', 'Medico',         'Pediatria',    'MED002', 'password4'),
('55667788', 'Roberto',   'Castillo',  'Medico',         'Cardiología',  'MED003', 'password5'),
('99887766', 'Valentina', 'Torres',    'Recepcionista',  NULL,           'REC002', 'password6');
GO

INSERT INTO Paciente (DNI, Nombre, Apellido, FechaNacimiento, Sexo, Direccion, Telefono, Email) VALUES
('10000001','Juan',      'Pérez',     '1980-01-15','M','Col. Centro 101',       '9901-1001','juan.perez@mail.com'),
('10000002','María',     'López',     '1992-03-22','F','Col. Norte 202',        '9901-1002','maria.lopez@mail.com'),
('10000003','Carlos',    'García',    '1975-07-10','M','Col. Sur 303',          '9901-1003','carlos.garcia@mail.com'),
('10000004','Ana',       'Rodríguez', '1988-11-05','F','Barrio Los Robles 12',  '9901-1004','ana.rodriguez@mail.com'),
('10000005','Luis',      'Martínez',  '1995-04-30','M','Res. Las Palmas 4-B',   '9901-1005','luis.martinez@mail.com'),
('10000006','Gabriela',  'Sánchez',   '1983-09-17','F','Av. Principal 55',      '9901-1006','gabriela.sanchez@mail.com'),
('10000007','Pedro',     'Jiménez',   '1970-12-01','M','Calle 5 de Mayo 88',    '9901-1007','pedro.jimenez@mail.com'),
('10000008','Lucía',     'Morales',   '2000-06-14','F','Col. El Bosque 7',      '9901-1008','lucia.morales@mail.com'),
('10000009','Ricardo',   'Díaz',      '1967-02-28','M','Barrio San José 22',    '9901-1009','ricardo.diaz@mail.com'),
('10000010','Fernanda',  'Herrera',   '1998-08-03','F','Col. Primavera 14',     '9901-1010','fernanda.herrera@mail.com'),
('10000011','Óscar',     'Vargas',    '1982-10-20','M','Av. La Paz 66',         '9901-1011','oscar.vargas@mail.com'),
('10000012','Patricia',  'Méndez',    '1990-05-25','F','Res. Los Cedros 3-A',   '9901-1012','patricia.mendez@mail.com'),
('10000013','Héctor',    'Torres',    '1973-01-09','M','Col. Santa Ana 19',     '9901-1013','hector.torres@mail.com'),
('10000014','Daniela',   'Flores',    '2002-07-18','F','Calle Real 30',         '9901-1014','daniela.flores@mail.com'),
('10000015','Jorge',     'Castillo',  '1960-03-05','M','Barrio El Carmen 8',    '9901-1015','jorge.castillo@mail.com'),
('10000016','Valeria',   'Ruiz',      '1997-09-12','F','Col. Las Flores 25',    '9901-1016','valeria.ruiz@mail.com'),
('10000017','Manuel',    'Ramírez',   '1985-04-07','M','Av. Central 100',       '9901-1017','manuel.ramirez@mail.com'),
('10000018','Sofía',     'Moreno',    '1993-11-29','F','Res. El Pinar 6-C',     '9901-1018','sofia.moreno@mail.com'),
('10000019','Andrés',    'Núñez',     '1978-08-15','M','Calle 2 de Abril 45',   '9901-1019','andres.nunez@mail.com'),
('10000020','Carolina',  'Vega',      '2005-12-21','F','Col. Nueva 17',         '9901-1020','carolina.vega@mail.com'),
('10000021','Ernesto',   'Medina',    '1965-06-03','M','Barrio La Unión 33',    '9901-1021','ernesto.medina@mail.com'),
('10000022','Alejandra', 'Cruz',      '1999-02-14','F','Av. Independencia 78',  '9901-1022','alejandra.cruz@mail.com'),
('10000023','Felipe',    'Ortega',    '1972-10-08','M','Col. El Progreso 9',    '9901-1023','felipe.ortega@mail.com'),
('10000024','Natalia',   'Ríos',      '1989-07-27','F','Res. La Arboleda 2-D',  '9901-1024','natalia.rios@mail.com'),
('10000025','Sebastián', 'Aguilar',   '1986-05-16','M','Calle Los Pinos 51',    '9901-1025','sebastian.aguilar@mail.com');
GO

EXEC sp_RegistrarExpediente '10000001','REC001','Dolor de cabeza intenso',1;
EXEC sp_RegistrarExpediente '10000002','REC001','Fiebre alta y escalofríos',1;
EXEC sp_RegistrarExpediente '10000003','REC001','Lesión en tobillo derecho',2;
EXEC sp_RegistrarExpediente '10000004','REC001','Chequeo general anual',3;
EXEC sp_RegistrarExpediente '10000005','REC001','Consulta por tos persistente',2;
EXEC sp_RegistrarExpediente '10000006','REC001','Dolor abdominal',1;
EXEC sp_RegistrarExpediente '10000007','REC001','Control de presión arterial',3;
EXEC sp_RegistrarExpediente '10000008','REC001','Erupción cutánea',2;
EXEC sp_RegistrarExpediente '10000009','REC001','Dolor en el pecho',1;
EXEC sp_RegistrarExpediente '10000010','REC001','Revisión pediátrica',3;
EXEC sp_RegistrarExpediente '10000011','REC001','Mareos frecuentes',2;
EXEC sp_RegistrarExpediente '10000012','REC001','Infección urinaria',2;
EXEC sp_RegistrarExpediente '10000013','REC001','Dolor de rodilla',2;
EXEC sp_RegistrarExpediente '10000014','REC001','Vacuna de refuerzo',3;
EXEC sp_RegistrarExpediente '10000015','REC001','Diabetes control mensual',2;
EXEC sp_RegistrarExpediente '10000016','REC001','Migraña crónica',1;
EXEC sp_RegistrarExpediente '10000017','REC001','Alergias estacionales',3;
EXEC sp_RegistrarExpediente '10000018','REC001','Nauseas y vómitos',2;
EXEC sp_RegistrarExpediente '10000019','REC001','Revisión cardiológica',2;
EXEC sp_RegistrarExpediente '10000020','REC001','Control de crecimiento pediátrico',3;
EXEC sp_RegistrarExpediente '10000001','REC001','Seguimiento de migraña',2;
EXEC sp_RegistrarExpediente '10000002','REC001','Reconsulta por fiebre',1;
EXEC sp_RegistrarExpediente '10000009','REC001','Seguimiento cardiológico',1;
EXEC sp_RegistrarExpediente '10000015','REC001','Control diabetes trimestral',2;
EXEC sp_RegistrarExpediente '10000021','REC001','Dolor lumbar',2;
EXEC sp_RegistrarExpediente '10000022','REC001','Consulta ginecológica',2;
EXEC sp_RegistrarExpediente '10000023','REC001','Problemas de visión',3;
EXEC sp_RegistrarExpediente '10000024','REC001','Control prenatal',2;
EXEC sp_RegistrarExpediente '10000025','REC001','Dolor de espalda',2;
EXEC sp_RegistrarExpediente '10000003','REC001','Seguimiento fractura tobillo',2;
GO

EXEC sp_RegistrarTratamiento  1,'MED001','Migraña tensional',         'Paracetamol 500mg c/8h, reposo';
EXEC sp_RegistrarTratamiento  2,'MED001','Infección viral aguda',      'Antipiréticos, hidratación oral';
EXEC sp_RegistrarTratamiento  3,'MED001','Esguince de tobillo grado I','Inmovilización, antiinflamatorios';
EXEC sp_RegistrarTratamiento  4,'MED001','Paciente sano',              'Exámenes de rutina';
EXEC sp_RegistrarTratamiento  5,'MED001','Bronquitis aguda',           'Expectorantes, reposo, hidratación';
EXEC sp_RegistrarTratamiento  6,'MED001','Gastritis aguda',            'Omeprazol 20mg, dieta blanda';
EXEC sp_RegistrarTratamiento  7,'MED003','Hipertensión grado I',       'Enalapril 5mg, dieta hiposódica';
EXEC sp_RegistrarTratamiento  8,'MED001','Dermatitis alérgica',        'Antihistamínico, crema corticoide';
EXEC sp_RegistrarTratamiento  9,'MED003','Angina de pecho estable',    'Nitroglicerina sublingual, ECG urgente';
EXEC sp_RegistrarTratamiento 10,'MED002','Control pediátrico normal',  'Vitamina D, suplemento de hierro';
EXEC sp_RegistrarTratamiento 11,'MED001','Vértigo posicional',         'Maniobra de Epley, reposo';
EXEC sp_RegistrarTratamiento 12,'MED001','ITU no complicada',          'Ciprofloxacino 500mg c/12h por 7 días';
EXEC sp_RegistrarTratamiento 13,'MED001','Gonalgia por desgaste',      'AINES, fisioterapia';
EXEC sp_RegistrarTratamiento 14,'MED002','Paciente vacunado',          'Registrar dosis en carnet';
EXEC sp_RegistrarTratamiento 15,'MED003','Diabetes tipo 2 controlada', 'Metformina 850mg, dieta, ejercicio';
EXEC sp_RegistrarTratamiento 16,'MED001','Migraña con aura',           'Sumatriptán 50mg, oscuridad y reposo';
EXEC sp_RegistrarTratamiento 17,'MED001','Rinitis alérgica',           'Loratadina 10mg, evitar alérgenos';
EXEC sp_RegistrarTratamiento 18,'MED001','Gastroenteritis aguda',      'Suero oral, dieta líquida 24h';
EXEC sp_RegistrarTratamiento 19,'MED003','Arritmia sinusal',           'Holter 24h, betabloqueador';
EXEC sp_RegistrarTratamiento 20,'MED002','Talla y peso normales',      'Continuar alimentación balanceada';
EXEC sp_RegistrarTratamiento 21,'MED001','Migraña crónica',            'Topiramato preventivo 25mg';
EXEC sp_RegistrarTratamiento 22,'MED001','Fiebre por dengue probable', 'Hospitalización preventiva, hidratación IV';
EXEC sp_RegistrarTratamiento 23,'MED003','Insuficiencia coronaria',    'Aspirina 100mg, referir a cardiología';
EXEC sp_RegistrarTratamiento 24,'MED003','Diabetes descompensada',     'Ajuste de insulina, revisión nutricional';
EXEC sp_RegistrarTratamiento 25,'MED001','Lumbalgia mecánica',         'Ibuprofeno 400mg, calor local';
EXEC sp_RegistrarTratamiento 26,'MED001','Control ginecológico normal','PAP al día, anticonceptivos orales';
EXEC sp_RegistrarTratamiento 27,'MED001','Miopía moderada',            'Referir a oftalmología, lentes';
EXEC sp_RegistrarTratamiento 28,'MED002','Embarazo 20 semanas normal', 'Ácido fólico, control en 4 semanas';
EXEC sp_RegistrarTratamiento 29,'MED001','Contractura muscular lumbar','Relajante muscular, fisioterapia';
EXEC sp_RegistrarTratamiento 30,'MED001','Tobillo con consolidación',  'Alta médica, ejercicios de rehabilitación';
GO

EXEC sp_CerrarExpediente  1; EXEC sp_CerrarExpediente  2; EXEC sp_CerrarExpediente  3;
EXEC sp_CerrarExpediente  4; EXEC sp_CerrarExpediente  5; EXEC sp_CerrarExpediente  6;
EXEC sp_CerrarExpediente  7; EXEC sp_CerrarExpediente  8; EXEC sp_CerrarExpediente  9;
EXEC sp_CerrarExpediente 10; EXEC sp_CerrarExpediente 11; EXEC sp_CerrarExpediente 12;
EXEC sp_CerrarExpediente 13; EXEC sp_CerrarExpediente 14; EXEC sp_CerrarExpediente 15;
EXEC sp_CerrarExpediente 16; EXEC sp_CerrarExpediente 17; EXEC sp_CerrarExpediente 18;
EXEC sp_CerrarExpediente 19; EXEC sp_CerrarExpediente 20; EXEC sp_CerrarExpediente 21;
EXEC sp_CerrarExpediente 22; EXEC sp_CerrarExpediente 23; EXEC sp_CerrarExpediente 24;
GO
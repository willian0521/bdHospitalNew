CREATE TABLE Usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    rol NVARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'medico', 'enfermera', 'recepcionista')),
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    ultimo_login DATETIME NULL
);

-- Usuario administrador por defecto
INSERT INTO Usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@hospital.com', '123456', 'admin');

-- Usuario médico por defecto
INSERT INTO Usuarios (nombre, email, password, rol) VALUES
('Dr. García', 'medico@hospital.com', '123456', 'medico');
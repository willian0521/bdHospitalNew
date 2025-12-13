-- consultas.sql
-- 5 consultas de ejemplo que cumplen los requisitos: JOIN, WHERE, GROUP BY, agregaciones y HAVING

-- 1) JOIN: Pacientes con expedientes en espera
SELECT p.Nombre, p.Apellido, e.IdExpediente, e.MotivoConsulta
FROM Paciente p
JOIN Expediente e ON p.DNI = e.DNI
WHERE e.Estado = 'En espera';

-- 2) WHERE: Tratamientos realizados por un médico específico (filtrado)
SELECT t.IdTratamiento, t.Diagnostico, t.Tratamiento, u.Nombre AS Medico
FROM Tratamiento t
JOIN Usuario u ON t.CodigoEmpleado = u.CodigoEmpleado
WHERE u.CodigoEmpleado = 'MED001'; -- reemplazar por parámetro según necesidad

-- 3) GROUP BY: Número de expedientes por estado
SELECT Estado, COUNT(*) AS Cantidad
FROM Expediente
GROUP BY Estado;

-- 4) JOIN + GROUP BY: Médicos con más tratamientos
SELECT u.Nombre, COUNT(t.IdTratamiento) AS Tratamientos
FROM Usuario u
JOIN Tratamiento t ON u.CodigoEmpleado = t.CodigoEmpleado
WHERE u.Rol = 'Medico'
GROUP BY u.Nombre
ORDER BY Tratamientos DESC;

-- 5) HAVING: Pacientes con más de un expediente
SELECT p.DNI, p.Nombre, COUNT(e.IdExpediente) AS NumExpedientes
FROM Paciente p
JOIN Expediente e ON p.DNI = e.DNI
GROUP BY p.DNI, p.Nombre
HAVING COUNT(e.IdExpediente) > 1;

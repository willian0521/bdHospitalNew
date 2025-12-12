import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import pacienteRoutes from "./src/routes/pacienteRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import { connectDB } from "./db.js";

dotenv.config({ path: './.env' });

const app = express();

// Conectar a la base de datos
connectDB();

// Configurar CORS con opciones mas permisivas para desarrollo
app.use(
  cors({
    origin: "*", // Permite todas las origenes en desarrollo
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  })
);

// Middleware para parsear JSON
app.use(express.json());

// Ruta de prueba
app.get("/", (_req, res) => {
  res.json({ message: "API Hospital – Cola de Atencion ✅" });
});

// Rutas
app.use("/api/pacientes", pacienteRoutes); // Aqui se conectan todas las rutas de pacientes
app.use("/api/auth", authRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log("CORS habilitado para todos los origenes en modo desarrollo");
});

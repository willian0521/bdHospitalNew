import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // ajusta según la ubicación real

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};


const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log("Conectado a SQL Server ✅");
  } catch (err) {
    console.error("Error conectando a SQL Server:", err);
  }
};

export { sql, connectDB };

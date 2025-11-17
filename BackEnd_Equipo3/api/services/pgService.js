// api/services/pgService.js
import pkg from "pg";
const { Pool } = pkg;

export const pgPool = new Pool({
  host: "postgres_iot",
  port: 5432,
  user: "postgres",
  password: "12345",
  database: "SensoresIoT",
});

// Obtener últimas mediciones
export async function getLastAire() {
  const res = await pgPool.query(`
    SELECT * FROM sensor_aire ORDER BY fecha_hora DESC LIMIT 20
  `);
  return res.rows;
}

export async function getLastSonido() {
  const res = await pgPool.query(`
    SELECT * FROM sensor_sonido ORDER BY fecha_hora DESC LIMIT 20
  `);
  return res.rows;
}

export async function getLastSoterrado() {
  const res = await pgPool.query(`
    SELECT * FROM sensor_soterrado ORDER BY fecha_hora DESC LIMIT 20
  `);
  return res.rows;
}

import { Pool } from "pg";

// Prevent multiple pool instances in Next.js hot-reload dev mode
const globalForDb = globalThis as unknown as { pool: Pool | undefined };

function createPool() {
  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    min: 0,                       // don't hold idle connections open
    idleTimeoutMillis: 10000,     // release idle connections after 10 s
    connectionTimeoutMillis: 10000,
    keepAlive: true,              // send TCP keepalive packets
    keepAliveInitialDelayMillis: 5000,
  });

  // Prevent unhandled pool errors from crashing the dev server
  p.on("error", (err) => {
    console.error("[db] pool client error:", err.message);
  });

  return p;
}

const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

/**
 * Run `fn` with a fresh, dedicated client.
 * The client is connected, used, then immediately released.
 * Retries once on connection-terminated errors.
 */
export async function withDb<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const attempt = async () => {
    const client = await pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  };

  try {
    return await attempt();
  } catch (err: any) {
    const msg: string = err?.message ?? "";
    const isConnectionDrop =
      msg.includes("Connection terminated") ||
      msg.includes("connection timeout") ||
      msg.includes("ECONNRESET") ||
      msg.includes("EPIPE");

    if (isConnectionDrop) {
      console.warn("[db] Connection dropped, retrying once…");
      return await attempt();
    }
    throw err;
  }
}

/** @deprecated Use `withDb` for fresh-connection safety. Direct pool access kept for compatibility. */
export function createAdminClient() {
  return pool;
}

export default pool;

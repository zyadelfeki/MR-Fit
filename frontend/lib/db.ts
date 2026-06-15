import { Pool, Client } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 8000,
        });
        // Prevent unhandled pool errors from crashing the dev server
        pool.on("error", (err) => {
            console.error("[db] pool error:", err.message);
        });
    }
    return pool;
}

/**
 * For critical one-shot operations (e.g. registration) use a fresh Client
 * so we are never blocked by stale pool connections.
 */
export async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 8000,
    });
    await client.connect();
    try {
        return await fn(client);
    } finally {
        await client.end();
    }
}

export function createAdminClient() {
    return getPool();
}

export default getPool();

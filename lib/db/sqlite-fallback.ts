/**
 * SQLite fallback using better-sqlite3
 * Used when Prisma client cannot initialize (offline environment)
 */
import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

function generateCuid() {
  return `c${randomBytes(12).toString('base64url')}`;
}

export class SQLiteFallback {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  close() {
    this.db.close();
  }

  // User operations
  async createOrUpdateUser(data: {
    storeId: string;
    storeName: string;
    email?: string;
    name?: string;
  }) {
    const existing = this.db
      .prepare('SELECT * FROM User WHERE storeId = ?')
      .get(data.storeId) as any;

    if (existing) {
      // Update
      this.db
        .prepare(
          'UPDATE User SET storeName = ?, email = ?, name = ?, updatedAt = ? WHERE id = ?'
        )
        .run(
          data.storeName,
          data.email || null,
          data.name || data.storeName,
          new Date().toISOString(),
          existing.id
        );
      return existing.id;
    } else {
      // Create
      const id = generateCuid();
      this.db
        .prepare(
          'INSERT INTO User (id, storeId, storeName, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          id,
          data.storeId,
          data.storeName,
          data.email || null,
          data.name || data.storeName,
          new Date().toISOString(),
          new Date().toISOString()
        );
      return id;
    }
  }

  // Account operations
  async createOrUpdateAccount(data: {
    userId: string;
    provider: string;
    providerAccountId: string;
    accessToken: string;
    tokenType?: string;
    scope?: string;
  }) {
    const existing = this.db
      .prepare(
        'SELECT * FROM Account WHERE provider = ? AND providerAccountId = ?'
      )
      .get(data.provider, data.providerAccountId) as any;

    if (existing) {
      // Update
      this.db
        .prepare('UPDATE Account SET access_token = ? WHERE id = ?')
        .run(data.accessToken, existing.id);
      return existing.id;
    } else {
      // Create
      const id = generateCuid();
      this.db
        .prepare(
          'INSERT INTO Account (id, userId, type, provider, providerAccountId, access_token, token_type, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          id,
          data.userId,
          'oauth',
          data.provider,
          data.providerAccountId,
          data.accessToken,
          data.tokenType || 'bearer',
          data.scope || null
        );
      return id;
    }
  }

  // Settings operations
  async createOrUpdateSettings(
    userId: string,
    data: {
      tiendaNubeFeePercentage?: number;
      defaultAdvertisingCost?: number;
      syncEnabled?: boolean;
      webhooksRegistered?: boolean;
    }
  ) {
    const existing = this.db
      .prepare('SELECT * FROM Settings WHERE userId = ?')
      .get(userId) as any;

    if (existing) {
      // Update
      const updates: string[] = [];
      const values: any[] = [];

      if (data.tiendaNubeFeePercentage !== undefined) {
        updates.push('tiendaNubeFeePercentage = ?');
        values.push(data.tiendaNubeFeePercentage);
      }
      if (data.defaultAdvertisingCost !== undefined) {
        updates.push('defaultAdvertisingCost = ?');
        values.push(data.defaultAdvertisingCost);
      }
      if (data.syncEnabled !== undefined) {
        updates.push('syncEnabled = ?');
        values.push(data.syncEnabled ? 1 : 0);
      }
      if (data.webhooksRegistered !== undefined) {
        updates.push('webhooksRegistered = ?');
        values.push(data.webhooksRegistered ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push('updatedAt = ?');
        values.push(new Date().toISOString());
        values.push(existing.id);

        this.db
          .prepare(`UPDATE Settings SET ${updates.join(', ')} WHERE id = ?`)
          .run(...values);
      }
      return existing.id;
    } else {
      // Create
      const id = generateCuid();
      this.db
        .prepare(
          'INSERT INTO Settings (id, userId, tiendaNubeFeePercentage, defaultAdvertisingCost, syncEnabled, webhooksRegistered, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          id,
          userId,
          data.tiendaNubeFeePercentage || 3.0,
          data.defaultAdvertisingCost || 0,
          data.syncEnabled ? 1 : 0,
          data.webhooksRegistered ? 1 : 0,
          new Date().toISOString(),
          new Date().toISOString()
        );
      return id;
    }
  }

  // Get user by storeId
  getUserByStoreId(storeId: string) {
    return this.db
      .prepare('SELECT * FROM User WHERE storeId = ?')
      .get(storeId);
  }

  // Get account
  getAccount(provider: string, providerAccountId: string) {
    return this.db
      .prepare(
        'SELECT * FROM Account WHERE provider = ? AND providerAccountId = ?'
      )
      .get(provider, providerAccountId);
  }
}

// Singleton instance
let dbInstance: SQLiteFallback | null = null;

export function getDB() {
  if (!dbInstance) {
    const dbPath = `${process.cwd()}/prisma/dev.db`;
    dbInstance = new SQLiteFallback(dbPath);
  }
  return dbInstance;
}

import { and, eq, isNull } from 'drizzle-orm';
import type { DatabaseExecutor } from '../db/client';
import { NewRefreshToken, RefreshToken, refreshTokens } from '../db/schema';

export async function createRefreshToken(
  db: DatabaseExecutor,
  values: NewRefreshToken
): Promise<RefreshToken> {
  const [record] = await db.insert(refreshTokens).values(values).returning();
  return record;
}

export async function findRefreshTokenByHash(
  db: DatabaseExecutor,
  tokenHash: string
): Promise<RefreshToken | undefined> {
  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);
  return record;
}

export async function revokeRefreshTokenIfActive(
  db: DatabaseExecutor,
  tokenHash: string,
  revokedAt: Date
): Promise<string | undefined> {
  const [record] = await db
    .update(refreshTokens)
    .set({ revokedAt, lastUsedAt: revokedAt })
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
    .returning({ id: refreshTokens.id });

  return record?.id;
}

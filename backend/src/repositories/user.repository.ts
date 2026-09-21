import { eq } from 'drizzle-orm';
import type { DatabaseExecutor } from '../db/client';
import { NewUser, User, users } from '../db/schema';

export async function createUser(db: DatabaseExecutor, values: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(values).returning();
  return user;
}

export async function findUserByEmail(
  db: DatabaseExecutor,
  email: string
): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function findUserById(db: DatabaseExecutor, id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

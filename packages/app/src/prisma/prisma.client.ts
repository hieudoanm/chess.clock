import { PrismaClient } from '@chess/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

let prismaClient: PrismaClient | undefined;

export const getPrismaClient = (): PrismaClient => {
  if (prismaClient) return prismaClient;
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? 'file:./prisma/chess.db',
  });
  prismaClient = new PrismaClient({ adapter });
  return prismaClient;
};

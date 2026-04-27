import { PrismaClient } from '@chess/generated/prisma/client';

export let prismaClient = new PrismaClient({ adapter: 'sqlite' });

export const getPrismaClient = (): PrismaClient => {
  if (prismaClient !== undefined) return prismaClient;
  prismaClient = new PrismaClient({ adapter: 'sqlite' });
  return prismaClient;
};

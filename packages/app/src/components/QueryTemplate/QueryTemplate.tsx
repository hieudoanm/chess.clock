import { TRPCClientErrorBase } from '@trpc/client';
import { DefaultErrorShape } from '@trpc/server/unstable-core-do-not-import';
import { FC, ReactNode } from 'react';

export const QueryTemplate: FC<{
  isPending: boolean;
  error: Error | TRPCClientErrorBase<DefaultErrorShape> | null;
  noData: boolean;
  children: ReactNode;
}> = ({ children = <></> }) => {
  return <>{children}</>;
};

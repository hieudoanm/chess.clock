import { ReactNode } from 'react';

export type CardHeadingProperties = { children?: ReactNode };

export const CardHeading: React.FC<CardHeadingProperties> = ({
  children = <></>,
}) => {
  return <div className="text-base md:text-lg lg:text-xl">{children}</div>;
};

CardHeading.displayName = 'CardHeading';

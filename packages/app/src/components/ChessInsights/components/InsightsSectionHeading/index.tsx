import { ReactNode } from 'react';

export type SectionHeadingProperties = { children?: ReactNode };

export const SectionHeading: React.FC<SectionHeadingProperties> = ({
  children = <></>,
}) => {
  return <div className="text-lg md:text-xl lg:text-2xl">{children}</div>;
};

SectionHeading.displayName = 'SectionHeading';

import type { ReactNode } from 'react';
import NextLink from 'next/link';

export function Link({
  children,
  prefetch = false,
  ...props
}: {
  href: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
}) {
  return (
    <NextLink prefetch={prefetch} {...props}>
      {children}
    </NextLink>
  );
}

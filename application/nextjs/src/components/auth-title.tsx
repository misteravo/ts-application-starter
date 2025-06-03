import { CardTitle, cn } from '@acme/ui';
import type { ReactNode } from 'react';

export function AuthTitle(props: { children: ReactNode; className?: string }) {
  return <CardTitle className={cn('text-center text-xl font-semibold', props.className)}>{props.children}</CardTitle>;
}

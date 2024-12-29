import { Card, CardTitle, cn } from '@acme/ui';
import type { ReactNode } from 'react';

export function AuthLayout(props: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">{props.children}</Card>
    </div>
  );
}

export function AuthTitle(props: { children: ReactNode; className?: string }) {
  return <CardTitle className={cn('text-center text-2xl', props.className)}>{props.children}</CardTitle>;
}

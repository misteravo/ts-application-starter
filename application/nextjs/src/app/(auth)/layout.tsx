import { Card, ThemeToggle } from '@acme/ui';
import { Shield } from 'lucide-react';
import type { ReactNode } from 'react';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function AuthLayout(props: { children: ReactNode }) {
  const tr = await getTranslate(translations);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(148, 163, 184, 0.2) 2px, transparent 0)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Brand Section */}
          <div className="text-center">
            <div className="flex justify-center">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{tr('SecureAuth')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tr('Secure authentication platform')}</p>
          </div>

          {/* Main Card */}
          <Card className="bg-background/95 border-2 shadow-xl backdrop-blur-sm">{props.children}</Card>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
    </div>
  );
}

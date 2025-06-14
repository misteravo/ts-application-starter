import { globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardDescription, CardHeader } from '@acme/ui';
import { Link } from '~/components/link';
import { AuthTitle } from '~/components/auth-title';
import { ForgotPasswordForm } from './components';
import { getTranslate } from '~/lib/translate';
import { translations } from './translations';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  const tr = await getTranslate(translations);

  return (
    <>
      <CardHeader>
        <AuthTitle className="text-left">{tr('Forgot your password?')}</AuthTitle>
        <CardDescription>
          {tr("Enter your email address and we'll send you a link to reset your password.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <div className="mt-4">
          <Link href="/sign-in">
            <Button variant="link" className="w-full">
              {tr('Back to Sign in')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </>
  );
}

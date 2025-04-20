import { globalGETRateLimit } from '@acme/backend';
import { Button, CardContent, CardDescription, CardHeader } from '@acme/ui';
import { Link } from '~/components/link';
import { AuthLayout, AuthTitle } from '~/modules/auth/components/layout';
import { ForgotPasswordForm } from './components';

export default async function Page() {
  if (!(await globalGETRateLimit())) return 'Too many requests';

  return (
    <AuthLayout>
      <CardHeader>
        <AuthTitle className="text-left">Forgot your password?</AuthTitle>
        <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <div className="mt-4">
          <Link href="/sign-in">
            <Button variant="link" className="w-full">
              Back to Sign in
            </Button>
          </Link>
        </div>
      </CardContent>
    </AuthLayout>
  );
}

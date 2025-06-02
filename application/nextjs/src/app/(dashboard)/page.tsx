import { getCurrentSession, getUserPasskeyCredentials, getUserSecurityKeyCredentials } from '@acme/backend';
import { get2FARedirect } from '@acme/backend';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback, Button } from '@acme/ui';
import { Link } from '~/components/link';
import {
  Shield,
  Key,
  Mail,
  Settings,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  Users,
  Lock,
} from 'lucide-react';

export default async function DashboardPage() {
  const { session, user } = await getCurrentSession();
  if (!session) return redirect('/sign-in');
  if (user.registered2FA && !session.twoFactorVerified) {
    return redirect(get2FARedirect(user));
  }

  // Get security info for dashboard
  const passkeyCredentials = await getUserPasskeyCredentials(user.id);
  const securityKeyCredentials = await getUserSecurityKeyCredentials(user.id);

  // Calculate security score
  const securityFeatures = [
    user.emailVerified,
    user.registered2FA,
    user.registeredTOTP,
    passkeyCredentials.length > 0,
    securityKeyCredentials.length > 0,
  ];
  const securityScore = Math.round((securityFeatures.filter(Boolean).length / securityFeatures.length) * 100);

  // Get user initials for avatar
  const initials =
    user.email
      .split('@')[0]
      ?.split(/[^a-zA-Z]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') ?? '';

  const currentTime = new Date();
  const greeting =
    currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting}, {user.email.split('@')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Welcome back to your dashboard. Here's what's happening with your account.
          </p>
        </div>
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
        </Avatar>
      </div>

      {/* Security Alert */}
      {!user.registered2FA && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-800">Enhance Your Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-orange-700">
              Your account security can be improved. Enable two-factor authentication to better protect your account.
            </p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/2fa/totp/setup">
                <Shield className="mr-2 h-4 w-4" />
                Set up 2FA
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <p className="text-xs text-muted-foreground">
              {securityScore >= 80 ? 'Excellent security' : securityScore >= 60 ? 'Good security' : 'Needs improvement'}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  securityScore >= 80 ? 'bg-green-500' : securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${securityScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passkeys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passkeyCredentials.length}</div>
            <p className="text-xs text-muted-foreground">Active passkey{passkeyCredentials.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Keys</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityKeyCredentials.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered security key{securityKeyCredentials.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Manage Account Settings
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>

            {!user.registeredTOTP && (
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/2fa/totp/setup">
                  <Shield className="mr-2 h-4 w-4" />
                  Set up Authenticator App
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            )}

            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/2fa/passkey/register">
                <Key className="mr-2 h-4 w-4" />
                Add New Passkey
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/2fa/security-key/register">
                <Lock className="mr-2 h-4 w-4" />
                Register Security Key
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{user.email}</span>
                {user.emailVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Two-Factor Auth</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{user.registered2FA ? 'Enabled' : 'Disabled'}</span>
                {user.registered2FA ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">WebAuthn Credentials</span>
              </div>
              <span className="text-sm font-medium">
                {passkeyCredentials.length + securityKeyCredentials.length} total
              </span>
            </div>

            <div className="border-t pt-4">
              <Button asChild variant="link" className="w-full p-0">
                <Link href="/settings">
                  View All Settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

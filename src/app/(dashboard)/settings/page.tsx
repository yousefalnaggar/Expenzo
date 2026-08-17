import { getUserPreferredCurrency, getUserProfile } from "@/lib/dal/users";
import { CurrencyForm } from "@/components/settings/currency-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const [currency, profile] = await Promise.all([getUserPreferredCurrency(), getUserProfile()]);

  if (profile.isDemo) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <div className="bg-accent text-accent-foreground rounded-lg p-3 text-sm">
          This is a demo account - settings can&apos;t be changed here so everyone trying the demo
          sees the same thing.
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Account</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <UserAvatar name={profile.name} image={profile.image} size="lg" />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{profile.name}</span>
              <span className="text-muted-foreground">{profile.email}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Currency: <span className="font-medium">{currency}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            name={profile.name ?? ""}
            email={profile.email}
            image={profile.image}
            hasPassword={profile.hasPassword}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Password</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.hasPassword ? (
            <PasswordForm />
          ) : (
            <p className="text-muted-foreground text-sm">
              Signed in with Google - no password to change.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyForm currentCurrency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}

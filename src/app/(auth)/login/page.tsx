import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to Expenzo</CardTitle>
        <CardDescription>Track your spending in one place.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LoginForm />
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="bg-border h-px flex-1" />
          or
          <span className="bg-border h-px flex-1" />
        </div>
        <GoogleSignInButton />
      </CardContent>
      <CardFooter className="text-muted-foreground justify-center text-sm">
        Don&apos;t have an account?&nbsp;
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Register
        </Link>
      </CardFooter>
    </Card>
  );
}

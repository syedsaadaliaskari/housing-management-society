"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const result = (await signIn("credentials", {
      email,
      password,
      redirect: false,
    })) as { error?: string } | undefined;

    if (result?.error) {
      setFormError("Invalid email or password");
      setIsSubmitting(false);
      return;
    }

    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = (session?.user as any)?.role;

      if (role === "RESIDENT") {
        router.push("/resident");
      } else {
        router.push("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorMessage =
    formError || (urlError ? "Invalid email or password" : null);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription>
            Log in to manage your housing society.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


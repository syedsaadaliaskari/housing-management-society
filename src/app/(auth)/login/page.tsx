"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Building2 } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setFormError("Invalid email or password. Please try again.");
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
    formError || (urlError ? "Invalid email or password." : null);

  return (
    <div className="min-h-screen flex">
      {/* LEFT BRANDING PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Building2 size={22} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">HSMS</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Housing Society
            <br />
            Management System
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            A unified platform for society administrators and residents to
            manage bills, complaints, notices, and emergencies.
          </p>
          <div className="space-y-3">
            {[
              "Manage members and units",
              "Track bills and payments",
              "Handle complaints and SOS alerts",
              "Polls, notices and announcements",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-sm text-primary-foreground/80">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-foreground/50">
          © 2026 Housing Society Management System. Final Year Project.
        </p>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex lg:hidden items-center gap-3">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 size={20} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">HSMS</p>
              <p className="text-xs text-muted-foreground">
                Housing Society Management
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                <span>⚠</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              New resident?{" "}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Create account
              </Link>
            </p>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

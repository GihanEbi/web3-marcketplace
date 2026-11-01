"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoAccounts } from "@/components/auth/demo-accounts";
import { ROLE_HOME } from "@/config/nav";
import { loginWithEmail } from "@/services";

const schema = z.object({
  email: z.string().min(1, "E-mail is required").email("Enter a valid e-mail address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const user = await loginWithEmail(values.email, values.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext ?? ROLE_HOME[user.role]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-border/60 bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Log in to continue your Web3 career journey.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try a demo account — one click</p>
          <DemoAccounts next={next} />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <p className="relative mx-auto w-fit bg-card px-3 text-xs text-muted-foreground">or sign in with e-mail</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="aria.chen@example.com" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" placeholder="Any password works in the demo" aria-invalid={!!errors.password} {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />} Log in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to Chainhire?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted-foreground/80">
          Demo only — no real authentication. Any demo e-mail with any password signs in; data lives in your browser.
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-lg animate-pulse rounded-xl bg-muted/40" />}>
      <LoginForm />
    </Suspense>
  );
}

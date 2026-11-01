"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_HOME } from "@/config/nav";
import { cn } from "@/lib/utils";
import { registerUser } from "@/services";

const schema = z
  .object({
    role: z.enum(["seeker", "employer"]),
    name: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "E-mail is required").email("Enter a valid e-mail address"),
    password: z.string().min(8, "Use at least 8 characters"),
    companyName: z.string().optional(),
    terms: z.boolean().refine((v) => v, "Please accept the terms to continue"),
  })
  .refine((v) => v.role !== "employer" || (v.companyName && v.companyName.trim().length >= 2), {
    path: ["companyName"],
    message: "Enter your company or DAO name",
  });
type FormValues = z.infer<typeof schema>;

const ROLES = [
  { value: "seeker" as const, label: "I'm looking for work", hint: "Jobs, freelance & bounties", icon: User },
  { value: "employer" as const, label: "I'm hiring", hint: "Post jobs & manage talent", icon: Briefcase },
];

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "seeker", name: "", email: "", password: "", companyName: "", terms: false },
  });
  const role = useWatch({ control, name: "role" });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const user = await registerUser({
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        companyName: values.companyName?.trim(),
      });
      toast.success("Account created", { description: "Welcome to Chainhire! (demo account stored in your browser)" });
      router.push(ROLE_HOME[user.role]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create account");
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-border/60 bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Join the AI-powered marketplace for Web3 talent.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Account type</legend>
                {ROLES.map(({ value, label, hint, icon: Icon }) => {
                  const active = field.value === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                        active ? "border-primary bg-primary/10" : "hover:border-primary/40",
                      )}
                    >
                      <input type="radio" className="sr-only" name={field.name} value={value} checked={active} onChange={() => field.onChange(value)} />
                      <Icon className={cn("mt-0.5 size-5", active ? "text-primary" : "text-muted-foreground")} />
                      <span>
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="block text-xs text-muted-foreground">{hint}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" placeholder="Aria Chen" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {role === "employer" && (
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company / DAO name</Label>
              <Input id="companyName" placeholder="Nimbus Labs" aria-invalid={!!errors.companyName} {...register("companyName")} />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">E-mail</Label>
            <Input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <Input id="reg-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <div className="space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <Checkbox id="terms" checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} aria-invalid={!!errors.terms} />
                  <Label htmlFor="terms" className="text-sm font-normal leading-snug text-muted-foreground">
                    I understand this is a demo and agree to the (fictional) terms of service.
                  </Label>
                </div>
                {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
              </div>
            )}
          />

          <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />} Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

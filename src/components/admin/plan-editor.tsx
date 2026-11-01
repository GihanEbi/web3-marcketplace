"use client";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateAdminSettings } from "@/services";
import { useAppStore } from "@/store/app-store";
import type { PlanConfig } from "@/types";

const planSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(30, "Keep the name under 30 characters"),
  priceMonthly: z
    .number({ error: "Enter a valid monthly price" })
    .min(0, "Price cannot be negative")
    .max(10000, "Price must be under $10,000"),
  description: z
    .string()
    .trim()
    .min(5, "Describe the plan in at least 5 characters")
    .max(160, "Keep the description under 160 characters"),
  highlighted: z.boolean(),
  features: z
    .array(
      z.object({
        value: z.string().trim().min(1, "Feature cannot be empty").max(80, "Keep features under 80 characters"),
      }),
    )
    .min(1, "Add at least one feature")
    .max(12, "A plan can list at most 12 features"),
});

type PlanFormValues = z.infer<typeof planSchema>;

function toFormValues(plan: PlanConfig): PlanFormValues {
  return {
    name: plan.name,
    priceMonthly: plan.priceMonthly,
    description: plan.description,
    highlighted: Boolean(plan.highlighted),
    features: plan.features.map((value) => ({ value })),
  };
}

export function PlanEditor({ plan }: { plan: PlanConfig }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: toFormValues(plan),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "features" });
  const idPrefix = `plan-${plan.id}`;

  async function onSubmit(values: PlanFormValues) {
    try {
      const latest = useAppStore.getState().adminSettings.plans;
      const next = latest.map((p) => {
        if (p.id === plan.id) {
          return {
            ...p,
            name: values.name,
            priceMonthly: values.priceMonthly,
            description: values.description,
            highlighted: values.highlighted,
            features: values.features.map((f) => f.value),
          };
        }
        // only one plan is highlighted at a time
        return values.highlighted ? { ...p, highlighted: false } : p;
      });
      await updateAdminSettings({ plans: next });
      reset(values);
      toast.success(`${values.name} plan saved.`, {
        description: values.highlighted ? "It is now the highlighted plan on the pricing page." : undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the plan.");
    }
  }

  const featuresError = errors.features?.message ?? errors.features?.root?.message;

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={`${plan.name} plan configuration`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{plan.name}</span>
            <span className="text-xs font-normal text-muted-foreground">ID: {plan.id}</span>
          </CardTitle>
          <CardDescription>Edit what customers see on the pricing page.</CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-name`}>Plan name</Label>
              <Input
                id={`${idPrefix}-name`}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
                {...register("name")}
              />
              {errors.name && (
                <p id={`${idPrefix}-name-error`} className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-price`}>Price / month (USD)</Label>
              <Input
                id={`${idPrefix}-price`}
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                aria-invalid={Boolean(errors.priceMonthly)}
                aria-describedby={errors.priceMonthly ? `${idPrefix}-price-error` : undefined}
                {...register("priceMonthly", { valueAsNumber: true })}
              />
              {errors.priceMonthly && (
                <p id={`${idPrefix}-price-error`} className="text-xs text-destructive">
                  {errors.priceMonthly.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-description`}>Description</Label>
            <Textarea
              id={`${idPrefix}-description`}
              rows={2}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? `${idPrefix}-description-error` : undefined}
              {...register("description")}
            />
            {errors.description && (
              <p id={`${idPrefix}-description-error`} className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-medium">Features</legend>
            <ul className="space-y-2">
              {fields.map((field, index) => {
                const fieldError = errors.features?.[index]?.value;
                return (
                  <li key={field.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        aria-label={`${plan.name} feature ${index + 1}`}
                        aria-invalid={Boolean(fieldError)}
                        {...register(`features.${index}.value` as const)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove feature ${index + 1}`}
                        onClick={() => remove(index)}
                      >
                        <X aria-hidden />
                      </Button>
                    </div>
                    {fieldError && <p className="text-xs text-destructive">{fieldError.message}</p>}
                  </li>
                );
              })}
            </ul>
            {featuresError && <p className="text-xs text-destructive">{featuresError}</p>}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
              <Plus aria-hidden /> Add feature
            </Button>
          </fieldset>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label htmlFor={`${idPrefix}-highlight`} className="text-sm">
                Highlight this plan
              </Label>
              <p className="text-xs text-muted-foreground">
                Shows a &quot;most popular&quot; style emphasis. Only one plan can be highlighted.
              </p>
            </div>
            <Controller
              control={control}
              name="highlighted"
              render={({ field }) => (
                <Switch
                  id={`${idPrefix}-highlight`}
                  aria-label={`Highlight the ${plan.name} plan`}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!isDirty || isSubmitting}
              onClick={() => reset(toFormValues(plan))}
            >
              Discard
            </Button>
            <Button type="submit" variant="gradient" size="sm" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              Save plan
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

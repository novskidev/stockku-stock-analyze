import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/75 p-4 shadow-sm sm:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(44,230,183,0.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(88,199,255,0.16),transparent_42%)] opacity-80" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-secondary/60 shadow-inner sm:h-12 sm:w-12">
              {icon}
            </div>
          ) : null}
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
            {meta ? (
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground sm:text-xs">
                {meta}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden transition-all",
  {
    variants: {
      variant: {
        default: "rounded-full bg-secondary",
        retro:
          "border-2 border-foreground bg-muted p-0.5 shadow-[2px_2px_0px_0px_currentColor]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  progressBg?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      progressBg = "bg-primary",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(progressVariants({ variant }), className)}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            progressBg,
            variant === "retro" && "relative overflow-hidden"
          )}
          style={{ width: `${percentage}%` }}
        >
          {variant === "retro" && (
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.3) 6px, rgba(0,0,0,0.3) 8px)",
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export default Progress;

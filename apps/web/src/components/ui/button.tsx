"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center rounded-pill font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-matcha-300 shadow-soft disabled:opacity-60 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-matcha-400 text-white hover:bg-matcha-500 hover:shadow-lift",
        secondary: "bg-matcha-100 text-ink-800 hover:bg-matcha-200",
        ghost: "bg-transparent text-ink-600 hover:bg-matcha-100",
        outline: "bg-white text-ink-800 border border-[var(--border)] hover:bg-matcha-50",
      },
      size: {
        sm: "h-10 px-5 text-sm",
        md: "h-12 px-6",
        lg: "h-14 px-8 text-[17px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
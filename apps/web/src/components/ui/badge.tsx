import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  // base
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 gap-1",
  // accessibility + transitions
  "outline-none transition-[color,background,border,box-shadow] duration-150",
  // focus & invalid rings use theme tokens
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:    "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:  "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:"border-transparent bg-destructive text-white hover:bg-destructive/90",
        outline:    "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        subtle:     "border border-border bg-card/70 text-foreground", // extra pill for tags
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
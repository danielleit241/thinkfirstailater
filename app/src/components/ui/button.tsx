import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-[transform,background-color,color,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--electric)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cloud)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--horizon)] text-white shadow-[0_6px_8px_rgba(7,95,216,.18)] hover:bg-[var(--horizon-deep)]",
        outline:
          "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--horizon)] hover:bg-[var(--seedling-soft)]",
        ghost:
          "text-[var(--ink-muted)] hover:bg-[var(--seedling-soft)] hover:text-[var(--ink)]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
)

function Button({
  className,
  variant,
  ref,
  ...props
}: React.ComponentPropsWithRef<"button"> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-[transform,background-color,color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--signal-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--midnight)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--insight-orange)] text-[var(--midnight)] shadow-[0_8px_24px_rgba(255,121,0,.24)] hover:bg-[var(--warm-light)]",
        outline:
          "border border-white/20 bg-white/5 text-white backdrop-blur hover:border-white/40 hover:bg-white/10",
        ghost: "text-white/70 hover:bg-white/8 hover:text-white",
      },
    },
    defaultVariants: { variant: "primary" },
  },
)

function Button({
  className,
  variant,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  )
}

export { Button, buttonVariants }

import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] outline-none transition-colors focus-visible:border-[var(--signal)] focus-visible:ring-2 focus-visible:ring-[var(--signal)]/25 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Input }

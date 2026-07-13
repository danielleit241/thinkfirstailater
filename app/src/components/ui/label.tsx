import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-2 block text-sm font-semibold text-white/85",
        className,
      )}
      {...props}
    />
  )
}

export { Label }

import type * as React from "react"
import { cn } from "@/lib/utils"

interface AlertProps extends React.ComponentProps<"div"> {
  variant?: "default" | "destructive"
}

function Alert({ className, variant = "default", ...props }: AlertProps) {
  const baseClasses = "relative w-full rounded-lg border p-4"

  const variantClasses = {
    default: "bg-background text-foreground",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  }

  return <div role="alert" className={cn(baseClasses, variantClasses[variant], className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }

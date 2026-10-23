import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-terracotta-600 text-boho-bg shadow-2xs",
        secondary:
          "border-boho-border bg-boho-surface text-boho-text",
        destructive:
          "border-transparent bg-red-700 text-white shadow-2xs",
        outline: "text-boho-text border-boho-border",
        urgent: "border-red-300 bg-red-100/90 text-red-900 font-bold animate-pulse shadow-xs",
        warning: "border-amber-300 bg-amber-100 text-amber-900 font-semibold",
        success: "border-sage-200 bg-sage-100 text-sage-700 font-semibold",
        sage: "border-sage-200 bg-sage-50 text-sage-600 font-medium",
        clay: "border-terracotta-200 bg-terracotta-100 text-terracotta-700 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

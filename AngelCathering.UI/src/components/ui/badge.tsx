import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#9E5134] text-[#FAF7F2] shadow-2xs",
        secondary:
          "border-[#D8CEBF] bg-[#EFEAE1] text-[#3D2E26]",
        destructive:
          "border-transparent bg-red-700 text-white shadow-2xs",
        outline: "text-[#3D2E26] border-[#D8CEBF]",
        urgent: "border-red-300 bg-red-100/90 text-red-900 font-bold animate-pulse shadow-xs",
        warning: "border-amber-300 bg-amber-100 text-amber-900 font-semibold",
        success: "border-[#AEC3A7] bg-[#E5EDE2] text-[#40543B] font-semibold",
        sage: "border-[#CAD6C6] bg-[#EDF3EB] text-[#4D6049] font-medium",
        clay: "border-[#E8C2B3] bg-[#FAECE7] text-[#8C3E21] font-medium",
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

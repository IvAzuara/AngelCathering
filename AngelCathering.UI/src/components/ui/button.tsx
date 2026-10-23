import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#9E5134] text-[#FAF7F2] shadow-xs hover:bg-[#854229]",
        terracotta:
          "bg-[#B85D3B] text-white shadow-xs hover:bg-[#9E4D2D]",
        sage:
          "bg-[#687B62] text-white shadow-xs hover:bg-[#566751]",
        destructive:
          "bg-red-700 text-white shadow-xs hover:bg-red-800",
        outline:
          "border border-[#D8CEBF] bg-[#FAF7F2] text-[#3D2E26] shadow-2xs hover:bg-[#EFEAE1] hover:border-[#C4B7A5]",
        secondary:
          "bg-[#EFEAE1] text-[#3D2E26] hover:bg-[#E5DDCF]",
        ghost: "hover:bg-[#EFEAE1] text-[#3D2E26]",
        link: "text-[#9E5134] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-xl px-7 text-base font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

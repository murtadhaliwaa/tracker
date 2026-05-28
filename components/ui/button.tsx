import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none rpg-interactive focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-rpg-gold text-rpg-page hover:bg-rpg-gold/90",
        outline:
          "border-rpg-border bg-transparent text-rpg-muted hover:bg-white/[0.04] hover:text-rpg-text",
        secondary:
          "border-rpg-border bg-transparent text-rpg-muted hover:bg-white/[0.04] hover:text-rpg-text",
        success:
          "border-transparent bg-rpg-success text-white hover:bg-rpg-success/90",
        destructive:
          "border-rpg-danger bg-transparent text-rpg-danger hover:bg-rpg-danger/10",
        ghost:
          "border-transparent bg-transparent text-rpg-muted hover:bg-white/[0.04] hover:text-rpg-text",
        link: "border-transparent text-rpg-gold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-lg px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonPrimitive.Props & VariantProps<typeof buttonVariants>
>(function Button({ className, variant = "default", size = "default", ...props }, ref) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }

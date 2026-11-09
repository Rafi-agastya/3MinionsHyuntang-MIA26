import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-akar-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-akar-primary text-white shadow-sm hover:bg-akar-primary-hover active:bg-akar-primary-hover",
        earth:
          "bg-akar-earth text-white shadow-sm hover:bg-akar-earth-hover active:bg-akar-earth-hover",
        accent:
          "bg-akar-accent text-akar-ink font-semibold shadow-sm hover:bg-akar-accent-hover active:bg-akar-accent-hover",
        outline:
          "border border-akar-border bg-white text-akar-ink hover:bg-akar-primary-light/50 hover:border-akar-primary/30",
        secondary:
          "bg-akar-earth-light text-akar-earth hover:bg-akar-earth-light/80 border border-akar-earth/20",
        ghost:
          "text-akar-ink hover:bg-akar-primary-light/60 hover:text-akar-primary",
        link: "text-akar-primary underline-offset-4 hover:underline",
        danger:
          "bg-akar-danger text-white hover:opacity-90 active:opacity-100",
      },
      size: {
        default: "min-h-[44px] h-11 px-5 py-2.5",
        sm: "min-h-[36px] h-9 px-3.5 text-xs rounded-md",
        lg: "min-h-[48px] h-12 px-7 text-base rounded-xl font-semibold",
        icon: "min-h-[44px] min-w-[44px] h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild: _asChild, ...props }, ref) => {
    void _asChild;
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

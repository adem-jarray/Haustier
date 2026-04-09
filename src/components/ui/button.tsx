import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold",
    "ring-offset-background",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "transition-all duration-200 ease-out",
    "relative overflow-hidden select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_2px_8px_hsl(163_40%_25%/0.28),0_1px_2px_hsl(163_40%_25%/0.16)]",
          "hover:-translate-y-0.5 hover:bg-primary/90",
          "hover:shadow-[0_4px_16px_hsl(163_40%_25%/0.34),0_2px_4px_hsl(163_40%_25%/0.18)]",
          "active:translate-y-0 active:scale-[0.98]",
          "active:shadow-[0_1px_4px_hsl(163_40%_25%/0.22)]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-[0_2px_8px_hsl(0_70%_40%/0.22)]",
          "hover:-translate-y-0.5 hover:bg-destructive/90",
          "hover:shadow-[0_4px_14px_hsl(0_70%_40%/0.30)]",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),
        outline: [
          "border border-border bg-white text-foreground",
          "hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:bg-primary/4",
          "hover:shadow-[0_2px_10px_hsl(163_40%_25%/0.10)]",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-[0_2px_8px_hsl(38_65%_40%/0.22)]",
          "hover:-translate-y-0.5 hover:bg-secondary/88",
          "hover:shadow-[0_4px_14px_hsl(38_65%_35%/0.28)]",
          "active:translate-y-0 active:scale-[0.98]",
        ].join(" "),
        ghost: [
          "hover:bg-primary/8 hover:text-primary",
          "active:scale-[0.97]",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-9 px-4 text-xs rounded-lg",
        lg:      "h-12 px-8 text-base rounded-xl",
        icon:    "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-[transform,opacity,background-color] duration-150 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        chili: "bg-chili text-raised shadow-card hover:bg-chili-press",
        leaf: "bg-leaf text-raised hover:opacity-90",
        outline: "border border-line bg-raised text-ink hover:bg-bg",
        ghost: "text-ink hover:bg-line/60",
        sold: "bg-sold text-raised",
        danger: "bg-ink text-raised hover:opacity-90",
      },
      size: {
        default: "h-12 px-5 text-base",
        sm: "h-10 px-3 text-sm",
        lg: "h-14 px-6 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "chili",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

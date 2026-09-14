import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-md border border-line bg-raised px-4 text-base text-ink placeholder:text-faint outline-none transition-[box-shadow,border-color] duration-150 focus:border-ink/30 focus:ring-2 focus:ring-chili/25",
        className,
      )}
      {...props}
    />
  );
}

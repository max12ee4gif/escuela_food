import "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatMoney(cents) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0
	}).format(cents / 100);
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-[transform,opacity,background-color] duration-150 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]", {
	variants: {
		variant: {
			chili: "bg-chili text-raised shadow-card hover:bg-chili-press",
			leaf: "bg-leaf text-raised hover:opacity-90",
			outline: "border border-line bg-raised text-ink hover:bg-bg",
			ghost: "text-ink hover:bg-line/60",
			sold: "bg-sold text-raised",
			danger: "bg-ink text-raised hover:opacity-90"
		},
		size: {
			default: "h-12 px-5 text-base",
			sm: "h-10 px-3 text-sm",
			lg: "h-14 px-6 text-lg",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "chili",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-12 w-full rounded-md border border-line bg-raised px-4 text-base text-ink placeholder:text-faint outline-none transition-[box-shadow,border-color] duration-150 focus:border-ink/30 focus:ring-2 focus:ring-chili/25", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-sm font-medium text-muted", className),
		...props
	});
}
//#endregion
export { formatMoney as i, Input as n, Label as r, Button as t };

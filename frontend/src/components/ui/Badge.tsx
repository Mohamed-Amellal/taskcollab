import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "secondary" | "outline" | "success" | "warning";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = "", variant = "default", ...props }, ref) => {
        const variants = {
            default: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80",
            secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80",
            outline: "text-zinc-950 border-zinc-200",
            success: "border-transparent bg-green-100 text-green-700",
            warning: "border-transparent bg-amber-100 text-amber-700",
        };

        return (
            <span
                ref={ref}
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 ${variants[variant]} ${className}`}
                {...props}
            />
        );
    }
);

Badge.displayName = "Badge";

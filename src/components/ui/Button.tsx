import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-accent text-white hover:bg-accent-hover": variant === "primary",
          "bg-surface-overlay text-foreground hover:bg-surface-raised border border-gray-700":
            variant === "secondary",
          "text-muted-foreground hover:text-foreground hover:bg-surface-overlay":
            variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

const SIZES = {
  sm: "size-8 text-xs",
  lg: "size-16 text-xl",
};

export function UserAvatar({
  name,
  image,
  size = "sm",
  className,
}: {
  name: string | null;
  image: string | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URLs, not worth a next/image remotePatterns entry
      <img
        src={image}
        alt={name ? `${name}'s avatar` : "User avatar"}
        className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-medium",
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

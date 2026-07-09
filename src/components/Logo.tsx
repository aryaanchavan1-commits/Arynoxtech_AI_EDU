export function Logo({ size = "md", showTagline = false, name, tagline }: { size?: "sm" | "md" | "lg"; showTagline?: boolean; name?: string; tagline?: string }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" };
  const display = name || "Arynox-EDU";
  return (
    <div className="flex items-center gap-2">
      <div className={`${size === "lg" ? "w-10 h-10" : size === "sm" ? "w-6 h-6" : "w-8 h-8"} rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-white ${size === "lg" ? "text-lg" : "text-xs"}`}>
        {display.charAt(0)}
      </div>
      <div>
        <span className={`font-bold tracking-tight ${sizes[size]} text-gradient`}>{display}</span>
        {showTagline && <p className="text-xs text-zinc-500 -mt-0.5">{tagline || "Learn Without Limits"}</p>}
      </div>
    </div>
  );
}
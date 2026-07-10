import Image from "next/image";

const FALLBACK = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80";

export function AppImage({ src, alt, className, priority }: { src?: string | null; alt: string; className?: string; priority?: boolean }) {
  return (
    <Image
      src={src || FALLBACK}
      alt={alt}
      className={className}
      priority={priority}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

export function PixelFace({ small = false }: { small?: boolean }) {
  const size = small ? "h-7 w-9" : "h-9 w-12";
  return (
    <span className={`relative inline-grid ${size} shrink-0 place-items-center border-2 border-lime-300 text-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.45)]`} aria-hidden>
      <span className="absolute left-1 top-1 h-1.5 w-1.5 bg-lime-300" />
      <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-lime-300" />
      <span className="absolute left-2 top-3 h-1.5 w-3 bg-lime-300" />
      <span className="absolute right-2 top-3 h-1.5 w-3 bg-lime-300" />
      <span className="absolute bottom-2 h-1 w-5 bg-lime-300" />
    </span>
  );
}

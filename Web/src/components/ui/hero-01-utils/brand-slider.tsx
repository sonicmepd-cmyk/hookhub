export interface BrandList {
  image: string;
  name: string;
}

export default function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  const track = [...brandList, ...brandList];

  return (
    <section
      aria-label="Plataformas previstas"
      className="border-b border-border bg-soft py-8 md:py-10"
    >
      <div className="container">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Plataformas previstas para HookHub · Vista conceptual
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="animate-marquee flex w-max items-center">
            {track.map((brand, index) => (
              <span
                key={`${brand.name}-${index}`}
                aria-hidden={index >= brandList.length ? true : undefined}
                className="flex shrink-0 items-center gap-2.5 pr-12"
              >
                <img src={brand.image} alt="" width={32} height={32} className="h-8 w-8" />
                <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                  {brand.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

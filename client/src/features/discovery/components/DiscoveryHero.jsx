import SportsArt from "../../../components/common/SportsArt";

export default function DiscoveryHero({ city }) {
  return (
    <section aria-labelledby="discovery-heading"
      className="relative isolate min-h-[155px] pt-2 pb-4 sm:min-h-[190px] lg:min-h-[220px] lg:pt-1 lg:pb-6">
      <div aria-hidden="true"
        className="pointer-events-none absolute -top-4 -right-4 -z-10 h-[245px] w-[240px] opacity-85 sm:-top-6 sm:-right-6 sm:h-[310px] sm:w-[320px] lg:-right-7 lg:h-[350px] lg:w-[46%] lg:opacity-100"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 30%), linear-gradient(to bottom, black 55%, transparent 100%)",
          maskComposite: "intersect",
        }}>
        <SportsArt scene="hero" align="top" className="h-full w-full" />
      </div>

      <div className="relative z-10 motion-safe:animate-enter">
        <h1 id="discovery-heading"
          className="font-[var(--font-discovery)] text-[32px] leading-[0.95] font-black tracking-tight uppercase italic [text-shadow:0_2px_14px_rgba(8,20,31,0.85)] min-[380px]:text-[36px] sm:text-[54px] lg:text-[68px] xl:text-[80px]">
          <span className="block">Find your crew.</span>
          <span className="mt-1 block text-primary">Own the game.</span>
        </h1>
        <p className="mt-3 max-w-lg text-xs leading-relaxed text-content [text-shadow:0_2px_8px_rgba(0,0,0,0.85)] sm:text-sm lg:text-base">
          Discover nearby teams. Make your next match happen.
        </p>
      </div>

      <div aria-hidden="true"
        className="pointer-events-none absolute right-1 bottom-2 hidden -skew-x-12 border-l-2 border-primary pl-3 lg:block">
        <p className="font-[var(--font-discovery)] text-xs leading-tight tracking-[0.18em] text-muted uppercase italic">
          {city || "Your city"}<br />plays together
        </p>
      </div>
    </section>
  );
}

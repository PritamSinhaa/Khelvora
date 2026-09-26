export default function Logo({ className = "" }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 44"
        fill="currentColor" aria-hidden="true"
        className="h-9 w-8 shrink-0 text-primary sm:h-11 sm:w-10">
        <circle cx="9" cy="7" r="4.5" />
        <circle cx="6" cy="21" r="4" />
        <circle cx="8" cy="36" r="4.5" />
        <path d="M22 3h12l-2 10-8 8 7 10h5l-2 10H23L14 26l-3-1 2-12h6z" />
      </svg>
      <span className="font-display text-[27px] leading-none font-black tracking-wide text-content sm:text-[30px]">
        Khelvora
      </span>
    </span>
  );
}

import { NavLink } from "react-router";
import { navigationItems } from "../../constants/navigation";

export default function AppNavigation({ variant = "desktop" }) {
  const isMobile = variant === "mobile";
  const items = isMobile
    ? navigationItems.filter((item) => item.mobileLabel)
    : navigationItems.filter((item) => item.to !== "/profile");

  return (
    <nav aria-label={isMobile ? "Mobile navigation" : "Main navigation"}
      className={isMobile ? "grid grid-cols-5 gap-1" : "flex flex-col gap-2"}>
      {items.map(({ label, mobileLabel, to, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/discover"}
          className={({ isActive }) => {
            const shared = "group flex items-center rounded-xl motion-safe:transition-colors motion-safe:duration-200";

            return isMobile
              ? `${shared} min-h-14 flex-col justify-center gap-1 px-1 py-2 ${
                  isActive ? "text-primary" : "text-muted hover:text-content"
                }`
              : `${shared} min-h-13 gap-3.5 px-4 py-3 text-sm ${
                  isActive
                    ? "bg-primary font-bold text-background shadow-[0_4px_24px_rgba(198,255,54,0.16)]"
                    : "font-medium text-content hover:bg-surface-hover"
                }`;
          }}>
          {({ isActive }) => (
            <>
              <span className={`flex shrink-0 items-center justify-center ${
                isMobile
                  ? `size-7 rounded-full ${isActive ? "bg-primary text-background" : "text-current"}`
                  : "size-6"
              }`}>
                <Icon size={isMobile ? 19 : 22}
                  strokeWidth={isActive ? 2 : 1.6} aria-hidden="true" />
              </span>
              <span className={isMobile
                ? "text-[10px] leading-tight font-medium"
                : "leading-none"}>
                {isMobile ? mobileLabel : label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
const imagePositions = {
  hero: "0% 0%",
  football: "50% 0%",
  cricket: "100% 0%",
  stadium: "0% 100%",
  badminton: "50% 100%",
  portrait: "100% 100%",
};

export default function SportsArt({
  scene, className = "", label, align = "center",
}) {
  return (
    <div role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}
      className={`relative overflow-hidden ${className}`}>
      <div
        className={`absolute left-0 aspect-square w-full bg-no-repeat ${
          align === "top" ? "top-0" : "top-1/2 -translate-y-1/2"
        }`}
        style={{
          backgroundImage: 'url("/images/sports-atlas.png")',
          backgroundSize: "300% 200%",
          backgroundPosition: imagePositions[scene] || imagePositions.football,
        }}
      />
    </div>
  );
}
import { useState } from "react";
import { MapPin } from "lucide-react";
import { Field } from "../ui/Form";
import { Notice } from "../ui/Feedback";

export default function LocationFields({ location, required = true }) {
  const [longitude, setLongitude] = useState(location?.coordinates?.[0] ?? "");
  const [latitude, setLatitude] = useState(location?.coordinates?.[1] ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function locate() {
    if (!navigator.geolocation) {
      setError("Location is unavailable. Enter coordinates below.");
      return;
    }

    setBusy(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLongitude(Number(position.coords.longitude.toFixed(6)));
        setLatitude(Number(position.coords.latitude.toFixed(6)));
        setBusy(false);
      },
      () => {
        setBusy(false);
        setError("Location access was unavailable. You can enter coordinates below.");
      },
      { timeout: 10000 },
    );
  }

  return (
    <div className="stack rounded-xl border border-border bg-background/50 p-4">
      <div className="between">
        <span className="text-sm font-semibold">Map location</span>
        <button type="button" className="btn secondary text-xs"
          disabled={busy} onClick={locate}>
          <MapPin size={15} />
          {busy ? "Locating…" : "Use my location"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Latitude" name="latitude" type="number" step="any"
          min={-90} max={90} required={required} value={latitude}
          onChange={(event) => setLatitude(event.target.value)}
          placeholder="30.7046" />
        <Field label="Longitude" name="longitude" type="number" step="any"
          min={-180} max={180} required={required} value={longitude}
          onChange={(event) => setLongitude(event.target.value)}
          placeholder="76.7179" />
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Coordinates help players find teams and venues nearby.
      </p>
      <Notice error>{error}</Notice>
    </div>
  );
}
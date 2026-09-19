import { Field } from "../ui/Form";
import LocationFields from "./LocationFields";
import { localDate } from "../../utils/data";

export default function ScheduleFields({ initial = {} }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts at" type="datetime-local" name="startsAt"
          required defaultValue={localDate(initial.startsAt)} />
        <Field label="Ends at" type="datetime-local" name="endsAt"
          required defaultValue={localDate(initial.endsAt)} />
      </div>
      <p className="text-xs text-muted">
        Times use your device’s time zone (
        {Intl.DateTimeFormat().resolvedOptions().timeZone}).
      </p>
      <Field label="Venue name" name="venueName" required maxLength={120}
        defaultValue={initial.venue?.name} placeholder="Your local sports ground" />
      <Field label="Venue address" name="venueAddress" required maxLength={250}
        defaultValue={initial.venue?.address} />
      <LocationFields location={initial.venue?.location} />
    </>
  );
}
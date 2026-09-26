import { useState } from "react";
import { api } from "../../../lib/api";
import { id } from "../../../utils/data";
import { Action } from "../../../components/ui/Form";

const choices = [15, 30, 60, 120, 360, 720, 1440, 2880];
const label = (minutes) => minutes % 1440 === 0 ? `${minutes / 1440} day${minutes === 1440 ? "" : "s"} before` : minutes % 60 === 0 ? `${minutes / 60} hour${minutes === 60 ? "" : "s"} before` : `${minutes} minutes before`;

export default function MatchReminders({ match, canManage }) {
  const [selected, setSelected] = useState(match.reminderOffsetsMinutes || [1440, 60]);
  if (!canManage || match.status !== "scheduled" || new Date(match.startsAt) <= new Date()) return null;
  const toggle = (minutes) => setSelected((current) => current.includes(minutes) ? current.filter((value) => value !== minutes) : [...current, minutes]);
  return <section className="panel stack">
    <div><h2 className="section-title">Match reminders</h2><p className="text-sm text-muted">Choose when team members are notified. Defaults are 24 hours and 1 hour before.</p></div>
    <div className="grid gap-2 sm:grid-cols-2">{choices.map((minutes) => <label className="flex items-center gap-2 text-sm" key={minutes}>
      <input type="checkbox" checked={selected.includes(minutes)} onChange={() => toggle(minutes)} />{label(minutes)}
    </label>)}</div>
    <Action disabled={!selected.length || selected.length > 4} action={() => api.put(`/matches/${id(match)}/reminders`, { offsetsMinutes: selected })}>Save reminders</Action>
  </section>;
}

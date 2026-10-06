import { useState } from "react";
import { api } from "../../../lib/api";
import { id, rows, skillLevels } from "../../../utils/data";
import { useResource, useTask } from "../../../hooks/useResource";
import { Field, Action } from "../../../components/ui/Form";
import { State, Notice, Empty } from "../../../components/ui/Feedback";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const OTHER_SPORT = "__other__";

export default function SportsEditor() {
  const sports = useResource("/sports");
  const preferences = useResource("/player-sports");
  const task = useTask();

  const [sport, setSport] = useState("");
  const [customSportName, setCustomSportName] = useState("");
  const [skill, setSkill] = useState("Intermediate");
  const [positions, setPositions] = useState("");
  const [timeZone, setTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  );
  const [slots, setSlots] = useState([]);
  const [saved, setSaved] = useState(false);

  const sportName = (value) =>
    rows(sports.data).find((item) => id(item) === id(value))?.name ||
    value?.name ||
    "Sport";

  function edit(preference) {
    setSport(id(preference.sport));
    setCustomSportName("");
    setSkill(preference.skillLevel);
    setPositions(preference.positions.join(", "));
    setTimeZone(preference.timeZone);
    setSlots(
      preference.availability.map(({ day, from, to }) => ({
        day,
        from,
        to,
      })),
    );
    setSaved(false);
  }

  function changeSlot(index, field, value) {
    setSlots((previous) =>
      previous.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot,
      ),
    );
  }

  return (
    <section className="panel stack">
      <div>
        <h2 className="section-title">Sports & availability</h2>
        <p className="mt-1 text-sm text-muted">
          Choose your sports to personalize nearby discovery.
        </p>
      </div>

      <State resource={preferences} />

      {rows(preferences.data).map((preference) => (
        <div key={id(preference)} className="list-item">
          <div>
            <h3 className="font-bold">{sportName(preference.sport)}</h3>
            <p className="mt-1 text-sm text-muted">
              {preference.skillLevel} ·{" "}
              {(preference.positions || []).join(", ") || "Any position"}
            </p>
          </div>

          <div className="row">
            <button className="btn secondary" onClick={() => edit(preference)}>
              Edit
            </button>
            <Action
              danger
              confirm="Remove this sport from your profile?"
              action={() =>
                api.delete(`/player-sports/${id(preference.sport)}`)
              }
            >
              Remove
            </Action>
          </div>
        </div>
      ))}

      <State resource={sports} />

      {!sports.loading && !rows(sports.data).length && !sports.error && (
        <Empty title="No sports available">
          Sports will appear here when the service is ready.
        </Empty>
      )}

      <form
        className="stack border-t border-border pt-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(false);

          task.run(async () => {
            const list = positions
              .split(",")
              .map((position) => position.trim())
              .filter(Boolean);

            if (
              list.length > 10 ||
              list.some((position) => position.length > 40)
            ) {
              throw new Error(
                "Use up to 10 positions, each under 40 characters.",
              );
            }

            if (slots.some((slot) => slot.to <= slot.from)) {
              throw new Error(
                "Availability must end after it starts. Split overnight slots into two days.",
              );
            }

            await api.put("/player-sports", {
              sport,
              ...(sport === OTHER_SPORT ? { sportName: customSportName.trim() } : {}),
              skillLevel: skill,
              positions: list,
              availability: slots.map((slot) => ({
                ...slot,
                day: Number(slot.day),
              })),
              timeZone,
            });

            setSaved(true);
          });
        }}
      >
        <fieldset
          className="stack min-w-0"
          disabled={task.busy || !rows(sports.data).length}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sport">
              <select
                required
                value={sport}
                onChange={(event) => {
                  setSport(event.target.value);
                  setSaved(false);
                }}
              >
                <option value="">Choose a sport</option>
                {rows(sports.data).map((item) => (
                  <option key={id(item)} value={id(item)}>
                    {item.name}
                  </option>
                ))}
                <option value={OTHER_SPORT}>Others</option>
              </select>
            </Field>

            {sport === OTHER_SPORT && (
              <Field
                label="Sport name"
                required
                maxLength={60}
                value={customSportName}
                onChange={(event) => {
                  setCustomSportName(event.target.value);
                  setSaved(false);
                }}
                placeholder="e.g. Pickleball"
              />
            )}

            <Field label="Skill level">
              <select
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
              >
                {skillLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Positions"
            value={positions}
            onChange={(event) => setPositions(event.target.value)}
            placeholder="Midfielder, Defender"
            hint="Separate positions with commas."
          />

          <Field
            label="Time zone"
            required
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
          />

          {slots.map((slot, index) => (
            <div
              key={index}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
            >
              <Field label="Day">
                <select
                  value={slot.day}
                  onChange={(event) =>
                    changeSlot(index, "day", event.target.value)
                  }
                >
                  {days.map((day, dayIndex) => (
                    <option key={day} value={dayIndex}>
                      {day}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="From"
                type="time"
                required
                value={slot.from}
                onChange={(event) =>
                  changeSlot(index, "from", event.target.value)
                }
              />

              <Field
                label="To"
                type="time"
                required
                value={slot.to}
                onChange={(event) =>
                  changeSlot(index, "to", event.target.value)
                }
              />

              <button
                className="btn secondary"
                type="button"
                onClick={() =>
                  setSlots((previous) =>
                    previous.filter((_, slotIndex) => slotIndex !== index),
                  )
                }
              >
                Remove slot
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn secondary self-start"
            disabled={slots.length >= 28}
            onClick={() =>
              setSlots((previous) => [
                ...previous,
                { day: 6, from: "17:00", to: "19:00" },
              ])
            }
          >
            + Add availability
          </button>

          <Notice error>{task.error}</Notice>
          {saved && <Notice>Sport and availability saved.</Notice>}

          <button className="btn self-start">
            {task.busy ? "Saving…" : "Save sport"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

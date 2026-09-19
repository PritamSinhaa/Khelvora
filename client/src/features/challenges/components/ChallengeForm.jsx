import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../../../lib/api";
import { id, scheduleFrom } from "../../../utils/data";
import { Form, Field } from "../../../components/ui/Form";
import ScheduleFields from "../../../components/common/ScheduleFields";

export default function ChallengeForm({ opponent, teams, userId }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const eligible = teams.filter((team) =>
    id(team) !== id(opponent) &&
    id(team.sport) === id(opponent.sport) &&
    id(opponent.leader) !== userId,
  );

  if (!eligible.length) return null;

  return (
    <section className="panel stack">
      <div className="between">
        <div>
          <p className="eyebrow mb-2">Friendly competition</p>
          <h2 className="section-title">Take it to the field</h2>
          <p className="mt-1 text-sm text-muted">
            Challenge {opponent.name} to your next match.
          </p>
        </div>

        <button className="btn" onClick={() => setOpen(!open)}>
          {open ? "Close form" : "Challenge team"}
        </button>
      </div>

      {open && (
        <Form
          submit="Send challenge"
          action={(values) => api.post("/challenges", {
            fromTeam: values.fromTeam,
            toTeam: id(opponent),
            schedule: scheduleFrom(values),
          })}
          onDone={() => navigate("/challenges")}
        >
          <Field label="Your team">
            <select name="fromTeam" required>
              {eligible.map((team) => (
                <option key={id(team)} value={id(team)}>
                  {team.name}
                </option>
              ))}
            </select>
          </Field>

          <ScheduleFields />
        </Form>
      )}
    </section>
  );
}
import { Link, useNavigate, useParams } from "react-router";
import { api } from "../../lib/api";
import { id, rows, pointFrom, skillLevels } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import { State, PageHeader, Notice } from "../../components/ui/Feedback";
import { Form, Field } from "../../components/ui/Form";
import LocationFields from "../../components/common/LocationFields";

export default function TeamEditorPage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const resource = useResource(teamId ? `/teams/${teamId}` : null);
  const sports = useResource("/sports");
  const team = resource.data;

  if (teamId && !team) return <State resource={resource} />;

  if (team && id(team.leader) !== id(user)) {
    return <Notice error>Only the team leader can edit this team.</Notice>;
  }

  return (
    <div className="mx-auto max-w-3xl stack">
      <Link
        to={teamId ? `/teams/${teamId}` : "/teams"}
        className="text-sm text-muted hover:text-primary"
      >
        ← Back to team
      </Link>

      <PageHeader
        title={team ? "Edit your team" : "Build your crew"}
        eyebrow="Team setup"
        description="Give your team a home, a sport, and a reason to play."
      />

      <section className="panel">
        <Form
          key={teamId || "new"}
          submit={team ? "Save team" : "Create team"}
          action={(values) => {
            const data = {
              name: values.name.trim(),
              bio: values.bio.trim(),
              city: values.city.trim(),
              location: pointFrom(values),
              skillLevel: values.skillLevel,
              maxMembers: Number(values.maxMembers),
              lookingForPlayers: values.lookingForPlayers === "on",
              ...(!team ? { sport: values.sport } : {}),
            };

            return team
              ? api.patch(`/teams/${teamId}`, data)
              : api.post("/teams", data);
          }}
          onDone={(saved) => navigate(`/teams/${id(saved)}`)}
        >
          <Field
            label="Team name"
            name="name"
            required
            maxLength={80}
            defaultValue={team?.name}
            placeholder="What’s your team called?"
          />

          {!team && (
            <>
              <State resource={sports} />

              <Field label="Sport">
                <select name="sport" required defaultValue="">
                  <option value="" disabled>
                    Choose a sport
                  </option>
                  {rows(sports.data).map((sport) => (
                    <option value={id(sport)} key={id(sport)}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field label="Team bio">
            <textarea
              name="bio"
              maxLength={1000}
              defaultValue={team?.bio}
              placeholder="Tell players about your team and when you usually play."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Skill level">
              <select
                name="skillLevel"
                defaultValue={team?.skillLevel || "Intermediate"}
              >
                {skillLevels.map((skill) => (
                  <option key={skill}>{skill}</option>
                ))}
              </select>
            </Field>

            <Field
              label="Maximum members"
              name="maxMembers"
              type="number"
              min={Math.max(2, team?.memberCount || 2)}
              max={100}
              step={1}
              required
              defaultValue={team?.maxMembers || 15}
            />
          </div>

          <Field
            label="City"
            name="city"
            required
            maxLength={100}
            defaultValue={team?.city || user.city}
          />

          <LocationFields location={team?.location || user.location} />

          <label className="row text-sm">
            <input
              className="size-4 accent-primary"
              type="checkbox"
              name="lookingForPlayers"
              defaultChecked={team?.lookingForPlayers ?? true}
            />
            We’re looking for players
          </label>
        </Form>
      </section>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../features/auth/useAuth";
import { api } from "../../lib/api";
import { id, pointFrom, rows } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { PageHeader, State, Empty, Badge } from "../../components/ui/Feedback";
import { Form, Field } from "../../components/ui/Form";
import LocationFields from "../../components/common/LocationFields";
import SportsEditor from "../../features/profiles/components/SportsEditor";
import PlayerMatchHistory from "../../pages/players/PlayerMatchHistory";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingSports, setEditingSports] = useState(false);
  const [city, setCity] = useState(user.city || "");
  const [stateName, setStateName] = useState(user.state || "");
  const [postalCode, setPostalCode] = useState(user.postalCode || "");
  const [country, setCountry] = useState(user.country || "");
  const teams = useResource("/teams/mine");
  const preferences = useResource("/player-sports");

  return (
    <div className="mx-auto max-w-4xl stack">
      <PageHeader title="Your profile" eyebrow="Meet the player" />

      <section className="panel stack">
        <h2 className="text-2xl font-bold">{user.name}</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="stack">
            <div className="between">
              <h3 className="section-title">Sports</h3>
              <button className="btn secondary" type="button" onClick={() => setEditingSports((value) => !value)}>
                {editingSports ? "Done" : "Edit sports"}
              </button>
            </div>
            <State resource={preferences} />
            {!preferences.loading && !preferences.error && (
              rows(preferences.data).length ? (
                <ul className="row flex-wrap">
                  {rows(preferences.data).map((preference) => (
                    <li key={id(preference)}>
                      <Badge>
                      {preference.sport?.name || preference.sportName || "Sport"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">No sports added yet.</p>
            )}
          </section>

          <section className="stack">
            <h3 className="section-title">Teams joined</h3>
            <State resource={teams} />
            {!teams.loading && !teams.error && (
              rows(teams.data).length ? (
                <ul className="stack">
                  {rows(teams.data).map((team) => (
                    <li key={id(team)}>
                      <Link className="font-semibold text-primary hover:underline" to={`/teams/${id(team)}`}>
                        {team.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <Empty title="No teams joined">Teams you join will appear here.</Empty>
            )}
          </section>
        </div>

        <div className="border-t border-border pt-4">
          <button className="btn" type="button" onClick={() => setEditingProfile((value) => !value)}>
            {editingProfile ? "Close profile editor" : "Edit profile"}
          </button>
        </div>

        {editingProfile && (
          <div className="grid gap-5 md:grid-cols-[240px_1fr]">
            <section className="panel stack self-start">
              <Form
                submit="Upload photo"
                action={async (_, form) => {
                  const data = new FormData(form);
                  const file = data.get("image");
                  if (!file?.size) throw new Error("Choose an image.");
                  if (file.size > 5 * 1024 * 1024) throw new Error("Choose an image smaller than 5 MB.");
                  const upload = await api.post("/uploads", data);
                  await api.put("/uploads/avatar", { uploadId: id(upload) });
                }}
                onDone={refreshUser}
                success="Photo updated."
              >
                <Field label="Profile photo" name="image" type="file" accept="image/jpeg,image/png,image/webp" required hint="JPEG, PNG or WebP · up to 5 MB" />
              </Form>
            </section>

            <section className="panel">
              <Form
                submit="Save profile"
                success="Profile saved."
                action={(values) => api.patch("/users/me", {
                  name: values.name.trim(),
                  bio: values.bio.trim(),
                  city: values.city.trim(),
                  state: values.state.trim(),
                  postalCode: values.postalCode.trim(),
                  country: values.country.trim(),
                  ...(values.longitude !== "" || values.latitude !== "" ? { location: pointFrom(values) } : {}),
                })}
                onDone={refreshUser}
              >
                <h2 className="section-title">Profile details</h2>
                <Field label="Full name" name="name" required minLength={2} maxLength={60} defaultValue={user.name} />
                <Field label="Email" type="email" readOnly value={user.email} hint="Your sign-in email." />
                <Field label="About you"><textarea name="bio" maxLength={300} defaultValue={user.bio || ""} placeholder="Your sport, your position, your game…" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" name="city" maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Mohali" />
                  <Field label="State / region" name="state" maxLength={100} value={stateName} onChange={(event) => setStateName(event.target.value)} placeholder="Punjab" />
                  <Field label="Postal code" name="postalCode" maxLength={20} value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="160062" />
                  <Field label="Country" name="country" maxLength={100} value={country} onChange={(event) => setCountry(event.target.value)} placeholder="India" />
                </div>
                <LocationFields
                  location={user.location}
                  required={false}
                  lookupAddress
                  onAddressFound={(address) => {
                    if (address.city) setCity(address.city);
                    if (address.state) setStateName(address.state);
                    if (address.postalCode) setPostalCode(address.postalCode);
                    if (address.country) setCountry(address.country);
                  }}
                />
              </Form>
            </section>
          </div>
        )}
      </section>

      {editingSports && <SportsEditor />}
      <PlayerMatchHistory />
    </div>
  );
}

import { Link } from "react-router";
import { useAuth } from "../../features/auth/useAuth";
import { api } from "../../lib/api";
import { id, initials, pointFrom } from "../../utils/data";
import { PageHeader } from "../../components/ui/Feedback";
import { Form, Field } from "../../components/ui/Form";
import LocationFields from "../../components/common/LocationFields";
import SportsEditor from "../../features/profiles/components/SportsEditor";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  return (
    <div className="mx-auto max-w-4xl stack">
      <PageHeader
        title="Your profile"
        eyebrow="Meet the player"
        description="Give your next teammates a little introduction."
      >
        <Link className="btn secondary" to="/settings">
          Settings
        </Link>
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <section className="panel stack self-start">
          <div className="avatar mx-auto size-24 rounded-full text-4xl">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.name}'s profile`}
                className="size-full object-cover"
              />
            ) : (
              initials(user.name)
            )}
          </div>

          <h2 className="text-center font-bold">{user.name}</h2>

          <Form
            submit="Upload photo"
            action={async (_, form) => {
              const data = new FormData(form);
              const file = data.get("image");

              if (!file?.size) throw new Error("Choose an image.");

              if (file.size > 5 * 1024 * 1024) {
                throw new Error("Choose an image smaller than 5 MB.");
              }

              const upload = await api.post("/uploads", data);
              await api.put("/uploads/avatar", {
                uploadId: id(upload),
              });
            }}
            onDone={refreshUser}
            success="Photo updated."
          >
            <Field
              label="Profile photo"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              hint="JPEG, PNG or WebP · up to 5 MB"
            />
          </Form>
        </section>

        <section className="panel">
          <Form
            submit="Save profile"
            success="Profile saved."
            action={(values) =>
              api.patch("/users/me", {
                name: values.name.trim(),
                bio: values.bio.trim(),
                city: values.city.trim(),
                ...(values.longitude !== "" || values.latitude !== ""
                  ? { location: pointFrom(values) }
                  : {}),
              })
            }
            onDone={refreshUser}
          >
            <h2 className="section-title">The essentials</h2>

            <Field
              label="Full name"
              name="name"
              required
              minLength={2}
              maxLength={60}
              defaultValue={user.name}
            />

            <Field
              label="Email"
              type="email"
              readOnly
              value={user.email}
              hint="Your sign-in email."
            />

            <Field label="About you">
              <textarea
                name="bio"
                maxLength={300}
                defaultValue={user.bio || ""}
                placeholder="Your sport, your position, your game…"
              />
            </Field>

            <Field
              label="City"
              name="city"
              maxLength={100}
              defaultValue={user.city || ""}
              placeholder="Mohali, Punjab"
            />

            <LocationFields location={user.location} required={false} />
          </Form>
        </section>
      </div>

      <SportsEditor />
    </div>
  );
}

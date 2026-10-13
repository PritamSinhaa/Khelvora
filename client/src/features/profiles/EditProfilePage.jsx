import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { api } from "../../lib/api";
import { id, pointFrom } from "../../utils/data";
import { PageHeader } from "../../components/ui/Feedback";
import { Form, Field } from "../../components/ui/Form";
import LocationFields from "../../components/common/LocationFields";
import SportsEditor from "./components/SportsEditor";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const [city, setCity] = useState(user.city || "");
  const [stateName, setStateName] = useState(user.state || "");
  const [postalCode, setPostalCode] = useState(user.postalCode || "");
  const [country, setCountry] = useState(user.country || "");

  return (
    <div className="mx-auto max-w-4xl stack">
      <Link className="row w-fit text-sm text-muted hover:text-content" to="/profile">
        <ArrowLeft size={16} aria-hidden="true" /> Back to profile
      </Link>

      <PageHeader title="Edit your profile" eyebrow="Player details" description="Update your details, location, sports, and availability." />

      <section className="panel grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
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
            <LocationFields location={user.location} required={false} lookupAddress onAddressFound={(address) => {
              if (address.city) setCity(address.city);
              if (address.state) setStateName(address.state);
              if (address.postalCode) setPostalCode(address.postalCode);
              if (address.country) setCountry(address.country);
            }} />
          </Form>
        </section>
      </section>

      <SportsEditor />
    </div>
  );
}

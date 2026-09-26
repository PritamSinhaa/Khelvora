import { api } from "../../../lib/api";
import { id } from "../../../utils/data";
import { Form, Field } from "../../../components/ui/Form";
import TeamCover from "./TeamCover";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function TeamCoverEditor({ team, onSaved }) {
  return (
    <section className="panel stack">
      <div>
        <h2 className="section-title">Team cover image</h2>

        <p className="mt-2 text-sm text-muted">
          Choose a landscape image for your team page and team cards.
        </p>
      </div>

      <TeamCover
        src={team.coverUrl}
        name={team.name}
        className="h-48 rounded-xl sm:h-64"
      />

      <Form
        submit="Upload team cover"
        success="Team cover updated."
        reset
        action={async (_, form) => {
          const file = new FormData(form).get("image");

          if (!(file instanceof File) || file.size === 0) {
            throw new Error("Choose an image.");
          }

          if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error("Use a JPEG, PNG or WebP image.");
          }

          if (file.size > MAX_IMAGE_SIZE) {
            throw new Error("Choose an image no larger than 5 MB.");
          }

          const data = new FormData();
          data.append("image", file);

          const upload = await api.post("/uploads", data);
          const uploadId = id(upload);

          if (!uploadId) {
            throw new Error("The upload did not return an image ID.");
          }

          return api.put(`/teams/${id(team)}/cover`, {
            uploadId,
          });
        }}
        onDone={onSaved}
      >
        <Field
          label="Choose a cover image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          hint="JPEG, PNG or WebP · maximum 5 MB"
        />
      </Form>
    </section>
  );
}
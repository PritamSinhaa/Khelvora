import { useEffect, useState } from "react";
import { entity } from "../../app/store";
import { id } from "../../utils/data";

export default function EntityName({ kind = "team", value }) {
  const [resolved, setResolved] = useState(null);
  const key = id(value);
  const provided = typeof value === "object" ? value?.name : "";

  useEffect(() => {
    if (provided || !key) return;
    let active = true;

    entity(kind, key).then((result) => {
      if (active) setResolved({ key, name: result.name });
    }).catch(() => {});

    return () => { active = false; };
  }, [kind, key, provided]);

  return provided ||
    (resolved?.key === key ? resolved.name : "") ||
    (kind === "team" ? "Team" : "Player");
}
import { api } from "../lib/api";
import { id } from "../utils/data";

const entities = new Map();

window.addEventListener("khelvora:session", () => entities.clear());
window.addEventListener("khelvora:data", () => entities.clear());

export function entity(kind, value) {
  const key = `${kind}:${id(value)}`;

  if (!entities.has(key)) {
    const path = kind === "team" ? `/teams/${id(value)}` : `/users/${id(value)}`;
    entities.set(key, api.get(path).catch((error) => {
      entities.delete(key);
      throw error;
    }));
  }

  return entities.get(key);
}
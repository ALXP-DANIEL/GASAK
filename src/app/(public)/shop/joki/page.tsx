import { redirect } from "next/navigation";

// Superseded by the per-star and package detail pages, each with its own
// slug like a regular shop product — /shop lists both as separate cards.
export default function JokiIndexRedirect() {
  redirect("/shop");
}

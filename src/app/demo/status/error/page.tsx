import { headers } from "next/headers";

export default async function ErrorStatusDemo() {
  await headers();

  throw new Error("Demo route error trigger");
}

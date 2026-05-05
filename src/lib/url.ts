import { headers } from "next/headers";

export async function getAppBaseUrl() {
  const envBase = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return "http://localhost:3001";
}

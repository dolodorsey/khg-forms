import { redirect } from "next/navigation";

// Compatibility route: old links now use the single, server-validated intake
// pipeline. The canonical renderer preserves branding, custom field rules,
// uploads, and the database-backed submission reference.
export default function LegacyFormRedirect({ params, searchParams }) {
  const brand = encodeURIComponent(params.brand);
  const role = encodeURIComponent(params.role);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) {
      for (const item of value) if (typeof item === "string") query.append(key, item);
    } else if (typeof value === "string") {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  redirect(`/f/${brand}/${role}${qs ? `?${qs}` : ""}`);
}

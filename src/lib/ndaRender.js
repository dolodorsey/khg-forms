// Renders the team NDA template with a signer's details.
// The same function runs in the team-onboarding edge function, so the text a
// teammate reads is byte-for-byte the text that is hashed, stored and printed.
export function cleanField(value, max = 400) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function renderNda(template, fields) {
  const values = {
    SIGNER_NAME: cleanField(fields.full_name, 120) || '[Your full legal name]',
    SIGNER_EMAIL: cleanField(fields.personal_email, 160) || '[Your email]',
    ENTITY: cleanField(fields.entity_name, 120) || '[Entity]',
    ROLE: cleanField(fields.role_title, 120) || '[Role]',
    DUTIES: cleanField(fields.duties, 600) || '[Duties]',
    INITIALS: cleanField(fields.initials, 5).toUpperCase() || '[Initials]',
    CONSIDERATION: cleanField(fields.consideration, 800),
  };
  return String(template).replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in values ? values[key] : match));
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

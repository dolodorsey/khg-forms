// team-onboarding: public endpoint behind forms.thekollectivehospitality.com/team/join
//   GET  ?action=config            -> entities + current NDA version (text, hash, status)
//   POST {action:"submit", ...}    -> validate, store teammate + signed NDA, build PDF, return copy link
//   GET  ?action=copy&token=<hex>  -> 302 to a short-lived signed link for that signer's PDF
// Writes go through the security-definer RPC submit_team_onboarding (service role only).
// Never asks for or stores passwords, card or bank numbers, social security or ID numbers.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PREVIEW_KEY = Deno.env.get("ONBOARDING_PREVIEW_KEY") ?? "";
const BUCKET = "nda-documents";
const ALLOWED_ORIGINS = [
  "https://forms.thekollectivehospitality.com",
  "https://khg-forms.vercel.app",
];

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function cors(origin: string | null) {
  const allow = origin && (ALLOWED_ORIGINS.includes(origin) || /^https:\/\/khg-forms-[a-z0-9-]+\.vercel\.app$/.test(origin))
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}

// ---- keep identical to src/lib/ndaRender.js ----
function cleanField(value: unknown, max = 400) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
function renderNda(template: string, fields: Record<string, unknown>) {
  const values: Record<string, string> = {
    SIGNER_NAME: cleanField(fields.full_name, 120) || "[Your full legal name]",
    SIGNER_EMAIL: cleanField(fields.personal_email, 160) || "[Your email]",
    ENTITY: cleanField(fields.entity_name, 120) || "[Entity]",
    ROLE: cleanField(fields.role_title, 120) || "[Role]",
    DUTIES: cleanField(fields.duties, 600) || "[Duties]",
    INITIALS: cleanField(fields.initials, 5).toUpperCase() || "[Initials]",
    CONSIDERATION: cleanField(fields.consideration, 800),
  };
  return String(template).replace(/\{\{([A-Z_]+)\}\}/g, (m, key) => (key in values ? values[key] : m));
}
// -------------------------------------------------

async function sha256Hex(data: string | Uint8Array) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return m && d ? `${months[m - 1]} ${d}, ${y}` : iso;
}

// Checks the drawn signature is a real, reasonably sized PNG before anything is written.
async function signatureOk(dataUrl: unknown) {
  if (typeof dataUrl !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/=]{200,}$/.test(dataUrl) || dataUrl.length > 400_000) return false;
  try {
    const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (!sig.every((b, i) => bytes[i] === b)) return false;
    const view = new DataView(bytes.buffer);
    const w = view.getUint32(16), h = view.getUint32(20);
    if (w < 50 || h < 30 || w > 4000 || h > 2000) return false;
    const probe = await PDFDocument.create();
    await probe.embedPng(bytes);
    return true;
  } catch {
    return false;
  }
}

async function loadConfig() {
  const [{ data: entities, error: e1 }, { data: nda, error: e2 }] = await Promise.all([
    db.from("team_onboarding_entities").select("slug,display_name,work_email_domain,mail_ready").eq("active", true).order("sort_order"),
    db.from("team_nda_versions").select("version_key,title,body_template,body_sha256,default_consideration,status").eq("is_current", true).maybeSingle(),
  ]);
  if (e1 || e2 || !nda) throw new Error("config_unavailable");
  return { entities: entities ?? [], nda };
}

// WinAnsi-safe text for the standard PDF font.
function pdfSafe(text: string) {
  return text
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-").replace(/…/g, "...")
    .replace(/[^\x20-\x7e\n]/g, "");
}

async function buildPdf(opts: {
  rendered: string; signerName: string; typed: string; signedDate: string; signedAtUtc: string; timezone: string;
  signaturePng: string; ip: string; userAgent: string; versionKey: string; templateSha: string; renderedSha: string;
  token: string; entity: string; ndaId: string;
}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`NDA - ${pdfSafe(opts.signerName)}`);
  pdf.setAuthor("The Kollective Hospitality Group");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 612, H = 792, M = 54, size = 9.5, lead = 13.2;
  let page = pdf.addPage([W, H]);
  let y = H - M;
  const ink = rgb(0.08, 0.09, 0.1), muted = rgb(0.38, 0.4, 0.43), gold = rgb(0.62, 0.48, 0.2);

  const footer = () => {
    page.drawText(pdfSafe(`${opts.signerName} - signed ${longDate(opts.signedDate)} - agreement version ${opts.versionKey}`), { x: M, y: 30, size: 7, font, color: muted });
  };
  footer();
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; footer(); };
  const wrap = (text: string, f: typeof font, s: number, width: number) => {
    const out: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(" ")) {
        const test = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(test, s) > width && line) { out.push(line); line = word; } else line = test;
      }
      out.push(line);
    }
    return out;
  };
  const write = (text: string, f = font, s = size, color = ink, gap = 4) => {
    for (const line of wrap(pdfSafe(text), f, s, W - 2 * M)) {
      if (y < M + 20) newPage();
      page.drawText(line, { x: M, y, size: s, font: f, color });
      y -= s + (lead - size);
    }
    y -= gap;
  };

  const lines = opts.rendered.split("\n");
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (!t) return;
    if (i === 0) { write(t, bold, 14, ink, 2); return; }
    if (i === 1) { write(t, font, 9, gold, 10); return; }
    if (/^\d+\.\s/.test(t) || /^SCHEDULE A/.test(t)) { y -= 4; write(t, bold, 10.5, ink, 3); return; }
    write(t);
  });

  // Signature block
  if (y < 300) newPage();
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: gold });
  y -= 20;
  write("RECEIVING PARTY", bold, 10.5, ink, 6);
  const pngBytes = Uint8Array.from(atob(opts.signaturePng.split(",")[1]), (c) => c.charCodeAt(0));
  const img = await pdf.embedPng(pngBytes);
  const scale = Math.min(220 / img.width, 70 / img.height);
  page.drawImage(img, { x: M, y: y - img.height * scale, width: img.width * scale, height: img.height * scale });
  y -= img.height * scale + 6;
  page.drawLine({ start: { x: M, y }, end: { x: M + 260, y }, thickness: 0.6, color: muted });
  y -= 12;
  write(`Signature of ${opts.signerName}`, font, 8.5, muted, 2);
  write(`Typed signature: ${opts.typed}`, font, size, ink, 2);
  write(`Date signed: ${longDate(opts.signedDate)} (${opts.timezone})`, font, size, ink, 12);
  write("DISCLOSING PARTY", bold, 10.5, ink, 6);
  write("The Kollective Hospitality Group, by Bryan Dorsey, Founder", font, size, ink, 2);
  write("Company countersignature: pending", font, size, muted, 2);

  // Audit page
  newPage();
  write("ELECTRONIC SIGNATURE RECORD", bold, 13, ink, 10);
  const rows: [string, string][] = [
    ["Signer", opts.signerName],
    ["Entity", opts.entity],
    ["Typed signature", opts.typed],
    ["Date signed (signer's time zone)", `${longDate(opts.signedDate)} (${opts.timezone})`],
    ["Signed at (UTC)", opts.signedAtUtc],
    ["Signer IP address", opts.ip || "not available"],
    ["Signer device", opts.userAgent.slice(0, 180) || "not available"],
    ["Agreement version", opts.versionKey],
    ["Template fingerprint (SHA-256)", opts.templateSha],
    ["Signed text fingerprint (SHA-256)", opts.renderedSha],
    ["Record number", opts.ndaId],
    ["Verification code", opts.token],
  ];
  for (const [k, v] of rows) { write(k, bold, 8.5, muted, 0); write(v, font, size, ink, 6); }
  write("The signer scrolled through the full agreement, confirmed they read it, consented to sign electronically, typed their full legal name, drew their signature and initialed Schedule A. The date was set automatically from the signer's device time zone and cannot be edited.", font, 8.5, muted, 0);
  return await pdf.save();
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (req.method === "GET" && action === "config") {
      const { entities, nda } = await loadConfig();
      const preview = !!PREVIEW_KEY && url.searchParams.get("preview") === PREVIEW_KEY;
      return json({ ok: true, entities, nda, accepting: nda.status === "approved" || preview }, 200, origin);
    }

    if (req.method === "GET" && action === "copy") {
      const token = url.searchParams.get("token") ?? "";
      if (!/^[0-9a-f]{32}$/.test(token)) return json({ ok: false, error: "Invalid link" }, 400, origin);
      const { data } = await db.from("team_ndas").select("pdf_storage_path").eq("verification_token", token).maybeSingle();
      if (!data?.pdf_storage_path) return json({ ok: false, error: "Copy not found" }, 404, origin);
      const { data: signed } = await db.storage.from(BUCKET).createSignedUrl(data.pdf_storage_path, 600, { download: true });
      if (!signed?.signedUrl) return json({ ok: false, error: "Copy unavailable" }, 500, origin);
      return new Response(null, { status: 302, headers: { ...cors(origin), Location: signed.signedUrl } });
    }

    if (req.method === "POST") {
      const raw = await req.text();
      if (raw.length > 600_000) return json({ ok: false, error: "Submission too large" }, 413, origin);
      const body = JSON.parse(raw);
      if (body.action !== "submit") return json({ ok: false, error: "Unknown action" }, 400, origin);
      if (body.website) return json({ ok: false, error: "Submission rejected" }, 400, origin); // honeypot

      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "";
      const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 500);
      if (ip) {
        const since = new Date(Date.now() - 3600_000).toISOString();
        const { count } = await db.from("team_portal_submissions").select("id", { count: "exact", head: true })
          .eq("ip", ip).eq("submission_type", "onboarding").gte("created_at", since);
        if ((count ?? 0) >= 6) return json({ ok: false, error: "Too many submissions from this connection. Try again in an hour." }, 429, origin);
      }

      if (!(await signatureOk(body.signature_png))) return json({ ok: false, error: "Draw your signature in the box." }, 400, origin);

      const { entities, nda } = await loadConfig();
      const entity = entities.find((e: { slug: string }) => e.slug === body.entity_slug);
      if (!entity) return json({ ok: false, error: "Choose the entity you work with." }, 400, origin);
      const rendered = renderNda(nda.body_template, {
        full_name: body.full_name, personal_email: body.personal_email, entity_name: entity.display_name,
        role_title: body.role_title, duties: body.duties, initials: body.initials, consideration: nda.default_consideration,
      });
      const renderedSha = await sha256Hex(rendered);
      if (body.nda_rendered_sha256 !== renderedSha) {
        return json({ ok: false, error: "The agreement on your screen is out of date. Reload the page and sign again." }, 409, origin);
      }
      const previewOk = !!PREVIEW_KEY && body.preview_key === PREVIEW_KEY;
      const payload = {
        ...body, preview_ok: previewOk, ip, user_agent: userAgent,
        nda_template_sha256: nda.body_sha256, nda_version_key: nda.version_key,
        nda_rendered_sha256: renderedSha, nda_rendered_text: rendered,
      };
      delete (payload as Record<string, unknown>).preview_key;
      delete (payload as Record<string, unknown>).action;

      const { data: result, error } = await db.rpc("submit_team_onboarding", { p: payload });
      if (error) return json({ ok: false, error: "Could not save. Try again in a minute." }, 500, origin);
      if (!result?.ok) return json({ ok: false, error: result?.error ?? "Could not save." }, 400, origin);

      const signedAtUtc = new Date().toISOString();
      const pdfBytes = await buildPdf({
        rendered, signerName: cleanField(body.full_name, 120), typed: cleanField(body.typed_signature, 120),
        signedDate: result.signed_date, signedAtUtc, timezone: cleanField(body.timezone, 60) || "America/New_York",
        signaturePng: body.signature_png, ip, userAgent, versionKey: nda.version_key, templateSha: nda.body_sha256,
        renderedSha, token: result.verification_token, entity: entity.display_name, ndaId: result.nda_id,
      });
      const path = `team/${result.signed_date.slice(0, 4)}/${result.nda_id}.pdf`;
      const up = await db.storage.from(BUCKET).upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });
      let copyUrl: string | null = null;
      if (!up.error) {
        const pdfSha = await sha256Hex(pdfBytes);
        await db.rpc("attach_nda_pdf", { p_nda_id: result.nda_id, p_pdf_url: path, p_pdf_hash: pdfSha });
        await db.from("team_ndas").update({ pdf_storage_path: path }).eq("id", result.nda_id);
        copyUrl = `${SUPABASE_URL}/functions/v1/team-onboarding?action=copy&token=${result.verification_token}`;
      }
      return json({
        ok: true,
        signed_date: result.signed_date,
        entity: result.entity,
        work_email: result.work_email,
        work_email_status: result.work_email_status,
        copy_url: copyUrl,
        preview: !previewOk ? undefined : true,
      }, 200, origin);
    }

    return json({ ok: false, error: "Not found" }, 404, origin);
  } catch (_err) {
    return json({ ok: false, error: "Something went wrong. Try again in a minute." }, 500, origin);
  }
});

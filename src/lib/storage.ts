import "server-only";
import { createClient } from "@supabase/supabase-js";

const AVATAR_BUCKET = "avatars";

// Admin client using the service role key — bypasses Storage RLS entirely.
// This is safe here because every caller already went through
// requireUserId() before reaching this module; we're not relying on
// Storage-level policies for authorization, our own DAL/action layer is
// the authorization boundary (see CLAUDE.md Security Rule #1/#2).
//
// Lazily constructed — this module is imported by every settings page load
// (via user-actions.ts), so eagerly creating the client at import time would
// crash the whole page if the env vars aren't set yet, not just uploads.
let client: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to upload avatars.",
      );
    }
    client = createClient(url, key);
  }
  return client;
}

// Idempotent — cheap no-op after the bucket exists. Called at the top of
// the upload action rather than at module load, since module load happens
// on every cold start and shouldn't make a network call before it's needed.
export async function ensureAvatarBucket() {
  const supabase = getClient();
  const { data: existing } = await supabase.storage.getBucket(AVATAR_BUCKET);
  if (existing) return;

  await supabase.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: "2MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
}

// mimeType must come from a magic-byte sniff of the actual content (see
// user-actions.ts), never from the client-supplied File.type — that's just
// whatever Content-Type the multipart request declared and is attacker
// controlled when the action is hit directly rather than through our form.
// This is also what gets stored as the object's Content-Type and served
// back to every browser that loads the public avatar URL, so trusting an
// unverified value here would let a renamed file get served as image/*.
export async function uploadAvatar(
  userId: string,
  bytes: Buffer,
  mimeType: string,
): Promise<string> {
  const supabase = getClient();
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort cleanup of the previous photo when replacing it — not worth
// failing the whole profile update over an orphaned file.
export async function deleteAvatar(url: string) {
  try {
    const marker = `/${AVATAR_BUCKET}/`;
    const index = url.indexOf(marker);
    if (index === -1) return;
    const path = url.slice(index + marker.length);
    await getClient().storage.from(AVATAR_BUCKET).remove([path]);
  } catch {
    // Ignore — cleanup is non-critical.
  }
}

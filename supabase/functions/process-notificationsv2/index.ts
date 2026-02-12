// process-notificationsv2/index.ts
// Version 2 of the notification processor - fixes the race condition
// from the per-row webhook approach by processing notifications in batch.
//
// Two modes:
//   1. "admin_broadcast" — Called directly from admin dashboard. Receives
//      full payload (recipients, title, message). Handles everything:
//      token lookup → Expo push → store in notifications table → audit trail.
//
//   2. "batch" — Called by cron to drain the pending_notifications queue.
//      Fetches all unprocessed records, marks them processed in ONE
//      atomic UPDATE, then sends them sequentially. No race condition.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Expo Push API helper ────────────────────────────────────────────
// Sends an array of messages (max 100) to Expo and returns ticket array.
async function sendToExpo(
  messages: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const resp = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Expo API ${resp.status}: ${text}`);
  }

  const result = await resp.json();
  return result.data ?? [];
}

// ─── JSON response shortcut ──────────────────────────────────────────
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Validate Expo push token format ─────────────────────────────────
function isValidExpoToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token);
}

// ─── Batched .in() query helper (avoids URL-too-long errors) ─────────
// Supabase REST uses GET with URL params for .in(), which crashes
// when passing 800+ UUIDs. This batches into chunks of 50.
async function batchedInQuery<T>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  selectCols: string,
  inColumn: string,
  inValues: string[],
  extraFilters?: Record<string, unknown>
): Promise<T[]> {
  const BATCH = 50;
  const results: T[] = [];
  for (let i = 0; i < inValues.length; i += BATCH) {
    const batch = inValues.slice(i, i + BATCH);
    let q = supabase.from(table).select(selectCols).in(inColumn, batch);
    if (extraFilters) {
      for (const [k, v] of Object.entries(extraFilters)) {
        q = q.eq(k, v);
      }
    }
    const { data, error } = await q;
    if (error) throw error;
    if (data) results.push(...(data as T[]));
  }
  return results;
}

// ─── Batched .in() update helper ─────────────────────────────────────
async function batchedInUpdate(
  supabase: ReturnType<typeof createClient>,
  table: string,
  updateData: Record<string, unknown>,
  inColumn: string,
  inValues: string[]
): Promise<void> {
  const BATCH = 50;
  for (let i = 0; i < inValues.length; i += BATCH) {
    const batch = inValues.slice(i, i + BATCH);
    const { error } = await supabase.from(table).update(updateData).in(inColumn, batch);
    if (error) console.error(`[WARN] batch update ${table}:`, error);
  }
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { mode } = body;

    // ── Auth check ─────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const token = authHeader.replace("Bearer ", "");

    if (mode === "admin_broadcast") {
      // Must be a real admin user (JWT)
      const {
        data: { user: authUser },
        error: authErr,
      } = await supabaseAdmin.auth.getUser(token);

      if (authErr || !authUser) return json({ error: "Invalid auth token" }, 401);

      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (profile?.role !== "admin") {
        return json({ error: "Admin access required" }, 403);
      }

      return await handleAdminBroadcast(supabaseAdmin, body, authUser.id);
    }

    if (mode === "batch") {
      // Batch mode can be called by cron (service-role key) or admin JWT
      return await handleBatchProcess(supabaseAdmin);
    }

    return json({ error: 'Invalid mode. Use "admin_broadcast" or "batch".' }, 400);
  } catch (err) {
    console.error("[FATAL]", err);
    return json({ error: (err as Error).message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────
// MODE 1: Admin Broadcast
// Called directly from the admin dashboard with the full payload.
// Bypasses pending_notifications webhooks entirely.
// ─────────────────────────────────────────────────────────────────────
async function handleAdminBroadcast(
  supabase: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
  adminUserId: string
) {
  const {
    recipients,
    title,
    message,
    notification_type,
    screen,
    metadata,
  } = body as {
    recipients: string[];
    title: string;
    message: string;
    notification_type?: string;
    screen?: string;
    metadata?: Record<string, unknown>;
  };

  if (!recipients?.length || !title || !message) {
    return json(
      { error: "Missing required fields: recipients, title, message" },
      400
    );
  }

  const t0 = Date.now();
  const type = notification_type ?? "dealership_notification";
  const targetScreen = screen ?? "/(home)";

  const stats = {
    totalRecipients: recipients.length,
    withTokens: 0,
    withoutTokens: 0,
    pushSent: 0,
    pushFailed: 0,
    stored: 0,
    invalidTokensDeactivated: 0,
    errors: [] as string[],
  };

  console.log(`[BROADCAST] Starting — ${recipients.length} recipients`);

  // 1. Fetch ALL active push tokens in batches (avoids URL-too-long) ──
  let allTokens: { user_id: string; token: string; device_type: string }[];
  try {
    allTokens = await batchedInQuery<{ user_id: string; token: string; device_type: string }>(
      supabase, "user_push_tokens", "user_id, token, device_type",
      "user_id", recipients, { active: true, signed_in: true }
    );
  } catch (tokErr) {
    console.error("[ERROR] Token fetch:", tokErr);
    return json({ error: "Failed to fetch push tokens" }, 500);
  }

  // Group tokens by user
  const tokensByUser = new Map<string, { token: string; device_type: string }[]>();
  for (const t of allTokens ?? []) {
    if (!isValidExpoToken(t.token)) continue;
    if (!tokensByUser.has(t.user_id)) tokensByUser.set(t.user_id, []);
    tokensByUser.get(t.user_id)!.push(t);
  }

  // 2. Build one Expo message per token ───────────────────────────────
  const allMessages: Record<string, unknown>[] = [];
  const tokenToUser = new Map<string, string>(); // token → user_id

  for (const userId of recipients) {
    const userTokens = tokensByUser.get(userId);
    if (!userTokens || userTokens.length === 0) {
      stats.withoutTokens++;
      continue;
    }
    stats.withTokens++;

    for (const tr of userTokens) {
      allMessages.push({
        to: tr.token,
        sound: "default",
        title,
        body: message,
        data: {
          type,
          screen: targetScreen,
          ...(metadata ?? {}),
        },
        badge: 1,
        channelId: "default",
        priority: "high",
      });
      tokenToUser.set(tr.token, userId);
    }
  }

  console.log(
    `[BROADCAST] ${stats.withTokens} users have tokens — ${allMessages.length} messages to send`
  );

  // 3. Send to Expo in chunks of 100 ─────────────────────────────────
  const CHUNK = 100;
  const invalidTokens = new Set<string>();

  for (let i = 0; i < allMessages.length; i += CHUNK) {
    const chunk = allMessages.slice(i, i + CHUNK);
    try {
      const tickets = await sendToExpo(chunk);

      for (let j = 0; j < tickets.length; j++) {
        const ticket = tickets[j] as { status: string; details?: { error?: string } };
        if (ticket.status === "ok") {
          stats.pushSent++;
        } else {
          stats.pushFailed++;
          if (ticket.details?.error === "DeviceNotRegistered") {
            invalidTokens.add((chunk[j] as { to: string }).to);
          }
        }
      }
    } catch (expoErr) {
      console.error("[ERROR] Expo chunk failed:", expoErr);
      stats.pushFailed += chunk.length;
      stats.errors.push(`Expo chunk ${Math.floor(i / CHUNK) + 1} failed: ${(expoErr as Error).message}`);
    }

    // Brief pause between Expo calls
    if (i + CHUNK < allMessages.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 4. Deactivate invalid tokens ──────────────────────────────────────
  if (invalidTokens.size > 0) {
    const arr = Array.from(invalidTokens);
    await batchedInUpdate(supabase, "user_push_tokens", { active: false }, "token", arr);
    stats.invalidTokensDeactivated = arr.length;
    console.log(`[INFO] Deactivated ${arr.length} invalid tokens`);
  }

  // 5. Store in-app notifications for ALL recipients ──────────────────
  const notifRows = recipients.map((uid) => ({
    user_id: uid,
    type,
    title,
    message,
    data: { screen: targetScreen, ...(metadata ?? {}) },
    is_read: false,
  }));

  for (let i = 0; i < notifRows.length; i += 100) {
    const chunk = notifRows.slice(i, i + 100);
    const { error: insErr } = await supabase.from("notifications").insert(chunk);
    if (insErr) {
      console.error(`[ERROR] notifications insert chunk ${i}:`, insErr);
      stats.errors.push(`notifications insert failed at offset ${i}`);
    } else {
      stats.stored += chunk.length;
    }
  }

  // 6. Audit trail in pending_notifications (processed=true so old ────
  //    webhook ignores them)
  const now = new Date();
  const hourMark = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  );

  const auditRows = recipients.map((uid) => ({
    user_id: uid,
    type,
    data: {
      title,
      message,
      screen: targetScreen,
      metadata: {
        ...(metadata ?? {}),
        sentBy: adminUserId,
        sentAt: now.toISOString(),
        processedBy: "v2",
      },
    },
    processed: true, // ← important: old webhook won't touch these
    created_at_hour: hourMark.toISOString(),
  }));

  for (let i = 0; i < auditRows.length; i += 100) {
    const chunk = auditRows.slice(i, i + 100);
    await supabase
      .from("pending_notifications")
      .insert(chunk)
      .then(({ error }) => {
        if (error) console.error("[WARN] audit insert:", error);
      });
  }

  // 7. Aggregate metric ───────────────────────────────────────────────
  await supabase
    .from("notification_metrics")
    .insert({
      type,
      user_id: adminUserId,
      delivery_status: stats.pushSent > 0 ? "sent" : "failed",
      platform: "deno",
      metadata: { mode: "admin_broadcast", ...stats, executionTimeMs: Date.now() - t0 },
    })
    .then(({ error }) => {
      if (error) console.error("[WARN] metric insert:", error);
    });

  const elapsed = Date.now() - t0;
  console.log(
    `[BROADCAST] Done in ${elapsed}ms — push sent: ${stats.pushSent}, failed: ${stats.pushFailed}, stored: ${stats.stored}`
  );

  return json({ success: true, ...stats, executionTimeMs: elapsed });
}

// ─────────────────────────────────────────────────────────────────────
// MODE 2: Batch Process
// Drains the pending_notifications queue. Called by cron or manually.
// Fixes the race condition by marking ALL records processed in a
// single atomic UPDATE before sending anything.
// ─────────────────────────────────────────────────────────────────────
async function handleBatchProcess(
  supabase: ReturnType<typeof createClient>
) {
  const t0 = Date.now();
  const stats = {
    total: 0,
    sent: 0,
    stored: 0,
    skippedNoToken: 0,
    errors: 0,
  };

  // 1. Fetch all unprocessed records ──────────────────────────────────
  const { data: pending, error: fetchErr } = await supabase
    .from("pending_notifications")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(500);

  if (fetchErr) {
    console.error("[ERROR] fetch pending:", fetchErr);
    return json({ error: fetchErr.message }, 500);
  }

  if (!pending || pending.length === 0) {
    return json({ message: "No pending notifications", ...stats });
  }

  stats.total = pending.length;
  console.log(`[BATCH] Processing ${stats.total} pending notifications`);

  // 2. Mark ALL as processed in batched updates ────────────────────
  const ids = pending.map((p: { id: string }) => p.id);
  await batchedInUpdate(supabase, "pending_notifications", { processed: true }, "id", ids);

  // 3. Collect all unique user IDs and fetch tokens in batches ───────
  const userIds = [...new Set(pending.map((p: { user_id: string }) => p.user_id))];

  let allTokens: { user_id: string; token: string; device_type: string }[] = [];
  try {
    allTokens = await batchedInQuery<{ user_id: string; token: string; device_type: string }>(
      supabase, "user_push_tokens", "user_id, token, device_type",
      "user_id", userIds, { active: true, signed_in: true }
    );
  } catch (e) {
    console.error("[ERROR] batch token fetch:", e);
  }

  const tokensByUser = new Map<string, { token: string; device_type: string }[]>();
  for (const t of allTokens ?? []) {
    if (!isValidExpoToken(t.token)) continue;
    if (!tokensByUser.has(t.user_id)) tokensByUser.set(t.user_id, []);
    tokensByUser.get(t.user_id)!.push(t);
  }

  // 4. Build Expo messages + notification rows ────────────────────────
  const allMessages: Record<string, unknown>[] = [];
  const notifRows: Record<string, unknown>[] = [];
  const invalidTokens = new Set<string>();

  for (const notif of pending) {
    const d = (notif.data as Record<string, unknown>) ?? {};
    const notifTitle = (d.title as string) ?? "Fleet";
    const notifMessage = (d.message as string) ?? "";
    const notifScreen = (d.screen as string) ?? "/(home)";
    const notifMeta = (d.metadata as Record<string, unknown>) ?? {};

    // In-app notification record (for everyone)
    notifRows.push({
      user_id: notif.user_id,
      type: notif.type,
      title: notifTitle,
      message: notifMessage,
      data: { screen: notifScreen, ...notifMeta },
      is_read: false,
    });

    // Push messages (only for users with tokens)
    const userTokens = tokensByUser.get(notif.user_id);
    if (!userTokens || userTokens.length === 0) {
      stats.skippedNoToken++;
      continue;
    }

    for (const tr of userTokens) {
      allMessages.push({
        to: tr.token,
        sound: "default",
        title: notifTitle,
        body: notifMessage,
        data: {
          type: notif.type,
          screen: notifScreen,
          ...notifMeta,
        },
        badge: 1,
        channelId: "default",
        priority: "high",
      });
    }
  }

  // 5. Send to Expo in chunks ─────────────────────────────────────────
  const CHUNK = 100;
  for (let i = 0; i < allMessages.length; i += CHUNK) {
    const chunk = allMessages.slice(i, i + CHUNK);
    try {
      const tickets = await sendToExpo(chunk);
      for (let j = 0; j < tickets.length; j++) {
        const t = tickets[j] as { status: string; details?: { error?: string } };
        if (t.status === "ok") {
          stats.sent++;
        } else {
          stats.errors++;
          if (t.details?.error === "DeviceNotRegistered") {
            invalidTokens.add((chunk[j] as { to: string }).to);
          }
        }
      }
    } catch (e) {
      console.error("[ERROR] Expo chunk:", e);
      stats.errors += chunk.length;
    }
    if (i + CHUNK < allMessages.length) await new Promise((r) => setTimeout(r, 200));
  }

  // 6. Deactivate dead tokens ─────────────────────────────────────────
  if (invalidTokens.size > 0) {
    await batchedInUpdate(supabase, "user_push_tokens", { active: false }, "token", Array.from(invalidTokens));
  }

  // 7. Bulk store in-app notifications ────────────────────────────────
  for (let i = 0; i < notifRows.length; i += 100) {
    const chunk = notifRows.slice(i, i + 100);
    const { error } = await supabase.from("notifications").insert(chunk);
    if (!error) stats.stored += chunk.length;
    else console.error("[ERROR] notif insert:", error);
  }

  const elapsed = Date.now() - t0;
  console.log(
    `[BATCH] Done in ${elapsed}ms — sent: ${stats.sent}, stored: ${stats.stored}, skipped: ${stats.skippedNoToken}, errors: ${stats.errors}`
  );

  return json({ success: true, ...stats, executionTimeMs: elapsed });
}

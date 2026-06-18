import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./store";

const ROW_ID = "shared";
const TABLE = "app_state";

// Keys of the store that represent persistent data (everything except
// transient session state and the rehydration flag).
const PERSISTED_KEYS = [
  "members",
  "departments",
  "bases",
  "courses",
  "daily",
  "admins",
  "settings",
] as const;

type PersistedKey = (typeof PERSISTED_KEYS)[number];
type Snapshot = Partial<Record<PersistedKey, unknown>>;

function pickSnapshot(state: Record<string, unknown>): Snapshot {
  const out: Snapshot = {};
  for (const k of PERSISTED_KEYS) out[k] = state[k];
  return out;
}

function snapshotsEqual(a: Snapshot, b: Snapshot): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

// Flag to prevent feedback loop when applying remote → local
let applyingRemote = false;
let lastSyncedJson = "";

async function pullAndApply(): Promise<void> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    console.warn("[cloud-sync] pull failed:", error.message);
    return;
  }

  // Row doesn't exist yet — create it from current local state.
  if (!data) {
    const initial = pickSnapshot(useStore.getState() as unknown as Record<string, unknown>);
    const { error: upErr } = await supabase
      .from(TABLE)
      .upsert({ id: ROW_ID, data: initial, updated_at: new Date().toISOString() });
    if (upErr) console.warn("[cloud-sync] seed failed:", upErr.message);
    lastSyncedJson = JSON.stringify(initial);
    return;
  }

  const remote = (data.data ?? {}) as Snapshot;
  const remoteJson = JSON.stringify(remote);

  // Empty remote → push local up instead of wiping local data.
  if (!remoteJson || remoteJson === "{}" || Object.keys(remote).length === 0) {
    const initial = pickSnapshot(useStore.getState() as unknown as Record<string, unknown>);
    await supabase
      .from(TABLE)
      .upsert({ id: ROW_ID, data: initial, updated_at: new Date().toISOString() });
    lastSyncedJson = JSON.stringify(initial);
    return;
  }

  applyingRemote = true;
  try {
    useStore.setState(remote as Partial<ReturnType<typeof useStore.getState>>);
  } finally {
    applyingRemote = false;
  }
  lastSyncedJson = remoteJson;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePush(snapshot: Snapshot): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    pushTimer = null;
    const json = JSON.stringify(snapshot);
    if (json === lastSyncedJson) return;
    const { error } = await supabase
      .from(TABLE)
      .upsert({ id: ROW_ID, data: snapshot, updated_at: new Date().toISOString() });
    if (error) {
      console.warn("[cloud-sync] push failed:", error.message);
      return;
    }
    lastSyncedJson = json;
  }, 400);
}

let started = false;
async function startCloudSync(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;

  await pullAndApply();

  // Subscribe to local store changes
  useStore.subscribe((state) => {
    if (applyingRemote) return;
    const snap = pickSnapshot(state as unknown as Record<string, unknown>);
    schedulePush(snap);
  });

  // Realtime: react to remote changes from other browsers
  supabase
    .channel("app_state_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const newRow = (payload.new ?? {}) as { data?: Snapshot };
        const remote = newRow.data ?? {};
        const remoteJson = JSON.stringify(remote);
        if (remoteJson === lastSyncedJson) return;
        applyingRemote = true;
        try {
          useStore.setState(remote as Partial<ReturnType<typeof useStore.getState>>);
        } finally {
          applyingRemote = false;
        }
        lastSyncedJson = remoteJson;
      },
    )
    .subscribe();
}

/** Mount this hook once at the root to enable cloud sync. */
export function useCloudSync(): void {
  useEffect(() => {
    void startCloudSync();
  }, []);
}

// Helper for callers that need it (currently unused, exported for completeness)
export { snapshotsEqual };

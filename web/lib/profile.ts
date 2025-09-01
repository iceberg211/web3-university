export type ProfileRecord = {
  name: string;
  message: string;
  signature: `0x${string}`;
};

const KEY = "profiles.v1";

function readAll(): Record<string, ProfileRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, ProfileRecord>) : {};
  } catch {
    return {};
  }
}

function writeAll(obj: Record<string, ProfileRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(obj));
}

export function getProfile(address: string | undefined): ProfileRecord | undefined {
  if (!address) return undefined;
  const db = readAll();
  return db[address.toLowerCase()];
}

export function saveProfile(address: string, rec: ProfileRecord) {
  const db = readAll();
  db[address.toLowerCase()] = rec;
  writeAll(db);
}


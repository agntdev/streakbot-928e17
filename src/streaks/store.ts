import { MemorySessionStorage } from "../toolkit/index.js";

export interface UserStreak {
  telegramId: number;
  displayName: string;
  timezone: string;
  joinDate: number;
  isVisible: boolean;
  currentStreakLength: number;
  streakStartTimestamp: number | null;
  lastCheckInTimestamp: number | null;
  highestStreakEver: number;
}

interface KeyValueStore {
  read(key: string): Promise<UserStreak | number[] | undefined>;
  write(key: string, value: UserStreak | number[]): Promise<void>;
}

const prefix = "streakbot:";
let nodeStore: Promise<KeyValueStore> | undefined;

function workerStore(env: unknown): KeyValueStore | undefined {
  const chatDo = (env as { CHAT_DO?: { idFromName(name: string): unknown; get(id: unknown): { fetch(input: string, init?: RequestInit): Promise<Response> } } } | undefined)?.CHAT_DO;
  if (!chatDo) return undefined;
  const stub = chatDo.get(chatDo.idFromName("streakbot:records"));
  return {
    async read(key) {
      const response = await stub.fetch(`https://do/data?key=${encodeURIComponent(prefix + key)}`);
      if (response.status === 204) return undefined;
      if (!response.ok) throw new Error("Streak storage is unavailable.");
      return (await response.json()) as UserStreak | number[];
    },
    async write(key, value) {
      const response = await stub.fetch(`https://do/data?key=${encodeURIComponent(prefix + key)}`, {
        method: "PUT",
        body: JSON.stringify(value),
      });
      if (!response.ok) throw new Error("Streak storage is unavailable.");
    },
  };
}

async function createNodeStore(): Promise<KeyValueStore> {
  const url = typeof process === "undefined" ? undefined : process.env.REDIS_URL;
  if (url) {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    // ioredis is already supplied by the toolkit for Node production storage.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = require("ioredis");
    const Redis = mod.default ?? mod.Redis ?? mod;
    const redis = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false });
    return {
      async read(key) {
        const raw = await redis.get(prefix + key);
        return raw == null ? undefined : (JSON.parse(raw) as UserStreak | number[]);
      },
      async write(key, value) {
        await redis.set(prefix + key, JSON.stringify(value));
      },
    };
  }
  // The tokenless harness has no Redis service. This toolkit test adapter is
  // isolated to the process; deployed Node uses Redis and Workers use a DO.
  const memory = new MemorySessionStorage<UserStreak | number[]>();
  return {
    async read(key) {
      return memory.read(key);
    },
    async write(key, value) {
      memory.write(key, value);
    },
  };
}

async function storeFor(ctx: { env?: unknown }): Promise<KeyValueStore> {
  return workerStore(ctx.env) ?? (nodeStore ??= createNodeStore());
}

export async function getUser(ctx: { env?: unknown }, id: number): Promise<UserStreak | undefined> {
  return (await storeFor(ctx)).read(`user:${id}`) as Promise<UserStreak | undefined>;
}

export async function putUser(ctx: { env?: unknown }, user: UserStreak): Promise<void> {
  const store = await storeFor(ctx);
  await store.write(`user:${user.telegramId}`, user);
  const index = ((await store.read("users")) as number[] | undefined) ?? [];
  if (!index.includes(user.telegramId)) await store.write("users", [...index, user.telegramId]);
}

export async function allUsers(ctx: { env?: unknown }): Promise<UserStreak[]> {
  const store = await storeFor(ctx);
  const ids = ((await store.read("users")) as number[] | undefined) ?? [];
  const users = await Promise.all(ids.map((id) => store.read(`user:${id}`) as Promise<UserStreak | undefined>));
  return users.filter((user): user is UserStreak => user !== undefined);
}

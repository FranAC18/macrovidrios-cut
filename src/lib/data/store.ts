import type { AppData } from "@/types/domain";
import { createSeedData } from "./seed";

declare global {
  // eslint-disable-next-line no-var
  var __macrovidriosData: AppData | undefined;
}

export function getData(): AppData {
  if (!globalThis.__macrovidriosData) {
    globalThis.__macrovidriosData = createSeedData();
  }
  return globalThis.__macrovidriosData;
}

export function resetData(): AppData {
  globalThis.__macrovidriosData = createSeedData();
  return globalThis.__macrovidriosData;
}

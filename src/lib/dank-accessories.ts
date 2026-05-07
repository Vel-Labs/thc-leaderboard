export type DankAccessoryId = "hat" | "glasses" | "necklace" | "joint";
export type DankAccessorySettings = {
  equipped: boolean;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  flipped: boolean;
};
export type DankAccessoryState = Record<DankAccessoryId, DankAccessorySettings>;
export type AccessoryMode = "clarity" | "dank";
export type ProfileAccessoryLoadouts = Record<AccessoryMode, DankAccessoryState>;

export const accessoryOrder: DankAccessoryId[] = ["hat", "glasses", "necklace", "joint"];
export const accessoryLabels: Record<DankAccessoryId, string> = {
  hat: "Hat",
  glasses: "Glasses",
  necklace: "Necklace",
  joint: "Joint",
};

export const defaultDankAccessories: DankAccessoryState = {
  hat: { equipped: false, x: 0, y: -37, scale: 1, opacity: 1, flipped: false },
  glasses: { equipped: false, x: 0, y: -17, scale: 1, opacity: 1, flipped: false },
  necklace: { equipped: false, x: 4, y: 28, scale: 1, opacity: 1, flipped: false },
  joint: { equipped: false, x: -23, y: 11, scale: 1, opacity: 1, flipped: false },
};

export const defaultClarityAccessories: DankAccessoryState = {
  hat: { equipped: false, x: 0, y: -38, scale: 0.95, opacity: 1, flipped: false },
  glasses: { equipped: false, x: 0, y: -15, scale: 0.88, opacity: 1, flipped: false },
  necklace: { equipped: false, x: 25, y: 22, scale: 0.72, opacity: 1, flipped: false },
  joint: { equipped: false, x: -24, y: 12, scale: 0.85, opacity: 1, flipped: false },
};

export const defaultProfileAccessoryLoadouts: ProfileAccessoryLoadouts = {
  clarity: defaultClarityAccessories,
  dank: defaultDankAccessories,
};

export function normalizeAccessoryState(value: unknown, defaultsById: DankAccessoryState = defaultDankAccessories): DankAccessoryState {
  if (typeof value === "string") {
    return normalizeAccessoryState(parseJsonValue(value), defaultsById);
  }

  const source = typeof value === "object" && value !== null ? (value as Partial<Record<DankAccessoryId, Partial<DankAccessorySettings>>>) : {};
  return accessoryOrder.reduce((state, id) => {
    const defaults = defaultsById[id];
    const incoming = source[id] ?? {};
    state[id] = {
      equipped: typeof incoming.equipped === "boolean" ? incoming.equipped : false,
      x: clampNumber(incoming.x, -64, 64, defaults.x),
      y: clampNumber(incoming.y, -72, 72, defaults.y),
      scale: clampNumber(incoming.scale, 0.35, 2, defaults.scale),
      opacity: clampNumber(incoming.opacity, 0.25, 1, defaults.opacity),
      flipped: typeof incoming.flipped === "boolean" ? incoming.flipped : defaults.flipped,
    };
    return state;
  }, {} as DankAccessoryState);
}

export function defaultAccessoriesForMode(mode: AccessoryMode) {
  return mode === "dank" ? defaultDankAccessories : defaultClarityAccessories;
}

export function normalizeProfileAccessoryLoadouts(value: unknown): ProfileAccessoryLoadouts {
  if (typeof value === "string") {
    return normalizeProfileAccessoryLoadouts(parseJsonValue(value));
  }

  const source = typeof value === "object" && value !== null ? (value as Partial<Record<AccessoryMode, unknown>>) : {};
  const legacyLooksLikeAccessoryState = accessoryOrder.some((id) => Object.prototype.hasOwnProperty.call(source, id));

  return {
    clarity: normalizeAccessoryState(source.clarity ?? defaultClarityAccessories, defaultClarityAccessories),
    dank: normalizeAccessoryState(source.dank ?? (legacyLooksLikeAccessoryState ? value : defaultDankAccessories), defaultDankAccessories),
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function parseJsonValue(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

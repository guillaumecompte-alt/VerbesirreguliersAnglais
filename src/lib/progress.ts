/**
 * Suivi de progression façon « boîtes de Leitner ».
 *
 * Chaque verbe vit dans une boîte (0 → 5). « Je savais » le fait monter d'une
 * boîte et repousse sa prochaine révision ; « À revoir » le renvoie en boîte 0,
 * à revoir le jour même. Un verbe est « maîtrisé » à partir de la boîte 4
 * (réussi 4 fois, à des jours d'intervalle croissants).
 */

export type VerbProgress = {
  /** Boîte de Leitner, 0 à MAX_BOX. */
  box: number;
  /** Timestamp (ms) à partir duquel le verbe est de nouveau à réviser. */
  due: number;
  /** Nombre de fois où le verbe a été noté. */
  seen: number;
  /** Nombre de « Je savais ». */
  known: number;
  /** Dernière révision (ms). */
  last: number;
};

export type ProgressState = {
  verbs: Record<string, VerbProgress>;
  /** Jours (AAAA-MM-JJ, heure locale) où l'élève a révisé. */
  days: string[];
};

export type VerbStatus = "new" | "due" | "learning" | "mastered";

/** Intervalle (en jours) avant la prochaine révision, selon la boîte atteinte. */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const MAX_BOX = INTERVAL_DAYS.length - 1;
export const MASTERED_BOX = 4;

export const STATUS_LABEL: Record<VerbStatus, string> = {
  new: "Nouveau",
  due: "À revoir",
  learning: "En cours",
  mastered: "Maîtrisé",
};

export const STORAGE_KEY = "iv-progress-v1";

export const emptyProgress = (): ProgressState => ({ verbs: {}, days: [] });

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(t: number) {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}

/** Enregistre une réponse et renvoie un nouvel état (immutable). */
export function recordAnswer(
  state: ProgressState,
  key: string,
  knew: boolean,
  now = Date.now(),
): ProgressState {
  const prev = state.verbs[key];
  const box = knew ? Math.min((prev?.box ?? 0) + 1, MAX_BOX) : 0;
  const due = knew ? startOfDay(now) + INTERVAL_DAYS[box]! * DAY_MS : now;
  const today = dayKey(now);
  return {
    verbs: {
      ...state.verbs,
      [key]: {
        box,
        due,
        seen: (prev?.seen ?? 0) + 1,
        known: (prev?.known ?? 0) + (knew ? 1 : 0),
        last: now,
      },
    },
    days: state.days.includes(today) ? state.days : [...state.days, today],
  };
}

export function statusOf(
  p: VerbProgress | undefined,
  now = Date.now(),
): VerbStatus {
  if (!p) return "new";
  if (p.due <= now) return "due";
  return p.box >= MASTERED_BOX ? "mastered" : "learning";
}

/** Nombre de jours consécutifs de révision, jusqu'à aujourd'hui (ou hier). */
export function streak(days: string[], now = Date.now()): number {
  const set = new Set(days);
  let t = startOfDay(now);
  if (!set.has(dayKey(t))) t -= DAY_MS; // pas encore révisé aujourd'hui : la série tient encore
  let n = 0;
  while (set.has(dayKey(t))) {
    n++;
    // Recalage sur minuit pour encaisser les changements d'heure.
    t = startOfDay(t - DAY_MS / 2);
  }
  return n;
}

export function countByStatus(
  keys: string[],
  state: ProgressState,
  now = Date.now(),
) {
  const counts: Record<VerbStatus, number> = {
    new: 0,
    due: 0,
    learning: 0,
    mastered: 0,
  };
  for (const k of keys) counts[statusOf(state.verbs[k], now)]++;
  return counts;
}

/** Lit l'état sauvegardé en tolérant les données absentes ou abîmées. */
export function parseProgress(raw: string | null): ProgressState {
  if (!raw) return emptyProgress();
  try {
    const data = JSON.parse(raw) as Partial<ProgressState>;
    const verbs: ProgressState["verbs"] = {};
    for (const [k, v] of Object.entries(data.verbs ?? {})) {
      if (v && typeof v.box === "number" && typeof v.due === "number") {
        verbs[k] = {
          box: Math.max(0, Math.min(MAX_BOX, v.box)),
          due: v.due,
          seen: Number(v.seen) || 0,
          known: Number(v.known) || 0,
          last: Number(v.last) || 0,
        };
      }
    }
    const days = Array.isArray(data.days)
      ? data.days.filter((d): d is string => typeof d === "string")
      : [];
    return { verbs, days };
  } catch {
    return emptyProgress();
  }
}

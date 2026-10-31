/**
 * Code de sauvegarde : transfère la progression d'un appareil à l'autre,
 * sans serveur.
 *
 * Pour chaque verbe (dans l'ordre de la liste), on garde sa boîte et le nombre
 * de jours avant sa prochaine révision. Chaque verbe a donc un état parmi 62 :
 * « jamais vu », ou une combinaison boîte / jours restants valide. Les 75 états
 * sont empilés dans un grand nombre (le 1er verbe en poids faible), écrit en
 * base 32 sans caractères ambigus. Comme les élèves découvrent les verbes dans
 * l'ordre de la liste, les verbes jamais vus sont surtout en fin de liste et le
 * code reste court tant que peu de verbes ont été travaillés.
 *
 * Format : version + chiffres + caractère de contrôle, groupés par 4.
 * Les compteurs détaillés (nombre de révisions, série de jours) ne sont pas
 * transférés : seuls comptent l'état de chaque verbe et sa date de révision.
 */
import { INTERVAL_DAYS, startOfDay, type ProgressState } from "@/lib/progress";
import { VERBS } from "@/lib/verbs";

// Base 32 de Crockford : pas de I, L, O, U pour éviter les confusions.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const VERSION = "1";
const DAY_MS = 24 * 60 * 60 * 1000;

/** États possibles d'un verbe : [boîte, jours restants], l'index 0 = jamais vu. */
const STATES: Array<[number, number] | null> = [null];
INTERVAL_DAYS.forEach((interval, box) => {
  for (let r = 0; r <= interval; r++) STATES.push([box, r]);
});
const RADIX = BigInt(STATES.length);

function stateIndex(box: number, remaining: number) {
  return STATES.findIndex(
    (s) => s !== null && s[0] === box && s[1] === remaining,
  );
}

function checksum(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++)
    sum += (i + 1) * ALPHABET.indexOf(digits[i]!);
  return ALPHABET[sum % 32]!;
}

/** Génère le code de sauvegarde de la progression actuelle. */
export function encodeProgress(state: ProgressState, now = Date.now()): string {
  const today = startOfDay(now);
  let n = 0n;
  for (let i = VERBS.length - 1; i >= 0; i--) {
    const p = state.verbs[VERBS[i]!.base];
    let idx = 0;
    if (p) {
      const interval = INTERVAL_DAYS[p.box] ?? 0;
      const remaining =
        p.due <= now
          ? 0
          : Math.min(
              interval,
              Math.max(0, Math.ceil((p.due - today) / DAY_MS)),
            );
      idx = stateIndex(p.box, remaining);
      if (idx < 0) idx = stateIndex(p.box, 0);
    }
    n = n * RADIX + BigInt(idx);
  }
  let digits = "";
  do {
    digits = ALPHABET[Number(n % 32n)] + digits;
    n /= 32n;
  } while (n > 0n);
  const raw = VERSION + digits;
  return (raw + checksum(raw)).match(/.{1,4}/g)!.join("-");
}

export type DecodeResult =
  | { ok: true; state: ProgressState; count: number }
  | { ok: false; error: string };

/** Lit un code saisi ou collé, en tolérant espaces, tirets et minuscules. */
export function decodeProgress(input: string, now = Date.now()): DecodeResult {
  const code = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (code.length < 3) return { ok: false, error: "Ce code est trop court." };
  const bad = [...code].find((c) => !ALPHABET.includes(c));
  if (bad)
    return {
      ok: false,
      error: `Le caractère « ${bad} » n'existe pas dans les codes.`,
    };
  const raw = code.slice(0, -1);
  if (checksum(raw) !== code.slice(-1))
    return {
      ok: false,
      error:
        "Ce code contient une erreur de recopie. Vérifie-le caractère par caractère.",
    };
  if (raw[0] !== VERSION)
    return {
      ok: false,
      error: "Ce code ne correspond pas à cette application.",
    };

  let n = 0n;
  for (const c of raw.slice(1)) n = n * 32n + BigInt(ALPHABET.indexOf(c));

  const today = startOfDay(now);
  const verbs: ProgressState["verbs"] = {};
  for (const v of VERBS) {
    const s = STATES[Number(n % RADIX)];
    n /= RADIX;
    if (!s) continue;
    const [box, remaining] = s;
    verbs[v.base] = {
      box,
      due: remaining === 0 ? now - 1 : today + remaining * DAY_MS,
      seen: 0,
      known: 0,
      last: 0,
    };
  }
  if (n !== 0n)
    return {
      ok: false,
      error: "Ce code ne correspond pas à cette application.",
    };
  return {
    ok: true,
    state: { verbs, days: [] },
    count: Object.keys(verbs).length,
  };
}

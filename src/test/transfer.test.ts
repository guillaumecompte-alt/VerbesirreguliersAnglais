import { describe, expect, it } from "vitest";

import { emptyProgress, recordAnswer, statusOf } from "@/lib/progress";
import { decodeProgress, encodeProgress } from "@/lib/transfer";
import { VERBS } from "@/lib/verbs";

const DAY = 24 * 60 * 60 * 1000;
const NOON = new Date(2026, 9, 31, 12, 0, 0).getTime();

function sample() {
  let s = emptyProgress();
  s = recordAnswer(s, "be", false, NOON); // à revoir
  s = recordAnswer(s, "go", true, NOON); // boîte 1, demain
  for (const t of [0, 1, 4, 11])
    s = recordAnswer(s, "write", true, NOON + t * DAY); // boîte 4
  return s;
}

describe("code de sauvegarde", () => {
  it("restitue la même progression sur un autre appareil", () => {
    const s = sample();
    const res = decodeProgress(
      encodeProgress(s, NOON + 11 * DAY),
      NOON + 11 * DAY,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.count).toBe(3);
    for (const base of ["be", "go", "write"]) {
      expect(res.state.verbs[base]!.box).toBe(s.verbs[base]!.box);
      for (const t of [11, 12, 20, 30, 60].map((d) => NOON + d * DAY))
        expect(statusOf(res.state.verbs[base], t)).toBe(
          statusOf(s.verbs[base], t),
        );
    }
  });

  it("reste court tant que peu de verbes ont été travaillés", () => {
    expect(encodeProgress(emptyProgress(), NOON)).toMatch(/^[0-9A-Z]{3}$/);
    let s = emptyProgress();
    for (const v of VERBS.slice(0, 10)) s = recordAnswer(s, v.base, true, NOON);
    expect(
      encodeProgress(s, NOON).replace(/-/g, "").length,
    ).toBeLessThanOrEqual(16);
  });

  it("accepte minuscules, espaces et confusions O/0, I/1", () => {
    const code = encodeProgress(sample(), NOON);
    const typed = code
      .toLowerCase()
      .replace(/-/g, " ")
      .replace(/0/g, "o")
      .replace(/1/g, "i");
    expect(decodeProgress(typed, NOON).ok).toBe(true);
  });

  it("repère une faute de recopie", () => {
    const code = encodeProgress(sample(), NOON).replace(/-/g, "");
    const i = 3;
    const wrong =
      code.slice(0, i) + (code[i] === "A" ? "B" : "A") + code.slice(i + 1);
    const res = decodeProgress(wrong, NOON);
    expect(res.ok).toBe(false);
    expect(decodeProgress("bonjour", NOON).ok).toBe(false);
  });
});

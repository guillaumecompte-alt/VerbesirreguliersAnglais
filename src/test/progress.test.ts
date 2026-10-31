import { describe, expect, it } from "vitest";

import {
  countByStatus,
  emptyProgress,
  MASTERED_BOX,
  parseProgress,
  recordAnswer,
  statusOf,
  streak,
} from "@/lib/progress";

const DAY = 24 * 60 * 60 * 1000;
const NOON = new Date(2026, 9, 31, 12, 0, 0).getTime();

describe("progression", () => {
  it("un verbe jamais vu est nouveau", () => {
    expect(statusOf(undefined, NOON)).toBe("new");
  });

  it("« Je savais » fait monter de boîte et repousse la révision", () => {
    const s = recordAnswer(emptyProgress(), "go", true, NOON);
    expect(s.verbs["go"]).toMatchObject({ box: 1, seen: 1, known: 1 });
    expect(statusOf(s.verbs["go"], NOON)).toBe("learning");
    expect(statusOf(s.verbs["go"], NOON + DAY)).toBe("due");
  });

  it("« À revoir » renvoie en boîte 0, à revoir tout de suite", () => {
    let s = recordAnswer(emptyProgress(), "go", true, NOON);
    s = recordAnswer(s, "go", true, NOON + 2 * DAY);
    s = recordAnswer(s, "go", false, NOON + 6 * DAY);
    expect(s.verbs["go"]).toMatchObject({ box: 0, seen: 3, known: 2 });
    expect(statusOf(s.verbs["go"], NOON + 6 * DAY)).toBe("due");
  });

  it("un verbe réussi plusieurs fois devient maîtrisé", () => {
    let s = emptyProgress();
    let t = NOON;
    for (let i = 0; i < MASTERED_BOX; i++) {
      s = recordAnswer(s, "go", true, t);
      t = s.verbs["go"]!.due + 1000;
    }
    expect(statusOf(s.verbs["go"], s.verbs["go"]!.last)).toBe("mastered");
  });

  it("compte les verbes par statut", () => {
    const s = recordAnswer(
      recordAnswer(emptyProgress(), "go", true, NOON),
      "be",
      false,
      NOON,
    );
    expect(countByStatus(["go", "be", "do"], s, NOON + 1)).toEqual({
      new: 1,
      due: 1,
      learning: 1,
      mastered: 0,
    });
  });

  it("calcule la série de jours consécutifs", () => {
    let s = emptyProgress();
    for (const d of [0, 1, 2, 4, 5])
      s = recordAnswer(s, "go", true, NOON + d * DAY);
    expect(streak(s.days, NOON + 5 * DAY)).toBe(2);
    expect(streak(s.days, NOON + 6 * DAY)).toBe(2); // pas encore révisé aujourd'hui
    expect(streak(s.days, NOON + 7 * DAY)).toBe(0);
  });

  it("résiste à des données sauvegardées abîmées", () => {
    expect(parseProgress("pas du json")).toEqual(emptyProgress());
    expect(
      parseProgress(
        JSON.stringify({
          verbs: { go: { box: 99, due: 1 }, x: null },
          days: [1, "2026-10-31"],
        }),
      ),
    ).toEqual({
      verbs: { go: { box: 5, due: 1, seen: 0, known: 0, last: 0 } },
      days: ["2026-10-31"],
    });
  });
});

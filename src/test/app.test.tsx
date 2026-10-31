import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { VerbApp } from "@/components/verbs/VerbApp";

describe("VerbApp", () => {
  beforeEach(() => localStorage.clear());

  it("affiche la progression et lance une session de découverte", async () => {
    render(<VerbApp />);
    expect(await screen.findByText("TA PROGRESSION")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Découvrir 10 nouveaux verbes/ }),
    );
    expect(screen.getByText("MODE FLASHCARDS")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Voir la réponse/ }));
    fireEvent.click(screen.getByRole("button", { name: "Je savais" }));
    expect(screen.getByText(/CARTE/)).toHaveTextContent("02");
    expect(localStorage.getItem("iv-progress-v1")).toContain('"box":1');
  });

  it("cumule plusieurs filtres pour une révision générale", async () => {
    const now = Date.now();
    const D = 86400000;
    localStorage.setItem(
      "iv-progress-v1",
      JSON.stringify({
        verbs: {
          be: { box: 0, due: now - 1000, seen: 1, known: 0, last: now },
          go: { box: 2, due: now + 3 * D, seen: 2, known: 2, last: now },
          do: { box: 5, due: now + 30 * D, seen: 5, known: 5, last: now },
        },
        days: [],
      }),
    );
    render(<VerbApp />);
    await screen.findByText("TA PROGRESSION");

    for (const name of [/À revoir/, /En cours/, /Maîtrisé/])
      fireEvent.click(screen.getAllByRole("button", { name }).at(-1)!);
    expect(screen.getByText("3 verbes affichés.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cocher la liste" }));
    expect(screen.getByText("03")).toBeInTheDocument();
  });
});

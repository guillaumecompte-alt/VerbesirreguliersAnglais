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

describe("changement d'appareil", () => {
  beforeEach(() => localStorage.clear());

  it("transfère la progression grâce au code", async () => {
    const now = Date.now();
    localStorage.setItem(
      "iv-progress-v1",
      JSON.stringify({
        verbs: {
          go: {
            box: 5,
            due: now + 30 * 86400000,
            seen: 5,
            known: 5,
            last: now,
          },
        },
        days: [],
      }),
    );
    const first = render(<VerbApp />);
    await screen.findByText("TA PROGRESSION");
    fireEvent.click(screen.getByRole("button", { name: /Changer d'appareil/ }));
    const code = document.getElementById("transfer-code")!.textContent!;
    first.unmount();

    // « Autre appareil » : navigateur vierge.
    localStorage.clear();
    render(<VerbApp />);
    await screen.findByText("TA PROGRESSION");
    fireEvent.click(screen.getByRole("button", { name: /Changer d'appareil/ }));
    fireEvent.change(screen.getByLabelText(/colle ou recopie/), {
      target: { value: code.toLowerCase() },
    });
    fireEvent.click(screen.getByRole("button", { name: "Récupérer" }));
    expect(
      screen.getByText(/Progression récupérée : 1 verbe/),
    ).toBeInTheDocument();
    expect(localStorage.getItem("iv-progress-v1")).toContain('"box":5');
  });
});

describe("verbe raté pendant une session", () => {
  beforeEach(() => localStorage.clear());

  it("revient 3 ou 4 cartes plus tard, sans évaluation ni effet sur la progression", async () => {
    render(<VerbApp />);
    await screen.findByText("TA PROGRESSION");
    fireEvent.click(
      screen.getByRole("button", { name: /Découvrir 10 nouveaux verbes/ }),
    );

    const flip = () =>
      fireEvent.click(screen.getByRole("button", { name: /Voir la réponse/ }));
    const saved = () =>
      JSON.parse(localStorage.getItem("iv-progress-v1")!).verbs as Record<
        string,
        { box: number; seen: number }
      >;

    // Carte 1 : ratée.
    flip();
    fireEvent.click(screen.getByRole("button", { name: "À revoir" }));
    const missed = Object.keys(saved()).find((k) => saved()[k]!.box === 0)!;
    expect(screen.getByText(/CARTE/)).toHaveTextContent("/ 11");

    // Les cartes suivantes sont réussies jusqu'au deuxième essai.
    let card = 2;
    while (!screen.queryByText("DEUXIÈME ESSAI")) {
      flip();
      fireEvent.click(screen.getByRole("button", { name: "Je savais" }));
      card++;
    }
    expect([5, 6]).toContain(card);

    // Deuxième essai : seulement « Suivante », et la progression ne bouge pas.
    flip();
    expect(screen.queryByRole("button", { name: "Je savais" })).toBeNull();
    expect(screen.queryByRole("button", { name: "À revoir" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Suivante/ }));
    expect(saved()[missed]).toMatchObject({ box: 0, seen: 1 });
  });
});

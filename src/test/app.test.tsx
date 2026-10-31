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
});

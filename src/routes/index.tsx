import { createFileRoute } from "@tanstack/react-router";

import { VerbApp } from "@/components/verbs/VerbApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Irregular Verbs — Révision d’anglais" },
      {
        name: "description",
        content:
          "Révise les 75 verbes irréguliers anglais de 5e avec des flashcards, la prononciation et un suivi de ta progression.",
      },
      { property: "og:title", content: "Irregular Verbs — Révision d’anglais" },
      {
        property: "og:description",
        content:
          "Flashcards, prononciation et suivi de progression pour mémoriser les verbes irréguliers anglais.",
      },
    ],
  }),
  component: VerbApp,
});

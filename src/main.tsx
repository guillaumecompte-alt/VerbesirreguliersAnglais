import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { VerbApp } from "@/components/verbs/VerbApp";

import "./styles.css";
import "./progress.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VerbApp />
  </StrictMode>,
);

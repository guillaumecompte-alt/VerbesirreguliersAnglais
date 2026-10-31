import { useState } from "react";

import type { ProgressState } from "@/lib/progress";
import { decodeProgress, encodeProgress } from "@/lib/transfer";

/**
 * « Changer d'appareil » : affiche le code de sauvegarde de cet appareil et
 * permet d'en saisir un venu d'ailleurs. Rien ne transite par un serveur.
 */
export function TransferPanel({
  progress,
  now,
  onReplace,
}: {
  progress: ProgressState;
  now: number;
  onReplace: (state: ProgressState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [pending, setPending] = useState<{
    state: ProgressState;
    count: number;
  } | null>(null);

  if (!open)
    return (
      <button
        type="button"
        className="transfer-toggle"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⇄</span> Changer d'appareil
      </button>
    );

  const code = encodeProgress(progress, now);
  const hasProgress = Object.keys(progress.verbs).length > 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers refusé : on sélectionne le code pour une copie manuelle.
      const el = document.getElementById("transfer-code");
      if (el) window.getSelection()?.selectAllChildren(el);
    }
  };

  const apply = (state: ProgressState, count: number) => {
    onReplace(state);
    setPending(null);
    setInput("");
    setMessage({
      ok: true,
      text:
        count > 0
          ? `Progression récupérée : ${count} verbe${count > 1 ? "s" : ""} déjà travaillé${count > 1 ? "s" : ""}.`
          : "Code valide, mais il ne contient encore aucun verbe travaillé.",
    });
  };

  const check = () => {
    const res = decodeProgress(input);
    if (!res.ok) {
      setPending(null);
      setMessage({ ok: false, text: res.error });
      return;
    }
    setMessage(null);
    if (hasProgress) setPending({ state: res.state, count: res.count });
    else apply(res.state, res.count);
  };

  return (
    <div className="transfer-panel">
      <div className="transfer-head">
        <strong>Changer d'appareil</strong>
        <button
          type="button"
          className="progress-reset"
          onClick={() => {
            setOpen(false);
            setMessage(null);
            setPending(null);
          }}
        >
          Fermer
        </button>
      </div>

      <div className="transfer-block">
        <p className="transfer-label">
          1. Sur l'appareil où tu as révisé, copie ton code :
        </p>
        <div className="transfer-code-row">
          <code id="transfer-code" className="transfer-code">
            {code}
          </code>
          <button type="button" className="btn-outline" onClick={copy}>
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
        <p className="transfer-note">
          Le code change à chaque révision : reprends toujours le plus récent.
        </p>
      </div>

      <form
        className="transfer-block"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <label className="transfer-label" htmlFor="transfer-input">
          2. Sur l'autre appareil, colle ou recopie-le ici :
        </label>
        <div className="transfer-code-row">
          <input
            id="transfer-input"
            className="transfer-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setMessage(null);
              setPending(null);
            }}
            placeholder="Ex. 1BEK-M9AP-…"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!input.trim()}
          >
            Récupérer
          </button>
        </div>
      </form>

      {pending && (
        <div className="transfer-confirm" role="alert">
          <span>
            Ce code remplacera la progression de cet appareil ({pending.count}{" "}
            verbe{pending.count > 1 ? "s" : ""} travaillé
            {pending.count > 1 ? "s" : ""} dans le code).
          </span>
          <div>
            <button
              type="button"
              className="progress-reset is-danger"
              onClick={() => apply(pending.state, pending.count)}
            >
              Remplacer
            </button>
            <button
              type="button"
              className="progress-reset"
              onClick={() => setPending(null)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {message && (
        <p
          className={`transfer-message ${message.ok ? "is-ok" : "is-error"}`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

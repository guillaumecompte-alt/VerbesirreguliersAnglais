import { useEffect, useRef, useState } from "react";

/** Bouton « Comment ça marche ? » et fenêtre d'explication pour les élèves. */
export function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="help-button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="help-button-icon" aria-hidden="true">
          ?
        </span>
        Comment ça marche ?
      </button>
      {open && <HelpDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="help-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <div className="help-header">
          <h2 id="help-title">Verbes irréguliers : comment ça marche ?</h2>
          <button
            ref={closeRef}
            type="button"
            className="help-close"
            onClick={onClose}
            aria-label="Fermer l'explication"
          >
            ✕
          </button>
        </div>

        <div className="help-body">
          <section>
            <h3>Pendant une session</h3>
            <ul>
              <li>
                Lis le verbe en français, cherche les 3 formes anglaises dans ta
                tête, puis retourne la carte.
              </li>
              <li>
                Sois honnête :
                <ul>
                  <li>
                    <strong className="help-know">✓ Je savais</strong> si tu
                    avais trouvé les 3 formes ;
                  </li>
                  <li>
                    <strong className="help-miss">✗ À revoir</strong> s'il t'en
                    manquait une.
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h3>Si tu te trompes</h3>
            <ul>
              <li>
                Le verbe revient <strong>3 ou 4 cartes plus tard</strong>, pour
                un deuxième essai.
              </li>
              <li>
                Ce deuxième essai sert à t'entraîner, il{" "}
                <strong>ne compte pas</strong>. Seule ta première réponse est
                prise en compte.
              </li>
              <li>
                Le verbe passe en « À revoir » et te sera reproposé à ta
                prochaine révision.
              </li>
            </ul>
          </section>

          <section>
            <h3>Ta progression</h3>
            <p>Chaque verbe a un niveau :</p>
            <ul className="help-statuses">
              <li data-status="new">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>Nouveau</strong> : tu ne l'as jamais travaillé.
                </span>
              </li>
              <li data-status="due">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>À revoir</strong> : tu l'as raté, ou c'est le moment
                  de le réviser.
                </span>
              </li>
              <li data-status="learning">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>En cours</strong> : tu le connais, mais il faut encore
                  le consolider.
                </span>
              </li>
              <li data-status="mastered">
                <span className="status-dot" aria-hidden="true" />
                <span>
                  <strong>Maîtrisé</strong> : tu l'as réussi 4 fois, à quelques
                  jours d'écart.
                </span>
              </li>
            </ul>
            <p className="help-tip">
              <span aria-hidden="true">👉</span> Le plus efficace : un peu
              chaque jour, en commençant par le bouton « Réviser les verbes à
              revoir ».
            </p>
          </section>

          <section className="help-warning">
            <h3>
              <span aria-hidden="true">⚠️</span> Important : ta progression
              reste sur ton appareil
            </h3>
            <ul>
              <li>
                Elle est enregistrée <strong>dans le navigateur</strong> que tu
                utilises (Chrome, Safari…), sur l'ordinateur ou le téléphone où
                tu révises. Il n'y a pas de compte.
              </li>
              <li>
                Utilise donc{" "}
                <strong>toujours le même appareil et le même navigateur</strong>
                .
              </li>
              <li>
                N'utilise pas la <strong>navigation privée</strong> : tout
                s'efface quand tu fermes la fenêtre.
              </li>
              <li>
                Si tu effaces l'historique ou les données de ton navigateur, ta
                progression est perdue.
              </li>
              <li>
                Si tu dois changer d'appareil, clique sur{" "}
                <strong>⇄ Changer d'appareil</strong> sur l'ancien, copie ton
                code et colle-le sur le nouveau.
              </li>
            </ul>
          </section>
        </div>

        <div className="help-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}

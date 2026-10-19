import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { VERBS, type Verb } from "@/lib/verbs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Irregular Verbs — Révision d’anglais" },
      { name: "description", content: "Révise les 75 verbes irréguliers anglais de 5e avec des flashcards interactives et la prononciation." },
      { property: "og:title", content: "Irregular Verbs — Révision d’anglais" },
      { property: "og:description", content: "Flashcards et prononciation pour mémoriser les verbes irréguliers anglais." },
    ],
  }),
  component: Index,
});

const KEY = "iv-selected";

function speak(v: Verb) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`${v.base}. ${v.preterit}. ${v.participle}.`);
  u.lang = "en-GB";
  u.rate = 0.8;
  const voice = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("en-GB")) ??
    window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("en"));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = b[i]!; b[i] = b[j]!; b[j] = t;
  }
  return b;
}

function Index() {
  const [tab, setTab] = useState<"choose" | "train">("choose");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "[]");
      setSelected(new Set(s));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...selected]));
  }, [selected]);

  return (
    <div className="app-shell">
      <div className="app-ambient app-ambient-violet" aria-hidden="true" />
      <div className="app-ambient app-ambient-teal" aria-hidden="true" />

      <header className="app-topbar">
        <div className="app-brand">
          <div className="app-brand-mark" aria-hidden="true">V.</div>
          <div>
            <div className="app-brand-name">VERB<span>LAB</span></div>
            <div className="app-brand-subtitle">ENGLISH · RÉVISION</div>
          </div>
        </div>
        <div className="header-pill">ANGLAIS <span aria-hidden="true">/</span> 5ᵉ</div>
      </header>

      <section className="app-hero">
        <div className="hero-copy-block">
          <div className="eyebrow">TON ESPACE DE RÉVISION</div>
          <h1>Irregular <span>Verbs.</span></h1>
          <p className="hero-description">
            Mémorise les verbes irréguliers à ton rythme. Choisis ceux à travailler,
            retourne les cartes et écoute leur prononciation en anglais.
          </p>
          <div className="hero-metrics">
            <div className="hero-metric"><strong>{VERBS.length}</strong> verbes à réviser</div>
            <div className="hero-metric"><strong>{selected.size}</strong> sélectionnés</div>
            <div className="hero-metric"><span aria-hidden="true">♫</span> prononciation audio</div>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="hero-illustration-inner">
            <span className="hero-letter">A</span>
            <span className="hero-letter">B</span>
          </div>
        </div>
      </section>

      <main className="app-main">
        <nav className="session-tabs" aria-label="Étapes de révision">
          <button
            type="button"
            onClick={() => setTab("choose")}
            className={`session-tab ${tab === "choose" ? "active" : ""}`}
            aria-current={tab === "choose" ? "step" : undefined}
          >
            Choix des verbes <span className="tab-count">{selected.size}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("train")}
            className={`session-tab ${tab === "train" ? "active" : ""}`}
            aria-current={tab === "train" ? "step" : undefined}
          >
            Entraînement <span className="tab-count">↗</span>
          </button>
        </nav>

        {tab === "choose" ? (
          <Choose selected={selected} setSelected={setSelected} onStart={() => setTab("train")} />
        ) : (
          <Train selected={selected} onBack={() => setTab("choose")} />
        )}
      </main>

      <footer className="app-footer">
        <span>LE HUB<span aria-hidden="true">.</span> · APPRENDRE À SON RYTHME</span>
        <span><strong>{selected.size}</strong> verbe{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}</span>
      </footer>
    </div>
  );
}

function Choose({ selected, setSelected, onStart }: { selected: Set<number>; setSelected: (s: Set<number>) => void; onStart: () => void }) {
  const toggle = (i: number) => {
    const s = new Set(selected);
    s.has(i) ? s.delete(i) : s.add(i);
    setSelected(s);
  };

  return (
    <section className="choose-panel" aria-labelledby="choose-heading">
      <div className="section-intro">
        <div>
          <p className="section-eyebrow">ÉTAPE 01 · PRÉPARATION</p>
          <h2 id="choose-heading">Compose ton paquet</h2>
          <p className="section-description">Sélectionne les verbes que tu veux mémoriser pendant cette session.</p>
        </div>
        <div className="selected-counter" aria-live="polite">
          <strong>{String(selected.size).padStart(2, "0")}</strong>
          <span>VERBES<br />SÉLECTIONNÉS</span>
        </div>
      </div>

      <div className="choose-toolbar">
        <p className="toolbar-hint">Astuce : commence par quelques verbes, puis agrandis ta sélection.</p>
        <div className="toolbar-actions">
          <button type="button" className="btn-outline" onClick={() => setSelected(new Set(VERBS.map((_, i) => i)))}>Tout cocher</button>
          <button type="button" className="btn-outline" onClick={() => setSelected(new Set())}>Tout décocher</button>
          <button type="button" className="btn-primary" disabled={!selected.size} onClick={onStart}>S'entraîner <span aria-hidden="true">→</span></button>
        </div>
      </div>

      <div className="verb-grid">
        {VERBS.map((v, i) => (
          <label key={i} className={`verb-option ${selected.has(i) ? "is-selected" : ""}`}>
            <input
              type="checkbox"
              checked={selected.has(i)}
              onChange={() => toggle(i)}
              className="verb-checkbox"
              aria-label={`Sélectionner ${v.base}`}
            />
            <span className="verb-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="verb-base">{v.base}</span>
            <span className="verb-meaning">{v.fr}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function Train({ selected, onBack }: { selected: Set<number>; onBack: () => void }) {
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => shuffle([...selected].sort((a, b) => a - b).map((i) => VERBS[i]!), [selected, seed]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!deck.length)
    return (
      <div className="train-view">
        <div className="empty-training">
          <div className="completion-icon" aria-hidden="true">＋</div>
          <p className="section-eyebrow">TON PAQUET EST VIDE</p>
          <h2 className="completion-title">Choisis tes premiers verbes</h2>
          <p className="completion-copy">Sélectionne au moins un verbe pour lancer une session de flashcards.</p>
          <button type="button" className="btn-primary" onClick={onBack}>Choisir des verbes <span aria-hidden="true">→</span></button>
        </div>
      </div>
    );

  if (idx >= deck.length)
    return (
      <div className="train-view">
        <div className="completion-card">
          <div className="completion-icon" aria-hidden="true">✓</div>
          <p className="section-eyebrow">SESSION TERMINÉE</p>
          <h2 className="completion-title">Bravo !</h2>
          <p className="completion-copy">Tu as révisé {deck.length} verbe{deck.length > 1 ? "s" : ""}. Continue comme ça !</p>
          <button type="button" className="btn-primary" onClick={() => { setSeed(seed + 1); setIdx(0); setFlipped(false); }}>Mélanger et recommencer <span aria-hidden="true">↻</span></button>
          <div><button type="button" className="btn-outline mt-3" onClick={onBack}>Modifier ma sélection</button></div>
        </div>
      </div>
    );

  const v = deck[idx]!;
  const flip = () => {
    if (!flipped) speak(v);
    setFlipped(!flipped);
  };
  const go = (d: number) => { setFlipped(false); setIdx(Math.max(0, idx + d)); };

  return (
    <section className="train-view" aria-label="Entraînement par flashcards">
      <div className="training-head">
        <div>
          <div className="training-mode">MODE FLASHCARDS</div>
          <p className="section-description">Réfléchis, retourne la carte, puis répète les trois formes à voix haute.</p>
        </div>
        <button type="button" className="btn-outline" onClick={onBack}><span aria-hidden="true">←</span> Modifier la sélection</button>
      </div>

      <div className="training-progress-row">
        <span>CARTE <strong>{String(idx + 1).padStart(2, "0")}</strong> / {String(deck.length).padStart(2, "0")}</span>
        <span>{Math.round(((idx + 1) / deck.length) * 100)} % terminé</span>
      </div>
      <div className="training-progress" aria-label={`Progression : ${Math.round(((idx + 1) / deck.length) * 100)} pour cent`}>
        <div className="training-progress-fill" style={{ width: `${((idx + 1) / deck.length) * 100}%` }} />
      </div>

      <button type="button" onClick={flip} className="flip-scene training-card-button verb-flashcard" aria-label="Retourner la carte">
        <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-face flip-front">
            <span className="face-badge">TRADUCTION FRANÇAISE</span>
            <span className="face-word">{v.fr}</span>
            <span className="face-hint">Pense au verbe anglais, puis retourne la carte</span>
          </div>
          <div className="flip-face flip-back verb-answer-face">
            <div className="answer-intro">Les trois formes</div>
            <div className="verb-forms">
              {[["Base verbale", v.base], ["Prétérit", v.preterit], ["Participe passé", v.participle]].map(([l, w]) => (
                <div className="verb-form" key={l}>
                  <div className="verb-form-label">{l}</div>
                  <div className="verb-form-word">{w}</div>
                </div>
              ))}
            </div>
            <span className="face-hint">Écoute et répète les formes en anglais</span>
          </div>
        </div>
      </button>

      <div className="training-actions">
        <button type="button" className="btn-outline" disabled={idx === 0} onClick={() => go(-1)}><span aria-hidden="true">←</span> Précédente</button>
        <button type="button" className="btn-outline" onClick={() => speak(v)}><span aria-hidden="true">♫</span> Écouter</button>
        <button type="button" className="btn-primary" onClick={() => go(1)}>Suivante <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

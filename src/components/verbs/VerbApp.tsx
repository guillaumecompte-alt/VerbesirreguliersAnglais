import { useEffect, useState } from "react";

import { HelpButton } from "@/components/verbs/HelpDialog";
import { TransferPanel } from "@/components/verbs/TransferPanel";
import { useProgress } from "@/hooks/use-progress";
import {
  countByStatus,
  dayKey,
  MAX_BOX,
  STATUS_LABEL,
  statusOf,
  streak,
  type ProgressState,
  type VerbStatus,
} from "@/lib/progress";
import { VERBS, type Verb } from "@/lib/verbs";

const SELECTION_KEY = "iv-selected";
const NEW_BATCH = 10;
const ALL_KEYS = VERBS.map((v) => v.base);

function speak(v: Verb) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    `${v.base}. ${v.preterit}. ${v.participle}.`,
  );
  u.lang = "en-GB";
  u.rate = 0.8;
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((x) => x.lang.startsWith("en-GB")) ??
    voices.find((x) => x.lang.startsWith("en"));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = b[i]!;
    b[i] = b[j]!;
    b[j] = t;
  }
  return b;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

export function VerbApp() {
  const [tab, setTab] = useState<"choose" | "train">("choose");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectionLoaded, setSelectionLoaded] = useState(false);
  const [session, setSession] = useState(0);
  const { progress, loaded, answer, reset, replace } = useProgress();

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SELECTION_KEY) || "[]");
      if (Array.isArray(s))
        setSelected(new Set(s.filter((i) => Number.isInteger(i) && VERBS[i])));
    } catch {
      /* ignore */
    }
    setSelectionLoaded(true);
  }, []);
  useEffect(() => {
    if (!selectionLoaded) return;
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify([...selected]));
    } catch {
      /* ignore */
    }
  }, [selected, selectionLoaded]);

  // Recalculé à chaque rendu : 75 verbes, c'est négligeable.
  const now = Date.now();
  const counts = countByStatus(ALL_KEYS, progress, now);

  const startWith = (indices: number[]) => {
    setSelected(new Set(indices));
    setSession((s) => s + 1);
    setTab("train");
  };
  const startTraining = () => {
    setSession((s) => s + 1);
    setTab("train");
  };

  return (
    <div className="app-shell">
      <div className="app-ambient app-ambient-violet" aria-hidden="true" />
      <div className="app-ambient app-ambient-teal" aria-hidden="true" />

      <header className="app-topbar">
        <div className="app-brand">
          <div className="app-brand-mark" aria-hidden="true">
            V.
          </div>
          <div>
            <div className="app-brand-name">
              VERB<span>LAB</span>
            </div>
            <div className="app-brand-subtitle">ENGLISH · RÉVISION</div>
          </div>
        </div>
        <div className="header-pill">
          ANGLAIS <span aria-hidden="true">/</span> 5ᵉ
        </div>
      </header>

      <section className="app-hero">
        <div className="hero-copy-block">
          <div className="eyebrow">TON ESPACE DE RÉVISION</div>
          <h1>
            Irregular <span>Verbs.</span>
          </h1>
          <HelpButton />
          <div className="hero-metrics">
            <div className="hero-metric">
              <strong>{VERBS.length}</strong> verbes
            </div>
            <div className="hero-metric">
              <strong>{counts.mastered}</strong> maîtrisé
              {counts.mastered > 1 ? "s" : ""}
            </div>
            <div className="hero-metric">
              <strong>{counts.due}</strong> à revoir
            </div>
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
            Progression &amp; choix{" "}
            <span className="tab-count">{selected.size}</span>
          </button>
          <button
            type="button"
            onClick={startTraining}
            className={`session-tab ${tab === "train" ? "active" : ""}`}
            aria-current={tab === "train" ? "step" : undefined}
          >
            Entraînement <span className="tab-count">↗</span>
          </button>
        </nav>

        {tab === "choose" ? (
          <Choose
            selected={selected}
            setSelected={setSelected}
            progress={progress}
            loaded={loaded}
            now={now}
            counts={counts}
            onStart={startTraining}
            onStartWith={startWith}
            onReset={reset}
            onReplace={replace}
          />
        ) : (
          <Train
            key={session}
            selected={selected}
            onAnswer={answer}
            onBack={() => setTab("choose")}
            onRestart={startWith}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>
          LE HUB<span aria-hidden="true">.</span> · APPRENDRE À SON RYTHME
        </span>
        <span>
          <strong>{counts.mastered}</strong> / {VERBS.length} verbes maîtrisés
        </span>
      </footer>
    </div>
  );
}

/* ───────────────────────── Tableau de progression ───────────────────────── */

const STATUS_ORDER: VerbStatus[] = ["mastered", "learning", "due", "new"];

function ProgressPanel({
  progress,
  now,
  counts,
  onStartWith,
  onReset,
  onReplace,
}: {
  progress: ProgressState;
  now: number;
  counts: Record<VerbStatus, number>;
  onStartWith: (indices: number[]) => void;
  onReset: () => void;
  onReplace: (state: ProgressState) => void;
}) {
  const total = VERBS.length;
  const pct = Math.round((counts.mastered / total) * 100);
  const days = streak(progress.days, now);
  const today = dayKey(now);
  const reviewedToday = Object.values(progress.verbs).filter(
    (p) => dayKey(p.last) === today,
  ).length;
  const hasHistory = Object.keys(progress.verbs).length > 0;
  const [confirmReset, setConfirmReset] = useState(false);

  const dueIdx = VERBS.flatMap((v, i) =>
    statusOf(progress.verbs[v.base], now) === "due" ? [i] : [],
  );
  const newIdx = VERBS.flatMap((v, i) =>
    progress.verbs[v.base] ? [] : [i],
  ).slice(0, NEW_BATCH);

  return (
    <section className="progress-panel" aria-labelledby="progress-heading">
      <div className="progress-summary">
        <p className="section-eyebrow">TA PROGRESSION</p>
        <h2 id="progress-heading" className="progress-title">
          <strong>{pct} %</strong> des verbes maîtrisés
        </h2>
        <div
          className="progress-stack"
          role="img"
          aria-label={STATUS_ORDER.map(
            (s) => `${STATUS_LABEL[s]} : ${counts[s]}`,
          ).join(", ")}
        >
          {STATUS_ORDER.map((s) =>
            counts[s] ? (
              <span
                key={s}
                className="progress-stack-part"
                data-status={s}
                style={{ flexGrow: counts[s] }}
              />
            ) : null,
          )}
        </div>
        <ul className="progress-legend">
          {STATUS_ORDER.map((s) => (
            <li key={s} data-status={s}>
              <span className="status-dot" aria-hidden="true" />
              {STATUS_LABEL[s]} <strong>{counts[s]}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="progress-side">
        <div className="progress-stats">
          <div className="progress-stat">
            <strong>{days}</strong>
            <span>jour{days > 1 ? "s" : ""} d'affilée</span>
          </div>
          <div className="progress-stat">
            <strong>{reviewedToday}</strong>
            <span>revu{reviewedToday > 1 ? "s" : ""} aujourd'hui</span>
          </div>
        </div>
        <div className="progress-actions">
          {dueIdx.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onStartWith(dueIdx)}
            >
              Réviser{" "}
              {dueIdx.length > 1 ? `les ${dueIdx.length} verbes` : "le verbe"} à
              revoir
            </button>
          )}
          {newIdx.length > 0 && (
            <button
              type="button"
              className={dueIdx.length ? "btn-outline" : "btn-primary"}
              onClick={() => onStartWith(newIdx)}
            >
              + Découvrir {newIdx.length} nouveau{newIdx.length > 1 ? "x" : ""}{" "}
              verbe{newIdx.length > 1 ? "s" : ""}
            </button>
          )}
          {!dueIdx.length && !newIdx.length && (
            <p className="progress-allclear">
              Rien à revoir aujourd'hui : reviens demain pour consolider !
            </p>
          )}
        </div>
        <TransferPanel progress={progress} now={now} onReplace={onReplace} />
        {hasHistory &&
          (confirmReset ? (
            <div
              className="progress-reset-confirm"
              role="group"
              aria-label="Confirmer la remise à zéro"
            >
              <span>Effacer toute ta progression ?</span>
              <button
                type="button"
                className="progress-reset is-danger"
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                }}
              >
                Oui, effacer
              </button>
              <button
                type="button"
                className="progress-reset"
                onClick={() => setConfirmReset(false)}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="progress-reset"
              onClick={() => setConfirmReset(true)}
            >
              Remettre la progression à zéro
            </button>
          ))}
      </div>
    </section>
  );
}

function LevelPips({ box, status }: { box: number; status: VerbStatus }) {
  return (
    <span
      className="verb-level"
      data-status={status}
      title={STATUS_LABEL[status]}
    >
      <span className="sr-only">{STATUS_LABEL[status]}</span>
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <span
          key={i}
          className={`level-pip ${i < box ? "is-on" : ""}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/* ───────────────────────────── Choix des verbes ──────────────────────────── */

const FILTERS: VerbStatus[] = ["due", "learning", "mastered", "new"];

function Choose({
  selected,
  setSelected,
  progress,
  loaded,
  now,
  counts,
  onStart,
  onStartWith,
  onReset,
  onReplace,
}: {
  selected: Set<number>;
  setSelected: (s: Set<number>) => void;
  progress: ProgressState;
  loaded: boolean;
  now: number;
  counts: Record<VerbStatus, number>;
  onStart: () => void;
  onStartWith: (indices: number[]) => void;
  onReset: () => void;
  onReplace: (state: ProgressState) => void;
}) {
  /** Catégories affichées ; vide = tous les verbes. Plusieurs peuvent se cumuler. */
  const [filters, setFilters] = useState<Set<VerbStatus>>(new Set());
  const all = filters.size === 0;
  const toggleFilter = (f: VerbStatus) => {
    const next = new Set(filters);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    // Toutes les catégories cochées revient à « Tous ».
    setFilters(next.size === FILTERS.length ? new Set() : next);
  };

  const items = VERBS.map((v, i) => ({
    v,
    i,
    p: progress.verbs[v.base],
    status: statusOf(progress.verbs[v.base], now),
  }));
  const visible = all ? items : items.filter((it) => filters.has(it.status));

  const toggle = (i: number) => {
    const s = new Set(selected);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    setSelected(s);
  };
  const setVisible = (on: boolean) => {
    const s = new Set(selected);
    for (const it of visible) {
      if (on) s.add(it.i);
      else s.delete(it.i);
    }
    setSelected(s);
  };

  return (
    <>
      {loaded && (
        <ProgressPanel
          progress={progress}
          now={now}
          counts={counts}
          onStartWith={onStartWith}
          onReset={onReset}
          onReplace={onReplace}
        />
      )}

      <section className="choose-panel" aria-labelledby="choose-heading">
        <div className="section-intro">
          <div>
            <p className="section-eyebrow">PRÉPARATION</p>
            <h2 id="choose-heading">Compose ton paquet</h2>
            <p className="section-description">
              Sélectionne les verbes à travailler, ou filtre-les selon ta
              progression.
            </p>
          </div>
          <div className="selected-counter" aria-live="polite">
            <strong>{String(selected.size).padStart(2, "0")}</strong>
            <span>
              VERBES
              <br />
              SÉLECTIONNÉS
            </span>
          </div>
        </div>

        <div
          className="status-filters"
          role="group"
          aria-label="Filtrer par progression"
        >
          <button
            type="button"
            className={`status-filter ${all ? "active" : ""}`}
            aria-pressed={all}
            onClick={() => setFilters(new Set())}
          >
            Tous
            <span className="status-filter-count">{VERBS.length}</span>
          </button>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              data-status={f}
              className={`status-filter ${filters.has(f) ? "active" : ""}`}
              aria-pressed={filters.has(f)}
              onClick={() => toggleFilter(f)}
            >
              <span className="status-dot" aria-hidden="true" />
              {STATUS_LABEL[f]}
              <span className="status-filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        <div className="choose-toolbar">
          <p className="toolbar-hint">
            {all
              ? "Astuce : combine plusieurs catégories, par exemple « À revoir », « En cours » et « Maîtrisé » pour une révision générale."
              : `${plural(visible.length, "verbe")} affiché${visible.length > 1 ? "s" : ""}.`}
          </p>
          <div className="toolbar-actions">
            <button
              type="button"
              className="btn-outline"
              disabled={!visible.length}
              onClick={() => setVisible(true)}
            >
              {all ? "Tout cocher" : "Cocher la liste"}
            </button>
            <button
              type="button"
              className="btn-outline"
              disabled={!visible.some((it) => selected.has(it.i))}
              onClick={() => setVisible(false)}
            >
              {all ? "Tout décocher" : "Décocher la liste"}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!selected.size}
              onClick={onStart}
            >
              S'entraîner <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {visible.length ? (
          <div className="verb-grid">
            {visible.map(({ v, i, p, status }) => (
              <label
                key={v.base}
                className={`verb-option ${selected.has(i) ? "is-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="verb-checkbox"
                  aria-label={`Sélectionner ${v.base} (${STATUS_LABEL[status]})`}
                />
                <span className="verb-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="verb-text">
                  <span className="verb-base">{v.base}</span>
                  <span className="verb-meaning">{v.fr}</span>
                </span>
                <LevelPips box={p?.box ?? 0} status={status} />
              </label>
            ))}
          </div>
        ) : (
          <p className="empty-filter">
            Aucun verbe dans{" "}
            {filters.size > 1 ? "ces catégories" : "cette catégorie"} pour
            l'instant.
          </p>
        )}
      </section>
    </>
  );
}

/* ─────────────────────────────── Entraînement ────────────────────────────── */

/**
 * Un verbe raté revient une seule fois, 3 ou 4 cartes plus tard, pour un
 * deuxième essai d'entraînement : ce deuxième passage n'est pas évalué et ne
 * modifie pas la progression (seule la première réponse compte).
 */
type Card = { v: Verb; retry: boolean };

/** Position de réinsertion : 3 ou 4 cartes après la carte actuelle. */
function retryPosition(idx: number, length: number, gap: number) {
  return Math.min(idx + 1 + gap, length);
}

function Train({
  selected,
  onAnswer,
  onBack,
  onRestart,
}: {
  selected: Set<number>;
  onAnswer: (key: string, knew: boolean) => void;
  onBack: () => void;
  onRestart: (indices: number[]) => void;
}) {
  const [queue, setQueue] = useState<Card[]>(() =>
    shuffle([...selected].map((i) => VERBS[i]!).filter(Boolean)).map((v) => ({
      v,
      retry: false,
    })),
  );
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  /** Résultat au premier passage de chaque verbe. */
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});

  const card = queue[idx];
  const v = card?.v;
  const isRetry = card?.retry ?? false;
  const done = idx >= queue.length;

  const next = () => {
    setFlipped(false);
    setIdx((i) => i + 1);
  };

  const grade = (knew: boolean) => {
    if (!v || !flipped || isRetry) return;
    onAnswer(v.base, knew);
    setFirstTry((r) => ({ ...r, [v.base]: knew }));
    if (!knew) {
      const gap = 3 + Math.floor(Math.random() * 2);
      setQueue((q) => {
        const at = retryPosition(idx, q.length, gap);
        return [...q.slice(0, at), { v, retry: true }, ...q.slice(at)];
      });
    }
    next();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!flipped || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isRetry) {
        if (e.key === "2" || e.key === "ArrowRight") next();
        return;
      }
      if (e.key === "1" || e.key === "ArrowLeft") grade(false);
      if (e.key === "2" || e.key === "ArrowRight") grade(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!queue.length)
    return (
      <div className="train-view">
        <div className="empty-training">
          <div className="completion-icon" aria-hidden="true">
            ＋
          </div>
          <p className="section-eyebrow">TON PAQUET EST VIDE</p>
          <h2 className="completion-title">Choisis tes premiers verbes</h2>
          <p className="completion-copy">
            Sélectionne au moins un verbe pour lancer une session de flashcards.
          </p>
          <button type="button" className="btn-primary" onClick={onBack}>
            Choisir des verbes <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    );

  if (done || !v) {
    const bases = Object.keys(firstTry);
    const known = bases.filter((b) => firstTry[b]).length;
    const missed = VERBS.flatMap((x, i) =>
      firstTry[x.base] === false ? [{ x, i }] : [],
    );
    const score = bases.length ? Math.round((known / bases.length) * 100) : 0;
    return (
      <div className="train-view">
        <div className="completion-card">
          <div className="completion-icon" aria-hidden="true">
            ✓
          </div>
          <p className="section-eyebrow">SESSION TERMINÉE</p>
          <h2 className="completion-title">
            {score === 100
              ? "Sans faute !"
              : score >= 70
                ? "Bravo !"
                : "Bien joué, continue !"}
          </h2>
          <p className="completion-copy">
            Tu connaissais <strong>{known}</strong> verbe{known > 1 ? "s" : ""}{" "}
            sur {bases.length} du premier coup ({score} %).
          </p>

          <div className="session-score" aria-hidden="true">
            <span className="session-score-known" style={{ flexGrow: known }} />
            <span
              className="session-score-missed"
              style={{ flexGrow: missed.length }}
            />
          </div>

          {missed.length > 0 && (
            <div className="missed-list">
              <p className="section-eyebrow">À RETRAVAILLER</p>
              <ul>
                {missed.map(({ x }) => (
                  <li key={x.base}>
                    <span className="missed-forms">
                      {x.base} · {x.preterit} · {x.participle}
                    </span>
                    <span className="missed-fr">{x.fr}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="completion-actions">
            {missed.length > 0 ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => onRestart(missed.map((m) => m.i))}
              >
                {missed.length > 1
                  ? `Revoir mes ${missed.length} erreurs`
                  : "Revoir mon erreur"}{" "}
                <span aria-hidden="true">↻</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => onRestart([...selected])}
              >
                Mélanger et recommencer <span aria-hidden="true">↻</span>
              </button>
            )}
            <button type="button" className="btn-outline" onClick={onBack}>
              Voir ma progression
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.round((idx / queue.length) * 100);

  return (
    <section className="train-view" aria-label="Entraînement par flashcards">
      <div className="training-head">
        <div>
          <div className="training-mode">MODE FLASHCARDS</div>
          <p className="section-description">
            {isRetry
              ? "Deuxième essai pour t'entraîner : il ne compte pas dans ta progression."
              : "Réfléchis, retourne la carte, puis dis honnêtement si tu savais."}
          </p>
        </div>
        <button type="button" className="btn-outline" onClick={onBack}>
          <span aria-hidden="true">←</span> Ma progression
        </button>
      </div>

      <div className="training-progress-row">
        <span>
          CARTE <strong>{String(idx + 1).padStart(2, "0")}</strong> /{" "}
          {String(queue.length).padStart(2, "0")}
        </span>
        <span>{pct} % terminé</span>
      </div>
      <div
        className="training-progress"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="training-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <button
        type="button"
        onClick={() => {
          if (!flipped) speak(v);
          setFlipped(!flipped);
        }}
        className="flip-scene training-card-button verb-flashcard"
        aria-label={flipped ? "Revoir la traduction" : "Retourner la carte"}
      >
        <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-face flip-front">
            <span className="face-badge">
              {isRetry ? "DEUXIÈME ESSAI" : "TRADUCTION FRANÇAISE"}
            </span>
            <span className="face-word">{v.fr}</span>
            <span className="face-hint">
              Pense aux trois formes anglaises, puis retourne la carte
            </span>
          </div>
          <div className="flip-face flip-back verb-answer-face">
            <div className="answer-intro">Les trois formes</div>
            <div className="verb-forms">
              {[
                ["Base verbale", v.base],
                ["Prétérit", v.preterit],
                ["Participe passé", v.participle],
              ].map(([l, w]) => (
                <div className="verb-form" key={l}>
                  <div className="verb-form-label">{l}</div>
                  <div className="verb-form-word">{w}</div>
                </div>
              ))}
            </div>
            <span className="face-hint">
              {isRetry
                ? "Deuxième essai : il ne change pas ta progression"
                : "Écoute et répète les formes à voix haute"}
            </span>
          </div>
        </div>
      </button>

      {flipped && isRetry ? (
        <div className="training-actions grade-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={() => speak(v)}
            aria-label="Écouter la prononciation"
          >
            <span aria-hidden="true">♫</span>
          </button>
          <button type="button" className="btn-primary" onClick={next}>
            Suivante <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : flipped ? (
        <div className="training-actions grade-actions">
          <button
            type="button"
            className="btn-grade btn-grade-miss"
            onClick={() => grade(false)}
          >
            <span aria-hidden="true">✗</span> À revoir
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => speak(v)}
            aria-label="Écouter la prononciation"
          >
            <span aria-hidden="true">♫</span>
          </button>
          <button
            type="button"
            className="btn-grade btn-grade-know"
            onClick={() => grade(true)}
          >
            <span aria-hidden="true">✓</span> Je savais
          </button>
        </div>
      ) : (
        <div className="training-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              speak(v);
              setFlipped(true);
            }}
          >
            Voir la réponse <span aria-hidden="true">↻</span>
          </button>
        </div>
      )}
      <p className="keyboard-hint">
        {isRetry
          ? "Clavier : → ou 2 pour passer à la carte suivante"
          : "Clavier : ← ou 1 pour « À revoir », → ou 2 pour « Je savais »"}
      </p>
    </section>
  );
}

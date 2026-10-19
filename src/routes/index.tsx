import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { VERBS, type Verb } from "@/lib/verbs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Irregular Verbs 5e — Flashcards" },
      { name: "description", content: "Apprends les 75 verbes irréguliers anglais de 5ème avec des cartes à retourner et la prononciation." },
      { property: "og:title", content: "Irregular Verbs 5e — Flashcards" },
      { property: "og:description", content: "Cartes à retourner et prononciation pour les verbes irréguliers anglais." },
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
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-5xl px-4 pt-8 pb-4 text-center">
        <h1 className="font-display text-4xl md:text-5xl text-foreground">Irregular Verbs</h1>
        <p className="mt-1 text-muted-foreground">Les 75 verbes irréguliers de 5ème</p>
        <nav className="mt-6 inline-flex rounded-full bg-card p-1 shadow-soft border border-border">
          {(["choose", "train"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 font-semibold transition ${tab === t ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
            >
              {t === "choose" ? `Choix des verbes (${selected.size})` : "Entraînement"}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16">
        {tab === "choose" ? (
          <Choose selected={selected} setSelected={setSelected} onStart={() => setTab("train")} />
        ) : (
          <Train selected={selected} onBack={() => setTab("choose")} />
        )}
      </main>
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
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button className="btn-outline" onClick={() => setSelected(new Set(VERBS.map((_, i) => i)))}>Tout cocher</button>
        <button className="btn-outline" onClick={() => setSelected(new Set())}>Tout décocher</button>
        <button className="btn-primary" disabled={!selected.size} onClick={onStart}>S'entraîner →</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {VERBS.map((v, i) => (
          <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected.has(i) ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"}`}>
            <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="h-5 w-5 accent-[var(--primary)]" />
            <span className="w-6 text-sm text-muted-foreground">{i + 1}.</span>
            <span className="font-semibold text-foreground">{v.base}</span>
            <span className="ml-auto truncate text-sm text-muted-foreground">{v.fr}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Train({ selected, onBack }: { selected: Set<number>; onBack: () => void }) {
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => shuffle([...selected].sort((a, b) => a - b).map((i) => VERBS[i])), [selected, seed]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!deck.length)
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Aucun verbe sélectionné.</p>
        <button className="btn-primary mt-4" onClick={onBack}>Choisir des verbes</button>
      </div>
    );

  if (idx >= deck.length)
    return (
      <div className="text-center">
        <p className="font-display text-3xl text-foreground">Bravo ! 🎉</p>
        <p className="mt-2 text-muted-foreground">Tu as révisé {deck.length} verbe{deck.length > 1 ? "s" : ""}.</p>
        <button className="btn-primary mt-6" onClick={() => { setSeed(seed + 1); setIdx(0); setFlipped(false); }}>Recommencer</button>
      </div>
    );

  const v = deck[idx]!;
  const flip = () => {
    if (!flipped) speak(v);
    setFlipped(!flipped);
  };
  const go = (d: number) => { setFlipped(false); setIdx(Math.max(0, idx + d)); };

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-sm font-semibold text-muted-foreground">Carte {idx + 1} / {deck.length}</p>
      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-muted mb-6">
        <div className="h-full bg-primary transition-all" style={{ width: `${((idx + 1) / deck.length) * 100}%` }} />
      </div>
      <button onClick={flip} className="flip-scene h-72 w-full max-w-md" aria-label="Retourner la carte">
        <div className={`flip-card ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-face bg-card border border-border">
            <span className="text-sm uppercase tracking-widest text-muted-foreground">En anglais ?</span>
            <span className="mt-3 font-display text-4xl text-foreground">{v.fr}</span>
            <span className="mt-6 text-sm text-muted-foreground">Clique pour retourner</span>
          </div>
          <div className="flip-face flip-back bg-primary text-primary-foreground">
            <div className="grid w-full grid-cols-3 gap-2 text-center">
              {[["Base", v.base], ["Prétérit", v.preterit], ["Participe", v.participle]].map(([l, w]) => (
                <div key={l}>
                  <div className="text-xs uppercase tracking-wider opacity-80">{l}</div>
                  <div className="mt-2 font-display text-2xl md:text-3xl break-words">{w}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </button>
      <div className="mt-6 flex gap-3">
        <button className="btn-outline" disabled={idx === 0} onClick={() => go(-1)}>← Précédente</button>
        <button className="btn-outline" onClick={() => speak(v)}>🔊 Écouter</button>
        <button className="btn-primary" onClick={() => go(1)}>Suivante →</button>
      </div>
    </div>
  );
}

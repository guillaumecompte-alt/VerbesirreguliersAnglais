import { useCallback, useEffect, useState } from "react";

import {
  emptyProgress,
  parseProgress,
  recordAnswer,
  STORAGE_KEY,
  type ProgressState,
} from "@/lib/progress";

/**
 * Progression sauvegardée dans le navigateur (localStorage).
 * Chargée après le montage pour rester compatible avec le rendu serveur.
 */
export function useProgress() {
  const [state, setState] = useState<ProgressState>(emptyProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setState(parseProgress(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* stockage indisponible : on garde une progression en mémoire */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, loaded]);

  const answer = useCallback((key: string, knew: boolean) => {
    setState((s) => recordAnswer(s, key, knew));
  }, []);

  const reset = useCallback(() => setState(emptyProgress()), []);

  return { progress: state, loaded, answer, reset };
}

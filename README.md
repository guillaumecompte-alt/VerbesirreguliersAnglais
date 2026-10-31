# Verbes irréguliers anglais — 5ᵉ

Application de révision des 75 verbes irréguliers anglais du programme de 5ᵉ :
flashcards, prononciation et suivi de progression par révision espacée.

En ligne : <https://verbes.outilotheque.fr>

## Fonctionnement

- L'élève compose son paquet de verbes, retourne chaque carte puis indique s'il savait.
- Les verbes sus reviennent de plus en plus tard (1, 3, 7, 14 puis 30 jours) ;
  ceux qui sont ratés reviennent dans la même session.
- La progression est enregistrée dans le navigateur de l'élève (`localStorage`) :
  aucun compte, aucune donnée envoyée à un serveur.

## Développement

Il faut [Bun](https://bun.sh) (ou Node.js et npm).

```sh
bun install
bun run dev      # serveur de développement
bun run test     # tests
bun run build    # site statique dans dist/
```

## Organisation du code

- `src/lib/verbs.ts` — la liste des verbes (base, prétérit, participe passé, traduction).
- `src/lib/progress.ts` — logique de révision espacée, testée dans `src/test/`.
- `src/components/verbs/VerbApp.tsx` — l'interface.
- `src/styles.css`, `src/progress.css` — les styles.

## Mise en ligne

Le site est un site statique servi par Cloudflare Workers (`wrangler.jsonc`).
Chaque push sur `main` déclenche automatiquement un build (`bun run build`)
puis un déploiement (`npx wrangler deploy`) via Cloudflare Workers Builds.

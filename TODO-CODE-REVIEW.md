# Code Review – @data-fair/app-charts

Analyse faite le 26 avril 2026.

---

## 🟠 Important – Bugs fonctionnels

### 5. Pas d'annulation des requêtes réseau
**Fichier :** `src/components/Chart.vue:238-267`

Quand la `queryKey` change rapidement, des requêtes concurrentes partent. Le flag `cancelled` ignore seulement le résultat, la requête continue en arrière-plan.
- [ ] Utiliser `AbortController` pour annuler les requêtes en vol

---

## 🟡 Code quality

### 7. `options` computed de ~200 lignes
**Fichier :** `src/components/Chart.vue:38-234`

Monolithique, difficile à tester et maintenir. Mixe la config de 5+ types de graphiques (line, bar, pie, radar, paired-histogram).
- [ ] Extraire en composables par type : `useLineOptions`, `usePieOptions`, etc.

### 8. Duplication massive entre les modules chart-data
**Fichiers :** `src/composables/chart-data/*.js`

- Récupération des couleurs (pattern quasi-identique dans les 4 fichiers)
- Gestion de `getValue` (`value / config.value.divider`)
- Pourcentage et gestion du « Autre » (dupliqué dans `rowsBased.js` et `aggsBased.js`)
- Pattern d'erreur copié-collé 4x
- [ ] Extraire les fonctions partagées dans un module commun

### 10. Effets de bord globaux au `import`
**Fichier :** `src/components/Chart.vue:21-25`

- `dayjs.locale('fr')` hardcodé en français
- `ChartJS.register()` exécuté au chargement du module (peut causer des warnings de double enregistrement)
- [ ] Déplacer dans le `setup()` du composant ou rendre la locale configurable

### 12. Aucun test unitaire
Pas de framework de test configuré. Les transformations de données complexes (calculs de pourcentages, tris, regroupements) ne sont pas testées.
- [ ] Configurer Vitest et ajouter des tests sur les modules `chart-data` et `utils`

---

## 🔵 Améliorations d'architecture

### 13. Pas de TypeScript dans le code applicatif
**Fichier :** `src/config/.type/index.d.ts` contient 2086 lignes de types générés, mais le code applicatif reste en JS avec JSDoc.

TypeScript attraperait les bugs #3, #5, #11 à la compilation et offrirait une meilleure DX.
- [ ] Migrer progressivement les modules critiques en `.ts`

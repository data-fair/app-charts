# Code Review – @data-fair/app-charts

Analyse faite le 26 avril 2026.

---

## 🔴 Critique – Risque de crash

### 1. Gestion d'erreur réseau incomplète
**Fichiers :** `src/composables/chart-data/rowsBased.js:43-46`, `aggsBased.js:48-51`, `aggsBasedLabels.js:38-40`, `aggsLabels.js:28-30`

```js
const { results } = await ofetch(...).catch(e => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
})
// results est undefined → crash sur .map()
```

Quand la requête échoue, `.catch()` ne retourne rien → `results` est `undefined` → le `.map()` suivant crash avec `Cannot read properties of undefined (reading 'map')`.
- [x] Ajouter `return { results: [], aggs: [] }` ou un `throw` rattrapé par `Chart.vue`

Idem pour `rowsBased.js:35` (`categories`).

### 2. `fields.value[chart.value.config.labelsField]` peut être undefined
**Fichier :** `src/composables/chart-data/rowsBased.js:48`

```js
fields.value[chart.value.config.labelsField]['x-labels']?.[...]
```

L'optional chaining ne protège que `x-labels`. Si `fields.value[labelsField]` est `undefined`, ça crash.
- [x] Ajouter `fields.value?.[chart.value.config.labelsField]?.['x-labels']?.[...]`

Même problème dans `aggsBasedLabels.js:50`.

---

## 🟠 Important – Bugs fonctionnels

### 3. Variable shadowing du paramètre `i`
**Fichier :** `src/composables/chart-data/aggsBasedLabels.js:59`

```js
data: chart.value.config.labelsValues.map((l, i) => getValue(!i ? serie.metric : serie[l + '_' + params.metric]))
```

Le `i` intérieur écrase le `i` extérieur de `series.map`. Le `!i` teste l'index du `labelsValues`, pas celui de la série.
- [x] Renommer le paramètre intérieur pour éviter l'ambiguïté

### 4. `useDebounce(computed(...))` recréé à chaque appel
**Fichier :** `src/composables/useChartData.js:41`

`getParams()` crée un nouveau `computed` + `useDebounce` à chaque appel. En dev avec hot-reload, les debounces s'accumulent.
- [x] Déplacer hors de la fonction ou utiliser un pattern singleton

### 5. Pas d'annulation des requêtes réseau
**Fichier :** `src/components/Chart.vue:238-267`

Quand la `queryKey` change rapidement, des requêtes concurrentes partent. Le flag `cancelled` ignore seulement le résultat, la requête continue en arrière-plan.
- [ ] Utiliser `AbortController` pour annuler les requêtes en vol

### 6. `loading` ref jamais utilisé dans le template
**Fichier :** `src/components/Chart.vue:29`

`loading` est défini et mis à jour mais jamais lu dans le template. L'utilisateur voit un canvas vide pendant le chargement.
- [x] Ajouter un indicateur de chargement (spinner, skeleton, ou `v-progress-linear`)

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

### 9. Déduplication O(n²)
**Fichier :** `src/composables/chart-data/aggsBased.js:70`

```js
.filter((s, i, self) => self.indexOf(s) === i)
```
- [x] Remplacer par `[...new Set(array)]`

### 10. Effets de bord globaux au `import`
**Fichier :** `src/components/Chart.vue:21-25`

- `dayjs.locale('fr')` hardcodé en français
- `ChartJS.register()` exécuté au chargement du module (peut causer des warnings de double enregistrement)
- [ ] Déplacer dans le `setup()` du composant ou rendre la locale configurable

### 11. `timeout` en string
**Fichier :** `src/components/SnackBar.vue:8`

```html
:timeout="'5000'"
```
- [x] Remplacer par `:timeout="5000"` (number)

### 12. Aucun test unitaire
Pas de framework de test configuré. Les transformations de données complexes (calculs de pourcentages, tris, regroupements) ne sont pas testées.
- [ ] Configurer Vitest et ajouter des tests sur les modules `chart-data` et `utils`

---

## 🔵 Améliorations d'architecture

### 13. Pas de TypeScript dans le code applicatif
**Fichier :** `src/config/.type/index.d.ts` contient 2086 lignes de types générés, mais le code applicatif reste en JS avec JSDoc.

TypeScript attraperait les bugs #3, #5, #11 à la compilation et offrirait une meilleure DX.
- [ ] Migrer progressivement les modules critiques en `.ts`

### 14. Couplage fort avec `reactiveSearchParams` global
**Fichiers :** tous les modules chart-data importent `reactiveSearchParams` directement

Impossible à tester isolément, risque de régressions croisées.
- [x] Passer `reactiveSearchParams` via le contexte `ctx` (déjà fait pour `baseParams`)

### 15. Boucle potentielle de `postMessage`
**Fichier :** `src/App.vue:10-13`

Le `watch` sur `staticFilters` envoie un `postMessage` au parent qui peut répondre avec une nouvelle config → boucle.
- [x] Ajouter une garde (debounce) ou un flag `updating` pour éviter les cycles

---

## 🟢 Mineur

| # | Fichier | Problème |
|---|---------|----------|
| ✅ 16 | `Actions.vue:117` | Le sélecteur `.actions-container .v-icon` peut affecter des icônes enfants non liées aux toggles de tri |
| ✅ 17 | `Chart.vue:94-98` | `yAxisStartsZero` et `yAxisNotStartsZero` utilisent des options Chart.js différentes (`min` vs `beginAtZero`) mais sont présentées comme mutuellement exclusives |
| ✅ 18 | `settings.scss` | `overflow-y: hidden` déclaré 2x |
| ✅ 19 | `config.js:27` | `setByPath` mute des objets partiellement clonés, comportement subtil avec la réactivité Vue |

- [x] Corriger ces points mineurs

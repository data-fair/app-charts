# TODO – @data-fair/app-charts

## Typage (amélioration en cours)

### ✅ Fait
- **Réponses API typées** : `DatasetLine`, `AggItem`, `ValuesAggResponse`, `MetricAggResponse`, `ValuesLabelsItem`, `CategoryItem` dans `useChartData.ts`.
- **Thème Vuetify typé** : `theme: ThemeInstance` dans tous les loaders chart-data.
- **`window` globals typés** : `window.APPLICATION` et `window.vIframeOptions` déclarés dans `src/types.d.ts`.
- **Shims nettoyés** : suppression des shims `any` pour les packages `@data-fair/lib-*` qui ont déjà des types dans `node_modules`.
- **`normalizeFilters` typé** : utilise `Filter[]` de `@data-fair/lib-utils/filters`.
- **`config.ts` amélioré** : `dataset` typé `Dataset`, `fields` typé `Record<string, Field>`.
- **Callbacks Chart.js typés** : `TooltipItem` utilisé dans `Chart.vue`.

### 🔵 Reste à faire (18 `any` restants)

| Fichier | Ligne(s) | Pourquoi |
|---------|----------|----------|
| `src/types.d.ts` | 6–7 | `AnyChart` / `AnyChartConfig` élargis avec `Record<string, any>` car le schema JSON génère des unions trop strictes pour l'accès dynamique. À affiner avec des type guards si on veut du strict exhaustif. |
| `src/shims.d.ts` | 2, 11 | `@energiency/chartjs-plugin-piechart-outlabels` et `natural-orderby` n'ont pas de types. |
| `src/components/Chart.vue` | 44, 253, 267 | `options` et `data` restent `any` à cause des plugins Chart.js tiers (datalabels, outlabels) et de la multiplicité des types de graphiques. |
| `src/composables/config.ts` | 42 | `setByPath` manipule un objet dynamiquement ; difficile à typer sans generic récursif. |
| `src/composables/useChartData.ts` | 83 | `staticFilters` vient du schema généré et n'est pas compatible strictement avec `Filter[]` de lib-utils. |
| `src/App.vue` | 17 | Même incompatibilité `staticFilters` / `Filter[]`. |
| `src/composables/chart-data/*.ts` | divers | `datasets: any[]` (4×) + casts `as any` sur les agrégations dynamiques (`serie[l + '_' + metric]`). |

### 💡 Idées d'amélioration future
1. **Typer `datasets` avec `ChartDataset`** : définir une interface `AppChartDataset` qui étend `ChartDataset` avec les propriétés custom (`percentages`, `labels`, etc.).
2. **Affiner `AnyChart` / `AnyChartConfig`** : utiliser des type guards (e.g. `isLineChart(chart)`) pour réduire les unions au lieu de `Record<string, any>`.
3. **Typage strict de `setByPath`** : utiliser un generic récursif ou une lib comme `set-value` / `lodash.set` typée.
4. **Aligner les types de filtres** : soit étendre le type `Filter` de lib-utils, soit utiliser le type généré par le schema directement.
5. **Plugins Chart.js** : écrire des modules declarations minimaux pour `chartjs-plugin-datalabels` et `outlabels` au lieu de `any`.

---

## Autres (hors typage)

- [ ] Utiliser `AbortController` pour annuler les requêtes réseau en vol (`Chart.vue`)
- [ ] Extraire `useLineOptions`, `usePieOptions`, etc. depuis le computed monolithique `options`
- [ ] Dédupliquer la logique chart-data dans un module commun (couleurs, pourcentages, "Autre")
- [ ] Configurer Vitest et ajouter des tests sur les modules `chart-data` et `utils`

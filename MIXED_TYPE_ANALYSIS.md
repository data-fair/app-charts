# Analyse : Ajout du type de visualisation `mixed` (Courbe + Histogramme)

## 1. Contexte et besoin

Ajouter un nouveau type de visualisation `mixed` permettant de combiner :
- **une série en histogramme (bar)**
- **une série en courbe (line)**

Ce type est conçu pour **exactement 2 séries**, car il exploite les **2 axes Y** de Chart.js :
- axe Y de gauche (`y`) pour la première série
- axe Y de droite (`y1`) pour la deuxième série

Cela permet de représenter deux indicateurs ayant des **ordres de grandeur différents** ou des **unités différentes** sur le même graphique temporel ou catégoriel.

---

## 2. Spécificités du type `mixed`

| Aspect | Comportement attendu |
|--------|---------------------|
| Nombre de séries | Exactement 2 (à restreindre ou documenter) |
| Type Chart.js | `bar` (composant `<Bar>`) avec `type: 'line'` sur le 2ème dataset |
| Axes Y | Double axe : `y` (gauche) et `y1` (droite) |
| Unités | Possibilité d'avoir une unité par axe (`unitLeft`, `unitRight` ou via `config`) |
| Empilement | Désactivé par nature (2 axes distincts) |
| Légende | Affichée obligatoirement pour distinguer les séries |

---

## 3. Fichiers concernés

### 3.1 Schéma de configuration
**Fichier** : `src/config/schema.json`

Modifications nécessaires :
1. **Dans le `oneOf` de `chart`** : ajouter une nouvelle entrée `mixed` avec :
   - `type: { const: "mixed" }`
   - `tension` (courbure de la ligne)
   - `yAxisStartsZero` (commun ou séparé pour chaque axe ?)
   - `hidePoints` (pour la série ligne)
   - `config: { $ref: "#/definitions/multipleDataType" }` (ou un nouveau data type spécifique)

2. **Nouveau data type `mixedDataType` (optionnel mais recommandé)** :
   - Si on veut restreindre explicitement à 2 séries, il faut créer un data type dérivé de `multipleDataType` avec `maxItems: 2` sur `valuesFields`.
   - Sinon, on garde `multipleDataType` et on documente que seules les 2 premières séries sont prises en compte.

3. **Unités doubles** :
   - Le schéma global actuel a une seule propriété `unit` (string).
   - Il faut ajouter `unitLeft` et `unitRight` (ou `unitY` / `unitY1`) au niveau de la configuration globale ou spécifique au type `mixed`.

### 3.2 Composant de rendu
**Fichier** : `src/components/Chart.vue`

Modifications nécessaires :
1. **Import** : `Bar` est déjà importé, mais il faut s'assurer que `LineElement` et `PointElement` sont bien enregistrés (déjà le cas).

2. **Template** : ajouter `<Bar v-else-if="chart.type === 'mixed'" … />`. Chart.js supporte nativement les datasets mixtes dans un composant `Bar`.

3. **`options` computed** :
   - **Double axe Y** : ajouter `scales.y1` avec `position: 'right'`, `grid: { drawOnChartArea: false }` pour éviter la superposition des grilles.
   - **Unités** : dans `options.scales.y.ticks.callback` et `options.scales.y1.ticks.callback`, formatter avec `unitLeft` / `unitRight`.
   - **Tooltips** : adapter le callback `label` pour indiquer l'unité correspondante selon le `dataset.yAxisID`.
   - **Datalabels** : si `hideYAxis` est utilisé, gérer l'ancrage/alignement pour 2 axes (plus complexe).

4. **`chartKey`** : potentiellement ajouter `unitLeft` / `unitRight` si elles influencent le rendu (non nécessaire, les options sont réactives).

### 3.3 Composables de données
**Fichiers** :
- `src/composables/useChartData.js`
- `src/composables/chart-data/rowsBased.js`
- `src/composables/chart-data/aggsBased.js`
- `src/composables/chart-data/aggsBasedLabels.js`
- `src/composables/chart-data/aggsLabels.js`

Modifications nécessaires :
1. **`useChartData.js`** :
   - Le `mode` est extrait avec `chart.value.config.type?.replace('Categories', '')`. Pas de changement si `mixed` réutilise les modes existants (`rowsBased`, `aggsBased`, etc.).
   - Ajouter `unitLeft` / `unitRight` dans `queryKey` si elles doivent déclencher un re-fetch (non nécessaire, ce sont purement d'affichage).

2. **Fichiers de données (`rowsBased.js`, `aggsBased.js`, etc.)** :
   - Pour chaque dataset créé, il faut assigner `yAxisID` :
     - 1er dataset → `yAxisID: 'y'`
     - 2ème dataset → `yAxisID: 'y1'`
   - Pour le type `mixed`, il faut aussi assigner `type: 'line'` au 2ème dataset (ou selon la configuration).
   - Le `fill` actuel est calculé avec `chart.value.area || (chart.value.type === 'multi-line' && stacked === 'true')`. Ajouter `mixed` si la série ligne doit pouvoir remplir son aire (`area` optionnel pour `mixed`).

   **Exemple dans `rowsBased.js`** :
   ```js
   datasets = chart.value.config.valuesFields.map((field, i) => ({
     label: …,
     borderColor: colors[field],
     backgroundColor: colors[field],
     pointStyle: chart.value.hidePoints ? false : 'circle',
     fill: chart.value.area,
     data: results.map(r => getValue(r[field])),
     type: i === 1 ? 'line' : 'bar',  // ou selon config
     yAxisID: i === 0 ? 'y' : 'y1'
   }))
   ```

   **Exemple dans `aggsBased.js`** (mode `aggsBased` avec `groupsField`) :
   ```js
   datasets = series.map((label, i) => ({
     label: …,
     borderColor: colors[label],
     backgroundColor: colors[label],
     …
     type: i === 1 ? 'line' : 'bar',
     yAxisID: i === 0 ? 'y' : 'y1'
   }))
   ```

   ⚠️ **Problème** : dans `aggsBased` avec `groupsField`, les séries sont triées et filtrées dynamiquement. L'ordre n'est pas garanti. Il faut donc :
   - soit fixer l'ordre des séries (par ex. via `groupSortBy`)
   - soit utiliser une configuration explicite du mapping série → type (par nom de série)

### 3.4 Composant Actions
**Fichier** : `src/components/Actions.vue`

Modifications nécessaires :
- Le bouton "Empiler" (`v-switch stacked`) est affiché pour `['multi-bar', 'multi-line']`. Le type `mixed` ne doit **pas** permettre l'empilement (car 2 axes distincts).
- Si on veut un sélecteur de métrique dynamique par axe, il faut l'ajouter ici (complexité supplémentaire).

### 3.5 Génération des types
**Commande** : `npm run build-types`

Après modification de `schema.json`, il faut régénérer les types TypeScript dans `src/config/.type/`.

---

## 4. Points de complexité identifiés

### 4.1 Mapping série → type / axe
Le plus gros point de complexité est de savoir **quelle série est en barre et quelle série est en ligne**, et **laquelle va sur quel axe**.

| Mode de données | Nombre de séries | Déterminisme de l'ordre |
|-----------------|------------------|------------------------|
| `rowsBased` (valuesFields) | 1 à 12 | Déterministe (ordre du array) |
| `aggsBased` (groupsField) | Variable (jusqu'à 12) | Non déterministe (tri dynamique) |
| `aggsBasedCategories` (valuesCalc) | 1 à 12 | Déterministe (ordre du array) |
| `aggsBasedLabels` (labelsValues) | Variable | Déterministe (ordre du array) |

**Solution recommandée** :
- Pour les modes déterministes (`rowsBased`, `aggsBasedCategories`, `aggsBasedLabels`) : on peut utiliser une convention simple (1ère série = barre/axe gauche, 2ème = ligne/axe droite).
- Pour `aggsBased` avec `groupsField` : il faut soit interdire ce mode pour `mixed`, soit ajouter une configuration explicite (`lineGroupValue` pour désigner quelle valeur du `groupsField` va en ligne).

### 4.2 Double unité
Actuellement, `config.unit` est une string unique utilisée dans :
- Tooltip
- Ticks des axes
- Datalabels

Pour `mixed`, il faut soit :
- **Option A** : ajouter `unitLeft` et `unitRight` au niveau global du config (impacte tous les types, mais peut être ignoré par les autres).
- **Option B** : ajouter `unitLeft` et `unitRight` spécifiquement dans la définition du type `mixed` dans le schéma (plus propre).

### 4.3 Restriction à 2 séries
Si on veut strictement limiter `mixed` à 2 séries, il faut soit :
- Créer un nouveau `mixedDataType` dans le schéma avec `valuesFields.maxItems: 2`
- Ou laisser `multipleDataType` et ne prendre que les 2 premières séries en code (plus simple, mais moins clair pour l'utilisateur)

### 4.4 Gestion des couleurs
Dans `getColors`, les couleurs sont assignées par nom de série. Pas de changement nécessaire.

### 4.5 Axe horizontal
L'option `horizontal` n'a pas de sens pour un graphique mixte à double axe Y. Il faut soit l'interdire, soit la gérer (transformation en double axe X, ce qui est rare et complexe).

**Recommandation** : ne pas supporter `horizontal` pour `mixed`.

---

## 5. Proposition d'implémentation détaillée

### 5.1 Schéma JSON (`src/config/schema.json`)

Ajouter dans le `oneOf` de `chart` :

```json
{
  "title": "Mixte (courbe + histogramme)",
  "additionalProperties": false,
  "properties": {
    "type": {
      "const": "mixed"
    },
    "tension": {
      "$ref": "#/definitions/tension"
    },
    "area": {
      "type": "boolean",
      "title": "Remplir l'aire sous la courbe",
      "default": false
    },
    "hidePoints": {
      "type": "boolean",
      "title": "Cacher les points de la courbe"
    },
    "yAxisStartsZero": {
      "type": "boolean",
      "title": "Commencer les axes à partir de 0"
    },
    "config": {
      "$ref": "#/definitions/mixedDataType"
    }
  }
}
```

Et définir `mixedDataType` comme un clone de `multipleDataType` avec `valuesFields.maxItems: 2` (ou `groupsField` limité à 2 valeurs, ce qui est plus difficile à exprimer en JSON Schema pur).

**Alternative plus simple** : réutiliser `multipleDataType` et documenter la limitation à 2 séries.

### 5.2 Chart.vue – options computed

Ajouter la gestion du double axe Y :

```js
if (chart.value.type === 'mixed') {
  options.scales.y = {
    beginAtZero: chart.value.yAxisStartsZero ?? true,
    position: 'left',
    title: {
      display: !!config.value.yTitle,
      text: config.value.yTitle,
      font: { weight: 'bold' }
    },
    ticks: {
      callback: v => v.toLocaleString('fr') + (config.value.unitLeft ? ' ' + config.value.unitLeft : '')
    }
  }
  options.scales.y1 = {
    beginAtZero: chart.value.yAxisStartsZero ?? true,
    position: 'right',
    grid: { drawOnChartArea: false },
    title: {
      display: !!config.value.yTitleRight,
      text: config.value.yTitleRight,
      font: { weight: 'bold' }
    },
    ticks: {
      callback: v => v.toLocaleString('fr') + (config.value.unitRight ? ' ' + config.value.unitRight : '')
    }
  }
}
```

Et dans le template :
```html
<Bar
  v-else-if="chart.type === 'mixed'"
  :key="chartKey"
  :options="options"
  :data="data"
/>
```

### 5.3 Fichiers de données

Dans chaque fichier de données, ajouter une fonction utilitaire ou un bloc conditionnel :

```js
function applyMixedType(datasets, chartType) {
  if (chartType !== 'mixed') return datasets
  datasets.forEach((ds, i) => {
    ds.type = i === 1 ? 'line' : 'bar'
    ds.yAxisID = i === 0 ? 'y' : 'y1'
    if (ds.type === 'line') {
      ds.pointStyle = chart.value.hidePoints ? false : 'circle'
    }
  })
  return datasets
}
```

**Note** : Cette approche par indice fonctionne bien pour `rowsBased` (valuesFields), `aggsBasedCategories` (valuesCalc) et `aggsBasedLabels` (labelsValues). Pour `aggsBased` avec `groupsField`, il faut soit exclure ce mode, soit permettre à l'utilisateur de désigner explicitement la valeur de groupe pour la ligne.

### 5.4 Unités doubles

Ajouter dans le schéma global (section "Options") :

```json
"unitLeft": {
  "type": "string",
  "title": "Unité axe gauche"
},
"unitRight": {
  "type": "string",
  "title": "Unité axe droit"
}
```

Et conserver `unit` pour la rétrocompatibilité (peut être utilisé comme fallback si `unitLeft`/`unitRight` sont vides).

---

## 6. Résumé de l'effort d'implémentation

| Tâche | Complexité | Fichiers |
|-------|-----------|----------|
| Schéma JSON (`mixed` + unités doubles) | Moyenne | `src/config/schema.json` |
| Génération des types TypeScript | Faible | `npm run build-types` |
| Rendu Chart.vue (template + options) | Moyenne | `src/components/Chart.vue` |
| Données : assigner `type` et `yAxisID` | Moyenne | `src/composables/chart-data/*.js` |
| Actions.vue (désactiver empilement) | Faible | `src/components/Actions.vue` |
| Tests et recette | Moyenne | – |

**Estimation globale** : ½ à 1 journée de travail pour un développeur familier du codebase.

---

## 7. Décisions à prendre avant implémentation

1. **Limiter `mixed` à exactement 2 séries ?**
   - Oui → créer `mixedDataType` avec restriction `maxItems: 2`
   - Non → utiliser `multipleDataType` + convention "2 premières séries"

2. **Support du mode `aggsBased` avec `groupsField` ?**
   - Oui → ajouter une config `lineGroupValue` (string) pour désigner la série ligne
   - Non → exclure ce mode du `oneOf` de `mixedDataType`

3. **Nommage des unités doubles**
   - `unitLeft` / `unitRight`
   - `unitY` / `unitY1`
   - `unit` (gauche) + `unitRight` (droite, fallback sur `unit`)

4. **Titre des axes doubles**
   - Réutiliser `yTitle` pour l'axe gauche et ajouter `yTitleRight` ?
   - Ou ajouter `yTitleLeft` + `yTitleRight` ?

5. **Série ligne = toujours la 2ème ?**
   - Oui → convention fixe (barre = 1ère, ligne = 2ème)
   - Non → ajouter une config `lineSeriesIndex` (0 ou 1)

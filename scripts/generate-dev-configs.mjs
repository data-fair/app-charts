#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const configsDir = './dev-configs'
if (!fs.existsSync(configsDir)) fs.mkdirSync(configsDir)

// Helpers
function loadDataset(filePath, localId) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return {
    href: `http://localhost:5888/data-fair/api/v1/datasets/${localId}`,
    title: raw.title,
    id: localId,
    schema: raw.schema,
    finalizedAt: raw.finalizedAt
  }
}

const dsAlim = loadDataset('/tmp/schema_alimconfiance.json', 'a4jz4xdfoymfiquex913bfgp')
const dsRpg = loadDataset('/tmp/schema_rpg.json', '5v2ar5y04jjrbuewjpssauy5')
const dsBpe = loadDataset('/tmp/schema_bpe.json', 'im3-1xqdhf1nxtfzuhtz2--l')
const dsLoyers = loadDataset('/tmp/schema_loyers.json', '358lpu2hhbmw7l560-uskijn')
const dsRne = loadDataset('/tmp/schema_rne.json', 'qwhvisdr1tuyecl76qrcnmep')
const dsDepl = loadDataset('/tmp/schema_deplacements.json', '2rkctur--j35-hc36008blc1')

function createConfig(name, configObj) {
  fs.writeFileSync(path.join(configsDir, `${name}.json`), JSON.stringify(configObj, null, 2) + '\n')
  console.log(`Created ${name}.json`)
}

// ============================================================
// 01. Pie — Alim'confiance — secteur d'activité (count)
// ============================================================
createConfig('01-pie-alim-secteur', {
  datasets: [dsAlim],
  qsFilter: '',
  title: 'Répartition des inspections par secteur d\'activité',
  unit: 'inspections',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'pie',
    cutout: 30,
    rotation: 0,
    display: 'both',
    sumInTitle: true,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'secteur_activite', interval: '' },
      size: 5,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      colorOrder: { type: 'palette', name: 'Set3', offset: 0 }
    }
  }
})

// ============================================================
// 02. Bar horizontal — Alim'confiance — région × évaluation
// ============================================================
createConfig('02-bar-alim-region-eval', {
  datasets: [dsAlim],
  qsFilter: '',
  title: 'Résultats des inspections par région',
  xTitle: 'Région',
  yTitle: 'Nombre d\'inspections',
  unit: '',
  labelsMaxWidth: 30,
  legendPosition: 'right',
  chart: {
    type: 'bar',
    horizontal: true,
    hideYAxis: true,
    yAxisStartsZero: true,
    config: {
      type: 'rowsBasedCategories',
      labelsField: 'reg_name',
      valuesField: '_i',
      categoriesField: 'evaluation_globale',
      size: 10,
      rowSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      colorOrder: {
        type: 'manual',
        entries: [
          { key: 'A - Conforme', color: '#59a14f' },
          { key: 'B - Non conformité mineure', color: '#edc948' },
          { key: 'C - Non conformité moyenne', color: '#f28e2c' },
          { key: 'Maîtrise des risques acceptable', color: '#76b7b2' },
          { key: 'Maîtrise des risques insuffisante', color: '#e15759' },
          { key: 'Maîtrise des risques satisfaisante', color: '#4e79a7' },
          { key: 'Perte de maîtrise des risques (urgence)', color: '#b07aa1' }
        ]
      }
    }
  }
})

// ============================================================
// 03. Line area — Alim'confiance — date_inspection (month) count
// ============================================================
createConfig('03-line-alim-temporal', {
  datasets: [dsAlim],
  qsFilter: '',
  title: 'Évolution mensuelle des inspections sanitaires',
  xTitle: 'Mois',
  yTitle: 'Nombre d\'inspections',
  unit: '',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'line',
    tension: 2,
    area: true,
    hidePoints: true,
    yAxisStartsZero: false,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'date', field: 'date_inspection', interval: 'month' },
      size: 50,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'label',
      sortOrder: 'asc',
      dynamicSort: false,
      color: { type: 'theme', strValue: 'primary' }
    }
  }
})

// ============================================================
// 04. Pie — RPG — surfaces par groupe de culture
// ============================================================
createConfig('04-pie-rpg-cultures', {
  datasets: [dsRpg],
  qsFilter: '',
  title: 'Surfaces agricoles par groupe de culture',
  unit: 'ha',
  divider: 10000,
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'pie',
    cutout: 0,
    rotation: 0,
    display: 'percentages',
    sumInTitle: false,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'code_group', interval: '' },
      size: 10,
      valueCalc: { type: 'metric', field: 'surf_parc', metric: 'sum', dynamicMetric: false },
      missingLabel: 'Autres cultures',
      aggSortBy: 'value',
      sortOrder: 'desc',
      colorOrder: { type: 'palette', name: 'Set2', offset: 0 }
    }
  }
})

// ============================================================
// 05. Bar — RPG — surface moyenne par culture
// ============================================================
createConfig('05-bar-rpg-surface', {
  datasets: [dsRpg],
  qsFilter: '',
  title: 'Surface moyenne des parcelles par culture',
  xTitle: 'Culture',
  yTitle: 'Surface moyenne',
  unit: 'm²',
  labelsMaxWidth: 40,
  legendPosition: 'top',
  chart: {
    type: 'bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'culture_d1', interval: '' },
      size: 12,
      valueCalc: { type: 'metric', field: 'surf_parc', metric: 'avg', dynamicMetric: false },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      color: { type: 'custom', hexValue: '#59a14f' }
    }
  }
})

// ============================================================
// 06. Multi-bar — BPE — équipements par région et secteur
// ============================================================
createConfig('06-multi-bar-bpe-secteur', {
  datasets: [dsBpe],
  qsFilter: '',
  title: 'Équipements par région (public vs privé)',
  xTitle: 'Région',
  yTitle: 'Nombre d\'équipements',
  unit: '',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'multi-bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    stacked: true,
    percentage: false,
    disableDynamicStack: false,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'reg', interval: '' },
      groupsField: 'sect',
      size: 10,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      colorOrder: { type: 'palette', name: 'Paired', offset: 0 }
    }
  }
})

// ============================================================
// 07. Pie — BPE — répartition par type d'équipement
// ============================================================
createConfig('07-pie-bpe-type', {
  datasets: [dsBpe],
  qsFilter: '',
  title: 'Répartition des équipements par type',
  unit: '',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'pie',
    cutout: 0,
    rotation: 0,
    display: 'values',
    sumInTitle: false,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'type', interval: '' },
      size: 5,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      colorOrder: { type: 'palette', name: 'Accent', offset: 0 }
    }
  }
})

// ============================================================
// 08. Bar — BPE — capacité totale par catégorie
// ============================================================
createConfig('08-bar-bpe-capacite', {
  datasets: [dsBpe],
  qsFilter: '',
  title: 'Capacité totale des équipements culturels',
  xTitle: 'Catégorie',
  yTitle: 'Capacité totale',
  unit: 'places',
  labelsMaxWidth: 40,
  legendPosition: 'top',
  chart: {
    type: 'bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'categorie', interval: '' },
      size: 12,
      valueCalc: { type: 'metric', field: 'capacite', metric: 'sum', dynamicMetric: false },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      color: { type: 'theme', strValue: 'secondary' }
    }
  }
})

// ============================================================
// 09. Multi-bar — BPE — équipements par région × domaine
// ============================================================
createConfig('09-multi-bar-bpe-domaine', {
  datasets: [dsBpe],
  qsFilter: '',
  title: 'Équipements par région et domaine',
  xTitle: 'Région',
  yTitle: 'Nombre',
  unit: '',
  labelsMaxWidth: 30,
  legendPosition: 'bottom',
  chart: {
    type: 'multi-bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    stacked: false,
    percentage: false,
    disableDynamicStack: false,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'reg', interval: '' },
      groupsField: 'dom',
      size: 10,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      colorOrder: { type: 'palette', name: 'Set1', offset: 0 }
    }
  }
})

// ============================================================
// 10. Bar — BPE — salles moyennes par type
// ============================================================
createConfig('10-bar-bpe-salles', {
  datasets: [dsBpe],
  qsFilter: '',
  title: 'Nombre moyen de salles par type d\'équipement',
  xTitle: 'Type',
  yTitle: 'Salles moyennes',
  unit: 'salles',
  labelsMaxWidth: 40,
  legendPosition: 'top',
  chart: {
    type: 'bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'type', interval: '' },
      size: 5,
      valueCalc: { type: 'metric', field: 'nbsalles', metric: 'avg', dynamicMetric: false },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      color: { type: 'custom', hexValue: '#4e79a7' }
    }
  }
})

// ============================================================
// 11. Bar — Loyers — loyer moyen par département
// ============================================================
createConfig('11-bar-loyers-dep', {
  datasets: [dsLoyers],
  qsFilter: '',
  title: 'Loyer moyen au m² par département (maisons)',
  xTitle: 'Département',
  yTitle: 'Loyer (€/m²)',
  unit: '€/m²',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'dep', interval: '' },
      size: 15,
      valueCalc: { type: 'metric', field: 'loypredm2', metric: 'avg', dynamicMetric: false },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: true,
      color: { type: 'theme', strValue: 'primary' }
    }
  }
})

// ============================================================
// 12. Multi-line — Loyers — loyer + intervalle par commune
// ============================================================
createConfig('12-multi-line-loyers-intervalle', {
  datasets: [dsLoyers],
  qsFilter: '',
  title: 'Loyer prédit avec intervalle de confiance',
  xTitle: 'Commune',
  yTitle: 'Loyer (€/m²)',
  unit: '€/m²',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'multi-line',
    tension: 1,
    stacked: false,
    percentage: false,
    disableDynamicStack: false,
    yAxisStartsZero: false,
    hidePoints: false,
    config: {
      type: 'rowsBased',
      labelsField: 'libgeo',
      valuesFields: ['loypredm2', 'lwripm2', 'upripm2'],
      size: 20,
      rowSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      colorOrder: {
        type: 'palette',
        name: 'Dark2',
        offset: 0,
        seriesOrder: ['loypredm2', 'lwripm2', 'upripm2']
      }
    }
  }
})

// ============================================================
// 13. Pie — Loyers — répartition des composantes
// ============================================================
createConfig('13-pie-loyers-composantes', {
  datasets: [dsLoyers],
  qsFilter: '',
  title: 'Répartition des composantes de loyer',
  unit: '€/m²',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'pie',
    cutout: 40,
    rotation: 0,
    display: 'both',
    sumInTitle: true,
    config: {
      type: 'aggsLabels',
      valuesFields: ['loypredm2', 'lwripm2', 'upripm2'],
      removeFromLabels: '',
      colorOrder: {
        type: 'palette',
        name: 'Pastel1',
        offset: 0
      }
    }
  }
})

// ============================================================
// 14. Pie — RNE — répartition femmes/hommes
// ============================================================
createConfig('14-pie-rne-sexe', {
  datasets: [dsRne],
  qsFilter: '',
  title: 'Répartition des conseillers régionaux par sexe',
  unit: 'élus',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'pie',
    cutout: 0,
    rotation: 0,
    display: 'percentages',
    sumInTitle: false,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'code_sexe', interval: '' },
      size: 5,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      colorOrder: {
        type: 'manual',
        entries: [
          { key: 'F', color: '#e15759' },
          { key: 'M', color: '#4e79a7' }
        ]
      }
    }
  }
})

// ============================================================
// 15. Multi-bar — RNE — âge moyen par région et sexe
// ============================================================
createConfig('15-multi-bar-rne-age', {
  datasets: [dsRne],
  qsFilter: '',
  title: 'Âge moyen des conseillers régionaux',
  xTitle: 'Région',
  yTitle: 'Âge moyen',
  unit: 'ans',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'multi-bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: false,
    stacked: false,
    percentage: false,
    disableDynamicStack: false,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'libelle_de_la_region', interval: '' },
      groupsField: 'code_sexe',
      size: 14,
      valueCalc: { type: 'metric', field: 'age', metric: 'avg', dynamicMetric: true },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: true,
      colorOrder: {
        type: 'palette',
        name: 'Set2',
        offset: 0
      }
    }
  }
})

// ============================================================
// 16. Paired-histogram — Déplacements — voiture vs vélo
// ============================================================
createConfig('16-paired-histo-deplacements', {
  datasets: [dsDepl],
  qsFilter: '',
  title: 'Comparaison voiture vs vélo',
  xTitle: 'Période',
  yTitle: 'Déplacements',
  unit: 'dépl.',
  divider: 1000,
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'paired-histogram',
    config: {
      type: 'rowsBased',
      labelsField: 'time_period',
      valuesFields: ['voit', 'velo'],
      size: 200,
      rowSortBy: 'label',
      sortOrder: 'asc',
      dynamicSort: false,
      colorOrder: {
        type: 'palette',
        name: 'Set1',
        offset: 0,
        seriesOrder: ['voit', 'velo']
      }
    }
  }
})

// ============================================================
// 17. Radar — Déplacements — modes de transport par période
// ============================================================
createConfig('17-radar-deplacements', {
  datasets: [dsDepl],
  qsFilter: '',
  title: 'Modes de transport par période',
  unit: 'dépl.',
  divider: 1000,
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'radar',
    tension: 1,
    config: {
      type: 'aggsBasedLabels',
      labelsValues: ['voit', 'velo', 'trans_com'],
      valuesLabel: 'time_period',
      metric: 'sum',
      dynamicMetric: false,
      size: 10,
      missingLabel: '',
      colorOrder: {
        type: 'palette',
        name: 'Dark2',
        offset: 0
      }
    }
  }
})

// ============================================================
// 18. Bar + staticFilters — Alim'confiance — Paris uniquement
// ============================================================
createConfig('18-bar-alim-filtre-paris', {
  datasets: [dsAlim],
  qsFilter: '',
  staticFilters: [
    { type: 'in', field: 'dep_name', values: ['Paris'] }
  ],
  title: 'Inspections à Paris par secteur',
  xTitle: 'Secteur',
  yTitle: 'Nombre d\'inspections',
  unit: '',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'value', field: 'secteur_activite', interval: '' },
      size: 5,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'value',
      sortOrder: 'desc',
      dynamicSort: false,
      color: { type: 'theme', strValue: 'primary' }
    }
  }
})

// ============================================================
// 19. Multi-bar aggsBasedCategories — BPE — capacité/salles/lieux
// ============================================================
createConfig('19-multi-bar-bpe-metrics', {
  datasets: [dsBpe],
  qsFilter: '',
  title: 'Moyennes par région (capacité, salles, lieux)',
  xTitle: 'Région',
  yTitle: 'Moyenne',
  unit: '',
  labelsMaxWidth: 30,
  legendPosition: 'bottom',
  chart: {
    type: 'multi-bar',
    horizontal: false,
    hideYAxis: false,
    yAxisStartsZero: true,
    stacked: false,
    percentage: false,
    disableDynamicStack: false,
    config: {
      type: 'aggsBasedCategories',
      groupBy: { type: 'value', field: 'reg', interval: '' },
      valuesCalc: ['capacite', 'nbsalles', 'nblieux'],
      metric: 'avg',
      dynamicMetric: true,
      size: 10,
      aggSortBy: 'value',
      sortField: 'capacite',
      sortOrder: 'desc',
      dynamicSort: true,
      colorOrder: {
        type: 'palette',
        name: 'Paired',
        offset: 0,
        seriesOrder: ['capacite', 'nbsalles', 'nblieux']
      }
    }
  }
})

// ============================================================
// 20. Line — Loyers — distribution des loyers (groupBy number)
// ============================================================
createConfig('20-line-loyers-distribution', {
  datasets: [dsLoyers],
  qsFilter: '',
  title: 'Distribution des loyers au m²',
  xTitle: 'Loyer (€/m²)',
  yTitle: 'Nombre de communes',
  unit: 'communes',
  labelsMaxWidth: 30,
  legendPosition: 'top',
  chart: {
    type: 'line',
    tension: 0,
    area: true,
    hidePoints: false,
    yAxisStartsZero: true,
    config: {
      type: 'aggsBased',
      groupBy: { type: 'number', field: 'loypredm2', interval: 2 },
      size: 20,
      valueCalc: { type: 'count' },
      missingLabel: '',
      aggSortBy: 'label',
      sortOrder: 'asc',
      dynamicSort: false,
      color: { type: 'theme', strValue: 'secondary' }
    }
  }
})

console.log('All 20 configs generated in', configsDir)

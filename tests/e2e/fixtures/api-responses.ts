// Mock API responses for the four DataFair endpoints the app calls.
// Each response is small but realistic (a handful of aggs / lines / metrics)
// so we exercise the transformation logic without pulling real data.
//
// Tests match URLs by substring (see mock-api.ts) and serve these JSON
// payloads via page.route().

// ──────────────────────────────────────────────────────────────────
// /values_agg
// ──────────────────────────────────────────────────────────────────

export const valuesAggFixtures: Record<string, any> = {
  // pie aggsBased, simple count (5 sectors)
  pie_alim_secteur: {
    aggs: [
      { value: 'Restaurants', total: 18420 },
      { value: 'Commerces de détail', total: 12350 },
      { value: 'Métiers de bouche', total: 9740 },
      { value: 'Grande distribution', total: 8110 },
      { value: 'Autre', total: 3210 }
    ]
  },
  // pie rpg cultures (10 cultures)
  pie_rpg_cultures: {
    aggs: [
      { value: 'Céréales', total: 18500000 },
      { value: 'Oléagineux', total: 8200000 },
      { value: 'Protéagineux', total: 1240000 },
      { value: 'Betteraves', total: 980000 },
      { value: 'Maïs', total: 2400000 },
      { value: 'Prairies', total: 6500000 }
    ]
  },
  // bar avg metric
  bar_rpg_surface: {
    aggs: [
      { value: 'Blé tendre', metric: 12340 },
      { value: 'Maïs grain', metric: 18420 },
      { value: 'Colza', metric: 9870 },
      { value: 'Tournesol', metric: 7230 },
      { value: 'Orge', metric: 11200 }
    ]
  },
  // multi-bar groupsField (region × secteur)
  multi_bar_bpe_secteur: {
    aggs: [
      { value: 'Île-de-France', aggs: [{ value: 'Public', total: 1234 }, { value: 'Privé', total: 4567 }] },
      { value: 'Auvergne-Rhône-Alpes', aggs: [{ value: 'Public', total: 2340 }, { value: 'Privé', total: 5670 }] },
      { value: 'PACA', aggs: [{ value: 'Public', total: 1450 }, { value: 'Privé', total: 3210 }] }
    ]
  },
  // pie bpe type
  pie_bpe_type: {
    aggs: [
      { value: 'Sport', total: 12340 },
      { value: 'Éducation', total: 8230 },
      { value: 'Santé', total: 5120 },
      { value: 'Culture', total: 3200 },
      { value: 'Commerce', total: 2400 }
    ]
  },
  // bar sum numeric (capacity)
  bar_bpe_capacite: {
    aggs: [
      { value: 'Cinéma', total: 12400 },
      { value: 'Théâtre', total: 8120 },
      { value: 'Musée', total: 6230 },
      { value: 'Médiathèque', total: 4100 }
    ]
  },
  // multi-bar groupsField (region × domaine)
  multi_bar_bpe_domaine: {
    aggs: [
      { value: 'Île-de-France', aggs: [{ value: 'Sport', total: 1234 }, { value: 'Éducation', total: 2340 }, { value: 'Santé', total: 1800 }] },
      { value: 'Auvergne-Rhône-Alpes', aggs: [{ value: 'Sport', total: 1500 }, { value: 'Éducation', total: 2100 }, { value: 'Santé', total: 1500 }] }
    ]
  },
  // bar avg small integer (salles)
  bar_bpe_salles: {
    aggs: [
      { value: 'Cinéma', metric: 3 },
      { value: 'Théâtre', metric: 1 },
      { value: 'Musée', metric: 4 }
    ]
  },
  // bar with column divisor (capacite / nblieux per group)
  bar_bpe_divisor: {
    aggs: [
      { value: 'Cinéma', metric: 12400, nblieux_sum: 8 },
      { value: 'Théâtre', metric: 8120, nblieux_sum: 4 },
      { value: 'Musée', metric: 6230, nblieux_sum: 5 },
      { value: 'Médiathèque', metric: 4100 } // pas de diviseur exploitable → point masqué
    ]
  },
  // bar loyers dep
  bar_loyers_dep: {
    aggs: [
      { value: '75', metric: 28.5 },
      { value: '92', metric: 21.3 },
      { value: '13', metric: 16.2 },
      { value: '69', metric: 15.8 },
      { value: '31', metric: 13.2 }
    ]
  },
  // bar alim Paris
  bar_alim_filtre_paris: {
    aggs: [
      { value: 'Restaurants', total: 5230 },
      { value: 'Commerces', total: 3120 },
      { value: 'Métiers de bouche', total: 1980 }
    ]
  },
  // multi-bar aggsBasedCategories (avg of multiple metrics)
  multi_bar_bpe_metrics: {
    aggs: [
      { value: 'Île-de-France', metric: 124.5, capacite_avg: 124, nbsalles_avg: 2, nblieux_avg: 5 },
      { value: 'PACA', metric: 98.2, capacite_avg: 98, nbsalles_avg: 1, nblieux_avg: 3 },
      { value: 'Bretagne', metric: 87.4, capacite_avg: 87, nbsalles_avg: 1, nblieux_avg: 4 }
    ]
  },
  // line distribution (groupBy number)
  line_loyers_distribution: {
    aggs: [
      { value: '8', total: 12 },
      { value: '10', total: 145 },
      { value: '12', total: 870 },
      { value: '14', total: 2340 },
      { value: '16', total: 1980 },
      { value: '18', total: 870 },
      { value: '20', total: 312 },
      { value: '22', total: 95 }
    ]
  },
  // line temporal (groupBy date)
  line_alim_temporal: {
    aggs: [
      { value: '2024-01-01T00:00:00.000Z', total: 1234 },
      { value: '2024-02-01T00:00:00.000Z', total: 1456 },
      { value: '2024-03-01T00:00:00.000Z', total: 1620 },
      { value: '2024-04-01T00:00:00.000Z', total: 1380 },
      { value: '2024-05-01T00:00:00.000Z', total: 1500 }
    ]
  }
}

// ──────────────────────────────────────────────────────────────────
// /values_agg for aggsBasedLabels (radar)
// ──────────────────────────────────────────────────────────────────
export const valuesAggLabelsFixture = {
  aggs: [
    { value: '2019', voit: 21000, velo: 1200, trans_com: 8000 },
    { value: '2020', voit: 18500, velo: 1800, trans_com: 7500 },
    { value: '2021', voit: 22000, velo: 2300, trans_com: 8500 }
  ]
}

// ──────────────────────────────────────────────────────────────────
// /values-labels/<field>
// ──────────────────────────────────────────────────────────────────
export const valuesLabelsFixture = {
  alim_evaluation: [
    { value: 'A - Conforme', label: 'A - Conforme' },
    { value: 'B - Non conformité mineure', label: 'B - Non conformité mineure' },
    { value: 'C - Non conformité moyenne', label: 'C - Non conformité moyenne' }
  ]
}

// ──────────────────────────────────────────────────────────────────
// /lines  (rowsBased)
// ──────────────────────────────────────────────────────────────────
export const linesFixtureAlimRegion = {
  results: [
    { reg_name: 'Île-de-France', evaluation_globale: 'A - Conforme', _i: 1 },
    { reg_name: 'Île-de-France', evaluation_globale: 'B - Non conformité mineure', _i: 1 },
    { reg_name: 'Île-de-France', evaluation_globale: 'C - Non conformité moyenne', _i: 1 },
    { reg_name: 'Auvergne-Rhône-Alpes', evaluation_globale: 'A - Conforme', _i: 1 },
    { reg_name: 'PACA', evaluation_globale: 'A - Conforme', _i: 1 }
  ]
}

export const linesFixtureLoyersIntervalles = {
  results: [
    { libgeo: 'Paris', loypredm2: 28.5, lwripm2: 5.2, upripm2: 2.1 },
    { libgeo: 'Lyon', loypredm2: 16.2, lwripm2: 3.4, upripm2: 1.5 },
    { libgeo: 'Marseille', loypredm2: 14.8, lwripm2: 3.1, upripm2: 1.3 }
  ]
}

export const linesFixtureDeplacements = {
  results: [
    { time_period: '2019', voit: 21000, velo: 1200 },
    { time_period: '2020', voit: 18500, velo: 1800 },
    { time_period: '2021', voit: 22000, velo: 2300 }
  ]
}

// ──────────────────────────────────────────────────────────────────
// /metric_agg  (aggsLabels: one call per field)
// ──────────────────────────────────────────────────────────────────
export const metricAggFixtures: Record<string, { metric: number }> = {
  loypredm2: { metric: 18.4 },
  lwripm2: { metric: 4.1 },
  upripm2: { metric: 1.7 }
}

// ──────────────────────────────────────────────────────────────────
// Default empty response
// ──────────────────────────────────────────────────────────────────
export const emptyAggs = { aggs: [] }
export const emptyResults = { results: [] }
export const emptyMetric = { metric: 0 }

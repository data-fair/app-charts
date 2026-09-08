import neostandard from 'neostandard'
import pluginVue from 'eslint-plugin-vue'
import pluginVuetify from 'eslint-plugin-vuetify'
import dfLibRecommended from '@data-fair/lib-utils/eslint/recommended.js'

// le flat/base de eslint-plugin-vuetify enregistre déjà le plugin `vue`, et
// ESLint 9.39+ refuse qu'un plugin soit redéfini — retirer `plugins` de la config de vue.
const vueFlatRecommended = pluginVue.configs['flat/recommended'].map(({ plugins, ...rest }) => rest)

export default [
  ...dfLibRecommended,
  ...vueFlatRecommended,
  ...pluginVuetify.configs['flat/recommended'],
  ...neostandard({ ts: true, env: ['browser'] }),
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'no-undef': 'off' // typescript s'en charge
    }
  },
  { ignores: ['dist/', 'node_modules/', 'src/config/.type/', 'tests/output/', 'playwright-report/'] }
]

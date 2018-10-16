import Vue from 'vue'
import colors from 'vuetify/es5/util/colors'

/* Load all components if you write a large application that uses a large number of them
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
*/

import {
  Vuetify,
  VApp,
  VAlert,
  VBtn,
  VDataTable,
  VGrid,
  VForm,
  VAutocomplete
} from 'vuetify'
require('vuetify/src/stylus/app.styl')

Vue.use(Vuetify, {
  components: {
    VApp,
    VAlert,
    VBtn,
    VDataTable,
    VGrid,
    VForm,
    VAutocomplete
  },
  theme: {
    primary: colors.blue.darken1,
    accent: colors.orange.base
  }
})

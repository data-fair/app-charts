import 'vuetify/styles'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { defaultOptions } from '@data-fair/lib/vuetify.js'
import App from './App.vue'

const app = createApp(App)

// @ts-ignore
app.use(createVuetify(defaultOptions))

app.mount('#app')

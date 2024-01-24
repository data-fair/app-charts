import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import StorePlugin from './plugins/init'

const app = createApp(App)
let env = import.meta.env

if (env === undefined) {
  env = {}
}

app.use(StorePlugin, { environement: env })
app.use(router)
app.use(vuetify)

app.mount('#app')

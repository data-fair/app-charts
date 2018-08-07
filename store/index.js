import Vue from 'vue'
import Vuex from 'vuex'
import {sessionStore} from '@koumoul/sd-vue'
import {notificationStore} from '@koumoul/notif-vue'
import {dataFairStore} from '@koumoul/data-fair-vue'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    modules: {'data-fair': dataFairStore, session: sessionStore, notification: notificationStore},
    state: {
      metricTypes: [
        {value: 'count', text: `Nombre de documents`},
        {value: 'min', text: 'Valeur min'},
        {value: 'max', text: 'Valeur max'},
        {value: 'sum', text: 'Somme'},
        {value: 'avg', text: 'Moyenne'}
      ],
      colors: ['#2196F3', '#E91E63', '#7E57C2', '#009688', '#00BCD4', '#EF6C00', '#4CAF50', '#FF9800', '#F44336', '#CDDC39', '#9C27B0', '#FFC107', '#3F51B5', '#795548', '#607D8B', '#FF9800', '#03A9F4', '#8BC34A', '#FFEB3B']
    },
    getters: {
      metricLabel(state) {
        if (!state['data-fair'].datasets.main) return
        if (!state['data-fair'].appConfig.metricType) return
        if (!state['data-fair'].appConfig.metricField) return
        const metricType = state.metricTypes.find(m => m.value === state['data-fair'].appConfig.metricType)
        const field = state['data-fair'].datasets.main.schema.find(f => f.key === state['data-fair'].appConfig.metricField)
        return metricType.text + ' de ' + (field.title || field['x-originalName'])
      }
    },
    mutations: {
      setAny(state, params) {
        Object.assign(state, params)
      }
    },
    actions: {}
  })
}

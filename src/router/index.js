import { createRouter, createWebHistory } from 'vue-router'
import IndexPage from '../views/IndexPage.vue'

const BASE_PATH = import.meta.env.BASE_URL ?? '/app/'
const router = createRouter({
  history: createWebHistory(BASE_PATH),
  routes: [
    {
      path: '/',
      name: 'home',
      component: IndexPage
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutPage.vue')
    }
  ]
})

export default router

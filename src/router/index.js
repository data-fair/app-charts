import { createRouter, createWebHistory } from 'vue-router'

const BASE_PATH = import.meta.env.BASE_URL ?? '/app/'
const router = createRouter({
  history: createWebHistory(BASE_PATH),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/IndexPage.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutPage.vue')
    }
  ]
})

export default router

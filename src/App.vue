<template>
  <!-- Use the DefaultLayout as the main layout for your app -->
  <DefaultLayout />
</template>

<script>
import { defineComponent } from 'vue'
import DefaultLayout from './layouts/DefaultLayout.vue'

export default defineComponent({
  components: {
    DefaultLayout
  }
})
</script>

<style>
</style>

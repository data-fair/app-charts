<template>
  <v-app :class="embed ? 'embed' : ''">
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  setup() {
    const route = useRoute()
    const embed = ref(route.query.embed === 'true')

    watch(() => route.query.embed, (newEmbed) => {
      embed.value = newEmbed === 'true'
    })

    return {
      embed
    }
  }
})
</script>

<style>
</style>

<template>
  <v-app :class="embed ? 'embed' : ''">
    <v-content>
      <nuxt />
    </v-content>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      embed: this.$route.query.embed === 'true'
    }
  }
}
</script>

<style>
</style>

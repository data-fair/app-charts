<template>
  <v-app :class="embed ? 'embed' : ''">
    <v-content>
      <v-alert v-if="!!error" :value="!!error" type="error">
        {{ error.message || error }}
      </v-alert>
      <nuxt v-else/>
    </v-content>
  </v-app>
</template>

<script>
import { mapState } from 'vuex'

export default {
  components: {},
  data() {
    return {
      embed: this.$route.query.embed === 'true'
    }
  },
  computed: {
    ...mapState(['application', 'error'])
  }
}

</script>
<style lang="less">
html {
  overflow-y: auto !important;
}
body .application {
  font-family: 'Nunito', sans-serif;
}
body .application.embed {
  background: transparent;
}
</style>

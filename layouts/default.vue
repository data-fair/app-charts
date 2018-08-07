<template>
  <v-app>

    <v-toolbar v-if="!!dataFairConfig && !embed" app scroll-off-screen>
      <v-toolbar-title v-if="appDef"><nuxt-link to="/">{{ appDef.title }}</nuxt-link></v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn v-if="appDef && appDef.userPermissions.includes('writeConfig')" nuxt to="/config" flat>Configure</v-btn>
        <v-menu v-if="user" offset-y>
          <v-btn slot="activator" color="primary" dark flat>{{ user.name }}</v-btn>
          <v-list>
            <v-list-tile @click="$store.dispatch('session/logout')">
              <v-list-tile-title>Se déconnecter</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
        <v-btn v-else :href="loginUrl()" color="primary">Se connecter</v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <v-content>
      <nuxt/>
      <v-snackbar v-if="notif" ref="notificationSnackbar" v-model="notif" :color="notif.type" :timeout="0" class="notification" bottom>
        <div>
          <p>{{ notif.msg }}</p>
          <p v-if="notif.errorMsg" class="ml-3">{{ notif.errorMsg }}</p>
        </div>
        <v-btn flat icon @click.native="$store.dispatch('notification/unqueue')"><v-icon>close</v-icon></v-btn>
      </v-snackbar>
    </v-content>
  </v-app>
</template>

<script>
import {mapState, mapGetters} from 'vuex'
const TWEEN = require('tween.js')

export default {
  components: {},
  data() {
    return {
      embed: this.$route.query.embed === 'true'
    }
  },
  computed: {
    ...mapState('data-fair', ['dataFairConfig', 'appConfig', 'appDef']),
    ...mapState('session', ['user']),
    ...mapState('notification', ['notif']),
    ...mapGetters('session', ['loginUrl'])
  },
  mounted() {
    // main animation loop
    const animate = () => {
      window.requestAnimationFrame(animate)
      TWEEN.update()
    }
    animate()
  }
}

</script>
<style lang="less">
body .application {
  font-family: 'Nunito', sans-serif;

  a {
    text-decoration: none;
  }

  .notification .v-snack__content {
    height: auto;
    p {
      margin-bottom: 4px;
      margin-top: 4px;
    }
  }
}
</style>

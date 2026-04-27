<script setup lang="ts">
import { errorMessage, displayError } from '@/composables/useChartData'
</script>

<template>
  <v-snackbar
    v-model="displayError"
    :timeout="5000"
    color="red"
  >
    <div>
      {{ errorMessage }}
    </div>
  </v-snackbar>
</template>

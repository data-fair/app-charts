<template>
  <div id="color">
    <div class="palette" v-for="(palette, index) in palettes" :key="index">
      <div class="palette-title">{{ palette.title }}</div>
      <div class="palette-colors">
        <div class="palette-color" v-for="color in palette.colors" :key="color" :style="{ backgroundColor: color }"></div>
      </div>
    </div>
    <div class="palette" v-for="(palette, index) in vuetifyColors" :key="index">
      <br>
      <div class="palette-title">{{ vuetifyColorsKeys[index] }}</div>
      <div class="palette-colors">
        <div class="palette-color" :style="{ backgroundColor: palette }"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { generatePalette, generatePaletteFromColor, generateHuesFromColor, simulateColorBlindness, beautifyPalette, getGoldenColor } from '../assets/colors'
import { computed, inject, onMounted, ref } from 'vue'

export default {
  setup() {
    const store = inject('appInfo')

    const config = computed(() => store.config)
    const vuetify = inject('vuetify')
    const primaryColor = computed(() => vuetify.theme.current.value.colors.primary)
    const secondaryColor = computed(() => vuetify.theme.current.value.colors.secondary)
    const accentColor = computed(() => vuetify.theme.current.value.colors.accent)
    const vuetifyColors = []
    const vuetifyColorsKeys = []
    for (const key of Object.keys(vuetify.theme.current.value.colors)) {
      vuetifyColorsKeys.push(key)
      vuetifyColors.push(vuetify.theme.current.value.colors[key])
    }

    const palettes = ref([])

    onMounted(() => {
      palettes.value = [
        { title: 'Qualitative', colors: generatePalette('Qualitative', 10) },
        { title: 'Beautify Palette', colors: beautifyPalette(generatePalette('Qualitative', 10)) },
        { title: 'Divergente', colors: generatePalette('Divergente', 10) },
        { title: 'Sequentielle', colors: generatePalette('Sequentielle', 10) },
        { title: 'Default', colors: generatePalette() },
        { title: 'Hues From Color', colors: generateHuesFromColor(primaryColor.value) },
        { title: 'Hues From Color (CBF)', colors: generateHuesFromColor(primaryColor.value, true) },
        { title: 'Color Blindness (primary color)', colors: simulateColorBlindness(primaryColor.value) },
        { title: 'Palette from Primary color', colors: generatePaletteFromColor(primaryColor.value) },
        { title: 'Beautify Palette From Color', colors: beautifyPalette(generatePaletteFromColor(primaryColor.value)) },
        { title: 'Palette from Secondary color', colors: generatePaletteFromColor(primaryColor.value) },
        { title: 'Beautify Palette From Color', colors: beautifyPalette(generatePaletteFromColor(secondaryColor.value)) },
        { title: 'Palette from Accent color', colors: generatePaletteFromColor(accentColor.value) },
        { title: 'Beautify Palette From Color', colors: beautifyPalette(generatePaletteFromColor(accentColor.value)) },
        { title: 'Golden Color', colors: [getGoldenColor(primaryColor.value), getGoldenColor(primaryColor.value), getGoldenColor(accentColor.value)] },
        { title: 'Goldenify the palette from primary', colors: generatePaletteFromColor(primaryColor.value).map(color => getGoldenColor(color)) },
        { title: 'Goldenify the palette from secondary', colors: generatePaletteFromColor(secondaryColor.value).map(color => getGoldenColor(color)) },
        { title: 'Goldenify the palette from accent', colors: generatePaletteFromColor(accentColor.value).map(color => getGoldenColor(color)) }
      ]
    })

    return {
      config,
      palettes,
      vuetifyColors,
      vuetifyColorsKeys
    }
  }
}
</script>

<style lang="css">
#color {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  padding: 1rem;
  max-height: 100vh;
  overflow-y: auto;
  background: #282A36;
}

.palette-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  width: 100%;
  text-align: center;
  color: #F8F8F2;
}

.palette-colors {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
}

.palette-color {
  width: 3rem;
  height: 3rem;
  margin: 0.5rem;
  border-radius: 50%;
}
</style>

<template lang="html">
  <div>
    <svg :style="`width:${size.width}px;height:${size.height}px;`">
      <path v-tooltip="c.tooltip" v-for="(c, i) in coords" :key="i" :d="`M${c.x1} ${c.y1} L${c.x2} ${c.y2} L${c.x3} ${c.y3} L${c.x4} ${c.y4} Z`" :fill="colors[i % colors.length]" stroke="white" stroke-width="2">
        <!--<md-tooltip v-if="valProperty === 'count'" md-direction="top">{{ Math.round(100 * vals[i] / response[valKey]) }}% - {{ values[i] ? (values[i].label || values[i].key) : 'Autres' }}</md-tooltip>-->
      </path>
    </svg>
  </div>
</template>

<script>
import {mapState, mapGetters} from 'vuex'

export default {
  props: ['result', 'size'],
  computed: {
    ...mapState(['colors']),
    ...mapGetters(['metricLabel']),
    ...mapState('data-fair', ['appConfig']),
    coords() {
      if (!this.result) return []
      const valKey = this.appConfig.metricType === 'count' ? 'total' : 'metric'
      const max = this.result.aggs.reduce((a, b) => b[valKey] > a ? b[valKey] : a, 0)
      const interval = this.size.width / (this.result.aggs.length + 1)
      return this.result.aggs.map((agg, i) => {
        const x = (i + 0.65) * interval
        const xRight = x + (interval * 0.7)
        const coord = { x1: x, y1: this.size.height, x2: x, y2: this.size.height - (this.size.height * agg[valKey] / max), x3: xRight, x4: xRight }
        coord.y3 = coord.y2
        coord.y4 = coord.y1
        coord.tooltip = {
          placement: 'auto',
          html: true,
          content: `<span>Valeur : ${agg.value}</span><br><span>Nombre de documents : ${agg.total}</span>`,
          classes: 'v-tooltip__content'
        }
        if (this.appConfig.metricType !== 'count') {
          coord.tooltip.content += `<br><span>${this.metricLabel} : ${agg.metric}</span>`
        }
        return coord
      })
    }
  }
}
</script>

<style lang="css">
</style>

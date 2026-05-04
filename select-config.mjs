#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const configsDir = './dev-configs'
const targetFile = './.dev-config.json'

const args = process.argv.slice(2)

if (args.length === 0) {
  const files = fs.readdirSync(configsDir).filter(f => f.endsWith('.json')).sort()
  console.log('Configs disponibles :')
  files.forEach(f => {
    const num = f.split('-')[0]
    const name = f.replace('.json', '')
    console.log(`  ${num.padStart(2, '0')}. ${name}`)
  })
  console.log('\nUsage: node select-config.mjs <numero-ou-nom>')
  console.log('Exemples:')
  console.log('  node select-config.mjs 01')
  console.log('  node select-config.mjs 01-line-rowsBased')
  process.exit(0)
}

let sourceName = args[0]

// Si c'est juste un numéro, trouver le fichier correspondant
if (/^\d+$/.test(sourceName)) {
  const files = fs.readdirSync(configsDir).filter(f => f.endsWith('.json')).sort()
  const matched = files.find(f => f.startsWith(sourceName.padStart(2, '0') + '-'))
  if (!matched) {
    console.error(`Aucune config ne commence par ${sourceName}`)
    process.exit(1)
  }
  sourceName = matched
} else if (!sourceName.endsWith('.json')) {
  sourceName = sourceName + '.json'
}

const sourcePath = path.join(configsDir, sourceName)

if (!fs.existsSync(sourcePath)) {
  console.error(`Config non trouvée : ${sourcePath}`)
  process.exit(1)
}

fs.copyFileSync(sourcePath, targetFile)
console.log(`Config appliquée : ${sourceName} -> ${targetFile}`)
console.log('Rechargez la page du navigateur pour voir le changement.')

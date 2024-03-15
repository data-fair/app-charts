const fs = require('fs')
const path = require('path')

const schemaFilePath = path.join(__dirname, 'public/config-schema.json')

fs.readFile(schemaFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the schema file:', err)
    return
  }
  const schema = JSON.parse(data)
  const unwantedTitles = ['Palette divergente', 'Palette séquentielle', 'Couleur et image spécifiques']
  const colorschemeDefinition = schema.allOf.find(element => element.properties && element.properties.colorscheme)
  if (colorschemeDefinition && colorschemeDefinition.properties.colorscheme.oneOf) {
    colorschemeDefinition.properties.colorscheme.oneOf = colorschemeDefinition.properties.colorscheme.oneOf.filter(option => !unwantedTitles.includes(option.title))
    colorschemeDefinition.properties.colorscheme.description = "**Qualitative** : pour représenter des données catégorielles ou nominales.\n\n**Thème global** : utilise les couleurs principales de l'interface, peut être étendu en une palette pour plus de variété\n\n**Palette personnalisée** : choisissez vos propres couleurs"
  } else {
    console.error('Could not find the colorscheme definition within the schema.')
  }
  const modifiedSchemaString = JSON.stringify(schema, null, 2)
  fs.writeFile(schemaFilePath, modifiedSchemaString, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Error writing the modified schema file:', writeErr)
    }
  })
})

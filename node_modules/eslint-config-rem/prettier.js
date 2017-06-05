const path = require('path')

module.exports = {
  plugins: ['prettier'],
  extends: [path.join(__dirname, 'index.js'), 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false
      }
    ]
  }
}

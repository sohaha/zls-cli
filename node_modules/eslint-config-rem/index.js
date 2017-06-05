module.exports = {
  rules: {
    // indent with 2 space
    indent: [2, 2, { SwitchCase: 1 }],
    // disable semi
    semi: [2, 'never'],
    'capitalized-comments': 0,
    'object-curly-spacing': ['error', 'always'],
    // to allow: if (false) return
    curly: ['error', 'multi-line'],
    // to allow something like: fn && fn()
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true
      }
    ]
  }
}

module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  rules: {
    'no-console': 'on',
    'no-debugger': 'on',
    'no-undef': 'warning',
    'no-new': 'warning'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}

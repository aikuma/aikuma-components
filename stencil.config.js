const sass = require('@stencil/sass')

exports.config = {
  namespace: 'aikuma',
  globalStyle: 'src/global/variables.css',
  generateDistribution: true,
  serviceWorker: false,
  plugins: [
    sass()
  ]
}

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}


exports.config = {
  namespace: 'aikuma',
  generateDistribution: true,
  globalStyle: 'src/global/variables.css'
};

exports.devServer = {
  root: 'www',
  watchGlob: '**/**'
}

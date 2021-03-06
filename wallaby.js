module.exports = (wallaby) => {
  return {
    files: [
      'package.json',
      {pattern: 'src/**/*.js', load: true},
      {pattern: 'test/fixtures/**/*', load: true}
    ],
    tests: [
      // {pattern: 'test/**/*.js', load: true}
      {pattern: 'test/rewrite/compounds.js', load: true}
    ],
    env: {
      type: 'node',
      params: {
        env: 'NODE_IDS=1'
      }
    },

    testFramework: 'mocha',

    compilers: {
      '**/*.js': wallaby.compilers.babel()
    }
  }
}

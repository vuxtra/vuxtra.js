const path = require('path')

module.exports = function vuxtra (moduleOptions) {
    this.addPlugin({
        src: path.resolve(__dirname,  'plugin.js'),
        options: moduleOptions
    })
}
/**
 * Vuxtra.js
 * (c) 2017-Present Faruk Brbovic
 * http://www.vuxtra.com
 *
 * MIT License
 */

// Node Source Map Support
// https://github.com/evanw/node-source-map-support
require('source-map-support').install()

// Fix babel flag
/* istanbul ignore else */
process.noDeprecation = true

module.exports = require('./dist/vuxtra')
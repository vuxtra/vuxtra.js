const { Nuxt, Builder, Options } = require('nuxt')
import Debug from 'debug'
import { join, resolve } from 'path'

const debug = Debug('vuxtra:')
debug.color = 5

export default class Vuxtra {
    constructor (_options = {}) {

        this.options = Options.from(_options)

        this.initialized = false

    }

    startDev(port = 3000, host = 'localhost') {

    }

    startProd(port = 3000, host = 'localhost') {

    }

    resolvePath (path) {
        // Shorthand to resolve from project dirs
        if (path.indexOf('@@') === 0 || path.indexOf('~~') === 0) {
            return join(this.options.rootDir, path.substr(2))
        } else if (path.indexOf('@') === 0 || path.indexOf('~') === 0) {
            return join(this.options.srcDir, path.substr(1))
        }
        return resolve(this.options.srcDir, path)
    }

}
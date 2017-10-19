import express from 'express'
import serveStatic from 'serve-static'
import path from 'path'
import morgan from 'morgan'
import healthChecker from 'sc-framework-health-check'
import Debug from 'debug'
import { Nuxt, Builder } from 'nuxt'
import VuxtraServer from './../vuxtraserver/vuxtraServer'

const debug = Debug('scc-worker:')
debug.color = 5


module.exports.run = function (worker) {
    debug('   >> Worker PID:', process.pid)
    var environment = worker.options.environment

    var app = express()

    var httpServer = worker.httpServer
    var scServer = worker.scServer

    if (environment == 'dev') {
        // Log every HTTP request. See https://github.com/expressjs/morgan for other
        // available formats.
        app.use(morgan('dev'))
    }

    // Import and Set Nuxt.js options
    let config = worker.options.__full_deep_temp_options

    // main vuxtra module
    config.nuxt.modules = [
        {
            src:  path.resolve(__dirname, '../lib/nuxt/modules/vuxtra/index'),
            options: config
        }
    ]

    // Init Nuxt.js
    const nuxt = new Nuxt(config.nuxt)

    // Build only in dev mode
    if (config.nuxt.dev) {
        console.log('...building')
        const builder = new Builder(nuxt)
        builder.build()
    }

    //app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Give nuxt middleware to express
    app.use(nuxt.render)

    // Add GET /health-check express route
    healthChecker.attach(worker, app)
    httpServer.on('request', app)

    var count = 0

    let vuxtraServer = new VuxtraServer(config)

    // lets register current socket with vuxtraServer
    vuxtraServer.registerSocketServer(scServer)
    // lets run it
    vuxtraServer.run()


}

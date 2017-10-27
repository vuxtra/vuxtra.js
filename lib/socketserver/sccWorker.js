import express from 'express'
import path from 'path'
import morgan from 'morgan'
import healthChecker from 'sc-framework-health-check'
import Debug from 'debug'
import { Nuxt, Builder as NuxtBuilder} from 'nuxt'
import VuxtraServer from './../vuxtraserver/vuxtraServer'
import VuxtraBuilder from './../builder'
import _ from 'lodash'

const debug = Debug('scc-worker:')
debug.color = 5


module.exports.run = function (worker) {
    debug('   >> Worker PID:', process.pid)
    var environment = worker.options.environment

    var app = express()

    var httpServer = worker.httpServer
    var scServer = worker.scServer

    process.on('unhandledRejection', (reason, p) => {
        //console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        worker.sendToMaster({type: 'error', subtype: 'worker', e:p, message: reason})
    });

    if (environment == 'dev') {
        // Log every HTTP request. See https://github.com/expressjs/morgan for other
        // available formats.
        app.use(morgan('dev'))
    }

    // Import and Set vuxtra and nuxt options
    let config = worker.options.__full_deep_temp_options

    if (!_.isArray(config.nuxt.modules)) {
        config.nuxt.modules = []
    }

    // main vuxtra module
    config.nuxt.modules.push(
        {
            src:  path.resolve(__dirname, '../lib/nuxt/modules/vuxtra/index'),
            options: config
        })

    if (!_.isArray(config.nuxt.build)) {
        config.nuxt.build = []

        if (!_.isArray(config.nuxt.build.templates)) {
            config.nuxt.build.templates = []
        }
    }

    config.nuxt.build.templates.push('./.vuxtra/clientVuxtra.js')

    // Init Nuxt.js
    const nuxt = new Nuxt(config.nuxt)

    // Build only in dev mode
    if (config.vuxtra.dev) {
            const vuxtraBuilder = new VuxtraBuilder(config.vuxtra)
            vuxtraBuilder.build().then(() => {
                worker.sendToMaster({type: 'event', subtype: 'vuxtraBuilt', message: 'Vuxtra has been built'})
                vuxtraBuilder.watchDev()
                // Build only in dev mode
                if (config.nuxt.dev) {
                    const nuxtBuilder = new NuxtBuilder(nuxt)
                    nuxtBuilder.build()
                }
            }).catch((e) => {
                worker.sendToMaster({type: 'error', subtype: 'builders', 'e':e, message: e.message})
            })

    }


    //app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Give nuxt middleware to express
    app.use(nuxt.render)

    // Add GET /health-check express route
    healthChecker.attach(worker, app)
    httpServer.on('request', app)

    var count = 0

    let vuxtraServer = new VuxtraServer(config.vuxtra)

    // lets register current socket with vuxtraServer
    vuxtraServer.registerSocketServer(scServer)
    // lets run it
    vuxtraServer.run()


}

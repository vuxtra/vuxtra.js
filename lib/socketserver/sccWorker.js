import express from 'express'
import serveStatic from 'serve-static'
import path from 'path'
import morgan from 'morgan'
import healthChecker from 'sc-framework-health-check'
import Debug from 'debug'
import { Nuxt, Builder } from 'nuxt'

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

    // Init Nuxt.js
    const nuxt = new Nuxt(config)

    // register core modules
    nuxt.moduleContainer.addModule({
        src: __dirname + '/nuxt/modules/vuxtra/index',
        options: config
    })


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

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function (socket) {

        console.log('-CONNECTION-')

        // Some sample logic to show how to handle client events,
        // replace this with your own logic

        socket.on('sampleClientEvent', function (data) {
            count++
            console.log('Handled sampleClientEvent', data)
            scServer.exchange.publish('sample', count)
        })

        var interval = setInterval(function () {
            socket.emit('rand', {
                rand: Math.floor(Math.random() * 5)
            })
        }, 1000)

        socket.on('disconnect', function () {
            clearInterval(interval)
        })
    })
}

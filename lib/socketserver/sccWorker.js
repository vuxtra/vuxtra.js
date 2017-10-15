const koa = require('koa')
const serveStatic = require('serve-static');
const path = require('path');
const morgan = require('morgan');
const koaRouter = require('koa-router');
const Debug = require('debug')
const healthcheck = require('./healthcheck');

const debug = Debug('scc-worker:')
debug.color = 5

module.exports.run = function (worker) {
    debug('   >> Worker PID:', process.pid)
    var environment = worker.options.environment

    var app = new koa()
    const router = new koaRouter();

    var httpServer = worker.httpServer
    var scServer = worker.scServer

    if (environment == 'dev') {
        // Log every HTTP request. See https://github.com/expressjs/morgan for other
        // available formats.
        app.use(morgan('dev'))
    }
    app.use(serveStatic(path.resolve(__dirname, 'public')))

    // Add middleware
    app
        .use(router.routes())
        .use(router.allowedMethods());

    // Add GET /health-check koa route
    healthcheck.attach(worker, router);

    httpServer.on('request', app.callback())

    var count = 0

    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function (socket) {

        // Some sample logic to show how to handle client events,
        // replace this with your own logic

        socket.on('sampleClientEvent', function (data) {
            count++
            debug('Handled sampleClientEvent', data)
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

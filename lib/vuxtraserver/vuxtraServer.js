import Tapable from 'tapable'
import AsyncParallelHook from 'tapable/lib/AsyncParallelHook'
import _ from 'lodash'

export default class VuxtraServer extends Tapable {
    constructor (options) {
        super()
        // setup available hooks
        this.hooks = {
            init: new AsyncParallelHook(["vuxtraServer"]),
            ready: new AsyncParallelHook(["vuxtraServer"]),
            socketConnection: new AsyncParallelHook(["socket"])
        };
        this.options = options
        this.socketServer = null

    }

    registerSocketServer(socketServer) {
        // lets make sure proper interface is followed

        if (!_.hasIn(socketServer, [
                'exchange',
                'on'
        ])) {
            throw Error('Not a valid socket server, make sure your object declares proper interface')
        }
        this.socketServer = socketServer
    }

    run() {
        this.hooks.init.promise(this);
        if (this.socketServer === null) {
            throw Error('SocketServer should be setup and registered first with registerSocketServer')
        }

        this.socketServer.on('connection',  (socket) => {

            this.hooks.socketConnection.promise(socket);

            this.processServiceRequest(socket)

            var interval = setInterval(function () {
                socket.emit('rand', {
                    rand: Math.floor(Math.random() * 5)
                })
            }, 1000)

            socket.on('disconnect', function () {
                clearInterval(interval)
            })
        })

        this.hooks.ready.promise(this);
    }

    processServiceRequest(socket) {
        // process service calls
        socket.on('service.call', function (data, res) {

        })
    }
}
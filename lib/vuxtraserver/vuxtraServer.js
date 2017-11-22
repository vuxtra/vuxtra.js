import Tapable from 'tapable'
import AsyncParallelHook from 'tapable/lib/AsyncParallelHook'
import _ from 'lodash'
import ServiceController from "./controllers/serviceController";
import Session from "./context/session";

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
        this.serviceController = null

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

            this.processServiceRequest(socket, new Session(socket))

            socket.on('disconnect', function () {
                // TO DO : do some graceful closing here
            })
        })

        this.hooks.ready.promise(this);
    }

    processServiceRequest(socket, session) {
        // set initial socket server auth token, we use it for session tracking
        socket.setAuthToken(session.authToken)

        // process service calls
        socket.on('service.call', (data, res) => {
            if (this.serviceController === null) {
                this.serviceController = new ServiceController(this.options, session)
            }
            let currentAuthTokenVersion = session.authToken.v
            this.serviceController.process(data, res)
            if (currentAuthTokenVersion !== session.authToken.v) {
                // we record any changes to the authtoken during controller processing
                socket.setAuthToken(session.authToken)
            }

        })
    }
}
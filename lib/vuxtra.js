import Debug from 'debug'
import fs from 'fs'
import _ from 'lodash'
import scErrors from 'sc-errors'
const TimeoutError = scErrors.TimeoutError

import { SocketCluster } from 'socketcluster'

const debug = Debug('vuxtra:')
debug.color = 5

// SOCKET SERVER DEFAULT OPTIONS PROCESSING
let defaultOptions = {
    'nuxt': {},
    'socketcluster': {
        workers: Number(process.env.SOCKETCLUSTER_WORKERS) || 1,
        brokers: Number(process.env.SOCKETCLUSTER_BROKERS) || 1,
        port:  Number(process.env.SOCKETCLUSTER_PORT) || 3000,
        // If your system doesn't support 'uws', you can switch to 'ws' (which is slower but works on older systems).
        wsEngine: process.env.SOCKETCLUSTER_WS_ENGINE || 'uws',
        appName: process.env.SOCKETCLUSTER_APP_NAME || null,
        workerController: __dirname + '/sccWorker.js',
        brokerController: __dirname + '/sccBroker.js',
        initController: process.env.SOCKETCLUSTER_INIT_CONTROLLER || null,
        workerClusterController: process.env.SOCKETCLUSTER_WORKERCLUSTER_CONTROLLER || null,
        socketChannelLimit: Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000,
        clusterStateServerHost: process.env.SCC_STATE_SERVER_HOST || null,
        clusterStateServerPort: process.env.SCC_STATE_SERVER_PORT || null,
        clusterAuthKey: process.env.SCC_AUTH_KEY || null,
        clusterInstanceIp: process.env.SCC_INSTANCE_IP || null,
        clusterInstanceIpFamily: process.env.SCC_INSTANCE_IP_FAMILY || null,
        clusterStateServerConnectTimeout: Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null,
        clusterStateServerAckTimeout: Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null,
        clusterStateServerReconnectRandomness: Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null,
        crashWorkerOnError: false,
        // If using nodemon, set this to true, and make sure that environment is 'dev'.
        killMasterOnSignal: false,
        environment: process.env.ENV || 'dev'
    },
    'extra': {

    }
}

var SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT = Number(process.env.SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) || 10000
var SOCKETCLUSTER_OPTIONS

if (process.env.SOCKETCLUSTER_OPTIONS) {
    SOCKETCLUSTER_OPTIONS = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS)
}

for (var i in SOCKETCLUSTER_OPTIONS) {
    if (SOCKETCLUSTER_OPTIONS.hasOwnProperty(i)) {
        defaultOptions.socketcluster[i] = SOCKETCLUSTER_OPTIONS[i]
    }
}

export const defaults = defaultOptions

export default class Vuxtra {
    constructor (_options = {}) {

        this.options = _options

        // Apply defaults
        _.defaultsDeep(this.options, defaultOptions)
    }

    startDev (port = 3000, host = 'localhost') {
        // socketcluster dev setup
        this.options.socketcluster.environment = 'dev'

        if (typeof this.options.nuxt.rootDir !== 'string') {
            this.options.nuxt.rootDir = this.options.rootDir
        }

        // Force development mode for add hot reloading and watching changes
        this.options.nuxt.dev = true

        // Nuxt Mode
        this.options.nuxt.mode = 'universal'

        this.startSocketCluster(port, host)
    }

    startProd (port = 3000, host = 'localhost') {

    }

    startSocketCluster (port = 3000, host= 'localhost') {

        debug(`Starting: SOCKETCLUSTER on ${host}:${port}`)
        var optionsControllerPath = process.env.SOCKETCLUSTER_OPTIONS_CONTROLLER
        var masterControllerPath =  __dirname + '/sccMaster.js'
        var workerControllerPath =  __dirname + '/sccWorker.js';
        var brokerControllerPath =  __dirname + '/sccBroker.js';
        var initControllerPath = process.env.SOCKETCLUSTER_INIT_CONTROLLER;
        var workerClusterControllerPath = process.env.SOCKETCLUSTER_WORKERCLUSTER_CONTROLLER;

        // kind of hackish way - attcah full config to options to be passed to worker
        this.options.socketcluster.__full_deep_temp_options =  _.cloneDeep(this.options)

        var fileExists = function (filePath, callback) {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                callback(!err)
            })
        }

        var runMasterController = function (socketCluster, filePath) {
            var masterController = require(filePath)
            masterController.run(socketCluster)
        }

        var launch = function (startOptions) {
            var socketCluster = new SocketCluster(startOptions)
            var masterController

            if (masterControllerPath) {
                runMasterController(socketCluster, masterControllerPath)
            } else {
                var defaultMasterControllerPath =  './sccMaster.js'
                fileExists(defaultMasterControllerPath, (exists) => {
                    if (exists) {
                        runMasterController(socketCluster, defaultMasterControllerPath)
                    }
                })
            }
        }

        var start =  () => {
            if (optionsControllerPath) {
                var optionsController = require(optionsControllerPath)
                optionsController.run(this.options.socketcluster, launch)
            } else {
                launch(this.options.socketcluster)
            }
        }

        var bootCheckInterval = Number(process.env.SOCKETCLUSTER_BOOT_CHECK_INTERVAL) || 200
        var bootStartTime = Date.now()

// Detect when Docker volumes are ready.
        var startWhenFileIsReady = (filePath) => {
            return new Promise((resolve, reject) => {
                if (!filePath) {
                    resolve()
                    return
                }
                var checkIsReady = () => {
                    var now = Date.now()

                    fileExists(filePath, (exists) => {
                        if (exists) {
                            resolve()
                        } else {
                            if (now - bootStartTime >= SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) {
                                var errorMessage = `Could not locate a controller file at path ${filePath} ` +
                                    `before SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT`
                                var volumeBootTimeoutError = new TimeoutError(errorMessage)
                                reject(volumeBootTimeoutError)
                            } else {
                                setTimeout(checkIsReady, bootCheckInterval)
                            }
                        }
                    })
                }
                checkIsReady()
            })
        }

        var filesReadyPromises = [
            startWhenFileIsReady(optionsControllerPath),
            startWhenFileIsReady(masterControllerPath),
            startWhenFileIsReady(workerControllerPath),
            startWhenFileIsReady(brokerControllerPath),
            startWhenFileIsReady(initControllerPath),
            startWhenFileIsReady(workerClusterControllerPath)
        ]
        Promise.all(filesReadyPromises)
            .then(() => {
                start()
            })
            .catch((err) => {
                console.error(err.stack)
                process.exit(1)
            })


    }

}
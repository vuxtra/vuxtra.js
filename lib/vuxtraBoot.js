import Debug from 'debug'
import fs from 'fs'
import _ from 'lodash'
import scErrors from 'sc-errors'
import { SocketCluster } from 'socketcluster'
import options from './common/options';

const TimeoutError = scErrors.TimeoutError
const debug = Debug('vuxtraBoot:')
debug.color = 5

// SOCKET SERVER DEFAULT OPTIONS PROCESSING


var SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT = Number(process.env.SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) || 10000

export default class VuxtraBoot {
    constructor (_options = {}) {

        // Apply defaults
        this.options = options.from(_options)
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
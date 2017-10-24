import socketclusterClient from 'socketcluster-client'
import ServiceRequest from './../../../core/serviceRequest'
import ServiceResponse from './../../../core/serviceResponse'
import _ from 'lodash'

let privateData = new WeakMap();

var $_internal

export default class VuxtraController {
    constructor (options) {
        this.socketclusterClient = socketclusterClient
        this._internalRequestCounter = 1
        this._internalSocketConnected = false
        privateData.set(this, { options: options })
        // privateData.get(this).options;
        this.socket = this.socketclusterClient.connect({
            port: options.port || 80,
            hostname: options.hostname || 'localhost'
        })
        this.socket.on('connect', function () {
            this._internalSocketConnected = true
        });

        var $_internalService = ( callArguments, options, action ) => {
            return new Promise((resolve, reject)  => {
                this.doBindOrExecute(() => {
                    let request = new ServiceRequest()
                    request.setServiceName(options)
                        .setServiceAction(action)
                        .setData(callArguments)
                        .setId(this.socket.id + this._internalRequestCounter)
                    this._internalRequestCounter++
                    this.socket.emit('service.call', request, function (err, res) {
                        if (err) {
                            reject(err)
                        } else {
                            let response = new ServiceResponse(res)
                            resolve(response)
                        }
                    })

                })
            })
        }

        this.services = require('~/.nuxt/clientVuxtra.js').services($_internalService, this)

    }

    doBindOrExecute(func) {
        if(this._internalSocketConnected !== true) {
            this.socket.on('connect', function () {
                func();
            });
        }
        else {
            func();
        }
    }

    /**
     * Makes a realtime service call to the backend via socket
     *
     * @param requestFunc callback function / closure which gets ServiceRequest Object as it's first parameter (serviceRequest) => { serviceRequest.setData('hello') }
     * @param data  payload to be passed to service method
     * @returns {Promise}
     */
    async call (requestFunc) {


        if (!_.isFunction(requestFunc)) {
            throw Error('requestFunc [ first param ] must of function tyupe')
        }
        let request = new ServiceRequest()
        requestFunc(request)
        return new Promise((resolve, reject)  => {
            this.socket.emit('service.call', request, function (err, res) {
                if (err) {
                    reject(err)
                } else {
                    let response = new ServiceResponse(res)
                    resolve(response)
                }
            })
        })
    }
}
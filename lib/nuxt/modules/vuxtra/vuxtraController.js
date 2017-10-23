import socketclusterClient from 'socketcluster-client'
import ServiceRequest from './../../../core/serviceRequest'
import ServiceResponse from './../../../core/serviceResponse'
import _ from 'lodash'

let privateData = new WeakMap();

var $_internal

export default class VuxtraController {
    constructor (options) {
        this.socketclusterClient = socketclusterClient
        privateData.set(this, { options: options })
        // privateData.get(this).options;
        this.socket = this.socketclusterClient.connect({
            port: options.port || 80,
            hostname: options.hostname || 'localhost'
        })
        this.socket.on('connect', function () {
            console.log('CONNECTED');
        });
        $_internal = ( tt ) => {
            console.log('ttest', tt)
        }
        this._vuxtraClientProxyObjects = require('~/.nuxt/clientVuxtra.js').default($_internal)

        this.services = this._vuxtraClientProxyObjects.services

    }

    /**
     * Makes a realtime service call to the backend via socket
     *
     * @param requestFunc callback function / closure which gets ServiceRequest Object as it's first parameter (serviceRequest) => { serviceRequest.setData('hello') }
     * @param data  payload to be passed to service method
     * @returns {Promise}
     */
    async call (requestFunc) {


        // if (!_.isFunction(requestFunc)) {
        //     throw Error('requestFunc [ first param ] must of function tyupe')
        // }
        // let request = new ServiceRequest()
        // requestFunc(request)
        // return new Promise((resolve, reject)  => {
        //     this.socket.emit('service.call', request, function (err, res) {
        //         if (err) {
        //             reject(err)
        //         } else {
        //             let response = new ServiceResponse(res)
        //             resolve(response)
        //         }
        //     })
        // })
    }
}
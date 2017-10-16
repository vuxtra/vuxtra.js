import socketclusterClient from 'socketcluster-client'

let privateData = new WeakMap();

export default class VuxtraController {
    constructor (options) {
        this.socketclusterClient = socketclusterClient
        privateData.set(this, { options: options })
        // privateData.get(this).options;
        this.socket = this.socketclusterClient.connect({
            port: options.port || 80,
        })
    }

    /**
     * Makes a realtime service call to the backend via socket
     *
     * @param serviceMethod '[service].[method]'  where [service] is name of the service and [method] name of the method to execute
     * @param data  payload to be passed to service method
     * @returns {Promise}
     */
    async call (serviceMethod, data) {
        let payload = {
            'sm': serviceMethod,
            'dt': data
        }
        return new Promise((resolve, reject)  => {
            this.socket.emit('service.call', payload, function (err, response) {
                if (err) {
                    reject(err)
                } else {
                    resolve(response)
                }
            })
        })
    }
}
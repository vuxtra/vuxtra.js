import Response from "./response";

export default class ServiceResponse extends Response {
    constructor (rawRequest = {}) {
        super(rawRequest)
        this.setType('service')
    }

    setServiceName(serviceName) {
        this.setMeta('serName', serviceName)
        return this
    }

    setServiceAction(serviceAction) {
        this.setMeta('serAction', serviceAction)
        return this
    }

    getServiceName() {
        return this.getMeta('serName')
    }


    getServiceAction() {
        return this.getMeta('serAction')
    }


}
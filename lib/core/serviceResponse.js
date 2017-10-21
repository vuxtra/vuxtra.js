import Response from "./response";

export default class ServiceResponse extends Response {
    constructor (rawRequest = {}) {
        super(rawRequest)
        this.setType('service')
    }

    setServiceName(serviceName) {
        this.setMeta('serName', serviceName)
    }

    getServiceName() {
        return this.getMeta('serName')
    }
}
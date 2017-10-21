import Request from "./request";

export default class ServiceRequest extends Request {
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
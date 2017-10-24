import Request from "./request";

export default class ServiceRequest extends Request {
    constructor (rawRequest = null) {
        super(rawRequest)
        // if blank than we set the service
        if (rawRequest === null) {
            this.setType('service')
        }
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
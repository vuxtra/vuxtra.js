import Controller from './controller'
import ServiceRequest from './../../core/serviceRequest'
import ServiceResponse from './../../core/ServiceResponse'
import { join, resolve, basename, dirname } from 'path'

export default class ServiceController extends Controller {
    constructor (_options) {
        super(_options)
    }

    process (data, res) {
        let request = new ServiceRequest(data)

        let response = new ServiceResponse()

        let type = request.getType()

        if (type === null || type !== 'service' || request.getServiceName() === null) {
            response.ssClientErrorInvalidRequest()
            res(null, response)
            return
        }

        let serviceName = dirname(request.getServiceName())
        let actionName = basename(request.getServiceName())

        let absoluteServicePath =  join(this.options.buildDir, 'server', type, serviceName, '.js')
        try {
            let service = require(absoluteServicePath)
        } catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') {
                response.ssClientErrorNotFound(`service name ${serviceName} not found`)
                res(null, response)
                return
            }
            response.ssServerError(e.message)
            res(null, response)
            return
        }

        if (typeof service[actionName] === 'undefined' || service[actionName] === null) {
            response.ssClientErrorNotFound(`service ${serviceName} does not contain action ${actionName}`)
            res(null, response)
            return
        }

        // here we process it weather is sync or async
        Promise.resolve(service[actionName](request, response)).then(result => {
            res(null, response)
        });

    }

}
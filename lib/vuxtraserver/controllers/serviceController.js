import Controller from './controller'
import { ServiceRequest } from '@vuxtra/shared-core'
import { ServiceResponse } from '@vuxtra/shared-core'
import { join, resolve, basename, dirname } from 'path'
import _ from 'lodash'

export default class ServiceController extends Controller {
    constructor (_options) {
        super(_options)
    }

    process (data, res) {
        let request = new ServiceRequest(data)

        let response = new ServiceResponse()
        response.setId(request.getId())
        response.ssSuccess()
        response.setServiceName(request.getServiceName())
        response.setServiceAction(request.getServiceAction())

        let type = request.getType()

        if (type === null || type !== 'service' || request.getServiceName() === null) {
            response.ssClientErrorInvalidRequest()
            res(null, response)
            return
        }

        let absoluteServicePath =  join(this.options.buildDir, 'server', request.getServiceName() + '.js')

        try {
            let service = require(resolve(absoluteServicePath)).default

            if (typeof service[request.getServiceAction()] === 'undefined' || service[request.getServiceAction()] === null) {
                response.ssClientErrorNotFound(`service ${request.getServiceName()} does not contain action ${request.getServiceAction()}`)
                res(null, response)
                return
            }

            let ctx = {request, response}

            // here we process it weather is sync or async
            Promise.resolve(service[request.getServiceAction()].apply(ctx, _.values(request.getData()))).then(result => {
                response.setData(result)
                res(null, response)
            });

        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                response.ssClientErrorNotFound(`service name ${request.getServiceName()} not found`)
                res(null, response)
                return
            }
            response.ssServerError(e.message)
            res(null, response)
            return
        }
    }

}
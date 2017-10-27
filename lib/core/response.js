export default class Response {
    constructor (rawResponse = {}) {
        this._messageType = 'res'
        this.meta = (typeof rawResponse.meta !== 'undefined' && rawResponse.meta !== null ? rawResponse.meta : {})
        this.data = (typeof rawResponse.data !== 'undefined' ? rawResponse.data : null)
        this.id = (typeof rawResponse.id !== 'undefined' ? rawResponse.id : null)
        this.type = (typeof rawResponse.type !== 'undefined' ? rawResponse.type : 'generic')
        this.statusCode = (typeof rawResponse.statusCode !== 'undefined' ? rawResponse.statusCode : 200)
        this.statusMessage = (typeof rawResponse.statusMessage !== 'undefined' ? rawResponse.statusMessage : 'success')
    }

    // setters
    setData(data) {
        this.data = data
        return this
    }
    setMeta(key, val) {
        this.meta[key] = val
        return this
    }
    setId(id) {
        this.id = id
        return this
    }
    setType(type) {
        this.type = type
        return this
    }
    ss(code, message = null) {
        this.statusCode = code
        this.statusMessage = message
        return this
    }
    ssSuccess(msg = 'success') {
        this.statusCode = 200
        this.statusMessage = msg
        return this
    }
    ssClientError(msg = 'Client Error') {
        this.statusCode = 400
        this.statusMessage = msg
        return this
    }
    ssClientErrorNotFound(msg = 'Client Error: Not Found') {
        this.statusCode = 404
        this.statusMessage = msg
        return this
    }
    ssClientErrorInvalidRequest(msg = 'Client Error: Not Found') {
        this.statusCode = 404
        this.statusMessage = msg
        return this
    }
    ssServerError(msg = 'Server Error') {
        this.statusCode = 500
        this.statusMessage = msg
        return this
    }

    // getters
    getData() {
        return this.data
    }
    getMeta(key, defaultVal = null) {
        if (typeof this.meta[key] !== undefined) {
            return this.meta[key]
        }
        return defaultVal
    }
    getId(id) {
        return this.id
    }
    getType(type) {
        return this.type
    }
    getStatusCode() {
        return this.statusCode
    }
    getStatusMessage() {
        return this.statusMessage
    }

    // checkers
    isStatusSuccess() {
        if (this.statusCode >= 200 && this.statusCode <300) {
            return true;
        }
        return false
    }
    isStatusError() {
        if (this.statusCode >= 400 && this.statusCode <600) {
            return true;
        }
        return false
    }
}
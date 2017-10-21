export default class Response {
    constructor (rawResponse = {}) {
        this._messageType = 'res'
        this.meta = (rawResponse.meta !== 'undefined' && rawResponse.meta !== null ? rawResponse.meta : {})
        this.data = (rawResponse.data !== 'undefined' ? rawResponse.data : null)
        this.id = (rawResponse.id !== 'undefined' ? rawResponse.id : null)
        this.type = (rawResponse.type !== 'undefined' ? rawResponse.type : 'generic')
        this.statusCode = (rawResponse.statusCode !== 'undefined' ? rawResponse.statusCode : 200)
        this.statusMessage = (rawResponse.statusMessage !== 'undefined' ? rawResponse.statusMessage : 'success')
    }

    // setters
    setData(data) {
        this.data = data
    }
    setMeta(key, val) {
        this.meta[key] = val
    }
    setId(id) {
        this.id = id
    }
    setType(type) {
        this.type = type
    }
    setStatus(code,message = null) {
        this.statusCode = code
        this.statusMessage = message
    }
    setStatusSuccess(msg = 'success') {
        this.statusCode = 200
        this.statusMessage = msg
    }
    setStatusClientError(msg = 'Client Error') {
        this.statusCode = 400
        this.statusMessage = msg
    }
    setStatusServerError(msg = 'Server Error') {
        this.statusCode = 500
        this.statusMessage = msg
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
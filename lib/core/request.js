export default class Request {
    constructor (rawRequest = null) {
        this._messageType = 'req'
        if (rawRequest === null) {
            rawRequest = {}
        }
        this.meta   = (typeof rawRequest.meta !== 'undefined' && rawRequest.meta !== null ? rawRequest.meta : {})
        this.data   = (typeof rawRequest.data !== 'undefined' ? rawRequest.data : null)
        this.id     = (typeof rawRequest.id !== 'undefined' ? rawRequest.id : null)
        this.type   = (typeof rawRequest.type !== 'undefined' ? rawRequest.type : 'generic')
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
    // getters
    getData() {
        return this.data
    }
    getMeta(key, defaultVal = null) {
        if (typeof this.meta[key] !== 'undefined') {
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
}
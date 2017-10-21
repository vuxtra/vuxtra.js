export default class Request {
    constructor (rawRequest = {}) {
        this._messageType = 'req'
        this.meta = (rawRequest.meta !== 'undefined' && rawRequest.meta !== null ? rawRequest.meta : {})
        this.data = (rawRequest.data !== 'undefined' ? rawRequest.data : null)
        this.id = (rawRequest.id !== 'undefined' ? rawRequest.id : null)
        this.type = (rawRequest.type !== 'undefined' ? rawRequest.type : 'generic')
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
}
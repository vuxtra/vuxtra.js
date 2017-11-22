export default class AuthToken {
    constructor (rawToken = {}) {
        if (rawToken === null) {
            rawToken = {}
        }
        this.v = (typeof rawToken.v !== 'undefined' ? rawToken.v : 0)
        this.uid = (typeof rawToken.uid !== 'undefined' ? rawToken.uid : null)
        this.sid = (typeof rawToken.sid !== 'undefined' ? rawToken.sid : null)
        this.ct = (typeof rawToken.ct !== 'undefined' ? rawToken.ct : null)
    }

    // setters
    setUserId (data) {
        this.v++
        this.uid = data
        return this
    }

    setSessionId (data) {
        this.v++
        this.sid = data
        return this
    }

    setCreatedTime (data) {
        this.v++
        this.ct = data
        return this
    }

    // getters
    getUserId () {
        return  this.uid
    }

    getSessionId () {
        return this.sid
    }

    getCreatedTime () {
        return this.ct
    }

}
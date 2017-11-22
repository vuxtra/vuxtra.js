import AuthToken from './authToken'
import uuidv4  from 'uuid/v4'

export default class Session {
    constructor (socket, authToken = null) {
        this._socket = socket
        if (authToken === null) {
            this.authToken = new AuthToken(this._socket.getAuthToken())
            this.authToken.setSessionId(uuidv4())
        } else {
            this.authToken = authToken

        }
    }

    generateUUID () {
        return uuidv4()
    }

    authenticate (userUUID) {
        this.authToken.setUserId(userUUID)
        return this
    }

    isAuthenticated () {
        return this.authToken.getUserId() !== null
    }

    isSession () {
        return this.authToken.getSessionId() !== null
    }

    getSocket () {
        return this._socket
    }


}
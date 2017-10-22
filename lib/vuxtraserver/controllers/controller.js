import Tapable from 'tapable'

export default class Controller extends Tapable {
    constructor (_options, _socket) {
        super()
        this.options    = _options
        this.socket     = _socket
    }

 }
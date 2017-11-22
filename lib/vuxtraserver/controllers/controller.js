import Tapable from 'tapable'

export default class Controller extends Tapable {
    constructor (_options, _session) {
        super()
        this.options    = _options
        this.session     = _session
    }

 }
export default {
    /**
     *
     * @param {*} param0
     */
    returnParamsObject: function (param1, param2) {
        return {p1: param1, p2: param2}
        // return it to the front
    },

    returnString: function () {
        return 'string-returned'
    },

    returnInt: function () {
        return 55
    },

    returnServerError: function () {
        this.$response.ssServerError('test error')
        return false
    },

    returnClientErrorNotFound: function () {
        this.$response.ssClientErrorNotFound('client error occured')
        return null
    },

    returnUndefined: function () {
        return undefined
    }
}
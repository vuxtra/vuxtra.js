export default {
    /**
     *
     * @param {*} param0
     */

    login: function (username, password) {
        if (username === 'test_user' && password === 'test_pass') {
            this.$session.authenticate(this.$session.generateUUID())
        }
    },

    isAuthenticated: function () {
        return this.$session.isAuthenticated()
        // return if user authenticated or nor
    },

}
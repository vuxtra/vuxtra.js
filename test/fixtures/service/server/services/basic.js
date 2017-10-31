export default {
    /**
     *
     * @param {*} param0
     */
    testResponse (param1, param2) {
        console.log(param1, param2, this.request, this.response)
        return {p1: param1, p2: param2}
        // return it to the front
    }
}
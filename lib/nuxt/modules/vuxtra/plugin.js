import Vue from 'vue'
import VuxtraController from 'vuxtra/dist/nuxt/modules/vuxtra/vuxtraController.es'

const vuxtraPlugin = {
    install () {
        if (Vue.__nuxt_vuxtra_installed__) {
            return
        }
        Vue.__nuxt_vuxtra_installed__ = true

        if (!Vue.prototype.$vuxtra) {
            Vue.prototype.$vuxtra = new VuxtraController({
                port: parseInt(`<%= options.socketcluster.port %>`),
                hostname: `<%= options.socketcluster.hostname %>`,
                buildDir: `<%= options.vuxtra.buildDir %>`
            })
        }
    }

}

Vue.use(vuxtraPlugin)

export default (ctx) => {
    const { app, store } = ctx

    app.$vuxtra = Vue.prototype.$vuxtra
    ctx.$vuxtra = Vue.prototype.$vuxtra
    if (store) {
        store.$vuxtra = Vue.prototype.$vuxtra
    }
}
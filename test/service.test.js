import test from 'ava'
import { resolve } from 'path'
import _ from 'lodash'

const { VuxtraBoot } = require('../')
const VuxtraController = require('../dist/nuxt/modules/vuxtra/vuxtraController')

const port = 4007
const hostname = 'http://localhost:'
const url = (route) => hostname + ':' + port + route

let vuxtraBoot = null
let vuxtraController = null
let options = {
    port: port,
    hostname: hostname
}

// Init nuxt.js and create server listening on localhost:4000
test.before('Init Vuxtra', async t => {
    vuxtraBoot = new VuxtraBoot({
        rootDir: resolve(__dirname, 'fixtures', 'basic')
    })


    vuxtraBoot.startDev()

    await Promise.all([

        new Promise((resolve, reject) => {
            vuxtraBoot.hooks.vuxtraBuilt.tapPromise("vuxtraBuilt", (vuxtraBoot) => {
                resolve(vuxtraBoot)

            })

            vuxtraBoot.hooks.failSocketserver.tapPromise("failedSocketServer", (vuxtraBoot, e) => {
                reject(e)
            })
        }),
        new Promise((resolve, reject) => {
            vuxtraBoot.hooks.nuxtBuilt.tapPromise("nuxtBuilt", (vuxtraBoot) => {
                resolve(vuxtraBoot)

            })

            vuxtraBoot.hooks.failSocketserver.tapPromise("failedSocketServer", (vuxtraBoot, e) => {
                reject(e)
            })
        }),
        new Promise((resolve, reject) => {
            vuxtraBoot.hooks.nuxtBuilt.tapPromise("nuxtBuilt", (vuxtraBoot) => {
                resolve(vuxtraBoot)

            })

            vuxtraBoot.hooks.failSocketserver.tapPromise("failedSocketServer", (vuxtraBoot, e) => {
                reject(e)
            })
        })

    ])

    vuxtraController = new VuxtraController(options)

})

test('services.basic.testResponse', async t => {
    console.log(vuxtraController)
})


test.after('Closing server', t => {
    // vuxtraBoot.close()
})
import test from 'ava'
import { resolve } from 'path'
import _ from 'lodash'

const { VuxtraBoot } = require('../')

let vuxtraBoot = null


test('VuxtraBoot Class', t => {
    t.is(typeof VuxtraBoot, 'function')
})

test.serial('VuxtraBoot Devstart', async t => {

    vuxtraBoot = new VuxtraBoot({
        rootDir: resolve(__dirname, 'fixtures', 'basic'),
        srcDir: resolve(__dirname, 'fixtures', 'basic'),
        nuxt: {
            modulesDir: resolve(__dirname, '../node_modules')
        }
    })
    t.is(typeof vuxtraBoot, 'object')

    t.is(vuxtraBoot.options.vuxtra.dev, true)


    vuxtraBoot.startDev()

    try {
        let promisaAll = await Promise.all([
            new Promise((resolve, reject) => {
                vuxtraBoot.hooks.readySocketserver.tapPromise("readySocketServer", (vuxtraBoot) => {
                    resolve(vuxtraBoot)
                })

                vuxtraBoot.hooks.failSocketserver.tapPromise("failedSocketServer", (vuxtraBoot, e) => {
                    reject(e)
                })
            }),
            new Promise((resolve, reject) => {
                vuxtraBoot.hooks.readySocketserverWorkerCluster.tapPromise("readySocketserverWorkerCluster", (vuxtraBoot) => {
                    resolve(vuxtraBoot)

                })

                vuxtraBoot.hooks.failSocketserver.tapPromise("failedSocketServer", (vuxtraBoot, e) => {
                    reject(e)

                })
            }),
            new Promise((resolve, reject) => {
                vuxtraBoot.hooks.vuxtraBuilt.tapPromise("vuxtraBuilt", (vuxtraBoot) => {
                    resolve(vuxtraBoot)

                })

                vuxtraBoot.hooks.failSocketserver.tapPromise("failedSocketServer", (vuxtraBoot, e) => {
                    reject(e)
                })
            }),
            new Promise((resolve, reject) => {
                vuxtraBoot.hooks.vuxtraStarted.tapPromise("vuxtraStarted", (vuxtraBoot) => {
                    resolve(vuxtraBoot)

                })

                vuxtraBoot.hooks.failSocketserver.tapPromise("failedSocketServer", (vuxtraBoot, e) => {
                    reject(e)
                })
            })

        ])

        t.pass('all services started and vuxtra built')
    } catch (e) {
        t.fail(e.message)
    }


})

test.after('Closing vuxtra', t => {
    //vuxtraBoot.close()
})

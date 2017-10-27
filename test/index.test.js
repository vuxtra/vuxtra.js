import test from 'ava'
import { resolve } from 'path'
import _ from 'lodash'

const { VuxtraBoot } = require('../')

test('VuxtraBoot Class', t => {
    t.is(typeof VuxtraBoot, 'function')
})

test.serial('VuxtraBoot Devstart', async t => {

    const vuxtraBoot = new VuxtraBoot({
        rootDir: resolve(__dirname, 'fixtures', 'basic')
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
            })

        ])

        t.pass('all services started and vuxtra built')
    } catch (e) {
        t.fail(e.message)
    }


})

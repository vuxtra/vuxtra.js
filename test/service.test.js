import moduleAlias from 'module-alias'

//
// Register alias
//
moduleAlias.addAlias('~', resolve(__dirname, 'fixtures', 'service'))

import test from 'ava'
import { resolve } from 'path'
import _ from 'lodash'

import { VuxtraBoot } from '../'
import VuxtraController from '@vuxtra/nuxt-client-module/dist/vuxtraController'

const port = 4007
const hostname = 'localhost'
const url = (route) => hostname + ':' + port + route

let vuxtraBoot = null
let vuxtraController = null
let options = {
    port: port,
    hostname: hostname,
    buildDir: resolve(__dirname, 'fixtures', 'service','.vuxtra')
}

test.before('Init Vuxtra', async t => {
    vuxtraBoot = new VuxtraBoot({
        rootDir: resolve(__dirname, 'fixtures', 'service'),
        srcDir: resolve(__dirname, 'fixtures', 'service'),
        nuxt: {
            modulesDir: resolve(__dirname, '../node_modules')
        }
    })

    vuxtraBoot.startDev(port)

    await Promise.all([
        new Promise((resolve, reject) => {
            vuxtraBoot.hooks.readySocketserver.tapPromise("readySocketServer", (vuxtraBoot) => {
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

    vuxtraController = new VuxtraController(options)

})

test('services.basic.returnParamsObject', async t => {
    let p1 = 'ptest1'
    let p2 = 'ptest2'
    let response = await vuxtraController.services.basic.returnParamsObject(p1, p2)
    if (response !== null && typeof response.p1 !== 'undefined' && response.p1 === p1 && response.p2 === p2 ) {
        t.pass('returnParamsObject params matched')
    }
    else {
        t.fail('returnParamsObject params not matched')
    }
})

test('services.basic.returnString', async t => {
    let match = 'string-returned'
    let response = await vuxtraController.services.basic.returnString()

    if (response !== null && response.valueOf() === match ) {
        t.pass('returnString response matched')
    }
    else {
        t.fail('returnString response not matched')
    }
})


test.after('Closing server', t => {
    vuxtraBoot.close()
})
import test from 'ava'
import { resolve } from 'path'
import _ from 'lodash'

const { VuxtraBoot } = require('../')

test('VuxtraBoot Class', t => {
    t.is(typeof VuxtraBoot, 'function')
})

test.serial('VuxtraBoot Devstart', async t => {

    const vuxtraBoot = new VuxtraBoot({
        rootDir: resolve(__dirname, 'fixtures', 'empty')
    })
    t.is(typeof vuxtraBoot, 'object')
    t.is(vuxtraBoot.options.vuxtra.dev, true)

    vuxtraBoot.startDev()

    let tt = await new Promise((resolve, reject) => {
        vuxtraBoot.hooks.readySocketserver.tapPromise("test devstart",(vuxtraBoot) => {

            resolve(vuxtraBoot)

        })

        vuxtraBoot.hooks.failSocketserver.tapPromise("test devstart",(vuxtraBoot) => {

            reject(vuxtraBoot)

        })
    });


})

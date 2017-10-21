import fs, { remove, readFile, writeFile, mkdirp, utimes, existsSync } from 'fs-extra'
import webpack from 'webpack'
import { join, resolve, basename, dirname } from 'path'
import { r } from 'nuxt/lib/common/utils'

import Debug from 'debug'

const debug = Debug('nuxt:build')
debug.color = 2 // Force green color

import vuxtraServerWebpackConfig from './webpack/vuxtraServer.config'

export default function vuxtraBuildPlugin (builder, rootConfig) {

    builder.plugin('compile', async ({compiler}) =>  {
        debug('...building vuxtraServer')

        // Check if server dir exists and warn if not
        if (!fs.existsSync(join(rootConfig.vuxtra.srcDir, 'server'))) {
            let dir = rootConfig.vuxtra.srcDir
            if (fs.existsSync(join(rootConfig.vuxtra.srcDir, '..', 'server'))) {
                throw new Error(`No \`server\` directory found in ${dir}. Did you mean to run \`vuxtra\` in the parent (\`../\`) directory?`)
            } else {
                throw new Error(`Couldn't find a \`server\` directory in ${dir}. Please create one under the project root`)
            }
        }

        debug(`App root: ${rootConfig.vuxtra.srcDir}`)
        debug(`Generating ${rootConfig.vuxtra.buildDir} files...`)

        // Create .vuxtra/, .vuxtra/services and other folders
        await remove(r(rootConfig.vuxtra.buildDir))
        await mkdirp(r(rootConfig.vuxtra.buildDir, 'server'))
        if (!rootConfig.vuxtra.dev) {
            await mkdirp(r(rootConfig.vuxtra.buildDir, 'dist'))
        }

        let webpackWrapper = {
            options: rootConfig.vuxtra
        }

        let compilersOption = vuxtraServerWebpackConfig.call(webpackWrapper)

        // Initialize compilers
        const vuxtraCompiler = webpack(compilersOption)
        compiler.compilers.push(vuxtraCompiler)
    })

}
import fs, { remove, readFile, writeFile, mkdirp, utimes, existsSync } from 'fs-extra'
import Tapable from 'tapable'
import chokidar from 'chokidar'
import AsyncParallelHook from 'tapable/lib/AsyncParallelHook'
import webpack from 'webpack'
import { join, resolve, basename, dirname } from 'path'
import { r, sequence } from 'nuxt/lib/common/utils'
// import MFS from 'memory-fs'
import { defaults, debounce } from 'lodash'

import Debug from 'debug'

const debug = Debug('vuxtra:build')
debug.color = 2 // Force green color

import vuxtraServerWebpackConfig from './webpack/vuxtraServer.config'

export default class VuxtraBuilder extends Tapable {
    constructor (_options) {
        super()

        // setup available hooks
        this.hooks = {
            init: new AsyncParallelHook(["builder"]),
            built: new AsyncParallelHook(["builder"]),
            compile: new AsyncParallelHook(["compiler"]),
            pluginDone: new AsyncParallelHook(["compiler"]),
            compileDone: new AsyncParallelHook(["compiler"])
        };

        this.options    = _options
        this.compiler   = null
    }

    async build() {
        debug('...building vuxtraServer')
        await this.hooks.init.promise(this)

        // Babel options
        this.babelOptions = defaults(this.options.build.babel, {
            babelrc: false,
            cacheDirectory: !!this.options.dev
        })
        if (!this.babelOptions.babelrc && !this.babelOptions.presets) {
            this.babelOptions.presets = [
                require.resolve('babel-preset-vue-app')
            ]
        }

        // Check if server dir exists and warn if not
        if (!fs.existsSync(join(this.options.srcDir, 'server'))) {
            let dir = this.options.srcDir
            if (fs.existsSync(join(this.options.srcDir, '..', 'server'))) {
                throw new Error(`No \`server\` directory found in ${dir}. Did you mean to run \`vuxtra\` in the parent (\`../\`) directory?`)
            } else {
                throw new Error(`Couldn't find a \`server\` directory in ${dir}. Please create one under the project root`)
            }
        }

        // lets setup a watcher
        // this.options.build.watch.push(join(this.options.srcDir, 'server/**/*.js'))

        debug(`App root: ${this.options.srcDir}`)
        debug(`Generating ${this.options.buildDir} files...`)

        await this.setupBuildDir()
        await this.buildWebpack()

        await this.hooks.built.promise(this);

    }

    async setupBuildDir() {
        // Create .vuxtra/, .vuxtra/services and other folders
        await remove(r(this.options.buildDir))
        await mkdirp(r(this.options.buildDir, 'server'))
        if (!this.options.dev) {
            await mkdirp(r(this.options.buildDir, 'dist'))
        }
    }

    async buildWebpack (resetFolders = false) {
        debug('Building files...')
        console.log('...compiling vuxtra files')
        const compilersOptions = []

        if (resetFolders) {
            await this.setupBuildDir()
        }

        // vuxtra default compiler
        const vuxtraCompilerConfig = vuxtraServerWebpackConfig.call(this)
        compilersOptions.push(vuxtraCompilerConfig)


        // Simulate webpack multi compiler interface
        // Separate compilers are simpler, safer and faster
        this.compiler = { compilers: [] }
        this.compiler.plugin = (...args) => {
            this.compiler.compilers.forEach(compiler => {
                compiler.plugin(...args)
            })
        }

        // Initialize shared FS and Cache
        // const sharedFS = this.options.dev && new MFS()
        const sharedFS = false // disable shared fs for now
        const sharedCache = {}

        // Initialize compilers
        compilersOptions.forEach(compilersOption => {
            const compiler = webpack(compilersOption)
            if (sharedFS && !compiler.name.includes('-dll')) {
                compiler.outputFileSystem = sharedFS
            }
            compiler.cache = sharedCache
            this.compiler.compilers.push(compiler)
        })

        // Access to compilers with name
        this.compiler.compilers.forEach(compiler => {
            if (compiler.name) {
                this.compiler[compiler.name] = compiler
            }
        })

        // Run after each compile
        this.compiler.plugin('done', async stats => {
            // Don't reload failed builds
            /* istanbul ignore if */
            if (stats.hasErrors()) {
                return
            }

            // console.log(stats.toString({ chunks: true }))

            await this.hooks.pluginDone.promise(this);
        })

        await this.hooks.compile.promise(this);

        // Start Builds
        await sequence(this.compiler.compilers, compiler => new Promise((resolve, reject) => {
            if (this.options.dev) {
                // Build and watch for changes

                compiler.watch(this.options.watchers.webpack, (err) => {
                    /* istanbul ignore if */
                    if (err) {
                        return reject(err)
                    }
                    resolve()
                })

            } else {
                // --- Production Build ---
                compiler.run((err, stats) => {
                    /* istanbul ignore if */
                    if (err) {
                        return reject(err)
                    }
                    if (err) return console.error(err) // eslint-disable-line no-console

                    // Show build stats for production
                    console.log(stats.toString(this.webpackStats)) // eslint-disable-line no-console

                    /* istanbul ignore if */
                    if (stats.hasErrors()) {
                        return reject(new Error('Webpack build exited with errors'))
                    }
                    resolve()
                })
            }
        }))

        await this.hooks.compileDone.promise(this);

    }

    watchDev() {
        const patterns = [
            r(this.options.srcDir, 'server/services/**/*'),
        ]
        const options = Object.assign({}, this.options.watchers.chokidar, {
            ignoreInitial: true
        })
        /* istanbul ignore next */
        const refreshWebpack = debounce(() => {
                console.log('refreshing webpack...')
                this.buildWebpack()
            }
            , 2000
        )

        const refreshWebpackReset = debounce(() => {
                this.buildWebpack(true)
            }
            , 2000
        )

        // Watch for src Files
        let filesWatcher = chokidar.watch(patterns, options)
            .on('add', refreshWebpack)
            .on('unlink', refreshWebpackReset)
            .on('change', refreshWebpack)

    }
}
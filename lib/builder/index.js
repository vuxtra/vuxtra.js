import fs, { remove, readFile, writeFile, mkdirp, utimes, existsSync } from 'fs-extra'
import Tapable from 'tapable'
import chokidar from 'chokidar'
import glob from 'glob'
import AsyncParallelHook from 'tapable/lib/AsyncParallelHook'
import webpack from 'webpack'
import { join, resolve, basename, dirname } from 'path'
import { r, sequence } from 'nuxt/lib/common/utils'
import Exval from 'exval'
// import MFS from 'memory-fs'
import _ from 'lodash'

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
        this.babelOptions = _.defaults(this.options.build.babel, {
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
            if (fs.existsSync(resolve(this.options.srcDir, '..', 'server'))) {
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


    async generateFiles (entryFiles) {
        let serviceObj = {}
        _.forEach(entryFiles, (filePath, path) => {

            let pathSections = _.trim(path, '/').split('/')

            switch (pathSections[0]) {
                case 'services':
                    // lets load up file

                    let entryFileObj = {}
                    let remoteObj = require(join(this.options.buildDir, 'server', _.trimEnd(path,'/')+'.js')).default
                    _.forIn(remoteObj, (value,key) => {
                        entryFileObj[key] = path
                    })

                    // function () {
                    //     return $_internalService(arguments, this.$__vuxtra_enpoint_options)
                    // }

                    _.set(serviceObj, _.replace(_.trim(join.apply(null, pathSections.slice(1)), '/'), /\//g, '.'), entryFileObj)
                    break

            }

        })

        var templateFn = _.template(`{ <% _.each(model, function(val, index) { %> '<%= index %>' : <% if (_.isObject( val )) { %> <%= templateFn({ model: val, templateFn: templateFn }) %> <% }  else  { %> function () {
                return $_internalService(arguments, '<%= val %>', '<%= index %>')
           } <% } %>, <% }); %> }`);

        const fileContent = await readFile(join(__dirname, '../lib/builder/templates/client.js'), 'utf8')
        const template = _.template(fileContent)

        let exval = new Exval()

        const content = template({
            serviceObj: templateFn({ model: serviceObj, templateFn: templateFn })
        })

        let clientPathJs = r(this.options.buildDir, 'clientVuxtra.js')
        await writeFile(clientPathJs, content, 'utf8')

    }

    async buildWebpack (resetFolders = false) {
        debug('Building files...')
        console.log('...compiling vuxtra files')
        const compilersOptions = []

        if (resetFolders) {
            await this.setupBuildDir()
        }

        let entryFiles = glob.sync(`${this.options.srcDir}/server/+(services|models|resources)/**/*.js`).reduce((entries, entry) => Object.assign(entries, {[entry.replace(this.options.srcDir+'/server', '').replace('.js', '')]: entry}), {})

        if (!_.isEmpty(entryFiles)) {
            // vuxtra default compiler
            const vuxtraCompilerConfig = vuxtraServerWebpackConfig.call(this, entryFiles)
            compilersOptions.push(vuxtraCompilerConfig)
        }


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
                    if (err) {
                        return reject(err)
                    }
                    resolve()
                })

            } else {
                // --- Production Build ---
                compiler.run((err, stats) => {
                    if (err) {
                        return reject(err)
                    }

                    // Show build stats for production
                    console.log(stats.toString(this.webpackStats)) // eslint-disable-line no-console

                    if (stats.hasErrors()) {
                        return reject(new Error('Webpack build exited with errors'))
                    }
                    resolve()
                })
            }
        }))


        await this.generateFiles(entryFiles)

        await this.hooks.compileDone.promise(this);

    }

    watchDev() {
        const patterns = [
            r(this.options.srcDir, 'server/services/**/*'),
        ]
        const options = Object.assign({}, this.options.watchers.chokidar, {
            ignoreInitial: true
        })
        const refreshWebpack = _.debounce(() => {
                console.log('refreshing webpack...')
                this.buildWebpack()
            }
            , 2000
        )

        const refreshWebpackReset = _.debounce(() => {
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
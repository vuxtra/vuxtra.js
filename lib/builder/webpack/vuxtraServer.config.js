import { cloneDeep } from 'lodash'
import { join, resolve } from 'path'
import { each } from 'lodash'
import { existsSync } from 'fs'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import glob from 'glob'

export default function vuxtraServerConfig (name) {
    const nodeModulesDir = join(__dirname, '..', 'node_modules')

    let env = {
        debug: true
    }
    each(this.options.env, (value, key) => {
        env['process.env.' + key] = (['boolean', 'number'].indexOf(typeof value) !== -1 ? value : JSON.stringify(value))
    })

    let entryFiles = glob.sync(this.options.srcDir + '/server/**/*.js').reduce((entries, entry) => Object.assign(entries, {[entry.replace(this.options.srcDir+'/server', '').replace('.js', '')]: entry}), {})
    let outputPath = resolve(this.options.buildDir, 'server')

    console.log()

    const config = {
        name: 'vuxtra-server',
        target: 'node',
        node: false,
        devtool: 'source-map',
        entry: entryFiles,
        output: {
            path: outputPath,
            filename: '[name].js',
            chunkFilename: '[name].[chunkhash].js'
        },
        performance: {
            maxEntrypointSize: 1000000,
            hints: false,
            maxAssetSize: Infinity
        },
        resolve: {
            extensions: ['.js', '.json', '.ts'],
            alias: {
                '~': join(this.options.srcDir),
                '~~': join(this.options.rootDir),
                '@': join(this.options.srcDir),
                '@@': join(this.options.rootDir),
            },
            modules: [
                this.options.modulesDir,
                nodeModulesDir
            ]
        },
        resolveLoader: {
            modules: [
                this.options.modulesDir,
                nodeModulesDir
            ]
        },
        module: {
            noParse: /es6-promise\.js$/, // Avoid webpack shimming process
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    options: Object.assign({}, this.babelOptions)
                },
            ]
        },
        externals: [],
        plugins: (this.options.build.plugins || []).concat([
            new webpack.DefinePlugin(Object.assign(env, {
                debug: true
            }))
        ])
    }

    // Workaround for hiding Warnings about plugins without a default export (#1179)
    config.plugins.push({
        apply (compiler) {
            compiler.plugin('done', stats => {
                stats.compilation.warnings = stats.compilation.warnings.filter(warn => {
                    if (warn.name === 'ModuleDependencyWarning' && warn.message.includes(`export 'default'`) && warn.message.includes('plugin')) {
                        return false
                    }
                    return true
                })
            })
        }
    })

    // https://webpack.js.org/configuration/externals/#externals
    // https://github.com/liady/webpack-node-externals
    const moduleDirs = [
        this.options.modulesDir
        // Temporary disabled due to vue-server-renderer module search limitations
        // resolve(__dirname, '..', 'node_modules')
    ]
    moduleDirs.forEach(dir => {
        if (existsSync(dir)) {
            config.externals.push(nodeExternals({
                // load non-javascript files with extensions, presumably via loaders
                whitelist: [/es6-promise|\.(?!(?:js|json)$).{1,5}$/i],
                modulesDir: dir
            }))
        }
    })

    // --------------------------------------
    // Dev specific config
    // --------------------------------------
    if (this.options.dev) {
        //
    }

    // --------------------------------------
    // Production specific config
    // --------------------------------------
    if (!this.options.dev) {
        config.plugins.push(
            new webpack.LoaderOptionsPlugin({
                minimize: true
            })
        )
    }

    // Clone deep avoid leaking config between Client and Server
    return cloneDeep(config)
}

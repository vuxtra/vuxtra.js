// Mostly based on https://github.com/nuxt/nuxt.js/blob/dev/build/rollup.config.js
const { resolve } = require('path')
const rollupBabel = require('rollup-plugin-babel')
const rollupAlias = require('rollup-plugin-alias')
const rollupCommonJS = require('rollup-plugin-commonjs')
const rollupReplace = require('rollup-plugin-replace')
const rollupNodeResolve = require('rollup-plugin-node-resolve')
const packageJson = require('../package.json')

const dependencies = Object.keys(packageJson.dependencies)
const version = packageJson.version || process.env.VERSION

/* banner */
const banner =
    '/*!\n' +
    ' * Vuxtra.js v' + version + '\n' +
    ' * (c) 2017-' + new Date().getFullYear() + ' Faruk Brbovic\n' +
    ' * Released under the MIT License.\n' +
    ' */'

/* Aliases */
const rootDir = resolve(__dirname, '..')
const libDir = resolve(rootDir, 'lib')
const distDir = resolve(rootDir, 'dist')

const aliases = {
    vuxtra: resolve(libDir, 'index.js'),
    app: resolve(libDir, 'app')
}

/* Builds */
const builds = {
    vuxtra: {
        entry: resolve(libDir, 'index.js'),
        file: resolve(distDir, 'vuxtra.js')
    },
    sccbroker: {
        entry: resolve(libDir, 'socketserver/sccBroker.js'),
        file: resolve(distDir, 'sccBroker.js')
    },
    sccmaster: {
        entry: resolve(libDir, 'socketserver/sccMaster.js'),
        file: resolve(distDir, 'sccMaster.js')
    },
    sccworker: {
        entry: resolve(libDir, 'socketserver/sccWorker.js'),
        file: resolve(distDir, 'sccWorker.js')
    },
}

/* Config */
function genConfig (opts) {
    const config = {
        input: opts.entry,
        output: {
            file: opts.file,
            format: opts.format || 'cjs',
            sourcemap: true
        },
        external: ['fs', 'path', 'http']
            .concat(dependencies, opts.external),
        banner: opts.banner || banner,
        name: opts.modulename || 'Vuxtra',
        plugins: [
            rollupAlias(Object.assign({
                resolve: ['.js', '.json', '.jsx', '.ts']
            }, aliases, opts.alias)),

            rollupNodeResolve({ preferBuiltins: true }),

            rollupCommonJS(),

            rollupBabel(Object.assign({
                exclude: 'node_modules/**',
                plugins: [
                    ['transform-runtime', { 'helpers': false, 'polyfill': false }],
                    'transform-async-to-generator',
                    'array-includes',
                    'external-helpers'
                ],
                presets: [
                    ['env', {
                        targets: {
                            node: '8.7.0'
                        },
                        modules: false
                    }]
                ],
                'env': {
                    'test': {
                        'plugins': [ 'istanbul' ]
                    }
                }
            }, opts.babel)),

            rollupReplace({ __VERSION__: version })
        ].concat(opts.plugins || [])
    }

    if (opts.env) {
        config.plugins.push(rollupReplace({
            'process.env.NODE_ENV': JSON.stringify(opts.env)
        }))
    }

    return config
}

if (process.env.TARGET) {
    module.exports = genConfig(builds[process.env.TARGET])
} else {
    module.exports = Object.keys(builds).map(name => genConfig(builds[name]))
}
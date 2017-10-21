import _ from 'lodash'
import { join, resolve } from 'path'

let defaultOptionsObj = {
    'nuxt': {},
    'socketcluster': {
        workers: Number(process.env.SOCKETCLUSTER_WORKERS) || 1,
        brokers: Number(process.env.SOCKETCLUSTER_BROKERS) || 1,
        port:  Number(process.env.SOCKETCLUSTER_PORT) || 3000,
        // If your system doesn't support 'uws', you can switch to 'ws' (which is slower but works on older systems).
        wsEngine: process.env.SOCKETCLUSTER_WS_ENGINE || 'uws',
        appName: process.env.SOCKETCLUSTER_APP_NAME || null,
        workerController: __dirname + '/sccWorker.js',
        brokerController: __dirname + '/sccBroker.js',
        initController: process.env.SOCKETCLUSTER_INIT_CONTROLLER || null,
        workerClusterController: process.env.SOCKETCLUSTER_WORKERCLUSTER_CONTROLLER || null,
        socketChannelLimit: Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000,
        clusterStateServerHost: process.env.SCC_STATE_SERVER_HOST || null,
        clusterStateServerPort: process.env.SCC_STATE_SERVER_PORT || null,
        clusterAuthKey: process.env.SCC_AUTH_KEY || null,
        clusterInstanceIp: process.env.SCC_INSTANCE_IP || null,
        clusterInstanceIpFamily: process.env.SCC_INSTANCE_IP_FAMILY || null,
        clusterStateServerConnectTimeout: Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null,
        clusterStateServerAckTimeout: Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null,
        clusterStateServerReconnectRandomness: Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null,
        crashWorkerOnError: false,
        // If using nodemon, set this to true, and make sure that environment is 'dev'.
        killMasterOnSignal: false,
        environment: process.env.ENV || 'dev'
    },
    'vuxtra': {
        dev: process.env.NODE_ENV !== 'production',
        debug: undefined, // Will be equal to dev if not provided
        buildDir: '.vuxtra',
        cacheDir: '.vuxtracache',
        build: {
            analyze: false,
            dll: false,
            extractCSS: false,
            cssSourceMap: undefined,
            ssr: undefined,
            filenames: {
                css: 'common.[contenthash].css',
                manifest: 'manifest.[hash].js',
                vendor: 'common.[chunkhash].js',
                app: 'app.[chunkhash].js',
                chunk: '[name].[chunkhash].js'
            },
            plugins: [],
            babel: {},
            watch: [],
            devMiddleware: {},
            hotMiddleware: {}
        },
        plugins: [],
        watchers: {
            webpack: {
                ignored: /-dll/
            },
            chokidar: {}
        },
    }
}

const Options = {}

Options.from = function (_options) {
    const options = Object.assign({}, _options)

    _.defaultsDeep(options, defaultOptions)

    // let's check and make sure we set srcDir defaults
    if (typeof options.vuxtra.srcDir === 'undefined' || options.vuxtra.srcDir === null) {
        if (typeof options.rootDir !== 'undefined') {
            // if vuxtra srcdir not provider we set it to root one
            options.vuxtra.srcDir = options.rootDir
        }
    }

    // Resolve dirs
    const hasValue = v => typeof v === 'string' && v
    options.vuxtra.rootDir = hasValue(options.vuxtra.rootDir) ? options.vuxtra.rootDir : process.cwd()
    options.vuxtra.srcDir = hasValue(options.vuxtra.srcDir) ? resolve(options.vuxtra.rootDir, options.vuxtra.srcDir) : options.vuxtra.rootDir
    options.vuxtra.modulesDir = resolve(options.vuxtra.rootDir, hasValue(options.vuxtra.modulesDir) ? options.vuxtra.modulesDir : 'node_modules')
    options.vuxtra.buildDir = resolve(options.vuxtra.rootDir, options.vuxtra.buildDir)
    options.vuxtra.cacheDir = resolve(options.vuxtra.rootDir, options.vuxtra.cacheDir)

    return options

}

export const defaultOptions = defaultOptionsObj

export default Options
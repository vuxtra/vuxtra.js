import scHotReboot from 'sc-hot-reboot'
import Debug from 'debug'

const debug = Debug('scc-master:')
debug.color = 5

module.exports.run = function (socketCluster) {
    socketCluster.on(socketCluster.EVENT_WORKER_CLUSTER_START, function (workerClusterInfo) {
        debug('   >> WorkerCluster PID:', workerClusterInfo.pid)
    })

    if (socketCluster.options.environment == 'dev') {
        // This will cause SC workers to reboot when code changes anywhere in the app directory.
        // The second options argument here is passed directly to chokidar.
        // See https://github.com/paulmillr/chokidar#api for details.
        debug(`   !! The sc-hot-reboot plugin is watching for code changes in the ${__dirname} directory`)
        scHotReboot.attach(socketCluster, {
            cwd: __dirname,
            ignored: ['public', 'node_modules', 'README.md', 'Dockerfile', 'server.js', 'master.js', 'broker.js', /[\/\\]\./, '*.log']
        })
    }
}

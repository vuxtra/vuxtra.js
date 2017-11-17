/*!
 * Vuxtra.js v0.1.5
 * (c) 2017-2017 Faruk Brbovic
 * Released under the MIT License.
 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var scHotReboot = _interopDefault(require('sc-hot-reboot'));
var Debug = _interopDefault(require('debug'));

const debug = Debug('scc-master:');
debug.color = 5;

module.exports.run = function (socketCluster) {
    socketCluster.on(socketCluster.EVENT_WORKER_CLUSTER_START, function (workerClusterInfo) {
        debug('   >> WorkerCluster PID:', workerClusterInfo.pid);
    });

    if (socketCluster.options.environment == 'dev') {
        // This will cause SC workers to reboot when code changes anywhere in the app directory.
        // The second options argument here is passed directly to chokidar.
        // See https://github.com/paulmillr/chokidar#api for details.
        debug(`   !! The sc-hot-reboot plugin is watching for code changes in the ${__dirname} directory`);
        scHotReboot.attach(socketCluster, {
            cwd: __dirname,
            ignored: ['public', 'node_modules', 'README.md', 'Dockerfile', 'server.js', 'master.js', 'broker.js', /[\/\\]\./, '*.log']
        });
    }
};
//# sourceMappingURL=sccMaster.js.map

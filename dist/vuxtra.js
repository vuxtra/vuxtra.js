/*!
 * Vuxtra.js v0.1.5
 * (c) 2017-2017 Faruk Brbovic
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Debug = _interopDefault(require('debug'));
var fs = _interopDefault(require('fs'));
var _ = _interopDefault(require('lodash'));
var scErrors = _interopDefault(require('sc-errors'));
var socketcluster = require('socketcluster');
var path = _interopDefault(require('path'));
var Tapable = _interopDefault(require('tapable'));
var AsyncParallelHook = _interopDefault(require('tapable/lib/AsyncParallelHook'));

let defaultOptionsObj = {
    'nuxt': {},
    'socketcluster': {
        workers: Number(process.env.SOCKETCLUSTER_WORKERS) || 1,
        brokers: Number(process.env.SOCKETCLUSTER_BROKERS) || 1,
        port: Number(process.env.SOCKETCLUSTER_PORT) || 3000,
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
        }
    }
};

const Options = {};

Options.from = function (_options) {
    const options = Object.assign({}, _options);

    _.defaultsDeep(options, defaultOptions);

    // let's check and make sure we set srcDir defaults
    if (typeof options.vuxtra.srcDir === 'undefined' || options.vuxtra.srcDir === null) {
        if (typeof options.rootDir !== 'undefined') {
            // if vuxtra srcdir not provider we set it to root one
            options.vuxtra.srcDir = options.rootDir;
        }
    }

    // Resolve dirs
    const hasValue = v => typeof v === 'string' && v;
    options.vuxtra.rootDir = hasValue(options.vuxtra.rootDir) ? options.vuxtra.rootDir : options.rootDir ? options.rootDir : process.cwd();
    options.vuxtra.srcDir = hasValue(options.vuxtra.srcDir) ? path.resolve(options.vuxtra.rootDir, options.vuxtra.srcDir) : options.vuxtra.rootDir;
    options.vuxtra.modulesDir = path.resolve(options.vuxtra.rootDir, hasValue(options.vuxtra.modulesDir) ? options.vuxtra.modulesDir : 'node_modules');
    options.vuxtra.buildDir = path.resolve(options.vuxtra.rootDir, options.vuxtra.buildDir);
    options.vuxtra.cacheDir = path.resolve(options.vuxtra.rootDir, options.vuxtra.cacheDir);

    return options;
};

const defaultOptions = defaultOptionsObj;

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();



var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

const TimeoutError = scErrors.TimeoutError;
const debug = Debug('vuxtraBoot:');
debug.color = 5;

// SOCKET SERVER DEFAULT OPTIONS PROCESSING


var SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT = Number(process.env.SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) || 10000;

const startupStatus = {
    init: 'INIT',
    startDev: 'START_DEV',
    startSocketserver: 'START_SOCKET_SERVER',
    readySocketserver: 'READY_SOCKET_SERVER',
    failSocketserver: 'FAIL_SOCKET_SERVER',
    readySocketserverWorkerCluster: 'READY_SOCKET_SERVER_WORKER_CLUSTER',
    vuxtraBuilt: 'VUXTRA_BUILT',
    nuxtBuilt: 'NUXT_BUILT',
    vuxtraStarted: 'VUXTRA_STARTED'
};

class VuxtraBoot extends Tapable {
    constructor(_options = {}) {
        super();
        // Apply defaults
        this.options = Options.from(_options);

        this.hooks = {
            startDev: new AsyncParallelHook(["VuxtraBoot"]),
            startSocketserver: new AsyncParallelHook(["VuxtraBoot"]),
            readySocketserver: new AsyncParallelHook(["VuxtraBoot"]),
            failSocketserver: new AsyncParallelHook(['VuxtraBoot', 'data']),
            readySocketserverWorkerCluster: new AsyncParallelHook(['VuxtraBoot']),
            vuxtraBuilt: new AsyncParallelHook(['VuxtraBoot']),
            nuxtBuilt: new AsyncParallelHook(['VuxtraBoot']),
            vuxtraStarted: new AsyncParallelHook(['VuxtraBoot'])
        };

        this.startupStatus = 'INIT';

        this.socketCluster = null;
    }

    startDev(port = 3000, host = 'localhost', nuxtDev = true) {
        var _this = this;

        return asyncToGenerator(function* () {
            _this.hooks.startDev.promise(_this);
            _this.startupStatus = startupStatus.startDev;

            // socketcluster dev setup
            _this.options.socketcluster.environment = 'dev';

            if (typeof _this.options.nuxt.rootDir !== 'string') {
                _this.options.nuxt.rootDir = _this.options.rootDir;
            }

            // Force development mode for add hot reloading and watching changes
            _this.options.nuxt.dev = nuxtDev;

            // Nuxt Mode
            _this.options.nuxt.mode = 'universal';
            _this.options.port = port;
            _this.options.host = host;

            _this.startSocketCluster(port, host);
        })();
    }

    startProd(port = 3000, host = 'localhost') {}

    close() {
        this.do;
    }

    startSocketCluster(port = 3000, host = 'localhost') {

        debug(`Starting: SOCKETCLUSTER on ${host}:${port}`);
        var optionsControllerPath = process.env.SOCKETCLUSTER_OPTIONS_CONTROLLER;
        var masterControllerPath = __dirname + '/sccMaster.js';
        var workerControllerPath = __dirname + '/sccWorker.js';
        var brokerControllerPath = __dirname + '/sccBroker.js';
        var initControllerPath = process.env.SOCKETCLUSTER_INIT_CONTROLLER;
        var workerClusterControllerPath = process.env.SOCKETCLUSTER_WORKERCLUSTER_CONTROLLER;

        this.options.socketcluster.port = port;
        this.options.socketcluster.host = host;

        // kind of hackish way - attcah full config to options to be passed to worker
        this.options.socketcluster.__full_deep_temp_options = _.cloneDeep(this.options);

        var fileExists = function (filePath, callback) {
            fs.access(filePath, fs.constants.F_OK, err => {
                callback(!err);
            });
        };

        var runMasterController = function (socketCluster, filePath) {
            var masterController = require(filePath);
            masterController.run(socketCluster);
        };

        var launch = startOptions => {
            this.socketCluster = new socketcluster.SocketCluster(startOptions);
            this.hooks.startSocketserver.promise(this);
            this.startupStatus = startupStatus.startSocketserver;

            this.socketCluster.on('ready', workerClusterInfo => {
                this.hooks.readySocketserver.promise(this);
                this.startupStatus = startupStatus.readySocketserver;
            });

            this.socketCluster.on('workerClusterReady', workerClusterInfo => {
                this.hooks.readySocketserverWorkerCluster.promise(this);
                this.startupStatus = startupStatus.readySocketserverWorkerCluster;
            });

            this.socketCluster.on('fail', workerClusterInfo => {
                this.hooks.failSocketserver.promise(this);
                this.startupStatus = startupStatus.failSocketserver;
            });

            this.socketCluster.on('workerMessage', (id, data) => {
                if (typeof data.type !== 'undefined') {
                    if (data.type === 'event') {
                        switch (data.subtype) {
                            case 'vuxtraBuilt':
                                this.hooks.vuxtraBuilt.promise(this);
                                this.startupStatus = startupStatus.vuxtraBuilt;
                                break;
                            case 'nuxtBuilt':
                                this.hooks.nuxtBuilt.promise(this);
                                this.startupStatus = startupStatus.nuxtBuilt;
                                break;
                            case 'vuxtraStarted':
                                this.hooks.vuxtraStarted.promise(this);
                                this.startupStatus = startupStatus.vuxtraStarted;
                                break;
                        }
                    } else if (data.type === 'error') {
                        this.hooks.failSocketserver.promise(this, data);
                        this.startupStatus = startupStatus.failSocketserver;
                    }
                }
            });

            if (masterControllerPath) {
                runMasterController(this.socketCluster, masterControllerPath);
            } else {
                var defaultMasterControllerPath = './sccMaster.js';
                fileExists(defaultMasterControllerPath, exists => {
                    if (exists) {
                        runMasterController(this.socketCluster, defaultMasterControllerPath);
                    }
                });
            }
        };

        var start = () => {
            if (optionsControllerPath) {
                var optionsController = require(optionsControllerPath);
                optionsController.run(this.options.socketcluster, launch);
            } else {
                launch(this.options.socketcluster);
            }
        };

        var bootCheckInterval = Number(process.env.SOCKETCLUSTER_BOOT_CHECK_INTERVAL) || 200;
        var bootStartTime = Date.now();

        // Detect when Docker volumes are ready.
        var startWhenFileIsReady = filePath => {
            return new Promise((resolve, reject) => {
                if (!filePath) {
                    resolve();
                    return;
                }
                var checkIsReady = () => {
                    var now = Date.now();

                    fileExists(filePath, exists => {
                        if (exists) {
                            resolve();
                        } else {
                            if (now - bootStartTime >= SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT) {
                                var errorMessage = `Could not locate a controller file at path ${filePath} ` + `before SOCKETCLUSTER_CONTROLLER_BOOT_TIMEOUT`;
                                var volumeBootTimeoutError = new TimeoutError(errorMessage);
                                reject(volumeBootTimeoutError);
                            } else {
                                setTimeout(checkIsReady, bootCheckInterval);
                            }
                        }
                    });
                };
                checkIsReady();
            });
        };

        var filesReadyPromises = [startWhenFileIsReady(optionsControllerPath), startWhenFileIsReady(masterControllerPath), startWhenFileIsReady(workerControllerPath), startWhenFileIsReady(brokerControllerPath), startWhenFileIsReady(initControllerPath), startWhenFileIsReady(workerClusterControllerPath)];
        Promise.all(filesReadyPromises).then(() => {
            start();
        }).catch(err => {
            console.error(err.stack);
            process.exit(1);
        });
    }

}

exports.VuxtraBoot = VuxtraBoot;
//# sourceMappingURL=vuxtra.js.map

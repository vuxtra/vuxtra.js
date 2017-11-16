/*!
 * Vuxtra.js v0.1.4
 * (c) 2017-2017 Faruk Brbovic
 * Released under the MIT License.
 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var express = _interopDefault(require('express'));
var path = require('path');
var path__default = _interopDefault(path);
var morgan = _interopDefault(require('morgan'));
var healthChecker = _interopDefault(require('sc-framework-health-check'));
var Debug = _interopDefault(require('debug'));
var nuxt = require('nuxt');
var Tapable = _interopDefault(require('tapable'));
var AsyncParallelHook = _interopDefault(require('tapable/lib/AsyncParallelHook'));
var _ = require('lodash');
var ___default = _interopDefault(_);
var sharedCore = require('@vuxtra/shared-core');
var fs = require('fs-extra');
var fs__default = _interopDefault(fs);
var chokidar = _interopDefault(require('chokidar'));
var glob = _interopDefault(require('glob'));
var webpack = _interopDefault(require('webpack'));
var Exval = _interopDefault(require('exval'));
var fs$1 = require('fs');
var nodeExternals = _interopDefault(require('webpack-node-externals'));

class Controller extends Tapable {
    constructor(_options, _socket) {
        super();
        this.options = _options;
        this.socket = _socket;
    }

}

class ServiceController extends Controller {
    constructor(_options) {
        super(_options);
    }

    process(data, res) {
        let request = new sharedCore.ServiceRequest(data);

        let response = new sharedCore.ServiceResponse();
        response.setId(request.getId());
        response.ssSuccess();
        response.setServiceName(request.getServiceName());
        response.setServiceAction(request.getServiceAction());

        let type = request.getType();

        if (type === null || type !== 'service' || request.getServiceName() === null) {
            response.ssClientErrorInvalidRequest();
            res(null, response);
            return;
        }

        let absoluteServicePath = path.join(this.options.buildDir, 'server', request.getServiceName() + '.js');

        try {
            let service = require(path.resolve(absoluteServicePath)).default;

            if (typeof service[request.getServiceAction()] === 'undefined' || service[request.getServiceAction()] === null) {
                response.ssClientErrorNotFound(`service ${request.getServiceName()} does not contain action ${request.getServiceAction()}`);
                res(null, response);
                return;
            }

            let ctx = { request, response

                // here we process it weather is sync or async
            };Promise.resolve(service[request.getServiceAction()].apply(ctx, ___default.values(request.getData()))).then(result => {
                response.setData(result);
                res(null, response);
            });
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                response.ssClientErrorNotFound(`service name ${request.getServiceName()} not found`);
                res(null, response);
                return;
            }
            response.ssServerError(e.message);
            res(null, response);
            return;
        }
    }

}

class VuxtraServer extends Tapable {
    constructor(options) {
        super();
        // setup available hooks
        this.hooks = {
            init: new AsyncParallelHook(["vuxtraServer"]),
            ready: new AsyncParallelHook(["vuxtraServer"]),
            socketConnection: new AsyncParallelHook(["socket"])
        };
        this.options = options;
        this.socketServer = null;
        this.serviceController = null;
    }

    registerSocketServer(socketServer) {
        // lets make sure proper interface is followed

        if (!___default.hasIn(socketServer, ['exchange', 'on'])) {
            throw Error('Not a valid socket server, make sure your object declares proper interface');
        }
        this.socketServer = socketServer;
    }

    run() {
        this.hooks.init.promise(this);
        if (this.socketServer === null) {
            throw Error('SocketServer should be setup and registered first with registerSocketServer');
        }

        this.socketServer.on('connection', socket => {

            this.hooks.socketConnection.promise(socket);

            this.processServiceRequest(socket);

            var interval = setInterval(function () {
                socket.emit('rand', {
                    rand: Math.floor(Math.random() * 5)
                });
            }, 1000);

            socket.on('disconnect', function () {
                clearInterval(interval);
            });
        });

        this.hooks.ready.promise(this);
    }

    processServiceRequest(socket) {
        // process service calls
        socket.on('service.call', (data, res) => {
            if (this.serviceController === null) {
                this.serviceController = new ServiceController(this.options, socket);
            }

            this.serviceController.process(data, res);
        });
    }
}

function sequence (tasks, fn) {
  return tasks.reduce((promise, task) => promise.then(() => fn(task)), Promise.resolve())
}







const isWindows = /^win/.test(process.platform);

function wp (p = '') {
  /* istanbul ignore if */
  if (isWindows) {
    return p.replace(/\\/g, '\\\\')
  }
  return p
}



const reqSep = /\//g;
const sysSep = ___default.escapeRegExp(path.sep);
const normalize = string => string.replace(reqSep, sysSep);

function r () {
  let args = Array.prototype.slice.apply(arguments);
  let lastArg = ___default.last(args);

  if (lastArg.includes('@') || lastArg.includes('~')) {
    return wp(lastArg)
  }

  return wp(path.resolve(...args.map(normalize)))
}

function vuxtraServerConfig(entryFiles) {
    const nodeModulesDir = path.join(__dirname, '..', 'node_modules');

    let env = {
        debug: true
    };
    _.each(this.options.env, (value, key) => {
        env['process.env.' + key] = ['boolean', 'number'].indexOf(typeof value) !== -1 ? value : JSON.stringify(value);
    });

    let outputPath = path.resolve(this.options.buildDir, 'server');

    console.log();

    const config = {
        name: 'vuxtra-server',
        target: 'node',
        node: false,
        devtool: 'source-map',
        entry: entryFiles,
        output: {
            path: outputPath,
            filename: '[name].js',
            chunkFilename: '[name].[chunkhash].js',
            libraryTarget: 'commonjs2'
        },
        performance: {
            maxEntrypointSize: 1000000,
            hints: false,
            maxAssetSize: Infinity
        },
        resolve: {
            extensions: ['.js', '.json', '.ts'],
            alias: {
                '~': path.join(this.options.srcDir),
                '~~': path.join(this.options.rootDir),
                '@': path.join(this.options.srcDir),
                '@@': path.join(this.options.rootDir)
            },
            modules: [this.options.modulesDir, nodeModulesDir]
        },
        resolveLoader: {
            modules: [this.options.modulesDir, nodeModulesDir]
        },
        module: {
            noParse: /es6-promise\.js$/, // Avoid webpack shimming process
            rules: [{
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: Object.assign({}, this.babelOptions)
            }]
        },
        externals: [],
        plugins: (this.options.build.plugins || []).concat([new webpack.DefinePlugin(Object.assign(env, {
            debug: true
        }))])

        // Workaround for hiding Warnings about plugins without a default export (#1179)
    };config.plugins.push({
        apply(compiler) {
            compiler.plugin('done', stats => {
                stats.compilation.warnings = stats.compilation.warnings.filter(warn => {
                    if (warn.name === 'ModuleDependencyWarning' && warn.message.indexOf(`export 'default'`) !== -1 && warn.message.indexOf('plugin') !== -1) {
                        return false;
                    }
                    return true;
                });
            });
        }
    });

    // https://webpack.js.org/configuration/externals/#externals
    // https://github.com/liady/webpack-node-externals
    const moduleDirs = [this.options.modulesDir
    // Temporary disabled due to vue-server-renderer module search limitations
    // resolve(__dirname, '..', 'node_modules')
    ];
    moduleDirs.forEach(dir => {
        if (fs$1.existsSync(dir)) {
            config.externals.push(nodeExternals({
                // load non-javascript files with extensions, presumably via loaders
                whitelist: [/es6-promise|\.(?!(?:js|json)$).{1,5}$/i],
                modulesDir: dir
            }));
        }
    });

    // --------------------------------------
    // Dev specific config
    // --------------------------------------
    if (!this.options.dev) {
        config.plugins.push(new webpack.LoaderOptionsPlugin({
            minimize: true
        }));
    }

    // Clone deep avoid leaking config between Client and Server
    return _.cloneDeep(config);
}

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve$$1, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve$$1,
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
    return new Promise(function (resolve$$1, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve$$1(value);
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

// import MFS from 'memory-fs'
const debug$1 = Debug('vuxtra:build');
debug$1.color = 2; // Force green color

class VuxtraBuilder extends Tapable {
    constructor(_options) {
        super();

        // setup available hooks
        this.hooks = {
            init: new AsyncParallelHook(["builder"]),
            built: new AsyncParallelHook(["builder"]),
            compile: new AsyncParallelHook(["compiler"]),
            pluginDone: new AsyncParallelHook(["compiler"]),
            compileDone: new AsyncParallelHook(["compiler"])
        };

        this.options = _options;
        this.compiler = null;
    }

    build() {
        var _this = this;

        return asyncToGenerator(function* () {
            debug$1('...building vuxtraServer');
            yield _this.hooks.init.promise(_this);

            // Babel options
            _this.babelOptions = ___default.defaults(_this.options.build.babel, {
                babelrc: false,
                cacheDirectory: !!_this.options.dev
            });
            if (!_this.babelOptions.babelrc && !_this.babelOptions.presets) {
                _this.babelOptions.presets = [require.resolve('babel-preset-vue-app')];
            }

            // Check if server dir exists and warn if not
            if (!fs__default.existsSync(path.join(_this.options.srcDir, 'server'))) {
                let dir = _this.options.srcDir;
                if (fs__default.existsSync(path.resolve(_this.options.srcDir, '..', 'server'))) {
                    throw new Error(`No \`server\` directory found in ${dir}. Did you mean to run \`vuxtra\` in the parent (\`../\`) directory?`);
                } else {
                    throw new Error(`Couldn't find a \`server\` directory in ${dir}. Please create one under the project root`);
                }
            }

            // lets setup a watcher
            // this.options.build.watch.push(join(this.options.srcDir, 'server/**/*.js'))

            debug$1(`App root: ${_this.options.srcDir}`);
            debug$1(`Generating ${_this.options.buildDir} files...`);

            yield _this.setupBuildDir();
            yield _this.buildWebpack();

            yield _this.hooks.built.promise(_this);
        })();
    }

    setupBuildDir() {
        var _this2 = this;

        return asyncToGenerator(function* () {
            // Create .vuxtra/, .vuxtra/services and other folders
            yield fs.remove(r(_this2.options.buildDir));
            yield fs.mkdirp(r(_this2.options.buildDir, 'server'));
            if (!_this2.options.dev) {
                yield fs.mkdirp(r(_this2.options.buildDir, 'dist'));
            }
        })();
    }

    generateFiles(entryFiles) {
        var _this3 = this;

        return asyncToGenerator(function* () {
            let serviceObj = {};
            ___default.forEach(entryFiles, function (filePath, path$$1) {

                let pathSections = ___default.trim(path$$1, '/').split('/');

                switch (pathSections[0]) {
                    case 'services':
                        // lets load up file

                        let entryFileObj = {};
                        let remoteObj = require(path.join(_this3.options.buildDir, 'server', ___default.trimEnd(path$$1, '/') + '.js')).default;
                        ___default.forIn(remoteObj, function (value, key) {
                            entryFileObj[key] = path$$1;
                        });

                        // function () {
                        //     return $_internalService(arguments, this.$__vuxtra_enpoint_options)
                        // }

                        ___default.set(serviceObj, ___default.replace(___default.trim(path.join.apply(null, pathSections.slice(1)), '/'), /\//g, '.'), entryFileObj);
                        break;

                }
            });

            var templateFn = ___default.template(`{ <% _.each(model, function(val, index) { %> '<%= index %>' : <% if (_.isObject( val )) { %> <%= templateFn({ model: val, templateFn: templateFn }) %> <% }  else  { %> function () {
                return $_internalService(arguments, '<%= val %>', '<%= index %>')
           } <% } %>, <% }); %> }`);

            const fileContent = yield fs.readFile(path.join(__dirname, '../lib/builder/templates/client.js'), 'utf8');
            const template = ___default.template(fileContent);

            let exval = new Exval();

            const content = template({
                serviceObj: templateFn({ model: serviceObj, templateFn: templateFn })
            });

            let clientPathJs = r(_this3.options.buildDir, 'clientVuxtra.js');
            yield fs.writeFile(clientPathJs, content, 'utf8');
        })();
    }

    buildWebpack(resetFolders = false) {
        var _this4 = this;

        return asyncToGenerator(function* () {
            debug$1('Building files...');
            console.log('...compiling vuxtra files');
            const compilersOptions = [];

            if (resetFolders) {
                yield _this4.setupBuildDir();
            }

            let entryFiles = glob.sync(`${_this4.options.srcDir}/server/+(services|models|resources)/**/*.js`).reduce(function (entries, entry) {
                return Object.assign(entries, { [entry.replace(_this4.options.srcDir + '/server', '').replace('.js', '')]: entry });
            }, {});

            if (!___default.isEmpty(entryFiles)) {
                // vuxtra default compiler
                const vuxtraCompilerConfig = vuxtraServerConfig.call(_this4, entryFiles);
                compilersOptions.push(vuxtraCompilerConfig);
            }

            // Simulate webpack multi compiler interface
            // Separate compilers are simpler, safer and faster
            _this4.compiler = { compilers: [] };
            _this4.compiler.plugin = function (...args) {
                _this4.compiler.compilers.forEach(function (compiler) {
                    compiler.plugin(...args);
                });
            };

            // Initialize shared FS and Cache
            // const sharedFS = this.options.dev && new MFS()
            const sharedFS = false; // disable shared fs for now
            const sharedCache = {};

            // Initialize compilers
            compilersOptions.forEach(function (compilersOption) {
                const compiler = webpack(compilersOption);
                if (sharedFS && !(compiler.name.indexOf('-dll') !== -1)) {
                    compiler.outputFileSystem = sharedFS;
                }
                compiler.cache = sharedCache;
                _this4.compiler.compilers.push(compiler);
            });

            // Access to compilers with name
            _this4.compiler.compilers.forEach(function (compiler) {
                if (compiler.name) {
                    _this4.compiler[compiler.name] = compiler;
                }
            });

            // Run after each compile
            _this4.compiler.plugin('done', (() => {
                var _ref = asyncToGenerator(function* (stats) {
                    // Don't reload failed builds
                    if (stats.hasErrors()) {
                        return;
                    }

                    // console.log(stats.toString({ chunks: true }))

                    yield _this4.hooks.pluginDone.promise(_this4);
                });

                return function (_x) {
                    return _ref.apply(this, arguments);
                };
            })());

            yield _this4.hooks.compile.promise(_this4);

            // Start Builds
            yield sequence(_this4.compiler.compilers, function (compiler) {
                return new Promise(function (resolve$$1, reject) {
                    if (_this4.options.dev) {
                        // Build and watch for changes

                        compiler.watch(_this4.options.watchers.webpack, function (err) {
                            if (err) {
                                return reject(err);
                            }
                            resolve$$1();
                        });
                    } else {
                        // --- Production Build ---
                        compiler.run(function (err, stats) {
                            if (err) {
                                return reject(err);
                            }
                            if (err) return console.error(err); // eslint-disable-line no-console

                            // Show build stats for production
                            console.log(stats.toString(_this4.webpackStats)); // eslint-disable-line no-console

                            if (stats.hasErrors()) {
                                return reject(new Error('Webpack build exited with errors'));
                            }
                            resolve$$1();
                        });
                    }
                });
            });

            yield _this4.generateFiles(entryFiles);

            yield _this4.hooks.compileDone.promise(_this4);
        })();
    }

    watchDev() {
        const patterns = [r(this.options.srcDir, 'server/services/**/*')];
        const options = Object.assign({}, this.options.watchers.chokidar, {
            ignoreInitial: true
        });
        const refreshWebpack = ___default.debounce(() => {
            console.log('refreshing webpack...');
            this.buildWebpack();
        }, 2000);

        const refreshWebpackReset = ___default.debounce(() => {
            this.buildWebpack(true);
        }, 2000);

        // Watch for src Files
        let filesWatcher = chokidar.watch(patterns, options).on('add', refreshWebpack).on('unlink', refreshWebpackReset).on('change', refreshWebpack);
    }
}

const debug = Debug('scc-worker:');
debug.color = 5;

module.exports.run = function (worker) {
    debug('   >> Worker PID:', process.pid);
    var environment = worker.options.environment;

    var app = express();

    var httpServer = worker.httpServer;
    var scServer = worker.scServer;

    process.on('unhandledRejection', (reason, p) => {
        //console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        worker.sendToMaster({ type: 'error', subtype: 'worker', e: p, message: reason });
    });

    if (environment == 'dev') {
        // Log every HTTP request. See https://github.com/expressjs/morgan for other
        // available formats.
        app.use(morgan('dev'));
    }

    // Import and Set vuxtra and nuxt options
    let config = worker.options.__full_deep_temp_options;

    if (!___default.isArray(config.nuxt.modules)) {
        config.nuxt.modules = [];
    }

    // main vuxtra module
    config.nuxt.modules.push({
        src: '@vuxtra/nuxt-client-module/lib/index',
        options: config
    });

    if (!___default.isArray(config.nuxt.build)) {
        config.nuxt.build = [];

        if (!___default.isArray(config.nuxt.build.templates)) {
            config.nuxt.build.templates = [];
        }
    }

    config.nuxt.build.templates.push('./.vuxtra/clientVuxtra.js');

    // Init Nuxt.js
    const nuxt$$1 = new nuxt.Nuxt(config.nuxt);

    let builderPromise = new Promise((resolve$$1, reject) => {

        // Build only in dev mode
        if (config.vuxtra.dev) {
            const vuxtraBuilder = new VuxtraBuilder(config.vuxtra);
            vuxtraBuilder.build().then(() => {
                worker.sendToMaster({ type: 'event', subtype: 'vuxtraBuilt', message: 'Vuxtra has been built' });
                vuxtraBuilder.watchDev();
                // Build only in dev mode
                if (config.nuxt.dev) {
                    const nuxtBuilder = new nuxt.Builder(nuxt$$1);
                    nuxtBuilder.build().then(() => {
                        worker.sendToMaster({ type: 'event', subtype: 'nuxtBuilt', message: 'nuxt has been built' });
                        resolve$$1('true');
                    });
                }
            }).catch(e => {
                worker.sendToMaster({ type: 'error', subtype: 'builders', 'e': e, message: e.message });
                reject(e);
            });
        } else {
            resolve$$1(true);
        }
    });

    builderPromise.then(() => {

        // Give nuxt middleware to express
        app.use(nuxt$$1.render);

        // Add GET /health-check express route
        healthChecker.attach(worker, app);
        httpServer.on('request', app);

        let vuxtraServer = new VuxtraServer(config.vuxtra);

        // lets register current socket with vuxtraServer
        vuxtraServer.registerSocketServer(scServer);
        // lets run it
        vuxtraServer.run();

        worker.sendToMaster({ type: 'event', subtype: 'vuxtraStarted', message: 'vuxtra has started' });
    });
};
//# sourceMappingURL=sccWorker.js.map

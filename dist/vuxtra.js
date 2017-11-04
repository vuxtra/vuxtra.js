/*!
 * Vuxtra.js v0.1.3
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
var path = require('path');
var Tapable = _interopDefault(require('tapable'));

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

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

class Hook {
	constructor(args) {
		if(!Array.isArray(args)) args = [];
		this._args = args;
		this.taps = [];
		this.interceptors = [];
		this.call = this._call = this.createCompileDelegate("call", "sync", args);
		this.promise = this._promise = this.createCompileDelegate("promise", "promise", args);
		this.callAsync = this._callAsync = this.createCompileDelegate("callAsync", "async", args.concat("_callback"));
		this._x = undefined;
	}

	compile(options) {
		const source = this.template(options);
		return new Function(`"use strict"; return (${source});`)();
	}

	getTapType() {
		if(this.interceptors.length > 0) return "intercept";
		if(this.taps.length === 0) return "none";
		if(this.taps.length === 1) {
			const tap = this.taps[0];
			return tap.type;
		}
		let type = this.taps[0].type;
		for(let i = 1; i < this.taps.length; i++) {
			const tap = this.taps[i];
			if(tap.type !== type) return "multiple";
		}
		return "multiple-" + type;
	}

	createCall(type) {
		const tap = this.getTapType();
		if(tap === "sync" || tap === "async" || tap === "promise")
			this._x = this.taps[0].fn;
		else if(tap === "multiple-sync" || tap === "multiple-async" || tap === "multiple-promise")
			this._x = this.taps.map(t => t.fn);
		else
			this._x = this.taps;
		return this.compile({
			args: this._args,
			tap: tap,
			type: type
		});
	}

	createCompileDelegate(name, type, args) {
		return new Function(args, `
			this.${name} = this.createCall(${JSON.stringify(type)});
			return this.${name}(${args.join(", ")});
		`);
	}

	tap(options, fn) {
		if(typeof options === "string")
			options = { name: options };
		if(typeof options !== "object" || options === null)
			throw new Error("Invalid arguments to tap(options: Object, fn: function)");
		options = Object.assign({ type: "sync", fn: fn }, options);
		if(typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tap");
		this._insert(options);
	}

	tapAsync(options, fn) {
		if(typeof options === "string")
			options = { name: options };
		if(typeof options !== "object" || options === null)
			throw new Error("Invalid arguments to tapAsync(options: Object, fn: function)");
		options = Object.assign({ type: "async", fn: fn }, options);
		if(typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapAsync");
		this._insert(options);
	}

	tapPromise(options, fn) {
		if(typeof options === "string")
			options = { name: options };
		if(typeof options !== "object" || options === null)
			throw new Error("Invalid arguments to tapPromise(options: Object, fn: function)");
		options = Object.assign({ type: "promise", fn: fn }, options);
		if(typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapPromise");
		this._insert(options);
	}

	withOptions(options) {
		const mergeOptions = opt => Object.assign({}, options, typeof opt === "string" ? { name: opt } : opt);

		// Prevent creating endless prototype chains
		options = Object.assign({}, this._withOptions);
		const base = this._withOptionsBase || this;
		const newHook = Object.create(base);

		newHook.tapAsync = (opt, fn) => base.tapAsync(mergeOptions(opt), fn),
		newHook.tap = (opt, fn) => base.tap(mergeOptions(opt), fn);
		newHook.tapPromise = (opt, fn) => base.tapPromise(mergeOptions(opt), fn);
		newHook._withOptions = options;
		newHook._withOptionsBase = options;
		return newHook;
	}

	isUsed() {
		return this.taps.length > 0 || this.interceptors.length > 0;
	}

	intercept(interceptor) {
		this._resetCompilation();
		this.interceptors.push(Object.assign({
			call: () => {},
			loop: () => {},
			tap: tap => tap,
		}, interceptor));
	}

	_resetCompilation() {
		this.call = this._call;
		this.callAsync = this._callAsync;
		this.promise = this._promise;
	}

	_insert(item) {
		this._resetCompilation();
		let before;
		if(typeof item.before === "string")
			before = new Set([item.before]);
		else if(Array.isArray(item.before)) {
			before = new Set(item.before);
		}
		let stage = 0;
		if(typeof item.stage === "number")
			stage = item.stage;
		let i = this.taps.length;
		while(i > 0) {
			i--;
			const x = this.taps[i];
			this.taps[i+1] = x;
			const xStage = x.stage || 0;
			if(before) {
				if(before.has(x.name)) {
					before.delete(x.name);
					continue;
				}
				if(before.size > 0) {
					continue;
				}
			}
			if(xStage > stage) {
				continue;
			}
			i++;
			break;
		}
		this.taps[i] = item;
	}
}

var Hook_1 = Hook;

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var simpleAsyncCases = createCommonjsModule(function (module, exports) {
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

exports.notBailing = (options) => {
	const args = options.args.join(", ");
	const argsWithCallback = args ? `${args}, _callback` : "_callback";
	const argsWithComma = args ? `${args}, ` : "";
	const tap = options.tap;
	const type = options.type;
	switch(`${tap} ${type}`) {
		case "none async":
			return `function(${argsWithCallback}) {
				_callback();
			}`;
		case "none promise":
			return `function(${args}) {
				return Promise.resolve();
			}`;
		case "sync async":
			return `function(${argsWithCallback}) {
				try {
					this._x(${args});
				} catch(_e) {
					_callback(_e);
					return;
				}
				_callback();
			}`;
		case "sync promise":
			return `function(${args}) {
				return Promise.resolve().then(() => {
					this._x(${args});
				});
			}`;
		case "async async":
			return `function(${argsWithCallback}) {
				this._x(${argsWithComma}(_err) => {
					if(_err) {
						_callback(_err);
						return;
					}
					_callback();
				});
			}`;
		case "async promise":
			return `function(${args}) {
				return new Promise((_resolve, _reject) => {
					let _isSync = true;
					this._x(${argsWithComma}_err => {
						if(_err) {
							if(_isSync)
								Promise.resolve().then(() => _reject(_err));
							else
								_reject(_err);
							return;
						}
						_resolve();
					});
					_isSync = false;
				});
			}`;
		case "promise async":
			return `function(${argsWithCallback}) {
				Promise.resolve(this._x(${args})).then(() => {
					_callback();
				}, _err => {
					_callback(_err);
				});
			}`;
		case "promise promise":
			return `function(${args}) {
				return Promise.resolve(this._x(${args})).then(() => {});
			}`;
		case "multiple-sync async":
			return `function(${argsWithCallback}) {
				try {
					const _fns = this._x;
					for(let _i = 0; _i < _fns.length; _i++) {
						_fns[_i](${args});
					}
				} catch(_err) {
					_callback(_err);
					return;
				}
				_callback();
			}`;
		case "multiple-sync promise":
			return `function(${args}) {
				return Promise.resolve().then(() => {
					const _fns = this._x;
					for(let _i = 0; _i < _fns.length; _i++) {
						_fns[_i](${args});
					}
				});
			}`;
	}
};

exports.bailing = (options) => {
	const args = options.args.join(", ");
	const argsWithCallback = args ? `${args}, _callback` : "_callback";
	const argsWithComma = args ? `${args}, ` : "";
	const tap = options.tap;
	const type = options.type;
	switch(`${tap} ${type}`) {
		case "none async":
			return `function(${argsWithCallback}) {
				_callback();
			}`;
		case "none promise":
			return `function(${args}) {
				return Promise.resolve();
			}`;
		case "sync async":
			return `function(${argsWithCallback}) {
				let _result;
				try {
					_result = this._x(${args});
				} catch(_e) {
					_callback(_e);
					return;
				}
				_callback(null, _result);
			}`;
		case "sync promise":
			return `function(${args}) {
				return Promise.resolve().then(() => this._x(${args}));
			}`;
		case "async async":
			return `function(${argsWithCallback}) {
				this._x(${argsWithCallback});
			}`;
		case "async promise":
			return `function(${args}) {
				return new Promise((_resolve, _reject) => {
					let _isSync = true;
					this._x(${argsWithComma}(_err, _result) => {
						if(_err) {
							if(_isSync)
								Promise.resolve().then(() => _reject(_err));
							else
								_reject(_err);
							return;
						}
						_resolve(_result);
					});
					_isSync = false;
				});
			}`;
		case "promise async":
			return `function(${argsWithCallback}) {
				Promise.resolve(this._x(${args})).then(_result => {
					_callback(null, _result);
				}, _err => {
					_callback(_err);
				});
			}`;
		case "promise promise":
			return `function(${args}) {
				return this._x(${args});
			}`;
		case "multiple-sync async":
			return `function(${argsWithCallback}) {
				try {
					const _fns = this._x;
					for(let _i = 0; _i < _fns.length; _i++) {
						const _result = _fns[_i](${args});
						if(_result !== undefined) {
							_callback(null, _result);
							return;
						}
					}
				} catch(_err) {
					_callback(_err);
					return;
				}
				_callback();
			}`;
		case "multiple-sync promise":
			return `function(${args}) {
				return new Promise(_resolve => {
					const _fns = this._x;
					for(let _i = 0; _i < _fns.length; _i++) {
						const _result = _fns[_i](${args});
						if(_result !== undefined) {
							_resolve(_result);
							return;
						}
					}
					_resolve();
				});
			}`;
	}
};
});

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";




class AsyncParallelHook extends Hook_1 {
	constructor(args) {
		super(args);
		this.call = this._call = undefined;
	}

	template(options) {
		const simpleCase = simpleAsyncCases.notBailing(options);
		if(simpleCase) return simpleCase;
		const args = options.args.join(", ");
		const argsWithCallback = args ? `${args}, _callback` : "_callback";
		const argsWithComma = args ? `${args}, ` : "";
		const tap = options.tap;
		const type = options.type;
		const isIntercept = tap == "intercept";
		switch(`${tap} ${type}`) {
			case "multiple-async async":
				return `function(${argsWithCallback}) {
					const _fns = this._x;
					let _remaining = _fns.length;
					const _handler = (_err) => {
						if(_err && _remaining > 0) {
							_remaining = -1;
							_callback(_err);
							return;
						}
						if(--_remaining === 0) {
							_callback();
						}
					};
					for(let _i = 0; _i < _fns.length; _i++) {
						_fns[_i](${argsWithComma}_handler);
					}
				}`;
			case "multiple-async promise":
				return `function(${args}) {
					return new Promise((_resolve, _reject) => {
						const _fns = this._x;
						let _remaining = _fns.length;
						const _handler = (_err) => {
							if(_err && _remaining > 0) {
								_remaining = -1;
								_reject(_err);
								return;
							}
							if(--_remaining === 0) {
								_resolve();
							}
						};
						for(let _i = 0; _i < _fns.length; _i++) {
							_fns[_i](${argsWithComma}_handler);
						}
					});
				}`;
			case "multiple-promise async":
				return `function(${argsWithCallback}) {
					const _fns = this._x;
					let _remaining = _fns.length;
					const _handler = () => {
						if(--_remaining === 0) {
							_callback();
						}
					}
					const _handlerErr = (_err) => {
						if(_remaining > 0) {
							_remaining = -1;
							_callback(_err);
						}
					}
					for(let _i = 0; _i < _fns.length; _i++) {
						Promise.resolve(_fns[_i](${args})).then(_handler, _handlerErr);
					}
				}`;
			case "multiple-promise promise":
				return `function(${args}) {
					const _fns = this._x;
					return Promise.all(_fns.map(_fn => _fn(${args}))).then(() => {});
				}`;
			case "multiple async":
			case "intercept async":
				return `function(${argsWithCallback}) {
					const _taps = this._x;
					${isIntercept ? `const _intercept = this.interceptors;
						for(let _j = 0; _j < _intercept.length; _j++)
							_intercept[_j].call(${args});
					` : ""}
					let _remaining = _taps.length;
					const _handler = (_err) => {
						if(_err && _remaining > 0) {
							_remaining = -1;
							_callback(_err);
							return;
						}
						if(--_remaining === 0) {
							_callback();
						}
					};
					const _handlerSuccess = () => {
						if(--_remaining === 0) {
							_callback();
						}
					}
					const _handlerErr = (_err) => {
						if(_remaining > 0) {
							_remaining = -1;
							_callback(_err);
						}
					}
					for(let _i = 0; _i < _taps.length; _i++) {
						${isIntercept ? `let _tap = _taps[_i];
						for(let _j = 0; _j < _intercept.length; _j++)
							_tap = _intercept[_j].tap(_tap);
						` : `const _tap = _taps[_i];`}
						switch(_tap.type) {
							case "sync":
								try {
									_tap.fn(${args});
								} catch(_err) {
									_handlerErr(_err);
									break;
								}
								_handlerSuccess();
								break;
							case "async":
								_tap.fn(${argsWithComma}_handler);
								break;
							case "promise":
								Promise.resolve(_tap.fn(${args})).then(_handlerSuccess, _handlerErr);
								break;
						}
					}
				}`;
			case "multiple promise":
			case "intercept promise":
				return `function(${args}) {
					const _taps = this._x;
					${isIntercept ? `const _intercept = this.interceptors;
					for(let _j = 0; _j < _intercept.length; _j++)
						_intercept[_j].call(${args});
					` : ""}
					let _earlyAbort = false;
					return Promise.all(_taps.map(_tap => {
						if(_earlyAbort) return;
						${isIntercept ? `for(let _j = 0; _j < _intercept.length; _j++)
							_tap = _intercept[_j].tap(_tap);
						` : ""}
						switch(_tap.type) {
							case "sync":
								try {
									_tap.fn(${args});
								} catch(_err) {
									_earlyAbort = true;
									return Promise.reject(_err);
								}
								return Promise.resolve();
								case "async":
								return new Promise((_resolve, _reject) => {
									_tap.fn(${argsWithComma}_err => {
										if(_err) {
											_earlyAbort = true;
											_reject(_err);
											return;
										}
										_resolve();
									});
								});
								break;
							case "promise":
								return _tap.fn(${args});
								break;
						}
					})).then(() => {});
				}`;
			/* istanbul ignore next */
			default:
				/* istanbul ignore next */
				throw new Error(`Unsupported tap '${tap}' or type '${type}'`);
		}
	}
}

var AsyncParallelHook_1 = AsyncParallelHook;

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
            startDev: new AsyncParallelHook_1(["VuxtraBoot"]),
            startSocketserver: new AsyncParallelHook_1(["VuxtraBoot"]),
            readySocketserver: new AsyncParallelHook_1(["VuxtraBoot"]),
            failSocketserver: new AsyncParallelHook_1(['VuxtraBoot', 'data']),
            readySocketserverWorkerCluster: new AsyncParallelHook_1(['VuxtraBoot']),
            vuxtraBuilt: new AsyncParallelHook_1(['VuxtraBoot']),
            nuxtBuilt: new AsyncParallelHook_1(['VuxtraBoot']),
            vuxtraStarted: new AsyncParallelHook_1(['VuxtraBoot'])
        };

        this.startupStatus = 'INIT';
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

            _this.startSocketCluster(port, host);
        })();
    }

    startProd(port = 3000, host = 'localhost') {}

    startSocketCluster(port = 3000, host = 'localhost') {

        debug(`Starting: SOCKETCLUSTER on ${host}:${port}`);
        var optionsControllerPath = process.env.SOCKETCLUSTER_OPTIONS_CONTROLLER;
        var masterControllerPath = __dirname + '/sccMaster.js';
        var workerControllerPath = __dirname + '/sccWorker.js';
        var brokerControllerPath = __dirname + '/sccBroker.js';
        var initControllerPath = process.env.SOCKETCLUSTER_INIT_CONTROLLER;
        var workerClusterControllerPath = process.env.SOCKETCLUSTER_WORKERCLUSTER_CONTROLLER;

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
            var socketCluster = new socketcluster.SocketCluster(startOptions);
            this.hooks.startSocketserver.promise(this);
            this.startupStatus = startupStatus.startSocketserver;

            socketCluster.on('ready', workerClusterInfo => {
                this.hooks.readySocketserver.promise(this);
                this.startupStatus = startupStatus.readySocketserver;
            });

            socketCluster.on('workerClusterReady', workerClusterInfo => {
                this.hooks.readySocketserverWorkerCluster.promise(this);
                this.startupStatus = startupStatus.readySocketserverWorkerCluster;
            });

            socketCluster.on('fail', workerClusterInfo => {
                this.hooks.failSocketserver.promise(this);
                this.startupStatus = startupStatus.failSocketserver;
            });

            socketCluster.on('workerMessage', (id, data) => {
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
                        }
                    } else if (data.type === 'error') {
                        this.hooks.failSocketserver.promise(this, data);
                        this.startupStatus = startupStatus.failSocketserver;
                    }
                }
            });

            if (masterControllerPath) {
                runMasterController(socketCluster, masterControllerPath);
            } else {
                var defaultMasterControllerPath = './sccMaster.js';
                fileExists(defaultMasterControllerPath, exists => {
                    if (exists) {
                        runMasterController(socketCluster, defaultMasterControllerPath);
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
            return new Promise((resolve$$1, reject) => {
                if (!filePath) {
                    resolve$$1();
                    return;
                }
                var checkIsReady = () => {
                    var now = Date.now();

                    fileExists(filePath, exists => {
                        if (exists) {
                            resolve$$1();
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

'use strict'

// const requireSoSlow = require('require-so-slow')
require('v8-compile-cache')
const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const ProgressBarPlugin = require('webpack-simple-progress-plugin')
const prerender = require('./prerender')
// const ReplacePlugin = require('webpack-plugin-replace')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
//const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
const replaceBuffer = require('replace-buffer')
const ErrorOverlayPlugin = require('error-overlay-webpack-plugin')
// const Critters = require('critters-webpack-plugin')
const glob = require('fast-glob')
const PurgecssPlugin = require('purgecss-webpack-plugin')

//const WebpackDeepScopeAnalysisPlugin = require('webpack-deep-scope-plugin').default
const ShakePlugin = require('webpack-common-shake').Plugin
const pureFuncs = require('side-effects-safe').pureFuncsWithUnusualException // pureFuncsWithUsualException

// const WebpackMonitor = require('webpack-monitor')
// const AutoDllPlugin = require('autodll-webpack-plugin')
// const PrepackWebpackPlugin = require('prepack-webpack-plugin').default

// Profiling
// const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
// const smp = new SpeedMeasurePlugin({ granularLoaderData: false })

const ENV = process.env.NODE_ENV || 'development'
const isProd = ENV === 'production'
const STATS = process.env.STATS_ENABLE !== undefined ? !!process.env.STATS_ENABLE : false // @TODO: Enable for stats

const babelConfig = require('./babelConfig')(isProd, { modules: false })

// by using min versions we speed up HMR
function getMin(module) {
	return path.resolve(__dirname, `node_modules/${module}/dist/${module.replace('js', '')}.min.js`)
}
const nerv = isProd ? 'nervjs' : getMin('nervjs') // around 20 KB smaller bundle in prod

const html = {
	title: 'Improved Layout for Instagram',
	template: 'index.ejs',
	alwaysWriteToDisk: true,
	cache: true,
	inject: isProd ? false : 'head',
	minify: isProd
		? {
				removeComments: false,
				collapseWhitespace: true,
				removeRedundantAttributes: false,
				useShortDoctype: false,
				removeEmptyAttributes: false,
				removeStyleLinkTypeAttributes: true,
				removeScriptTypeAttributes: true,
		  }
		: false,
	// hash: true,
	ssr: params => {
		return isProd ? prerender('dist', params) : ''
	}, // @TODO: Replace with https://github.com/GoogleChromeLabs/prerender-loader
}

const plugins = [
	new ProgressBarPlugin({
		messageTemplate:
			'\u001B[90m\u001B[49m\u001B[39m [:bar] \u001B[32m\u001B[1m:percent\u001B[22m\u001B[39m (:elapseds) \u001B[2m:msg\u001B[22m',
		progressOptions: {
			renderThrottle: 100,
			clear: true,
		},
	}),
	new HtmlWebpackPlugin(html),
	new CopyWebpackPlugin([
		{ from: '*.html' },
		{
			from: '*.json',
			transform: (content, path) => {
				if (path.indexOf('manifest.json') === -1 || !isProd) return content

				return replaceBuffer(
					content,
					"script-src 'self' 'unsafe-eval' http://localhost:8080; object-src 'self'",
					"script-src 'self'; object-src 'self'"
				)
			},
		},
		{ from: 'img/*.png' },
		{ from: 'content/*' },
		{ from: '_locales/**' },
		{ from: '../CHANGELOG.md' },
	]),
]

if (isProd) {
	pureFuncs.push(
		'classCallCheck',
		'_classCallCheck',
		'_possibleConstructorReturn',
		'Object.freeze',
		'invariant',
		'classnames',
		'value-equal',
		'valueEqual',
		'resolve-pathname',
		'resolvePathname',
		'warning',
		'proptypes'
	)

	plugins.push(
		new webpack.HashedModuleIdsPlugin(),
		new DuplicatePackageCheckerPlugin({
			emitError: true,
			verbose: true,
			showHelp: true,
			strict: true,
		}),
		// new webpack.IgnorePlugin(/prop-types$/),
		new MiniCssExtractPlugin('main.css'),
		// new Critters(),
		// strip out babel-helper invariant checks
		/*new ReplacePlugin({
			patterns: [
				{
					regex: /throw\s+(new\s+)?(Type|Reference)?Er{2}or\s*\(/g,
					value: 'return;(',
				},
				{
					regex: /"use strict"/g,
					value: '',
				},
				{
					regex: /(e=>/,
					value: '("use strict";e=>',
				},
			],
		}),*/
		/*new PrepackWebpackPlugin({
			prepack: { delayUnsupportedRequires: true, abstractEffectsInAdditionalFunctions: true, reactEnabled: true },
		}), // 04.05.18: Not compatible with Webpack 4; 28.01.2018: Error: PP0001: This operation is not yet supported on document at createAttributeNS at 1:49611 to 1:49612
		*/
		//new PurgecssPlugin({
		//	paths: glob.sync([`${path.join(__dirname, 'src')}/**/*`, `${path.join(__dirname, 'dist')}/**/*`], {
		//		onlyFiles: true,
		//		ignore: ['content/*'],
		//	}),
		//	whitelistPatterns: [/col-/, /btn-warning/, /btn-secondary/],
		//}),  // @todo: Breaks the img[src=''] code 27/10/2018
		new ShakePlugin(),
		//new WebpackDeepScopeAnalysisPlugin(), // @todo: 25/10/2018 - doesn't reduce bundle size
		new BundleAnalyzerPlugin({
			analyzerMode: 'static',
			openAnalyzer: false,
			reportFilename: '../report.html',
		}),
		/*new WebpackMonitor({
			capture: true,
			launch: true,
			target: '../stats.json',
		}),*/
		/*new AutoDllPlugin({ // disabled as per https://github.com/mzgoddard/hard-source-webpack-plugin/issues/251
			inject: true, // will inject the DLL bundles to index.html
			filename: '[name]_[hash].js',
			entry: {
				vendor: ['nervjs', 'nerv-devtool', 'decko'],
			},
		}),*/
		new ZipPlugin({ filename: 'dist.zip', path: '../', exclude: 'ssr-bundle.js' })
	)
} else {
	plugins.push(
		new HtmlWebpackHarddiskPlugin({
			outputPath: path.resolve(__dirname, 'dist'),
		}),
		new FriendlyErrorsPlugin(),
		new CaseSensitivePathsPlugin(),
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new ErrorOverlayPlugin(),
		/*new AutoDllPlugin({ // disabled as per https://github.com/mzgoddard/hard-source-webpack-plugin/issues/251
			inject: true, // will inject the DLL bundles to index.html
			filename: '[name]_[hash].js',
			entry: {
				vendor: ['nervjs', 'nerv-devtool', 'decko'],
			},
		}),*/
		new WriteFilePlugin({
			test: /(content\/|manifest.json)/,
			log: false,
		})
	)
}

/*plugins.push(
	new HardSourceWebpackPlugin({
		cacheDirectory: '../node_modules/.cache/hard-source/[confighash]',
	})
) // @todo: Broken 25/10/2018, breaks repeated builds */

const first = {
	mode: isProd ? 'production' : 'development',

	context: path.join(__dirname, 'src'),

	entry: ['./index.js'],

	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: isProd ? '' : 'http://localhost:8080/',
		filename: 'bundle.js',
		pathinfo: false, // @todo: check if false does impact development
		//devtoolModuleFilenameTemplate: info => (isProd ? path.relative('/', info.absoluteResourcePath) : `webpack:///${info.resourcePath}`),
	},

	recordsPath: path.resolve(__dirname, './records.json'),

	optimization: isProd
		? {
				minimizer: [
					new TerserPlugin({
						cache: true,
						sourceMap: !isProd,
						terserOptions: {
							ecma: 8,
							compress: {
								pure_funcs: pureFuncs,
								hoist_funs: true,
								keep_infinity: true,

								arguments: true, // test
								unsafe: true, // test
								unsafe_arrows: true, // @fixme: Breaks report.html
								unsafe_methods: true,
								unsafe_Function: true,
								unsafe_proto: true,
								unsafe_regexp: true,
								unsafe_undefined: true,
								negate_iife: false,
							},
							output: {
								comments: false,
								semicolons: false, // size before gzip could be smaller; size after gzip insignificantly larger
								wrap_iife: true,
							},
							toplevel: true,
						},
						parallel: true,
					}),
				],
				splitChunks: {
					cacheGroups: {
						styles: {
							name: 'main',
							chunks: 'all',
							enforce: true,
							test: module => {
								return module.nameForCondition && /\.cs{2}$/.test(module.nameForCondition()) && module.type.startsWith('javascript')
							},
						},
					},
				},
		  }
		: {
				splitChunks: {
					cacheGroups: {
						commons: {
							chunks: 'initial',
							minChunks: 2,
						},
						vendor: {
							test: /node_modules/,
							chunks: 'initial',
							name: 'vendor',
							priority: 10,
							enforce: true,
						},
					},
				},
		  },

	module: {
		rules: [
			{
				test: /\.jsx?$/i,
				exclude: /node_modules/,
				loader: 'babel-loader?cacheDirectory',
				options: babelConfig,
			},
			{
				test: /\.cs{2}$/, // .css
				use: isProd ? [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'] : ['style-loader', 'css-loader'],
			},
		],
		noParse: isProd
			? undefined
			: [
					// faster HMR
					new RegExp(nerv),
					new RegExp('proptypes/disabled'),
			  ],
	},

	resolve: {
		alias: {
			react: nerv,
			'react-dom': nerv,
			'create-react-class': 'nerv-create-class',
			'prop-types$': 'proptypes/disabled',
		},
	},

	devtool: isProd ? false /*'source-map'*/ /* 'cheap-module-source-map'*/ : 'cheap-module-source-map', //'nosources-source-map', // + map Chrome Dev Tools workspace to your local folder

	plugins,

	performance: {
		hints: isProd ? 'warning' : false,
	},

	node: false,

	stats:
		isProd && STATS
			? {
					reasons: true,
			  }
			: {}, // can't be 'none' as per parallel-webpack

	devServer: undefined,
}

if (!isProd)
	first.devServer = {
		contentBase: path.join(__dirname, 'dist/'),
		publicPath: 'http://localhost:8080/',
		compress: false,
		overlay: {
			warnings: true,
			errors: true,
		},
		watchContentBase: false,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
		},
		hotOnly: true,
	}

const second = {
	mode: first.mode,

	target: 'node',

	entry: ['./components/App'],

	recordsPath: path.resolve(__dirname, './records_html.json'),

	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'ssr-bundle.js',
		libraryTarget: 'commonjs2',
	},

	context: first.context,
	module: first.module,
	resolve: first.resolve,
}

// @TODO: https://blog.box.com/blog/how-we-improved-webpack-build-performance-95/
// requireSoSlow.write('require-trace.trace')
// module.exports = isProd ? [smp.wrap(first), second] : first
module.exports = isProd ? [first, second] : first

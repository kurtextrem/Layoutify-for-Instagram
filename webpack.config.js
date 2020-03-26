'use strict'

// const requireSoSlow = require('require-so-slow')
require('v8-compile-cache')
const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
	.BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const ProgressBarPlugin = require('webpack-simple-progress-plugin')
const prerender = require('./prerender')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ErrorOverlayPlugin = require('error-overlay-webpack-plugin')
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve')

// const Critters = require('critters-webpack-plugin')
const glob = require('fast-glob')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const PurgecssPlugin = require('purgecss-webpack-plugin')

// const ReplacePlugin = require('webpack-plugin-replace')
const replaceBuffer = require('replace-buffer')
//const WebpackDeepScopeAnalysisPlugin = require('webpack-deep-scope-plugin').default
const ShakePlugin = require('webpack-common-shake').Plugin
const pureFuncs = require('side-effects-safe').pureFuncsWithUnusualException // pureFuncsWithUsualException

// const { DuplicatesPlugin } = require('inspectpack/plugin')
//const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
// const WebpackMonitor = require('webpack-monitor')
// const AutoDllPlugin = require('autodll-webpack-plugin')
// const PrepackWebpackPlugin = require('prepack-webpack-plugin').default

// Profiling
// const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
// const smp = new SpeedMeasurePlugin({ granularLoaderData: false })
// const CpuProfilerWebpackPlugin = require('cpuprofile-webpack-plugin');

const ENV = process.env.NODE_ENV || 'development'
const isProduction = ENV === 'production'
const STATS =
	process.env.STATS_ENABLE !== undefined ? !!process.env.STATS_ENABLE : false // @TODO: Enable for stats

const html = {
	alwaysWriteToDisk: true,
	cache: true,
	inject: isProduction ? false : 'head',
	minify: isProduction
		? {
				collapseWhitespace: true,
				removeComments: false,
				removeEmptyAttributes: false,
				removeRedundantAttributes: false,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: false,
		  }
		: false,
	ssr: (params) => {
		return isProduction ? prerender('dist', params) : ''
	},
	template: 'index.ejs',
	// hash: true,
	title: 'Improved Layout for Instagram', // @TODO: Replace with https://github.com/GoogleChromeLabs/prerender-loader
}

const plugins = [
	new ProgressBarPlugin({
		messageTemplate:
			'[:bar] \u001B[32m\u001B[1m:percent\u001B[22m\u001B[39m (:elapseds) \u001B[2m:msg\u001B[22m',
		progressOptions: {
			clear: true,
			complete: '=',
			incomplete: ' ',
			renderThrottle: 112,
		},
	}),
	new HtmlWebpackPlugin(html),
	new MiniCssExtractPlugin('main.css'),
	new CopyWebpackPlugin([
		{ from: '*.html' },
		{
			from: '*.json',
			transform: (content, path) => {
				if (!path.includes('manifest.json') || !isProduction) return content

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

if (isProduction) {
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
		new webpack.HashedModuleIdsPlugin(), // @TODO Remove @ webpack5
		/*new DuplicatePackageCheckerPlugin({
			emitError: true,
			verbose: true,
			showHelp: true,
			strict: true,
		}),
		new DuplicatesPlugin({
			// Emit compilation warning or error? (Default: `false`)
			emitErrors: false,
			// Display full duplicates information? (Default: `false`)
			verbose: false,
		}),*/
		// new webpack.IgnorePlugin(/prop-types$/),
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
		new OptimizeCssAssetsPlugin({
			cssProcessorPluginOptions: {
				preset: [
					'advanced',
					{
						discardComments: {
							removeAll: true,
						},
					},
				],
			},
		}),
		new PurgecssPlugin({
			paths: glob.sync([`src/**`, `dist/**`], {
				ignore: ['content/*'],
				onlyFiles: true,
			}),
			whitelistPatterns: [/col-/, /btn-warning/, /btn-secondary/],
		}),
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
		new ZipPlugin({
			exclude: 'ssr-bundle.js',
			filename: 'dist.zip',
			path: '../',
		})
	)
} else {
	const options = {
		host: 'localhost',
		middleware: (app, builtins) =>
			app.use(async (context, next) => {
				await next()
				context.set('Access-Control-Allow-Origin', '*')
				context.set(
					'Access-Control-Allow-Methods',
					'GET, POST, PUT, DELETE, PATCH, OPTIONS'
				)
				context.set(
					'Access-Control-Allow-Headers',
					'X-Requested-With, content-type, Authorization'
				)
			}),
		port: 8080,
		static: path.join(__dirname, 'dist'),
	}

	plugins.push(
		new HtmlWebpackHarddiskPlugin({
			outputPath: path.resolve(__dirname, 'dist'),
		}),
		new FriendlyErrorsPlugin(),
		new CaseSensitivePathsPlugin(),
		new webpack.NamedModulesPlugin(),
		new Serve(options),
		/*new AutoDllPlugin({ // disabled as per https://github.com/mzgoddard/hard-source-webpack-plugin/issues/251
			inject: true, // will inject the DLL bundles to index.html
			filename: '[name]_[hash].js',
			entry: {
				vendor: ['nervjs', 'nerv-devtool', 'decko'],
			},
		}),*/
		new WriteFilePlugin({
			log: false,
			test: /(content\/|manifest.json)/,
		})
	)
}

/*plugins.push(
	new HardSourceWebpackPlugin({
		cacheDirectory: '../node_modules/.cache/hard-source/[confighash]',
	})
)*/

const first = {
	context: path.join(__dirname, 'src'),

	devServer: undefined,

	devtool: isProduction
		? false /*'source-map'*/ /* 'cheap-module-source-map'*/
		: 'inline-module-source-map',

	entry: isProduction
		? ['./index.js']
		: ['./index.js', 'webpack-plugin-serve/client'],

	mode: isProduction ? 'production' : 'development',

	module: {
		noParse: isProduction
			? undefined
			: [
					// faster HMR
					//new RegExp(nerv),
					new RegExp('proptypes/disabled'),
			  ],
		rules: [
			{
				exclude: /node_modules/,
				loader: 'babel-loader?cacheDirectory',
				test: /\.jsx?$/i,
			},
			{
				test: /\.cs{2}$/, // .css
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hmr: !isProduction,
						},
					},
					'css-loader',
				],
			},
		],
	},

	node: isProduction ? false : undefined,

	optimization: isProduction
		? {
				minimizer: [
					new TerserPlugin({
						cache: true,
						extractComments: false,
						sourceMap: !isProduction,
						terserOptions: {
							compress: {
								arguments: true,
								hoist_funs: true,
								keep_infinity: true,

								negate_iife: false, // test
								pure_funcs: pureFuncs, // test
								unsafe: true, // @fixme: Breaks report.html
								unsafe_arrows: true,
								unsafe_Function: true,
								unsafe_methods: true,
								unsafe_proto: true,
								unsafe_regexp: true,
								unsafe_undefined: true,
							},
							ecma: 8,
							output: {
								comments: false,
								semicolons: false, // size before gzip could be smaller; size after gzip insignificantly larger
								wrap_iife: true,
							},
							toplevel: true,
						},
					}),
				],
				splitChunks: {
					cacheGroups: {
						styles: {
							chunks: 'all',
							enforce: true,
							name: 'main',
							test: (module) => {
								return (
									module.nameForCondition &&
									/\.cs{2}$/.test(module.nameForCondition()) &&
									module.type.startsWith('javascript')
								)
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
							chunks: 'initial',
							enforce: true,
							name: 'vendor',
							priority: 10,
							test: /node_modules/,
						},
					},
				},
		  },

	output: {
		filename: 'bundle.js',
		path: path.join(__dirname, 'dist'),
		pathinfo: false,
		publicPath: isProduction ? '' : 'http://localhost:8080/', // @todo: check if false does impact development
		//devtoolModuleFilenameTemplate: info => (isProd ? path.relative('/', info.absoluteResourcePath) : `webpack:///${info.resourcePath}`),
	},

	performance: {
		hints: isProduction ? 'warning' : false,
	}, //'nosources-source-map',

	plugins,

	recordsPath: path.resolve(__dirname, './records.json'),

	resolve: {
		alias: isProduction
			? {
					'create-react-class': 'preact-compat/lib/create-react-class',
					'prop-types$': 'proptypes/disabled',
					react: 'preact/compat',
					'react-dom': 'preact/compat',
					'react-dom/test-utils': 'preact/test-utils',
					'react-dom-factories': 'preact-compat/lib/react-dom-factories',
			  }
			: {
					'create-react-class': 'preact-compat/lib/create-react-class',
					react: 'preact/compat',
					'react-dom': 'preact/compat',
					'react-dom/test-utils': 'preact/test-utils',
					'react-dom-factories': 'preact-compat/lib/react-dom-factories',
			  },
	},

	stats:
		isProduction && STATS
			? {
					reasons: true,
			  }
			: {}, // can't be 'none' as per parallel-webpack

	watch: !isProduction,
}

const second = {
	context: first.context,

	entry: ['./components/App'],

	mode: 'development',

	module: first.module,

	output: {
		filename: 'ssr-bundle.js',
		libraryTarget: 'commonjs2',
		path: path.join(__dirname, 'dist'),
	},

	recordsPath: path.resolve(__dirname, './records_html.json'),
	resolve: first.resolve,
	target: 'node',
}

// @TODO: https://blog.box.com/blog/how-we-improved-webpack-build-performance-95/
// requireSoSlow.write('require-trace.trace')
// module.exports = isProd ? [smp.wrap(first), second] : first
module.exports = isProduction ? [first, second] : first

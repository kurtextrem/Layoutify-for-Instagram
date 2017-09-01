'use strict'

const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const errorOverlayMiddleware = require('react-error-overlay/middleware')
const ProgressBarPlugin = require('webpack-simple-progress-plugin')
const prerender = require('./prerender')
const ShakePlugin = require('webpack-common-shake').Plugin
const pureFuncs = require('side-effects-safe').pureFuncs
const ReplacePlugin = require('webpack-plugin-replace')
const WebpackMessages = require('webpack-messages')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OmitJSforCSSPlugin = require('webpack-omit-js-for-css-plugin')
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin')
// const PrepackWebpackPlugin = require('prepack-webpack-plugin').default

const ENV = process.env.NODE_ENV || 'development'
const isProd = ENV === 'production'

const babelConfig = require('./babelConfig')(isProd, { modules: false })
babelConfig.cacheDirectory = true

// by using min versions we speed up HMR
function getMin(module) {
	return path.resolve(__dirname, `node_modules/${module}/dist/${module}.min.js`)
}
const preactCompat = isProd ? 'preact-compat' : getMin('preact-compat') // if we take the min build in prod we also include prop-types

var html = {
	title: 'Improved Layout for Instagram',
	template: 'index.ejs',
	alwaysWriteToDisk: true,
	inject: true,
	ssr: params => (isProd ? prerender('dist', params) : ''),
}

if (isProd) {
	html.minify = {
		removeComments: true,
		collapseWhitespace: true,
		removeRedundantAttributes: true,
		useShortDoctype: true,
		removeEmptyAttributes: true,
		removeStyleLinkTypeAttributes: true,
		removeScriptTypeAttributes: true,
		keepClosingSlash: true,
		minifyJS: true,
		minifyCSS: true,
		minifyURLs: true,
	}
	// html.hash = true
}

var plugins = [
	new WebpackMessages(),
	new ProgressBarPlugin({
		messageTemplate:
			'\u001b[90m\u001b[49m\u001b[39m [:bar] \u001b[32m\u001b[1m:percent\u001b[22m\u001b[39m (:elapseds) \u001b[2m:msg\u001b[22m',
		progressOptions: {
			renderThrottle: 100,
			clear: true,
		},
	}),
	new webpack.DefinePlugin({
		'process.env': JSON.stringify({ NODE_ENV: ENV }), // Preact checks for `!process.env`
		'process.env.NODE_ENV': JSON.stringify(ENV),
		'typeof window': JSON.stringify('object'),
		'typeof process': JSON.stringify('object'), // Preact checks for `type process === 'undefined'`
		POLYFILL_OBJECT_ASSIGN: false,
		POLYFILL_OBJECT_VALUES: false,
		POLYFILL_PROMISES: false,
		POLYFILL_FETCH: false,
		POLYFILL_URL: false,
	}),
	new HtmlWebpackPlugin(html),
	new HtmlWebpackHarddiskPlugin(),
	new ScriptExtHtmlWebpackPlugin({
		defaultAttribute: 'async',
		preload: ['.js', '.css'],
	}),
	new CopyWebpackPlugin([{ from: '*.html' }, { from: '*.json' }, { from: 'img/*.png' }, { from: 'content/*' }, { from: '_locales/**' }]),
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
		// new webpack.IgnorePlugin(/prop-types$/),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
			debug: false,
		}),
		new OmitJSforCSSPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		new ExtractTextPlugin('styles.css'),
		new StyleExtHtmlWebpackPlugin(),
		new ShakePlugin(),
		new webpack.optimize.ModuleConcatenationPlugin(),
		// strip out babel-helper invariant checks
		new ReplacePlugin({
			include: /babel-helper$/,
			patterns: [
				{
					regex: /throw\s+(new\s+)?(Type|Reference)?Error\s*\(/g,
					value: s => `return;${Array(s.length - 7).join(' ')}(`,
				},
			],
		}),
		new UglifyJSPlugin({
			parallel: {
				cache: true,
			},
			sourceMap: true,
			uglifyOptions: {
				ecma: 6,
				mangle: true,
				compress: {
					arrows: false,
					ecma: 6,
					unsafe_comps: true,
					properties: true,
					keep_fargs: false,
					pure_getters: true,
					collapse_vars: true,
					reduce_vars: true,
					unsafe: true,
					warnings: false,
					dead_code: true,
					drop_debugger: true,
					comparisons: true,
					conditionals: true,
					evaluate: true,
					booleans: true,
					loops: true,
					unused: true,
					hoist_funs: true,
					if_return: true,
					join_vars: true,
					cascade: true,
					drop_console: false,
					negate_iife: true,
					passes: 2,
					pure_funcs: pureFuncs,
				},
			},
		}),
		// new PrepackWebpackPlugin({ prepack: { delayUnsupportedRequires: true } }), // doesn't support `class` yet
		new BundleAnalyzerPlugin({
			analyzerMode: 'static',
			openAnalyzer: false,
			reportFilename: '../report.html',
		}),
		new ZipPlugin({ filename: 'dist.zip', path: '../', exclude: 'ssr-bundle.js' })
	)
} else {
	plugins.push(
		new FriendlyErrorsPlugin(),
		new CaseSensitivePathsPlugin(),
		new webpack.NamedModulesPlugin(),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'manifest',
			filename: 'bundle1.js',
			minChunks: Infinity,
		}),
		new WriteFilePlugin({
			test: /(content\/|manifest.json)/,
			log: false,
		})
	)
}

const first = {
	context: path.join(__dirname, 'src'),

	entry: isProd
		? './'
		: [
				// 'react-error-overlay',
				'webpack/hot/only-dev-server',
				// 'react-dev-utils/webpackHotDevClient',
				// bundle the client for hot reloading
				// only- means to only hot reload for successful updates
				'./',
			],

	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: isProd ? '/' : 'http://localhost:8080/',
		filename: 'bundle.js',
		pathinfo: true,
		//devtoolModuleFilenameTemplate: info => (isProd ? path.relative('/', info.absoluteResourcePath) : `webpack:///${info.resourcePath}`),
	},

	module: {
		rules: [
			{
				test: /\.jsx?$/i,
				include: path.resolve(__dirname, 'src'),
				loader: 'babel-loader',
				options: babelConfig,
			},
			{
				test: /\.css$/,
				use: isProd
					? ExtractTextPlugin.extract({
							fallback: 'style-loader',
							use: ['css-loader', 'postcss-loader'],
						})
					: ['style-loader', 'css-loader'],
			},
		],
		noParse: isProd
			? undefined
			: [
					// faster HMR
					new RegExp(getMin('preact-compat')),
					new RegExp('proptypes/disabled'),
					new RegExp(getMin('preact')),
				],
	},

	resolve: {
		alias: {
			preact$: isProd ? 'preact' : getMin('preact'),
			react: preactCompat,
			'react-dom': preactCompat,
			'preact-compat': preactCompat,
			'react-addons-css-transition-group': isProd ? 'preact-css-transition-group' : getMin('preact-css-transition-group'),
			'react-addons-transition-group': isProd ? 'preact-transition-group' : getMin('preact-transition-group'),
			'react-transition-group': isProd ? 'preact-transition-group' : getMin('preact-transition-group'),
			'prop-types$': 'proptypes/disabled',
			'create-react-class': 'preact-compat/lib/create-react-class',
		},
	},

	devtool: isProd ? false /*'source-map'*/ /* 'cheap-module-source-map'*/ : 'cheap-module-source-map',

	devServer: {
		contentBase: path.join(__dirname, 'dist/'),
		compress: true,
		disableHostCheck: true,
		historyApiFallback: true,
		hot: true,
		// hotOnly: true,
		publicPath: '/',
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
		setup(app) {
			app.use(errorOverlayMiddleware())
		},
	},

	plugins,

	performance: {
		hints: isProd ? 'warning' : false,
	},

	node: isProd
		? {
				fs: false,
				net: false,
				tls: false,
				console: false,
				process: false,
				Buffer: false,
				__filename: false,
				__dirname: false,
				setImmediate: false,
			}
		: {},
}

const second = {
	target: 'node',

	entry: './components/App',

	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: '/',
		filename: 'ssr-bundle.js',
		libraryTarget: 'commonjs2',
	},

	context: first.context,
	module: first.module,
	resolve: first.resolve,
}

module.exports = isProd ? [first, second] : first

'use strict'

require('v8-compile-cache')
const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const ProgressBarPlugin = require('webpack-simple-progress-plugin')
const prerender = require('./prerender')
const pureFuncs = require('side-effects-safe').pureFuncs
const ReplacePlugin = require('webpack-plugin-replace')
const WebpackMessages = require('webpack-messages')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OmitJSforCSSPlugin = require('webpack-omit-js-for-css-plugin')
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
// const ShakePlugin = require('webpack-common-shake').Plugin
// const WebpackMonitor = require('webpack-monitor')
// const AutoDllPlugin = require('autodll-webpack-plugin')
// const PrepackWebpackPlugin = require('prepack-webpack-plugin').default

const ENV = process.env.NODE_ENV || 'development'
const isProd = ENV === 'production'

const babelConfig = require('./babelConfig')(isProd, { modules: false })
babelConfig.cacheDirectory = true

// by using min versions we speed up HMR
function getMin(module) {
	return path.resolve(__dirname, `node_modules/${module}/dist/${module.replace('js', '')}.min.js`)
}
const nerv = isProd ? 'nervjs' : getMin('nervjs') // around 20 KB smaller bundle in prod

const html = {
	title: 'Improved Layout for Instagram',
	template: 'index.ejs',
	alwaysWriteToDisk: true,
	inject: true,
	ssr: params => '<div id="react-root">' + (isProd ? prerender('dist', params) : '') + '</div>',
}

const plugins = [
	new WebpackMessages(),
	new ProgressBarPlugin({
		messageTemplate:
			'\u001B[90m\u001B[49m\u001B[39m [:bar] \u001B[32m\u001B[1m:percent\u001B[22m\u001B[39m (:elapseds) \u001B[2m:msg\u001B[22m',
		progressOptions: {
			renderThrottle: 100,
			clear: true,
		},
	}),
	new webpack.DefinePlugin({
		'process.env.NODE_ENV': JSON.stringify(ENV),
		'typeof window': JSON.stringify('object'),
		POLYFILL_OBJECT_ASSIGN: false,
		POLYFILL_OBJECT_VALUES: false,
		POLYFILL_PROMISES: false,
		POLYFILL_FETCH: false,
		POLYFILL_URL: false,
	}),
	new HtmlWebpackPlugin(html),
	new ScriptExtHtmlWebpackPlugin({
		preload: ['.js', '.css'],
	}),
	new CopyWebpackPlugin([{ from: '*.html' }, { from: '*.json' }, { from: 'img/*.png' }, { from: 'content/*' }, { from: '_locales/**' }]),
	new HardSourceWebpackPlugin({
		cacheDirectory: '../node_modules/.cache/hard-source/[confighash]',
	}),
]

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
		minifyURLs: true,
	}
	// html.hash = true

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
		//new ShakePlugin(), // https://github.com/indutny/webpack-common-shake/issues/23
		new webpack.optimize.ModuleConcatenationPlugin(),
		// strip out babel-helper invariant checks
		new ReplacePlugin({
			include: /babel-helper$/,
			patterns: [
				{
					regex: /throw\s+(new\s+)?(Type|Reference)?Er{2}or\s*\(/g,
					value: s => `return;${new Array(s.length - 7).join(' ')}(`,
				},
			],
		}),
		new UglifyJSPlugin({
			cache: true,
			parallel: true,
			sourceMap: true,
			uglifyOptions: {
				mangle: true,
				comments: false,
				compress: {
					arrows: false,
					booleans: false,
					collapse_vars: false,
					comparisons: false,
					computed_props: false,
					hoist_funs: false,
					hoist_props: false,
					hoist_vars: false,
					if_return: false,
					inline: false,
					join_vars: false,
					keep_infinity: true,
					loops: false,
					negate_iife: false,
					properties: false,
					reduce_funcs: false,
					reduce_vars: false,
					sequences: false,
					side_effects: false,
					switches: false,
					top_retain: false,
					toplevel: false,
					typeofs: false,
					unused: false,

					// Switch off all types of compression except those needed to convince
					// react-devtools that we're using a production build
					conditionals: true,
					dead_code: true,
					evaluate: true,

					pure_funcs: pureFuncs,
				},
			},
		}),
		// new PrepackWebpackPlugin({ prepack: { delayUnsupportedRequires: true } }), // 28.01.2018: Error: PP0001: This operation is not yet supported on document at createAttributeNS at 1:49611 to 1:49612
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
		new HtmlWebpackHarddiskPlugin(),
		new FriendlyErrorsPlugin(),
		new CaseSensitivePathsPlugin(),
		new webpack.NamedModulesPlugin(),
		/*new AutoDllPlugin({ // disabled as per https://github.com/mzgoddard/hard-source-webpack-plugin/issues/251
			inject: true, // will inject the DLL bundles to index.html
			filename: '[name]_[hash].js',
			entry: {
				vendor: ['nervjs', 'nerv-devtool', 'decko'],
			},
		}),*/
		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor',
			chunks: require('./vendor'),
			filename: 'bundle2.js',
			minChunks: Infinity,
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'manifest',
			filename: 'bundle1.js',
			minChunks: Infinity,
		}),
		new WriteFilePlugin({
			test: /(content\/|manifest.json)/,
			log: false,
		}),
		new webpack.HotModuleReplacementPlugin()
	)
}

const first = {
	//mode: isProd ? 'production' : 'development',

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
		publicPath: isProd ? '' : 'http://localhost:8080/',
		filename: 'bundle.js',
		pathinfo: true,
		//devtoolModuleFilenameTemplate: info => (isProd ? path.relative('/', info.absoluteResourcePath) : `webpack:///${info.resourcePath}`),
	},

	recordsPath: path.resolve(__dirname, './records.json'),

	/*optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					chunks: 'initial',
					test: path.resolve(__dirname, 'node_modules'),
					name: 'vendor',
					enforce: true,
				},
			},
		},
	},*/

	module: {
		rules: [
			{
				test: /\.jsx?$/i,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: babelConfig,
			},
			{
				test: /\.cs{2}$/, // .css
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

	devServer: {
		contentBase: path.join(__dirname, 'dist/'),
		publicPath: '/',
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
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
	//mode: first.mode,

	target: 'node',

	entry: './components/App',

	recordsPath: path.resolve(__dirname, './records_html.json'),

	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'ssr-bundle.js',
		libraryTarget: 'commonjs2',
	},

	context: first.context,
	module: first.module,
	resolve: first.resolve,
	plugins: [
		new webpack.DefinePlugin({
			'process.env': JSON.stringify({ NODE_ENV: ENV }), // Preact checks for `!process.env`
			'process.env.NODE_ENV': JSON.stringify(ENV),
			'typeof window': JSON.stringify('object'),
			'typeof process': JSON.stringify('object'), // Preact checks for `type process === 'undefined'`
		}),
	],
}

module.exports = isProd ? [first, second] : first

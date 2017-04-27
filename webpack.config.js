'use strict'

const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const V8LazyParseWebpackPlugin = require('v8-lazy-parse-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

const ENV = process.env.NODE_ENV
const isProd = ENV === 'production'

var html = {
	title: 'Improved Layout for Instagram',
	template: 'index.ejs',
	alwaysWriteToDisk: true
}

if (isProd) {
	html.minify = {}
	html.hash = true
}

var plugins = [
	new webpack.DefinePlugin({
		'process.env.NODE_ENV': JSON.stringify(ENV || 'development'),
		POLYFILL_OBJECT_ASSIGN: false,
		POLYFILL_OBJECT_VALUES: false,
		POLYFILL_PROMISES: false,
		POLYFILL_FETCH: false,
		POLYFILL_URL: false
	}),
	new HtmlWebpackPlugin(html),
	new CopyWebpackPlugin([
		{ from: '../node_modules/bootstrap/dist/css/bootstrap.min.css' },
		{ from: '*.html' },
		{ from: 'img/*.png' },
		{ from: 'content/*' },
		{ from: '_locales/**' }
	]),
	new HtmlWebpackHarddiskPlugin(),
	new ResourceHintWebpackPlugin(),
	new ScriptExtHtmlWebpackPlugin({ defaultAttribute: 'async' })
]

if (isProd) {
	plugins.push(
		new HtmlWebpackIncludeAssetsPlugin({
			assets: ['bootstrap.min.css'],
			append: false,
			hash: true
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
			debug: false
		}),
		new BundleAnalyzerPlugin({
			analyzerMode: 'static',
			openAnalyzer: false,
			reportFilename: '../report.html'
		}),
		new UglifyJSPlugin({ sourceMap: true }),
		new V8LazyParseWebpackPlugin(),
		new ZipPlugin({ filename: 'dist.zip', path: '../' })
	)
} else {
	plugins.push(
		new FriendlyErrorsPlugin(),
		new webpack.NamedModulesPlugin(),
		new HtmlWebpackIncludeAssetsPlugin({
			assets: ['bootstrap.min.css'],
			append: false
		})
	)
}

module.exports = {
	context: path.join(__dirname, 'src'),

	entry: isProd ? './' : [
		'webpack/hot/only-dev-server',
		// bundle the client for hot reloading
		// only- means to only hot reload for successful updates
		'./'
	],

	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: isProd ? '/' : 'http://localhost:8080',
		filename: 'bundle.js'
	},

	module: {
		rules: [
			{
				test: /\.jsx?$/i,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				options: {
					presets: [
						['env', {
							modules: false,
							targets: isProd ? { chrome: 49, uglify: true } : {
								browsers: 'last 2 Chrome versions'
							},
							loose: true
						}],
						'stage-1'
					],
					plugins: isProd ? [
						['transform-react-jsx', { pragma: 'h', useBuiltIns: true }],
						['transform-es2015-block-scoping', {
							throwIfClosureRequired: true
						}],
						'loop-optimizer',
						'transform-react-inline-elements',
						'transform-react-constant-elements',
						['transform-imports', {
							reactstrap: {
								transform: 'reactstrap/lib/${member}',
								preventFullImport: true
							},
							history: {
								transform: 'history/es/${member}',
								preventFullImport: true
							}
						}]
					] : [
							['transform-react-jsx', { pragma: 'h', useBuiltIns: true }]
						],
					cacheDirectory: true
				}
			}
		],
		noParse: [
			new RegExp(path.resolve(__dirname, 'node_modules/preact/dist/preact.min.js')),
			new RegExp(path.resolve(__dirname, 'node_modules/preact-compat/dist/preact-compat.min.js'))
		]
	},

	resolve: {
		alias: {
			react: 'preact-compat',
			'react-dom': 'preact-compat',
			'react-addons-css-transition-group': 'preact-css-transition-group',
			'react-addons-transition-group': 'preact-transition-group',
			preact: path.resolve(__dirname, 'node_modules/preact/dist/preact.min.js'),
			'preact-compat': path.resolve(__dirname, 'node_modules/preact-compat/dist/preact-compat.min.js')
		}
	},

	devtool: isProd ? false /*'cheap-module-source-map'*/ : 'cheap-module-source-map', //'inline-source-map',

	devServer: {
		contentBase: path.join(__dirname, 'dist/'),
		compress: true,
		historyApiFallback: true,
		hot: true,
		publicPath: '/',
		overlay: true,
		watchContentBase: false,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
		}
	},

	plugins
}

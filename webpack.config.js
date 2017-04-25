'use strict'

const path = require('path')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('zip-webpack-plugin')
const webpack = require('webpack')

const ENV = process.env.NODE_ENV
const isProd = ENV === 'production'

module.exports = {
	context: path.join(__dirname, 'src'),

	entry: [
		'webpack/hot/only-dev-server',
		// bundle the client for hot reloading
		// only- means to only hot reload for successful updates
		'./'
	],

	// where to dump the output of a production build
	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: '/',
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
						'transform-runtime'
					] : [
							['transform-react-jsx', { pragma: 'h' }]
						],
					cacheDirectory: true
				}
			}
		]
	},

	resolve: {
		alias: {
			react: 'preact-compat',
			'react-dom': 'preact-compat',
			'react-addons-css-transition-group': 'preact-css-transition-group',
			'react-addons-transition-group': 'preact-transition-group'
		}
	},

	devtool: isProd ? false /*'cheap-module-source-map'*/ : 'inline-source-map',

	devServer: {
		//contentBase: path.join(__dirname, 'src/'),
		compress: true,
		historyApiFallback: true,
		hot: true,
		publicPath: '/',
		overlay: true
	},

	plugins: isProd ? [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(ENV || 'development')
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
		new CopyWebpackPlugin([
			{ from: '*.html' },
			{ from: 'img/*.png' },
			{ from: 'content/*' },
			{ from: '_locales/**' }
		]),
		new webpack.optimize.UglifyJsPlugin({
			beautify: false,
			mangle: {
				screw_ie8: true
			},
			compress: {
				screw_ie8: true
			},
			comments: false
		}),
		new ZipPlugin({ filename: 'dist.zip', path: '../' })
	] : [
			new FriendlyErrorsPlugin(),
			new webpack.NamedModulesPlugin(),
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(ENV || 'development')
			})
		]
}

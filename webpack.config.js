const path = require('path')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const webpack = require('webpack')

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
	// entry file - starting point for the app
	entry: './src',

	// where to dump the output of a production build
	output: {
		path: path.join(__dirname, 'build'), // dist
		/*publicPath: '/dist/',
		filename: '[name].[chunkhash].js'*/
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
						["env", { "es2015": { "modules": false } }],
						"stage-1"
					],
					plugins: [
						['transform-react-jsx', { pragma: 'h' }],
						'transform-runtime'
					],
					cacheDirectory: true
				}
			}
		]
	},

	"resolve": {
		"alias": {
			"react": "preact-compat",
			"react-dom": "preact-compat",
			"react-addons-css-transition-group": "preact-css-transition-group",
			"react-addons-transition-group": "preact-transition-group"
		}
	},

	// enable Source Maps
	devtool: 'cheap-module-source-map',

	devServer: {
		// serve up any static files from src/
		contentBase: path.join(__dirname, 'src/'),

		// enable gzip compression:
		compress: false,

		// enable pushState() routing, as used by preact-router et al:
		historyApiFallback: true
	},

	plugins: isProd ? [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
		}), new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			}
		})] : [
			new FriendlyErrorsPlugin(),
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
			})
		]
};
'use strict'

const resolve = require.resolve

module.exports = (isProd, options = {}) => ({
	babelrc: false,
	comments: !isProd,
	presets: [
		[
			resolve('@babel/preset-env'),
			{
				modules: options.modules || false,
				targets: {
					browsers: isProd ? 'Chrome > 54' : 'unreleased Chrome versions',
				},
				loose: true,
				useBuiltIns: false,
				shippedProposals: true,
				exclude: [
					'transform-regenerator', // for fast-async
					'transform-typeof-symbol',
				],
			},
		],
	],
	plugins: isProd
		? [
				[resolve('@babel/plugin-transform-runtime'), { regenerator: false }],
				// Stage 0
				//require('@babel/plugin-proposal-function-bind'),

				// Stage 1
				require('@babel/plugin-proposal-export-default-from'),
				//require('@babel/plugin-proposal-logical-assignment-operators'),
				[require('@babel/plugin-proposal-optional-chaining'), { loose: true }],
				//[require('@babel/plugin-proposal-pipeline-operator'), { proposal: 'minimal' }],
				//[require('@babel/plugin-proposal-nullish-coalescing-operator'), { loose: true }],
				//require('@babel/plugin-proposal-do-expressions'),

				// Stage 2
				[require('@babel/plugin-proposal-decorators'), { legacy: true }],
				//require('@babel/plugin-proposal-function-sent'),
				require('@babel/plugin-proposal-export-namespace-from'),
				//require('@babel/plugin-proposal-numeric-separator'),
				require('@babel/plugin-proposal-throw-expressions'),

				// Stage 3
				require('@babel/plugin-syntax-dynamic-import'),
				require('@babel/plugin-syntax-import-meta'),
				[require('@babel/plugin-proposal-class-properties'), { loose: true }],
				require('@babel/plugin-proposal-json-strings'),
				[
					resolve('babel-plugin-transform-imports'),
					{
						reactstrap: {
							transform: 'reactstrap/lib/${member}',
							preventFullImport: true,
						},
					},
				],
				[
					resolve('babel-plugin-transform-react-remove-prop-types'),
					{ removeImport: true, additionalLibraries: ['react-immutable-proptypes'] },
				],
				resolve('babel-plugin-transform-react-pure-class-to-function'),
				[resolve('@babel/plugin-transform-react-jsx'), { pragma: 'createElement', useBuiltIns: true }],
				//resolve('@babel/plugin-transform-react-constant-elements'), // see https://github.com/facebookincubator/create-react-app/issues/553#issuecomment-359196326
				//[resolve('babel-plugin-transform-hoist-nested-functions'), { methods: true }], // see ^^^
				resolve('babel-plugin-closure-elimination'), // @TODO: Benchmark w/ & w/o, see ^^^

				// 'module:fast-async', - enabled from Chrome 55
				resolve('babel-plugin-annotate-pure-calls'),
				resolve('./pure-plugin.js'),
				[resolve('@babel/plugin-transform-strict-mode'), { strict: true }],
				// 'emotion/babel'
		  ]
		: [
				[resolve('@babel/plugin-transform-react-jsx'), { pragma: 'createElement', useBuiltIns: true }],
				resolve('@babel/plugin-transform-react-jsx-source'),
				resolve('babel-plugin-transform-console-log-variable-names'),
				resolve('babel-plugin-console-groupify'),
				[resolve('@babel/plugin-transform-strict-mode'), { strict: true }],
				// 'emotion/babel'
				// 'runtyper'
		  ],
})

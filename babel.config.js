'use strict'

module.exports = function(api) {
	//api.cache(true)
	api.cache.invalidate(() => process.env.NODE_ENV)

	const isProduction = api.env('production')

	return {
		babelrc: false,
		comments: !isProduction,
		presets: [
			[
				'@babel/preset-env',
				{
					modules: false, // options.modules
					targets: !isProduction
						? {
								browsers: 'unreleased Chrome versions',
						  }
						: undefined,
					loose: true,
					useBuiltIns: false,
					shippedProposals: true,
					exclude: [
						'transform-regenerator', // for fast-async
						'transform-typeof-symbol',
					],
				},
				//'babel-preset-minify',
			],
		],
		plugins: isProduction
			? [
					['@babel/plugin-transform-runtime', { regenerator: false }],
					// Stage 0
					//require('@babel/plugin-proposal-function-bind',

					// Stage 1
					'@babel/plugin-proposal-export-default-from',
					//'@babel/plugin-proposal-logical-assignment-operators',
					['@babel/plugin-proposal-optional-chaining', { loose: true }],
					//['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
					//['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
					//'@babel/plugin-proposal-do-expressions',

					// Stage 2
					['@babel/plugin-proposal-decorators', { legacy: true }],
					//'@babel/plugin-proposal-function-sent',
					'@babel/plugin-proposal-export-namespace-from',
					//'@babel/plugin-proposal-numeric-separator',
					'@babel/plugin-proposal-throw-expressions',

					// Stage 3
					'@babel/plugin-syntax-dynamic-import',
					'@babel/plugin-syntax-import-meta',
					['@babel/plugin-proposal-class-properties', { loose: true }],
					'@babel/plugin-proposal-json-strings',

					[
						'babel-plugin-transform-imports',
						{
							reactstrap: {
								transform: 'reactstrap/lib/${member}',
								preventFullImport: true,
							},
						},
					],
					[
						'babel-plugin-transform-react-remove-prop-types',
						{
							removeImport: true,
							additionalLibraries: ['react-immutable-proptypes'],
						},
					],
					'babel-plugin-transform-react-pure-class-to-function',
					[
						'@babel/plugin-transform-react-jsx',
						{ pragma: 'h', pragmaFrag: 'Fragment', useBuiltIns: true },
					],
					'babel-plugin-optimize-react',
					//'babel-plugin-react-local', // @todo: Broken 29/08/2019
					'babel-plugin-optimize-clsx',
					//'@babel/plugin-transform-react-constant-elements', // see https://github.com/facebookincubator/create-react-app/issues/553#issuecomment-359196326
					//['babel-plugin-transform-hoist-nested-functions', { methods: true }], // see ^^^
					'babel-plugin-closure-elimination', // @TODO: Benchmark w/ & w/o, see ^^^

					// 'module:fast-async', - enabled from Chrome 55
					'babel-plugin-annotate-pure-calls',
					'./pure-plugin.js',
					['@babel/plugin-transform-strict-mode', { strict: true }],
					// 'emotion/babel'
			  ]
			: [
					// Stage 0
					//'@babel/plugin-proposal-function-bind',

					// Stage 1
					'@babel/plugin-proposal-export-default-from',
					//'@babel/plugin-proposal-logical-assignment-operators',
					['@babel/plugin-proposal-optional-chaining', { loose: true }],
					//['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
					//['@babel/plugin-proposal-nullish-coalescing-operator', { loose: true }],
					//'@babel/plugin-proposal-do-expressions',

					// Stage 2
					['@babel/plugin-proposal-decorators', { legacy: true }],
					//'@babel/plugin-proposal-function-sent',
					'@babel/plugin-proposal-export-namespace-from',
					//'@babel/plugin-proposal-numeric-separator',
					'@babel/plugin-proposal-throw-expressions',

					// Stage 3
					'@babel/plugin-syntax-dynamic-import',
					'@babel/plugin-syntax-import-meta',
					['@babel/plugin-proposal-class-properties', { loose: true }],
					'@babel/plugin-proposal-json-strings',
					[
						'@babel/plugin-transform-react-jsx',
						{ pragma: 'h', pragmaFrag: 'Fragment', useBuiltIns: true },
					],
					'@babel/plugin-transform-react-jsx-source',
					'babel-plugin-transform-console-log-variable-names',
					'babel-plugin-console-groupify',
					['@babel/plugin-transform-strict-mode', { strict: true }],
					// 'emotion/babel'
					// 'runtyper'
			  ],
	}
}

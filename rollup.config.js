import typescript from '@rollup/plugin-typescript';
import tsconfig from './tsconfig.json' assert { type: 'json'}

export default [
	// CommonJS version, for Node, Browserify & Webpack
	{
		input: ['src/index.ts'],
		output: {
			dir: './',
			format: 'es'
		},
		plugins: [typescript(tsconfig)]
	}
];

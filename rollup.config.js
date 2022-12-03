import typescript from '@rollup/plugin-typescript';

export default [
	// CommonJS version, for Node, Browserify & Webpack
	{
		input: ['src/index.ts'],
		output: {
			dir: './dist',
			format: 'es'
		},
		plugins: [typescript({
			compilerOptions: {
				target: 'esnext'
			}
		})]
	}
];

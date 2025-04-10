import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-var-requires': 'off',
		},
	},
]; 
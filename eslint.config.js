const config = [
  {
    ignores: ['node_modules', '.next', 'out', 'dist', 'public'],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'warn',
    },
  },
]

try {
  const tseslint = await import('typescript-eslint')

  if (tseslint?.configs?.recommended) {
    config.push(
      ...tseslint.configs.recommended,
      {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
          ...(tseslint.configs.recommended[0]?.languageOptions ?? {}),
        },
        rules: {
          '@typescript-eslint/consistent-type-imports': 'off',
          '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/ban-ts-comment': 'off',
        },
      },
    )
  }
} catch {
  config[0].ignores.push('**/*.{ts,tsx}')
  console.warn('[eslint] `typescript-eslint` not found – TypeScript files are temporarily ignored. Install it with `pnpm add -D typescript-eslint`.')
}

try {
  const nextPlugin = await import('@next/eslint-plugin-next')
  if (nextPlugin?.default) {
    config.push({
      files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
      plugins: {
        '@next/next': nextPlugin.default,
      },
      rules: {
        ...nextPlugin.configs['core-web-vitals'].rules,
      },
    })
  }
} catch {
  console.warn('[eslint] `@next/eslint-plugin-next` not found – install with `pnpm add -D @next/eslint-plugin-next` for Next.js specific linting rules.')
}

export default config

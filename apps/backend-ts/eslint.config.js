// Flat config для ESLint v9
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Игнорируем сборочные папки
  { ignores: ['dist', 'node_modules'] },

  // Базовые правила JS
  js.configs.recommended,

  // Рекомендации для TypeScript (без type-checking)
  ...tseslint.configs.recommended,

  // Ваши настройки для .ts
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
      parserOptions: {
        // Если захотите включить type-aware правила — добавим project
        // project: ['./tsconfig.json'],
        // tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Место для ваших правил
    },
  },

  // Отключаем конфликтующие с Prettier правила
  prettier
);

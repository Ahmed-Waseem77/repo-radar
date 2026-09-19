/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), dts({
    include: ['src'],
    tsconfigPath: './tsconfig.app.json'
  }) // generates .d.ts files
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'MyComponentLibrary',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      // don't bundle react/mui into your library — the consuming app provides them.
      // '@mui/material/styles' (createTheme, styled, alpha, useColorScheme, ...) is a
      // separate import specifier from '@mui/material' and must be listed explicitly -
      // otherwise Rollup inlines its own copy instead of treating it as external, which
      // creates a second, disconnected instance of MUI's ColorSchemeContext: useColorScheme()
      // called from within the library then reads/writes state nothing else observes.
      external: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        '@mui/material',
        '@mui/material/styles',
        '@mui/material/colors',
        '@emotion/react',
        '@emotion/styled',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});

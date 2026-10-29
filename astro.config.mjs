import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  integrations: [icon()],
  output: 'static',
  compressHTML: true,
  build: {
    format: 'directory',
  },
});

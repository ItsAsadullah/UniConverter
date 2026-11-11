<script lang="ts">
  import Icon from './ui/Icon.svelte';
  import { getToolIconPalette, type StudioTool } from '../data/tools';

  let { tool }: { tool: StudioTool } = $props();
  let palette = $derived(getToolIconPalette(tool.color));
  let searchBlob = $derived(
    `${tool.title} ${tool.titleEn} ${tool.desc} ${tool.descEn} ${tool.keywords} ${tool.badge}`.toLowerCase()
  );
</script>

<article
  class="th-tool-card group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-2xs transition-colors duration-150 hover:shadow-md {palette.cardHover} hover:bg-slate-50/60 dark:hover:bg-studio-panel"
  data-tool-card
  data-tool-id={tool.id}
  data-cat={tool.categoryId}
  data-popular={tool.popular ? '1' : '0'}
  data-search={searchBlob}
>
  <a
    href={tool.href}
    class="th-tool-card__main flex flex-col flex-1 min-w-0 no-underline text-inherit after:content-[''] after:absolute after:inset-0 after:rounded-2xl"
    aria-label={tool.title}
  >
    <div class="flex items-start justify-between gap-2 mb-3.5">
      <span class="th-tool-card__icon w-11 h-11 rounded-xl {palette.iconWrap} inline-flex items-center justify-center shrink-0 shadow-2xs">
        <Icon name={tool.lucideIcon} class="w-5.5 h-5.5" />
      </span>
    </div>
    <div class="th-tool-card__body flex-1 min-w-0">
      <h3
        class="th-tool-card__title text-base font-bold text-slate-900 dark:text-studio-text m-0 mb-1.5 leading-snug"
        data-i18n-bn={tool.title}
        data-i18n-en={tool.titleEn}
      >
        {tool.title}
      </h3>
      <p
        class="th-tool-card__desc text-xs text-slate-500 dark:text-studio-muted m-0 leading-relaxed line-clamp-2"
        data-i18n-bn={tool.desc}
        data-i18n-en={tool.descEn}
      >
        {tool.desc}
      </p>
    </div>
  </a>

  <button
    type="button"
    class="th-tool-card__fav absolute top-4 right-4 z-10 w-8 h-8 rounded-lg border border-transparent bg-transparent text-slate-400 dark:text-slate-500 inline-flex items-center justify-center cursor-pointer opacity-60 group-hover:opacity-100 shrink-0 transition-colors hover:bg-slate-100 dark:hover:bg-studio-surface hover:text-amber-500"
    data-fav-btn={tool.id}
    title="পছন্দের তালিকায় রাখুন"
    aria-label="পছন্দের তালিকায় রাখুন"
    data-i18n-title-bn="পছন্দের তালিকায় রাখুন"
    data-i18n-title-en="Save to favorites"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  </button>
</article>

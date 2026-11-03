<script lang="ts">
  import Icon from './ui/Icon.svelte';
  import ToolCard from './ToolCard.svelte';
  import {
    getCategoryMeta,
    getToolsByCategory,
    getToolIconPalette,
    type CategoryId
  } from '../data/tools';

  let { categoryId }: { categoryId: CategoryId } = $props();
  let category = $derived(getCategoryMeta(categoryId));
  let categoryTools = $derived(getToolsByCategory(categoryId));
  let catPalette = $derived(getToolIconPalette(category.color));
</script>

<div class="w-full pb-8" data-directory-root>
  <!-- 1. CATEGORY HEADER & PROMINENT SEARCH BAR (TAILWIND v4) -->
  <section
    class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-2xs mb-6"
    aria-labelledby="catHeroTitle"
  >
    <div class="flex items-center gap-3.5 min-w-0">
      <span class="w-12 h-12 rounded-2xl {catPalette.iconWrap} flex items-center justify-center shrink-0 shadow-2xs">
        <Icon name={category.lucideIcon} class="w-6 h-6" />
      </span>
      <div class="min-w-0">
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1
            id="catHeroTitle"
            class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-studio-text m-0"
            data-i18n-bn={category.title}
            data-i18n-en={category.titleEn}
          >
            {category.title}
          </h1>
          <span
            class="text-xs font-bold px-2.5 py-0.5 rounded-full {catPalette.iconWrap}"
            data-dir-count
          >
            {categoryTools.length}
          </span>
        </div>
        <p
          class="text-sm text-slate-500 dark:text-studio-muted mt-0.5 mb-0 truncate"
          data-i18n-bn={category.desc}
          data-i18n-en={category.descEn}
        >
          {category.desc}
        </p>
      </div>
    </div>

    <div class="relative w-full md:w-[380px] lg:w-[440px] shrink-0">
      <span class="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-studio-muted">
        <Icon name="lucide:search" class="w-4.5 h-4.5" />
      </span>
      <input
        id="catSearchInput"
        type="search"
        data-dir-search
        class="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200/90 dark:border-studio-border text-slate-900 dark:text-studio-text text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-studio-muted outline-none focus:bg-white dark:focus:bg-studio-surface focus:border-emerald-500 dark:focus:border-studio-primary focus:ring-4 focus:ring-emerald-500/10 transition-all"
        placeholder="এই বিভাগের টুল খুঁজুন…"
        data-i18n-placeholder-bn="এই বিভাগের টুল খুঁজুন…"
        data-i18n-placeholder-en="Search tools in this workspace…"
        aria-label="Search tools in this workspace"
      />
    </div>
  </section>

  <!-- 2. CATEGORY TOOLS GRID -->
  <section aria-label={category.titleEn}>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {#each categoryTools as tool (tool.id)}
        <ToolCard {tool} />
      {/each}
    </div>

    <div data-dir-empty hidden class="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-studio-border text-slate-500 dark:text-studio-muted text-sm mt-3">
      <p data-i18n-bn="কোনো টুল পাওয়া যায়নি" data-i18n-en="No matching tools found">কোনো টুল পাওয়া যায়নি</p>
    </div>
  </section>
</div>

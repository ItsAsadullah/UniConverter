<script lang="ts">
  import Icon from './ui/Icon.svelte';
  import ToolCard from './ToolCard.svelte';
  import { CATEGORIES, ALL_TOOLS } from '../data/tools';

  const popularSearches = [
    { bn: 'বিজয় ⇄ ইউনিকোড', en: 'Bijoy ⇄ Unicode', query: 'বিজয়' },
    { bn: 'ডকুমেন্ট স্ক্যানার', en: 'Document Scanner', query: 'স্ক্যানার' },
    { bn: 'মার্জ PDF', en: 'Merge PDF', query: 'merge pdf' },
    { bn: 'ছবি রিসাইজ (300×300)', en: 'Photo Resize (300×300)', query: '300x300' },
    { bn: 'ইনভয়েস মেকার', en: 'Invoice Maker', query: 'ইনভয়েস' }
  ];
</script>

<div class="w-full pt-1 pb-8">
  <!-- 1. COMPACT HERO & UNIVERSAL SEARCH (TAILWIND v4) -->
  <section
    class="rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border px-6 py-8 text-center mb-6"
    aria-labelledby="heroHeading"
  >
    <h1
      id="heroHeading"
      class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-studio-text max-w-3xl mx-auto mb-4"
      data-i18n-bn="ডকুমেন্ট, পিডিএফ ও অফিস প্রোডাক্টিভিটি স্যুট"
      data-i18n-en="Document, PDF & Office Productivity Suite"
    >
      ডকুমেন্ট, পিডিএফ ও অফিস প্রোডাক্টিভিটি স্যুট
    </h1>

    <div class="max-w-2xl mx-auto mb-4">
      <button
        type="button"
        class="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-500 dark:text-studio-muted flex items-center gap-3 text-sm cursor-pointer hover:border-emerald-500 dark:hover:border-studio-primary transition-colors"
        data-open-search
        aria-label="Search tools (Ctrl+K)"
      >
        <Icon name="lucide:search" class="w-4.5 h-4.5 text-slate-400 shrink-0" />
        <span
          class="flex-1 text-left truncate"
          data-i18n-bn="যেকোনো টুল খুঁজুন (বিজয়, PDF, স্ক্যানার, রিসাইজ, ইনভয়েস)…"
          data-i18n-en="Search any tool (Bijoy, Merge PDF, Document Scanner, Resize, Invoice)…"
        >
          যেকোনো টুল খুঁজুন (বিজয়, PDF, স্ক্যানার, রিসাইজ, ইনভয়েস)…
        </span>
        <kbd class="text-xs font-semibold px-2.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-slate-500 dark:text-studio-muted shrink-0">Ctrl K</kbd>
      </button>
    </div>

    <div class="flex items-center justify-center flex-wrap gap-1.5" aria-label="Quick Launch">
      {#each popularSearches as item (item.query)}
        <button
          type="button"
          class="th-SearchChip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted no-underline text-xs font-medium cursor-pointer transition-colors hover:border-emerald-500/60 dark:hover:border-studio-primary hover:text-slate-900 dark:hover:text-studio-text"
          data-open-search
          data-search-prefill={item.query}
        >
          <span data-i18n-bn={item.bn} data-i18n-en={item.en}>{item.bn}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- 2. HORIZONTAL TABBED WORKSPACE (SIDE-BY-SIDE TABS) -->
  <section class="mb-6" data-directory-root data-default-tab="recent" aria-label="Tools Workspace">
    <!-- Horizontal Tab Bar -->
    <div class="flex items-center justify-between gap-2.5 flex-wrap mb-3.5 p-1.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border">
      <div class="flex items-center gap-1 overflow-x-auto max-w-full py-0.5" role="tablist" aria-label="Workspace Tabs">
        <button
          type="button"
          role="tab"
          class="th-dir-tab is-active inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
          data-dir-cat="recent"
          id="homeRecentTabBtn"
        >
          <Icon name="lucide:history" class="w-3.5 h-3.5 shrink-0" />
          <span data-i18n-bn="সাম্প্রতিক" data-i18n-en="Recently Used">সাম্প্রতিক</span>
        </button>

        <button
          type="button"
          role="tab"
          class="th-dir-tab inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
          data-dir-cat="popular"
        >
          <Icon name="lucide:zap" class="w-3.5 h-3.5 shrink-0" />
          <span data-i18n-bn="জনপ্রিয়" data-i18n-en="Popular">জনপ্রিয়</span>
        </button>

        {#each CATEGORIES as cat (cat.id)}
          <button
            type="button"
            role="tab"
            class="th-dir-tab inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
            data-dir-cat={cat.id}
          >
            <Icon name={cat.lucideIcon} class="w-3.5 h-3.5 shrink-0" />
            <span data-i18n-bn={cat.title} data-i18n-en={cat.titleEn}>{cat.title}</span>
          </button>
        {/each}

        <button
          type="button"
          role="tab"
          class="th-dir-tab inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
          data-dir-cat="all"
        >
          <Icon name="lucide:layout-grid" class="w-3.5 h-3.5 shrink-0" />
          <span data-i18n-bn="সব টুলস" data-i18n-en="All Tools">সব টুলস</span>
          <span class="text-[10.5px] opacity-75" data-dir-count>{ALL_TOOLS.length}</span>
        </button>
      </div>

      <div class="flex items-center gap-2 ml-auto shrink-0">
        <button
          type="button"
          id="clearRecentToolsBtn"
          hidden
          class="text-xs font-medium text-slate-400 hover:text-rose-500 bg-transparent border-0 cursor-pointer px-2 py-1"
          data-i18n-bn="তালিকা মুছুন"
          data-i18n-en="Clear Recent"
        >
          তালিকা মুছুন
        </button>

        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 dark:text-studio-muted">
            <Icon name="lucide:search" class="w-3.5 h-3.5" />
          </span>
          <input
            type="search"
            class="h-9 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-900 dark:text-studio-text text-xs sm:text-sm w-48 sm:w-64 outline-none focus:bg-white dark:focus:bg-studio-surface focus:border-emerald-500 dark:focus:border-studio-primary focus:ring-2 focus:ring-emerald-500/10 transition-all"
            data-dir-search
            placeholder="ফিল্টার করুন…"
            data-i18n-placeholder-bn="ফিল্টার করুন…"
            data-i18n-placeholder-en="Filter tools…"
            aria-label="Filter tools"
          />
        </div>
      </div>
    </div>

    <!-- Single Unified Tool Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4" id="homeTabbedGrid">
      {#each ALL_TOOLS as tool (tool.id)}
        <ToolCard {tool} />
      {/each}
    </div>

    <div data-dir-empty hidden class="py-8 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-studio-border text-slate-500 dark:text-studio-muted text-sm mt-2.5">
      <p data-i18n-bn="কোনো টুল পাওয়া যায়নি" data-i18n-en="No matching tools found">কোনো টুল পাওয়া যায়নি</p>
    </div>
  </section>
</div>

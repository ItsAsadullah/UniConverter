<script lang="ts">
  import Icon from './ui/Icon.svelte';
  import ToolCard from './ToolCard.svelte';
  import { CATEGORIES, ALL_TOOLS, getToolIconPalette } from '../data/tools';

  const popularSearches = [
    { bn: 'বিজয় ⇄ ইউনিকোড', en: 'Bijoy ⇄ Unicode', query: 'বিজয়' },
    { bn: 'ডকুমেন্ট স্ক্যানার', en: 'Document Scanner', query: 'স্ক্যানার' },
    { bn: 'মার্জ PDF', en: 'Merge PDF', query: 'merge pdf' },
    { bn: 'ছবি রিসাইজ (300×300)', en: 'Photo Resize (300×300)', query: '300x300' },
    { bn: 'ইনভয়েস মেকার', en: 'Invoice Maker', query: 'ইনভয়েস' }
  ];

  // ---------- Native-app (CamScanner-style) mobile home (< 1024px) ----------
  const QUICK_TOOLS = [
    { id: 'image-scan', bn: 'স্ক্যান', en: 'Scan', grad: 'from-blue-500 to-indigo-600' },
    { id: 'image-combine', bn: 'আইডি কার্ড', en: 'ID Card', grad: 'from-cyan-500 to-teal-600' },
    { id: 'image-passport', bn: 'পাসপোর্ট', en: 'Passport', grad: 'from-emerald-500 to-green-600' },
    { id: 'pdf-other-to-pdf', bn: 'ছবি→PDF', en: 'Img→PDF', grad: 'from-rose-500 to-pink-600' },
    { id: 'pdf-merge', bn: 'PDF মার্জ', en: 'Merge', grad: 'from-orange-500 to-red-500' },
    { id: 'pdf-compress', bn: 'কম্প্রেস', en: 'Compress', grad: 'from-amber-500 to-orange-500' },
    { id: 'bijoy-to-unicode', bn: 'বিজয়', en: 'Bijoy', grad: 'from-violet-500 to-purple-600' },
    { id: 'image-resize', bn: 'রিসাইজ', en: 'Resize', grad: 'from-fuchsia-500 to-pink-600' }
  ]
    .map((q) => ({ ...q, tool: ALL_TOOLS.find((t) => t.id === q.id) }))
    .filter((q) => q.tool);

  const CAT_GRADS: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    teal: 'from-teal-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    sky: 'from-sky-500 to-blue-600',
    cyan: 'from-cyan-500 to-teal-600',
    indigo: 'from-indigo-500 to-violet-600',
    violet: 'from-violet-500 to-purple-600',
    purple: 'from-purple-500 to-fuchsia-600',
    fuchsia: 'from-fuchsia-500 to-pink-600',
    rose: 'from-rose-500 to-pink-600',
    crimson: 'from-red-500 to-rose-600',
    amber: 'from-amber-500 to-orange-500',
    orange: 'from-orange-500 to-red-500'
  };
  const gradFor = (c?: string) => CAT_GRADS[c || 'blue'] || CAT_GRADS.blue;
</script>

<!-- ============================================================ NATIVE-APP MOBILE HOME (< 1024px) -->
<div class="lg:hidden -mx-3 -mt-3 pb-4" id="mobHome">
  <!-- Search pill -->
  <div class="px-3 pt-3 pb-2 bg-white dark:bg-studio-sidebar">
    <button
      type="button"
      data-open-search
      class="w-full h-11 px-4 rounded-full bg-slate-100 dark:bg-studio-panel border border-transparent text-slate-500 dark:text-studio-muted flex items-center gap-2.5 text-[14px] cursor-pointer active:bg-slate-200/80"
      aria-label="Search tools"
    >
      <Icon name="lucide:search" class="w-4.5 h-4.5 text-slate-400 shrink-0" />
      <span class="flex-1 text-left truncate" data-i18n-bn="টুল খুঁজুন…" data-i18n-en="Search tools…">টুল খুঁজুন…</span>
    </button>
  </div>

  <!-- Hero scan card -->
  <section class="px-3 pt-2 pb-1 bg-white dark:bg-studio-sidebar">
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white p-4 shadow-[0_10px_28px_rgba(16,185,129,0.28)]">
      <div class="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/12"></div>
      <div class="absolute right-6 -bottom-12 w-28 h-28 rounded-full bg-white/10"></div>
      <div class="relative">
        <h1
          class="m-0 text-[19px] font-extrabold leading-snug"
          data-i18n-bn="ফোনই এখন স্ক্যানার"
          data-i18n-en="Your phone is now a scanner"
        >
          ফোনই এখন স্ক্যানার
        </h1>
        <p
          class="m-0 mt-1 mb-3.5 text-[12.5px] text-white/85 leading-snug max-w-[80%]"
          data-i18n-bn="ডকুমেন্ট, আইডি কার্ড ও পাসপোর্ট স্ক্যান করে PDF বানান — সব কিছু ফোনেই, প্রাইভেট।"
          data-i18n-en="Scan documents, ID cards & passports into PDF — all on your phone, private."
        >
          ডকুমেন্ট, আইডি কার্ড ও পাসপোর্ট স্ক্যান করে PDF বানান — সব কিছু ফোনেই, প্রাইভেট।
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-mob-sheet-open="mobScanSheet"
            class="inline-flex items-center gap-2 h-11 px-4.5 rounded-2xl bg-white text-emerald-700 font-extrabold text-[14px] border-0 shadow-md cursor-pointer active:scale-95 transition-transform"
          >
            <Icon name="lucide:camera" class="w-5 h-5" />
            <span data-i18n-bn="স্ক্যান শুরু করুন" data-i18n-en="Start Scanning">স্ক্যান শুরু করুন</span>
          </button>
          <a
            href="/image/scan"
            class="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-2xl bg-white/18 text-white font-bold text-[13px] no-underline border border-white/25 active:scale-95 transition-transform"
          >
            <Icon name="lucide:image" class="w-4.5 h-4.5 [&_*]:!stroke-white" />
            <span data-i18n-bn="গ্যালারি" data-i18n-en="Gallery">গ্যালারি</span>
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Quick tools grid -->
  <section class="px-3 pt-4 pb-4 bg-white dark:bg-studio-sidebar rounded-b-3xl shadow-[0_6px_16px_rgba(15,23,42,0.04)]" aria-label="Quick Tools">
    <div class="grid grid-cols-4 gap-y-4 gap-x-1">
      {#each QUICK_TOOLS as q (q.id)}
        <a href={q.tool?.href} class="flex flex-col items-center gap-1.5 no-underline text-slate-800 dark:text-studio-text active:scale-95 transition-transform">
          <span class="w-13 h-13 rounded-2xl bg-gradient-to-br {q.grad} text-white inline-flex items-center justify-center shadow-sm [&_*]:!stroke-white">
            <Icon name={q.tool?.lucideIcon || 'lucide:file'} class="w-6 h-6" />
          </span>
          <span class="text-[11.5px] font-semibold text-center leading-tight" data-i18n-bn={q.bn} data-i18n-en={q.en}>{q.bn}</span>
        </a>
      {/each}
    </div>
  </section>

  <!-- Recent (filled by shell.js from localStorage) -->
  <section id="mobRecentSection" hidden class="[&[hidden]]:hidden px-3 pt-5" aria-label="Recent">
    <div class="flex items-center justify-between mb-2 px-1">
      <h2 class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="সাম্প্রতিক" data-i18n-en="Recent">সাম্প্রতিক</h2>
    </div>
    <div id="mobRecentList" class="rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200/80 dark:border-studio-border divide-y divide-slate-100 dark:divide-studio-border overflow-hidden">
      {#each ALL_TOOLS as tool (tool.id)}
        <a
          href={tool.href}
          data-mob-recent-row={tool.id}
          hidden
          class="[&[hidden]]:hidden flex items-center gap-3 px-3 py-2.5 no-underline text-slate-900 dark:text-studio-text active:bg-slate-50 dark:active:bg-studio-panel"
        >
          <span class="w-10 h-10 rounded-xl bg-gradient-to-br {gradFor(tool.color)} text-white inline-flex items-center justify-center shrink-0 [&_*]:!stroke-white">
            <Icon name={tool.lucideIcon} class="w-5 h-5" />
          </span>
          <span class="flex-1 min-w-0">
            <b class="block text-[14px] font-bold truncate" data-i18n-bn={tool.title} data-i18n-en={tool.titleEn}>{tool.title}</b>
            <small class="block text-[12px] text-slate-500 dark:text-studio-muted truncate" data-i18n-bn={tool.desc} data-i18n-en={tool.descEn}>{tool.desc}</small>
          </span>
          <Icon name="lucide:chevron-right" class="w-4.5 h-4.5 text-slate-400 shrink-0" />
        </a>
      {/each}
    </div>
  </section>

  <!-- All tools, grouped by category -->
  <section id="mobAllTools" class="px-3 pt-5 scroll-mt-16" aria-label="All Tools">
    <h2 class="m-0 mb-2 px-1 text-[15px] font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="সব টুলস" data-i18n-en="All Tools">সব টুলস</h2>
    <div class="grid gap-3">
      {#each CATEGORIES as cat (cat.id)}
        {@const items = ALL_TOOLS.filter((t) => t.categoryId === cat.id)}
        {#if items.length}
          <div class="rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200/80 dark:border-studio-border p-3">
            <a href={cat.href} class="flex items-center justify-between mb-3 no-underline">
              <span class="inline-flex items-center gap-2 text-[13.5px] font-bold text-slate-800 dark:text-studio-text">
                <Icon name={cat.lucideIcon} class="w-4.5 h-4.5 {getToolIconPalette(cat.color).text}" />
                <span data-i18n-bn={cat.title} data-i18n-en={cat.titleEn}>{cat.title}</span>
              </span>
              <Icon name="lucide:chevron-right" class="w-4 h-4 text-slate-400" />
            </a>
            <div class="grid grid-cols-4 gap-y-3.5 gap-x-1">
              {#each items as tool (tool.id)}
                <a href={tool.href} class="flex flex-col items-center gap-1.5 no-underline text-slate-700 dark:text-studio-text active:scale-95 transition-transform min-w-0">
                  <span class="w-11 h-11 rounded-2xl {getToolIconPalette(tool.color).iconWrap} inline-flex items-center justify-center">
                    <Icon name={tool.lucideIcon} class="w-5.5 h-5.5" />
                  </span>
                  <span class="w-full px-0.5 text-[11px] font-medium text-center leading-tight line-clamp-2" data-i18n-bn={tool.title} data-i18n-en={tool.titleEn}>{tool.title}</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </section>
</div>

<div class="w-full pt-1 pb-8 max-lg:hidden">
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
          <Icon name="lucide:history" class="w-3.5 h-3.5 shrink-0 text-sky-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="সাম্প্রতিক" data-i18n-en="Recently Used">সাম্প্রতিক</span>
        </button>

        <button
          type="button"
          role="tab"
          class="th-dir-tab inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
          data-dir-cat="popular"
        >
          <Icon name="lucide:zap" class="w-3.5 h-3.5 shrink-0 text-amber-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="জনপ্রিয়" data-i18n-en="Popular">জনপ্রিয়</span>
        </button>

        {#each CATEGORIES as cat (cat.id)}
          <button
            type="button"
            role="tab"
            class="th-dir-tab inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
            data-dir-cat={cat.id}
          >
            <Icon name={cat.lucideIcon} class="w-3.5 h-3.5 shrink-0 {getToolIconPalette(cat.color).text} [.is-active_&]:text-current" />
            <span data-i18n-bn={cat.title} data-i18n-en={cat.titleEn}>{cat.title}</span>
          </button>
        {/each}

        <button
          type="button"
          role="tab"
          class="th-dir-tab inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
          data-dir-cat="all"
        >
          <Icon name="lucide:layout-grid" class="w-3.5 h-3.5 shrink-0 text-blue-500 [.is-active_&]:text-current" />
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

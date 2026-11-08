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
  const CAMSCANNER_TOP_TOOLS = [
    { id: 'smart-scan', href: '#scan-sheet', sheet: 'mobScanSheet', icon: 'lucide:camera', bn: 'স্মার্ট স্ক্যান', en: 'Smart Scan', bg: 'bg-blue-500/12 dark:bg-blue-500/18 text-blue-600 dark:text-blue-400' },
    { id: 'image-scan', href: '/image/scan', icon: 'lucide:scan-line', bn: 'ডকুমেন্ট স্ক্যানার', en: 'Doc Scanner', bg: 'bg-indigo-500/12 dark:bg-indigo-500/18 text-indigo-600 dark:text-indigo-400' },
    { id: 'image-combine', href: '/image/combine', icon: 'lucide:id-card', bn: 'আইডি কার্ড', en: 'ID Card', bg: 'bg-teal-500/12 dark:bg-teal-500/18 text-teal-600 dark:text-teal-400' },
    { id: 'image-passport', href: '/image/passport', icon: 'lucide:book-open-check', bn: 'পাসপোর্ট স্ক্যানার', en: 'Passport', bg: 'bg-emerald-500/12 dark:bg-emerald-500/18 text-emerald-600 dark:text-emerald-400' },
    { id: 'pdf-studio', href: '/pdf', icon: 'lucide:file-text', bn: 'পিডিএফ টুলস', en: 'PDF Tools', bg: 'bg-rose-500/12 dark:bg-rose-500/18 text-rose-600 dark:text-rose-400' },
    { id: 'image-studio', href: '/image', icon: 'lucide:image', bn: 'ইমেজ স্টুডিও', en: 'Image Studio', bg: 'bg-amber-500/12 dark:bg-amber-500/18 text-amber-600 dark:text-amber-400' },
    { id: 'bijoy-to-unicode', href: '/bangla/bijoy-to-unicode', icon: 'lucide:languages', bn: 'বিজয় ও অফিস', en: 'Bijoy & Office', bg: 'bg-violet-500/12 dark:bg-violet-500/18 text-violet-600 dark:text-violet-400' },
    { id: 'all-tools', href: '#mobAllTools', openAllTools: true, icon: 'lucide:layout-grid', bn: 'অল টুলস', en: 'All Tools', bg: 'bg-sky-500/12 dark:bg-sky-500/18 text-sky-600 dark:text-sky-400' }
  ];

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
<div class="lg:hidden -mx-3 -mt-3 min-h-[calc(100dvh-7.5rem)] flex flex-col bg-slate-100/70 dark:bg-studio-bg" id="mobHome">
  <!-- ==================== VIEW 1: CAMSCANNER HOME (TOP 8 CORE FEATURES + SAVED DOCUMENTS) ==================== -->
  <div id="mobHomeMainView" class="flex-1 flex flex-col">
    <!-- Top Search & Cloud Backup Bar -->
    <div class="px-3.5 pt-3 pb-2.5 bg-white dark:bg-studio-sidebar flex items-center gap-2">
      <button
        type="button"
        data-open-search
        class="flex-1 h-10 px-3.5 rounded-2xl bg-slate-100 dark:bg-studio-panel border border-slate-200/70 dark:border-studio-border text-slate-500 dark:text-studio-muted flex items-center gap-2 text-[13.5px] cursor-pointer active:scale-[0.99] transition-transform"
        aria-label="Search documents or tools"
      >
        <Icon name="lucide:search" class="w-4 h-4 text-slate-400 shrink-0" />
        <span class="flex-1 text-left truncate" data-i18n-bn="ডকুমেন্ট বা টুলস খুঁজুন…" data-i18n-en="Search documents or tools…">ডকুমেন্ট বা টুলস খুঁজুন…</span>
      </button>
      <button
        type="button"
        data-mob-sheet-open="mobCloudSheet"
        id="mobCloudStatusBtn"
        class="h-10 px-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
        title="Cloudflare Cloud Backup"
      >
        <Icon name="lucide:cloud" class="w-4 h-4 text-emerald-500 shrink-0" />
        <span id="mobCloudBadgeTxt" data-i18n-bn="ক্লাউড সেভ" data-i18n-en="Cloud Save">ক্লাউড সেভ</span>
      </button>
    </div>

    <!-- CamScanner Signature 2x4 Core Features Bar -->
    <section class="px-3 pt-2 pb-4 bg-white dark:bg-studio-sidebar rounded-b-3xl border-b border-slate-200/70 dark:border-studio-border shadow-[0_4px_14px_rgba(15,23,42,0.04)]" aria-label="Core Features">
      <div class="grid grid-cols-4 gap-y-3.5 gap-x-1.5">
        {#each CAMSCANNER_TOP_TOOLS as item (item.id)}
          <a
            href={item.href}
            data-mob-sheet-open={item.sheet}
            data-mob-open-all-tools={item.openAllTools ? '1' : undefined}
            class="flex flex-col items-center gap-1.5 py-1 rounded-2xl no-underline text-slate-800 dark:text-studio-text active:scale-95 transition-transform"
          >
            <span class="w-12 h-12 rounded-2xl {item.bg} inline-flex items-center justify-center shadow-2xs">
              <Icon name={item.icon} class="w-6 h-6" />
            </span>
            <span class="text-[11.5px] font-bold text-center leading-tight px-0.5 line-clamp-1" data-i18n-bn={item.bn} data-i18n-en={item.en}>{item.bn}</span>
          </a>
        {/each}
      </div>
    </section>

    <!-- Saved Recent Documents Section (CamScanner "Recents" Feed) -->
    <section class="px-3.5 pt-4 pb-6 flex-1 flex flex-col" id="mobSavedDocsSection" aria-label="Recent Documents">
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <div class="flex items-center gap-2">
          <h2 class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="সাম্প্রতিক ডকুমেন্টস" data-i18n-en="Recent Documents">সাম্প্রতিক ডকুমেন্টস</h2>
          <span id="mobSavedDocsCount" class="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-studio-panel text-slate-700 dark:text-studio-muted text-xs font-bold">০</span>
        </div>
        <div class="flex items-center gap-1.5">
          <label
            for="mobVaultImportInput"
            class="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-bold text-slate-700 dark:text-studio-text cursor-pointer active:scale-95 transition-transform"
          >
            <Icon name="lucide:file-plus-2" class="w-3.5 h-3.5 text-emerald-500" />
            <span data-i18n-bn="ফাইল যোগ" data-i18n-en="Import">ফাইল যোগ</span>
          </label>
          <input id="mobVaultImportInput" type="file" multiple accept="image/*,.pdf,.docx,.xlsx,.pptx" class="sr-only" />
        </div>
      </div>

      <!-- Category Filter Pills for Saved Documents -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-1 no-scrollbar" id="mobDocFilterBar" role="tablist">
        <button type="button" data-doc-filter="all" class="mob-doc-filter is-active h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="সব ফাইল" data-i18n-en="All Docs">সব ফাইল</button>
        <button type="button" data-doc-filter="scan" class="mob-doc-filter h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="স্ক্যান ও ছবি" data-i18n-en="Scans">স্ক্যান ও ছবি</button>
        <button type="button" data-doc-filter="nid" class="mob-doc-filter h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="NID ও পাসপোর্ট" data-i18n-en="ID & Passport">NID ও পাসপোর্ট</button>
        <button type="button" data-doc-filter="pdf" class="mob-doc-filter h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="PDF ডকুমেন্ট" data-i18n-en="PDFs">PDF ডকুমেন্ট</button>
      </div>

      <!-- Saved Documents List (Populated by IndexedDB + Cloudflare R2/D1 Vault) -->
      <div id="mobSavedDocsList" class="grid gap-2"></div>

      <!-- Empty State when no documents are saved yet -->
      <div id="mobSavedDocsEmpty" class="flex-1 flex flex-col items-center justify-center text-center py-8 px-4 rounded-3xl bg-white dark:bg-studio-sidebar border border-slate-200/80 dark:border-studio-border my-1">
        <div class="w-15 h-15 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
          <Icon name="lucide:folder-check" class="w-8 h-8" />
        </div>
        <h3 class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="কোনো সেভ করা ডকুমেন্ট নেই" data-i18n-en="No Saved Documents Yet">কোনো সেভ করা ডকুমেন্ট নেই</h3>
        <p class="m-0 mt-1 mb-4 text-xs text-slate-500 dark:text-studio-muted max-w-[260px] leading-relaxed" data-i18n-bn="আপনি যা স্ক্যান বা তৈরি করবেন তা স্বয়ংক্রিয়ভাবে এখানে এবং ক্লাউডে সেভ থাকবে—ফোন রিসেট করলেও হারাবে না।" data-i18n-en="Documents you scan or create are automatically saved here & backed up to the cloud.">
          আপনি যা স্ক্যান বা তৈরি করবেন তা স্বয়ংক্রিয়ভাবে এখানে এবং ক্লাউডে সেভ থাকবে—ফোন রিসেট করলেও হারাবে না।
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-mob-sheet-open="mobScanSheet"
            class="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold border-0 shadow-sm cursor-pointer active:scale-95 transition-transform"
          >
            <Icon name="lucide:camera" class="w-4 h-4 [&_*]:!stroke-white" />
            <span data-i18n-bn="নতুন স্ক্যান করুন" data-i18n-en="New Scan">নতুন স্ক্যান করুন</span>
          </button>
          <label
            for="mobVaultImportInput"
            class="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-xs font-bold cursor-pointer active:scale-95 transition-transform"
          >
            <Icon name="lucide:upload" class="w-4 h-4" />
            <span data-i18n-bn="ফাইল ইমপোর্ট" data-i18n-en="Import File">ফাইল ইমপোর্ট</span>
          </label>
        </div>
      </div>
    </section>
  </div>

  <!-- ==================== VIEW 2: DEDICATED "ALL TOOLS" SCREEN (OPENS WHEN TAPPING "ALL TOOLS" OR TOOLS TAB) ==================== -->
  <section id="mobAllTools" hidden class="[&[hidden]]:hidden px-3 pt-3 pb-6 flex-1" aria-label="All Tools">
    <div class="flex items-center justify-between gap-2 mb-3 px-1">
      <button
        type="button"
        data-mob-close-all-tools
        class="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-bold text-slate-700 dark:text-studio-text cursor-pointer active:scale-95"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4" />
        <span data-i18n-bn="হোমে ফিরুন" data-i18n-en="Back to Home">হোমে ফিরুন</span>
      </button>
      <h2 class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="সকল টুলস" data-i18n-en="All Tools">সকল টুলস</h2>
      <button
        type="button"
        data-open-search
        class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted cursor-pointer"
        aria-label="Search"
      >
        <Icon name="lucide:search" class="w-4 h-4" />
      </button>
    </div>

    <div class="grid gap-3">
      {#each CATEGORIES as cat (cat.id)}
        {@const items = ALL_TOOLS.filter((t) => t.categoryId === cat.id)}
        {#if items.length}
          <div class="rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200/80 dark:border-studio-border p-3.5">
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
                  <span class="w-full px-0.5 text-[11.5px] font-medium text-center leading-tight line-clamp-2" data-i18n-bn={tool.title} data-i18n-en={tool.titleEn}>{tool.title}</span>
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

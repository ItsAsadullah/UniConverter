<script lang="ts">
  import Icon from './ui/Icon.svelte';
  import ToolCard from './ToolCard.svelte';
  import { CATEGORIES, ALL_TOOLS, getToolIconPalette } from '../data/tools';

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
        data-th-account-open
        id="mobCloudStatusBtn"
        class="h-10 px-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
        title="Account & Cloud Sync"
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
          <h2 class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="সাম্প্রতিক কাজ ও ডকুমেন্টস" data-i18n-en="Recent Work & Documents">সাম্প্রতিক কাজ ও ডকুমেন্টস</h2>
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
        <button type="button" data-doc-filter="all" class="mob-doc-filter is-active h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="সব কাজ" data-i18n-en="All Work">সব কাজ</button>
        <button type="button" data-doc-filter="projects" class="mob-doc-filter h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="চলমান প্রজেক্ট" data-i18n-en="In Progress">চলমান প্রজেক্ট</button>
        <button type="button" data-doc-filter="scan" class="mob-doc-filter h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="স্ক্যান ও ছবি" data-i18n-en="Scans">স্ক্যান ও ছবি</button>
        <button type="button" data-doc-filter="nid" class="mob-doc-filter h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="NID ও পাসপোর্ট" data-i18n-en="ID & Passport">NID ও পাসপোর্ট</button>
        <button type="button" data-doc-filter="pdf" class="mob-doc-filter h-7.5 px-3 rounded-full text-xs font-bold border border-transparent bg-slate-200/70 dark:bg-studio-panel text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer [&.is-active]:bg-emerald-600 [&.is-active]:text-white" data-i18n-bn="PDF ডকুমেন্ট" data-i18n-en="PDFs">PDF ডকুমেন্ট</button>
      </div>

      <!-- Saved Documents List (Populated by IndexedDB + Cloudflare R2/D1 Vault) -->
      <div id="mobSavedDocsList" class="grid gap-2"></div>

      <!-- Empty State when no documents are saved yet -->
      <div id="mobSavedDocsEmpty" hidden class="[&[hidden]]:hidden flex-1 flex flex-col items-center justify-center text-center py-8 px-4 rounded-3xl bg-white dark:bg-studio-sidebar border border-slate-200/80 dark:border-studio-border my-1">
        <div class="w-15 h-15 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
          <Icon name="lucide:folder-check" class="w-8 h-8" />
        </div>
        <h3 class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="কোনো সেভ করা কাজ বা ডকুমেন্ট নেই" data-i18n-en="No Recent Work or Documents Yet">কোনো সেভ করা কাজ বা ডকুমেন্ট নেই</h3>
        <p class="m-0 mt-1 mb-4 text-xs text-slate-500 dark:text-studio-muted max-w-[260px] leading-relaxed" data-i18n-bn="আপনি যা স্ক্যান বা তৈরি করবেন তা স্বয়ংক্রিয়ভাবে এখানে এবং ক্লাউডে সেভ থাকবে—ফোন রিসেট করলেও হারাবে না।" data-i18n-en="Projects and documents you scan or create are automatically saved here & backed up to the cloud.">
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

<!-- ============================================================ DESKTOP HOME (≥ 1024px) -->
<div class="w-full pt-1 pb-8 max-lg:hidden">
  <!-- 1. CORE COMMON TOOLS BAR (8 COMPACT ESSENTIAL TOOLS + ALL TOOLS) -->
  <section
    class="rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-3 mb-5 shadow-2xs"
    aria-label="Quick Tools"
  >
    <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5" id="deskQuickToolsGrid">
      <a
        href="/image/scan"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-indigo-500/12 dark:bg-indigo-500/18 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:scan-line" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="ডকুমেন্ট স্ক্যানার"
          data-i18n-en="Document Scanner"
        >
          ডকুমেন্ট স্ক্যানার
        </span>
      </a>

      <a
        href="/image/combine"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-teal-500/12 dark:bg-teal-500/18 text-teal-600 dark:text-teal-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:id-card" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="এনআইডি কার্ড স্ক্যানার"
          data-i18n-en="NID Card Scanner"
        >
          এনআইডি কার্ড স্ক্যানার
        </span>
      </a>

      <a
        href="/image/passport"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-emerald-500/12 dark:bg-emerald-500/18 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:book-open-check" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="পাসপোর্ট মেকার"
          data-i18n-en="Passport Maker"
        >
          পাসপোর্ট মেকার
        </span>
      </a>

      <a
        href="/bangla/bijoy-to-unicode"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-violet-500/12 dark:bg-violet-500/18 text-violet-600 dark:text-violet-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:languages" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="বিজয় ইউনিকোড"
          data-i18n-en="Bijoy Unicode"
        >
          বিজয় ইউনিকোড
        </span>
      </a>

      <a
        href="/pdf/merge"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-rose-500/12 dark:bg-rose-500/18 text-rose-600 dark:text-rose-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:merge" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="মার্জ PDF"
          data-i18n-en="Merge PDF"
        >
          মার্জ PDF
        </span>
      </a>

      <a
        href="/pdf/organize"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-amber-500/12 dark:bg-amber-500/18 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:files" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="অর্গানাইজ PDF"
          data-i18n-en="Organize PDF"
        >
          অর্গানাইজ PDF
        </span>
      </a>

      <a
        href="/calendar"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-cyan-500/12 dark:bg-cyan-500/18 text-cyan-600 dark:text-cyan-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:calendar-days" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="ক্যালেন্ডার ও তারিখ"
          data-i18n-en="Calendar & Date"
        >
          ক্যালেন্ডার ও তারিখ
        </span>
      </a>

      <a
        href="/age-calculator"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-50/70 dark:bg-studio-panel/60 hover:bg-white dark:hover:bg-studio-panel border border-slate-200/70 dark:border-studio-border hover:border-emerald-500/50 hover:shadow-xs no-underline text-slate-800 dark:text-studio-text transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-pink-500/12 dark:bg-pink-500/18 text-pink-600 dark:text-pink-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:cake" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-bold text-center leading-tight truncate px-0.5 group-hover:text-emerald-600 dark:group-hover:text-studio-primary"
          data-i18n-bn="বয়স ক্যালকুলেটর"
          data-i18n-en="Age Calculator"
        >
          বয়স ক্যালকুলেটর
        </span>
      </a>

      <!-- 9th Slot: "All Tools" Button -->
      <button
        type="button"
        data-desk-toggle-all-tools
        id="deskAllToolsTileBtn"
        class="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-sky-500/8 dark:bg-sky-500/12 hover:bg-sky-500/15 border border-sky-500/25 hover:border-sky-500/50 text-slate-800 dark:text-studio-text cursor-pointer transition-colors min-w-0"
      >
        <span class="w-9.5 h-9.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 inline-flex items-center justify-center shrink-0 shadow-2xs">
          <Icon name="lucide:layout-grid" class="w-5 h-5" />
        </span>
        <span
          class="w-full text-[11.5px] font-extrabold text-sky-700 dark:text-sky-300 text-center leading-tight truncate px-0.5"
          data-i18n-bn="অল টুলস"
          data-i18n-en="All Tools"
        >
          অল টুলস
        </span>
      </button>
    </div>
  </section>

  <!-- 2A. EXPANDABLE "ALL TOOLS" DIRECTORY (HIDDEN BY DEFAULT, OPENS WHEN CLICKING "ALL TOOLS") -->
  <section
    id="deskAllToolsPanel"
    hidden
    class="[&[hidden]]:hidden mb-6 rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-4 shadow-sm"
    data-directory-root
    data-default-tab="all"
    aria-label="All Tools Directory"
  >
    <div class="flex items-center justify-between gap-2 flex-wrap lg:flex-nowrap mb-4 pb-3 border-b border-slate-200 dark:border-studio-border">
      <div class="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 py-0.5 no-scrollbar" role="tablist" aria-label="Tool Categories">
        <button
          type="button"
          role="tab"
          class="th-dir-tab is-active inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
          data-dir-cat="all"
        >
          <Icon name="lucide:layout-grid" class="w-3.5 h-3.5 shrink-0 text-blue-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="সব টুলস" data-i18n-en="All Tools">সব টুলস</span>
          <span class="text-[10.5px] opacity-75" data-dir-count>{ALL_TOOLS.length}</span>
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
      </div>

      <div class="flex items-center gap-2 ml-auto shrink-0">
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 dark:text-studio-muted">
            <Icon name="lucide:search" class="w-3.5 h-3.5" />
          </span>
          <input
            type="search"
            class="h-8.5 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-900 dark:text-studio-text text-xs w-44 xl:w-56 outline-none focus:bg-white dark:focus:bg-studio-surface focus:border-emerald-500 transition-colors"
            data-dir-search
            placeholder="টুল ফিল্টার করুন…"
            data-i18n-placeholder-bn="টুল ফিল্টার করুন…"
            data-i18n-placeholder-en="Filter tools…"
            aria-label="Filter tools"
          />
        </div>
        <button
          type="button"
          data-desk-toggle-all-tools
          class="inline-flex items-center gap-1 h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel hover:bg-rose-500/10 text-slate-600 dark:text-studio-muted hover:text-rose-600 border-0 text-xs font-bold cursor-pointer transition-colors"
        >
          <span>✕</span>
          <span data-i18n-bn="বন্ধ করুন" data-i18n-en="Close">বন্ধ করুন</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5" id="homeTabbedGrid">
      {#each ALL_TOOLS as tool (tool.id)}
        <ToolCard {tool} />
      {/each}
    </div>

    <div data-dir-empty hidden class="py-8 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-studio-border text-slate-500 dark:text-studio-muted text-sm mt-2.5">
      <p data-i18n-bn="কোনো টুল পাওয়া যায়নি" data-i18n-en="No matching tools found">কোনো টুল পাওয়া যায়নি</p>
    </div>
  </section>

  <!-- 2B. RECENT WORK & SAVED DOCUMENTS WORKSPACE (MAIN FEED BELOW QUICK TOOLS) -->
  <section class="mb-6" id="deskRecentWorkSection" aria-label="Recent Work and Documents">
    <!-- Filter Tabs & Actions Bar -->
    <div class="flex items-center justify-between gap-2 flex-wrap lg:flex-nowrap mb-3.5 p-1.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border">
      <div class="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 py-0.5 no-scrollbar" role="tablist" aria-label="Recent Work Filter">
        <button
          type="button"
          role="tab"
          data-doc-filter="all"
          class="mob-doc-filter is-active inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
        >
          <Icon name="lucide:folder-open" class="w-3.5 h-3.5 shrink-0 text-emerald-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="সাম্প্রতিক সব কাজ" data-i18n-en="All Recent Work">সাম্প্রতিক সব কাজ</span>
          <span id="deskSavedDocsCount" class="text-[10.5px] opacity-80 font-bold">০</span>
        </button>

        <button
          type="button"
          role="tab"
          data-doc-filter="projects"
          class="mob-doc-filter inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
        >
          <Icon name="lucide:layers" class="w-3.5 h-3.5 shrink-0 text-violet-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="চলমান প্রজেক্ট" data-i18n-en="In Progress">চলমান প্রজেক্ট</span>
        </button>

        <button
          type="button"
          role="tab"
          data-doc-filter="scan"
          class="mob-doc-filter inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
        >
          <Icon name="lucide:scan-line" class="w-3.5 h-3.5 shrink-0 text-blue-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="স্ক্যান ও ছবি" data-i18n-en="Scans & Images">স্ক্যান ও ছবি</span>
        </button>

        <button
          type="button"
          role="tab"
          data-doc-filter="nid"
          class="mob-doc-filter inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
        >
          <Icon name="lucide:id-card" class="w-3.5 h-3.5 shrink-0 text-teal-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="NID ও পাসপোর্ট" data-i18n-en="ID & Passport">NID ও পাসপোর্ট</span>
        </button>

        <button
          type="button"
          role="tab"
          data-doc-filter="pdf"
          class="mob-doc-filter inline-flex items-center gap-1.5 whitespace-nowrap border-0 bg-transparent text-slate-600 dark:text-studio-muted text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-studio-text [&.is-active]:bg-emerald-600 dark:[&.is-active]:bg-studio-primary [&.is-active]:text-white dark:[&.is-active]:text-slate-950"
        >
          <Icon name="lucide:file-text" class="w-3.5 h-3.5 shrink-0 text-rose-500 [.is-active_&]:text-current" />
          <span data-i18n-bn="PDF ডকুমেন্ট" data-i18n-en="PDFs">PDF ডকুমেন্ট</span>
        </button>
      </div>

      <div class="flex items-center gap-2 ml-auto shrink-0">
        <label
          for="mobVaultImportInput"
          class="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel hover:bg-emerald-500/12 border border-slate-200 dark:border-studio-border text-xs font-bold text-slate-700 dark:text-studio-text hover:text-emerald-600 cursor-pointer transition-colors"
        >
          <Icon name="lucide:file-plus-2" class="w-3.5 h-3.5 text-emerald-500" />
          <span data-i18n-bn="ফাইল ইমপোর্ট" data-i18n-en="Import File">ফাইল ইমপোর্ট</span>
        </label>

        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 dark:text-studio-muted">
            <Icon name="lucide:search" class="w-3.5 h-3.5" />
          </span>
          <input
            type="search"
            id="deskWorkSearchInput"
            class="h-8.5 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-900 dark:text-studio-text text-xs w-44 xl:w-56 outline-none focus:bg-white dark:focus:bg-studio-surface focus:border-emerald-500 transition-colors"
            placeholder="কাজ বা ফাইল খুঁজুন…"
            data-i18n-placeholder-bn="কাজ বা ফাইল খুঁজুন…"
            data-i18n-placeholder-en="Search recent work…"
            aria-label="Search recent work"
          />
        </div>
      </div>
    </div>

    <!-- Desktop Recent Work Cards Grid -->
    <div id="deskSavedDocsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"></div>

    <!-- Empty State when no recent work matches -->
    <div
      id="deskSavedDocsEmpty"
      hidden
      class="[&[hidden]]:hidden flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl bg-white dark:bg-studio-sidebar border border-dashed border-slate-300 dark:border-studio-border"
    >
      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
        <Icon name="lucide:folder-check" class="w-6 h-6" />
      </div>
      <h3
        class="m-0 text-sm font-extrabold text-slate-900 dark:text-studio-text"
        data-i18n-bn="এখনো কোনো সাম্প্রতিক কাজ জমা হয়নি"
        data-i18n-en="No Recent Work Yet"
      >
        এখনো কোনো সাম্প্রতিক কাজ জমা হয়নি
      </h3>
      <p
        class="m-0 mt-1 mb-4 text-xs text-slate-500 dark:text-studio-muted max-w-md leading-relaxed"
        data-i18n-bn="যেকোনো টুলে কাজ করলে (যেমন ডকুমেন্ট স্ক্যান, পাসপোর্ট, ভেক্টর ট্রেসিং বা PDF তৈরি) তা স্বয়ংক্রিয়ভাবে এখানে এবং ক্লাউডে সেভ থাকবে।"
        data-i18n-en="Whenever you work in any tool (Document Scanner, Passport, Vector Studio, PDF, or Bijoy), your projects and exported files automatically appear here."
      >
        যেকোনো টুলে কাজ করলে (যেমন ডকুমেন্ট স্ক্যান, পাসপোর্ট, ভেক্টর ট্রেসিং বা PDF তৈরি) তা স্বয়ংক্রিয়ভাবে এখানে এবং ক্লাউডে সেভ থাকবে।
      </p>
      <div class="flex items-center gap-2">
        <a
          href="/image/scan"
          class="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold no-underline shadow-2xs transition-colors"
        >
          <Icon name="lucide:scan-line" class="w-4 h-4 [&_*]:!stroke-white" />
          <span data-i18n-bn="ডকুমেন্ট স্ক্যান করুন" data-i18n-en="Scan Document">ডকুমেন্ট স্ক্যান করুন</span>
        </a>
        <label
          for="mobVaultImportInput"
          class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-studio-panel hover:bg-slate-200/70 border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-xs font-bold cursor-pointer transition-colors"
        >
          <Icon name="lucide:upload" class="w-4 h-4" />
          <span data-i18n-bn="ফাইল ইমপোর্ট করুন" data-i18n-en="Import File">ফাইল ইমপোর্ট করুন</span>
        </label>
      </div>
    </div>
  </section>
</div>

<script lang="ts">
  import DocumentScanner from './DocumentScanner.svelte';
  import NidCardScanner from './NidCardScanner.svelte';
  import Icon from './ui/Icon.svelte';

  interface Props {
    initialTab?: 'hub' | 'resize' | 'compress' | 'crop' | 'convert' | 'combine' | 'scan' | 'passport' | 'colors';
  }

  let { initialTab = 'hub' }: Props = $props();
  let renderAll = $derived(initialTab === 'hub');

  const btnBase =
    'inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-800 dark:text-studio-text text-[12.5px] font-semibold leading-none whitespace-nowrap cursor-pointer transition-colors duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-300 dark:hover:enabled:border-slate-600 hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 min-h-[34px] px-3.5 py-1.5 rounded-lg border border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-[13px] font-bold leading-none whitespace-nowrap cursor-pointer shadow-2xs transition-colors duration-100 hover:enabled:bg-emerald-700 dark:hover:enabled:bg-emerald-400 hover:enabled:border-emerald-700 dark:hover:enabled:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnIcon =
    'inline-flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] p-0 rounded-md border border-transparent bg-transparent text-slate-700 dark:text-studio-text cursor-pointer transition-all duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-200/80 dark:hover:enabled:border-studio-border hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
</script>
<div class="tool-view w-full" id="tool-image" data-initial-tab={initialTab}>
  <section class="card util-card pdf-studio-card img-studio-card rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xs p-3.5 sm:p-5" aria-label="Image Studio">
    <div class="util-body pdf-studio-body">
      {#if renderAll || initialTab === 'scan' || initialTab === 'passport'}<DocumentScanner active={initialTab === 'scan' || initialTab === 'passport'} mode={initialTab === 'passport' ? 'passport' : 'scan'} />{/if}
      <!-- ========================================== 0. HUB OVERVIEW -->
      {#if renderAll}
      <div class="img-pane space-y-4" id="img-pane-hub" hidden={initialTab !== 'hub'}>
        <div class="pdf-hub-hero mb-4">
          <h2 class="pdf-hub-title text-lg font-bold text-slate-900 dark:text-studio-text m-0 [&_span]:text-emerald-600 dark:[&_span]:text-studio-primary" data-i18n-bn="অল-ইন-ওয়ান ইমেজ স্টুডিও" data-i18n-en="All-in-One Image Studio">অল-ইন-ওয়ান <span>ইমেজ স্টুডিও</span></h2>
        </div>

        <div class="pdf-hub-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer transition-colors" data-open-img="scan" data-accent="teal">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-cyan-500/15 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2" fill="currentColor" fill-opacity="0.18" stroke="none"/><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 8h10M7 12h10M7 16h7"/></svg></span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="ডকুমেন্ট স্ক্যানার" data-i18n-en="Document Scanner">ডকুমেন্ট স্ক্যানার</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="অটো পেজ ডিটেক্ট, বাঁকা পেজ সোজা, শ্যাডো সংশোধন ও পরিষ্কার লেখা। একাধিক পেজ থেকে PDF তৈরি করুন।" data-i18n-en="Auto page detection, perspective deskew, shadow removal & multipage PDF export.">অটো পেজ ডিটেক্ট, বাঁকা পেজ সোজা, শ্যাডো সংশোধন ও পরিষ্কার লেখা। একাধিক পেজ থেকে PDF তৈরি করুন।</span>
          </button>
          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-emerald-400 cursor-pointer transition-colors" data-open-img="passport" data-accent="green">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-amber-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="m9 11 2 2 4-4"/></svg></span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="পাসপোর্ট মেকার ও স্ক্যানার" data-i18n-en="Passport Maker & Scanner">পাসপোর্ট মেকার ও স্ক্যানার</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="৬-পয়েন্ট পার্সপেক্টিভ ক্রপ ও মাঝের ভাঁজ সংশোধন করে মোবাইল ক্যামেরার পাসপোর্ট ছবিকে প্রফেশনাল স্ক্যান আউটপুটে রূপান্তর করুন।" data-i18n-en="6-point perspective crop & center fold rectification to turn mobile passport photos into flat scanned documents.">৬-পয়েন্ট পার্সপেক্টিভ ক্রপ ও মাঝের ভাঁজ সংশোধন করে মোবাইল ক্যামেরার পাসপোর্ট ছবিকে প্রফেশনাল স্ক্যান আউটপুটে রূপান্তর করুন।</span>
          </button>
          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors" data-open-img="resize" data-preset="job-photo" data-accent="teal">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-sky-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5" fill="currentColor" fill-opacity="0.16" stroke="none"/><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="রিসাইজ ও সরকারি ফর্ম প্রিসেট" data-i18n-en="Image Resizer & Presets">রিসাইজ ও সরকারি ফর্ম প্রিসেট</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="চাকরির ছবি (300×300), আনসার ভিডিপি (250×250), স্বাক্ষর (300×80 ও 300×100), পাসপোর্ট সাইজ ও পজিশনিং।" data-i18n-en="Job photo (300×300), Ansar VDP (250×250), signature (300×80 & 300×100), passport size & positioning.">চাকরির ছবি (300×300), আনসার ভিডিপি (250×250), স্বাক্ষর (300×80 ও 300×100), পাসপোর্ট সাইজ ও পজিশনিং।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="compress" data-accent="green">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="currentColor" fill-opacity="0.16" stroke="none"/><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="কমপ্রেস ইমেজ" data-i18n-en="Compress Image">কমপ্রেস ইমেজ</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="কোয়ালিটি ঠিক রেখে ছবির KB কমান এবং প্রিভিউ দেখে ডাউনলোড করুন।" data-i18n-en="Reduce image file size in KB while preserving quality with live preview.">কোয়ালিটি ঠিক রেখে ছবির KB কমান এবং প্রিভিউ দেখে ডাউনলোড করুন।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer transition-colors" data-open-img="crop" data-accent="purple">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-fuchsia-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" fill="currentColor" fill-opacity="0.18" stroke="none"/><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="ক্রপ, কাস্টম সাইজ ও রাউন্ড ফটো" data-i18n-en="Crop & Circle Photo">ক্রপ, কাস্টম সাইজ ও রাউন্ড ফটো</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="কাস্টম সাইজে (px) বা অনুপাতে ছবি ক্রপ (250×250, 300×100, 1:1), ঘোরান ও বৃত্তাকার ছবি তৈরি করুন।" data-i18n-en="Crop images to custom dimensions or aspect ratios, rotate, flip & create circular avatars.">কাস্টম সাইজে (px) বা অনুপাতে ছবি ক্রপ (250×250, 300×100, 1:1), ঘোরান ও বৃত্তাকার ছবি তৈরি করুন।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-amber-500 dark:hover:border-amber-400 cursor-pointer transition-colors" data-open-img="convert" data-accent="amber">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fill-opacity="0.16"/><circle cx="8.5" cy="8.5" r="1.5" fill="#f59e0b"/><path d="m21 15-5-5L5 21"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="কনভার্ট, ইফেক্ট ও ওয়াটারমার্ক" data-i18n-en="Convert & Watermark">কনভার্ট, ইফেক্ট ও ওয়াটারমার্ক</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="JPG ⇄ PNG ⇄ WebP ⇄ Base64 রূপান্তর, ছবির ওপর লেখা, বর্ডার ও ফটো ইফেক্ট।" data-i18n-en="Convert between JPG, PNG, WebP & Base64, add watermarks, borders & photo filters.">JPG ⇄ PNG ⇄ WebP ⇄ Base64 রূপান্তর, ছবির ওপর লেখা, বর্ডার ও ফটো ইফেক্ট।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-cyan-500 dark:hover:border-cyan-400 cursor-pointer transition-colors" data-open-img="combine" data-accent="blue">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="8" height="16" rx="1.5" fill="currentColor" fill-opacity="0.18"/><rect x="13" y="4" width="8" height="16" rx="1.5" fill="currentColor" fill-opacity="0.18"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="আইডি কার্ড স্ক্যানার ও ছবি জোড়া" data-i18n-en="NID Card Scanner">আইডি কার্ড স্ক্যানার ও ছবি জোড়া</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="অটো এজ ডিটেকশন, ৪-কোণা পার্সপেক্টিভ ক্রপ ও কালার এডজাস্ট করে A4 পাতায় উপরে-নিচে বসান।" data-i18n-en="Auto edge detection, 4-corner perspective crop & color tuning on an A4 print sheet.">অটো এজ ডিটেকশন, ৪-কোণা পার্সপেক্টিভ ক্রপ ও কালার এডজাস্ট করে A4 পাতায় উপরে-নিচে বসান।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-rose-500 dark:hover:border-rose-400 cursor-pointer transition-colors" data-open-img="colors" data-accent="red">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/15 to-pink-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2v-.5a1.5 1.5 0 0 1 1.5-1.5H17a5 5 0 0 0 5-5c0-5.5-4.5-11-10-11z" fill="currentColor" fill-opacity="0.16"/><circle cx="13.5" cy="6.5" r="1.2" fill="#ef4444" stroke="none"/><circle cx="17.5" cy="10.5" r="1.2" fill="#f59e0b" stroke="none"/><circle cx="8.5" cy="7.5" r="1.2" fill="#3b82f6" stroke="none"/><circle cx="6.5" cy="12.5" r="1.2" fill="#10b981" stroke="none"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="কালার পিকার ও প্যালেট" data-i18n-en="Color Picker & Palette">কালার পিকার ও প্যালেট</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="যেকোনো ছবি থেকে প্রধান রঙগুলোর প্যালেট বের করুন এবং ক্লিক করে HEX/RGB কোড কপি করুন।" data-i18n-en="Extract dominant color palettes from any image and copy HEX/RGB codes in one click.">যেকোনো ছবি থেকে প্রধান রঙগুলোর প্যালেট বের করুন এবং ক্লিক করে HEX/RGB কোড কপি করুন।</span>
          </button>
        </div>
      </div>
      {/if}

      <!-- ========================================== 1. RESIZE & GOVT FORM PRESETS -->
      {#if renderAll || initialTab === 'resize'}
      <div class="img-pane space-y-4" id="img-pane-resize" hidden={initialTab !== 'resize'}>
        <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 class="pdf-ws-title text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="রিসাইজ ও সরকারি ফর্ম প্রিসেট" data-i18n-en="Image Resizer & Govt Form Presets">রিসাইজ ও সরকারি ফর্ম প্রিসেট</h3>
          </div>
          <div class="pdf-ws-actions" id="imgResizeTopActions" hidden>
            <button type="button" class="chip-btn chip-btn--danger" id="imgResizeResetBtn" data-i18n-bn="অন্য ছবি নিন" data-i18n-en="Choose Another Image">অন্য ছবি নিন</button>
          </div>
        </div>

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors" id="imgResizeDropzone" for="imgResizeInput">
          <input type="file" id="imgResizeInput" name="imgResizeInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-sky-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5" fill="currentColor" fill-opacity="0.16" stroke="none"/><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </div>
          <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="রিসাইজ করার জন্য ছবি এখানে ছাড়ুন অথবা ব্রাউজ করুন" data-i18n-en="Drag & drop an image here or click to browse">রিসাইজ করার জন্য ছবি এখানে ছাড়ুন অথবা ব্রাউজ করুন</div>
        </label>

        <div class="pdf-workspace-stage" id="imgResizeStage" hidden>
          <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3">
            <fieldset class="pdf-fieldset border-0 p-0 m-0">
              <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-1.5" data-i18n-bn="এক ক্লিকে কুইক প্রিসেট নির্বাচন করুন (Quick Presets)" data-i18n-en="Select a Quick Preset">এক ক্লিকে কুইক প্রিসেট নির্বাচন করুন (Quick Presets)</legend>
              <div class="img-preset-pills grid grid-cols-2 sm:grid-cols-4 gap-2" id="imgResizePresets">
                <button type="button" class="img-preset-pill active flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="300" data-h="300" data-kb="100" data-fit="cover" data-fmt="image/jpeg">
                  <strong data-i18n-bn="চাকরির ছবি (300×300)" data-i18n-en="Job Photo (300×300)">চাকরির ছবি (300×300)</strong>
                  <small data-i18n-bn="সর্বোচ্চ 100 KB • JPG" data-i18n-en="Max 100 KB • JPG">সর্বোচ্চ 100 KB • JPG</small>
                </button>
                <button type="button" class="img-preset-pill flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="300" data-h="80" data-kb="60" data-fit="contain" data-fmt="image/jpeg">
                  <strong data-i18n-bn="স্বাক্ষর (300×80)" data-i18n-en="Signature (300×80)">স্বাক্ষর (300×80)</strong>
                  <small data-i18n-bn="সর্বোচ্চ 60 KB • JPG" data-i18n-en="Max 60 KB • JPG">সর্বোচ্চ 60 KB • JPG</small>
                </button>
                <button type="button" class="img-preset-pill flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="250" data-h="250" data-kb="100" data-fit="cover" data-fmt="image/jpeg">
                  <strong data-i18n-bn="আনসার ভিডিপি ছবি (250×250)" data-i18n-en="Ansar VDP Photo (250×250)">আনসার ভিডিপি ছবি (250×250)</strong>
                  <small data-i18n-bn="সর্বোচ্চ 100 KB • JPG" data-i18n-en="Max 100 KB • JPG">সর্বোচ্চ 100 KB • JPG</small>
                </button>
                <button type="button" class="img-preset-pill flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="300" data-h="100" data-kb="60" data-fit="contain" data-fmt="image/jpeg">
                  <strong data-i18n-bn="আনসার সাইন (300×100)" data-i18n-en="Ansar Signature (300×100)">আনসার সাইন (300×100)</strong>
                  <small data-i18n-bn="সর্বোচ্চ 60 KB • JPG" data-i18n-en="Max 60 KB • JPG">সর্বোচ্চ 60 KB • JPG</small>
                </button>
                <button type="button" class="img-preset-pill flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="450" data-h="570" data-kb="0" data-fit="cover" data-fmt="image/jpeg">
                  <strong data-i18n-bn="পাসপোর্ট সাইজ (450×570)" data-i18n-en="Passport Size (450×570)">পাসপোর্ট সাইজ (450×570)</strong>
                  <small>38×48 mm @ 300 DPI</small>
                </button>
                <button type="button" class="img-preset-pill flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="240" data-h="300" data-kb="0" data-fit="cover" data-fmt="image/jpeg">
                  <strong data-i18n-bn="স্ট্যাম্প সাইজ (240×300)" data-i18n-en="Stamp Size (240×300)">স্ট্যাম্প সাইজ (240×300)</strong>
                  <small>20×25 mm @ 300 DPI</small>
                </button>
                <button type="button" class="img-preset-pill flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="1080" data-h="1080" data-kb="0" data-fit="cover" data-fmt="image/jpeg">
                  <strong data-i18n-bn="সোশ্যাল স্কয়ার (1080×1080)" data-i18n-en="Social Square (1080×1080)">সোশ্যাল স্কয়ার (1080×1080)</strong>
                  <small>Instagram / FB Post</small>
                </button>
                <button type="button" class="img-preset-pill flex flex-col items-start text-left p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer transition-colors [&.active]:border-emerald-500 [&.active]:bg-emerald-500/10 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_small]:text-[11px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted" data-w="1280" data-h="720" data-kb="0" data-fit="cover" data-fmt="image/jpeg">
                  <strong data-i18n-bn="HD থাম্বনেইল (1280×720)" data-i18n-en="HD Thumbnail (1280×720)">HD থাম্বনেইল (1280×720)</strong>
                  <small>16:9 YouTube / Web</small>
                </button>
              </div>
            </fieldset>

            <div class="pdf-img-settings img-grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style="margin-top: .9rem;">
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgResizeW" data-i18n-bn="প্রস্থ — Width (px):" data-i18n-en="Width (px):">প্রস্থ — Width (px):</label>
                <input type="number" id="imgResizeW" name="imgResizeW" value="300" min="1" max="8000">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgResizeH" data-i18n-bn="উচ্চতা — Height (px):" data-i18n-en="Height (px):">উচ্চতা — Height (px):</label>
                <input type="number" id="imgResizeH" name="imgResizeH" value="300" min="1" max="8000">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgResizeMaxKb" data-i18n-bn="সর্বোচ্চ সাইজ (KB লিমিট, 0 = আনলিমিটেড):" data-i18n-en="Max Size (KB Limit, 0 = Unlimited):">সর্বোচ্চ সাইজ (KB লিমিট, 0 = আনলিমিটেড):</label>
                <input type="number" id="imgResizeMaxKb" name="imgResizeMaxKb" value="100" min="0" max="10000" step="5">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgResizeBg" data-i18n-bn="ব্যাকগ্রাউন্ড রঙ (Contain/JPG):" data-i18n-en="Background Color (Contain/JPG):">ব্যাকগ্রাউন্ড রঙ (Contain/JPG):</label>
                <div class="img-color-row flex items-center flex-wrap gap-2">
                  <input type="color" id="imgResizeBg" name="imgResizeBg" value="#ffffff">
                  <button type="button" class="chip-btn" id="imgResizeBgWhite" title="White background" data-i18n-bn="সাদা" data-i18n-en="White">সাদা</button>
                  <button type="button" class="chip-btn" id="imgResizeBgBlue" title="Passport blue background" data-i18n-bn="নীল" data-i18n-en="Blue">নীল</button>
                </div>
              </div>
            </div>

            <div class="img-controls-row flex items-center justify-between flex-wrap gap-4" style="margin-top: .85rem;">
              <label class="switch pdf-inline-switch">
                <input type="checkbox" id="imgResizeLockRatio" name="imgResizeLockRatio">
                <span class="switch__track"><span class="switch__knob"></span></span>
                <span class="switch__label" data-i18n-bn="অরিজিনাল অনুপাত লক রাখুন (Lock Aspect Ratio)" data-i18n-en="Lock Aspect Ratio">অরিজিনাল অনুপাত লক রাখুন (Lock Aspect Ratio)</span>
              </label>

              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-1.5" data-i18n-bn="ফিট মোড (Fit Mode):" data-i18n-en="Fit Mode:">ফিট মোড (Fit Mode):</legend>
                <div class="pdf-radio-inline flex items-center flex-wrap gap-3 text-xs text-slate-700 dark:text-studio-text">
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgResizeFit" value="cover" checked> <span data-i18n-bn="কভার / সেন্টার ক্রপ" data-i18n-en="Cover / Center Crop">কভার / সেন্টার ক্রপ</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgResizeFit" value="contain"> <span data-i18n-bn="পুরো ছবি রাখুন (Contain)" data-i18n-en="Contain (Full Image)">পুরো ছবি রাখুন (Contain)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgResizeFit" value="stretch"> <span data-i18n-bn="টেনে মাপ মেলান (Stretch)" data-i18n-en="Stretch">টেনে মাপ মেলান (Stretch)</span></label>
                </div>
              </fieldset>

              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-1.5" data-i18n-bn="আউটপুট ফরম্যাট:" data-i18n-en="Output Format:">আউটপুট ফরম্যাট:</legend>
                <div class="pdf-radio-inline flex items-center flex-wrap gap-3 text-xs text-slate-700 dark:text-studio-text">
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgResizeFmt" value="image/jpeg" checked> JPG</label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgResizeFmt" value="image/png"> PNG</label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgResizeFmt" value="image/webp"> WebP</label>
                </div>
              </fieldset>
            </div>

            <div class="img-controls-row img-pos-toolbar" id="imgResizePosToolbar" style="margin-top: .85rem; padding-top: .75rem; border-top: 1px dashed var(--line);">
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border" style="min-width: 220px; flex: 1;">
                <label for="imgResizeZoom"><span data-i18n-bn="ছবির জুম ও পজিশন (Zoom & Pan):" data-i18n-en="Zoom & Pan:">ছবির জুম ও পজিশন (Zoom &amp; Pan):</span> <strong id="imgResizeZoomVal">100%</strong></label>
                <input type="range" id="imgResizeZoom" name="imgResizeZoom" min="50" max="300" value="100">
              </div>
              <div class="img-color-row flex items-center flex-wrap gap-2">
                <span class="pdf-hint-line" style="margin:0;" data-i18n-bn="✋ প্রিভিউ ছবির ওপর মাউস বা আঙুল দিয়ে টেনে পজিশন ঠিক করুন" data-i18n-en="✋ Drag on the preview image to adjust position">✋ প্রিভিউ ছবির ওপর মাউস বা আঙুল দিয়ে টেনে পজিশন ঠিক করুন</span>
                <button type="button" class="chip-btn" id="imgResizePosReset" data-i18n-bn="🎯 মাঝখানে বসান" data-i18n-en="🎯 Center Image">🎯 মাঝখানে বসান</button>
              </div>
            </div>
          </div>

          <div class="img-dual-preview grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
            <div class="img-preview-box rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border overflow-hidden flex flex-col">
              <div class="img-preview-box__head flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text">
                <strong data-i18n-bn="অরিজিনাল ছবি" data-i18n-en="Original Image">অরিজিনাল ছবি</strong>
                <span id="imgResizeOrigMeta">—</span>
              </div>
              <div class="img-preview-box__canvas relative min-h-[260px] p-4 flex items-center justify-center bg-slate-100/70 dark:bg-studio-bg/60 [&_img]:max-w-full [&_img]:max-h-[340px] [&_img]:object-contain [&_img]:rounded">
                <img id="imgResizeOrigPreview" alt="Original image preview" width="300" height="300">
              </div>
            </div>
            <div class="img-preview-box img-preview-box--out rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border overflow-hidden flex flex-col">
              <div class="img-preview-box__head flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text">
                <strong data-i18n-bn="রিসাইজড আউটপুট প্রিভিউ (টেনে পজিশন সরান)" data-i18n-en="Resized Output Preview (Drag to Reposition)">রিসাইজড আউটপুট প্রিভিউ (টেনে পজিশন সরান)</strong>
                <span id="imgResizeOutMeta">—</span>
              </div>
              <div
                class="img-preview-box__canvas img-pan-stage relative min-h-[260px] p-4 flex items-center justify-center bg-slate-100/70 dark:bg-studio-bg/60 cursor-grab active:cursor-grabbing select-none [&_img]:max-w-full [&_img]:max-h-[340px] [&_img]:object-contain [&_img]:rounded"
                id="imgResizePanWrap"
                tabindex="0"
                aria-label="Drag or use arrow keys to reposition the resized image"
              >
                <img id="imgResizeOutPreview" alt="Resized image preview" width="300" height="300" draggable="false">
                <span class="img-pan-badge absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-[11px] font-semibold pointer-events-none" id="imgResizePanHint" data-i18n-bn="✥ ড্রাগ করে পজিশন মেলান" data-i18n-en="✥ Drag to reposition">✥ ড্রাগ করে পজিশন মেলান</span>
              </div>
            </div>
          </div>

          <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
            <div class="pdf-summary-pill" id="imgResizeSummary" data-i18n-bn="প্রস্তুত" data-i18n-en="Ready">প্রস্তুত</div>
            <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgResizeDownloadBtn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
              <span data-i18n-bn="রিসাইজড ছবি ডাউনলোড করুন" data-i18n-en="Download Resized Image">রিসাইজড ছবি ডাউনলোড করুন</span>
            </button>
          </div>
        </div>
      </div>
      {/if}

      <!-- ========================================== 2. COMPRESS IMAGE WORKSPACE -->
      {#if renderAll || initialTab === 'compress'}
      <div class="img-pane space-y-4" id="img-pane-compress" hidden={initialTab !== 'compress'}>
        <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 class="pdf-ws-title text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="কমপ্রেস ইমেজ" data-i18n-en="Compress Image">কমপ্রেস ইমেজ</h3>
          </div>
          <div class="pdf-ws-actions" id="imgCompressTopActions" hidden>
            <label class="chip-btn" for="imgCompressAddMore">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              <span data-i18n-bn="আরও ছবি যোগ করুন" data-i18n-en="Add More Images">আরও ছবি যোগ করুন</span>
              <input type="file" id="imgCompressAddMore" name="imgCompressAddMore" accept="image/*" multiple class="visually-hidden sr-only">
            </label>
            <button type="button" class="chip-btn chip-btn--danger" id="imgCompressClearBtn" data-i18n-bn="সব মুছুন" data-i18n-en="Clear All">সব মুছুন</button>
          </div>
        </div>

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="imgCompressDropzone" for="imgCompressInput">
          <input type="file" id="imgCompressInput" name="imgCompressInput" accept="image/*" multiple class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="currentColor" fill-opacity="0.16" stroke="none"/><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
          </div>
          <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="কমপ্রেস করার জন্য এক বা একাধিক ছবি ছাড়ুন বা সিলেক্ট করুন" data-i18n-en="Drag & drop one or more images here or click to browse">কমপ্রেস করার জন্য এক বা একাধিক ছবি ছাড়ুন বা সিলেক্ট করুন</div>
        </label>

        <div class="pdf-workspace-stage" id="imgCompressStage" hidden>
          <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3">
            <div class="pdf-img-settings img-grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgCompressQuality"><span data-i18n-bn="কোয়ালিটি লেভেল:" data-i18n-en="Quality Level:">কোয়ালিটি লেভেল:</span> <strong id="imgCompressQualityLbl" data-i18n-bn="৭৫%" data-i18n-en="75%">৭৫%</strong></label>
                <input type="range" id="imgCompressQuality" name="imgCompressQuality" min="10" max="98" value="75">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgCompressTargetKb" data-i18n-bn="টার্গেট সর্বোচ্চ সাইজ (KB, 0 = স্লাইডার অনুযায়ী):" data-i18n-en="Target Max Size (KB, 0 = by slider):">টার্গেট সর্বোচ্চ সাইজ (KB, 0 = স্লাইডার অনুযায়ী):</label>
                <input type="number" id="imgCompressTargetKb" name="imgCompressTargetKb" value="0" min="0" max="10000" step="10" placeholder="যেমন: 100" data-i18n-placeholder-bn="যেমন: 100" data-i18n-placeholder-en="e.g. 100">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgCompressMaxDim" data-i18n-bn="সর্বোচ্চ রেজোলিউশন (Max Width/Height):" data-i18n-en="Max Resolution (Width/Height):">সর্বোচ্চ রেজোলিউশন (Max Width/Height):</label>
                <select id="imgCompressMaxDim" name="imgCompressMaxDim">
                  <option value="0" selected data-i18n-bn="অরিজিনাল ডাইমেনশন রাখুন" data-i18n-en="Keep Original Dimensions">অরিজিনাল ডাইমেনশন রাখুন</option>
                  <option value="2560">2560 px (2K QHD)</option>
                  <option value="1920">1920 px (Full HD)</option>
                  <option value="1280">1280 px (HD)</option>
                  <option value="800" data-i18n-bn="800 px (ওয়েব অপটিমাইজড)" data-i18n-en="800 px (Web Optimized)">800 px (ওয়েব অপটিমাইজড)</option>
                </select>
              </div>
              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-1.5" data-i18n-bn="আউটপুট ফরম্যাট:" data-i18n-en="Output Format:">আউটপুট ফরম্যাট:</legend>
                <div class="pdf-radio-inline flex items-center flex-wrap gap-3 text-xs text-slate-700 dark:text-studio-text">
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCompressFmt" value="image/jpeg" checked> JPG</label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCompressFmt" value="image/webp"> <span data-i18n-bn="WebP (সবচেয়ে ছোট)" data-i18n-en="WebP (Smallest)">WebP (সবচেয়ে ছোট)</span></label>
                </div>
              </fieldset>
            </div>
          </div>

          <div class="pdf-compress-stat" id="imgCompressTotalStat"></div>

          <div class="img-compress-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4" id="imgCompressList"></div>

          <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
            <div class="pdf-summary-pill" id="imgCompressSummary" data-i18n-bn="০টি ছবি" data-i18n-en="0 images">০টি ছবি</div>
            <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCompressDownloadAllBtn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
              <span data-i18n-bn="কমপ্রেসড ছবি ডাউনলোড করুন" data-i18n-en="Download Compressed Images">কমপ্রেসড ছবি ডাউনলোড করুন</span>
            </button>
          </div>
        </div>
      </div>
      {/if}

      <!-- ========================================== 3. CROP, ROTATE & ROUND AVATAR -->
      {#if renderAll || initialTab === 'crop'}
      <div class="img-pane space-y-4" id="img-pane-crop" hidden={initialTab !== 'crop'}>
        <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 class="pdf-ws-title text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="ক্রপ, কাস্টম সাইজ ও রাউন্ড ফটো" data-i18n-en="Crop, Custom Size & Circle Avatar">ক্রপ, কাস্টম সাইজ ও রাউন্ড ফটো</h3>
          </div>
          <div class="pdf-ws-actions" id="imgCropTopActions" hidden>
            <button type="button" class="chip-btn chip-btn--accent" id="imgCropAutoBtn" title="স্বয়ংক্রিয়ভাবে ছবি, স্বাক্ষর বা ডকুমেন্টের মূল অংশ শনাক্ত করুন" data-i18n-title-bn="স্বয়ংক্রিয়ভাবে ছবি, স্বাক্ষর বা ডকুমেন্টের মূল অংশ শনাক্ত করুন" data-i18n-title-en="Automatically detect subject, signature, or document bounds" data-i18n-bn="✨ অটো সিলেক্ট" data-i18n-en="✨ Auto Select">✨ অটো সিলেক্ট</button>
            <button type="button" class="chip-btn" id="imgCropSnapBtn" title="ক্রপ বক্সের চারপাশ নিকটস্থ বর্ডারে স্ন্যাপ করুন" data-i18n-title-bn="ক্রপ বক্সের চারপাশ নিকটস্থ বর্ডারে স্ন্যাপ করুন" data-i18n-title-en="Snap crop box edges to nearest border" data-i18n-bn="🎯 বর্ডার স্ন্যাপ" data-i18n-en="🎯 Snap Border">🎯 বর্ডার স্ন্যাপ</button>
            <button type="button" class="chip-btn" id="imgCropTightBtn" title="চারপাশের বর্ডার সামান্য ভেতরে চাপান" data-i18n-title-bn="চারপাশের বর্ডার সামান্য ভেতরে চাপান" data-i18n-title-en="Tighten border inward slightly" data-i18n-bn="➖ টাইট" data-i18n-en="➖ Tighten">➖ টাইট</button>
            <button type="button" class="chip-btn" id="imgCropExpandBtn" title="চারপাশের বর্ডার সামান্য বাইরে বাড়ান" data-i18n-title-bn="চারপাশের বর্ডার সামান্য বাইরে বাড়ান" data-i18n-title-en="Expand margin outward slightly" data-i18n-bn="➕ মার্জিন" data-i18n-en="➕ Margin">➕ মার্জিন</button>
            <button type="button" class="chip-btn" id="imgCropFullBtn" title="পুরো ছবি সিলেক্ট করুন" data-i18n-title-bn="পুরো ছবি সিলেক্ট করুন" data-i18n-title-en="Select full image" data-i18n-bn="🔲 পুরো ছবি" data-i18n-en="🔲 Full Image">🔲 পুরো ছবি</button>
            <button type="button" class="chip-btn" id="imgCropRotL" data-i18n-bn="↺ বামে" data-i18n-en="↺ Rotate Left">↺ বামে</button>
            <button type="button" class="chip-btn" id="imgCropRotR" data-i18n-bn="↻ ডানে" data-i18n-en="↻ Rotate Right">↻ ডানে</button>
            <button type="button" class="chip-btn" id="imgCropFlipH" data-i18n-bn="⇄ ফ্লিপ H" data-i18n-en="⇄ Flip H">⇄ ফ্লিপ H</button>
            <button type="button" class="chip-btn" id="imgCropFlipV" data-i18n-bn="⇅ ফ্লিপ V" data-i18n-en="⇅ Flip V">⇅ ফ্লিপ V</button>
            <button type="button" class="chip-btn chip-btn--danger" id="imgCropResetBtn" data-i18n-bn="অন্য ছবি নিন" data-i18n-en="Change Image">অন্য ছবি নিন</button>
          </div>
        </div>

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer transition-colors" id="imgCropDropzone" for="imgCropInput">
          <input type="file" id="imgCropInput" name="imgCropInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/15 to-fuchsia-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20 flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" fill="currentColor" fill-opacity="0.18" stroke="none"/><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
          </div>
          <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="ক্রপ বা রাউন্ড করার জন্য ছবি ছাড়ুন বা সিলেক্ট করুন" data-i18n-en="Drag & drop an image here or click to browse">ক্রপ বা রাউন্ড করার জন্য ছবি ছাড়ুন বা সিলেক্ট করুন</div>
        </label>

        <div class="pdf-workspace-stage" id="imgCropStage" hidden>
          <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3">
            <div class="img-controls-row flex items-center justify-between flex-wrap gap-4">
              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-1.5" data-i18n-bn="ক্রপ অনুপাত ও প্রিসেট সাইজ (Aspect Ratio & Presets):" data-i18n-en="Aspect Ratio & Preset Sizes:">ক্রপ অনুপাত ও প্রিসেট সাইজ (Aspect Ratio &amp; Presets):</legend>
                <div class="pdf-radio-inline flex items-center flex-wrap gap-3 text-xs text-slate-700 dark:text-studio-text" id="imgCropRatioGroup">
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="free" checked> <span data-i18n-bn="মুক্ত (Free)" data-i18n-en="Free">মুক্ত (Free)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="1:1"> <span data-i18n-bn="1:1 (বর্গাকার)" data-i18n-en="1:1 (Square)">1:1 (বর্গাকার)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="250:250" data-cw="250" data-ch="250"> <span data-i18n-bn="250×250 (আনসার ছবি)" data-i18n-en="250×250 (Ansar Photo)">250×250 (আনসার ছবি)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="300:300" data-cw="300" data-ch="300"> <span data-i18n-bn="300×300 (চাকরির ছবি)" data-i18n-en="300×300 (Job Photo)">300×300 (চাকরির ছবি)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="300:80" data-cw="300" data-ch="80"> <span data-i18n-bn="300×80 (স্বাক্ষর)" data-i18n-en="300×80 (Signature)">300×80 (স্বাক্ষর)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="300:100" data-cw="300" data-ch="100"> <span data-i18n-bn="300×100 (আনসার সাইন)" data-i18n-en="300×100 (Ansar Sign)">300×100 (আনসার সাইন)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="4:5" data-cw="450" data-ch="570"> <span data-i18n-bn="4:5 (পাসপোর্ট)" data-i18n-en="4:5 (Passport)">4:5 (পাসপোর্ট)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="16:9"> <span data-i18n-bn="16:9 (ওয়াইড)" data-i18n-en="16:9 (Wide)">16:9 (ওয়াইড)</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropRatio" value="custom"> <span data-i18n-bn="কাস্টম সাইজ (px)" data-i18n-en="Custom Size (px)">কাস্টম সাইজ (px)</span></label>
                </div>
              </fieldset>

              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-1.5" data-i18n-bn="আকৃতি / কোণা (Corner Shape):" data-i18n-en="Corner Shape:">আকৃতি / কোণা (Corner Shape):</legend>
                <div class="pdf-radio-inline flex items-center flex-wrap gap-3 text-xs text-slate-700 dark:text-studio-text">
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropShape" value="rect" checked> <span data-i18n-bn="চারকোণা" data-i18n-en="Rectangle">চারকোণা</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropShape" value="rounded"> <span data-i18n-bn="রাউন্ডেড কোণা" data-i18n-en="Rounded Corners">রাউন্ডেড কোণা</span></label>
                  <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgCropShape" value="circle"> <span data-i18n-bn="বৃত্তাকার (Circle PNG)" data-i18n-en="Circle (PNG)">বৃত্তাকার (Circle PNG)</span></label>
                </div>
              </fieldset>
            </div>

            <div class="pdf-img-settings img-grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style="margin-top: .85rem; padding-top: .75rem; border-top: 1px dashed var(--line);">
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgCropCustomW" data-i18n-bn="কাস্টম প্রস্থ — Width (px):" data-i18n-en="Custom Width (px):">কাস্টম প্রস্থ — Width (px):</label>
                <input type="number" id="imgCropCustomW" name="imgCropCustomW" min="1" max="8000" placeholder="অটো (ক্রপ অনুযায়ী)" data-i18n-placeholder-bn="অটো (ক্রপ অনুযায়ী)" data-i18n-placeholder-en="Auto (from crop)">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgCropCustomH" data-i18n-bn="কাস্টম উচ্চতা — Height (px):" data-i18n-en="Custom Height (px):">কাস্টম উচ্চতা — Height (px):</label>
                <input type="number" id="imgCropCustomH" name="imgCropCustomH" min="1" max="8000" placeholder="অটো (ক্রপ অনুযায়ী)" data-i18n-placeholder-bn="অটো (ক্রপ অনুযায়ী)" data-i18n-placeholder-en="Auto (from crop)">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border" style="grid-column: span 2;">
                <label for="imgCropLockCustomRatio" data-i18n-bn="কাস্টম সাইজ অপশন:" data-i18n-en="Custom Size Options:">কাস্টম সাইজ অপশন:</label>
                <div class="img-color-row flex items-center flex-wrap gap-2">
                  <label class="switch pdf-inline-switch">
                    <input type="checkbox" id="imgCropLockCustomRatio" name="imgCropLockCustomRatio" checked>
                    <span class="switch__track"><span class="switch__knob"></span></span>
                    <span class="switch__label" data-i18n-bn="কাস্টম মাপের অনুপাতে ক্রপ বক্স লক রাখুন" data-i18n-en="Lock crop box to custom aspect ratio">কাস্টম মাপের অনুপাতে ক্রপ বক্স লক রাখুন</span>
                  </label>
                  <button type="button" class="chip-btn" id="imgCropClearCustomBtn" data-i18n-bn="অটো সাইজে ফিরুন" data-i18n-en="Reset to Auto Size">অটো সাইজে ফিরুন</button>
                </div>
              </div>
            </div>
          </div>

          <div class="img-crop-workbench grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 my-4 items-start">
            <div class="img-crop-stage-wrap relative inline-block max-w-full mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-studio-border bg-slate-900 select-none touch-none" id="imgCropInteractiveWrap">
              <canvas id="imgCropSourceCanvas"></canvas>
              <div
                class="img-crop-box absolute border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(9,13,22,0.58)] cursor-move box-border"
                id="imgCropBox"
                tabindex="0"
                aria-label="ক্রপ বক্স — মাউস বা টাচ দিয়ে টেনে অথবা অ্যারো কী চেপে ক্রপ এরিয়া পরিবর্তন করুন"
              >
                <span class="img-crop-handle" data-h="nw"></span>
                <span class="img-crop-handle" data-h="n"></span>
                <span class="img-crop-handle" data-h="ne"></span>
                <span class="img-crop-handle" data-h="e"></span>
                <span class="img-crop-handle" data-h="se"></span>
                <span class="img-crop-handle" data-h="s"></span>
                <span class="img-crop-handle" data-h="sw"></span>
                <span class="img-crop-handle" data-h="w"></span>
              </div>
            </div>
            <div class="img-preview-box img-preview-box--out rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border overflow-hidden flex flex-col">
              <div class="img-preview-box__head flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text">
                <strong data-i18n-bn="ক্রপড আউটপুট প্রিভিউ" data-i18n-en="Cropped Output Preview">ক্রপড আউটপুট প্রিভিউ</strong>
                <span id="imgCropOutMeta">—</span>
              </div>
              <div class="img-preview-box__canvas relative min-h-[260px] p-4 flex items-center justify-center bg-slate-100/70 dark:bg-studio-bg/60 [&_img]:max-w-full [&_img]:max-h-[340px] [&_img]:object-contain [&_img]:rounded">
                <img id="imgCropOutPreview" alt="Cropped Preview" width="260" height="260">
              </div>
            </div>
          </div>

          <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
            <div class="pdf-summary-pill" id="imgCropSummary" data-i18n-bn="ক্রপ বক্স টেনে অংশ নির্বাচন করুন" data-i18n-en="Drag crop box to select area">ক্রপ বক্স টেনে অংশ নির্বাচন করুন</div>
            <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCropDownloadBtn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
              <span data-i18n-bn="ক্রপ করা ছবি ডাউনলোড করুন" data-i18n-en="Download Cropped Image">ক্রপ করা ছবি ডাউনলোড করুন</span>
            </button>
          </div>
        </div>
      </div>
      {/if}

      <!-- ========================================== 4. CONVERT, EFFECTS, WATERMARK & BORDER -->
      {#if renderAll || initialTab === 'convert'}
      <div class="img-pane space-y-4" id="img-pane-convert" hidden={initialTab !== 'convert'}>
        <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 class="pdf-ws-title text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="ফরম্যাট কনভার্টার, ফটো ইফেক্ট ও ওয়াটারমার্ক" data-i18n-en="Format Converter, Photo Effects & Watermark">ফরম্যাট কনভার্টার, ফটো ইফেক্ট ও ওয়াটারমার্ক</h3>
          </div>
          <div class="pdf-ws-actions" id="imgConvertTopActions" hidden>
            <button type="button" class="chip-btn" id="imgConvertResetFiltersBtn" data-i18n-bn="↺ ইফেক্ট রিসেট" data-i18n-en="↺ Reset Effects">↺ ইফেক্ট রিসেট</button>
            <button type="button" class="chip-btn chip-btn--danger" id="imgConvertResetBtn" data-i18n-bn="অন্য ছবি নিন" data-i18n-en="Change Image">অন্য ছবি নিন</button>
          </div>
        </div>

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-amber-500 dark:hover:border-amber-400 cursor-pointer transition-colors" id="imgConvertDropzone" for="imgConvertInput">
          <input type="file" id="imgConvertInput" name="imgConvertInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fill-opacity="0.16"/><circle cx="8.5" cy="8.5" r="1.5" fill="#f59e0b"/><path d="m21 15-5-5L5 21"/></svg>
          </div>
          <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="কনভার্ট বা এডিট করার জন্য ছবি ছাড়ুন বা সিলেক্ট করুন" data-i18n-en="Drag & drop an image here or click to browse">কনভার্ট বা এডিট করার জন্য ছবি ছাড়ুন বা সিলেক্ট করুন</div>
        </label>

        <div class="pdf-workspace-stage" id="imgConvertStage" hidden>
          <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3">
            <fieldset class="pdf-fieldset border-0 p-0 m-0">
              <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-1.5" data-i18n-bn="আউটপুট ফরম্যাট নির্বাচন করুন:" data-i18n-en="Select Output Format:">আউটপুট ফরম্যাট নির্বাচন করুন:</legend>
              <div class="pdf-radio-inline flex items-center flex-wrap gap-3 text-xs text-slate-700 dark:text-studio-text">
                <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgConvertFmt" value="image/jpeg" checked> JPG (.jpg)</label>
                <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgConvertFmt" value="image/png"> PNG (.png)</label>
                <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgConvertFmt" value="image/webp"> WebP (.webp)</label>
                <label class="dc-radio inline-flex items-center gap-1.5 cursor-pointer font-medium [&_input]:accent-emerald-600"><input type="radio" name="imgConvertFmt" value="base64"> Base64 Data URL</label>
              </div>
            </fieldset>

            <div class="pdf-img-settings img-grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style="margin-top: .9rem;">
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgEffBright"><span data-i18n-bn="উজ্জ্বলতা (Brightness):" data-i18n-en="Brightness:">উজ্জ্বলতা (Brightness):</span> <span id="imgEffBrightVal">100%</span></label>
                <input type="range" id="imgEffBright" name="imgEffBright" min="40" max="180" value="100">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgEffContrast"><span data-i18n-bn="কনট্রাস্ট (Contrast):" data-i18n-en="Contrast:">কনট্রাস্ট (Contrast):</span> <span id="imgEffContrastVal">100%</span></label>
                <input type="range" id="imgEffContrast" name="imgEffContrast" min="40" max="200" value="100">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgEffSat"><span data-i18n-bn="রঙের গভীরতা (Saturation):" data-i18n-en="Saturation:">রঙের গভীরতা (Saturation):</span> <span id="imgEffSatVal">100%</span></label>
                <input type="range" id="imgEffSat" name="imgEffSat" min="0" max="200" value="100">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgEffBorder" data-i18n-bn="বর্ডার প্রশস্ততা (Border px):" data-i18n-en="Border Width (px):">বর্ডার প্রশস্ততা (Border px):</label>
                <div class="img-color-row flex items-center flex-wrap gap-2">
                  <input type="number" id="imgEffBorder" name="imgEffBorder" value="0" min="0" max="120" style="max-width:78px;">
                  <input type="color" id="imgEffBorderColor" name="imgEffBorderColor" value="#ffffff" aria-label="Border Color">
                </div>
              </div>
            </div>

            <div class="pdf-img-settings img-grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style="margin-top: .85rem;">
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border" style="grid-column: span 2;">
                <label for="imgWatermarkText" data-i18n-bn="ছবির ওপর লেখা / ক্যাপশন / ওয়াটারমার্ক (ঐচ্ছিক):" data-i18n-en="Watermark / Caption Text (Optional):">ছবির ওপর লেখা / ক্যাপশন / ওয়াটারমার্ক (ঐচ্ছিক):</label>
                <input type="text" id="imgWatermarkText" name="imgWatermarkText" placeholder="যেমন: © TechHat অথবা আপনার নাম/তারিখ" data-i18n-placeholder-bn="যেমন: © TechHat অথবা আপনার নাম/তারিখ" data-i18n-placeholder-en="e.g. © TechHat or your name/date">
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgWatermarkPos" data-i18n-bn="লেখার অবস্থান:" data-i18n-en="Text Position:">লেখার অবস্থান:</label>
                <select id="imgWatermarkPos" name="imgWatermarkPos">
                  <option value="bottom" selected data-i18n-bn="নিচে মাঝখানে (Bottom)" data-i18n-en="Bottom Center">নিচে মাঝখানে (Bottom)</option>
                  <option value="center" data-i18n-bn="একদম মাঝখানে (Center)" data-i18n-en="Center">একদম মাঝখানে (Center)</option>
                  <option value="top" data-i18n-bn="উপরে মাঝখানে (Top)" data-i18n-en="Top Center">উপরে মাঝখানে (Top)</option>
                  <option value="br" data-i18n-bn="নিচে ডান কোণায়" data-i18n-en="Bottom Right">নিচে ডান কোণায়</option>
                </select>
              </div>
              <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                <label for="imgWatermarkColor" data-i18n-bn="লেখার রঙ:" data-i18n-en="Text Color:">লেখার রঙ:</label>
                <div class="img-color-row flex items-center flex-wrap gap-2">
                  <input type="color" id="imgWatermarkColor" name="imgWatermarkColor" value="#ffffff">
                  <label class="switch pdf-inline-switch">
                    <input type="checkbox" id="imgEffGray" name="imgEffGray">
                    <span class="switch__track"><span class="switch__knob"></span></span>
                    <span class="switch__label" data-i18n-bn="সাদাকালো" data-i18n-en="Grayscale">সাদাকালো</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="img-preview-box img-preview-box--out rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border overflow-hidden flex flex-col" style="max-width: 640px; margin-inline: auto;">
            <div class="img-preview-box__head flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text">
              <strong data-i18n-bn="লাইভ প্রিভিউ" data-i18n-en="Live Preview">লাইভ প্রিভিউ</strong>
              <span id="imgConvertOutMeta">—</span>
            </div>
            <div class="img-preview-box__canvas relative min-h-[260px] p-4 flex items-center justify-center bg-slate-100/70 dark:bg-studio-bg/60 [&_img]:max-w-full [&_img]:max-h-[340px] [&_img]:object-contain [&_img]:rounded">
              <img id="imgConvertOutPreview" alt="Converted Preview" width="400" height="300">
            </div>
          </div>

          <div id="imgBase64Box" class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3" hidden style="margin-top: .85rem;">
            <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
              <label for="imgBase64Output" data-i18n-bn="Base64 Data URL (HTML / CSS-এ ব্যবহারের জন্য):" data-i18n-en="Base64 Data URL (for HTML / CSS):">Base64 Data URL (HTML / CSS-এ ব্যবহারের জন্য):</label>
              <textarea id="imgBase64Output" name="imgBase64Output" class="textbox" rows="4" readonly autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
            </div>
            <div style="margin-top: .5rem; display:flex; justify-content:flex-end;">
              <button type="button" class="chip-btn chip-btn--accent" id="imgBase64CopyBtn" data-i18n-bn="📋 Base64 কোড কপি করুন" data-i18n-en="📋 Copy Base64 Code">📋 Base64 কোড কপি করুন</button>
            </div>
          </div>

          <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
            <div class="pdf-summary-pill" id="imgConvertSummary" data-i18n-bn="প্রস্তুত" data-i18n-en="Ready">প্রস্তুত</div>
            <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgConvertDownloadBtn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
              <span data-i18n-bn="ইমেজ ডাউনলোড করুন" data-i18n-en="Download Image">ইমেজ ডাউনলোড করুন</span>
            </button>
          </div>
        </div>
      </div>
      {/if}

      <!-- ========================================== 5. ID CARD SCANNER & TOP-BOTTOM COMBINER -->
      {#if renderAll || initialTab === 'combine'}
      <NidCardScanner hidden={initialTab !== 'combine'} />
      {/if}

      <!-- ========================================== 6. COLOR PICKER & PALETTE -->
      {#if renderAll || initialTab === 'colors'}
      <div class="img-pane space-y-4" id="img-pane-colors" hidden={initialTab !== 'colors'}>
        <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 class="pdf-ws-title text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="কালার পিকার ও প্যালেট জেনারেটর" data-i18n-en="Color Picker & Palette Generator">কালার পিকার ও প্যালেট জেনারেটর</h3>
          </div>
          <div class="pdf-ws-actions" id="imgColorsTopActions" hidden>
            <button type="button" class="chip-btn chip-btn--danger" id="imgColorsResetBtn" data-i18n-bn="অন্য ছবি নিন" data-i18n-en="Change Image">অন্য ছবি নিন</button>
          </div>
        </div>

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-rose-500 dark:hover:border-rose-400 cursor-pointer transition-colors" id="imgColorsDropzone" for="imgColorsInput">
          <input type="file" id="imgColorsInput" name="imgColorsInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/15 to-pink-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2v-.5a1.5 1.5 0 0 1 1.5-1.5H17a5 5 0 0 0 5-5c0-5.5-4.5-11-10-11z" fill="currentColor" fill-opacity="0.16"/><circle cx="13.5" cy="6.5" r="1.2" fill="#ef4444" stroke="none"/><circle cx="17.5" cy="10.5" r="1.2" fill="#f59e0b" stroke="none"/><circle cx="8.5" cy="7.5" r="1.2" fill="#3b82f6" stroke="none"/><circle cx="6.5" cy="12.5" r="1.2" fill="#10b981" stroke="none"/></svg>
          </div>
          <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="রঙ বাছাই করার জন্য একটি ছবি ছাড়ুন বা সিলেক্ট করুন" data-i18n-en="Drag & drop an image to pick colors or click to browse">রঙ বাছাই করার জন্য একটি ছবি ছাড়ুন বা সিলেক্ট করুন</div>
        </label>

        <div class="pdf-workspace-stage" id="imgColorsStage" hidden>
          <div class="img-color-picker-layout grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 items-start">
            <div class="img-color-canvas-wrap rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-3 flex items-center justify-center overflow-auto [&_canvas]:max-w-full [&_canvas]:h-auto [&_canvas]:cursor-crosshair [&_canvas]:rounded">
              <canvas id="imgColorsCanvas"></canvas>
            </div>
            <div class="img-color-side">
              <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3">
                <div class="img-picked-swatch w-full h-16 rounded-xl border border-slate-200 dark:border-studio-border mb-3 shadow-inner" id="imgPickedSwatch" style="background: #059669;"></div>
                <div class="img-picked-codes flex items-center flex-wrap gap-2">
                  <button type="button" class="chip-btn" id="imgCopyHexBtn" title="HEX কোড কপি করুন" data-i18n-title-bn="HEX কোড কপি করুন" data-i18n-title-en="Copy HEX Code">
                    HEX: <strong id="imgPickedHex">#059669</strong> 📋
                  </button>
                  <button type="button" class="chip-btn" id="imgCopyRgbBtn" title="RGB কোড কপি করুন" data-i18n-title-bn="RGB কোড কপি করুন" data-i18n-title-en="Copy RGB Code">
                    RGB: <strong id="imgPickedRgb">rgb(5, 150, 105)</strong> 📋
                  </button>
                </div>
              </div>

              <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3" style="margin-top: .85rem;">
                <strong style="display:block; font-size:.86rem; margin-bottom:.55rem;" data-i18n-bn="ছবির প্রধান রঙের প্যালেট (ক্লিক করে কপি করুন):" data-i18n-en="Dominant Color Palette (click to copy):">ছবির প্রধান রঙের প্যালেট (ক্লিক করে কপি করুন):</strong>
                <div class="img-palette-grid grid grid-cols-3 sm:grid-cols-4 gap-2" id="imgPaletteGrid"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/if}

    </div>
  </section>

  <!-- Before / After Image Quality Comparison Dialog -->
  <dialog class="pdf-dialog pdf-dialog--wide w-full max-w-5xl rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-5 text-slate-900 dark:text-studio-text shadow-2xl backdrop:bg-slate-950/60" id="imgPreviewDialog" closedby="any" aria-labelledby="imgPreviewTitle">
    <div class="pdf-dialog__head flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-studio-border">
      <div>
        <h3 class="pdf-dialog__title text-base font-bold m-0" id="imgPreviewTitle" data-i18n-bn="আগে ও পরে তুলনা" data-i18n-en="Before & After Comparison">আগে ও পরে তুলনা</h3>
        <p class="pdf-dialog__sub text-xs text-slate-500 dark:text-studio-muted m-0" id="imgPreviewSub"></p>
      </div>
      <div class="pdf-ws-actions">
        <button type="button" class="ai-close pdf-dialog__close w-8 h-8 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel flex items-center justify-center cursor-pointer" id="imgPreviewClose" aria-label="Close" data-i18n-title-bn="বন্ধ করুন" data-i18n-title-en="Close">✕</button>
      </div>
    </div>
    <div class="pdf-dialog__body">
      <div class="pdf-preview-stage" id="imgPreviewStage"></div>
    </div>
  </dialog>

  <!-- Live Camera Capture Dialog -->
  <dialog class="pdf-dialog w-full max-w-2xl rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-5 text-slate-900 dark:text-studio-text shadow-2xl backdrop:bg-slate-950/60" id="nidCameraDialog" closedby="any" aria-labelledby="nidCameraTitle">
    <div class="pdf-dialog__head flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-studio-border">
      <div>
        <h3 class="pdf-dialog__title text-base font-bold m-0" id="nidCameraTitle" data-i18n-bn="আইডি কার্ড ক্যামেরা স্ক্যানার" data-i18n-en="ID Card Camera Scanner">আইডি কার্ড ক্যামেরা স্ক্যানার</h3>
      </div>
      <div class="pdf-ws-actions">
        <button type="button" class="ai-close pdf-dialog__close w-8 h-8 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel flex items-center justify-center cursor-pointer" id="nidCameraClose" aria-label="Close" data-i18n-title-bn="বন্ধ করুন" data-i18n-title-en="Close">✕</button>
      </div>
    </div>
    <div class="pdf-dialog__body">
      <div class="nid-cam-viewfinder relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover">
        <video id="nidCameraVideo" width="640" height="400" autoplay playsinline muted></video>
        <div class="nid-cam-guide absolute inset-6 border-2 border-dashed border-emerald-400/80 rounded-xl flex items-end justify-center pb-3 pointer-events-none [&_span]:px-3 [&_span]:py-1 [&_span]:rounded-full [&_span]:bg-black/70 [&_span]:text-white [&_span]:text-xs" aria-hidden="true">
          <span data-i18n-bn="আইডি কার্ড এই ফ্রেমের ভেতর রাখুন" data-i18n-en="Keep ID card inside this frame">আইডি কার্ড এই ফ্রেমের ভেতর রাখুন</span>
        </div>
      </div>
      <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border" style="margin-top: .85rem;">
        <button type="button" class="chip-btn nid-icon-btn inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidCameraSwitchBtn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          <span data-i18n-bn="ক্যামেরা পরিবর্তন" data-i18n-en="Switch Camera">ক্যামেরা পরিবর্তন</span>
        </button>
        <button type="button" class="btn btn--primary nid-icon-btn" id="nidCameraSnapBtn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>
          <span data-i18n-bn="ছবি তুলুন ও অটো-ক্রপ করুন" data-i18n-en="Capture & Auto-Crop">ছবি তুলুন ও অটো-ক্রপ করুন</span>
        </button>
      </div>
    </div>
  </dialog>
</div>

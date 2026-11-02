<script lang="ts">
  import DocumentScanner from './DocumentScanner.svelte';

  interface Props {
    initialTab?: 'hub' | 'resize' | 'compress' | 'crop' | 'convert' | 'combine' | 'scan' | 'colors';
  }

  let { initialTab = 'hub' }: Props = $props();
  let renderAll = $derived(initialTab === 'hub');
</script>
<div class="tool-view w-full" id="tool-image" data-initial-tab={initialTab}>
  <section class="card util-card pdf-studio-card img-studio-card rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xs p-3.5 sm:p-5" aria-label="Image Studio">
    <div class="util-body pdf-studio-body">
      {#if renderAll || initialTab === 'scan'}<DocumentScanner active={initialTab === 'scan'} />{/if}
      <!-- ========================================== 0. HUB OVERVIEW -->
      {#if renderAll}
      <div class="img-pane space-y-4" id="img-pane-hub" hidden={initialTab !== 'hub'}>
        <div class="pdf-hub-hero mb-4">
          <h2 class="pdf-hub-title text-lg font-bold text-slate-900 dark:text-studio-text m-0 [&_span]:text-emerald-600 dark:[&_span]:text-studio-primary" data-i18n-bn="অল-ইন-ওয়ান ইমেজ স্টুডিও" data-i18n-en="All-in-One Image Studio">অল-ইন-ওয়ান <span>ইমেজ স্টুডিও</span></h2>
        </div>

        <div class="pdf-hub-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="scan" data-accent="teal">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 8h10M7 12h10M7 16h7"/></svg></span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="ডকুমেন্ট স্ক্যানার" data-i18n-en="Document Scanner">ডকুমেন্ট স্ক্যানার</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="অটো পেজ ডিটেক্ট, বাঁকা পেজ সোজা, শ্যাডো সংশোধন ও পরিষ্কার লেখা। একাধিক পেজ থেকে PDF তৈরি করুন।" data-i18n-en="Auto page detection, perspective deskew, shadow removal & multipage PDF export.">অটো পেজ ডিটেক্ট, বাঁকা পেজ সোজা, শ্যাডো সংশোধন ও পরিষ্কার লেখা। একাধিক পেজ থেকে PDF তৈরি করুন।</span>
          </button>
          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="resize" data-preset="job-photo" data-accent="teal">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="রিসাইজ ও সরকারি ফর্ম প্রিসেট" data-i18n-en="Image Resizer & Presets">রিসাইজ ও সরকারি ফর্ম প্রিসেট</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="চাকরির ছবি (300×300), আনসার ভিডিপি (250×250), স্বাক্ষর (300×80 ও 300×100), পাসপোর্ট সাইজ ও পজিশনিং।" data-i18n-en="Job photo (300×300), Ansar VDP (250×250), signature (300×80 & 300×100), passport size & positioning.">চাকরির ছবি (300×300), আনসার ভিডিপি (250×250), স্বাক্ষর (300×80 ও 300×100), পাসপোর্ট সাইজ ও পজিশনিং।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="compress" data-accent="green">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="কমপ্রেস ইমেজ" data-i18n-en="Compress Image">কমপ্রেস ইমেজ</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="কোয়ালিটি ঠিক রেখে ছবির KB কমান এবং প্রিভিউ দেখে ডাউনলোড করুন।" data-i18n-en="Reduce image file size in KB while preserving quality with live preview.">কোয়ালিটি ঠিক রেখে ছবির KB কমান এবং প্রিভিউ দেখে ডাউনলোড করুন।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="crop" data-accent="purple">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="ক্রপ, কাস্টম সাইজ ও রাউন্ড ফটো" data-i18n-en="Crop & Circle Photo">ক্রপ, কাস্টম সাইজ ও রাউন্ড ফটো</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="কাস্টম সাইজে (px) বা অনুপাতে ছবি ক্রপ (250×250, 300×100, 1:1), ঘোরান ও বৃত্তাকার ছবি তৈরি করুন।" data-i18n-en="Crop images to custom dimensions or aspect ratios, rotate, flip & create circular avatars.">কাস্টম সাইজে (px) বা অনুপাতে ছবি ক্রপ (250×250, 300×100, 1:1), ঘোরান ও বৃত্তাকার ছবি তৈরি করুন।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="convert" data-accent="amber">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="কনভার্ট, ইফেক্ট ও ওয়াটারমার্ক" data-i18n-en="Convert & Watermark">কনভার্ট, ইফেক্ট ও ওয়াটারমার্ক</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="JPG ⇄ PNG ⇄ WebP ⇄ Base64 রূপান্তর, ছবির ওপর লেখা, বর্ডার ও ফটো ইফেক্ট।" data-i18n-en="Convert between JPG, PNG, WebP & Base64, add watermarks, borders & photo filters.">JPG ⇄ PNG ⇄ WebP ⇄ Base64 রূপান্তর, ছবির ওপর লেখা, বর্ডার ও ফটো ইফেক্ট।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="combine" data-accent="blue">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/></svg>
            </span>
            <span class="pdf-hub-card__title text-sm font-bold text-slate-900 dark:text-studio-text mb-1" data-i18n-bn="আইডি কার্ড স্ক্যানার ও ছবি জোড়া" data-i18n-en="NID Card Scanner">আইডি কার্ড স্ক্যানার ও ছবি জোড়া</span>
            <span class="pdf-hub-card__desc text-xs text-slate-500 dark:text-studio-muted leading-relaxed" data-i18n-bn="অটো এজ ডিটেকশন, ৪-কোণা পার্সপেক্টিভ ক্রপ ও কালার এডজাস্ট করে A4 পাতায় উপরে-নিচে বসান।" data-i18n-en="Auto edge detection, 4-corner perspective crop & color tuning on an A4 print sheet.">অটো এজ ডিটেকশন, ৪-কোণা পার্সপেক্টিভ ক্রপ ও কালার এডজাস্ট করে A4 পাতায় উপরে-নিচে বসান।</span>
          </button>

          <button type="button" class="pdf-hub-card flex flex-col items-start text-left p-4 rounded-xl bg-slate-50/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" data-open-img="colors" data-accent="red">
            <span class="pdf-hub-card__icon w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-2.5 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2v-.5a1.5 1.5 0 0 1 1.5-1.5H17a5 5 0 0 0 5-5c0-5.5-4.5-11-10-11z"/></svg>
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

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="imgResizeDropzone" for="imgResizeInput">
          <input type="file" id="imgResizeInput" name="imgResizeInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
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
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
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

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="imgCropDropzone" for="imgCropInput">
          <input type="file" id="imgCropInput" name="imgCropInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
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

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="imgConvertDropzone" for="imgConvertInput">
          <input type="file" id="imgConvertInput" name="imgConvertInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
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
      <div class="img-pane th-nid-studio flex flex-col min-h-[540px] lg:h-[calc(100dvh-3.5rem)] overflow-hidden" id="img-pane-combine" data-mobile-view="edit" hidden={initialTab !== 'combine'}>
        <!-- UNIFIED STUDIO TOP APPLICATION BAR -->
        <div class="pdf-ws-head th-studio-header min-h-[58px] px-4 py-2 border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar flex flex-wrap lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-between gap-3 shrink-0">
          <div class="th-studio-brand flex items-center gap-3 min-w-0">
            <h3 class="pdf-ws-title th-doc-title" style="display:inline-flex" data-i18n-bn="আইডি কার্ড ও প্রিন্ট এডিটর" data-i18n-en="ID Card & Print Editor">আইডি কার্ড ও প্রিন্ট এডিটর</h3>
          </div>

          <!-- Center Front / Back Segmented Switcher -->
          <div class="th-studio-center-tabs lg:justify-self-center max-lg:order-3 max-lg:w-full">
            <div class="nid-card-tabs flex items-center gap-1.5 max-w-full overflow-x-auto p-1 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border" id="nidCardTabs" role="tablist" aria-label="ID Card Pages"></div>
          </div>

          <!-- Right App Bar Controls: Undo / Redo / Quick Actions -->
          <div class="th-header-right flex items-center gap-2 lg:justify-self-end">
            <div class="th-history-group inline-flex items-center gap-1" role="group" aria-label="Undo & Redo">
              <button type="button" class="th-icon-action w-9 h-9 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-700 dark:text-studio-text inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidUndoBtn" title="পূর্বের অবস্থায় ফিরুন (Undo — Ctrl+Z)" data-i18n-title-bn="পূর্বের অবস্থায় ফিরুন (Undo — Ctrl+Z)" data-i18n-title-en="Undo (Ctrl+Z)" disabled>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
              </button>
              <button type="button" class="th-icon-action w-9 h-9 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-700 dark:text-studio-text inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidRedoBtn" title="পরবর্তী অবস্থায় যান (Redo — Ctrl+Y)" data-i18n-title-bn="পরবর্তী অবস্থায় যান (Redo — Ctrl+Y)" data-i18n-title-en="Redo (Ctrl+Y)" disabled>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>
              </button>
            </div>

            <div class="pdf-ws-actions nid-top-actions flex items-center gap-1.5 flex-wrap" id="imgCombineTopActions" hidden>
              <button type="button" class="chip-btn" id="nidReplaceActiveBtn" title="নির্বাচিত পাশের ছবি বদলান" data-i18n-title-bn="নির্বাচিত পাশের ছবি বদলান" data-i18n-title-en="Replace image for active side" data-i18n-bn="ছবি বদলান" data-i18n-en="Replace">ছবি বদলান</button>
              <input type="file" id="nidReplaceFrontInput" accept="image/*" hidden>
              <input type="file" id="nidReplaceBackInput" accept="image/*" hidden>
              <input type="file" id="nidReplaceExtraInput" accept="image/*" hidden>
              <button type="button" class="chip-btn nid-icon-btn inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidCameraStageBtn" title="ক্যামেরা দিয়ে সরাসরি আইডি কার্ড স্ক্যান করুন" data-i18n-title-bn="ক্যামেরা দিয়ে সরাসরি আইডি কার্ড স্ক্যান করুন" data-i18n-title-en="Scan ID card with camera">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                <span data-i18n-bn="ক্যামেরা" data-i18n-en="Camera">ক্যামেরা</span>
              </button>
              <button type="button" class="chip-btn nid-icon-btn inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidCloneSameImgBtn" title="একই ছবির ভেতর সামনের ও পেছনের অংশ থাকলে অপর পাশ ক্রপ করুন" data-i18n-title-bn="একই ছবির ভেতর সামনের ও পেছনের অংশ থাকলে অপর পাশ ক্রপ করুন" data-i18n-title-en="Clone same image to crop 2nd side">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>
                <span data-i18n-bn="২য় পাশ ক্লোন" data-i18n-en="Clone 2nd Side">২য় পাশ ক্লোন</span>
              </button>
              <button type="button" class="chip-btn nid-icon-btn inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCombineSwapBtn" title="সামনের ও পেছনের অংশের অবস্থান অদলবদল করুন" data-i18n-title-bn="সামনের ও পেছনের অংশের অবস্থান অদলবদল করুন" data-i18n-title-en="Swap front and back sides">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></svg>
                <span data-i18n-bn="পাশ বদলান" data-i18n-en="Swap Sides">পাশ বদলান</span>
              </button>
              <label class="chip-btn nid-icon-btn inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" for="imgCombineAddMore" title="আরও কার্ডের ছবি যুক্ত করুন" data-i18n-title-bn="আরও কার্ডের ছবি যুক্ত করুন" data-i18n-title-en="Add more card images">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                <span data-i18n-bn="আরও ছবি" data-i18n-en="Add More">আরও ছবি</span>
                <input type="file" id="imgCombineAddMore" name="imgCombineAddMore" accept="image/*" multiple class="visually-hidden sr-only">
              </label>
              <button type="button" class="chip-btn chip-btn--danger nid-icon-btn inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCombineClearBtn" title="সব ছবি মুছে নতুন করে শুরু করুন" data-i18n-title-bn="সব ছবি মুছে নতুন করে শুরু করুন" data-i18n-title-en="Clear all and start fresh">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span data-i18n-bn="নতুন" data-i18n-en="New">নতুন</span>
              </button>
            </div>
          </div>
        </div>

        <!-- INITIAL EMPTY CANVAS WORKSPACE (Calm Studio Artboard Instead of Dashboard Cards) -->
        <div id="imgCombineDropzone" class="th-empty-workspace flex-1 min-h-0 overflow-y-auto">
          <div class="th-empty-canvas-stage min-h-full py-8 px-4 flex items-center justify-center">
            <div class="th-empty-artboard relative w-full max-w-[680px] p-8 sm:p-10 rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-lg text-center flex flex-col items-center">
              <span class="th-artboard-corner th-artboard-corner--tl" aria-hidden="true"></span>
              <span class="th-artboard-corner th-artboard-corner--tr" aria-hidden="true"></span>
              <span class="th-artboard-corner th-artboard-corner--br" aria-hidden="true"></span>
              <span class="th-artboard-corner th-artboard-corner--bl" aria-hidden="true"></span>

              <div class="th-empty-artboard__badge px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-studio-primary text-[11px] font-bold tracking-wider mb-3">ID CARD &amp; PRINT WORKSPACE • 300 DPI</div>

              <div class="th-empty-artboard__icon w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3 [&_svg]:w-7 [&_svg]:h-7 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11.5" r="2"/><path d="M5.5 15.5c.6-1.2 1.4-1.8 2.5-1.8s1.9.6 2.5 1.8M13 10h6M13 13.5h4"/></svg>
              </div>

              <h4 class="th-empty-artboard__title text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-studio-text m-0 mb-2" data-i18n-bn="দুই পাশের ছবি থেকে প্রিন্ট-রেডি কার্ড" data-i18n-en="Print-Ready ID Card from Both Sides">দুই পাশের ছবি থেকে প্রিন্ট-রেডি কার্ড</h4>
              <p class="th-empty-artboard__desc text-sm text-slate-500 dark:text-studio-muted max-w-[480px] leading-relaxed m-0 mb-5" data-i18n-bn="প্রথমে সামনের ছবি যোগ করুন। তারপর চার কোণা মিলিয়ে ক্রপ করুন, পেছনের ছবি যোগ করুন এবং প্রিভিউ দেখে ডাউনলোড করুন।" data-i18n-en="Add front image first. Align four corners to crop, add back image, check preview and download.">প্রথমে সামনের ছবি যোগ করুন। তারপর চার কোণা মিলিয়ে ক্রপ করুন, পেছনের ছবি যোগ করুন এবং প্রিভিউ দেখে ডাউনলোড করুন।</p>

              <div class="th-empty-artboard__actions flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                <label class="btn btn--primary nid-slot-upload-btn flex-1 w-full h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" for="nidFrontInput">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span data-i18n-bn="সামনের পৃষ্ঠা আপলোড" data-i18n-en="Upload Front Side">সামনের পৃষ্ঠা আপলোড</span>
                  <input type="file" id="nidFrontInput" name="nidFrontInput" accept="image/*" class="visually-hidden sr-only">
                </label>

                <label class="th-btn-secondary nid-slot-upload-btn flex-1 w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-studio-panel hover:border-emerald-500 border border-slate-200 dark:border-studio-border text-slate-800 dark:text-studio-text text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" for="nidBackInput">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span data-i18n-bn="পেছনের পৃষ্ঠা আপলোড" data-i18n-en="Upload Back Side">পেছনের পৃষ্ঠা আপলোড</span>
                  <input type="file" id="nidBackInput" name="nidBackInput" accept="image/*" class="visually-hidden sr-only">
                </label>
              </div>
              <p class="nid-upload-note text-xs text-slate-400 dark:text-studio-muted my-3" data-i18n-bn="অথবা ছবি এখানে টেনে ছাড়ুন · JPG, PNG, WebP" data-i18n-en="Or drag & drop images here · JPG, PNG, WebP">অথবা ছবি এখানে টেনে ছাড়ুন · JPG, PNG, WebP</p>

              <div class="th-empty-artboard__subactions flex items-center justify-center flex-wrap gap-3 text-xs">
                <label class="th-empty-link inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-studio-primary bg-transparent border-0 cursor-pointer hover:underline [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" for="imgCombineInput">
                  <input type="file" id="imgCombineInput" name="imgCombineInput" accept="image/*" multiple class="visually-hidden sr-only">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/></svg>
                  <span data-i18n-bn="একসাথে একাধিক ছবি নির্বাচন করুন" data-i18n-en="Select multiple images together">একসাথে একাধিক ছবি নির্বাচন করুন</span>
                </label>
                <span class="th-dot-sep" aria-hidden="true">•</span>
                <button type="button" class="th-empty-link inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-studio-primary bg-transparent border-0 cursor-pointer hover:underline [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" data-cam-slot="0">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  <span data-i18n-bn="ক্যামেরা দিয়ে স্ক্যান" data-i18n-en="Scan with camera">ক্যামেরা দিয়ে স্ক্যান</span>
                </button>
                <button type="button" class="visually-hidden sr-only" data-cam-slot="1" tabindex="-1" data-i18n-bn="পেছনের ক্যামেরা" data-i18n-en="Back Camera">পেছনের ক্যামেরা</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ACTIVE PROFESSIONAL DESIGN WORKSPACE -->
        <div class="pdf-workspace-stage th-studio-stage flex-1 min-h-0 flex flex-col overflow-hidden" id="imgCombineStage" hidden>
          <nav class="nid-mobile-nav lg:hidden grid grid-cols-3 gap-1.5 p-2 border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar" aria-label="Editor View">
            <button type="button" data-nid-view="images" aria-pressed="false" aria-controls="nidImagesPanel" data-i18n-bn="রঙ ও আলো" data-i18n-en="Color & Light">রঙ ও আলো</button>
            <button type="button" data-nid-view="edit" aria-pressed="true" aria-controls="nidScannerCropPanel" data-i18n-bn="ক্যানভাস" data-i18n-en="Canvas">ক্যানভাস</button>
            <button type="button" data-nid-view="print" aria-pressed="false" aria-controls="nidPreviewPanel nidPrintPanel" data-i18n-bn="প্রিন্ট ও সেভ" data-i18n-en="Print & Save">প্রিন্ট ও সেভ</button>
          </nav>
          <div class="th-studio-3panel flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_310px] overflow-hidden">

            

            <!-- ========================================== PANEL 2: CENTER CANVAS WORKSPACE (LEVEL 1 FOCUS) -->
            <div class="th-panel th-panel--center min-h-0 flex flex-col overflow-hidden" id="nidScannerCropPanel">
              <div class="nid-workspace-split flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] overflow-hidden">
                <div class="nid-canvas-column flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-100 dark:bg-studio-bg">
                  <!-- Floating Contextual Editor Toolbar -->
                  <div class="th-context-toolbar flex items-center flex-wrap gap-1.5 p-2 bg-white dark:bg-studio-sidebar border-b border-slate-200 dark:border-studio-border shrink-0" role="toolbar" aria-label="Toolbar">
                    <div class="nid-tool-group">
                      <button type="button" class="chip-btn chip-btn--accent nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-studio-primary text-[11.5px] font-bold cursor-pointer [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidAutoCropBtn" title="স্বয়ংক্রিয়ভাবে আইডি কার্ডের চার কোণা ও বর্ডার শনাক্ত করুন (অথবা ছবির ওপর ডাবল-ক্লিক করুন)" data-i18n-title-bn="স্বয়ংক্রিয়ভাবে আইডি কার্ডের চার কোণা ও বর্ডার শনাক্ত করুন (অথবা ছবির ওপর ডাবল-ক্লিক করুন)" data-i18n-title-en="Automatically detect ID card corners and borders (or double click on image)">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2m8-16h2a2 2 0 0 1 2 2v2m-4 12h2a2 2 0 0 0 2-2v-2"/><circle cx="12" cy="12" r="2"/></svg>
                        <span data-i18n-bn="অটো ডিটেক্ট" data-i18n-en="Auto Detect">অটো ডিটেক্ট</span>
                      </button>
                      <button type="button" class="chip-btn chip-btn--accent nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-studio-primary text-[11.5px] font-bold cursor-pointer [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidMagSnapBtn" aria-pressed="true" title="রাউন্ড আইডি কার্ডের হরিজেন্টাল ও ভার্টিক্যাল বর্ডার লাইন বরাবর অটো ম্যাগনেটিক স্ন্যাপ চালু/বন্ধ করুন" data-i18n-title-bn="রাউন্ড আইডি কার্ডের হরিজেন্টাল ও ভার্টিক্যাল বর্ডার লাইন বরাবর অটো ম্যাগনেটিক স্ন্যাপ চালু/বন্ধ করুন" data-i18n-title-en="Toggle auto magnetic snap along card border lines">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15Z"/><path d="m5 8 4 4m3 3 4 4"/></svg>
                        <span class="nid-btn-txt" data-i18n-bn="স্ন্যাপ: চালু" data-i18n-en="Snap: On">স্ন্যাপ: চালু</span>
                      </button>
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidSnapEdgesBtn" title="রাউন্ড কর্নার বাদ দিয়ে কার্ডের সোজা হরিজেন্টাল ও ভার্টিক্যাল লাইন বরাবর চার কোণা নিখুঁতভাবে স্ন্যাপ করুন" data-i18n-title-bn="রাউন্ড কর্নার বাদ দিয়ে কার্ডের সোজা হরিজেন্টাল ও ভার্টিক্যাল লাইন বরাবর চার কোণা নিখুঁতভাবে স্ন্যাপ করুন" data-i18n-title-en="Snap 4 corners along straight card edges">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
                        <span data-i18n-bn="বর্ডার মেলান" data-i18n-en="Snap Borders">বর্ডার মেলান</span>
                      </button>
                    </div>

                    <div class="nid-tool-group">
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidTightenCropBtn" title="লেমিনেশন বা অতিরিক্ত বর্ডার বাদ দিতে চারপাশ সামান্য ভেতরে চাপান" data-i18n-title-bn="লেমিনেশন বা অতিরিক্ত বর্ডার বাদ দিতে চারপাশ সামান্য ভেতরে চাপান" data-i18n-title-en="Tighten crop inwards slightly to remove excess lamination">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6m10-10h-6V4m0 6 7-7M3 21l7-7"/></svg>
                        <span data-i18n-bn="ক্রপ কমান" data-i18n-en="Tighten">ক্রপ কমান</span>
                      </button>
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidExpandCropBtn" title="কার্ডের চারপাশে সামান্য বাড়তি মার্জিন যোগ করুন" data-i18n-title-bn="কার্ডের চারপাশে সামান্য বাড়তি মার্জিন যোগ করুন" data-i18n-title-en="Add slight outer margin around card">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        <span data-i18n-bn="ক্রপ বাড়ান" data-i18n-en="Expand">ক্রপ বাড়ান</span>
                      </button>
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidSnapRatioBtn" title="আসল আইডি কার্ডের অনুপাতে (85.6×54mm) চার কোণা সেট করুন" data-i18n-title-bn="আসল আইডি কার্ডের অনুপাতে (85.6×54mm) চার কোণা সেট করুন" data-i18n-title-en="Set 4 corners to standard ID card ratio (85.6×54mm)">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h2m-2 4h4"/></svg>
                        <span data-i18n-bn="অনুপাত" data-i18n-en="Ratio">অনুপাত</span>
                      </button>
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidFullCropBtn" title="সম্পূর্ণ ছবি নির্বাচন করুন" data-i18n-title-bn="সম্পূর্ণ ছবি নির্বাচন করুন" data-i18n-title-en="Select full image">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        <span data-i18n-bn="পুরো ছবি" data-i18n-en="Full Image">পুরো ছবি</span>
                      </button>
                    </div>
                    <span class="nid-dock-sep" aria-hidden="true"></span>
                    <div class="nid-tool-group">
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidRotLBtn" title="৯০ ডিগ্রি বামে ঘোরান" data-i18n-title-bn="৯০ ডিগ্রি বামে ঘোরান" data-i18n-title-en="Rotate 90° left">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
                        <span data-i18n-bn="বামে" data-i18n-en="Left">বামে</span>
                      </button>
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidRotRBtn" title="৯০ ডিগ্রি ডানে ঘোরান" data-i18n-title-bn="৯০ ডিগ্রি ডানে ঘোরান" data-i18n-title-en="Rotate 90° right">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
                        <span data-i18n-bn="ডানে" data-i18n-en="Right">ডানে</span>
                      </button>
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidFlipHBtn" title="পাশাপাশি উল্টান (Mirror Flip)" data-i18n-title-bn="পাশাপাশি উল্টান (Mirror Flip)" data-i18n-title-en="Horizontal mirror flip">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 5 5-5 5V7zm18 0-5 5 5 5V7zm-9-4v18"/></svg>
                        <span data-i18n-bn="ফ্লিপ" data-i18n-en="Flip">ফ্লিপ</span>
                      </button>
                    </div>
                    <span class="nid-dock-sep" aria-hidden="true"></span>
                    <!-- Compact Inline Straighten Scrubber in Contextual Bar -->
                    <div class="nid-inline-deskew inline-flex items-center gap-1.5 ml-1">
                      <label class="nid-deskew-label inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-studio-muted [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" for="nidFineAngle" title="সূক্ষ্ম কোণ পরিবর্তন করে কার্ড সোজা করুন" data-i18n-title-bn="সূক্ষ্ম কোণ পরিবর্তন করে কার্ড সোজা করুন" data-i18n-title-en="Fine straighten angle">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 18h20M6 14l12-6"/></svg>
                        <strong class="nid-angle-badge" id="nidFineAngleVal" data-i18n-bn="০°" data-i18n-en="0°">০°</strong>
                      </label>
                      <input type="range" id="nidFineAngle" name="nidFineAngle" min="-15" max="15" step="0.5" value="0" class="nid-deskew-range" aria-label="সূক্ষ্ম কোণ (Straighten)">
                      <button type="button" class="chip-btn nid-dock-btn inline-flex items-center gap-1 h-7 px-2 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text text-[11.5px] font-semibold cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="nidFineAngleReset" title="কোণ ০ ডিগ্রিতে রিসেট করুন" data-i18n-title-bn="কোণ ০ ডিগ্রিতে রিসেট করুন" data-i18n-title-en="Reset angle to 0°" data-i18n-bn="০°" data-i18n-en="0°">০°</button>
                    </div>
                  </div>

                  <!-- Main Interactive 4-Corner Perspective Canvas Stage with Studio Rulers -->
                  <div class="nid-crop-canvas-shell relative flex-1 min-h-[240px] overflow-hidden touch-none isolate bg-slate-200/70 dark:bg-studio-bg" id="nidCanvasViewport" tabindex="0" aria-label="Editing canvas. Ctrl +/- to zoom, Space + drag to pan.">
                    <div class="th-canvas-ruler th-canvas-ruler--h" aria-hidden="true"></div>
                    <div class="th-canvas-ruler th-canvas-ruler--v" aria-hidden="true"></div>

                    <div class="nid-canvas-zoom-plane absolute left-1/2 top-1/2 origin-center block" id="nidCanvasZoomPlane">
                      <div
                        class="img-crop-stage-wrap nid-perspective-stage relative block w-full h-full leading-none m-0 border-0 rounded-none"
                        id="nidCropInteractiveWrap"
                        tabindex="0"
                        aria-label="আইডি কার্ড পার্সপেক্টিভ ক্রপ — চার কোণার বিন্দু টেনে বাঁকা কার্ড সোজা করে ক্রপ করুন"
                      >
                        <canvas id="nidCropSourceCanvas"></canvas>
                        <div class="nid-scan-beam" id="nidScanBeam" hidden aria-hidden="true"></div>
                        <svg class="nid-quad-svg absolute inset-0 w-full h-full pointer-events-none" id="nidQuadSvg" viewBox="0 0 100 100" aria-hidden="true">
                          <defs>
                            <mask id="nidQuadMask">
                              <rect id="nidQuadMaskBg" x="0" y="0" width="100" height="100" fill="white" />
                              <polygon id="nidQuadHole" points="10,10 90,10 90,90 10,90" fill="black" />
                            </mask>
                          </defs>
                          <rect id="nidQuadDimRect" x="0" y="0" width="100" height="100" fill="rgba(9, 13, 22, 0.62)" mask="url(#nidQuadMask)" />
                          <line id="nidGridH1" class="nid-quad-grid" x1="10" y1="36" x2="90" y2="36" />
                          <line id="nidGridH2" class="nid-quad-grid" x1="10" y1="63" x2="90" y2="63" />
                          <line id="nidGridV1" class="nid-quad-grid" x1="36" y1="10" x2="36" y2="90" />
                          <line id="nidGridV2" class="nid-quad-grid" x1="63" y1="10" x2="63" y2="90" />
                          <line id="nidSnapGuideH" class="nid-snap-guide" x1="0" y1="0" x2="0" y2="0" hidden />
                          <line id="nidSnapGuideV" class="nid-snap-guide" x1="0" y1="0" x2="0" y2="0" hidden />
                          <polygon id="nidQuadPoly" class="nid-quad-poly" points="10,10 90,10 90,90 10,90" />
                        </svg>
                        <div class="nid-quad-handles absolute inset-0 pointer-events-none" id="nidQuadHandles">
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="0" aria-label="উপরের বাম কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="1" aria-label="উপরের ডান কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="2" aria-label="নিচের ডান কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="3" aria-label="নিচের বাম কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white border-2 border-emerald-500 shadow-md -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="0" aria-label="উপরের ধার"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white border-2 border-emerald-500 shadow-md -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="1" aria-label="ডান ধার"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white border-2 border-emerald-500 shadow-md -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="2" aria-label="নিচের ধার"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white border-2 border-emerald-500 shadow-md -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="3" aria-label="বাম ধার"></button>
                        </div>
                        <canvas class="nid-crop-loupe absolute w-48 h-48 rounded-full border-3 border-emerald-500 shadow-2xl pointer-events-none z-20" id="nidCropLoupe" width="220" height="220" hidden aria-hidden="true"></canvas>
                      </div>
                    </div>
                  </div>

                  <!-- Bottom Studio Status & Zoom Bar -->
                  <div class="th-canvas-statusbar min-h-[42px] px-2.5 py-1.5 bg-white dark:bg-studio-sidebar border-t border-slate-200 dark:border-studio-border flex items-center justify-between gap-2 shrink-0">
                    <div class="th-status-left flex items-center gap-1">
                      <div class="th-zoom-controls inline-flex items-center gap-1" role="group" aria-label="ক্যানভাস জুম">
                        <button type="button" class="th-status-btn h-7 px-2 rounded border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer" id="nidZoomOutBtn" title="জুম আউট (−)" data-i18n-title-bn="জুম আউট (−)" data-i18n-title-en="Zoom Out (−)">−</button>
                        <label class="nid-zoom-input"><input type="number" id="nidZoomPercent" min="1" max="800" step="1" value="100" aria-label="ক্যানভাস জুম শতাংশ"><span>%</span></label>
                        <button type="button" class="th-status-btn h-7 px-2 rounded border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer" id="nidZoomInBtn" title="জুম ইন (+)" data-i18n-title-bn="জুম ইন (+)" data-i18n-title-en="Zoom In (+)">+</button>
                      </div>
                      <button type="button" class="th-status-btn h-7 px-2 rounded border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer" id="nidZoomFitBtn" title="স্ক্রিনে ফিট করুন (Ctrl+0)" data-i18n-title-bn="স্ক্রিনে ফিট করুন (Ctrl+0)" data-i18n-title-en="Fit to screen (Ctrl+0)">Fit</button>
                      <button type="button" class="th-status-btn h-7 px-2 rounded border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer" id="nidZoomResetBtn" title="আসল পিক্সেল সাইজ (Ctrl+1)" data-i18n-title-bn="আসল পিক্সেল সাইজ (Ctrl+1)" data-i18n-title-en="Original size (Ctrl+1)">100%</button>
                      <button type="button" class="th-status-btn h-7 px-2 rounded border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer" id="nidHandToolBtn" aria-pressed="false" title="হ্যান্ড টুল (H)। ক্রপে ফিরতে V চাপুন।" data-i18n-title-bn="হ্যান্ড টুল (H)। ক্রপে ফিরতে V চাপুন।" data-i18n-title-en="Hand Tool (H). Press V for Crop." data-i18n-bn="হ্যান্ড" data-i18n-en="Hand">হ্যান্ড</button>
                      <span class="th-status-sep" aria-hidden="true"></span>
                      <button type="button" class="th-status-btn active h-7 px-2 rounded border border-emerald-500/40 bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:text-studio-primary cursor-pointer" id="nidToggleGridBtn" aria-pressed="true" title="গ্রিড লাইন চালু/বন্ধ করুন" data-i18n-title-bn="গ্রিড লাইন চালু/বন্ধ করুন" data-i18n-title-en="Toggle Grid Lines" data-i18n-bn="গ্রিড" data-i18n-en="Grid">গ্রিড</button>
                    </div>

                    <p class="nid-shortcut-hint text-[10.5px] text-slate-400 dark:text-studio-muted m-0 hidden xl:block" data-i18n-bn="Shift + Drag ৫× লুপ · Alt + Scroll জুম · Space + Drag প্যান" data-i18n-en="Shift + Drag 5× Loupe · Alt + Scroll Zoom · Space + Drag Pan"><kbd>Shift + Drag</kbd> ৫× লুপ · <kbd>Alt + Scroll</kbd> জুম · <kbd>Space + Drag</kbd> প্যান</p>
                  </div>
                </div>

                <!-- Print Preview Stage (Full-Height Preview Window Column) -->
                <section class="nid-workspace-preview flex flex-col min-w-0 min-h-0 border-l border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-bg" id="nidPreviewPanel" aria-label="বড় প্রিন্ট প্রিভিউ">
                  <div class="th-section-head nid-sheet-panel__head flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar shrink-0">
                    <strong class="th-section-title" data-i18n-bn="প্রিন্ট প্রিভিউ" data-i18n-en="Print Preview">প্রিন্ট প্রিভিউ</strong><span class="nid-paper-label" id="nidPaperLabel">A4 · 210 × 297 mm</span>
                    <span class="nid-meta-pill" id="imgCombineOutMeta">—</span>
                  </div>

                  <div class="nid-sheet-stage flex-1 min-h-0 p-4 grid place-items-center [container-type:size] bg-slate-200/60 dark:bg-studio-panel/50">
                    <canvas id="nidLivePreviewCanvas" class="nid-live-preview-canvas" width="806" height="1140" aria-label="Live Preview" hidden></canvas>
                    <img id="imgCombineOutPreview" alt="Combined Preview" width="420" height="594">
                  </div>

                  <div class="nid-export-summary flex items-center gap-2 px-4 py-2 border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-xs text-slate-600 dark:text-studio-muted shrink-0">
                    <span class="nid-export-dot" aria-hidden="true"></span>
                    <span id="imgCombineSummary" role="status" data-i18n-bn="প্রস্তুত" data-i18n-en="Ready">প্রস্তুত</span>
                  </div>
                </section>
              </div>
            </div>

            <!-- ========================================== PANEL 3: RIGHT PROPERTIES & PRINT PREVIEW -->
            <aside class="th-panel th-panel--right nid-sheet-panel flex flex-col min-h-0 border-l border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar overflow-hidden" id="nidPrintPanel" aria-label="Page Setup & Download">
              <div class="th-right-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <section class="nid-images-section" id="nidImagesPanel" aria-label="Color & Light">
                  <div class="nid-adjust-title flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar">
                    <div class="nid-adjust-title__main flex flex-col gap-0.5 min-w-0 [&_strong]:text-xs [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-studio-text [&_span]:text-[11px] [&_span]:font-semibold [&_span]:text-emerald-600 dark:[&_span]:text-studio-primary">
                      <strong data-i18n-bn="রঙ ও ফিল্টার স্টুডিও" data-i18n-en="Color & Filter Studio">রঙ ও ফিল্টার স্টুডিও</strong>
                      <span id="nidColorTargetStatus" data-i18n-bn="উভয় পাতায় একসাথে কার্যকর" data-i18n-en="Applied to both pages together">উভয় পাতায় একসাথে কার্যকর</span>
                    </div>
                    <button type="button" class="nid-reset-link inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[11px] font-semibold text-slate-600 dark:text-studio-muted hover:text-emerald-600 cursor-pointer [&_svg]:w-3 [&_svg]:h-3 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCombineColorResetBtn" title="কালার ও ফিল্টার রিসেট করুন" data-i18n-title-bn="কালার ও ফিল্টার রিসেট করুন" data-i18n-title-en="Reset colors and filters">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
                      <span data-i18n-bn="রিসেট" data-i18n-en="Reset">রিসেট</span>
                    </button>
                  </div>

                  <!-- Per-Page / Both-Pages Target Selector (Default: Both Pages) -->
                  <div class="nid-target-bar flex flex-col gap-1.5 px-3 py-2.5 border-b border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel/60" id="nidColorTargetBar">
                    <div class="nid-target-bar__head flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-studio-muted">
                      <span class="nid-target-bar__lbl" data-i18n-bn="কোন পাতায় কাজ করবে:" data-i18n-en="Target Page:">কোন পাতায় কাজ করবে:</span>
                      <span class="nid-target-bar__hint" id="nidTargetSyncHint" data-i18n-bn="ডিফল্ট: উভয় পাতা" data-i18n-en="Default: Both Pages">ডিফল্ট: উভয় পাতা</span>
                    </div>
                    <div class="nid-target-seg grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-studio-bg border border-slate-200 dark:border-studio-border" id="nidColorTargetGroup" role="group" aria-label="কালার ও ফিল্টারের পাতা নির্বাচন করুন">
                      <button type="button" class="nid-target-btn active relative flex flex-col items-center justify-center gap-0.5 min-h-[38px] p-1 rounded-md border border-transparent bg-transparent text-slate-600 dark:text-studio-muted text-[11px] font-semibold cursor-pointer [&.active]:bg-white dark:[&.active]:bg-studio-sidebar [&.active]:text-emerald-600 dark:[&.active]:text-studio-primary [&.active]:border-emerald-500/30 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" data-color-target="all" aria-pressed="true" title="সামনের ও পেছনের উভয় পাতায় একসাথে কাজ করবে" data-i18n-title-bn="সামনের ও পেছনের উভয় পাতায় একসাথে কাজ করবে" data-i18n-title-en="Applies to both front and back pages">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="13" height="10" rx="1.5"/><path d="M8 18h11a2 2 0 0 0 2-2V9"/></svg>
                        <span class="nid-target-btn__txt" data-i18n-bn="উভয় পাতা" data-i18n-en="Both Pages">উভয় পাতা</span>
                      </button>
                      <button type="button" class="nid-target-btn relative flex flex-col items-center justify-center gap-0.5 min-h-[38px] p-1 rounded-md border border-transparent bg-transparent text-slate-600 dark:text-studio-muted text-[11px] font-semibold cursor-pointer [&.active]:bg-white dark:[&.active]:bg-studio-sidebar [&.active]:text-emerald-600 dark:[&.active]:text-studio-primary [&.active]:border-emerald-500/30 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" data-color-target="0" aria-pressed="false" title="শুধুমাত্র ১ম পাতায় (সামনের অংশ) কালার ও ফিল্টার প্রয়োগ করুন" data-i18n-title-bn="শুধুমাত্র ১ম পাতায় (সামনের অংশ) কালার ও ফিল্টার প্রয়োগ করুন" data-i18n-title-en="Apply colors and filters to 1st page only">
                        <span class="nid-target-btn__dot" id="nidTargetDot0" aria-hidden="true"></span>
                        <span class="nid-target-btn__txt" data-i18n-bn="১ম পাতা" data-i18n-en="1st Page">১ম পাতা</span>
                        <small class="nid-target-btn__tag" id="nidTargetTag0" data-i18n-bn="অরিজিনাল" data-i18n-en="Original">অরিজিনাল</small>
                      </button>
                      <button type="button" class="nid-target-btn relative flex flex-col items-center justify-center gap-0.5 min-h-[38px] p-1 rounded-md border border-transparent bg-transparent text-slate-600 dark:text-studio-muted text-[11px] font-semibold cursor-pointer [&.active]:bg-white dark:[&.active]:bg-studio-sidebar [&.active]:text-emerald-600 dark:[&.active]:text-studio-primary [&.active]:border-emerald-500/30 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" data-color-target="1" aria-pressed="false" title="শুধুমাত্র ২য় পাতায় (পেছনের অংশ) কালার ও ফিল্টার প্রয়োগ করুন" data-i18n-title-bn="শুধুমাত্র ২য় পাতায় (পেছনের অংশ) কালার ও ফিল্টার প্রয়োগ করুন" data-i18n-title-en="Apply colors and filters to 2nd page only">
                        <span class="nid-target-btn__dot" id="nidTargetDot1" aria-hidden="true"></span>
                        <span class="nid-target-btn__txt" data-i18n-bn="২য় পাতা" data-i18n-en="2nd Page">২য় পাতা</span>
                        <small class="nid-target-btn__tag" id="nidTargetTag1" data-i18n-bn="অরিজিনাল" data-i18n-en="Original">অরিজিনাল</small>
                      </button>
                    </div>
                  </div>

                  <!-- Collapsible Accordion 1: CamScanner-Grade Filter Presets (Open by default) -->
                  <details class="th-prop-acc nid-studio-acc border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar group/acc" id="nidAccFilter" open>
                    <summary class="th-prop-acc__head min-h-[44px] px-3 py-2 text-xs font-bold text-slate-800 dark:text-studio-text flex items-center justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span class="th-prop-acc__title-wrap inline-flex items-center gap-2 min-w-0">
                        <span class="th-prop-acc__icon w-6 h-6 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted grid place-items-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                        </span>
                        <span data-i18n-bn="ডকুমেন্ট ফিল্টার প্রিসেট" data-i18n-en="Document Filter Presets">ডকুমেন্ট ফিল্টার প্রিসেট</span>
                      </span>
                      <span class="th-prop-acc__meta inline-flex items-center gap-1.5 shrink-0">
                        <span class="th-prop-acc__badge text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel text-slate-600 dark:text-studio-muted border border-slate-200 dark:border-studio-border" id="nidFilterSummaryBadge" data-i18n-bn="অরিজিনাল" data-i18n-en="Original">অরিজিনাল</span>
                        <svg class="th-prop-acc__chev w-3.5 h-3.5 fill-none stroke-current stroke-2 text-slate-400 transition-transform group-open/acc:rotate-180" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </summary>
                    <div class="th-prop-acc__body px-3 pb-3 pt-1 space-y-2" id="nidLeftScanSection">
                      <fieldset class="pdf-fieldset nid-fieldset-clean">
                        <legend class="visually-hidden sr-only" data-i18n-bn="কালার ও ডকুমেন্ট ফিল্টার নির্বাচন করুন" data-i18n-en="Select color & document filter">কালার ও ডকুমেন্ট ফিল্টার নির্বাচন করুন</legend>
                        <div class="nid-filter-pills nid-cs-filter-grid grid grid-cols-2 gap-1.5">
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="original" checked>
                            <span class="nid-cs-swatch nid-cs-swatch--orig" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">Aa</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label" data-i18n-bn="অরিজিনাল" data-i18n-en="Original">অরিজিনাল</span>
                              <small class="nid-cs-card__sub" data-i18n-bn="আসল ছবি" data-i18n-en="Original Photo">আসল ছবি</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="vivid">
                            <span class="nid-cs-swatch nid-cs-swatch--vivid" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">ID</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label"><span data-i18n-bn="আসল রঙ" data-i18n-en="Vivid Colors">আসল রঙ</span> <em class="nid-cs-badge nid-cs-badge--vivid">NID</em></span>
                              <small class="nid-cs-card__sub" data-i18n-bn="কার্ডের মতো কালারফুল প্রিন্ট" data-i18n-en="Vivid colorful card print">কার্ডের মতো কালারফুল প্রিন্ট</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="magic">
                            <span class="nid-cs-swatch nid-cs-swatch--magic" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">✦</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label">Magic <em class="nid-cs-badge">AUTO</em></span>
                              <small class="nid-cs-card__sub" data-i18n-bn="ক্যামস্কানার কালার" data-i18n-en="CamScanner Color">ক্যামস্কানার কালার</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="magic_plus">
                            <span class="nid-cs-swatch nid-cs-swatch--magic-plus" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">✦+</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label">Magic+ <em class="nid-cs-badge nid-cs-badge--pro">PRO</em></span>
                              <small class="nid-cs-card__sub" data-i18n-bn="সুপার ফিল্টার HD" data-i18n-en="Super Filter HD">সুপার ফিল্টার HD</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="no_shadow">
                            <span class="nid-cs-swatch nid-cs-swatch--shadow" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">☀</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label">No Shadow <em class="nid-cs-badge nid-cs-badge--amber">CS</em></span>
                              <small class="nid-cs-card__sub" data-i18n-bn="ছায়া ও ফ্ল্যাশ মুক্ত" data-i18n-en="Shadow & glare free">ছায়া ও ফ্ল্যাশ মুক্ত</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="clean">
                            <span class="nid-cs-swatch nid-cs-swatch--clean" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">Aa</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label" data-i18n-bn="পরিষ্কার সাদা" data-i18n-en="Clean White">পরিষ্কার সাদা</span>
                              <small class="nid-cs-card__sub" data-i18n-bn="হালকা ও উজ্জ্বল" data-i18n-en="Light & bright">হালকা ও উজ্জ্বল</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="eco">
                            <span class="nid-cs-swatch nid-cs-swatch--eco" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">Eco</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label" data-i18n-bn="কালি সাশ্রয়ী" data-i18n-en="Ink Saver">কালি সাশ্রয়ী</span>
                              <small class="nid-cs-card__sub" data-i18n-bn="প্রিন্টার টোনার সেভার" data-i18n-en="Toner economy mode">প্রিন্টার টোনার সেভার</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="bw">
                            <span class="nid-cs-swatch nid-cs-swatch--bw" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">B/W</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label" data-i18n-bn="ফটোকপি (B/W)" data-i18n-en="Photocopy (B/W)">ফটোকপি (B/W)</span>
                              <small class="nid-cs-card__sub" data-i18n-bn="শার্প সাদাকালো" data-i18n-en="Sharp black & white">শার্প সাদাকালো</small>
                            </span>
                          </label>
                          <label class="nid-pill-option nid-cs-card relative flex items-center gap-2 min-h-[44px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel cursor-pointer transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="grayscale">
                            <span class="nid-cs-swatch nid-cs-swatch--gray" aria-hidden="true">
                              <span class="nid-cs-swatch__doc">G</span>
                            </span>
                            <span class="nid-cs-card__info flex flex-col min-w-0 flex-1 [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <span class="nid-pill-option__label" data-i18n-bn="গ্রেস্কেল" data-i18n-en="Grayscale">গ্রেস্কেল</span>
                              <small class="nid-cs-card__sub" data-i18n-bn="স্মুথ মনোক্রোম" data-i18n-en="Smooth monochrome">স্মুথ মনোক্রোম</small>
                            </span>
                          </label>
                        </div>

                        <!-- Smart Pro Enhancers (Independent Toggles for Glare/Shadow & Bangla Text/Barcode) -->
                        <div class="nid-smart-enhancers flex flex-col gap-1.5 pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-studio-border" id="nidSmartEnhancers" role="group" aria-label="Smart Pro Enhancers">
                          <button type="button" class="nid-enhancer-pill flex items-center gap-2 w-full min-h-[40px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-left cursor-pointer aria-pressed:border-emerald-500 aria-pressed:bg-emerald-500/10" id="nidDeglareBtn" aria-pressed="false" title="লেমিনেশন ফ্ল্যাশের সাদা ঝলকানি এবং মোবাইলের কালো ছায়া নিখুঁতভাবে দূর করুন" data-i18n-title-bn="লেমিনেশন ফ্ল্যাশের সাদা ঝলকানি এবং মোবাইলের কালো ছায়া নিখুঁতভাবে দূর করুন" data-i18n-title-en="Remove lamination glare and camera shadows">
                            <span class="nid-enhancer-pill__ico w-6 h-6 rounded-md bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border grid place-items-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                            </span>
                            <span class="nid-enhancer-pill__txt flex flex-col flex-1 min-w-0 [&_strong]:text-[11.5px] [&_strong]:font-bold [&_strong]:text-slate-800 dark:[&_strong]:text-studio-text [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <strong data-i18n-bn="ঝলকানি ও ছায়া রিমুভ" data-i18n-en="Glare & Shadow Fix">ঝলকানি ও ছায়া রিমুভ</strong>
                              <small data-i18n-bn="ফ্ল্যাশ গ্লেয়ার ও শ্যাডো ফিক্স" data-i18n-en="Fix flash glare and dark shadows">ফ্ল্যাশ গ্লেয়ার ও শ্যাডো ফিক্স</small>
                            </span>
                            <span class="nid-enhancer-pill__state text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-slate-500 shrink-0" id="nidDeglareState" data-i18n-bn="বন্ধ" data-i18n-en="Off">বন্ধ</span>
                          </button>
                          <button type="button" class="nid-enhancer-pill flex items-center gap-2 w-full min-h-[40px] p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-left cursor-pointer aria-pressed:border-emerald-500 aria-pressed:bg-emerald-500/10" id="nidTextBoostBtn" aria-pressed="false" title="ক্যামস্ক্যানার ন্যাটিভ অ্যাপের মতো ঘোলা নাম, এনআইডি নাম্বার, স্বাক্ষর ও ঠিকানার অক্ষরগুলোকে টাইপ করা প্রিন্টের মতো গাঢ় ও পরিষ্কার করুন" data-i18n-title-bn="ক্যামস্ক্যানার ন্যাটিভ অ্যাপের মতো ঘোলা নাম, এনআইডি নাম্বার, স্বাক্ষর ও ঠিকানার অক্ষরগুলোকে টাইপ করা প্রিন্টের মতো গাঢ় ও পরিষ্কার করুন" data-i18n-title-en="Clarify text, NID number, signature, and address crisp and dark">
                            <span class="nid-enhancer-pill__ico w-6 h-6 rounded-md bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border grid place-items-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                              <svg viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                            </span>
                            <span class="nid-enhancer-pill__txt flex flex-col flex-1 min-w-0 [&_strong]:text-[11.5px] [&_strong]:font-bold [&_strong]:text-slate-800 dark:[&_strong]:text-studio-text [&_small]:text-[10px] [&_small]:text-slate-500 dark:[&_small]:text-studio-muted [&_small]:truncate">
                              <strong data-i18n-bn="টাইপড টেক্সট ও নাম্বার HD" data-i18n-en="Typed Text & Numbers HD">টাইপড টেক্সট ও নাম্বার HD</strong>
                              <small data-i18n-bn="ঘোলা নাম, নাম্বার ও অক্ষর ক্লিয়ার" data-i18n-en="Clarify blurred names and digits">ঘোলা নাম, নাম্বার ও অক্ষর ক্লিয়ার</small>
                            </span>
                            <span class="nid-enhancer-pill__state text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-slate-500 shrink-0" id="nidTextBoostState" data-i18n-bn="বন্ধ" data-i18n-en="Off">বন্ধ</span>
                          </button>
                        </div>
                      </fieldset>
                    </div>
                  </details>

                  <!-- Collapsible Accordion 2: Manual Color & Light Tuning (Collapsed by default) -->
                  <details class="th-prop-acc nid-studio-acc border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar group/acc" id="nidAccTune">
                    <summary class="th-prop-acc__head min-h-[44px] px-3 py-2 text-xs font-bold text-slate-800 dark:text-studio-text flex items-center justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span class="th-prop-acc__title-wrap inline-flex items-center gap-2 min-w-0">
                        <span class="th-prop-acc__icon w-6 h-6 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted grid place-items-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>
                        </span>
                        <span data-i18n-bn="ম্যানুয়াল কালার টিউনিং" data-i18n-en="Manual Color Tuning">ম্যানুয়াল কালার টিউনিং</span>
                      </span>
                      <span class="th-prop-acc__meta inline-flex items-center gap-1.5 shrink-0">
                        <span class="th-prop-acc__badge text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel text-slate-600 dark:text-studio-muted border border-slate-200 dark:border-studio-border" id="nidTuneSummaryBadge" data-i18n-bn="ডিফল্ট" data-i18n-en="Default">ডিফল্ট</span>
                        <svg class="th-prop-acc__chev w-3.5 h-3.5 fill-none stroke-current stroke-2 text-slate-400 transition-transform group-open/acc:rotate-180" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </summary>
                    <div class="th-prop-acc__body px-3 pb-3 pt-1 space-y-2" id="nidLeftAdjustSection">
                      <div class="th-slider-stack space-y-2.5">
                        <div class="th-slider-row flex flex-col gap-1 [&_input]:w-full [&_input]:accent-emerald-600">
                          <div class="th-slider-lbl flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-studio-text">
                            <label for="imgCombineBright" data-i18n-bn="উজ্জ্বলতা (Brightness)" data-i18n-en="Brightness">উজ্জ্বলতা (Brightness)</label>
                            <strong id="imgCombineBrightVal" data-i18n-bn="১০০%" data-i18n-en="100%">১০০%</strong>
                          </div>
                          <input type="range" id="imgCombineBright" name="imgCombineBright" min="50" max="180" value="100">
                        </div>
                        <div class="th-slider-row flex flex-col gap-1 [&_input]:w-full [&_input]:accent-emerald-600">
                          <div class="th-slider-lbl flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-studio-text">
                            <label for="imgCombineContrast" data-i18n-bn="কনট্রাস্ট (Contrast)" data-i18n-en="Contrast">কনট্রাস্ট (Contrast)</label>
                            <strong id="imgCombineContrastVal" data-i18n-bn="১০০%" data-i18n-en="100%">১০০%</strong>
                          </div>
                          <input type="range" id="imgCombineContrast" name="imgCombineContrast" min="50" max="220" value="100">
                        </div>
                        <div class="th-slider-row flex flex-col gap-1 [&_input]:w-full [&_input]:accent-emerald-600">
                          <div class="th-slider-lbl flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-studio-text">
                            <label for="imgCombineSat" data-i18n-bn="রঙের গভীরতা (Saturation)" data-i18n-en="Saturation">রঙের গভীরতা (Saturation)</label>
                            <strong id="imgCombineSatVal" data-i18n-bn="১০০%" data-i18n-en="100%">১০০%</strong>
                          </div>
                          <input type="range" id="imgCombineSat" name="imgCombineSat" min="0" max="200" value="100">
                        </div>
                        <div class="th-slider-row flex flex-col gap-1 [&_input]:w-full [&_input]:accent-emerald-600">
                          <div class="th-slider-lbl flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-studio-text">
                            <label for="imgCombineSharp" data-i18n-bn="লেখার স্পষ্টতা (Sharpness)" data-i18n-en="Sharpness">লেখার স্পষ্টতা (Sharpness)</label>
                            <strong id="imgCombineSharpVal" data-i18n-bn="২০%" data-i18n-en="20%">২০%</strong>
                          </div>
                          <input type="range" id="imgCombineSharp" name="imgCombineSharp" min="0" max="100" value="20">
                        </div>
                      </div>
                    </div>
                  </details>
                </section>

                <!-- Collapsible Print Settings Accordions (Collapsed by default for clean studio hierarchy) -->
                <div class="nid-layout-controls">
                  <details class="th-prop-acc nid-studio-acc border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar group/acc" id="nidAccLayout">
                    <summary class="th-prop-acc__head min-h-[44px] px-3 py-2 text-xs font-bold text-slate-800 dark:text-studio-text flex items-center justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span class="th-prop-acc__title-wrap inline-flex items-center gap-2 min-w-0">
                        <span class="th-prop-acc__icon w-6 h-6 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted grid place-items-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                        </span>
                        <span data-i18n-bn="পেজ লেআউট" data-i18n-en="Page Layout">পেজ লেআউট</span>
                      </span>
                      <span class="th-prop-acc__meta inline-flex items-center gap-1.5 shrink-0">
                        <span class="th-prop-acc__badge text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel text-slate-600 dark:text-studio-muted border border-slate-200 dark:border-studio-border" id="nidLayoutSummaryBadge" data-i18n-bn="A4 উপরে-নিচে" data-i18n-en="A4 Top-Bottom">A4 উপরে-নিচে</span>
                        <svg class="th-prop-acc__chev w-3.5 h-3.5 fill-none stroke-current stroke-2 text-slate-400 transition-transform group-open/acc:rotate-180" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </summary>
                    <div class="th-prop-acc__body px-3 pb-3 pt-1 space-y-2">
                      <fieldset class="pdf-fieldset nid-fieldset-clean">
                        <legend class="visually-hidden sr-only">Page Layout</legend>
                        <div class="nid-layout-pills grid grid-cols-2 gap-1.5">
                          <label class="nid-pill-option flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-studio-primary [&_input]:sr-only">
                            <input type="radio" name="imgCombineMode" value="nid-a4" checked>
                            <span class="nid-pill-option__label" data-i18n-bn="A4 (উপরে-নিচে)" data-i18n-en="A4 (Top-Bottom)">A4 (উপরে-নিচে)</span>
                          </label>
                          <label class="nid-pill-option flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-studio-primary [&_input]:sr-only">
                            <input type="radio" name="imgCombineMode" value="nid-a4-side">
                            <span class="nid-pill-option__label" data-i18n-bn="A4 (পাশাপাশি)" data-i18n-en="A4 (Side-by-Side)">A4 (পাশাপাশি)</span>
                          </label>
                          <label class="nid-pill-option flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-studio-primary [&_input]:sr-only">
                            <input type="radio" name="imgCombineMode" value="vertical">
                            <span class="nid-pill-option__label" data-i18n-bn="কার্ড (উপরে-নিচে)" data-i18n-en="Card (Top-Bottom)">কার্ড (উপরে-নিচে)</span>
                          </label>
                          <label class="nid-pill-option flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-studio-primary [&_input]:sr-only">
                            <input type="radio" name="imgCombineMode" value="horizontal">
                            <span class="nid-pill-option__label" data-i18n-bn="কার্ড (পাশাপাশি)" data-i18n-en="Card (Side-by-Side)">কার্ড (পাশাপাশি)</span>
                          </label>
                        </div>
                      </fieldset>
                    </div>
                  </details>

                  <details class="th-prop-acc nid-studio-acc border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar group/acc" id="nidAccPrintOpt">
                    <summary class="th-prop-acc__head min-h-[44px] px-3 py-2 text-xs font-bold text-slate-800 dark:text-studio-text flex items-center justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span class="th-prop-acc__title-wrap inline-flex items-center gap-2 min-w-0">
                        <span class="th-prop-acc__icon w-6 h-6 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted grid place-items-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        </span>
                        <span data-i18n-bn="কপি সংখ্যা ও প্রিন্ট অপশন" data-i18n-en="Copies & Print Options">কপি সংখ্যা ও প্রিন্ট অপশন</span>
                      </span>
                      <span class="th-prop-acc__meta inline-flex items-center gap-1.5 shrink-0">
                        <span class="th-prop-acc__badge text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel text-slate-600 dark:text-studio-muted border border-slate-200 dark:border-studio-border" id="nidPrintOptSummaryBadge" data-i18n-bn="১ সেট" data-i18n-en="1 Set">১ সেট</span>
                        <svg class="th-prop-acc__chev w-3.5 h-3.5 fill-none stroke-current stroke-2 text-slate-400 transition-transform group-open/acc:rotate-180" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </summary>
                    <div class="th-prop-acc__body px-3 pb-3 pt-1 space-y-2">
                      <div class="pdf-img-settings nid-settings-grid">
                        <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                          <label for="imgCombineCopies" data-i18n-bn="পাতায় কপি" data-i18n-en="Copies on Page">পাতায় কপি</label>
                          <select id="imgCombineCopies" name="imgCombineCopies">
                            <option value="1" selected data-i18n-bn="১ সেট (সাধারণ)" data-i18n-en="1 Set (Normal)">১ সেট (সাধারণ)</option>
                            <option value="2" data-i18n-bn="২ সেট (২ জোড়া)" data-i18n-en="2 Sets (2 Pairs)">২ সেট (২ জোড়া)</option>
                            <option value="4" data-i18n-bn="৪ সেট (৪ জোড়া)" data-i18n-en="4 Sets (4 Pairs)">৪ সেট (৪ জোড়া)</option>
                          </select>
                        </div>
                        <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                          <label for="imgCombineAlign" data-i18n-bn="পজিশন" data-i18n-en="Position">পজিশন</label>
                          <select id="imgCombineAlign" name="imgCombineAlign">
                            <option value="top" selected data-i18n-bn="উপরে মাঝখানে" data-i18n-en="Top Center">উপরে মাঝখানে</option>
                            <option value="center" data-i18n-bn="একদম মাঝখানে" data-i18n-en="Center">একদম মাঝখানে</option>
                          </select>
                        </div>
                      </div>

                      <div class="nid-toggles-bar flex items-center flex-wrap gap-3 pt-2">
                        <label class="switch pdf-inline-switch">
                          <input type="checkbox" id="imgCombineRoundCorner" name="imgCombineRoundCorner" checked>
                          <span class="switch__track"><span class="switch__knob"></span></span>
                          <span class="switch__label" data-i18n-bn="রাউন্ড কোণা" data-i18n-en="Rounded Corners">রাউন্ড কোণা</span>
                        </label>
                        <label class="switch pdf-inline-switch">
                          <input type="checkbox" id="imgCombineCardBorder" name="imgCombineCardBorder" checked>
                          <span class="switch__track"><span class="switch__knob"></span></span>
                          <span class="switch__label" data-i18n-bn="বর্ডার" data-i18n-en="Border">বর্ডার</span>
                        </label>
                        <label class="switch pdf-inline-switch">
                          <input type="checkbox" id="imgCombineCutMarks" name="imgCombineCutMarks">
                          <span class="switch__track"><span class="switch__knob"></span></span>
                          <span class="switch__label" data-i18n-bn="কাট মার্ক" data-i18n-en="Cut Marks">কাট মার্ক</span>
                        </label>
                      </div>
                    </div>
                  </details>

                  <details class="th-prop-acc nid-studio-acc border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar group/acc" id="nidAccGap">
                    <summary class="th-prop-acc__head min-h-[44px] px-3 py-2 text-xs font-bold text-slate-800 dark:text-studio-text flex items-center justify-between gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span class="th-prop-acc__title-wrap inline-flex items-center gap-2 min-w-0">
                        <span class="th-prop-acc__icon w-6 h-6 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted grid place-items-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" aria-hidden="true">
                          <svg viewBox="0 0 24 24"><path d="M21 6H3M21 18H3M12 9v6m-3-3h6"/></svg>
                        </span>
                        <span data-i18n-bn="গ্যাপ ও পেজ কালার" data-i18n-en="Gap & Page Color">গ্যাপ ও পেজ কালার</span>
                      </span>
                      <span class="th-prop-acc__meta inline-flex items-center gap-1.5 shrink-0">
                        <span class="th-prop-acc__badge text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel text-slate-600 dark:text-studio-muted border border-slate-200 dark:border-studio-border" id="nidGapSummaryBadge" data-i18n-bn="৩৬px" data-i18n-en="36px">৩৬px</span>
                        <svg class="th-prop-acc__chev w-3.5 h-3.5 fill-none stroke-current stroke-2 text-slate-400 transition-transform group-open/acc:rotate-180" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </summary>
                    <div class="th-prop-acc__body px-3 pb-3 pt-1 space-y-2">
                      <div class="pdf-img-settings nid-settings-grid">
                        <div class="pdf-field-group flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text [&_input:not([type=color]):not([type=range])]:h-8 [&_input:not([type=color]):not([type=range])]:px-2.5 [&_input:not([type=color]):not([type=range])]:rounded-lg [&_input:not([type=color]):not([type=range])]:bg-white dark:[&_input:not([type=color]):not([type=range])]:bg-studio-sidebar [&_input:not([type=color]):not([type=range])]:border [&_input:not([type=color]):not([type=range])]:border-slate-200 dark:[&_input:not([type=color]):not([type=range])]:border-studio-border [&_select]:h-8 [&_select]:px-2.5 [&_select]:rounded-lg [&_select]:bg-white dark:[&_select]:bg-studio-sidebar [&_select]:border [&_select]:border-slate-200 dark:[&_select]:border-studio-border">
                          <label for="imgCombineGap" data-i18n-bn="মাঝের ফাঁকা (Gap)" data-i18n-en="Gap (Spacing)">মাঝের ফাঁকা (Gap)</label>
                          <input type="number" id="imgCombineGap" name="imgCombineGap" value="36" min="0" max="240">
                        </div>
                      </div>
                      <div class="img-color-row flex items-center flex-wrap gap-2" style="margin-top:.35rem; justify-content:space-between;">
                        <label for="imgCombineBg" style="font-size:.72rem; font-weight:600; color:var(--th-text-sub);" data-i18n-bn="ব্যাকগ্রাউন্ড পাতার রঙ" data-i18n-en="Background Page Color">ব্যাকগ্রাউন্ড পাতার রঙ</label>
                        <input type="color" id="imgCombineBg" name="imgCombineBg" value="#ffffff">
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <!-- Export Area: Primary (PDF), Secondary (Print), Tertiary (JPG) -->
              <div class="nid-export-bar p-3.5 border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar space-y-2 shrink-0">
                <button type="button" class="btn btn--primary nid-export-btn nid-export-btn--pdf w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2 border-0 cursor-pointer transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCombineDownloadPdfBtn">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6m0 6-3-3m3 3 3-3"/></svg>
                  <span data-i18n-bn="PDF ডাউনলোড করুন" data-i18n-en="Download PDF">PDF ডাউনলোড করুন</span>
                </button>
                <div class="nid-export-secondary-row grid grid-cols-2 gap-2">
                  <button type="button" class="nid-export-btn nid-export-btn--print h-9 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-bold text-slate-700 dark:text-studio-text inline-flex items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCombinePrintBtn" title="সরাসরি প্রিন্ট করুন" data-i18n-title-bn="সরাসরি প্রিন্ট করুন" data-i18n-title-en="Direct Print">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    <span data-i18n-bn="প্রিন্ট করুন" data-i18n-en="Print">প্রিন্ট করুন</span>
                  </button>
                  <button type="button" class="nid-export-btn nid-export-btn--jpg h-9 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-bold text-slate-700 dark:text-studio-text inline-flex items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-500 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" id="imgCombineDownloadBtn" title="হাই-রেজোলিউশন JPG ইমেজ ডাউনলোড" data-i18n-title-bn="হাই-রেজোলিউশন JPG ইমেজ ডাউনলোড" data-i18n-title-en="Download high-resolution JPG image">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                    <span data-i18n-bn="JPG ইমেজ" data-i18n-en="JPG Image">JPG ইমেজ</span>
                  </button>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
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

        <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="imgColorsDropzone" for="imgColorsInput">
          <input type="file" id="imgColorsInput" name="imgColorsInput" accept="image/*" class="visually-hidden sr-only">
          <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2v-.5a1.5 1.5 0 0 1 1.5-1.5H17a5 5 0 0 0 5-5c0-5.5-4.5-11-10-11z"/></svg>
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

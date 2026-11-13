<script lang="ts">
  import Icon from './ui/Icon.svelte';

  interface Props {
    hidden?: boolean;
  }

  let { hidden = true }: Props = $props();

  const btnBase =
    'inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-700 dark:text-studio-text text-[12px] font-semibold leading-none cursor-pointer transition hover:bg-slate-100 dark:hover:bg-studio-surface hover:border-slate-300 dark:hover:border-slate-600 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-40 disabled:pointer-events-none select-none';
  const btnPrimary =
    'bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:via-blue-500 hover:to-violet-500 text-white border-transparent shadow-xs shadow-indigo-500/20 font-bold';
  const btnIcon =
    'inline-flex items-center justify-center min-h-[30px] w-[30px] p-0 rounded-md border border-slate-200/90 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-700 dark:text-studio-text cursor-pointer transition hover:bg-slate-100 dark:hover:bg-studio-surface hover:border-slate-300 dark:hover:border-slate-600 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-40 disabled:pointer-events-none select-none shrink-0';
</script>

      <section
        class="img-pane th-nid-studio ds group/nid relative w-full text-slate-900 dark:text-studio-text antialiased select-none [&_[hidden]]:!hidden data-[has-pages=true]:lg:fixed data-[has-pages=true]:lg:inset-x-0 data-[has-pages=true]:lg:top-12 data-[has-pages=true]:lg:bottom-0 data-[has-pages=true]:lg:z-40 data-[has-pages=true]:lg:w-screen data-[has-pages=true]:lg:h-[calc(100dvh-3rem)] data-[has-pages=true]:max-lg:fixed data-[has-pages=true]:max-lg:inset-0 data-[has-pages=true]:max-lg:z-[70] data-[has-pages=true]:max-lg:w-screen data-[has-pages=true]:max-lg:h-[100dvh] data-[has-pages=true]:flex-1 data-[has-pages=true]:min-h-0 data-[has-pages=true]:flex data-[has-pages=true]:flex-col data-[has-pages=true]:overflow-hidden data-[has-pages=true]:bg-slate-100 dark:data-[has-pages=true]:bg-studio-bg"
        id="img-pane-combine"
        data-mobile-view="edit"
        data-mobile-step="crop"
        data-view="split"
        data-sidebar-collapsed="false"
        data-has-pages="false"
        {hidden}
        aria-label="NID Card Scanner & Print Studio"
      >
        <input type="file" id="nidReplaceFrontInput" accept="image/*" class="visually-hidden sr-only">
        <input type="file" id="nidReplaceBackInput" accept="image/*" class="visually-hidden sr-only">
        <input type="file" id="nidReplaceExtraInput" accept="image/*" class="visually-hidden sr-only">

        <!-- CLEAN INITIAL UPLOAD STATE (MODERN HERO DROPZONE — IDENTICAL TO DOCUMENT & PASSPORT SCANNER) -->
        <div id="imgCombineDropzone" class="ds-empty space-y-4">
          <div
            class="ds-empty-card pdf-dropzone relative flex flex-col items-center justify-center text-center py-12 px-5 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-[#f4f5f7] dark:bg-studio-panel/75 hover:border-blue-400/70 dark:hover:border-blue-500/60 cursor-pointer transition-all duration-200 [&.is-over]:border-blue-500 [&.is-over]:bg-blue-50/60 dark:[&.is-over]:bg-blue-500/10 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
          >
            <!-- Multi-layered Colorful Hero Illustration (Monitor + ID Card + Glossy Blue Card + Camera Outline + Plus Badge) -->
            <div class="ds-empty-symbol relative w-44 h-34 mb-4 select-none pointer-events-none flex items-center justify-center" style="width: 176px; height: 136px;">
              <svg width="176" height="136" style="width: 100%; height: 100%;" viewBox="0 0 200 150" class="!w-full !h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="nidHeroGlow" x1="65" y1="65" x2="105" y2="138" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.28" />
                    <stop offset="65%" stop-color="#93c5fd" stop-opacity="0.16" />
                    <stop offset="100%" stop-color="#f4f5f7" stop-opacity="0" />
                  </linearGradient>
                  <linearGradient id="nidHeroCamStroke" x1="126" y1="12" x2="156" y2="62" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.55" />
                    <stop offset="100%" stop-color="#93c5fd" stop-opacity="0.1" />
                  </linearGradient>
                  <linearGradient id="nidHeroBlueCard" x1="42" y1="24" x2="96" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#0055ff" />
                    <stop offset="55%" stop-color="#3b82f6" stop-opacity="0.92" />
                    <stop offset="100%" stop-color="#93c5fd" stop-opacity="0.72" />
                  </linearGradient>
                  <linearGradient id="nidHeroPlusGrad" x1="126" y1="90" x2="162" y2="128" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#2563eb" />
                  </linearGradient>
                  <filter id="nidHeroCardShadow" x="-15%" y="-15%" width="130%" height="135%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#1e3a8a" flood-opacity="0.18" />
                  </filter>
                  <filter id="nidHeroPlusShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#2563eb" flood-opacity="0.28" />
                  </filter>
                </defs>

                <path d="M46 130 C46 84, 72 62, 108 62 C136 62, 152 90, 152 130 Z" fill="url(#nidHeroGlow)" />

                <g stroke="url(#nidHeroCamStroke)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M114 27 H122 L126 20 H142 L146 27 H154 A6 6 0 0 1 160 33 V61 A6 6 0 0 1 154 67 H114 A6 6 0 0 1 108 61 V33 A6 6 0 0 1 114 27 Z" fill="#e6f7f3" fill-opacity="0.25" />
                  <circle cx="134" cy="46" r="10.5" />
                </g>

                <path d="M93 108 H113 L116 125 H90 Z" fill="#e2e8f0" />
                <rect x="76" y="124" width="54" height="5" rx="2.5" fill="#ffffff" />
                <line x1="36" y1="129" x2="150" y2="129" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55" />

                <rect x="57" y="42" width="92" height="68" rx="6" fill="#ffffff" stroke="#d5dde6" stroke-width="2" />
                <rect x="61" y="46" width="84" height="54" rx="3" fill="#181b20" />
                <path d="M58 100 H148 V105 A4 4 0 0 1 144 109 H62 A4 4 0 0 1 58 105 Z" fill="#f8fafc" />

                <!-- Front & Back ID Card Sheet Inside Monitor -->
                <g>
                  <rect x="82" y="52" width="42" height="19" rx="2.5" fill="#ffffff" />
                  <circle cx="90" cy="61.5" r="3.2" fill="#93c5fd" />
                  <rect x="96" y="57" width="22" height="2.2" rx="1" fill="#cbd5e1" />
                  <rect x="96" y="62" width="16" height="2.2" rx="1" fill="#e2e8f0" />
                  <rect x="82" y="75" width="42" height="19" rx="2.5" fill="#ffffff" />
                  <rect x="87" y="80" width="32" height="2.2" rx="1" fill="#cbd5e1" />
                  <rect x="87" y="85" width="24" height="2.2" rx="1" fill="#e2e8f0" />
                </g>

                <g filter="url(#nidHeroCardShadow)">
                  <rect x="42" y="25" width="48" height="38" rx="5" fill="url(#nidHeroBlueCard)" stroke="#ffffff" stroke-width="1" stroke-opacity="0.65" />
                  <circle cx="52.5" cy="35" r="3.5" fill="#ffffff" fill-opacity="0.92" />
                  <path d="M44 59 L58 43 L70 59 Z" fill="#2563eb" fill-opacity="0.55" />
                  <path d="M58 59 L73 39 L88 59 Z" fill="#ffffff" fill-opacity="0.45" />
                </g>

                <g filter="url(#nidHeroPlusShadow)">
                  <circle cx="144" cy="109" r="19" fill="url(#nidHeroPlusGrad)" />
                  <path d="M144 100 V118 M135 109 H153" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" />
                </g>
              </svg>
            </div>

            <!-- Hero Subtitle Instruction -->
            <p
              class="text-[15px] sm:text-[16px] font-normal text-slate-600 dark:text-slate-300 m-0 mb-4 tracking-[-0.01em] max-w-[56ch]"
              data-i18n-bn="এনআইডি বা আইডি কার্ডের ছবি এখানে ড্রপ করুন, পেস্ট করুন (Ctrl+V), অথবা নিচের যেকোনো অপশন বেছে নিন"
              data-i18n-en="Drop ID card photos here, paste (Ctrl+V), or choose an option below to start"
            >
              এনআইডি বা আইডি কার্ডের ছবি এখানে ড্রপ করুন, পেস্ট করুন (Ctrl+V), অথবা নিচের যেকোনো অপশন বেছে নিন
            </p>

            <!-- Card Type Pre-Selector (Landscape 85.6×54mm vs Portrait 54×85.6mm) -->
            <div class="inline-flex flex-wrap items-center justify-center gap-1.5 mb-6 px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-studio-sidebar/90 border border-slate-200/85 dark:border-studio-border shadow-2xs" role="group" aria-label="আইডি কার্ডের ধরন নির্বাচন">
              <span class="text-[12px] font-semibold text-slate-500 dark:text-slate-400 px-1" data-i18n-bn="কার্ডের ধরন:" data-i18n-en="Card Type:">কার্ডের ধরন:</span>
              <button
                type="button"
                id="nidDropOrientLandscape"
                aria-pressed="true"
                class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-transparent text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white aria-pressed:bg-blue-500/12 dark:aria-pressed:bg-blue-500/20 aria-pressed:border-blue-500/45 aria-pressed:text-blue-700 dark:aria-pressed:text-blue-300 cursor-pointer transition-colors"
                title="আড়াআড়ি / ল্যান্ডস্কেপ আইডি কার্ড (85.6×54mm)"
                data-i18n-title-bn="আড়াআড়ি / ল্যান্ডস্কেপ আইডি কার্ড (85.6×54mm)"
                data-i18n-title-en="Landscape ID Card (85.6×54mm)"
              >
                <svg viewBox="0 0 20 14" class="w-4 h-3 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <rect x="1" y="1" width="18" height="12" rx="2" />
                  <rect x="3.5" y="4" width="4" height="5" rx="0.8" fill="currentColor" stroke="none" opacity="0.7" />
                  <path d="M9.5 4.8h6M9.5 7.5h4.5" stroke-linecap="round" />
                </svg>
                <span data-i18n-bn="আড়াআড়ি ID" data-i18n-en="Landscape ID">আড়াআড়ি ID</span>
              </button>
              <button
                type="button"
                id="nidDropOrientPortrait"
                aria-pressed="false"
                class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-transparent text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white aria-pressed:bg-violet-500/12 dark:aria-pressed:bg-violet-500/20 aria-pressed:border-violet-500/45 aria-pressed:text-violet-700 dark:aria-pressed:text-violet-300 cursor-pointer transition-colors"
                title="পোর্ট্রেট / লম্বা আইডি কার্ড (54×85.6mm)"
                data-i18n-title-bn="পোর্ট্রেট / লম্বা আইডি কার্ড (54×85.6mm)"
                data-i18n-title-en="Portrait ID Card (54×85.6mm)"
              >
                <svg viewBox="0 0 14 18" class="w-3 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <rect x="1" y="1" width="12" height="16" rx="2" />
                  <rect x="4.5" y="3.5" width="5" height="4.5" rx="0.8" fill="currentColor" stroke="none" opacity="0.7" />
                  <path d="M3.5 10.5h7M4.5 13h5" stroke-linecap="round" />
                </svg>
                <span data-i18n-bn="পোর্ট্রেট ID" data-i18n-en="Portrait ID">পোর্ট্রেট ID</span>
              </button>
            </div>

            <!-- Elevated White Action Cards with Colorful Modern Icons -->
            <div class="ds-empty-actions grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full max-w-[840px]">
              <!-- 1. Smart Camera Scan -->
              <button
                type="button"
                data-cam-slot="0"
                class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(16,185,129,0.12)] hover:border-emerald-400/80 dark:hover:border-emerald-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
              >
                <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.38a1.5 1.5 0 0 0 1.25-.67l.74-1.11A1.5 1.5 0 0 1 11.12 3.5h1.76a1.5 1.5 0 0 1 1.25.67l.74 1.11a1.5 1.5 0 0 0 1.25.67h1.38A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" fill="#3b82f6" />
                  <circle cx="12" cy="13" r="4.2" fill="#ffffff" />
                  <circle cx="12" cy="13" r="2.3" fill="#2563eb" />
                  <circle cx="16.8" cy="8.8" r="1" fill="#ffffff" />
                </svg>
                <span data-i18n-bn="স্মার্ট ক্যামেরা" data-i18n-en="Smart Scan">স্মার্ট ক্যামেরা</span>
              </button>

              <!-- 2. Upload Front Side -->
              <label
                for="nidFrontInput"
                class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-blue-400/80 dark:hover:border-blue-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
              >
                <input type="file" id="nidFrontInput" name="nidFrontInput" accept="image/*" class="visually-hidden sr-only">
                <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="3" fill="#1677ff" />
                  <circle cx="8" cy="10.5" r="2.1" fill="#ffffff" />
                  <path d="M5.2 15.8c.55-1.35 1.45-2.05 2.8-2.05s2.25.7 2.8 2.05" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
                  <path d="M13 9.5h5.5M13 13h4" stroke="#93c5fd" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span data-i18n-bn="সামনের পৃষ্ঠা" data-i18n-en="Front Side">সামনের পৃষ্ঠা</span>
              </label>

              <!-- 3. Upload Back Side -->
              <label
                for="nidBackInput"
                class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-indigo-400/80 dark:hover:border-indigo-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
              >
                <input type="file" id="nidBackInput" name="nidBackInput" accept="image/*" class="visually-hidden sr-only">
                <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="3" fill="#4f46e5" />
                  <rect x="2.5" y="7.5" width="19" height="2.8" fill="#c7d2fe" fill-opacity="0.85" />
                  <path d="M6 13.5h12M6 16.2h8.5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span data-i18n-bn="পেছনের পৃষ্ঠা" data-i18n-en="Back Side">পেছনের পৃষ্ঠা</span>
              </label>

              <!-- 4. Import Both / Multiple Images -->
              <label
                for="imgCombineInput"
                class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(124,58,237,0.12)] hover:border-violet-400/80 dark:hover:border-violet-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
              >
                <input type="file" id="imgCombineInput" name="imgCombineInput" accept="image/*" multiple class="visually-hidden sr-only">
                <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2.5" y="3.5" width="16.5" height="16.5" rx="3" fill="#7c3aed" />
                  <circle cx="7.5" cy="8.5" r="1.75" fill="#ffffff" />
                  <path d="M4 17.5L9.2 11.8L13.5 16.2L15.8 13.8L17.5 17.5H4Z" fill="#ddd6fe" fill-opacity="0.9" />
                  <circle cx="17.5" cy="17.5" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.4" />
                  <path d="M17.5 15.3v4.4M15.3 17.5h4.4" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
                </svg>
                <span data-i18n-bn="উভয় পাশ একসাথে" data-i18n-en="Both Sides">উভয় পাশ একসাথে</span>
              </label>
              <button type="button" class="visually-hidden sr-only" data-cam-slot="1" tabindex="-1" data-i18n-bn="পেছনের ক্যামেরা" data-i18n-en="Back Camera">পেছনের ক্যামেরা</button>
            </div>
          </div>
        </div>

        <!-- ACTIVE PROFESSIONAL DESIGN WORKSPACE (MATCHES DOCUMENT & PASSPORT SCANNER 3-PANEL SHELL) -->
        <div class="pdf-workspace-stage th-studio-stage flex-1 min-h-0 flex flex-col overflow-hidden" id="imgCombineStage" hidden>
          <!-- ========================================== CAMSCANNER MOBILE TOP APP BAR (< 1024px ONLY) -->
          <header
            class="nid-mobile-topbar lg:hidden min-h-[48px] px-2.5 py-1 bg-[#12151e] text-white border-b border-white/10 flex items-center justify-between gap-1.5 shrink-0 z-40"
            aria-label="মোবাইল এনআইডি স্ক্যানার হেডার"
          >
            <!-- Left: Back / New Scan + Undo / Redo -->
            <div class="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                id="nidMobBackBtn"
                class="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-[11.5px] font-bold border border-white/10 cursor-pointer"
                title="পেছনে যান / নতুন স্ক্যান"
              >
                <Icon name="lucide:arrow-left" class="w-4 h-4 shrink-0" />
                <span id="nidMobBackTxt" data-i18n-bn="নতুন" data-i18n-en="New">নতুন</span>
              </button>
              <button
                type="button"
                id="nidMobUndoBtn"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-slate-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                disabled
                title="আনডু (Undo)"
              >
                <Icon name="lucide:undo-2" class="w-4 h-4" />
              </button>
              <button
                type="button"
                id="nidMobRedoBtn"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-slate-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                disabled
                title="রিডু (Redo)"
              >
                <Icon name="lucide:redo-2" class="w-4 h-4" />
              </button>
            </div>

            <!-- Center: CamScanner 1-Tap Front / Back Card Switcher Pills -->
            <div
              class="inline-flex items-center gap-1 p-0.5 rounded-xl bg-white/8 border border-white/10 min-w-0 overflow-x-auto [scrollbar-width:none]"
              id="nidMobSideSwitch"
              role="tablist"
              aria-label="সামনের ও পেছনের পৃষ্ঠা পরিবর্তন"
            >
              <button
                type="button"
                id="nidMobFrontPill"
                role="tab"
                aria-selected="true"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11.5px] font-bold transition-colors cursor-pointer shrink-0 bg-emerald-500 text-white shadow-xs"
              >
                <span id="nidMobFrontTxt" data-i18n-bn="সামনে" data-i18n-en="Front">সামনে</span>
              </button>
              <button
                type="button"
                id="nidMobBackPill"
                role="tab"
                aria-selected="false"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11.5px] font-bold transition-colors cursor-pointer shrink-0 bg-transparent text-slate-300 hover:text-white"
              >
                <span id="nidMobBackSideTxt" data-i18n-bn="+ পেছনে" data-i18n-en="+ Back">+ পেছনে</span>
              </button>
              <button
                type="button"
                id="nidMobSwapBtn"
                class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                title="সামনের ও পেছনের পাশ অদলবদল করুন"
              >
                <Icon name="lucide:arrow-up-down" class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Right: Camera + All Card Sides Drawer Toggle -->
            <div class="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                id="nidMobCamBtn"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-emerald-400 border border-white/10 cursor-pointer"
                title="ক্যামেরা দিয়ে স্ক্যান করুন"
              >
                <Icon name="lucide:camera" class="w-4 h-4" />
              </button>
              <button
                type="button"
                id="nidMobPagesBtn"
                class="inline-flex items-center justify-center gap-1 h-8 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11.5px] font-bold border border-white/10 aria-pressed:bg-indigo-600 aria-pressed:border-indigo-500 cursor-pointer"
                aria-pressed="false"
                title="সব কার্ডের পৃষ্ঠা দেখুন"
              >
                <Icon name="lucide:layers" class="w-3.5 h-3.5 text-indigo-300" />
                <span id="nidMobCountBadge" class="tabular-nums">১</span>
              </button>
            </div>
          </header>

          <!-- NATIVE DESKTOP THREE-PANEL WORKSPACE (ON MOBILE: CAMSCANNER FLEX-COL STAGE) -->
          <div class="nid-studio-body ds-body flex-1 min-h-0 grid grid-cols-[224px_minmax(0,1fr)_348px] group-data-[sidebar-collapsed=true]/nid:grid-cols-[0px_minmax(0,1fr)_348px] max-lg:flex max-lg:flex-col overflow-hidden">

            <!-- ========================================== PANEL 1: LEFT CARD SIDES FILMSTRIP -->
            <aside
              class="ds-pages bg-white dark:bg-studio-sidebar border-r border-slate-200 dark:border-studio-border flex flex-col min-h-0 overflow-hidden group-data-[sidebar-collapsed=true]/nid:lg:opacity-0 group-data-[sidebar-collapsed=true]/nid:lg:pointer-events-none group-data-[sidebar-collapsed=true]/nid:lg:border-r-0 max-lg:hidden max-lg:group-data-[mobile-step=pages]/nid:flex max-lg:flex-1"
              id="nidPagesSidebar"
              aria-label="ID Card Sides"
            >
              <div class="ds-panel-head sticky top-0 z-20 min-h-[38px] px-3 py-1.5 flex items-center justify-between gap-1.5 border-b border-slate-200 dark:border-studio-border bg-slate-50/90 dark:bg-studio-sidebar shrink-0">
                <strong class="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-800 dark:text-studio-text">
                  <Icon name="lucide:credit-card" class="w-4 h-4 text-emerald-600 dark:text-studio-primary shrink-0" />
                  <span data-i18n-bn="কার্ডের পৃষ্ঠা" data-i18n-en="Card Sides">কার্ডের পৃষ্ঠা</span>
                  <span id="nidCount" class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11.5px] font-bold tabular-nums">0</span>
                </strong>
                <div class="inline-flex items-center gap-2">
                  <span class="text-slate-400 dark:text-studio-muted text-[11px] font-medium max-lg:hidden" data-i18n-bn="সামনে / পেছনে" data-i18n-en="Front / Back">সামনে / পেছনে</span>
                  <button
                    type="button"
                    id="nidMobClosePagesBtn"
                    class="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11.5px] font-bold cursor-pointer"
                  >
                    <Icon name="lucide:check" class="w-3.5 h-3.5" />
                    <span data-i18n-bn="সম্পন্ন" data-i18n-en="Done">সম্পন্ন</span>
                  </button>
                </div>
              </div>

              <!-- Vertical Card Sides List (#nidCardTabs) — Renders large ID-Card ratio cards -->
              <div
                class="ds-page-list nid-card-tabs flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2.5 [scrollbar-width:thin]"
                id="nidCardTabs"
                role="tablist"
                aria-label="ID Card Pages"
              ></div>

              <div class="ds-page-footer p-2 border-t border-slate-200 dark:border-studio-border grid gap-1.5 bg-slate-50/80 dark:bg-studio-sidebar shrink-0">
                <div class="grid grid-cols-[1fr_auto] gap-1.5">
                  <label
                    for="imgCombineAddMore"
                    class="ds-add-more w-full inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1 rounded-md border border-emerald-600/35 dark:border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[12.5px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors"
                    title="আরও কার্ডের ছবি যুক্ত করুন"
                    data-i18n-title-bn="আরও কার্ডের ছবি যুক্ত করুন"
                    data-i18n-title-en="Add Card Side"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5 shrink-0" />
                    <span data-i18n-bn="পেজ যোগ করুন" data-i18n-en="Add Side">পেজ যোগ করুন</span>
                    <input type="file" id="imgCombineAddMore" name="imgCombineAddMore" accept="image/*" multiple class="visually-hidden sr-only">
                  </label>
                  <button
                    type="button"
                    class="{btnBase} min-h-[32px] px-2.5 rounded-md"
                    data-cam-slot="-1"
                    title="ক্যামেরা দিয়ে স্ক্যান করুন"
                    data-i18n-title-bn="ক্যামেরা দিয়ে স্ক্যান করুন"
                    data-i18n-title-en="Camera Scan"
                    aria-label="Scan with camera"
                  >
                    <Icon name="lucide:camera" class="w-4 h-4 shrink-0" />
                  </button>
                </div>
                <button
                  type="button"
                  id="imgCombineClearBtn"
                  class="w-full inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-rose-500/30 dark:border-rose-400/30 bg-rose-500/8 hover:bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[11.5px] font-semibold cursor-pointer transition-colors"
                  title="বর্তমান স্ক্যান মুছে নতুন করে শুরু করুন"
                  data-i18n-title-bn="বর্তমান স্ক্যান মুছে নতুন করে শুরু করুন"
                  data-i18n-title-en="Clear All & Start Over"
                >
                  <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5 shrink-0" />
                  <span data-i18n-bn="সব মুছে নতুন শুরু" data-i18n-en="Clear & Start Over">সব মুছে নতুন শুরু</span>
                </button>
                <small class="text-center text-[11px] text-slate-400 dark:text-studio-muted truncate" data-i18n-bn="JPG, PNG, WebP · সামনের ও পেছনের ছবি" data-i18n-en="JPG, PNG, WebP · Front & Back Sides">JPG, PNG, WebP · সামনের ও পেছনের ছবি</small>
              </div>
            </aside>

            <!-- ========================================== PANEL 2: CENTER COMMAND BAR & DUAL CANVAS STAGE -->
            <div class="ds-main th-panel th-panel--center min-w-0 min-h-0 flex-1 flex flex-col bg-slate-100 dark:bg-studio-bg overflow-hidden max-lg:group-data-[mobile-step=pages]/nid:hidden" id="nidScannerCropPanel">
              <!-- STICKY COMPACT NATIVE DESKTOP ICON RIBBON (HIDDEN ON MOBILE IN FAVOR OF CAMSCANNER TOP & BOTTOM BARS) -->
              <div
                class="ds-toolbar th-context-toolbar max-lg:hidden sticky top-0 z-30 min-h-[42px] px-2.5 py-1 border-b border-slate-200 dark:border-studio-border bg-white/98 dark:bg-studio-sidebar/98 backdrop-blur-xs flex items-center gap-1 flex-wrap shrink-0"
                role="toolbar"
                aria-label="ID Card Editing Toolbar"
              >
                <!-- Group 1: Sidebar, Add, Camera, Replace, Clone 2nd Side, Swap, New Scan -->
                <div class="ds-toolbar-group inline-flex items-center gap-0.5 shrink-0" id="imgCombineTopActions" role="group" aria-label="Pages & Input">
                  <button
                    type="button"
                    id="nidSidebarToggleBtn"
                    class="{btnIcon} max-lg:hidden aria-pressed:bg-slate-100 dark:aria-pressed:bg-studio-surface aria-pressed:text-indigo-600 dark:aria-pressed:text-indigo-400"
                    aria-pressed="true"
                    title="বামের পেজ তালিকা লুকান/দেখান"
                    data-i18n-title-bn="বামের পেজ তালিকা লুকান/দেখান"
                    data-i18n-title-en="Toggle Sidebar"
                  >
                    <Icon name="lucide:panel-left" class="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span class="sr-only">Toggle Sidebar</span>
                  </button>
                  <label
                    for="imgCombineAddMore"
                    class="{btnIcon} bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    title="নতুন কার্ডের পৃষ্ঠা যুক্ত করুন"
                    data-i18n-title-bn="নতুন কার্ডের পৃষ্ঠা যুক্ত করুন"
                    data-i18n-title-en="Add Side"
                  >
                    <Icon name="lucide:plus" class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span class="sr-only">Add Side</span>
                  </label>
                  <button
                    type="button"
                    id="nidCameraStageBtn"
                    class={btnIcon}
                    title="ক্যামেরা দিয়ে স্ক্যান করুন"
                    data-i18n-title-bn="ক্যামেরা দিয়ে স্ক্যান করুন"
                    data-i18n-title-en="Camera Scan"
                  >
                    <Icon name="lucide:camera" class="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span class="sr-only">Camera Scan</span>
                  </button>
                  <button
                    type="button"
                    id="nidReplaceActiveBtn"
                    class={btnIcon}
                    title="নির্বাচিত পাশের ছবি বদলান"
                    data-i18n-title-bn="নির্বাচিত পাশের ছবি বদলান"
                    data-i18n-title-en="Replace Side"
                  >
                    <Icon name="lucide:image-up" class="w-4.5 h-4.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span class="sr-only">Replace Side</span>
                  </button>
                  <button
                    type="button"
                    id="nidCloneSameImgBtn"
                    class={btnIcon}
                    title="একই ছবি থেকে অপর পাশ ক্লোন করুন"
                    data-i18n-title-bn="একই ছবি থেকে অপর পাশ ক্লোন করুন"
                    data-i18n-title-en="Clone 2nd Side"
                  >
                    <Icon name="lucide:copy" class="w-4.5 h-4.5 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span class="sr-only">Clone 2nd Side</span>
                  </button>
                  <button
                    type="button"
                    id="imgCombineSwapBtn"
                    class={btnIcon}
                    title="সামনের ও পেছনের পাশ অদলবদল করুন"
                    data-i18n-title-bn="সামনের ও পেছনের পাশ অদলবদল করুন"
                    data-i18n-title-en="Swap Sides"
                  >
                    <Icon name="lucide:arrow-up-down" class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span class="sr-only">Swap Sides</span>
                  </button>
                </div>

                <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-0.5 shrink-0" aria-hidden="true"></span>

                <!-- Group 3: Step 1 — Orientation (Rotate Left, Rotate Right, Mirror Flip) -->
                <div class="ds-toolbar-group inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-slate-100/70 dark:bg-studio-panel/60 border border-slate-200/70 dark:border-studio-border shrink-0" role="group" aria-label="Orientation">
                  <button
                    type="button"
                    id="nidRotLBtn"
                    class={btnIcon}
                    title="৯০° বামে ঘোরান"
                    data-i18n-title-bn="৯০° বামে ঘোরান"
                    data-i18n-title-en="Rotate Left (90°)"
                  >
                    <Icon name="lucide:rotate-ccw" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span class="sr-only">Rotate Left</span>
                  </button>
                  <button
                    type="button"
                    id="nidRotRBtn"
                    class={btnIcon}
                    title="৯০° ডানে ঘোরান"
                    data-i18n-title-bn="৯০° ডানে ঘোরান"
                    data-i18n-title-en="Rotate Right (90°)"
                  >
                    <Icon name="lucide:rotate-cw" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span class="sr-only">Rotate Right</span>
                  </button>
                  <button
                    type="button"
                    id="nidFlipHBtn"
                    class={btnIcon}
                    title="পাশাপাশি উল্টান"
                    data-i18n-title-bn="পাশাপাশি উল্টান"
                    data-i18n-title-en="Mirror Flip"
                  >
                    <Icon name="lucide:flip-horizontal-2" class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span class="sr-only">Mirror Flip</span>
                  </button>
                </div>

                <!-- Group 4: Step 2 — Smart Crop & Card Orientation Ratios (Auto Detect, Landscape ID, Portrait ID, Full Image) -->
                <div class="ds-toolbar-group inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-slate-100/70 dark:bg-studio-panel/60 border border-slate-200/70 dark:border-studio-border shrink-0" role="group" aria-label="Smart Crop & Ratio">
                  <button
                    type="button"
                    id="nidAutoCropBtn"
                    class={btnIcon}
                    title="অটো কার্ড ডিটেক্ট ও সোজা করুন"
                    data-i18n-title-bn="অটো কার্ড ডিটেক্ট ও সোজা করুন"
                    data-i18n-title-en="Auto Detect & Straighten Card"
                  >
                    <Icon name="lucide:scan-line" class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span class="sr-only">Auto Detect</span>
                  </button>
                  <div class="inline-flex items-center gap-0.5 rounded-md bg-slate-200/70 dark:bg-studio-sidebar/80 p-0.5" role="group" aria-label="ID Card Orientation">
                    <button
                      type="button"
                      id="nidSnapRatioBtn"
                      aria-pressed="true"
                      class="inline-flex items-center gap-1 h-7 px-2 rounded border border-transparent text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:border-blue-500/40 aria-pressed:text-blue-600 dark:aria-pressed:text-blue-400 aria-pressed:shadow-2xs cursor-pointer transition-colors"
                      title="আড়াআড়ি / ল্যান্ডস্কেপ আইডি ক্রপ রেশিও (85.6×54mm)"
                      data-i18n-title-bn="আড়াআড়ি / ল্যান্ডস্কেপ আইডি ক্রপ রেশিও (85.6×54mm)"
                      data-i18n-title-en="Landscape ID Crop Ratio (85.6×54mm)"
                    >
                      <svg viewBox="0 0 20 14" class="w-4 h-3 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                        <rect x="1" y="1" width="18" height="12" rx="2" />
                        <rect x="3.5" y="4" width="4" height="5" rx="0.8" fill="currentColor" stroke="none" opacity="0.7" />
                        <path d="M9.5 4.8h6M9.5 7.5h4.5" stroke-linecap="round" />
                      </svg>
                      <span data-i18n-bn="আড়াআড়ি" data-i18n-en="Landscape">আড়াআড়ি</span>
                    </button>
                    <button
                      type="button"
                      id="nidSnapPortraitRatioBtn"
                      aria-pressed="false"
                      class="inline-flex items-center gap-1 h-7 px-2 rounded border border-transparent text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:border-violet-500/40 aria-pressed:text-violet-600 dark:aria-pressed:text-violet-400 aria-pressed:shadow-2xs cursor-pointer transition-colors"
                      title="লম্বা / পোর্ট্রেট আইডি ক্রপ রেশিও (54×85.6mm)"
                      data-i18n-title-bn="লম্বা / পোর্ট্রেট আইডি ক্রপ রেশিও (54×85.6mm)"
                      data-i18n-title-en="Portrait ID Crop Ratio (54×85.6mm)"
                    >
                      <svg viewBox="0 0 14 18" class="w-3 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                        <rect x="1" y="1" width="12" height="16" rx="2" />
                        <rect x="4.5" y="3.5" width="5" height="4.5" rx="0.8" fill="currentColor" stroke="none" opacity="0.7" />
                        <path d="M3.5 10.5h7M4.5 13h5" stroke-linecap="round" />
                      </svg>
                      <span data-i18n-bn="পোর্ট্রেট" data-i18n-en="Portrait">পোর্ট্রেট</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    id="nidFullCropBtn"
                    class={btnIcon}
                    title="সম্পূর্ণ ছবি নির্বাচন"
                    data-i18n-title-bn="সম্পূর্ণ ছবি নির্বাচন"
                    data-i18n-title-en="Full Image"
                  >
                    <Icon name="lucide:frame" class="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                    <span class="sr-only">Full Image</span>
                  </button>
                </div>

                <!-- Group 5: Step 3 — Border Nudge & Magnetic Snap -->
                <div class="ds-toolbar-group inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-slate-100/70 dark:bg-studio-panel/60 border border-slate-200/70 dark:border-studio-border shrink-0" role="group" aria-label="Border Fine Nudge">
                  <button
                    type="button"
                    id="nidTightenCropBtn"
                    class={btnIcon}
                    title="বর্ডার সামান্য ভেতরে চাপান"
                    data-i18n-title-bn="বর্ডার সামান্য ভেতরে চাপান"
                    data-i18n-title-en="Tighten Crop"
                  >
                    <Icon name="lucide:minimize-2" class="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                    <span class="sr-only">Tighten Crop</span>
                  </button>
                  <button
                    type="button"
                    id="nidExpandCropBtn"
                    class={btnIcon}
                    title="চারপাশে সামান্য বাড়তি মার্জিন"
                    data-i18n-title-bn="চারপাশে সামান্য বাড়তি মার্জিন"
                    data-i18n-title-en="Expand Margin"
                  >
                    <Icon name="lucide:maximize-2" class="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span class="sr-only">Expand Margin</span>
                  </button>
                  <button
                    type="button"
                    id="nidMagSnapBtn"
                    aria-pressed="false"
                    class="{btnIcon} aria-pressed:bg-emerald-500/12 aria-pressed:border-emerald-500/35 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
                    title="ম্যাগনেটিক স্ন্যাপ: বন্ধ"
                    data-i18n-title-bn="ম্যাগনেটিক স্ন্যাপ চালু/বন্ধ করুন"
                    data-i18n-title-en="Magnetic Edge Snap"
                  >
                    <Icon name="lucide:magnet" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span class="nid-btn-txt sr-only" data-i18n-bn="স্ন্যাপ: বন্ধ" data-i18n-en="Snap: Off">স্ন্যাপ: বন্ধ</span>
                  </button>
                </div>

                <!-- Right Side View Switcher (Integrated Crop Completion + Split + Preview) -->
                <div class="ds-toolbar-right ml-auto inline-flex items-center gap-1 shrink-0">
                  <div
                    class="ds-view-switch inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border gap-0.5"
                    role="group"
                    aria-label="Canvas View Mode"
                  >
                    <button
                      type="button"
                      data-nid-canvas-view="crop"
                      aria-pressed="false"
                      title="ক্রপ মোড (পুনরায় ক্লিক করলে ক্রপ সম্পন্ন হবে)"
                      data-i18n-title-bn="ক্রপ মোড (পুনরায় ক্লিক করলে ক্রপ সম্পন্ন হবে)"
                      data-i18n-title-en="Crop Mode (Click again to finish crop)"
                      class="group/cropbtn inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[12px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-emerald-600 aria-pressed:text-white aria-pressed:shadow-2xs transition-colors"
                    >
                      <Icon name="lucide:crop" class="w-3.5 h-3.5 shrink-0 group-aria-pressed/cropbtn:hidden" />
                      <Icon name="lucide:check" class="w-3.5 h-3.5 shrink-0 hidden group-aria-pressed/cropbtn:inline-block" />
                      <span data-i18n-bn="ক্রপ" data-i18n-en="Crop">ক্রপ</span>
                    </button>
                    <button
                      type="button"
                      data-nid-canvas-view="split"
                      aria-pressed="true"
                      title="স্প্লিট ভিউ (ক্রপ ও প্রিন্ট প্রিভিউ পাশাপাশি)"
                      data-i18n-title-bn="স্প্লিট ভিউ (ক্রপ ও প্রিন্ট প্রিভিউ পাশাপাশি)"
                      data-i18n-title-en="Split View (Crop & Print Preview)"
                      class=" max-md:hidden inline-flex items-center justify-center px-2 h-7 gap-1 rounded-md border-0 bg-transparent text-[12px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
                    >
                      <Icon name="lucide:columns-2" class="w-4 h-4 shrink-0" />
                      <span class="sr-only">Split View</span>
                    </button>
                    <button
                      type="button"
                      data-nid-canvas-view="preview"
                      aria-pressed="false"
                      title="প্রিন্ট প্রিভিউ"
                      data-i18n-title-bn="প্রিন্ট প্রিভিউ"
                      data-i18n-title-en="Print Preview"
                      class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[12px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
                    >
                      <Icon name="lucide:eye" class="w-3.5 h-3.5 shrink-0" />
                      <span data-i18n-bn="প্রিভিউ" data-i18n-en="Preview">প্রিভিউ</span>
                    </button>
                  </div>
                  <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-0.5 shrink-0" aria-hidden="true"></span>
                  <div class="ds-toolbar-group inline-flex items-center gap-0.5 shrink-0" role="group" aria-label="History">
                    <button
                      type="button"
                      id="nidUndoBtn"
                      class={btnIcon}
                      disabled
                      title="পূর্বের অবস্থায় ফিরুন (Ctrl+Z)"
                      data-i18n-title-bn="পূর্বের অবস্থায় ফিরুন (Ctrl+Z)"
                      data-i18n-title-en="Undo (Ctrl+Z)"
                    >
                      <Icon name="lucide:undo-2" class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300 shrink-0" />
                      <span class="sr-only">Undo</span>
                    </button>
                    <button
                      type="button"
                      id="nidRedoBtn"
                      class={btnIcon}
                      disabled
                      title="পরবর্তী অবস্থায় যান (Ctrl+Y)"
                      data-i18n-title-bn="পরবর্তী অবস্থায় যান (Ctrl+Y)"
                      data-i18n-title-en="Redo (Ctrl+Y)"
                    >
                      <Icon name="lucide:redo-2" class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300 shrink-0" />
                      <span class="sr-only">Redo</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- DUAL / SINGLE CANVAS WORKSPACE (MATCHES #dsWorkspace IN DOCUMENT SCANNER) -->
              <div class="nid-workspace-split ds-workspace flex-1 min-h-0 grid grid-cols-2 group-data-[view=crop]/nid:grid-cols-1 group-data-[view=preview]/nid:grid-cols-1 max-lg:grid-cols-1 gap-1.5 p-1.5 overflow-hidden">
                <!-- LEFT STAGE: CROP & 4-CORNER PERSPECTIVE STAGE -->
                <div class="nid-canvas-column ds-crop-panel group-data-[view=preview]/nid:hidden flex flex-col min-w-0 min-h-0 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar overflow-hidden shadow-2xs">
                  <div
                    class="nid-crop-canvas-shell ds-viewport relative flex-1 min-h-[240px] overflow-hidden touch-none isolate bg-[#dcdcdc] dark:bg-[#252526] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.045)_0_1px,transparent_1px_24px),repeating-linear-gradient(90deg,rgba(255,255,255,0.045)_0_1px,transparent_1px_24px)]"
                    id="nidCanvasViewport"
                    tabindex="0"
                    aria-label="Editing canvas. Ctrl +/- to zoom, Space + drag to pan."
                  >
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
                          <rect id="nidQuadDimRect" x="0" y="0" width="100" height="100" fill="rgba(4, 9, 20, 0.62)" mask="url(#nidQuadMask)" />
                          <line id="nidGridH1" class="nid-quad-grid" x1="10" y1="36" x2="90" y2="36" />
                          <line id="nidGridH2" class="nid-quad-grid" x1="10" y1="63" x2="90" y2="63" />
                          <line id="nidGridV1" class="nid-quad-grid" x1="36" y1="10" x2="36" y2="90" />
                          <line id="nidGridV2" class="nid-quad-grid" x1="63" y1="10" x2="63" y2="90" />
                          <line id="nidSnapGuideH" class="nid-snap-guide" x1="0" y1="0" x2="0" y2="0" hidden />
                          <line id="nidSnapGuideV" class="nid-snap-guide" x1="0" y1="0" x2="0" y2="0" hidden />
                          <polygon id="nidQuadPoly" class="nid-quad-poly" points="10,10 90,10 90,90 10,90" />
                        </svg>
                        <div class="nid-quad-handles absolute inset-0 pointer-events-none" id="nidQuadHandles">
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5.5 h-5.5 rounded-full bg-blue-600 border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="0" aria-label="উপরের বাম কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5.5 h-5.5 rounded-full bg-blue-600 border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="1" aria-label="উপরের ডান কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5.5 h-5.5 rounded-full bg-blue-600 border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="2" aria-label="নিচের ডান কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--corner absolute w-5.5 h-5.5 rounded-full bg-blue-600 border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing" data-pt="3" aria-label="নিচের বাম কোণা"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white/95 border-2 border-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.38)] -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="0" aria-label="উপরের ধার"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white/95 border-2 border-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.38)] -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="1" aria-label="ডান ধার"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white/95 border-2 border-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.38)] -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="2" aria-label="নিচের ধার"></button>
                          <button type="button" class="nid-quad-handle nid-quad-handle--edge absolute w-6 h-2 rounded-full bg-white/95 border-2 border-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.38)] -translate-x-1/2 -translate-y-1/2 rotate-[var(--edge-deg,0deg)] pointer-events-auto cursor-grab active:cursor-grabbing" data-edge="3" aria-label="বাম ধার"></button>
                        </div>
                      </div>
                    </div>
                    <canvas class="nid-crop-loupe absolute w-44 h-44 rounded-full border-3 border-blue-500 shadow-2xl pointer-events-none z-30" id="nidCropLoupe" width="240" height="240" hidden aria-hidden="true"></canvas>

                    <!-- CamScanner Mobile Floating Crop Assist Pills (< 1024px) -->
                    <div
                      class="lg:hidden absolute bottom-2.5 inset-x-2.5 z-20 flex items-center justify-center pointer-events-none"
                      aria-label="দ্রুত ক্রপ টুলস"
                    >
                      <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#12151e]/88 backdrop-blur-md border border-white/15 shadow-lg pointer-events-auto overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button
                          type="button"
                          id="nidMobSnapRatio"
                          aria-pressed="true"
                          class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 aria-pressed:bg-sky-500/25 aria-pressed:border aria-pressed:border-sky-400/60 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          <svg viewBox="0 0 20 14" class="w-3.5 h-2.5 text-sky-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                            <rect x="1" y="1" width="18" height="12" rx="2" />
                            <rect x="3.5" y="4" width="4" height="5" rx="0.8" fill="currentColor" stroke="none" opacity="0.7" />
                            <path d="M9.5 4.8h6M9.5 7.5h4.5" stroke-linecap="round" />
                          </svg>
                          <span data-i18n-bn="আড়াআড়ি ID" data-i18n-en="Landscape">আড়াআড়ি ID</span>
                        </button>
                        <button
                          type="button"
                          id="nidMobSnapPortrait"
                          aria-pressed="false"
                          class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 aria-pressed:bg-violet-500/25 aria-pressed:border aria-pressed:border-violet-400/60 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          <svg viewBox="0 0 14 18" class="w-2.5 h-3.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                            <rect x="1" y="1" width="12" height="16" rx="2" />
                            <rect x="4.5" y="3.5" width="5" height="4.5" rx="0.8" fill="currentColor" stroke="none" opacity="0.7" />
                            <path d="M3.5 10.5h7M4.5 13h5" stroke-linecap="round" />
                          </svg>
                          <span data-i18n-bn="পোর্ট্রেট ID" data-i18n-en="Portrait">পোর্ট্রেট ID</span>
                        </button>
                        <button
                          type="button"
                          id="nidMobFullCrop"
                          class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          <Icon name="lucide:maximize" class="w-3.5 h-3.5 text-amber-400" />
                          <span data-i18n-bn="পুরো ছবি" data-i18n-en="Full Image">পুরো ছবি</span>
                        </button>
                        <button
                          type="button"
                          id="nidMobCloneSide"
                          class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                        >
                          <Icon name="lucide:copy" class="w-3.5 h-3.5 text-violet-400" />
                          <span data-i18n-bn="২য় পাশ ক্লোন" data-i18n-en="Clone 2nd">২য় পাশ ক্লোন</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- RIGHT STAGE: LIVE PRINT PREVIEW STAGE (MATCHES #dsPreviewStage IN DOCUMENT SCANNER) -->
                <section
                  class="nid-workspace-preview ds-preview-panel group-data-[view=crop]/nid:hidden flex flex-col min-w-0 min-h-0 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar overflow-hidden shadow-2xs"
                  id="nidPreviewPanel"
                  aria-label="বড় প্রিন্ট প্রিভিউ"
                >
                  <div class="nid-sheet-stage relative flex-1 min-h-0 p-4 max-lg:p-2 grid place-items-center [container-type:size] bg-[#dcdcdc] dark:bg-[#252526] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.045)_0_1px,transparent_1px_24px),repeating-linear-gradient(90deg,rgba(255,255,255,0.045)_0_1px,transparent_1px_24px)]">
                    <canvas id="nidLivePreviewCanvas" class="nid-live-preview-canvas rounded-[2px] shadow-[0_14px_34px_rgba(15,23,42,0.22)]" width="806" height="1140" aria-label="Live Preview" hidden></canvas>
                    <img id="imgCombineOutPreview" alt="Combined Preview" width="420" height="594" class="rounded-[2px] shadow-[0_14px_34px_rgba(15,23,42,0.22)]">
                  </div>
                </section>
              </div>

              <!-- BOTTOM WORKSPACE HUD & ZOOM BAR (MATCHES footer.ds-status IN DOCUMENT SCANNER — DESKTOP ONLY) -->
              <footer class="ds-status th-canvas-statusbar max-lg:hidden min-h-[34px] px-3 py-1 border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar flex items-center justify-between gap-2 max-sm:flex-wrap text-[12px] text-slate-600 dark:text-studio-muted shrink-0">
                <div class="ds-status-left th-status-left inline-flex items-center gap-1.5 flex-wrap">
                  <div class="ds-zoom inline-flex items-center gap-0.5 p-0.5 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border" role="group" aria-label="ক্যানভাস জুম">
                    <button type="button" class="min-h-[22px] min-w-[24px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface" id="nidZoomOutBtn" title="জুম আউট (−)" data-i18n-title-bn="জুম আউট (−)" data-i18n-title-en="Zoom Out (−)">−</button>
                    <label class="nid-zoom-input inline-flex items-center text-[11.5px] font-bold text-slate-800 dark:text-studio-text tabular-nums">
                      <input type="number" id="nidZoomPercent" min="1" max="800" step="1" value="100" aria-label="ক্যানভাস জুম শতাংশ" class="w-9 border-0 bg-transparent text-right font-bold text-[11.5px] text-slate-800 dark:text-studio-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                      <span>%</span>
                    </label>
                    <button type="button" class="min-h-[22px] min-w-[24px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface" id="nidZoomInBtn" title="জুম ইন (+)" data-i18n-title-bn="জুম ইন (+)" data-i18n-title-en="Zoom In (+)">+</button>
                    <button type="button" class="min-h-[22px] min-w-[26px] px-1.5 py-0 border-0 rounded bg-transparent text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface" id="nidZoomFitBtn" title="স্ক্রিনে ফিট করুন (Ctrl+0)" data-i18n-title-bn="স্ক্রিনে ফিট করুন (Ctrl+0)" data-i18n-title-en="Fit to Screen (Ctrl+0)">Fit</button>
                    <button type="button" class="min-h-[22px] min-w-[32px] px-1.5 py-0 border-0 rounded bg-transparent text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface" id="nidZoomResetBtn" title="আসল সাইজ ১০০% (Ctrl+1)" data-i18n-title-bn="আসল সাইজ ১০০% (Ctrl+1)" data-i18n-title-en="Actual Size 100% (Ctrl+1)">100%</button>
                  </div>
                  <button type="button" class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer aria-pressed:bg-emerald-500/15 aria-pressed:border-emerald-500/40 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300" id="nidHandToolBtn" aria-pressed="false" title="হ্যান্ড প্যান টুল (H)" data-i18n-title-bn="হ্যান্ড প্যান টুল (H)" data-i18n-title-en="Hand Pan Tool (H)" data-i18n-bn="হ্যান্ড" data-i18n-en="Hand">হ্যান্ড</button>
                  <button type="button" class="active px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer aria-pressed:bg-emerald-500/15 aria-pressed:border-emerald-500/40 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300" id="nidToggleGridBtn" aria-pressed="true" title="গ্রিড লাইন চালু/বন্ধ" data-i18n-title-bn="গ্রিড লাইন চালু/বন্ধ" data-i18n-title-en="Toggle Grid Lines" data-i18n-bn="গ্রিড" data-i18n-en="Grid">গ্রিড</button>
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11.5px] font-bold tabular-nums max-sm:hidden" id="nidPaperLabel">A4 · 210 × 297 mm</span>
                  <small class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted font-semibold text-[11px] tabular-nums whitespace-nowrap max-sm:hidden" id="imgCombineOutMeta">—</small>
                </div>

                <span id="imgCombineSummary" role="status" class="text-slate-800 dark:text-studio-text font-semibold text-[12px] truncate max-md:hidden" data-i18n-bn="চার কোণা মিলিয়ে ক্রপ করুন — প্রিভিউ স্বয়ংক্রিয়ভাবে আপডেট হবে" data-i18n-en="Align four corners to crop — preview updates automatically">চার কোণা মিলিয়ে ক্রপ করুন — প্রিভিউ স্বয়ংক্রিয়ভাবে আপডেট হবে</span>

                <div class="ds-status-right inline-flex items-center gap-2 max-xl:hidden">
                  <small class="text-[11px] text-slate-400 dark:text-slate-500" data-i18n-bn="Ctrl + জুম · Space প্যান" data-i18n-en="Ctrl + Zoom · Space Pan">Ctrl + জুম · Space Pan</small>
                </div>
              </footer>
            </div>

            <!-- ========================================== PANEL 3: RIGHT INSPECTOR PANEL (ON MOBILE: DOCKS BELOW LIVE PREVIEW IN ENHANCE STEP) -->
            <aside class="ds-inspector th-panel th-panel--right nid-sheet-panel bg-white dark:bg-studio-sidebar border-l border-slate-200 dark:border-studio-border flex flex-col min-w-0 min-h-0 max-lg:w-full max-lg:border-l-0 max-lg:border-t max-lg:max-h-[38dvh] max-lg:shrink-0 max-lg:group-data-[mobile-step=crop]/nid:!hidden max-lg:group-data-[mobile-step=pages]/nid:!hidden" id="nidPrintPanel" aria-label="Inspector & Page Setup">

              <!-- Photoshop-style Top Tab Bar (Switches between Filters / Smart Fix / Layout panes) -->
              <div class="px-2.5 pt-1.5 border-b border-slate-200 dark:border-studio-border bg-slate-100/70 dark:bg-studio-bg flex items-center justify-between gap-1 shrink-0" role="tablist" aria-label="Inspector Panels">
                <div class="flex items-center gap-0.5">
                  <button
                    type="button"
                    role="tab"
                    aria-selected="true"
                    data-nid-insp-tab="filters"
                    title="AI ও কালার ফিল্টার"
                    data-i18n-title-bn="AI ও কালার ফিল্টার"
                    data-i18n-title-en="AI & Color Filters"
                    class="px-2.5 py-1.5 rounded-t-md text-[11.5px] font-bold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-studio-sidebar border-t-2 border-x border-t-indigo-500 border-x-slate-200 dark:border-x-studio-border -mb-px inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Icon name="wand" class="w-3.5 h-3.5 text-indigo-500" />
                    <span data-i18n-bn="ফিল্টার" data-i18n-en="Filters">ফিল্টার</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected="false"
                    data-nid-insp-tab="smart"
                    title="স্মার্ট ফিক্স ও ম্যানুয়াল টিউনিং"
                    data-i18n-title-bn="স্মার্ট ফিক্স ও ম্যানুয়াল টিউনিং"
                    data-i18n-title-en="Smart Fix & Manual Tuning"
                    class="px-2.5 py-1.5 rounded-t-md text-[11px] font-semibold text-slate-600 dark:text-studio-muted hover:text-slate-900 dark:hover:text-studio-text bg-transparent border-t-2 border-x border-transparent -mb-px inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Icon name="sparkle" class="w-3.5 h-3.5 text-amber-500" />
                    <span data-i18n-bn="স্মার্ট ফিক্স" data-i18n-en="Smart Fix">স্মার্ট ফিক্স</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected="false"
                    data-nid-insp-tab="layout"
                    title="পেজ লেআউট ও প্রিন্ট সেটআপ"
                    data-i18n-title-bn="পেজ লেআউট ও প্রিন্ট সেটআপ"
                    data-i18n-title-en="Page Layout & Print Setup"
                    class="px-2.5 py-1.5 rounded-t-md text-[11px] font-semibold text-slate-600 dark:text-studio-muted hover:text-slate-900 dark:hover:text-studio-text bg-transparent border-t-2 border-x border-transparent -mb-px inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Icon name="sliders" class="w-3.5 h-3.5 text-emerald-500" />
                    <span data-i18n-bn="লেআউট" data-i18n-en="Layout">লেআউট</span>
                  </button>
                </div>
                <div class="flex items-center gap-1 pb-1">
                  <button
                    type="button"
                    class="{btnBase} {btnIcon} !min-h-[24px] !w-[24px] !p-0 text-slate-500 dark:text-studio-muted"
                    id="imgCombineColorResetBtn"
                    title="কালার ও ফিল্টার রিসেট করুন"
                    data-i18n-title-bn="কালার ও ফিল্টার রিসেট করুন"
                    data-i18n-title-en="Reset Colors & Filters"
                  >
                    <Icon name="reset-ccw" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Inspector Scroll Body (Each Tab Pane is Shown Exclusively) -->
              <div class="ds-inspector-body th-right-scroll flex-1 min-h-0 overflow-y-auto px-3 py-2.5 flex flex-col gap-3">
                <section class="nid-images-section flex flex-col gap-2.5" id="nidImagesPanel" aria-label="Color & Light">

                  <!-- Compact Per-Page / Both-Pages Target Selector (Visible on Filters & Smart Fix tabs) -->
                  <div class="nid-target-bar flex flex-col gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-studio-panel/60 border border-slate-200 dark:border-studio-border" id="nidColorTargetBar">
                    <div class="nid-target-bar__head flex items-center justify-between px-0.5 text-[10.5px] font-bold text-slate-600 dark:text-studio-muted">
                      <span class="nid-target-bar__lbl" data-i18n-bn="প্রয়োগ হবে:" data-i18n-en="Apply to:">প্রয়োগ হবে:</span>
                      <span class="nid-target-bar__hint text-indigo-600 dark:text-indigo-400" id="nidColorTargetStatus" data-i18n-bn="উভয় পাতায় একসাথে" data-i18n-en="Both sides together">উভয় পাতায় একসাথে</span>
                      <span class="sr-only" id="nidTargetSyncHint">ডিফল্ট: উভয় পাতা</span>
                    </div>
                    <div class="nid-target-seg grid grid-cols-3 gap-1 p-0.5 rounded-md bg-slate-200/70 dark:bg-studio-bg border border-slate-200 dark:border-studio-border" id="nidColorTargetGroup" role="group" aria-label="কালার ও ফিল্টারের পাতা নির্বাচন করুন">
                      <button type="button" class="nid-target-btn active relative flex items-center justify-center gap-1 min-h-[26px] px-1.5 py-0.5 rounded border border-transparent bg-transparent text-slate-600 dark:text-studio-muted text-[11px] font-bold cursor-pointer [&.active]:bg-white dark:[&.active]:bg-studio-sidebar [&.active]:text-indigo-600 dark:[&.active]:text-indigo-300 [&.active]:border-indigo-500/30 [&_svg]:w-3 [&_svg]:h-3 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2" data-color-target="all" aria-pressed="true" title="সামনের ও পেছনের উভয় পাশে একসাথে প্রয়োগ করুন" data-i18n-title-bn="সামনের ও পেছনের উভয় পাশে একসাথে প্রয়োগ করুন" data-i18n-title-en="Apply to Both Sides">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="13" height="10" rx="1.5"/><path d="M8 18h11a2 2 0 0 0 2-2V9"/></svg>
                        <span class="nid-target-btn__txt" data-i18n-bn="উভয় পাশ" data-i18n-en="Both">উভয় পাশ</span>
                      </button>
                      <button type="button" class="nid-target-btn relative flex items-center justify-center gap-1 min-h-[26px] px-1.5 py-0.5 rounded border border-transparent bg-transparent text-slate-600 dark:text-studio-muted text-[11px] font-bold cursor-pointer [&.active]:bg-white dark:[&.active]:bg-studio-sidebar [&.active]:text-indigo-600 dark:[&.active]:text-indigo-300 [&.active]:border-indigo-500/30" data-color-target="0" aria-pressed="false" title="শুধুমাত্র সামনের অংশে (১ম পাতা) প্রয়োগ করুন" data-i18n-title-bn="শুধুমাত্র সামনের অংশে (১ম পাতা) প্রয়োগ করুন" data-i18n-title-en="Apply to Front Side Only">
                        <span class="nid-target-btn__dot w-1.5 h-1.5 rounded-full bg-emerald-500" id="nidTargetDot0" aria-hidden="true"></span>
                        <span class="nid-target-btn__txt" data-i18n-bn="সামনের পাশ" data-i18n-en="Front">সামনের পাশ</span>
                        <small class="nid-target-btn__tag sr-only" id="nidTargetTag0">অরিজিনাল</small>
                      </button>
                      <button type="button" class="nid-target-btn relative flex items-center justify-center gap-1 min-h-[26px] px-1.5 py-0.5 rounded border border-transparent bg-transparent text-slate-600 dark:text-studio-muted text-[11px] font-bold cursor-pointer [&.active]:bg-white dark:[&.active]:bg-studio-sidebar [&.active]:text-indigo-600 dark:[&.active]:text-indigo-300 [&.active]:border-indigo-500/30" data-color-target="1" aria-pressed="false" title="শুধুমাত্র পেছনের অংশে (২য় পাতা) প্রয়োগ করুন" data-i18n-title-bn="শুধুমাত্র পেছনের অংশে (২য় পাতা) প্রয়োগ করুন" data-i18n-title-en="Apply to Back Side Only">
                        <span class="nid-target-btn__dot w-1.5 h-1.5 rounded-full bg-indigo-500" id="nidTargetDot1" aria-hidden="true"></span>
                        <span class="nid-target-btn__txt" data-i18n-bn="পেছনের পাশ" data-i18n-en="Back">পেছনের পাশ</span>
                        <small class="nid-target-btn__tag sr-only" id="nidTargetTag1">অরিজিনাল</small>
                      </button>
                    </div>
                  </div>

                  <!-- ========================================== TAB PANE 1: FILTERS (data-nid-insp-pane="filters") -->
                  <div class="ds-section flex flex-col gap-2" id="nidAccFilter" data-nid-insp-pane="filters" role="tabpanel">
                    <div class="ds-section-head flex items-center justify-between gap-2">
                      <span class="ds-section-title text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-studio-muted inline-flex items-center gap-1.5">
                        <span data-i18n-bn="AI ও স্ক্যান ফিল্টার প্রিসেট" data-i18n-en="AI & Scan Filter Presets">AI ও স্ক্যান ফিল্টার প্রিসেট</span>
                      </span>
                      <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" id="nidFilterSummaryBadge" data-i18n-bn="অরিজিনাল" data-i18n-en="Original">অরিজিনাল</span>
                    </div>

                    <div id="nidLeftScanSection">
                      <fieldset class="pdf-fieldset nid-fieldset-clean m-0 p-0 border-0">
                        <legend class="sr-only">কালার ও ডকুমেন্ট ফিল্টার নির্বাচন করুন</legend>
                        <div class="ds-presets nid-filter-pills grid grid-cols-2 gap-1.5 max-lg:flex max-lg:overflow-x-auto max-lg:gap-2 max-lg:pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_label]:max-lg:shrink-0 [&_label]:max-lg:min-w-[122px]" role="radiogroup" aria-label="ফিল্টার প্রিসেট">
                          <label class="nid-pill-option col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center justify-between gap-1.5 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-gradient-to-r has-[:checked]:from-indigo-500/15 has-[:checked]:to-violet-500/15 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="magic_plus">
                            <span class="inline-flex items-center gap-2 text-[12px] font-bold text-slate-800 dark:text-studio-text">
                              <Icon name="wand" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span data-i18n-bn="ম্যাজিক+ AI" data-i18n-en="Magic+ AI">ম্যাজিক+ AI</span>
                            </span>
                            <span class="inline-flex items-center gap-1.5">
                              <small class="text-[10px] text-slate-500 dark:text-studio-muted" data-i18n-bn="সাদা পেজ · স্পষ্ট লেখা" data-i18n-en="Pure White · Crisp Ink">সাদা পেজ · স্পষ্ট লেখা</small>
                              <span class="px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-extrabold tracking-wider">AI</span>
                            </span>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="magic">
                            <Icon name="sparkle" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="অটো এনহ্যান্স" data-i18n-en="Auto Enhance">অটো এনহ্যান্স</strong>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="original" checked>
                            <Icon name="image" class="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="অরিজিনাল" data-i18n-en="Original">অরিজিনাল</strong>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="vivid">
                            <Icon name="palette" class="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="আসল রঙ (NID)" data-i18n-en="Vivid NID">আসল রঙ (NID)</strong>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="no_shadow">
                            <Icon name="sun" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="শ্যাডো ফিক্স" data-i18n-en="Shadow Fix">শ্যাডো ফিক্স</strong>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="clean">
                            <Icon name="file" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="পরিষ্কার সাদা" data-i18n-en="Clean White">পরিষ্কার সাদা</strong>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="eco">
                            <Icon name="droplet" class="w-3.5 h-3.5 text-teal-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="কালি সাশ্রয়ী" data-i18n-en="Ink Saver">কালি সাশ্রয়ী</strong>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="grayscale">
                            <Icon name="contrast" class="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="গ্রেস্কেল" data-i18n-en="Grayscale">গ্রেস্কেল</strong>
                          </label>

                          <label class="nid-pill-option px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:border-indigo-400 text-left flex items-center gap-2 cursor-pointer transition has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500 [&_input]:sr-only">
                            <input type="radio" name="imgCombineScanMode" value="bw">
                            <Icon name="scan" class="w-3.5 h-3.5 text-slate-800 dark:text-slate-200 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="সাদা-কালো" data-i18n-en="B&W Text">সাদা-কালো</strong>
                          </label>
                        </div>
                      </fieldset>
                    </div>
                  </div>

                  <!-- ========================================== TAB PANE 2: SMART FIX & MANUAL TUNING (data-nid-insp-pane="smart") -->
                  <div class="ds-section flex flex-col gap-3" id="nidAccTune" data-nid-insp-pane="smart" role="tabpanel" hidden>
                    <!-- Smart Pro Enhancers (Glare Fix & Text HD) -->
                    <div class="flex flex-col gap-1.5">
                      <div class="ds-section-head flex items-center justify-between gap-2">
                        <span class="ds-section-title text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-studio-muted" data-i18n-bn="স্মার্ট কার্ড এনহ্যান্সার" data-i18n-en="Smart Card Enhancers">স্মার্ট কার্ড এনহ্যান্সার</span>
                      </div>
                      <div class="nid-smart-enhancers grid grid-cols-2 gap-1.5" id="nidSmartEnhancers" role="group" aria-label="Smart Pro Enhancers">
                        <button type="button" class="nid-enhancer-pill flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-left cursor-pointer hover:border-indigo-400 aria-pressed:border-indigo-500 aria-pressed:bg-indigo-500/12" id="nidDeglareBtn" aria-pressed="false" title="লেমিনেশন ফ্ল্যাশের সাদা ঝলকানি এবং ছায়া দূর করুন" data-i18n-title-bn="লেমিনেশন ফ্ল্যাশের সাদা ঝলকানি এবং ছায়া দূর করুন" data-i18n-title-en="Remove Lamination Glare & Shadows">
                          <span class="inline-flex items-center gap-1.5 min-w-0">
                            <Icon name="sun" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="গ্লেয়ার ফিক্স" data-i18n-en="Glare Fix">গ্লেয়ার ফিক্স</strong>
                          </span>
                          <span class="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-slate-500 shrink-0" id="nidDeglareState" data-i18n-bn="বন্ধ" data-i18n-en="Off">বন্ধ</span>
                        </button>

                        <button type="button" class="nid-enhancer-pill flex items-center justify-between gap-1 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-left cursor-pointer hover:border-indigo-400 aria-pressed:border-indigo-500 aria-pressed:bg-indigo-500/12" id="nidTextBoostBtn" aria-pressed="false" title="ঘোলা নাম, এনআইডি নাম্বার ও স্বাক্ষর গাঢ় এবং পরিষ্কার করুন" data-i18n-title-bn="ঘোলা নাম, এনআইডি নাম্বার ও স্বাক্ষর গাঢ় এবং পরিষ্কার করুন" data-i18n-title-en="Sharpen & Boost Crisp ID Text">
                          <span class="inline-flex items-center gap-1.5 min-w-0">
                            <Icon name="file" class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <strong class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn="টেক্সট HD" data-i18n-en="Text HD">টেক্সট HD</strong>
                          </span>
                          <span class="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-slate-500 shrink-0" id="nidTextBoostState" data-i18n-bn="বন্ধ" data-i18n-en="Off">বন্ধ</span>
                        </button>
                      </div>
                    </div>

                    <!-- Manual Adjustments (Compact 2-Column Scrubby Slider Pods) -->
                    <div class="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-studio-border">
                      <div class="ds-section-head flex items-center justify-between gap-2">
                        <span class="ds-section-title text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-studio-muted" data-i18n-bn="ম্যানুয়াল কালার টিউনিং" data-i18n-en="Manual Color Adjustments">ম্যানুয়াল কালার টিউনিং</span>
                        <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-studio-panel text-slate-500 dark:text-studio-muted" id="nidTuneSummaryBadge" data-i18n-bn="ডিফল্ট" data-i18n-en="Default">ডিফল্ট</span>
                      </div>
                      <div class="grid grid-cols-2 gap-1.5" id="nidLeftAdjustSection">
                        <label class="p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel flex flex-col gap-1.5">
                          <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-studio-text">
                            <span data-i18n-bn="উজ্জ্বলতা" data-i18n-en="Brightness">উজ্জ্বলতা</span>
                            <strong id="imgCombineBrightVal" class="text-indigo-600 dark:text-indigo-400 tabular-nums" data-i18n-bn="১০০%" data-i18n-en="100%">১০০%</strong>
                          </div>
                          <input type="range" id="imgCombineBright" name="imgCombineBright" min="50" max="180" value="100" class="w-full h-1.5 accent-indigo-600 cursor-pointer">
                        </label>
                        <label class="p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel flex flex-col gap-1.5">
                          <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-studio-text">
                            <span data-i18n-bn="কনট্রাস্ট" data-i18n-en="Contrast">কনট্রাস্ট</span>
                            <strong id="imgCombineContrastVal" class="text-indigo-600 dark:text-indigo-400 tabular-nums" data-i18n-bn="১০০%" data-i18n-en="100%">১০০%</strong>
                          </div>
                          <input type="range" id="imgCombineContrast" name="imgCombineContrast" min="50" max="220" value="100" class="w-full h-1.5 accent-indigo-600 cursor-pointer">
                        </label>
                        <label class="p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel flex flex-col gap-1.5">
                          <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-studio-text">
                            <span data-i18n-bn="রঙের গভীরতা" data-i18n-en="Saturation">রঙের গভীরতা</span>
                            <strong id="imgCombineSatVal" class="text-indigo-600 dark:text-indigo-400 tabular-nums" data-i18n-bn="১০০%" data-i18n-en="100%">১০০%</strong>
                          </div>
                          <input type="range" id="imgCombineSat" name="imgCombineSat" min="0" max="200" value="100" class="w-full h-1.5 accent-indigo-600 cursor-pointer">
                        </label>
                        <label class="p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel flex flex-col gap-1.5">
                          <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-studio-text">
                            <span data-i18n-bn="শার্পনেস" data-i18n-en="Sharpness">শার্পনেস</span>
                            <strong id="imgCombineSharpVal" class="text-indigo-600 dark:text-indigo-400 tabular-nums" data-i18n-bn="২০%" data-i18n-en="20%">২০%</strong>
                          </div>
                          <input type="range" id="imgCombineSharp" name="imgCombineSharp" min="0" max="100" value="20" class="w-full h-1.5 accent-indigo-600 cursor-pointer">
                        </label>
                      </div>

                      <!-- Fine Straighten Angle Pod (Moved out of Top Toolbar into Smart Fix) -->
                      <div class="p-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel flex flex-col gap-1.5 mt-0.5">
                        <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-studio-text">
                          <label for="nidFineAngle" class="inline-flex items-center gap-1.5 cursor-pointer">
                            <Icon name="lucide:compass" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span data-i18n-bn="সূক্ষ্ম কোণ (Straighten)" data-i18n-en="Fine Angle (Straighten)">সূক্ষ্ম কোণ (Straighten)</span>
                          </label>
                          <div class="inline-flex items-center gap-1.5">
                            <strong class="nid-angle-badge text-indigo-600 dark:text-indigo-400 tabular-nums" id="nidFineAngleVal" data-i18n-bn="০°" data-i18n-en="0°">০°</strong>
                            <button type="button" class="px-1.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-[10px] font-bold text-slate-600 dark:text-studio-muted hover:text-emerald-600 cursor-pointer" id="nidFineAngleReset" title="কোণ ০ ডিগ্রিতে রিসেট করুন" data-i18n-title-bn="কোণ ০ ডিগ্রিতে রিসেট করুন" data-i18n-title-en="Reset Angle to 0°" data-i18n-bn="রিসেট" data-i18n-en="Reset">রিসেট</button>
                          </div>
                        </div>
                        <input type="range" id="nidFineAngle" name="nidFineAngle" min="-15" max="15" step="0.5" value="0" class="w-full h-1.5 accent-indigo-600 cursor-pointer" aria-label="Fine Angle Straighten">
                      </div>
                    </div>
                  </div>
                </section>

                <!-- ========================================== TAB PANE 3: PAGE LAYOUT & PRINT SETUP (data-nid-insp-pane="layout") -->
                <div class="nid-layout-controls flex flex-col gap-2.5" id="nidAccLayout" data-nid-insp-pane="layout" role="tabpanel" hidden>
                  <div class="ds-section flex flex-col gap-2">
                    <div class="ds-section-head flex items-center justify-between gap-2">
                      <span class="ds-section-title text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-studio-muted inline-flex items-center gap-1.5">
                        <span data-i18n-bn="পেজ লেআউট ও প্রিন্ট সেটআপ" data-i18n-en="Page Layout & Print Setup">পেজ লেআউট ও প্রিন্ট সেটআপ</span>
                      </span>
                      <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" id="nidLayoutSummaryBadge" data-i18n-bn="A4 উপরে-নিচে" data-i18n-en="A4 Top-Bottom">A4 উপরে-নিচে</span>
                      <span class="sr-only" id="nidPrintOptSummaryBadge">১ সেট</span>
                      <span class="sr-only" id="nidGapSummaryBadge">৩৬px</span>
                    </div>

                    <fieldset class="pdf-fieldset nid-fieldset-clean m-0 p-0 border-0">
                      <legend class="sr-only">Page Layout</legend>
                      <div class="nid-layout-pills grid grid-cols-2 gap-1.5">
                        <label class="nid-pill-option flex items-center justify-center px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:text-indigo-600 dark:has-[:checked]:text-indigo-300 [&_input]:sr-only">
                          <input type="radio" name="imgCombineMode" value="nid-a4" checked>
                          <span class="nid-pill-option__label" data-i18n-bn="A4 (উপরে-নিচে)" data-i18n-en="A4 (Top-Bottom)">A4 (উপরে-নিচে)</span>
                        </label>
                        <label class="nid-pill-option flex items-center justify-center px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:text-indigo-600 dark:has-[:checked]:text-indigo-300 [&_input]:sr-only">
                          <input type="radio" name="imgCombineMode" value="nid-a4-side">
                          <span class="nid-pill-option__label" data-i18n-bn="A4 (পাশাপাশি)" data-i18n-en="A4 (Side-by-Side)">A4 (পাশাপাশি)</span>
                        </label>
                        <label class="nid-pill-option flex items-center justify-center px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:text-indigo-600 dark:has-[:checked]:text-indigo-300 [&_input]:sr-only">
                          <input type="radio" name="imgCombineMode" value="vertical">
                          <span class="nid-pill-option__label" data-i18n-bn="কার্ড (উপরে-নিচে)" data-i18n-en="Card (Top-Bottom)">কার্ড (উপরে-নিচে)</span>
                        </label>
                        <label class="nid-pill-option flex items-center justify-center px-2.5 py-2 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[11.5px] font-bold text-slate-700 dark:text-studio-text cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/12 has-[:checked]:text-indigo-600 dark:has-[:checked]:text-indigo-300 [&_input]:sr-only">
                          <input type="radio" name="imgCombineMode" value="horizontal">
                          <span class="nid-pill-option__label" data-i18n-bn="কার্ড (পাশাপাশি)" data-i18n-en="Card (Side-by-Side)">কার্ড (পাশাপাশি)</span>
                        </label>
                      </div>
                    </fieldset>

                    <!-- Card Print Size Presets (Actual 85.6×54mm vs Photocopy vs Large) -->
                    <div class="flex flex-col gap-1.5 pt-1" id="nidAccSize">
                      <div class="flex items-center justify-between gap-2 text-[10.5px] font-bold text-slate-600 dark:text-studio-muted">
                        <span data-i18n-bn="কার্ডের প্রিন্ট সাইজ" data-i18n-en="Card Print Size">কার্ডের প্রিন্ট সাইজ</span>
                        <label class="inline-flex items-center gap-1 text-[10px] font-semibold">
                          <span data-i18n-bn="স্কেল:" data-i18n-en="Scale:">স্কেল:</span>
                          <input
                            type="number"
                            id="imgCombineCardW"
                            name="imgCombineCardW"
                            value="660"
                            min="420"
                            max="950"
                            step="10"
                            class="w-14 h-6 px-1.5 rounded bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11px] font-semibold text-slate-800 dark:text-studio-text text-center"
                          >
                        </label>
                      </div>
                      <div class="grid grid-cols-3 gap-1" id="nidSizePresets" role="group" aria-label="Card Print Size Presets">
                        <button
                          type="button"
                          data-cardw="506"
                          aria-pressed="false"
                          title="আসল স্মার্ট/এনআইডি কার্ড মাপ (85.6×54mm)"
                          data-i18n-title-bn="আসল স্মার্ট/এনআইডি কার্ড মাপ (85.6×54mm)"
                          data-i18n-title-en="Actual ID Card Size (85.6×54mm)"
                          class="px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[10.5px] font-bold text-slate-700 dark:text-studio-text hover:border-emerald-500/50 aria-pressed:bg-emerald-500/12 aria-pressed:border-emerald-600 dark:aria-pressed:border-emerald-400 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300 cursor-pointer transition-colors leading-tight text-center"
                        >
                          <span class="block" data-i18n-bn="আসল ID মাপ" data-i18n-en="Actual ID">আসল ID মাপ</span>
                          <span class="block text-[9.5px] font-semibold opacity-75">85.6×54mm</span>
                        </button>
                        <button
                          type="button"
                          data-cardw="660"
                          aria-pressed="true"
                          title="স্ট্যান্ডার্ড ফটোকপি সাইজ (পড়তে সহজ)"
                          data-i18n-title-bn="স্ট্যান্ডার্ড ফটোকপি সাইজ (পড়তে সহজ)"
                          data-i18n-title-en="Standard Photocopy Size"
                          class="px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[10.5px] font-bold text-slate-700 dark:text-studio-text hover:border-emerald-500/50 aria-pressed:bg-emerald-500/12 aria-pressed:border-emerald-600 dark:aria-pressed:border-emerald-400 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300 cursor-pointer transition-colors leading-tight text-center"
                        >
                          <span class="block" data-i18n-bn="স্ট্যান্ডার্ড" data-i18n-en="Standard">স্ট্যান্ডার্ড</span>
                          <span class="block text-[9.5px] font-semibold opacity-75" data-i18n-bn="ফটোকপি" data-i18n-en="Photocopy">ফটোকপি</span>
                        </button>
                        <button
                          type="button"
                          data-cardw="800"
                          aria-pressed="false"
                          title="বড় প্রিন্ট সাইজ"
                          data-i18n-title-bn="বড় প্রিন্ট সাইজ"
                          data-i18n-title-en="Large Print Size"
                          class="px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[10.5px] font-bold text-slate-700 dark:text-studio-text hover:border-emerald-500/50 aria-pressed:bg-emerald-500/12 aria-pressed:border-emerald-600 dark:aria-pressed:border-emerald-400 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300 cursor-pointer transition-colors leading-tight text-center"
                        >
                          <span class="block" data-i18n-bn="বড় প্রিন্ট" data-i18n-en="Large Print">বড় প্রিন্ট</span>
                          <span class="block text-[9.5px] font-semibold opacity-75">Large</span>
                        </button>
                      </div>
                    </div>

                    <!-- Copies, Position, Gap & Page Color Compact 2x2 Grid -->
                    <div class="grid grid-cols-2 gap-2 pt-1" id="nidAccPrintOpt">
                      <div class="flex flex-col gap-1 text-[10.5px] font-bold text-slate-600 dark:text-studio-muted">
                        <label for="imgCombineCopies" data-i18n-bn="পাতায় কপি" data-i18n-en="Copies">পাতায় কপি</label>
                        <select id="imgCombineCopies" name="imgCombineCopies" class="h-8 px-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11.5px] font-semibold text-slate-800 dark:text-studio-text">
                          <option value="1" selected data-i18n-bn="১ সেট (সাধারণ)" data-i18n-en="1 Set (Normal)">১ সেট (সাধারণ)</option>
                          <option value="2" data-i18n-bn="২ সেট (২ জোড়া)" data-i18n-en="2 Sets (2 Pairs)">২ সেট (২ জোড়া)</option>
                          <option value="4" data-i18n-bn="৪ সেট (৪ জোড়া)" data-i18n-en="4 Sets (4 Pairs)">৪ সেট (৪ জোড়া)</option>
                        </select>
                      </div>
                      <div class="flex flex-col gap-1 text-[10.5px] font-bold text-slate-600 dark:text-studio-muted">
                        <label for="imgCombineAlign" data-i18n-bn="পজিশন" data-i18n-en="Position">পজিশন</label>
                        <select id="imgCombineAlign" name="imgCombineAlign" class="h-8 px-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11.5px] font-semibold text-slate-800 dark:text-studio-text">
                          <option value="top" selected data-i18n-bn="উপরে মাঝখানে" data-i18n-en="Top Center">উপরে মাঝখানে</option>
                          <option value="center" data-i18n-bn="একদম মাঝখানে" data-i18n-en="Center">একদম মাঝখানে</option>
                        </select>
                      </div>
                      <div class="flex flex-col gap-1 text-[10.5px] font-bold text-slate-600 dark:text-studio-muted" id="nidAccGap">
                        <label for="imgCombineGap" data-i18n-bn="মাঝের গ্যাপ (px)" data-i18n-en="Gap (px)">মাঝের গ্যাপ (px)</label>
                        <input type="number" id="imgCombineGap" name="imgCombineGap" value="36" min="0" max="240" class="h-8 px-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11.5px] font-semibold text-slate-800 dark:text-studio-text">
                      </div>
                      <div class="flex flex-col gap-1 text-[10.5px] font-bold text-slate-600 dark:text-studio-muted">
                        <label for="imgCombineBg" data-i18n-bn="পেজের রঙ" data-i18n-en="Page Color">পেজের রঙ</label>
                        <div class="h-8 px-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border flex items-center justify-between">
                          <span class="text-[11px] font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="সাদা / কাস্টম" data-i18n-en="Background">সাদা / কাস্টম</span>
                          <input type="color" id="imgCombineBg" name="imgCombineBg" value="#ffffff" class="w-5 h-5 border-0 p-0 bg-transparent cursor-pointer">
                        </div>
                      </div>
                    </div>

                    <!-- Checkboxes: Rounded Corner, Border, Cut Marks -->
                    <div class="nid-toggles-bar grid grid-cols-3 gap-1.5 pt-1">
                      <label class="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer">
                        <input type="checkbox" id="imgCombineRoundCorner" name="imgCombineRoundCorner" checked class="accent-indigo-600">
                        <span data-i18n-bn="রাউন্ড কোণা" data-i18n-en="Rounded">রাউন্ড কোণা</span>
                      </label>
                      <label class="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer">
                        <input type="checkbox" id="imgCombineCardBorder" name="imgCombineCardBorder" checked class="accent-indigo-600">
                        <span data-i18n-bn="বর্ডার" data-i18n-en="Border">বর্ডার</span>
                      </label>
                      <label class="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer">
                        <input type="checkbox" id="imgCombineCutMarks" name="imgCombineCutMarks" class="accent-indigo-600">
                        <span data-i18n-bn="কাট মার্ক" data-i18n-en="Cut Marks">কাট মার্ক</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Export Area (Matches DocumentScanner .ds-export — Desktop Only; Mobile uses CamScanner Bottom Bar) -->
              <div class="ds-export nid-export-bar max-lg:hidden px-3 py-2 border-t border-slate-200 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/40 flex flex-col gap-1.5 shrink-0">
                <div class="grid grid-cols-3 gap-1" id="nidQuickPrintSizeBar" role="group" aria-label="Quick Print Size">
                  <button
                    type="button"
                    data-cardw="506"
                    aria-pressed="false"
                    class="py-1 px-1.5 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-[10px] font-bold text-slate-700 dark:text-studio-text hover:border-emerald-500/50 aria-pressed:bg-emerald-600 aria-pressed:border-emerald-600 aria-pressed:text-white cursor-pointer transition-colors truncate"
                    title="আসল আইডি কার্ডের মাপে প্রিন্ট (85.6×54mm)"
                    data-i18n-title-bn="আসল আইডি কার্ডের মাপে প্রিন্ট (85.6×54mm)"
                    data-i18n-title-en="Print at Actual ID Size (85.6×54mm)"
                    data-i18n-bn="আসল ID (85×54)"
                    data-i18n-en="Actual 85×54"
                  >আসল ID (85×54)</button>
                  <button
                    type="button"
                    data-cardw="660"
                    aria-pressed="true"
                    class="py-1 px-1.5 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-[10px] font-bold text-slate-700 dark:text-studio-text hover:border-emerald-500/50 aria-pressed:bg-emerald-600 aria-pressed:border-emerald-600 aria-pressed:text-white cursor-pointer transition-colors truncate"
                    title="স্ট্যান্ডার্ড ফটোকপি সাইজ"
                    data-i18n-title-bn="স্ট্যান্ডার্ড ফটোকপি সাইজ"
                    data-i18n-title-en="Standard Photocopy Size"
                    data-i18n-bn="ফটোকপি মাপ"
                    data-i18n-en="Photocopy"
                  >ফটোকপি মাপ</button>
                  <button
                    type="button"
                    data-cardw="800"
                    aria-pressed="false"
                    class="py-1 px-1.5 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-[10px] font-bold text-slate-700 dark:text-studio-text hover:border-emerald-500/50 aria-pressed:bg-emerald-600 aria-pressed:border-emerald-600 aria-pressed:text-white cursor-pointer transition-colors truncate"
                    title="বড় প্রিন্ট সাইজ"
                    data-i18n-title-bn="বড় প্রিন্ট সাইজ"
                    data-i18n-title-en="Large Print Size"
                    data-i18n-bn="বড় প্রিন্ট"
                    data-i18n-en="Large"
                  >বড় প্রিন্ট</button>
                </div>
                <button type="button" class="{btnBase} {btnPrimary} w-full !min-h-[36px] text-[12.5px] shadow-sm rounded-xl" id="imgCombineDownloadPdfBtn">
                  <Icon name="download" class="w-4 h-4" />
                  <span data-i18n-bn="এক্সপোর্ট ও PDF ডাউনলোড" data-i18n-en="Export & Download PDF">এক্সপোর্ট ও PDF ডাউনলোড</span>
                  <span class="px-1.5 py-0.5 rounded-full bg-white/20 text-[10.5px] font-extrabold" id="nidExportCount" data-i18n-bn="১টি কার্ড" data-i18n-en="1 card">১টি কার্ড</span>
                </button>
                <div class="nid-export-secondary-row grid grid-cols-2 gap-1.5">
                  <button type="button" class="{btnBase} !min-h-[30px] text-[11.5px]" id="imgCombinePrintBtn" title="সরাসরি প্রিন্ট করুন" data-i18n-title-bn="সরাসরি প্রিন্ট করুন" data-i18n-title-en="Direct Print">
                    <Icon name="printer" class="w-3.5 h-3.5" />
                    <span data-i18n-bn="প্রিন্ট করুন" data-i18n-en="Print">প্রিন্ট করুন</span>
                  </button>
                  <button type="button" class="{btnBase} !min-h-[30px] text-[11.5px]" id="imgCombineDownloadBtn" title="হাই-রেজোলিউশন JPG ইমেজ ডাউনলোড" data-i18n-title-bn="হাই-রেজোলিউশন JPG ইমেজ ডাউনলোড" data-i18n-title-en="Download High-Res JPG">
                    <Icon name="image" class="w-3.5 h-3.5" />
                    <span data-i18n-bn="JPG ইমেজ" data-i18n-en="JPG Image">JPG ইমেজ</span>
                  </button>
                </div>
              </div>
            </aside>

            <!-- ========================================== CAMSCANNER MOBILE BOTTOM DOCK (< 1024px ONLY) -->
            <nav
              class="ds-mobile-nav nid-mobile-bottombar lg:hidden bg-[#12151e] text-white border-t border-white/10 shrink-0 z-40"
              aria-label="মোবাইল স্ক্যানার অ্যাকশন বার"
            >
              <!-- STEP 1 BAR: CROP MODE (Rotate L, Rotate R, Flip, Auto Crop, ✓ Next Step) -->
              <div class="hidden group-data-[mobile-step=crop]/nid:flex items-center justify-between gap-1 px-2.5 py-1.5 min-h-[58px]">
                <button
                  type="button"
                  id="nidMobRotL"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-11 px-1.5 rounded-xl text-slate-200 hover:bg-white/10 active:bg-white/15 cursor-pointer"
                >
                  <Icon name="lucide:rotate-ccw" class="w-4.5 h-4.5 text-amber-400" />
                  <span class="text-[10.5px] font-bold leading-none" data-i18n-bn="বামে" data-i18n-en="Left">বামে</span>
                </button>
                <button
                  type="button"
                  id="nidMobRotR"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-11 px-1.5 rounded-xl text-slate-200 hover:bg-white/10 active:bg-white/15 cursor-pointer"
                >
                  <Icon name="lucide:rotate-cw" class="w-4.5 h-4.5 text-amber-400" />
                  <span class="text-[10.5px] font-bold leading-none" data-i18n-bn="ডানে" data-i18n-en="Right">ডানে</span>
                </button>
                <button
                  type="button"
                  id="nidMobFlipH"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-11 px-1.5 rounded-xl text-slate-200 hover:bg-white/10 active:bg-white/15 cursor-pointer"
                >
                  <Icon name="lucide:flip-horizontal-2" class="w-4.5 h-4.5 text-violet-400" />
                  <span class="text-[10.5px] font-bold leading-none" data-i18n-bn="উল্টান" data-i18n-en="Flip">উল্টান</span>
                </button>
                <button
                  type="button"
                  id="nidMobAutoCrop"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-11 px-1.5 rounded-xl text-slate-200 hover:bg-white/10 active:bg-white/15 cursor-pointer"
                >
                  <Icon name="lucide:scan" class="w-4.5 h-4.5 text-emerald-400" />
                  <span class="text-[10.5px] font-bold leading-none" data-i18n-bn="অটো ক্রপ" data-i18n-en="Auto Crop">অটো ক্রপ</span>
                </button>
                <button
                  type="button"
                  id="nidMobNextStepBtn"
                  class="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[13px] font-extrabold shadow-md shadow-emerald-500/25 cursor-pointer shrink-0"
                >
                  <Icon name="lucide:check" class="w-4.5 h-4.5 stroke-[2.6]" />
                  <span data-i18n-bn="পরবর্তী" data-i18n-en="Next">পরবর্তী</span>
                </button>
              </div>

              <!-- STEP 2 BAR: ENHANCE & A4 PREVIEW MODE (← Crop, Filters, Tune, Layout, JPG, PDF) -->
              <div class="hidden group-data-[mobile-step=enhance]/nid:flex items-center justify-between gap-1 px-2 py-1.5 min-h-[58px]">
                <button
                  type="button"
                  data-nid-mob-step="crop"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[48px] h-11 px-1.5 rounded-xl text-slate-200 hover:bg-white/10 cursor-pointer"
                >
                  <Icon name="crop" class="w-4 h-4 text-emerald-400" />
                  <span class="text-[10px] font-bold leading-none" data-i18n-bn="ক্রপ" data-i18n-en="Crop">ক্রপ</span>
                </button>
                <button
                  type="button"
                  data-nid-mob-insp="filters"
                  aria-pressed="true"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-11 px-1.5 rounded-xl text-slate-300 aria-pressed:bg-indigo-600/30 aria-pressed:text-indigo-300 hover:bg-white/10 cursor-pointer"
                >
                  <Icon name="wand" class="w-4 h-4 text-indigo-400" />
                  <span class="text-[10px] font-bold leading-none" data-i18n-bn="ফিল্টার" data-i18n-en="Filters">ফিল্টার</span>
                </button>
                <button
                  type="button"
                  data-nid-mob-insp="smart"
                  aria-pressed="false"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-11 px-1.5 rounded-xl text-slate-300 aria-pressed:bg-indigo-600/30 aria-pressed:text-indigo-300 hover:bg-white/10 cursor-pointer"
                >
                  <Icon name="sparkle" class="w-4 h-4 text-amber-400" />
                  <span class="text-[10px] font-bold leading-none" data-i18n-bn="টিউন" data-i18n-en="Tune">টিউন</span>
                </button>
                <button
                  type="button"
                  data-nid-mob-insp="layout"
                  aria-pressed="false"
                  class="flex flex-col items-center justify-center gap-0.5 min-w-[50px] h-11 px-1.5 rounded-xl text-slate-300 aria-pressed:bg-indigo-600/30 aria-pressed:text-indigo-300 hover:bg-white/10 cursor-pointer"
                >
                  <Icon name="sliders" class="w-4 h-4 text-emerald-400" />
                  <span class="text-[10px] font-bold leading-none" data-i18n-bn="লেআউট" data-i18n-en="Layout">লেআউট</span>
                </button>
                <div class="inline-flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    id="nidMobJpgBtn"
                    class="inline-flex items-center justify-center gap-1 h-10 px-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white text-[11.5px] font-bold border border-white/15 cursor-pointer"
                  >
                    <Icon name="image" class="w-3.5 h-3.5 text-sky-300" />
                    <span>JPG</span>
                  </button>
                  <button
                    type="button"
                    id="nidMobPdfBtn"
                    class="inline-flex items-center justify-center gap-1 h-10 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[12px] font-extrabold shadow-md shadow-emerald-500/25 cursor-pointer"
                  >
                    <Icon name="download" class="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <!-- STEP 3 BAR: CARD SIDES DRAWER MODE -->
              <div class="hidden group-data-[mobile-step=pages]/nid:flex items-center justify-between gap-2 px-3 py-1.5 min-h-[58px]">
                <button
                  type="button"
                  data-nid-mob-step="crop"
                  class="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-white/10 text-white text-[12px] font-bold cursor-pointer"
                >
                  <Icon name="crop" class="w-4 h-4 text-emerald-400" />
                  <span data-i18n-bn="ক্রপ মোডে ফিরুন" data-i18n-en="Back to Crop">ক্রপ মোডে ফিরুন</span>
                </button>
                <button
                  type="button"
                  data-nid-mob-step="enhance"
                  class="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-500 text-white text-[12.5px] font-extrabold cursor-pointer"
                >
                  <Icon name="lucide:check" class="w-4 h-4" />
                  <span data-i18n-bn="প্রিভিউ ও PDF" data-i18n-en="Preview & PDF">প্রিভিউ ও PDF</span>
                </button>
              </div>
            </nav>

          </div>
        </div>
      </section>

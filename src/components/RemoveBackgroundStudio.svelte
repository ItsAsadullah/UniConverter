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
  class="img-pane th-nid-studio ds group/rbg relative w-full text-slate-900 dark:text-studio-text antialiased select-none [&_[hidden]]:!hidden data-[has-pages=true]:lg:fixed data-[has-pages=true]:lg:inset-x-0 data-[has-pages=true]:lg:top-12 data-[has-pages=true]:lg:bottom-0 data-[has-pages=true]:lg:z-40 data-[has-pages=true]:lg:w-screen data-[has-pages=true]:lg:h-[calc(100dvh-3rem)] data-[has-pages=true]:max-lg:fixed data-[has-pages=true]:max-lg:inset-0 data-[has-pages=true]:max-lg:z-[70] data-[has-pages=true]:max-lg:w-screen data-[has-pages=true]:max-lg:h-[100dvh] data-[has-pages=true]:flex-1 data-[has-pages=true]:min-h-0 data-[has-pages=true]:flex data-[has-pages=true]:flex-col data-[has-pages=true]:overflow-hidden data-[has-pages=true]:bg-slate-100 dark:data-[has-pages=true]:bg-studio-bg"
  id="img-pane-remove-bg"
  data-view="compare"
  data-sidebar-collapsed="false"
  data-has-pages="false"
  {hidden}
  aria-label="AI Background Remover Studio"
>
  <!-- INITIAL HERO DROPZONE (MATCHES iLoveIMG + TECHHAT STUDIO DESIGN) -->
  <div id="rbgDropzone" class="ds-empty space-y-4">
    <div
      class="ds-empty-card pdf-dropzone relative flex flex-col items-center justify-center text-center py-12 px-5 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-[#f4f5f7] dark:bg-studio-panel/75 hover:border-indigo-400/70 dark:hover:border-indigo-500/60 cursor-pointer transition-all duration-200 [&.is-over]:border-indigo-500 [&.is-over]:bg-indigo-50/60 dark:[&.is-over]:bg-indigo-500/10 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
    >
      <!-- Studio Illustration: Subject Cutout over Checkerboard -->
      <div class="ds-empty-symbol relative w-44 h-34 mb-4 select-none pointer-events-none flex items-center justify-center">
        <svg viewBox="0 0 200 150" class="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="rbgGlow" x1="65" y1="45" x2="135" y2="138" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#6366f1" stop-opacity="0.28" />
              <stop offset="65%" stop-color="#38bdf8" stop-opacity="0.16" />
              <stop offset="100%" stop-color="#f4f5f7" stop-opacity="0" />
            </linearGradient>
            <pattern id="rbgChecker" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#e2e8f0" />
              <rect x="6" width="6" height="6" fill="#ffffff" />
              <rect y="6" width="6" height="6" fill="#ffffff" />
              <rect x="6" y="6" width="6" height="6" fill="#e2e8f0" />
            </pattern>
            <linearGradient id="rbgSparkleGrad" x1="126" y1="88" x2="164" y2="128" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#6366f1" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
          </defs>
          <path d="M42 132 C42 82, 70 58, 106 58 C136 58, 156 88, 156 132 Z" fill="url(#rbgGlow)" />
          <!-- Left Original Card -->
          <rect x="42" y="24" width="64" height="84" rx="7" fill="#cbd5e1" stroke="#ffffff" stroke-width="2.5" transform="rotate(-7 42 24)" />
          <!-- Right Cutout Card with Checkerboard -->
          <rect x="66" y="20" width="74" height="94" rx="8" fill="url(#rbgChecker)" stroke="#6366f1" stroke-width="2.5" />
          <!-- Split Divider Line -->
          <line x1="103" y1="16" x2="103" y2="118" stroke="#4f46e5" stroke-width="2" stroke-dasharray="3 3" />
          <!-- Subject Silhouette -->
          <circle cx="103" cy="54" r="15" fill="#4f46e5" />
          <path d="M78 106 C78 84, 88 75, 103 75 C118 75, 128 84, 128 106 Z" fill="#1e293b" />
          <!-- Sparkle Badge -->
          <circle cx="146" cy="108" r="18" fill="url(#rbgSparkleGrad)" />
          <path d="M146 98 L148.5 105.5 L156 108 L148.5 110.5 L146 118 L143.5 110.5 L136 108 L143.5 105.5 Z" fill="#ffffff" />
        </svg>
      </div>

      <h2
        class="text-[18px] sm:text-[20px] font-extrabold text-slate-800 dark:text-white m-0 mb-1.5"
        data-i18n-bn="AI ব্যাকগ্রাউন্ড রিমুভার (১-ক্লিকে স্বচ্ছ PNG ও কালার পরিবর্তন)"
        data-i18n-en="AI Background Remover (1-Click Transparent PNG & Studio Backdrop)"
      >
        AI ব্যাকগ্রাউন্ড রিমুভার (১-ক্লিকে স্বচ্ছ PNG ও কালার পরিবর্তন)
      </h2>

      <p
        class="text-[14px] sm:text-[15px] font-normal text-slate-600 dark:text-slate-300 m-0 mb-7 tracking-[-0.01em] max-w-[58ch]"
        data-i18n-bn="যেকোনো ছবি ড্রপ করুন, পেস্ট করুন (Ctrl+V), অথবা নিচের বাটন থেকে সিলেক্ট করুন — চুল ও সূক্ষ্ম প্রান্ত ঠিক রেখে স্বয়ংক্রিয়ভাবে ব্যাকগ্রাউন্ড রিমুভ হবে (১০০% ফ্রি)"
        data-i18n-en="Drop any image here, paste (Ctrl+V), or choose below — automatically removes background with fine hair & edge matting (100% Free)"
      >
        যেকোনো ছবি ড্রপ করুন, পেস্ট করুন (Ctrl+V), অথবা নিচের বাটন থেকে সিলেক্ট করুন — চুল ও সূক্ষ্ম প্রান্ত ঠিক রেখে স্বয়ংক্রিয়ভাবে ব্যাকগ্রাউন্ড রিমুভ হবে (১০০% ফ্রি)
      </p>

      <div class="ds-empty-actions grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-[680px]">
        <!-- 1. Select Image -->
        <label
          for="rbgFileInput"
          class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(79,70,229,0.14)] hover:border-indigo-400/80 dark:hover:border-indigo-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
        >
          <input type="file" id="rbgFileInput" accept="image/*" multiple class="visually-hidden sr-only" />
          <Icon name="lucide:sparkles" class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span data-i18n-bn="ছবি নির্বাচন করুন" data-i18n-en="Select Image">ছবি নির্বাচন করুন</span>
        </label>

        <!-- 2. Camera Capture -->
        <button
          type="button"
          id="rbgCameraOpenBtn"
          class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(16,185,129,0.12)] hover:border-emerald-400/80 dark:hover:border-emerald-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
        >
          <Icon name="lucide:camera" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span data-i18n-bn="ক্যামেরায় ছবি তুলুন" data-i18n-en="Take Photo">ক্যামেরায় ছবি তুলুন</span>
        </button>

        <!-- 3. Batch Upload -->
        <label
          for="rbgBatchInput"
          class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-blue-400/80 dark:hover:border-blue-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
        >
          <input type="file" id="rbgBatchInput" accept="image/*" multiple class="visually-hidden sr-only" />
          <Icon name="lucide:images" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span data-i18n-bn="একাধিক ছবি (ব্যাচ)" data-i18n-en="Batch Images">একাধিক ছবি (ব্যাচ)</span>
        </label>
      </div>
    </div>
  </div>

  <!-- ACTIVE 3-PANEL STUDIO WORKSPACE -->
  <div class="pdf-workspace-stage th-studio-stage flex-1 min-h-0 flex flex-col overflow-hidden" id="rbgStage" hidden>
    <div
      class="nid-studio-shell ds-shell flex-1 min-h-0 grid grid-cols-[188px_minmax(0,1fr)_356px] group-data-[sidebar-collapsed=true]/rbg:grid-cols-[0px_minmax(0,1fr)_356px] max-lg:grid-cols-1 bg-slate-100 dark:bg-studio-bg text-slate-900 dark:text-studio-text overflow-hidden transition-[grid-template-columns] duration-200 ease-out"
    >
      <!-- ==========================================
           1. LEFT SIDEBAR: IMAGE QUEUE
           ========================================== -->
      <aside
        class="nid-left-sidebar ds-pages max-lg:hidden min-h-0 flex flex-col bg-white dark:bg-studio-sidebar border-r border-slate-200/90 dark:border-studio-border overflow-hidden group-data-[sidebar-collapsed=true]/rbg:w-0 group-data-[sidebar-collapsed=true]/rbg:border-r-0 group-data-[sidebar-collapsed=true]/rbg:opacity-0 group-data-[sidebar-collapsed=true]/rbg:pointer-events-none transition-all duration-200"
        id="rbgPagesSidebar"
        aria-label="ছবির তালিকা"
      >
        <div class="ds-pages-head h-10 px-2.5 border-b border-slate-200/80 dark:border-studio-border flex items-center justify-between gap-1 shrink-0">
          <div class="inline-flex items-center gap-1.5 min-w-0">
            <span class="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center shrink-0">
              <Icon name="lucide:layers" class="w-3.5 h-3.5" />
            </span>
            <strong class="text-[12px] font-bold text-slate-800 dark:text-white truncate" data-i18n-bn="ছবিসমূহ" data-i18n-en="Images">ছবিসমূহ</strong>
            <span
              id="rbgPhotoCountBadge"
              class="px-1.5 py-0.5 rounded-full bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 text-[10.5px] font-extrabold leading-none"
            >১</span>
          </div>
          <button
            type="button"
            id="rbgClearAllBtn"
            class="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
            title="সব মুছুন ও নতুন শুরু করুন"
          >
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          id="rbgPhotoList"
          class="ds-page-list flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-2"
          role="tablist"
          aria-label="Uploaded Images"
        ></div>

        <div class="ds-pages-foot p-2 border-t border-slate-200/80 dark:border-studio-border flex items-center gap-1.5 shrink-0 bg-slate-50/60 dark:bg-studio-panel/40">
          <label
            for="rbgAddMoreInput"
            class="{btnBase} flex-1 min-h-[30px] text-[11.5px] font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100/70"
          >
            <input type="file" id="rbgAddMoreInput" accept="image/*" multiple hidden />
            <Icon name="lucide:plus" class="w-3.5 h-3.5 shrink-0" />
            <span data-i18n-bn="ছবি যোগ করুন" data-i18n-en="Add Image">ছবি যোগ করুন</span>
          </label>
          <button
            type="button"
            id="rbgSidebarCamBtn"
            class={btnIcon}
            title="ক্যামেরা দিয়ে ছবি তুলুন"
          >
            <Icon name="lucide:camera" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      </aside>

      <!-- ==========================================
           2. CENTER WORKSPACE: TOP TOOLBAR + INTERACTIVE CUTOUT STAGE + HUD
           ========================================== -->
      <div class="nid-center-stage ds-stage min-w-0 min-h-0 flex flex-col overflow-hidden bg-slate-100 dark:bg-studio-bg">
        <!-- Top Studio Toolbar -->
        <div
          class="nid-top-toolbar ds-toolbar min-h-[42px] px-2 py-1 bg-white dark:bg-studio-sidebar border-b border-slate-200/90 dark:border-studio-border flex items-center gap-1 overflow-x-auto shrink-0"
          role="toolbar"
          aria-label="Background Remover Toolbar"
        >
          <div class="ds-toolbar-group inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-slate-100/70 dark:bg-studio-panel/60 border border-slate-200/70 dark:border-studio-border shrink-0">
            <button type="button" id="rbgSidebarToggleBtn" class="{btnIcon} max-lg:hidden" title="বাম পাশের প্যানেল লুকান/দেখান">
              <Icon name="lucide:panel-left" class="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
            <label for="rbgAddMoreInput" class={btnIcon} title="নতুন ছবি যোগ করুন">
              <Icon name="lucide:image-plus" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </label>
          </div>

          <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-0.5 shrink-0" aria-hidden="true"></span>

          <!-- Undo / Redo -->
          <div class="ds-toolbar-group inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-slate-100/70 dark:bg-studio-panel/60 border border-slate-200/70 dark:border-studio-border shrink-0">
            <button type="button" id="rbgUndoBtn" class={btnIcon} disabled title="পূর্বের অবস্থায় ফিরুন (Undo)">
              <Icon name="lucide:undo-2" class="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
            <button type="button" id="rbgRedoBtn" class={btnIcon} disabled title="পরবর্তী অবস্থায় যান (Redo)">
              <Icon name="lucide:redo-2" class="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
          </div>

          <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-0.5 shrink-0" aria-hidden="true"></span>

          <!-- Manual Touch-Up Brush Mode: Pan | Erase | Restore -->
          <div
            id="rbgBrushModeGroup"
            class="ds-toolbar-group inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border shrink-0"
            role="group"
            aria-label="Touch-up Brush Mode"
          >
            <button
              type="button"
              data-rbg-tool="pan"
              aria-pressed="true"
              class="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11.5px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-indigo-600 dark:aria-pressed:text-indigo-400 aria-pressed:shadow-2xs transition"
              title="ভিউপোর্ট প্যান ও তুলনা স্লাইডার"
            >
              <Icon name="lucide:move" class="w-3.5 h-3.5 shrink-0" />
              <span data-i18n-bn="মুভ/তুলনা" data-i18n-en="Pan/Compare">মুভ/তুলনা</span>
            </button>
            <button
              type="button"
              data-rbg-tool="erase"
              aria-pressed="false"
              class="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11.5px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer aria-pressed:bg-rose-600 aria-pressed:text-white aria-pressed:shadow-2xs transition"
              title="অতিরিক্ত অংশ ব্রাশ দিয়ে মুছে ফেলুন (Erase Brush)"
            >
              <Icon name="lucide:eraser" class="w-3.5 h-3.5 shrink-0" />
              <span data-i18n-bn="ইরেজ ব্রাশ" data-i18n-en="Erase">ইরেজ ব্রাশ</span>
            </button>
            <button
              type="button"
              data-rbg-tool="restore"
              aria-pressed="false"
              class="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11.5px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer aria-pressed:bg-emerald-600 aria-pressed:text-white aria-pressed:shadow-2xs transition"
              title="কেটে যাওয়া অংশ ব্রাশ দিয়ে ফিরিয়ে আনুন (Restore Brush)"
            >
              <Icon name="lucide:paintbrush" class="w-3.5 h-3.5 shrink-0" />
              <span data-i18n-bn="রিস্টোর ব্রাশ" data-i18n-en="Restore">রিস্টোর ব্রাশ</span>
            </button>
          </div>

          <!-- Brush Size Slider (Visible when Erase or Restore is active) -->
          <div id="rbgBrushSizeWrap" hidden class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 text-[11px] shrink-0">
            <span class="font-semibold text-slate-600 dark:text-slate-300">ব্রাশ সাইজ:</span>
            <input type="range" id="rbgBrushSize" min="5" max="120" value="32" class="w-20 accent-indigo-600" />
            <strong id="rbgBrushSizeVal" class="font-mono text-indigo-700 dark:text-indigo-300 min-w-[28px]">32px</strong>
          </div>

          <!-- Right View Mode Switcher: Compare Split Slider | Result Only | Original -->
          <div class="ds-toolbar-right ml-auto inline-flex items-center gap-1 shrink-0">
            <div
              class="ds-view-switch inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border gap-0.5"
              role="group"
              aria-label="View Mode"
            >
              <button
                type="button"
                data-rbg-view="compare"
                aria-pressed="true"
                class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[11.5px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-indigo-600 dark:aria-pressed:text-indigo-400 aria-pressed:shadow-2xs transition"
              >
                <Icon name="lucide:columns-2" class="w-3.5 h-3.5 shrink-0" />
                <span data-i18n-bn="আগে/পরে স্লাইডার" data-i18n-en="Before/After">আগে/পরে স্লাইডার</span>
              </button>
              <button
                type="button"
                data-rbg-view="result"
                aria-pressed="false"
                class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[11.5px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-indigo-600 dark:aria-pressed:text-indigo-400 aria-pressed:shadow-2xs transition"
              >
                <Icon name="lucide:sparkles" class="w-3.5 h-3.5 shrink-0" />
                <span data-i18n-bn="শুধু আউটপুট" data-i18n-en="Result">শুধু আউটপুট</span>
              </button>
              <button
                type="button"
                data-rbg-view="original"
                aria-pressed="false"
                class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[11.5px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-indigo-600 dark:aria-pressed:text-indigo-400 aria-pressed:shadow-2xs transition"
              >
                <Icon name="lucide:image" class="w-3.5 h-3.5 shrink-0" />
                <span data-i18n-bn="মূল ছবি" data-i18n-en="Original">মূল ছবি</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Interactive Checkerboard Cutout Stage -->
        <div
          id="rbgViewportWrap"
          class="ds-viewport relative flex-1 min-h-[260px] flex items-center justify-center p-4 overflow-hidden select-none bg-[#dcdcdc] dark:bg-[#252526]"
        >
          <!-- Zoomable & Pannable Stage Container -->
          <div
            id="rbgStageContainer"
            class="relative inline-flex items-center justify-center shadow-[0_16px_42px_rgba(0,0,0,0.3)] rounded-md overflow-hidden ring-2 ring-white/85 dark:ring-slate-700 bg-[conic-gradient(#e2e8f0_25%,#ffffff_0_50%,#e2e8f0_0_75%,#ffffff_0)] dark:bg-[conic-gradient(#334155_25%,#1e293b_0_50%,#334155_0_75%,#1e293b_0)] bg-[length:20px_20px] transition-transform duration-75"
          >
            <!-- After (Background Removed / Composited) Canvas -->
            <canvas
              id="rbgResultCanvas"
              width="600"
              height="750"
              class="block max-w-full max-h-[calc(100dvh-13.5rem)] w-auto h-auto object-contain"
            ></canvas>

            <!-- Before (Original Image) Clipped Overlay for iLoveIMG Split Comparison -->
            <div
              id="rbgBeforeClipWrap"
              class="pointer-events-none absolute inset-0 overflow-hidden"
              style="clip-path: inset(0 50% 0 0);"
            >
              <canvas
                id="rbgBeforeCanvas"
                width="600"
                height="750"
                class="block w-full h-full object-contain"
              ></canvas>
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-bold tracking-wide backdrop-blur-xs">Original</span>
            </div>

            <span id="rbgAfterLabel" class="pointer-events-none absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-indigo-600/85 text-white text-[10px] font-bold tracking-wide backdrop-blur-xs">AI Cutout</span>

            <!-- Draggable Vertical Split Slider Handle -->
            <div
              id="rbgCompareSlider"
              class="absolute inset-y-0 w-7 -ml-3.5 flex items-center justify-center cursor-ew-resize z-10 select-none"
              style="left: 50%;"
              title="ড্র্যাগ করে আগে ও পরের পার্থক্য দেখুন"
            >
              <div class="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]"></div>
              <div class="absolute w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-600 shadow-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icon name="lucide:move-horizontal" class="w-4 h-4" />
              </div>
            </div>

            <!-- AI Processing Overlay -->
            <div
              id="rbgLoadingOverlay"
              hidden
              class="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white p-6 text-center z-20"
            >
              <div class="w-10 h-10 rounded-full border-3 border-indigo-400 border-t-transparent animate-spin"></div>
              <strong id="rbgLoadingText" class="text-[13px] font-bold tracking-wide">AI ব্যাকগ্রাউন্ড রিমুভ করছে...</strong>
              <div class="w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div id="rbgLoadingBar" class="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-200" style="width: 25%"></div>
              </div>
              <span class="text-[11px] text-slate-300">চুল ও প্রান্ত সূক্ষ্মভাবে আলাদা করা হচ্ছে (১০০% ব্রাউজারে)</span>
            </div>
          </div>
        </div>

        <!-- Bottom Status & Zoom HUD -->
        <footer
          class="nid-bottom-hud ds-statusbar h-8 px-3 bg-white dark:bg-studio-sidebar border-t border-slate-200/90 dark:border-studio-border flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-studio-muted shrink-0"
        >
          <div class="inline-flex items-center gap-1.5">
            <button type="button" id="rbgZoomOutBtn" class="w-6 h-6 rounded hover:bg-slate-100 dark:hover:bg-studio-panel inline-flex items-center justify-center cursor-pointer" title="জুম কমান">
              <Icon name="lucide:minus" class="w-3.5 h-3.5" />
            </button>
            <span id="rbgZoomHudVal" class="font-mono font-bold text-slate-700 dark:text-slate-200 min-w-[44px] text-center">100%</span>
            <button type="button" id="rbgZoomInBtn" class="w-6 h-6 rounded hover:bg-slate-100 dark:hover:bg-studio-panel inline-flex items-center justify-center cursor-pointer" title="জুম বাড়ান">
              <Icon name="lucide:plus" class="w-3.5 h-3.5" />
            </button>
            <button type="button" id="rbgZoomFitBtn" class="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-studio-panel text-[10.5px] font-semibold cursor-pointer">Fit</button>
            <span class="mx-1 text-slate-300 dark:text-slate-700">|</span>
            <span id="rbgEngineBadge" class="px-2 py-0.5 rounded bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold text-[10.5px]">⚡ Neural AI Ready</span>
          </div>
          <div class="inline-flex items-center gap-2 font-mono text-[10.5px]">
            <span id="rbgDimBadge">HD Transparent PNG</span>
          </div>
        </footer>
      </div>

      <!-- ==========================================
           3. RIGHT INSPECTOR: AI MODEL, BACKGROUND FILL & EDGE REFINEMENT
           ========================================== -->
      <aside
        class="nid-right-panel ds-inspector min-h-0 flex flex-col bg-white dark:bg-studio-sidebar border-l border-slate-200/90 dark:border-studio-border overflow-hidden"
        aria-label="Background Removal Settings"
      >
        <div class="ds-inspector-body flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">
          <!-- 1. AI Model Mode Selector -->
          <div class="p-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11.5px] font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                <Icon name="lucide:cpu" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span data-i18n-bn="AI সেগমেন্টেশন মোড" data-i18n-en="AI Segmentation Mode">AI সেগমেন্টেশন মোড</span>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">১০০% ফ্রি</span>
            </div>

            <div class="grid grid-cols-2 gap-1.5" id="rbgAiModeTabs">
              <button
                type="button"
                data-rbg-ai-mode="auto"
                aria-pressed="true"
                class="p-2 rounded-lg border text-left cursor-pointer transition flex flex-col gap-0.5 border-slate-200 dark:border-studio-border bg-white dark:bg-studio-surface aria-pressed:border-indigo-500 aria-pressed:bg-indigo-500/10 aria-pressed:ring-1 aria-pressed:ring-indigo-500/30"
              >
                <strong class="text-[11px] font-bold text-slate-800 dark:text-white">✨ স্টুডিও HD AI</strong>
                <span class="text-[9.5px] text-slate-500 dark:text-slate-400">চুল, পোশাক ও মানুষ (১০২৪px)</span>
              </button>
              <button
                type="button"
                data-rbg-ai-mode="object"
                aria-pressed="false"
                class="p-2 rounded-lg border text-left cursor-pointer transition flex flex-col gap-0.5 border-slate-200 dark:border-studio-border bg-white dark:bg-studio-surface aria-pressed:border-indigo-500 aria-pressed:bg-indigo-500/10 aria-pressed:ring-1 aria-pressed:ring-indigo-500/30"
              >
                <strong class="text-[11px] font-bold text-slate-800 dark:text-white">🎯 ডুয়াল আল্ট্রা AI</strong>
                <span class="text-[9.5px] text-slate-500 dark:text-slate-400">RMBG Pro + BRIA এনসেম্বল</span>
              </button>
            </div>

            <button
              type="button"
              id="rbgRerunAiBtn"
              class="{btnBase} w-full min-h-[32px] text-[11.5px] font-bold text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-studio-surface"
            >
              <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5 shrink-0" />
              <span data-i18n-bn="পুনরায় AI ব্যাকগ্রাউন্ড রিমুভ করুন" data-i18n-en="Re-run AI Background Removal">পুনরায় AI ব্যাকগ্রাউন্ড রিমুভ করুন</span>
            </button>
          </div>

          <!-- 2. Background Fill (Transparent | Solid Color | Studio Gradient | Custom Image) -->
          <div class="p-2.5 rounded-xl border border-slate-200/90 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                <Icon name="lucide:palette" class="w-3.5 h-3.5 text-sky-500" />
                <span data-i18n-bn="নতুন ব্যাকগ্রাউন্ড" data-i18n-en="New Background">নতুন ব্যাকগ্রাউন্ড</span>
              </span>
              <span id="rbgBgStatusLabel" class="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">Transparent PNG</span>
            </div>

            <!-- Background Mode Pills -->
            <div class="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-studio-panel border border-slate-200 dark:border-studio-border" id="rbgBgModeTabs">
              <button type="button" data-rbg-bg-mode="transparent" aria-pressed="true" class="h-7 rounded-md text-[10.5px] font-bold cursor-pointer transition text-slate-600 dark:text-slate-300 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:aria-pressed:bg-indigo-500 dark:aria-pressed:text-white aria-pressed:shadow-2xs">স্বচ্ছ</button>
              <button type="button" data-rbg-bg-mode="color" aria-pressed="false" class="h-7 rounded-md text-[10.5px] font-bold cursor-pointer transition text-slate-600 dark:text-slate-300 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:aria-pressed:bg-indigo-500 dark:aria-pressed:text-white aria-pressed:shadow-2xs">রঙ</button>
              <button type="button" data-rbg-bg-mode="gradient" aria-pressed="false" class="h-7 rounded-md text-[10.5px] font-bold cursor-pointer transition text-slate-600 dark:text-slate-300 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:aria-pressed:bg-indigo-500 dark:aria-pressed:text-white aria-pressed:shadow-2xs">গ্রেডিয়েন্ট</button>
              <button type="button" data-rbg-bg-mode="image" aria-pressed="false" class="h-7 rounded-md text-[10.5px] font-bold cursor-pointer transition text-slate-600 dark:text-slate-300 aria-pressed:bg-indigo-600 aria-pressed:text-white dark:aria-pressed:bg-indigo-500 dark:aria-pressed:text-white aria-pressed:shadow-2xs">ছবি</button>
            </div>

            <!-- Swatches Row (Always accessible for 1-click switch) -->
            <div class="flex items-center gap-1.5 flex-wrap" id="rbgColorSwatches">
              <!-- Transparent Checkerboard Swatch -->
              <button
                type="button"
                data-rbg-swatch="transparent"
                class="w-7 h-7 rounded-lg border-2 border-indigo-600 bg-[conic-gradient(#cbd5e1_25%,#ffffff_0_50%,#cbd5e1_0_75%,#ffffff_0)] bg-[length:10px_10px] shadow-2xs cursor-pointer transition hover:scale-105"
                title="স্বচ্ছ ব্যাকগ্রাউন্ড (Transparent PNG)"
              ></button>
              <button type="button" data-rbg-swatch="#ffffff" class="w-7 h-7 rounded-lg border border-slate-300 bg-white shadow-2xs cursor-pointer transition hover:scale-105" title="সাদা (Pure White)"></button>
              <button type="button" data-rbg-swatch="#0072ce" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#0072ce] shadow-2xs cursor-pointer transition hover:scale-105" title="পাসপোর্ট নীল (Royal Blue)"></button>
              <button type="button" data-rbg-swatch="#38bdf8" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#38bdf8] shadow-2xs cursor-pointer transition hover:scale-105" title="হালকা আকাশী (Sky Blue)"></button>
              <button type="button" data-rbg-swatch="#dbeafe" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#dbeafe] shadow-2xs cursor-pointer transition hover:scale-105" title="সফট আইস ব্লু"></button>
              <button type="button" data-rbg-swatch="#e2e8f0" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#e2e8f0] shadow-2xs cursor-pointer transition hover:scale-105" title="স্টুডিও গ্রে"></button>
              <button type="button" data-rbg-swatch="#0f172a" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#0f172a] shadow-2xs cursor-pointer transition hover:scale-105" title="ডার্ক স্লেট"></button>
              <button type="button" data-rbg-swatch="#10b981" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#10b981] shadow-2xs cursor-pointer transition hover:scale-105" title="এমেরাল্ড গ্রিন"></button>
              <button type="button" data-rbg-swatch="#f43f5e" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#f43f5e] shadow-2xs cursor-pointer transition hover:scale-105" title="রোজ রেড"></button>
              <button type="button" data-rbg-swatch="#f59e0b" class="w-7 h-7 rounded-lg border border-slate-300 bg-[#f59e0b] shadow-2xs cursor-pointer transition hover:scale-105" title="অ্যাম্বার গোল্ড"></button>
              <label class="relative w-7 h-7 rounded-lg border border-dashed border-slate-400 dark:border-slate-500 flex items-center justify-center cursor-pointer overflow-hidden" title="কাস্টম রঙ নির্বাচন করুন">
                <input type="color" id="rbgCustomColorInput" value="#ffffff" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                <Icon name="lucide:pipette" class="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 pointer-events-none" />
              </label>
            </div>

            <!-- Studio Gradients Row (Hidden unless gradient mode or clicked) -->
            <div id="rbgGradientSwatches" hidden class="grid grid-cols-3 gap-1.5 pt-1">
              <button type="button" data-rbg-grad="studio-grey" data-c1="#f8fafc" data-c2="#cbd5e1" class="h-8 rounded-lg border border-slate-300 bg-gradient-to-b from-[#f8fafc] to-[#cbd5e1] text-[10px] font-bold text-slate-700 cursor-pointer">Studio Grey</button>
              <button type="button" data-rbg-grad="royal-blue" data-c1="#38bdf8" data-c2="#1d4ed8" class="h-8 rounded-lg border border-slate-300 bg-gradient-to-b from-[#38bdf8] to-[#1d4ed8] text-[10px] font-bold text-white cursor-pointer">Royal Blue</button>
              <button type="button" data-rbg-grad="warm-peach" data-c1="#fde68a" data-c2="#f97316" class="h-8 rounded-lg border border-slate-300 bg-gradient-to-b from-[#fde68a] to-[#f97316] text-[10px] font-bold text-slate-900 cursor-pointer">Warm Glow</button>
              <button type="button" data-rbg-grad="mint-fresh" data-c1="#a7f3d0" data-c2="#059669" class="h-8 rounded-lg border border-slate-300 bg-gradient-to-b from-[#a7f3d0] to-[#059669] text-[10px] font-bold text-slate-900 cursor-pointer">Mint Studio</button>
              <button type="button" data-rbg-grad="violet-lux" data-c1="#c4b5fd" data-c2="#4f46e5" class="h-8 rounded-lg border border-slate-300 bg-gradient-to-b from-[#c4b5fd] to-[#4f46e5] text-[10px] font-bold text-white cursor-pointer">Violet Lux</button>
              <button type="button" data-rbg-grad="dark-pro" data-c1="#334155" data-c2="#0f172a" class="h-8 rounded-lg border border-slate-600 bg-gradient-to-b from-[#334155] to-[#0f172a] text-[10px] font-bold text-white cursor-pointer">Dark Studio</button>
            </div>

            <!-- Custom Background Image Upload -->
            <div id="rbgCustomBgImgWrap" hidden class="pt-1">
              <label
                for="rbgCustomBgImgInput"
                class="{btnBase} w-full min-h-[32px] text-[11px] font-bold border-dashed"
              >
                <input type="file" id="rbgCustomBgImgInput" accept="image/*" hidden />
                <Icon name="lucide:upload" class="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                <span>কাস্টম ব্যাকগ্রাউন্ড ছবি আপলোড করুন</span>
              </label>
            </div>
          </div>

          <!-- 3. Edge Matting & Hair Refinement Controls -->
          <div class="p-2.5 rounded-xl border border-slate-200/90 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5 text-emerald-500" />
                <span data-i18n-bn="চুল ও প্রান্ত নিখুঁতকরণ (Edge Matting)" data-i18n-en="Edge & Hair Matting">চুল ও প্রান্ত নিখুঁতকরণ (Edge Matting)</span>
              </span>
              <button type="button" id="rbgResetEdgeBtn" class="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">রিসেট</button>
            </div>

            <div class="space-y-2">
              <div class="space-y-0.5">
                <div class="flex justify-between text-[10.5px] text-slate-600 dark:text-slate-300">
                  <span>এজ স্মুথনেস (Edge Feather)</span>
                  <strong id="rbgEdgeFeatherVal">0.4 px</strong>
                </div>
                <input type="range" id="rbgEdgeFeather" min="0" max="6" step="0.2" value="0.4" class="w-full accent-indigo-600" />
              </div>

              <div class="space-y-0.5">
                <div class="flex justify-between text-[10.5px] text-slate-600 dark:text-slate-300">
                  <span>এজ কন্ট্রাক্ট / ট্রিম (Edge Shift)</span>
                  <strong id="rbgEdgeShiftVal">0</strong>
                </div>
                <input type="range" id="rbgEdgeShift" min="-4" max="4" step="0.5" value="0" class="w-full accent-indigo-600" />
              </div>

              <div class="pt-1 flex flex-col gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="rbgDecontaminateToggle" checked class="w-3.5 h-3.5 accent-indigo-600 rounded" />
                  <span>কালার হ্যালো রিমুভাল (De-fringe Hair/Edges)</span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="rbgShadowToggle" class="w-3.5 h-3.5 accent-indigo-600 rounded" />
                  <span>স্টুডিও থ্রি-ডি ড্রপ শ্যাডো (Drop Shadow)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Bottom Export Dock -->
        <div class="ds-inspector-foot p-2.5 border-t border-slate-200/90 dark:border-studio-border bg-slate-50/80 dark:bg-studio-panel/70 space-y-1.5 shrink-0">
          <button
            type="button"
            id="rbgDownloadPngBtn"
            class="{btnBase} {btnPrimary} w-full min-h-[38px] text-[12.5px]"
          >
            <Icon name="lucide:download" class="w-4 h-4 shrink-0" />
            <span data-i18n-bn="HD PNG ডাউনলোড করুন (Transparent)" data-i18n-en="Download HD PNG">HD PNG ডাউনলোড করুন (Transparent)</span>
          </button>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              id="rbgDownloadJpgBtn"
              class="{btnBase} min-h-[32px] text-[11.5px] font-bold"
            >
              <Icon name="lucide:image" class="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>JPG ডাউনলোড</span>
            </button>
            <button
              type="button"
              id="rbgSendToPassportBtn"
              class="{btnBase} min-h-[32px] text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10"
              title="এই কাটআউট ছবিটি সরাসরি পাসপোর্ট ফটো স্টুডিওতে পাঠান"
            >
              <Icon name="lucide:user-check" class="w-3.5 h-3.5 shrink-0" />
              <span>পাসপোর্ট ছবি বানান</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</section>

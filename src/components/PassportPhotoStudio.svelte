<script lang="ts">
  import Icon from './ui/Icon.svelte';

  interface Props {
    hidden?: boolean;
  }

  let { hidden = true }: Props = $props();

  // Photoshop Tools Dock (same visual language & shortcuts as DocumentScanner Edit Mode)
  const psTools = [
    { id: 'crop', name: 'Crop & Rotate Tool (ক্রপ ও রোটেশন টুল)', key: 'C', icon: 'lucide:crop' },
    { id: 'move', name: 'Move & Transform Tool (লেয়ার মুভ টুল)', key: 'V', icon: 'lucide:move' },
    { id: 'picker', name: 'Eyedropper Tool (কালার পিকার)', key: 'I', icon: 'lucide:pipette', sep: true },
    { id: 'brush', name: 'Brush Tool (রিটাচ ব্রাশ টুল)', key: 'B', icon: 'lucide:paintbrush' },
    { id: 'eraser', name: 'Background Mask Eraser (মাস্ক ইরেজার)', key: 'E', icon: 'lucide:eraser' },
    { id: 'hand', name: 'Hand Tool (ক্যানভাস প্যান — Space)', key: 'H', icon: 'lucide:hand', sep: true },
    { id: 'zoom', name: 'Zoom Tool (ক্যানভাস জুম — Z / Wheel)', key: 'Z', icon: 'lucide:zoom-in' }
  ];

  const moveAligns = [
    { id: 'left', icon: 'lucide:align-start-vertical', tip: 'বামে অ্যালাইন (Align Left)' },
    { id: 'center-x', icon: 'lucide:align-center-vertical', tip: 'মাঝখানে অনুভূমিক (Center Horizontally)' },
    { id: 'right', icon: 'lucide:align-end-vertical', tip: 'ডানে অ্যালাইন (Align Right)' },
    { id: 'top', icon: 'lucide:align-start-horizontal', tip: 'উপরে অ্যালাইন (Align Top)' },
    { id: 'center-y', icon: 'lucide:align-center-horizontal', tip: 'মাঝখানে উলম্ব (Center Vertically)' },
    { id: 'bottom', icon: 'lucide:align-end-horizontal', tip: 'নিচে অ্যালাইন (Align Bottom)' }
  ];

  // Authentic Photoshop L-Corner & Edge Crop Handles
  const cropHandles = [
    { id: 'nw', pos: '-left-[3px] -top-[3px] cursor-nwse-resize w-4 h-4 border-t-[3.5px] border-l-[3.5px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' },
    { id: 'ne', pos: '-right-[3px] -top-[3px] cursor-nesw-resize w-4 h-4 border-t-[3.5px] border-r-[3.5px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' },
    { id: 'se', pos: '-right-[3px] -bottom-[3px] cursor-nwse-resize w-4 h-4 border-b-[3.5px] border-r-[3.5px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' },
    { id: 'sw', pos: '-left-[3px] -bottom-[3px] cursor-nesw-resize w-4 h-4 border-b-[3.5px] border-l-[3.5px] border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' },
    { id: 'n', pos: 'left-1/2 -top-[3px] -translate-x-1/2 cursor-ns-resize w-6 h-[4px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.75)]' },
    { id: 's', pos: 'left-1/2 -bottom-[3px] -translate-x-1/2 cursor-ns-resize w-6 h-[4px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.75)]' },
    { id: 'e', pos: '-right-[3px] top-1/2 -translate-y-1/2 cursor-ew-resize w-[4px] h-6 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.75)]' },
    { id: 'w', pos: '-left-[3px] top-1/2 -translate-y-1/2 cursor-ew-resize w-[4px] h-6 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.75)]' }
  ];

  // Photoshop Free-Transform Bounding Box Handles (Move Tool)
  const tfHandles = [
    { id: 'nw', pos: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
    { id: 'n', pos: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
    { id: 'ne', pos: 'left-full top-0 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
    { id: 'e', pos: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
    { id: 'se', pos: 'left-full top-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
    { id: 's', pos: 'left-1/2 top-full -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
    { id: 'sw', pos: 'left-0 top-full -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
    { id: 'w', pos: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' }
  ];

  const adjustPods = [
    { key: 'bright', id: 'ppBright', outId: 'ppBrightVal', icon: 'lucide:sun-medium', color: 'text-amber-500 dark:text-amber-400', label: 'Brightness', min: 65, max: 145, step: 1, val: 100, initOut: '100%', initPct: 43.75 },
    { key: 'contrast', id: 'ppContrast', outId: 'ppContrastVal', icon: 'lucide:contrast', color: 'text-indigo-500 dark:text-indigo-400', label: 'Contrast', min: 70, max: 150, step: 1, val: 100, initOut: '100%', initPct: 37.5 },
    { key: 'sat', id: 'ppSat', outId: 'ppSatVal', icon: 'lucide:droplet', color: 'text-sky-500 dark:text-sky-400', label: 'Saturation', min: 50, max: 155, step: 1, val: 100, initOut: '100%', initPct: 47.6 },
    { key: 'dehaze', id: 'ppDehaze', outId: 'ppDehazeVal', icon: 'lucide:sparkles', color: 'text-emerald-500 dark:text-emerald-400', label: 'Dehaze (ঘোলা দূর)', min: 0, max: 100, step: 1, val: 0, initOut: '0%', initPct: 0 },
    { key: 'sharp', id: 'ppSharpness', outId: 'ppSharpnessVal', icon: 'lucide:triangle', color: 'text-violet-500 dark:text-violet-400', label: 'Sharpness', min: 0, max: 100, step: 1, val: 0, initOut: '0%', initPct: 0 }
  ];

  const psBtn =
    'inline-flex items-center justify-center gap-1 h-[25px] px-2 rounded-[3px] border border-slate-300 dark:border-[#2e2e34] bg-white dark:bg-[#383838] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-slate-700 dark:text-[#e6e6e6] text-[11.5px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-[#464646] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0';
  const psSel =
    'h-[25px] px-1.5 rounded-[3px] border border-slate-300 dark:border-[#2e2e34] bg-white dark:bg-[#1f1f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-slate-800 dark:text-[#e6e6e6] text-[11.5px] font-medium cursor-pointer outline-none focus:border-sky-500 shrink-0';
  const psNum =
    'h-[25px] px-1.5 rounded-[3px] border border-slate-300 dark:border-[#2e2e34] bg-white dark:bg-[#1f1f1f] text-slate-800 dark:text-[#ececef] text-[11.5px] font-semibold tabular-nums outline-none focus:border-sky-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
  const psLbl = 'text-[11.5px] font-medium text-slate-600 dark:text-[#cfcfcf] whitespace-nowrap shrink-0 select-none';
  const psSep = 'w-px h-4.5 bg-slate-300 dark:bg-white/12 mx-0.5 shrink-0';

  const btnBase =
    'inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-700 dark:text-studio-text text-[12px] font-semibold leading-none cursor-pointer transition hover:bg-slate-100 dark:hover:bg-studio-surface hover:border-slate-300 dark:hover:border-slate-600 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-40 disabled:pointer-events-none select-none';
  const btnPrimary =
    'bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:via-blue-500 hover:to-violet-500 text-white border-transparent shadow-xs shadow-indigo-500/20 font-bold';
</script>

<section
  class="img-pane group/pp relative w-full text-slate-900 dark:text-studio-text antialiased select-none [&_[hidden]]:!hidden data-[has-pages=true]:lg:fixed data-[has-pages=true]:lg:inset-x-0 data-[has-pages=true]:lg:top-12 data-[has-pages=true]:lg:bottom-0 data-[has-pages=true]:lg:z-40 data-[has-pages=true]:lg:w-screen data-[has-pages=true]:lg:h-[calc(100dvh-3rem)] data-[has-pages=true]:max-lg:fixed data-[has-pages=true]:max-lg:inset-0 data-[has-pages=true]:max-lg:z-[70] data-[has-pages=true]:max-lg:w-screen data-[has-pages=true]:max-lg:h-[100dvh] data-[has-pages=true]:flex-1 data-[has-pages=true]:min-h-0 data-[has-pages=true]:flex data-[has-pages=true]:flex-col data-[has-pages=true]:overflow-hidden data-[has-pages=true]:bg-slate-100 dark:data-[has-pages=true]:bg-[#1e1e1e]"
  id="img-pane-passport-photo"
  data-step="edit"
  data-tool="crop"
  data-sidebar-collapsed="false"
  data-has-pages="false"
  {hidden}
  aria-label="Photoshop-Style Passport & Stamp Photo Studio"
>
  <!-- INITIAL HERO DROPZONE -->
  <div id="ppDropzone" class="ds-empty space-y-4">
    <div
      class="ds-empty-card pdf-dropzone relative flex flex-col items-center justify-center text-center py-12 px-5 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-[#f4f5f7] dark:bg-studio-panel/75 hover:border-blue-400/70 dark:hover:border-blue-500/60 cursor-pointer transition-all duration-200 [&.is-over]:border-blue-500 [&.is-over]:bg-blue-50/60 dark:[&.is-over]:bg-blue-500/10 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
    >
      <div class="ds-empty-symbol relative w-44 h-34 mb-4 select-none pointer-events-none flex items-center justify-center">
        <svg viewBox="0 0 200 150" class="!w-full !h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="ppHeroGlow" x1="65" y1="55" x2="105" y2="138" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#2563eb" stop-opacity="0.28" />
              <stop offset="65%" stop-color="#38bdf8" stop-opacity="0.16" />
              <stop offset="100%" stop-color="#f4f5f7" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="ppHeroBlueFrame" x1="62" y1="26" x2="138" y2="112" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#0284c7" />
              <stop offset="100%" stop-color="#1d4ed8" />
            </linearGradient>
            <linearGradient id="ppHeroPlusGrad" x1="126" y1="90" x2="162" y2="128" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#2563eb" />
            </linearGradient>
          </defs>
          <path d="M46 132 C46 84, 72 62, 108 62 C136 62, 152 90, 152 132 Z" fill="url(#ppHeroGlow)" />
          <rect x="44" y="24" width="66" height="86" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" transform="rotate(-8 44 24)" />
          <rect x="66" y="22" width="72" height="92" rx="7" fill="url(#ppHeroBlueFrame)" stroke="#ffffff" stroke-width="3" />
          <circle cx="102" cy="54" r="14" fill="#fde68a" />
          <path d="M78 106 C78 85, 88 76, 102 76 C116 76, 126 85, 126 106 Z" fill="#0f172a" />
          <path d="M94 76 L102 94 L110 76 Z" fill="#ffffff" />
          <path d="M100 82 L104 82 L105 102 L102 106 L99 102 Z" fill="#ef4444" />
          <circle cx="144" cy="109" r="18" fill="url(#ppHeroPlusGrad)" />
          <path d="M144 101 V117 M136 109 H152" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>

      <p
        class="text-[15px] sm:text-[16px] font-normal text-slate-600 dark:text-slate-300 m-0 mb-7 tracking-[-0.01em] max-w-[58ch]"
        data-i18n-bn="পাসপোর্ট (4×5 cm) বা স্ট্যাম্প সাইজ ছবি তৈরির জন্য যেকোনো পোর্ট্রেট বা সেলফি ছবি ড্রপ করুন, পেস্ট করুন (Ctrl+V), অথবা নিচের অপশন বেছে নিন"
        data-i18n-en="Drop any portrait or selfie here, paste (Ctrl+V), or choose an option below to open in Photoshop Studio mode"
      >
        পাসপোর্ট (4×5 cm) বা স্ট্যাম্প সাইজ ছবি তৈরির জন্য যেকোনো পোর্ট্রেট বা সেলফি ছবি ড্রপ করুন, পেস্ট করুন (Ctrl+V), অথবা নিচের অপশন বেছে নিন
      </p>

      <div class="ds-empty-actions grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-[680px]">
        <label
          for="ppFileInput"
          class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-blue-400/80 dark:hover:border-blue-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
        >
          <input type="file" id="ppFileInput" accept="image/*" multiple class="visually-hidden sr-only" />
          <Icon name="lucide:user-check" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span data-i18n-bn="ছবি নির্বাচন করুন" data-i18n-en="Select Photo">ছবি নির্বাচন করুন</span>
        </label>

        <button
          type="button"
          id="ppCameraOpenBtn"
          class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(16,185,129,0.12)] hover:border-emerald-400/80 dark:hover:border-emerald-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
        >
          <Icon name="lucide:camera" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span data-i18n-bn="ক্যামেরায় ছবি তুলুন" data-i18n-en="Take Photo">ক্যামেরায় ছবি তুলুন</span>
        </button>

        <label
          for="ppBatchInput"
          class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(124,58,237,0.12)] hover:border-violet-400/80 dark:hover:border-violet-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
        >
          <input type="file" id="ppBatchInput" accept="image/*" multiple class="visually-hidden sr-only" />
          <Icon name="lucide:images" class="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
          <span data-i18n-bn="একাধিক ছবি যোগ করুন" data-i18n-en="Multiple Photos">একাধিক ছবি যোগ করুন</span>
        </label>
      </div>
    </div>
  </div>

  <!-- =========================================================================
       PHOTOSHOP STUDIO WORKSPACE (MATCHES DOCUMENT SCANNER EDIT MODE 1:1)
       ========================================================================= -->
  <div class="flex-1 min-h-0 flex flex-col overflow-hidden" id="ppStage" hidden>
    <div
      class="flex-1 min-h-0 grid grid-cols-[192px_minmax(0,1fr)_348px] group-data-[sidebar-collapsed=true]/pp:grid-cols-[0px_minmax(0,1fr)_348px] max-xl:grid-cols-[176px_minmax(0,1fr)_328px] max-lg:grid-cols-1 bg-[#dcdcdc] dark:bg-[#1e1e1e] text-slate-900 dark:text-studio-text overflow-hidden transition-[grid-template-columns] duration-200 ease-out"
    >
      <!-- ==========================================
           1. LEFT PANEL: NATIVE PHOTO FILMSTRIP QUEUE
           ========================================== -->
      <aside
        class="max-lg:hidden min-h-0 flex flex-col bg-white dark:bg-[#252526] border-r border-slate-300 dark:border-[#141414] overflow-hidden group-data-[sidebar-collapsed=true]/pp:w-0 group-data-[sidebar-collapsed=true]/pp:border-r-0 group-data-[sidebar-collapsed=true]/pp:opacity-0 group-data-[sidebar-collapsed=true]/pp:pointer-events-none transition-all duration-200"
        id="ppPagesSidebar"
        aria-label="ছবির তালিকা"
      >
        <div class="min-h-[38px] px-3 py-1.5 border-b border-slate-200 dark:border-[#181818] flex items-center justify-between gap-1.5 shrink-0 bg-slate-50/90 dark:bg-[#252526]">
          <strong class="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-800 dark:text-[#e6e6e6] truncate">
            <Icon name="lucide:files" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span data-i18n-bn="ছবিসমূহ" data-i18n-en="Photos">ছবিসমূহ</span>
            <span
              id="ppPhotoCountBadge"
              class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tabular-nums"
            >১</span>
          </strong>
          <button
            type="button"
            id="ppClearAllBtn"
            class="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            title="সব মুছুন ও নতুন শুরু করুন"
          >
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          id="ppPhotoList"
          class="flex-1 min-h-0 overflow-y-auto p-1.5 flex flex-col gap-1.5 bg-slate-50 dark:bg-[#1e1e1e] [scrollbar-width:thin]"
          role="tablist"
          aria-label="Uploaded Photos"
        ></div>

        <div class="p-2 border-t border-slate-200 dark:border-[#181818] grid grid-cols-[1fr_auto] gap-1.5 shrink-0 bg-slate-50/80 dark:bg-[#252526]">
          <label
            for="ppAddMoreInput"
            class="inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-emerald-600/35 dark:border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[12px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors"
          >
            <input type="file" id="ppAddMoreInput" accept="image/*" multiple hidden />
            <Icon name="lucide:plus" class="w-3.5 h-3.5 shrink-0" />
            <span data-i18n-bn="ছবি যোগ" data-i18n-en="Add Photo">ছবি যোগ</span>
          </label>
          <button
            type="button"
            id="ppSidebarCamBtn"
            class="{psBtn} !h-[30px] !px-2.5"
            title="ক্যামেরা দিয়ে ছবি তুলুন"
          >
            <Icon name="lucide:camera" class="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>
      </aside>

      <!-- ==========================================
           2. CENTER PANEL: PHOTOSHOP CONTEXTUAL CONTROL BAR + TOOLS DOCK + ZOOMABLE PASTEBOARD
           ========================================== -->
      <div class="min-w-0 min-h-0 flex flex-col overflow-hidden bg-[#dcdcdc] dark:bg-[#252526]">
        <!-- TOP PHOTOSHOP CONTEXTUAL OPTIONS BAR (EXACT DOCUMENTS-SCANNER #dsEraserBar THEME) -->
        <div
          id="ppPsOptionsBar"
          class="group-data-[step=print]/pp:!hidden relative z-30 min-h-[38px] px-2.5 py-1 bg-[#f3f4f6] dark:bg-[#18181c] border-b border-slate-300 dark:border-[#27272c] flex items-center gap-1.5 flex-wrap shrink-0 select-none shadow-2xs"
          role="toolbar"
          aria-label="Photoshop Contextual Options Bar"
        >
          <!-- Sidebar Toggle & Undo/Redo -->
          <button type="button" id="ppSidebarToggleBtn" class="{psBtn} !px-1.5 max-lg:hidden" title="বাম ছবির লিস্ট লুকান/দেখান">
            <Icon name="lucide:panel-left" class="w-3.5 h-3.5 text-indigo-500" />
          </button>
          <button type="button" id="ppUndoBtn" class="{psBtn} !px-1.5" disabled title="Undo (Ctrl+Z)">
            <Icon name="lucide:undo-2" class="w-3.5 h-3.5" />
          </button>
          <button type="button" id="ppRedoBtn" class="{psBtn} !px-1.5" disabled title="Redo (Ctrl+Y)">
            <Icon name="lucide:redo-2" class="w-3.5 h-3.5" />
          </button>

          <span class={psSep}></span>

          <!-- Active Tool Preset Badge (Matches #dsPsActiveToolLabel) -->
          <div
            id="ppPsActiveToolBadge"
            class="inline-flex items-center gap-1.5 h-[26px] pl-2 pr-2.5 rounded-[4px] border border-slate-300 dark:border-[#2e2e34] bg-white dark:bg-[#242429] shadow-2xs shrink-0"
          >
            <span id="ppPsActiveToolIconHost" class="inline-flex w-3.5 h-3.5 text-sky-500">
              <Icon name="lucide:crop" class="w-3.5 h-3.5 shrink-0" />
            </span>
            <b id="ppPsActiveToolName" class="text-[11.5px] font-semibold text-slate-800 dark:text-[#ececef] whitespace-nowrap">Crop Tool</b>
          </div>

          <span class={psSep}></span>

          <!-- ==================== 1. CROP TOOL OPTIONS (4×5 cm + Custom W×H + Outside Rotation) ==================== -->
          <div id="ppOptsCrop" data-pp-opts="crop" class="inline-flex items-center gap-1.5 flex-wrap shrink-0">
            <select id="ppSizePreset" class="{psSel} w-[158px]" aria-label="Passport Crop Preset">
              <option value="passport-4x5" selected>Passport (4 × 5 cm)</option>
              <option value="bd-passport">BD Passport (3.8 × 4.8 cm)</option>
              <option value="intl-passport">Intl Passport (3.5 × 4.5 cm)</option>
              <option value="bd-stamp">Stamp Size (2 × 2.5 cm)</option>
              <option value="us-visa">US Visa (2 × 2 inch)</option>
              <option value="nid-photo">Job / Online (300 × 300 px)</option>
              <option value="free">Free Ratio (ইচ্ছামতো মাপ)</option>
            </select>

            <!-- Photoshop Width ⇄ Height + Unit Inputs -->
            <div class="inline-flex items-center gap-1 shrink-0" title="কাস্টম প্রস্থ ও উচ্চতা (Width × Height)">
              <input id="ppCropW" type="number" min="0.5" max="4000" step="0.1" value="4" class="{psNum} w-[44px]" aria-label="Crop Width" />
              <button type="button" id="ppCropSwapDimBtn" class="{psBtn} !px-1" title="প্রস্থ ও উচ্চতা অদলবদল করুন (Swap W ⇄ H)">
                <Icon name="lucide:arrow-left-right" class="w-3 h-3" />
              </button>
              <input id="ppCropH" type="number" min="0.5" max="4000" step="0.1" value="5" class="{psNum} w-[44px]" aria-label="Crop Height" />
              <select id="ppCropUnit" class="{psSel} w-[50px] !px-1" aria-label="Crop Unit">
                <option value="cm" selected>cm</option>
                <option value="mm">mm</option>
                <option value="in">in</option>
                <option value="px">px</option>
              </select>
            </div>

            <span class={psSep}></span>

            <!-- 90° Rotate / Flip / Auto Straighten / Grid -->
            <div class="inline-flex items-center gap-0.5">
              <button type="button" id="ppRotLBtn" class="{psBtn} !px-1.5" title="৯০° বামে ঘোরান">
                <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
              </button>
              <button type="button" id="ppRotRBtn" class="{psBtn} !px-1.5" title="৯০° ডানে ঘোরান">
                <Icon name="lucide:rotate-cw" class="w-3.5 h-3.5" />
              </button>
              <button type="button" id="ppFlipHBtn" class="{psBtn} !px-1.5" title="পাশাপাশি উল্টান (Mirror Selfie Fix)">
                <Icon name="lucide:flip-horizontal-2" class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Live Angle Readout (synced with Outside-Crop Drag Rotation!) -->
            <div
              class="inline-flex items-center gap-1 h-[25px] px-2 rounded-[3px] bg-white dark:bg-[#1e1e22] border border-slate-300 dark:border-[#323238]"
              title="ক্রপ বক্সের বাইরে মাউস ড্র্যাগ করে ঘোরান অথবা কোণ লিখুন"
            >
              <Icon name="lucide:compass" class="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <input
                type="number"
                id="ppStraightenAngle"
                min="-45"
                max="45"
                step="0.2"
                value="0"
                class="w-[38px] bg-transparent border-0 text-[11px] font-mono font-bold text-slate-800 dark:text-[#ececef] text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Rotation Angle"
              />
              <span class="text-[10.5px] text-slate-400">°</span>
            </div>

            <button type="button" id="ppToggleGuideBtn" aria-pressed="true" class="{psBtn} !px-1.5 aria-pressed:!border-sky-500 aria-pressed:!text-sky-400" title="পাসপোর্ট গাইড গ্রিড দেখান/লুকান">
              <Icon name="lucide:scan" class="w-3.5 h-3.5" />
            </button>

            <!-- Photoshop Cancel (✕) & Commit (✓) Buttons -->
            <button type="button" id="ppCropResetBoxBtn" class="{psBtn} !px-1.5 !text-rose-500" title="ক্রপ ও রোটেশন রিসেট করুন (Esc)">
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="ppCropCommitBtn"
              class="inline-flex items-center gap-1 h-[25px] px-2.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11.5px] font-bold cursor-pointer shadow-2xs shrink-0"
              title="ক্রপ প্রয়োগ করুন (Enter)"
            >
              <Icon name="lucide:check" class="w-3.5 h-3.5" />
              <span>ক্রপ</span>
            </button>
          </div>

          <!-- ==================== 2. MOVE & FREE TRANSFORM OPTIONS (MATCHES #dsMoveOpts) ==================== -->
          <div id="ppOptsMove" data-pp-opts="move" hidden class="inline-flex items-center gap-1.5 flex-wrap shrink-0">
            <label class="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-700 dark:text-[#d8d8d8] cursor-pointer">
              <input id="ppMoveAutoSelect" type="checkbox" checked class="w-3.5 h-3.5 accent-sky-500 cursor-pointer" />
              <span>Auto-Select Layer</span>
            </label>
            <label class="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-700 dark:text-[#d8d8d8] cursor-pointer ml-1" title="Show Transform Controls (Ctrl+T)">
              <input id="ppShowTransform" type="checkbox" class="w-3.5 h-3.5 accent-sky-500 cursor-pointer" />
              <span>Show Transform Controls</span>
            </label>
            <span class={psSep}></span>
            <div class="inline-flex items-center rounded-[3px] border border-slate-300 dark:border-[#2e2e34] overflow-hidden shrink-0" role="group" aria-label="Align Active Layer">
              {#each moveAligns as al}
                <button
                  type="button"
                  data-pp-align={al.id}
                  title={al.tip}
                  class="w-[26px] h-[25px] inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 border-r last:border-r-0 border-slate-200 dark:border-[#1f1f1f] text-slate-700 dark:text-[#e0e0e0] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#484848]"
                >
                  <Icon name={al.icon} class="w-3.5 h-3.5" />
                </button>
              {/each}
            </div>
            <button type="button" id="ppResetPosBtn" class={psBtn} title="সক্রিয় লেয়ারের পজিশন ও স্কেল রিসেট করুন">
              <Icon name="lucide:locate-fixed" class="w-3.5 h-3.5 text-sky-400" />
              <span>Reset Transform</span>
            </button>
          </div>

          <!-- ==================== 3. BRUSH & ERASER TOOL OPTIONS (MATCHES #dsPsBrushOpts) ==================== -->
          <div id="ppOptsBrush" data-pp-opts="brush eraser" hidden class="inline-flex items-center gap-1.5 flex-wrap shrink-0">
            <div class="inline-flex items-center p-0.5 rounded-[3px] bg-slate-200 dark:bg-[#242429] border border-slate-300 dark:border-[#323238]" id="ppBrushSubModeGroup">
              <button type="button" data-pp-brush-mode="paint" aria-pressed="true" class="h-[21px] px-2 rounded-[2px] text-[11px] font-semibold cursor-pointer text-slate-700 dark:text-[#d4d4d4] aria-pressed:bg-[#1473e6] aria-pressed:text-white">Paint</button>
              <button type="button" data-pp-brush-mode="erase-bg" aria-pressed="false" class="h-[21px] px-2 rounded-[2px] text-[11px] font-semibold cursor-pointer text-slate-700 dark:text-[#d4d4d4] aria-pressed:bg-rose-600 aria-pressed:text-white">Erase BG</button>
              <button type="button" data-pp-brush-mode="restore-bg" aria-pressed="false" class="h-[21px] px-2 rounded-[2px] text-[11px] font-semibold cursor-pointer text-slate-700 dark:text-[#d4d4d4] aria-pressed:bg-emerald-600 aria-pressed:text-white">Restore BG</button>
            </div>

            <label class="relative inline-flex items-center gap-1.5 h-[25px] pl-1.5 pr-2 rounded-[3px] border border-slate-300 dark:border-[#323238] bg-white dark:bg-[#1e1e22] cursor-pointer" title="Foreground Brush Color">
              <input type="color" id="ppBrushColor" value="#ffffff" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              <span id="ppBrushColorChip" class="w-3.5 h-3.5 rounded-[2px] border border-slate-400" style="background:#ffffff"></span>
              <code id="ppBrushColorHex" class="text-[11px] font-mono text-slate-700 dark:text-[#e6e6e6]">#FFFFFF</code>
            </label>

            <div class="inline-flex items-center gap-1.5 h-[25px] px-2 rounded-[3px] bg-white dark:bg-[#1e1e22] border border-slate-300 dark:border-[#323238]" title="Brush Size ( [ / ] )">
              <span class={psLbl}>Size:</span>
              <input type="range" id="ppBrushSize" min="2" max="140" value="26" class="w-[52px] h-1 accent-sky-500 cursor-pointer" />
              <strong id="ppBrushSizeVal" class="text-[11px] font-mono text-slate-700 dark:text-[#ececef] min-w-[32px] text-right">26px</strong>
            </div>

            <div class="inline-flex items-center gap-1.5 h-[25px] px-2 rounded-[3px] bg-white dark:bg-[#1e1e22] border border-slate-300 dark:border-[#323238]" title="Brush Hardness ( Shift + [ / ] )">
              <span class={psLbl}>Hardness:</span>
              <input type="range" id="ppBrushHardness" min="0" max="100" value="65" class="w-[46px] h-1 accent-sky-500 cursor-pointer" />
              <strong id="ppBrushHardnessVal" class="text-[11px] font-mono text-slate-700 dark:text-[#ececef] min-w-[28px] text-right">65%</strong>
            </div>

            <div class="inline-flex items-center gap-1.5 h-[25px] px-2 rounded-[3px] bg-white dark:bg-[#1e1e22] border border-slate-300 dark:border-[#323238]" title="Brush Opacity ( 1 – 0 keys )">
              <span class={psLbl}>Opacity:</span>
              <input type="range" id="ppBrushOpacity" min="10" max="100" value="100" class="w-[46px] h-1 accent-sky-500 cursor-pointer" />
              <strong id="ppBrushOpacityVal" class="text-[11px] font-mono text-slate-700 dark:text-[#ececef] min-w-[30px] text-right">100%</strong>
            </div>

            <button type="button" id="ppClearPaintBtn" class="{psBtn} !text-amber-400" title="ব্রাশ লেয়ার ক্লিয়ার করুন">
              <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- ==================== 4. EYEDROPPER / COLOR PICKER OPTIONS ==================== -->
          <div id="ppOptsPicker" data-pp-opts="picker" hidden class="inline-flex items-center gap-1.5 flex-wrap shrink-0">
            <span class={psLbl}>Sampled:</span>
            <div class="inline-flex items-center gap-1.5 h-[25px] px-2 rounded-[3px] border border-slate-300 dark:border-[#323238] bg-white dark:bg-[#1e1e22]">
              <span id="ppPickedSwatch" class="w-4 h-4 rounded-[2px] border border-slate-400" style="background:#0072ce"></span>
              <code id="ppPickedHex" class="text-[11px] font-mono font-bold text-slate-800 dark:text-white">#0072CE</code>
            </div>
            <button type="button" id="ppApplyPickedBgBtn" class="inline-flex items-center gap-1 h-[25px] px-2.5 rounded-[3px] bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold cursor-pointer">
              <Icon name="lucide:palette" class="w-3.5 h-3.5" />
              <span>ব্যাকগ্রাউন্ডে বসান</span>
            </button>
            <button type="button" id="ppApplyPickedBrushBtn" class={psBtn}>
              <Icon name="lucide:paintbrush" class="w-3.5 h-3.5 text-fuchsia-400" />
              <span>ব্রাশ কালার</span>
            </button>
          </div>

          <!-- ==================== 5. HAND & ZOOM VIEWPORT OPTIONS (MATCHES #dsPreviewZoom) ==================== -->
          <div id="ppOptsViewport" data-pp-opts="hand zoom" hidden class="inline-flex items-center gap-1 shrink-0">
            <button type="button" id="ppTopZoomOutBtn" class="{psBtn} !px-1.5" title="Zoom Out (Ctrl -)">
              <Icon name="lucide:zoom-out" class="w-3.5 h-3.5" />
            </button>
            <span id="ppTopZoomLabel" class="inline-flex items-center justify-center w-[54px] h-[25px] rounded-[3px] border border-slate-300 dark:border-[#323238] bg-white dark:bg-[#1e1e22] text-[11.5px] font-mono font-bold text-slate-800 dark:text-[#ececef]">100%</span>
            <button type="button" id="ppTopZoomInBtn" class="{psBtn} !px-1.5" title="Zoom In (Ctrl +)">
              <Icon name="lucide:zoom-in" class="w-3.5 h-3.5" />
            </button>
            <button type="button" id="ppTopZoom100Btn" class={psBtn} title="Actual Pixels 100% (Ctrl+1)">100%</button>
            <button type="button" id="ppTopZoomFitBtn" class={psBtn} title="Fit Screen (Ctrl+0)">Fit Screen</button>
          </div>

          <!-- Right Quick AI Triggers in Top Bar -->
          <div class="ml-auto inline-flex items-center gap-1 shrink-0">
            <button
              type="button"
              id="ppTopAutoBgBtn"
              class="inline-flex items-center gap-1 h-[25px] px-2 rounded-[3px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer shadow-2xs"
              title="১-ক্লিকে ১০২৪px লোকাল AI দিয়ে ব্যাকগ্রাউন্ড রিমুভ করুন (ফ্রি)"
            >
              <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5 shrink-0" />
              <span class="max-xl:hidden">ব্যাকগ্রাউন্ড রিমুভ</span>
            </button>
            <button
              type="button"
              id="ppOpenAiModalTopBtn"
              class="inline-flex items-center gap-1 h-[25px] px-2.5 rounded-[3px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[11px] font-bold cursor-pointer shadow-2xs"
              title="সেলফি সোজা, কলার/ড্রেস ফিট, চুল-দাড়ি ও DSLR স্টুডিও লুক AI দিয়ে জেনারেট করুন"
            >
              <Icon name="lucide:sparkles" class="w-3.5 h-3.5 shrink-0" />
              <span>Generate with AI</span>
            </button>
          </div>
        </div>

        <!-- TOP BAR FOR STEP 2: PRINT READY SHEET MODE -->
        <div
          id="ppPrintTopBar"
          class="hidden group-data-[step=print]/pp:flex min-h-[40px] px-3 py-1 bg-[#f3f4f6] dark:bg-[#18181c] border-b border-slate-300 dark:border-[#27272c] items-center justify-between gap-2 shrink-0"
        >
          <div class="inline-flex items-center gap-2">
            <button
              type="button"
              id="ppBackToEditorBtn"
              class="inline-flex items-center gap-1.5 h-7.5 px-3 rounded-md bg-white dark:bg-[#383838] hover:bg-slate-100 dark:hover:bg-[#464646] border border-slate-300 dark:border-[#141414] text-slate-800 dark:text-white text-[12px] font-bold cursor-pointer shadow-2xs"
            >
              <Icon name="lucide:arrow-left" class="w-4 h-4 text-sky-500" />
              <span>← ফটো এডিটরে ফিরুন (Edit Photo)</span>
            </button>
            <span class="text-[12px] font-bold text-slate-700 dark:text-slate-200 max-sm:hidden">প্রিন্ট রেডি শিট প্রিভিউ (300 DPI Lab Ready)</span>
          </div>
          <span id="ppSheetSummaryBadge" class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-[11.5px] font-extrabold">A4 • ৮ কপি</span>
        </div>

        <!-- PHOTOSHOP DOCUMENT TAB BAR (e.g. "SSDSS.jpg @ 100% (RGB/8) ×") -->
        <div
          id="ppDocTabsBar"
          class="group-data-[step=print]/pp:!hidden h-[28px] px-2 bg-[#e4e4e7] dark:bg-[#1b1b1d] border-b border-slate-300 dark:border-[#111111] flex items-center gap-1 overflow-x-auto shrink-0 select-none [scrollbar-width:none]"
          role="tablist"
          aria-label="Open Document Tabs"
        ></div>

        <!-- ==========================================
             CENTER PASTEBOARD STAGE (CANVAS-LEVEL ZOOM & PAN VIA TechHatPsStudio!)
             ========================================== -->
        <div class="relative flex-1 min-h-0 flex flex-col overflow-clip">
          <!-- LEFT VERTICAL PHOTOSHOP TOOLS PANEL (EXACT DOCUMENTS-SCANNER #dsPsDock) -->
          <aside
            id="ppPsDock"
            data-ps-dock="true"
            class="group-data-[step=print]/pp:!hidden absolute left-1.5 top-2 w-[38px] rounded-md bg-[#f0f0f0] dark:bg-[#2b2b2b] border border-slate-300 dark:border-[#3c3c3c] p-[3px] flex flex-col items-center gap-[2px] z-[60] shrink-0 select-none shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
            aria-label="Photoshop Tools Panel"
          >
            <span class="w-5 h-[3px] my-[2px] rounded-full bg-slate-400/50 dark:bg-white/15" aria-hidden="true"></span>
            {#each psTools as tl}
              {#if tl.sep}
                <span class="w-6 h-px bg-slate-300 dark:bg-white/12 my-[3px]" aria-hidden="true"></span>
              {/if}
              <button
                type="button"
                data-pp-tool={tl.id}
                aria-pressed={tl.id === 'crop' ? 'true' : 'false'}
                title={`${tl.name} (${tl.key})`}
                class="relative w-8 h-8 p-0 rounded-[4px] border border-transparent bg-transparent text-slate-700 dark:text-[#d4d4d4] flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white aria-pressed:bg-slate-300 dark:aria-pressed:bg-[#484848] aria-pressed:border-slate-400/50 dark:aria-pressed:border-white/20 aria-pressed:text-slate-950 dark:aria-pressed:text-white transition"
              >
                <span data-pp-tool-icon={tl.id} class="inline-flex">
                  <Icon name={tl.icon} class="w-[18px] h-[18px] shrink-0" />
                </span>
              </button>
            {/each}

            <span class="w-6 h-px bg-slate-300 dark:bg-white/12 my-[3px]" aria-hidden="true"></span>

            <!-- Photoshop Foreground / Background Color Swatches (X = Swap, D = Reset) -->
            <div class="relative w-8 h-8 my-0.5" title="Foreground (Brush) & Background (Backdrop) Colors — Press X to Swap">
              <label
                class="absolute left-0.5 top-0.5 w-4.5 h-4.5 rounded-[2px] border border-white shadow-sm z-10 cursor-pointer overflow-hidden"
                title="Foreground Brush Color"
              >
                <input type="color" id="ppDockFgInput" value="#ffffff" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                <span id="ppDockFgSwatch" class="block w-full h-full" style="background:#ffffff"></span>
              </label>
              <label
                class="absolute right-0.5 bottom-0.5 w-4.5 h-4.5 rounded-[2px] border border-slate-400 dark:border-white/70 shadow-sm cursor-pointer overflow-hidden"
                title="Passport Backdrop Color"
              >
                <input type="color" id="ppDockBgInput" value="#0088ff" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                <span id="ppDockBgSwatch" class="block w-full h-full" style="background:#0088ff"></span>
              </label>
            </div>
          </aside>

          <!-- STEP 1 PASTEBOARD VIEWPORT: WHOLE ARTBOARD ZOOMS & PANS LIKE REAL PHOTOSHOP! -->
          <div
            id="ppSingleStageWrap"
            class="group-data-[step=print]/pp:!hidden relative flex-1 min-h-0 flex items-center justify-center pl-12 pr-3 py-4 overflow-clip touch-none select-none bg-[#dcdcdc] dark:bg-[#252526] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_24px),repeating-linear-gradient(90deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_24px)]"
          >
            <!-- =========================================================
                 A. 60FPS BUTTER-SMOOTH PHOTOSHOP CROP + OUTSIDE ROTATION ARTBOARD
                 ========================================================= -->
            <div
              id="ppCropInteractiveWrap"
              class="relative inline-flex items-center justify-center select-none will-change-transform"
            >
              <!-- Outer Photoshop Curved-Cursor Rotation Zone (Dragging outside crop box rotates photo smoothly!) -->
              <div
                id="ppCropRotateOuterZone"
                class="absolute -inset-36 z-10"
                title="ক্রপ বক্সের বাইরে ড্র্যাগ করে ছবি যেকোনো কোণে ঘোরান (Photoshop Rotate)"
              ></div>

              <!-- Clipped Photo Plane (GPU-transformed during Rotate/Pan for 60fps zero-lag smoothness!) -->
              <div
                id="ppCropCanvasFrame"
                class="relative overflow-hidden ring-1 ring-black/50 dark:ring-white/20 bg-[#1b1b1d] z-15 pointer-events-none"
              >
                <canvas
                  id="ppCropSourceCanvas"
                  class="block max-w-[calc(100vw-620px)] max-lg:max-w-[calc(100vw-88px)] max-h-[calc(100dvh-13.5rem)] w-auto h-auto object-contain origin-center will-change-transform"
                ></canvas>
              </div>

              <!-- Interactive Stationary/Resizable Photoshop Crop Box with 8 L-Handles -->
              <div
                id="ppCropBox"
                class="absolute border border-white/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.62)] cursor-move touch-none z-25"
                style="left:12%;top:8%;width:76%;height:84%;"
              >
                <!-- Rule of Thirds + Fine Straightening Grid (shown automatically while rotating!) + Biometric Oval -->
                <svg
                  id="ppCropGridSvg"
                  viewBox="0 0 400 500"
                  preserveAspectRatio="none"
                  class="pointer-events-none absolute inset-0 !w-full !h-full"
                  style="width:100%;height:100%;"
                  fill="none"
                >
                  <!-- Rule of Thirds -->
                  <line x1="133.3" y1="0" x2="133.3" y2="500" stroke="rgba(255,255,255,0.45)" stroke-width="1" vector-effect="non-scaling-stroke" />
                  <line x1="266.6" y1="0" x2="266.6" y2="500" stroke="rgba(255,255,255,0.45)" stroke-width="1" vector-effect="non-scaling-stroke" />
                  <line x1="0" y1="166.6" x2="400" y2="166.6" stroke="rgba(255,255,255,0.45)" stroke-width="1" vector-effect="non-scaling-stroke" />
                  <line x1="0" y1="333.3" x2="400" y2="333.3" stroke="rgba(255,255,255,0.45)" stroke-width="1" vector-effect="non-scaling-stroke" />
                  <!-- Fine Photoshop Rotation Alignment Grid (visible during outside-crop rotation drag!) -->
                  <g id="ppCropFineRotateGrid" opacity="0" class="transition-opacity duration-100">
                    {#each [1, 2, 4, 5, 7, 8] as gi}
                      <line x1={(400 * gi) / 9} y1="0" x2={(400 * gi) / 9} y2="500" stroke="rgba(255,255,255,0.24)" stroke-width="0.8" vector-effect="non-scaling-stroke" />
                      <line x1="0" y1={(500 * gi) / 9} x2="400" y2={(500 * gi) / 9} stroke="rgba(255,255,255,0.24)" stroke-width="0.8" vector-effect="non-scaling-stroke" />
                    {/each}
                  </g>
                  <!-- Biometric Head & Shoulders Guide -->
                  <ellipse cx="200" cy="195" rx="86" ry="120" stroke="#38bdf8" stroke-width="1.4" stroke-dasharray="6 4" stroke-opacity="0.85" vector-effect="non-scaling-stroke" />
                  <path d="M32 475 C70 375, 130 352, 200 352 C270 352, 330 375, 368 475" stroke="#22c55e" stroke-width="1.4" stroke-dasharray="5 4" stroke-opacity="0.78" vector-effect="non-scaling-stroke" />
                </svg>

                <!-- 8 Authentic Photoshop L-Corner & Edge Handles -->
                {#each cropHandles as h}
                  <button
                    type="button"
                    data-pp-crop-handle={h.id}
                    aria-label={`Crop handle ${h.id}`}
                    class="absolute {h.pos} p-0 bg-transparent border-solid z-30"
                  ></button>
                {/each}

                <!-- Floating Dimension & Commit Pill Below Crop Box -->
                <div class="absolute -bottom-9 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#18181c]/95 border border-white/15 text-white text-[11px] font-bold shadow-lg whitespace-nowrap z-35">
                  <span id="ppCropDimReadout" class="font-mono text-sky-300">4 × 5 cm</span>
                  <span id="ppCropLiveAnglePill" hidden class="font-mono text-amber-300 pl-1 border-l border-white/15">0.0°</span>
                  <button type="button" id="ppCropInlineCommitBtn" data-ps-ignore-stage="true" class="ml-0.5 px-2 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer">✓ ক্রপ</button>
                </div>
              </div>
            </div>

            <!-- =========================================================
                 B. COMPOSITED PHOTOSHOP ARTBOARD (MOVE / TRANSFORM / BRUSH / ERASER / PICKER / ZOOM)
                 ========================================================= -->
            <div
              id="ppEditedCanvasWrap"
              hidden
              class="relative inline-flex items-center justify-center ring-1 ring-black/45 dark:ring-white/20 bg-[conic-gradient(#cbd5e1_25%,#ffffff_0_50%,#cbd5e1_0_75%,#ffffff_0)] bg-[length:14px_14px] will-change-transform"
            >
              <canvas
                id="ppSingleCanvas"
                width="472"
                height="591"
                class="block max-w-[calc(100vw-620px)] max-lg:max-w-[calc(100vw-88px)] max-h-[calc(100dvh-13.5rem)] w-auto h-auto object-contain select-none"
              ></canvas>

              <!-- Biometric Alignment Guide SVG -->
              <svg
                id="ppBiometricGuideSvg"
                hidden
                viewBox="0 0 472 591"
                preserveAspectRatio="none"
                class="pointer-events-none absolute inset-0 !w-full !h-full opacity-75"
                style="width:100%;height:100%;"
                fill="none"
              >
                <line x1="236" y1="0" x2="236" y2="591" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="5 5" vector-effect="non-scaling-stroke" />
                <line x1="45" y1="230" x2="427" y2="230" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" />
                <ellipse cx="236" cy="224" rx="100" ry="142" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="7 5" vector-effect="non-scaling-stroke" />
              </svg>

              <!-- Photoshop Move Tool Free-Transform Bounding Box (8 Handles + Outside Rotate + Center Crosshair) -->
              <div
                id="ppTransformBox"
                hidden
                class="absolute pointer-events-none z-[28] border border-[#1473e6] shadow-[0_0_0_1px_rgba(255,255,255,0.65)]"
                style="left:0%;top:0%;width:100%;height:100%;"
              >
                <div id="ppTfRotateOuter" class="absolute -inset-8 pointer-events-auto" title="বাইরে ড্র্যাগ করে লেয়ার ঘোরান"></div>
                {#each tfHandles as h}
                  <button
                    type="button"
                    data-pp-tf-handle={h.id}
                    aria-label={`Transform ${h.id}`}
                    class="absolute {h.pos} w-2.5 h-2.5 p-0 rounded-[1px] bg-white border border-[#1473e6] shadow-[0_1px_3px_rgba(0,0,0,0.5)] pointer-events-auto z-10"
                  ></button>
                {/each}
                <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none">
                  <span class="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[#1473e6]"></span>
                  <span class="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-[#1473e6]"></span>
                </span>
              </div>

              <!-- Live Feathered Photoshop Brush Cursor + HUD Badge (Matches DocumentScanner #dsEraserCursor) -->
              <div
                id="ppBrushCursor"
                data-hud="false"
                hidden
                class="group/cursor pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full z-30 flex items-center justify-center"
                style="width:26px;height:26px;"
              >
                <canvas id="ppBrushPreviewCanvas" width="144" height="144" class="relative z-10 w-full h-full rounded-full block pointer-events-none"></canvas>
                <span class="absolute inset-0 z-20 rounded-full border border-emerald-400/60 shadow-[0_0_0_1px_rgba(0,0,0,0.75)] pointer-events-none"></span>
                <div
                  id="ppBrushHudBadge"
                  class="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-30 px-2 py-1 rounded-[4px] bg-[#323236]/95 border border-white/15 text-white text-[10.5px] leading-tight font-mono whitespace-nowrap shadow-md opacity-0 group-data-[hud=true]/cursor:opacity-100 transition-opacity pointer-events-none"
                >
                  <span id="ppBrushHudText">26px • 65%</span>
                </div>
              </div>

              <!-- Live Eyedropper Loupe -->
              <div
                id="ppPickerLoupe"
                hidden
                class="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+14px)] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/95 border border-white/25 text-white text-[11.5px] font-mono font-bold shadow-lg z-35 whitespace-nowrap"
              >
                <span id="ppPickerLoupeDot" class="w-3.5 h-3.5 rounded-full border-2 border-white" style="background:#ffffff"></span>
                <span id="ppPickerLoupeText">#FFFFFF</span>
              </div>
            </div>

            <!-- Floating Rotation Angle HUD Pill next to cursor during outside-crop rotation -->
            <div
              id="ppFloatingRotateHud"
              hidden
              class="pointer-events-none fixed z-[120] px-2 py-0.5 rounded bg-[#18181c]/95 border border-sky-400/40 text-sky-300 font-mono text-[11.5px] font-bold shadow-lg"
            >0.0°</div>

            <!-- AI Processing / Background Removal Loading Overlay -->
            <div
              id="ppAiLoadingOverlay"
              hidden
              class="absolute inset-0 bg-slate-950/78 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white p-6 text-center z-[80]"
            >
              <div class="w-11 h-11 rounded-full border-3 border-sky-400 border-t-transparent animate-spin"></div>
              <strong id="ppAiLoadingText" class="text-[13.5px] font-bold tracking-wide">AI প্রসেসিং চলছে...</strong>
              <span class="text-[11.5px] text-slate-300">অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন</span>
            </div>
          </div>

          <!-- STEP 2 VIEWPORT: DEDICATED PRINT READY SHEET PREVIEW -->
          <div
            id="ppPrintSheetStageWrap"
            class="hidden group-data-[step=print]/pp:flex relative flex-1 min-h-0 items-center justify-center p-5 overflow-auto bg-[#dcdcdc] dark:bg-[#1e1e1e]"
          >
            <canvas
              id="ppSheetCanvas"
              class="block max-w-full max-h-[calc(100dvh-12.5rem)] w-auto h-auto object-contain bg-white shadow-[0_20px_55px_rgba(0,0,0,0.45)] rounded-[2px]"
            ></canvas>
          </div>
        </div>

        <!-- BOTTOM PHOTOSHOP STATUS & CANVAS ZOOM BAR -->
        <footer
          class="h-7.5 px-3 bg-[#f3f4f6] dark:bg-[#1f1f1f] border-t border-slate-300 dark:border-[#141414] flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-[#bdbdbd] shrink-0"
        >
          <div class="inline-flex items-center gap-1">
            <button type="button" id="ppZoomOutHudBtn" class="w-5.5 h-5.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer" title="ক্যানভাস জুম আউট (Ctrl -)">
              <Icon name="lucide:minus" class="w-3 h-3" />
            </button>
            <button type="button" id="ppZoomFitHudBtn" class="px-1.5 h-5.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 font-mono font-bold text-slate-800 dark:text-white min-w-[46px] text-center cursor-pointer" title="ক্লিক করলে স্ক্রিনে ফিট হবে (Ctrl+0)">
              <span id="ppZoomHudVal">100%</span>
            </button>
            <button type="button" id="ppZoomInHudBtn" class="w-5.5 h-5.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer" title="ক্যানভাস জুম ইন (Ctrl +)">
              <Icon name="lucide:plus" class="w-3 h-3" />
            </button>
            <span class="mx-1 text-slate-300 dark:text-white/15">|</span>
            <span id="ppSingleDimBadge" class="font-mono text-[10.5px] text-sky-600 dark:text-sky-400 font-semibold">4×5 cm • 472×591 px</span>
          </div>
          <div class="inline-flex items-center gap-2">
            <span class="max-md:hidden text-[10px] text-slate-400 dark:text-[#8e8e96]">Wheel: জুম • Space+Drag: প্যান • বক্সের বাইরে ড্র্যাগ: রোটেশন</span>
            <span id="ppAiActiveBadge" class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">300 DPI</span>
          </div>
        </footer>
      </div>

      <!-- ==========================================
           3. RIGHT PANEL: PHOTOSHOP SCRUBBY ADJUSTMENTS + LAYERS STACK (MATCHES DOCUMENT SCANNER)
           ========================================== -->
      <aside
        class="min-h-0 flex flex-col bg-white dark:bg-[#252526] border-l border-slate-300 dark:border-[#141414] overflow-hidden"
        aria-label="Photoshop Adjustments, Layers & Print Panel"
      >
        <!-- ==================== STEP 1 RIGHT DOCK ==================== -->
        <div id="ppRightEditDock" class="group-data-[step=print]/pp:!hidden flex-1 min-h-0 flex flex-col overflow-hidden">
          <!-- Photoshop-Style Tab Header Bar -->
          <div class="min-h-[35px] px-1.5 pt-1 flex items-end justify-between gap-1 border-b border-slate-200 dark:border-[#181818] bg-slate-100 dark:bg-[#1f1f1f] shrink-0" role="tablist">
            <div class="inline-flex items-end gap-0.5">
              <button
                type="button"
                role="tab"
                data-pp-tab="adjust"
                aria-selected="true"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-t-md border border-b-0 border-transparent text-[11.5px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer aria-selected:bg-white dark:aria-selected:bg-[#2b2b2b] aria-selected:border-slate-200 dark:aria-selected:border-white/10 aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400"
              >
                <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5 text-sky-500" />
                <span>Adjustments</span>
              </button>
              <button
                type="button"
                role="tab"
                data-pp-tab="bg"
                aria-selected="false"
                class="inline-flex items-center gap-1 h-7 px-2.5 rounded-t-md border border-b-0 border-transparent text-[11.5px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer aria-selected:bg-white dark:aria-selected:bg-[#2b2b2b] aria-selected:border-slate-200 dark:aria-selected:border-white/10 aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400"
              >
                <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5 text-violet-500" />
                <span>Cutout &amp; Guide</span>
              </button>
            </div>
            <button
              type="button"
              id="ppColorResetBtn"
              class="mb-1 inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] text-amber-500 hover:bg-amber-500/10 cursor-pointer"
              title="সব অ্যাডজাস্টমেন্ট রিসেট করুন"
            >
              <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- UPPER DOCK SCROLLABLE CONTENT -->
          <div class="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5 bg-white dark:bg-[#2b2b2b] [scrollbar-width:thin]">
            <!-- PHOTOSHOP DOCUMENT PROPERTIES BAR (W, H, Resolution: 300 pixels/inch) -->
            <div class="px-2.5 py-1.5 rounded-[4px] bg-slate-100/90 dark:bg-[#1f1f22] border border-slate-200/90 dark:border-[#161618] flex items-center justify-between gap-2 text-[10.5px] font-mono text-slate-600 dark:text-[#bdbdbd]">
              <span class="inline-flex items-center gap-1 font-sans font-bold text-slate-700 dark:text-[#e0e0e0]">
                <Icon name="lucide:file-image" class="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>Document</span>
              </span>
              <span id="ppDocPropsWH" class="font-bold text-slate-800 dark:text-white">W: 4 cm • H: 5 cm</span>
              <span id="ppDocPropsRes" class="text-[10px] text-emerald-600 dark:text-emerald-400">300 PPI</span>
            </div>

            <!-- TAB A: ADJUSTMENTS + BACKDROP + AI DSLR STUDIO -->
            <div id="ppInspectorTabAdjust" class="space-y-2.5">
              <!-- 1-Click Local DSLR Portrait Enhancers -->
              <div class="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  id="ppDslrClarityBtn"
                  aria-pressed="false"
                  class="{psBtn} !h-7.5 !px-1.5 justify-center font-semibold text-[11px] aria-pressed:!bg-emerald-600 aria-pressed:!text-white aria-pressed:!border-emerald-500"
                  title="ঘোলা সেলফি থেকে ইনডোর ধোঁয়াশা দূর করে DSLR শার্পনেস ও ন্যাচারাল স্কিন কনট্রাস্ট আনুন"
                >
                  <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>DSLR লুক</span>
                </button>
                <button
                  type="button"
                  id="ppSkinSmoothBtn"
                  aria-pressed="false"
                  class="{psBtn} !h-7.5 !px-1.5 justify-center font-semibold text-[11px] aria-pressed:!bg-sky-600 aria-pressed:!text-white aria-pressed:!border-sky-500"
                >
                  <Icon name="lucide:wand-2" class="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>স্কিন স্মুথ</span>
                </button>
                <button
                  type="button"
                  id="ppStudioLightBtn"
                  aria-pressed="false"
                  class="{psBtn} !h-7.5 !px-1.5 justify-center font-semibold text-[11px] aria-pressed:!bg-sky-600 aria-pressed:!text-white aria-pressed:!border-sky-500"
                >
                  <Icon name="lucide:sun" class="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>স্টুডিও লাইট</span>
                </button>
              </div>

              <!-- Scrubby Slider Pods (Matches DocumentScanner #dsSliders!) -->
              <div class="grid grid-cols-1 gap-1.5">
                {#each adjustPods as adj}
                  <div
                    data-ps-slider-pod={adj.key}
                    class="min-h-[29px] rounded-[4px] border border-slate-200/90 dark:border-[#161618] bg-slate-50/80 dark:bg-[#1e1e1e] flex items-stretch overflow-hidden hover:border-slate-300 dark:hover:border-[#4a4a4a]"
                  >
                    <div class="relative flex-1 min-w-0 px-2 py-1 flex items-center justify-between gap-1.5 overflow-hidden select-none">
                      <span
                        data-pp-adj-fill={adj.key}
                        class="absolute inset-y-0 left-0 bg-emerald-500/14 dark:bg-white/[0.08] pointer-events-none transition-[width] duration-75"
                        style="width:{adj.initPct}%"
                      ></span>
                      <span class="relative z-10 inline-flex items-center gap-1.5 min-w-0 pointer-events-none">
                        <Icon name={adj.icon} class="w-3.5 h-3.5 {adj.color} shrink-0" />
                        <span class="truncate text-[11.5px] font-semibold text-slate-700 dark:text-[#cfcfcf]">{adj.label}</span>
                      </span>
                      <output id={adj.outId} class="relative z-10 text-emerald-600 dark:text-[#e6e6e6] font-mono font-bold text-[11px] tabular-nums shrink-0 pointer-events-none">{adj.initOut}</output>
                      <input
                        id={adj.id}
                        type="range"
                        min={adj.min}
                        max={adj.max}
                        step={adj.step}
                        value={adj.val}
                        aria-label={adj.label}
                        class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0"
                      />
                    </div>
                  </div>
                {/each}
              </div>

              <!-- Passport Background Swatches & 1-Click Local Studio Cutout -->
              <div class="p-2.5 rounded-md bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#161618] space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-slate-700 dark:text-[#e6e6e6]">পাসপোর্ট ব্যাকগ্রাউন্ড ও কাটআউট</span>
                  <span id="ppBgColorLabel" class="text-[10px] font-mono text-sky-400">#0088FF</span>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap" id="ppBgSwatches">
                  <button type="button" data-bg="#0088ff" data-bg-name="vibrant studio passport sky blue (#0088FF)" aria-label="Studio Sky Blue" class="pp-swatch is-active w-6.5 h-6.5 rounded-md border-2 border-sky-500 bg-[#0088ff] shadow-2xs cursor-pointer" title="স্টুডিও স্কাই ব্লু (#0088FF)"></button>
                  <button type="button" data-bg="#0072ce" data-bg-name="official passport royal blue (#0072CE)" aria-label="Royal Blue" class="pp-swatch w-6.5 h-6.5 rounded-md border border-slate-400 bg-[#0072ce] shadow-2xs cursor-pointer" title="অফিসিয়াল পাসপোর্ট ব্লু (#0072CE)"></button>
                  <button type="button" data-bg="#ffffff" data-bg-name="pure solid white (#FFFFFF)" aria-label="Pure White" class="pp-swatch w-6.5 h-6.5 rounded-md border border-slate-400 bg-white shadow-2xs cursor-pointer" title="ধবধবে সাদা (#FFFFFF)"></button>
                  <button type="button" data-bg="#38bdf8" data-bg-name="light cyan blue (#38BDF8)" aria-label="Cyan Blue" class="pp-swatch w-6.5 h-6.5 rounded-md border border-slate-400 bg-[#38bdf8] shadow-2xs cursor-pointer" title="হালকা আকাশী (#38BDF8)"></button>
                  <button type="button" data-bg="#e2e8f0" data-bg-name="clean light studio grey (#E2E8F0)" aria-label="Studio Grey" class="pp-swatch w-6.5 h-6.5 rounded-md border border-slate-400 bg-[#e2e8f0] shadow-2xs cursor-pointer" title="স্টুডিও গ্রে (#E2E8F0)"></button>
                  <label class="relative w-6.5 h-6.5 rounded-md border border-dashed border-slate-400 flex items-center justify-center cursor-pointer overflow-hidden" title="কাস্টম রঙ">
                    <input type="color" id="ppBgColorInput" value="#0088ff" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                    <Icon name="lucide:pipette" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 pointer-events-none" />
                  </label>
                </div>

                <div class="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    id="ppAutoAiBgRemoveBtn"
                    class="flex-1 min-h-[30px] px-2.5 py-1 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5 shrink-0" />
                    <span>১-ক্লিকে ব্যাকগ্রাউন্ড রিমুভ (ফ্রি)</span>
                  </button>
                  <button
                    type="button"
                    id="ppResetCutoutBtn"
                    hidden
                    class="{psBtn} !px-2 !h-[30px] !text-amber-400"
                    title="কাটআউট রিসেট করুন"
                  >
                    <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div id="ppCutoutEdgeControls" hidden class="pt-1 flex items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-300">
                  <span class="shrink-0">চুলের প্রান্ত ফিদার:</span>
                  <input type="range" id="ppEdgeFeather" min="0" max="4" step="0.2" value="0.4" class="flex-1 h-1 accent-emerald-500" />
                  <strong id="ppEdgeFeatherVal" class="font-mono min-w-[28px] text-right">0.4px</strong>
                </div>
              </div>

              <!-- STUDIO SELFIE-TO-DSLR AI RETOUCH CARD -->
              <div class="p-2.5 rounded-md border border-indigo-500/35 bg-gradient-to-br from-indigo-500/12 via-violet-500/10 to-sky-500/10 space-y-1.5">
                <div class="flex items-center justify-between">
                  <strong class="text-[11.5px] font-extrabold text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1">
                    <Icon name="lucide:sparkles" class="w-3.5 h-3.5" />
                    <span>সেলফি → DSLR স্টুডিও ফটো (AI)</span>
                  </strong>
                  <span id="ppAutoAiBgStatusBadge" class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-extrabold">ফ্রি AI</span>
                </div>
                <p class="m-0 text-[10.5px] text-slate-600 dark:text-slate-300 leading-snug">
                  নিচ থেকে তোলা সেলফি সোজা করা, উল্টে থাকা কলার/ড্রেস ভাঁজ ও ইস্ত্রি করা, ন্যাচারাল DSLR স্কিন-চুল-দাড়ি ও স্টুডিও ব্লু ব্যাকগ্রাউন্ড:
                </p>
                <div class="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    id="ppOpenAiModalSideBtn"
                    class="flex-1 min-h-[32px] px-3 py-1 rounded-md bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[11.5px] font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Icon name="lucide:sparkles" class="w-3.5 h-3.5 shrink-0" />
                    <span>✨ Generate Studio Photo</span>
                  </button>
                  <button
                    type="button"
                    id="ppAiRevertBtn"
                    hidden
                    class="{psBtn} !h-[32px] !px-2 !text-amber-400"
                    title="মূল ছবিতে ফিরে যান (Revert AI)"
                  >
                    <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- TAB B: CUTOUT & BIOMETRIC OPTIONS -->
            <div id="ppInspectorTabBg" hidden class="space-y-2.5">
              <div class="p-2.5 rounded-md bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#161618] space-y-2">
                <strong class="text-[11.5px] font-bold text-slate-800 dark:text-white block">স্টুডিও মাস্ক ও ফটোশপ শর্টকাট</strong>
                <ul class="m-0 pl-4 text-[10.5px] text-slate-500 dark:text-slate-300 space-y-1 leading-relaxed">
                  <li><strong>C</strong>: ক্রপ ও বাইরে ড্র্যাগ রোটেশন (Enter = ক্রপ)</li>
                  <li><strong>V</strong>: সক্রিয় লেয়ার মুভ ও রিসাইজ (Arrow = নাজ)</li>
                  <li><strong>B / E</strong>: ব্রাশ ও মাস্ক ইরেজার (<strong>[ / ]</strong> সাইজ)</li>
                  <li><strong>I</strong>: কালার পিকার • <strong>H / Space</strong>: ক্যানভাস প্যান</li>
                  <li><strong>Z / Wheel</strong>: পুরো ক্যানভাস জুম (Ctrl+0 ফিট)</li>
                </ul>
                <button
                  type="button"
                  id="ppAutoFaceStraightenBtn"
                  class="{psBtn} w-full !h-7.5 justify-center font-semibold"
                >
                  <Icon name="lucide:scan-face" class="w-3.5 h-3.5 text-emerald-500" />
                  <span>মুখমণ্ডল অটো-সোজা করুন</span>
                </button>
                <label class="inline-flex items-center gap-2 pt-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" id="ppShowBorder" class="w-4 h-4 accent-sky-500 rounded" />
                  <span>ছবির চারপাশে পাসপোর্ট বর্ডার</span>
                </label>
              </div>
            </div>
          </div>

          <!-- LOWER DOCK: AUTHENTIC PHOTOSHOP LAYERS PANEL (EXACT DOCUMENTS-SCANNER #dsLayersSection) -->
          <section
            id="ppLayersSection"
            class="h-[212px] shrink-0 flex flex-col bg-slate-50 dark:bg-[#252525] border-t border-slate-300 dark:border-[#141414] overflow-hidden"
            aria-label="Photoshop Layers"
          >
            <div class="px-2 pt-1 bg-slate-200/75 dark:bg-[#1f1f1f] border-b border-slate-300/80 dark:border-black/50 flex items-end justify-between shrink-0">
              <div class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-t border border-b-0 border-slate-300/80 dark:border-white/10 bg-slate-50 dark:bg-[#2b2b2b] text-[11.5px] font-bold text-slate-800 dark:text-slate-100">
                <Icon name="lucide:layers" class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Layers</span>
                <span id="ppLayerCount" class="px-1.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-extrabold tabular-nums">1</span>
              </div>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 pb-1 pr-1">RGB / 8</span>
            </div>

            <!-- Blend Mode + Opacity + Lock Sub-Header -->
            <div class="px-2 py-1 bg-slate-100 dark:bg-[#2b2b2b] border-b border-slate-200 dark:border-black/40 flex items-center gap-1.5 shrink-0">
              <select id="ppLayerBlendMode" class="{psSel} w-[92px] !h-6 !text-[11px]" title="Layer Blend Mode">
                <option value="source-over" selected>Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
              </select>
              <label class="inline-flex items-center gap-1 ml-auto shrink-0" title="Active Layer Opacity">
                <span class="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Opacity:</span>
                <input id="ppLayerOpacity" type="number" min="0" max="100" step="5" value="100" class="{psNum} w-[46px] !h-6 !text-[11px]" />
                <span class="text-[10.5px] text-slate-400">%</span>
              </label>
              <button
                type="button"
                id="ppLayerLockBtn"
                aria-pressed="false"
                class="w-6 h-6 inline-flex items-center justify-center rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#383838] text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#454545] aria-pressed:bg-amber-500/20 aria-pressed:text-amber-400"
                title="Lock / Unlock Active Layer"
              >
                <Icon name="lucide:lock" class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Interactive Layer Stack List -->
            <div
              id="ppLayerList"
              class="flex-1 min-h-0 overflow-y-auto p-1 flex flex-col gap-0.5 bg-slate-200/55 dark:bg-[#1e1e1e] [scrollbar-width:thin]"
              role="listbox"
              aria-label="Passport Photo Layers"
            ></div>

            <!-- Photoshop Layer Action Footer Bar (Matches Photoshop CC & DocumentScanner) -->
            <div class="h-[26px] px-2 bg-slate-100 dark:bg-[#252526] border-t border-slate-300/80 dark:border-[#141414] flex items-center justify-end gap-1 shrink-0">
              <button
                type="button"
                id="ppLayerAddBgCutoutBtn"
                class="w-6 h-5 rounded inline-flex items-center justify-center text-slate-600 dark:text-[#bdbdbd] hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
                title="১-ক্লিকে ব্যাকগ্রাউন্ড রিমুভ ও কাটআউট লেয়ার তৈরি করুন"
              >
                <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="ppLayerAddAdjBtn"
                class="w-6 h-5 rounded inline-flex items-center justify-center text-slate-600 dark:text-[#bdbdbd] hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
                title="নতুন কালার ও লাইট অ্যাডজাস্টমেন্ট লেয়ার (Adjustment Layer)"
              >
                <Icon name="lucide:contrast" class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="ppLayerAddPaintBtn"
                class="w-6 h-5 rounded inline-flex items-center justify-center text-slate-600 dark:text-[#bdbdbd] hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
                title="নতুন ব্রাশ রিটাচ লেয়ার যোগ করুন (New Layer)"
              >
                <Icon name="lucide:square-plus" class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="ppLayerDeleteBtn"
                class="w-6 h-5 rounded inline-flex items-center justify-center text-slate-600 dark:text-[#bdbdbd] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                title="সক্রিয় লেয়ার মুছুন বা রিসেট করুন (Delete Layer)"
              >
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          <!-- STEP 1 STICKY FOOTER: SINGLE JPG + PRIMARY "PRINT READY ->" BUTTON -->
          <div class="p-2.5 border-t border-slate-300 dark:border-[#141414] bg-slate-100 dark:bg-[#1f1f1f] flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="ppDownloadSingleBtn"
              class="{psBtn} !h-9 !px-3 font-bold"
              title="শুধু সিঙ্গেল পাসপোর্ট ছবি JPG ডাউনলোড করুন"
            >
              <Icon name="lucide:download" class="w-4 h-4 text-sky-500 shrink-0" />
              <span>সিঙ্গেল JPG</span>
            </button>
            <button
              type="button"
              id="ppGoPrintReadyBtn"
              class="flex-1 min-h-[36px] px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[12.5px] font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.99]"
            >
              <Icon name="lucide:printer" class="w-4 h-4 shrink-0" />
              <span>প্রিন্ট রেডি (Print Sheet)</span>
              <Icon name="lucide:arrow-right" class="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        <!-- ==================== STEP 2 RIGHT DOCK: PRINT SHEET LAYOUT & DIRECT PRINT ==================== -->
        <div id="ppRightPrintDock" class="hidden group-data-[step=print]/pp:flex flex-1 min-h-0 flex-col overflow-hidden bg-white dark:bg-[#252526]">
          <div class="h-9.5 px-3 border-b border-slate-200 dark:border-[#181818] bg-slate-100 dark:bg-[#1f1f1f] flex items-center justify-between shrink-0">
            <strong class="text-[12px] font-extrabold text-slate-800 dark:text-white inline-flex items-center gap-1.5">
              <Icon name="lucide:layout-grid" class="w-4 h-4 text-emerald-500" />
              <span>প্রিন্ট শিট সেটআপ ও লেআউট</span>
            </strong>
            <span class="text-[10.5px] font-mono text-emerald-500 font-bold">300 DPI</span>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
            <div class="space-y-1">
              <label for="ppSheetPaper" class="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 block">প্রিন্ট পেপার সাইজ (Paper Size)</label>
              <select id="ppSheetPaper" class="w-full h-9 px-2.5 rounded-lg border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#1f1f1f] text-[12px] font-semibold text-slate-800 dark:text-white">
                <option value="a4" selected>A4 পেপার (210 × 297 mm)</option>
                <option value="4r">4R ল্যাব ফটো পেপার (4 × 6 inch)</option>
                <option value="5r">5R ফটো পেপার (5 × 7 inch)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label for="ppCopiesCount" class="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 block">এক পেজে কয়টি ছবি বসবে? (Copies)</label>
              <div class="grid grid-cols-4 gap-1.5" id="ppCopiesQuickPills">
                {#each [
                  { v: '2', l: '২ কপি' },
                  { v: '4', l: '৪ কপি' },
                  { v: '6', l: '৬ কপি' },
                  { v: '8', l: '৮ কপি' },
                  { v: '12', l: '১২ কপি' },
                  { v: '16', l: '১৬ কপি' },
                  { v: '20', l: '২০ কপি' },
                  { v: 'combo', l: '৮+১২ কম্বো' }
                ] as cp}
                  <button
                    type="button"
                    data-pp-copy-pill={cp.v}
                    aria-pressed={cp.v === '8' ? 'true' : 'false'}
                    class="h-8 rounded-lg border border-slate-300 dark:border-[#141414] bg-slate-50 dark:bg-[#1f1f1f] text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition aria-pressed:bg-emerald-600 aria-pressed:text-white aria-pressed:border-emerald-500"
                  >{cp.l}</button>
                {/each}
              </div>
              <select id="ppCopiesCount" class="sr-only">
                <option value="2">২ কপি</option>
                <option value="4">৪ কপি</option>
                <option value="6">৬ কপি</option>
                <option value="8" selected>৮ কপি</option>
                <option value="12">১২ কপি</option>
                <option value="16">১৬ কপি</option>
                <option value="20">২০ কপি</option>
                <option value="combo">কম্বো (৮ পাসপোর্ট + ১২ স্ট্যাম্প)</option>
              </select>
            </div>

            <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#141414] space-y-2.5">
              <div class="space-y-0.5">
                <div class="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>ছবির মাঝের ফাঁকা স্থান (Gap)</span>
                  <strong id="ppSheetGapVal" class="font-mono">42 px</strong>
                </div>
                <input type="range" id="ppSheetGap" min="10" max="90" value="42" class="w-full h-1.5 accent-emerald-500 cursor-pointer" />
              </div>

              <div class="space-y-0.5">
                <div class="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>উপরের মার্জিন (Top Margin)</span>
                  <strong id="ppSheetMarginVal" class="font-mono">96 px</strong>
                </div>
                <input type="range" id="ppSheetMargin" min="24" max="220" value="96" class="w-full h-1.5 accent-emerald-500 cursor-pointer" />
              </div>

              <label class="inline-flex items-center gap-2 pt-1 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" id="ppPrintCutMarks" checked class="w-4 h-4 accent-emerald-500 rounded" />
                <span>কাটিং মার্কস ও বর্ডার দেখান</span>
              </label>
            </div>
          </div>

          <div class="p-3 border-t border-slate-300 dark:border-[#141414] bg-slate-100 dark:bg-[#1f1f1f] space-y-2 shrink-0">
            <button
              type="button"
              id="ppPrintSheetBtn"
              class="w-full min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[13px] font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Icon name="lucide:printer" class="w-4 h-4 shrink-0" />
              <span>সরাসরি প্রিন্ট করুন (Print Now)</span>
            </button>

            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="ppDownloadSheetBtn"
                class="{btnBase} {btnPrimary} min-h-[34px] text-[11.5px]"
              >
                <Icon name="lucide:download" class="w-3.5 h-3.5 shrink-0" />
                <span>শিট JPG ডাউনলোড</span>
              </button>
              <button
                type="button"
                id="ppDownloadPdfBtn"
                class="{btnBase} min-h-[34px] text-[11.5px] font-bold"
              >
                <Icon name="lucide:file-down" class="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>প্রিন্ট PDF ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <!-- =========================================================================
       DEDICATED "GENERATE WITH AI — SELFIE TO STUDIO DSLR" MODAL DIALOG
       ========================================================================= -->
  <dialog
    id="ppAiStudioDialog"
    class="w-[min(660px,95vw)] max-h-[92dvh] border border-slate-300 dark:border-[#383838] rounded-2xl bg-white dark:bg-[#252526] text-slate-900 dark:text-white p-0 shadow-2xl backdrop:bg-slate-950/75 backdrop:backdrop-blur-xs overflow-hidden"
    aria-labelledby="ppAiModalTitle"
  >
    <div class="flex flex-col max-h-[92dvh]">
      <div class="px-4 py-3 bg-slate-100 dark:bg-[#1f1f1f] border-b border-slate-200 dark:border-[#141414] flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 inline-flex items-center justify-center">
            <Icon name="lucide:sparkles" class="w-4 h-4" />
          </span>
          <div>
            <h3 id="ppAiModalTitle" class="m-0 text-[14px] font-extrabold leading-tight">Generate Studio DSLR Photo — সেলফি থেকে প্রফেশনাল স্টুডিও পাসপোর্ট</h3>
            <p class="m-0 text-[11px] text-slate-500 dark:text-slate-400">মুখ ১০০% হুবহু রেখে কলার/ড্রেস ফিট, সেলফি অ্যাঙ্গেল সোজা, চুল-দাড়ি ও DSLR লাইটিং</p>
          </div>
        </div>
        <button
          type="button"
          id="ppAiModalCloseBtn"
          class="w-7 h-7 rounded-lg bg-slate-200/70 dark:bg-[#383838] hover:bg-rose-500 hover:text-white inline-flex items-center justify-center text-[13px] font-bold cursor-pointer transition"
        >✕</button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 text-[12px]">
        <!-- 1. AI Engine Selection -->
        <div class="p-3 rounded-xl border border-indigo-200 dark:border-[#383838] bg-slate-50 dark:bg-[#1e1e1e] space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-[11.5px] inline-flex items-center gap-1.5">
              <Icon name="lucide:cpu" class="w-3.5 h-3.5 text-indigo-400" />
              <span>AI ইঞ্জিন নির্বাচন</span>
            </span>
            <span id="ppApiStatusBadge" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">১০০% ফ্রি রেডি ✓</span>
          </div>

          <div class="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-[#2b2b2b]" id="ppAiProviderTabs">
            <button type="button" data-ai-provider="free-flux" aria-pressed="true" class="h-7 rounded-md text-[11px] font-extrabold cursor-pointer text-slate-700 dark:text-slate-300 aria-pressed:bg-emerald-600 aria-pressed:text-white">⚡ ফ্রি AI (FLUX)</button>
            <button type="button" data-ai-provider="gemini" aria-pressed="false" class="h-7 rounded-md text-[11px] font-bold cursor-pointer text-slate-700 dark:text-slate-300 aria-pressed:bg-indigo-600 aria-pressed:text-white">Gemini</button>
            <button type="button" data-ai-provider="grok" aria-pressed="false" class="h-7 rounded-md text-[11px] font-bold cursor-pointer text-slate-700 dark:text-slate-300 aria-pressed:bg-indigo-600 aria-pressed:text-white">Grok</button>
            <button type="button" data-ai-provider="openai" aria-pressed="false" class="h-7 rounded-md text-[11px] font-bold cursor-pointer text-slate-700 dark:text-slate-300 aria-pressed:bg-indigo-600 aria-pressed:text-white">OpenAI</button>
          </div>

          <div id="ppFreeFluxBanner" class="text-[11px] text-emerald-700 dark:text-emerald-300 leading-snug">
            ✨ <strong>API Key ছাড়াই ১০০% ফ্রি FLUX.1 Kontext Studio AI!</strong> নিচের <em>"বর্তমান শার্ট ও কলার স্টুডিও ফিট"</em> প্রিসেটটি মোবাইল সেলফিকে সরাসরি স্টুডিও DSLR ছবিতে রূপান্তর করে।
          </div>

          <div class="flex items-center gap-1.5">
            <div class="relative flex-1 min-w-0">
              <input
                type="password"
                id="ppApiKeyInput"
                placeholder="ঐচ্ছিক ফ্রি HF Token (hf_...) — না দিলেও ফ্রি চলবে"
                autocomplete="off"
                class="w-full h-8 pl-2.5 pr-7 rounded-lg border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] text-[11px] font-mono"
              />
              <button type="button" id="ppApiKeyToggleBtn" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                <Icon name="lucide:eye" class="w-3.5 h-3.5" />
              </button>
            </div>
            <button type="button" id="ppApiSaveBtn" class="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer">সেভ</button>
            <button type="button" id="ppApiClearBtn" class="h-8 px-2 rounded-lg text-rose-500 hover:bg-rose-500/10 text-[11px] font-semibold cursor-pointer">রিসেট</button>
          </div>

          <div id="ppGeminiModelWrap" hidden class="flex items-center gap-2 text-[11px]">
            <span class="font-semibold">Gemini মডেল:</span>
            <select id="ppGeminiModelSelect" class="flex-1 h-7 px-2 rounded border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] font-mono text-[11px]">
              <option value="auto">Auto (সেরা উপলব্ধ ইমেজ মডেল)</option>
              <option value="gemini-3.1-flash-image">gemini-3.1-flash-image</option>
              <option value="gemini-2.5-flash-image">gemini-2.5-flash-image</option>
              <option value="gemini-nano-banana-2.1">gemini-nano-banana-2.1</option>
            </select>
          </div>

          <div id="ppApiDiagBanner" hidden class="p-2 rounded-lg border text-[11px] leading-relaxed"></div>

          <a id="ppGetApiKeyLink" href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" class="text-[10.5px] text-indigo-500 hover:underline inline-flex items-center gap-1">
            <Icon name="lucide:external-link" class="w-3 h-3" />
            <span id="ppGetApiKeyText">ঐচ্ছিক: ফ্রি HuggingFace Token নিন</span>
          </a>
        </div>

        <!-- 2. Subject Category -->
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838]" id="ppAiCategoryTabs">
          <button type="button" data-ai-cat="male" aria-pressed="true" class="h-8 rounded-lg text-[11.5px] font-bold cursor-pointer text-slate-600 dark:text-slate-300 aria-pressed:bg-sky-600 aria-pressed:text-white">👨 ছেলেদের ছবি</button>
          <button type="button" data-ai-cat="female" aria-pressed="false" class="h-8 rounded-lg text-[11.5px] font-bold cursor-pointer text-slate-600 dark:text-slate-300 aria-pressed:bg-pink-600 aria-pressed:text-white">👩 মেয়েদের ছবি</button>
          <button type="button" data-ai-cat="general" aria-pressed="false" class="h-8 rounded-lg text-[11.5px] font-bold cursor-pointer text-slate-600 dark:text-slate-300 aria-pressed:bg-emerald-600 aria-pressed:text-white">📷 সাধারণ</button>
        </div>

        <!-- 3. Granular DSLR Portrait Customization -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] space-y-1 block">
            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Icon name="lucide:scan-face" class="w-3.5 h-3.5 text-emerald-500" />
              <span>ক্যামেরা ও সেলফি অ্যাঙ্গেল (85mm DSLR)</span>
            </span>
            <select id="ppAiHeadMode" class="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] text-[11.5px] font-semibold">
              <option value="straighten" selected>নিচ থেকে তোলা সেলফি আই-লেভেল সোজা করুন</option>
              <option value="eye-contact">সোজা তাকানো ও কাঁধ সমান করুন</option>
              <option value="keep">যেমন ভঙ্গি আছে তেমনই রাখুন</option>
            </select>
          </label>

          <label class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] space-y-1 block">
            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Icon name="lucide:scissors" class="w-3.5 h-3.5 text-pink-500" />
              <span>চুল সেটআপ (Hair Clarity &amp; Groom)</span>
            </span>
            <select id="ppAiHairMode" class="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] text-[11.5px] font-semibold">
              <option value="trim-flyaway" selected>আসল চুলের স্টাইল রেখে উড়ন্ত চুল নিখুঁত করুন</option>
              <option value="keep">ঠিক যেমন আছে তেমন রাখুন</option>
              <option value="neat-comb">পরিপাটি আঁচড়ানো ফরমাল চুল</option>
            </select>
          </label>

          <label class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] space-y-1 block">
            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Icon name="lucide:sun" class="w-3.5 h-3.5 text-amber-500" />
              <span>স্টুডিও লাইটিং ও স্কিন টেক্সচার</span>
            </span>
            <select id="ppAiSkinMode" class="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] text-[11.5px] font-semibold">
              <option value="studio-hd" selected>DSLR সফটবক্স লাইট, চোখ ও ন্যাচারাল স্কিন পোরস</option>
              <option value="blemish-free">ঘোলা ভাব, ব্রণ ও ছায়া দূর করে উজ্জ্বল করুন</option>
              <option value="keep">আসল স্কিন রাখুন</option>
            </select>
          </label>

          <label class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] space-y-1 block">
            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
              <Icon name="lucide:user" class="w-3.5 h-3.5 text-sky-500" />
              <span>দাড়ি ও গোঁফ (Beard Detail)</span>
            </span>
            <select id="ppAiBeardMode" class="w-full h-8 px-2 rounded-lg border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] text-[11.5px] font-semibold">
              <option value="keep" selected>আসল দাড়ি রেখে শার্প ও পরিপাটি করুন</option>
              <option value="trimmed">সুন্দরভাবে ট্রিম করা দাড়ি</option>
              <option value="clean">ক্লিন শেভ (Clean Shaven)</option>
              <option value="none">প্রযোজ্য নয়</option>
            </select>
          </label>
        </div>

        <!-- 4. Dress / Outfit Selection -->
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[11.5px] font-bold inline-flex items-center gap-1.5">
              <Icon name="lucide:shirt" class="w-4 h-4 text-indigo-500" />
              <span>পোশাক: বর্তমান শার্টের কলার ঠিক করবেন নাকি নতুন স্যুট পরাবেন?</span>
            </span>
          </div>
          <div id="ppAiPresetList" class="grid grid-cols-2 sm:grid-cols-3 gap-1.5"></div>
        </div>

        <!-- 5. Backdrop Color -->
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] flex items-center justify-between gap-2 flex-wrap">
          <span class="text-[11.5px] font-bold inline-flex items-center gap-1.5">
            <Icon name="lucide:palette" class="w-4 h-4 text-sky-500" />
            <span>স্টুডিও ব্যাকগ্রাউন্ড কালার:</span>
          </span>
          <div class="flex items-center gap-1.5" id="ppModalBgSwatches">
            <button type="button" data-modal-bg="#0088ff" data-bg-name="vibrant studio passport sky blue (#0088FF)" class="w-6.5 h-6.5 rounded-md border-2 border-sky-500 bg-[#0088ff] cursor-pointer" title="স্টুডিও স্কাই ব্লু (#0088FF)"></button>
            <button type="button" data-modal-bg="#0072ce" data-bg-name="official passport royal blue (#0072CE)" class="w-6.5 h-6.5 rounded-md border border-slate-400 bg-[#0072ce] cursor-pointer" title="পাসপোর্ট নীল (#0072CE)"></button>
            <button type="button" data-modal-bg="#ffffff" data-bg-name="pure solid white (#FFFFFF)" class="w-6.5 h-6.5 rounded-md border border-slate-400 bg-white cursor-pointer" title="সাদা (#FFFFFF)"></button>
            <button type="button" data-modal-bg="#38bdf8" data-bg-name="light sky blue (#38BDF8)" class="w-6.5 h-6.5 rounded-md border border-slate-400 bg-[#38bdf8] cursor-pointer" title="হালকা নীল (#38BDF8)"></button>
            <button type="button" data-modal-bg="#e2e8f0" data-bg-name="clean light studio grey (#E2E8F0)" class="w-6.5 h-6.5 rounded-md border border-slate-400 bg-[#e2e8f0] cursor-pointer" title="স্টুডিও গ্রে (#E2E8F0)"></button>
          </div>
        </div>

        <!-- 6. Editable Prompt -->
        <details class="rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] p-2.5">
          <summary class="text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer flex items-center justify-between">
            <span>অ্যাডভান্সড কাস্টম প্রম্পট (Editable AI Prompt)</span>
            <span class="text-[10px] text-indigo-400">দেখুন / এডিট করুন ▾</span>
          </summary>
          <div class="pt-2 space-y-1.5">
            <textarea
              id="ppAiPromptInput"
              rows="4"
              class="w-full p-2 rounded-lg border border-slate-300 dark:border-[#383838] bg-white dark:bg-[#2b2b2b] text-[11px] leading-relaxed resize-y"
            ></textarea>
            <div class="flex justify-end gap-1.5">
              <button type="button" id="ppAiCopyPromptBtn" class={psBtn}>কপি</button>
              <button type="button" id="ppAiResetPromptBtn" class={psBtn}>রিসেট</button>
            </div>
          </div>
        </details>
      </div>

      <!-- Modal Footer -->
      <div class="px-4 py-3 bg-slate-100 dark:bg-[#1f1f1f] border-t border-slate-200 dark:border-[#141414] flex items-center justify-end gap-2 shrink-0">
        <button type="button" id="ppAiModalCancelBtn" class="{psBtn} !h-9 !px-3.5">বাতিল</button>
        <button
          type="button"
          id="ppAiGenerateBtn"
          class="min-h-[36px] px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[12.5px] font-extrabold shadow-md flex items-center gap-2 cursor-pointer transition"
        >
          <Icon name="lucide:sparkles" class="w-4 h-4 shrink-0" />
          <span>✨ স্টুডিও ফটো জেনারেট করুন</span>
        </button>
      </div>
    </div>
  </dialog>
</section>

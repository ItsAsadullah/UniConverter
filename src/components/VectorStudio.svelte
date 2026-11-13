<script lang="ts">
  import Icon from './ui/Icon.svelte';

  interface Props {
    hidden?: boolean;
  }
  let { hidden = true }: Props = $props();

  const dockGroups = [
    { id: 'move', tools: [{ id: 'move', name: 'Move & Pan Tool', key: 'V', icon: 'lucide:move' }] },
    {
      id: 'marquee',
      tools: [
        { id: 'marquee-rect', name: 'Rectangular Marquee Tool', key: 'M', icon: 'lucide:square-dashed' },
        { id: 'marquee-ellipse', name: 'Elliptical Marquee Tool', key: 'M', icon: 'lucide:ellipse-dashed' }
      ]
    },
    {
      id: 'lasso',
      tools: [
        { id: 'lasso', name: 'Lasso Tool', key: 'L', icon: 'lucide:lasso' },
        { id: 'lasso-poly', name: 'Polygonal Lasso Tool', key: 'L', icon: 'lucide:lasso-polygon' }
      ]
    },
    {
      id: 'wand',
      sep: true,
      tools: [
        { id: 'wand', name: 'Magic Wand Background Eraser', key: 'W', icon: 'lucide:wand-sparkles' },
        { id: 'picker', name: 'Eyedropper Tool', key: 'I', icon: 'lucide:pipette' }
      ]
    },
    { id: 'heal', tools: [{ id: 'heal', name: 'Spot Healing Brush Tool', key: 'J', icon: 'lucide:bandage' }] },
    { id: 'brush', tools: [{ id: 'brush', name: 'Brush Tool', key: 'B', icon: 'lucide:paintbrush' }] },
    { id: 'eraser', tools: [{ id: 'eraser', name: 'Transparent Eraser Tool', key: 'E', icon: 'lucide:eraser' }] },
    { id: 'clone', tools: [{ id: 'clone', name: 'Clone Stamp Tool', key: 'S', icon: 'lucide:stamp' }] },
    {
      id: 'dodge',
      tools: [
        { id: 'dodge', name: 'Dodge Tool (Lighten)', key: 'O', icon: 'lucide:dodge' },
        { id: 'burn', name: 'Burn Tool (Darken)', key: 'O', icon: 'lucide:burn' }
      ]
    },
    { id: 'text', sep: true, tools: [{ id: 'text', name: 'Horizontal Type Tool', key: 'T', icon: 'lucide:type' }] },
    { id: 'hand', sep: true, tools: [{ id: 'hand', name: 'Hand Tool', key: 'H', icon: 'lucide:hand' }] },
    { id: 'zoom', tools: [{ id: 'zoom', name: 'Zoom Tool', key: 'Z', icon: 'lucide:zoom-in' }] }
  ];

  const fontList = [
    'Kalpurush',
    'SolaimanLipi',
    'Nikosh',
    'Siyam Rupali',
    'Noto Sans Bengali',
    'Hind Siliguri',
    'SutonnyMJ',
    'Inter',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana'
  ];

  const txtAligns = [
    { id: 'left', icon: 'lucide:align-left', tip: 'Left Align Text' },
    { id: 'center', icon: 'lucide:align-center', tip: 'Center Text' },
    { id: 'right', icon: 'lucide:align-right', tip: 'Right Align Text' }
  ];

  const selModes = [
    { id: 'new', icon: 'lucide:sel-new', tip: 'New Selection' },
    { id: 'add', icon: 'lucide:sel-add', tip: 'Add to Selection (Shift)' },
    { id: 'sub', icon: 'lucide:sel-sub', tip: 'Subtract from Selection (Alt)' },
    { id: 'int', icon: 'lucide:sel-int', tip: 'Intersect with Selection' }
  ];

  const vectorPresets = [
    {
      value: 'auto',
      icon: 'sparkles',
      titleBn: 'ওয়ান-ক্লিক অটো (স্মার্ট AI)',
      titleEn: 'One-Click Auto (Smart AI)',
      descBn: 'ছবি বিশ্লেষণ করে সেরা সেটিং নিজেই বেছে নেয়',
      descEn: 'Analyses the image and picks the best settings',
      ai: true
    },
    {
      value: 'logo_hd',
      icon: 'wand-sparkles',
      titleBn: 'লোগো ও আইকন HD (Full Color)',
      titleEn: 'Logo & Icon HD (Full Color)',
      descBn: 'শার্প এজ ও নিখুঁত কালার লেয়ার',
      descEn: 'Sharp edges & clean color layers',
      ai: false
    },
    {
      value: 'mono_logo',
      icon: 'pentagon',
      titleBn: 'শার্প আইকন / সিল (Mono)',
      titleEn: 'Sharp Icon / Stamp (Mono)',
      descBn: 'এক রঙের লোগো ও আইকন',
      descEn: 'Crisp monochrome logo & icon',
      ai: false
    },
    {
      value: 'flat_icon',
      icon: 'layers',
      titleBn: 'ফ্ল্যাট আইকন ও ব্যাজ',
      titleEn: 'Flat Icon & Badge',
      descBn: 'মসৃণ কার্ভ ও গ্যাপ-মুক্ত স্ট্যাক',
      descEn: 'Smooth curves & gap-free stack',
      ai: false
    },
    {
      value: 'line_art',
      icon: 'pen-tool',
      titleBn: 'স্বাক্ষর ও লাইন আর্ট',
      titleEn: 'Signature & Line Art',
      descBn: 'সূক্ষ্ম রেখা ও ক্যালিগ্রাফি',
      descEn: 'Fine ink strokes & calligraphy',
      ai: false
    },
    {
      value: 'detailed_art',
      icon: 'palette',
      titleBn: 'ডিটেইলড আর্ট (২৪ রং)',
      titleEn: 'Detailed Art (24 Colors)',
      descBn: 'ইলাস্ট্রেশন ও জটিল লোগো',
      descEn: 'Rich multi-color illustration',
      ai: false
    },
    {
      value: 'sharp_geo',
      icon: 'hexagon',
      titleBn: 'জিওমেট্রিক লোগো',
      titleEn: 'Geometric Logo',
      descBn: 'তীক্ষ্ণ কর্নার ও টেক আইকন',
      descEn: 'Sharp corners & tech badges',
      ai: false
    }
  ];

  const adjustments = [
    { key: 'colors', id: 'vsColors', icon: 'lucide:palette', color: 'text-violet-600 dark:text-violet-400', bn: 'রঙের সংখ্যা', en: 'Colors', outId: 'vsColorsLabel', initVal: '12', min: 2, max: 128, step: 1, val: 12, initPct: 7.9 },
    { key: 'tolerance', id: 'vsTolerance', icon: 'lucide:spline', color: 'text-emerald-600 dark:text-emerald-400', bn: 'স্মুথনেস', en: 'Smoothness', outId: 'vsToleranceValue', initVal: '1.0', min: 1, max: 50, step: 1, val: 10, initPct: 18.4 },
    { key: 'corner', id: 'vsCorner', icon: 'lucide:triangle', color: 'text-amber-500 dark:text-amber-400', bn: 'কর্নার শার্পনেস', en: 'Corner Angle', outId: 'vsCornerValue', initVal: '60°', min: 20, max: 160, step: 1, val: 60, initPct: 28.6 },
    { key: 'minArea', id: 'vsMinArea', icon: 'lucide:sparkles', color: 'text-rose-500 dark:text-rose-400', bn: 'স্পেকল ক্লিন', en: 'Speckle px', outId: 'vsMinAreaValue', initVal: '8px', min: 0, max: 200, step: 1, val: 8, initPct: 4 },
    { key: 'bgTol', id: 'vsBgTol', icon: 'lucide:eraser', color: 'text-cyan-600 dark:text-cyan-400', bn: 'BG টলারেন্স', en: 'BG Tolerance', outId: 'vsBgTolValue', initVal: '15%', min: 0, max: 100, step: 1, val: 15, initPct: 15 },
    { key: 'scale', id: 'vsScale', icon: 'lucide:maximize-2', color: 'text-blue-600 dark:text-blue-400', bn: 'স্কেল / HD', en: 'Scale (%)', outId: 'vsScaleValue', initVal: '100%', min: 25, max: 300, step: 5, val: 100, initPct: 27.3 },
    { key: 'contrast', id: 'vsContrast', icon: 'lucide:contrast', color: 'text-indigo-600 dark:text-indigo-400', bn: 'কনট্রাস্ট', en: 'Contrast', outId: 'vsContrastValue', initVal: '15', min: -100, max: 100, step: 1, val: 15, initPct: 57.5 },
    { key: 'brightness', id: 'vsBrightness', icon: 'lucide:sun-medium', color: 'text-orange-500 dark:text-orange-400', bn: 'ব্রাইটনেস', en: 'Brightness', outId: 'vsBrightnessValue', initVal: '0', min: -100, max: 100, step: 1, val: 0, initPct: 50 }
  ];

  // Adobe Illustrator Image Trace — quick preset icons (top row)
  const itQuick = [
    { id: 'auto', icon: 'lucide:sparkles', bn: 'অটো কালার', en: 'Auto Color' },
    { id: 'ai_high_photo', icon: 'lucide:camera', bn: 'হাই কালার', en: 'High Color' },
    { id: 'ai_low_photo', icon: 'lucide:layout-grid', bn: 'লো কালার', en: 'Low Color' },
    { id: 'ai_gray', icon: 'lucide:droplet', bn: 'গ্রেস্কেল', en: 'Grayscale' },
    { id: 'ai_default', icon: 'lucide:contrast', bn: 'সাদা-কালো', en: 'Black and White' },
    { id: 'ai_line_art', icon: 'lucide:pencil', bn: 'আউটলাইন', en: 'Outline' }
  ];

  const itPresetGroups = [
    {
      label: 'Adobe Illustrator',
      items: [
        { v: 'ai_default', t: 'Default (ডিফল্ট)' },
        { v: 'ai_high_photo', t: 'High Fidelity Photo' },
        { v: 'ai_low_photo', t: 'Low Fidelity Photo' },
        { v: 'ai_3_colors', t: '3 Colors' },
        { v: 'ai_6_colors', t: '6 Colors' },
        { v: 'ai_16_colors', t: '16 Colors' },
        { v: 'ai_gray', t: 'Shades of Gray' },
        { v: 'ai_bw_logo', t: 'Black and White Logo' },
        { v: 'ai_sketch', t: 'Sketched Art' },
        { v: 'ai_silhouette', t: 'Silhouettes' },
        { v: 'ai_line_art', t: 'Line Art' },
        { v: 'ai_technical', t: 'Technical Drawing' }
      ]
    },
    {
      label: 'TechHat Logo HD',
      items: [
        { v: 'auto', t: 'One-Click Auto (স্মার্ট)' },
        { v: 'logo_hd', t: 'Logo & Icon HD' },
        { v: 'mono_logo', t: 'Sharp Icon / Stamp' },
        { v: 'flat_icon', t: 'Flat Icon & Badge' },
        { v: 'line_art', t: 'Signature & Line Art' },
        { v: 'detailed_art', t: 'Detailed Art (24)' },
        { v: 'sharp_geo', t: 'Geometric Logo' }
      ]
    }
  ];

  const itViews = [
    { v: 'split', t: 'Before / After (তুলনা)' },
    { v: 'result', t: 'Tracing Result' },
    { v: 'result-outlines', t: 'Tracing Result with Outlines' },
    { v: 'outlines', t: 'Outlines' },
    { v: 'outlines-source', t: 'Outlines with Source Image' },
    { v: 'source', t: 'Source Image' }
  ];

  // Illustrator-style slider rows: [id, bn, en, min, max, step, value, unit, showWhen]
  const itSliders = [
    { id: 'itColors', bn: 'রং', en: 'Colors', min: 2, max: 128, step: 1, val: 12, unit: '', when: 'color', lo: 'কম', hi: 'বেশি' },
    { id: 'itGrays', bn: 'গ্রে', en: 'Grays', min: 2, max: 128, step: 1, val: 12, unit: '', when: 'gray', lo: 'কম', hi: 'বেশি' },
    { id: 'itThreshold', bn: 'থ্রেশহোল্ড', en: 'Threshold', min: 0, max: 255, step: 1, val: 128, unit: '', when: 'mono', lo: 'কম', hi: 'বেশি' }
  ];
  const itAdvSliders = [
    { id: 'itPaths', bn: 'পাথ', en: 'Paths', min: 0, max: 100, step: 1, val: 50, unit: '%', lo: 'Low', hi: 'High' },
    { id: 'itCorners', bn: 'কর্নার', en: 'Corners', min: 0, max: 100, step: 1, val: 75, unit: '%', lo: 'Less', hi: 'More' },
    { id: 'itNoise', bn: 'নয়েজ', en: 'Noise', min: 1, max: 200, step: 1, val: 8, unit: 'px', lo: '1', hi: '200' }
  ];

  const psBtn =
    'inline-flex items-center justify-center gap-1 h-[25px] px-2 rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#383838] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-slate-700 dark:text-[#e6e6e6] text-[11.5px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-[#464646] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0';
  const psSel =
    'h-[25px] px-1.5 rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#1f1f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-slate-800 dark:text-[#e6e6e6] text-[11.5px] font-medium cursor-pointer outline-none focus:border-sky-500 shrink-0';
  const psLbl = 'text-[11.5px] font-medium text-slate-600 dark:text-[#cfcfcf] whitespace-nowrap shrink-0 select-none';
  const psSep = 'w-px h-4.5 bg-slate-300 dark:bg-white/12 mx-0.5 shrink-0';
  const psPod =
    'relative h-[25px] rounded-[3px] bg-white dark:bg-[#1f1f1f] border border-slate-300 dark:border-[#141414] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] inline-flex items-center justify-between gap-1 px-2 overflow-hidden select-none shrink-0 hover:border-slate-400 dark:hover:border-white/25';

  const btnBase =
    'inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-800 dark:text-studio-text text-[12.5px] font-semibold leading-none whitespace-nowrap cursor-pointer transition-colors duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-300 dark:hover:enabled:border-slate-600 hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 min-h-[34px] px-3.5 py-1.5 rounded-lg border border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-[13px] font-bold leading-none whitespace-nowrap cursor-pointer shadow-2xs transition-colors duration-100 hover:enabled:bg-emerald-700 dark:hover:enabled:bg-emerald-400 hover:enabled:border-emerald-700 dark:hover:enabled:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnIcon =
    'inline-flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] p-0 rounded-md border border-transparent bg-transparent text-slate-700 dark:text-studio-text cursor-pointer transition-all duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-200/80 dark:hover:enabled:border-studio-border hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
</script>

<section
  class="img-pane th-nid-studio ds group/ds relative w-full text-slate-900 dark:text-studio-text antialiased select-none [&_[hidden]]:!hidden data-[has-pages=true]:lg:fixed data-[has-pages=true]:lg:inset-x-0 data-[has-pages=true]:lg:top-12 data-[has-pages=true]:lg:bottom-0 data-[has-pages=true]:lg:z-40 data-[has-pages=true]:lg:w-screen data-[has-pages=true]:lg:h-[calc(100dvh-3rem)] data-[has-pages=true]:max-lg:fixed data-[has-pages=true]:max-lg:inset-0 data-[has-pages=true]:max-lg:z-[70] data-[has-pages=true]:max-lg:w-screen data-[has-pages=true]:max-lg:h-[100dvh] data-[has-pages=true]:flex-1 data-[has-pages=true]:min-h-0 data-[has-pages=true]:flex data-[has-pages=true]:flex-col data-[has-pages=true]:overflow-hidden data-[has-pages=true]:bg-slate-100 dark:data-[has-pages=true]:bg-studio-bg"
  id="img-pane-vector"
  {hidden}
  aria-label="Raster to Vector Studio"
  data-view="split"
  data-editing="false"
  data-sidebar-collapsed="false"
  data-has-pages="false"
>
  <input id="vsInput" name="vsInput" type="file" accept="image/png,image/jpeg,image/webp,image/bmp,image/svg+xml,image/*" multiple class="visually-hidden sr-only" />
  <input id="vsCameraFallback" type="file" accept="image/*" capture="environment" class="visually-hidden sr-only" />

  <!-- Hidden legacy controls kept for backwards compatibility -->
  <div hidden aria-hidden="true">
    <div id="vsTopActions"></div>
    <input type="range" id="vsMedian" min="0" max="3" value="0" />
    <input type="range" id="vsBlur" min="0" max="3" value="0" />
    <input type="range" id="vsThreshold" min="0" max="100" value="50" />
    <select id="vsStacking">
      <option value="stacked" selected>Stacked</option>
      <option value="cutout">Cutout</option>
    </select>
  </div>

  <!-- MOBILE TOP APP BAR (< 1024px ONLY) -->
  <header
    class="ds-mobile-nav group-data-[has-pages=false]/ds:!hidden lg:hidden min-h-[48px] px-2.5 py-1 bg-[#12151e] text-white border-b border-white/10 flex items-center justify-between gap-1.5 shrink-0 z-40"
    aria-label="Mobile Vector Studio Header"
  >
    <div class="inline-flex items-center gap-1 shrink-0">
      <button
        type="button"
        data-vs="reset"
        class="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11.5px] font-bold border border-white/10 cursor-pointer"
      >
        <Icon name="lucide:arrow-left" class="w-4 h-4 shrink-0" />
        <span data-i18n-bn="নতুন" data-i18n-en="New">নতুন</span>
      </button>
      <button type="button" data-vs="undo" disabled class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-slate-200 disabled:opacity-35 cursor-pointer" title="Undo">
        <Icon name="lucide:undo-2" class="w-4 h-4" />
      </button>
      <button type="button" data-vs="redo" disabled class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 text-slate-200 disabled:opacity-35 cursor-pointer" title="Redo">
        <Icon name="lucide:redo-2" class="w-4 h-4" />
      </button>
    </div>

    <div class="inline-flex items-center gap-1 min-w-0">
      <button
        type="button"
        data-vs="toggle-sidebar"
        class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11.5px] font-bold border border-white/10 cursor-pointer shrink-0 whitespace-nowrap"
      >
        <Icon name="lucide:layers" class="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <span id="vsMobPageBadge" class="tabular-nums whitespace-nowrap">লোগো ১/১</span>
      </button>
      <button
        type="button"
        data-vs="add"
        class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 cursor-pointer shrink-0"
        title="+ লোগো যোগ"
      >
        <Icon name="lucide:plus" class="w-4 h-4 shrink-0" />
      </button>
      <button
        type="button"
        data-vs="edit-page"
        class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-500/25 hover:bg-violet-500/35 text-violet-200 border border-violet-400/30 cursor-pointer shrink-0"
        title="Photoshop Edit"
      >
        <Icon name="lucide:pencil" class="w-4 h-4 shrink-0" />
      </button>
    </div>

    <div class="inline-flex items-center gap-1 shrink-0">
      <button
        type="button"
        data-vs="open-export-modal"
        class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer"
        aria-label="Export"
      >
        <Icon name="lucide:download" class="w-4 h-4" />
      </button>
    </div>
  </header>

  <div
    class="ds-drawer-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-80"
    id="vsDrawerBackdrop"
    data-vs="close-drawers"
    hidden
  ></div>

  <!-- NATIVE DESKTOP THREE-PANEL WORKSPACE -->
  <div
    class="ds-body flex-1 min-h-0 grid grid-cols-[204px_minmax(0,1fr)_372px] group-data-[sidebar-collapsed=true]/ds:grid-cols-[0px_minmax(0,1fr)_372px] max-xl:grid-cols-[188px_minmax(0,1fr)_354px] max-xl:group-data-[sidebar-collapsed=true]/ds:grid-cols-[0px_minmax(0,1fr)_354px] max-lg:grid-cols-1 max-lg:group-data-[sidebar-collapsed=true]/ds:grid-cols-1 group-data-[has-pages=false]/ds:!grid-cols-1 overflow-hidden"
  >
    <!-- LEFT PANEL: LOGO / ICON FILMSTRIP QUEUE -->
    <aside
      class="ds-pages group-data-[has-pages=false]/ds:!hidden bg-white dark:bg-studio-sidebar border-r border-slate-200 dark:border-studio-border flex flex-col min-h-0 overflow-hidden group-data-[sidebar-collapsed=true]/ds:lg:opacity-0 group-data-[sidebar-collapsed=true]/ds:lg:pointer-events-none group-data-[sidebar-collapsed=true]/ds:lg:border-r-0 max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:bottom-0 max-lg:w-[min(276px,86vw)] max-lg:z-90 max-lg:shadow-2xl max-lg:-translate-x-[104%] max-lg:group-data-[drawer=pages]/ds:translate-x-0 max-lg:transition-transform max-lg:duration-200"
      id="vsPagesSidebar"
      aria-label="Logo & Icon Queue"
    >
      <div
        class="ds-panel-head sticky top-0 z-20 min-h-[38px] px-3 py-1.5 flex items-center justify-between gap-1.5 border-b border-slate-200 dark:border-studio-border bg-slate-50/90 dark:bg-studio-sidebar shrink-0"
      >
        <strong class="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-800 dark:text-studio-text">
          <Icon name="lucide:shapes" class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
          <span data-i18n-bn="লোগো ও আইকন" data-i18n-en="Logos & Icons">লোগো ও আইকন</span>
          <span
            id="vsCount"
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[11.5px] font-bold tabular-nums"
            >0</span
          >
        </strong>
        <div class="ds-panel-head-actions inline-flex items-center gap-1">
          <span class="ds-muted text-slate-400 dark:text-studio-muted text-[11px] font-medium" data-i18n-bn="তালিকা" data-i18n-en="Queue">তালিকা</span>
          <button
            type="button"
            class="ds-icon-only ds-drawer-close hidden max-lg:inline-flex items-center justify-center w-6.5 h-6.5 rounded border border-slate-200 dark:border-studio-border bg-slate-100 dark:bg-studio-panel text-[12px] font-bold cursor-pointer"
            data-vs="close-drawers"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        class="ds-page-list flex-1 min-h-0 overflow-y-auto p-1.5 flex flex-col gap-1.5 [scrollbar-width:thin] empty:grid empty:place-items-center empty:text-center empty:px-2.5 empty:before:content-['কোনো_লোগো_নেই_·_নিচে_+_বাটনে_ক্লিক_করে_ছবি_যোগ_করুন'] empty:before:text-[12px] empty:before:leading-relaxed empty:before:text-slate-400 dark:empty:before:text-slate-500"
        id="vsPageList"
        aria-label="Loaded Logos"
      ></div>

      <div
        class="ds-page-footer p-2 border-t border-slate-200 dark:border-studio-border grid gap-1.5 bg-slate-50/80 dark:bg-studio-sidebar shrink-0"
      >
        <div class="grid grid-cols-[1fr_auto] gap-1.5">
          <button
            type="button"
            class="ds-add-more w-full inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1 rounded-md border border-emerald-600/35 dark:border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[12.5px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors"
            data-vs="add"
          >
            <Icon name="lucide:plus" class="w-3.5 h-3.5 shrink-0" />
            <span data-i18n-bn="আরও যোগ করুন" data-i18n-en="Add More">আরও যোগ করুন</span>
          </button>
          <button
            type="button"
            class="{btnBase} min-h-[32px] px-2.5 rounded-md"
            data-vs="camera"
            title="ক্যামেরা দিয়ে ছবি তুলুন"
            aria-label="Camera"
          >
            <Icon name="lucide:camera" class="w-4 h-4 shrink-0" />
          </button>
        </div>
        <small class="text-center text-[11px] text-slate-400 dark:text-studio-muted truncate" data-i18n-bn="PNG · JPG · WebP · লোগো ও আইকন" data-i18n-en="PNG · JPG · WebP · Logos & Icons">PNG · JPG · WebP · লোগো ও আইকন</small>
      </div>
    </aside>

    <!-- CENTER PANEL: STUDIO COMMAND BAR & PHOTOSHOP / VECTOR CANVAS -->
    <div class="ds-main min-w-0 min-h-0 flex flex-col bg-slate-100 dark:bg-studio-bg group-data-[has-pages=false]/ds:bg-transparent overflow-hidden">
      <!-- STICKY COMPACT NATIVE DESKTOP & MOBILE ICON RIBBON -->
      <div
        class="ds-toolbar group-data-[has-pages=false]/ds:!hidden sticky top-0 z-30 min-h-[42px] px-2.5 py-1 border-b border-slate-200 dark:border-studio-border group-data-[editing=true]/ds:border-slate-300 dark:group-data-[editing=true]/ds:border-[#181818] bg-white/98 dark:bg-studio-sidebar/98 group-data-[editing=true]/ds:dark:bg-[#232323] backdrop-blur-xs flex items-center gap-1 flex-wrap max-lg:flex-nowrap max-lg:overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0"
        role="toolbar"
        aria-label="Vector Studio Toolbar"
      >
        <!-- Group 1: Sidebar, Add Logo, Camera, New/Reset -->
        <div class="ds-toolbar-group inline-flex items-center gap-0.5 shrink-0" role="group" aria-label="Files & Input">
          <button
            type="button"
            data-vs="toggle-sidebar"
            id="vsSidebarToggleBtn"
            class="{btnIcon} max-lg:hidden aria-pressed:bg-slate-100 dark:aria-pressed:bg-studio-surface aria-pressed:text-indigo-600 dark:aria-pressed:text-indigo-400"
            aria-pressed="true"
            title="সাইডবার লুকান / দেখান"
          >
            <Icon name="lucide:panel-left" class="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          </button>
          <button
            type="button"
            data-vs="add"
            class="{btnIcon} bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:enabled:bg-emerald-500/20"
            title="নতুন লোগো / ছবি যোগ করুন"
          >
            <Icon name="lucide:plus" class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </button>
          <button type="button" data-vs="camera" class={btnIcon} title="ক্যামেরা দিয়ে লোগো স্ক্যান করুন">
            <Icon name="lucide:camera" class="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 shrink-0" />
          </button>
          <button type="button" data-vs="reset" id="vsResetBtn" class={btnIcon} title="সব রিসেট করে নতুন ছবি নিন">
            <Icon name="lucide:file-plus-2" class="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
          </button>
        </div>

        <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-0.5 shrink-0" aria-hidden="true"></span>

        <!-- Group 2: Undo & Redo -->
        <div class="ds-toolbar-group inline-flex items-center gap-0.5 shrink-0" role="group" aria-label="History">
          <button type="button" data-vs="undo" class={btnIcon} disabled title="আনডু (Ctrl+Z)">
            <Icon name="lucide:undo-2" class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300 shrink-0" />
          </button>
          <button type="button" data-vs="redo" class={btnIcon} disabled title="রিডু (Ctrl+Y)">
            <Icon name="lucide:redo-2" class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300 shrink-0" />
          </button>
        </div>

        <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-0.5 shrink-0" aria-hidden="true"></span>

        <!-- Group 3: Orientation & Smart Logo Trim -->
        <div class="ds-toolbar-group inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-slate-100/70 dark:bg-studio-panel/60 border border-slate-200/70 dark:border-studio-border shrink-0" role="group" aria-label="Transform & Trim">
          <button type="button" data-vs="left" class={btnIcon} title="বামে ৯০° ঘোরান (Rotate Left)">
            <Icon name="lucide:rotate-ccw" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          </button>
          <button type="button" data-vs="right" class={btnIcon} title="ডানে ৯০° ঘোরান (Rotate Right)">
            <Icon name="lucide:rotate-cw" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          </button>
          <button type="button" data-vs="flip-h" class={btnIcon} title="পাশাপাশি ফ্লিপ করুন (Flip Horizontal)">
            <Icon name="lucide:flip-horizontal-2" class="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          </button>
          <button type="button" data-vs="auto-trim" class={btnIcon} title="লোগোর চারপাশের অতিরিক্ত ফাঁকা জায়গা অটো-ট্রিম করুন (Auto-Trim Margins)">
            <Icon name="lucide:crop" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </button>
        </div>

        <!-- Group 4: Photoshop Document/Logo Editor Toggle + Re-Vectorize -->
        <div class="ds-workflow-actions inline-flex items-center gap-1.5 ml-1 shrink-0">
          <button
            type="button"
            data-vs="edit-page"
            class="{btnBase} !px-2.5 !border-emerald-500/40 dark:!border-emerald-400/35 hover:!bg-emerald-500/10"
            title="ফটোশপ ক্যানভাস ও লেয়ার এডিটর খুলুন (Open Photoshop Canvas & Layer Editor)"
          >
            <Icon name="lucide:pencil" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span data-i18n-bn="এডিট" data-i18n-en="Edit">এডিট</span>
          </button>
          <button
            type="button"
            data-vs="close-eraser"
            class="ds-save-edit inline-flex items-center gap-1.5"
            title="এডিট সম্পন্ন করে ভেক্টর প্রিভিউতে ফিরুন (Save Edits & Vectorize)"
          >
            <Icon name="lucide:check" class="w-4 h-4 shrink-0" />
            <span data-i18n-bn="সেভ ও ভেক্টর ভিউ" data-i18n-en="Save & Vectorize">সেভ ও ভেক্টর ভিউ</span>
          </button>
          <button
            type="button"
            id="vsTraceBtn"
            data-vs="trace-now"
            class="{btnBase} !px-2.5 !border-violet-500/40 dark:!border-violet-400/35 !bg-violet-500/10 !text-violet-700 dark:!text-violet-300 hover:!bg-violet-500/20"
            title="আবার ভেক্টরাইজ করুন (Re-trace Vector)"
          >
            <Icon name="lucide:zap" class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
            <span data-i18n-bn="ভেক্টরাইজ" data-i18n-en="Vectorize">ভেক্টরাইজ</span>
          </button>
        </div>

        <!-- Busy Indicator Pill in Toolbar -->
        <div class="vs-busy hidden items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/12 text-xs font-bold text-violet-600 dark:text-violet-300" id="vsBusy">
          <span class="inline-block w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
          <span id="vsBusyText" data-i18n-bn="ভেক্টরাইজ হচ্ছে…" data-i18n-en="Vectorizing…">ভেক্টরাইজ হচ্ছে…</span>
        </div>

        <!-- Group 5: View Switcher (Split | Vector | Wireframe | Original) -->
        <div class="ds-toolbar-right ml-auto inline-flex items-center gap-1 shrink-0">
          <div
            class="ds-view-switch inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border gap-0.5"
            role="group"
            aria-label="Canvas View Mode"
          >
            <button
              type="button"
              data-vs-view="split"
              aria-pressed="true"
              title="আসল ছবি ও ভেক্টর পাশাপাশি তুলনা (Before / After Split)"
              class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[12px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:columns-2" class="w-3.5 h-3.5 shrink-0" />
              <span class="ds-view-label" data-i18n-bn="তুলনা (Split)" data-i18n-en="Split">তুলনা (Split)</span>
            </button>
            <button
              type="button"
              id="vsVecVisibleBtn"
              data-vs-view="preview"
              aria-pressed="false"
              title="শুধু হাই-কোয়ালিটি ভেক্টর আউটপুট দেখুন (Vector Output)"
              class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[12px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:sparkles" class="w-3.5 h-3.5 shrink-0" />
              <span class="ds-view-label" data-i18n-bn="ভেক্টর" data-i18n-en="Vector">ভেক্টর</span>
            </button>
            <button
              type="button"
              id="vsWireBtn"
              data-vs-view="wire"
              aria-pressed="false"
              title="ভেক্টর পাথ ও বেজিয়ার নোড ওয়্যারফ্রেম দেখুন (Wireframe & Nodes)"
              class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[12px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-violet-600 dark:aria-pressed:text-violet-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:spline" class="w-3.5 h-3.5 shrink-0" />
              <span class="ds-view-label" data-i18n-bn="ওয়্যারফ্রেম" data-i18n-en="Wireframe">ওয়্যারফ্রেম</span>
            </button>
            <button
              type="button"
              data-vs-view="crop"
              aria-pressed="false"
              title="মূল বা এডিট করা রাস্টার ছবি দেখুন (Original Raster)"
              class="inline-flex items-center justify-center px-2.5 h-7 gap-1 rounded-md border-0 bg-transparent text-[12px] font-semibold text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:image" class="w-3.5 h-3.5 shrink-0" />
              <span class="ds-view-label" data-i18n-bn="মূল ছবি" data-i18n-en="Original">মূল ছবি</span>
            </button>
          </div>

          <button
            type="button"
            data-vs="toggle-inspector"
            class="ds-inspector-toggle hidden max-lg:inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel cursor-pointer"
            title="সেটিংস ও লেয়ার প্যানেল"
          >
            <Icon name="lucide:sliders-horizontal" class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
          </button>
        </div>
      </div>

      <!-- CLEAN INITIAL UPLOAD STATE (MODERN HERO DROPZONE — IDENTICAL TO DOCUMENT SCANNER) -->
      <div class="ds-empty space-y-4" id="vsEmpty">
        <div
          class="ds-empty-card pdf-dropzone relative flex flex-col items-center justify-center text-center py-12 px-5 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-[#f4f5f7] dark:bg-studio-panel/75 hover:border-violet-400/70 dark:hover:border-violet-500/60 cursor-pointer transition-all duration-200 group-[.is-over]/ds:border-violet-500 group-[.is-over]/ds:bg-violet-50/60 dark:group-[.is-over]/ds:bg-violet-500/10 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
          id="vsDropzone"
          data-vs="add"
        >
          <!-- Multi-layered Colorful Hero Illustration (Monitor + Vector Bezier Logo + Glossy Violet Card + Plus Badge) -->
          <div class="ds-empty-symbol relative w-44 h-34 mb-4 select-none pointer-events-none flex items-center justify-center" style="width: 176px; height: 136px;">
            <svg width="176" height="136" style="width: 100%; height: 100%;" viewBox="0 0 200 150" class="!w-full !h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="vsHeroGlow" x1="65" y1="65" x2="105" y2="138" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.28" />
                  <stop offset="65%" stop-color="#c4b5fd" stop-opacity="0.16" />
                  <stop offset="100%" stop-color="#f4f5f7" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="vsHeroCard" x1="42" y1="24" x2="96" y2="70" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#6d28d9" />
                  <stop offset="55%" stop-color="#8b5cf6" stop-opacity="0.92" />
                  <stop offset="100%" stop-color="#c4b5fd" stop-opacity="0.78" />
                </linearGradient>
                <linearGradient id="vsHeroPlusGrad" x1="126" y1="90" x2="162" y2="128" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#4f46e5" />
                </linearGradient>
              </defs>

              <path d="M46 130 C46 84, 72 62, 108 62 C136 62, 152 90, 152 130 Z" fill="url(#vsHeroGlow)" />

              <!-- Desktop Monitor Stand & Base -->
              <path d="M93 108 H113 L116 125 H90 Z" fill="#e2e8f0" />
              <rect x="76" y="124" width="54" height="5" rx="2.5" fill="#ffffff" />
              <line x1="36" y1="129" x2="150" y2="129" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55" />

              <!-- Desktop Monitor Outer Frame & Dark Screen -->
              <rect x="57" y="42" width="92" height="68" rx="6" fill="#ffffff" stroke="#d5dde6" stroke-width="2" />
              <rect x="61" y="46" width="84" height="54" rx="3" fill="#181b20" />
              <path d="M58 100 H148 V105 A4 4 0 0 1 144 109 H62 A4 4 0 0 1 58 105 Z" fill="#f8fafc" />

              <!-- Bezier Vector Curve & Nodes Inside Monitor -->
              <path d="M74 84 C84 56, 122 56, 132 84" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round" fill="none" />
              <line x1="74" y1="84" x2="88" y2="58" stroke="#a78bfa" stroke-width="1.2" stroke-dasharray="2 2" />
              <line x1="132" y1="84" x2="118" y2="58" stroke="#a78bfa" stroke-width="1.2" stroke-dasharray="2 2" />
              <circle cx="88" cy="58" r="2.8" fill="#a78bfa" />
              <circle cx="118" cy="58" r="2.8" fill="#a78bfa" />
              <rect x="71" y="81" width="6" height="6" rx="1" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
              <rect x="100" y="61" width="6" height="6" rx="1" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
              <rect x="129" y="81" width="6" height="6" rx="1" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />

              <!-- Floating Glossy Violet Logo Card (Top-Left Overlapping Monitor) -->
              <g>
                <rect x="42" y="25" width="48" height="38" rx="5" fill="url(#vsHeroCard)" stroke="#ffffff" stroke-width="1" stroke-opacity="0.65" />
                <polygon points="66,31 79,55 53,55" fill="#ffffff" fill-opacity="0.9" />
                <circle cx="66" cy="47" r="4" fill="#6d28d9" />
              </g>

              <!-- Violet Plus Circle Badge -->
              <g>
                <circle cx="144" cy="109" r="19" fill="url(#vsHeroPlusGrad)" />
                <path d="M144 100 V118 M135 109 H153" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" />
              </g>
            </svg>
          </div>

          <h3 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white m-0 mb-1" data-i18n-bn="লোগো ও আইকন হাই-কোয়ালিটি ভেক্টর স্টুডিও (SVG · EPS · AI)" data-i18n-en="Logo & Icon High-Quality Vector Studio (SVG · EPS · AI)">
            লোগো ও আইকন হাই-কোয়ালিটি ভেক্টর স্টুডিও (SVG · EPS · AI)
          </h3>
          <p
            class="text-[14px] sm:text-[15px] font-normal text-slate-600 dark:text-slate-300 m-0 mb-7 tracking-[-0.01em] max-w-[58ch]"
            data-i18n-bn="যেকোনো PNG, JPG বা WebP লোগো/আইকন এখানে ছাড়ুন, ফটোশপের মতো এডিট ও ব্যাকগ্রাউন্ড ক্লিন করে নিখুঁত ভেক্টর (SVG, EPS, AI) ডাউনলোড করুন"
            data-i18n-en="Drop any PNG, JPG or WebP logo/icon here, retouch with Photoshop-grade tools, and export crisp SVG, EPS & Adobe Illustrator (.ai) vectors"
          >
            যেকোনো PNG, JPG বা WebP লোগো/আইকন এখানে ছাড়ুন, ফটোশপের মতো এডিট ও ব্যাকগ্রাউন্ড ক্লিন করে নিখুঁত ভেক্টর (SVG, EPS, AI) ডাউনলোড করুন
          </p>

          <!-- 4 Elevated White Action Cards (Identical to Document Scanner) -->
          <div class="ds-empty-actions grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full max-w-[840px]">
            <!-- 1. Smart Camera -->
            <button
              type="button"
              data-vs="camera"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(16,185,129,0.12)] hover:border-emerald-400/80 dark:hover:border-emerald-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.38a1.5 1.5 0 0 0 1.25-.67l.74-1.11A1.5 1.5 0 0 1 11.12 3.5h1.76a1.5 1.5 0 0 1 1.25.67l.74 1.11a1.5 1.5 0 0 0 1.25.67h1.38A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" fill="#3b82f6" />
                <circle cx="12" cy="13" r="4.2" fill="#ffffff" />
                <circle cx="12" cy="13" r="2.3" fill="#2563eb" />
                <circle cx="16.8" cy="8.8" r="1" fill="#ffffff" />
              </svg>
              <span data-i18n-bn="স্মার্ট ক্যামেরা" data-i18n-en="Smart Camera">স্মার্ট ক্যামেরা</span>
            </button>

            <!-- 2. Import Logo / Images -->
            <button
              type="button"
              data-vs="add"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-blue-400/80 dark:hover:border-blue-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="3.5" width="16.5" height="16.5" rx="3" fill="#1677ff" />
                <circle cx="7.5" cy="8.5" r="1.75" fill="#ffffff" />
                <path d="M4 17.5L9.2 11.8L13.5 16.2L15.8 13.8L17.5 17.5H4Z" fill="#93c5fd" fill-opacity="0.85" />
                <circle cx="17.5" cy="17.5" r="4.5" fill="#1d4ed8" stroke="#ffffff" stroke-width="1.4" />
                <path d="M19 18.8V17.4C19 16.3 18.1 15.5 17 15.5H15.6M15.6 15.5L17 14.1M15.6 15.5L17 16.9" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span data-i18n-bn="লোগো / ছবি ইমপোর্ট" data-i18n-en="Import Logo / Image">লোগো / ছবি ইমপোর্ট</span>
            </button>

            <!-- 3. Import Files -->
            <button
              type="button"
              data-vs="import-files"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-indigo-400/80 dark:hover:border-indigo-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4.5 5A2.5 2.5 0 0 1 7 2.5h6.8L18.5 7.2V17.5A2.5 2.5 0 0 1 16 20H7a2.5 2.5 0 0 1-2.5-2.5V5Z" fill="#1677ff" />
                <path d="M13.8 2.5V6.2A1 1 0 0 0 14.8 7.2H18.5L13.8 2.5Z" fill="#93c5fd" />
                <path d="M7.5 10.5H13.5M7.5 13.5H12.5M7.5 16.5H10.5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="17.5" cy="17.5" r="4.5" fill="#1d4ed8" stroke="#ffffff" stroke-width="1.4" />
                <path d="M19 18.8V17.4C19 16.3 18.1 15.5 17 15.5H15.6M15.6 15.5L17 14.1M15.6 15.5L17 16.9" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span data-i18n-bn="ফাইল ব্রাউজ করুন" data-i18n-en="Browse Files">ফাইল ব্রাউজ করুন</span>
            </button>

            <!-- 4. Paste (Ctrl+V) -->
            <button
              type="button"
              data-vs="paste"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(124,58,237,0.12)] hover:border-violet-400/80 dark:hover:border-violet-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg width="24" height="24" class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="4.5" width="14" height="16.5" rx="2.5" fill="#7c3aed" />
                <rect x="8" y="2.5" width="6" height="3.5" rx="1.2" fill="#fbbf24" />
                <rect x="7" y="9" width="8" height="8.5" rx="1.5" fill="#ffffff" fill-opacity="0.92" />
                <circle cx="17.5" cy="17.5" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.4" />
                <path d="M17.5 15.2V19.5M17.5 19.5L15.8 17.8M17.5 19.5L19.2 17.8" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span data-i18n-bn="পেস্ট (Ctrl+V)" data-i18n-en="Paste (Ctrl+V)">পেস্ট (Ctrl+V)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- STUDIO WORKSPACE & PHOTOSHOP RETOUCH STAGE -->
      <div
        class="ds-workspace flex-1 min-h-0 grid grid-cols-1 gap-1.5 p-1.5 group-data-[editing=true]/ds:gap-0 group-data-[editing=true]/ds:p-0 overflow-hidden"
        id="vsStage"
        hidden
      >
        <section
          class="ds-preview-panel min-w-0 min-h-0 flex flex-col rounded-lg group-data-[editing=true]/ds:rounded-none border border-slate-200 dark:border-studio-border group-data-[editing=true]/ds:border-0 bg-white dark:bg-studio-sidebar overflow-hidden shadow-2xs"
          id="vsWorkspace"
          aria-label="Vector & Photoshop Canvas Stage"
        >
          <!-- PHOTOSHOP-STYLE CONTEXTUAL TOOL OPTIONS BAR (SHOWN WHEN EDITING) -->
          <div
            class="ds-eraser-bar relative z-30 min-h-[38px] px-3 py-1 bg-[#f3f4f6] dark:bg-[#18181c] border-b border-slate-300 dark:border-[#27272c] flex items-center gap-2 flex-wrap shrink-0 select-none shadow-2xs"
            id="vsEraserBar"
            hidden
          >
            <!-- Active Tool Preset Badge -->
            <div
              id="vsPsActiveToolLabel"
              class="inline-flex items-center gap-1.5 h-[26px] pl-2 pr-2.5 rounded-[4px] border border-slate-300 dark:border-[#2e2e34] bg-white dark:bg-[#242429] shadow-2xs shrink-0"
            >
              <span id="vsPsActiveToolIcon" class="inline-flex w-4 h-4 text-blue-600 dark:text-blue-400 [&_svg]:w-4 [&_svg]:h-4"></span>
              <b class="text-[11.5px] font-semibold text-slate-800 dark:text-[#ececef] whitespace-nowrap">Brush Tool</b>
            </div>
            <span class={psSep}></span>

            <!-- MOVE TOOL OPTIONS -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-vs-opts="move" hidden>
              <span class={psLbl} data-i18n-bn="ক্যানভাস বা সিলেকশন ড্রাগ করে সরান" data-i18n-en="Drag to pan or move selection">ক্যানভাস বা সিলেকশন ড্রাগ করে সরান</span>
              <span class={psSep}></span>
              <button type="button" data-vs="auto-trim" class={psBtn} title="Auto-trim transparent/white borders">
                <Icon name="lucide:crop" class="w-3.5 h-3.5 text-emerald-500" />
                <span data-i18n-bn="অটো-ট্রিম লোগো" data-i18n-en="Auto-Trim Logo">অটো-ট্রিম লোগো</span>
              </button>
            </div>

            <!-- SELECTION TOOL OPTIONS (MARQUEE & LASSO) -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-vs-opts="marquee-rect marquee-ellipse lasso lasso-poly" hidden>
              <div class="inline-flex items-center rounded-[3px] border border-slate-300 dark:border-[#141414] overflow-hidden shrink-0" role="group" aria-label="Selection Mode">
                {#each selModes as sm}
                  <button
                    type="button"
                    data-vs-sel-mode={sm.id}
                    aria-pressed={sm.id === 'new' ? 'true' : 'false'}
                    title={sm.tip}
                    class="w-[26px] h-[25px] inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 border-r last:border-r-0 border-slate-200 dark:border-[#141414] text-slate-700 dark:text-[#e0e0e0] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#4a4a4a] aria-pressed:bg-sky-500/20 aria-pressed:text-sky-600 dark:aria-pressed:text-sky-300"
                  >
                    <Icon name={sm.icon} class="w-3.5 h-3.5" />
                  </button>
                {/each}
              </div>
              <span class={psSep}></span>
              <button type="button" data-vs-sel="all" class={psBtn}>Select All</button>
              <button type="button" data-vs-sel="deselect" class={psBtn}>Deselect</button>
              <button type="button" data-vs-sel="invert" class={psBtn}>Invert</button>
              <button type="button" data-vs-sel="clear" class="{psBtn} !border-rose-500/40 !text-rose-600 dark:!text-rose-400">
                <Icon name="lucide:eraser" class="w-3.5 h-3.5" />
                <span data-i18n-bn="মুছুন (Transparent)" data-i18n-en="Erase to Transparent">মুছুন (Transparent)</span>
              </button>
              <button type="button" data-vs-sel="fill" class="{psBtn} !border-emerald-500/40 !text-emerald-600 dark:!text-emerald-300">
                <Icon name="lucide:paint-bucket" class="w-3.5 h-3.5" />
                <span data-i18n-bn="রঙ দিয়ে ফিল" data-i18n-en="Fill Color">রঙ দিয়ে ফিল</span>
              </button>
            </div>

            <!-- MAGIC WAND BACKGROUND ERASER OPTIONS -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-vs-opts="wand" hidden>
              <div class="{psPod} w-[138px]" title="Magic Wand Color Tolerance">
                <span id="vsWandToleranceFill" class="absolute inset-y-0 left-0 bg-violet-500/18 dark:bg-white/[0.1] pointer-events-none" style="width:28%"></span>
                <span class="relative z-10 {psLbl} pointer-events-none">Tolerance</span>
                <output id="vsWandTolVal" class="relative z-10 text-[11.5px] font-bold text-violet-600 dark:text-[#ececef] tabular-nums pointer-events-none">28</output>
                <input id="vsWandTolerance" type="range" min="2" max="100" step="1" value="28" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0" />
              </div>
              <label class="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-700 dark:text-[#d8d8d8] cursor-pointer">
                <input id="vsWandContiguous" type="checkbox" checked class="w-3.5 h-3.5 accent-violet-600 cursor-pointer" />
                <span data-i18n-bn="সংযুক্ত অংশ (Contiguous)" data-i18n-en="Contiguous">সংযুক্ত অংশ (Contiguous)</span>
              </label>
              <span class="text-[11px] text-slate-500 dark:text-slate-400" data-i18n-bn="💡 ছবির যেকোনো ব্যাকগ্রাউন্ডে ক্লিক করলেই স্বচ্ছ (Transparent) হয়ে যাবে" data-i18n-en="💡 Click any background region on the canvas to erase it to transparency">
                💡 ছবির যেকোনো ব্যাকগ্রাউন্ডে ক্লিক করলেই স্বচ্ছ (Transparent) হয়ে যাবে
              </span>
            </div>

            <!-- EYEDROPPER OPTIONS -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-vs-opts="picker" hidden>
              <span class={psLbl} data-i18n-bn="পিক করা রঙ:" data-i18n-en="Picked Color:">পিক করা রঙ:</span>
              <span id="vsPickerSwatch" class="w-5 h-5 rounded border border-slate-400 inline-block" style="background:#ffffff"></span>
              <code id="vsPickerHex" class="text-[11.5px] font-mono font-bold text-slate-800 dark:text-slate-200">#FFFFFF</code>
              <button type="button" data-vs="use-picked-bg" class="{psBtn} !border-violet-500/40 !text-violet-600 dark:!text-violet-300">
                <Icon name="lucide:sparkles" class="w-3.5 h-3.5" />
                <span data-i18n-bn="ব্যাকগ্রাউন্ড রিমুভ রঙ হিসেবে সেট করুন" data-i18n-en="Set as Background Key Color">ব্যাকগ্রাউন্ড রিমুভ রঙ হিসেবে সেট করুন</span>
              </button>
            </div>

            <!-- BRUSH / ERASER / HEAL / CLONE / DODGE / BURN OPTIONS -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-vs-opts="brush eraser heal clone dodge burn">
              <div class="{psPod} w-[112px]" title="Brush Diameter (px)">
                <span id="vsBrushSizeFill" class="absolute inset-y-0 left-0 bg-emerald-500/18 dark:bg-white/[0.1] pointer-events-none" style="width:20%"></span>
                <span class="relative z-10 {psLbl} pointer-events-none">Size</span>
                <output id="vsBrushSizeVal" class="relative z-10 text-[11.5px] font-bold text-emerald-600 dark:text-[#ececef] tabular-nums pointer-events-none">24px</output>
                <input id="vsBrushSize" type="range" min="2" max="120" step="1" value="24" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0" />
              </div>

              <div class="{psPod} w-[118px]" title="Brush Edge Hardness (%)">
                <span id="vsBrushHardnessFill" class="absolute inset-y-0 left-0 bg-emerald-500/18 dark:bg-white/[0.1] pointer-events-none" style="width:85%"></span>
                <span class="relative z-10 {psLbl} pointer-events-none">Hardness</span>
                <output id="vsBrushHardnessVal" class="relative z-10 text-[11.5px] font-bold text-emerald-600 dark:text-[#ececef] tabular-nums pointer-events-none">85%</output>
                <input id="vsBrushHardness" type="range" min="0" max="100" step="1" value="85" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0" />
              </div>

              <div class="{psPod} w-[116px]" title="Stroke Opacity (%)">
                <span id="vsBrushOpacityFill" class="absolute inset-y-0 left-0 bg-emerald-500/18 dark:bg-white/[0.1] pointer-events-none" style="width:100%"></span>
                <span class="relative z-10 {psLbl} pointer-events-none">Opacity</span>
                <output id="vsBrushOpacityVal" class="relative z-10 text-[11.5px] font-bold text-emerald-600 dark:text-[#ececef] tabular-nums pointer-events-none">100%</output>
                <input id="vsBrushOpacity" type="range" min="10" max="100" step="1" value="100" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0" />
              </div>

              <label
                class="relative inline-flex items-center gap-1.5 h-[25px] px-2 rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#383838] cursor-pointer shrink-0"
                title="Set Brush Paint Color"
              >
                <span class={psLbl}>Color</span>
                <input type="color" id="vsEraserColor" value="#000000" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0" />
                <span id="vsEraserColorChip" class="w-4 h-3.5 rounded-[2px] border border-slate-400" style="background:#000000"></span>
              </label>

              <span class="text-[11px] text-slate-500 dark:text-slate-400" data-vs-opts="clone" hidden id="vsCloneSrcInfo">Alt + ক্লিক করে সোর্স সেট করুন</span>
            </div>

            <!-- TYPE TOOL OPTIONS -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-vs-opts="text" hidden>
              <select id="vsTxtFont" class="{psSel} w-[132px]" aria-label="Font Family">
                {#each fontList as f}
                  <option value={f}>{f}</option>
                {/each}
              </select>
              <button
                type="button"
                id="vsTxtBoldBtn"
                data-vs-txt-toggle="bold"
                aria-pressed="true"
                class="w-7 h-[25px] inline-flex items-center justify-center rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#383838] font-bold text-[12.5px] cursor-pointer aria-pressed:bg-emerald-500/25 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
              >B</button>
              <button
                type="button"
                id="vsTxtItalicBtn"
                data-vs-txt-toggle="italic"
                aria-pressed="false"
                class="w-7 h-[25px] inline-flex items-center justify-center rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#383838] italic font-serif font-bold text-[12.5px] cursor-pointer aria-pressed:bg-emerald-500/25 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
              >I</button>
              <input id="vsTxtSize" type="number" min="8" max="300" value="36" class="{psSel} w-[58px] tabular-nums" title="Font Size (px)" />
              <div class="inline-flex items-center rounded border border-slate-300 dark:border-white/10 overflow-hidden shrink-0">
                {#each txtAligns as a}
                  <button
                    type="button"
                    data-vs-txt-align={a.id}
                    aria-pressed={a.id === 'left' ? 'true' : 'false'}
                    class="w-6.5 h-[25px] inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 text-slate-700 dark:text-slate-200 cursor-pointer aria-pressed:bg-emerald-500/20 aria-pressed:text-emerald-600"
                  >
                    <Icon name={a.icon} class="w-3.5 h-3.5" />
                  </button>
                {/each}
              </div>
              <label class="relative inline-flex items-center h-[25px] px-1.5 rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#383838] cursor-pointer shrink-0">
                <input type="color" id="vsTxtColor" value="#111111" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0" />
                <span id="vsTxtColorChip" class="w-5 h-3.5 rounded-[2px] border border-slate-400" style="background:#111111"></span>
              </label>
              <span id="vsTxtEditActions" class="inline-flex items-center gap-1 shrink-0" hidden>
                <button type="button" data-vs-txt="cancel" class="{psBtn} !px-1.5 !text-rose-600" title="Cancel">
                  <Icon name="lucide:x" class="w-3.5 h-3.5" />
                </button>
                <button type="button" data-vs-txt="commit" class="{psBtn} !px-1.5 !text-emerald-600" title="Commit (Ctrl+Enter)">
                  <Icon name="lucide:check" class="w-3.5 h-3.5" />
                </button>
              </span>
            </div>

            <!-- ZOOM / HAND OPTIONS -->
            <div class="inline-flex items-center gap-1 shrink-0" data-vs-opts="zoom hand" hidden>
              <button type="button" data-vs="zoom-out" class="{psBtn} !px-1.5">
                <Icon name="lucide:zoom-out" class="w-3.5 h-3.5" />
              </button>
              <span id="vsPreviewZoomLabel" class="inline-flex items-center justify-center w-[52px] h-[25px] rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#383838] text-[11.5px] font-bold tabular-nums text-slate-700 dark:text-slate-200">100%</span>
              <button type="button" data-vs="zoom-in" class="{psBtn} !px-1.5">
                <Icon name="lucide:zoom-in" class="w-3.5 h-3.5" />
              </button>
              <button type="button" data-vs="actual" class={psBtn}>100%</button>
              <button type="button" data-vs="fit" class={psBtn}>Fit Screen</button>
            </div>

            <!-- Right side: Undo Retouch & Reset All Retouch -->
            <div class="inline-flex items-center gap-1 ml-auto pl-2 shrink-0">
              <button type="button" data-vs="undo-erase" class="{psBtn} !px-2" title="সর্বশেষ ব্রাশ/ইরেজ বাতিল করুন">
                <Icon name="lucide:undo-2" class="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                <span data-i18n-bn="আনডু" data-i18n-en="Undo">আনডু</span>
              </button>
              <button type="button" data-vs="clear-erases" class="{psBtn} !px-2" title="সব এডিট রিসেট করে মূল ছবিতে ফিরুন">
                <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span data-i18n-bn="রিসেট এডিট" data-i18n-en="Reset Edits">রিসেট এডিট</span>
              </button>
            </div>
          </div>

          <!-- MAIN STAGE CONTAINER (WITH LEFT VERTICAL PHOTOSHOP DOCK + INTERACTIVE VIEWPORT) -->
          <div class="relative flex-1 min-h-0 flex flex-col overflow-clip">
            <!-- PHOTOSHOP-STYLE LEFT VERTICAL TOOLS DOCK (SHOWN WHEN EDITING) -->
            <aside
              class="ds-ps-dock absolute left-1.5 top-2 w-[38px] rounded-md bg-[#f0f0f0] dark:bg-[#2b2b2b] border border-slate-300 dark:border-[#3c3c3c] p-[3px] flex flex-col items-center gap-[2px] z-[60] shrink-0 select-none shadow-[0_2px_10px_rgba(0,0,0,0.16)]"
              id="vsPsDock"
              hidden
              aria-label="Photoshop Tools"
            >
              <span class="w-5 h-[3px] my-[2px] rounded-full bg-slate-400/50 dark:bg-white/15" aria-hidden="true"></span>
              {#each dockGroups as g}
                {#if g.sep}
                  <span class="w-6 h-px bg-slate-300 dark:bg-white/12 my-[3px]" aria-hidden="true"></span>
                {/if}
                <div class="relative" data-vs-group={g.id}>
                  <button
                    type="button"
                    data-vs-group-btn={g.id}
                    data-vs-cur={g.tools[0].id}
                    aria-pressed="false"
                    title={`${g.tools[0].name} (${g.tools[0].key})`}
                    class="ds-ps-tool relative w-8 h-8 p-0 rounded-[4px] border border-transparent bg-transparent text-slate-700 dark:text-[#d4d4d4] flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white aria-pressed:bg-slate-300 dark:aria-pressed:bg-[#484848] aria-pressed:border-slate-400/50 dark:aria-pressed:border-white/15 aria-pressed:text-slate-950 dark:aria-pressed:text-white"
                  >
                    {#each g.tools as tl, ti}
                      <span data-vs-icon-for={tl.id} hidden={ti !== 0} class="inline-flex">
                        <Icon name={tl.icon} class="w-[18px] h-[18px] shrink-0" />
                      </span>
                    {/each}
                    {#if g.tools.length > 1}
                      <span
                        class="absolute right-[2px] bottom-[2px] w-0 h-0 border-l-[4px] border-l-transparent border-b-[4px] border-b-slate-500 dark:border-b-[#bdbdbd]"
                        aria-hidden="true"
                      ></span>
                    {/if}
                  </button>
                  {#if g.tools.length > 1}
                    <div
                      data-vs-flyout={g.id}
                      hidden
                      class="absolute left-[calc(100%+7px)] top-0 min-w-[232px] py-1 rounded-md bg-white dark:bg-[#323232] border border-slate-300 dark:border-[#484848] shadow-[0_8px_24px_rgba(0,0,0,0.28)] z-50"
                    >
                      {#each g.tools as tl}
                        <button
                          type="button"
                          data-vs-tool={tl.id}
                          class="w-full flex items-center gap-2.5 px-2.5 py-1.5 bg-transparent border-0 text-left text-[12.5px] text-slate-800 dark:text-[#e5e5e5] hover:bg-[#1473e6] hover:text-white cursor-pointer"
                        >
                          <span data-vs-fly-check={tl.id} class="w-2 h-2 rounded-[1px] bg-current shrink-0" style="visibility:hidden"></span>
                          <Icon name={tl.icon} class="w-[17px] h-[17px] shrink-0" />
                          <span class="flex-1 whitespace-nowrap">{tl.name}</span>
                          <span class="text-slate-400 dark:text-[#9ca3af] text-[11.5px] font-semibold">{tl.key}</span>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
              <span class="w-6 h-px bg-slate-300 dark:bg-white/12 my-[3px]" aria-hidden="true"></span>
              <label
                class="relative w-8 h-8 p-0 rounded-[4px] border-0 bg-transparent flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10"
                title="Set Foreground Color"
              >
                <input type="color" id="vsDockColor" value="#000000" aria-label="Foreground Color" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0" />
                <span id="vsDockSwatch" class="w-5 h-5 rounded-[2px] border border-slate-500 dark:border-white/70 shadow-2xs pointer-events-none" style="background:#000000"></span>
              </label>
            </aside>

            <!-- INTERACTIVE CANVAS STAGE (CHECKERBOARD TRANSPARENCY + SPLIT / VECTOR / WIREFRAME / RETOUCH) -->
            <div
              class="ds-preview-stage vs-preview-wrap flex-1 min-h-0 flex items-center justify-center overflow-clip relative bg-[#dcdcdc] dark:bg-[#141417] [container-type:size] select-none"
              id="vsPreviewStage"
            >
              <div
                class="vs-viewport relative w-full h-full overflow-hidden cursor-grab touch-none"
                id="vsViewport"
              >
                <div
                  class="vs-zoom-layer ds-preview-wrap absolute left-1/2 top-1/2 origin-center will-change-transform select-none leading-none shadow-[0_12px_36px_rgba(0,0,0,0.22)] rounded-[2px] overflow-hidden"
                  id="vsZoomLayer"
                  style="transform: translate(-50%,-50%) scale(1); background: repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px;"
                >
                  <canvas id="vsSrcCanvas" class="block max-w-none select-none"></canvas>
                  <img id="vsVecImg" class="vs-vec-layer absolute inset-0 w-full h-full pointer-events-none select-none" alt="Vector Output Preview" draggable="false" />
                  <svg id="vsWireLayer" class="vs-wire-layer absolute inset-0 w-full h-full hidden pointer-events-none" preserveAspectRatio="none"></svg>
                  <canvas id="vsTextLayer" class="absolute inset-0 w-full h-full pointer-events-none z-[21]" aria-hidden="true"></canvas>

                  <!-- Marching-ants selection overlay (Marquee / Lasso) -->
                  <svg
                    id="vsSelOverlay"
                    class="absolute inset-0 w-full h-full pointer-events-none z-[25] overflow-visible"
                    viewBox="0 0 1000 1000"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    hidden
                  >
                    <path id="vsSelPathA" fill="none" stroke="#ffffff" stroke-width="1.2" vector-effect="non-scaling-stroke" />
                    <path id="vsSelPathB" fill="none" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" />
                  </svg>

                  <!-- In-place Type Tool editor -->
                  <textarea
                    id="vsTextEditor"
                    hidden
                    spellcheck="false"
                    wrap="off"
                    rows="1"
                    aria-label="Type text"
                    class="absolute z-[33] m-0 p-1 border-0 bg-white/85 dark:bg-black/75 text-slate-900 dark:text-white resize-none overflow-hidden whitespace-pre select-text outline-2 outline-dashed outline-sky-500 shadow-md rounded"
                  ></textarea>

                  <!-- Clone Stamp source crosshair -->
                  <div id="vsCloneSrcMark" hidden class="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[31]">
                    <span class="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-sky-400 shadow-[0_0_0_1px_rgba(0,0,0,0.75)]"></span>
                    <span class="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-sky-400 shadow-[0_0_0_1px_rgba(0,0,0,0.75)]"></span>
                  </div>

                  <!-- Feathered Brush / Eraser Cursor -->
                  <div
                    id="vsEraserCursor"
                    data-hud="false"
                    class="ds-eraser-cursor group/cursor absolute w-6 h-6 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
                    hidden
                  >
                    <span class="absolute inset-0 z-20 rounded-full border border-emerald-500/80 shadow-[0_0_0_1px_rgba(255,255,255,0.85)] pointer-events-none"></span>
                  </div>

                  <!-- Eyedropper Loupe -->
                  <div
                    id="vsPickerLoupe"
                    class="ds-picker-loupe absolute inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-900/95 border border-white/25 text-white text-[12px] font-bold pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+14px)] z-35 shadow-lg whitespace-nowrap"
                    hidden
                  >
                    <span class="w-3.5 h-3.5 rounded-full border-2 border-white shrink-0" id="vsPickerLoupeSwatch"></span>
                    <code id="vsPickerLoupeHex">#FFFFFF</code>
                  </div>
                </div>

                <!-- Interactive Split Divider Handle (Visible in Split Mode) -->
                <div
                  class="vs-split-handle absolute top-0 bottom-0 w-0.5 bg-white/95 shadow-[0_0_10px_rgba(0,0,0,0.45)] cursor-ew-resize z-20"
                  id="vsSplitHandle"
                  style="left:50%;"
                  title="ড্রাগ করে আসল ছবি ও ভেক্টর তুলনা করুন (Drag to compare Before & After)"
                >
                  <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-violet-500 shadow-lg flex items-center justify-center text-[11px] font-extrabold text-violet-600 dark:text-violet-300 select-none">
                    ↔
                  </span>
                </div>

                <!-- Floating Mode Corner Badges -->
                <div id="vsBadgeOrig" class="absolute left-3 top-3 px-2.5 py-1 rounded-md bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold z-10 pointer-events-none border border-white/10" data-i18n-bn="মূল / এডিটেড রাস্টার" data-i18n-en="Source Raster">
                  মূল / এডিটেড রাস্টার
                </div>
                <div id="vsBadgeVec" class="absolute right-3 top-3 px-2.5 py-1 rounded-md bg-violet-600/90 backdrop-blur-xs text-white text-[11px] font-bold z-10 pointer-events-none shadow-sm" data-i18n-bn="হাই-কোয়ালিটি ভেক্টর (SVG/EPS/AI)" data-i18n-en="High-Quality Vector">
                  হাই-কোয়ালিটি ভেক্টর (SVG/EPS/AI)
                </div>

                <!-- SATISFYING 3D KINETIC GYROSCOPE PRELOADER -->
                <div
                  id="vsPreviewLoader"
                  data-state="loading"
                  class="ds-sat-loader absolute inset-0 overflow-hidden pointer-events-none z-30 flex items-center justify-center bg-slate-900/15 dark:bg-slate-950/35 transition-opacity duration-200"
                  hidden
                  aria-live="polite"
                >
                  <div class="ds-sat-toptrack absolute inset-x-0 top-0 h-[3px] bg-slate-200/40 dark:bg-slate-800/50 overflow-hidden">
                    <div class="ds-sat-topbar h-full w-full origin-left bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400"></div>
                  </div>
                  <div class="ds-sat-pod relative w-22 h-22 rounded-2xl bg-white/96 dark:bg-slate-900/96 border border-slate-200/85 dark:border-slate-700/85 shadow-2xl flex flex-col items-center justify-center gap-2">
                    <div class="ds-sat-gyro relative w-11 h-11 flex items-center justify-center">
                      <span class="inline-block w-9 h-9 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                    <span class="text-[10.5px] font-extrabold text-violet-600 dark:text-violet-300" data-i18n-bn="ভেক্টর তৈরি হচ্ছে…" data-i18n-en="Vectorizing…">ভেক্টর তৈরি হচ্ছে…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- BOTTOM WORKSPACE HUD & ZOOM BAR -->
      <footer
        class="ds-status group-data-[has-pages=false]/ds:!hidden min-h-[34px] px-3 py-1 border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar flex items-center justify-between gap-2 flex-wrap text-[12px] text-slate-600 dark:text-studio-muted shrink-0"
      >
        <div class="ds-status-left inline-flex items-center gap-2 flex-wrap">
          <!-- Zoom Controls -->
          <div
            class="ds-zoom inline-flex items-center gap-0.5 p-0.5 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border"
            role="group"
            aria-label="Canvas Zoom"
          >
            <button
              type="button"
              id="vsZoomOut"
              data-vs="zoom-out"
              title="জুম আউট (Ctrl -)"
              class="min-h-[22px] min-w-[24px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
            >−</button>
            <span id="vsZoomLabel" class="min-w-[42px] text-center font-bold text-[12px] text-slate-800 dark:text-studio-text tabular-nums">100%</span>
            <button
              type="button"
              id="vsZoomIn"
              data-vs="zoom-in"
              title="জুম ইন (Ctrl +)"
              class="min-h-[22px] min-w-[24px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
            >+</button>
            <button
              type="button"
              id="vsZoomFit"
              data-vs="fit"
              title="স্ক্রিনে ফিট করুন (Fit)"
              class="min-h-[22px] min-w-[26px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
            >Fit</button>
            <button
              type="button"
              id="vsZoom100"
              data-vs="actual"
              title="১০০% আসল মাপ (1:1)"
              class="min-h-[22px] min-w-[32px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
            >100%</button>
          </div>

          <!-- Split Slider Scrubber -->
          <label
            id="vsSplitWrap"
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-[11px] font-bold text-violet-700 dark:text-violet-300"
            title="Before / After Split Position"
          >
            <span data-i18n-bn="তুলনা:" data-i18n-en="Split:">তুলনা:</span>
            <input type="range" min="0" max="100" step="0.1" value="50" class="w-20 cursor-pointer" id="vsSplit" aria-label="Before / after split" />
          </label>

          <span
            class="ds-page-pill px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[11.5px] font-bold text-slate-700 dark:text-studio-text tabular-nums"
            id="vsPageName">লোগো ১/১</span
          >
          <small
            id="vsPreviewMeta"
            class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted font-semibold text-[11px] tabular-nums whitespace-nowrap"
          >—</small>

          <!-- Live Vector Stats Pills -->
          <div class="inline-flex items-center gap-1.5 flex-wrap text-[11px] font-semibold" id="vsStatsBar">
            <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-slate-700 dark:text-studio-text">
              <span data-i18n-bn="পাথ" data-i18n-en="Paths">পাথ</span>: <strong id="vsStatPaths">0</strong> ·
              <span data-i18n-bn="নোড" data-i18n-en="Nodes">নোড</span>: <strong id="vsStatNodes">0</strong> ·
              <span data-i18n-bn="রং" data-i18n-en="Colors">রং</span>: <strong id="vsStatColors">0</strong>
            </span>
            <span class="max-xl:hidden px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 tabular-nums">
              SVG <strong id="vsStatSvg">0 KB</strong> · EPS <strong id="vsStatEps">0 KB</strong> · AI <strong id="vsStatAi">0 KB</strong>
            </span>
          </div>
        </div>

        <span id="vsStatus" role="status" class="text-slate-700 dark:text-studio-text font-semibold text-[11.5px] truncate max-md:hidden">
          প্রস্তুত · যেকোনো পরিবর্তন সাথে সাথে ভেক্টর প্রিভিউতে দেখা যাবে
        </span>

        <div class="ds-status-right inline-flex items-center gap-2">
          <button
            type="button"
            id="vsCompare"
            data-vs="compare"
            class="inline-flex items-center justify-center w-7 h-6 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-studio-surface aria-pressed:bg-emerald-500/15 aria-pressed:border-emerald-500 aria-pressed:text-emerald-700"
            aria-pressed="false"
            title="মূল ছবি ও ভেক্টর তুলনা করুন (Compare Original)"
          >
            <Icon name="lucide:split-square-horizontal" class="w-4 h-4 shrink-0" />
          </button>
        </div>
      </footer>
    </div>

    <!-- RIGHT PANEL: PHOTOSHOP-STYLE 3-TAB INSPECTOR + PHOTOSHOP LAYERS STACK + EXPORT DOCK -->
    <aside
      class="ds-settings group-data-[has-pages=false]/ds:!hidden bg-white dark:bg-studio-sidebar border-l border-slate-200 dark:border-studio-border flex flex-col min-h-0 overflow-hidden max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-auto max-lg:w-full max-lg:h-[52dvh] max-lg:rounded-t-2xl max-lg:border-t max-lg:border-l-0 max-lg:z-90 max-lg:shadow-2xl max-lg:translate-y-[104%] max-lg:group-data-[drawer=inspector]/ds:translate-y-0 max-lg:transition-transform max-lg:duration-200 max-lg:overflow-y-auto"
      id="vsInspectorPanel"
      aria-label="Vector Inspector & Layers"
    >
      <!-- UPPER DOCK: PHOTOSHOP-STYLE 3-TAB PANEL (PRESETS · SMART FIX · ADJUSTMENTS) -->
      <div class="shrink-0 border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel flex flex-col">
        <!-- Photoshop-Style Tab Header Bar -->
        <div
          class="ds-panel-head min-h-[36px] px-1.5 pt-1 flex items-end justify-between gap-1 border-b border-slate-200 dark:border-studio-border bg-slate-100 dark:bg-[#252525] shrink-0"
        >
          <div class="inline-flex items-end gap-0.5 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Vector Inspector Tabs">
            <button
              type="button"
              role="tab"
              data-vs-insp-tab="trace"
              aria-selected="true"
              class="inline-flex items-center gap-1 h-7 px-2 rounded-t-md border border-b-0 border-transparent text-[11.5px] font-bold whitespace-nowrap shrink-0 text-slate-600 dark:text-slate-400 bg-transparent cursor-pointer hover:text-slate-900 dark:hover:text-white aria-selected:bg-white dark:aria-selected:bg-studio-panel aria-selected:border-slate-200 dark:aria-selected:border-studio-border aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400 transition-colors"
            >
              <Icon name="lucide:scan-line" class="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span data-i18n-bn="ইমেজ ট্রেস" data-i18n-en="Image Trace">ইমেজ ট্রেস</span>
            </button>
            <button
              type="button"
              role="tab"
              data-vs-insp-tab="filters"
              aria-selected="false"
              class="inline-flex items-center gap-1 h-7 px-2 rounded-t-md border border-b-0 border-transparent text-[11.5px] font-bold whitespace-nowrap shrink-0 text-slate-600 dark:text-slate-400 bg-transparent cursor-pointer hover:text-slate-900 dark:hover:text-white aria-selected:bg-white dark:aria-selected:bg-studio-panel aria-selected:border-slate-200 dark:aria-selected:border-studio-border aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400 transition-colors"
            >
              <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span data-i18n-bn="প্রিসেট" data-i18n-en="Presets">প্রিসেট</span>
            </button>
            <button
              type="button"
              role="tab"
              data-vs-insp-tab="smart"
              aria-selected="false"
              class="inline-flex items-center gap-1 h-7 px-2 rounded-t-md border border-b-0 border-transparent text-[11.5px] font-bold whitespace-nowrap shrink-0 text-slate-600 dark:text-slate-400 bg-transparent cursor-pointer hover:text-slate-900 dark:hover:text-white aria-selected:bg-white dark:aria-selected:bg-studio-panel aria-selected:border-slate-200 dark:aria-selected:border-studio-border aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400 transition-colors"
            >
              <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span data-i18n-bn="স্মার্ট ফিক্স" data-i18n-en="Smart Fix">স্মার্ট ফিক্স</span>
            </button>
            <button
              type="button"
              role="tab"
              data-vs-insp-tab="manual"
              aria-selected="false"
              class="inline-flex items-center gap-1 h-7 px-2 rounded-t-md border border-b-0 border-transparent text-[11.5px] font-bold whitespace-nowrap shrink-0 text-slate-600 dark:text-slate-400 bg-transparent cursor-pointer hover:text-slate-900 dark:hover:text-white aria-selected:bg-white dark:aria-selected:bg-studio-panel aria-selected:border-slate-200 dark:aria-selected:border-studio-border aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400 transition-colors"
            >
              <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span data-i18n-bn="অ্যাডজাস্টমেন্ট" data-i18n-en="Adjustments">অ্যাডজাস্টমেন্ট</span>
            </button>
          </div>
          <div class="ds-panel-head-actions inline-flex items-center gap-1 pb-1 shrink-0">
            <button
              type="button"
              data-vs="reset-settings"
              class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-studio-surface"
              title="ডিফল্ট ভেক্টর সেটিংসে ফিরুন (Reset Vector Settings)"
            >
              <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              type="button"
              class="ds-icon-only ds-drawer-close hidden max-lg:inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200 dark:border-studio-border bg-slate-100 dark:bg-studio-panel text-[11px] font-bold cursor-pointer"
              data-vs="close-drawers"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- TAB PANE 0: ADOBE ILLUSTRATOR-STYLE IMAGE TRACE PANEL -->
        <section data-vs-insp-pane="trace" id="itPanel" class="bg-white dark:bg-studio-panel overflow-y-auto max-h-[46dvh] shrink-0 text-[11.5px] text-slate-700 dark:text-[#d6d6d6]">
          <!-- Quick preset icons (Auto Color · High Color · Low Color · Grayscale · B&W · Outline) -->
          <div class="px-2 pt-2 pb-1.5 flex items-center justify-between gap-1 border-b border-slate-100 dark:border-[#1a1a1a]">
            {#each itQuick as q}
              <button
                type="button"
                data-it-quick={q.id}
                title={`${q.bn} (${q.en})`}
                class="flex-1 h-8 inline-flex items-center justify-center rounded-[4px] border border-slate-200 dark:border-[#141414] bg-slate-50 dark:bg-[#2b2b2b] hover:bg-white dark:hover:bg-[#3a3a3a] hover:border-orange-400/70 cursor-pointer transition-colors"
              >
                <Icon name={q.icon} class="w-4 h-4 shrink-0" />
              </button>
            {/each}
          </div>

          <div class="p-2 space-y-1.5">
            <!-- Preset -->
            <label class="grid grid-cols-[64px_1fr] items-center gap-1.5">
              <span class={psLbl} data-i18n-bn="প্রিসেট:" data-i18n-en="Preset:">প্রিসেট:</span>
              <select id="itPreset" class="{psSel} w-full">
                <option value="custom" data-i18n-bn="[কাস্টম]" data-i18n-en="[Custom]">[কাস্টম]</option>
                {#each itPresetGroups as g}
                  <optgroup label={g.label}>
                    {#each g.items as it}
                      <option value={it.v} selected={it.v === 'auto'}>{it.t}</option>
                    {/each}
                  </optgroup>
                {/each}
              </select>
            </label>

            <!-- View + hold-to-see-source eye -->
            <div class="grid grid-cols-[64px_1fr_auto] items-center gap-1.5">
              <label for="itView" class={psLbl} data-i18n-bn="ভিউ:" data-i18n-en="View:">ভিউ:</label>
              <select id="itView" class="{psSel} w-full">
                {#each itViews as v}
                  <option value={v.v} selected={v.v === 'split'}>{v.t}</option>
                {/each}
              </select>
              <button type="button" id="itEye" class="{psBtn} !w-[25px] !px-0" title="চেপে ধরে মূল ছবি দেখুন (Hold to view Source Image)">
                <Icon name="lucide:eye" class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Mode -->
            <label class="grid grid-cols-[64px_1fr] items-center gap-1.5">
              <span class={psLbl} data-i18n-bn="মোড:" data-i18n-en="Mode:">মোড:</span>
              <select id="itMode" class="{psSel} w-full">
                <option value="color" data-i18n-bn="কালার (Color)" data-i18n-en="Color">কালার (Color)</option>
                <option value="gray" data-i18n-bn="গ্রেস্কেল (Grayscale)" data-i18n-en="Grayscale">গ্রেস্কেল (Grayscale)</option>
                <option value="mono" data-i18n-bn="সাদা-কালো (Black and White)" data-i18n-en="Black and White">সাদা-কালো (Black and White)</option>
              </select>
            </label>

            <!-- Palette (Color mode) -->
            <label class="grid grid-cols-[64px_1fr] items-center gap-1.5" data-it-when="color">
              <span class={psLbl} data-i18n-bn="প্যালেট:" data-i18n-en="Palette:">প্যালেট:</span>
              <select id="itPalette" class="{psSel} w-full">
                <option value="auto" data-i18n-bn="অটোমেটিক (Automatic)" data-i18n-en="Automatic">অটোমেটিক (Automatic)</option>
                <option value="limited" data-i18n-bn="লিমিটেড (Limited)" data-i18n-en="Limited">লিমিটেড (Limited)</option>
                <option value="full" data-i18n-bn="ফুল টোন (Full Tone)" data-i18n-en="Full Tone">ফুল টোন (Full Tone)</option>
                <option value="custom" data-i18n-bn="ডকুমেন্ট লাইব্রেরি (Swatches)" data-i18n-en="Document Library">ডকুমেন্ট লাইব্রেরি (Swatches)</option>
              </select>
            </label>

            <!-- Custom swatch library -->
            <div class="rounded-[4px] border border-slate-200 dark:border-[#141414] bg-slate-50/70 dark:bg-[#1e1e1e] p-1.5 space-y-1" data-it-when="color" data-it-pal="custom" hidden>
              <div id="itSwatches" class="flex flex-wrap gap-1 min-h-[20px] items-center"></div>
              <div class="flex items-center gap-1">
                <label class="{psBtn} relative" title="সোয়াচ যোগ করুন (Add swatch)">
                  <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                  <span data-i18n-bn="সোয়াচ" data-i18n-en="Swatch">সোয়াচ</span>
                  <input type="color" id="itSwatchAdd" value="#1d4ed8" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </label>
                <button type="button" data-it="extract" class={psBtn} title="ছবি থেকে রং নিন (Extract colors from image)">
                  <Icon name="lucide:pipette" class="w-3.5 h-3.5" />
                  <span data-i18n-bn="ছবি থেকে" data-i18n-en="From Image">ছবি থেকে</span>
                </button>
              </div>
            </div>

            <!-- Colors / Grays / Threshold -->
            {#each itSliders as s}
              <div class="grid grid-cols-[64px_1fr_46px] items-center gap-1.5" data-it-when={s.when}>
                <label for={s.id} class={psLbl} data-i18n-bn={s.bn + ':'} data-i18n-en={s.en + ':'}>{s.bn}:</label>
                <div class="flex flex-col">
                  <input id={s.id} type="range" min={s.min} max={s.max} step={s.step} value={s.val} class="w-full h-4 accent-orange-500 cursor-pointer" />
                  <span class="flex justify-between text-[9.5px] text-slate-400 dark:text-slate-500 leading-none"><span>{s.lo}</span><span>{s.hi}</span></span>
                </div>
                <input id={s.id + 'Num'} type="number" min={s.min} max={s.max} step={s.step} value={s.val} class="{psSel} w-full !px-1 text-right tabular-nums" aria-label={s.en} />
              </div>
            {/each}
            <label class="flex items-center gap-1.5 pl-[70px]" data-it-when="mono">
              <input id="itAutoThr" type="checkbox" class="w-3.5 h-3.5 accent-orange-500 cursor-pointer" />
              <span data-i18n-bn="অটো থ্রেশহোল্ড (Otsu)" data-i18n-en="Auto Threshold (Otsu)">অটো থ্রেশহোল্ড (Otsu)</span>
            </label>
            <label class="flex items-center gap-1.5 pl-[70px]" data-it-when="color">
              <input id="itGradients" type="checkbox" checked class="w-3.5 h-3.5 accent-orange-500 cursor-pointer" />
              <span data-i18n-bn="গ্রেডিয়েন্ট রাখুন (Keep Gradients)" data-i18n-en="Keep Gradients">গ্রেডিয়েন্ট রাখুন (Keep Gradients)</span>
            </label>

            <!-- Advanced -->
            <details open class="group/adv rounded-[4px] border border-slate-200 dark:border-[#141414] bg-slate-50/50 dark:bg-[#232323]">
              <summary class="list-none cursor-pointer select-none px-2 py-1 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 w-full">
                <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 transition-transform group-open/adv:rotate-90" />
                <span data-i18n-bn="অ্যাডভান্সড" data-i18n-en="Advanced">অ্যাডভান্সড</span>
              </summary>
              <div class="px-2 pb-2 space-y-1.5">
                {#each itAdvSliders as s}
                  <div class="grid grid-cols-[56px_1fr_46px] items-center gap-1.5">
                    <label for={s.id} class={psLbl} data-i18n-bn={s.bn + ':'} data-i18n-en={s.en + ':'}>{s.bn}:</label>
                    <div class="flex flex-col">
                      <input id={s.id} type="range" min={s.min} max={s.max} step={s.step} value={s.val} class="w-full h-4 accent-orange-500 cursor-pointer" />
                      <span class="flex justify-between text-[9.5px] text-slate-400 dark:text-slate-500 leading-none"><span>{s.lo}</span><span>{s.hi}</span></span>
                    </div>
                    <div class="relative">
                      <input id={s.id + 'Num'} type="number" min={s.min} max={s.max} step={s.step} value={s.val} class="{psSel} w-full !px-1 !pr-4 text-right tabular-nums" aria-label={s.en} />
                      <span class="absolute right-1 top-1/2 -translate-y-1/2 text-[9.5px] text-slate-400 pointer-events-none">{s.unit}</span>
                    </div>
                  </div>
                {/each}

                <!-- Method: Abutting / Overlapping -->
                <div class="grid grid-cols-[56px_1fr] items-center gap-1.5">
                  <span class={psLbl} data-i18n-bn="মেথড:" data-i18n-en="Method:">মেথড:</span>
                  <div class="inline-flex gap-1">
                    <button type="button" data-it-method="abut" aria-pressed="false" class="{psBtn} aria-pressed:!border-orange-500 aria-pressed:!bg-orange-500/15" title="Abutting — পাশাপাশি কাটা পাথ (Cutout)">
                      <svg viewBox="0 0 20 14" class="w-5 h-3.5"><rect x="1" y="1" width="9" height="12" fill="currentColor" opacity=".35"/><rect x="10" y="1" width="9" height="12" fill="currentColor" opacity=".8"/></svg>
                      <span data-i18n-bn="অ্যাবাটিং" data-i18n-en="Abutting">অ্যাবাটিং</span>
                    </button>
                    <button type="button" data-it-method="overlap" aria-pressed="true" class="{psBtn} aria-pressed:!border-orange-500 aria-pressed:!bg-orange-500/15" title="Overlapping — স্ট্যাকড পাথ, গ্যাপ নেই (Stacked)">
                      <svg viewBox="0 0 20 14" class="w-5 h-3.5"><rect x="1" y="1" width="13" height="12" fill="currentColor" opacity=".35"/><rect x="7" y="3" width="12" height="10" fill="currentColor" opacity=".8"/></svg>
                      <span data-i18n-bn="ওভারল্যাপিং" data-i18n-en="Overlapping">ওভারল্যাপিং</span>
                    </button>
                  </div>
                </div>

                <!-- Create: Fills / Strokes (B&W) -->
                <div class="grid grid-cols-[56px_1fr] items-center gap-1.5" data-it-when="mono">
                  <span class={psLbl} data-i18n-bn="তৈরি:" data-i18n-en="Create:">তৈরি:</span>
                  <div class="inline-flex items-center gap-3">
                    <label class="inline-flex items-center gap-1 cursor-pointer"><input id="itFills" type="checkbox" checked class="w-3.5 h-3.5 accent-orange-500" /><span data-i18n-bn="ফিল" data-i18n-en="Fills">ফিল</span></label>
                    <label class="inline-flex items-center gap-1 cursor-pointer"><input id="itStrokes" type="checkbox" class="w-3.5 h-3.5 accent-orange-500" /><span data-i18n-bn="স্ট্রোক" data-i18n-en="Strokes">স্ট্রোক</span></label>
                  </div>
                </div>
                <div class="grid grid-cols-[56px_1fr_46px] items-center gap-1.5" data-it-when="mono" data-it-strokes-row>
                  <label for="itStrokeW" class={psLbl} data-i18n-bn="স্ট্রোক:" data-i18n-en="Stroke:">স্ট্রোক:</label>
                  <input id="itStrokeW" type="range" min="1" max="100" step="1" value="10" class="w-full h-4 accent-orange-500 cursor-pointer" />
                  <div class="relative">
                    <input id="itStrokeWNum" type="number" min="1" max="100" step="1" value="10" class="{psSel} w-full !px-1 !pr-4 text-right tabular-nums" aria-label="Stroke width" />
                    <span class="absolute right-1 top-1/2 -translate-y-1/2 text-[9.5px] text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>

                <!-- Options -->
                <div class="grid grid-cols-[56px_1fr] items-start gap-1.5">
                  <span class="{psLbl} pt-0.5" data-i18n-bn="অপশন:" data-i18n-en="Options:">অপশন:</span>
                  <div class="flex flex-col gap-1">
                    <label class="inline-flex items-center gap-1.5 cursor-pointer"><input id="itSnapLines" type="checkbox" class="w-3.5 h-3.5 accent-orange-500" /><span data-i18n-bn="কার্ভকে লাইনে স্ন্যাপ (Snap Curves To Lines)" data-i18n-en="Snap Curves To Lines">কার্ভকে লাইনে স্ন্যাপ (Snap Curves To Lines)</span></label>
                    <label class="inline-flex items-center gap-1.5 cursor-pointer"><input id="itIgnoreWhite" type="checkbox" class="w-3.5 h-3.5 accent-orange-500" /><span data-i18n-bn="সাদা বাদ দিন (Ignore White)" data-i18n-en="Ignore White">সাদা বাদ দিন (Ignore White)</span></label>
                  </div>
                </div>
              </div>
            </details>

            <!-- Info: Paths / Anchors / Colors -->
            <div class="grid grid-cols-3 gap-1 rounded-[4px] border border-slate-200 dark:border-[#141414] bg-slate-50 dark:bg-[#1e1e1e] px-2 py-1 tabular-nums">
              <span><span class="text-slate-400" data-i18n-bn="পাথ:" data-i18n-en="Paths:">পাথ:</span> <b id="itStatPaths" class="text-slate-800 dark:text-white">0</b></span>
              <span><span class="text-slate-400" data-i18n-bn="অ্যাঙ্কর:" data-i18n-en="Anchors:">অ্যাঙ্কর:</span> <b id="itStatAnchors" class="text-slate-800 dark:text-white">0</b></span>
              <span><span class="text-slate-400" data-i18n-bn="রং:" data-i18n-en="Colors:">রং:</span> <b id="itStatColors" class="text-slate-800 dark:text-white">0</b></span>
            </div>

            <!-- Preview + Trace -->
            <div class="flex items-center justify-between gap-2">
              <label class="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                <input id="itPreview" type="checkbox" checked class="w-3.5 h-3.5 accent-orange-500" />
                <span data-i18n-bn="প্রিভিউ" data-i18n-en="Preview">প্রিভিউ</span>
              </label>
              <button type="button" data-it="trace" class="{psBtn} !h-7 !px-4 !bg-orange-500 !border-orange-600 !text-white font-bold hover:!bg-orange-600">
                <span data-i18n-bn="ট্রেস" data-i18n-en="Trace">ট্রেস</span>
              </button>
            </div>
          </div>
        </section>

        <!-- TAB PANE 1: HIGH-QUALITY LOGO & ICON PRESETS + TRACING MODE -->
        <section data-vs-insp-pane="filters" hidden class="bg-white dark:bg-studio-panel overflow-hidden shrink-0">
          <div class="px-2.5 py-1 bg-slate-50/70 dark:bg-studio-sidebar/60 border-b border-slate-100 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 dark:text-studio-muted">
              <span data-i18n-bn="লোগো ও আইকন ভেক্টর প্রিসেট" data-i18n-en="Logo & Icon Vector Presets">লোগো ও আইকন ভেক্টর প্রিসেট</span>
              <span class="inline-flex items-center px-1.5 py-0.2 rounded-full bg-violet-500/12 text-violet-700 dark:text-violet-300 text-[10px] font-bold">HD</span>
            </span>
            <!-- Mode Switcher (Full Color vs Monochrome) -->
            <div class="inline-flex p-0.5 rounded bg-slate-200/80 dark:bg-[#1e1e1e] border border-slate-300/70 dark:border-[#333]" id="vsModeTabs">
              <button
                type="button"
                data-vs-mode="color"
                class="px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors bg-white dark:bg-violet-600 text-violet-700 dark:text-white shadow-2xs"
                data-i18n-bn="ফুল কালার"
                data-i18n-en="Full Color"
              >ফুল কালার</button>
              <button
                type="button"
                data-vs-mode="mono"
                class="px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors text-slate-600 dark:text-slate-400"
                data-i18n-bn="মনোক্রোম"
                data-i18n-en="Mono"
              >মনোক্রোম</button>
            </div>
          </div>

          <fieldset class="ds-presets m-0 p-2 border-0 grid grid-cols-2 gap-1.5">
            <legend class="sr-only">Logo Vector Presets</legend>
            {#each vectorPresets as preset, idx}
              {@const presetColors = [
                'text-violet-600 dark:text-violet-400',
                'text-emerald-600 dark:text-emerald-400',
                'text-blue-600 dark:text-blue-400',
                'text-amber-500 dark:text-amber-400',
                'text-fuchsia-600 dark:text-fuchsia-400',
                'text-cyan-600 dark:text-cyan-400'
              ]}
              <label class="relative cursor-pointer {idx === 0 ? 'col-span-2' : ''}" title={preset.descBn}>
                <input type="radio" name="vsPreset" value={preset.value} checked={idx === 0} class="sr-only peer" />
                <span
                  class="min-h-[30px] px-2 py-1 rounded-[4px] border border-slate-200/90 dark:border-[#141414] bg-slate-50/70 dark:bg-[#1e1e1e] flex items-center justify-between gap-1.5 transition-all hover:border-slate-300 dark:hover:border-[#4a4a4a] hover:bg-white dark:hover:bg-[#333333] peer-checked:border-emerald-500 dark:peer-checked:border-[#5a5a5a] peer-checked:bg-emerald-500/10 dark:peer-checked:bg-[#3d3d3d] peer-checked:shadow-2xs peer-checked:[&_b]:text-emerald-700 dark:peer-checked:[&_b]:text-white"
                >
                  <span class="inline-flex items-center gap-1.5 min-w-0">
                    <Icon name={`lucide:${preset.icon}`} class="w-3.5 h-3.5 {presetColors[idx % presetColors.length]} shrink-0" />
                    <b class="text-[11.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-bn={preset.titleBn} data-i18n-en={preset.titleEn}>{preset.titleBn}</b>
                  </span>
                  {#if idx === 0}
                    <small class="text-[10px] text-slate-500 dark:text-studio-muted truncate ml-auto mr-1" data-i18n-bn={preset.descBn} data-i18n-en={preset.descEn}>{preset.descBn}</small>
                  {/if}
                  {#if preset.ai}
                    <em class="ds-ai-tag not-italic px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9.5px] font-extrabold tracking-wider uppercase shrink-0">HD</em>
                  {/if}
                </span>
              </label>
            {/each}
          </fieldset>
        </section>

        <!-- TAB PANE 2: SMART FIX & BACKGROUND CLEANUP -->
        <section data-vs-insp-pane="smart" hidden class="ds-section ds-smart-options bg-white dark:bg-studio-panel overflow-hidden shrink-0">
          <div class="px-2.5 py-1 bg-slate-50/70 dark:bg-studio-sidebar/60 border-b border-slate-100 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 dark:text-studio-muted">
              <span data-i18n-bn="স্মার্ট ব্যাকগ্রাউন্ড ও এজ ফিক্স" data-i18n-en="Smart Background & Edge Fix">স্মার্ট ব্যাকগ্রাউন্ড ও এজ ফিক্স</span>
              <span class="inline-flex items-center px-1.5 py-0.2 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[10px] font-bold">Auto</span>
            </span>
          </div>

          <div class="p-2 space-y-1.5">
            <!-- Background Removal Selector + Color Key Picker -->
            <div class="grid grid-cols-[1fr_auto] items-center gap-1.5 p-1.5 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414]">
              <label class="flex items-center justify-between gap-1.5 text-[11.5px] font-semibold text-slate-800 dark:text-studio-text" for="vsBgMode">
                <span class="inline-flex items-center gap-1.5">
                  <Icon name="lucide:eraser" class="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span data-i18n-bn="ব্যাকগ্রাউন্ড রিমুভ" data-i18n-en="BG Removal">ব্যাকগ্রাউন্ড রিমুভ</span>
                </span>
                <select id="vsBgMode" class="{psSel} !h-6 text-[11px]">
                  <option value="off" data-i18n-bn="বন্ধ (Off)" data-i18n-en="Off">বন্ধ (Off)</option>
                  <option value="flood" data-i18n-bn="স্মার্ট বর্ডার BG" data-i18n-en="Smart Border BG">স্মার্ট বর্ডার BG</option>
                  <option value="color" data-i18n-bn="রঙ কী (Color Key)" data-i18n-en="Color Key">রঙ কী (Color Key)</option>
                  <option value="bright" data-i18n-bn="সাদা / উজ্জ্বল BG" data-i18n-en="Bright / White BG">সাদা / উজ্জ্বল BG</option>
                </select>
              </label>
              <div class="inline-flex items-center gap-1" id="vsBgColorRow">
                <input type="color" id="vsBgColor" value="#ffffff" title="Background Key Color" class="w-6 h-6 rounded border border-slate-300 dark:border-studio-border bg-transparent cursor-pointer p-0" />
                <button type="button" id="vsBgPick" class="{psBtn} !h-6 !px-1.5" title="ছবি থেকে ব্যাকগ্রাউন্ডের রঙ পিক করুন (Pick from image)">
                  <Icon name="lucide:pipette" class="w-3.5 h-3.5 text-violet-500" />
                </button>
              </div>
            </div>

            <!-- 2-Column Smart Fix Switches -->
            <div class="grid grid-cols-2 gap-1.5">
              <label class="ds-toggle min-h-[30px] flex items-center justify-between gap-1 px-2 py-1 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414] cursor-pointer text-[11.5px] font-semibold text-slate-800 dark:text-studio-text hover:bg-white dark:hover:bg-[#333333]" title="ছোট বা ঘোলা লোগোকে অটো শার্প ও হাই-ডেফিনিশন করে ভেক্টর করে">
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <em class="not-italic truncate" data-i18n-bn="লোগো HD শার্প" data-i18n-en="HD Logo Boost">লোগো HD শার্প</em>
                </span>
                <input id="vsHdEnhance" type="checkbox" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>

              <label class="ds-toggle min-h-[30px] flex items-center justify-between gap-1 px-2 py-1 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414] cursor-pointer text-[11.5px] font-semibold text-slate-800 dark:text-studio-text hover:bg-white dark:hover:bg-[#333333]" title="গ্যাপ-মুক্ত স্ট্যাকড লেয়ার (রঙের মাঝে ফাঁকা দাগ থাকবে না)">
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name="lucide:layers" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <em class="not-italic truncate" data-i18n-bn="গ্যাপ-মুক্ত স্ট্যাক" data-i18n-en="Gap-Free Stack">গ্যাপ-মুক্ত স্ট্যাক</em>
                </span>
                <input id="vsGapFree" type="checkbox" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>

              <label class="ds-toggle min-h-[30px] flex items-center justify-between gap-1 px-2 py-1 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414] cursor-pointer text-[11.5px] font-semibold text-slate-800 dark:text-studio-text hover:bg-white dark:hover:bg-[#333333]" id="vsMonoOptions">
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name="lucide:sun" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <em class="not-italic truncate" data-i18n-bn="অটো থ্রেশহোল্ড" data-i18n-en="Auto Threshold">অটো থ্রেশহোল্ড</em>
                </span>
                <input id="vsAutoThr" type="checkbox" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>

              <label class="ds-toggle min-h-[30px] flex items-center justify-between gap-1 px-2 py-1 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414] cursor-pointer text-[11.5px] font-semibold text-slate-800 dark:text-studio-text hover:bg-white dark:hover:bg-[#333333]">
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name="lucide:contrast" class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <em class="not-italic truncate" data-i18n-bn="ইনভার্ট ট্রেস" data-i18n-en="Invert Trace">ইনভার্ট ট্রেস</em>
                </span>
                <input id="vsInvert" type="checkbox" class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>

              <label class="ds-toggle min-h-[30px] flex items-center justify-between gap-1 px-2 py-1 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414] cursor-pointer text-[11.5px] font-semibold text-slate-800 dark:text-studio-text hover:bg-white dark:hover:bg-[#333333]" title="গ্রেডিয়েন্ট রঙকে অনেক সলিড লেয়ারে না ভেঙে আসল লিনিয়ার / রেডিয়াল গ্রেডিয়েন্ট হিসেবে রাখে">
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name="lucide:palette" class="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />
                  <em class="not-italic truncate" data-i18n-bn="গ্রেডিয়েন্ট রাখুন" data-i18n-en="Keep Gradients">গ্রেডিয়েন্ট রাখুন</em>
                </span>
                <input id="vsGradient" type="checkbox" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>

              <label class="ds-toggle min-h-[30px] flex items-center justify-between gap-1 px-2 py-1 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414] cursor-pointer text-[11.5px] font-semibold text-slate-800 dark:text-studio-text hover:bg-white dark:hover:bg-[#333333]" title="কর্নার শার্প করে, সোজা লাইন সোজা রাখে ও আনুভূমিক/উল্লম্ব লাইন স্ন্যাপ করে">
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name="lucide:square-dashed" class="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <em class="not-italic truncate" data-i18n-bn="শার্প কর্নার" data-i18n-en="Sharp Corners">শার্প কর্নার</em>
                </span>
                <input id="vsSharpCorners" type="checkbox" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>
            </div>
          </div>
        </section>

        <!-- TAB PANE 3: MANUAL ADJUSTMENTS (PHOTOSHOP SCRUBBY FILL-BAR PODS) -->
        <section data-vs-insp-pane="manual" hidden class="ds-section ds-sliders bg-white dark:bg-studio-panel overflow-hidden shrink-0" id="vsColorOptions">
          <div class="px-2.5 py-1 bg-slate-50/70 dark:bg-studio-sidebar/60 border-b border-slate-100 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 dark:text-studio-muted">
              <span data-i18n-bn="কার্ভ, কালার ও প্রি-প্রসেসিং" data-i18n-en="Curves, Colors & Preprocessing">কার্ভ, কালার ও প্রি-প্রসেসিং</span>
              <span class="inline-flex items-center px-1.5 py-0.2 rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 text-[10px] font-bold">Fine Tune</span>
            </span>
          </div>

          <div class="p-2">
            <div class="grid grid-cols-2 gap-1.5">
              {#each adjustments as adj}
                <div
                  data-vs-adj-pod={adj.key}
                  class="group/pod min-h-[30px] rounded-[4px] border border-slate-200/90 dark:border-[#141414] bg-slate-50/80 dark:bg-[#1e1e1e] flex items-stretch overflow-hidden transition-all hover:border-slate-300 dark:hover:border-[#4a4a4a] hover:bg-white dark:hover:bg-[#2a2a2a] data-[modified=true]:border-amber-500/50"
                >
                  <div class="relative flex-1 min-w-0 px-1.5 py-1 flex items-center justify-between gap-1 overflow-hidden select-none">
                    <span
                      data-vs-adj-fill={adj.key}
                      class="absolute inset-y-0 left-0 bg-emerald-500/14 dark:bg-white/[0.08] pointer-events-none transition-[width] duration-75"
                      style="width:{adj.initPct}%"
                    ></span>
                    <span class="relative z-10 inline-flex items-center gap-1 min-w-0 pointer-events-none">
                      <Icon name={adj.icon} class="w-3.5 h-3.5 {adj.color} shrink-0" />
                      <span class="truncate text-[11.5px] font-semibold tracking-[-0.01em] text-slate-700 dark:text-[#cfcfcf]" data-i18n-bn={adj.bn} data-i18n-en={adj.en}>{adj.bn}</span>
                    </span>
                    <output id={adj.outId} class="relative z-10 text-emerald-600 dark:text-[#e6e6e6] font-bold text-[11.5px] tabular-nums shrink-0 pointer-events-none">{adj.initVal}</output>
                    <input
                      id={adj.id}
                      aria-label={adj.en}
                      type="range"
                      min={adj.min}
                      max={adj.max}
                      step={adj.step}
                      value={adj.val}
                      class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
                    />
                  </div>
                  <button
                    type="button"
                    data-vs-reset-adj={adj.key}
                    class="w-5 shrink-0 border-0 border-l border-slate-200/70 dark:border-studio-border bg-transparent inline-flex items-center justify-center text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors z-30"
                    title="রিসেট (Reset)"
                  >
                    <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </section>
      </div>

      <!-- LOWER DOCK: PHOTOSHOP-STYLE VECTOR COLOR & RETOUCH LAYERS PANEL -->
      <section
        id="vsPaletteBox"
        class="ds-layers-panel flex-1 min-h-[168px] flex flex-col bg-slate-50 dark:bg-[#252525] overflow-hidden"
        aria-label="Vector Color Layers"
      >
        <!-- Layers Tab Header -->
        <div class="px-2 pt-1 bg-slate-200/75 dark:bg-[#1f1f1f] border-b border-slate-300/80 dark:border-black/50 flex items-end justify-between shrink-0">
          <div class="inline-flex items-center gap-1.5 h-6.5 px-2.5 rounded-t border border-b-0 border-slate-300/80 dark:border-white/10 bg-slate-50 dark:bg-[#2b2b2b] text-[12px] font-bold text-slate-800 dark:text-slate-100">
            <Icon name="lucide:layers" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span data-i18n-bn="ভেক্টর কালার লেয়ার" data-i18n-en="Vector Layers">ভেক্টর কালার লেয়ার</span>
            <span id="vsLayerCount" class="ml-0.5 px-1.5 py-0.2 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[10.5px] font-extrabold tabular-nums">0</span>
          </div>
          <span class="text-[10.5px] text-slate-400 dark:text-slate-500 pb-1 pr-1">Photoshop Stack</span>
        </div>

        <!-- Photoshop Stacking Mode + Active Layer Color + Show All Sub-Header -->
        <div class="px-2 py-1 bg-slate-100 dark:bg-[#2b2b2b] border-b border-slate-200 dark:border-black/40 flex items-center gap-1.5 shrink-0">
          <select id="vsLayerStackMode" class="{psSel} w-[112px] !h-6 !text-[11px]" title="Vector Layer Stacking Mode">
            <option value="stacked" data-i18n-bn="Stacked (No Gaps)" data-i18n-en="Stacked (No Gaps)">Stacked (No Gaps)</option>
            <option value="cutout" data-i18n-bn="Cutout (Exact)" data-i18n-en="Cutout (Exact)">Cutout (Exact)</option>
          </select>

          <button
            type="button"
            data-vs-layer-act="show-all"
            class="{psBtn} !h-6 !px-2 ml-auto text-[11px]"
            title="লুকানো সব লেয়ার আবার দেখান (Show All Layers)"
          >
            <Icon name="lucide:eye" class="w-3.5 h-3.5 text-emerald-500" />
            <span data-i18n-bn="সব দেখান" data-i18n-en="Show All">সব দেখান</span>
          </button>
        </div>

        <!-- Scrollable Vector Color Layer Stack (#vsPaletteList) -->
        <div
          id="vsPaletteList"
          class="flex-1 min-h-0 overflow-y-auto p-1 flex flex-col gap-0.5 bg-slate-200/55 dark:bg-[#1e1e1e] [scrollbar-width:thin]"
          role="listbox"
          aria-label="Vector Color Layers"
        ></div>

        <!-- Compact Photoshop-Style Layer Action Bar -->
        <div class="ds-layer-actions px-2 py-1 bg-slate-100 dark:bg-[#2b2b2b] border-t border-slate-200 dark:border-black/50 flex items-center justify-between gap-1 shrink-0">
          <span class="text-[10px] text-slate-500 dark:text-slate-400 truncate" data-i18n-bn="রং বদলান, লুকান, মার্জ বা ডিলিট করুন" data-i18n-en="Recolor, hide, merge or delete layers">
            রং বদলান, লুকান, মার্জ বা ডিলিট করুন
          </span>
          <div class="inline-flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              data-vs-layer-act="up"
              id="vsLayerUpBtn"
              class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200/80 dark:hover:bg-white/10"
              title="লেয়ার উপরে তুলুন (Move Layer Up)"
            >
              <Icon name="lucide:chevron-up" class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-vs-layer-act="down"
              id="vsLayerDownBtn"
              class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200/80 dark:hover:bg-white/10"
              title="লেয়ার নিচে নামান (Move Layer Down)"
            >
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-vs-layer-act="merge"
              id="vsLayerMergeBtn"
              class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200/80 dark:hover:bg-white/10"
              title="নিচের লেয়ারের সাথে একত্র (Merge Down) করুন"
            >
              <Icon name="lucide:merge" class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-vs="edit-page"
              class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/15"
              title="ফটোশপ ব্রাশ ও ইরেজার দিয়ে এডিট করুন (Retouch Canvas)"
            >
              <Icon name="lucide:paintbrush" class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-vs-layer-act="del"
              id="vsLayerDelBtn"
              class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-rose-500 dark:text-rose-400 cursor-pointer hover:bg-rose-500/15"
              title="নির্বাচিত লেয়ার মুছে ফেলুন (Delete Active Layer)"
            >
              <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <!-- BOTTOM EXPORT DOCK: QUICK FORMAT BUTTONS + EXPORT MODAL TRIGGER -->
      <div class="ds-export ds-section ds-export-settings p-2.5 border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar shrink-0 space-y-2">
        <div class="grid grid-cols-4 gap-1.5">
          <button type="button" id="vsDlSvg" class="{btnBase} !min-h-[30px] !px-2 justify-center font-extrabold text-[11.5px]" title="Download Editable SVG Vector">
            <Icon name="lucide:file-code-2" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>SVG</span>
          </button>
          <button type="button" id="vsDlEps" class="{btnBase} !min-h-[30px] !px-2 justify-center font-extrabold text-[11.5px]" title="Download PostScript EPS Vector">
            <Icon name="lucide:printer" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>EPS</span>
          </button>
          <button type="button" id="vsDlAi" class="{btnBase} !min-h-[30px] !px-2 justify-center font-extrabold text-[11.5px]" title="Download Adobe Illustrator (.ai) Vector">
            <Icon name="lucide:pen-tool" class="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
            <span>AI</span>
          </button>
          <button type="button" id="vsDlPng" class="{btnBase} !min-h-[30px] !px-2 justify-center font-extrabold text-[11.5px]" title="Download High-Resolution Transparent PNG">
            <Icon name="lucide:image-down" class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>PNG</span>
          </button>
        </div>

        <button
          type="button"
          class="{btnPrimary} w-full min-h-[38px] justify-between px-4 text-[13px] rounded-xl shadow-xs"
          data-vs="open-export-modal"
          id="vsOpenExportModalBtn"
        >
          <span class="inline-flex items-center gap-2">
            <Icon name="lucide:download" class="w-4 h-4 shrink-0" />
            <span data-i18n-bn="এক্সপোর্ট ও প্রিন্ট সেটিংস" data-i18n-en="Export Vector Options">এক্সপোর্ট ও প্রিন্ট সেটিংস</span>
          </span>
          <span id="vsExportBadge" class="px-2 py-0.5 rounded-full bg-black/20 text-[11px] font-extrabold tabular-nums">SVG · EPS · AI</span>
        </button>
      </div>
    </aside>
  </div>

  <!-- EXPORT MODAL DIALOG (MATCHING DOCUMENT SCANNER) -->
  <dialog
    id="vsExportDialog"
    class="ds-export-dialog w-[min(520px,94vw)] border border-slate-200 dark:border-studio-border rounded-2xl bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text p-0 shadow-2xl backdrop:bg-slate-950/75 backdrop:backdrop-blur-xs overflow-hidden"
    aria-labelledby="vsExportDialogTitle"
  >
    <div class="px-5 py-3.5 bg-slate-50 dark:bg-studio-panel border-b border-slate-200 dark:border-studio-border flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400 inline-flex items-center justify-center shrink-0">
          <Icon name="lucide:spline" class="w-4 h-4" />
        </span>
        <div>
          <h2 id="vsExportDialogTitle" class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-studio-text leading-tight">
            <span data-i18n-bn="ভেক্টর এক্সপোর্ট ও ডাউনলোড (SVG · EPS · AI)" data-i18n-en="Export & Download Vector (SVG · EPS · AI)">ভেক্টর এক্সপোর্ট ও ডাউনলোড (SVG · EPS · AI)</span>
          </h2>
          <p class="m-0 text-[11.5px] text-slate-500 dark:text-studio-muted" data-i18n-bn="Adobe Illustrator, CorelDRAW, Figma ও ওয়েবে সরাসরি সম্পাদনাযোগ্য" data-i18n-en="Editable in Adobe Illustrator, CorelDRAW, Figma & Web">
            Adobe Illustrator, CorelDRAW, Figma ও ওয়েবে সরাসরি সম্পাদনাযোগ্য
          </p>
        </div>
      </div>
      <button
        type="button"
        data-vs="export-close"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white"
        aria-label="Close"
      >✕</button>
    </div>

    <div class="p-5 grid gap-4">
      <div class="grid gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label class="grid gap-1 text-[12px] font-semibold text-slate-700 dark:text-studio-text">
            <span data-i18n-bn="ফাইলের নাম (File Name)" data-i18n-en="File Name">ফাইলের নাম (File Name)</span>
            <input
              type="text"
              id="vsFilename"
              value="TechHat-vector-logo"
              maxlength="100"
              class="min-w-0 w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text text-[13px] font-semibold outline-none focus:border-emerald-500"
            />
          </label>
          <label class="grid gap-1 text-[12px] font-semibold text-slate-700 dark:text-studio-text">
            <span data-i18n-bn="কালার স্পেস (EPS / AI)" data-i18n-en="Color Space (EPS / AI)">কালার স্পেস (EPS / AI)</span>
            <label class="inline-flex items-center gap-2 min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar cursor-pointer text-[12px]">
              <input type="checkbox" id="vsCmyk" class="w-4 h-4 accent-violet-600 cursor-pointer" />
              <span data-i18n-bn="CMYK (প্রিন্ট ও প্রেসের জন্য)" data-i18n-en="CMYK (For Print & Press)">CMYK (প্রিন্ট ও প্রেসের জন্য)</span>
            </label>
          </label>
        </div>
      </div>

      <div class="grid gap-2.5">
        <button type="button" data-vs="dl-svg" class="{btnPrimary} w-full min-h-[42px] justify-between px-4 text-[14px] rounded-xl shadow-xs">
          <span class="inline-flex items-center gap-2.5">
            <Icon name="lucide:file-code-2" class="w-4.5 h-4.5 shrink-0" />
            <span data-i18n-bn="SVG ভেক্টর ডাউনলোড করুন (Web & Figma)" data-i18n-en="Download SVG Vector (Web & Figma)">SVG ভেক্টর ডাউনলোড করুন (Web & Figma)</span>
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-black/20 text-[12px] font-extrabold">.svg</span>
        </button>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button type="button" data-vs="dl-ai" class="{btnBase} w-full min-h-[38px] px-2.5 justify-center text-[12.5px] rounded-xl">
            <Icon name="lucide:pen-tool" class="w-4 h-4 text-orange-500 shrink-0" />
            <span>Adobe Illustrator (.ai)</span>
          </button>
          <button type="button" data-vs="dl-eps" class="{btnBase} w-full min-h-[38px] px-2.5 justify-center text-[12.5px] rounded-xl">
            <Icon name="lucide:printer" class="w-4 h-4 text-amber-500 shrink-0" />
            <span>PostScript (.eps)</span>
          </button>
          <button type="button" data-vs="dl-png" class="{btnBase} w-full min-h-[38px] px-2.5 justify-center text-[12.5px] rounded-xl">
            <Icon name="lucide:image-down" class="w-4 h-4 text-sky-500 shrink-0" />
            <span>Transparent PNG</span>
          </button>
        </div>

        <button type="button" class="{btnBase} w-full justify-center py-2" id="vsShareBtn" hidden>
          <Icon name="lucide:share-2" class="w-4 h-4 shrink-0" />
          <span data-i18n-bn="শেয়ার করুন" data-i18n-en="Share Vector">শেয়ার করুন</span>
        </button>
      </div>
    </div>
  </dialog>

  <!-- CAMERA CAPTURE DIALOG -->
  <dialog
    id="vsCameraDialog"
    class="ds-camera-dialog w-[min(640px,94vw)] border border-slate-200 dark:border-studio-border rounded-2xl bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text p-4 shadow-2xl backdrop:bg-slate-950/70 backdrop:backdrop-blur-xs"
    aria-labelledby="vsCameraTitle"
  >
    <div class="ds-camera-head flex items-center justify-between gap-3 mb-2.5">
      <h2 id="vsCameraTitle" class="m-0 text-base font-extrabold text-slate-900 dark:text-studio-text" data-i18n-bn="ক্যামেরা দিয়ে লোগো স্ক্যান করুন" data-i18n-en="Scan Logo with Camera">
        ক্যামেরা দিয়ে লোগো স্ক্যান করুন
      </h2>
      <button type="button" data-vs="camera-close" class={btnBase} aria-label="Close">✕</button>
    </div>
    <div class="ds-camera-stage relative rounded-xl overflow-hidden bg-black aspect-4/3 mb-2.5">
      <video id="vsVideo" autoplay playsinline muted class="w-full h-full object-cover block"></video>
      <div class="ds-camera-guide absolute inset-[12%] border-2 border-dashed border-violet-400/85 rounded-xl shadow-[0_0_0_999px_rgba(0,0,0,0.32)] pointer-events-none"></div>
    </div>
    <div class="ds-camera-actions flex justify-end gap-2">
      <button type="button" data-vs="camera-switch" class={btnBase}>
        <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5 shrink-0" />
        <span data-i18n-bn="ক্যামেরা পরিবর্তন" data-i18n-en="Switch Camera">ক্যামেরা পরিবর্তন</span>
      </button>
      <button type="button" class={btnPrimary} data-vs="capture">
        <Icon name="lucide:camera" class="w-4 h-4 shrink-0" />
        <span data-i18n-bn="ছবি তুলুন ও ভেক্টর করুন" data-i18n-en="Capture & Vectorize">ছবি তুলুন ও ভেক্টর করুন</span>
      </button>
    </div>
  </dialog>
</section>

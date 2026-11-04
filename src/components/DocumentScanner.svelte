<script lang="ts">
  import Icon from './ui/Icon.svelte';
  import { I18N } from './scanner/i18n.js';

  interface Props {
    active?: boolean;
  }

  let { active = false }: Props = $props();
  const t = I18N.en;

  // Photoshop-style retouch toolbar (grouped tools with flyouts, same order as Photoshop)
  const dockGroups = [
    { id: 'move', tools: [{ id: 'move', name: 'Move Tool', key: 'V', icon: 'lucide:move' }] },
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
    { id: 'picker', sep: true, tools: [{ id: 'picker', name: 'Eyedropper Tool', key: 'I', icon: 'lucide:pipette' }] },
    { id: 'heal', tools: [{ id: 'heal', name: 'Spot Healing Brush Tool', key: 'J', icon: 'lucide:bandage' }] },
    { id: 'brush', tools: [{ id: 'brush', name: 'Brush Tool', key: 'B', icon: 'lucide:paintbrush' }] },
    { id: 'clone', tools: [{ id: 'clone', name: 'Clone Stamp Tool', key: 'S', icon: 'lucide:stamp' }] },
    {
      id: 'dodge',
      tools: [
        { id: 'dodge', name: 'Dodge Tool', key: 'O', icon: 'lucide:dodge' },
        { id: 'burn', name: 'Burn Tool', key: 'O', icon: 'lucide:burn' }
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
    'AdorshoLipi',
    'BenSen Handwriting',
    'Noto Sans Bengali',
    'Hind Siliguri',
    'Noto Serif Bengali',
    'Anek Bangla',
    'Tiro Bangla',
    'Baloo Da 2',
    'Galada',
    'Atma',
    'Mina',
    'SutonnyMJ',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Calibri',
    'Cambria',
    'Segoe UI',
    'Courier New',
    'Inter'
  ];
  const txtSizes = [6, 8, 9, 10, 11, 12, 14, 18, 24, 28, 30, 36, 48, 60, 72, 96, 120, 144];
  const txtAligns = [
    { id: 'left', icon: 'lucide:align-left', tip: 'Left Align Text' },
    { id: 'center', icon: 'lucide:align-center', tip: 'Center Text' },
    { id: 'right', icon: 'lucide:align-right', tip: 'Right Align Text' }
  ];
  const moveAligns = [
    { id: 'top', icon: 'lucide:align-start-horizontal', tip: 'Align Top Edges' },
    { id: 'center-y', icon: 'lucide:align-center-horizontal', tip: 'Align Vertical Centers' },
    { id: 'bottom', icon: 'lucide:align-end-horizontal', tip: 'Align Bottom Edges' },
    { id: 'left', icon: 'lucide:align-start-vertical', tip: 'Align Left Edges' },
    { id: 'center-x', icon: 'lucide:align-center-vertical', tip: 'Align Horizontal Centers' },
    { id: 'right', icon: 'lucide:align-end-vertical', tip: 'Align Right Edges' }
  ];
  const selModes = [
    { id: 'new', icon: 'lucide:sel-new', tip: 'New Selection' },
    { id: 'add', icon: 'lucide:sel-add', tip: 'Add to Selection (Shift)' },
    { id: 'sub', icon: 'lucide:sel-sub', tip: 'Subtract from Selection (Alt)' },
    { id: 'int', icon: 'lucide:sel-int', tip: 'Intersect with Selection (Shift+Alt)' }
  ];
  const blendModes = [
    { id: 'normal', label: 'Normal' },
    { id: 'multiply', label: 'Multiply' },
    { id: 'screen', label: 'Screen' },
    { id: 'darken', label: 'Darken' },
    { id: 'lighten', label: 'Lighten' },
    { id: 'overlay', label: 'Overlay' },
    { id: 'color', label: 'Color' },
    { id: 'luminosity', label: 'Luminosity' }
  ];
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
  const psBtn =
    'inline-flex items-center justify-center gap-1 h-[25px] px-2 rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#383838] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-slate-700 dark:text-[#e6e6e6] text-[11.5px] font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-[#464646] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0';
  const psSel =
    'h-[25px] px-1.5 rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#1f1f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] text-slate-800 dark:text-[#e6e6e6] text-[11.5px] font-medium cursor-pointer outline-none focus:border-sky-500 shrink-0';
  const psLbl = 'text-[11.5px] font-medium text-slate-600 dark:text-[#cfcfcf] whitespace-nowrap shrink-0 select-none';
  const psSep = 'w-px h-4.5 bg-slate-300 dark:bg-white/12 mx-0.5 shrink-0';
  const psPod =
    'relative h-[25px] rounded-[3px] bg-white dark:bg-[#1f1f1f] border border-slate-300 dark:border-[#141414] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] inline-flex items-center justify-between gap-1 px-2 overflow-hidden select-none shrink-0 hover:border-slate-400 dark:hover:border-white/25';
  const psReset =
    'hidden';

  function applyScannerLang(lang: string) {
    const root = document.getElementById('img-pane-scan');
    if (!root || (lang !== 'bn' && lang !== 'en')) return;
    const dict = (I18N as Record<string, typeof I18N.bn>)[lang] || I18N.bn;
    root.dataset.lang = lang;
    try {
      localStorage.setItem('thbc-scan-lang', lang);
      localStorage.setItem('thbc-lang', lang);
    } catch {}
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n') as keyof typeof dict;
      if (key && typeof dict[key] === 'string') el.textContent = dict[key] as string;
    });
    root.querySelectorAll('[data-i18n-bn][data-i18n-en]').forEach((el) => {
      const txt = el.getAttribute(lang === 'bn' ? 'data-i18n-bn' : 'data-i18n-en');
      if (txt) el.textContent = txt;
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title') as keyof typeof dict;
      if (key && typeof dict[key] === 'string') {
        (el as HTMLElement).title = dict[key] as string;
        if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', dict[key] as string);
      }
    });
    root.querySelectorAll('[data-i18n-dock]').forEach((el) => {
      const key = el.getAttribute('data-i18n-dock') as keyof typeof dict.dockLabels;
      if (key && dict.dockLabels && dict.dockLabels[key]) el.textContent = dict.dockLabels[key];
    });
    if (Array.isArray(dict.presets)) {
      dict.presets.forEach((p) => {
        const b = root.querySelector(`[data-i18n-preset-title="${p.value}"]`);
        const s = root.querySelector(`[data-i18n-preset-desc="${p.value}"]`);
        if (b) b.textContent = p.title;
        if (s) s.textContent = p.desc;
      });
    }
    if (Array.isArray(dict.corners)) {
      root.querySelectorAll('[data-ds-corner]').forEach((b, i) => {
        if (dict.corners[i]) {
          (b as HTMLElement).title = dict.corners[i];
          b.setAttribute('aria-label', dict.corners[i]);
        }
      });
    }
    if (Array.isArray(dict.edges)) {
      root.querySelectorAll('[data-ds-edge]').forEach((b, i) => {
        if (dict.edges[i]) {
          (b as HTMLElement).title = dict.edges[i];
          b.setAttribute('aria-label', dict.edges[i]);
        }
      });
    }
    root.dispatchEvent(new CustomEvent('ds:langchange', { detail: { lang } }));
  }

  $effect(() => {
    const syncSaved = () => {
      try {
        const saved =
          document.documentElement.getAttribute('data-lang') ||
          localStorage.getItem('thbc-lang') ||
          localStorage.getItem('thbc-scan-lang');
        if (saved === 'en' || saved === 'bn') applyScannerLang(saved);
      } catch {}
    };
    const onLangChange = (e: Event) => {
      const ce = e as CustomEvent<{ lang?: string }>;
      if (ce?.detail?.lang) applyScannerLang(ce.detail.lang);
    };
    syncSaved();
    if (typeof window !== 'undefined' && (window as any).TechHatScannerInit) {
      (window as any).TechHatScannerInit();
    }
    window.addEventListener('th:langchange', onLangChange);
    document.addEventListener('astro:page-load', syncSaved);
    return () => {
      window.removeEventListener('th:langchange', onLangChange);
      document.removeEventListener('astro:page-load', syncSaved);
    };
  });

  const btnBase =
    'inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-800 dark:text-studio-text text-[12.5px] font-semibold leading-none whitespace-nowrap cursor-pointer transition-colors duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-300 dark:hover:enabled:border-slate-600 hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 min-h-[34px] px-3.5 py-1.5 rounded-lg border border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-[13px] font-bold leading-none whitespace-nowrap cursor-pointer shadow-2xs transition-colors duration-100 hover:enabled:bg-emerald-700 dark:hover:enabled:bg-emerald-400 hover:enabled:border-emerald-700 dark:hover:enabled:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnPrimarySoft =
    'inline-flex items-center justify-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md border border-emerald-500/35 dark:border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[12.5px] font-bold leading-none whitespace-nowrap cursor-pointer transition-colors duration-100 hover:enabled:bg-emerald-500/20 dark:hover:enabled:bg-emerald-500/25 hover:enabled:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnIcon =
    'inline-flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] p-0 rounded-md border border-transparent bg-transparent text-slate-700 dark:text-studio-text cursor-pointer transition-all duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-200/80 dark:hover:enabled:border-studio-border hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
</script>

<section
  class="img-pane th-nid-studio ds group/ds relative w-full text-slate-900 dark:text-studio-text antialiased select-none [&_[hidden]]:!hidden data-[has-pages=true]:lg:fixed data-[has-pages=true]:lg:inset-x-0 data-[has-pages=true]:lg:top-12 data-[has-pages=true]:lg:bottom-0 data-[has-pages=true]:lg:z-40 data-[has-pages=true]:lg:w-screen data-[has-pages=true]:lg:h-[calc(100dvh-3rem)] data-[has-pages=true]:h-[calc(100dvh-3rem)] data-[has-pages=true]:max-lg:h-auto data-[has-pages=true]:max-lg:min-h-[calc(100dvh-3.5rem)] data-[has-pages=true]:flex-1 data-[has-pages=true]:min-h-0 data-[has-pages=true]:flex data-[has-pages=true]:flex-col data-[has-pages=true]:overflow-hidden data-[has-pages=true]:bg-slate-100 dark:data-[has-pages=true]:bg-studio-bg"
  id="img-pane-scan"
  hidden={!active}
  aria-label={t.brandSub}
  data-view="split"
  data-editing="false"
  data-sidebar-collapsed="false"
  data-has-pages="false"
  data-lang="en"
>
  <input id="dsFiles" type="file" accept="image/jpeg,image/png,image/webp,image/bmp,image/avif" multiple hidden />
  <input id="dsDocFiles" type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,image/bmp,image/avif" multiple hidden />
  <input id="dsCameraFallback" type="file" accept="image/*" capture="environment" hidden />
  <div
    id="dsHoverTooltip"
    role="tooltip"
    hidden
    class="fixed z-[160] pointer-events-none px-3 py-1.5 rounded-md bg-slate-900/95 dark:bg-slate-800 text-white text-[12.5px] font-semibold leading-tight shadow-lg border border-white/15 whitespace-nowrap transition-opacity duration-75"
  ></div>

  <!-- COMPACT MOBILE/TABLET QUICK ACCESS BAR -->
  <nav
    class="ds-mobile-nav group-data-[has-pages=false]/ds:!hidden sticky top-0 z-40 hidden max-lg:grid max-lg:grid-cols-3 border-b border-slate-200 dark:border-studio-border bg-white/95 dark:bg-studio-sidebar/95 backdrop-blur-xs px-2 py-1 gap-1 shrink-0"
    aria-label="Workspace Navigation"
  >
    <button type="button" data-ds="toggle-sidebar" class={btnBase} data-i18n-title="navPages" title={t.navPages}>
      <Icon name="lucide:layers" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <span class="sr-only" data-i18n="navPages">{t.navPages}</span>
    </button>
    <button type="button" data-ds-jump=".ds-main" class={btnBase} data-i18n-title="navCanvas" title={t.navCanvas}>
      <Icon name="lucide:crop" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span class="sr-only" data-i18n="navCanvas">{t.navCanvas}</span>
    </button>
    <button type="button" data-ds="toggle-inspector" class={btnBase} data-i18n-title="navInspector" title={t.navInspector}>
      <Icon name="lucide:sliders-horizontal" class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
      <span class="sr-only" data-i18n="navInspector">{t.navInspector}</span>
    </button>
  </nav>

  <div
    class="ds-drawer-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-80"
    id="dsDrawerBackdrop"
    data-ds="close-drawers"
    hidden
  ></div>

  <!-- NATIVE DESKTOP THREE-PANEL WORKSPACE -->
  <div
    class="ds-body flex-1 min-h-0 grid grid-cols-[204px_minmax(0,1fr)_372px] group-data-[sidebar-collapsed=true]/ds:grid-cols-[0px_minmax(0,1fr)_372px] max-xl:grid-cols-[188px_minmax(0,1fr)_354px] max-xl:group-data-[sidebar-collapsed=true]/ds:grid-cols-[0px_minmax(0,1fr)_354px] max-lg:grid-cols-1 max-lg:group-data-[sidebar-collapsed=true]/ds:grid-cols-1 group-data-[has-pages=false]/ds:!grid-cols-1 overflow-hidden"
  >
    <!-- LEFT PANEL: NATIVE PAGE FILMSTRIP -->
    <aside
      class="ds-pages group-data-[has-pages=false]/ds:!hidden bg-white dark:bg-studio-sidebar border-r border-slate-200 dark:border-studio-border flex flex-col min-h-0 overflow-hidden group-data-[sidebar-collapsed=true]/ds:lg:opacity-0 group-data-[sidebar-collapsed=true]/ds:lg:pointer-events-none group-data-[sidebar-collapsed=true]/ds:lg:border-r-0 max-lg:fixed max-lg:top-12 max-lg:left-0 max-lg:bottom-0 max-lg:w-[min(260px,86vw)] max-lg:z-90 max-lg:shadow-2xl max-lg:-translate-x-[104%] max-lg:group-data-[drawer=pages]/ds:translate-x-0 max-lg:transition-transform max-lg:duration-200"
      id="dsPagesSidebar"
      aria-label={t.pagesTitle}
    >
      <div
        class="ds-panel-head sticky top-0 z-20 min-h-[38px] px-3 py-1.5 flex items-center justify-between gap-1.5 border-b border-slate-200 dark:border-studio-border bg-slate-50/90 dark:bg-studio-sidebar shrink-0"
      >
        <strong class="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-800 dark:text-studio-text">
          <Icon name="lucide:files" class="w-4 h-4 text-emerald-600 dark:text-studio-primary shrink-0" />
          <span data-i18n="pagesTitle">{t.pagesTitle}</span>
          <span
            id="dsCount"
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11.5px] font-bold tabular-nums"
            >0</span
          >
        </strong>
        <div class="ds-panel-head-actions inline-flex items-center gap-1">
          <span class="ds-muted text-slate-400 dark:text-studio-muted text-[11.5px] font-medium" data-i18n="dragHint">{t.dragHint}</span>
          <button
            type="button"
            class="ds-icon-only ds-drawer-close hidden max-lg:inline-flex items-center justify-center w-6.5 h-6.5 rounded border border-slate-200 dark:border-studio-border bg-slate-100 dark:bg-studio-panel text-[12px] font-bold cursor-pointer"
            data-ds="close-drawers"
            data-i18n-title="closeDrawerTip"
            aria-label={t.closeDrawerTip}
            title={t.closeDrawerTip}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        class="ds-page-list flex-1 min-h-0 overflow-y-auto p-1.5 flex flex-col gap-1.5 [scrollbar-width:thin] empty:grid empty:place-items-center empty:text-center empty:px-2.5 empty:before:content-['No_pages_yet_·_Click_+_below_to_add_scans'] group-data-[lang=bn]/ds:empty:before:content-['কোনো_পেজ_নেই_·_নিচে_+_বাটনে_ক্লিক_করে_ছবি_যোগ_করুন'] empty:before:text-[12px] empty:before:leading-relaxed empty:before:text-slate-400 dark:empty:before:text-slate-500"
        id="dsPageList"
        aria-label={t.pagesTitle}
      ></div>

      <div
        class="ds-page-footer p-2 border-t border-slate-200 dark:border-studio-border grid gap-1.5 bg-slate-50/80 dark:bg-studio-sidebar shrink-0"
      >
        <div class="grid grid-cols-[1fr_auto] gap-1.5">
          <button
            type="button"
            class="ds-add-more w-full inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1 rounded-md border border-emerald-600/35 dark:border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[12.5px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors"
            data-ds="add"
          >
            <Icon name="lucide:plus" class="w-3.5 h-3.5 shrink-0" />
            <span data-i18n="addMoreBtn">{t.addMoreBtn}</span>
          </button>
          <button
            type="button"
            class="{btnBase} min-h-[32px] px-2.5 rounded-md"
            data-ds="camera"
            data-i18n-title="cameraTip"
            title={t.cameraTip}
            aria-label={t.cameraBtn}
          >
            <Icon name="lucide:camera" class="w-4 h-4 shrink-0" />
          </button>
        </div>
        <small class="text-center text-[11px] text-slate-400 dark:text-studio-muted truncate" data-i18n="addMoreSub">{t.addMoreSub}</small>
      </div>
    </aside>

    <!-- CENTER PANEL: NATIVE STUDIO COMMAND BAR & DUAL/SINGLE CANVAS -->
    <div class="ds-main min-w-0 min-h-0 flex flex-col bg-slate-100 dark:bg-studio-bg group-data-[has-pages=false]/ds:bg-transparent overflow-hidden">
      <!-- STICKY COMPACT NATIVE DESKTOP ICON RIBBON (HOVER FOR TOOLTIP NAME) -->
      <div
        class="ds-toolbar group-data-[has-pages=false]/ds:!hidden sticky top-0 z-30 min-h-[42px] px-3 py-1 border-b border-slate-200 dark:border-studio-border group-data-[editing=true]/ds:border-slate-300 dark:group-data-[editing=true]/ds:border-[#181818] bg-white/98 dark:bg-studio-sidebar/98 group-data-[editing=true]/ds:dark:bg-[#232323] backdrop-blur-xs flex items-center gap-1 flex-wrap shrink-0"
        role="toolbar"
        aria-label="Document Editing Toolbar"
      >
        <!-- Group 1: Sidebar, Add Page, Camera, New Scan -->
        <div class="ds-toolbar-group inline-flex items-center gap-1" role="group" aria-label="Pages & Input">
          <button
            type="button"
            data-ds="toggle-sidebar"
            id="dsSidebarToggleBtn"
            class="{btnIcon} max-lg:hidden aria-pressed:bg-slate-100 dark:aria-pressed:bg-studio-surface aria-pressed:text-indigo-600 dark:aria-pressed:text-indigo-400"
            aria-pressed="true"
            data-i18n-title="sidebarToggleTip"
            title={t.sidebarToggleTip}
          >
            <Icon name="lucide:panel-left" class="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span class="sr-only" data-i18n="pagesTitle">{t.pagesTitle}</span>
          </button>
          <button
            type="button"
            data-ds="add"
            class="{btnIcon} bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:enabled:bg-emerald-500/20"
            data-i18n-title="addPageTip"
            title={t.addPageTip}
          >
            <Icon name="lucide:plus" class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span class="sr-only" data-i18n="addPageBtn">{t.addPageBtn}</span>
          </button>
          <button type="button" data-ds="camera" class={btnIcon} data-i18n-title="cameraTip" title={t.cameraTip}>
            <Icon name="lucide:camera" class="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span class="sr-only" data-i18n="cameraBtn">{t.cameraBtn}</span>
          </button>
          <button type="button" data-ds="reset" class={btnIcon} data-i18n-title="newScanTip" title={t.newScanTip}>
            <Icon name="lucide:file-plus-2" class="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span class="sr-only" data-i18n="newScanBtn">{t.newScanBtn}</span>
          </button>
        </div>

        <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-1 shrink-0" aria-hidden="true"></span>

        <!-- Group 2: Undo & Redo -->
        <div class="ds-toolbar-group inline-flex items-center gap-1" role="group" aria-label="History">
          <button type="button" data-ds="undo" class={btnIcon} disabled data-i18n-title="undoTip" title={t.undoTip}>
            <Icon name="lucide:undo-2" class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300 shrink-0" />
            <span class="sr-only" data-i18n="undoBtn">{t.undoBtn}</span>
          </button>
          <button type="button" data-ds="redo" class={btnIcon} disabled data-i18n-title="redoTip" title={t.redoTip}>
            <Icon name="lucide:redo-2" class="w-4.5 h-4.5 text-slate-700 dark:text-slate-300 shrink-0" />
            <span class="sr-only" data-i18n="redoBtn">{t.redoBtn}</span>
          </button>
        </div>

        <span class="w-px h-4.5 bg-slate-200 dark:bg-studio-border mx-1 shrink-0" aria-hidden="true"></span>

        <!-- Group 3: Crop & Rotation -->
        <div class="ds-toolbar-group inline-flex items-center gap-1" role="group" aria-label="Crop & Rotation">
          <button
            type="button"
            data-ds="detect"
            class={btnIcon}
            disabled
            data-i18n-title="autoDetectTip"
            title={t.autoDetectTip}
          >
            <Icon name="lucide:scan-line" class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span class="sr-only" data-i18n="autoDetectBtn">{t.autoDetectBtn}</span>
          </button>
          <button type="button" data-ds="full" class={btnIcon} disabled data-i18n-title="fullImageTip" title={t.fullImageTip}>
            <Icon name="lucide:maximize-2" class="w-4.5 h-4.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span class="sr-only" data-i18n="fullImageBtn">{t.fullImageBtn}</span>
          </button>
          <button type="button" data-ds="left" class={btnIcon} disabled data-i18n-title="rotateLeftTip" title={t.rotateLeftTip}>
            <Icon name="lucide:rotate-ccw" class="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span class="sr-only" data-i18n="rotateLeftBtn">{t.rotateLeftBtn}</span>
          </button>
          <button type="button" data-ds="right" class={btnIcon} disabled data-i18n-title="rotateRightTip" title={t.rotateRightTip}>
            <Icon name="lucide:rotate-cw" class="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span class="sr-only" data-i18n="rotateRightBtn">{t.rotateRightBtn}</span>
          </button>
          <button type="button" data-ds="reset-crop" class={btnIcon} disabled data-i18n-title="resetCropTip" title={t.resetCropTip}>
            <Icon name="lucide:history" class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span class="sr-only" data-i18n="resetCropBtn">{t.resetCropBtn}</span>
          </button>
        </div>

        <div class="ds-workflow-actions inline-flex items-center gap-1.5 ml-1">
          <button type="button" data-ds="finish-crop" class="{btnBase} !px-2.5">
            <Icon name="lucide:check" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span data-i18n-bn="ক্রপ সম্পন্ন" data-i18n-en="Done Cropping">Done Cropping</span>
          </button>
          <button type="button" data-ds="edit-page" class="{btnBase} !px-2.5 !border-emerald-500/40 dark:!border-emerald-400/35 hover:!bg-emerald-500/10">
            <Icon name="lucide:pencil" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span data-i18n-bn="এডিট" data-i18n-en="Edit">Edit</span>
          </button>
          <button type="button" data-ds="close-eraser" class="ds-save-edit inline-flex items-center gap-1.5">
            <Icon name="lucide:check" class="w-4 h-4 shrink-0" />
            <span data-i18n-bn="সেভ ও প্রিভিউ" data-i18n-en="Save & Preview">Save & Preview</span>
          </button>
        </div>
        <!-- Group 4: View Switcher (Icon-Only with Hover Tooltip) -->
        <div class="ds-toolbar-right ml-auto inline-flex items-center gap-1">
          <div
            class="ds-view-switch inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border gap-0.5"
            role="group"
            aria-label="Canvas View Mode"
          >
            <button
              type="button"
              data-ds-view="crop"
              aria-pressed="false"
              data-i18n-title="viewCrop"
              title={t.viewCrop}
              class="inline-flex items-center justify-center w-8 h-7 rounded-md border-0 bg-transparent text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:crop" class="w-4 h-4 shrink-0" />
              <span class="ds-view-label" data-i18n="viewCrop">{t.viewCrop}</span>
            </button>
            <button
              type="button"
              data-ds-view="split"
              aria-pressed="true"
              data-i18n-title="viewSplit"
              title={t.viewSplit}
              class="inline-flex items-center justify-center w-8 h-7 rounded-md border-0 bg-transparent text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:columns-2" class="w-4 h-4 shrink-0" />
              <span class="sr-only" data-i18n="viewSplit">{t.viewSplit}</span>
            </button>
            <button
              type="button"
              data-ds-view="preview"
              aria-pressed="false"
              data-i18n-title="viewPreview"
              title={t.viewPreview}
              class="inline-flex items-center justify-center w-8 h-7 rounded-md border-0 bg-transparent text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:eye" class="w-4 h-4 shrink-0" />
              <span class="ds-view-label" data-i18n="viewPreview">{t.viewPreview}</span>
            </button>
          </div>
          <button
            type="button"
            data-ds="toggle-inspector"
            class="ds-inspector-toggle hidden max-lg:inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel cursor-pointer"
            data-i18n-title="inspectorTitle"
            title={t.inspectorTitle}
          >
            <Icon name="lucide:sliders-horizontal" class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <span class="sr-only" data-i18n="inspectorBtn">{t.inspectorBtn}</span>
          </button>
        </div>
      </div>

      <!-- CLEAN INITIAL UPLOAD STATE (MODERN HERO DROPZONE — BEFORE ANY IMAGE IS OPENED) -->
      <div
        class="ds-empty space-y-4"
        id="dsEmpty"
      >
        <div class="sr-only">
          <h3 data-i18n="emptyTitle">{t.emptyTitle}</h3>
          <span data-i18n="emptyEyebrow">{t.emptyEyebrow}</span>
          <p data-i18n="emptyDesc">{t.emptyDesc}</p>
          <span data-i18n="dropPasteHint">{t.dropPasteHint}</span>
          <span data-i18n="choosePhotosBtn">{t.choosePhotosBtn}</span>
          <span data-i18n="openCameraBtn">{t.openCameraBtn}</span>
          <em data-i18n="featAutoCrop">{t.featAutoCrop}</em>
          <em data-i18n="featDewarp">{t.featDewarp}</em>
          <em data-i18n="featMagic">{t.featMagic}</em>
          <em data-i18n="featPdf">{t.featPdf}</em>
        </div>

        <div
          class="ds-empty-card pdf-dropzone relative flex flex-col items-center justify-center text-center py-12 px-5 sm:px-10 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-[#f4f5f7] dark:bg-studio-panel/75 hover:border-blue-400/70 dark:hover:border-blue-500/60 cursor-pointer transition-all duration-200 group-[.is-over]/ds:border-blue-500 group-[.is-over]/ds:bg-blue-50/60 dark:group-[.is-over]/ds:bg-blue-500/10 shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
          data-ds="add"
        >
          <!-- Multi-layered Colorful Hero Illustration (Monitor + Document + Glossy Blue Photo Card + Camera Outline + Emerald Plus Badge) -->
          <div class="ds-empty-symbol relative w-44 h-34 mb-4 select-none pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 200 150" class="w-full h-full overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="dsHeroGlow" x1="65" y1="65" x2="105" y2="138" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.28" />
                  <stop offset="65%" stop-color="#99f6e4" stop-opacity="0.16" />
                  <stop offset="100%" stop-color="#f4f5f7" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="dsHeroCamStroke" x1="126" y1="12" x2="156" y2="62" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#5eead4" stop-opacity="0.55" />
                  <stop offset="100%" stop-color="#99f6e4" stop-opacity="0.1" />
                </linearGradient>
                <linearGradient id="dsHeroBlueCard" x1="42" y1="24" x2="96" y2="70" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#0055ff" />
                  <stop offset="55%" stop-color="#3b82f6" stop-opacity="0.92" />
                  <stop offset="100%" stop-color="#93c5fd" stop-opacity="0.72" />
                </linearGradient>
                <linearGradient id="dsHeroPlusGrad" x1="126" y1="90" x2="162" y2="128" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#10b981" />
                  <stop offset="100%" stop-color="#0d9488" />
                </linearGradient>
                <filter id="dsHeroCardShadow" x="-15%" y="-15%" width="130%" height="135%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#1e3a8a" flood-opacity="0.18" />
                </filter>
                <filter id="dsHeroPlusShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0d9488" flood-opacity="0.28" />
                </filter>
              </defs>

              <!-- Soft Mint-Teal Ambient Backdrop Glow -->
              <path d="M46 130 C46 84, 72 62, 108 62 C136 62, 152 90, 152 130 Z" fill="url(#dsHeroGlow)" />

              <!-- Faint Teal Camera Outline (Top-Right Behind Monitor) -->
              <g stroke="url(#dsHeroCamStroke)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M114 27 H122 L126 20 H142 L146 27 H154 A6 6 0 0 1 160 33 V61 A6 6 0 0 1 154 67 H114 A6 6 0 0 1 108 61 V33 A6 6 0 0 1 114 27 Z" fill="#e6f7f3" fill-opacity="0.25" />
                <circle cx="134" cy="46" r="10.5" />
              </g>

              <!-- Desktop Monitor Stand & Base -->
              <path d="M93 108 H113 L116 125 H90 Z" fill="#e2e8f0" />
              <rect x="76" y="124" width="54" height="5" rx="2.5" fill="#ffffff" />
              <line x1="36" y1="129" x2="150" y2="129" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.55" />

              <!-- Desktop Monitor Outer Frame & Dark Screen -->
              <rect x="57" y="42" width="92" height="68" rx="6" fill="#ffffff" stroke="#d5dde6" stroke-width="2" />
              <rect x="61" y="46" width="84" height="54" rx="3" fill="#181b20" />
              <!-- Monitor Lower Chin Bar -->
              <path d="M58 100 H148 V105 A4 4 0 0 1 144 109 H62 A4 4 0 0 1 58 105 Z" fill="#f8fafc" />

              <!-- White Document Page Inside Monitor -->
              <g>
                <path d="M90 54 H112 L119 61 V93 H90 Z" fill="#ffffff" />
                <path d="M112 54 V61 H119 Z" fill="#cbd5e1" />
                <rect x="95" y="66" width="18" height="2" rx="1" fill="#e2e8f0" />
                <rect x="95" y="72" width="14" height="2" rx="1" fill="#e2e8f0" />
                <rect x="95" y="78" width="16" height="2" rx="1" fill="#e2e8f0" />
              </g>

              <!-- Floating Glossy Blue Image Card (Top-Left Overlapping Monitor) -->
              <g filter="url(#dsHeroCardShadow)">
                <rect x="42" y="25" width="48" height="38" rx="5" fill="url(#dsHeroBlueCard)" stroke="#ffffff" stroke-width="1" stroke-opacity="0.65" />
                <circle cx="52.5" cy="35" r="3.5" fill="#ffffff" fill-opacity="0.92" />
                <path d="M44 59 L58 43 L70 59 Z" fill="#2563eb" fill-opacity="0.55" />
                <path d="M58 59 L73 39 L88 59 Z" fill="#ffffff" fill-opacity="0.45" />
              </g>

              <!-- Emerald Green Plus Circle Badge (Bottom-Right Overlapping Monitor) -->
              <g filter="url(#dsHeroPlusShadow)">
                <circle cx="144" cy="109" r="19" fill="url(#dsHeroPlusGrad)" />
                <path d="M144 100 V118 M135 109 H153" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" />
              </g>
            </svg>
          </div>

          <!-- Hero Subtitle Instruction -->
          <p
            class="text-[15px] sm:text-[16px] font-normal text-slate-600 dark:text-slate-300 m-0 mb-7 tracking-[-0.01em] max-w-[54ch]"
            data-i18n="dropPasteHero"
          >
            {t.dropPasteHero}
          </p>

          <!-- Elevated White Action Cards with Colorful Modern Icons -->
          <div class="ds-empty-actions grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full max-w-[840px]">
            <!-- 1. Smart Scan (Camera) -->
            <button
              type="button"
              data-ds="camera"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(16,185,129,0.12)] hover:border-emerald-400/80 dark:hover:border-emerald-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.38a1.5 1.5 0 0 0 1.25-.67l.74-1.11A1.5 1.5 0 0 1 11.12 3.5h1.76a1.5 1.5 0 0 1 1.25.67l.74 1.11a1.5 1.5 0 0 0 1.25.67h1.38A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" fill="#10b981" />
                <circle cx="12" cy="13" r="4.2" fill="#ffffff" />
                <circle cx="12" cy="13" r="2.3" fill="#059669" />
                <circle cx="16.8" cy="8.8" r="1" fill="#ffffff" />
              </svg>
              <span data-i18n="smartScanBtn">{t.smartScanBtn}</span>
            </button>

            <!-- 2. Import Images -->
            <button
              type="button"
              data-ds="add"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-blue-400/80 dark:hover:border-blue-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="3.5" width="16.5" height="16.5" rx="3" fill="#1677ff" />
                <circle cx="7.5" cy="8.5" r="1.75" fill="#ffffff" />
                <path d="M4 17.5L9.2 11.8L13.5 16.2L15.8 13.8L17.5 17.5H4Z" fill="#93c5fd" fill-opacity="0.85" />
                <circle cx="17.5" cy="17.5" r="4.5" fill="#1d4ed8" stroke="#ffffff" stroke-width="1.4" />
                <path d="M19 18.8V17.4C19 16.3 18.1 15.5 17 15.5H15.6M15.6 15.5L17 14.1M15.6 15.5L17 16.9" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span data-i18n="importImagesBtn">{t.importImagesBtn}</span>
            </button>

            <!-- 3. Import Files (PDF & Images) -->
            <button
              type="button"
              data-ds="import-files"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(37,99,235,0.12)] hover:border-indigo-400/80 dark:hover:border-indigo-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4.5 5A2.5 2.5 0 0 1 7 2.5h6.8L18.5 7.2V17.5A2.5 2.5 0 0 1 16 20H7a2.5 2.5 0 0 1-2.5-2.5V5Z" fill="#1677ff" />
                <path d="M13.8 2.5V6.2A1 1 0 0 0 14.8 7.2H18.5L13.8 2.5Z" fill="#93c5fd" />
                <path d="M7.5 10.5H13.5M7.5 13.5H12.5M7.5 16.5H10.5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="17.5" cy="17.5" r="4.5" fill="#1d4ed8" stroke="#ffffff" stroke-width="1.4" />
                <path d="M19 18.8V17.4C19 16.3 18.1 15.5 17 15.5H15.6M15.6 15.5L17 14.1M15.6 15.5L17 16.9" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span data-i18n="importFilesBtn">{t.importFilesBtn}</span>
            </button>

            <!-- 4. Paste (Ctrl+V) -->
            <button
              type="button"
              data-ds="paste"
              class="group/btn min-h-[54px] px-5 py-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/85 dark:border-studio-border shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_22px_rgba(124,58,237,0.12)] hover:border-violet-400/80 dark:hover:border-violet-500/70 hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer text-slate-800 dark:text-white text-[14px] font-medium"
            >
              <svg class="w-6 h-6 shrink-0 transition-transform duration-150 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="4.5" width="14" height="16.5" rx="2.5" fill="#7c3aed" />
                <rect x="8" y="2.5" width="6" height="3.5" rx="1.2" fill="#fbbf24" />
                <rect x="7" y="9" width="8" height="8.5" rx="1.5" fill="#ffffff" fill-opacity="0.92" />
                <circle cx="17.5" cy="17.5" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.4" />
                <path d="M17.5 15.2V19.5M17.5 19.5L15.8 17.8M17.5 19.5L19.2 17.8" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span data-i18n="pasteBtn">{t.pasteBtn}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- DUAL / SINGLE CANVAS WORKSPACE -->
      <div
        class="ds-workspace flex-1 min-h-0 grid grid-cols-2 group-data-[view=crop]/ds:grid-cols-1 group-data-[view=preview]/ds:grid-cols-1 group-data-[editing=true]/ds:grid-cols-1 max-lg:grid-cols-1 max-lg:min-h-[480px] gap-1.5 p-1.5 group-data-[editing=true]/ds:gap-0 group-data-[editing=true]/ds:p-0 overflow-hidden"
        id="dsWorkspace"
        hidden
      >
        <!-- CROP & PERSPECTIVE STAGE -->
        <section
          class="ds-crop-panel group-data-[view=preview]/ds:hidden min-w-0 min-h-0 flex flex-col rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar overflow-hidden shadow-2xs"
          aria-label={t.cropCaption}
        >
          <div
            class="ds-canvas-caption min-h-[34px] px-3 py-1 border-b border-slate-200 dark:border-studio-border flex items-center justify-between gap-2 text-[13px] font-bold text-slate-800 dark:text-studio-text bg-slate-50/90 dark:bg-studio-panel shrink-0"
          >
            <span class="inline-flex items-center gap-2 min-w-0">
              <i class="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></i>
              <em class="not-italic truncate" data-i18n="cropCaption">{t.cropCaption}</em>
            </span>
          </div>
          <div
            class="ds-viewport relative flex-1 min-h-0 overflow-hidden bg-[#dcdcdc] dark:bg-[#252526] touch-none cursor-grab [&.is-panning]:cursor-grabbing focus-visible:outline-2 focus-visible:outline-emerald-500"
            id="dsViewport"
            tabindex="0"
            aria-label={t.cropCaption}
          >
            <div class="ds-image-plane absolute left-1/2 top-1/2 origin-top-left select-none shadow-[0_12px_32px_rgba(0,0,0,0.45)]" id="dsPlane">
              <canvas id="dsSource" class="block w-full h-full rounded-xs bg-white select-none pointer-events-none"></canvas>
              <svg id="dsQuad" class="absolute inset-0 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
                <defs>
                  <mask id="dsMask">
                    <rect width="100%" height="100%" fill="white" />
                    <polygon id="dsHole" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(4,9,20,.62)" mask="url(#dsMask)" />
                <polygon
                  id="dsOutline"
                  class="fill-emerald-500/10 stroke-emerald-500 stroke-[2.25] [vector-effect:non-scaling-stroke]"
                />
                {#each [0, 1, 2, 3] as i}
                  <line
                    class="ds-gridline stroke-white/55 stroke-1 [stroke-dasharray:4_4] [vector-effect:non-scaling-stroke]"
                    data-ds-line={i}
                  />
                {/each}
              </svg>
              <div id="dsHandles" class="absolute inset-0 w-full h-full pointer-events-none">
                {#each t.corners as label, i}
                  <button
                    type="button"
                    data-ds-corner={i}
                    aria-label={label}
                    title={label}
                    class="absolute min-h-0 min-w-0 p-0 -translate-x-1/2 -translate-y-1/2 pointer-events-auto touch-none w-5.5 h-5.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] cursor-grab hover:bg-emerald-400 hover:scale-110 [&.is-active]:bg-emerald-400 [&.is-active]:scale-110"
                  ></button>
                {/each}
                {#each t.edges as label, i}
                  <button
                    type="button"
                    data-ds-edge={i}
                    aria-label={label}
                    title={label}
                    class="absolute min-h-0 min-w-0 p-0 pointer-events-auto touch-none w-6 h-2 rounded-full bg-white/95 border-2 border-emerald-600 shadow-[0_2px_6px_rgba(0,0,0,0.38)] cursor-pointer hover:bg-emerald-50 [&.is-active]:bg-emerald-50 [transform:translate(-50%,-50%)_rotate(var(--edge-deg,0deg))]"
                  ></button>
                {/each}
              </div>
            </div>
          </div>
        </section>

        <!-- ENHANCED PREVIEW & PHOTOSHOP RETOUCH STAGE -->
        <section
          class="ds-preview-panel group-data-[view=crop]/ds:hidden min-w-0 min-h-0 flex flex-col rounded-lg group-data-[editing=true]/ds:rounded-none border border-slate-200 dark:border-studio-border group-data-[editing=true]/ds:border-0 bg-white dark:bg-studio-sidebar overflow-hidden shadow-2xs"
          aria-label={t.previewCaption}
        >
          <div
            class="ds-canvas-caption group-data-[editing=true]/ds:!hidden min-h-[34px] px-3 py-1 border-b border-slate-200 dark:border-studio-border flex items-center justify-between gap-2 text-[13px] font-bold text-slate-800 dark:text-studio-text bg-slate-50/90 dark:bg-studio-panel shrink-0"
          >
            <span class="inline-flex items-center gap-2 min-w-0">
              <i class="w-2 h-2 rounded-full bg-teal-500 inline-block shrink-0"></i>
              <em class="not-italic truncate" data-i18n="previewCaption">{t.previewCaption}</em>
            </span>
            <div class="ds-preview-caption-actions inline-flex items-center gap-2 shrink-0">
              <small id="dsPreviewMeta" class="text-slate-500 dark:text-studio-muted font-semibold text-[12px] tabular-nums truncate">—</small>
              <button
                type="button"
                data-ds="toggle-eraser"
                id="dsEraserToggle"
                aria-pressed="false"
                disabled
                data-i18n-title="retouchTip"
                title={t.retouchTip}
                class="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-700 dark:text-studio-text text-[12px] font-bold cursor-pointer hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 aria-pressed:bg-emerald-600 dark:aria-pressed:bg-emerald-500 aria-pressed:text-white dark:aria-pressed:text-slate-950 aria-pressed:border-emerald-600 aria-pressed:[&_svg]:!text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Icon name="lucide:wand-2" class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                <span data-i18n="retouchShortBtn">{t.retouchShortBtn}</span>
              </button>
            </div>
          </div>

          <!-- PHOTOSHOP-STYLE CONTEXTUAL TOOL OPTIONS BAR (CHANGES WITH THE ACTIVE TOOL) -->
          <div
            class="ds-eraser-bar relative z-30 min-h-[36px] px-2.5 py-1 bg-[#f0f0f0] dark:bg-[#2b2b2b] border-b border-slate-300 dark:border-[#181818] flex items-center gap-2 flex-wrap shrink-0 select-none"
            id="dsEraserBar"
            hidden
          >
            <!-- Active Tool Preset Badge -->
            <div
              id="dsPsActiveToolLabel"
              class="inline-flex items-center gap-1.5 h-[25px] pl-1.5 pr-2 rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#383838] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0"
            >
              <span id="dsPsActiveToolIcon" class="inline-flex w-4 h-4 text-slate-700 dark:text-[#e6e6e6] [&_svg]:w-4 [&_svg]:h-4"></span>
              <b class="text-[11.5px] font-medium text-slate-800 dark:text-[#e6e6e6] whitespace-nowrap">Brush Tool</b>
            </div>
            <span class={psSep}></span>

            <!-- MOVE TOOL OPTIONS: Auto-Select · Show Transform Controls · 6 Alignment Buttons -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-ds-opts="move">
              <label class="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-700 dark:text-[#d8d8d8] cursor-pointer">
                <input id="dsAutoSelect" type="checkbox" checked class="w-3.5 h-3.5 accent-sky-500 cursor-pointer" />
                <span>Auto-Select:</span>
              </label>
              <select id="dsMoveSelectTarget" class="{psSel} w-[70px]">
                <option value="layer" selected>Layer</option>
                <option value="group">Group</option>
              </select>
              <label class="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-700 dark:text-[#d8d8d8] cursor-pointer ml-0.5">
                <input id="dsShowTransform" type="checkbox" checked class="w-3.5 h-3.5 accent-sky-500 cursor-pointer" />
                <span>Show Transform Controls</span>
              </label>
              <span class={psSep}></span>
              <div class="inline-flex items-center rounded-[3px] border border-slate-300 dark:border-[#141414] overflow-hidden shrink-0" role="group" aria-label="Align Layers">
                {#each moveAligns as al}
                  <button
                    type="button"
                    data-ds-align={al.id}
                    data-ds-tip={al.tip}
                    class="w-[26px] h-[25px] inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 border-r last:border-r-0 border-slate-200 dark:border-[#1f1f1f] text-slate-700 dark:text-[#e0e0e0] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#484848]"
                  >
                    <Icon name={al.icon} class="w-3.5 h-3.5" />
                  </button>
                {/each}
              </div>
            </div>

            <!-- MARQUEE & LASSO SELECTION OPTIONS: 4 Combine Modes · Feather · Anti-alias · Style (Normal / Fixed Ratio / Fixed Size) -->
            <div class="inline-flex items-center gap-1.5 flex-wrap shrink-0" data-ds-opts="marquee-rect marquee-ellipse lasso lasso-poly">
              <div class="inline-flex items-center rounded-[3px] border border-slate-300 dark:border-[#141414] overflow-hidden shrink-0" role="group" aria-label="Selection Combine Mode">
                {#each selModes as sm}
                  <button
                    type="button"
                    data-ds-sel-mode={sm.id}
                    aria-pressed={sm.id === 'new' ? 'true' : 'false'}
                    data-ds-tip={sm.tip}
                    class="w-[26px] h-[25px] inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 border-r last:border-r-0 border-slate-200 dark:border-[#1f1f1f] text-slate-700 dark:text-[#e0e0e0] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#484848] aria-pressed:bg-[#1f1f1f] aria-pressed:text-sky-400 dark:aria-pressed:bg-[#1a1a1a] dark:aria-pressed:text-sky-400"
                  >
                    <Icon name={sm.icon} class="w-3.5 h-3.5" />
                  </button>
                {/each}
              </div>
              <span class={psSep}></span>
              <label class="inline-flex items-center gap-1 shrink-0" data-ds-tip="Soften selection edges (0 – 100 px)">
                <span class={psLbl}>Feather:</span>
                <input id="dsSelFeather" type="number" min="0" max="100" step="1" value="0" class="{psSel} w-[52px] cursor-text tabular-nums" />
                <span class={psLbl}>px</span>
              </label>
              <label class="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-700 dark:text-[#d8d8d8] cursor-pointer shrink-0">
                <input id="dsSelAA" type="checkbox" checked class="w-3.5 h-3.5 accent-sky-500 cursor-pointer disabled:opacity-40" />
                <span>Anti-alias</span>
              </label>
            </div>

            <!-- MARQUEE STYLE OPTIONS (Normal / Fixed Ratio / Fixed Size + W ⇄ H) -->
            <div class="inline-flex items-center gap-1.5 shrink-0" data-ds-opts="marquee-rect marquee-ellipse">
              <span class={psSep}></span>
              <label class="inline-flex items-center gap-1 shrink-0">
                <span class={psLbl}>Style:</span>
                <select id="dsMarqueeStyle" class="{psSel} w-[96px]">
                  <option value="normal" selected>Normal</option>
                  <option value="ratio">Fixed Ratio</option>
                  <option value="size">Fixed Size</option>
                </select>
              </label>
              <label class="inline-flex items-center gap-1 shrink-0">
                <span class={psLbl}>W:</span>
                <input id="dsMarqueeW" type="number" min="1" max="4000" value="1" disabled class="{psSel} w-[54px] cursor-text tabular-nums disabled:opacity-45" />
              </label>
              <button type="button" id="dsMarqueeSwap" disabled class="{psBtn} !px-1.5" data-ds-tip="Swap Width and Height">
                <Icon name="lucide:arrow-left-right" class="w-3.5 h-3.5" />
              </button>
              <label class="inline-flex items-center gap-1 shrink-0">
                <span class={psLbl}>H:</span>
                <input id="dsMarqueeH" type="number" min="1" max="4000" value="1" disabled class="{psSel} w-[54px] cursor-text tabular-nums disabled:opacity-45" />
              </label>
            </div>

            <!-- Fill / Paint Color (Brush, Selection Fill, Eyedropper) -->
            <div class="inline-flex items-center gap-1.5 shrink-0" data-ds-opts="brush marquee-rect marquee-ellipse lasso lasso-poly picker">
              <label
                class="relative inline-flex items-center gap-1.5 h-[25px] pl-1 pr-2 rounded-[3px] border border-slate-300 dark:border-[#141414] bg-white dark:bg-[#1f1f1f] cursor-pointer hover:border-slate-400 dark:hover:border-white/25"
                data-ds-tip="Set Color (Brush / Selection Fill)"
              >
                <input type="color" id="dsEraserColor" value="#ffffff" aria-label="Color" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0" />
                <span id="dsEraserColorChip" class="w-4 h-4 rounded-[2px] border border-slate-400 dark:border-white/30 shrink-0" style="background:#ffffff"></span>
                <code id="dsEraserHex" class="text-[11px] font-medium text-slate-700 dark:text-[#e0e0e0] tabular-nums w-[50px]">#FFFFFF</code>
              </label>
              <button type="button" data-ds="auto-paper-color" class="{psBtn} !px-1.5" data-ds-tip="Auto-detect Paper Color">
                <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              </button>
            </div>

            <!-- Brush Size / Hardness / Mode / Opacity / Flow / Sample (Photoshop Options Bar Layout) -->
            <div class="inline-flex items-center gap-2.5 flex-wrap shrink-0" id="dsPsBrushOpts" data-ds-opts="brush heal clone dodge burn">
              <label class="inline-flex items-center gap-1.5 shrink-0">
                <span class="{psLbl} cursor-ew-resize"><span data-i18n="sizeLbl">{t.sizeLbl}</span>:</span>
                <div class="{psPod} w-[68px]">
                  <span id="dsBrushSizeFill" class="absolute bottom-0 left-0 h-[2px] bg-sky-500/80 dark:bg-sky-400/80 pointer-events-none" style="width:19%"></span>
                  <output id="dsBrushSizeVal" class="relative z-10 flex-1 text-left font-medium text-[11.5px] text-slate-800 dark:text-[#ececec] tabular-nums pointer-events-none">24px</output>
                  <span class="relative z-10 text-[9px] text-slate-400 dark:text-[#8c8c8c] pointer-events-none">▾</span>
                  <input type="range" id="dsBrushSize" min="2" max="120" value="24" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0" data-ds-tip="Brush Size  ( [ / ] )" />
                </div>
                <button type="button" data-ds-reset-retouch="size" class={psReset} aria-hidden="true"></button>
              </label>

              <label class="inline-flex items-center gap-1.5 shrink-0">
                <span class="{psLbl} cursor-ew-resize"><span data-i18n="hardnessLbl">{t.hardnessLbl}</span>:</span>
                <div class="{psPod} w-[64px]">
                  <span id="dsBrushHardnessFill" class="absolute bottom-0 left-0 h-[2px] bg-sky-500/80 dark:bg-sky-400/80 pointer-events-none" style="width:80%"></span>
                  <output id="dsBrushHardnessVal" class="relative z-10 flex-1 text-left font-medium text-[11.5px] text-slate-800 dark:text-[#ececec] tabular-nums pointer-events-none">80%</output>
                  <span class="relative z-10 text-[9px] text-slate-400 dark:text-[#8c8c8c] pointer-events-none">▾</span>
                  <input type="range" id="dsBrushHardness" min="0" max="100" value="80" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0" data-ds-tip="Brush Hardness  ( Shift + [ / ] )" />
                </div>
                <button type="button" data-ds-reset-retouch="hardness" class={psReset} aria-hidden="true"></button>
              </label>

              <!-- Blend Mode (Brush, Spot Healing, Clone Stamp) -->
              <label class="inline-flex items-center gap-1.5 shrink-0" data-ds-opts="brush heal clone">
                <span class={psLbl}>Mode:</span>
                <select id="dsBrushMode" class="{psSel} w-[96px]">
                  {#each blendModes as bm}
                    <option value={bm.id} selected={bm.id === 'normal'}>{bm.label}</option>
                  {/each}
                </select>
              </label>

              <!-- Dodge / Burn Range (Shadows, Midtones, Highlights) -->
              <label class="inline-flex items-center gap-1.5 shrink-0" data-ds-opts="dodge burn">
                <span class={psLbl}>Range:</span>
                <select id="dsDodgeRange" class="{psSel} w-[98px]">
                  <option value="shadows">Shadows</option>
                  <option value="midtones" selected>Midtones</option>
                  <option value="highlights">Highlights</option>
                </select>
              </label>

              <!-- Opacity / Exposure -->
              <label class="inline-flex items-center gap-1.5 shrink-0">
                <span class="{psLbl} cursor-ew-resize"><span id="dsBrushOpacityLbl">Opacity</span>:</span>
                <div class="{psPod} w-[64px]">
                  <span id="dsBrushOpacityFill" class="absolute bottom-0 left-0 h-[2px] bg-sky-500/80 dark:bg-sky-400/80 pointer-events-none" style="width:100%"></span>
                  <output id="dsBrushOpacityVal" class="relative z-10 flex-1 text-left font-medium text-[11.5px] text-slate-800 dark:text-[#ececec] tabular-nums pointer-events-none">100%</output>
                  <span class="relative z-10 text-[9px] text-slate-400 dark:text-[#8c8c8c] pointer-events-none">▾</span>
                  <input type="range" id="dsBrushOpacity" min="10" max="100" value="100" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0" data-ds-tip="Opacity / Exposure  ( 1 – 0 keys )" />
                </div>
                <button type="button" data-ds-reset-retouch="opacity" class={psReset} aria-hidden="true"></button>
              </label>

              <!-- Flow (Brush, Spot Healing, Clone Stamp) -->
              <label class="inline-flex items-center gap-1.5 shrink-0" data-ds-opts="brush heal clone">
                <span class="{psLbl} cursor-ew-resize">Flow:</span>
                <div class="{psPod} w-[64px]">
                  <span id="dsBrushFlowFill" class="absolute bottom-0 left-0 h-[2px] bg-sky-500/80 dark:bg-sky-400/80 pointer-events-none" style="width:100%"></span>
                  <output id="dsBrushFlowVal" class="relative z-10 flex-1 text-left font-medium text-[11.5px] text-slate-800 dark:text-[#ececec] tabular-nums pointer-events-none">100%</output>
                  <span class="relative z-10 text-[9px] text-slate-400 dark:text-[#8c8c8c] pointer-events-none">▾</span>
                  <input type="range" id="dsBrushFlow" min="1" max="100" value="100" class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 m-0" data-ds-tip="Brush Flow Rate (1% – 100%)" />
                </div>
                <button type="button" data-ds-reset-retouch="flow" class={psReset} aria-hidden="true"></button>
              </label>

              <!-- Sample Source (Spot Healing / Clone Stamp) -->
              <label class="inline-flex items-center gap-1.5 shrink-0" data-ds-opts="heal clone">
                <span class={psLbl}>Sample:</span>
                <select id="dsHealSample" class="{psSel} w-[118px]">
                  <option value="below" selected>Current &amp; Below</option>
                  <option value="current">Current Layer</option>
                </select>
              </label>
            </div>

            <!-- Clone Stamp source info -->
            <span
              id="dsCloneSrcInfo"
              class="inline-flex items-center h-7 px-2 rounded border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11.5px] font-semibold whitespace-nowrap shrink-0"
              data-ds-opts="clone"
            >Alt + Click to set source</span>

            <!-- Selection actions (Marquee / Lasso) -->
            <div class="inline-flex items-center gap-1 shrink-0" data-ds-opts="marquee-rect marquee-ellipse lasso lasso-poly">
              <button type="button" data-ds-sel="none" class={psBtn} data-ds-tip="Deselect (Ctrl+D)">Deselect</button>
              <button type="button" data-ds-sel="invert" class={psBtn} data-ds-tip="Inverse Selection (Ctrl+Shift+I)">Inverse</button>
              <button
                type="button"
                data-ds-sel="fill"
                class="{psBtn} !border-emerald-600/40 !bg-emerald-600 !text-white hover:!bg-emerald-700"
                data-ds-tip="Fill selection with color (Delete)">Fill (Del)</button
              >
            </div>

            <!-- Type Tool options: Font · Style · Bold/Italic · Size · Alignment · Color -->
            <div class="inline-flex items-center gap-1.5 shrink-0" data-ds-opts="text">
              <select id="dsTxtFont" class="{psSel} w-[162px]" data-ds-tip="Set the font family">
                {#each fontList as f}
                  <option value={f} style={`font-family:'${f}','Noto Sans Bengali',sans-serif`}>{f === 'SutonnyMJ' ? 'SutonnyMJ (Bijoy)' : f}</option>
                {/each}
              </select>
              <select id="dsTxtStyle" class="{psSel} w-[98px]" data-ds-tip="Set the font style">
                <option value="Regular">Regular</option>
                <option value="Bold">Bold</option>
                <option value="Italic">Italic</option>
                <option value="Bold Italic">Bold Italic</option>
              </select>
              <div class="inline-flex items-center rounded border border-slate-300 dark:border-white/10 overflow-hidden shrink-0" role="group" aria-label="Bold and Italic">
                <button
                  type="button"
                  id="dsTxtBoldBtn"
                  data-ds-txt-toggle="bold"
                  aria-pressed="false"
                  data-ds-tip="Bold (Ctrl+B)"
                  class="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 text-slate-700 dark:text-slate-200 font-serif font-extrabold text-[13.5px] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#454545] aria-pressed:bg-emerald-500/25 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
                >B</button>
                <button
                  type="button"
                  id="dsTxtItalicBtn"
                  data-ds-txt-toggle="italic"
                  aria-pressed="false"
                  data-ds-tip="Italic (Ctrl+I)"
                  class="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 border-l border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-serif italic font-bold text-[13.5px] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#454545] aria-pressed:bg-emerald-500/25 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
                >I</button>
              </div>
              <span class="inline-flex items-center gap-1 shrink-0" data-ds-tip="Set the font size">
                <span class="font-serif font-bold text-[14px] leading-none text-slate-600 dark:text-slate-300">T<small class="text-[9px]">T</small></span>
                <input id="dsTxtSize" type="number" min="4" max="400" step="1" value="28" list="dsTxtSizeList" class="{psSel} w-[66px] cursor-text tabular-nums" />
                <span class={psLbl}>pt</span>
                <datalist id="dsTxtSizeList">
                  {#each txtSizes as s}
                    <option value={s}></option>
                  {/each}
                </datalist>
              </span>
              <span class={psSep}></span>
              <div class="inline-flex items-center rounded border border-slate-300 dark:border-white/10 overflow-hidden shrink-0" role="group" aria-label="Text alignment">
                {#each txtAligns as a}
                  <button
                    type="button"
                    data-ds-txt-align={a.id}
                    aria-pressed={a.id === 'left' ? 'true' : 'false'}
                    data-ds-tip={a.tip}
                    class="w-7 h-7 inline-flex items-center justify-center bg-white dark:bg-[#383838] border-0 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#454545] aria-pressed:bg-emerald-500/20 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
                  >
                    <Icon name={a.icon} class="w-4 h-4" />
                  </button>
                {/each}
              </div>
              <label
                class="relative inline-flex items-center h-7 px-1.5 rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#383838] cursor-pointer shrink-0"
                data-ds-tip="Set the text color"
              >
                <input type="color" id="dsTxtColor" value="#111111" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0" />
                <span id="dsTxtColorChip" class="w-6 h-4 rounded-[2px] border border-slate-400" style="background:#111111"></span>
              </label>
              <span id="dsTxtEditActions" class="inline-flex items-center gap-1 shrink-0" hidden>
                <span class={psSep}></span>
                <button type="button" data-ds-txt="cancel" class="{psBtn} !px-1.5 !text-rose-600" data-ds-tip="Cancel current edits">
                  <Icon name="lucide:x" class="w-4 h-4" />
                </button>
                <button type="button" data-ds-txt="commit" class="{psBtn} !px-1.5 !text-emerald-600" data-ds-tip="Commit current edits (Ctrl+Enter)">
                  <Icon name="lucide:check" class="w-4 h-4" />
                </button>
              </span>
            </div>

            <!-- Zoom / Hand options -->
            <div class="inline-flex items-center gap-1 shrink-0" data-ds-opts="zoom hand">
              <button type="button" data-ds-pz="out" class="{psBtn} !px-1.5" data-ds-tip="Zoom Out (Ctrl -)">
                <Icon name="lucide:zoom-out" class="w-4 h-4" />
              </button>
              <span id="dsPreviewZoomLabel" class="inline-flex items-center justify-center w-[52px] h-7 rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#383838] text-[12px] font-bold tabular-nums text-slate-700 dark:text-slate-200">100%</span>
              <button type="button" data-ds-pz="in" class="{psBtn} !px-1.5" data-ds-tip="Zoom In (Ctrl +)">
                <Icon name="lucide:zoom-in" class="w-4 h-4" />
              </button>
              <button type="button" data-ds-pz="100" class={psBtn} data-ds-tip="Actual Pixels (Ctrl+1)">100%</button>
              <button type="button" data-ds-pz="fit" class={psBtn} data-ds-tip="Fit Screen (Ctrl+0)">Fit Screen</button>
            </div>

            <!-- Right side: Reset All & Done -->
            <div class="inline-flex items-center gap-1 ml-auto pl-2 shrink-0">
              <button type="button" data-ds="clear-erases" class="{psBtn} !px-1.5" data-i18n-title="resetAllRetouchBtn" title={t.resetAllRetouchBtn}>
                <Icon name="lucide:rotate-ccw" class="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                <span class="sr-only" data-i18n="resetAllRetouchBtn">{t.resetAllRetouchBtn}</span>
              </button>
              <button
                type="button"
                data-ds="close-eraser"
                class="ds-eraser-close inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-600 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-500 text-white dark:text-slate-950 text-[12.5px] font-bold cursor-pointer"
                data-i18n-title="doneBtn"
                title={t.doneBtn}
                aria-label={t.doneBtn}
              >
                ✓
                <span class="sr-only" data-i18n="doneBtn">{t.doneBtn}</span>
              </button>
            </div>
            <small class="sr-only" id="dsEraserHint" data-i18n="eraserHint">{t.eraserHint}</small>
          </div>

          <div class="relative flex-1 min-h-0 flex flex-col overflow-clip">
            <!-- PHOTOSHOP-STYLE TOOLS PANEL (PINNED OUTSIDE STAGE SO TEXT TYPING NEVER SCROLLS IT) -->
            <aside
              class="ds-ps-dock absolute left-1.5 top-2 w-[38px] rounded-md bg-[#2b2b2b] border border-black/60 p-[3px] flex flex-col items-center gap-[2px] z-[60] shrink-0 select-none shadow-[0_8px_22px_rgba(0,0,0,0.38)]"
              id="dsPsDock"
              hidden
              aria-label="Tools"
            >
              <span class="w-5 h-[3px] my-[2px] rounded-full bg-white/15" aria-hidden="true"></span>
              {#each dockGroups as g}
                {#if g.sep}
                  <span class="w-6 h-px bg-white/12 my-[3px]" aria-hidden="true"></span>
                {/if}
                <div class="relative" data-ds-group={g.id}>
                  <button
                    type="button"
                    data-ds-group-btn={g.id}
                    data-ds-cur={g.tools[0].id}
                    aria-pressed="false"
                    data-ds-tip={`${g.tools[0].name} (${g.tools[0].key})`}
                    class="ds-ps-tool relative w-8 h-8 p-0 rounded-[4px] border border-transparent bg-transparent text-[#d4d4d4] flex items-center justify-center cursor-pointer hover:bg-white/10 hover:text-white aria-pressed:bg-[#505050] aria-pressed:border-white/10 aria-pressed:text-white"
                  >
                    {#each g.tools as tl, ti}
                      <span data-ds-icon-for={tl.id} hidden={ti !== 0} class="inline-flex">
                        <Icon name={tl.icon} class="w-[18px] h-[18px] shrink-0" />
                      </span>
                    {/each}
                    {#if g.tools.length > 1}
                      <span
                        class="absolute right-[2px] bottom-[2px] w-0 h-0 border-l-[4px] border-l-transparent border-b-[4px] border-b-[#bdbdbd]"
                        aria-hidden="true"
                      ></span>
                    {/if}
                  </button>
                  {#if g.tools.length > 1}
                    <div
                      data-ds-flyout={g.id}
                      hidden
                      class="absolute left-[calc(100%+7px)] top-0 min-w-[232px] py-1 rounded-md bg-[#323232] border border-black/70 shadow-[0_10px_28px_rgba(0,0,0,0.5)] z-50"
                    >
                      {#each g.tools as tl}
                        <button
                          type="button"
                          data-ds-tool={tl.id}
                          class="w-full flex items-center gap-2.5 px-2.5 py-1.5 bg-transparent border-0 text-left text-[12.5px] text-[#e5e5e5] hover:bg-[#1473e6] hover:text-white cursor-pointer"
                        >
                          <span data-ds-fly-check={tl.id} class="w-2 h-2 rounded-[1px] bg-current shrink-0" style="visibility:hidden"></span>
                          <Icon name={tl.icon} class="w-[17px] h-[17px] shrink-0" />
                          <span class="flex-1 whitespace-nowrap">{tl.name}</span>
                          <span class="text-[#9ca3af] text-[11.5px] font-semibold">{tl.key}</span>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
              <span class="w-6 h-px bg-white/12 my-[3px]" aria-hidden="true"></span>
              <label
                class="relative w-8 h-8 p-0 rounded-[4px] border-0 bg-transparent flex items-center justify-center cursor-pointer hover:bg-white/10"
                data-ds-tip="Set Foreground Color"
              >
                <input type="color" id="dsDockColor" value="#ffffff" aria-label="Foreground Color" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0" />
                <span id="dsDockSwatch" class="w-5 h-5 rounded-[2px] border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.6)] pointer-events-none" style="background:#ffffff"></span>
              </label>
            </aside>

            <div
              class="ds-preview-stage flex-1 min-h-0 flex items-center justify-center overflow-clip relative p-3 bg-[#dcdcdc] dark:bg-[#252526] [container-type:size]"
              id="dsPreviewStage"
            >

            <div
              class="ds-preview-wrap relative inline-flex items-center justify-center origin-center select-none leading-none touch-none"
              id="dsPreviewWrap"
            >
              <canvas
                id="dsPreview"
                aria-label={t.previewCaption}
                class="block w-auto h-auto max-w-[calc(100cqw-52px)] max-h-[calc(100cqh-24px)] object-contain rounded-xs bg-white shadow-[0_12px_32px_rgba(0,0,0,0.45)] select-none transition-[filter,transform] duration-200"
              ></canvas>

              <!-- SATISFYING 3D KINETIC GYROSCOPE & GPU-ACCELERATED PRELOADER WITH COMPLETION STATE -->
              <div
                id="dsPreviewLoader"
                data-state="loading"
                class="ds-sat-loader absolute inset-0 rounded-xs overflow-hidden pointer-events-none z-22 flex items-center justify-center bg-slate-900/10 dark:bg-slate-950/30 transition-opacity duration-200 will-change-[opacity]"
                hidden
                aria-live="polite"
                aria-label="Updating preview"
              >
                <!-- Top Smooth Gradient Progress Ribbon (Pure Transform ScaleX/TranslateX) -->
                <div class="ds-sat-toptrack absolute inset-x-0 top-0 h-[3px] bg-slate-200/40 dark:bg-slate-800/50 overflow-hidden transition-opacity duration-200">
                  <div class="ds-sat-topbar h-full w-full origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500 will-change-transform"></div>
                </div>

                <!-- Center Satisfying Kinetic Pod (Pure Transform & Opacity Compositor Layer) -->
                <div class="ds-sat-pod relative w-22 h-22 rounded-2xl bg-white/96 dark:bg-slate-900/96 border border-slate-200/85 dark:border-slate-700/85 shadow-[0_18px_42px_rgba(16,185,129,0.22),0_4px_14px_rgba(15,23,42,0.12)] flex flex-col items-center justify-center gap-2 transition-[transform,opacity] duration-240 will-change-[transform,opacity]">
                  <!-- Expanding Soft Ripple (Loading) & Completion Burst Ring (Done) -->
                  <span class="ds-sat-ripple absolute w-11 h-11 rounded-full border border-emerald-400/55 pointer-events-none will-change-[transform,opacity]"></span>
                  <span class="ds-sat-done-burst absolute w-11 h-11 rounded-full border-2 border-emerald-400 opacity-0 pointer-events-none will-change-[transform,opacity]"></span>

                  <!-- 3D Gyroscope Orbits + Core Orb / Checkmark Badge (100% GPU Transform/Opacity) -->
                  <div class="ds-sat-gyro relative w-11 h-11 flex items-center justify-center">
                    <span class="ds-sat-ring ds-sat-ring-1 absolute inset-0 rounded-full"></span>
                    <span class="ds-sat-ring ds-sat-ring-2 absolute inset-0.5 rounded-full"></span>
                    <span class="ds-sat-ring ds-sat-ring-3 absolute inset-1 rounded-full"></span>
                    <span class="ds-sat-blob relative w-5 h-5 rounded-full"></span>
                    <span class="ds-sat-done-orb absolute w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_4px_14px_rgba(16,185,129,0.55)] flex items-center justify-center opacity-0 scale-50 transition-[transform,opacity] duration-220 will-change-[transform,opacity]">
                      <svg class="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>

                  <!-- Synchronized 5-Bar Sine Wave Equalizer (Pure ScaleY) / Done Label -->
                  <div class="relative h-4 w-full flex items-center justify-center">
                    <div class="ds-sat-bars flex items-center justify-center gap-1 h-2.5 transition-[opacity,transform] duration-180 will-change-[transform,opacity]">
                      <span class="ds-sat-bar w-1 h-2.5 rounded-full bg-emerald-500" style="animation-delay:0s"></span>
                      <span class="ds-sat-bar w-1 h-2.5 rounded-full bg-teal-400" style="animation-delay:0.1s"></span>
                      <span class="ds-sat-bar w-1 h-2.5 rounded-full bg-cyan-500" style="animation-delay:0.2s"></span>
                      <span class="ds-sat-bar w-1 h-2.5 rounded-full bg-indigo-500" style="animation-delay:0.3s"></span>
                      <span class="ds-sat-bar w-1 h-2.5 rounded-full bg-violet-500" style="animation-delay:0.4s"></span>
                    </div>
                    <span
                      class="ds-sat-done-text absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tracking-wide text-emerald-600 dark:text-emerald-400 opacity-0 scale-90 transition-[opacity,transform] duration-180 will-change-[transform,opacity]"
                      data-i18n="previewDoneLbl"
                    >✓ Ready</span>
                  </div>
                </div>
              </div>

              <!-- Editable Text Layers (drawn above the pixel layer, like Photoshop type layers) -->
              <canvas id="dsTextLayer" class="absolute inset-0 w-full h-full pointer-events-none z-[21]" aria-hidden="true"></canvas>
              <div id="dsTextDomOverlay" class="absolute inset-0 w-full h-full pointer-events-none z-[22] overflow-visible select-none" aria-hidden="true"></div>
              <!-- Marching-ants selection overlay (Marquee / Lasso) -->
              <svg
                id="dsSelOverlay"
                class="absolute inset-0 w-full h-full pointer-events-none z-[25] overflow-visible"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                aria-hidden="true"
                hidden
              >
                <path id="dsSelPathA" fill="none" stroke="#ffffff" stroke-width="1" vector-effect="non-scaling-stroke" />
                <path id="dsSelPathB" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" />
              </svg>
              <!-- Photoshop Move Tool Transform Controls Bounding Box (8 Resize Handles + Reference Point) -->
              <div
                id="dsTransformBox"
                hidden
                class="absolute pointer-events-none z-[28] border border-[#1473e6] shadow-[0_0_0_1px_rgba(255,255,255,0.65)]"
              >
                {#each tfHandles as h}
                  <button
                    type="button"
                    data-ds-tf-handle={h.id}
                    aria-label={`Resize ${h.id}`}
                    class="absolute {h.pos} w-2.5 h-2.5 p-0 rounded-[1px] bg-white border border-[#1473e6] shadow-[0_1px_3px_rgba(0,0,0,0.45)] pointer-events-auto"
                  ></button>
                {/each}
                <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none">
                  <span class="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[#1473e6]"></span>
                  <span class="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-[#1473e6]"></span>
                </span>
              </div>
              <!-- In-place Type Tool editor -->
              <textarea
                id="dsTextEditor"
                hidden
                spellcheck="false"
                wrap="off"
                rows="1"
                aria-label="Type text"
                class="absolute z-[33] m-0 p-0 border-0 bg-transparent resize-none overflow-hidden whitespace-pre select-text outline-1 outline-dashed outline-sky-500 [outline-offset:2px] shadow-none"
              ></textarea>
              <!-- Clone Stamp source crosshair -->
              <div id="dsCloneSrcMark" hidden class="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[31]">
                <span class="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"></span>
                <span class="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.65)]"></span>
              </div>
              <div
                id="dsEraserCursor"
                data-hud="false"
                data-hud-flip="false"
                class="ds-eraser-cursor group/cursor absolute w-6 h-6 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
                hidden
              >
                <!-- Real-Time Feathered Brush Preview Canvas (Shows Live Size, Hardness Falloff & Opacity) -->
                <canvas
                  id="dsBrushPreviewCanvas"
                  width="160"
                  height="160"
                  class="relative z-10 w-full h-full rounded-full block pointer-events-none"
                ></canvas>
                <!-- Subtle Non-Black Cursor Ring on Canvas (Hidden during Size/Hardness/Opacity HUD Preview) -->
                <span
                  class="absolute inset-0 z-20 rounded-full border border-emerald-500/45 shadow-[0_0_0_1px_rgba(255,255,255,0.7)] group-data-[hud=true]/cursor:opacity-0 pointer-events-none"
                ></span>
                <!-- Photoshop-Style Live Brush HUD Card (Diameter / Hardness / Opacity) -->
                <div
                  id="dsEraserCursorBadge"
                  class="absolute left-[calc(76%+6px)] top-[14%] group-data-[hud-flip=true]/cursor:left-auto group-data-[hud-flip=true]/cursor:right-[calc(76%+6px)] z-30 px-2.5 py-1.5 rounded-[5px] bg-[#585858]/90 border border-white/15 text-white text-[11.5px] leading-[1.35] font-normal tabular-nums whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.28)] backdrop-blur-[1.5px] opacity-0 transition-opacity duration-100 group-data-[hud=true]/cursor:opacity-100 pointer-events-none grid grid-cols-[auto_auto] gap-x-2 text-right"
                >
                  <span>Diameter :</span><span id="dsHudDiameter">24 px</span>
                  <span>Hardness :</span><span id="dsHudHardness">80%</span>
                  <span>Opacity :</span><span id="dsHudOpacity">100%</span>
                </div>
              </div>
              <div
                id="dsPickerLoupe"
                class="ds-picker-loupe absolute inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-900/95 border border-white/25 text-white text-[12px] font-bold pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+14px)] z-35 shadow-lg whitespace-nowrap"
                hidden
              >
                <span class="ds-picker-loupe-ring w-3.5 h-3.5 rounded-full border-2 border-white shrink-0" id="dsPickerLoupeSwatch"></span>
                <code id="dsPickerLoupeHex">#FFFFFF</code>
              </div>
            </div>
            </div>
          </div>
        </section>
      </div>

      <!-- BOTTOM WORKSPACE HUD & ZOOM BAR -->
      <footer
        class="ds-status group-data-[has-pages=false]/ds:!hidden min-h-[34px] px-3 py-1 border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar flex items-center justify-between gap-2 max-sm:flex-wrap text-[12.5px] text-slate-600 dark:text-studio-muted shrink-0"
      >
        <div class="ds-status-left inline-flex items-center gap-2">
          <div
            class="ds-zoom inline-flex items-center gap-0.5 p-0.5 rounded-md bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border"
            role="group"
            aria-label="Canvas Zoom"
          >
            <button
              type="button"
              data-ds="zoom-out"
              aria-label="Zoom Out"
              title="Zoom Out (Ctrl -)"
              class="min-h-[22px] min-w-[24px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >−</button
            >
            <span id="dsZoom" class="min-w-[42px] text-center font-bold text-[12px] text-slate-800 dark:text-studio-text tabular-nums">100%</span>
            <button
              type="button"
              data-ds="zoom-in"
              aria-label="Zoom In"
              title="Zoom In (Ctrl +)"
              class="min-h-[22px] min-w-[24px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >+</button
            >
            <button
              type="button"
              data-ds="fit"
              title="Fit to Screen (Ctrl 0)"
              class="min-h-[22px] min-w-[26px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >Fit</button
            >
            <button
              type="button"
              data-ds="actual"
              title="100% Actual Size (Ctrl 1)"
              class="min-h-[22px] min-w-[32px] px-1.5 py-0 border-0 rounded bg-transparent text-[12px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >100%</button
            >
          </div>
          <span
            class="ds-page-pill px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[12px] font-bold text-slate-700 dark:text-studio-text tabular-nums"
            id="dsPageName">{t.pageWord} 1</span
          >
        </div>
        <span id="dsStatus" role="status" class="text-slate-800 dark:text-studio-text font-semibold text-[12.5px] truncate">{t.statusInitial}</span>
        <div class="ds-status-right inline-flex items-center gap-2">
          <button
            type="button"
            id="dsCompare"
            class="inline-flex items-center justify-center w-7 h-6 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-studio-surface disabled:opacity-40 disabled:cursor-not-allowed aria-pressed:bg-emerald-500/15 aria-pressed:border-emerald-500 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
            aria-pressed="false"
            disabled
            data-i18n-title="compareTip"
            title={t.compareTip}
          >
            <Icon name="lucide:split-square-horizontal" class="w-4 h-4 shrink-0" />
            <span class="sr-only" data-i18n="compareBtn">{t.compareBtn}</span>
          </button>
          <small class="ds-shortcuts text-[11.5px] text-slate-400 dark:text-slate-500 max-xl:hidden" data-i18n="shortcutsHint"
            >{t.shortcutsHint}</small
          >
        </div>
      </footer>
    </div>

    <!-- RIGHT PANEL: PHOTOSHOP-STYLE 3-TAB INSPECTOR DOCK + LAYERS PANEL + EXPORT DOCK -->
    <aside
      class="ds-settings group-data-[has-pages=false]/ds:!hidden bg-white dark:bg-studio-sidebar border-l border-slate-200 dark:border-studio-border flex flex-col min-h-0 overflow-hidden max-lg:fixed max-lg:top-12 max-lg:right-0 max-lg:bottom-0 max-lg:w-[min(352px,94vw)] max-lg:z-90 max-lg:shadow-2xl max-lg:translate-x-[104%] max-lg:group-data-[drawer=inspector]/ds:translate-x-0 max-lg:transition-transform max-lg:duration-200"
      id="dsInspectorPanel"
      aria-label={t.inspectorTitle}
    >
      <!-- UPPER DOCK: PHOTOSHOP-STYLE 3-TAB PANEL (FILTERS · SMART FIX · ADJUSTMENTS) -->
      <div class="shrink-0 border-b border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel flex flex-col">
        <!-- Photoshop-Style Tab Header Bar -->
        <div
          class="ds-panel-head min-h-[36px] px-1.5 pt-1 flex items-end justify-between gap-1 border-b border-slate-200 dark:border-studio-border bg-slate-100 dark:bg-[#252525] shrink-0"
        >
          <div class="inline-flex items-end gap-0.5 min-w-0" role="tablist" aria-label="Inspector Tabs">
            <button
              type="button"
              role="tab"
              data-ds-insp-tab="filters"
              aria-selected="true"
              class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-t-md border border-b-0 border-transparent text-[12px] font-bold text-slate-600 dark:text-slate-400 bg-transparent cursor-pointer hover:text-slate-900 dark:hover:text-white aria-selected:bg-white dark:aria-selected:bg-studio-panel aria-selected:border-slate-200 dark:aria-selected:border-studio-border aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400 transition-colors"
            >
              <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>Filters</span>
            </button>
            <button
              type="button"
              role="tab"
              data-ds-insp-tab="smart"
              aria-selected="false"
              class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-t-md border border-b-0 border-transparent text-[12px] font-bold text-slate-600 dark:text-slate-400 bg-transparent cursor-pointer hover:text-slate-900 dark:hover:text-white aria-selected:bg-white dark:aria-selected:bg-studio-panel aria-selected:border-slate-200 dark:aria-selected:border-studio-border aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400 transition-colors"
            >
              <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Smart Fix</span>
            </button>
            <button
              type="button"
              role="tab"
              data-ds-insp-tab="manual"
              aria-selected="false"
              class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-t-md border border-b-0 border-transparent text-[12px] font-bold text-slate-600 dark:text-slate-400 bg-transparent cursor-pointer hover:text-slate-900 dark:hover:text-white aria-selected:bg-white dark:aria-selected:bg-studio-panel aria-selected:border-slate-200 dark:aria-selected:border-studio-border aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400 transition-colors"
            >
              <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Adjustments</span>
            </button>
          </div>
          <div class="ds-panel-head-actions inline-flex items-center gap-1 pb-1 shrink-0">
            <button
              type="button"
              data-ds="apply-all"
              class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-studio-surface disabled:opacity-40 disabled:cursor-not-allowed"
              disabled
              title={t.applyAllBtn}
            >
              <Icon name="lucide:copy-check" class="w-3.5 h-3.5 shrink-0" />
              <span class="sr-only" data-i18n="applyAllBtn">{t.applyAllBtn}</span>
            </button>
            <button
              type="button"
              data-ds="reset-color"
              class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-studio-surface disabled:opacity-40 disabled:cursor-not-allowed"
              disabled
              title={t.resetBtn}
            >
              <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5 shrink-0" />
              <span class="sr-only" data-i18n="resetBtn">{t.resetBtn}</span>
            </button>
            <button
              type="button"
              class="ds-icon-only ds-drawer-close hidden max-lg:inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200 dark:border-studio-border bg-slate-100 dark:bg-studio-panel text-[11px] font-bold cursor-pointer"
              data-ds="close-drawers"
              data-i18n-title="closeDrawerTip"
              aria-label={t.closeDrawerTip}
              title={t.closeDrawerTip}
            >
              ✕
            </button>
          </div>
        </div>

        <!-- TAB PANE 1: AI & SCAN FILTERS -->
        <section data-ds-insp-pane="filters" class="bg-white dark:bg-studio-panel overflow-hidden shrink-0">
          <div class="px-2.5 py-1 bg-slate-50/70 dark:bg-studio-sidebar/60 border-b border-slate-100 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 dark:text-studio-muted">
              <span data-i18n="accFiltersTitle">{t.accFiltersTitle}</span>
              <span
                class="inline-flex items-center px-1.5 py-0.2 rounded-full bg-violet-500/12 text-violet-700 dark:text-violet-300 text-[10px] font-bold"
                data-i18n="accFiltersBadge">{t.accFiltersBadge}</span
              >
            </span>
            <button
              type="button"
              data-ds-reset-section="filter"
              class="inline-flex items-center justify-center w-5.5 h-5.5 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              disabled
              data-i18n-title="resetFilterTip"
              title={t.resetFilterTip}
            >
              <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
              <span class="sr-only" data-i18n="resetFilterTip">{t.resetFilterTip}</span>
            </button>
          </div>
          <fieldset class="ds-presets m-0 p-2 border-0 grid grid-cols-2 gap-1.5">
            <legend class="sr-only" data-i18n="accFiltersTitle">{t.accFiltersTitle}</legend>
            {#each t.presets as preset, idx}
              {@const presetColors = [
                'text-violet-600 dark:text-violet-400',
                'text-amber-500 dark:text-amber-400',
                'text-blue-600 dark:text-blue-400',
                'text-fuchsia-600 dark:text-fuchsia-400',
                'text-orange-500 dark:text-orange-400',
                'text-indigo-600 dark:text-indigo-400',
                'text-cyan-600 dark:text-cyan-400'
              ]}
              <label class="relative cursor-pointer {idx === 0 ? 'col-span-2' : ''}" title={preset.desc}>
                <input type="radio" name="dsFilter" value={preset.value} checked={preset.value === 'magic_plus'} class="sr-only peer" />
                <span
                  class="min-h-[30px] px-2 py-1 rounded-[4px] border border-slate-200/90 dark:border-[#141414] bg-slate-50/70 dark:bg-[#1e1e1e] flex items-center justify-between gap-1.5 transition-all hover:border-slate-300 dark:hover:border-[#4a4a4a] hover:bg-white dark:hover:bg-[#333333] peer-checked:border-emerald-500 dark:peer-checked:border-[#5a5a5a] peer-checked:bg-emerald-500/10 dark:peer-checked:bg-[#3d3d3d] peer-checked:shadow-2xs peer-checked:[&_b]:text-emerald-700 dark:peer-checked:[&_b]:text-white"
                >
                  <span class="inline-flex items-center gap-1.5 min-w-0">
                    <Icon name={`lucide:${preset.icon}`} class="w-3.5 h-3.5 {presetColors[idx % presetColors.length]} shrink-0" />
                    <b class="text-[12px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-preset-title={preset.value}
                      >{preset.title}</b
                    >
                  </span>
                  {#if idx === 0}
                    <small class="text-[10.5px] text-slate-500 dark:text-studio-muted truncate ml-auto mr-1" data-i18n-preset-desc={preset.value}
                      >{preset.desc}</small
                    >
                  {:else}
                    <small class="sr-only" data-i18n-preset-desc={preset.value}>{preset.desc}</small>
                  {/if}
                  {#if preset.ai}
                    <em class="ds-ai-tag not-italic px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9.5px] font-extrabold tracking-wider uppercase shrink-0"
                      >AI</em
                    >
                  {/if}
                </span>
              </label>
            {/each}
          </fieldset>
        </section>

        <!-- TAB PANE 2: SMART FIX & CLEANUP -->
        <section data-ds-insp-pane="smart" hidden class="ds-section ds-smart-options bg-white dark:bg-studio-panel overflow-hidden shrink-0">
          <div class="px-2.5 py-1 bg-slate-50/70 dark:bg-studio-sidebar/60 border-b border-slate-100 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 dark:text-studio-muted">
              <span data-i18n="accSmartTitle">{t.accSmartTitle}</span>
              <span
                class="inline-flex items-center px-1.5 py-0.2 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[10px] font-bold"
                data-i18n="accSmartBadge">{t.accSmartBadge}</span
              >
            </span>
            <button
              type="button"
              data-ds-reset-section="smart"
              class="inline-flex items-center justify-center w-5.5 h-5.5 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              disabled
              data-i18n-title="resetSmartTip"
              title={t.resetSmartTip}
            >
              <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
              <span class="sr-only" data-i18n="resetSmartTip">{t.resetSmartTip}</span>
            </button>
          </div>
          <div class="p-2 grid grid-cols-2 gap-1.5">
            {#each [
              { id: 'dsShadow', icon: 'lucide:sun', color: 'text-amber-500 dark:text-amber-400', key: 'optShadow', label: t.optShadow, span: '' },
              { id: 'dsText', icon: 'lucide:scan-text', color: 'text-indigo-600 dark:text-indigo-400', key: 'optText', label: t.optText, span: '' },
              { id: 'dsStraighten', icon: 'lucide:align-horizontal-justify-center', color: 'text-blue-600 dark:text-blue-400', key: 'optStraighten', label: t.optStraighten, span: '' },
              { id: 'dsCleanSpots', icon: 'lucide:eraser', color: 'text-rose-500 dark:text-rose-400', key: 'optCleanSpots', label: t.optCleanSpots, span: '' },
              { id: 'dsCleanMargins', icon: 'lucide:scan', color: 'text-emerald-600 dark:text-emerald-400', key: 'optCleanMargins', label: t.optCleanMargins, span: 'col-span-2' }
            ] as opt}
              <label
                class="ds-toggle {opt.span} min-h-[30px] flex items-center justify-between gap-1 px-2 py-1 rounded-[4px] bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/90 dark:border-[#141414] cursor-pointer text-[11.5px] font-semibold tracking-[-0.01em] text-slate-800 dark:text-studio-text transition-colors hover:bg-white dark:hover:bg-[#333333] hover:border-slate-300 dark:hover:border-[#4a4a4a]"
                title={opt.key === 'optCleanMargins' ? t.cleanMarginsHint : opt.label}
              >
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name={opt.icon} class="w-3.5 h-3.5 {opt.color} shrink-0" />
                  <em class="not-italic truncate" data-i18n={opt.key}>{opt.label}</em>
                </span>
                <input id={opt.id} type="checkbox" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>
            {/each}
          </div>
          <small class="sr-only" data-i18n="cleanMarginsHint">{t.cleanMarginsHint}</small>
        </section>

        <!-- TAB PANE 3: MANUAL ADJUSTMENTS -->
        <section data-ds-insp-pane="manual" hidden class="ds-section ds-sliders bg-white dark:bg-studio-panel overflow-hidden shrink-0">
          <div class="px-2.5 py-1 bg-slate-50/70 dark:bg-studio-sidebar/60 border-b border-slate-100 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-600 dark:text-studio-muted">
              <span data-i18n="accManualTitle">{t.accManualTitle}</span>
              <span
                class="inline-flex items-center px-1.5 py-0.2 rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                data-i18n="accManualBadge">{t.accManualBadge}</span
              >
            </span>
            <button
              type="button"
              data-ds-reset-section="manual"
              class="inline-flex items-center justify-center w-5.5 h-5.5 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              disabled
              data-i18n-title="resetManualTip"
              title={t.resetManualTip}
            >
              <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
              <span class="sr-only" data-i18n="resetManualTip">{t.resetManualTip}</span>
            </button>
          </div>

          <div class="p-2">
            <!-- In-Button Scrubby Sliders: Drag or Scroll Mouse Wheel directly on each button! -->
            <div class="grid grid-cols-2 gap-1.5">
              {#each [
                { key: 'brightness', id: 'dsBrightness', icon: 'lucide:sun-medium', color: 'text-amber-500 dark:text-amber-400', i18nKey: 'lblBrightness', label: t.lblBrightness, outId: 'dsBrightnessValue', initVal: '100%', min: 60, max: 150, step: 1, val: 100, initPct: 44.4 },
                { key: 'contrast', id: 'dsContrast', icon: 'lucide:contrast', color: 'text-indigo-600 dark:text-indigo-400', i18nKey: 'lblContrast', label: t.lblContrast, outId: 'dsContrastValue', initVal: '100%', min: 60, max: 170, step: 1, val: 100, initPct: 36.4 },
                { key: 'sharpness', id: 'dsSharpness', icon: 'lucide:triangle', color: 'text-violet-600 dark:text-violet-400', i18nKey: 'lblSharpness', label: t.lblSharpness, outId: 'dsSharpnessValue', initVal: '25%', min: 0, max: 100, step: 1, val: 25, initPct: 25 },
                { key: 'angle', id: 'dsAngle', icon: 'lucide:rotate-cw', color: 'text-blue-600 dark:text-blue-400', i18nKey: 'lblAngle', label: t.lblAngle, outId: 'dsAngleValue', initVal: '0°', min: -10, max: 10, step: 0.1, val: 0, initPct: 50 },
                { key: 'curve', id: 'dsCurve', icon: 'lucide:book-open', color: 'text-cyan-600 dark:text-cyan-400', i18nKey: 'lblCurve', label: t.lblCurve, outId: 'dsCurveValue', initVal: '0', min: -50, max: 50, step: 1, val: 0, initPct: 50 },
                { key: 'trim', id: 'dsTrim', icon: 'lucide:maximize', color: 'text-emerald-600 dark:text-emerald-400', i18nKey: 'lblTrim', label: t.lblTrim, outId: 'dsTrimValue', initVal: '0%', min: 0, max: 4, step: 0.5, val: 0, initPct: 0 }
              ] as adj}
                <div
                  data-ds-adj-pod={adj.key}
                  class="group/pod min-h-[30px] rounded-[4px] border border-slate-200/90 dark:border-[#141414] bg-slate-50/80 dark:bg-[#1e1e1e] flex items-stretch overflow-hidden transition-all hover:border-slate-300 dark:hover:border-[#4a4a4a] hover:bg-white dark:hover:bg-[#2a2a2a] data-[modified=true]:border-amber-500/50"
                >
                  <div class="relative flex-1 min-w-0 px-1.5 py-1 flex items-center justify-between gap-1 overflow-hidden select-none">
                    <!-- Dynamic Slider Fill Bar Inside Button -->
                    <span
                      data-ds-adj-fill={adj.key}
                      class="absolute inset-y-0 left-0 bg-emerald-500/14 dark:bg-white/[0.08] pointer-events-none transition-[width] duration-75"
                      style="width:{adj.initPct}%"
                    ></span>
                    <span class="relative z-10 inline-flex items-center gap-1 min-w-0 pointer-events-none">
                      <Icon name={adj.icon} class="w-3.5 h-3.5 {adj.color} shrink-0" />
                      <span class="truncate text-[11.5px] font-semibold tracking-[-0.01em] text-slate-700 dark:text-[#cfcfcf]" data-i18n={adj.i18nKey}>{adj.label}</span>
                    </span>
                    <output id={adj.outId} class="relative z-10 text-emerald-600 dark:text-[#e6e6e6] font-bold text-[11.5px] tabular-nums shrink-0 pointer-events-none">{adj.initVal}</output>
                    <input
                      id={adj.id}
                      aria-label={adj.label}
                      type="range"
                      min={adj.min}
                      max={adj.max}
                      step={adj.step}
                      value={adj.val}
                      class="ds-btn-slider absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 disabled:cursor-not-allowed"
                    />
                  </div>
                  <button
                    type="button"
                    data-ds-reset-adj={adj.key}
                    class="w-5 shrink-0 border-0 border-l border-slate-200/70 dark:border-studio-border bg-transparent inline-flex items-center justify-center text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed group-data-[modified=true]/pod:text-amber-600 dark:group-data-[modified=true]/pod:text-amber-400"
                    data-i18n-title="resetToolTip"
                    title={t.resetToolTip}
                  >
                    <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
                    <span class="sr-only" data-i18n="resetToolTip">{t.resetToolTip}</span>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </section>
      </div>

      <!-- LOWER DOCK: PHOTOSHOP-STYLE LAYERS PANEL (BACKGROUND + BRUSH / RETOUCH / TEXT LAYERS) -->
      <section
        id="dsLayersSection"
        class="ds-layers-panel flex-1 min-h-[156px] flex flex-col bg-slate-50 dark:bg-[#252525] overflow-hidden"
        aria-label="Layers"
      >
        <!-- Layers Tab Header -->
        <div class="px-2 pt-1 bg-slate-200/75 dark:bg-[#1f1f1f] border-b border-slate-300/80 dark:border-black/50 flex items-end justify-between shrink-0">
          <div class="inline-flex items-center gap-1.5 h-6.5 px-2.5 rounded-t border border-b-0 border-slate-300/80 dark:border-white/10 bg-slate-50 dark:bg-[#2b2b2b] text-[12px] font-bold text-slate-800 dark:text-slate-100">
            <Icon name="lucide:layers" class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Layers</span>
            <span id="dsLayerCount" class="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10.5px] font-extrabold tabular-nums">1</span>
          </div>
          <span class="text-[10.5px] text-slate-400 dark:text-slate-500 pb-1 pr-1">Photoshop Stack</span>
        </div>

        <!-- Photoshop Blend Mode + Opacity + Lock Sub-Header -->
        <div class="px-2 py-1 bg-slate-100 dark:bg-[#2b2b2b] border-b border-slate-200 dark:border-black/40 flex items-center gap-1.5 shrink-0">
          <select id="dsLayerBlendMode" disabled class="{psSel} w-[96px] !h-6 !text-[11.5px] disabled:opacity-45" title="Layer Blend Mode">
            {#each blendModes as bm}
              <option value={bm.id}>{bm.label}</option>
            {/each}
          </select>
          <label class="inline-flex items-center gap-1 ml-auto shrink-0" title="Layer Opacity">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Opacity:</span>
            <input id="dsLayerOpacity" type="number" min="0" max="100" step="1" value="100" disabled class="{psSel} w-[50px] !h-6 !text-[11.5px] tabular-nums disabled:opacity-45" />
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">%</span>
          </label>
          <button
            type="button"
            id="dsLayerLockBtn"
            disabled
            class="w-6 h-6 inline-flex items-center justify-center rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-[#383838] text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#454545] aria-pressed:bg-amber-500/20 aria-pressed:text-amber-600 dark:aria-pressed:text-amber-300 disabled:opacity-40"
            title="Lock / Unlock Active Layer"
            aria-pressed="false"
          >
            <Icon name="lucide:lock" class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Scrollable Layer Stack (#dsLayerList) -->
        <div
          id="dsLayerList"
          class="flex-1 min-h-0 overflow-y-auto p-1 flex flex-col gap-0.5 bg-slate-200/55 dark:bg-[#1e1e1e] [scrollbar-width:thin]"
          role="listbox"
          aria-label="Document Layers"
        ></div>

        <!-- Compact Photoshop-style layer actions -->
        <div class="ds-layer-actions px-2 py-1 bg-slate-100 dark:bg-[#2b2b2b] border-t border-slate-200 dark:border-black/50 flex items-center justify-end gap-1 shrink-0">
          <button type="button" data-ds-layer-act="effects" title="Layer Style (Effects)" aria-label="Layer Style (Effects)" class="ds-layer-icon ds-fx-icon">fx</button>
          <button type="button" data-ds-layer-act="mask" title="Add layer mask from selection" aria-label="Add layer mask from selection" class="ds-layer-icon"><Icon name="lucide:layer-mask" class="w-3.5 h-3.5" /></button>
          <button type="button" data-ds-layer-act="adjustment" title="New fill or adjustment layer" aria-label="New fill or adjustment layer" class="ds-layer-icon"><Icon name="lucide:layer-adjustment" class="w-3.5 h-3.5" /></button>
          <button
            type="button"
            data-ds-layer-act="merge"
            id="dsLayerMergeBtn"
            disabled
            class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200/80 dark:hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed"
            title="Merge Down into Layer Below (Ctrl+E)"
          >
            <Icon name="lucide:merge" class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-ds-layer-act="dup"
            id="dsLayerDupBtn"
            disabled
            class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200/80 dark:hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed"
            title="Duplicate Active Layer (Ctrl+J)"
          >
            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-ds-layer-act="add"
            id="dsLayerAddBtn"
            class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/15 disabled:opacity-35 disabled:cursor-not-allowed"
            title="Create a New Layer"
          >
            <Icon name="lucide:plus-square" class="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ds-layer-act="del"
            id="dsLayerDelBtn"
            disabled
            class="w-6.5 h-6.5 inline-flex items-center justify-center rounded border border-transparent bg-transparent text-rose-500 dark:text-rose-400 cursor-pointer hover:bg-rose-500/15 disabled:opacity-35 disabled:cursor-not-allowed"
            title="Delete Active Layer"
          >
            <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <!-- PANEL 4: PINNED PAGE SETUP & DIRECT 1-CLICK EXPORT DOCK -->
      <div class="ds-export ds-section ds-export-settings border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar shrink-0">
        <div class="px-3 py-1.5 bg-slate-50/95 dark:bg-studio-panel border-b border-slate-200/80 dark:border-studio-border flex items-center justify-between gap-1.5">
          <span class="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-800 dark:text-studio-text">
            <Icon name="lucide:file-down" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span data-i18n="accExportTitle">{t.accExportTitle}</span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-bold"
              data-i18n="accExportBadge">{t.accExportBadge}</span
            >
          </span>
          <button
            type="button"
            data-ds-reset-section="export"
            class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-sidebar text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface transition-colors"
            data-i18n-title="resetExportTip"
            title={t.resetExportTip}
          >
            <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5 shrink-0" />
            <span class="sr-only" data-i18n="resetExportTip">{t.resetExportTip}</span>
          </button>
        </div>

        <div class="p-2.5 grid gap-2">
        <!-- Direct Page Setup Controls -->
        <div class="grid gap-1.5">
          <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5">
            <input
              type="text"
              id="dsFilename"
              value="TechHat-document"
              maxlength="100"
              aria-label={t.lblFilename}
              placeholder={t.lblFilename}
              class="min-w-0 w-full min-h-[30px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[12px] font-semibold outline-none focus:border-emerald-500"
            />
            <label
              class="inline-flex items-center gap-1.5 min-h-[30px] px-2 py-1 rounded-md bg-white dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-[12px] font-semibold text-slate-700 dark:text-studio-text whitespace-nowrap"
              title={t.lblMargin}
            >
              <input type="checkbox" id="dsMargin" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              <span data-i18n="lblMargin">{t.lblMargin}</span>
            </label>
          </div>

          <div class="grid grid-cols-2 gap-1.5">
            <select
              id="dsPaper"
              aria-label={t.lblPaperSize}
              title={t.lblPaperSize}
              class="w-full min-h-[30px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[12px] font-semibold outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="a4" data-i18n="paperA4">{t.paperA4}</option>
              <option value="letter" data-i18n="paperLetter">{t.paperLetter}</option>
              <option value="original" data-i18n="paperOrig">{t.paperOrig}</option>
            </select>
            <select
              id="dsQuality"
              aria-label={t.lblQuality}
              title={t.lblQuality}
              class="w-full min-h-[30px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[12px] font-semibold outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="high" data-i18n="qualHigh">{t.qualHigh}</option>
              <option value="balanced" selected data-i18n="qualBalanced">{t.qualBalanced}</option>
              <option value="small" data-i18n="qualSmall">{t.qualSmall}</option>
            </select>
          </div>

          <!-- Hidden Crop Learning Controls -->
          <div class="hidden">
            <select id="dsDatasetSplit" aria-label={t.lblDatasetMode}>
              <option value="training">Training</option>
              <option value="testing">Testing</option>
            </select>
            <button type="button" data-ds="clear-learning">{t.learnedPrefix}0</button>
          </div>
        </div>

        <!-- Primary & Secondary 1-Click Export Actions -->
        <button type="button" class="{btnPrimary} w-full min-h-[36px] justify-between px-3.5 text-[13px] rounded-lg" data-ds="pdf" disabled>
          <span class="inline-flex items-center gap-2">
            <Icon name="lucide:file-down" class="w-4 h-4 shrink-0" />
            <span data-i18n="downloadPdfBtn">{t.downloadPdfBtn}</span>
          </span>
          <span id="dsExportCount" class="px-2 py-0.5 rounded-full bg-black/15 text-[11.5px] font-extrabold tabular-nums">0 pages</span>
        </button>

        <div class="ds-export-sub grid grid-cols-4 gap-1.5">
          <button type="button" data-ds="jpg" class="{btnBase} w-full min-h-[30px] px-1.5 justify-center text-[12px] rounded-md" disabled title="Download Current Page as JPG">
            <Icon name="lucide:image-down" class="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span data-i18n="downloadJpgBtn">{t.downloadJpgBtn}</span>
          </button>
          <button type="button" data-ds="png" class="{btnBase} w-full min-h-[30px] px-1.5 justify-center text-[12px] rounded-md" disabled title="Download Current Page as Lossless PNG">
            <Icon name="lucide:file-image" class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span data-i18n="downloadPngBtn">{t.downloadPngBtn}</span>
          </button>
          <button type="button" data-ds="zip" class="{btnBase} w-full min-h-[30px] px-1.5 justify-center text-[12px] rounded-md" disabled title="Download All Pages as ZIP">
            <Icon name="lucide:archive" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span data-i18n="downloadZipBtn">{t.downloadZipBtn}</span>
          </button>
          <button type="button" data-ds="print" class="{btnBase} w-full min-h-[30px] px-1.5 justify-center text-[12px] rounded-md" disabled data-i18n-title="printTip" title={t.printTip}>
            <Icon name="lucide:printer" class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
            <span data-i18n="printBtn">{t.printBtn}</span>
          </button>
        </div>
        </div>
      </div>
    </aside>
  </div>

  <!-- MODALS -->
  <dialog
    id="dsCameraDialog"
    class="ds-camera-dialog w-[min(640px,94vw)] border border-slate-200 dark:border-studio-border rounded-2xl bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text p-4 shadow-2xl backdrop:bg-slate-950/70 backdrop:backdrop-blur-xs"
    aria-labelledby="dsCameraTitle"
  >
    <div class="ds-camera-head flex items-center justify-between gap-3 mb-2.5">
      <h2 id="dsCameraTitle" class="m-0 text-base font-extrabold text-slate-900 dark:text-studio-text" data-i18n="camDialogTitle">
        {t.camDialogTitle}
      </h2>
      <button type="button" data-ds="camera-close" class={btnBase} aria-label={t.closeDrawerTip}>✕</button>
    </div>
    <div class="ds-camera-stage relative rounded-xl overflow-hidden bg-black aspect-4/3 mb-2.5">
      <video id="dsVideo" autoplay playsinline muted class="w-full h-full object-cover block"></video>
      <div
        class="ds-camera-guide absolute inset-[8%] border-2 border-dashed border-emerald-400/85 rounded-xl shadow-[0_0_0_999px_rgba(0,0,0,0.32)] pointer-events-none"
      ></div>
    </div>
    <p class="m-0 mb-3 text-slate-600 dark:text-studio-muted text-xs leading-relaxed" data-i18n="camDialogHint">{t.camDialogHint}</p>
    <div class="ds-camera-actions flex justify-end gap-2">
      <button type="button" data-ds="camera-switch" class={btnBase}>
        <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5 shrink-0" />
        <span data-i18n="camSwitchBtn">{t.camSwitchBtn}</span>
      </button>
      <button type="button" class={btnPrimary} data-ds="capture">
        <Icon name="lucide:camera" class="w-4 h-4 shrink-0" />
        <span data-i18n="camCaptureBtn">{t.camCaptureBtn}</span>
      </button>
    </div>
  </dialog>

  <dialog
    id="dsResetDialog"
    class="ds-confirm w-[min(420px,92vw)] border border-slate-200 dark:border-studio-border rounded-2xl bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text p-4 shadow-2xl backdrop:bg-slate-950/70 backdrop:backdrop-blur-xs"
  >
    <h2 class="m-0 mb-1.5 text-base font-extrabold text-slate-900 dark:text-studio-text" data-i18n="resetDialogTitle">{t.resetDialogTitle}</h2>
    <p class="m-0 mb-3 text-slate-600 dark:text-studio-muted text-xs leading-relaxed" data-i18n="resetDialogDesc">{t.resetDialogDesc}</p>
    <form method="dialog" class="flex justify-end gap-2">
      <button value="cancel" class={btnBase} data-i18n="cancelBtn">{t.cancelBtn}</button>
      <button value="reset" class={btnPrimary} data-i18n="confirmResetBtn">{t.confirmResetBtn}</button>
    </form>
  </dialog>
</section>

<style>
  @keyframes dsGyroOrbit1 {
    0% {
      transform: rotateX(65deg) rotateY(20deg) rotateZ(0deg);
    }
    100% {
      transform: rotateX(65deg) rotateY(20deg) rotateZ(360deg);
    }
  }
  @keyframes dsGyroOrbit2 {
    0% {
      transform: rotateX(-65deg) rotateY(22deg) rotateZ(360deg);
    }
    100% {
      transform: rotateX(-65deg) rotateY(22deg) rotateZ(0deg);
    }
  }
  @keyframes dsGyroOrbit3 {
    0% {
      transform: rotateX(20deg) rotateY(68deg) rotateZ(0deg);
    }
    100% {
      transform: rotateX(20deg) rotateY(68deg) rotateZ(360deg);
    }
  }
  @keyframes dsLiquidBlob {
    0%,
    100% {
      transform: scale3d(0.88, 1.08, 1) rotate(0deg);
    }
    33% {
      transform: scale3d(1.12, 0.9, 1) rotate(120deg);
    }
    66% {
      transform: scale3d(0.95, 1.1, 1) rotate(240deg);
    }
  }
  @keyframes dsSatRipple {
    0% {
      transform: scale3d(0.65, 0.65, 1);
      opacity: 0.7;
    }
    100% {
      transform: scale3d(1.48, 1.48, 1);
      opacity: 0;
    }
  }
  @keyframes dsSineBar {
    0%,
    100% {
      transform: scaleY(0.35);
      opacity: 0.55;
    }
    50% {
      transform: scaleY(1);
      opacity: 1;
    }
  }
  @keyframes dsSatTopbar {
    0% {
      transform: translate3d(-100%, 0, 0) scaleX(0.45);
    }
    100% {
      transform: translate3d(110%, 0, 0) scaleX(0.45);
    }
  }
  @keyframes dsSatReveal {
    0% {
      opacity: 0.88;
      transform: scale3d(0.996, 0.996, 1);
    }
    100% {
      opacity: 1;
      transform: scale3d(1, 1, 1);
    }
  }
  @keyframes dsDoneBurst {
    0% {
      transform: scale3d(0.75, 0.75, 1);
      opacity: 0.92;
    }
    100% {
      transform: scale3d(1.72, 1.72, 1);
      opacity: 0;
    }
  }
  .ds-sat-gyro {
    perspective: 240px;
    transform-style: preserve-3d;
  }
  .ds-sat-ring {
    border: 2.2px solid transparent;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transition:
      transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.2s ease;
  }
  .ds-sat-ring-1 {
    border-top-color: #10b981;
    border-right-color: rgba(16, 185, 129, 0.38);
    animation: dsGyroOrbit1 1.05s linear infinite;
  }
  .ds-sat-ring-2 {
    border-bottom-color: #6366f1;
    border-left-color: rgba(99, 102, 241, 0.38);
    animation: dsGyroOrbit2 1.25s linear infinite;
  }
  .ds-sat-ring-3 {
    border-top-color: #06b6d4;
    border-left-color: rgba(6, 182, 212, 0.38);
    animation: dsGyroOrbit3 1.45s linear infinite;
  }
  .ds-sat-blob {
    border-radius: 42% 58% 62% 38% / 45% 55% 45% 55%;
    background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #6366f1 100%);
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.55);
    will-change: transform, opacity;
    animation: dsLiquidBlob 1.5s linear infinite;
    transition: opacity 0.16s ease;
  }
  .ds-sat-ripple {
    animation: dsSatRipple 1.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }
  .ds-sat-bar {
    will-change: transform, opacity;
    animation: dsSineBar 0.7s ease-in-out infinite;
  }
  .ds-sat-topbar {
    animation: dsSatTopbar 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* COMPLETED STATE ("done" & "exiting") — 100% GPU Transform & Opacity */
  :global(#dsPreviewLoader[data-state='done']),
  :global(#dsPreviewLoader[data-state='exiting']) {
    background-color: transparent;
  }
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-topbar),
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-topbar) {
    animation: none;
    transform: translate3d(0, 0, 0) scaleX(1);
    transition: transform 0.18s ease, opacity 0.2s ease;
  }
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-ring),
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-ring),
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-blob),
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-blob),
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-ripple),
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-ripple) {
    opacity: 0;
    animation: none;
  }
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-done-orb),
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-done-orb) {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-done-burst) {
    animation: dsDoneBurst 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-bars),
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-bars) {
    opacity: 0;
    transform: translate3d(0, -3px, 0) scale3d(0.85, 0.85, 1);
  }
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-done-text),
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-done-text) {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
  :global(#dsPreviewLoader[data-state='done'] .ds-sat-pod) {
    transform: scale3d(1.03, 1.03, 1);
  }
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-pod) {
    opacity: 0;
    transform: scale3d(0.88, 0.88, 1) translate3d(0, 4px, 0);
  }
  :global(#dsPreviewLoader[data-state='exiting'] .ds-sat-toptrack) {
    opacity: 0;
  }
  :global(#dsPreviewWrap.is-generating #dsPreview) {
    opacity: 0.88;
  }
  :global(#dsPreview.is-revealing) {
    animation: dsSatReveal 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes dsAnts {
    to {
      stroke-dashoffset: -8;
    }
  }
  :global(#dsSelPathB) {
    animation: dsAnts 0.5s linear infinite;
  }
  :global(#dsPreviewWrap.is-eraser-active #dsPreview) {
    transition: none;
  }
  :global(#img-pane-scan .ds-btn-slider:focus),
  :global(#img-pane-scan .ds-btn-slider:focus-visible),
  :global(#dsEraserBar input:focus),
  :global(#dsEraserBar input:focus-visible),
  :global(#dsEraserBar button:focus),
  :global(#dsEraserBar button:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
  }
</style>
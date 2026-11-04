<script lang="ts">
  import Icon from './ui/Icon.svelte';
  import { I18N } from './scanner/i18n.js';

  interface Props {
    active?: boolean;
  }

  let { active = false }: Props = $props();
  const t = I18N.en;

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
    'inline-flex items-center justify-center gap-1 min-h-[25px] px-2 py-0.5 rounded-md border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-800 dark:text-studio-text text-[11px] font-semibold leading-none whitespace-nowrap cursor-pointer transition-colors duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-300 dark:hover:enabled:border-slate-600 hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 min-h-[28px] px-3 py-1 rounded-lg border border-emerald-600 dark:border-emerald-500 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 text-[11px] font-bold leading-none whitespace-nowrap cursor-pointer shadow-2xs transition-colors duration-100 hover:enabled:bg-emerald-700 dark:hover:enabled:bg-emerald-400 hover:enabled:border-emerald-700 dark:hover:enabled:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnPrimarySoft =
    'inline-flex items-center justify-center gap-1 min-h-[25px] px-2 py-0.5 rounded-md border border-emerald-500/35 dark:border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold leading-none whitespace-nowrap cursor-pointer transition-colors duration-100 hover:enabled:bg-emerald-500/20 dark:hover:enabled:bg-emerald-500/25 hover:enabled:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
  const btnIcon =
    'inline-flex items-center justify-center w-7 h-7 min-w-[28px] min-h-[28px] p-0 rounded-md border border-transparent bg-transparent text-slate-700 dark:text-studio-text cursor-pointer transition-all duration-100 hover:enabled:bg-slate-100 dark:hover:enabled:bg-studio-surface hover:enabled:border-slate-200/80 dark:hover:enabled:border-studio-border hover:enabled:text-slate-950 dark:hover:enabled:text-white disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500';
</script>

<section
  class="img-pane th-nid-studio ds group/ds relative w-full text-slate-900 dark:text-studio-text antialiased select-none [&_[hidden]]:!hidden data-[has-pages=true]:lg:fixed data-[has-pages=true]:lg:inset-x-0 data-[has-pages=true]:lg:top-12 data-[has-pages=true]:lg:bottom-0 data-[has-pages=true]:lg:z-40 data-[has-pages=true]:lg:w-screen data-[has-pages=true]:lg:h-[calc(100dvh-3rem)] data-[has-pages=true]:h-[calc(100dvh-3rem)] data-[has-pages=true]:max-lg:h-auto data-[has-pages=true]:max-lg:min-h-[calc(100dvh-3.5rem)] data-[has-pages=true]:flex-1 data-[has-pages=true]:min-h-0 data-[has-pages=true]:flex data-[has-pages=true]:flex-col data-[has-pages=true]:overflow-hidden data-[has-pages=true]:bg-slate-100 dark:data-[has-pages=true]:bg-studio-bg"
  id="img-pane-scan"
  hidden={!active}
  aria-label={t.brandSub}
  data-view="split"
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
    class="fixed z-[160] pointer-events-none px-2.5 py-1 rounded-md bg-slate-900/95 dark:bg-slate-800 text-white text-[11px] font-semibold leading-tight shadow-lg border border-white/15 whitespace-nowrap transition-opacity duration-75"
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
    class="ds-body flex-1 min-h-0 grid grid-cols-[188px_minmax(0,1fr)_324px] group-data-[sidebar-collapsed=true]/ds:grid-cols-[0px_minmax(0,1fr)_324px] max-xl:grid-cols-[172px_minmax(0,1fr)_304px] max-xl:group-data-[sidebar-collapsed=true]/ds:grid-cols-[0px_minmax(0,1fr)_304px] max-lg:grid-cols-1 max-lg:group-data-[sidebar-collapsed=true]/ds:grid-cols-1 group-data-[has-pages=false]/ds:!grid-cols-1 overflow-hidden"
  >
    <!-- LEFT PANEL: NATIVE PAGE FILMSTRIP -->
    <aside
      class="ds-pages group-data-[has-pages=false]/ds:!hidden bg-white dark:bg-studio-sidebar border-r border-slate-200 dark:border-studio-border flex flex-col min-h-0 overflow-hidden group-data-[sidebar-collapsed=true]/ds:lg:opacity-0 group-data-[sidebar-collapsed=true]/ds:lg:pointer-events-none group-data-[sidebar-collapsed=true]/ds:lg:border-r-0 max-lg:fixed max-lg:top-12 max-lg:left-0 max-lg:bottom-0 max-lg:w-[min(260px,86vw)] max-lg:z-90 max-lg:shadow-2xl max-lg:-translate-x-[104%] max-lg:group-data-[drawer=pages]/ds:translate-x-0 max-lg:transition-transform max-lg:duration-200"
      id="dsPagesSidebar"
      aria-label={t.pagesTitle}
    >
      <div
        class="ds-panel-head sticky top-0 z-20 min-h-[34px] px-2.5 py-1 flex items-center justify-between gap-1.5 border-b border-slate-200 dark:border-studio-border bg-slate-50/90 dark:bg-studio-sidebar shrink-0"
      >
        <strong class="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-studio-text">
          <Icon name="lucide:files" class="w-3.5 h-3.5 text-emerald-600 dark:text-studio-primary shrink-0" />
          <span data-i18n="pagesTitle">{t.pagesTitle}</span>
          <span
            id="dsCount"
            class="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold tabular-nums"
            >0</span
          >
        </strong>
        <div class="ds-panel-head-actions inline-flex items-center gap-1">
          <span class="ds-muted text-slate-400 dark:text-studio-muted text-[10px] font-medium" data-i18n="dragHint">{t.dragHint}</span>
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

      <div
        class="ds-page-list flex-1 min-h-0 overflow-y-auto p-1.5 flex flex-col gap-1 [scrollbar-width:thin] empty:grid empty:place-items-center empty:text-center empty:px-2.5 empty:before:content-['No_pages_yet_·_Click_+_below_to_add_scans'] group-data-[lang=bn]/ds:empty:before:content-['কোনো_পেজ_নেই_·_নিচে_+_বাটনে_ক্লিক_করে_ছবি_যোগ_করুন'] empty:before:text-[10px] empty:before:leading-relaxed empty:before:text-slate-400 dark:empty:before:text-slate-500"
        id="dsPageList"
        aria-label={t.pagesTitle}
      ></div>

      <div
        class="ds-page-footer p-1.5 border-t border-slate-200 dark:border-studio-border grid gap-1 bg-slate-50/80 dark:bg-studio-sidebar shrink-0"
      >
        <div class="grid grid-cols-[1fr_auto] gap-1">
          <button
            type="button"
            class="ds-add-more w-full inline-flex items-center justify-center gap-1 min-h-[26px] px-2 py-0.5 rounded-md border border-emerald-600/35 dark:border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors"
            data-ds="add"
          >
            <Icon name="lucide:plus" class="w-3 h-3 shrink-0" />
            <span data-i18n="addMoreBtn">{t.addMoreBtn}</span>
          </button>
          <button
            type="button"
            class="{btnBase} min-h-[26px] px-2 rounded-md"
            data-ds="camera"
            data-i18n-title="cameraTip"
            title={t.cameraTip}
            aria-label={t.cameraBtn}
          >
            <Icon name="lucide:camera" class="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
        <small class="text-center text-[9px] text-slate-400 dark:text-studio-muted truncate" data-i18n="addMoreSub">{t.addMoreSub}</small>
      </div>
    </aside>

    <!-- CENTER PANEL: NATIVE STUDIO COMMAND BAR & DUAL/SINGLE CANVAS -->
    <div class="ds-main min-w-0 min-h-0 flex flex-col bg-slate-100 dark:bg-studio-bg group-data-[has-pages=false]/ds:bg-transparent overflow-hidden">
      <!-- STICKY COMPACT NATIVE DESKTOP ICON RIBBON (HOVER FOR TOOLTIP NAME) -->
      <div
        class="ds-toolbar group-data-[has-pages=false]/ds:!hidden sticky top-0 z-30 min-h-[38px] px-3 py-1 border-b border-slate-200 dark:border-studio-border bg-white/98 dark:bg-studio-sidebar/98 backdrop-blur-xs flex items-center gap-1 flex-wrap shrink-0"
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
            <Icon name="lucide:panel-left" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span class="sr-only" data-i18n="pagesTitle">{t.pagesTitle}</span>
          </button>
          <button
            type="button"
            data-ds="add"
            class="{btnIcon} bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:enabled:bg-emerald-500/20"
            data-i18n-title="addPageTip"
            title={t.addPageTip}
          >
            <Icon name="lucide:plus" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span class="sr-only" data-i18n="addPageBtn">{t.addPageBtn}</span>
          </button>
          <button type="button" data-ds="camera" class={btnIcon} data-i18n-title="cameraTip" title={t.cameraTip}>
            <Icon name="lucide:camera" class="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span class="sr-only" data-i18n="cameraBtn">{t.cameraBtn}</span>
          </button>
          <button type="button" data-ds="reset" class={btnIcon} data-i18n-title="newScanTip" title={t.newScanTip}>
            <Icon name="lucide:file-plus-2" class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span class="sr-only" data-i18n="newScanBtn">{t.newScanBtn}</span>
          </button>
        </div>

        <span class="w-px h-4 bg-slate-200 dark:bg-studio-border mx-1 shrink-0" aria-hidden="true"></span>

        <!-- Group 2: Undo & Redo -->
        <div class="ds-toolbar-group inline-flex items-center gap-1" role="group" aria-label="History">
          <button type="button" data-ds="undo" class={btnIcon} disabled data-i18n-title="undoTip" title={t.undoTip}>
            <Icon name="lucide:undo-2" class="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
            <span class="sr-only" data-i18n="undoBtn">{t.undoBtn}</span>
          </button>
          <button type="button" data-ds="redo" class={btnIcon} disabled data-i18n-title="redoTip" title={t.redoTip}>
            <Icon name="lucide:redo-2" class="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
            <span class="sr-only" data-i18n="redoBtn">{t.redoBtn}</span>
          </button>
        </div>

        <span class="w-px h-4 bg-slate-200 dark:bg-studio-border mx-1 shrink-0" aria-hidden="true"></span>

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
            <Icon name="lucide:scan-line" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span class="sr-only" data-i18n="autoDetectBtn">{t.autoDetectBtn}</span>
          </button>
          <button type="button" data-ds="full" class={btnIcon} disabled data-i18n-title="fullImageTip" title={t.fullImageTip}>
            <Icon name="lucide:maximize-2" class="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span class="sr-only" data-i18n="fullImageBtn">{t.fullImageBtn}</span>
          </button>
          <button type="button" data-ds="left" class={btnIcon} disabled data-i18n-title="rotateLeftTip" title={t.rotateLeftTip}>
            <Icon name="lucide:rotate-ccw" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span class="sr-only" data-i18n="rotateLeftBtn">{t.rotateLeftBtn}</span>
          </button>
          <button type="button" data-ds="right" class={btnIcon} disabled data-i18n-title="rotateRightTip" title={t.rotateRightTip}>
            <Icon name="lucide:rotate-cw" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span class="sr-only" data-i18n="rotateRightBtn">{t.rotateRightBtn}</span>
          </button>
          <button type="button" data-ds="reset-crop" class={btnIcon} disabled data-i18n-title="resetCropTip" title={t.resetCropTip}>
            <Icon name="lucide:history" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span class="sr-only" data-i18n="resetCropBtn">{t.resetCropBtn}</span>
          </button>
        </div>

        <span class="w-px h-4 bg-slate-200 dark:bg-studio-border mx-1 shrink-0" aria-hidden="true"></span>

        <!-- Group 4: Retouch & Border Trim -->
        <div class="ds-toolbar-group inline-flex items-center gap-1" role="group" aria-label="Retouch & Cleanup">
          <button
            type="button"
            data-ds="toggle-eraser"
            id="dsToolbarEraser"
            class="{btnIcon} aria-pressed:bg-emerald-600 dark:aria-pressed:bg-emerald-500 aria-pressed:text-white dark:aria-pressed:text-slate-950 aria-pressed:[&_svg]:!text-white"
            disabled
            aria-pressed="false"
            data-i18n-title="retouchTip"
            title={t.retouchTip}
          >
            <Icon name="lucide:wand-2" class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <span class="sr-only" data-i18n="retouchShortBtn">{t.retouchShortBtn}</span>
          </button>
          <button
            type="button"
            data-ds="erase-borders"
            class={btnIcon}
            disabled
            data-i18n-title="borderTrimBtn"
            title={t.borderTrimBtn}
          >
            <Icon name="lucide:scan" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span class="sr-only" data-i18n="borderTrimBtn">{t.borderTrimBtn}</span>
          </button>
        </div>

        <!-- Group 5: View Switcher (Icon-Only with Hover Tooltip) -->
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
              class="inline-flex items-center justify-center w-7 h-6.5 rounded-md border-0 bg-transparent text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:crop" class="w-3.5 h-3.5 shrink-0" />
              <span class="sr-only" data-i18n="viewCrop">{t.viewCrop}</span>
            </button>
            <button
              type="button"
              data-ds-view="split"
              aria-pressed="true"
              data-i18n-title="viewSplit"
              title={t.viewSplit}
              class="inline-flex items-center justify-center w-7 h-6.5 rounded-md border-0 bg-transparent text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:columns-2" class="w-3.5 h-3.5 shrink-0" />
              <span class="sr-only" data-i18n="viewSplit">{t.viewSplit}</span>
            </button>
            <button
              type="button"
              data-ds-view="preview"
              aria-pressed="false"
              data-i18n-title="viewPreview"
              title={t.viewPreview}
              class="inline-flex items-center justify-center w-7 h-6.5 rounded-md border-0 bg-transparent text-slate-600 dark:text-studio-muted cursor-pointer hover:text-slate-900 dark:hover:text-white aria-pressed:bg-white dark:aria-pressed:bg-studio-surface aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400 aria-pressed:shadow-2xs transition-colors"
            >
              <Icon name="lucide:eye" class="w-3.5 h-3.5 shrink-0" />
              <span class="sr-only" data-i18n="viewPreview">{t.viewPreview}</span>
            </button>
          </div>
          <button
            type="button"
            data-ds="toggle-inspector"
            class="ds-inspector-toggle hidden max-lg:inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel cursor-pointer"
            data-i18n-title="inspectorTitle"
            title={t.inspectorTitle}
          >
            <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
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
        class="ds-workspace flex-1 min-h-0 grid grid-cols-2 group-data-[view=crop]/ds:grid-cols-1 group-data-[view=preview]/ds:grid-cols-1 max-lg:grid-cols-1 max-lg:min-h-[480px] gap-1.5 p-1.5 overflow-hidden"
        id="dsWorkspace"
        hidden
      >
        <!-- CROP & PERSPECTIVE STAGE -->
        <section
          class="ds-crop-panel group-data-[view=preview]/ds:hidden min-w-0 min-h-0 flex flex-col rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar overflow-hidden shadow-2xs"
          aria-label={t.cropCaption}
        >
          <div
            class="ds-canvas-caption min-h-[28px] px-2.5 py-0.5 border-b border-slate-200 dark:border-studio-border flex items-center justify-between gap-2 text-[11px] font-bold text-slate-800 dark:text-studio-text bg-slate-50/90 dark:bg-studio-panel shrink-0"
          >
            <span class="inline-flex items-center gap-1.5 min-w-0">
              <i class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></i>
              <em class="not-italic truncate" data-i18n="cropCaption">{t.cropCaption}</em>
            </span>
            <div class="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-ds="detect"
                class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/20"
                data-i18n-title="autoDetectTip"
                title={t.autoDetectTip}
              >
                <Icon name="lucide:scan-line" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span class="sr-only" data-i18n="autoDetectBtn">{t.autoDetectBtn}</span>
              </button>
              <button
                type="button"
                data-ds="full"
                class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white dark:bg-studio-surface text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-slate-100"
                data-i18n-title="fullImageTip"
                title={t.fullImageTip}
              >
                <Icon name="lucide:maximize-2" class="w-3.5 h-3.5 shrink-0" />
                <span class="sr-only" data-i18n="fullImageBtn">{t.fullImageBtn}</span>
              </button>
              <button
                type="button"
                data-ds="reset-crop"
                class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white dark:bg-studio-surface text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-slate-100"
                data-i18n-title="resetCropTip"
                title={t.resetCropTip}
              >
                <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5 shrink-0" />
                <span class="sr-only" data-i18n="resetCropBtn">{t.resetCropBtn}</span>
              </button>
              <small class="sr-only" data-i18n="cropSubCaption">{t.cropSubCaption}</small>
            </div>
          </div>
          <div
            class="ds-viewport relative flex-1 min-h-0 overflow-hidden bg-slate-200/90 dark:bg-[#070c18] bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.05),transparent_65%),repeating-linear-gradient(0deg,rgba(148,163,184,0.08)_0_1px,transparent_1px_24px),repeating-linear-gradient(90deg,rgba(148,163,184,0.08)_0_1px,transparent_1px_24px)] touch-none cursor-grab [&.is-panning]:cursor-grabbing focus-visible:outline-2 focus-visible:outline-emerald-500"
            id="dsViewport"
            tabindex="0"
            aria-label={t.cropCaption}
          >
            <div class="ds-image-plane absolute left-1/2 top-1/2 origin-top-left select-none shadow-[0_16px_40px_rgba(15,23,42,0.28)]" id="dsPlane">
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
          class="ds-preview-panel group-data-[view=crop]/ds:hidden min-w-0 min-h-0 flex flex-col rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar overflow-hidden shadow-2xs"
          aria-label={t.previewCaption}
        >
          <div
            class="ds-canvas-caption min-h-[28px] px-2.5 py-0.5 border-b border-slate-200 dark:border-studio-border flex items-center justify-between gap-2 text-[11px] font-bold text-slate-800 dark:text-studio-text bg-slate-50/90 dark:bg-studio-panel shrink-0"
          >
            <span class="inline-flex items-center gap-1.5 min-w-0">
              <i class="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block shrink-0"></i>
              <em class="not-italic truncate" data-i18n="previewCaption">{t.previewCaption}</em>
            </span>
            <div class="ds-preview-caption-actions inline-flex items-center gap-1.5 shrink-0">
              <small id="dsPreviewMeta" class="text-slate-500 dark:text-studio-muted font-medium text-[10px] tabular-nums truncate">—</small>
              <button
                type="button"
                id="dsEraserToggle"
                class="ds-caption-btn inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-studio-surface border border-slate-200 dark:border-studio-border text-violet-600 dark:text-violet-400 cursor-pointer aria-pressed:bg-emerald-600 dark:aria-pressed:bg-emerald-500 aria-pressed:border-emerald-600 dark:aria-pressed:border-emerald-500 aria-pressed:text-white dark:aria-pressed:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed"
                data-ds="toggle-eraser"
                aria-pressed="false"
                data-i18n-title="retouchTip"
                title={t.retouchTip}
              >
                <Icon name="lucide:wand-2" class="w-3.5 h-3.5 shrink-0" />
                <span class="sr-only" data-i18n="retouchShortBtn">{t.retouchShortBtn}</span>
              </button>
            </div>
          </div>

          <!-- ULTRA-COMPACT 1-LINE PHOTOSHOP OPTIONS BAR (CLICK TO OPEN SLIDER POPOVERS) -->
          <div
            class="ds-eraser-bar relative z-30 min-h-[30px] px-2 py-0.5 bg-slate-50 dark:bg-studio-panel border-b border-slate-200 dark:border-studio-border flex items-center gap-1 flex-wrap shrink-0"
            id="dsEraserBar"
            hidden
          >
            <!-- Active Tool Pill (Icon-Only, Hover for Tool Name) -->
            <span
              class="ds-eraser-title inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/25 shrink-0"
              id="dsPsActiveToolLabel"
              title={t.tools.brush}
            >
              <Icon name="lucide:paintbrush" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <b class="sr-only">{t.tools.brush}</b>
            </span>

            <!-- Compact Swatch & Eyedropper Group -->
            <div
              class="ds-ps-color-group inline-flex items-center gap-0.5 py-0.5 px-1 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shrink-0"
              role="group"
              aria-label="Background Color & Picker"
            >
              <label
                class="ds-ps-color-swatch-wrap relative inline-flex items-center gap-1 px-1 py-0 rounded cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-studio-surface"
                title="Background Color"
              >
                <input
                  type="color"
                  id="dsEraserColor"
                  value="#ffffff"
                  aria-label="Background Color"
                  class="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-0 p-0"
                />
                <span
                  class="ds-ps-color-chip w-3.5 h-3.5 rounded-xs border border-slate-300 dark:border-slate-600 shadow-2xs shrink-0"
                  id="dsEraserColorChip"
                  style="background:#ffffff"
                ></span>
                <code id="dsEraserHex" class="sr-only">#FFFFFF</code>
              </label>
              <button
                type="button"
                data-ds-tool="picker"
                class="{btnIcon} !w-6 !h-6 !min-w-[24px] !min-h-[24px] [&.is-active]:bg-emerald-600 [&.is-active]:text-white"
                data-i18n-title="pickerBtn"
                title={t.pickerBtn}
              >
                <Icon name="lucide:pipette" class="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
                <span class="sr-only" data-i18n="pickerBtn">{t.pickerBtn}</span>
              </button>
              <button
                type="button"
                data-ds="auto-paper-color"
                class="{btnIcon} !w-6 !h-6 !min-w-[24px] !min-h-[24px]"
                data-i18n-title="autoPaperBtn"
                title={t.autoPaperBtn}
              >
                <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span class="sr-only" data-i18n="autoPaperBtn">{t.autoPaperBtn}</span>
              </button>
              <div class="ds-ps-swatches inline-flex items-center gap-0.5 pl-1 border-l border-slate-200 dark:border-studio-border" role="group" aria-label="Quick Color Swatches">
                <button
                  type="button"
                  data-ds-swatch="#ffffff"
                  class="ds-ps-swatch is-active w-3.5 h-3.5 p-0 rounded-xs border border-slate-300 dark:border-slate-600 cursor-pointer bg-[#ffffff] [&.is-active]:outline-1 [&.is-active]:outline-emerald-500"
                  title="#FFFFFF"
                  aria-label="White"
                ></button>
                <button
                  type="button"
                  data-ds-swatch="#faf6ed"
                  class="ds-ps-swatch w-3.5 h-3.5 p-0 rounded-xs border border-slate-300 dark:border-slate-600 cursor-pointer bg-[#faf6ed] [&.is-active]:outline-1 [&.is-active]:outline-emerald-500"
                  title="#FAF6ED"
                  aria-label="Cream"
                ></button>
                <button
                  type="button"
                  data-ds-swatch="#f1f5f9"
                  class="ds-ps-swatch w-3.5 h-3.5 p-0 rounded-xs border border-slate-300 dark:border-slate-600 cursor-pointer bg-[#f1f5f9] [&.is-active]:outline-1 [&.is-active]:outline-emerald-500"
                  title="#F1F5F9"
                  aria-label="Soft Slate"
                ></button>
              </div>
            </div>

            <!-- PHOTOSHOP CLICK-TO-OPEN SLIDER POPOVER TRIGGERS (Brush Size & Hardness) -->
            <div class="ds-ps-sliders inline-flex items-center gap-1" id="dsPsBrushOpts">
              <!-- Size Popover Trigger -->
              <div class="relative" data-ds-pop-wrap>
                <button
                  type="button"
                  data-ds-pop-btn="size"
                  class="inline-flex items-center gap-1 min-h-[22px] px-1.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-[10px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500/50 aria-expanded:border-emerald-500 aria-expanded:bg-emerald-500/10"
                  aria-expanded="false"
                  title="Click to adjust Brush Size ([ and ])"
                >
                  <span data-i18n="sizeLbl">{t.sizeLbl}</span>
                  <output id="dsBrushSizeVal" class="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">24px</output>
                  <Icon name="lucide:chevron-down" class="w-2.5 h-2.5 opacity-65" />
                </button>
                <div
                  data-ds-pop-panel="size"
                  hidden
                  class="absolute left-0 top-[calc(100%+4px)] w-44 p-2 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xl z-50 grid gap-1.5"
                >
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-studio-text">
                    <span data-i18n="sizeLbl">{t.sizeLbl}</span>
                    <span class="inline-flex items-center gap-1">
                      <span class="text-slate-400 font-mono text-[9px]">[ / ]</span>
                      <button type="button" data-ds-reset-retouch="size" class="w-4 h-4 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-studio-surface text-amber-600 dark:text-amber-400 cursor-pointer" data-i18n-title="resetToolTip" title={t.resetToolTip}>
                        <Icon name="lucide:rotate-ccw" class="w-2.5 h-2.5" />
                      </button>
                    </span>
                  </div>
                  <input type="range" id="dsBrushSize" min="2" max="120" value="24" class="w-full cursor-pointer" />
                </div>
              </div>

              <!-- Hardness Popover Trigger -->
              <div class="relative" data-ds-pop-wrap>
                <button
                  type="button"
                  data-ds-pop-btn="hardness"
                  class="inline-flex items-center gap-1 min-h-[22px] px-1.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-[10px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500/50 aria-expanded:border-emerald-500 aria-expanded:bg-emerald-500/10"
                  aria-expanded="false"
                  title="Click to adjust Brush Hardness"
                >
                  <span data-i18n="hardnessLbl">{t.hardnessLbl}</span>
                  <output id="dsBrushHardnessVal" class="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">80%</output>
                  <Icon name="lucide:chevron-down" class="w-2.5 h-2.5 opacity-65" />
                </button>
                <div
                  data-ds-pop-panel="hardness"
                  hidden
                  class="absolute left-0 top-[calc(100%+4px)] w-44 p-2 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xl z-50 grid gap-1.5"
                >
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-studio-text">
                    <span data-i18n="hardnessLbl">{t.hardnessLbl}</span>
                    <button type="button" data-ds-reset-retouch="hardness" class="w-4 h-4 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-studio-surface text-amber-600 dark:text-amber-400 cursor-pointer" data-i18n-title="resetToolTip" title={t.resetToolTip}>
                      <Icon name="lucide:rotate-ccw" class="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <input type="range" id="dsBrushHardness" min="0" max="100" value="80" class="w-full cursor-pointer" />
                </div>
              </div>
            </div>

            <!-- Magic Wand Tolerance Popover Trigger -->
            <div class="ds-ps-sliders inline-flex items-center gap-1" id="dsPsWandOpts" hidden>
              <div class="relative" data-ds-pop-wrap>
                <button
                  type="button"
                  data-ds-pop-btn="tolerance"
                  class="inline-flex items-center gap-1 min-h-[22px] px-1.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-[10px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500/50 aria-expanded:border-emerald-500 aria-expanded:bg-emerald-500/10"
                  aria-expanded="false"
                  title="Click to adjust Magic Eraser Tolerance"
                >
                  <span data-i18n="toleranceLbl">{t.toleranceLbl}</span>
                  <output id="dsWandToleranceVal" class="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">28</output>
                  <Icon name="lucide:chevron-down" class="w-2.5 h-2.5 opacity-65" />
                </button>
                <div
                  data-ds-pop-panel="tolerance"
                  hidden
                  class="absolute left-0 top-[calc(100%+4px)] w-44 p-2 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xl z-50 grid gap-1.5"
                >
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-studio-text">
                    <span data-i18n="toleranceLbl">{t.toleranceLbl}</span>
                    <button type="button" data-ds-reset-retouch="tolerance" class="w-4 h-4 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-studio-surface text-amber-600 dark:text-amber-400 cursor-pointer" data-i18n-title="resetToolTip" title={t.resetToolTip}>
                      <Icon name="lucide:rotate-ccw" class="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <input type="range" id="dsWandTolerance" min="5" max="85" value="28" class="w-full cursor-pointer" />
                </div>
              </div>
            </div>

            <!-- Opacity Popover Trigger -->
            <div class="ds-ps-sliders inline-flex items-center gap-1">
              <div class="relative" data-ds-pop-wrap>
                <button
                  type="button"
                  data-ds-pop-btn="opacity"
                  class="inline-flex items-center gap-1 min-h-[22px] px-1.5 py-0.5 rounded bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-[10px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500/50 aria-expanded:border-emerald-500 aria-expanded:bg-emerald-500/10"
                  aria-expanded="false"
                  title="Click to adjust Stroke Opacity"
                >
                  <span data-i18n="opacityLbl">{t.opacityLbl}</span>
                  <output id="dsBrushOpacityVal" class="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">100%</output>
                  <Icon name="lucide:chevron-down" class="w-2.5 h-2.5 opacity-65" />
                </button>
                <div
                  data-ds-pop-panel="opacity"
                  hidden
                  class="absolute left-0 top-[calc(100%+4px)] w-44 p-2 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xl z-50 grid gap-1.5"
                >
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-studio-text">
                    <span data-i18n="opacityLbl">{t.opacityLbl}</span>
                    <button type="button" data-ds-reset-retouch="opacity" class="w-4 h-4 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-studio-surface text-amber-600 dark:text-amber-400 cursor-pointer" data-i18n-title="resetToolTip" title={t.resetToolTip}>
                      <Icon name="lucide:rotate-ccw" class="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <input type="range" id="dsBrushOpacity" min="10" max="100" value="100" class="w-full cursor-pointer" />
                </div>
              </div>
            </div>

            <!-- Quick Retouch Actions (Icon-Only with Hover Tooltip) -->
            <div class="inline-flex items-center gap-0.5 ml-auto">
              <button type="button" data-ds="reset-retouch-params" class="{btnIcon} !w-6 !h-6 !min-w-[24px] !min-h-[24px]" data-i18n-title="resetRetouchParamsTip" title={t.resetRetouchParamsTip}>
                <Icon name="lucide:history" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span class="sr-only" data-i18n="resetRetouchParamsTip">{t.resetRetouchParamsTip}</span>
              </button>
              <button type="button" data-ds="erase-borders" class="{btnIcon} !w-6 !h-6 !min-w-[24px] !min-h-[24px]" data-i18n-title="borderTrimBtn" title={t.borderTrimBtn}>
                <Icon name="lucide:scan" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span class="sr-only" data-i18n="borderTrimBtn">{t.borderTrimBtn}</span>
              </button>
              <button type="button" data-ds="undo-erase" class="{btnIcon} !w-6 !h-6 !min-w-[24px] !min-h-[24px]" data-i18n-title="undoTip" title={t.undoTip}>
                <Icon name="lucide:undo-2" class="w-3.5 h-3.5 shrink-0" />
                <span class="sr-only" data-i18n="undoBtn">{t.undoBtn}</span>
              </button>
              <button type="button" data-ds="clear-erases" class="{btnIcon} !w-6 !h-6 !min-w-[24px] !min-h-[24px]" data-i18n-title="resetAllRetouchBtn" title={t.resetAllRetouchBtn}>
                <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span class="sr-only" data-i18n="resetAllRetouchBtn">{t.resetAllRetouchBtn}</span>
              </button>
              <button
                type="button"
                data-ds="close-eraser"
                class="ds-eraser-close inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-600 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-500 text-white dark:text-slate-950 text-[11px] font-bold cursor-pointer"
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

          <div
            class="ds-preview-stage flex-1 min-h-0 flex items-center justify-center overflow-hidden relative p-3 pl-11 bg-slate-200/90 dark:bg-[#070c18] [container-type:size] bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.05),transparent_65%),repeating-linear-gradient(0deg,rgba(148,163,184,0.08)_0_1px,transparent_1px_24px),repeating-linear-gradient(90deg,rgba(148,163,184,0.08)_0_1px,transparent_1px_24px)]"
            id="dsPreviewStage"
          >
            <!-- ULTRA-COMPACT PHOTOSHOP ICON DOCK -->
            <aside
              class="ds-ps-dock absolute left-1.5 top-2 w-8 rounded-lg bg-white/95 dark:bg-studio-panel/95 border border-slate-200/90 dark:border-studio-border p-1 flex flex-col items-center gap-0.5 z-15 shrink-0 select-none shadow-md backdrop-blur-xs"
              id="dsPsDock"
              aria-label="Photoshop Retouch Dock"
            >
              {#each [
                { id: 'brush', icon: 'lucide:paintbrush', color: 'text-emerald-600 dark:text-emerald-400', title: `${t.tools.brush} (B)`, label: t.dockLabels.brush },
                { id: 'heal', icon: 'lucide:bandage', color: 'text-amber-500 dark:text-amber-400', title: `${t.tools.heal} (J)`, label: t.dockLabels.heal },
                { id: 'wand', icon: 'lucide:wand', color: 'text-violet-600 dark:text-violet-400', title: `${t.tools.wand} (W)`, label: t.dockLabels.wand },
                { id: 'rect', icon: 'lucide:square-dashed', color: 'text-blue-600 dark:text-blue-400', title: `${t.tools.rect} (M)`, label: t.dockLabels.rect },
                { id: 'picker', icon: 'lucide:pipette', color: 'text-fuchsia-600 dark:text-fuchsia-400', title: `${t.tools.picker} (I)`, label: t.dockLabels.picker },
                { id: 'hand', icon: 'lucide:hand', color: 'text-cyan-600 dark:text-cyan-400', title: `${t.tools.hand} (H)`, label: t.dockLabels.hand }
              ] as tool}
                <button
                  type="button"
                  data-ds-tool={tool.id}
                  class="ds-ps-tool w-6.5 h-6.5 min-w-[26px] min-h-[26px] p-0 rounded-md border border-transparent bg-transparent text-slate-600 dark:text-studio-muted flex items-center justify-center cursor-pointer hover:bg-slate-200/70 dark:hover:bg-studio-surface hover:text-slate-900 dark:hover:text-white aria-pressed:bg-emerald-500/15 aria-pressed:border-emerald-500 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
                  aria-pressed="false"
                  title={tool.title}
                >
                  <Icon name={tool.icon} class="w-3.5 h-3.5 {tool.color} shrink-0" />
                  <span class="sr-only" data-i18n-dock={tool.id}>{tool.label}</span>
                </button>
              {/each}
              <span class="ds-ps-dock-sep w-5 h-px bg-slate-200 dark:bg-studio-border my-0.5"></span>
              <div class="ds-ps-dock-swatch-box relative w-6 h-6 my-0.5" title="Active Background Color">
                <button
                  type="button"
                  class="ds-ps-dock-swatch w-5 h-5 p-0 rounded border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer"
                  id="dsDockSwatch"
                  style="background:#ffffff"
                  data-ds="open-color-picker"
                  aria-label="Open Color Picker"
                ></button>
                <button
                  type="button"
                  class="ds-ps-dock-reset-white absolute right-0 bottom-0 w-2.5 h-2.5 p-0 rounded-xs bg-white border border-slate-400 cursor-pointer"
                  data-ds-swatch="#ffffff"
                  title="Reset White (#FFFFFF)"
                  aria-label="Reset White"
                ></button>
              </div>
              <span class="ds-ps-dock-sep w-5 h-px bg-slate-200 dark:bg-studio-border my-0.5"></span>
              <div class="ds-ps-dock-zoom flex flex-col items-center gap-0.5 w-full" role="group" aria-label="Preview Zoom">
                <button type="button" data-ds="pzoom-in" class="{btnBase} w-6.5 min-w-[26px] min-h-[18px] p-0 text-[10px] font-bold border-0 bg-transparent" title="Preview Zoom In">+</button>
                <button
                  type="button"
                  data-ds="pzoom-fit"
                  id="dsPreviewZoomLabel"
                  class="{btnBase} w-6.5 min-w-[26px] min-h-[18px] p-0 text-[8px] font-bold tabular-nums border-0 bg-transparent"
                  title="Reset Preview Zoom">100%</button
                >
                <button type="button" data-ds="pzoom-out" class="{btnBase} w-6.5 min-w-[26px] min-h-[18px] p-0 text-[10px] font-bold border-0 bg-transparent" title="Preview Zoom Out">−</button>
              </div>
            </aside>

            <div
              class="ds-preview-wrap relative inline-flex items-center justify-center origin-center select-none leading-none [&.is-eraser-active]:cursor-none [&.is-eraser-active[data-tool=picker]]:cursor-crosshair [&.is-eraser-active[data-tool=wand]]:cursor-crosshair [&.is-eraser-active[data-tool=rect]]:cursor-crosshair [&.is-eraser-active[data-tool=hand]]:cursor-grab [&.is-eraser-active.is-panning[data-tool=hand]]:cursor-grabbing"
              id="dsPreviewWrap"
            >
              <canvas
                id="dsPreview"
                aria-label={t.previewCaption}
                class="block w-auto h-auto max-w-[calc(100cqw-52px)] max-h-[calc(100cqh-24px)] object-contain rounded-xs bg-white shadow-[0_16px_40px_rgba(15,23,42,0.28)] select-none"
              ></canvas>
              <div
                id="dsRectSelection"
                class="ds-rect-selection absolute border-2 border-dashed border-emerald-500 bg-emerald-500/15 shadow-[0_0_0_1px_rgba(255,255,255,0.85)] pointer-events-none z-25"
                hidden
              ></div>
              <div
                id="dsEraserCursor"
                class="ds-eraser-cursor absolute w-6 h-6 rounded-full border-2 border-slate-900/90 shadow-[0_0_0_1.5px_rgba(255,255,255,0.95)] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 [background:radial-gradient(circle,var(--cursor-bg,rgba(255,255,255,0.35))_var(--cursor-hard,75%),transparent_100%)]"
                hidden
              ></div>
              <div
                id="dsPickerLoupe"
                class="ds-picker-loupe absolute inline-flex items-center gap-1.5 py-1 px-2 rounded-full bg-slate-900/95 border border-white/25 text-white text-[11px] font-bold pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+14px)] z-35 shadow-lg whitespace-nowrap"
                hidden
              >
                <span class="ds-picker-loupe-ring w-3.5 h-3.5 rounded-full border-2 border-white shrink-0" id="dsPickerLoupeSwatch"></span>
                <code id="dsPickerLoupeHex">#FFFFFF</code>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- BOTTOM WORKSPACE HUD & ZOOM BAR -->
      <footer
        class="ds-status group-data-[has-pages=false]/ds:!hidden min-h-[28px] px-2.5 py-0.5 border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar flex items-center justify-between gap-2 max-sm:flex-wrap text-[11px] text-slate-600 dark:text-studio-muted shrink-0"
      >
        <div class="ds-status-left inline-flex items-center gap-1.5">
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
              class="min-h-[18px] min-w-[20px] px-1 py-0 border-0 rounded bg-transparent text-[10px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >−</button
            >
            <span id="dsZoom" class="min-w-[36px] text-center font-bold text-[10px] text-slate-800 dark:text-studio-text tabular-nums">100%</span>
            <button
              type="button"
              data-ds="zoom-in"
              aria-label="Zoom In"
              title="Zoom In (Ctrl +)"
              class="min-h-[18px] min-w-[20px] px-1 py-0 border-0 rounded bg-transparent text-[10px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >+</button
            >
            <button
              type="button"
              data-ds="fit"
              title="Fit to Screen (Ctrl 0)"
              class="min-h-[18px] min-w-[22px] px-1 py-0 border-0 rounded bg-transparent text-[10px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >Fit</button
            >
            <button
              type="button"
              data-ds="actual"
              title="100% Actual Size (Ctrl 1)"
              class="min-h-[18px] min-w-[24px] px-1 py-0 border-0 rounded bg-transparent text-[10px] font-bold text-slate-700 dark:text-studio-text cursor-pointer hover:bg-white dark:hover:bg-studio-surface"
              >100%</button
            >
          </div>
          <span
            class="ds-page-pill px-2 py-0 rounded-full bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-[10px] font-bold text-slate-700 dark:text-studio-text tabular-nums"
            id="dsPageName">{t.pageWord} 1</span
          >
        </div>
        <span id="dsStatus" role="status" class="text-slate-800 dark:text-studio-text font-semibold text-[11px] truncate">{t.statusInitial}</span>
        <div class="ds-status-right inline-flex items-center gap-1.5">
          <button
            type="button"
            id="dsCompare"
            class="inline-flex items-center justify-center w-6 h-5 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-studio-surface disabled:opacity-40 disabled:cursor-not-allowed aria-pressed:bg-emerald-500/15 aria-pressed:border-emerald-500 aria-pressed:text-emerald-700 dark:aria-pressed:text-emerald-300"
            aria-pressed="false"
            disabled
            data-i18n-title="compareTip"
            title={t.compareTip}
          >
            <Icon name="lucide:split-square-horizontal" class="w-3.5 h-3.5 shrink-0" />
            <span class="sr-only" data-i18n="compareBtn">{t.compareBtn}</span>
          </button>
          <small class="ds-shortcuts text-[10px] text-slate-400 dark:text-slate-500 max-xl:hidden" data-i18n="shortcutsHint"
            >{t.shortcutsHint}</small
          >
        </div>
      </footer>
    </div>

    <!-- RIGHT PANEL: ULTRA-COMPACT PHOTOSHOP INSPECTOR & CLICK-TO-SHOW SLIDERS -->
    <aside
      class="ds-settings group-data-[has-pages=false]/ds:!hidden bg-white dark:bg-studio-sidebar border-l border-slate-200 dark:border-studio-border flex flex-col min-h-0 overflow-hidden max-lg:fixed max-lg:top-12 max-lg:right-0 max-lg:bottom-0 max-lg:w-[min(340px,94vw)] max-lg:z-90 max-lg:shadow-2xl max-lg:translate-x-[104%] max-lg:group-data-[drawer=inspector]/ds:translate-x-0 max-lg:transition-transform max-lg:duration-200"
      id="dsInspectorPanel"
      aria-label={t.inspectorTitle}
    >
      <!-- Sticky Inspector Header -->
      <div
        class="ds-panel-head sticky top-0 z-20 min-h-[34px] px-2.5 py-1 flex items-center justify-between gap-1.5 border-b border-slate-200 dark:border-studio-border bg-slate-50/90 dark:bg-studio-sidebar shrink-0"
      >
        <strong class="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-studio-text">
          <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5 text-emerald-600 dark:text-studio-primary shrink-0" />
          <span data-i18n="inspectorTitle">{t.inspectorTitle}</span>
        </strong>
        <div class="ds-panel-head-actions inline-flex items-center gap-1">
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

      <!-- Photoshop-Style Docked Control Panels -->
      <div class="ds-settings-scroll flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-2 bg-slate-100/70 dark:bg-studio-bg/60 [scrollbar-width:thin]">
        <!-- PANEL 1: AI & SCAN FILTERS -->
        <section class="rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel overflow-hidden shadow-2xs shrink-0">
          <div class="px-2.5 py-1.5 bg-slate-50/95 dark:bg-studio-sidebar border-b border-slate-200/80 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-800 dark:text-studio-text">
              <Icon name="lucide:wand-sparkles" class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
              <span data-i18n="accFiltersTitle">{t.accFiltersTitle}</span>
              <span
                class="inline-flex items-center px-1.5 py-0 rounded-full bg-violet-500/12 text-violet-700 dark:text-violet-300 text-[8.5px] font-bold"
                data-i18n="accFiltersBadge">{t.accFiltersBadge}</span
              >
            </span>
            <button
              type="button"
              data-ds-reset-section="filter"
              class="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              disabled
              data-i18n-title="resetFilterTip"
              title={t.resetFilterTip}
            >
              <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
              <span class="sr-only" data-i18n="resetFilterTip">{t.resetFilterTip}</span>
            </button>
          </div>
          <fieldset class="ds-presets m-0 p-1.5 border-0 grid grid-cols-2 gap-1">
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
                  class="min-h-[27px] px-2 py-1 rounded-md border border-slate-200/90 dark:border-studio-border bg-slate-50/70 dark:bg-studio-sidebar flex items-center justify-between gap-1.5 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-studio-surface peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 dark:peer-checked:bg-emerald-500/15 peer-checked:shadow-2xs peer-checked:[&_b]:text-emerald-700 dark:peer-checked:[&_b]:text-emerald-300"
                >
                  <span class="inline-flex items-center gap-1.5 min-w-0">
                    <Icon name={`lucide:${preset.icon}`} class="w-3.5 h-3.5 {presetColors[idx % presetColors.length]} shrink-0" />
                    <b class="text-[10.5px] font-bold text-slate-800 dark:text-studio-text truncate" data-i18n-preset-title={preset.value}
                      >{preset.title}</b
                    >
                  </span>
                  {#if idx === 0}
                    <small class="text-[9px] text-slate-500 dark:text-studio-muted truncate ml-auto mr-1" data-i18n-preset-desc={preset.value}
                      >{preset.desc}</small
                    >
                  {:else}
                    <small class="sr-only" data-i18n-preset-desc={preset.value}>{preset.desc}</small>
                  {/if}
                  {#if preset.ai}
                    <em class="ds-ai-tag not-italic px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[8px] font-extrabold tracking-wider uppercase shrink-0"
                      >AI</em
                    >
                  {/if}
                </span>
              </label>
            {/each}
          </fieldset>
        </section>

        <!-- PANEL 2: SMART FIX & CLEANUP -->
        <section class="ds-section ds-smart-options rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel overflow-hidden shadow-2xs shrink-0">
          <div class="px-2.5 py-1.5 bg-slate-50/95 dark:bg-studio-sidebar border-b border-slate-200/80 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-800 dark:text-studio-text">
              <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span data-i18n="accSmartTitle">{t.accSmartTitle}</span>
              <span
                class="inline-flex items-center px-1.5 py-0 rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[8.5px] font-bold"
                data-i18n="accSmartBadge">{t.accSmartBadge}</span
              >
            </span>
            <button
              type="button"
              data-ds-reset-section="smart"
              class="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              disabled
              data-i18n-title="resetSmartTip"
              title={t.resetSmartTip}
            >
              <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
              <span class="sr-only" data-i18n="resetSmartTip">{t.resetSmartTip}</span>
            </button>
          </div>
          <div class="p-1.5 grid grid-cols-2 gap-1">
            {#each [
              { id: 'dsShadow', icon: 'lucide:sun', color: 'text-amber-500 dark:text-amber-400', key: 'optShadow', label: t.optShadow },
              { id: 'dsText', icon: 'lucide:scan-text', color: 'text-indigo-600 dark:text-indigo-400', key: 'optText', label: t.optText },
              { id: 'dsStraighten', icon: 'lucide:align-horizontal-justify-center', color: 'text-blue-600 dark:text-blue-400', key: 'optStraighten', label: t.optStraighten },
              { id: 'dsCleanSpots', icon: 'lucide:eraser', color: 'text-rose-500 dark:text-rose-400', key: 'optCleanSpots', label: t.optCleanSpots },
              { id: 'dsCleanMargins', icon: 'lucide:scan', color: 'text-emerald-600 dark:text-emerald-400', key: 'optCleanMargins', label: t.optCleanMargins }
            ] as opt}
              <label
                class="ds-toggle min-h-[27px] flex items-center justify-between gap-1 px-2 py-0.5 rounded-md bg-slate-50/70 dark:bg-studio-sidebar border border-slate-200/90 dark:border-studio-border cursor-pointer text-[10px] font-semibold text-slate-800 dark:text-studio-text transition-colors hover:bg-white dark:hover:bg-studio-surface hover:border-slate-300 dark:hover:border-slate-600"
                title={opt.key === 'optCleanMargins' ? t.cleanMarginsHint : opt.label}
              >
                <span class="inline-flex items-center gap-1.5 min-w-0">
                  <Icon name={opt.icon} class="w-3.5 h-3.5 {opt.color} shrink-0" />
                  <em class="not-italic truncate" data-i18n={opt.key}>{opt.label}</em>
                </span>
                <input id={opt.id} type="checkbox" checked class="w-3.5 h-3.5 accent-emerald-600 cursor-pointer shrink-0" />
              </label>
            {/each}
            <button
              type="button"
              data-ds="toggle-eraser"
              class="{btnPrimarySoft} min-h-[27px] px-2 py-0.5 rounded-md justify-center text-[10px]"
              disabled
              data-i18n-title="retouchTip"
              title={t.retouchTip}
            >
              <Icon name="lucide:pipette" class="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
              <span class="truncate" data-i18n="launchRetouchBtn">{t.launchRetouchBtn}</span>
            </button>
          </div>
          <small class="sr-only" data-i18n="cleanMarginsHint">{t.cleanMarginsHint}</small>
        </section>

        <!-- PANEL 3: PHOTOSHOP MANUAL ADJUSTMENTS (WITH PER-TOOL RESET BUTTONS) -->
        <section class="ds-section ds-sliders rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel overflow-hidden shadow-2xs shrink-0">
          <div class="px-2.5 py-1.5 bg-slate-50/95 dark:bg-studio-sidebar border-b border-slate-200/80 dark:border-studio-border flex items-center justify-between gap-1.5">
            <span class="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-800 dark:text-studio-text">
              <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span data-i18n="accManualTitle">{t.accManualTitle}</span>
              <span
                class="inline-flex items-center px-1.5 py-0 rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 text-[8.5px] font-bold"
                data-i18n="accManualBadge">{t.accManualBadge}</span
              >
            </span>
            <button
              type="button"
              data-ds-reset-section="manual"
              class="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              disabled
              data-i18n-title="resetManualTip"
              title={t.resetManualTip}
            >
              <Icon name="lucide:rotate-ccw" class="w-3 h-3 shrink-0" />
              <span class="sr-only" data-i18n="resetManualTip">{t.resetManualTip}</span>
            </button>
          </div>

          <div class="p-1.5">
            <!-- Photoshop Property Grid: Each Tool has Icon, Name, Value & Individual Reset Button -->
            <div class="grid grid-cols-2 gap-1">
              {#each [
                { key: 'brightness', icon: 'lucide:sun-medium', color: 'text-amber-500 dark:text-amber-400', i18nKey: 'lblBrightness', label: t.lblBrightness, outId: 'dsBrightnessValue', initVal: '100%' },
                { key: 'contrast', icon: 'lucide:contrast', color: 'text-indigo-600 dark:text-indigo-400', i18nKey: 'lblContrast', label: t.lblContrast, outId: 'dsContrastValue', initVal: '100%' },
                { key: 'sharpness', icon: 'lucide:triangle', color: 'text-violet-600 dark:text-violet-400', i18nKey: 'lblSharpness', label: t.lblSharpness, outId: 'dsSharpnessValue', initVal: '25%' },
                { key: 'angle', icon: 'lucide:rotate-cw', color: 'text-blue-600 dark:text-blue-400', i18nKey: 'lblAngle', label: t.lblAngle, outId: 'dsAngleValue', initVal: '0°' },
                { key: 'curve', icon: 'lucide:book-open', color: 'text-cyan-600 dark:text-cyan-400', i18nKey: 'lblCurve', label: t.lblCurve, outId: 'dsCurveValue', initVal: '0' },
                { key: 'trim', icon: 'lucide:maximize', color: 'text-emerald-600 dark:text-emerald-400', i18nKey: 'lblTrim', label: t.lblTrim, outId: 'dsTrimValue', initVal: '0%' }
              ] as adj}
                <div
                  data-ds-adj-pod={adj.key}
                  class="group/pod min-h-[28px] rounded-md border border-slate-200/90 dark:border-studio-border bg-slate-50/70 dark:bg-studio-sidebar flex items-stretch overflow-hidden transition-all hover:border-emerald-500/50 hover:bg-white dark:hover:bg-studio-surface has-[[aria-expanded=true]]:border-emerald-500 has-[[aria-expanded=true]]:bg-emerald-500/10 dark:has-[[aria-expanded=true]]:bg-emerald-500/15 has-[[aria-expanded=true]]:shadow-2xs data-[modified=true]:border-amber-500/45"
                >
                  <button
                    type="button"
                    data-ds-adj-btn={adj.key}
                    aria-expanded="false"
                    class="flex-1 min-w-0 px-1.5 py-0.5 border-0 bg-transparent flex items-center justify-between gap-1 text-[10px] font-semibold text-slate-700 dark:text-studio-text cursor-pointer aria-expanded:text-emerald-700 dark:aria-expanded:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span class="inline-flex items-center gap-1 min-w-0">
                      <Icon name={adj.icon} class="w-3.5 h-3.5 {adj.color} shrink-0" />
                      <span class="truncate" data-i18n={adj.i18nKey}>{adj.label}</span>
                    </span>
                    <output id={adj.outId} class="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] tabular-nums shrink-0">{adj.initVal}</output>
                  </button>
                  <button
                    type="button"
                    data-ds-reset-adj={adj.key}
                    class="w-5 shrink-0 border-0 border-l border-slate-200/70 dark:border-studio-border bg-transparent inline-flex items-center justify-center text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed group-data-[modified=true]/pod:text-amber-600 dark:group-data-[modified=true]/pod:text-amber-400"
                    data-i18n-title="resetToolTip"
                    title={t.resetToolTip}
                  >
                    <Icon name="lucide:rotate-ccw" class="w-2.5 h-2.5 shrink-0" />
                    <span class="sr-only" data-i18n="resetToolTip">{t.resetToolTip}</span>
                  </button>
                </div>
              {/each}
            </div>

            <!-- Contextual Photoshop Scrub Slider Tray (Shown when a tool pod is clicked) -->
            <div id="dsActiveSliderTray" hidden class="mt-1.5 p-2 rounded-md bg-slate-50 dark:bg-studio-sidebar border border-emerald-500/50 shadow-xs">
              {#each [
                { key: 'brightness', id: 'dsBrightness', icon: 'lucide:sun-medium', color: 'text-amber-500', i18nKey: 'lblBrightness', label: t.lblBrightness, min: 60, max: 150, step: 1, val: 100, hintKey: '' },
                { key: 'contrast', id: 'dsContrast', icon: 'lucide:contrast', color: 'text-indigo-500', i18nKey: 'lblContrast', label: t.lblContrast, min: 60, max: 170, step: 1, val: 100, hintKey: '' },
                { key: 'sharpness', id: 'dsSharpness', icon: 'lucide:triangle', color: 'text-violet-500', i18nKey: 'lblSharpness', label: t.lblSharpness, min: 0, max: 100, step: 1, val: 25, hintKey: '' },
                { key: 'angle', id: 'dsAngle', icon: 'lucide:rotate-cw', color: 'text-blue-500', i18nKey: 'lblAngle', label: t.lblAngle, min: -10, max: 10, step: 0.1, val: 0, hintKey: '' },
                { key: 'curve', id: 'dsCurve', icon: 'lucide:book-open', color: 'text-cyan-500', i18nKey: 'lblCurve', label: t.lblCurve, min: -50, max: 50, step: 1, val: 0, hintKey: 'lblCurveHint', hint: t.lblCurveHint },
                { key: 'trim', id: 'dsTrim', icon: 'lucide:maximize', color: 'text-emerald-500', i18nKey: 'lblTrim', label: t.lblTrim, min: 0, max: 4, step: 0.5, val: 0, hintKey: 'lblTrimHint', hint: t.lblTrimHint }
              ] as pane}
                <div data-ds-adj-pane={pane.key} hidden class="grid gap-1.5">
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-studio-text">
                    <span class="inline-flex items-center gap-1.5">
                      <Icon name={pane.icon} class="w-3.5 h-3.5 {pane.color} shrink-0" />
                      <span data-i18n={pane.i18nKey}>{pane.label}</span>
                    </span>
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        data-ds-reset-adj={pane.key}
                        class="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-studio-surface cursor-pointer"
                        data-i18n-title="resetToolTip"
                        title={t.resetToolTip}
                      >
                        <Icon name="lucide:rotate-ccw" class="w-2.5 h-2.5" />
                        <span class="sr-only" data-i18n="resetToolTip">{t.resetToolTip}</span>
                      </button>
                      <button
                        type="button"
                        data-ds-adj-close
                        class="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer text-[10px]"
                        data-i18n-title="closeDrawerTip"
                        title={t.closeDrawerTip}
                      >✕</button>
                    </div>
                  </div>
                  <div class="grid grid-cols-[20px_1fr_20px] items-center gap-1.5">
                    <button
                      type="button"
                      data-ds-adj-step="-1"
                      data-ds-adj-target={pane.key}
                      class="w-5 h-5 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-600 dark:text-studio-text text-xs font-bold leading-none cursor-pointer hover:bg-slate-100"
                      aria-label="Decrease"
                    >−</button>
                    <input
                      id={pane.id}
                      aria-label={pane.label}
                      type="range"
                      min={pane.min}
                      max={pane.max}
                      step={pane.step}
                      value={pane.val}
                      class="w-full cursor-pointer accent-emerald-600"
                    />
                    <button
                      type="button"
                      data-ds-adj-step="1"
                      data-ds-adj-target={pane.key}
                      class="w-5 h-5 rounded border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-600 dark:text-studio-text text-xs font-bold leading-none cursor-pointer hover:bg-slate-100"
                      aria-label="Increase"
                    >+</button>
                  </div>
                  {#if pane.hintKey}
                    <small class="text-[9px] text-slate-500 dark:text-studio-muted leading-tight" data-i18n={pane.hintKey}>{pane.hint}</small>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </section>
      </div>

      <!-- PANEL 4: PINNED PAGE SETUP & DIRECT 1-CLICK EXPORT DOCK -->
      <div class="ds-export ds-section ds-export-settings border-t border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar shrink-0">
        <div class="px-2.5 py-1 bg-slate-50/95 dark:bg-studio-panel border-b border-slate-200/80 dark:border-studio-border flex items-center justify-between gap-1.5">
          <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-800 dark:text-studio-text">
            <Icon name="lucide:file-down" class="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span data-i18n="accExportTitle">{t.accExportTitle}</span>
            <span
              class="inline-flex items-center px-1.5 py-0 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-bold"
              data-i18n="accExportBadge">{t.accExportBadge}</span
            >
          </span>
          <button
            type="button"
            data-ds-reset-section="export"
            class="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200/90 dark:border-studio-border bg-white dark:bg-studio-sidebar text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-50 dark:hover:bg-studio-surface transition-colors"
            data-i18n-title="resetExportTip"
            title={t.resetExportTip}
          >
            <Icon name="lucide:rotate-ccw" class="w-2.5 h-2.5 shrink-0" />
            <span class="sr-only" data-i18n="resetExportTip">{t.resetExportTip}</span>
          </button>
        </div>

        <div class="p-2 grid gap-1.5">
        <!-- Direct Page Setup Controls -->
        <div class="grid gap-1">
          <div class="grid grid-cols-[1fr_auto] items-center gap-1">
            <input
              type="text"
              id="dsFilename"
              value="TechHat-document"
              maxlength="100"
              aria-label={t.lblFilename}
              placeholder={t.lblFilename}
              class="w-full min-h-[24px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[10px] font-semibold outline-none focus:border-emerald-500"
            />
            <label
              class="inline-flex items-center gap-1 min-h-[24px] px-1.5 py-0.5 rounded-md bg-white dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-[10px] font-semibold text-slate-700 dark:text-studio-text whitespace-nowrap"
              title={t.lblMargin}
            >
              <input type="checkbox" id="dsMargin" checked class="w-3 h-3 accent-emerald-600 cursor-pointer shrink-0" />
              <span data-i18n="lblMargin">{t.lblMargin}</span>
            </label>
          </div>

          <div class="grid grid-cols-2 gap-1">
            <select
              id="dsPaper"
              aria-label={t.lblPaperSize}
              title={t.lblPaperSize}
              class="w-full min-h-[24px] px-1.5 py-0 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[10px] font-semibold outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="a4" data-i18n="paperA4">{t.paperA4}</option>
              <option value="letter" data-i18n="paperLetter">{t.paperLetter}</option>
              <option value="original" data-i18n="paperOrig">{t.paperOrig}</option>
            </select>
            <select
              id="dsQuality"
              aria-label={t.lblQuality}
              title={t.lblQuality}
              class="w-full min-h-[24px] px-1.5 py-0 rounded-md border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[10px] font-semibold outline-none focus:border-emerald-500 cursor-pointer"
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
        <button type="button" class="{btnPrimary} w-full min-h-[32px] justify-between px-3 text-[11px] rounded-lg" data-ds="pdf" disabled>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="lucide:file-down" class="w-3.5 h-3.5 shrink-0" />
            <span data-i18n="downloadPdfBtn">{t.downloadPdfBtn}</span>
          </span>
          <span id="dsExportCount" class="px-1.5 py-0 rounded-full bg-black/15 text-[10px] font-extrabold tabular-nums">0 pages</span>
        </button>

        <div class="ds-export-sub grid grid-cols-4 gap-1">
          <button type="button" data-ds="jpg" class="{btnBase} w-full min-h-[25px] px-1 justify-center text-[10px] rounded-md" disabled title="Download Current Page as JPG">
            <Icon name="lucide:image-down" class="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
            <span data-i18n="downloadJpgBtn">{t.downloadJpgBtn}</span>
          </button>
          <button type="button" data-ds="png" class="{btnBase} w-full min-h-[25px] px-1 justify-center text-[10px] rounded-md" disabled title="Download Current Page as Lossless PNG">
            <Icon name="lucide:file-image" class="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span data-i18n="downloadPngBtn">{t.downloadPngBtn}</span>
          </button>
          <button type="button" data-ds="zip" class="{btnBase} w-full min-h-[25px] px-1 justify-center text-[10px] rounded-md" disabled title="Download All Pages as ZIP">
            <Icon name="lucide:archive" class="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span data-i18n="downloadZipBtn">{t.downloadZipBtn}</span>
          </button>
          <button type="button" data-ds="print" class="{btnBase} w-full min-h-[25px] px-1 justify-center text-[10px] rounded-md" disabled data-i18n-title="printTip" title={t.printTip}>
            <Icon name="lucide:printer" class="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
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

<script lang="ts">
  interface Props {
    initialTab?: 'text' | 'file';
    voiceFocus?: boolean;
    workspaceTitle?: string;
    workspaceTitleEn?: string;
  }

  let {
    initialTab = 'text',
    voiceFocus = false,
    workspaceTitle = 'বিজয় ⇄ ইউনিকোড কনভার্টার',
    workspaceTitleEn = 'Bijoy ⇄ Unicode Converter'
  }: Props = $props();

  const chipBtn =
    'inline-flex items-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-700 dark:text-studio-text text-xs font-semibold cursor-pointer transition-all duration-200 hover:bg-slate-100 dark:hover:bg-studio-surface hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.97]';
  const segContainer =
    "seg relative inline-grid grid-cols-2 p-1 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border before:content-[''] before:pointer-events-none before:absolute before:top-1 before:bottom-1 before:left-1 before:w-[calc(50%-4px)] before:rounded-lg before:bg-emerald-600 dark:before:bg-studio-surface before:shadow-xs before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.22,1,0.36,1)] data-[dir=b2u]:before:translate-x-full";
  const segLabel =
    'relative z-10 inline-flex items-center justify-center min-w-[138px] sm:min-w-[156px] px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-bold text-slate-600 dark:text-studio-muted cursor-pointer transition-colors duration-200 select-none hover:text-slate-900 dark:hover:text-white [input:checked+&]:text-white dark:[input:checked+&]:text-white';
</script>

<div
  class="tool-view [&_[hidden]]:!hidden"
  id="tool-bijoy"
  data-initial-tab={initialTab}
  data-voice-focus={voiceFocus ? 'true' : 'false'}
  data-title-bn={workspaceTitle}
  data-title-en={workspaceTitleEn}
>
  <section
    class="rounded-2xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar shadow-xs overflow-hidden"
    aria-label="Converter"
  >
    <!-- ============================================================ UNIFIED STUDIO CONTROL BAR -->
    <div
      class="bijoy-studio-bar flex flex-wrap lg:grid lg:grid-cols-[1fr_auto_1fr] items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-100/80 dark:bg-studio-panel border-b border-slate-200 dark:border-studio-border"
    >
      <!-- Left: Mode Switcher Tabs -->
      <div class="flex items-center lg:justify-self-start">
        <div
          class="tabs relative inline-grid grid-cols-2 p-1 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border"
          id="bijoyTabs"
          role="tablist"
          aria-label="Mode"
          data-active={initialTab}
        >
          <button
            class="tab relative z-10 inline-flex items-center justify-center gap-1.5 min-w-[124px] px-3.5 py-1.5 rounded-lg border-0 bg-transparent text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer transition-colors duration-200 hover:text-slate-900 dark:hover:text-white aria-selected:text-emerald-600 dark:aria-selected:text-studio-primary"
            role="tab"
            id="tab-text"
            aria-selected={initialTab === 'text' ? 'true' : 'false'}
            aria-controls="panel-text"
            type="button"
          >
            <svg class="w-4 h-4 stroke-[2] fill-none stroke-current shrink-0" viewBox="0 0 24 24" aria-hidden="true"
              ><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14" /></svg
            >
            <span data-i18n-bn="টেক্সট ও ভয়েস" data-i18n-en="Text & Voice">টেক্সট ও ভয়েস</span>
          </button>
          <button
            class="tab relative z-10 inline-flex items-center justify-center gap-1.5 min-w-[124px] px-3.5 py-1.5 rounded-lg border-0 bg-transparent text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-studio-muted whitespace-nowrap cursor-pointer transition-colors duration-200 hover:text-slate-900 dark:hover:text-white aria-selected:text-emerald-600 dark:aria-selected:text-studio-primary"
            role="tab"
            id="tab-file"
            aria-selected={initialTab === 'file' ? 'true' : 'false'}
            aria-controls="panel-file"
            tabindex={initialTab === 'file' ? 0 : -1}
            type="button"
            title="DOCX, XLSX, PPTX, RTF, TXT"
          >
            <svg class="w-4 h-4 stroke-[2] fill-none stroke-current shrink-0" viewBox="0 0 24 24" aria-hidden="true"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14 3v5h5M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
              /></svg
            >
            <span data-i18n-bn="অফিস ফাইল" data-i18n-en="Office Files">অফিস ফাইল</span>
          </button>
          <span
            class="tabs__ink pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-emerald-500/15 border border-emerald-500/35 shadow-2xs transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [[data-active=file]_&]:translate-x-full"
            aria-hidden="true"
          ></span>
        </div>
      </div>

      <!-- Center: Conversion Direction Switcher -->
      <div class="flex items-center justify-center lg:justify-self-center">
        <div
          class={segContainer}
          id="textDirSeg"
          data-dir="u2b"
          role="radiogroup"
          aria-label="Text Conversion Direction"
          hidden={initialTab !== 'text'}
        >
          <input type="radio" name="textDir" id="textDirU2B" value="u2b" checked class="sr-only" />
          <label for="textDirU2B" class={segLabel} data-i18n-bn="ইউনিকোড → বিজয়" data-i18n-en="Unicode → Bijoy"
            >ইউনিকোড → বিজয়</label
          >
          <input type="radio" name="textDir" id="textDirB2U" value="b2u" class="sr-only" />
          <label for="textDirB2U" class={segLabel} data-i18n-bn="বিজয় → ইউনিকোড" data-i18n-en="Bijoy → Unicode"
            >বিজয় → ইউনিকোড</label
          >
        </div>

        <div
          class={segContainer}
          id="fileDirSeg"
          data-dir="u2b"
          role="radiogroup"
          aria-label="File Conversion Direction"
          hidden={initialTab !== 'file'}
        >
          <input type="radio" name="fileDir" id="fileDirU2B" value="u2b" checked class="sr-only" />
          <label for="fileDirU2B" class={segLabel} data-i18n-bn="ইউনিকোড → বিজয়" data-i18n-en="Unicode → Bijoy"
            >ইউনিকোড → বিজয়</label
          >
          <input type="radio" name="fileDir" id="fileDirB2U" value="b2u" class="sr-only" />
          <label for="fileDirB2U" class={segLabel} data-i18n-bn="বিজয় → ইউনিকোড" data-i18n-en="Bijoy → Unicode"
            >বিজয় → ইউনিকোড</label
          >
        </div>
      </div>

      <!-- Right: Quick Actions (Text Mode) / Format Badges (File Mode) -->
      <div class="flex items-center justify-end lg:justify-self-end">
        <div class="flex items-center gap-2 flex-wrap" id="textToolbarActions" hidden={initialTab !== 'text'}>
          <label
            class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer select-none"
            title="লেখার সাথে সাথে রূপান্তর"
            data-i18n-title-bn="লেখার সাথে সাথে রূপান্তর"
            data-i18n-title-en="Convert automatically while typing"
          >
            <input type="checkbox" id="liveToggle" checked class="sr-only peer" />
            <span
              class="relative w-9 h-5 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
              aria-hidden="true"
            ></span>
            <span data-i18n-bn="লাইভ" data-i18n-en="Live">লাইভ</span>
          </label>
          <button
            class="inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-white text-xs font-bold cursor-pointer"
            id="convertBtn"
            type="button"
            hidden
            title="Ctrl+Enter"
          >
            <span data-i18n-bn="রূপান্তর" data-i18n-en="Convert">রূপান্তর</span>
            <kbd class="text-[10px] px-1 py-0.5 rounded bg-black/15">Ctrl</kbd>+<kbd class="text-[10px] px-1 py-0.5 rounded bg-black/15"
              >Enter</kbd
            >
          </button>
          <button
            class="{chipBtn} group"
            id="swapBtn"
            type="button"
            title="দিক ও লেখা অদলবদল (Ctrl+Shift+S)"
            data-i18n-title-bn="দিক ও লেখা অদলবদল (Ctrl+Shift+S)"
            data-i18n-title-en="Swap direction & text (Ctrl+Shift+S)"
          >
            <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current transition-transform duration-300 group-hover:rotate-180" viewBox="0 0 24 24" aria-hidden="true"
              ><path stroke-linecap="round" stroke-linejoin="round" d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></svg
            >
            <span data-i18n-bn="অদলবদল" data-i18n-en="Swap">অদলবদল</span>
          </button>
          <button
            class="{chipBtn} hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
            id="clearBtn"
            type="button"
            title="মুছুন"
            data-i18n-title-bn="সব লেখা মুছুন"
            data-i18n-title-en="Clear all text"
          >
            <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true"
              ><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg
            >
            <span data-i18n-bn="মুছুন" data-i18n-en="Clear">মুছুন</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5" id="fileToolbarMeta" hidden={initialTab !== 'file'} aria-hidden="true">
          <span class="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-xs font-bold"
            >DOCX</span
          >
          <span
            class="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold"
            >XLSX</span
          >
          <span
            class="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold"
            >PPTX</span
          >
          <span
            class="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 text-xs font-bold"
            >RTF / TXT</span
          >
        </div>
      </div>
    </div>

    <!-- ============================================================ TEXT PANEL -->
    <div class="p-4" role="tabpanel" id="panel-text" aria-labelledby="tab-text" hidden={initialTab !== 'text'}>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left Input Pane -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2 flex-wrap min-h-[34px]">
            <label class="text-sm font-bold text-slate-800 dark:text-studio-text" for="inputText" id="inputLabel">
              ইউনিকোড টেক্সট
            </label>
            <div class="flex items-center gap-1.5 flex-wrap">
              <div
                class="inline-flex items-center rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel overflow-hidden"
                id="voiceGroup"
              >
                <button
                  class="inline-flex items-center gap-1.5 min-h-[30px] px-2.5 py-1 border-0 bg-transparent text-slate-700 dark:text-studio-text text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-studio-surface aria-pressed:bg-red-500/15 aria-pressed:text-red-600 dark:aria-pressed:text-red-400"
                  id="voiceBtn"
                  type="button"
                  aria-pressed="false"
                  title="ভয়েস টাইপিং চালু বা বন্ধ করুন (Alt+V)"
                  data-i18n-title-bn="ভয়েস টাইপিং চালু বা বন্ধ করুন (Alt+V)"
                  data-i18n-title-en="Start or stop voice typing (Alt+V)"
                >
                  <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 10a7 7 0 0 0 14 0M12 17v4m-4 0h8" />
                  </svg>
                  <span id="voiceBtnLabel" data-i18n-bn="ভয়েস টাইপ" data-i18n-en="Voice Type">ভয়েস টাইপ</span>
                </button>
                <select
                  class="min-h-[30px] px-2 py-1 border-0 border-l border-slate-200 dark:border-studio-border bg-transparent text-slate-700 dark:text-studio-text text-xs font-semibold outline-none cursor-pointer"
                  id="voiceLang"
                  aria-label="Voice typing language"
                  title="ভয়েস টাইপিংয়ের ভাষা"
                  data-i18n-title-bn="ভয়েস টাইপিংয়ের ভাষা"
                  data-i18n-title-en="Voice typing language"
                >
                  <option value="bn-BD" class="bg-white dark:bg-studio-sidebar" data-i18n-bn="বাংলা (BD)" data-i18n-en="Bangla (BD)"
                    >বাংলা (BD)</option
                  >
                  <option value="bn-IN" class="bg-white dark:bg-studio-sidebar" data-i18n-bn="বাংলা (IN)" data-i18n-en="Bangla (IN)"
                    >বাংলা (IN)</option
                  >
                  <option value="en-US" class="bg-white dark:bg-studio-sidebar">English</option>
                </select>
              </div>
              <button
                class={chipBtn}
                id="pasteBtn"
                type="button"
                title="ক্লিপবোর্ড থেকে পেস্ট করুন"
                data-i18n-title-bn="ক্লিপবোর্ড থেকে পেস্ট করুন"
                data-i18n-title-en="Paste from clipboard"
              >
                <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 4h6v3H9zM8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"
                  /></svg
                >
                <span data-i18n-bn="পেস্ট" data-i18n-en="Paste">পেস্ট</span>
              </button>
              <button
                class={chipBtn}
                id="copyInputBtn"
                type="button"
                title="ইনপুট টেক্সট কপি করুন"
                data-i18n-title-bn="ইনপুট টেক্সট কপি করুন"
                data-i18n-title-en="Copy input text"
              >
                <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true"
                  ><rect x="8" y="8" width="12" height="12" rx="2" /><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"
                  /></svg
                >
                <span data-i18n-bn="কপি" data-i18n-en="Copy">কপি</span>
              </button>
            </div>
          </div>

          <div
            class="flex items-center justify-between gap-2 flex-wrap px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs"
            id="voiceBar"
            hidden
            aria-live="polite"
          >
            <div class="inline-flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></span>
              <span id="voiceStatusText" data-i18n-bn="শুনছি… কথা বলুন" data-i18n-en="Listening… speak now">শুনছি… কথা বলুন</span>
            </div>
            <div class="flex items-center gap-1 flex-wrap" role="group" aria-label="Quick punctuation">
              <button type="button" class="voice-chip {chipBtn} min-h-[26px] px-2.5 py-0.5 text-xs" data-insert="। " title="দাঁড়ি বসান" data-i18n-bn="। দাঁড়ি" data-i18n-en="। Period">। দাঁড়ি</button>
              <button type="button" class="voice-chip {chipBtn} min-h-[26px] px-2.5 py-0.5 text-xs" data-insert=", " title="কমা বসান" data-i18n-bn=", কমা" data-i18n-en=", Comma">, কমা</button>
              <button type="button" class="voice-chip {chipBtn} min-h-[26px] px-2.5 py-0.5 text-xs" data-insert="? " title="প্রশ্নবোধক চিহ্ন বসান">?</button>
              <button type="button" class="voice-chip {chipBtn} min-h-[26px] px-2.5 py-0.5 text-xs" data-insert="! " title="বিস্ময়সূচক চিহ্ন বসান">!</button>
              <button type="button" class="voice-chip {chipBtn} min-h-[26px] px-2.5 py-0.5 text-xs" data-insert="&#10;" title="নতুন লাইন" data-i18n-bn="↵ লাইন" data-i18n-en="↵ New Line">↵ লাইন</button>
              <button
                type="button"
                class="voice-chip {chipBtn} min-h-[26px] px-2.5 py-0.5 text-xs"
                id="voiceBackspaceBtn"
                title="শেষ শব্দ মুছুন"
                data-i18n-bn="⌫ শব্দ মুছুন"
                data-i18n-en="⌫ Delete Word">⌫ শব্দ মুছুন</button
              >
            </div>
          </div>

          <textarea
            id="inputText"
            class="textbox is-unicode w-full min-h-[340px] p-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[length:var(--text-size,18px)] leading-relaxed resize-y outline-none focus:border-emerald-500 [&.is-bijoy]:font-['SutonnyMJ',var(--font-sans)] [&.is-unicode]:font-[family-name:var(--preview-font,var(--font-sans))] placeholder:font-sans placeholder:text-[15px] placeholder:text-slate-400 dark:placeholder:text-slate-500 [&:placeholder-shown]:!font-sans"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            placeholder="ইউনিকোড বাংলা লিখুন বা পেস্ট করুন… (ইংরেজি অংশ আলাদা থাকবে)"
          ></textarea>
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-studio-muted px-0.5">
            <span id="inputCount">০ অক্ষর • ০ শব্দ</span>
            <span
              class="text-emerald-600 dark:text-emerald-400 font-semibold"
              id="smartHint"
              hidden
              data-i18n-bn="✦ স্মার্ট পেস্ট: ইংরেজি অংশ অক্ষত"
              data-i18n-en="✦ Smart Paste: English text preserved">✦ স্মার্ট পেস্ট: ইংরেজি অংশ অক্ষত</span
            >
          </div>
        </div>

        <!-- Right Output Pane -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2 flex-wrap min-h-[34px]">
            <label class="text-sm font-bold text-slate-800 dark:text-studio-text" for="outputText" id="outputLabel"
              >বিজয় আউটপুট <small class="text-xs font-medium text-slate-500 dark:text-studio-muted">(SutonnyMJ)</small></label
            >
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                class={chipBtn}
                id="copyBtn"
                type="button"
                title="সাধারণ কপি"
                data-i18n-title-bn="সাধারণ কপি"
                data-i18n-title-en="Copy plain text"
              >
                <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true"
                  ><rect x="8" y="8" width="12" height="12" rx="2" /><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"
                  /></svg
                >
                <span data-i18n-bn="কপি" data-i18n-en="Copy">কপি</span>
              </button>
              <button
                class="inline-flex items-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors"
                id="copyRichBtn"
                type="button"
                title="ফন্টসহ কপি — Word-এ পেস্ট করলে সঠিক ফন্ট থাকবে"
                data-i18n-title-bn="ফন্টসহ কপি — Word-এ পেস্ট করলে সঠিক ফন্ট থাকবে"
                data-i18n-title-en="Copy with font formatting for MS Word"
              >
                <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true"
                  ><path stroke-linecap="round" stroke-linejoin="round" d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" /></svg
                >
                <span data-i18n-bn="Word-এর জন্য কপি" data-i18n-en="Copy for Word">Word-এর জন্য কপি</span>
              </button>
              <button
                class={chipBtn}
                id="downloadTxtBtn"
                type="button"
                title=".txt ফাইল ডাউনলোড"
                data-i18n-title-bn=".txt ফাইল ডাউনলোড"
                data-i18n-title-en="Download .txt file"
              >
                <svg class="w-3.5 h-3.5 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true"
                  ><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg
                >
                .txt
              </button>
            </div>
          </div>

          <textarea
            id="outputText"
            hidden
            class="textbox textbox--out is-bijoy w-full min-h-[340px] p-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-slate-50/80 dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[length:var(--text-size,18px)] leading-relaxed resize-y outline-none focus:border-emerald-500 transition-[border-color,box-shadow] duration-300 [&.flash]:border-emerald-500 [&.flash]:ring-2 [&.flash]:ring-emerald-500/20 [&.is-bijoy]:font-['SutonnyMJ',var(--font-sans)] [&.is-unicode]:font-[family-name:var(--preview-font,var(--font-sans))] placeholder:font-sans placeholder:text-[15px] placeholder:text-slate-400 dark:placeholder:text-slate-500 [&:placeholder-shown]:!font-sans"
            readonly
            spellcheck="false"
            placeholder="রূপান্তরিত লেখা এখানে দেখাবে…"
            data-i18n-placeholder-bn="রূপান্তরিত লেখা এখানে দেখাবে…"
            data-i18n-placeholder-en="Converted text will appear here…"
          ></textarea>
          <div
            id="outputRich"
            role="textbox"
            aria-readonly="true"
            aria-multiline="true"
            aria-labelledby="outputLabel"
            tabindex="0"
            placeholder="রূপান্তরিত লেখা এখানে দেখাবে…"
            data-i18n-placeholder-bn="রূপান্তরিত লেখা এখানে দেখাবে…"
            data-i18n-placeholder-en="Converted text will appear here…"
            class="textbox textbox--out is-bijoy w-full min-h-[340px] p-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-slate-50/80 dark:bg-studio-panel text-slate-900 dark:text-studio-text text-[length:var(--text-size,18px)] leading-relaxed resize-y overflow-y-auto whitespace-pre-wrap break-words outline-none focus:border-emerald-500 transition-[border-color,box-shadow] duration-300 [&.flash]:border-emerald-500 [&.flash]:ring-2 [&.flash]:ring-emerald-500/20 empty:before:content-[attr(placeholder)] empty:before:font-sans empty:before:text-[15px] empty:before:text-slate-400 dark:empty:before:text-slate-500 empty:before:pointer-events-none select-text"
          ></div>
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-studio-muted px-0.5">
            <span id="outputCount">০ অক্ষর • ০ শব্দ</span>
            <span id="timing"></span>
          </div>
        </div>
      </div>

      <!-- Bottom Font & Size Bar -->
      <div
        class="mt-4 pt-3 border-t border-slate-200 dark:border-studio-border flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-studio-text"
      >
        <label class="inline-flex items-center gap-2 font-semibold">
          <span data-i18n-bn="আউটপুট ফন্ট" data-i18n-en="Output Font">আউটপুট ফন্ট</span>
          <select
            id="previewFont"
            class="min-h-[32px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-900 dark:text-studio-text text-xs outline-none focus:border-emerald-500"
          ></select>
        </label>
        <label class="inline-flex items-center gap-2 font-semibold">
          <span data-i18n-bn="আকার" data-i18n-en="Size">আকার</span>
          <input type="range" id="fontSize" min="13" max="34" value="18" class="w-28 accent-emerald-600 cursor-pointer" />
          <output id="fontSizeOut" for="fontSize" class="min-w-[24px] font-bold text-emerald-600 dark:text-emerald-400">১৮</output>
        </label>
        <label class="inline-flex items-center gap-1.5 font-semibold cursor-pointer" id="textEnglishFontField">
          <input type="checkbox" id="textEnglishTnrToggle" checked class="w-4 h-4 accent-emerald-600 cursor-pointer" />
          <span data-i18n-bn="ইংরেজি লেটার" data-i18n-en="Keep English Letters">ইংরেজি লেটার</span>
        </label>
        <p class="m-0 ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-medium" id="fontStatus" role="note"></p>
      </div>
    </div>

    <!-- ============================================================ FILE PANEL -->
    <div class="p-4" role="tabpanel" id="panel-file" aria-labelledby="tab-file" hidden={initialTab !== 'file'}>
      <div class="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5">
        <label
          class="drop flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 text-center cursor-pointer transition-colors hover:border-emerald-500 hover:bg-emerald-500/5"
          id="dropZone"
          for="fileInput"
        >
          <input
            type="file"
            id="fileInput"
            multiple
            accept=".docx,.docm,.dotx,.dotm,.xlsx,.xlsm,.pptx,.pptm,.ppsx,.rtf,.txt"
            class="sr-only"
          />
          <span
            class="w-14 h-14 rounded-2xl grid place-items-center bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          >
            <svg class="w-7 h-7 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
              /></svg
            >
          </span>
          <span
            class="text-base font-bold text-slate-800 dark:text-studio-text"
            data-i18n-bn="ফাইল টেনে আনুন অথবা নির্বাচন করুন"
            data-i18n-en="Drag & drop files here or click to browse">ফাইল টেনে আনুন অথবা <u>নির্বাচন করুন</u></span
          >
          <span class="flex flex-wrap justify-center gap-1.5" aria-hidden="true">
            <span class="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">Word</span>
            <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">Excel</span>
            <span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">PowerPoint</span>
            <span class="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">RTF / TXT</span>
          </span>
          <span
            class="text-xs text-slate-500 dark:text-studio-muted"
            data-i18n-bn="পুরোনো .doc / .xls / .ppt হলে আগে .docx / .xlsx / .pptx হিসেবে সেভ করুন"
            data-i18n-en="For legacy .doc / .xls / .ppt files, save as .docx / .xlsx / .pptx first"
            >পুরোনো .doc / .xls / .ppt হলে আগে .docx / .xlsx / .pptx হিসেবে সেভ করুন</span
          >
        </label>

        <div class="flex flex-col gap-4">
          <div class="grid gap-3 p-4 rounded-xl border border-slate-200 dark:border-studio-border bg-slate-50/60 dark:bg-studio-panel">
            <label class="grid gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text" id="unicodeFontField" hidden>
              <span data-i18n-bn="আউটপুট ইউনিকোড ফন্ট" data-i18n-en="Output Unicode Font">আউটপুট ইউনিকোড ফন্ট</span>
              <select
                id="unicodeFont"
                class="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text text-xs outline-none focus:border-emerald-500"
              ></select>
            </label>
            <label class="grid gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text" id="bijoyFontField">
              <span data-i18n-bn="আউটপুট বিজয় ফন্ট" data-i18n-en="Output Bijoy Font">আউটপুট বিজয় ফন্ট</span>
              <select
                id="bijoyFont"
                class="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text text-xs outline-none focus:border-emerald-500"
              ></select>
            </label>
            <label class="grid gap-1 text-xs font-semibold text-slate-700 dark:text-studio-text" id="customFontField" hidden>
              <span data-i18n-bn="ফন্টের নাম লিখুন" data-i18n-en="Custom Font Name">ফন্টের নাম লিখুন</span>
              <input
                type="text"
                id="customFont"
                placeholder="যেমন: Kalpurush"
                data-i18n-placeholder-bn="যেমন: Kalpurush"
                data-i18n-placeholder-en="e.g. Kalpurush"
                autocomplete="off"
                class="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text text-xs outline-none focus:border-emerald-500"
              />
            </label>
            <fieldset class="m-0 p-0 border-0 grid gap-1.5 text-xs" id="englishFontField">
              <legend class="font-bold text-slate-700 dark:text-studio-text mb-1" data-i18n-bn="ইংরেজি অক্ষরের ফন্ট" data-i18n-en="English Text Font">
                ইংরেজি অক্ষরের ফন্ট
              </legend>
              <label class="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-studio-text">
                <input type="checkbox" id="englishTnrToggle" checked class="w-4 h-4 accent-emerald-600 cursor-pointer" />
                <span data-i18n-bn="ইংরেজি লেটার" data-i18n-en="Keep English Letters">ইংরেজি লেটার</span>
              </label>
            </fieldset>
            <fieldset class="m-0 p-0 border-0 grid gap-1.5 text-xs" id="detectField" hidden>
              <legend class="font-bold text-slate-700 dark:text-studio-text mb-1" data-i18n-bn="কোন লেখা রূপান্তর হবে?" data-i18n-en="Conversion Scope">
                কোন লেখা রূপান্তর হবে?
              </legend>
              <label class="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-studio-text">
                <input type="radio" name="detect" value="auto" checked class="w-4 h-4 accent-emerald-600 cursor-pointer" />
                <span data-i18n-bn="শুধু বিজয় ফন্টের লেখা (সুপারিশকৃত)" data-i18n-en="Bijoy-formatted text only (Recommended)"
                  >শুধু বিজয় ফন্টের লেখা <small class="text-slate-500">(সুপারিশকৃত)</small></span
                >
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-studio-text">
                <input type="radio" name="detect" value="all" class="w-4 h-4 accent-emerald-600 cursor-pointer" />
                <span data-i18n-bn="ফন্ট না দেখে সব লেখা" data-i18n-en="Convert all text regardless of font">ফন্ট না দেখে সব লেখা</span>
              </label>
            </fieldset>
          </div>

          <ul class="queue m-0 p-0 list-none grid gap-2" id="queue" aria-live="polite"></ul>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-white text-xs font-bold cursor-pointer hover:enabled:bg-emerald-700 dark:hover:enabled:bg-emerald-400 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              id="convertFilesBtn"
              type="button"
              disabled
            >
              <svg class="w-4 h-4 stroke-[2] fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"
                /></svg
              >
              <span data-i18n-bn="ফাইল রূপান্তর করুন" data-i18n-en="Convert Files">ফাইল রূপান্তর করুন</span>
            </button>
            <button
              class={chipBtn}
              id="zipAllBtn"
              type="button"
              hidden
              data-i18n-bn="সব ডাউনলোড (ZIP)"
              data-i18n-en="Download All (ZIP)">সব ডাউনলোড (ZIP)</button
            >
            <button
              class="{chipBtn} hover:text-red-600 dark:hover:text-red-400"
              id="clearQueueBtn"
              type="button"
              hidden
              data-i18n-bn="তালিকা মুছুন"
              data-i18n-en="Clear Queue">তালিকা মুছুন</button
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

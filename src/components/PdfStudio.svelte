<script lang="ts">
  interface Props {
    initialTab?: 'hub' | 'merge' | 'split' | 'compress' | 'organize' | 'pdf2other' | 'other2pdf' | 'decrypt' | 'encrypt';
  }

  let { initialTab = 'merge' }: Props = $props();
</script>

<div class="tool-view w-full [&_[hidden]]:!hidden" id="tool-pdf" data-initial-tab={initialTab}>
  <section class="card util-card pdf-studio-card rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xs p-3.5 sm:p-5" aria-label="PDF Studio">
    <div class="util-body pdf-studio-body space-y-3.5">
      <!-- Global PDF Progress Bar -->
      <div class="pdf-progress-wrap sticky top-14 z-30 p-3 rounded-xl bg-white/95 dark:bg-studio-sidebar/95 backdrop-blur-md border border-emerald-500/40 shadow-md" id="pdfProgressWrap" hidden aria-live="polite">
        <div class="pdf-progress-head flex items-center justify-between text-xs font-bold text-slate-800 dark:text-studio-text mb-1.5">
          <span id="pdfProgressText">প্রসেস হচ্ছে…</span>
          <span id="pdfProgressPct" class="text-emerald-600 dark:text-studio-primary">০%</span>
        </div>
        <div class="progress h-2 rounded-full bg-slate-100 dark:bg-studio-panel overflow-hidden">
          <div class="progress__bar h-full bg-emerald-500 transition-[width] duration-150" id="pdfProgressBar" style="width: 0%"></div>
        </div>
      </div>

      <!-- ========================================== 1. MERGE PDF WORKSPACE -->
        <div class="pdf-pane space-y-3.5" id="pdf-pane-merge" hidden={initialTab !== 'merge'}>
          <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center shrink-0">
                <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 8v8M8 12h8"/></svg>
              </div>
              <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0 leading-tight" data-i18n-bn="মার্জ PDF" data-i18n-en="Merge PDF">মার্জ PDF</h1>
            </div>
            <div class="pdf-ws-actions flex items-center flex-wrap gap-1.5" id="pdfMergeTopActions" hidden>
              <label class="chip-btn inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors" for="pdfMergeAddMore">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.4]" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                <span data-i18n-bn="আরও ফাইল যোগ করুন" data-i18n-en="Add More Files">আরও ফাইল যোগ করুন</span>
                <input type="file" id="pdfMergeAddMore" accept=".pdf,application/pdf,image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.doc,.docx,.pptx,.xlsx,.txt,.md,.csv,.rtf" multiple class="visually-hidden sr-only" />
              </label>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 hover:bg-white dark:hover:bg-studio-surface transition-colors" id="pdfMergeRotLeftAll" title="সব ফাইল বামে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8.5 px-3 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 hover:bg-white dark:hover:bg-studio-surface transition-colors" id="pdfMergeRotRightAll" title="সব ফাইল ডানে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1 h-8.5 px-3 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 hover:bg-white dark:hover:bg-studio-surface transition-colors" id="pdfMergeSortBtn" data-i18n-bn="নাম অনুসারে (A-Z)" data-i18n-en="Sort (A-Z)">নাম অনুসারে (A-Z)</button>
              <button type="button" class="chip-btn chip-btn--danger inline-flex items-center gap-1 h-8.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors" id="pdfMergeClearBtn" data-i18n-bn="সব মুছুন" data-i18n-en="Clear All">সব মুছুন</button>
            </div>
          </div>

          <label class="pdf-dropzone group flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-gradient-to-b from-slate-50/60 to-slate-100/40 dark:from-studio-panel/40 dark:to-studio-panel/70 hover:border-emerald-500 dark:hover:border-studio-primary hover:from-emerald-500/[0.03] hover:to-emerald-500/[0.07] cursor-pointer transition-all" id="pdfMergeDropzone" for="pdfMergeInput">
            <input type="file" id="pdfMergeInput" accept=".pdf,application/pdf,image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.doc,.docx,.pptx,.xlsx,.txt,.md,.csv,.rtf" multiple class="visually-hidden sr-only" />
            <div class="pdf-dropzone__icon w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3.5 shadow-2xs group-hover:scale-105 transition-transform">
              <svg class="w-7 h-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M20 16.7A4.5 4.5 0 0 0 17.5 8h-1.1A7 7 0 1 0 4 14.9"/></svg>
            </div>
            <div class="pdf-dropzone__title text-base font-bold text-slate-900 dark:text-studio-text mb-3" data-i18n-bn="ফাইলগুলো এখানে ড্র্যাগ করে ছাড়ুন অথবা ব্রাউজ করুন" data-i18n-en="Drag & drop files here or click to browse">ফাইলগুলো এখানে ড্র্যাগ করে ছাড়ুন অথবা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">ব্রাউজ করুন</span></div>
            <div class="pdf-format-chips flex items-center justify-center flex-wrap gap-1.5" aria-hidden="true">
              <span data-k="pdf" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">PDF</span>
              <span data-k="img" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-studio-primary border border-emerald-500/20">JPG</span>
              <span data-k="img" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-studio-primary border border-emerald-500/20">PNG</span>
              <span data-k="doc" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">DOCX</span>
              <span data-k="doc" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">DOC</span>
              <span data-k="ppt" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">PPTX</span>
              <span data-k="xls" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">XLSX</span>
              <span data-k="txt" class="px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">TXT</span>
            </div>
          </label>

          <div class="pdf-workspace-stage pdf-drop-target space-y-3.5" id="pdfMergeStage" hidden>
            <div class="pdf-cards-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-studio-panel/40 border border-slate-200/80 dark:border-studio-border" id="pdfMergeList"></div>

            <div class="pdf-action-bar sticky bottom-3 z-20 flex items-center justify-between flex-wrap gap-3 p-3.5 px-4 rounded-2xl bg-white/95 dark:bg-studio-sidebar/95 backdrop-blur-md border border-emerald-500/35 shadow-lg">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <div class="pdf-summary-pill text-xs sm:text-sm font-bold text-slate-800 dark:text-studio-text" id="pdfMergeSummary">০টি ফাইল • মোট ০ পৃষ্ঠা</div>
              </div>
              <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold border-0 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all" id="pdfMergeRunBtn">
                <svg class="w-4 h-4 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 8v8M8 12h8"/></svg>
                <span data-i18n-bn="PDF মার্জ ও ডাউনলোড করুন" data-i18n-en="Merge & Download PDF">PDF মার্জ ও ডাউনলোড করুন</span>
              </button>
            </div>
          </div>
        </div>

      <!-- ========================================== 2. SPLIT PDF WORKSPACE -->
        <div class="pdf-pane space-y-3.5" id="pdf-pane-split" hidden={initialTab !== 'split'}>
          <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-2.5">
            <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="স্প্লিট PDF" data-i18n-en="Split PDF">স্প্লিট PDF</h1>
            <div class="pdf-ws-actions flex items-center flex-wrap gap-1.5" id="pdfSplitTopActions" hidden>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfSplitRotLeftAll" title="সব পৃষ্ঠা বামে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfSplitRotRightAll" title="সব পৃষ্ঠা ডানে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
              </button>
              <button type="button" class="chip-btn h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer" id="pdfSplitSelectAllBtn" data-i18n-bn="সব পেজ সিলেক্ট" data-i18n-en="Select All Pages">সব পেজ সিলেক্ট</button>
              <button type="button" class="chip-btn chip-btn--danger h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer" id="pdfSplitResetBtn" data-i18n-bn="অন্য ফাইল নিন" data-i18n-en="Choose Another File">অন্য ফাইল নিন</button>
            </div>
          </div>

          <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="pdfSplitDropzone" for="pdfSplitInput">
            <input type="file" id="pdfSplitInput" accept=".pdf,application/pdf" class="visually-hidden sr-only" />
            <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3">
              <svg class="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
            </div>
            <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="স্প্লিট করার জন্য একটি PDF ফাইল ছাড়ুন বা সিলেক্ট করুন" data-i18n-en="Drop a PDF file here or click to browse">স্প্লিট করার জন্য একটি PDF ফাইল ছাড়ুন বা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">সিলেক্ট করুন</span></div>
          </label>

          <div class="pdf-workspace-stage space-y-4" id="pdfSplitStage" hidden>
            <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3">
              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-2" data-i18n-bn="স্প্লিট করার ধরন নির্বাচন করুন" data-i18n-en="Select Split Mode">স্প্লিট করার ধরন নির্বাচন করুন</legend>
                <div class="pdf-radio-cards grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                    <input type="radio" name="pdfSplitMode" value="range" checked class="mt-1 accent-emerald-600" />
                    <span class="pdf-radio-card__body flex flex-col">
                      <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="নির্দিষ্ট পেজ বা রেঞ্জ (Custom Range)" data-i18n-en="Custom Pages or Range">নির্দিষ্ট পেজ বা রেঞ্জ (Custom Range)</strong>
                      <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="যেমন: 1-3, 5, 8-10 অথবা নিচের পেজগুলোতে ক্লিক করুন" data-i18n-en="e.g. 1-3, 5, 8-10 or click page thumbnails below">যেমন: 1-3, 5, 8-10 অথবা নিচের পেজগুলোতে ক্লিক করুন</small>
                    </span>
                  </label>
                  <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                    <input type="radio" name="pdfSplitMode" value="burst" class="mt-1 accent-emerald-600" />
                    <span class="pdf-radio-card__body flex flex-col">
                      <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="প্রতিটি পেজ আলাদা PDF (ZIP ফাইল)" data-i18n-en="Split Every Page into Separate PDFs (ZIP)">প্রতিটি পেজ আলাদা PDF (ZIP ফাইল)</strong>
                      <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="নির্দিষ্ট সংখ্যক পৃষ্ঠা পর পর আলাদা ফাইল তৈরি হবে" data-i18n-en="Create separate PDF files every N pages">নির্দিষ্ট সংখ্যক পৃষ্ঠা পর পর আলাদা ফাইল তৈরি হবে</small>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div class="pdf-sub-controls space-y-2.5 pt-2 border-t border-slate-200 dark:border-studio-border" id="pdfSplitRangeControls">
                <div class="pdf-field-group flex flex-col sm:flex-row sm:items-center gap-2">
                  <label for="pdfSplitRange" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="পেজ নম্বর / রেঞ্জ (কমা দিয়ে লিখুন):" data-i18n-en="Page Numbers / Ranges (comma-separated):">পেজ নম্বর / রেঞ্জ (কমা দিয়ে লিখুন):</label>
                  <input type="text" id="pdfSplitRange" name="pdfSplitRange" class="h-8 px-3 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none focus:border-emerald-500" placeholder="যেমন: 1-3, 5, 7" data-i18n-placeholder-bn="যেমন: 1-3, 5, 7" data-i18n-placeholder-en="e.g. 1-3, 5, 7" autocorrect="off" autocapitalize="off" spellcheck="false" />
                </div>
                <label class="switch pdf-inline-switch inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-studio-text">
                  <input type="checkbox" id="pdfSplitMergeRanges" checked class="accent-emerald-600" />
                  <span class="switch__label" data-i18n-bn="নির্বাচিত সব পেজ একটি PDF ফাইলে রাখুন (আনচেক করলে প্রতিটি রেঞ্জ আলাদা ZIP)" data-i18n-en="Merge all selected ranges into one PDF file (uncheck for ZIP)">নির্বাচিত সব পেজ একটি PDF ফাইলে রাখুন (আনচেক করলে প্রতিটি রেঞ্জ আলাদা ZIP)</span>
                </label>
              </div>

              <div class="pdf-sub-controls pt-2 border-t border-slate-200 dark:border-studio-border" id="pdfSplitBurstControls" hidden>
                <div class="pdf-field-group flex items-center gap-2">
                  <label for="pdfSplitEvery" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="কত পৃষ্ঠা পর পর আলাদা PDF হবে?" data-i18n-en="Pages per split PDF file:">কত পৃষ্ঠা পর পর আলাদা PDF হবে?</label>
                  <input type="number" id="pdfSplitEvery" name="pdfSplitEvery" value="1" min="1" max="500" class="h-8 w-24 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none" />
                </div>
              </div>
            </div>

            <div class="pdf-pages-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3" id="pdfSplitPagesGrid"></div>

            <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
              <div class="pdf-summary-pill text-xs font-bold text-slate-700 dark:text-studio-text" id="pdfSplitSummary">মোট ০ পৃষ্ঠা</div>
              <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" id="pdfSplitRunBtn">
                <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                <span data-i18n-bn="স্প্লিট ও ডাউনলোড করুন" data-i18n-en="Split & Download PDF">স্প্লিট ও ডাউনলোড করুন</span>
              </button>
            </div>
          </div>
        </div>

      <!-- ========================================== 3. COMPRESS PDF WORKSPACE -->
        <div class="pdf-pane space-y-3.5" id="pdf-pane-compress" hidden={initialTab !== 'compress'}>
          <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-2.5">
            <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="কমপ্রেস PDF" data-i18n-en="Compress PDF">কমপ্রেস PDF</h1>
            <div class="pdf-ws-actions flex items-center flex-wrap gap-1.5" id="pdfCompressTopActions" hidden>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfCompressRotLeftAll" title="সব পৃষ্ঠা বামে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfCompressRotRightAll" title="সব পৃষ্ঠা ডানে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
              </button>
              <button type="button" class="chip-btn chip-btn--danger h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer" id="pdfCompressResetBtn" data-i18n-bn="অন্য ফাইল নিন" data-i18n-en="Choose Another File">অন্য ফাইল নিন</button>
            </div>
          </div>

          <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="pdfCompressDropzone" for="pdfCompressInput">
            <input type="file" id="pdfCompressInput" accept=".pdf,application/pdf" class="visually-hidden sr-only" />
            <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3">
              <svg class="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
            </div>
            <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="কমপ্রেস করার জন্য PDF ফাইল ছাড়ুন বা সিলেক্ট করুন" data-i18n-en="Drop a PDF file here or click to browse">কমপ্রেস করার জন্য PDF ফাইল ছাড়ুন বা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">সিলেক্ট করুন</span></div>
          </label>

          <div class="pdf-workspace-stage space-y-4" id="pdfCompressStage" hidden>
            <div class="pdf-file-banner p-3 rounded-xl bg-slate-100 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text" id="pdfCompressFileInfo"></div>

            <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3">
              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-2" data-i18n-bn="কমপ্রেশন লেভেল নির্বাচন করুন" data-i18n-en="Select Compression Level">কমপ্রেশন লেভেল নির্বাচন করুন</legend>
                <div class="pdf-radio-cards pdf-radio-cards--3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                    <input type="radio" name="pdfCompressLevel" value="extreme" class="mt-1 accent-emerald-600" />
                    <span class="pdf-radio-card__body flex flex-col">
                      <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="এক্সট্রিম কমপ্রেশন" data-i18n-en="Extreme Compression">এক্সট্রিম কমপ্রেশন</strong>
                      <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="সর্বোচ্চ সাইজ কমবে (মাঝারি কোয়ালিটি)" data-i18n-en="Maximum size reduction (Medium quality)">সর্বোচ্চ সাইজ কমবে (মাঝারি কোয়ালিটি)</small>
                    </span>
                  </label>
                  <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                    <input type="radio" name="pdfCompressLevel" value="recommended" checked class="mt-1 accent-emerald-600" />
                    <span class="pdf-radio-card__body flex flex-col">
                      <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="রেকমেন্ডেড কমপ্রেশন" data-i18n-en="Recommended Compression">রেকমেন্ডেড কমপ্রেশন</strong>
                      <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="ভালো কোয়ালিটি এবং কম সাইজ (সেরা ব্যালেন্স)" data-i18n-en="Good quality & small size (Best balance)">ভালো কোয়ালিটি এবং কম সাইজ (সেরা ব্যালেন্স)</small>
                    </span>
                  </label>
                  <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                    <input type="radio" name="pdfCompressLevel" value="light" class="mt-1 accent-emerald-600" />
                    <span class="pdf-radio-card__body flex flex-col">
                      <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="হালকা কমপ্রেশন" data-i18n-en="Light Compression">হালকা কমপ্রেশন</strong>
                      <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="উচ্চ প্রিন্ট কোয়ালিটি ও স্ট্রাকচার অপটিমাইজ" data-i18n-en="High print quality & structure optimization">উচ্চ প্রিন্ট কোয়ালিটি ও স্ট্রাকচার অপটিমাইজ</small>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div class="pdf-sub-controls pt-2 border-t border-slate-200 dark:border-studio-border">
                <label class="switch pdf-inline-switch inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-studio-text">
                  <input type="checkbox" id="pdfCompressGray" class="accent-emerald-600" />
                  <span class="switch__label" data-i18n-bn="সাদাকালো (Grayscale) মোডে রূপান্তর করে আরও সাইজ কমান" data-i18n-en="Convert to Grayscale to reduce size further">সাদাকালো (Grayscale) মোডে রূপান্তর করে আরও সাইজ কমান</span>
                </label>
              </div>
            </div>

            <div class="pdf-pages-grid pdf-pages-grid--compact grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5" id="pdfCompressPagesGrid"></div>

            <!-- Result panel -->
            <div class="pdf-compress-result p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30 space-y-3" id="pdfCompressResult" hidden>
              <div class="pdf-compress-stat text-sm font-bold text-slate-900 dark:text-studio-text" id="pdfCompressStat"></div>
              <div class="pdf-compress-preview-head flex items-center justify-between flex-wrap gap-2 text-xs">
                <strong class="text-slate-900 dark:text-studio-text" data-i18n-bn="কমপ্রেসড ফাইলের কোয়ালিটি প্রিভিউ" data-i18n-en="Compressed File Quality Preview">কমপ্রেসড ফাইলের কোয়ালিটি প্রিভিউ</strong>
                <span class="text-slate-500 dark:text-studio-muted" data-i18n-bn="যেকোনো পৃষ্ঠায় ক্লিক করে আগের ও পরের কোয়ালিটি পাশাপাশি তুলনা করুন" data-i18n-en="Click any page to compare before & after quality side-by-side">যেকোনো পৃষ্ঠায় ক্লিক করে আগের ও পরের কোয়ালিটি পাশাপাশি তুলনা করুন</span>
              </div>
              <div class="pdf-pages-grid pdf-pages-grid--compact grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5" id="pdfCompressPreviewGrid"></div>
              <div class="pdf-compress-result-actions flex items-center justify-end flex-wrap gap-2">
                <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfCompressCompareBtn">
                  <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                  <span data-i18n-bn="আগে / পরে তুলনা করুন" data-i18n-en="Compare Before / After">আগে / পরে তুলনা করুন</span>
                </button>
                <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfCompressRetryBtn">
                  <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  <span data-i18n-bn="অন্য লেভেলে আবার কমপ্রেস করুন" data-i18n-en="Try Another Level">অন্য লেভেলে আবার কমপ্রেস করুন</span>
                </button>
                <button type="button" class="btn btn--primary inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer" id="pdfCompressDownloadBtn">
                  <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                  <span data-i18n-bn="কমপ্রেসড PDF ডাউনলোড করুন" data-i18n-en="Download Compressed PDF">কমপ্রেসড PDF ডাউনলোড করুন</span>
                </button>
              </div>
            </div>

            <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border" id="pdfCompressActionBar">
              <div class="pdf-summary-pill text-xs font-bold text-slate-700 dark:text-studio-text" id="pdfCompressSummary" data-i18n-bn="প্রস্তুত" data-i18n-en="Ready">প্রস্তুত</div>
              <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" id="pdfCompressRunBtn">
                <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
                <span data-i18n-bn="PDF কমপ্রেস করুন" data-i18n-en="Compress PDF">PDF কমপ্রেস করুন</span>
              </button>
            </div>
          </div>
        </div>

      <!-- ========================================== 4. ORGANIZE PDF WORKSPACE -->
        <div class="pdf-pane space-y-3.5" id="pdf-pane-organize" hidden={initialTab !== 'organize'}>
          <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-2.5">
            <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="অর্গানাইজ ও রোটেট PDF" data-i18n-en="Organize & Rotate PDF">অর্গানাইজ ও রোটেট PDF</h1>
            <div class="pdf-ws-actions flex items-center flex-wrap gap-1.5" id="pdfOrgTopActions" hidden>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfOrgRotLeftAll" title="সব পৃষ্ঠা বামে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfOrgRotRightAll" title="সব পৃষ্ঠা ডানে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfOrgAddBlank">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                <span data-i18n-bn="সাদা পেজ" data-i18n-en="Blank Page">সাদা পেজ</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfOrgReverseBtn">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></svg>
                <span data-i18n-bn="উল্টো ক্রম" data-i18n-en="Reverse Order">উল্টো ক্রম</span>
              </button>
              <button type="button" class="chip-btn chip-btn--danger h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer" id="pdfOrgResetBtn" data-i18n-bn="অন্য ফাইল নিন" data-i18n-en="Choose Another File">অন্য ফাইল নিন</button>
            </div>
          </div>

          <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="pdfOrgDropzone" for="pdfOrgInput">
            <input type="file" id="pdfOrgInput" accept=".pdf,application/pdf" class="visually-hidden sr-only" />
            <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3">
              <svg class="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="8.5" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="সাজানোর জন্য একটি PDF ফাইল ছাড়ুন বা সিলেক্ট করুন" data-i18n-en="Drop a PDF file here or click to browse">সাজানোর জন্য একটি PDF ফাইল ছাড়ুন বা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">সিলেক্ট করুন</span></div>
          </label>

          <div class="pdf-workspace-stage space-y-4" id="pdfOrgStage" hidden>
            <div class="pdf-options-box pdf-org-extras p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border flex items-center justify-between flex-wrap gap-3">
              <label class="switch pdf-inline-switch inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-studio-text">
                <input type="checkbox" id="pdfOrgPageNums" class="accent-emerald-600" />
                <span class="switch__label" data-i18n-bn="প্রতি পাতার নিচে পেজ নম্বর যুক্ত করুন (1 / N)" data-i18n-en="Add page numbers at bottom of each page (1 / N)">প্রতি পাতার নিচে পেজ নম্বর যুক্ত করুন (1 / N)</span>
              </label>
              <div class="pdf-field-group pdf-field-group--inline flex items-center gap-2">
                <label for="pdfOrgWatermark" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="ওয়াটারমার্ক টেক্সট (ঐচ্ছিক):" data-i18n-en="Watermark Text (optional):">ওয়াটারমার্ক টেক্সট (ঐচ্ছিক):</label>
                <input type="text" id="pdfOrgWatermark" name="pdfOrgWatermark" class="h-8 px-3 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none" placeholder="যেমন: CONFIDENTIAL / TechHat" data-i18n-placeholder-bn="যেমন: CONFIDENTIAL / TechHat" data-i18n-placeholder-en="e.g. CONFIDENTIAL / TechHat" />
              </div>
            </div>

            <div class="pdf-pages-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3" id="pdfOrgPagesGrid"></div>

            <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
              <div class="pdf-summary-pill text-xs font-bold text-slate-700 dark:text-studio-text" id="pdfOrgSummary">মোট ০ পৃষ্ঠা</div>
              <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" id="pdfOrgRunBtn">
                <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                <span data-i18n-bn="সাজানো PDF ডাউনলোড করুন" data-i18n-en="Save & Download PDF">সাজানো PDF ডাউনলোড করুন</span>
              </button>
            </div>
          </div>
        </div>

      <!-- ========================================== 5. PDF TO OTHERS WORKSPACE -->
        <div class="pdf-pane space-y-4" id="pdf-pane-pdf2other" hidden={initialTab !== 'pdf2other'}>
          <!-- Top Bar: Title + Quick File Actions -->
          <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200/80 dark:border-studio-border">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center shrink-0">
                <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="m12 12 3 3-3 3"/></svg>
              </div>
              <div class="min-w-0">
                <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0 leading-tight" data-i18n-bn="PDF কনভার্টার স্টুডিও" data-i18n-en="PDF Converter Studio">PDF কনভার্টার স্টুডিও</h1>
                <p class="text-xs text-slate-500 dark:text-studio-muted m-0 mt-0.5 truncate" data-i18n-bn="২ডি কলাম লেআউট, বিজয়/ইউনিকোড ফন্ট ফিক্স ও AI OCR সহ Word, Text এবং HD ছবিতে রূপান্তর" data-i18n-en="Convert PDF to editable Word, clean Unicode Text, or HD Images with 2D layout & AI OCR">২ডি কলাম লেআউট, বিজয়/ইউনিকোড ফন্ট ফিক্স ও AI OCR সহ Word, Text এবং HD ছবিতে রূপান্তর</p>
              </div>
            </div>
            <div class="pdf-ws-actions flex items-center flex-wrap gap-1.5" id="pdfToOtherTopActions" hidden>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-colors" id="pdfToOtherSelectAllBtn">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                <span data-i18n-bn="সব পৃষ্ঠা সিলেক্ট" data-i18n-en="Select All Pages">সব পৃষ্ঠা সিলেক্ট</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-colors" id="pdfToOtherRotLeftAll" title="সব পৃষ্ঠা বামে ঘোরান" aria-label="সব পৃষ্ঠা বামে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span class="hidden sm:inline" data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-colors" id="pdfToOtherRotRightAll" title="সব পৃষ্ঠা ডানে ঘোরান" aria-label="সব পৃষ্ঠা ডানে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span class="hidden sm:inline" data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
              </button>
              <button type="button" class="chip-btn chip-btn--danger inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-500/20 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none transition-colors" id="pdfToOtherResetBtn">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span data-i18n-bn="অন্য ফাইল নিন" data-i18n-en="Choose Another File">অন্য ফাইল নিন</span>
              </button>
            </div>
          </div>

          <!-- Always-Visible Target Format Switcher Bar -->
          <fieldset class="pdf-fieldset border-0 p-0 m-0" aria-label="আউটপুট ফরম্যাট নির্বাচন">
            <legend class="sr-only" data-i18n-bn="কোন ফরম্যাটে রূপান্তর করতে চান?" data-i18n-en="Select Output Format">কোন ফরম্যাটে রূপান্তর করতে চান?</legend>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <!-- Format 1: Word (.doc) -->
              <label class="group relative flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-studio-panel/50 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-white dark:hover:bg-studio-panel hover:border-slate-300 dark:hover:border-slate-600 has-[:checked]:bg-white dark:has-[:checked]:bg-studio-sidebar has-[:checked]:border-emerald-600 dark:has-[:checked]:border-studio-primary has-[:checked]:ring-1 has-[:checked]:ring-emerald-600/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                <input type="radio" name="pdfToOtherFmt" value="doc" checked class="sr-only" />
                <div class="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/><path d="M8 9h2"/></svg>
                </div>
                <span class="flex flex-col min-w-0 flex-1">
                  <span class="flex items-center justify-between gap-1.5">
                    <strong class="text-xs sm:text-sm font-bold text-slate-900 dark:text-studio-text truncate" data-i18n-bn="Word ডকুমেন্ট" data-i18n-en="Word Document">Word ডকুমেন্ট</strong>
                    <span translate="no" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">.DOC</span>
                  </span>
                  <small class="text-[11px] text-slate-500 dark:text-studio-muted mt-0.5 leading-snug line-clamp-2" data-i18n-bn="২ডি কলাম লেআউট, টেবিল ও বিজয়/ইউনিকোড ফিক্স" data-i18n-en="2D column layout, tables & Bijoy/Unicode fix">২ডি কলাম লেআউট, টেবিল ও বিজয়/ইউনিকোড ফিক্স</small>
                </span>
              </label>

              <!-- Format 2: Text (.txt) -->
              <label class="group relative flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-studio-panel/50 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-white dark:hover:bg-studio-panel hover:border-slate-300 dark:hover:border-slate-600 has-[:checked]:bg-white dark:has-[:checked]:bg-studio-sidebar has-[:checked]:border-emerald-600 dark:has-[:checked]:border-studio-primary has-[:checked]:ring-1 has-[:checked]:ring-emerald-600/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                <input type="radio" name="pdfToOtherFmt" value="txt" class="sr-only" />
                <div class="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
                </div>
                <span class="flex flex-col min-w-0 flex-1">
                  <span class="flex items-center justify-between gap-1.5">
                    <strong class="text-xs sm:text-sm font-bold text-slate-900 dark:text-studio-text truncate" data-i18n-bn="টেক্সট ফাইল" data-i18n-en="Plain Text">টেক্সট ফাইল</strong>
                    <span translate="no" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 shrink-0">.TXT</span>
                  </span>
                  <small class="text-[11px] text-slate-500 dark:text-studio-muted mt-0.5 leading-snug line-clamp-2" data-i18n-bn="নির্ভুল ইউনিকোড বাংলা ও ইংরেজি প্লেইন টেক্সট" data-i18n-en="Clean Unicode Bangla & English plain text">নির্ভুল ইউনিকোড বাংলা ও ইংরেজি প্লেইন টেক্সট</small>
                </span>
              </label>

              <!-- Format 3: JPG Images -->
              <label class="group relative flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-studio-panel/50 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-white dark:hover:bg-studio-panel hover:border-slate-300 dark:hover:border-slate-600 has-[:checked]:bg-white dark:has-[:checked]:bg-studio-sidebar has-[:checked]:border-emerald-600 dark:has-[:checked]:border-studio-primary has-[:checked]:ring-1 has-[:checked]:ring-emerald-600/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                <input type="radio" name="pdfToOtherFmt" value="jpg" class="sr-only" />
                <div class="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>
                <span class="flex flex-col min-w-0 flex-1">
                  <span class="flex items-center justify-between gap-1.5">
                    <strong class="text-xs sm:text-sm font-bold text-slate-900 dark:text-studio-text truncate" data-i18n-bn="JPG ইমেজ" data-i18n-en="JPG Images">JPG ইমেজ</strong>
                    <span translate="no" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">.JPG</span>
                  </span>
                  <small class="text-[11px] text-slate-500 dark:text-studio-muted mt-0.5 leading-snug line-clamp-2" data-i18n-bn="প্রতিটি পৃষ্ঠা আলাদা হাই-রেজোলিউশন ছবি" data-i18n-en="Each page exported as high-resolution JPG">প্রতিটি পৃষ্ঠা আলাদা হাই-রেজোলিউশন ছবি</small>
                </span>
              </label>

              <!-- Format 4: PNG Images -->
              <label class="group relative flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-studio-panel/50 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-white dark:hover:bg-studio-panel hover:border-slate-300 dark:hover:border-slate-600 has-[:checked]:bg-white dark:has-[:checked]:bg-studio-sidebar has-[:checked]:border-emerald-600 dark:has-[:checked]:border-studio-primary has-[:checked]:ring-1 has-[:checked]:ring-emerald-600/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                <input type="radio" name="pdfToOtherFmt" value="png" class="sr-only" />
                <div class="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 16l5-5 4 4 5-6 4 5"/></svg>
                </div>
                <span class="flex flex-col min-w-0 flex-1">
                  <span class="flex items-center justify-between gap-1.5">
                    <strong class="text-xs sm:text-sm font-bold text-slate-900 dark:text-studio-text truncate" data-i18n-bn="PNG ইমেজ" data-i18n-en="PNG Images">PNG ইমেজ</strong>
                    <span translate="no" class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0">.PNG</span>
                  </span>
                  <small class="text-[11px] text-slate-500 dark:text-studio-muted mt-0.5 leading-snug line-clamp-2" data-i18n-bn="শার্প টেক্সট ও লসলেস প্রিন্ট কোয়ালিটি ছবি" data-i18n-en="Sharp lossless PNG graphics per page">শার্প টেক্সট ও লসলেস প্রিন্ট কোয়ালিটি ছবি</small>
                </span>
              </label>
            </div>
          </fieldset>

          <!-- Empty State Dropzone -->
          <label class="pdf-dropzone group flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/60 dark:bg-studio-panel/40 hover:border-emerald-500 dark:hover:border-studio-primary hover:bg-emerald-500/[0.02] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 cursor-pointer transition-colors" id="pdfToOtherDropzone" for="pdfToOtherInput">
            <input type="file" id="pdfToOtherInput" accept=".pdf,application/pdf" class="visually-hidden sr-only" />
            <div class="pdf-dropzone__icon w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3.5">
              <svg class="w-6.5 h-6.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M20 16.7A4.5 4.5 0 0 0 17.5 8h-1.1A7 7 0 1 0 4 14.9"/></svg>
            </div>
            <div class="pdf-dropzone__title text-base font-bold text-slate-900 dark:text-studio-text mb-1.5" id="pdfToOtherDropTitle" data-i18n-bn="কনভার্ট করার জন্য PDF ফাইল এখানে ছাড়ুন অথবা ব্রাউজ করুন" data-i18n-en="Drop a PDF file here or click to browse">কনভার্ট করার জন্য PDF ফাইল এখানে ছাড়ুন অথবা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">ব্রাউজ করুন</span></div>
            <p class="text-xs text-slate-500 dark:text-studio-muted m-0 mb-3.5 max-w-xl" id="pdfToOtherDropSub" data-i18n-bn="বিজয় (SutonnyMJ) ও ইউনিকোড বাংলা ফন্ট, ২-কলাম প্রশ্নপত্র, টেবিল এবং স্ক্যান করা PDF স্বয়ংক্রিয়ভাবে শনাক্ত হবে" data-i18n-en="Automatically detects Bijoy & Unicode Bangla fonts, 2-column layouts, tables, and scanned PDFs">বিজয় (SutonnyMJ) ও ইউনিকোড বাংলা ফন্ট, ২-কলাম প্রশ্নপত্র, টেবিল এবং স্ক্যান করা PDF স্বয়ংক্রিয়ভাবে শনাক্ত হবে</p>
            <div class="flex items-center justify-center flex-wrap gap-1.5" aria-hidden="true">
              <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">PDF → Word (.doc)</span>
              <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">PDF → Text (.txt)</span>
              <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">PDF → JPG / PNG</span>
              <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">২ডি লেআউট + AI OCR</span>
            </div>
          </label>

          <!-- 2-Column Studio Workspace Stage -->
          <div class="pdf-workspace-stage" id="pdfToOtherStage" hidden>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

              <!-- LEFT COLUMN (8 cols): Framed Canvas for Pages & Live Output Preview -->
              <div class="lg:col-span-8 rounded-2xl bg-slate-50/70 dark:bg-studio-panel/40 border border-slate-200 dark:border-studio-border overflow-hidden">
                <!-- Canvas Header Bar: File Info + View Mode Switcher -->
                <div class="flex items-center justify-between flex-wrap gap-2.5 px-3.5 py-2.5 bg-white dark:bg-studio-sidebar border-b border-slate-200 dark:border-studio-border">
                  <div class="flex items-center gap-2.5 min-w-0 flex-1" id="pdfToOtherFileInfo"></div>

                  <!-- Canvas View Switcher (Pages vs Converted Output) -->
                  <div class="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200/80 dark:border-studio-border" id="pdfToOtherCanvasTabs" hidden role="tablist">
                    <button type="button" role="tab" aria-selected="false" class="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-studio-muted cursor-pointer transition-colors" id="pdfToOtherTabPagesBtn" data-p2o-view="pages">
                      <span data-i18n-bn="মূল পৃষ্ঠাসমূহ" data-i18n-en="Source Pages">মূল পৃষ্ঠাসমূহ</span>
                    </button>
                    <button type="button" role="tab" aria-selected="true" class="px-2.5 py-1 rounded-md text-xs font-bold bg-white dark:bg-studio-sidebar text-emerald-600 dark:text-studio-primary shadow-2xs cursor-pointer transition-colors" id="pdfToOtherTabOutputBtn" data-p2o-view="output">
                      <span data-i18n-bn="কনভার্ট প্রিভিউ ও এডিটর" data-i18n-en="Converted Output">কনভার্ট প্রিভিউ ও এডিটর</span>
                    </button>
                  </div>
                </div>

                <!-- View 1: Selectable Source PDF Pages Grid -->
                <div id="pdfToOtherPagesWrap" class="p-3.5 space-y-3">
                  <div class="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600 dark:text-studio-muted px-0.5">
                    <span data-i18n-bn="যে পৃষ্ঠাগুলো কনভার্ট করতে চান সেগুলোতে টিক দিন (ডিফল্টভাবে সব পৃষ্ঠা নির্বাচিত):" data-i18n-en="Click pages to select or deselect for conversion (all pages selected by default):">যে পৃষ্ঠাগুলো কনভার্ট করতে চান সেগুলোতে টিক দিন (ডিফল্টভাবে সব পৃষ্ঠা নির্বাচিত):</span>
                    <span class="font-bold text-slate-800 dark:text-studio-text tabular-nums" id="pdfToOtherSelBadge"></span>
                  </div>
                  <div class="pdf-pages-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" id="pdfToOtherPagesGrid"></div>
                </div>

                <!-- View 2: Converted Output Preview / Rich Document Editor / Split Compare -->
                <div class="pdf-convert-preview p-3.5 text-xs" id="pdfToOtherPreview" hidden></div>
              </div>

              <!-- RIGHT COLUMN (4 cols): Sticky Inspector & Action Panel -->
              <aside class="lg:col-span-4 lg:sticky lg:top-20 rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border divide-y divide-slate-200 dark:divide-studio-border shadow-2xs" aria-label="কনভার্সন সেটিংস">

                <!-- Inspector Header: Active Format & Scope -->
                <div class="p-3.5 flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="text-[11px] font-semibold text-slate-500 dark:text-studio-muted" data-i18n-bn="টার্গেট আউটপুট ফরম্যাট" data-i18n-en="Target Output Format">টার্গেট আউটপুট ফরম্যাট</div>
                    <div class="text-sm font-bold text-slate-900 dark:text-studio-text mt-0.5 flex items-center gap-1.5" id="pdfToOtherActiveFmtLabel">Word ডকুমেন্ট (.doc)</div>
                  </div>
                  <span translate="no" class="px-2 py-1 rounded-md text-xs font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 tabular-nums" id="pdfToOtherActiveFmtBadge">.DOC</span>
                </div>

                <!-- Contextual Settings A: Image DPI (Only for JPG / PNG) -->
                <div class="p-3.5 space-y-2.5" id="pdfToImgDpiWrap" hidden>
                  <fieldset class="pdf-fieldset border-0 p-0 m-0">
                    <legend class="text-xs font-bold text-slate-800 dark:text-studio-text mb-2" data-i18n-bn="ছবির রেজোলিউশন (Image DPI)" data-i18n-en="Image Resolution (DPI)">ছবির রেজোলিউশন (Image DPI)</legend>
                    <div class="grid grid-cols-3 gap-1.5">
                      <label class="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-center hover:border-slate-300 has-[:checked]:bg-emerald-500/10 has-[:checked]:border-emerald-600 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfImgScale" value="1.5" class="sr-only" />
                        <strong translate="no" class="text-xs font-extrabold tabular-nums">150 DPI</strong>
                        <span class="text-[10px] text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="ওয়েব / দ্রুত" data-i18n-en="Standard">ওয়েব / দ্রুত</span>
                      </label>
                      <label class="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-center hover:border-slate-300 has-[:checked]:bg-emerald-500/10 has-[:checked]:border-emerald-600 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfImgScale" value="2.2" checked class="sr-only" />
                        <strong translate="no" class="text-xs font-extrabold tabular-nums">220 DPI</strong>
                        <span class="text-[10px] text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="হাই এইচডি" data-i18n-en="High HD">হাই এইচডি</span>
                      </label>
                      <label class="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-center hover:border-slate-300 has-[:checked]:bg-emerald-500/10 has-[:checked]:border-emerald-600 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfImgScale" value="3.0" class="sr-only" />
                        <strong translate="no" class="text-xs font-extrabold tabular-nums">300 DPI</strong>
                        <span class="text-[10px] text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="আল্ট্রা প্রিন্ট" data-i18n-en="Ultra Print">আল্ট্রা প্রিন্ট</span>
                      </label>
                    </div>
                  </fieldset>
                </div>

                <!-- Contextual Settings B: Smart 2D Layout & OCR Engine (Only for Word / Text) -->
                <div class="p-3.5 space-y-3.5" id="pdfToTextOcrWrap">
                  <fieldset class="pdf-fieldset border-0 p-0 m-0">
                    <legend class="text-xs font-bold text-slate-800 dark:text-studio-text mb-2 flex items-center justify-between w-full">
                      <span data-i18n-bn="লেখা ও ফন্ট উদ্ধারের ইঞ্জিন" data-i18n-en="Text & Font Recovery Engine">লেখা ও ফন্ট উদ্ধারের ইঞ্জিন</span>
                      <span translate="no" class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">2D + AI OCR</span>
                    </legend>
                    <div class="space-y-1.5 text-xs">
                      <label class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-studio-panel/50 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-slate-50 has-[:checked]:bg-emerald-500/[0.06] has-[:checked]:border-emerald-600 dark:has-[:checked]:border-studio-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfOcrMode" value="auto" checked class="mt-0.5 accent-emerald-600 shrink-0" />
                        <span class="flex flex-col min-w-0">
                          <span class="flex items-center gap-1.5 flex-wrap">
                            <strong class="font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="স্মার্ট অটো + ২ডি লেআউট" data-i18n-en="Smart Auto + 2D Layout">স্মার্ট অটো + ২ডি লেআউট</strong>
                            <span class="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold" data-i18n-bn="প্রস্তাবিত" data-i18n-en="Recommended">প্রস্তাবিত</span>
                          </span>
                          <small class="text-[11px] text-slate-500 dark:text-studio-muted mt-0.5 leading-snug" data-i18n-bn="বিজয়/ইউনিকোড ফন্ট ও কলাম ঠিক রাখবে এবং স্ক্যান পেজে অটো OCR চালাবে" data-i18n-en="Fixes Bijoy/Unicode fonts & 2-col layout; auto-runs OCR on scanned pages">বিজয়/ইউনিকোড ফন্ট ও কলাম ঠিক রাখবে এবং স্ক্যান পেজে অটো OCR চালাবে</small>
                        </span>
                      </label>

                      <label class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-studio-panel/50 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-slate-50 has-[:checked]:bg-emerald-500/[0.06] has-[:checked]:border-emerald-600 dark:has-[:checked]:border-studio-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfOcrMode" value="force" class="mt-0.5 accent-emerald-600 shrink-0" />
                        <span class="flex flex-col min-w-0">
                          <strong class="font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="সব পৃষ্ঠায় ফোর্স AI OCR" data-i18n-en="Force AI OCR on All Pages">সব পৃষ্ঠায় ফোর্স AI OCR</strong>
                          <small class="text-[11px] text-slate-500 dark:text-studio-muted mt-0.5 leading-snug" data-i18n-bn="স্ক্যান করা ছবি বা ভাঙা ফন্টের PDF থেকে সরাসরি ছবি পড়ে লেখা তুলবে" data-i18n-en="Reads every page visually with AI OCR — best for scanned PDFs">স্ক্যান করা ছবি বা ভাঙা ফন্টের PDF থেকে সরাসরি ছবি পড়ে লেখা তুলবে</small>
                        </span>
                      </label>

                      <label class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-studio-panel/50 border border-slate-200 dark:border-studio-border cursor-pointer hover:bg-slate-50 has-[:checked]:bg-emerald-500/[0.06] has-[:checked]:border-emerald-600 dark:has-[:checked]:border-studio-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfOcrMode" value="fast" class="mt-0.5 accent-emerald-600 shrink-0" />
                        <span class="flex flex-col min-w-0">
                          <strong class="font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="শুধু টেক্সট ও ফন্ট ফিক্স (দ্রুত)" data-i18n-en="Fast Text & Font Fix Only">শুধু টেক্সট ও ফন্ট ফিক্স (দ্রুত)</strong>
                          <small class="text-[11px] text-slate-500 dark:text-studio-muted mt-0.5 leading-snug" data-i18n-bn="OCR ছাড়া তাৎক্ষণিক ২ডি লেআউট ও বিজয়/ইউনিকোড কনভার্সন" data-i18n-en="Instant 2D layout & Bijoy/Unicode repair without OCR">OCR ছাড়া তাৎক্ষণিক ২ডি লেআউট ও বিজয়/ইউনিকোড কনভার্সন</small>
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <fieldset class="pdf-fieldset border-0 p-0 m-0" id="pdfOcrLangFieldset">
                    <legend class="text-xs font-bold text-slate-800 dark:text-studio-text mb-1.5" data-i18n-bn="ডকুমেন্টের ভাষা (OCR Language)" data-i18n-en="Document OCR Language">ডকুমেন্টের ভাষা (OCR Language)</legend>
                    <div class="grid grid-cols-3 gap-1.5 text-xs">
                      <label class="flex items-center justify-center py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-center font-semibold text-slate-700 dark:text-studio-text hover:border-slate-300 has-[:checked]:bg-emerald-500/10 has-[:checked]:border-emerald-600 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfOcrLang" value="ben+eng" checked class="sr-only" />
                        <span data-i18n-bn="বাংলা + ইং" data-i18n-en="Ban + Eng">বাংলা + ইং</span>
                      </label>
                      <label class="flex items-center justify-center py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-center font-semibold text-slate-700 dark:text-studio-text hover:border-slate-300 has-[:checked]:bg-emerald-500/10 has-[:checked]:border-emerald-600 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfOcrLang" value="ben" class="sr-only" />
                        <span data-i18n-bn="শুধু বাংলা" data-i18n-en="Bangla">শুধু বাংলা</span>
                      </label>
                      <label class="flex items-center justify-center py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border cursor-pointer text-center font-semibold text-slate-700 dark:text-studio-text hover:border-slate-300 has-[:checked]:bg-emerald-500/10 has-[:checked]:border-emerald-600 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 transition-colors">
                        <input type="radio" name="pdfOcrLang" value="eng" class="sr-only" />
                        <span data-i18n-bn="শুধু ইংরেজি" data-i18n-en="English">শুধু ইংরেজি</span>
                      </label>
                    </div>
                  </fieldset>
                </div>

                <!-- Primary Action & Status Footer -->
                <div class="p-3.5 space-y-3 bg-slate-50/50 dark:bg-studio-panel/30 rounded-b-2xl">
                  <label class="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-studio-muted select-none">
                    <input type="checkbox" id="pdfToOtherAutoDl" checked class="accent-emerald-600 rounded" />
                    <span data-i18n-bn="কনভার্ট শেষে স্বয়ংক্রিয়ভাবে ফাইল ডাউনলোড করুন" data-i18n-en="Auto-download file when conversion finishes">কনভার্ট শেষে স্বয়ংক্রিয়ভাবে ফাইল ডাউনলোড করুন</span>
                  </label>

                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-500 dark:text-studio-muted" data-i18n-bn="স্ট্যাটাস:" data-i18n-en="Status:">স্ট্যাটাস:</span>
                    <span class="pdf-summary-pill font-bold text-slate-800 dark:text-studio-text tabular-nums" id="pdfToOtherSummary" aria-live="polite" data-i18n-bn="প্রস্তুত" data-i18n-en="Ready">প্রস্তুত</span>
                  </div>

                  <button type="button" class="btn btn--primary pdf-main-action w-full inline-flex items-center justify-center gap-2 h-10.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold border-0 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-colors" id="pdfToOtherRunBtn">
                    <svg class="w-4 h-4 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>
                    <span id="pdfToOtherRunBtnLabel" data-i18n-bn="কনভার্ট ও প্রিভিউ দেখুন" data-i18n-en="Convert & Preview">কনভার্ট ও প্রিভিউ দেখুন</span>
                  </button>
                </div>

              </aside>
            </div>
          </div>
        </div>

      <!-- ========================================== 6. OTHERS TO PDF WORKSPACE -->
        <div class="pdf-pane space-y-3.5" id="pdf-pane-other2pdf" hidden={initialTab !== 'other2pdf'}>
          <div class="pdf-ws-head">
            <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0" data-i18n-bn="ফাইল → PDF (JPG / PNG / Word / PowerPoint / Excel / Text → PDF)" data-i18n-en="Convert Images, Office Files & Text to PDF">ফাইল → PDF (JPG / PNG / Word / PowerPoint / Excel / Text → PDF)</h1>
          </div>

          <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
            <fieldset class="pdf-fieldset border-0 p-0 m-0">
              <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-2" data-i18n-bn="উৎস নির্বাচন করুন (Source Type)" data-i18n-en="Select Source Type">উৎস নির্বাচন করুন (Source Type)</legend>
              <div class="pdf-radio-cards grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                  <input type="radio" name="otherToPdfMode" value="img2pdf" checked class="mt-1 accent-emerald-600" />
                  <span class="pdf-radio-card__body flex flex-col">
                    <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="ছবি থেকে PDF (JPG / PNG / WebP → PDF)" data-i18n-en="Images to PDF (JPG / PNG / WebP → PDF)">ছবি থেকে PDF (JPG / PNG / WebP → PDF)</strong>
                    <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="এক বা একাধিক ছবি সাজিয়ে PDF ফাইল বানান" data-i18n-en="Arrange one or more images into a PDF file">এক বা একাধিক ছবি সাজিয়ে PDF ফাইল বানান</small>
                  </span>
                </label>
                <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                  <input type="radio" name="otherToPdfMode" value="doc2pdf" class="mt-1 accent-emerald-600" />
                  <span class="pdf-radio-card__body flex flex-col">
                    <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="অফিস ফাইল / টেক্সট / লেখা → PDF" data-i18n-en="Office File / Text → PDF">অফিস ফাইল / টেক্সট / লেখা → PDF</strong>
                    <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn=".docx, .doc, .pptx, .xlsx, .txt আপলোড করুন বা সরাসরি লিখে PDF বানান" data-i18n-en="Upload .docx, .doc, .pptx, .xlsx, .txt or type text directly to create a PDF">.docx, .doc, .pptx, .xlsx, .txt আপলোড করুন বা সরাসরি লিখে PDF বানান</small>
                  </span>
                </label>
              </div>
            </fieldset>
          </div>

          <!-- Sub-view 6A: Images to PDF -->
          <div id="other2pdfImgBox" class="space-y-4">
            <label class="pdf-dropzone flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel/50 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-colors" id="img2pdfDropzone" for="img2pdfInput">
              <input type="file" id="img2pdfInput" accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.bmp" multiple class="visually-hidden sr-only" />
              <div class="pdf-dropzone__icon w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3">
                <svg class="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              </div>
              <div class="pdf-dropzone__title text-sm font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="একাধিক ছবি (JPG, PNG, WebP) এখানে ছাড়ুন বা ব্রাউজ করুন" data-i18n-en="Drop multiple images (JPG, PNG, WebP) here or click to browse">একাধিক ছবি (JPG, PNG, WebP) এখানে ছাড়ুন বা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">ব্রাউজ করুন</span></div>
            </label>

            <div class="pdf-workspace-stage pdf-drop-target space-y-4" id="img2pdfStage" hidden>
              <div class="pdf-ws-actions flex items-center justify-end flex-wrap gap-1.5">
                <label class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer" for="img2pdfAddMore">
                  <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                  <span data-i18n-bn="আরও ছবি যোগ করুন" data-i18n-en="Add More Images">আরও ছবি যোগ করুন</span>
                  <input type="file" id="img2pdfAddMore" accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,.jpg,.jpeg,.png,.webp,.gif,.bmp" multiple class="visually-hidden sr-only" />
                </label>
                <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="img2pdfRotAll" title="সব ছবি ডানে ঘোরান">
                  <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  <span data-i18n-bn="সব ঘোরান" data-i18n-en="Rotate All">সব ঘোরান</span>
                </button>
                <button type="button" class="chip-btn chip-btn--danger h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer" id="img2pdfClearBtn" data-i18n-bn="সব ছবি মুছুন" data-i18n-en="Clear All Images">সব ছবি মুছুন</button>
              </div>

              <div class="pdf-options-box pdf-img-settings grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
                <div class="pdf-field-group flex flex-col gap-1">
                  <label for="img2pdfPageSize" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="পেজ সাইজ:" data-i18n-en="Page Size:">পেজ সাইজ:</label>
                  <select id="img2pdfPageSize" name="img2pdfPageSize" class="h-8 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none">
                    <option value="a4" selected>A4 (210 × 297 mm)</option>
                    <option value="letter">US Letter</option>
                    <option value="fit" data-i18n-bn="ছবির অরিজিনাল সাইজ (Fit to Image)" data-i18n-en="Fit to Image">ছবির অরিজিনাল সাইজ (Fit to Image)</option>
                  </select>
                </div>
                <div class="pdf-field-group flex flex-col gap-1">
                  <label for="img2pdfOrient" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="ওরিয়েন্টেশন:" data-i18n-en="Orientation:">ওরিয়েন্টেশন:</label>
                  <select id="img2pdfOrient" name="img2pdfOrient" class="h-8 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none">
                    <option value="portrait" selected data-i18n-bn="পোর্ট্রেট (Portrait)" data-i18n-en="Portrait">পোর্ট্রেট (Portrait)</option>
                    <option value="landscape" data-i18n-bn="ল্যান্ডস্কেপ (Landscape)" data-i18n-en="Landscape">ল্যান্ডস্কেপ (Landscape)</option>
                    <option value="auto" data-i18n-bn="অটো (ছবির মাপ অনুযায়ী)" data-i18n-en="Auto (Match Image)">অটো (ছবির মাপ অনুযায়ী)</option>
                  </select>
                </div>
                <div class="pdf-field-group flex flex-col gap-1">
                  <label for="img2pdfMargin" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="মার্জিন:" data-i18n-en="Margin:">মার্জিন:</label>
                  <select id="img2pdfMargin" name="img2pdfMargin" class="h-8 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none">
                    <option value="0" data-i18n-bn="কোনো মার্জিন নেই" data-i18n-en="No Margin">কোনো মার্জিন নেই</option>
                    <option value="24" selected data-i18n-bn="ছোট মার্জিন" data-i18n-en="Small Margin">ছোট মার্জিন</option>
                    <option value="48" data-i18n-bn="বড় মার্জিন" data-i18n-en="Large Margin">বড় মার্জিন</option>
                  </select>
                </div>
              </div>

              <div class="pdf-pages-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3" id="img2pdfGrid"></div>

              <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
                <div class="pdf-summary-pill text-xs font-bold text-slate-700 dark:text-studio-text" id="img2pdfSummary">০টি ছবি</div>
                <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" id="img2pdfRunBtn">
                  <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                  <span data-i18n-bn="PDF তৈরি ও ডাউনলোড করুন" data-i18n-en="Create & Download PDF">PDF তৈরি ও ডাউনলোড করুন</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Sub-view 6B: Office / Text to PDF -->
          <div id="other2pdfDocBox" class="space-y-4" hidden>
            <div class="pdf-doc-upload-bar flex items-center flex-wrap gap-3 p-3 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
              <label class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer" for="doc2pdfInput">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                <span data-i18n-bn="অফিস ফাইল সরাসরি PDF করুন" data-i18n-en="Upload Office File to PDF">অফিস ফাইল সরাসরি PDF করুন</span>
                <input type="file" id="doc2pdfInput" accept=".docx,.doc,.pptx,.xlsx,.txt,.md,.csv,.rtf" class="visually-hidden sr-only" />
              </label>
              <span class="pdf-doc-hint text-xs text-slate-500 dark:text-studio-muted" id="doc2pdfFileName" data-i18n-bn=".docx / .doc / .pptx / .xlsx ফাইল দিলে লেআউটসহ সরাসরি PDF ডাউনলোড হবে — অথবা নিচের বক্সে লিখুন" data-i18n-en="Upload .docx / .doc / .pptx / .xlsx to convert directly to PDF — or type text below">.docx / .doc / .pptx / .xlsx ফাইল দিলে লেআউটসহ সরাসরি PDF ডাউনলোড হবে — অথবা নিচের বক্সে লিখুন</span>
            </div>

            <div class="pdf-options-box pdf-img-settings grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
              <div class="pdf-field-group flex flex-col gap-1">
                <label for="doc2pdfFont" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="ফন্ট নির্বাচন:" data-i18n-en="Font:">ফন্ট নির্বাচন:</label>
                <select id="doc2pdfFont" name="doc2pdfFont" class="h-8 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none">
                  <option value="unicode" selected data-i18n-bn="ইউনিকোড বাংলা ও ইংরেজি" data-i18n-en="Unicode Bangla & English">ইউনিকোড বাংলা ও ইংরেজি</option>
                  <option value="bijoy" data-i18n-bn="বিজয় ফন্ট (SutonnyMJ)" data-i18n-en="Bijoy Font (SutonnyMJ)">বিজয় ফন্ট (SutonnyMJ)</option>
                </select>
              </div>
              <div class="pdf-field-group flex flex-col gap-1">
                <label for="doc2pdfFontSize" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="ফন্ট সাইজ:" data-i18n-en="Font Size:">ফন্ট সাইজ:</label>
                <select id="doc2pdfFontSize" name="doc2pdfFontSize" class="h-8 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none">
                  <option value="11" data-i18n-bn="ছোট (11 pt)" data-i18n-en="Small (11 pt)">ছোট (11 pt)</option>
                  <option value="13" selected data-i18n-bn="মাঝারি (13 pt)" data-i18n-en="Medium (13 pt)">মাঝারি (13 pt)</option>
                  <option value="16" data-i18n-bn="বড় (16 pt)" data-i18n-en="Large (16 pt)">বড় (16 pt)</option>
                  <option value="20" data-i18n-bn="শিরোনাম (20 pt)" data-i18n-en="Heading (20 pt)">শিরোনাম (20 pt)</option>
                </select>
              </div>
              <div class="pdf-field-group flex flex-col gap-1">
                <label for="doc2pdfTitle" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="ডকুমেন্ট শিরোনাম (ঐচ্ছিক):" data-i18n-en="Document Title (optional):">ডকুমেন্ট শিরোনাম (ঐচ্ছিক):</label>
                <input type="text" id="doc2pdfTitle" name="doc2pdfTitle" class="h-8 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none" placeholder="যেমন: দাপ্তরিক চিঠি / প্রতিবেদন" data-i18n-placeholder-bn="যেমন: দাপ্তরিক চিঠি / প্রতিবেদন" data-i18n-placeholder-en="e.g. Official Letter / Report" />
              </div>
            </div>

            <div class="pdf-field-group flex flex-col gap-1.5">
              <label for="doc2pdfText" class="text-xs font-semibold text-slate-700 dark:text-studio-text" data-i18n-bn="ডকুমেন্টের বিস্তারিত লেখা:" data-i18n-en="Document Content:">ডকুমেন্টের বিস্তারিত লেখা:</label>
              <textarea id="doc2pdfText" class="textbox pdf-doc-textarea w-full rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-3 text-sm text-slate-900 dark:text-studio-text outline-none focus:border-emerald-500" rows="8" placeholder="এখানে আপনার লেখা পেস্ট করুন বা লিখুন…" data-i18n-placeholder-bn="এখানে আপনার লেখা পেস্ট করুন বা লিখুন…" data-i18n-placeholder-en="Type or paste your text here…"></textarea>
            </div>

            <div class="pdf-action-bar flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border">
              <div class="pdf-summary-pill text-xs font-bold text-slate-700 dark:text-studio-text" id="doc2pdfSummary" data-i18n-bn="A4 প্রিন্ট রেডি PDF" data-i18n-en="A4 Print-Ready PDF">A4 প্রিন্ট রেডি PDF</div>
              <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" id="doc2pdfRunBtn">
                <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                <span data-i18n-bn="লেখা থেকে PDF তৈরি করুন" data-i18n-en="Create PDF from Text">লেখা থেকে PDF তৈরি করুন</span>
              </button>
            </div>
          </div>
        </div>

      <!-- ========================================== 7. DECRYPT PDF WORKSPACE -->
        <div class="pdf-pane space-y-3.5" id="pdf-pane-decrypt" hidden={initialTab !== 'decrypt'}>
          <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center shrink-0">
                <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
              </div>
              <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0 leading-tight" data-i18n-bn="ডিক্রিপ্ট ও আনলক PDF (Decrypt PDF)" data-i18n-en="Decrypt & Unlock PDF">ডিক্রিপ্ট ও আনলক PDF (Decrypt PDF)</h1>
            </div>
            <div class="pdf-ws-actions flex items-center flex-wrap gap-1.5" id="pdfDecryptTopActions" hidden>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfDecryptRotLeftAll" title="সব পৃষ্ঠা বামে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfDecryptRotRightAll" title="সব পৃষ্ঠা ডানে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
              </button>
              <button type="button" class="chip-btn chip-btn--danger h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer" id="pdfDecryptResetBtn" data-i18n-bn="অন্য ফাইল নিন" data-i18n-en="Choose Another File">অন্য ফাইল নিন</button>
            </div>
          </div>

          <label class="pdf-dropzone group flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-gradient-to-b from-slate-50/60 to-slate-100/40 dark:from-studio-panel/40 dark:to-studio-panel/70 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-all" id="pdfDecryptDropzone" for="pdfDecryptInput">
            <input type="file" id="pdfDecryptInput" accept=".pdf,application/pdf" class="visually-hidden sr-only" />
            <div class="pdf-dropzone__icon w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3.5 shadow-2xs group-hover:scale-105 transition-transform">
              <svg class="w-7 h-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            </div>
            <div class="pdf-dropzone__title text-base font-bold text-slate-900 dark:text-studio-text mb-1.5" data-i18n-bn="লক বা পাসওয়ার্ড দেওয়া PDF ফাইল এখানে ছাড়ুন অথবা সিলেক্ট করুন" data-i18n-en="Drop a password or permission-locked PDF here or click to browse">লক বা পাসওয়ার্ড দেওয়া PDF ফাইল এখানে ছাড়ুন অথবা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">সিলেক্ট করুন</span></div>
            <p class="text-xs text-slate-500 dark:text-studio-muted m-0 max-w-xl" data-i18n-bn="প্রিন্ট/কপি/এডিট পারমিশন লক ও স্ট্যান্ডার্ড পাসওয়ার্ড ছাড়াই অটো-আনলক হবে এবং চাইলে নতুন ইউজার পাসওয়ার্ড সেট করতে পারবেন" data-i18n-en="Automatically removes permission/owner locks & standard passwords without requiring a password, and lets you set a new user password">প্রিন্ট/কপি/এডিট পারমিশন লক ও স্ট্যান্ডার্ড পাসওয়ার্ড ছাড়াই অটো-আনলক হবে এবং চাইলে নতুন ইউজার পাসওয়ার্ড সেট করতে পারবেন</p>
          </label>

          <div class="pdf-workspace-stage space-y-4" id="pdfDecryptStage" hidden>
            <div class="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25 space-y-2.5" id="pdfDecryptStatusCard"></div>

            <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-3.5">
              <fieldset class="pdf-fieldset border-0 p-0 m-0">
                <legend class="pdf-legend text-xs font-bold text-slate-700 dark:text-studio-text mb-2" data-i18n-bn="আউটপুট মোড নির্বাচন করুন" data-i18n-en="Select Output Action">আউটপুট মোড নির্বাচন করুন</legend>
                <div class="pdf-radio-cards grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                    <input type="radio" name="pdfDecryptAction" value="unlock" checked class="mt-1 accent-emerald-600" />
                    <span class="pdf-radio-card__body flex flex-col">
                      <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="সম্পূর্ণ পাসওয়ার্ডমুক্ত করুন (Unlocked PDF)" data-i18n-en="Remove All Passwords & Restrictions (Unlocked PDF)">সম্পূর্ণ পাসওয়ার্ডমুক্ত করুন (Unlocked PDF)</strong>
                      <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="সব ধরনের পাসওয়ার্ড ও প্রিন্ট/কপি/এডিট লক স্থায়ীভাবে সরিয়ে ডাউনলোড করুন" data-i18n-en="Permanently strip all open passwords and print/copy/edit restrictions">সব ধরনের পাসওয়ার্ড ও প্রিন্ট/কপি/এডিট লক স্থায়ীভাবে সরিয়ে ডাউনলোড করুন</small>
                    </span>
                  </label>
                  <label class="pdf-radio-card flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer has-[:checked]:border-emerald-500">
                    <input type="radio" name="pdfDecryptAction" value="reencrypt" class="mt-1 accent-emerald-600" />
                    <span class="pdf-radio-card__body flex flex-col">
                      <strong class="text-xs font-bold text-slate-900 dark:text-studio-text" data-i18n-bn="আনলক করে নতুন ইউজার পাসওয়ার্ড সেট করুন" data-i18n-en="Unlock & Set New User Password">আনলক করে নতুন ইউজার পাসওয়ার্ড সেট করুন</strong>
                      <small class="text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="আগের লক সরিয়ে আপনার নিজের নতুন পাসওয়ার্ড দিয়ে ফাইলটি সুরক্ষিত করুন" data-i18n-en="Strip existing lock and protect the PDF with your own new user password">আগের লক সরিয়ে আপনার নিজের নতুন পাসওয়ার্ড দিয়ে ফাইলটি সুরক্ষিত করুন</small>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div class="pt-3 border-t border-slate-200 dark:border-studio-border space-y-3" id="pdfDecryptNewPwdBox" hidden>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <label for="pdfDecryptNewUserPwd" class="text-xs font-bold text-slate-700 dark:text-studio-text" data-i18n-bn="নতুন ইউজার পাসওয়ার্ড (ফাইল খুলতে লাগবে):" data-i18n-en="New User Password (required to open PDF):">নতুন ইউজার পাসওয়ার্ড (ফাইল খুলতে লাগবে):</label>
                    <div class="relative">
                      <input type="password" id="pdfDecryptNewUserPwd" class="w-full h-9 pl-3 pr-9 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs text-slate-900 dark:text-studio-text outline-none focus:border-emerald-500" placeholder="নতুন পাসওয়ার্ড লিখুন…" data-i18n-placeholder-bn="নতুন পাসওয়ার্ড লিখুন…" data-i18n-placeholder-en="Enter new user password…" autocomplete="new-password" />
                      <button type="button" id="pdfDecryptNewPwdToggle" class="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded text-slate-400 hover:text-slate-700 dark:hover:text-studio-text flex items-center justify-center cursor-pointer bg-transparent border-0" aria-label="Show/Hide Password">
                        <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-col justify-end gap-1.5">
                    <span class="text-xs font-bold text-slate-700 dark:text-studio-text" data-i18n-bn="পারমিশন সেটিংস:" data-i18n-en="Permissions:">পারমিশন সেটিংস:</span>
                    <div class="flex items-center flex-wrap gap-3 text-xs text-slate-700 dark:text-studio-text">
                      <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" id="pdfDecryptAllowPrint" checked class="accent-emerald-600" /> <span data-i18n-bn="প্রিন্ট অনুমতি" data-i18n-en="Allow Print">প্রিন্ট অনুমতি</span></label>
                      <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" id="pdfDecryptAllowCopy" checked class="accent-emerald-600" /> <span data-i18n-bn="কপি অনুমতি" data-i18n-en="Allow Copy">কপি অনুমতি</span></label>
                      <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="checkbox" id="pdfDecryptAllowModify" checked class="accent-emerald-600" /> <span data-i18n-bn="এডিট অনুমতি" data-i18n-en="Allow Edit">এডিট অনুমতি</span></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pdf-pages-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3" id="pdfDecryptPagesGrid"></div>

            <div class="pdf-action-bar sticky bottom-3 z-20 flex items-center justify-between flex-wrap gap-3 p-3.5 px-4 rounded-2xl bg-white/95 dark:bg-studio-sidebar/95 backdrop-blur-md border border-emerald-500/35 shadow-lg">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <div class="pdf-summary-pill text-xs sm:text-sm font-bold text-slate-800 dark:text-studio-text" id="pdfDecryptSummary">মোট ০ পৃষ্ঠা</div>
              </div>
              <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold border-0 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all" id="pdfDecryptRunBtn">
                <svg class="w-4 h-4 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                <span id="pdfDecryptRunBtnLabel" data-i18n-bn="আনলক ও ডাউনলোড করুন" data-i18n-en="Decrypt & Download PDF">আনলক ও ডাউনলোড করুন</span>
              </button>
            </div>
          </div>
        </div>

      <!-- ========================================== 8. ENCRYPT PDF WORKSPACE -->
        <div class="pdf-pane space-y-3.5" id="pdf-pane-encrypt" hidden={initialTab !== 'encrypt'}>
          <div class="pdf-ws-head flex items-center justify-between flex-wrap gap-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center shrink-0">
                <svg class="w-4.5 h-4.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h1 class="pdf-ws-title text-base sm:text-lg font-bold text-slate-900 dark:text-studio-text m-0 leading-tight" data-i18n-bn="এনক্রিপ্ট ও পাসওয়ার্ড লক PDF (Encrypt PDF)" data-i18n-en="Encrypt & Password Protect PDF">এনক্রিপ্ট ও পাসওয়ার্ড লক PDF (Encrypt PDF)</h1>
            </div>
            <div class="pdf-ws-actions flex items-center flex-wrap gap-1.5" id="pdfEncryptTopActions" hidden>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfEncryptRotLeftAll" title="সব পৃষ্ঠা বামে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
              </button>
              <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" id="pdfEncryptRotRightAll" title="সব পৃষ্ঠা ডানে ঘোরান">
                <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                <span data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
              </button>
              <button type="button" class="chip-btn chip-btn--danger h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer" id="pdfEncryptResetBtn" data-i18n-bn="অন্য ফাইল নিন" data-i18n-en="Choose Another File">অন্য ফাইল নিন</button>
            </div>
          </div>

          <label class="pdf-dropzone group flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-studio-border bg-gradient-to-b from-slate-50/60 to-slate-100/40 dark:from-studio-panel/40 dark:to-studio-panel/70 hover:border-emerald-500 dark:hover:border-studio-primary cursor-pointer transition-all" id="pdfEncryptDropzone" for="pdfEncryptInput">
            <input type="file" id="pdfEncryptInput" accept=".pdf,application/pdf" class="visually-hidden sr-only" />
            <div class="pdf-dropzone__icon w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-studio-primary flex items-center justify-center mb-3.5 shadow-2xs group-hover:scale-105 transition-transform">
              <svg class="w-7 h-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div class="pdf-dropzone__title text-base font-bold text-slate-900 dark:text-studio-text mb-1.5" data-i18n-bn="পাসওয়ার্ড লক দেওয়ার জন্য একটি PDF ফাইল ছাড়ুন অথবা সিলেক্ট করুন" data-i18n-en="Drop a PDF file here or click to protect with a password">পাসওয়ার্ড লক দেওয়ার জন্য একটি PDF ফাইল ছাড়ুন অথবা <span class="link-ish text-emerald-600 dark:text-studio-primary underline">সিলেক্ট করুন</span></div>
            <p class="text-xs text-slate-500 dark:text-studio-muted m-0 max-w-xl" data-i18n-bn="১২৮-বিট স্ট্যান্ডার্ড এনক্রিপশনে ইউজার পাসওয়ার্ড ও প্রিন্ট/কপি/এডিট পারমিশন লক সেট করুন (আগের লক থাকলে তা স্বয়ংক্রিয়ভাবে খুলে নতুন পাসওয়ার্ড বসবে)" data-i18n-en="Set 128-bit Standard User Password and print/copy/edit permission locks (any existing lock is automatically removed first)">১২৮-বিট স্ট্যান্ডার্ড এনক্রিপশনে ইউজার পাসওয়ার্ড ও প্রিন্ট/কপি/এডিট পারমিশন লক সেট করুন (আগের লক থাকলে তা স্বয়ংক্রিয়ভাবে খুলে নতুন পাসওয়ার্ড বসবে)</p>
          </label>

          <div class="pdf-workspace-stage space-y-4" id="pdfEncryptStage" hidden>
            <div class="pdf-file-banner p-3 rounded-xl bg-slate-100 dark:bg-studio-panel text-xs font-semibold text-slate-700 dark:text-studio-text flex items-center gap-3" id="pdfEncryptFileInfo"></div>

            <div class="pdf-options-box p-4 rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <label for="pdfEncryptUserPwd" class="text-xs font-bold text-slate-800 dark:text-studio-text" data-i18n-bn="ইউজার পাসওয়ার্ড (ফাইল ওপেন করতে লাগবে):" data-i18n-en="User Password (required to open PDF):">ইউজার পাসওয়ার্ড (ফাইল ওপেন করতে লাগবে):</label>
                    <span id="pdfEncryptStrength" class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-studio-sidebar text-slate-600 dark:text-studio-muted" data-i18n-bn="পাসওয়ার্ড দিন" data-i18n-en="Enter password">পাসওয়ার্ড দিন</span>
                  </div>
                  <div class="relative">
                    <input type="password" id="pdfEncryptUserPwd" class="w-full h-10 pl-3.5 pr-10 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs sm:text-sm text-slate-900 dark:text-studio-text outline-none focus:border-emerald-500 transition-colors" placeholder="ইউজার পাসওয়ার্ড লিখুন…" data-i18n-placeholder-bn="ইউজার পাসওয়ার্ড লিখুন…" data-i18n-placeholder-en="Enter user password to lock PDF…" autocomplete="new-password" />
                    <button type="button" id="pdfEncryptUserPwdToggle" class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-studio-text flex items-center justify-center cursor-pointer bg-transparent border-0" aria-label="Show/Hide Password">
                      <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                  <small class="text-[11px] text-slate-500 dark:text-studio-muted" data-i18n-bn="এই পাসওয়ার্ড ছাড়া কেউ PDF ফাইলটি ওপেন করতে পারবে না (শুধু পারমিশন লক দিতে চাইলে ফাঁকা রাখতে পারেন)" data-i18n-en="Anyone opening the PDF will be asked for this password (leave empty for permission-only lock)">এই পাসওয়ার্ড ছাড়া কেউ PDF ফাইলটি ওপেন করতে পারবে না (শুধু পারমিশন লক দিতে চাইলে ফাঁকা রাখতে পারেন)</small>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label for="pdfEncryptOwnerPwd" class="text-xs font-bold text-slate-800 dark:text-studio-text" data-i18n-bn="মাস্টার / ওনার পাসওয়ার্ড (ঐচ্ছিক):" data-i18n-en="Master / Owner Password (optional):">মাস্টার / ওনার পাসওয়ার্ড (ঐচ্ছিক):</label>
                  <div class="relative">
                    <input type="password" id="pdfEncryptOwnerPwd" class="w-full h-10 pl-3.5 pr-10 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs sm:text-sm text-slate-900 dark:text-studio-text outline-none focus:border-emerald-500 transition-colors" placeholder="ফাঁকা রাখলে স্বয়ংক্রিয় মাস্টার কী ব্যবহৃত হবে…" data-i18n-placeholder-bn="ফাঁকা রাখলে স্বয়ংক্রিয় মাস্টার কী ব্যবহৃত হবে…" data-i18n-placeholder-en="Leave blank for automatic master security key…" autocomplete="new-password" />
                    <button type="button" id="pdfEncryptOwnerPwdToggle" class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-studio-text flex items-center justify-center cursor-pointer bg-transparent border-0" aria-label="Show/Hide Owner Password">
                      <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                  <small class="text-[11px] text-slate-500 dark:text-studio-muted" data-i18n-bn="ফাঁকা রাখলে আমাদের Decrypt PDF টুলে পরে পাসওয়ার্ড ছাড়াই আবার আনলক করতে পারবেন" data-i18n-en="If left blank, you can unlock it anytime in our Decrypt PDF tool without needing the password">ফাঁকা রাখলে আমাদের Decrypt PDF টুলে পরে পাসওয়ার্ড ছাড়াই আবার আনলক করতে পারবেন</small>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-200 dark:border-studio-border">
                <div class="text-xs font-bold text-slate-700 dark:text-studio-text mb-2" data-i18n-bn="ডকুমেন্ট পারমিশন (ফাইল খোলার পর ইউজার কী কী করতে পারবে):" data-i18n-en="Document Permissions (what users can do after opening):">ডকুমেন্ট পারমিশন (ফাইল খোলার পর ইউজার কী কী করতে পারবে):</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer text-xs font-semibold text-slate-800 dark:text-studio-text has-[:checked]:border-emerald-500">
                    <input type="checkbox" id="pdfEncryptAllowPrint" checked class="accent-emerald-600" />
                    <span data-i18n-bn="প্রিন্ট করার অনুমতি (Allow Print)" data-i18n-en="Allow Printing">প্রিন্ট করার অনুমতি (Allow Print)</span>
                  </label>
                  <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer text-xs font-semibold text-slate-800 dark:text-studio-text has-[:checked]:border-emerald-500">
                    <input type="checkbox" id="pdfEncryptAllowCopy" class="accent-emerald-600" />
                    <span data-i18n-bn="টেক্সট ও ছবি কপি (Allow Copy)" data-i18n-en="Allow Copying Text & Images">টেক্সট ও ছবি কপি (Allow Copy)</span>
                  </label>
                  <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border cursor-pointer text-xs font-semibold text-slate-800 dark:text-studio-text has-[:checked]:border-emerald-500">
                    <input type="checkbox" id="pdfEncryptAllowModify" class="accent-emerald-600" />
                    <span data-i18n-bn="এডিট ও পেজ পরিবর্তন (Allow Edit)" data-i18n-en="Allow Modifying & Assembly">এডিট ও পেজ পরিবর্তন (Allow Edit)</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="pdf-pages-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3" id="pdfEncryptPagesGrid"></div>

            <div class="pdf-action-bar sticky bottom-3 z-20 flex items-center justify-between flex-wrap gap-3 p-3.5 px-4 rounded-2xl bg-white/95 dark:bg-studio-sidebar/95 backdrop-blur-md border border-emerald-500/35 shadow-lg">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <div class="pdf-summary-pill text-xs sm:text-sm font-bold text-slate-800 dark:text-studio-text" id="pdfEncryptSummary">মোট ০ পৃষ্ঠা</div>
              </div>
              <button type="button" class="btn btn--primary pdf-main-action inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold border-0 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all" id="pdfEncryptRunBtn">
                <svg class="w-4 h-4 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span data-i18n-bn="পাসওয়ার্ড দিয়ে লক ও ডাউনলোড করুন" data-i18n-en="Encrypt & Download PDF">পাসওয়ার্ড দিয়ে লক ও ডাউনলোড করুন</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  </section>

  <!-- Merge: per-file multi-page viewer -->
  <dialog class="pdf-dialog m-auto w-[min(896px,calc(100vw-24px))] max-w-4xl rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-5 text-slate-900 dark:text-studio-text shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs" id="pdfPagesDialog" closedby="any" aria-labelledby="pdfPagesDialogTitle">
    <div class="pdf-dialog__head flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-studio-border">
      <div class="min-w-0">
        <h3 class="pdf-dialog__title text-base font-bold m-0 truncate" id="pdfPagesDialogTitle">সব পৃষ্ঠা</h3>
        <p class="pdf-dialog__sub text-xs text-slate-500 dark:text-studio-muted mt-0.5 mb-0" id="pdfPagesDialogSub"></p>
      </div>
      <div class="pdf-ws-actions flex items-center gap-1.5 shrink-0">
        <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold hover:border-emerald-500 cursor-pointer transition-colors" id="pdfPagesDlgRotL" title="সব পৃষ্ঠা বামে ঘোরান">
          <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span data-i18n-bn="সব বামে" data-i18n-en="Rotate Left">সব বামে</span>
        </button>
        <button type="button" class="chip-btn inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold hover:border-emerald-500 cursor-pointer transition-colors" id="pdfPagesDlgRotR" title="সব পৃষ্ঠা ডানে ঘোরান">
          <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          <span data-i18n-bn="সব ডানে" data-i18n-en="Rotate Right">সব ডানে</span>
        </button>
        <button type="button" class="ai-close pdf-dialog__close w-8 h-8 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center cursor-pointer transition-colors" id="pdfPagesDlgClose" aria-label="Close">
          <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <div class="pdf-dialog__body max-h-[65vh] overflow-y-auto p-1">
      <div class="pdf-pages-grid pdf-pages-grid--dialog grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" id="pdfPagesDialogGrid"></div>
    </div>
    <div class="pdf-dialog__foot flex justify-end pt-3 mt-4 border-t border-slate-200 dark:border-studio-border">
      <button type="button" class="btn btn--primary h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors" id="pdfPagesDlgDone" data-i18n-bn="সম্পন্ন" data-i18n-en="Done">সম্পন্ন</button>
    </div>
  </dialog>

  <!-- Large page preview / before-after quality comparison -->
  <dialog class="pdf-dialog pdf-dialog--wide m-auto w-[min(1024px,calc(100vw-24px))] max-w-5xl rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-5 text-slate-900 dark:text-studio-text shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs" id="pdfPreviewDialog" closedby="any" aria-labelledby="pdfPreviewTitle">
    <div class="pdf-dialog__head flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-studio-border">
      <div class="min-w-0">
        <h3 class="pdf-dialog__title text-base font-bold m-0 truncate" id="pdfPreviewTitle">প্রিভিউ</h3>
        <p class="pdf-dialog__sub text-xs text-slate-500 dark:text-studio-muted mt-0.5 mb-0" id="pdfPreviewSub"></p>
      </div>
      <div class="pdf-ws-actions flex flex-wrap items-center gap-1.5 shrink-0">
        <div class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-0.5 mr-1">
          <button type="button" class="w-7 h-7 rounded-md text-slate-700 dark:text-studio-text hover:bg-white dark:hover:bg-studio-surface hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors" id="pdfPreviewZoomOut" title="Zoom Out (−)" aria-label="Zoom Out">
            <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>
          </button>
          <button type="button" class="px-2 h-7 rounded-md text-[11px] font-extrabold text-slate-700 dark:text-studio-text hover:bg-white dark:hover:bg-studio-surface hover:text-emerald-600 flex items-center justify-center cursor-pointer transition-colors min-w-[46px]" id="pdfPreviewZoomReset" title="Reset Zoom (100%)" aria-label="Reset Zoom">100%</button>
          <button type="button" class="w-7 h-7 rounded-md text-slate-700 dark:text-studio-text hover:bg-white dark:hover:bg-studio-surface hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors" id="pdfPreviewZoomIn" title="Zoom In (+)" aria-label="Zoom In">
            <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-7-7h14"/></svg>
          </button>
        </div>
        <button type="button" class="chip-btn inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors" id="pdfPreviewPrev" aria-label="Previous page">
          <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          <span data-i18n-bn="আগের" data-i18n-en="Prev">আগের</span>
        </button>
        <span class="pdf-summary-pill text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-studio-panel" id="pdfPreviewCounter">১ / ১</span>
        <button type="button" class="chip-btn inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors" id="pdfPreviewNext" aria-label="Next page">
          <span data-i18n-bn="পরের" data-i18n-en="Next">পরের</span>
          <svg class="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <button type="button" class="ai-close pdf-dialog__close w-8 h-8 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center cursor-pointer transition-colors" id="pdfPreviewClose" aria-label="Close">
          <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <div class="pdf-dialog__body h-[70vh] w-full rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border overflow-auto p-4 flex">
      <div class="pdf-preview-stage m-auto flex items-center justify-center" id="pdfPreviewStage"></div>
    </div>
  </dialog>
</div>

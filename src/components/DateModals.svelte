<script lang="ts">
  // Date Grid & AI Insights Modals (Pure Tailwind v4, SPA-ready)
</script>

<!-- GRID PICKER MODAL (Day & Month Selection) -->
<div
  class="modal-ov fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
  id="gridModalOverlay"
  hidden
  aria-hidden="true"
>
  <div
    class="modal-box w-full max-w-md rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-2xl p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="gridTitle"
  >
    <div class="modal-head flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-studio-border">
      <div class="modal-title-grp">
        <span class="modal-title block text-sm font-bold text-slate-900 dark:text-studio-text" id="gridTitle" data-i18n-bn="নির্বাচন করুন" data-i18n-en="Select">নির্বাচন করুন</span>
        <span class="modal-sub block text-xs text-slate-500 dark:text-studio-muted mt-0.5" id="gridSub">মাস ও সাল</span>
      </div>
      <button
        type="button"
        class="close-btn w-8 h-8 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-600 dark:text-studio-muted hover:text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
        id="gridCloseBtn"
        aria-label="বন্ধ করুন"
      >✕</button>
    </div>
    <div class="cal-days-header grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 dark:text-studio-muted mb-2" id="calHeader">
      <div class="text-rose-500" data-i18n-bn="রবি" data-i18n-en="Sun">রবি</div>
      <div data-i18n-bn="সোম" data-i18n-en="Mon">সোম</div>
      <div data-i18n-bn="মঙ্গল" data-i18n-en="Tue">মঙ্গল</div>
      <div data-i18n-bn="বুধ" data-i18n-en="Wed">বুধ</div>
      <div data-i18n-bn="বৃহঃ" data-i18n-en="Thu">বৃহঃ</div>
      <div class="text-emerald-600 dark:text-studio-primary" data-i18n-bn="শুক্র" data-i18n-en="Fri">শুক্র</div>
      <div data-i18n-bn="শনি" data-i18n-en="Sat">শনি</div>
    </div>
    <div class="grid-grid grid gap-1.5" id="gridContent"></div>
  </div>
</div>

<!-- INSIGHTS & HOROSCOPE MODAL -->
<div
  class="ai-modal fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
  id="aiModal"
  hidden
>
  <div
    class="ai-sheet w-full max-w-lg rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-2xl p-5"
    role="dialog"
    aria-modal="true"
    aria-labelledby="aiTitle"
  >
    <div class="ai-head flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-studio-border">
      <div class="ai-title text-base font-bold text-emerald-600 dark:text-studio-primary" id="aiTitle">✦ বিস্তারিত তথ্য</div>
      <button
        type="button"
        class="ai-close w-8 h-8 rounded-lg border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-slate-600 dark:text-studio-muted hover:text-rose-500 flex items-center justify-center cursor-pointer transition-colors"
        id="aiCloseBtn"
        aria-label="বন্ধ করুন"
      >✕</button>
    </div>
    <div class="ai-content text-sm text-slate-700 dark:text-studio-text leading-relaxed [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1.5" id="aiContent"></div>
  </div>
</div>

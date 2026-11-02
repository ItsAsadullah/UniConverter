<script lang="ts">
  // Calendar Converter Tool (Pure Tailwind v4, SPA-ready)
</script>

<div class="tool-view w-full" id="tool-calendar" data-cal-mode="en">
  <section class="card util-card rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xs p-4 sm:p-6" aria-label="তারিখ কনভার্টার">
    <div class="cal-mode-tabs flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border mb-5 max-w-md mx-auto" role="tablist" aria-label="ক্যালেন্ডার মোড">
      <button
        class="cal-mode-tab active flex-1 h-9 rounded-lg text-xs font-bold text-slate-600 dark:text-studio-muted bg-transparent border-0 cursor-pointer transition-colors [&.active]:bg-emerald-600 dark:[&.active]:bg-studio-primary [&.active]:text-white dark:[&.active]:text-slate-950"
        type="button"
        data-cal-set-mode="EN"
        id="tEN"
        data-i18n-bn="ইংরেজি"
        data-i18n-en="English (Gregorian)"
      >ইংরেজি</button>
      <button
        class="cal-mode-tab flex-1 h-9 rounded-lg text-xs font-bold text-slate-600 dark:text-studio-muted bg-transparent border-0 cursor-pointer transition-colors [&.active]:bg-emerald-600 dark:[&.active]:bg-studio-primary [&.active]:text-white dark:[&.active]:text-slate-950"
        type="button"
        data-cal-set-mode="BN"
        id="tBN"
        data-i18n-bn="বাংলা"
        data-i18n-en="Bangla"
      >বাংলা</button>
      <button
        class="cal-mode-tab flex-1 h-9 rounded-lg text-xs font-bold text-slate-600 dark:text-studio-muted bg-transparent border-0 cursor-pointer transition-colors [&.active]:bg-emerald-600 dark:[&.active]:bg-studio-primary [&.active]:text-white dark:[&.active]:text-slate-950"
        type="button"
        data-cal-set-mode="HJ"
        id="tHJ"
        data-i18n-bn="আরবি / হিজরি"
        data-i18n-en="Arabic / Hijri"
      >আরবি / হিজরি</button>
    </div>

    <div class="util-body grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      <div class="picker-area rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-4 flex flex-col justify-center">
        <div class="picker-heads grid grid-cols-3 gap-3 text-center text-xs font-bold text-slate-500 dark:text-studio-muted mb-2">
          <span data-i18n-bn="দিন" data-i18n-en="Day">দিন</span>
          <span data-i18n-bn="মাস" data-i18n-en="Month">মাস</span>
          <span data-i18n-bn="সাল" data-i18n-en="Year">সাল</span>
        </div>
        <div class="p-row grid grid-cols-3 gap-3">
          <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="boxD">
            <button type="button" class="arr-btn w-full h-8 border-0 bg-transparent text-slate-400 hover:text-emerald-600 dark:hover:text-studio-primary hover:bg-slate-100 dark:hover:bg-studio-surface cursor-pointer text-xs transition-colors" data-cal-upd="d:1" aria-label="দিন বাড়ান">▲</button>
            <div class="mid-area w-full py-3 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="d" data-ref="txtD" title="ক্যালেন্ডার গ্রিড দেখতে ক্লিক করুন">
              <div class="val-disp text-2xl font-bold text-slate-900 dark:text-studio-text" id="txtD">০১</div>
            </div>
            <button type="button" class="arr-btn w-full h-8 border-0 bg-transparent text-slate-400 hover:text-emerald-600 dark:hover:text-studio-primary hover:bg-slate-100 dark:hover:bg-studio-surface cursor-pointer text-xs transition-colors" data-cal-upd="d:-1" aria-label="দিন কমান">▼</button>
          </div>

          <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="boxM">
            <button type="button" class="arr-btn w-full h-8 border-0 bg-transparent text-slate-400 hover:text-emerald-600 dark:hover:text-studio-primary hover:bg-slate-100 dark:hover:bg-studio-surface cursor-pointer text-xs transition-colors" data-cal-upd="m:1" aria-label="মাস বাড়ান">▲</button>
            <div class="mid-area w-full py-3 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="m" data-ref="txtM" title="মাস নির্বাচন করতে ক্লিক করুন">
              <div class="val-disp small text-lg font-bold text-slate-900 dark:text-studio-text truncate px-1" id="txtM">Jan</div>
            </div>
            <button type="button" class="arr-btn w-full h-8 border-0 bg-transparent text-slate-400 hover:text-emerald-600 dark:hover:text-studio-primary hover:bg-slate-100 dark:hover:bg-studio-surface cursor-pointer text-xs transition-colors" data-cal-upd="m:-1" aria-label="মাস কমান">▼</button>
          </div>

          <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="boxY">
            <button type="button" class="arr-btn w-full h-8 border-0 bg-transparent text-slate-400 hover:text-emerald-600 dark:hover:text-studio-primary hover:bg-slate-100 dark:hover:bg-studio-surface cursor-pointer text-xs transition-colors" data-cal-upd="y:1" aria-label="সাল বাড়ান">▲</button>
            <div class="mid-area w-full py-3 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-cal-edit-y title="সাল লিখতে ক্লিক করুন">
              <div class="val-disp text-2xl font-bold text-slate-900 dark:text-studio-text" id="txtY">২০২৬</div>
              <input type="number" class="num-inp hidden w-20 text-center text-lg font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="yearInp" />
            </div>
            <button type="button" class="arr-btn w-full h-8 border-0 bg-transparent text-slate-400 hover:text-emerald-600 dark:hover:text-studio-primary hover:bg-slate-100 dark:hover:bg-studio-surface cursor-pointer text-xs transition-colors" data-cal-upd="y:-1" aria-label="সাল কমান">▼</button>
          </div>
        </div>
      </div>

      <div class="res-sec rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-5 flex flex-col justify-between gap-4">
        <div class="res-block text-center">
          <div class="res-lbl text-xs font-semibold text-slate-500 dark:text-studio-muted mb-1" id="lblMain" data-i18n-bn="বাংলা তারিখ" data-i18n-en="Bangla Date">বাংলা তারিখ</div>
          <div class="main-date text-2xl font-extrabold text-emerald-600 dark:text-studio-primary" id="resMain">...</div>
          <div class="meta-pill inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-studio-primary text-xs font-semibold" id="resMeta">...</div>
        </div>
        <div class="res-divider h-px bg-slate-200 dark:bg-studio-border"></div>
        <div class="res-block text-center">
          <div class="res-lbl text-xs font-semibold text-slate-500 dark:text-studio-muted mb-1" id="lblSec" data-i18n-bn="হিজরি তারিখ" data-i18n-en="Hijri Date">হিজরি তারিখ</div>
          <div class="sec-date text-lg font-bold text-slate-900 dark:text-studio-text" id="resSec">...</div>
          <div class="adj-box mt-2.5 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-studio-muted">
            <span data-i18n-bn="চাঁদ দেখা সমন্বয়:" data-i18n-en="Moon Sighting Adj.:">চাঁদ দেখা সমন্বয়:</span>
            <select class="adj-sel h-8 px-2.5 rounded-lg bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border text-xs font-medium text-slate-800 dark:text-studio-text outline-none" id="hjAdj">
              <option value="-2" data-i18n-bn="-২ দিন" data-i18n-en="-2 Days">-২ দিন</option>
              <option value="-1" data-i18n-bn="-১ দিন" data-i18n-en="-1 Day">-১ দিন</option>
              <option value="0" selected data-i18n-bn="অটো (০)" data-i18n-en="Auto (0)">অটো (০)</option>
              <option value="1" data-i18n-bn="+১ দিন" data-i18n-en="+1 Day">+১ দিন</option>
              <option value="2" data-i18n-bn="+২ দিন" data-i18n-en="+2 Days">+২ দিন</option>
            </select>
          </div>
        </div>
        <button type="button" class="ai-btn w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border-0 cursor-pointer transition-colors" id="calOpenDetailBtn" data-cal-horoscope data-i18n-bn="✦ এই দিনের বিস্তারিত ও রাশিচক্র" data-i18n-en="✦ Date Details & Zodiac Insights">
          ✦ এই দিনের বিস্তারিত ও রাশিচক্র
        </button>
      </div>
    </div>
  </section>
</div>

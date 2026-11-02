<script lang="ts">
  // Date Duration Calculator Tool (Pure Tailwind v4, SPA-ready)
</script>

<div class="tool-view w-full" id="tool-datecalc">
  <section class="card util-card rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xs p-4 sm:p-6" aria-label="দিন গণনা">
    <div class="util-body grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      <div class="picker-area rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-4 flex flex-col justify-center gap-4">
        <div>
          <div class="sec-head text-xs font-bold text-slate-600 dark:text-studio-muted mb-2" data-i18n-bn="শুরুর তারিখ (Start Date)" data-i18n-en="Start Date">শুরুর তারিখ (Start Date)</div>
          <div class="p-row grid grid-cols-3 gap-3">
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="dcD">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="s:d:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="d" data-ref="dcD"><div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="dcD-txt">০১</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="s:d:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="dcM">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="s:m:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="m" data-ref="dcM"><div class="val-disp small text-base font-bold text-slate-900 dark:text-studio-text" id="dcM-txt">Jan</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="s:m:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="dcY">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="s:y:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-dc-edit-y>
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="dcY-txt">২০২৬</div>
                <input type="number" class="num-inp hidden w-20 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="dcY-inp" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="s:y:-1">▼</button>
            </div>
          </div>
        </div>

        <div class="mode-switch flex items-center justify-center gap-4 p-2 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border">
          <label class="radio-lbl inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-studio-text cursor-pointer">
            <input type="radio" name="dcDir" value="after" checked class="accent-emerald-600" />
            <span data-i18n-bn="পরে (যোগ)" data-i18n-en="After (Add)">পরে (যোগ)</span>
          </label>
          <label class="radio-lbl inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-studio-text cursor-pointer">
            <input type="radio" name="dcDir" value="before" class="accent-emerald-600" />
            <span data-i18n-bn="আগে (বিয়োগ)" data-i18n-en="Before (Subtract)">আগে (বিয়োগ)</span>
          </label>
        </div>

        <div>
          <div class="sec-head text-xs font-bold text-slate-600 dark:text-studio-muted mb-2" data-i18n-bn="সময়ের ব্যবধান (বছর - মাস - দিন)" data-i18n-en="Duration (Years - Months - Days)">সময়ের ব্যবধান (বছর - মাস - দিন)</div>
          <div class="p-row grid grid-cols-3 gap-3">
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="duY">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="c:y:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-dur-edit="y">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="duY-txt">০</div>
                <input type="number" class="num-inp hidden w-16 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="duY-inp" data-dur-inp="y" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="c:y:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="duM">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="c:m:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-dur-edit="m">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="duM-txt">০</div>
                <input type="number" class="num-inp hidden w-16 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="duM-inp" data-dur-inp="m" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="c:m:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="duD">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="c:d:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-dur-edit="d">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="duD-txt">০</div>
                <input type="number" class="num-inp hidden w-16 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="duD-inp" data-dur-inp="d" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-dc-upd="c:d:-1">▼</button>
            </div>
          </div>
        </div>
      </div>

      <div class="res-sec rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-5 flex flex-col justify-between gap-4 text-center">
        <div class="res-block my-auto">
          <div class="res-lbl text-xs font-semibold text-slate-500 dark:text-studio-muted mb-1" data-i18n-bn="ফলাফল তারিখ" data-i18n-en="Result Date">ফলাফল তারিখ</div>
          <div class="main-date text-2xl font-extrabold text-emerald-600 dark:text-studio-primary" id="dcResEn">...</div>
          <div class="sec-date sec-date--spaced text-sm font-medium text-slate-700 dark:text-studio-text mt-3" id="dcResBn">...</div>
        </div>
        <button type="button" class="ai-btn w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border-0 cursor-pointer transition-colors" data-dc-analysis data-i18n-bn="✦ সময়ের ব্যবধান বিশ্লেষণ" data-i18n-en="✦ Duration Analysis">
          ✦ সময়ের ব্যবধান বিশ্লেষণ
        </button>
      </div>
    </div>
  </section>
</div>

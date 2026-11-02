<script lang="ts">
  // Age Calculator & DOB Finder Tool (Pure Tailwind v4, SPA-ready)
</script>

<div class="tool-view w-full" id="tool-age">
  <section class="card util-card rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xs p-4 sm:p-6" aria-label="বয়স ম্যানেজার">
    <div class="sub-nav flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border mb-5 max-w-md mx-auto" role="tablist">
      <button
        type="button"
        class="sub-tab-btn active flex-1 h-9 rounded-lg text-xs font-bold text-slate-600 dark:text-studio-muted bg-transparent border-0 cursor-pointer transition-colors [&.active]:bg-emerald-600 dark:[&.active]:bg-studio-primary [&.active]:text-white dark:[&.active]:text-slate-950"
        id="at-calc"
        data-age-tab="calc"
        data-i18n-bn="বয়স নির্ণয়"
        data-i18n-en="Calculate Age"
      >বয়স নির্ণয়</button>
      <button
        type="button"
        class="sub-tab-btn flex-1 h-9 rounded-lg text-xs font-bold text-slate-600 dark:text-studio-muted bg-transparent border-0 cursor-pointer transition-colors [&.active]:bg-emerald-600 dark:[&.active]:bg-studio-primary [&.active]:text-white dark:[&.active]:text-slate-950"
        id="at-find"
        data-age-tab="find"
        data-i18n-bn="জন্মতারিখ বের করুন"
        data-i18n-en="Find Date of Birth"
      >জন্মতারিখ বের করুন</button>
    </div>

    <!-- Sub-view A: Age Calculator -->
    <div class="util-body grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch" id="av-calc">
      <div class="picker-area rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-4 flex flex-col justify-center gap-4">
        <div>
          <div class="sec-head text-xs font-bold text-slate-600 dark:text-studio-muted mb-2" data-i18n-bn="জন্ম তারিখ (Date of Birth)" data-i18n-en="Date of Birth">জন্ম তারিখ (Date of Birth)</div>
          <div class="p-row grid grid-cols-3 gap-3">
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="adD">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="dob:d:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="d" data-ref="adD"><div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="adD-txt">০১</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="dob:d:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="adM">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="dob:m:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="m" data-ref="adM"><div class="val-disp small text-base font-bold text-slate-900 dark:text-studio-text" id="adM-txt">Jan</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="dob:m:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="adY">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="dob:y:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-age-edit-y="dob">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="adY-txt">২০০০</div>
                <input type="number" class="num-inp hidden w-20 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="adY-inp" data-age-inp-y="dob" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="dob:y:-1">▼</button>
            </div>
          </div>
        </div>

        <div>
          <div class="sec-head text-xs font-bold text-slate-600 dark:text-studio-muted mb-2" data-i18n-bn="আজকের বা নির্দিষ্ট তারিখ" data-i18n-en="Age at the Date of">আজকের বা নির্দিষ্ট তারিখ</div>
          <div class="p-row grid grid-cols-3 gap-3">
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="arD">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="ref:d:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="d" data-ref="arD"><div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="arD-txt">০১</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="ref:d:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="arM">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="ref:m:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="m" data-ref="arM"><div class="val-disp small text-base font-bold text-slate-900 dark:text-studio-text" id="arM-txt">Jan</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="ref:m:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none [&.active]:border-emerald-500" id="arY">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="ref:y:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-age-edit-y="ref">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="arY-txt">২০২৬</div>
                <input type="number" class="num-inp hidden w-20 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="arY-inp" data-age-inp-y="ref" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="ref:y:-1">▼</button>
            </div>
          </div>
        </div>
      </div>

      <div class="res-sec rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-5 flex flex-col justify-between gap-4">
        <div class="res-block text-center">
          <div class="res-lbl text-xs font-semibold text-slate-500 dark:text-studio-muted mb-1" data-i18n-bn="বর্তমান বয়স" data-i18n-en="Calculated Age">বর্তমান বয়স</div>
          <div class="main-date main-date--age text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-studio-primary" id="age-main">...</div>
        </div>
        <div class="stats-grid grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div class="stat-item rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-2.5 text-center"><span class="stat-val block text-sm font-bold text-slate-900 dark:text-studio-text" id="st-month">0</span><span class="stat-lbl block text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="মোট মাস" data-i18n-en="Total Months">মোট মাস</span></div>
          <div class="stat-item rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-2.5 text-center"><span class="stat-val block text-sm font-bold text-slate-900 dark:text-studio-text" id="st-week">0</span><span class="stat-lbl block text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="মোট সপ্তাহ" data-i18n-en="Total Weeks">মোট সপ্তাহ</span></div>
          <div class="stat-item rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-2.5 text-center"><span class="stat-val block text-sm font-bold text-slate-900 dark:text-studio-text" id="st-day">0</span><span class="stat-lbl block text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="মোট দিন" data-i18n-en="Total Days">মোট দিন</span></div>
          <div class="stat-item rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-2.5 text-center"><span class="stat-val block text-sm font-bold text-slate-900 dark:text-studio-text" id="st-hour">0</span><span class="stat-lbl block text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="মোট ঘণ্টা" data-i18n-en="Total Hours">মোট ঘণ্টা</span></div>
          <div class="stat-item rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-2.5 text-center"><span class="stat-val block text-sm font-bold text-slate-900 dark:text-studio-text" id="st-min">0</span><span class="stat-lbl block text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="মোট মিনিট" data-i18n-en="Total Minutes">মোট মিনিট</span></div>
          <div class="stat-item rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border p-2.5 text-center"><span class="stat-val block text-sm font-bold text-slate-900 dark:text-studio-text" id="st-sec">0</span><span class="stat-lbl block text-xs text-slate-500 dark:text-studio-muted mt-0.5" data-i18n-bn="মোট সেকেন্ড" data-i18n-en="Total Seconds">মোট সেকেন্ড</span></div>
        </div>
        <button type="button" class="ai-btn w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border-0 cursor-pointer transition-colors" data-age-insights data-i18n-bn="✦ আপনার জন্ম ও জীবন পরিক্রমা" data-i18n-en="✦ Birth & Life Insights">
          ✦ আপনার জন্ম ও জীবন পরিক্রমা
        </button>
      </div>
    </div>

    <!-- Sub-view B: Find DOB from Age -->
    <div class="util-body grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch" id="av-find" hidden>
      <div class="picker-area rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-4 flex flex-col justify-center gap-4">
        <div>
          <div class="sec-head text-xs font-bold text-slate-600 dark:text-studio-muted mb-2" data-i18n-bn="আপনার বয়স কত? (বছর - মাস - দিন)" data-i18n-en="Enter Age (Years - Months - Days)">আপনার বয়স কত? (বছর - মাস - দিন)</div>
          <div class="p-row grid grid-cols-3 gap-3">
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="agY">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-rev-upd="y:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-rev-edit="y">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="agY-txt">০</div>
                <input type="number" class="num-inp hidden w-16 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="agY-inp" data-rev-inp="y" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-rev-upd="y:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="agM">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-rev-upd="m:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-rev-edit="m">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="agM-txt">০</div>
                <input type="number" class="num-inp hidden w-16 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="agM-inp" data-rev-inp="m" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-rev-upd="m:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="agD">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-rev-upd="d:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-rev-edit="d">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="agD-txt">০</div>
                <input type="number" class="num-inp hidden w-16 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="agD-inp" data-rev-inp="d" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-rev-upd="d:-1">▼</button>
            </div>
          </div>
        </div>

        <div>
          <div class="sec-head text-xs font-bold text-slate-600 dark:text-studio-muted mb-2" data-i18n-bn="কোন তারিখ অনুযায়ী?" data-i18n-en="Reference Date">কোন তারিখ অনুযায়ী?</div>
          <div class="p-row grid grid-cols-3 gap-3">
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="afD">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="fref:d:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="d" data-ref="afD"><div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="afD-txt">০১</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="fref:d:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="afM">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="fref:m:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-grid="m" data-ref="afM"><div class="val-disp small text-base font-bold text-slate-900 dark:text-studio-text" id="afM-txt">Jan</div></div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="fref:m:-1">▼</button>
            </div>
            <div class="swipe-box rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border flex flex-col items-center overflow-hidden select-none" id="afY">
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="fref:y:1">▲</button>
              <div class="mid-area w-full py-2.5 flex items-center justify-center cursor-pointer border-y border-slate-100 dark:border-studio-border/60" data-age-edit-y="fref">
                <div class="val-disp text-xl font-bold text-slate-900 dark:text-studio-text" id="afY-txt">২০২৬</div>
                <input type="number" class="num-inp hidden w-20 text-center text-base font-bold bg-transparent text-slate-900 dark:text-studio-text border border-emerald-500 rounded px-1 outline-none" id="afY-inp" data-age-inp-y="fref" />
              </div>
              <button type="button" class="arr-btn w-full h-7 border-0 bg-transparent text-slate-400 hover:text-emerald-600 cursor-pointer text-xs" data-age-upd="fref:y:-1">▼</button>
            </div>
          </div>
        </div>
      </div>

      <div class="res-sec rounded-xl bg-slate-50 dark:bg-studio-panel border border-slate-200 dark:border-studio-border p-5 flex flex-col justify-center gap-4 text-center">
        <div class="res-block">
          <div class="res-lbl text-xs font-semibold text-slate-500 dark:text-studio-muted mb-1" data-i18n-bn="আনুমানিক জন্মতারিখ" data-i18n-en="Estimated Date of Birth">আনুমানিক জন্মতারিখ</div>
          <div class="main-date main-date--age text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-studio-primary" id="dob-main">...</div>
          <div class="meta-pill inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-studio-primary text-xs font-semibold" id="dob-season">...</div>
        </div>
        <div class="res-divider h-px bg-slate-200 dark:bg-studio-border"></div>
        <div class="res-block space-y-1">
          <div class="sec-date text-base font-bold text-slate-900 dark:text-studio-text" id="dob-bn">...</div>
          <div class="sec-date sec-date--sub text-sm font-medium text-slate-600 dark:text-studio-muted" id="dob-hj">...</div>
        </div>
      </div>
    </div>
  </section>
</div>

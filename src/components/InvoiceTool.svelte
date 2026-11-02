<script lang="ts">
  // A4 Invoice Maker Tool (Pure Tailwind v4, SPA-ready)
</script>

<div class="tool-view w-full" id="tool-invoice">
  <section class="card util-card rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200 dark:border-studio-border shadow-xs p-4 sm:p-6" aria-label="ইনভয়েস জেনারেটর">
    <div class="inv-toolbar no-print flex items-center justify-between flex-wrap gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-studio-border">
      <div class="inv-toolbar__left flex items-center flex-wrap gap-3">
        <label class="inv-tool-chip inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-studio-muted">
          <span data-i18n-bn="মুদ্রা:" data-i18n-en="Currency:">মুদ্রা:</span>
          <select id="invCurrency" class="h-8.5 px-2.5 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-900 dark:text-studio-text outline-none">
            <option value="৳" selected>৳ BDT (টাকা)</option>
            <option value="$">$ USD (Dollar)</option>
            <option value="₹">₹ INR (Rupee)</option>
            <option value="€">€ EUR (Euro)</option>
            <option value="£">£ GBP (Pound)</option>
          </select>
        </label>
        <label class="inv-tool-btn inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" for="invLogoInput" title="প্রতিষ্ঠানের লোগো পরিবর্তন করুন">
          <span data-i18n-bn="🖼️ লোগো আপলোড" data-i18n-en="🖼️ Upload Logo">🖼️ লোগো আপলোড</span>
          <input type="file" id="invLogoInput" accept="image/*" hidden />
        </label>
        <button type="button" class="inv-tool-btn inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-studio-panel border border-slate-200 dark:border-studio-border text-xs font-semibold text-slate-700 dark:text-studio-text cursor-pointer hover:border-emerald-500 transition-colors" data-inv-add data-i18n-bn="+ নতুন আইটেম" data-i18n-en="+ Add Item">+ নতুন আইটেম</button>
      </div>
      <div class="inv-toolbar__right flex items-center gap-2">
        <button type="button" class="inv-tool-btn inv-tool-btn--ghost h-8.5 px-3 rounded-lg border border-slate-200 dark:border-studio-border bg-transparent text-xs font-semibold text-slate-600 dark:text-studio-muted hover:text-rose-500 cursor-pointer transition-colors" data-inv-reset title="নতুন বিল তৈরি করুন" data-i18n-bn="↻ নতুন বিল" data-i18n-en="↻ New Invoice">↻ নতুন বিল</button>
        <button type="button" class="btn-print-main h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border-0 cursor-pointer transition-colors shadow-xs" data-inv-print data-i18n-bn="🖨️ প্রিন্ট / সেভ PDF" data-i18n-en="🖨️ Print / Save PDF">
          🖨️ প্রিন্ট / সেভ PDF
        </button>
      </div>
    </div>

    <div class="inv-wrapper overflow-x-auto">
      <div class="inv-sheet max-w-[860px] mx-auto rounded-xl bg-white text-slate-900 border border-slate-200 p-6 sm:p-8 shadow-sm" id="invoiceSheet">
        <div class="inv-top-bar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 mb-5 border-b-2 border-slate-900">
          <div class="inv-logo-area flex items-center gap-3.5">
            <label for="invLogoInput" class="inv-logo-label cursor-pointer shrink-0" title="লোগো পরিবর্তন করতে ক্লিক করুন">
              <img src="/icons/icon-192.png" alt="Logo" class="inv-logo-img w-14 h-14 rounded-xl object-contain border border-slate-200 p-1" id="invLogoImg" />
            </label>
            <div class="inv-brand-edit space-y-1">
              <input type="text" class="inv-brand-name block w-full text-xl font-extrabold text-slate-900 bg-transparent border-0 border-b border-transparent focus:border-emerald-500 outline-none" id="invShopName" value="TechHat" placeholder="প্রতিষ্ঠানের নাম" data-i18n-placeholder-bn="প্রতিষ্ঠানের নাম" data-i18n-placeholder-en="Company / Shop Name" />
              <input type="text" class="inv-brand-sub block w-full text-xs text-slate-500 bg-transparent border-0 border-b border-transparent focus:border-emerald-500 outline-none" id="invShopSub" value="ক্যাশ মেমো ও ডিজিটাল ইনভয়েস" placeholder="স্লোগান / ব্যবসার ধরন" data-i18n-placeholder-bn="স্লোগান / ব্যবসার ধরন" data-i18n-placeholder-en="Tagline / Business Type" />
            </div>
          </div>
          <div class="inv-badge-area flex flex-col items-start sm:items-end gap-1.5">
            <div class="inv-badge text-lg font-extrabold tracking-wide text-slate-900" data-i18n-bn="ইনভয়েস / ক্যাশ মেমো" data-i18n-en="INVOICE / CASH MEMO">ইনভয়েস / ক্যাশ মেমো</div>
            <span class="inv-status-pill inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 data-[status=paid]:bg-emerald-100 data-[status=paid]:text-emerald-700 data-[status=due]:bg-rose-100 data-[status=due]:text-rose-700 data-[status=partial]:bg-amber-100 data-[status=partial]:text-amber-700" id="invStatusBadge" data-status="due">বাকি (DUE)</span>
          </div>
        </div>

        <div class="inv-info-grid grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div class="inv-col-left space-y-1.5">
            <div class="inv-label-sm text-xs font-bold uppercase tracking-wider text-slate-500" data-i18n-bn="গ্রাহকের বিবরণ (প্রাপক):" data-i18n-en="Bill To (Customer):">গ্রাহকের বিবরণ (প্রাপক):</div>
            <input type="text" class="inv-inp-clean inv-cli-name w-full h-8.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500" placeholder="গ্রাহকের নাম লিখুন" data-i18n-placeholder-bn="গ্রাহকের নাম লিখুন" data-i18n-placeholder-en="Customer Name" id="invCli" />
            <input type="text" class="inv-inp-clean w-full h-8.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-emerald-500" placeholder="মোবাইল নাম্বার" data-i18n-placeholder-bn="মোবাইল নাম্বার" data-i18n-placeholder-en="Phone Number" id="invPhone" />
            <input type="text" class="inv-inp-clean w-full h-8.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-emerald-500" placeholder="ঠিকানা" data-i18n-placeholder-bn="ঠিকানা" data-i18n-placeholder-en="Customer Address" id="invAddr" />
          </div>
          <div class="inv-col-right space-y-2 sm:text-right">
            <div class="inv-meta-row flex items-center sm:justify-end gap-2">
              <span class="inv-meta-lbl text-xs font-semibold text-slate-500" data-i18n-bn="ইনভয়েস নং:" data-i18n-en="Invoice No:">ইনভয়েস নং:</span>
              <input type="text" class="inv-meta-val h-8.5 w-36 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 text-right outline-none" value="#INV-001" id="invNo" />
            </div>
            <div class="inv-meta-row flex items-center sm:justify-end gap-2">
              <span class="inv-meta-lbl text-xs font-semibold text-slate-500" data-i18n-bn="তারিখ:" data-i18n-en="Date:">তারিখ:</span>
              <input type="date" class="inv-meta-val h-8.5 w-36 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 text-right outline-none" id="invDate" />
            </div>
            <div class="inv-meta-row flex items-center sm:justify-end gap-2">
              <span class="inv-meta-lbl text-xs font-semibold text-slate-500" data-i18n-bn="পেমেন্ট মাধ্যম:" data-i18n-en="Payment Method:">পেমেন্ট মাধ্যম:</span>
              <select class="inv-meta-val inv-meta-select h-8.5 w-36 px-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none" id="invPayMethod">
                <option value="নগদ (Cash)">নগদ (Cash)</option>
                <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                <option value="নগদ অ্যাপ (Nagad)">নগদ অ্যাপ (Nagad)</option>
                <option value="ব্যাংক ট্রান্সফার" data-i18n-bn="ব্যাংক ট্রান্সফার" data-i18n-en="Bank Transfer">ব্যাংক ট্রান্সফার</option>
                <option value="কার্ড / চেক" data-i18n-bn="কার্ড / চেক" data-i18n-en="Card / Cheque">কার্ড / চেক</option>
              </select>
            </div>
          </div>
        </div>

        <table class="inv-table w-full border-collapse mb-4 text-xs">
          <thead>
            <tr class="bg-slate-900 text-white">
              <th class="p-2.5 text-center rounded-tl-lg" style="width:7%;" data-i18n-bn="ক্রমিক" data-i18n-en="SL">ক্রমিক</th>
              <th class="p-2.5 text-left" style="width:43%;" data-i18n-bn="পণ্যের বিবরণ (Item Description)" data-i18n-en="Item Description">পণ্যের বিবরণ (Item Description)</th>
              <th class="p-2.5 text-right" style="width:16%;" data-i18n-bn="দর (Rate)" data-i18n-en="Rate">দর (Rate)</th>
              <th class="p-2.5 text-center" style="width:12%;" data-i18n-bn="পরিমাণ" data-i18n-en="Qty">পরিমাণ</th>
              <th class="p-2.5 text-right" style="width:17%;" data-i18n-bn="মোট (Total)" data-i18n-en="Total">মোট (Total)</th>
              <th class="no-print inv-del-col p-2.5 text-center rounded-tr-lg" style="width:5%;"></th>
            </tr>
          </thead>
          <tbody id="invList" class="divide-y divide-slate-200 border-x border-b border-slate-200"></tbody>
        </table>

        <div class="inv-actions-bar no-print mb-5">
          <button type="button" class="btn-add-row h-8.5 px-3.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors" data-inv-add data-i18n-bn="+ নতুন সারি যোগ করুন" data-i18n-en="+ Add New Row">+ নতুন সারি যোগ করুন</button>
        </div>

        <div class="inv-words-bar p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-6 flex items-center gap-2">
          <span class="inv-words-lbl font-bold text-slate-600" data-i18n-bn="কথায়:" data-i18n-en="In Words:">কথায়:</span>
          <span class="inv-words-val font-semibold text-slate-900" id="invWords">শূন্য টাকা মাত্র</span>
        </div>

        <div class="inv-bottom-grid grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div class="inv-notes-col space-y-2">
            <div class="inv-note-title text-xs font-bold text-slate-700" data-i18n-bn="পেমেন্ট তথ্য:" data-i18n-en="Payment Info:">পেমেন্ট তথ্য:</div>
            <textarea class="inv-note-area w-full rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs text-slate-700 outline-none" id="invPayInfo" rows="2">বিকাশ / নগদ (পার্সোনাল): 01700-000000</textarea>
            <div class="inv-note-title inv-note-title--spaced text-xs font-bold text-slate-700 pt-1" data-i18n-bn="শর্তাবলী / নোট:" data-i18n-en="Terms & Notes:">শর্তাবলী / নোট:</div>
            <textarea class="inv-note-area w-full rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs text-slate-700 outline-none" id="invTerms" rows="2">বিক্রিত পণ্য ফেরতযোগ্য নয়। যেকোনো প্রয়োজনে রশিদসহ যোগাযোগ করুন।</textarea>
          </div>
          <div class="inv-calc-col space-y-2 text-xs">
            <div class="calc-row flex items-center justify-between py-1 border-b border-slate-100"><span data-i18n-bn="উপ-মোট (Subtotal):" data-i18n-en="Subtotal:">উপ-মোট (Subtotal):</span><span id="invSub" class="font-bold">৳ 0.00</span></div>
            <div class="calc-row flex items-center justify-between py-1 border-b border-slate-100">
              <span data-i18n-bn="ডিসকাউন্ট (Discount):" data-i18n-en="Discount:">ডিসকাউন্ট (Discount):</span>
              <input type="number" class="calc-inp w-24 h-7 px-2 rounded bg-slate-50 border border-slate-200 text-right font-semibold outline-none" id="invDisc" value="0" min="0" data-inv-calc />
            </div>
            <div class="calc-row flex items-center justify-between py-1 border-b border-slate-100">
              <span data-i18n-bn="ভ্যাট / ট্যাক্স (%):" data-i18n-en="VAT / Tax (%):">ভ্যাট / ট্যাক্স (%):</span>
              <input type="number" class="calc-inp w-24 h-7 px-2 rounded bg-slate-50 border border-slate-200 text-right font-semibold outline-none" id="invTax" value="0" min="0" data-inv-calc />
            </div>
            <div class="calc-row flex items-center justify-between py-1 border-b border-slate-100"><span data-i18n-bn="ট্যাক্স পরিমাণ:" data-i18n-en="Tax Amount:">ট্যাক্স পরিমাণ:</span><span id="invTaxVal" class="font-semibold">৳ 0.00</span></div>
            <div class="calc-row flex items-center justify-between py-1 border-b border-slate-100">
              <span data-i18n-bn="ডেলিভারি / শিপিং চার্জ:" data-i18n-en="Shipping / Delivery:">ডেলিভারি / শিপিং চার্জ:</span>
              <input type="number" class="calc-inp w-24 h-7 px-2 rounded bg-slate-50 border border-slate-200 text-right font-semibold outline-none" id="invShip" value="0" min="0" data-inv-calc />
            </div>
            <div class="calc-row grand-total flex items-center justify-between py-2 px-2.5 rounded-lg bg-slate-900 text-white font-bold text-sm">
              <span data-i18n-bn="সর্বমোট (Grand Total):" data-i18n-en="Grand Total:">সর্বমোট (Grand Total):</span>
              <span id="invGrand">৳ 0.00</span>
            </div>
            <div class="calc-row flex items-center justify-between py-1">
              <span data-i18n-bn="জমা / পরিশোধিত (Paid):" data-i18n-en="Paid Amount:">জমা / পরিশোধিত (Paid):</span>
              <input type="number" class="calc-inp w-24 h-7 px-2 rounded bg-slate-50 border border-slate-200 text-right font-semibold outline-none" id="invPaid" value="0" min="0" data-inv-calc />
            </div>
            <div class="calc-row due-total flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-rose-50 text-rose-700 font-bold">
              <span data-i18n-bn="বকেয়া (Balance Due):" data-i18n-en="Balance Due:">বকেয়া (Balance Due):</span>
              <span id="invDue">৳ 0.00</span>
            </div>
          </div>
        </div>

        <div class="inv-footer-credit pt-6 border-t border-slate-200">
          <div class="inv-sign-row flex items-end justify-between mb-6 pt-6">
            <div class="inv-sign-box border-t border-slate-400 pt-1.5 px-6 text-xs font-semibold text-slate-600" data-i18n-bn="গ্রাহকের স্বাক্ষর" data-i18n-en="Customer Signature">গ্রাহকের স্বাক্ষর</div>
            <div class="inv-sign-box border-t border-slate-400 pt-1.5 px-6 text-xs font-semibold text-slate-600" data-i18n-bn="বিক্রেতার স্বাক্ষর" data-i18n-en="Authorized Signature">বিক্রেতার স্বাক্ষর</div>
          </div>
          <div class="inv-contact-bar grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs text-slate-500">
            <input type="text" class="inv-foot-inp bg-transparent border-0 text-center outline-none" id="invFootAddr" value="📍 ঝিনাইদহ সদর, ঝিনাইদহ" aria-label="ঠিকানা" />
            <input type="text" class="inv-foot-inp bg-transparent border-0 text-center outline-none" id="invFootPhone" value="📞 +880 1700-000000" aria-label="ফোন" />
            <input type="text" class="inv-foot-inp bg-transparent border-0 text-center outline-none" id="invFootEmail" value="✉️ info@techhat.com" aria-label="ইমেইল" />
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

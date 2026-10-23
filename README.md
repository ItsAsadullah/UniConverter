# TechHat বাংলা কনভার্টার — বিজয় ⇄ ইউনিকোড

নির্ভুল SutonnyMJ (বিজয়) ⇄ ইউনিকোড কনভার্টার। টেক্সট, Word (.docx/.docm/.dotx/.dotm), Excel (.xlsx/.xlsm), PowerPoint (.pptx/.pptm/.ppsx), RTF, TXT।
সব রূপান্তর ব্রাউজারেই হয় — ফাইল কোথাও আপলোড হয় না, ইন্টারনেট ছাড়াও চলে।

## চালানো
| উপায় | কীভাবে |
|---|---|
| সরাসরি | `index.html` ডাবল-ক্লিক (file://) — সব কনভার্সন চলবে, শুধু PWA ইনস্টল/অফলাইন ক্যাশ চলবে না |
| লোকাল সার্ভার | `python -m http.server 8080` → http://localhost:8080 |
| অনলাইন | পুরো ফোল্ডার যেকোনো স্ট্যাটিক হোস্টে (Netlify, Vercel, GitHub Pages, Firebase Hosting, cPanel) আপলোড — HTTPS-এ চালু হলে "ইনস্টল" বাটন আসবে |

## প্রজেক্টের গঠন
- `js/bijoy-engine.js` — রূপান্তর ইঞ্জিন (কোনো dependency নেই, Node-এও চলে)
- `js/office.js` — Word/Excel/PowerPoint (OOXML) রূপান্তর, ফরম্যাটিং অক্ষত
- `js/formats.js` — RTF ও TXT
- `js/app.js` — UI
- `sw.js`, `manifest.webmanifest` — অফলাইন ও ইনস্টলযোগ্য অ্যাপ (PWA)
- `vendor/jszip.min.js` — ZIP পড়া/লেখা

## টেস্ট
```
cd tests && npm install && cd ..
node tests/engine.test.js
node tests/office.test.js
```

## নেটিভ অ্যাপ বানানো (ঐচ্ছিক)
- **Windows/Mac/Linux:** [Tauri](https://tauri.app) — এই ফোল্ডারটাকেই `frontendDist` দিন (~৩–৫ MB ইনস্টলার)।
- **Android/iOS:** [Capacitor](https://capacitorjs.com) — `webDir` এই ফোল্ডার; অথবা PWABuilder দিয়ে Play Store-এর জন্য TWA।

## নোট
- SutonnyMJ বাণিজ্যিক ফন্ট, তাই সাথে দেওয়া হয়নি। বিজয় লেখা ঠিকমতো দেখতে ডিভাইসে ফন্টটি থাকতে হবে (রূপান্তর এমনিতেই সঠিক হয়)।
- পুরোনো বাইনারি `.doc/.xls/.ppt` সমর্থিত নয় — Office-এ খুলে নতুন ফরম্যাটে সেভ করুন।
- নতুন ভার্সন ডিপ্লয় করলে `sw.js`-এর `VERSION` বদলে দিন।

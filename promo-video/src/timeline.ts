// Master Timeline & Real Live App Coordinates for TechHat Studio 2.0 Promo Video
// Exact match to the user's recorded Bengali Voiceover (83.72s speech + 1.28s tail = 85.0s / 2550 frames @ 30fps)
// The real live 1600x920 app viewport is placed at X0 = 160, Y0 = 80
// (with a 36px macOS browser chrome bar at Y = 44..80).
// Therefore: worldX = 160 + viewportX, worldY = 80 + viewportY.

export const FPS = 30;
export const DURATION_SEC = 85;
export const TOTAL_FRAMES = FPS * DURATION_SEC; // 2550 frames

export const WIN_X = 160;
export const WIN_Y = 80;
export const WIN_W = 1600;
export const WIN_H = 920;

export interface StepPillDef {
  step: number;
  total: number;
  start: number;
  end: number;
  titleBn: string;
  subEn: string;
  accent: string;
}

export interface CamKey {
  t: number;
  cx: number;
  cy: number;
  z: number;
}

export interface CursorKey {
  t: number;
  x: number;
  y: number;
}

export interface SpotlightDef {
  start: number;
  end: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LiveScreenState {
  start: number;
  end: number;
  image: string;
  url: string;
  badge: string;
}

// Sequence of real captured live screens from http://localhost:4321 synced to voiceover
export const LIVE_SCREENS: LiveScreenState[] = [
  // Intro (0.0s - 11.6s): Real Home Page (Bangla) -> All Tools 27
  { start: 0.0, end: 3.5, image: "live/live_00_home_bn.png", url: "techhat.studio/", badge: "হোম ওয়ার্কস্পেস" },
  { start: 3.5, end: 11.6, image: "live/live_00b_home_all.png", url: "techhat.studio/#all-tools", badge: "২৭+ প্রো টুলস" },

  // Feature 1 (11.6s - 26.7s): Bijoy ⇄ Unicode Live Converter, Voice Typing & Office File (.docx/.xlsx/.pptx) Converter
  { start: 11.6, end: 12.4, image: "live/live_01a_bijoy_empty.png", url: "techhat.studio/bangla/bijoy-to-unicode", badge: "বিজয় ⇄ ইউনিকোড" },
  { start: 12.4, end: 12.85, image: "live/live_01_type_1.png", url: "techhat.studio/bangla/bijoy-to-unicode", badge: "লাইভ কনভার্টার" },
  { start: 12.85, end: 13.3, image: "live/live_01_type_2.png", url: "techhat.studio/bangla/bijoy-to-unicode", badge: "লাইভ কনভার্টার" },
  { start: 13.3, end: 13.75, image: "live/live_01_type_3.png", url: "techhat.studio/bangla/bijoy-to-unicode", badge: "লাইভ কনভার্টার" },
  { start: 13.75, end: 14.2, image: "live/live_01_type_4.png", url: "techhat.studio/bangla/bijoy-to-unicode", badge: "লাইভ কনভার্টার" },
  { start: 14.2, end: 14.65, image: "live/live_01_type_5.png", url: "techhat.studio/bangla/bijoy-to-unicode", badge: "লাইভ কনভার্টার" },
  { start: 14.65, end: 18.9, image: "live/live_01_type_6.png", url: "techhat.studio/bangla/bijoy-to-unicode", badge: "SutonnyMJ ও ভয়েস টাইপিং" },
  { start: 18.9, end: 22.3, image: "live/live_02a_office_queued.png", url: "techhat.studio/bangla/office-converter", badge: "অফিস ফাইল কনভার্টার" },
  { start: 22.3, end: 26.7, image: "live/live_02b_office_converted.png", url: "techhat.studio/bangla/office-converter", badge: "DOCX রূপান্তর সম্পন্ন" },

  // Feature 2 (26.7s - 40.4s): PDF Studio (8 Tools Hub -> Merge PDF -> Compress PDF -> PDF to Word/JPG -> Decrypt PDF)
  { start: 26.7, end: 28.8, image: "live/live_03_pdf_hub.png", url: "techhat.studio/pdf", badge: "পিডিএফ স্টুডিও (৮ টুলস)" },
  { start: 28.8, end: 31.2, image: "live/live_04a_pdf_merge.png", url: "techhat.studio/pdf/merge", badge: "মার্জ PDF" },
  { start: 31.2, end: 32.2, image: "live/live_04b_pdf_compress.png", url: "techhat.studio/pdf/compress", badge: "কমপ্রেস PDF" },
  { start: 32.2, end: 34.4, image: "live/live_04b2_pdf_compressed.png", url: "techhat.studio/pdf/compress", badge: "৫৯% সাইজ হ্রাস" },
  { start: 34.4, end: 36.4, image: "live/live_03_pdf_hub.png", url: "techhat.studio/pdf#pdf-to-other", badge: "PDF ⇄ Word / JPG ও আনলক" },
  { start: 36.4, end: 40.4, image: "live/live_04c_pdf_decrypt.png", url: "techhat.studio/pdf/decrypt", badge: "ডিক্রিপ্ট ও আনলক PDF" },

  // Feature 3 (40.4s - 60.3s): Image Studio (NID Scanner -> 6-Pt Passport -> Doc Scanner + Retouch -> Resize -> Convert -> Raster to Vector)
  { start: 40.4, end: 41.6, image: "live/live_05_image_hub.png", url: "techhat.studio/image", badge: "ইমেজ স্টুডিও (৯ টুলস)" },
  { start: 41.6, end: 43.8, image: "live/live_06b_nid_loaded.png", url: "techhat.studio/image/combine", badge: "স্মার্ট NID স্ক্যানার (A4)" },
  { start: 43.8, end: 45.9, image: "live/live_07_passport_loaded.png", url: "techhat.studio/image/passport", badge: "পাসপোর্ট ৬-পয়েন্ট স্ক্যানার" },
  { start: 45.9, end: 47.0, image: "live/live_08_doc_scanner_loaded.png", url: "techhat.studio/image/scan", badge: "ডকুমেন্ট স্ক্যানার (Magic+ AI)" },
  { start: 47.0, end: 48.9, image: "live/live_08b_doc_retouch.png", url: "techhat.studio/image/scan#retouch", badge: "ফটোশপ-স্টাইল রিটাচ ও লেয়ার" },
  { start: 48.9, end: 50.9, image: "live/live_09a_image_resize.png", url: "techhat.studio/image/resize", badge: "চাকরির ছবি রিসাইজার (300×300)" },
  { start: 50.9, end: 52.8, image: "live/live_09b_image_convert.png", url: "techhat.studio/image/convert", badge: "ইমেজ ফরম্যাট কনভার্টার" },
  { start: 52.8, end: 54.0, image: "live/live_10b_split_25.png", url: "techhat.studio/image/vectorize", badge: "রাস্টার টু ভেক্টর স্টুডিও" },
  { start: 54.0, end: 55.2, image: "live/live_10b_vector_loaded.png", url: "techhat.studio/image/vectorize", badge: "লাইভ স্প্লিট প্রিভিউ" },
  { start: 55.2, end: 56.3, image: "live/live_10b_split_78.png", url: "techhat.studio/image/vectorize", badge: "৮টি ভেক্টর কালার লেয়ার" },
  { start: 56.3, end: 57.4, image: "live/live_10c_vector_wireframe.png", url: "techhat.studio/image/vectorize#wireframe", badge: "৯৩৩টি বেজিয়ার নোড" },
  { start: 57.4, end: 60.3, image: "live/live_10d_vector_export.png", url: "techhat.studio/image/vectorize#export", badge: "SVG · EPS · Adobe AI" },

  // Feature 4 (60.3s - 72.8s): Calendar & Dates, Age Calculator, A4 Invoice & Cash Memo, Color Picker & Utilities
  { start: 60.3, end: 64.0, image: "live/live_11_calendar_bn.png", url: "techhat.studio/calendar", badge: "বাংলা · ইংরেজি · হিজরি তারিখ" },
  { start: 64.0, end: 65.8, image: "live/live_12_age_bn.png", url: "techhat.studio/age-calculator", badge: "নিখুঁত বয়স ক্যালকুলেটর" },
  { start: 65.8, end: 68.6, image: "live/live_13_invoice_filled.png", url: "techhat.studio/invoice", badge: "ইনভয়েস ও ক্যাশ মেমো (A4)" },
  { start: 68.6, end: 70.8, image: "live/live_15_color_picker.png", url: "techhat.studio/image/colors", badge: "কালার পিকার ও প্যালেট" },
  { start: 70.8, end: 72.8, image: "live/live_14_utilities_bn.png", url: "techhat.studio/utilities", badge: "ইউটিলিটিস হাব" },

  // Outro (72.8s - 85.0s): Full All-Tools Overview & Pre-Release CTA
  { start: 72.8, end: 85.0, image: "live/live_00b_home_all.png", url: "techhat.studio/", badge: "TechHat Studio 2.0 · Pre-Release" },
];

export const STEPS: StepPillDef[] = [
  {
    step: 1,
    total: 4,
    start: 11.6,
    end: 26.5,
    titleBn: "বিজয় ⇄ ইউনিকোড ও অফিস ফাইল কনভার্টার",
    subEn: "Live Bijoy ⇄ Unicode, Voice Typing & DOCX/XLSX/PPTX Converter",
    accent: "#3b82f6",
  },
  {
    step: 2,
    total: 4,
    start: 26.7,
    end: 40.2,
    titleBn: "পিডিএফ স্টুডিও (মার্জ, স্প্লিট, কমপ্রেস ও আনলক)",
    subEn: "8-in-1 PDF Studio · Merge, Split, Compress with Preview & Decrypt",
    accent: "#f43f5e",
  },
  {
    step: 3,
    total: 4,
    start: 40.4,
    end: 60.1,
    titleBn: "NID, পাসপোর্ট, ডকুমেন্ট স্ক্যানার ও রাস্টার টু ভেক্টর",
    subEn: "NID A4, 6-Pt Passport, Magic+ Retouch, Resize & SVG/EPS/AI Vector",
    accent: "#0ea5e9",
  },
  {
    step: 4,
    total: 4,
    start: 60.3,
    end: 72.6,
    titleBn: "তারিখ, বয়স ক্যালকুলেটর, A4 ইনভয়েস ও ইউটিলিটিস",
    subEn: "Bangla/Hijri Date, Exact Age, Print-Ready Cash Memo & Color Picker",
    accent: "#8b5cf6",
  },
];

// Synchronized Mouse Click timestamps (in seconds)
export const CLICK_TIMES: number[] = [
  3.4,  // Click "সব টুলস ২৭" tab on Home
  11.4, // Click "বিজয় ⇄ ইউনিকোড" card on Home
  12.2, // Click inside left Unicode textarea to start typing
  15.6, // Click "Word-এর জন্য কপি" button
  17.3, // Click "ভয়েস টাইপ" button
  18.8, // Click "অফিস ফাইল" tab
  22.1, // Click "ফাইল রূপান্তর করুন" button
  26.5, // Click "পিডিএফ স্টুডিও" top nav
  28.6, // Click "মার্জ PDF" card
  30.5, // Click "PDF মার্জ ও ডাউনলোড করুন"
  32.0, // Click "PDF কমপ্রেস করুন"
  36.2, // Click "ডিক্রিপ্ট PDF" card
  40.2, // Click "ইমেজ স্টুডিও" top nav
  41.4, // Click "NID কার্ড স্ক্যানার" card
  43.6, // Switch to "পাসপোর্ট মেকার ও স্ক্যানার"
  45.7, // Switch to "ডকুমেন্ট স্ক্যানার"
  46.8, // Click "এডিট" button to open Photoshop-style Retouch Toolbar
  48.7, // Switch to "ইমেজ রিসাইজার (300×300)"
  50.7, // Switch to "ফরম্যাট ও ওয়াটারমার্ক"
  52.6, // Switch to "রাস্টার টু ভেক্টর"
  53.8, // Drag split slider handle
  56.1, // Click "ওয়্যারফ্রেম" view
  57.2, // Click "এক্সপোর্ট ও প্রিন্ট সেটিংস SVG · EPS · AI"
  60.1, // Click "ক্যালেন্ডার ও তারিখ" top nav
  63.8, // Switch to "বয়স ক্যালকুলেটর"
  65.6, // Switch to "ইনভয়েস ও ক্যাশ মেমো"
  67.7, // Click "প্রিন্ট / সেভ PDF" on Invoice
  68.4, // Switch to "কালার পিকার (#0F766E)"
  70.6, // Switch to "ইউটিলিটিস"
];

// Camera Keyframes (in 1920x1080 world coordinates)
export const CAM_KEYS: CamKey[] = [
  // Intro (0.0s - 11.6s): Overview of real Home page
  { t: 0.0, cx: 960, cy: 525, z: 0.96 },
  { t: 3.3, cx: 960, cy: 525, z: 1.0 },
  { t: 7.2, cx: 960, cy: 540, z: 1.04 },
  { t: 11.3, cx: 960, cy: 525, z: 0.98 },

  // Feature 1 (11.6s - 26.7s): Bijoy ⇄ Unicode, Voice Typing & Office Converter
  { t: 12.1, cx: 880, cy: 510, z: 1.08 },
  { t: 14.8, cx: 880, cy: 510, z: 1.08 },
  // Focus on right-hand converted SutonnyMJ output & Copy for Word button
  { t: 15.3, cx: 1210, cy: 485, z: 1.22 },
  { t: 16.7, cx: 1210, cy: 485, z: 1.22 },
  // Focus on Voice Typing bar ("সাথে বাংলা ভয়েস টাইপিং!")
  { t: 17.2, cx: 740, cy: 360, z: 1.28 },
  { t: 18.7, cx: 740, cy: 360, z: 1.28 },
  // Pan to Office File Converter & right-side converted DOCX list
  { t: 19.4, cx: 1020, cy: 540, z: 1.14 },
  { t: 22.1, cx: 1020, cy: 540, z: 1.14 },
  { t: 22.7, cx: 1180, cy: 540, z: 1.24 },
  { t: 26.4, cx: 1180, cy: 540, z: 1.24 },

  // Feature 2 (26.7s - 40.4s): PDF Studio (8 Tools Hub -> Merge -> Compress -> Decrypt)
  { t: 27.1, cx: 920, cy: 470, z: 1.12 },
  { t: 28.6, cx: 920, cy: 470, z: 1.12 },
  // Merge PDF view
  { t: 29.2, cx: 960, cy: 520, z: 1.12 },
  { t: 31.0, cx: 960, cy: 520, z: 1.12 },
  // Compress PDF (59% reduced preview)
  { t: 31.6, cx: 960, cy: 560, z: 1.16 },
  { t: 34.2, cx: 960, cy: 560, z: 1.16 },
  // PDF Hub (PDF Converter & Decrypt cards)
  { t: 34.7, cx: 920, cy: 490, z: 1.14 },
  { t: 36.2, cx: 920, cy: 490, z: 1.14 },
  // Decrypt PDF
  { t: 36.8, cx: 920, cy: 440, z: 1.18 },
  { t: 40.1, cx: 920, cy: 440, z: 1.18 },

  // Feature 3 (40.4s - 60.3s): Image & Scanner Studio
  { t: 40.8, cx: 920, cy: 490, z: 1.12 },
  { t: 41.5, cx: 920, cy: 490, z: 1.12 },
  // NID Card Scanner (A4 Front & Back preview)
  { t: 42.0, cx: 1060, cy: 530, z: 1.22 },
  { t: 43.6, cx: 1060, cy: 530, z: 1.22 },
  // Passport 6-Point Scanner
  { t: 44.2, cx: 880, cy: 535, z: 1.2 },
  { t: 45.7, cx: 880, cy: 535, z: 1.2 },
  // Document Scanner + Photoshop Retouch Toolbar
  { t: 46.3, cx: 860, cy: 480, z: 1.16 },
  { t: 48.7, cx: 860, cy: 480, z: 1.16 },
  // Image Resizer (300x300 Govt Job Photo) & Format Converter
  { t: 49.3, cx: 860, cy: 480, z: 1.16 },
  { t: 52.6, cx: 860, cy: 480, z: 1.16 },
  // Raster to Vector Split Compare & Export Modal
  { t: 53.2, cx: 980, cy: 535, z: 1.18 },
  { t: 57.2, cx: 980, cy: 535, z: 1.18 },
  { t: 57.8, cx: 960, cy: 540, z: 1.26 },
  { t: 60.1, cx: 960, cy: 540, z: 1.26 },

  // Feature 4 (60.3s - 72.8s): Calendar, Age Calculator, Invoice Maker & Color Picker
  { t: 60.8, cx: 1080, cy: 465, z: 1.18 },
  { t: 65.6, cx: 1080, cy: 465, z: 1.18 },
  // Invoice Maker A4 Sheet
  { t: 66.2, cx: 960, cy: 545, z: 1.18 },
  { t: 68.4, cx: 960, cy: 545, z: 1.18 },
  // Color Picker Palette & Utilities Hub
  { t: 69.0, cx: 1060, cy: 465, z: 1.18 },
  { t: 70.6, cx: 1060, cy: 465, z: 1.18 },
  { t: 71.1, cx: 860, cy: 430, z: 1.14 },
  { t: 72.6, cx: 860, cy: 430, z: 1.14 },

  // Outro (72.8s - 85.0s): Zoom out to full studio window
  { t: 73.4, cx: 960, cy: 525, z: 0.95 },
  { t: 85.0, cx: 960, cy: 525, z: 0.93 },
];

// Cursor Waypoints in 1920x1080 world coordinates (160 + viewportX, 80 + viewportY)
export const CURSOR_KEYS: CursorKey[] = [
  { t: 2.0, x: 960, y: 360 },
  { t: 3.3, x: 1096, y: 422 }, // Click "সব টুলস ২৭" tab on Home
  { t: 4.2, x: 1096, y: 422 },
  { t: 10.8, x: 640, y: 520 },
  { t: 11.3, x: 305, y: 575 }, // Click "বিজয় ⇄ ইউনিকোড" card on Home
  { t: 11.7, x: 305, y: 575 },

  // Step 1: Bijoy ⇄ Unicode, Voice Typing & Office Converter
  { t: 12.1, x: 480, y: 420 }, // Click inside left Unicode textarea
  { t: 14.7, x: 620, y: 460 },
  { t: 15.5, x: 1551, y: 287 }, // Click "Word-এর জন্য কপি" button
  { t: 16.5, x: 1320, y: 450 },
  { t: 17.2, x: 645, y: 287 }, // Click "ভয়েস টাইপ" button ("সাথে বাংলা ভয়েস টাইপিং!")
  { t: 18.4, x: 645, y: 287 },
  { t: 18.7, x: 398, y: 221 }, // Click "অফিস ফাইল" tab
  { t: 19.3, x: 398, y: 221 },
  { t: 20.6, x: 1220, y: 510 }, // Hover over queued DOCX files
  { t: 22.0, x: 752, y: 891 }, // Click "ফাইল রূপান্তর করুন" button
  { t: 23.0, x: 1585, y: 500 }, // Hover over "ডাউনলোড" button on converted DOCX
  { t: 26.0, x: 1585, y: 500 },

  // Step 2: PDF Studio
  { t: 26.4, x: 795, y: 112 }, // Click "পিডিএফ স্টুডিও" in top nav
  { t: 27.0, x: 795, y: 112 },
  { t: 28.5, x: 340, y: 435 }, // Click "মার্জ PDF" card
  { t: 29.0, x: 340, y: 435 },
  { t: 30.4, x: 1520, y: 741 }, // Click "PDF মার্জ ও ডাউনলোড করুন"
  { t: 31.0, x: 1520, y: 741 },
  { t: 31.9, x: 1580, y: 948 }, // Click "PDF কমপ্রেস করুন"
  { t: 32.8, x: 1545, y: 812 }, // Hover "কমপ্রেসড PDF ডাউনলোড করুন"
  { t: 34.8, x: 1520, y: 435 }, // Point at "PDF কনভার্টার (PDF থেকে JPG, PNG, Word)" card
  { t: 36.1, x: 640, y: 645 },  // Click "ডিক্রিপ্ট PDF" card
  { t: 37.5, x: 640, y: 455 },  // Hover "সম্পূর্ণ পাসওয়ার্ডমুক্ত করুন (Unlocked PDF)"

  // Step 3: Image Studio
  { t: 40.1, x: 946, y: 112 }, // Click "ইমেজ স্টুডিও" in top nav
  { t: 40.6, x: 946, y: 112 },
  { t: 41.3, x: 640, y: 645 }, // Click "NID কার্ড স্ক্যানার" card
  { t: 42.3, x: 1140, y: 480 }, // Point at A4 Front+Back NID preview
  { t: 43.5, x: 1585, y: 938 }, // Click "এক্সপোর্ট ও PDF ডাউনলোড ২টি কার্ড"
  { t: 44.4, x: 620, y: 545 },  // Point at 6-Point center fold handle on Passport
  { t: 45.6, x: 1140, y: 540 }, // Point at rectified Passport A4 sheet
  { t: 46.7, x: 622, y: 151 },  // Click "এডিট" button in Document Scanner
  { t: 47.6, x: 382, y: 392 },  // Point at Photoshop-style Brush/Heal Retouch dock
  { t: 48.6, x: 1520, y: 215 }, // Point at Magic+ AI & Layers stack
  { t: 49.4, x: 390, y: 330 },  // Point at "চাকরির ছবি (300×300)" preset
  { t: 50.6, x: 1220, y: 780 }, // Point at 300x300 resized preview
  { t: 51.4, x: 420, y: 330 },  // Point at Format Converter (JPG/PNG/WebP/Base64)
  { t: 52.5, x: 1520, y: 938 }, // Click Download / Switch to Raster to Vector
  { t: 53.3, x: 620, y: 550 },  // Grab Vector Studio split comparison handle (25%)
  { t: 54.4, x: 880, y: 550 },  // Drag split handle to center (50%)
  { t: 55.6, x: 1140, y: 550 }, // Drag split handle to right (78%)
  { t: 56.0, x: 1275, y: 151 }, // Click "ওয়্যারফ্রেম" view
  { t: 57.1, x: 1585, y: 975 }, // Click "এক্সপোর্ট ও প্রিন্ট সেটিংস SVG · EPS · AI"
  { t: 58.4, x: 960, y: 548 },  // Hover "SVG ভেক্টর ডাউনলোড করুন (.svg / .ai / .eps)"

  // Step 4: Calendar, Age, Invoice & Utilities
  { t: 60.0, x: 1108, y: 112 }, // Click "ক্যালেন্ডার ও তারিখ" in top nav
  { t: 61.6, x: 1320, y: 380 }, // Point at "২৩ কার্তিক, ১৪৩৩" & Hijri date
  { t: 63.7, x: 340, y: 171 },  // Switch to "বয়স ক্যালকুলেটর"
  { t: 64.8, x: 1320, y: 380 }, // Point at "২৬ বছর, ১০ মাস, ৭ দিন"
  { t: 65.5, x: 1264, y: 112 }, // Click "ইউটিলিটিস" -> Invoice
  { t: 66.6, x: 960, y: 650 },  // Point at Invoice items & "কথায়: পনেরো হাজার টাকা মাত্র"
  { t: 67.6, x: 1605, y: 239 }, // Click "প্রিন্ট / সেভ PDF" button
  { t: 68.3, x: 1605, y: 239 },
  { t: 69.4, x: 1410, y: 465 }, // Point at "#0F766E" Color Picker swatch
  { t: 70.5, x: 1100, y: 420 }, // Switch to Utilities Hub
  { t: 71.8, x: 960, y: 435 },  // Point at Utilities cards
];

// Pixel-aligned Yellow-edged Spotlights matching exact live DOM coordinates (world = 160 + x, 80 + y)
export const SPOTLIGHTS: SpotlightDef[] = [
  // 1A: Right-hand Bijoy Output (SutonnyMJ) box on /bangla/bijoy-to-unicode
  { start: 14.9, end: 16.8, x: 962, y: 268, w: 748, h: 586 },
  // 1B: Bangla Voice Typing bar ("সাথে বাংলা ভয়েস টাইপিং!")
  { start: 16.9, end: 18.8, x: 582, y: 264, w: 238, h: 46 },
  // 1C: Right-hand Converted Office Files (.docx) list on /bangla/office-converter
  { start: 22.4, end: 26.4, x: 1018, y: 458, w: 686, h: 168 },
  // 2A: Compressed PDF 59% Size Reduction & Preview Card on /pdf/compress
  { start: 32.3, end: 34.3, x: 214, y: 280, w: 1492, h: 572 },
  // 2B: Unlocked PDF Card on /pdf/decrypt
  { start: 36.6, end: 40.2, x: 214, y: 260, w: 1492, h: 278 },
  // 3A: NID Card Scanner A4 Front+Back Sheet Preview on /image/combine
  { start: 41.8, end: 43.7, x: 878, y: 192, w: 518, h: 742 },
  // 3B: Vector Studio Export Modal (SVG · EPS · Adobe AI) on /image/vectorize
  { start: 57.5, end: 60.2, x: 694, y: 384, w: 532, h: 312 },
  // 4A: Bangla + Hijri Calendar Output Card on /calendar
  { start: 60.8, end: 63.8, x: 958, y: 286, w: 726, h: 334 },
  // 4B: A4 Print-Ready Cash Memo & Invoice Sheet on /invoice
  { start: 66.0, end: 68.5, x: 518, y: 288, w: 872, h: 668 },
];

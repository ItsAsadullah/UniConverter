export interface ToolMeta {
  id: 'bijoy' | 'pdf' | 'image' | 'calendar' | 'age' | 'datecalc' | 'invoice';
  href: string;
  title: string;
  desc: string;
  badge: string;
  color: 'emerald' | 'crimson' | 'teal' | 'blue' | 'purple' | 'amber' | 'rose';
  keywords: string;
  icon: string;
  seoTitle: string;
  seoDesc: string;
}

export interface PdfSubToolMeta {
  slug: string;
  tabId: 'merge' | 'split' | 'compress' | 'organize' | 'pdf2other' | 'other2pdf';
  title: string;
  seoTitle: string;
  seoDesc: string;
}

export interface ImageSubToolMeta {
  slug: string;
  tabId: 'resize' | 'compress' | 'crop' | 'convert' | 'combine' | 'colors';
  title: string;
  seoTitle: string;
  seoDesc: string;
}

export const TOOLS: ToolMeta[] = [
  {
    id: 'bijoy',
    href: '/',
    title: 'বিজয় ⇄ ইউনিকোড',
    desc: 'টেক্সট, ভয়েস ও ফাইল রূপান্তর',
    badge: 'কনভার্টার',
    color: 'emerald',
    keywords: 'bijoy unicode bangla converter sutonny ফন্ট বিজয় ইউনিকোড ভয়েস টাইপ',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h14"/><path d="m18 14 3 3-3 3"/></svg>',
    seoTitle: 'বিজয় ⇄ ইউনিকোড কনভার্টার — নিখুঁত, অফলাইন, ফ্রি | TechHat',
    seoDesc: 'বিজয় (SutonnyMJ) থেকে ইউনিকোড এবং ইউনিকোড থেকে বিজয়ে নিখুঁত রূপান্তর। যুক্তাক্ষর, রেফ, কার সঠিক রেখে Word, Excel, PowerPoint, RTF ফাইল ফরম্যাটিংসহ রূপান্তর ও ভয়েস টাইপিং — সম্পূর্ণ অফলাইনে।'
  },
  {
    id: 'pdf',
    href: '/pdf',
    title: 'পিডিএফ স্টুডিও',
    desc: 'মার্জ, স্প্লিট, কমপ্রেস ও কনভার্ট',
    badge: 'PDF টুলস',
    color: 'crimson',
    keywords: 'pdf merge split compress organize rotate jpg to pdf word to pdf ilovepdf পিডিএফ মার্জ স্প্লিট কমপ্রেস কনভার্ট',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2a2 2 0 0 1 0 4H8v-4Z"/><path d="M14 13h2v4h-2z"/></svg>',
    seoTitle: 'অল-ইন-ওয়ান PDF স্টুডিও — মার্জ, স্প্লিট, কমপ্রেস ও কনভার্ট | TechHat',
    seoDesc: 'ফ্রি অনলাইন ও অফলাইন PDF টুলস — PDF মার্জ (Word, Excel, PowerPoint, ছবিসহ), স্প্লিট, কোয়ালিটি প্রিভিউসহ কমপ্রেস, পেজ রোটেশন ও অর্গানাইজ এবং PDF কনভার্টার। ১০০% নিরাপদ, ব্রাউজারেই প্রসেস হয়।'
  },
  {
    id: 'image',
    href: '/image',
    title: 'ইমেজ স্টুডিও',
    desc: 'রিসাইজ, কমপ্রেস, ক্রপ ও আইডি স্ক্যানার',
    badge: 'Image টুলস',
    color: 'teal',
    keywords: 'image resize compress crop convert jpg png webp passport photo signature 300x300 250x250 ansar vdp 300x80 300x100 nid scanner perspective crop combine color picker ছবি রিসাইজ কমপ্রেস ক্রপ স্বাক্ষর পাসপোর্ট সাইজ আনসার',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    seoTitle: 'ইমেজ স্টুডিও — রিসাইজ, কমপ্রেস, ক্রপ ও আইডি কার্ড স্ক্যানার | TechHat',
    seoDesc: 'সরকারি চাকরির ছবি (300×300), আনসার ভিডিপি (250×250) ও স্বাক্ষর (300×80, 300×100) রিসাইজার, ইমেজ কমপ্রেসর, কাস্টম ক্রপ, আইডি কার্ড পাসপেক্টিভ স্ক্যানার ও কালার পিকার।'
  },
  {
    id: 'calendar',
    href: '/calendar',
    title: 'তারিখ কনভার্টার',
    desc: 'ইংরেজি, বাংলা ও হিজরি সন',
    badge: 'ক্যালেন্ডার',
    color: 'blue',
    keywords: 'calendar date converter bangla hijri arabic তারিখ ক্যালেন্ডার বাংলা আরবি হিজরি সন',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
    seoTitle: 'তারিখ কনভার্টার — ইংরেজি, বাংলা ও হিজরি ক্যালেন্ডার | TechHat',
    seoDesc: 'ইংরেজি (গ্রেগরিয়ান), বাংলা বঙ্গাব্দ এবং আরবি হিজরি সনের তারিখ তাৎক্ষণিক রূপান্তর করুন। ঋতু, বার, রাশিচক্র ও চাঁদ দেখা সমন্বয়সহ পূর্ণাঙ্গ ক্যালেন্ডার টুল।'
  },
  {
    id: 'age',
    href: '/age-calculator',
    title: 'বয়স ম্যানেজার',
    desc: 'বয়স ও জন্মতারিখ নির্ণয়',
    badge: 'বয়স হিসাব',
    color: 'purple',
    keywords: 'age calculator dob birthday বয়স ক্যালকুলেটর জন্মতারিখ হিসাব',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/></svg>',
    seoTitle: 'বয়স ক্যালকুলেটর ও জন্মতারিখ নির্ণয় — বছর, মাস, দিন ও সেকেন্ড | TechHat',
    seoDesc: 'জন্মতারিখ থেকে আপনার নিখুঁত বয়স (বছর, মাস, সপ্তাহ, দিন, ঘণ্টা, মিনিট ও সেকেন্ড) অথবা বয়স থেকে সম্ভাব্য জন্মতারিখ (ইংরেজি, বাংলা ও হিজরি) বের করুন।'
  },
  {
    id: 'datecalc',
    href: '/date-calculator',
    title: 'দিন গণনা',
    desc: 'তারিখের ব্যবধান হিসাব',
    badge: 'সময় হিসাব',
    color: 'amber',
    keywords: 'date duration calculator days before after দিন গণনা তারিখ ব্যবধান',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    seoTitle: 'দিন গণনা ও তারিখের ব্যবধান ক্যালকুলেটর | TechHat',
    seoDesc: 'যেকোনো তারিখ থেকে নির্দিষ্ট বছর, মাস ও দিন যোগ বা বিয়োগ করে ভবিষ্যৎ কিংবা অতীতের ইংরেজি, বাংলা ও হিজরি তারিখ বের করুন।'
  },
  {
    id: 'invoice',
    href: '/invoice',
    title: 'ইনভয়েস মেকার',
    desc: 'ক্যাশ মেমো ও A4 বিল প্রিন্ট',
    badge: 'বিজনেস',
    color: 'rose',
    keywords: 'invoice bill pdf generator cash memo ইনভয়েস বিল মেমো প্রিন্ট',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    seoTitle: 'ফ্রি ইনভয়েস মেকার ও ক্যাশ মেমো জেনারেটর (A4 প্রিন্ট রেডি) | TechHat',
    seoDesc: 'আপনার প্রতিষ্ঠান বা দোকানের জন্য প্রফেশনাল A4 ইনভয়েস ও ক্যাশ মেমো তৈরি করুন। কাস্টম লোগো, ডিসকাউন্ট, ভ্যাট, জমা-বাকি হিসাব ও বাংলা কথায় টাকার অংকসহ সরাসরি প্রিন্ট বা PDF সেভ করুন।'
  }
];

export const PDF_SUBTOOLS: PdfSubToolMeta[] = [
  {
    slug: 'merge',
    tabId: 'merge',
    title: 'মার্জ PDF',
    seoTitle: 'মার্জ PDF (Merge PDF) — PDF, ছবি, Word, PPTX এক ফাইলে একত্রিত করুন | TechHat',
    seoDesc: 'একাধিক PDF ফাইলের সাথে JPG, PNG, Word (.doc/.docx), PowerPoint (.pptx), Excel (.xlsx) ও টেক্সট ফাইল যোগ করে ড্র্যাগ-অ্যান্ড-ড্রপ ও পেজ রোটেশনসহ একটি PDF তৈরি করুন।'
  },
  {
    slug: 'split',
    tabId: 'split',
    title: 'স্প্লিট PDF',
    seoTitle: 'স্প্লিট PDF (Split PDF) — পেজ রেঞ্জ বা আলাদা পৃষ্ঠা এক্সট্র্যাক্ট করুন | TechHat',
    seoDesc: 'বড় PDF ফাইল থেকে নির্দিষ্ট পৃষ্ঠা বা পেজ রেঞ্জ আলাদা করুন কিংবা প্রতিটি পৃষ্ঠা আলাদা PDF হিসেবে ZIP ফাইলে ডাউনলোড করুন।'
  },
  {
    slug: 'compress',
    tabId: 'compress',
    title: 'কমপ্রেস PDF',
    seoTitle: 'কমপ্রেস PDF (Compress PDF) — প্রিভিউ দেখে PDF ফাইলের সাইজ কমান | TechHat',
    seoDesc: 'PDF ফাইলের সাইজ কমান এবং ডাউনলোডের আগেই নতুন সাইজ ও আগে/পরে (Before/After) কোয়ালিটি প্রিভিউ তুলনা করে দেখুন।'
  },
  {
    slug: 'organize',
    tabId: 'organize',
    title: 'অর্গানাইজ ও রোটেট PDF',
    seoTitle: 'অর্গানাইজ ও রোটেট PDF — পেজ সাজান, ঘোরান, ডিলিট ও পেজ নম্বর দিন | TechHat',
    seoDesc: 'PDF পৃষ্ঠাগুলো ড্র্যাগ করে ক্রম পরিবর্তন করুন, ঘোরান (Rotate), ডুপ্লিকেট বা ডিলিট করুন এবং পাতার নিচে পেজ নম্বর ও ওয়াটারমার্ক যুক্ত করুন।'
  },
  {
    slug: 'pdf-to-other',
    tabId: 'pdf2other',
    title: 'PDF → JPG / Word / Text',
    seoTitle: 'PDF কনভার্টার — PDF থেকে JPG, PNG, Word (.doc) ও টেক্সট | TechHat',
    seoDesc: 'PDF ফাইলের প্রতিটি পৃষ্ঠাকে হাই-রেজোলিউশন JPG/PNG ছবিতে অথবা এডিটেবল MS Word (.doc) ও টেক্সট (.txt) ফাইলে রূপান্তর করুন।'
  },
  {
    slug: 'other-to-pdf',
    tabId: 'other2pdf',
    title: 'ছবি ও অফিস ফাইল → PDF',
    seoTitle: 'JPG, PNG, Word, PowerPoint, Excel ও টেক্সট থেকে PDF তৈরি করুন | TechHat',
    seoDesc: 'একাধিক ছবি (JPG, PNG, WebP), অফিস ডকুমেন্ট (.docx, .pptx, .xlsx) কিংবা বাংলা (ইউনিকোড ও বিজয়) লেখা থেকে সরাসরি A4 প্রিন্ট-রেডি PDF তৈরি করুন।'
  }
];

export const IMAGE_SUBTOOLS: ImageSubToolMeta[] = [
  {
    slug: 'resize',
    tabId: 'resize',
    title: 'রিসাইজ ও সরকারি ফর্ম প্রিসেট',
    seoTitle: 'ইমেজ রিসাইজার — সরকারি চাকরির ছবি (300×300), আনসার (250×250) ও স্বাক্ষর (300×80, 300×100) | TechHat',
    seoDesc: 'এক ক্লিকে সরকারি চাকরির আবেদনের ছবি (300×300), আনসার ভিডিপি (250×250), স্বাক্ষর (300×80 ও 300×100), পাসপোর্ট ও স্ট্যাম্প সাইজ এবং মাউস/টাচ ড্রাগ পজিশনিংসহ ছবি রিসাইজ করুন।'
  },
  {
    slug: 'compress',
    tabId: 'compress',
    title: 'কমপ্রেস ইমেজ',
    seoTitle: 'কমপ্রেস ইমেজ (Compress Image) — কোয়ালিটি ঠিক রেখে ছবির KB কমান | TechHat',
    seoDesc: 'JPG, PNG ও WebP ছবির ফাইল সাইজ (KB) কমান এবং ডাউনলোডের আগেই আগে/পরে (Before/After) কোয়ালিটি প্রিভিউ দেখে নিন।'
  },
  {
    slug: 'crop',
    tabId: 'crop',
    title: 'ক্রপ, কাস্টম সাইজ ও রাউন্ড ফটো',
    seoTitle: 'ইমেজ ক্রপ, কাস্টম সাইজ (px), রোটেট ও বৃত্তাকার প্রোফাইল ছবি তৈরি | TechHat',
    seoDesc: 'ছবি যেকোনো কাস্টম পিক্সেল মাপে (যেমন 250×250, 300×100, 300×300) বা অনুপাতে ক্রপ (Crop) করুন, ঘোরান (Rotate/Flip), কিংবা গোল (Circle) প্রোফাইল ছবি তৈরি করুন।'
  },
  {
    slug: 'convert',
    tabId: 'convert',
    title: 'কনভার্ট, ইফেক্ট ও ওয়াটারমার্ক',
    seoTitle: 'ইমেজ কনভার্টার (JPG ⇄ PNG ⇄ WebP ⇄ Base64) ও ফটো ইফেক্ট | TechHat',
    seoDesc: 'ছবিকে JPG, PNG, WebP বা Base64 কোডে রূপান্তর করুন এবং ছবির ওপর বাংলা/ইংরেজি লেখা (Watermark), বর্ডার ও ফটো ইফেক্ট যুক্ত করুন।'
  },
  {
    slug: 'combine',
    tabId: 'combine',
    title: 'আইডি কার্ড স্ক্যানার ও জোড়া',
    seoTitle: 'আইডি কার্ড স্ক্যানার, পাসপেক্টিভ ক্রপ, কালার এডজাস্ট ও A4 প্রিন্ট মেকার | TechHat',
    seoDesc: 'জাতীয় পরিচয়পত্র (NID) বা যেকোনো কার্ডের সামনের ও পেছনের অংশ অটো এজ ডিটেকশন ও পাসপেক্টিভ ক্রপ করে সোজা করুন, কালার এডজাস্ট করুন এবং উপরে-নিচে A4 প্রিন্ট শিটে বসান।'
  },
  {
    slug: 'colors',
    tabId: 'colors',
    title: 'কালার পিকার ও প্যালেট',
    seoTitle: 'ইমেজ কালার পিকার ও কালার প্যালেট জেনারেটর (HEX / RGB) | TechHat',
    seoDesc: 'যেকোনো ছবি থেকে প্রধান রঙগুলোর কালার প্যালেট (Color Palette) এবং ছবির যেকোনো বিন্দুতে ক্লিক করে নিখুঁত HEX ও RGB কোড কপি করুন।'
  }
];

export function getToolMeta(id: ToolMeta['id']): ToolMeta {
  return TOOLS.find((t) => t.id === id) || TOOLS[0];
}

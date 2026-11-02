export type CategoryId = 'bangla' | 'pdf' | 'image' | 'dates' | 'business' | 'utilities';

export interface CategoryMeta {
  id: CategoryId;
  href: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  longDesc: string;
  badge: string;
  badgeEn: string;
  color: 'emerald' | 'crimson' | 'teal' | 'blue' | 'purple' | 'amber' | 'rose';
  lucideIcon: string;
  seoTitle: string;
  seoDesc: string;
}

export interface StudioToolItem {
  id: string;
  categoryId: CategoryId;
  href: string;
  aliases?: string[];
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  badge: string;
  badgeEn: string;
  color: 'emerald' | 'crimson' | 'teal' | 'blue' | 'purple' | 'amber' | 'rose';
  lucideIcon: string;
  keywords: string;
  popular?: boolean;
  seoTitle: string;
  seoDesc: string;
}

export type StudioTool = StudioToolItem;

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
  titleEn: string;
  desc: string;
  descEn: string;
  lucideIcon: string;
  keywords: string;
  popular?: boolean;
  seoTitle: string;
  seoDesc: string;
}

export interface ImageSubToolMeta {
  slug: string;
  tabId: 'resize' | 'compress' | 'crop' | 'convert' | 'combine' | 'scan' | 'colors';
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  lucideIcon: string;
  keywords: string;
  popular?: boolean;
  seoTitle: string;
  seoDesc: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'bangla',
    href: '/bangla',
    title: 'বাংলা ও অফিস',
    titleEn: 'Bangla & Office',
    desc: 'বিজয় ⇄ ইউনিকোড, অফিস ফাইল ও ভয়েস',
    descEn: 'Bijoy ⇄ Unicode, Office files & voice',
    longDesc: 'বিজয় ও ইউনিকোড টেক্সট, Word/Excel/PPT ফাইল কনভার্টার এবং ভয়েস টাইপিং।',
    badge: 'বাংলা ও অফিস',
    badgeEn: 'Bangla & Office',
    color: 'emerald',
    lucideIcon: 'lucide:languages',
    seoTitle: 'বাংলা ও অফিস টুলস — বিজয় ⇄ ইউনিকোড, Word/Excel কনভার্টার ও ভয়েস টাইপ | TechHat Studio',
    seoDesc: 'বিজয় থেকে ইউনিকোড এবং ইউনিকোড থেকে বিজয়ে টেক্সট ও অফিস ফাইল (.docx, .xlsx, .pptx, .rtf) রূপান্তর এবং বাংলা ভয়েস টাইপিং।'
  },
  {
    id: 'pdf',
    href: '/pdf',
    title: 'পিডিএফ স্টুডিও',
    titleEn: 'PDF Studio',
    desc: 'মার্জ, স্প্লিট, কমপ্রেস ও কনভার্ট',
    descEn: 'Merge, split, compress & convert',
    longDesc: 'PDF মার্জ, স্প্লিট, সাইজ কমপ্রেস, পেজ অর্গানাইজ এবং PDF ⇄ JPG/Word রূপান্তর।',
    badge: 'PDF টুলস',
    badgeEn: 'PDF Tools',
    color: 'crimson',
    lucideIcon: 'lucide:file-text',
    seoTitle: 'পিডিএফ স্টুডিও (PDF Studio) — মার্জ, স্প্লিট, কমপ্রেস ও কনভার্ট | TechHat Studio',
    seoDesc: 'ফ্রি অনলাইন ও অফলাইন PDF টুলস — PDF মার্জ, স্প্লিট, কমপ্রেস, পেজ রোটেশন ও অর্গানাইজ এবং PDF কনভার্টার।'
  },
  {
    id: 'image',
    href: '/image',
    title: 'ইমেজ স্টুডিও',
    titleEn: 'Image Studio',
    desc: 'ডকুমেন্ট স্ক্যানার, রিসাইজ ও NID',
    descEn: 'Document scanner, resize & NID',
    longDesc: 'ডকুমেন্ট স্ক্যানার, NID স্ক্যানার, চাকরির ছবি রিসাইজার, কমপ্রেসর এবং কালার পিকার।',
    badge: 'ইমেজ স্টুডিও',
    badgeEn: 'Image Studio',
    color: 'teal',
    lucideIcon: 'lucide:scan-line',
    seoTitle: 'ইমেজ স্টুডিও (Image Studio) — ডকুমেন্ট স্ক্যানার, ছবি রিসাইজ, ক্রপ ও NID স্ক্যানার | TechHat Studio',
    seoDesc: 'ডকুমেন্ট স্ক্যানার, সরকারি চাকরির ছবি (300×300) ও স্বাক্ষর (300×80) রিসাইজার, ইমেজ কমপ্রেসর, ক্রপ ও NID স্ক্যানার।'
  },
  {
    id: 'dates',
    href: '/dates',
    title: 'ক্যালেন্ডার ও তারিখ',
    titleEn: 'Calendar & Dates',
    desc: 'বাংলা তারিখ, বয়স ও দিন গণনা',
    descEn: 'Bangla calendar, age & date math',
    longDesc: 'ইংরেজি, বাংলা ও হিজরি তারিখ রূপান্তর, নিখুঁত বয়স নির্ণয় এবং দিন গণনা।',
    badge: 'তারিখ ও সময়',
    badgeEn: 'Dates & Time',
    color: 'blue',
    lucideIcon: 'lucide:calendar-days',
    seoTitle: 'ক্যালেন্ডার ও তারিখ টুলস — বাংলা তারিখ কনভার্টার, বয়স ও দিন গণনা | TechHat Studio',
    seoDesc: 'ইংরেজি, বাংলা ও হিজরি তারিখ রূপান্তর, নিখুঁত বয়স ক্যালকুলেটর এবং তারিখের ব্যবধান হিসাব।'
  },
  {
    id: 'utilities',
    href: '/utilities',
    title: 'ইউটিলিটিস',
    titleEn: 'Utilities',
    desc: 'ইনভয়েস মেকার, চাকরির ছবি, কালার ও Base64',
    descEn: 'Invoice maker, job photo, colors & Base64',
    longDesc: 'প্রিন্ট-রেডি A4 ইনভয়েস ও ক্যাশ মেমো, সরকারি চাকরির ফটো প্রিসেট, HEX/RGB কালার প্যালেট এবং Base64।',
    badge: 'ইউটিলিটিস',
    badgeEn: 'Utilities',
    color: 'purple',
    lucideIcon: 'lucide:sparkles',
    seoTitle: 'ইউটিলিটি টুলস — ইনভয়েস মেকার, কালার পিকার, Base64 ও ফটো প্রিসেট | TechHat Studio',
    seoDesc: 'ইনভয়েস ও ক্যাশ মেমো জেনারেটর, কালার পিকার ও প্যালেট জেনারেটর, ইমেজ টু Base64 এবং সরকারি চাকরির ছবি রিসাইজার।'
  }
];

export const PDF_SUBTOOLS: PdfSubToolMeta[] = [
  {
    slug: 'merge',
    tabId: 'merge',
    title: 'মার্জ PDF',
    titleEn: 'Merge PDF',
    desc: 'একাধিক PDF ও অফিস ফাইল একত্রিত করুন',
    descEn: 'Combine PDFs, images & Office files',
    lucideIcon: 'lucide:merge',
    keywords: 'merge pdf combine pdf join pdf word to pdf পিডিএফ মার্জ একত্রিত জোড়া',
    popular: true,
    seoTitle: 'মার্জ PDF (Merge PDF) — PDF, ছবি, Word, PPTX এক ফাইলে একত্রিত করুন | TechHat',
    seoDesc: 'একাধিক PDF ফাইলের সাথে JPG, PNG, Word, PowerPoint ও Excel ফাইল যোগ করে একটি PDF তৈরি করুন।'
  },
  {
    slug: 'split',
    tabId: 'split',
    title: 'স্প্লিট PDF',
    titleEn: 'Split PDF',
    desc: 'নির্দিষ্ট পেজ বা রেঞ্জ আলাদা করুন',
    descEn: 'Extract page ranges or separate pages',
    lucideIcon: 'lucide:split',
    keywords: 'split pdf extract pages separate pdf স্প্লিট পেজ আলাদা ভাগ',
    popular: true,
    seoTitle: 'স্প্লিট PDF (Split PDF) — পেজ রেঞ্জ বা আলাদা পৃষ্ঠা এক্সট্র্যাক্ট করুন | TechHat',
    seoDesc: 'বড় PDF ফাইল থেকে নির্দিষ্ট পৃষ্ঠা বা পেজ রেঞ্জ আলাদা করুন কিংবা প্রতিটি পৃষ্ঠা আলাদা PDF হিসেবে ডাউনলোড করুন।'
  },
  {
    slug: 'compress',
    tabId: 'compress',
    title: 'কমপ্রেস PDF',
    titleEn: 'Compress PDF',
    desc: 'মান ঠিক রেখে ফাইলের সাইজ কমান',
    descEn: 'Reduce PDF file size with preview',
    lucideIcon: 'lucide:file-archive',
    keywords: 'compress pdf reduce pdf size shrink pdf kb কমানো সাইজ কমপ্রেস',
    popular: true,
    seoTitle: 'কমপ্রেস PDF (Compress PDF) — প্রিভিউ দেখে PDF ফাইলের সাইজ কমান | TechHat',
    seoDesc: 'PDF ফাইলের সাইজ কমান এবং ডাউনলোডের আগেই নতুন সাইজ ও কোয়ালিটি প্রিভিউ তুলনা করে দেখুন।'
  },
  {
    slug: 'organize',
    tabId: 'organize',
    title: 'অর্গানাইজ PDF',
    titleEn: 'Organize PDF',
    desc: 'পেজ সাজান, ঘোরান ও পেজ নম্বর দিন',
    descEn: 'Reorder, rotate & number PDF pages',
    lucideIcon: 'lucide:files',
    keywords: 'organize pdf rotate pdf reorder delete pages watermark page number পেজ সাজানো ঘোরানো',
    seoTitle: 'অর্গানাইজ ও রোটেট PDF — পেজ সাজান, ঘোরান, ডিলিট ও পেজ নম্বর দিন | TechHat',
    seoDesc: 'PDF পৃষ্ঠাগুলো ড্র্যাগ করে ক্রম পরিবর্তন করুন, ঘোরান, ডিলিট করুন এবং পেজ নম্বর যুক্ত করুন।'
  },
  {
    slug: 'pdf-to-other',
    tabId: 'pdf2other',
    title: 'PDF কনভার্টার',
    titleEn: 'PDF Converter',
    desc: 'PDF থেকে JPG, PNG, Word ও Text',
    descEn: 'Export PDF to JPG, PNG, Word & Text',
    lucideIcon: 'lucide:file-output',
    keywords: 'pdf to jpg pdf to png pdf to word pdf to text converter পিডিএফ থেকে ছবি ওয়ার্ড',
    popular: true,
    seoTitle: 'PDF কনভার্টার — PDF থেকে JPG, PNG, Word (.doc) ও টেক্সট | TechHat',
    seoDesc: 'PDF ফাইলের প্রতিটি পৃষ্ঠাকে হাই-রেজোলিউশন JPG/PNG ছবিতে অথবা এডিটেবল MS Word (.doc) ও টেক্সট ফাইলে রূপান্তর করুন।'
  },
  {
    slug: 'other-to-pdf',
    tabId: 'other2pdf',
    title: 'ফাইল → PDF',
    titleEn: 'Files to PDF',
    desc: 'ছবি, Word, Excel ও টেক্সট থেকে PDF',
    descEn: 'Images, Word, Excel & text to PDF',
    lucideIcon: 'lucide:file-input',
    keywords: 'jpg to pdf image to pdf word to pdf excel to pdf pptx to pdf ছবি থেকে পিডিএফ',
    seoTitle: 'JPG, PNG, Word, PowerPoint, Excel ও টেক্সট থেকে PDF তৈরি করুন | TechHat',
    seoDesc: 'একাধিক ছবি (JPG, PNG, WebP), অফিস ডকুমেন্ট (.docx, .pptx, .xlsx) কিংবা বাংলা লেখা থেকে সরাসরি A4 PDF তৈরি করুন।'
  }
];

export const IMAGE_SUBTOOLS: ImageSubToolMeta[] = [
  {
    slug: 'scan',
    tabId: 'scan',
    title: 'ডকুমেন্ট স্ক্যানার',
    titleEn: 'Document Scanner',
    desc: 'অটো ক্রপ, শ্যাডো ফিক্স ও মাল্টিপেজ PDF',
    descEn: 'Auto crop, deskew, shadow fix & PDF',
    lucideIcon: 'lucide:scan-line',
    keywords: 'document scanner camscanner auto crop deskew magic+ shadow remove retouch pdf ডকুমেন্ট স্ক্যানার ক্যামস্ক্যানার',
    popular: true,
    seoTitle: 'ডকুমেন্ট স্ক্যানার — অটো ক্রপ, শ্যাডো সংশোধন ও মাল্টিপেজ PDF | TechHat',
    seoDesc: 'ডকুমেন্টের ছবি অটো পেজ ডিটেকশন ও পার্সপেক্টিভ ক্রপ করে সোজা করুন, শ্যাডো কমান এবং PDF বা JPG ডাউনলোড করুন।'
  },
  {
    slug: 'resize',
    tabId: 'resize',
    title: 'ইমেজ রিসাইজার',
    titleEn: 'Image Resizer',
    desc: 'সরকারি চাকরির ছবি (300×300) ও স্বাক্ষর',
    descEn: 'Govt job photo (300×300) & signature',
    lucideIcon: 'lucide:scaling',
    keywords: 'image resize 300x300 300x80 250x250 300x100 passport photo signature teletalk job photo ছবি রিসাইজ স্বাক্ষর চাকরির ছবি আনসার',
    popular: true,
    seoTitle: 'ইমেজ রিসাইজার — সরকারি চাকরির ছবি (300×300) ও স্বাক্ষর (300×80) | TechHat',
    seoDesc: 'সরকারি চাকরির আবেদনের ছবি (300×300), আনসার ভিডিপি (250×250), স্বাক্ষর (300×80) ও পাসপোর্ট সাইজ ছবি রিসাইজ করুন।'
  },
  {
    slug: 'compress',
    tabId: 'compress',
    title: 'কমপ্রেস ইমেজ',
    titleEn: 'Compress Image',
    desc: 'কোয়ালিটি ঠিক রেখে ছবির KB কমান',
    descEn: 'Reduce image file size in KB',
    lucideIcon: 'lucide:file-down',
    keywords: 'compress image reduce photo kb 50kb 100kb jpg png webp ছবি কমপ্রেস সাইজ কমানো',
    popular: true,
    seoTitle: 'কমপ্রেস ইমেজ (Compress Image) — কোয়ালিটি ঠিক রেখে ছবির KB কমান | TechHat',
    seoDesc: 'JPG, PNG ও WebP ছবির ফাইল সাইজ (KB) কমান এবং ডাউনলোডের আগেই কোয়ালিটি প্রিভিউ দেখে নিন।'
  },
  {
    slug: 'crop',
    tabId: 'crop',
    title: 'ক্রপ ও রাউন্ড ফটো',
    titleEn: 'Crop & Circle Photo',
    desc: 'কাস্টম মাপ, রোটেট ও বৃত্তাকার ছবি',
    descEn: 'Custom dimensions, rotate & circle avatar',
    lucideIcon: 'lucide:crop',
    keywords: 'crop image rotate flip circle avatar round profile photo ছবি ক্রপ গোল ছবি',
    seoTitle: 'ইমেজ ক্রপ, কাস্টম সাইজ (px), রোটেট ও বৃত্তাকার প্রোফাইল ছবি তৈরি | TechHat',
    seoDesc: 'ছবি যেকোনো কাস্টম পিক্সেল মাপে ক্রপ করুন, ঘোরান কিংবা গোল প্রোফাইল ছবি তৈরি করুন।'
  },
  {
    slug: 'convert',
    tabId: 'convert',
    title: 'ফরম্যাট ও ওয়াটারমার্ক',
    titleEn: 'Convert & Watermark',
    desc: 'JPG ⇄ PNG ⇄ WebP এবং ফটো ওয়াটারমার্ক',
    descEn: 'JPG ⇄ PNG ⇄ WebP & text watermark',
    lucideIcon: 'lucide:refresh-cw',
    keywords: 'image converter jpg to png webp to jpg base64 watermark photo filter ছবি কনভার্ট ওয়াটারমার্ক',
    seoTitle: 'ইমেজ কনভার্টার (JPG ⇄ PNG ⇄ WebP ⇄ Base64) ও ফটো ইফেক্ট | TechHat',
    seoDesc: 'ছবিকে JPG, PNG, WebP বা Base64 কোডে রূপান্তর করুন এবং ছবির ওপর ওয়াটারমার্ক যুক্ত করুন।'
  },
  {
    slug: 'combine',
    tabId: 'combine',
    title: 'NID কার্ড স্ক্যানার',
    titleEn: 'NID Card Scanner',
    desc: 'কার্ডের দুই পাশ ক্রপ করে A4 পাতায় বসান',
    descEn: 'Front & back perspective crop on A4',
    lucideIcon: 'lucide:id-card',
    keywords: 'nid scanner id card combine front back a4 print perspective crop এনআইডি স্ক্যানার আইডি কার্ড জোড়া',
    popular: true,
    seoTitle: 'আইডি কার্ড স্ক্যানার, পাসপেক্টিভ ক্রপ ও A4 প্রিন্ট মেকার | TechHat',
    seoDesc: 'জাতীয় পরিচয়পত্র (NID) বা কার্ডের সামনের ও পেছনের অংশ ক্রপ করে সোজা করুন এবং A4 প্রিন্ট শিটে বসান।'
  },
  {
    slug: 'colors',
    tabId: 'colors',
    title: 'কালার পিকার',
    titleEn: 'Color Picker',
    desc: 'ছবি থেকে রঙের প্যালেট ও HEX/RGB কোড',
    descEn: 'Extract color palette & HEX/RGB codes',
    lucideIcon: 'lucide:palette',
    keywords: 'color picker eyedropper hex rgb palette generator কালার পিকার রঙ কোড',
    seoTitle: 'ইমেজ কালার পিকার ও কালার প্যালেট জেনারেটর (HEX / RGB) | TechHat',
    seoDesc: 'যেকোনো ছবি থেকে প্রধান রঙগুলোর কালার প্যালেট এবং নিখুঁত HEX ও RGB কোড কপি করুন।'
  }
];

export const ALL_TOOLS: StudioToolItem[] = [
  // A. Bangla & Office Tools
  {
    id: 'bijoy-to-unicode',
    categoryId: 'bangla',
    href: '/bangla/bijoy-to-unicode',
    title: 'বিজয় ⇄ ইউনিকোড',
    titleEn: 'Bijoy ⇄ Unicode',
    desc: 'তাৎক্ষণিক বাংলা টেক্সট ও ফন্ট রূপান্তর',
    descEn: 'Instant Bangla font & text converter',
    badge: 'টেক্সট',
    badgeEn: 'Text',
    color: 'emerald',
    lucideIcon: 'lucide:languages',
    keywords: 'bijoy to unicode unicode to bijoy bangla font converter sutonnymj অভ্র বিজয় ইউনিকোড বাংলা ফন্ট কনভার্টার',
    popular: true,
    seoTitle: 'বিজয় ⇄ ইউনিকোড কনভার্টার — নিখুঁত, অফলাইন, ফ্রি | TechHat Studio',
    seoDesc: 'বিজয় (SutonnyMJ) থেকে ইউনিকোড এবং ইউনিকোড থেকে বিজয়ে নিখুঁত রূপান্তর।'
  },
  {
    id: 'office-converter',
    categoryId: 'bangla',
    href: '/bangla/office-converter',
    title: 'অফিস ফাইল কনভার্টার',
    titleEn: 'Office File Converter',
    desc: 'DOCX, XLSX ও PPTX ফাইলের ফন্ট রূপান্তর',
    descEn: 'Convert DOCX, XLSX & PPTX Bangla fonts',
    badge: 'অফিস ফাইল',
    badgeEn: 'Office',
    color: 'emerald',
    lucideIcon: 'lucide:file-spreadsheet',
    keywords: 'docx converter word bijoy to unicode excel bangla converter pptx rtf অফিস ফাইল ওয়ার্ড এক্সেল পাওয়ারপয়েন্ট কনভার্টার',
    popular: true,
    seoTitle: 'অফিস ফাইল কনভার্টার (DOCX, XLSX, PPTX) — বিজয় ⇄ ইউনিকোড | TechHat Studio',
    seoDesc: 'MS Word (.docx), Excel (.xlsx), PowerPoint (.pptx) এবং RTF ফাইলের ফরম্যাটিং অক্ষত রেখে বিজয় ⇄ ইউনিকোড রূপান্তর।'
  },
  {
    id: 'voice-typing',
    categoryId: 'bangla',
    href: '/bangla/voice-typing',
    title: 'ভয়েস টাইপিং',
    titleEn: 'Voice Typing',
    desc: 'কথা বলে বাংলা (ইউনিকোড/বিজয়) ও ইংরেজি টাইপ',
    descEn: 'Bangla (Unicode/Bijoy) & English speech to text',
    badge: 'ভয়েস',
    badgeEn: 'Voice',
    color: 'emerald',
    lucideIcon: 'lucide:mic',
    keywords: 'bangla voice typing speech to text microphone কথা বলে বাংলা টাইপ ভয়েস টাইপিং',
    seoTitle: 'বাংলা ভয়েস টাইপিং — কথা বলে ইউনিকোড ও বিজয় টাইপ করুন | TechHat Studio',
    seoDesc: 'মাইক্রোফোনে কথা বলে সরাসরি বাংলা ইউনিকোড ও বিজয় (SutonnyMJ) ফন্টে টাইপ করুন।'
  },

  // B. PDF Studio
  ...PDF_SUBTOOLS.map((s): StudioToolItem => ({
    id: `pdf-${s.slug}`,
    categoryId: 'pdf',
    href: `/pdf/${s.slug}`,
    title: s.title,
    titleEn: s.titleEn,
    desc: s.desc,
    descEn: s.descEn,
    badge: 'PDF',
    badgeEn: 'PDF',
    color: 'crimson',
    lucideIcon: s.lucideIcon,
    keywords: s.keywords,
    popular: s.popular,
    seoTitle: s.seoTitle,
    seoDesc: s.seoDesc
  })),

  // C. Image & Scanner Studio
  ...IMAGE_SUBTOOLS.map((s): StudioToolItem => ({
    id: `image-${s.slug}`,
    categoryId: 'image',
    href: `/image/${s.slug}`,
    aliases: s.slug === 'scan' ? ['/image/scanner'] : undefined,
    title: s.title,
    titleEn: s.titleEn,
    desc: s.desc,
    descEn: s.descEn,
    badge: s.slug === 'scan' ? 'স্ক্যানার' : 'ইমেজ',
    badgeEn: s.slug === 'scan' ? 'Scanner' : 'Image',
    color: 'teal',
    lucideIcon: s.lucideIcon,
    keywords: s.keywords,
    popular: s.popular,
    seoTitle: s.seoTitle,
    seoDesc: s.seoDesc
  })),

  // D. Calendar & Date Tools
  {
    id: 'calendar',
    categoryId: 'dates',
    href: '/calendar',
    title: 'তারিখ কনভার্টার',
    titleEn: 'Date Converter',
    desc: 'বাংলা, ইংরেজি ও হিজরি ক্যালেন্ডার রূপান্তর',
    descEn: 'Bangla, Gregorian & Hijri date converter',
    badge: 'ক্যালেন্ডার',
    badgeEn: 'Calendar',
    color: 'blue',
    lucideIcon: 'lucide:calendar-days',
    keywords: 'calendar date converter bangla date today hijri date আজকের বাংলা তারিখ হিজরি সন বঙ্গাব্দ ক্যালেন্ডার',
    popular: true,
    seoTitle: 'তারিখ কনভার্টার — ইংরেজি, বাংলা ও হিজরি ক্যালেন্ডার | TechHat Studio',
    seoDesc: 'ইংরেজি (গ্রেগরিয়ান), বাংলা বঙ্গাব্দ এবং আরবি হিজরি সনের তারিখ তাৎক্ষণিক রূপান্তর করুন।'
  },
  {
    id: 'age',
    categoryId: 'dates',
    href: '/age-calculator',
    aliases: ['/calendar/age-calculator'],
    title: 'বয়স ক্যালকুলেটর',
    titleEn: 'Age Calculator',
    desc: 'জন্মতারিখ থেকে নিখুঁত বয়স ও দিন নির্ণয়',
    descEn: 'Exact age & date of birth calculator',
    badge: 'বয়স',
    badgeEn: 'Age',
    color: 'purple',
    lucideIcon: 'lucide:cake',
    keywords: 'age calculator dob finder job age calculator বয়স ক্যালকুলেটর জন্মতারিখ হিসাব চাকরির বয়স',
    popular: true,
    seoTitle: 'বয়স ক্যালকুলেটর ও জন্মতারিখ নির্ণয় — বছর, মাস, দিন ও সেকেন্ড | TechHat Studio',
    seoDesc: 'জন্মতারিখ থেকে আপনার নিখুঁত বয়স অথবা বয়স থেকে সম্ভাব্য জন্মতারিখ বের করুন।'
  },
  {
    id: 'datecalc',
    categoryId: 'dates',
    href: '/date-calculator',
    aliases: ['/calendar/date-calculator'],
    title: 'দিন গণনা',
    titleEn: 'Date Duration',
    desc: 'তারিখের ব্যবধান ও দিন যোগ-বিয়োগ হিসাব',
    descEn: 'Add or subtract days from any date',
    badge: 'সময়',
    badgeEn: 'Duration',
    color: 'amber',
    lucideIcon: 'lucide:calendar-clock',
    keywords: 'date calculator add days subtract days duration দিন গণনা তারিখের ব্যবধান',
    seoTitle: 'দিন গণনা ও তারিখের ব্যবধান ক্যালকুলেটর | TechHat Studio',
    seoDesc: 'যেকোনো তারিখ থেকে নির্দিষ্ট বছর, মাস ও দিন যোগ বা বিয়োগ করে ভবিষ্যৎ কিংবা অতীতের তারিখ বের করুন।'
  },

  // E. Utilities (including Invoice & Cash Memo)
  {
    id: 'invoice',
    categoryId: 'utilities',
    href: '/invoice',
    aliases: ['/business/invoice-maker'],
    title: 'ইনভয়েস ও ক্যাশ মেমো',
    titleEn: 'Invoice & Cash Memo',
    desc: 'A4 বিল, ভ্যাট-ডিসকাউন্ট ও প্রিন্ট রেডি PDF',
    descEn: 'Print-ready A4 invoice & cash memo PDF',
    badge: 'ইনভয়েস',
    badgeEn: 'Invoice',
    color: 'rose',
    lucideIcon: 'lucide:receipt',
    keywords: 'invoice maker cash memo generator bill print pdf bangla takar kotha ইনভয়েস মেকার ক্যাশ মেমো বিল প্রিন্ট',
    popular: true,
    seoTitle: 'ফ্রি ইনভয়েস মেকার ও ক্যাশ মেমো জেনারেটর (A4 প্রিন্ট রেডি) | TechHat Studio',
    seoDesc: 'প্রফেশনাল A4 ইনভয়েস ও ক্যাশ মেমো তৈরি করুন এবং সরাসরি প্রিন্ট বা PDF সেভ করুন।'
  },

  // F. More Utilities
  {
    id: 'util-govt-photo',
    categoryId: 'utilities',
    href: '/image/resize',
    title: 'চাকরির ছবি ও স্বাক্ষর',
    titleEn: 'Govt Job Photo Preset',
    desc: '৩০০×৩০০ ছবি ও ৩০০×৮০ স্বাক্ষর এক ক্লিকে',
    descEn: '300×300 photo & 300×80 signature presets',
    badge: 'প্রিসেট',
    badgeEn: 'Preset',
    color: 'teal',
    lucideIcon: 'lucide:user-check',
    keywords: 'teletalk photo 300x300 signature 300x80 ansar vdp 250x250 সরকারি চাকরির ছবি স্বাক্ষর টেলিটক',
    seoTitle: 'সরকারি চাকরির ছবি (300×300) ও স্বাক্ষর (300×80) রিসাইজার | TechHat Studio',
    seoDesc: 'সরকারি চাকরির আবেদনের ছবি ও স্বাক্ষর সঠিক পিক্সেল ও KB সীমার মধ্যে রিসাইজ করুন।'
  },
  {
    id: 'util-color-palette',
    categoryId: 'utilities',
    href: '/image/colors',
    title: 'কালার প্যালেট এক্সট্র্যাক্টর',
    titleEn: 'Color Palette Extractor',
    desc: 'ছবি থেকে ডমিন্যান্ট কালার ও HEX/RGB কপি',
    descEn: 'Dominant colors & HEX/RGB code picker',
    badge: 'কালার',
    badgeEn: 'Colors',
    color: 'purple',
    lucideIcon: 'lucide:pipette',
    keywords: 'hex color picker rgb palette extractor ফটো কালার কোড পিকার',
    seoTitle: 'কালার প্যালেট ও HEX/RGB এক্সট্র্যাক্টর | TechHat Studio',
    seoDesc: 'ছবি থেকে প্রধান রঙগুলোর প্যালেট এবং HEX/RGB কোড বের করুন।'
  },
  {
    id: 'util-base64-watermark',
    categoryId: 'utilities',
    href: '/image/convert',
    title: 'Base64 ও ওয়াটারমার্ক',
    titleEn: 'Base64 & Watermark',
    desc: 'ইমেজ টু Base64 কোড ও কাস্টম ওয়াটারমার্ক',
    descEn: 'Image to Base64 URI & custom watermark',
    badge: 'ডেভ টুল',
    badgeEn: 'Dev Tool',
    color: 'amber',
    lucideIcon: 'lucide:code-2',
    keywords: 'image to base64 data url watermark text on photo ওয়াটারমার্ক বেস৬৪',
    seoTitle: 'ইমেজ টু Base64 ও বাংলা ওয়াটারমার্ক টুল | TechHat Studio',
    seoDesc: 'ছবিকে Base64 কোডে রূপান্তর করুন এবং ছবির ওপর ওয়াটারমার্ক যুক্ত করুন।'
  }
];

export const TOOLS: ToolMeta[] = [
  {
    id: 'bijoy',
    href: '/bangla/bijoy-to-unicode',
    title: 'বিজয় ⇄ ইউনিকোড',
    desc: 'টেক্সট, ভয়েস ও ফাইল রূপান্তর',
    badge: 'কনভার্টার',
    color: 'emerald',
    keywords: 'bijoy unicode bangla converter sutonny ফন্ট বিজয় ইউনিকোড ভয়েস টাইপ',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h14"/><path d="m18 14 3 3-3 3"/></svg>',
    seoTitle: 'বিজয় ⇄ ইউনিকোড কনভার্টার — নিখুঁত, অফলাইন, ফ্রি | TechHat Studio',
    seoDesc: 'বিজয় (SutonnyMJ) থেকে ইউনিকোড এবং ইউনিকোড থেকে বিজয়ে নিখুঁত রূপান্তর।'
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
    seoTitle: 'অল-ইন-ওয়ান PDF স্টুডিও — মার্জ, স্প্লিট, কমপ্রেস ও কনভার্ট | TechHat Studio',
    seoDesc: 'ফ্রি অনলাইন ও অফলাইন PDF টুলস — PDF মার্জ, স্প্লিট, কমপ্রেস ও কনভার্টার।'
  },
  {
    id: 'image',
    href: '/image',
    title: 'ইমেজ ও স্ক্যানার',
    desc: 'রিসাইজ, ক্রপ ও ডকুমেন্ট স্ক্যানার',
    badge: 'Image টুলস',
    color: 'teal',
    keywords: 'image resize compress crop convert jpg png webp passport photo signature 300x300 document scanner nid scanner',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    seoTitle: 'ইমেজ ও স্ক্যানার স্টুডিও — রিসাইজ, কমপ্রেস, ক্রপ ও ডকুমেন্ট স্ক্যানার | TechHat Studio',
    seoDesc: 'সরকারি চাকরির ছবি রিসাইজার, ইমেজ কমপ্রেসর, কাস্টম ক্রপ ও ডকুমেন্ট স্ক্যানার।'
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
    seoTitle: 'তারিখ কনভার্টার — ইংরেজি, বাংলা ও হিজরি ক্যালেন্ডার | TechHat Studio',
    seoDesc: 'ইংরেজি, বাংলা বঙ্গাব্দ এবং আরবি হিজরি সনের তারিখ তাৎক্ষণিক রূপান্তর করুন।'
  },
  {
    id: 'age',
    href: '/age-calculator',
    title: 'বয়স ক্যালকুলেটর',
    desc: 'বয়স ও জন্মতারিখ নির্ণয়',
    badge: 'বয়স হিসাব',
    color: 'purple',
    keywords: 'age calculator dob birthday বয়স ক্যালকুলেটর জন্মতারিখ হিসাব',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/></svg>',
    seoTitle: 'বয়স ক্যালকুলেটর ও জন্মতারিখ নির্ণয় | TechHat Studio',
    seoDesc: 'জন্মতারিখ থেকে আপনার নিখুঁত বয়স অথবা বয়স থেকে সম্ভাব্য জন্মতারিখ বের করুন।'
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
    seoTitle: 'দিন গণনা ও তারিখের ব্যবধান ক্যালকুলেটর | TechHat Studio',
    seoDesc: 'যেকোনো তারিখ থেকে নির্দিষ্ট বছর, মাস ও দিন যোগ বা বিয়োগ করে তারিখ বের করুন।'
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
    seoTitle: 'ফ্রি ইনভয়েস মেকার ও ক্যাশ মেমো জেনারেটর (A4 প্রিন্ট রেডি) | TechHat Studio',
    seoDesc: 'প্রফেশনাল A4 ইনভয়েস ও ক্যাশ মেমো তৈরি করুন এবং সরাসরি প্রিন্ট বা PDF সেভ করুন।'
  }
];

export function getToolMeta(id: ToolMeta['id']): ToolMeta {
  return TOOLS.find((t) => t.id === id) || TOOLS[0];
}

export function getCategoryMeta(id: CategoryId): CategoryMeta {
  const normalized = id === 'business' ? 'utilities' : id;
  return CATEGORIES.find((c) => c.id === normalized) || CATEGORIES[0];
}

export function getToolsByCategory(id: CategoryId): StudioToolItem[] {
  const normalized = id === 'business' ? 'utilities' : id;
  return ALL_TOOLS.filter((t) => t.categoryId === normalized);
}

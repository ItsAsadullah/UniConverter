<script lang="ts">
  import Icon from './ui/Icon.svelte';

  interface Props {
    hidden?: boolean;
  }

  let { hidden = false }: Props = $props();

  const categories = [
    { id: 'all', labelBn: 'সব (৪৫)', labelEn: 'All (45)', icon: 'lucide:layout-grid' },
    { id: 'charity', labelBn: 'ফাউন্ডেশন (৯)', labelEn: 'Charity (9)', icon: 'lucide:heart-handshake' },
    { id: 'news', labelBn: 'নিউজ (১১)', labelEn: 'News (11)', icon: 'lucide:newspaper' },
    { id: 'quote', labelBn: 'উক্তি (১৩)', labelEn: 'Quotes (13)', icon: 'lucide:quote' },
    { id: 'factcheck', labelBn: 'ফ্যাক্ট-চেক (৩)', labelEn: 'Fact-Check (3)', icon: 'lucide:badge-check' },
    { id: 'modern', labelBn: 'মডার্ন (৯)', labelEn: 'Modern (9)', icon: 'lucide:sparkles' }
  ];

  const categorySections: Array<{
    id: 'charity' | 'news' | 'quote' | 'factcheck' | 'modern';
    titleBn: string;
    titleEn: string;
    icon: string;
  }> = [
    { id: 'charity', titleBn: 'ফাউন্ডেশন ও মানবিক সেবা (৯)', titleEn: 'Charity & Humanitarian (9)', icon: 'lucide:heart-handshake' },
    { id: 'news', titleBn: 'নিউজ পোর্টাল ও টিভি কার্ড (১১)', titleEn: 'News Portal & TV Cards (11)', icon: 'lucide:newspaper' },
    { id: 'quote', titleBn: 'উক্তি, বিবৃতি ও পডকাস্ট (১৩)', titleEn: 'Quotes, Statements & Podcast (13)', icon: 'lucide:quote' },
    { id: 'factcheck', titleBn: 'ফ্যাক্ট-চেক ও গুজব যাচাই (৩)', titleEn: 'Fact-Check & Verification (3)', icon: 'lucide:badge-check' },
    { id: 'modern', titleBn: 'মডার্ন, টেক ও ইভেন্ট (৯)', titleEn: 'Modern, Tech & Events (9)', icon: 'lucide:sparkles' }
  ];

  interface TemplateItem {
    id: string;
    cat: 'charity' | 'news' | 'quote' | 'factcheck' | 'modern';
    nameBn: string;
    nameEn: string;
    whenToUseBn: string;
    whenToUseEn: string;
    sampleHeadlineBn: string;
    keywords: string;
    primary: string;
    accent: string;
    bg: string;
    tag?: string;
    tagEn?: string;
  }

  const templates: TemplateItem[] = [
    // 1. স্বেচ্ছাসেবী ফাউন্ডেশন ও মানবিক কার্যক্রম (8 Cards)
    {
      id: 'blood-donation',
      cat: 'charity',
      nameBn: 'জরুরি রক্তের প্রয়োজন',
      nameEn: 'Urgent Blood Appeal',
      whenToUseBn: 'মুমূর্ষু রোগীর রক্তদাতা খুঁজতে',
      whenToUseEn: 'Emergency blood donor appeal',
      sampleHeadlineBn: 'থ্যালাসেমিয়া রোগীর অস্ত্রোপচারের জন্য জরুরি ২ ব্যাগ O+ রক্তের প্রয়োজন',
      keywords: 'blood donation রক্ত রক্তদান ও পজিটিভ হাসপাতাল ফাউন্ডেশন',
      primary: '#dc2626', accent: '#fde047', bg: '#1c080b', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },
    {
      id: 'charity-appeal',
      cat: 'charity',
      nameBn: 'ত্রাণ ও মানবিক অনুদান',
      nameEn: 'Relief & Donation Fund',
      whenToUseBn: 'বন্যা, দুর্যোগ ও অসহায় তহবিল সংগ্রহে',
      whenToUseEn: 'Flood relief & emergency fundraising',
      sampleHeadlineBn: 'বন্যাকবলিত পানিবন্দি ৫০০ অসহায় পরিবারের মুখে খাবার তুলে দিতে এগিয়ে আসুন',
      keywords: 'charity relief flood ত্রাণ অনুদান বিকাশ নগদ বন্যা ফাউন্ডেশন',
      primary: '#059669', accent: '#fbbf24', bg: '#042619', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },
    {
      id: 'winter-eid-drive',
      cat: 'charity',
      nameBn: 'শীতবস্ত্র ও ঈদ উপহার ফান্ড',
      nameEn: 'Winter & Eid Gift Drive',
      whenToUseBn: 'কম্বল, ইফতার বা ঈদ উপহার ক্যাম্পেইনে',
      whenToUseEn: 'Blanket, Iftar & Eid gift campaigns',
      sampleHeadlineBn: 'উত্তরাঞ্চলের শীতার্ত মানুষের উষ্ণতায় ১টি কম্বল ফান্ড মাত্র ৫০০ টাকা',
      keywords: 'winter eid blanket শীতবস্ত্র কম্বল ঈদ ইফতার উপহার',
      primary: '#0d9488', accent: '#fcd34d', bg: '#062229', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },
    {
      id: 'zakat-sadakah',
      cat: 'charity',
      nameBn: 'যাকাত, সাদাকাহ ও এতিম ফান্ড',
      nameEn: 'Zakat, Sadaqah & Orphan Fund',
      whenToUseBn: 'রমজান, যাকাত তহবিল ও এতিম স্পন্সরশিপে',
      whenToUseEn: 'Ramadan Zakat & orphan sponsorship',
      sampleHeadlineBn: 'আপনার পবিত্র যাকাত ও সাদাকাহ পৌঁছে দিন প্রকৃত দুস্থ ও এতিম শিশুদের হাতে',
      keywords: 'zakat sadakah orphan যাকাত সাদাকাহ এতিম রমজান মসজিদ দান',
      primary: '#047857', accent: '#f59e0b', bg: '#071c18', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },
    {
      id: 'medical-camp',
      cat: 'charity',
      nameBn: 'ফ্রি মেডিকেল ও চক্ষু ক্যাম্প',
      nameEn: 'Free Medical & Eye Camp',
      whenToUseBn: 'বিনামূল্যে চিকিৎসা ও ব্লাড গ্রুপিং ক্যাম্পে',
      whenToUseEn: 'Free healthcare & blood grouping camp',
      sampleHeadlineBn: 'দরিদ্র মানুষের জন্য দিনব্যাপী বিনামূল্যে বিশেষজ্ঞ চিকিৎসা ও ওষুধ বিতরণ',
      keywords: 'medical health eye camp ফ্রি মেডিকেল চক্ষু ক্যাম্প স্বাস্থ্য চিকিৎসা',
      primary: '#0284c7', accent: '#38bdf8', bg: '#f8fafc', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },
    {
      id: 'tree-environment',
      cat: 'charity',
      nameBn: 'বৃক্ষরোপণ ও সবুজায়ন অভিযান',
      nameEn: 'Tree Plantation Campaign',
      whenToUseBn: 'চারা বিতরণ ও পরিবেশ সচেতনতায়',
      whenToUseEn: 'Sapling drive & green awareness',
      sampleHeadlineBn: 'সবুজ পৃথিবী গড়তে আমাদের লক্ষ্য ১০,০০০ ফলদ ও বনজ বৃক্ষরোপণ কর্মসূচি',
      keywords: 'tree plantation environment বৃক্ষরোপণ গাছ সবুজায়ন পরিবেশ চারা',
      primary: '#16a34a', accent: '#bef264', bg: '#072412', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },
    {
      id: 'charity-activity',
      cat: 'charity',
      nameBn: 'কার্যক্রম সম্পন্ন ও হিসাব রিপোর্ট',
      nameEn: 'Project Completion Report',
      whenToUseBn: 'সম্পন্ন প্রজেক্টের ছবি ও স্বচ্ছ হিসাব জানাতে',
      whenToUseEn: 'Completed distribution & audit summary',
      sampleHeadlineBn: 'আলহামদুলিল্লাহ! আপনাদের অনুদানে ৩৫০টি পরিবারে মাসব্যাপী খাদ্যসামগ্রী বিতরণ সম্পন্ন',
      keywords: 'activity report alhamdulillah কার্যক্রম সম্পন্ন হিসাব স্বচ্ছতা রিপোর্ট',
      primary: '#059669', accent: '#34d399', bg: '#091e1a', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },
    {
      id: 'volunteer-member',
      cat: 'charity',
      nameBn: 'রক্তদাতা ও স্বেচ্ছাসেবক সম্মাননা',
      nameEn: 'Donor & Volunteer Honor',
      whenToUseBn: 'রক্তদাতা অভিনন্দন ও কমিটি পরিচিতিতে',
      whenToUseEn: 'Blood donor tribute & member spotlight',
      sampleHeadlineBn: 'মুমূর্ষু রোগীর জীবন বাঁচাতে ১০ম বার স্বেচ্ছায় রক্তদান করায় আন্তরিক অভিনন্দন',
      keywords: 'volunteer donor member সম্মাননা অভিনন্দন স্বেচ্ছাসেবক কমিটি রক্তদাতা',
      primary: '#b45309', accent: '#fde047', bg: '#161108', tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    },

    // 2. নিউজ পোর্টাল ও টিভি কার্ড (8 Distinct News Cards)
    {
      id: 'kalbela-news',
      cat: 'news',
      nameBn: 'কালবেলা পোর্টাল স্টাইল',
      nameEn: 'Kalbela Portal Style',
      whenToUseBn: 'সংবাদ সম্মেলন ও প্রধান জাতীয় সংবাদের জন্য',
      whenToUseEn: 'National headlines & press conferences',
      sampleHeadlineBn: 'আগামী মাস থেকেই সারাদেশে চালু হচ্ছে স্মার্ট নাগরিক সেবা ডিজিটাল পোর্টাল',
      keywords: 'kalbela news portal কালবেলা জাতীয় সংবাদ পোর্টাল',
      primary: '#b91c1c', accent: '#fde047', bg: '#190608', tag: 'জনপ্রিয়', tagEn: 'Popular'
    },
    {
      id: 'janakantha-frame',
      cat: 'news',
      nameBn: 'জনকণ্ঠ ক্ল্যাসিক বক্স',
      nameEn: 'Janakantha Classic Frame',
      whenToUseBn: 'সরকারি সিদ্ধান্ত ও বর্ডার-বক্স ফটোকার্ডে',
      whenToUseEn: 'Official notices & framed news cards',
      sampleHeadlineBn: 'নিত্যপণ্যের বাজার স্থিতিশীল রাখতে বিভাগীয় শহরে বিশেষ মনিটরিং সেল গঠনের নির্দেশ',
      keywords: 'janakantha frame classic জনকণ্ঠ বক্স বর্ডার প্রশাসন সংবাদ',
      primary: '#991b1b', accent: '#f59e0b', bg: '#140c0c', tag: 'জনপ্রিয়', tagEn: 'Popular'
    },
    {
      id: 'breaking-news',
      cat: 'news',
      nameBn: 'ব্রেকিং নিউজ গ্রেডিয়েন্ট',
      nameEn: 'Breaking News Gradient',
      whenToUseBn: 'জরুরি ব্রেকিং নিউজ ও আবহাওয়া সতর্কতায়',
      whenToUseEn: 'Breaking alerts & weather warnings',
      sampleHeadlineBn: 'বঙ্গোপসাগরে গভীর নিম্নচাপ: উপকূলীয় বন্দরসমূহে ৪ নম্বর হুঁশিয়ারি সংকেত জারি',
      keywords: 'breaking news alert ব্রেকিং নিউজ আবহাওয়া জরুরি',
      primary: '#dc2626', accent: '#facc15', bg: '#0f172a'
    },
    {
      id: 'tv-lower-third',
      cat: 'news',
      nameBn: 'টিভি লাইভ বুলেটিন ব্যানার',
      nameEn: 'TV Live Lower-Third',
      whenToUseBn: 'টিভি স্ক্রিনশট ও মাঠ পর্যায়ের লাইভ আপডেটে',
      whenToUseEn: 'Broadcast updates & live field reports',
      sampleHeadlineBn: 'ঈদযাত্রা নির্বিঘ্ন করতে মহাসড়কে ড্রোন ও সিসিটিভি ক্যামেরায় সার্বক্ষণিক নজরদারি',
      keywords: 'tv live bulletin lower third টিভি লাইভ বুলেটিন ব্যানার',
      primary: '#e11d48', accent: '#facc15', bg: '#090d16'
    },
    {
      id: 'vertical-sidebar',
      cat: 'news',
      nameBn: 'ভার্টিক্যাল স্পোর্টস ও ডেস্ক',
      nameEn: 'Vertical Sports & Desk',
      whenToUseBn: 'ক্রিকেট/ফুটবল ম্যাচের ফলাফল ও আন্তর্জাতিক খবরে',
      whenToUseEn: 'Sports scores & international desk',
      sampleHeadlineBn: 'রুদ্ধশ্বাস ফাইনালে শেষ ওভারে দুর্দান্ত জয়ে ঐতিহাসিক সিরিজ চ্যাম্পিয়ন বাংলাদেশ',
      keywords: 'sports cricket football খেলাধুলা ক্রিকেট ফুটবল আন্তর্জাতিক',
      primary: '#dc2626', accent: '#fbbf24', bg: '#0c1220'
    },
    {
      id: 'minimal-portal',
      cat: 'news',
      nameBn: 'মিনিমাল অর্থনীতি ও কর্পোরেট',
      nameEn: 'Minimal Economy & Corporate',
      whenToUseBn: 'ব্যাংক, প্রবাসী আয় ও কর্পোরেট সংবাদের জন্য',
      whenToUseEn: 'Economy, remittance & business updates',
      sampleHeadlineBn: 'প্রবাসী আয়ে নতুন গতি: এক মাসেই রেমিট্যান্স ছাড়াল ২৬০ কোটি ডলারের মাইলফলক',
      keywords: 'minimal economy bank corporate অর্থনীতি ব্যাংক রেমিট্যান্স ব্যবসা',
      primary: '#1d4ed8', accent: '#dc2626', bg: '#f8fafc'
    },
    {
      id: 'floating-overlap',
      cat: 'news',
      nameBn: 'থ্রিডি ফ্লোটিং ফিচার কার্ড',
      nameEn: '3D Floating Feature Card',
      whenToUseBn: 'উন্নয়ন প্রকল্প, শিক্ষা ও বিশেষ ফিচার রিপোর্টে',
      whenToUseEn: 'Feature stories, campus & infrastructure',
      sampleHeadlineBn: 'মেট্রোরেল ও আধুনিক গণপরিবহনে বদলে যাচ্ছে রাজধানীর কর্মজীবী মানুষের জীবনযাত্রা',
      keywords: 'floating feature education থ্রিডি ফিচার শিক্ষা উন্নয়ন মেট্রোরেল',
      primary: '#2563eb', accent: '#38bdf8', bg: '#0f172a'
    },
    {
      id: 'newspaper-classic',
      cat: 'news',
      nameBn: 'দৈনিক পত্রিকা ক্লিপিং',
      nameEn: 'Daily Newspaper Clipping',
      whenToUseBn: 'অনুসন্ধানী প্রতিবেদন ও প্রিন্ট পত্রিকার লুক দিতে',
      whenToUseEn: 'Investigative stories & print edition look',
      sampleHeadlineBn: 'নদীভাঙন রোধ ও টেকসই বেড়িবাঁধ নির্মাণে দীর্ঘমেয়াদি মহাপরিকল্পনা বাস্তবায়ন জরুরি',
      keywords: 'newspaper print clipping দৈনিক পত্রিকা ক্লিপিং অনুসন্ধান',
      primary: '#b91c1c', accent: '#991b1b', bg: '#fbf8f1'
    },

    // 3. উক্তি, বিবৃতি ও পডকাস্ট (6 Quote Cards)
    {
      id: 'red-arc-quote',
      cat: 'quote',
      nameBn: 'রেড আর্ক বিশিষ্ট ব্যক্তির উক্তি',
      nameEn: 'Red Arc Speaker Quote',
      whenToUseBn: 'নেতৃবৃন্দ, শিক্ষক বা বিশিষ্ট ব্যক্তির আনুষ্ঠানিক বক্তব্যে',
      whenToUseEn: 'Public figures, educators & official quotes',
      sampleHeadlineBn: '“তরুণ প্রজন্মকে কেবল চাকরিপ্রার্থী নয়, দক্ষ উদ্যোক্তা হিসেবে গড়ে তুলতে হবে”',
      keywords: 'quote speech red arc উক্তি বক্তব্য নেতা শিক্ষক',
      primary: '#b91c1c', accent: '#fde047', bg: '#16070a'
    },
    {
      id: 'dark-border-quote',
      cat: 'quote',
      nameBn: 'ডার্ক নিয়ন বিবৃতি ও প্রতিবাদ',
      nameEn: 'Dark Neon Statement',
      whenToUseBn: 'জরুরি বিবৃতি, প্রতিবাদ ও মানবাধিকার মন্তব্যে',
      whenToUseEn: 'Press statements & urgent commentary',
      sampleHeadlineBn: '“জনস্বার্থ ও ন্যায়বিচারের প্রশ্নে কোনো ধরনের আপস বা অনিয়ম মেনে নেওয়া হবে না”',
      keywords: 'dark statement protest বিবৃতি প্রতিবাদ মন্তব্য',
      primary: '#e11d48', accent: '#fda4af', bg: '#09090b'
    },
    {
      id: 'notebook-quote',
      cat: 'quote',
      nameBn: 'নোটবুক পেপার ও মার্কার উক্তি',
      nameEn: 'Notebook & Marker Quote',
      whenToUseBn: 'পডকাস্ট ক্লিপ, টকশো সংলাপ ও অনুপ্রেরণামূলক কথায়',
      whenToUseEn: 'Podcast clips, talkshows & motivation',
      sampleHeadlineBn: '“সাফল্যের কোনো শর্টকাট নেই; প্রতিদিনের ছোট প্রচেষ্টাই মানুষকে লক্ষ্যে পৌঁছে দেয়”',
      keywords: 'notebook podcast marker পডকাস্ট নোটবুক টকশো সংলাপ',
      primary: '#ca8a04', accent: '#fde047', bg: '#fefce8'
    },
    {
      id: 'white-sheet-redbar',
      cat: 'quote',
      nameBn: 'হোয়াইট শিট ও রেড বার বক্তব্য',
      nameEn: 'White Sheet Red-Bar Quote',
      whenToUseBn: 'প্রেস ব্রিফিং, প্রত্যক্ষদর্শী বা নাগরিক প্রতিক্রিয়ায়',
      whenToUseEn: 'Press briefings & citizen reactions',
      sampleHeadlineBn: '“সঠিক সময়ে ফায়ার সার্ভিস ও তরুণ স্বেচ্ছাসেবকরা এগিয়ে আসায় বড় দুর্ঘটনা থেকে রক্ষা মিলেছে”',
      keywords: 'white sheet press briefing প্রেস ব্রিফিং প্রতিক্রিয়া',
      primary: '#dc2626', accent: '#b91c1c', bg: '#ffffff'
    },
    {
      id: 'story-long-quote',
      cat: 'quote',
      nameBn: 'লং-কোট স্টোরি ও বিশ্লেষণ',
      nameEn: 'Long-Quote Op-Ed Card',
      whenToUseBn: 'বড় অনুচ্ছেদ, খোলা চিঠি ও বিশ্লেষণধর্মী পোস্টে',
      whenToUseEn: 'Columns, open letters & deep analysis',
      sampleHeadlineBn: '“শহরের জলাবদ্ধতা দূর করতে শুধু খাল খননই নয়, সচেতন নাগরিক অভ্যাস গড়াও জরুরি”',
      keywords: 'long quote column analysis কলাম বিশ্লেষণ খোলা চিঠি',
      primary: '#4f46e5', accent: '#a5b4fc', bg: '#0f1026'
    },
    {
      id: 'quote-card',
      cat: 'quote',
      nameBn: 'ক্ল্যাসিক গোল্ডেন ফ্রেম বাণী',
      nameEn: 'Classic Golden Frame Quote',
      whenToUseBn: 'মনীষীদের বাণী, সাহিত্য ও সম্পাদকীয় উদ্ধৃতিতে',
      whenToUseEn: 'Timeless wisdom, literature & editorials',
      sampleHeadlineBn: '“শিক্ষার আসল উদ্দেশ্য কেবল সনদ অর্জন নয়, বরং মনুষ্যত্ব ও বিবেকবোধ জাগ্রত করা”',
      keywords: 'golden wisdom literature বাণী মনীষী সাহিত্য কবিতা',
      primary: '#d97706', accent: '#fde68a', bg: '#17120a'
    },

    // 4. ফ্যাক্ট-চেক ও গুজব যাচাই (3 Fact-Check Cards)
    {
      id: 'factcheck-dual',
      cat: 'factcheck',
      nameBn: 'ফ্যাক্ট-চেক: ভুয়া বনাম মূল',
      nameEn: 'Fact-Check: Fake vs Real',
      whenToUseBn: 'এডিট করা ভুয়া কার্ড ও আসল কার্ড পাশাপাশি তুলনায়',
      whenToUseEn: 'Side-by-side fake vs original comparison',
      sampleHeadlineBn: 'ভাইরাল হওয়া ফটোকার্ডটি সম্পাদিত ও ভুয়া; মূল সংবাদে এমন কোনো তথ্য ছিল না',
      keywords: 'factcheck dual fake vs real ফ্যাক্টচেক ভুয়া আসল তুলনা গুজব',
      primary: '#dc2626', accent: '#fde047', bg: '#0b192c', tag: 'যাচাই', tagEn: 'Verify'
    },
    {
      id: 'factcheck-report',
      cat: 'factcheck',
      nameBn: 'ফ্যাক্ট-চেক বিস্তারিত রিপোর্ট',
      nameEn: 'Fact-Check Detailed Report',
      whenToUseBn: 'গুজব স্ক্রিনশট ও প্রকৃত সত্য বিস্তারিত ব্যাখ্যায়',
      whenToUseEn: 'Rumor screenshot with verified truth summary',
      sampleHeadlineBn: 'পুরোনো ঘটনার ভিডিওকে সাম্প্রতিক দাবি করে সামাজিক মাধ্যমে বিভ্রান্তিকর প্রচারণা',
      keywords: 'factcheck report rumor ফ্যাক্টচেক রিপোর্ট সত্যতা যাচাই',
      primary: '#e11d48', accent: '#38bdf8', bg: '#0f172a', tag: 'যাচাই', tagEn: 'Verify'
    },
    {
      id: 'factcheck-stamp',
      cat: 'factcheck',
      nameBn: 'ফ্যাক্ট-চেক সিলমোহর রায়',
      nameEn: 'Fact-Check Verdict Stamp',
      whenToUseBn: 'এক নজরে বড় ভুয়া/গুজব রাবার স্ট্যাম্পসহ রায় জানাতে',
      whenToUseEn: 'Instant bold rubber-stamp rumor verdict',
      sampleHeadlineBn: 'সারাদেশে টানা ৭ দিন ইন্টারনেট বন্ধ থাকার ভাইরাল দাবিটি সম্পূর্ণ ভিত্তিহীন গুজব',
      keywords: 'factcheck stamp alert সিলমোহর গুজব সতর্কতা ভুয়া',
      primary: '#dc2626', accent: '#fbbf24', bg: '#140c14', tag: 'যাচাই', tagEn: 'Verify'
    },

    // 5. মডার্ন, টেক ও লাইফস্টাইল (5 Modern Cards)
    {
      id: 'glass-bento',
      cat: 'modern',
      nameBn: 'গ্লাস বেন্টো গ্রিড',
      nameEn: 'Glass Bento Grid',
      whenToUseBn: 'স্টার্টআপ, অ্যাপ আপডেট ও মডার্ন টেক পোস্টে',
      whenToUseEn: 'Startup launches, AI & modern tech news',
      sampleHeadlineBn: 'বাংলা ভাষায় ভয়েস ও ডকুমেন্ট প্রসেসিংয়ে যুক্ত হলো নতুন এআই অ্যাসিস্ট্যান্ট প্রযুক্তি',
      keywords: 'glass bento tech ai টেক এআই অ্যাপ স্টার্টআপ',
      primary: '#0284c7', accent: '#38bdf8', bg: '#0b1324'
    },
    {
      id: 'split-magazine',
      cat: 'modern',
      nameBn: 'ডায়াগোনাল স্প্লিট ম্যাগাজিন',
      nameEn: 'Diagonal Split Magazine',
      whenToUseBn: 'বিনোদন, চলচ্চিত্র ও লাইফস্টাইল ফিচার সংবাদে',
      whenToUseEn: 'Culture, cinema & lifestyle features',
      sampleHeadlineBn: 'আন্তর্জাতিক চলচ্চিত্র উৎসবে বিশেষ জুরি পুরস্কার জিতল বাংলাদেশের স্বল্পদৈর্ঘ্য চলচ্চিত্র',
      keywords: 'magazine cinema lifestyle ম্যাগাজিন সিনেমা বিনোদন সংস্কৃতি',
      primary: '#db2777', accent: '#fbcfe8', bg: '#1a0b16'
    },
    {
      id: 'polaroid-story',
      cat: 'modern',
      nameBn: 'পোলারয়েড স্মৃতিচারণ স্টোরি',
      nameEn: 'Polaroid Memory Story',
      whenToUseBn: 'স্মৃতিচারণ, ভ্রমণ ও বিশেষ দিবসের গল্প শেয়ারে',
      whenToUseEn: 'Memories, campus life & travel stories',
      sampleHeadlineBn: 'প্রিয় ক্যাম্পাসের সোনালি দিন ও বন্ধুত্বের গল্পগুলো অমলিন থাকুক ছবির ফ্রেমে',
      keywords: 'polaroid campus memory পোলারয়েড স্মৃতি ভ্রমণ ক্যাম্পাস',
      primary: '#ea580c', accent: '#fed7aa', bg: '#1c1410'
    },
    {
      id: 'cyber-neon',
      cat: 'modern',
      nameBn: 'সাইবার নিয়ন টেক ও এআই',
      nameEn: 'Cyber Neon Tech & AI',
      whenToUseBn: 'সাইবার সিকিউরিটি, গেমিং ও বিজ্ঞান সংবাদের জন্য',
      whenToUseEn: 'Cybersecurity, gaming & science alerts',
      sampleHeadlineBn: 'অনলাইন ব্যাংকিং ও সোশ্যাল অ্যাকাউন্ট সুরক্ষায় টু-ফ্যাক্টর অথেনটিকেশন চালুর পরামর্শ',
      keywords: 'cyber neon security gaming সাইবার নিয়ন সিকিউরিটি বিজ্ঞান',
      primary: '#ec4899', accent: '#22d3ee', bg: '#070712'
    },
    {
      id: 'duotone-poster',
      cat: 'modern',
      nameBn: 'ম্যাগাজিন ও বইমেলা পোস্টার',
      nameEn: 'Event & Book Fair Poster',
      whenToUseBn: 'বইমেলা, সেমিনার ও সাংস্কৃতিক আয়োজনের পোস্টারে',
      whenToUseEn: 'Book fairs, seminars & cultural posters',
      sampleHeadlineBn: 'অমর একুশে বইমেলায় পাঠক আগ্রহের শীর্ষে বিজ্ঞান ও গবেষণাধর্মী নতুন বই',
      keywords: 'book fair poster seminar বইমেলা পোস্টার সেমিনার অনুষ্ঠান',
      primary: '#7c3aed', accent: '#fde047', bg: '#130d24'
    },

    // -------------------- 6. Milestone 3 Modern Templates (IDs 31–45) --------------------
    // 31. চ্যানেল আই ফ্ল্যাগ-স্ল্যাশ নিউজ
    {
      id: 'channel-i-flag-news',
      cat: 'news',
      nameBn: 'চ্যানেল আই ফ্ল্যাগ-স্ল্যাশ নিউজ',
      nameEn: 'Channel i Flag-Swoosh News',
      whenToUseBn: 'জাতীয় সংবাদ সম্মেলন, বিজ্ঞান ও প্রযুক্তি উন্নয়ন এবং প্রধান রাজনৈতিক বুলেটিনে',
      whenToUseEn: 'National press conferences, tech breakthroughs, and broadcast news bulletins',
      sampleHeadlineBn: 'বাংলা এআই তৈরি করতে ২৫ কোটি ডলার চায় বাংলাদেশ',
      keywords: 'channel i flag news broadcast tv সংবাদ চ্যানেল আই জাতীয় বুলেটিন ফ্ল্যাগ',
      primary: '#15803d', accent: '#dc2626', bg: '#051f15',
      tag: 'টিভি নিউজ', tagEn: 'Broadcast'
    },

    // 32. ছেঁড়া কাগজ ও হাইলাইটার নসিহত
    {
      id: 'torn-paper-advice',
      cat: 'quote',
      nameBn: 'ছেঁড়া কাগজ ও হাইলাইটার নসিহত',
      nameEn: 'Torn Paper Highlighter Advice',
      whenToUseBn: 'সামাজিক ও পারিবারিক উপদেশ, ধর্মীয় নসিহত এবং চিন্তাশীল জীবনবোধের কথায়',
      whenToUseEn: 'Moral guidance, family advice, spiritual reminders, and philosophical quotes',
      sampleHeadlineBn: 'মেয়েক বিয়ে দিতে ভালো পাত্র খুঁজছেন? ফজরের সময় মসজিদে মসজিদে তালাশ করুন!',
      keywords: 'torn paper advice quote নসিহত উপদেশ ছেঁড়া কাগজ হাইলাইটার জীবনদর্শন',
      primary: '#000000', accent: '#f59e0b', bg: '#ffffff',
      tag: 'নসিহত', tagEn: 'Advice'
    },

    // 33. ক্রিয়েটর মাইলফলক ও সোশ্যাল কার্ড
    {
      id: 'creator-milestone',
      cat: 'modern',
      nameBn: 'ক্রিয়েটর মাইলফলক ও সোশ্যাল কার্ড',
      nameEn: 'Creator Milestone & Social Profile',
      whenToUseBn: 'ইউটিউব/ফেসবুক ফলোয়ার মাইলফলক, অ্যাওয়ার্ড জয় ও কনটেন্ট ক্রিয়েটর ঘোষণায়',
      whenToUseEn: 'Social media follower milestones, creator awards, and channel celebration cards',
      sampleHeadlineBn: 'মাত্র ৯৩ দিনে নতুন পেইজে ৫ লক্ষ ফলোয়ারের মাইলফলক অর্জন করলেন ক্রিয়েটর',
      keywords: 'creator milestone follower youtube facebook মাইলফলক ক্রিয়েটর অ্যাওয়ার্ড ফলোয়ার',
      primary: '#7c3aed', accent: '#facc15', bg: '#0b0416',
      tag: 'মাইলফলক', tagEn: 'Milestone'
    },

    // 34. গোল্ডেন স্টার ফ্রেমড স্যাটায়ার
    {
      id: 'framed-satire-troll',
      cat: 'modern',
      nameBn: 'গোল্ডেন স্টার ফ্রেমড স্যাটায়ার',
      nameEn: 'Golden Star Framed Satire Card',
      whenToUseBn: 'ক্যাম্পাস ট্রল, রাজনৈতিক স্যাটায়ার ও হাস্যরসাত্মক ভাইরাল ফটোকার্ডে',
      whenToUseEn: 'Campus troll pages, viral memes, political satire, and humor cards',
      sampleHeadlineBn: 'পাসপোর্ট করতে গিয়ে দালালের খপ্পরে পড়ে ১৫ হাজার টাকা হারালেন',
      keywords: 'framed satire troll meme ট্রল স্যাটায়ার ব্যঙ্গ সংসদ ফানি গোল্ডেন স্টার',
      primary: '#f59e0b', accent: '#facc15', bg: '#09090b',
      tag: 'স্যাটায়ার', tagEn: 'Satire'
    },

    // 35. বুক পাবলিশার ও মাল্টি-স্টোর লিংক
    {
      id: 'multi-store-links',
      cat: 'modern',
      nameBn: 'বুক পাবলিশার ও মাল্টি-স্টোর লিংক',
      nameEn: 'Book Publisher & Store Links',
      whenToUseBn: 'প্রকাশনী, নতুন বই রিলিজ, ই-কমার্স প্রোডাক্ট ও অনলাইন শপ লিঙ্ক ঘোষণায়',
      whenToUseEn: 'Book launches, publisher announcements, e-commerce products, and order channels',
      sampleHeadlineBn: 'বইয়ের দোকানে বাকিতে বই বেচি না আমরা',
      keywords: 'book publisher store links প্রকাশনী বই রকমারি ওয়াফিলাইফ অর্ডার শপ',
      primary: '#b91c1c', accent: '#dc2626', bg: '#fbf8f1',
      tag: 'পাবলিশার', tagEn: 'Publisher'
    },

    // 36. কুরআন তাফসির ও স্টাডি সিরিজ
    {
      id: 'quran-tafseer-editorial',
      cat: 'quote',
      nameBn: 'কুরআন তাফসির ও স্টাডি সিরিজ',
      nameEn: 'Quran Tafseer Editorial Series',
      whenToUseBn: 'কুরআনের আয়াত, তাফসির ও ইসলামিক স্টাডি পোস্টে',
      whenToUseEn: 'Quranic verse, Tafseer study & Islamic editorial series',
      sampleHeadlineBn: 'সূরা আল হাজ্জ (আয়াত: ৫-৭)',
      keywords: 'quran tafseer islamic study verse surah হাদিস তাফসির কুরআন আয়াত সূরা',
      primary: '#1d3c34', accent: '#047857', bg: '#f0f7f4',
      tag: 'ইসলামিক', tagEn: 'Islamic'
    },

    // 37. স্প্লিট হরাইজন ফ্লোটিং কোট
    {
      id: 'split-horizon-quote',
      cat: 'quote',
      nameBn: 'স্প্লিট হরাইজন ফ্লোটিং কোট',
      nameEn: 'Split-Horizon Floating Quote & Reflection',
      whenToUseBn: 'উদ্ধৃতি, সমাজচিন্তা ও সম্পাদকীয় ভাবনার যুগপৎ উপস্থাপনায়',
      whenToUseEn: 'Thought leader quotes & editorial reflections',
      sampleHeadlineBn: 'সফলতার সংজ্ঞা শুধু উপার্জন কিংবা পদ-পদবিতে সীমাবদ্ধ নয়',
      keywords: 'split horizon quote reflection thought leader islamic সমাজচিন্তা উক্তি',
      primary: '#0f766e', accent: '#facc15', bg: '#0b2926',
      tag: 'উক্তি', tagEn: 'Quote'
    },

    // 38. মিনিমাল পেয়ার ও স্পিরিচুয়াল কোট
    {
      id: 'minimal-pair-verse',
      cat: 'quote',
      nameBn: 'মিনিমাল পেয়ার ও স্পিরিচুয়াল কোট',
      nameEn: 'Minimalist Pair & Spiritual Verse',
      whenToUseBn: 'প্রেম, বন্ধুত্ব, দাম্পত্য ও প্রাকৃতিক ফটোকার্ডে',
      whenToUseEn: 'Spiritual pair verses & minimalist nature quotes',
      sampleHeadlineBn: 'আর আমি তোমাদেরকে সৃষ্টি করেছি জোড়ায় জোড়ায়!!',
      keywords: 'minimal verse pair spiritual nature sunset ocean দাম্পত্য ভালোবাসা আয়াত',
      primary: '#991b1b', accent: '#000000', bg: '#ffffff',
      tag: 'মিনিমাল', tagEn: 'Minimal'
    },

    // 39. বার্গান্ডি গ্রিড স্কলার ওপিনিয়ন
    {
      id: 'burgundy-grid-scholar',
      cat: 'quote',
      nameBn: 'বার্গান্ডি গ্রিড স্কলার ওপিনিয়ন',
      nameEn: 'Burgundy Grid Scholar Opinion',
      whenToUseBn: 'স্কলার বক্তব্য ও কুসংস্কার নিরসনে জরুরি সতর্কবার্তায়',
      whenToUseEn: 'Scholar opinions & firm religious guidance',
      sampleHeadlineBn: 'ইসলামের ভিত্তি আবেগ নয় বরং জ্ঞান ও বিবেক',
      keywords: 'scholar opinion burgundy grid islamic dawah fatwa স্কলার উক্তি আলেম',
      primary: '#881337', accent: '#dc2626', bg: '#2a0812',
      tag: 'স্কলার', tagEn: 'Scholar'
    },

    // 40. জুমুআ মোবারক ও হাদিস রিবন
    {
      id: 'jummah-hadith-ribbon',
      cat: 'quote',
      nameBn: 'জুমুআ মোবারক ও হাদিস রিবন',
      nameEn: 'Jummah Mubarak & Hadith Ribbon',
      whenToUseBn: 'প্রতি শুক্রবার জুমুআ মোবারক শুভেচ্ছা ও হাদিস শেয়ারে',
      whenToUseEn: 'Friday Jummah Mubarak greetings & Hadith ribbons',
      sampleHeadlineBn: 'জুম\'আর দিনে এবং রাতে বেশি বেশি দরুদ পাঠ করুন',
      keywords: 'jummah mubarak hadith ribbon friday islamic salawat দরুদ জুমুআ হাদিস শুক্রবার',
      primary: '#047857', accent: '#10b981', bg: '#fcfbf7',
      tag: 'জুমুআ', tagEn: 'Jummah'
    },

    // 41. ডিজাইন মকআপ ও ডাউনলোড শোকেস
    {
      id: 'design-mockup-showcase',
      cat: 'modern',
      nameBn: 'ডিজাইন মকআপ ও ডাউনলোড শোকেস',
      nameEn: 'Design Mockup & Resource Showcase',
      whenToUseBn: 'গ্রাফিক ডিজাইন পোর্টফোলিও, ফ্রি রিসোর্স ডাউনলোড ও ক্রিয়েটিভ টেমপ্লেট শোকেসে',
      whenToUseEn: 'Graphic design portfolio, UI/mockup downloads & creative templates',
      sampleHeadlineBn: 'প্রফেশনাল ফেইসবুক কভার ফটো প্রিমিয়াম ডিজাইন টেমপ্লেট',
      keywords: 'mockup showcase portfolio cover photo মকআপ কভার ফটো ডিজাইন পোর্টফোলিও ডাউনলোড',
      primary: '#ea580c', accent: '#334155', bg: '#f8fafc',
      tag: 'মডার্ন', tagEn: 'Modern'
    },

    // 42. নূরানী হাদিস ও ক্লাউড প্যানোরামা
    {
      id: 'sacred-hadith-frame',
      cat: 'quote',
      nameBn: 'নূরানী হাদিস ও ক্লাউড প্যানোরামা',
      nameEn: 'Noorani Hadith & Cloud Panorama',
      whenToUseBn: 'সহীহ হাদিস, ফজিলত ও আত্মশুদ্ধিমূলক বাণী সুন্দর মার্জিত ফ্রেমে উপস্থাপনে',
      whenToUseEn: 'Authentic Hadith, sunnah reminders & noble Islamic sayings in an elegant frame',
      sampleHeadlineBn: 'রাসূলুল্লাহ ﷺ বলেনঃ আমার ওপর জুমুআ\'র দিন বেশি বেশি দুরূদ পাঠ করো',
      keywords: 'hadith sacred prophet madinah frame হাদিস রাসূল সুন্নাহ জুমুআ নূরানী ফ্রেম',
      primary: '#15803d', accent: '#b45309', bg: '#ffffff',
      tag: 'উক্তি', tagEn: 'Quote'
    },

    // 43. চ্যানেল ২৪ বুলেটিন ও স্পন্সর স্ট্রিপ
    {
      id: 'channel24-broadcast-news',
      cat: 'news',
      nameBn: 'চ্যানেল ২৪ বুলেটিন ও স্পন্সর স্ট্রিপ',
      nameEn: 'Channel 24 Broadcast Bulletin & Sponsor',
      whenToUseBn: 'আদালত, আইন-শৃঙ্খলা ও চাঞ্চল্যকর জাতীয় ব্রেকিং সংবাদের টিভি বুলেটিনে',
      whenToUseEn: 'TV broadcast bulletins, courtroom verdicts & breaking investigative news',
      sampleHeadlineBn: 'নেত্রকোণার সেই মাদ্রাসা ছাত্রী ধর্ষণ মামলায় শিক্ষকের মৃত্যুদণ্ড',
      keywords: 'channel24 broadcast news tv bulletin চ্যানেল ২৪ ব্রেকিং বুলেটিন সংবাদ রায়',
      primary: '#b91c1c', accent: '#f97316', bg: '#1a0508',
      tag: 'সংবাদ', tagEn: 'News'
    },

    // 44. ব্যঙ্গ-রস ও স্যাটায়ার পোর্টাল
    {
      id: 'parody-satire-portal',
      cat: 'news',
      nameBn: 'ব্যঙ্গ-রস ও স্যাটায়ার পোর্টাল',
      nameEn: 'Editorial Parody & Social Satire',
      whenToUseBn: 'সামাজিক অসঙ্গতি নিয়ে ব্যঙ্গ-রস, রসাত্মক মেমে ও সংবাদ পোর্টাল প্যারোডিতে',
      whenToUseEn: 'Social satire, humorous editorial commentary & parody news cards',
      sampleHeadlineBn: 'বিশ্বব্রহ্মাণ্ড যেহেতু এমনি এমনিই তৈরি হয়েছে, আশা করি তাদের সন্তানও সেক্স ছাড়া এমনিই জন্ম হবে',
      keywords: 'satire parody meme editorial ব্যঙ্গ স্যাটায়ার প্যারোডি রম্য রস মেমে',
      primary: '#dc2626', accent: '#1e293b', bg: '#ffffff',
      tag: 'সংবাদ', tagEn: 'News'
    },

    // 45. হিউম্যানিটারিয়ান হটলাইন স্প্লিট
    {
      id: 'humanitarian-hotline-split',
      cat: 'charity',
      nameBn: 'হিউম্যানিটারিয়ান হটলাইন স্প্লিট',
      nameEn: 'Humanitarian Hotline & NGO Service Split',
      whenToUseBn: 'জরুরি স্বাস্থ্য সেবা, মানসিক কাউন্সিলিং, দুর্যোগ হটলাইন ও রেড ক্রিসেন্ট সেবায়',
      whenToUseEn: 'Mental health hotlines, humanitarian counseling & Red Crescent emergency services',
      sampleHeadlineBn: 'মনোসামাজিক সহায়তায় জরুরি হটলাইন সেবা',
      keywords: 'hotline red crescent ngo relief counseling হটলাইন রেড ক্রিসেন্ট মানবিক সেবা রক্ত',
      primary: '#dc2626', accent: '#16a34a', bg: '#ffffff',
      tag: 'ফাউন্ডেশন', tagEn: 'Charity'
    }
  ];

  const sizePresets = [
    { id: 'square', short: '1:1', label: '1:1 স্কয়ার পোস্ট (1080×1080)', w: 1080, h: 1080 },
    { id: 'portrait', short: '4:5', label: '4:5 ফিড পোর্ট্রেট (1080×1350)', w: 1080, h: 1350 },
    { id: 'landscape', short: '16:9', label: '16:9 লিংক ব্যানার (1200×630)', w: 1200, h: 630 },
    { id: 'story', short: '9:16', label: '9:16 স্টোরি / রিলস (1080×1920)', w: 1080, h: 1920 }
  ];

  const fontFamilies = [
    { id: 'Hind Siliguri', label: 'হিন্দ শিলিগুড়ি (Hind Siliguri)' },
    { id: 'SolaimanLipi', label: 'সোলাইমানলিপি (SolaimanLipi)' },
    { id: 'Kalpurush', label: 'কালপুরুষ (Kalpurush)' },
    { id: 'Nikosh', label: 'নিকোশ (Nikosh)' },
    { id: 'Siyam Rupali', label: 'সিয়াম রূপালী (Siyam Rupali)' },
    { id: 'AdorshoLipi', label: 'আদর্শলিপি (AdorshoLipi)' },
    { id: 'BenSen Handwriting', label: 'বেনসেন হাতের লেখা (BenSen)' },
    { id: 'Noto Sans Bengali', label: 'নোটো সান্স বাংলা (Noto Sans)' },
    { id: 'Noto Serif Bengali', label: 'নোটো সেরিফ বাংলা (Noto Serif)' },
    { id: 'Anek Bangla', label: 'অনেক বাংলা (Anek Bangla)' },
    { id: 'Tiro Bangla', label: 'তিরো বাংলা (Tiro Bangla)' },
    { id: 'Baloo Da 2', label: 'বালু দা ২ (Baloo Da 2)' },
    { id: 'Galada', label: 'গলাদা ডিসপ্লে (Galada)' },
    { id: 'Atma', label: 'আত্মা ক্রিয়েটিভ (Atma)' },
    { id: 'Mina', label: 'মিনা মডার্ন (Mina)' },
    { id: 'Inter', label: 'Inter (Clean Sans)' },
    { id: 'Poppins', label: 'Poppins (Geometric)' },
    { id: 'Montserrat', label: 'Montserrat (Headline)' },
    { id: 'Anton', label: 'Anton (Breaking Impact)' },
    { id: 'Bebas Neue', label: 'Bebas Neue (Tall Poster)' },
    { id: 'Oswald', label: 'Oswald (Broadcast)' },
    { id: 'Playfair Display', label: 'Playfair Display (Editorial)' },
    { id: 'Raleway', label: 'Raleway (Modern)' }
  ];

  const themePalettes = [
    { id: 'charity-green', nameBn: 'ফাউন্ডেশন গ্রিন', nameEn: 'Charity Green', primary: '#059669', accent: '#fbbf24', bg: '#042619' },
    { id: 'blood-red', nameBn: 'রক্তদান লাল', nameEn: 'Emergency Red', primary: '#dc2626', accent: '#fde047', bg: '#1c080b' },
    { id: 'kalbela', nameBn: 'কালবেলা মেরুন', nameEn: 'Portal Maroon', primary: '#b91c1c', accent: '#fde047', bg: '#190608' },
    { id: 'crimson', nameBn: 'ব্রেকিং রেড', nameEn: 'Breaking Crimson', primary: '#e11d48', accent: '#facc15', bg: '#0f172a' },
    { id: 'zakat-gold', nameBn: 'যাকাত গোল্ড', nameEn: 'Zakat Emerald', primary: '#047857', accent: '#f59e0b', bg: '#071c18' },
    { id: 'medical-sky', nameBn: 'মেডিকেল ব্লু', nameEn: 'Medical Sky', primary: '#0284c7', accent: '#38bdf8', bg: '#0b192c' },
    { id: 'royal', nameBn: 'টেকহাট রয়্যাল', nameEn: 'TechHat Royal', primary: '#2563eb', accent: '#38bdf8', bg: '#090d16' },
    { id: 'eco-leaf', nameBn: 'সবুজায়ন ইকো', nameEn: 'Eco Green', primary: '#16a34a', accent: '#bef264', bg: '#072412' },
    { id: 'amber-honor', nameBn: 'সম্মাননা গোল্ড', nameEn: 'Honor Gold', primary: '#b45309', accent: '#fde047', bg: '#161108' },
    { id: 'violet', nameBn: 'পডকাস্ট স্লেট', nameEn: 'Studio Indigo', primary: '#4f46e5', accent: '#38bdf8', bg: '#0f172a' },
    { id: 'cyber', nameBn: 'সাইবার নিয়ন', nameEn: 'Cyber Neon', primary: '#ec4899', accent: '#22d3ee', bg: '#070712' },
    { id: 'light', nameBn: 'ক্লিন পেপার', nameEn: 'Clean Paper', primary: '#b91c1c', accent: '#0f172a', bg: '#f8fafc' }
  ];

  const shapeElements = [
    { kind: 'rect', labelBn: 'ব্যানার বক্স', labelEn: 'Solid Banner', fill: '#dc2626', stroke: '#ffffff', w: 380, h: 110, radius: 16 },
    { kind: 'pill', labelBn: 'রাউন্ডেড পিল', labelEn: 'Rounded Pill', fill: '#2563eb', stroke: '#ffffff', w: 320, h: 84, radius: 999 },
    { kind: 'circle', labelBn: 'বৃত্তাকার ব্যাজ', labelEn: 'Circle Badge', fill: '#f59e0b', stroke: '#ffffff', w: 170, h: 170, radius: 999 },
    { kind: 'glass', labelBn: 'গ্লাস কার্ড', labelEn: 'Glass Box', fill: 'rgba(15,23,42,0.72)', stroke: '#38bdf8', w: 420, h: 150, radius: 22 },
    { kind: 'outline', labelBn: 'বর্ডার ফ্রেম', labelEn: 'Outline Frame', fill: 'transparent', stroke: '#fde047', w: 380, h: 220, radius: 18 },
    { kind: 'line', labelBn: 'ডিভাইডার লাইন', labelEn: 'Accent Divider', fill: '#fde047', stroke: '#fde047', w: 420, h: 12, radius: 999 }
  ];

  interface StickerElementItem {
    text: string;
    bg: string;
    fg: string;
    size: number;
    cat: 'news' | 'factcheck' | 'charity' | 'payment' | 'social';
    labelBn: string;
    labelEn: string;
    icon?: 'bolt' | 'live' | 'alert' | 'blood' | 'handheart' | 'chat' | 'check' | 'cross' | 'shield';
  }

  const stickerCategories = [
    { id: 'all', labelBn: 'সবগুলো (৩৮)', labelEn: 'All (38)' },
    { id: 'news', labelBn: 'সংবাদ ও সতর্কতা (৮)', labelEn: 'News & Alerts (8)' },
    { id: 'factcheck', labelBn: 'ফ্যাক্টচেক (৮)', labelEn: 'Factcheck (8)' },
    { id: 'charity', labelBn: 'ত্রাণ ও চিকিৎসা (৮)', labelEn: 'Charity & Relief (8)' },
    { id: 'payment', labelBn: 'পেমেন্ট ও অফার (৮)', labelEn: 'Payment & Commerce (8)' },
    { id: 'social', labelBn: 'সোশ্যাল ও উক্তি (৬)', labelEn: 'Social & Quotes (6)' }
  ];

  let activeStickerCat = $state('all');

  const stickerElements: StickerElementItem[] = [
    // 1. News & Broadcast Alerts (8 items)
    { text: 'ব্রেকিং নিউজ', bg: '#b91c1c', fg: '#fde047', size: 34, cat: 'news', labelBn: 'ব্রেকিং নিউজ', labelEn: 'Breaking News', icon: 'bolt' },
    { text: 'BREAKING NEWS', bg: '#dc2626', fg: '#ffffff', size: 34, cat: 'news', labelBn: 'ব্রেকিং নিউজ (EN)', labelEn: 'Breaking News (EN)', icon: 'bolt' },
    { text: '● সরাসরি / LIVE', bg: '#e11d48', fg: '#ffffff', size: 32, cat: 'news', labelBn: 'লাইভ সম্প্রচার', labelEn: 'Live Broadcast', icon: 'live' },
    { text: 'বিশেষ প্রতিবেদন', bg: '#7c2d12', fg: '#fef08a', size: 32, cat: 'news', labelBn: 'বিশেষ প্রতিবেদন', labelEn: 'Special Report', icon: 'live' },
    { text: 'SPECIAL REPORT', bg: '#1e293b', fg: '#38bdf8', size: 32, cat: 'news', labelBn: 'স্পেশাল রিপোর্ট', labelEn: 'Special Report' },
    { text: 'এক্সক্লুসিভ খবর', bg: '#431407', fg: '#fbbf24', size: 32, cat: 'news', labelBn: 'এক্সক্লুসিভ', labelEn: 'Exclusive' },
    { text: 'EXCLUSIVE NEWS', bg: '#172554', fg: '#fde047', size: 34, cat: 'news', labelBn: 'এক্সক্লুসিভ (EN)', labelEn: 'Exclusive (EN)' },
    { text: 'সতর্কতা সংকেত', bg: '#9a3412', fg: '#ffedd5', size: 30, cat: 'news', labelBn: 'সতর্কতা সংকেত', labelEn: 'Weather / Danger Alert', icon: 'alert' },

    // 2. Factcheck & Verification (8 items)
    { text: '✕ ভুয়া দাবি / গুজব', bg: '#b91c1c', fg: '#fef08a', size: 34, cat: 'factcheck', labelBn: 'ভুয়া দাবি / গুজব', labelEn: 'Fake Claim / Rumor' },
    { text: 'FAKE CLAIM / RUMOR', bg: '#dc2626', fg: '#ffffff', size: 32, cat: 'factcheck', labelBn: 'ফেক ক্লেইম (EN)', labelEn: 'Fake Claim (EN)' },
    { text: '✓ যাচাইকৃত সত্য', bg: '#15803d', fg: '#ffffff', size: 32, cat: 'factcheck', labelBn: 'যাচাইকৃত সত্য', labelEn: 'Verified True' },
    { text: 'VERIFIED TRUE', bg: '#16a34a', fg: '#ffffff', size: 32, cat: 'factcheck', labelBn: 'ভেরিফায়েড সত্য (EN)', labelEn: 'Verified True (EN)' },
    { text: 'বিভ্রান্তিকর তথ্য', bg: '#c2410c', fg: '#fef3c7', size: 32, cat: 'factcheck', labelBn: 'বিভ্রান্তিকর তথ্য', labelEn: 'Misleading Info', icon: 'alert' },
    { text: 'MISLEADING CLAIM', bg: '#ea580c', fg: '#ffffff', size: 30, cat: 'factcheck', labelBn: 'মিসলিডিং (EN)', labelEn: 'Misleading (EN)', icon: 'alert' },
    { text: 'বিকৃত ছবি / ডিপফেক', bg: '#701a75', fg: '#fbcfe8', size: 30, cat: 'factcheck', labelBn: 'বিকৃত ছবি', labelEn: 'Manipulated Photo' },
    { text: 'FACT CHECKED', bg: '#0369a1', fg: '#e0f2fe', size: 32, cat: 'factcheck', labelBn: 'ফ্যাক্ট চেকড', labelEn: 'Fact Checked', icon: 'shield' },

    // 3. Charity, Medical & Emergency Relief (8 items)
    { text: 'জরুরি রক্তের প্রয়োজন', bg: '#991b1b', fg: '#ffffff', size: 32, cat: 'charity', labelBn: 'জরুরি রক্ত', labelEn: 'Urgent Blood', icon: 'blood' },
    { text: 'URGENT BLOOD APPEAL', bg: '#b91c1c', fg: '#ffffff', size: 30, cat: 'charity', labelBn: 'রক্তের আবেদন (EN)', labelEn: 'Blood Appeal (EN)', icon: 'blood' },
    { text: 'মানবিক সাহায্য আবেদন', bg: '#065f46', fg: '#ffffff', size: 32, cat: 'charity', labelBn: 'মানবিক আবেদন', labelEn: 'Humanitarian Appeal', icon: 'handheart' },
    { text: 'HUMANITARIAN AID', bg: '#047857', fg: '#ffffff', size: 30, cat: 'charity', labelBn: 'হিউম্যানিটারিয়ান এইড', labelEn: 'Humanitarian Aid', icon: 'handheart' },
    { text: 'শীতবস্ত্র বিতরণ অভিযান', bg: '#0f766e', fg: '#ccfbf1', size: 30, cat: 'charity', labelBn: 'শীতবস্ত্র বিতরণ', labelEn: 'Winter Relief' },
    { text: 'বন্যা ত্রাণ জরুরি তহবিল', bg: '#0369a1', fg: '#f0f9ff', size: 32, cat: 'charity', labelBn: 'বন্যা ত্রাণ তহবিল', labelEn: 'Flood Relief Fund' },
    { text: 'শতভাগ যাকাত যোগ্য', bg: '#14532d', fg: '#bbf7d0', size: 32, cat: 'charity', labelBn: 'যাকাত যোগ্য', labelEn: 'Zakat Eligible' },
    { text: '100% ZAKAT ELIGIBLE', bg: '#166534', fg: '#fef08a', size: 30, cat: 'charity', labelBn: 'যাকাত যোগ্য (EN)', labelEn: 'Zakat Eligible (EN)' },

    // 4. Payment, Commerce & Offers (8 items)
    { text: 'বিকাশ / নগদ পেমেন্ট', bg: '#e2136e', fg: '#ffffff', size: 32, cat: 'payment', labelBn: 'বিকাশ/নগদ পেমেন্ট', labelEn: 'bKash/Nagad' },
    { text: 'PAYMENT VERIFIED', bg: '#0284c7', fg: '#ffffff', size: 30, cat: 'payment', labelBn: 'পেমেন্ট ভেরিফায়েড', labelEn: 'Payment Verified' },
    { text: 'ক্যাশ অন ডেলিভারি', bg: '#4338ca', fg: '#e0e7ff', size: 30, cat: 'payment', labelBn: 'ক্যাশ অন ডেলিভারি', labelEn: 'Cash on Delivery' },
    { text: 'CASH ON DELIVERY (COD)', bg: '#3730a3', fg: '#ffffff', size: 28, cat: 'payment', labelBn: 'সিওডি (EN)', labelEn: 'COD (EN)' },
    { text: 'সীমিত অফার / ছাড়', bg: '#c2410c', fg: '#fef08a', size: 32, cat: 'payment', labelBn: 'সীমিত অফার', labelEn: 'Limited Offer' },
    { text: 'SPECIAL DISCOUNT', bg: '#b45309', fg: '#ffffff', size: 32, cat: 'payment', labelBn: 'স্পেশাল ডিসকাউন্ট', labelEn: 'Special Discount' },
    { text: 'সেরা বিক্রিত / HOT', bg: '#be123c', fg: '#ffe4e6', size: 32, cat: 'payment', labelBn: 'হট প্রোডাক্ট', labelEn: 'Hot Product' },
    { text: 'OFFICIAL MERCHANT', bg: '#065f46', fg: '#a7f3d0', size: 30, cat: 'payment', labelBn: 'অফিসিয়াল মার্চেন্ট', labelEn: 'Official Merchant' },

    // 5. Social Engagement, Quotes & CTA (6 items)
    { text: 'বিস্তারিত কমেন্টে দেখুন ↓', bg: '#0f172a', fg: '#38bdf8', size: 30, cat: 'social', labelBn: 'কমেন্টে দেখুন', labelEn: 'See in Comments' },
    { text: 'READ FULL STORY →', bg: '#1e3a8a', fg: '#ffffff', size: 30, cat: 'social', labelBn: 'সম্পূর্ণ খবর (EN)', labelEn: 'Read Full Story (EN)' },
    { text: 'আপনার মতামত জানান', bg: '#334155', fg: '#f1f5f9', size: 30, cat: 'social', labelBn: 'মতামত জানান', labelEn: 'Share Opinions', icon: 'chat' },
    { text: 'SHARE WITH FRIENDS ↗', bg: '#0284c7', fg: '#ffffff', size: 30, cat: 'social', labelBn: 'শেয়ার করুন (EN)', labelEn: 'Share (EN)' },
    { text: '“উক্তি / উদ্ধৃতি”', bg: '#475569', fg: '#fef08a', size: 32, cat: 'social', labelBn: 'উক্তি / উদ্ধৃতি', labelEn: 'Quote / Statement' },
    { text: 'OFFICIAL STATEMENT', bg: '#1e1b4b', fg: '#e0e7ff', size: 30, cat: 'social', labelBn: 'অফিসিয়াল বার্তা', labelEn: 'Official Statement' }
  ];

  function templatesFor(catId: TemplateItem['cat']): TemplateItem[] {
    return templates.filter((t) => t.cat === catId);
  }
</script>

<div
  class="img-pane group/pc select-none fixed inset-0 z-[65] h-dvh flex flex-col overflow-hidden rounded-none border-0 shadow-none bg-[#e8edf5] dark:bg-[#0d121d]"
  id="img-pane-photo-card"
  data-desk-drawer="open"
  data-mob-sheet="closed"
  data-selected-el="card"
  {hidden}
>
  <!-- Hidden File Inputs Accessible From Anywhere in Studio -->
  <input type="file" id="pcPhotoInput" accept="image/*" class="sr-only" />
  <input type="file" id="pcSecondPhotoInput" accept="image/*" class="sr-only" />
  <input type="file" id="pcLogoInput" accept="image/*" class="sr-only" />
  <input type="file" id="pcMultiAssetInput" accept="image/*" multiple class="sr-only" />
  <input type="file" id="pcFloatingImgInput" accept="image/*" class="sr-only" />
  <input type="file" id="pcFontUploadInput" accept=".ttf,.otf,.woff,.woff2" multiple class="sr-only" />

  <!-- =========================================================================
       1. TECHHAT STUDIO SIGNATURE DEEP NAVY-TO-ROYAL-BLUE HEADER BAR
       Distinct TechHat Studio identity (#0b1224 -> #172e66 -> #2563eb)
       ========================================================================= -->
  <header
    class="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1.5 px-2.5 sm:px-3.5 py-1.5 text-white border-b border-white/10 shadow-xs z-30 relative"
    style="background:linear-gradient(90deg,#0b1224 0%,#172e66 52%,#1d4ed8 100%);"
  >
    <!-- Left: Home + TechHat Brand Pill + New + Aspect Ratio + Undo/Redo + Auto-Save -->
    <div class="order-1 flex items-center gap-1.5 min-w-0">
      <a
        href="/image"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/12 hover:bg-white/22 text-white no-underline transition shrink-0 border border-white/10"
        title="ইমেজ স্টুডিওতে ফিরে যান"
        aria-label="ইমেজ স্টুডিওতে ফিরে যান"
      >
        <Icon name="lucide:home" class="w-4 h-4 [&_*]:!stroke-white" />
      </a>

      <!-- TechHat Brand Mark -->
      <div class="hidden xl:inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-white/8 border border-white/10 shrink-0">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
        <span class="text-[11.5px] font-extrabold tracking-tight text-white">TechHat <span class="text-sky-300">CardStudio</span></span>
      </div>

      <button
        type="button"
        id="pcNewDesignBtn"
        class="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg bg-blue-500/25 hover:bg-blue-500/40 border border-blue-300/25 text-white text-[12px] font-bold cursor-pointer transition shrink-0"
        title="নতুন ফটোকার্ড তৈরি করুন (পূর্বের ডিজাইন অটো-সেভ থাকবে)"
      >
        <Icon name="lucide:plus" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
        <span class="max-[375px]:hidden" data-i18n-bn="নতুন" data-i18n-en="New">নতুন</span>
      </button>

      <!-- Resize Aspect Ratio Pills (Desktop/Tablet) -->
      <div
        class="hidden md:inline-flex items-center gap-0.5 bg-slate-950/35 border border-white/10 rounded-lg p-0.5 shrink-0"
        id="pcSizePresetGroup"
        role="group"
        aria-label="রিসাইজ"
      >
        {#each sizePresets as sp, idx}
          <button
            type="button"
            data-pc-size={sp.id}
            data-w={sp.w}
            data-h={sp.h}
            aria-pressed={idx === 0 ? 'true' : 'false'}
            class="px-2 h-7 rounded-md text-[11px] font-extrabold cursor-pointer transition text-white/80 hover:text-white aria-pressed:bg-white aria-pressed:text-[#1e3a8a] aria-pressed:shadow-2xs"
            title={sp.label}
          >
            {sp.short}
          </button>
        {/each}
      </div>

      <!-- Divider -->
      <span class="hidden sm:inline-block w-px h-4.5 bg-white/20 mx-0.5"></span>

      <!-- Undo / Redo Buttons -->
      <div class="inline-flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          id="pcUndoBtn"
          disabled
          class="w-7.5 h-7.5 rounded-lg inline-flex items-center justify-center text-white hover:bg-white/18 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition"
          title="আনডু / পূর্বের অবস্থায় ফিরুন (Ctrl+Z)"
          aria-label="Undo"
        >
          <Icon name="lucide:undo-2" class="w-4 h-4 [&_*]:!stroke-white" />
        </button>
        <button
          type="button"
          id="pcRedoBtn"
          disabled
          class="w-7.5 h-7.5 rounded-lg inline-flex items-center justify-center text-white hover:bg-white/18 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition"
          title="রিডু / পরের অবস্থায় যান (Ctrl+Y)"
          aria-label="Redo"
        >
          <Icon name="lucide:redo-2" class="w-4 h-4 [&_*]:!stroke-white" />
        </button>
      </div>

      <!-- Cloud Auto-Save Indicator -->
      <span
        id="pcAutosaveStatus"
        class="hidden 2xl:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-sky-100 shrink-0"
        title="আপনার কাজ স্বয়ংক্রিয়ভাবে ব্রাউজারে সেভ হচ্ছে"
      >
        <Icon name="lucide:cloud-check" class="w-4 h-4 [&_*]:!stroke-emerald-300" />
        <span id="pcAutosaveText" data-i18n-bn="সেভ হয়েছে ✓" data-i18n-en="Saved ✓">সেভ হয়েছে ✓</span>
      </span>
    </div>

    <!-- Right: Stable Design Title + Language Toggle (বাংলা | EN) + Save + Copy + JPG + Download -->
    <div class="order-2 flex items-center gap-1.5 min-w-0">
      <!-- Stable Document Title (Never overwritten when switching templates!) -->
      <div
        class="hidden sm:flex items-center gap-1.5 w-[165px] lg:w-[225px] bg-slate-950/30 hover:bg-slate-950/45 focus-within:bg-slate-950/55 border border-white/12 rounded-lg px-2.5 h-8 transition"
        title="ডিজাইনের নাম পরিবর্তন করুন (টেম্পলেট বদলালেও এই নাম স্থির থাকবে)"
      >
        <Icon name="lucide:pencil" class="w-3 h-3 shrink-0 opacity-70 [&_*]:!stroke-white" />
        <input
          type="text"
          id="pcDesignTitleInput"
          value="নতুন ফটোকার্ড ডিজাইন"
          placeholder="ডিজাইনের নাম..."
          data-i18n-placeholder-bn="ডিজাইনের নাম..."
          data-i18n-placeholder-en="Untitled design..."
          aria-label="ডিজাইনের নাম"
          class="w-full min-w-0 border-0 bg-transparent text-[12px] font-bold text-white placeholder:text-white/60 outline-none truncate"
        />
      </div>

      <!-- Bilingual UI Toggle (বাংলা | EN) -->
      <div
        class="inline-flex items-center bg-slate-950/35 border border-white/12 rounded-lg p-0.5 shrink-0"
        id="pcLangSwitchGroup"
        role="group"
        aria-label="Language"
      >
        <button
          type="button"
          data-set-lang="bn"
          aria-pressed="true"
          class="px-2 h-7 rounded-md text-[10.5px] font-extrabold cursor-pointer transition text-white/80 hover:text-white aria-pressed:bg-white aria-pressed:text-[#1e3a8a]"
        >
          বাংলা
        </button>
        <button
          type="button"
          data-set-lang="en"
          aria-pressed="false"
          class="px-2 h-7 rounded-md text-[10.5px] font-extrabold cursor-pointer transition text-white/80 hover:text-white aria-pressed:bg-white aria-pressed:text-[#1e3a8a]"
        >
          EN
        </button>
      </div>

      <button
        type="button"
        id="pcSaveProjectBtn"
        class="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg bg-white/12 hover:bg-white/22 border border-white/10 text-white text-[12px] font-bold cursor-pointer transition shrink-0"
        title="প্রজেক্টস ফোল্ডারে ডিজাইনটি সেভ করুন"
      >
        <Icon name="lucide:bookmark-plus" class="w-3.5 h-3.5 shrink-0 [&_*]:!stroke-white" />
        <span class="max-lg:hidden" data-i18n-bn="সেভ" data-i18n-en="Save">সেভ</span>
      </button>

      <!-- Universal Share Button with Popover Dropdown (R5) -->
      <div class="relative shrink-0" id="pcShareMenuWrap">
        <button
          type="button"
          id="pcShareCardBtn"
          class="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-white/12 hover:bg-white/22 border border-white/10 text-white text-[12px] font-bold cursor-pointer transition"
          title="শেয়ার ও এক্সপোর্ট করুন"
          aria-label="শেয়ার"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <Icon name="lucide:share-2" class="w-3.5 h-3.5 shrink-0 [&_*]:!stroke-white" />
          <span class="max-xs:hidden" data-i18n-bn="শেয়ার" data-i18n-en="Share">শেয়ার</span>
        </button>

        <!-- Share Dropdown Popover Menu -->
        <div
          id="pcShareDropdown"
          hidden
          class="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#1a202c] shadow-[0_20px_50px_rgba(0,0,0,0.32)] border border-slate-200 dark:border-white/12 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-800 dark:text-slate-100"
        >
          <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
            <span class="text-[13px] font-extrabold flex items-center gap-1.5">
              <Icon name="lucide:share-2" class="w-4 h-4 text-[#2563eb]" />
              <span data-i18n-bn="শেয়ার ও ডাউনলোড" data-i18n-en="Share & Export">শেয়ার ও ডাউনলোড</span>
            </span>
            <button
              type="button"
              id="pcShareCloseBtn"
              class="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 inline-flex items-center justify-center cursor-pointer"
              title="বন্ধ করুন"
            >
              ✕
            </button>
          </div>

          <!-- 1. Copy Template Deep-Link -->
          <div class="mt-3">
            <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1" data-i18n-bn="টেম্পলেট লিঙ্ক" data-i18n-en="Template Link">
              টেম্পলেট লিঙ্ক
            </label>
            <div class="flex items-center gap-1.5">
              <input
                type="text"
                id="pcShareUrlInput"
                readonly
                class="flex-1 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[11.5px] font-mono text-slate-600 dark:text-slate-300 outline-none select-all truncate"
              />
              <button
                type="button"
                id="pcCopyLinkBtn"
                class="h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer transition shrink-0"
              >
                <Icon name="lucide:link-2" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
                <span data-i18n-bn="কপি" data-i18n-en="Copy">কপি</span>
              </button>
            </div>
          </div>

          <!-- 2. WhatsApp Direct Share -->
          <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              id="pcShareWhatsAppBtn"
              class="w-full h-8.5 px-3 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#128C7E] dark:text-[#25D366] text-[12px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Icon name="lucide:message-circle" class="w-4 h-4 text-[#25D366]" />
              <span data-i18n-bn="হোয়াটসঅ্যাপে শেয়ার করুন" data-i18n-en="Share on WhatsApp">হোয়াটসঅ্যাপে শেয়ার করুন</span>
            </button>
          </div>

          <!-- 3. Copy Image to Clipboard & Native Share -->
          <div class="mt-2 space-y-1.5">
            <button
              type="button"
              id="pcShareCopyImageBtn"
              class="w-full h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11.5px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-between cursor-pointer transition"
            >
              <span class="inline-flex items-center gap-2">
                <Icon name="lucide:copy" class="w-3.5 h-3.5 text-slate-500" />
                <span data-i18n-bn="ছবি ক্লিপবোর্ডে কপি করুন" data-i18n-en="Copy image to clipboard">ছবি ক্লিপবোর্ডে কপি করুন</span>
              </span>
              <span class="text-[10px] text-slate-400">PNG</span>
            </button>

            <button
              type="button"
              id="pcShareNativeBtn"
              class="w-full h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11.5px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center justify-between cursor-pointer transition"
            >
              <span class="inline-flex items-center gap-2">
                <Icon name="lucide:share" class="w-3.5 h-3.5 text-slate-500" />
                <span data-i18n-bn="ডিভাইস অ্যাপে শেয়ার..." data-i18n-en="More apps...">ডিভাইস অ্যাপে শেয়ার...</span>
              </span>
            </button>
          </div>

          <!-- 4. Quick Export Shortcuts -->
          <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10">
            <span class="block text-[11px] font-bold text-slate-400 mb-1.5" data-i18n-bn="ডাউনলোড" data-i18n-en="Download">ডাউনলোড</span>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                id="pcQuickDownloadPngBtn"
                class="h-8 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-[#2563eb]/30 text-[#1d4ed8] dark:text-sky-300 text-[11.5px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer transition"
              >
                <Icon name="lucide:download" class="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>
              <button
                type="button"
                id="pcQuickDownloadJpgBtn"
                class="h-8 px-2 rounded-lg bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[11.5px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer transition"
              >
                <Icon name="lucide:download" class="w-3.5 h-3.5" />
                <span>JPG</span>
              </button>
              <button
                type="button"
                id="pcShareDownloadPdf"
                class="h-8 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11.5px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer transition"
                title="সকল পেজ পিডিএফ হিসেবে ডাউনলোড করুন (Download Multi-Page PDF)"
              >
                <Icon name="lucide:file-text" class="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        id="pcCopyCardBtn"
        class="max-lg:hidden inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg bg-white/12 hover:bg-white/22 border border-white/10 text-white text-[12px] font-bold cursor-pointer transition shrink-0"
        title="ক্লিপবোর্ডে ছবি হিসেবে কপি করুন"
      >
        <Icon name="lucide:copy" class="w-3.5 h-3.5 shrink-0 [&_*]:!stroke-white" />
        <span data-i18n-bn="কপি" data-i18n-en="Copy">কপি</span>
      </button>

      <button
        type="button"
        id="pcDownloadJpgBtn"
        class="max-md:hidden inline-flex items-center justify-center h-8 px-2.5 rounded-lg bg-white/12 hover:bg-white/22 border border-white/10 text-white text-[11.5px] font-extrabold cursor-pointer transition shrink-0"
        title="JPG ফরম্যাটে ডাউনলোড"
      >
        JPG
      </button>

      <!-- Signature TechHat Crisp White + Royal Blue Download CTA -->
      <button
        type="button"
        id="pcDownloadPngBtn"
        class="inline-flex items-center justify-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-lg bg-white hover:bg-sky-50 text-[#0f172a] text-[12px] font-extrabold shadow-sm cursor-pointer transition shrink-0 border-0"
      >
        <Icon name="lucide:download" class="w-3.5 h-3.5 shrink-0 [&_*]:!stroke-[#2563eb]" />
        <span data-i18n-bn="ডাউনলোড" data-i18n-en="Download">ডাউনলোড</span>
      </button>
    </div>

    <!-- Mobile Compact Second Row (< md): Active Card Label + Aspect Ratio Switcher -->
    <div class="order-3 md:hidden w-full flex items-center justify-between gap-1.5 pt-1 border-t border-white/12">
      <span class="text-[11px] font-bold text-white/90 truncate" id="pcMobHeaderTplLabel">জরুরি রক্তের প্রয়োজন</span>
      <div class="inline-flex items-center gap-0.5 bg-slate-950/35 rounded-md p-0.5 shrink-0" id="pcSizePresetGroupMob">
        {#each sizePresets as sp, idx}
          <button
            type="button"
            data-pc-size={sp.id}
            data-w={sp.w}
            data-h={sp.h}
            aria-pressed={idx === 0 ? 'true' : 'false'}
            class="px-1.5 h-6 rounded text-[10.5px] font-extrabold cursor-pointer transition text-white/85 aria-pressed:bg-white aria-pressed:text-[#1e3a8a]"
          >
            {sp.short}
          </button>
        {/each}
      </div>
    </div>
  </header>

  <!-- =========================================================================
       2. STUDIO WORKSPACE SHELL
       Desktop (lg+): [72px Rail] + [360px Drawer] + [Interactive Stage]
       Mobile (<lg):  [Interactive Stage] + [Slide-Up Sheet] + [Bottom Dock]
       ========================================================================= -->
  <div class="flex-1 min-h-0 relative flex flex-col lg:flex-row overflow-hidden">

    <!-- =======================================================================
         A. TECHHAT STUDIO ICON RAIL (Left on Desktop, Bottom Dock on Mobile)
         ======================================================================= -->
    <nav
      id="pcStudioNavRail"
      aria-label="স্টুডিও টুলবার"
      class="order-3 lg:order-1 grid grid-cols-6 lg:flex lg:flex-col items-center gap-0.5 lg:gap-1 px-1 py-1.5 lg:py-2.5 lg:w-[74px] bg-[#0f172a] dark:bg-[#0b1120] text-slate-300 border-t lg:border-t-0 lg:border-r border-slate-800 shrink-0 z-30"
    >
      <button
        type="button"
        data-pc-nav="templates"
        aria-pressed="true"
        class="relative flex flex-col items-center justify-center gap-1 w-full py-1.5 lg:py-2.5 px-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition hover:text-white hover:bg-white/8 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:shadow-xs"
      >
        <Icon name="lucide:layout-template" class="w-5 h-5" />
        <span data-i18n-bn="টেম্পলেট" data-i18n-en="Templates">টেম্পলেট</span>
      </button>

      <button
        type="button"
        data-pc-nav="elements"
        aria-pressed="false"
        class="relative flex flex-col items-center justify-center gap-1 w-full py-1.5 lg:py-2.5 px-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition hover:text-white hover:bg-white/8 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:shadow-xs"
      >
        <Icon name="lucide:sparkles" class="w-5 h-5" />
        <span data-i18n-bn="এলিমেন্টস" data-i18n-en="Elements">এলিমেন্টস</span>
      </button>

      <button
        type="button"
        data-pc-nav="text"
        aria-pressed="false"
        class="relative flex flex-col items-center justify-center gap-1 w-full py-1.5 lg:py-2.5 px-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition hover:text-white hover:bg-white/8 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:shadow-xs"
      >
        <Icon name="lucide:type" class="w-5 h-5" />
        <span data-i18n-bn="টেক্সট" data-i18n-en="Text">টেক্সট</span>
      </button>

      <button
        type="button"
        data-pc-nav="brand"
        aria-pressed="false"
        class="relative flex flex-col items-center justify-center gap-1 w-full py-1.5 lg:py-2.5 px-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition hover:text-white hover:bg-white/8 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:shadow-xs"
      >
        <Icon name="lucide:shield-plus" class="w-5 h-5" />
        <span data-i18n-bn="ব্র্যান্ড" data-i18n-en="Brand">ব্র্যান্ড</span>
      </button>

      <button
        type="button"
        data-pc-nav="uploads"
        aria-pressed="false"
        class="relative flex flex-col items-center justify-center gap-1 w-full py-1.5 lg:py-2.5 px-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition hover:text-white hover:bg-white/8 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:shadow-xs"
      >
        <Icon name="lucide:upload-cloud" class="w-5 h-5" />
        <span data-i18n-bn="আপলোডস" data-i18n-en="Uploads">আপলোডস</span>
        <span id="pcUploadsCountBadge" hidden class="absolute top-1 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-sky-500 text-white text-[9px] font-extrabold inline-flex items-center justify-center">০</span>
      </button>

      <button
        type="button"
        data-pc-nav="projects"
        aria-pressed="false"
        class="relative flex flex-col items-center justify-center gap-1 w-full py-1.5 lg:py-2.5 px-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition hover:text-white hover:bg-white/8 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:shadow-xs"
      >
        <Icon name="lucide:folder-heart" class="w-5 h-5" />
        <span data-i18n-bn="প্রজেক্টস" data-i18n-en="Projects">প্রজেক্টস</span>
        <span id="pcSavedCountBadge" class="absolute top-1 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold inline-flex items-center justify-center">০</span>
      </button>
    </nav>

    <!-- =======================================================================
         B. COLLAPSIBLE SIDE DRAWER (364px Desktop / Slide-Up Mobile)
         ======================================================================= -->
    <aside
      id="pcSideDrawer"
      class="order-2 relative max-lg:absolute max-lg:inset-x-0 max-lg:bottom-[53px] max-lg:h-[62dvh] max-lg:max-h-[500px] max-lg:rounded-t-2xl max-lg:shadow-[0_-14px_40px_rgba(15,23,42,0.28)] max-lg:z-40 lg:w-[364px] shrink-0 bg-white dark:bg-[#151922] border-t lg:border-t-0 lg:border-r border-slate-200/95 dark:border-white/10 flex flex-col z-20 shadow-sm group-data-[mob-sheet=closed]/pc:max-lg:hidden group-data-[desk-drawer=closed]/pc:lg:hidden"
    >
      <!-- Mobile Sheet Top Bar -->
      <div class="lg:hidden flex items-center justify-between px-3.5 py-2 border-b border-slate-200/80 dark:border-white/10 shrink-0">
        <span id="pcMobSheetTitle" class="text-[12.5px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="টেম্পলেট গ্যালারি" data-i18n-en="Template Gallery">টেম্পলেট গ্যালারি</span>
        <button
          type="button"
          id="pcCloseMobSheetBtn"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-white cursor-pointer"
        >
          <Icon name="lucide:check" class="w-3.5 h-3.5" />
          <span data-i18n-bn="সম্পন্ন" data-i18n-en="Done">সম্পন্ন</span>
        </button>
      </div>

      <!-- Collapse Pill Handle on Right Border -->
      <button
        type="button"
        id="pcDeskCollapseBtn"
        class="max-lg:hidden absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-14 rounded-r-full bg-white dark:bg-[#1f2430] border border-l-0 border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-[#2563eb] cursor-pointer shadow-sm z-30"
        title="সাইড প্যানেল লুকান"
        aria-label="প্যানেল লুকান"
      >
        <Icon name="lucide:chevron-left" class="w-3.5 h-3.5" />
      </button>

      <!-- Scrollable Drawer Body -->
      <div class="p-3 sm:p-3.5 overflow-y-auto overscroll-contain flex-1 space-y-3">

        <!-- ===============================================================
             DRAWER 1: TEMPLATES GALLERY (100% Visible Category Chips + Named Sections)
             =============================================================== -->
        <div data-pc-drawer="templates" class="space-y-3">
          <!-- Search Input -->
          <div class="relative flex items-center">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="pcTplSearchInput"
              placeholder="টেম্পলেট খুঁজুন (রক্তদান, কালবেলা, উক্তি...)"
              data-i18n-placeholder-bn="টেম্পলেট খুঁজুন (রক্তদান, কালবেলা, উক্তি...)"
              data-i18n-placeholder-en="Search templates (blood, news, quote, factcheck...)"
              class="w-full h-9.5 pl-9.5 pr-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-300/90 dark:border-white/15 text-[12px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#2563eb] shadow-2xs"
            />
          </div>

          <!-- Category Filter Pills: flex-wrap so ALL 6 categories are 100% visible without clipping! -->
          <div class="flex flex-wrap items-center gap-1.5" id="pcTplCategoryFilter">
            {#each categories as cat, idx}
              <button
                type="button"
                data-pc-cat={cat.id}
                aria-pressed={idx === 0 ? 'true' : 'false'}
                class="inline-flex items-center gap-1 h-7.5 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer transition bg-slate-100 dark:bg-[#1f2633] border border-slate-200/80 dark:border-white/8 text-slate-700 dark:text-slate-200 hover:bg-slate-200/75 aria-pressed:bg-[#2563eb] aria-pressed:border-[#2563eb] aria-pressed:text-white"
              >
                <Icon name={cat.icon} class="w-3.5 h-3.5 shrink-0" />
                <span data-i18n-bn={cat.labelBn} data-i18n-en={cat.labelEn}>{cat.labelBn}</span>
              </button>
            {/each}
          </div>

          <!-- Recently Used Section -->
          <div id="pcRecentTemplatesWrap" hidden class="space-y-1.5 pt-0.5">
            <div class="flex items-center justify-between px-0.5">
              <strong class="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100" data-i18n-bn="সম্প্রতি ব্যবহৃত" data-i18n-en="Recently Used">সম্প্রতি ব্যবহৃত</strong>
            </div>
            <div id="pcRecentTemplatesGrid" class="grid grid-cols-2 gap-2"></div>
          </div>

          <!-- Auto Sample Toggle Bar -->
          <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-500/20">
            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200" data-i18n-bn="কার্ড অনুযায়ী নমুনা লেখা লোড" data-i18n-en="Load card-specific sample text">কার্ড অনুযায়ী নমুনা লেখা লোড</span>
            <label
              class="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#1d4ed8] dark:text-sky-300 cursor-pointer shrink-0"
              title="কার্ড বদলালে সেই কার্ডের উপযোগী আলাদা শিরোনাম, ব্যাজ ও সাব-হেডলাইন বসবে"
            >
              <input type="checkbox" id="pcAutoSampleToggle" checked class="w-3.5 h-3.5 accent-[#2563eb] rounded cursor-pointer" />
              <span data-i18n-bn="চালু" data-i18n-en="Auto">চালু</span>
            </label>
          </div>

          <!-- Grouped Category Sections with Permanently Visible Card Names & Subtitles -->
          <div class="space-y-4" id="pcTemplateGrid">
            {#each categorySections as sec}
              <section data-tpl-cat-section={sec.id} class="space-y-2">
                <div class="flex items-center gap-1.5 px-0.5 border-b border-slate-200/80 dark:border-white/10 pb-1">
                  <Icon name={sec.icon} class="w-3.5 h-3.5 text-[#2563eb] dark:text-sky-400 shrink-0" />
                  <strong class="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100" data-i18n-bn={sec.titleBn} data-i18n-en={sec.titleEn}>{sec.titleBn}</strong>
                </div>

                <div class="grid grid-cols-2 gap-2.5">
                  {#each templatesFor(sec.id) as tpl}
                    <button
                      type="button"
                      data-pc-template={tpl.id}
                      data-tpl-cat={tpl.cat}
                      data-tpl-search="{tpl.nameBn} {tpl.nameEn} {tpl.whenToUseBn} {tpl.whenToUseEn} {tpl.sampleHeadlineBn} {tpl.keywords}"
                      aria-pressed={tpl.id === 'blood-donation' ? 'true' : 'false'}
                      title="{tpl.nameBn} — {tpl.whenToUseBn}"
                      class="group/tpl flex flex-col rounded-xl overflow-hidden border transition-all cursor-pointer bg-white dark:bg-[#0f131b] border-slate-200/95 dark:border-white/10 hover:border-[#2563eb] hover:shadow-md aria-pressed:border-[#2563eb] aria-pressed:ring-2 aria-pressed:ring-[#2563eb]/40 p-0 text-left"
                    >
                      <div class="relative w-full aspect-square overflow-hidden" style="background:{tpl.bg};">
                        <img
                          data-tpl-thumb={tpl.id}
                          alt={tpl.nameBn}
                          loading="lazy"
                          class="w-full h-full object-cover opacity-0 transition-all duration-200 group-hover/tpl:scale-[1.03]"
                        />
                        {#if tpl.tag}
                          <span
                            class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs text-white text-[8.5px] font-extrabold pointer-events-none"
                            data-i18n-bn={tpl.tag}
                            data-i18n-en={tpl.tagEn || tpl.tag}
                          >
                            {tpl.tag}
                          </span>
                        {/if}
                      </div>
                      <!-- Permanently Visible Unique Card Name & Subtitle -->
                      <div class="w-full px-2 py-1.5 bg-white dark:bg-[#111621] border-t border-slate-100 dark:border-white/8">
                        <strong
                          class="block text-[11px] font-extrabold text-slate-900 dark:text-white leading-tight truncate group-aria-pressed/tpl:text-[#2563eb] dark:group-aria-pressed/tpl:text-sky-400"
                          data-i18n-bn={tpl.nameBn}
                          data-i18n-en={tpl.nameEn}
                        >
                          {tpl.nameBn}
                        </strong>
                        <span
                          class="block text-[9.5px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5"
                          data-i18n-bn={tpl.whenToUseBn}
                          data-i18n-en={tpl.whenToUseEn}
                        >
                          {tpl.whenToUseBn}
                        </span>
                      </div>
                    </button>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        </div>

        <!-- ===============================================================
             DRAWER 2: ELEMENTS & STYLE (Shapes, Bilingual Stickers, Color Palettes)
             =============================================================== -->
        <div data-pc-drawer="elements" hidden class="space-y-4">
          <!-- Resizable & Rotatable Shapes -->
          <div>
            <strong class="block text-[12px] font-extrabold text-slate-900 dark:text-white mb-0.5" data-i18n-bn="শেপ ও ফ্রেম (বড়-ছোট ও রোটেট করা যাবে)" data-i18n-en="Resizable & Rotatable Shapes">শেপ ও ফ্রেম (বড়-ছোট ও রোটেট করা যাবে)</strong>
            <span class="block text-[10.5px] text-slate-500 dark:text-slate-400 mb-2" data-i18n-bn="ক্লিক করে কার্ডে যোগ করুন, কর্নার বা সাইড ধরে সাইজ বদলান" data-i18n-en="Click to add, drag corners or sides to resize & rotate">ক্লিক করে কার্ডে যোগ করুন, কর্নার বা সাইড ধরে সাইজ বদলান</span>
            <div class="grid grid-cols-3 gap-1.5" id="pcShapeElementsGrid">
              {#each shapeElements as sh}
                <button
                  type="button"
                  data-add-shape={sh.kind}
                  data-fill={sh.fill}
                  data-stroke={sh.stroke}
                  data-w={sh.w}
                  data-h={sh.h}
                  data-radius={sh.radius}
                  class="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:bg-blue-50/70 dark:hover:bg-white/6 border border-slate-200 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition"
                >
                  <span class="w-10 h-6 flex items-center justify-center">
                    {#if sh.kind === 'rect'}
                      <span class="w-9 h-5 rounded-sm bg-red-600 block"></span>
                    {:else if sh.kind === 'pill'}
                      <span class="w-9 h-4.5 rounded-full bg-[#2563eb] block"></span>
                    {:else if sh.kind === 'circle'}
                      <span class="w-5.5 h-5.5 rounded-full bg-amber-500 block"></span>
                    {:else if sh.kind === 'glass'}
                      <span class="w-9 h-5 rounded-md bg-slate-800/80 border border-sky-400 block"></span>
                    {:else if sh.kind === 'outline'}
                      <span class="w-9 h-5 rounded-sm border-2 border-amber-400 block"></span>
                    {:else}
                      <span class="w-9 h-1.5 rounded-full bg-amber-400 block"></span>
                    {/if}
                  </span>
                  <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full" data-i18n-bn={sh.labelBn} data-i18n-en={sh.labelEn}>{sh.labelBn}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Bilingual Stickers & Badges -->
          <div class="pt-2 border-t border-slate-200/80 dark:border-white/10">
            <div class="flex items-center justify-between mb-0.5">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="বাংলা ও ইংরেজি ব্যাজ স্টিকার (৩৮টি)" data-i18n-en="Bangla & English Badge Stickers (38)">বাংলা ও ইংরেজি ব্যাজ স্টিকার (৩৮টি)</strong>
              <span class="text-[9.5px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">Editable</span>
            </div>
            <span class="block text-[10.5px] text-slate-500 dark:text-slate-400 mb-2" data-i18n-bn="ক্লিক করে ক্যানভাসে যুক্ত করুন — সাইজ, রোটেট ও ব্যাকগ্রাউন্ড কালার পরিবর্তনযোগ্য" data-i18n-en="Click to add to canvas — resizable, rotatable & tintable">ক্লিক করে ক্যানভাসে যুক্ত করুন — সাইজ, রোটেট ও ব্যাকগ্রাউন্ড কালার পরিবর্তনযোগ্য</span>

            <!-- Category Filter Pills -->
            <div class="flex flex-wrap items-center gap-1.5 mb-2" id="pcStickerCatFilter">
              {#each stickerCategories as cat}
                <button
                  type="button"
                  data-sticker-cat={cat.id}
                  aria-pressed={activeStickerCat === cat.id ? 'true' : 'false'}
                  onclick={() => { activeStickerCat = cat.id; }}
                  class="px-2 py-0.5 rounded-full text-[10.5px] font-bold cursor-pointer transition border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:border-[#2563eb]"
                  data-i18n-bn={cat.labelBn}
                  data-i18n-en={cat.labelEn}
                >
                  {cat.labelBn}
                </button>
              {/each}
            </div>

            <div class="grid grid-cols-2 gap-1.5" id="pcStickerElementsGrid">
              {#each stickerElements.filter(st => activeStickerCat === 'all' || st.cat === activeStickerCat) as st}
                <button
                  type="button"
                  data-add-sticker={st.text}
                  data-bg={st.bg}
                  data-fg={st.fg}
                  data-size={st.size}
                  data-cat={st.cat}
                  data-icon={st.icon || ''}
                  class="h-8.5 px-2.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1.5 truncate cursor-pointer shadow-2xs hover:scale-[1.02] transition border border-black/10"
                  style="background:{st.bg};color:{st.fg};"
                  title={st.labelBn}
                >
                  {#if st.icon === 'bolt'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/></svg>
                  {:else if st.icon === 'live'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>
                  {:else if st.icon === 'alert'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M12 3L2 20h20L12 3z"/><path d="M12 9v5"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/></svg>
                  {:else if st.icon === 'blood'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M12 2.5C12 2.5 6 9.6 6 14.2A6 6 0 0 0 18 14.2C18 9.6 12 2.5 12 2.5Z"/></svg>
                  {:else if st.icon === 'handheart'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M12 20.5s-7-4.4-7-9.6A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.9c0 5.2-7 9.6-7 9.6z"/></svg>
                  {:else if st.icon === 'shield'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  {:else if st.icon === 'chat'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {/if}
                  <span class="truncate">{st.text}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Native SVG Payment & Brand Badges -->
          <div class="pt-2 border-t border-slate-200/80 dark:border-white/10">
            <div class="flex items-center justify-between mb-1">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="পেমেন্ট ব্র্যান্ড ভেক্টর (SVG)" data-i18n-en="Payment Brand Vectors (SVG)">
                পেমেন্ট ব্র্যান্ড ভেক্টর (SVG)
              </strong>
              <span class="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Native SVG</span>
            </div>
            <span class="block text-[10.5px] text-slate-500 dark:text-slate-400 mb-2" data-i18n-bn="ক্যানভাসে এক ক্লিকে যুক্ত করুন — সম্পূর্ণ স্কেলেবল ও ক্রিস্প" data-i18n-en="One-click add to canvas — fully scalable and crisp">
              ক্যানভাসে এক ক্লিকে যুক্ত করুন — সম্পূর্ণ স্কেলেবল ও ক্রিস্প
            </span>

            <div class="grid grid-cols-3 gap-1.5" id="pcPaymentVectorsGrid">
              <!-- bKash Vector Button -->
              <button
                type="button"
                data-add-vector="bkash"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#e2136e] bg-slate-50 dark:bg-[#0f131b] hover:bg-pink-500/5 transition cursor-pointer group"
                title="bKash (বিকাশ) ভেক্টর লোগো যুক্ত করুন"
              >
                <span class="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center p-1 group-hover:scale-105 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 158 150" class="w-6 h-6">
                    <polygon fill="#D02053" points="57.27,71.2 66.52,112.76 127.01,82.13"/>
                    <polygon fill="#E2126E" points="74.48,9.1 57.28,71.21 127.03,82.13"/>
                    <polygon fill="#D02053" points="0.58,0 72.71,8.62 55.66,70.36"/>
                    <polygon fill="#9D1638" points="0,12.15 8.04,12.15 30.58,40.96"/>
                    <polygon fill="#D02053" points="128.94,81.74 107.97,52.72 141.89,46.65"/>
                    <polygon fill="#E2126E" points="125.44,90.24 127.59,83.78 74.66,110.64"/>
                    <polygon fill="#9D1638" points="55.79,72.84 66.83,122.49 34.05,149.14"/>
                    <polygon fill="#E2126E" points="138.58,61.4 157.83,61.07 143.92,46.92"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10.5px] font-extrabold text-[#e2136e]">bKash বিকাশ</span>
              </button>

              <!-- Nagad Vector Button -->
              <button
                type="button"
                data-add-vector="nagad"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#f16522] bg-slate-50 dark:bg-[#0f131b] hover:bg-orange-500/5 transition cursor-pointer group"
                title="Nagad (নগদ) ভেক্টর লোগো যুক্ত করুন"
              >
                <span class="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center p-1 group-hover:scale-105 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" class="w-6 h-6">
                    <circle cx="27" cy="27" r="27" fill="#ffffff" />
                    <path fill="#f6921e" d="M 12.917969 11.578125 C 14.3125 8.097656 16.460938 5.125 19.355469 2.65625 C 19.789062 2.285156 20.300781 1.691406 20.914062 0.871094 C 20.941406 0.835938 20.984375 0.777344 21.035156 0.699219 C 21.066406 0.652344 21.132812 0.554688 21.238281 0.40625 C 21.285156 0.339844 21.378906 0.207031 21.523438 0.0078125 C 21.542969 -0.0195312 21.574219 -0.00390625 21.578125 0.03125 C 21.734375 1.542969 21.644531 3.25 21.304688 5.152344 C 20.96875 7.058594 20.382812 9.070312 19.546875 11.191406 C 18.710938 13.3125 17.652344 15.359375 16.367188 17.335938 C 15.085938 19.308594 13.679688 20.976562 12.148438 22.339844 C 11.777344 22.671875 11.398438 22.980469 11.011719 23.277344 C 11.15625 22.316406 11.414062 21.375 11.785156 20.457031 C 12.449219 18.804688 13.203125 17.164062 14.054688 15.539062 C 14.90625 13.910156 15.753906 12.417969 16.601562 11.058594 C 16.617188 11.035156 16.609375 11.003906 16.585938 10.996094 C 15.367188 11.199219 14.148438 11.394531 12.917969 11.578125 Z"/>
                    <path fill="#f16522" d="M 29.363281 8.757812 C 29.382812 8.75 29.386719 8.734375 29.378906 8.714844 L 26.691406 0.160156 C 26.683594 0.132812 26.648438 0.125 26.628906 0.144531 C 25.109375 1.542969 23.363281 3.238281 21.398438 5.234375 C 19.429688 7.226562 17.527344 9.386719 15.691406 11.707031 C 13.851562 14.03125 12.242188 16.375 10.859375 18.734375 C 9.472656 21.097656 8.5 23.34375 7.933594 25.476562 C 7.371094 27.605469 7.378906 29.496094 7.953125 31.144531 C 8.527344 32.796875 9.777344 34.074219 11.703125 34.980469 C 13.628906 35.882812 16.140625 36.3125 19.238281 36.261719 C 18.847656 35.539062 18.570312 34.789062 18.40625 34.019531 C 18.066406 32.417969 18.175781 30.730469 18.734375 28.960938 C 19.292969 27.1875 20.199219 25.328125 21.453125 23.382812 C 22.707031 21.4375 24.238281 19.390625 26.046875 17.242188 C 27.246094 15.820312 28.351562 14.472656 29.363281 13.203125 C 29.789062 14.730469 29.84375 16.328125 29.53125 17.988281 C 29.214844 19.648438 28.453125 21.289062 27.242188 22.910156 C 26.871094 23.40625 26.476562 23.882812 26.058594 24.339844 C 26.6875 23.816406 27.300781 23.210938 27.898438 22.523438 C 29.351562 20.855469 30.40625 19.042969 31.066406 17.085938 C 31.722656 15.125 31.878906 13.148438 31.53125 11.152344 C 31.332031 10.015625 30.835938 9.074219 30.046875 8.328125 C 29.816406 8.484375 29.589844 8.625 29.363281 8.757812 Z"/>
                    <path fill="#ec1c24" d="M 31.359375 40.09375 C 31.367188 40.117188 31.363281 40.140625 31.347656 40.167969 C 30.074219 42.277344 28.160156 44.027344 25.609375 45.414062 C 23.054688 46.804688 20.128906 47.660156 16.828125 47.984375 C 13.527344 48.304688 10.429688 47.914062 7.53125 46.808594 C 4.632812 45.703125 2.503906 43.839844 1.144531 41.21875 C -0.214844 38.597656 -0.378906 35.347656 0.652344 31.46875 C 1.683594 27.585938 4.09375 23.414062 7.886719 18.949219 C 11.675781 14.484375 16.699219 10.15625 22.953125 5.960938 C 22.980469 5.945312 23.011719 5.964844 23.003906 5.996094 C 22.5625 7.644531 22.378906 9.421875 22.453125 11.328125 C 22.527344 13.234375 22.957031 15.195312 23.742188 17.210938 C 24.527344 19.222656 25.609375 21.21875 26.984375 23.195312 C 28.363281 25.175781 29.9375 27.054688 31.707031 28.832031 C 33.476562 30.613281 35.253906 32.1875 37.039062 33.554688 C 38.824219 34.921875 40.386719 35.984375 41.722656 36.738281 C 41.746094 36.753906 41.746094 36.789062 41.722656 36.804688 C 39.882812 37.980469 37.945312 39.035156 35.914062 39.96875 C 33.878906 40.898438 31.972656 41.605469 30.191406 42.085938 C 30.824219 41.527344 31.214844 40.863281 31.359375 40.09375 Z"/>
                    <path fill="#ec1c24" d="M 42.359375 13.386719 L 42.101562 8.253906 C 42.097656 8.214844 42.117188 8.195312 42.148438 8.214844 C 44.914062 9.945312 47.464844 12.015625 49.796875 14.425781 C 52.132812 16.839844 53.644531 19.230469 54.335938 21.601562 C 54.34375 21.636719 54.308594 21.65625 54.277344 21.636719 C 51.523438 19.988281 48.332031 18.242188 44.707031 16.398438 C 43.863281 15.96875 43.078125 15.539062 42.359375 15.109375 Z"/>
                    <path fill="#f16522" d="M 4.503906 14.941406 C 4.53125 14.953125 4.535156 14.988281 4.511719 15.003906 C 3.125 15.976562 1.953125 17.078125 0.996094 18.308594 C 0.0390625 19.539062 -0.347656 20.804688 -0.160156 22.101562 C 0.0273438 23.402344 0.742188 24.71875 1.980469 26.050781 C 3.222656 27.386719 4.886719 28.664062 6.96875 29.878906 C 7.214844 28.511719 7.746094 27.109375 8.566406 25.671875 C 9.574219 23.90625 10.828125 22.183594 12.324219 20.503906 C 13.824219 18.824219 15.464844 17.277344 17.25 15.863281 C 19.03125 14.449219 20.785156 13.253906 22.507812 12.277344 C 20.851562 13.195312 19.460938 14.28125 18.332031 15.539062 C 17.207031 16.792969 16.347656 18.15625 15.757812 19.628906 C 15.164062 21.097656 14.863281 22.585938 14.851562 24.089844 C 14.84375 25.597656 15.1875 27.054688 15.882812 28.460938 C 16.578125 29.871094 17.65625 31.144531 19.117188 32.285156 C 20.578125 33.425781 22.421875 34.296875 24.648438 34.898438 C 26.871094 35.503906 29.542969 35.679688 32.664062 35.433594 C 31.847656 36.003906 30.796875 36.5625 29.511719 37.109375 C 28.226562 37.65625 26.792969 38.070312 25.210938 38.351562 C 23.628906 38.632812 22.015625 38.699219 20.371094 38.546875 C 18.726562 38.398438 17.273438 37.957031 16.011719 37.226562 C 14.75 36.496094 13.917969 35.394531 13.515625 33.917969 C 13.113281 32.445312 13.253906 30.558594 13.9375 28.257812 C 14.621094 25.957031 15.9375 23.277344 17.886719 20.21875 C 19.835938 17.15625 22.429688 13.984375 25.667969 10.703125 C 25.6875 10.679688 25.675781 10.648438 25.648438 10.65625 C 22.128906 11.488281 18.664062 12.355469 15.25 13.261719 C 11.839844 14.167969 8.257812 14.730469 4.503906 14.941406 Z"/>
                    <path fill="#f6921e" d="M 17.675781 51.796875 C 21.511719 52.601562 25.328125 52.882812 29.128906 52.640625 C 32.925781 52.398438 36.46875 51.578125 39.757812 50.179688 C 43.042969 48.78125 45.832031 46.855469 48.121094 44.402344 C 50.410156 41.953125 51.984375 39.183594 52.84375 36.101562 C 53.703125 33.015625 53.691406 29.890625 52.808594 26.726562 C 51.925781 23.5625 50.054688 20.730469 47.195312 18.230469 C 47.167969 18.207031 47.132812 18.234375 47.148438 18.265625 C 48.71875 21.6875 49.339844 25.109375 49.007812 28.53125 C 48.679688 31.953125 47.457031 35.195312 45.34375 38.261719 C 43.226562 41.328125 40.402344 43.988281 36.871094 46.242188 C 33.335938 48.496094 29.355469 50.019531 24.929688 50.8125 C 22.421875 51.261719 19.988281 51.496094 17.632812 51.515625 C 17.597656 51.515625 17.585938 51.558594 17.613281 51.578125 C 18.679688 52.296875 19.824219 52.929688 21.050781 53.476562 C 21.085938 53.492188 21.117188 53.457031 21.097656 53.425781 C 19.929688 52.914062 18.789062 52.371094 17.675781 51.796875 Z"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10.5px] font-extrabold text-[#f16522]">Nagad নগদ</span>
              </button>

              <!-- Rocket Vector Button -->
              <button
                type="button"
                data-add-vector="rocket"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#8b3392] bg-slate-50 dark:bg-[#0f131b] hover:bg-purple-500/5 transition cursor-pointer group"
                title="Rocket (রকেট) ভেক্টর লোগো যুক্ত করুন"
              >
                <span class="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center p-1 group-hover:scale-105 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 0 208 126" class="w-6 h-6">
                    <path fill="#8b3392" d="M 148.546875 16.363281 L 119.070312 45.933594 L 121.101562 62.507812 L 126.5625 68.199219 L 140.488281 68.199219 L 157.652344 51.011719 L 166.863281 0 Z"/>
                    <path fill="#8b3392" d="M 122.921875 68.199219 C 122.921875 68.199219 97.992188 68.199219 91.902344 68.199219 C 85.816406 68.199219 79.914062 70.835938 75.984375 74.960938 C 72.054688 79.085938 65.75 92.511719 65.75 92.511719 C 65.75 92.511719 75.984375 92.511719 86.632812 92.511719 C 97.28125 92.511719 104.773438 88.582031 108.570312 84.777344 C 112.367188 80.976562 119.339844 73.117188 119.339844 73.117188 L 122.921875 68.199219 Z"/>
                    <path fill="#8b3392" d="M 187.828125 83.789062 C 182.648438 83.789062 176.414062 83.789062 176.414062 83.789062 L 151.785156 68.199219 L 149.632812 43.433594 L 200.320312 94.679688 L 194.515625 83.789062 Z"/>
                    <path fill="#8b3392" d="M 77.199219 68.199219 L 62.214844 68.199219 C 57.453125 74.027344 49.121094 97.667969 49.121094 97.667969 C 49.121094 97.667969 66.863281 102.398438 72.953125 106.335938 L 77.199219 115.429688 Z"/>
                    <path fill="#8b3392" d="M 38.96875 115.886719 C 38.96875 121.082031 34.765625 125.296875 29.585938 125.296875 C 24.398438 125.296875 20.199219 121.082031 20.199219 115.886719 C 20.199219 110.699219 24.398438 106.492188 29.585938 106.492188 C 34.765625 106.492188 38.96875 110.699219 38.96875 115.886719 Z"/>
                    <path fill="#8b3392" d="M 18.941406 68.199219 C -4.722656 71.847656 -7.175781 106.335938 18.664062 110.996094 C 36.96875 114.28125 49.988281 102.070312 49.988281 102.070312 C 49.988281 102.070312 28.988281 99.789062 25.4375 92.511719 C 21.878906 85.234375 26.449219 78.4375 26.449219 78.4375 Z"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10.5px] font-extrabold text-[#8b3392]">Rocket রকেট</span>
              </button>
            </div>
          </div>

          <!-- Color Palettes -->
          <div class="pt-2 border-t border-slate-200/80 dark:border-white/10">
            <strong class="block text-[12px] font-extrabold text-slate-900 dark:text-white mb-2" data-i18n-bn="কার্ডের কালার থিম (১২টি প্যালেট)" data-i18n-en="Card Color Palettes (12 Themes)">কার্ডের কালার থিম (১২টি প্যালেট)</strong>
            <div class="grid grid-cols-2 gap-1.5" id="pcThemePills">
              {#each themePalettes as th, i}
                <button
                  type="button"
                  data-pc-theme={th.id}
                  data-primary={th.primary}
                  data-accent={th.accent}
                  data-bg={th.bg}
                  aria-pressed={i === 1 ? 'true' : 'false'}
                  class="flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer transition bg-slate-50 dark:bg-[#0f131b] border-slate-200 dark:border-white/10 hover:border-[#2563eb] aria-pressed:border-[#2563eb] aria-pressed:ring-2 aria-pressed:ring-[#2563eb]/25"
                >
                  <span class="flex items-center -space-x-1 shrink-0">
                    <span class="w-4 h-4 rounded-full border border-white/40" style="background:{th.primary}"></span>
                    <span class="w-4 h-4 rounded-full border border-white/40" style="background:{th.accent}"></span>
                    <span class="w-4 h-4 rounded-full border border-white/40" style="background:{th.bg}"></span>
                  </span>
                  <span class="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" data-i18n-bn={th.nameBn} data-i18n-en={th.nameEn}>{th.nameBn}</span>
                </button>
              {/each}
            </div>

            <div class="grid grid-cols-3 gap-2 mt-2.5">
              <label class="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcPrimaryColor" value="#dc2626" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate" data-i18n-bn="প্রাইমারি" data-i18n-en="Primary">প্রাইমারি</span>
              </label>
              <label class="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcAccentColor" value="#fde047" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate" data-i18n-bn="হাইলাইট" data-i18n-en="Accent">হাইলাইট</span>
              </label>
              <label class="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcBgColor" value="#1c080b" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate" data-i18n-bn="ব্যাকগ্রাউন্ড" data-i18n-en="Background">ব্যাকগ্রাউন্ড</span>
              </label>
            </div>
          </div>

          <!-- Overlay Density Slider + Legacy Font Select Mirror -->
          <div class="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
            <div hidden>
              <select id="pcFontFamily">
                {#each fontFamilies as ff}
                  <option value={ff.id}>{ff.label}</option>
                {/each}
              </select>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10">
              <div class="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                <span data-i18n-bn="ছবির নিচে শ্যাডো ঘনত্ব" data-i18n-en="Photo Gradient Overlay">ছবির নিচে শ্যাডো ঘনত্ব</span>
                <strong id="pcOverlayAlphaVal" class="font-mono text-slate-500">85%</strong>
              </div>
              <input type="range" id="pcOverlayAlpha" min="25" max="100" value="85" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
            </div>
          </div>
        </div>

        <!-- ===============================================================
             DRAWER 3: BILINGUAL TEXT PANEL (Bangla + English Presets & Font Launcher)
             =============================================================== -->
        <div data-pc-drawer="text" hidden class="space-y-3">
          <div class="grid grid-cols-2 gap-1.5">
            <!-- Add Text Box CTA -->
            <button
              type="button"
              id="pcAddTextBoxBtn"
              class="h-10 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition border-0"
            >
              <Icon name="lucide:type" class="w-4 h-4 [&_*]:!stroke-white" />
              <span data-i18n-bn="+ টেক্সট বক্স" data-i18n-en="+ Add Text Box">+ টেক্সট বক্স</span>
            </button>

            <!-- Open Font Library & Custom Font Upload Drawer -->
            <button
              type="button"
              id="pcOpenFontDrawerBtn"
              class="h-10 px-3 rounded-xl bg-slate-100 dark:bg-[#1e2636] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-white/12 text-slate-800 dark:text-white text-[12px] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Icon name="lucide:languages" class="w-4 h-4 text-[#2563eb]" />
              <span data-i18n-bn="ফন্ট ও আপলোড" data-i18n-en="Fonts & Upload">ফন্ট ও আপলোড</span>
            </button>
          </div>

          <!-- Bilingual Default Text Styles (Bangla + English Side-by-Side!) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between px-0.5">
              <strong class="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200" data-i18n-bn="রেডি টেক্সট স্টাইল (বাংলা ও English)" data-i18n-en="Text Styles (Bangla & English)">রেডি টেক্সট স্টাইল (বাংলা ও English)</strong>
            </div>

            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                data-add-text-preset="heading"
                data-preset-lang="bn"
                class="px-3 py-2 rounded-xl bg-white dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 text-left cursor-pointer transition"
              >
                <span class="text-[14.5px] font-black text-slate-900 dark:text-white leading-tight block">বড় শিরোনাম</span>
                <span class="text-[9.5px] text-slate-400">বাংলা হেডিং</span>
              </button>
              <button
                type="button"
                data-add-text-preset="heading"
                data-preset-lang="en"
                class="px-3 py-2 rounded-xl bg-white dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 text-left cursor-pointer transition"
              >
                <span class="text-[14.5px] font-black text-slate-900 dark:text-white leading-tight block">Add a heading</span>
                <span class="text-[9.5px] text-slate-400">English Heading</span>
              </button>

              <button
                type="button"
                data-add-text-preset="subheading"
                data-preset-lang="bn"
                class="px-3 py-2 rounded-xl bg-white dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 text-left cursor-pointer transition"
              >
                <span class="text-[12.5px] font-bold text-slate-800 dark:text-slate-100 leading-tight block">উপ-শিরোনাম</span>
                <span class="text-[9.5px] text-slate-400">সাব-হেডিং</span>
              </button>
              <button
                type="button"
                data-add-text-preset="subheading"
                data-preset-lang="en"
                class="px-3 py-2 rounded-xl bg-white dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 text-left cursor-pointer transition"
              >
                <span class="text-[12.5px] font-bold text-slate-800 dark:text-slate-100 leading-tight block">Add subheading</span>
                <span class="text-[9.5px] text-slate-400">English Subhead</span>
              </button>

              <button
                type="button"
                data-add-text-preset="body"
                data-preset-lang="bn"
                class="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 text-left cursor-pointer transition"
              >
                <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight block">সাধারণ লেখা যুক্ত করুন</span>
              </button>
              <button
                type="button"
                data-add-text-preset="body"
                data-preset-lang="en"
                class="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 text-left cursor-pointer transition"
              >
                <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight block">Add body text</span>
              </button>
            </div>
          </div>

          <!-- Divider: Built-in Template Content Fields -->
          <div class="pt-2.5 border-t border-slate-200/90 dark:border-white/10 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <strong class="block text-[11.5px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="কার্ডের মূল লেখাসমূহ (বাংলা / English)" data-i18n-en="Card Main Text Fields (BN / EN)">কার্ডের মূল লেখাসমূহ (বাংলা / English)</strong>
                <span id="pcTextDrawerUseCase" class="block text-[10px] font-semibold text-[#2563eb] dark:text-sky-400 truncate">মুমূর্ষু রোগীর রক্তদাতা খুঁজতে</span>
              </div>
              <button
                type="button"
                id="pcLoadSampleTextBtn"
                class="shrink-0 px-2.5 py-1 rounded-lg bg-blue-500/12 hover:bg-blue-500/20 text-[#1d4ed8] dark:text-sky-300 text-[10.5px] font-extrabold cursor-pointer transition"
              >
                <span data-i18n-bn="↻ নমুনা লেখা" data-i18n-en="↻ Sample Text">↻ নমুনা লেখা</span>
              </button>
            </div>

            <!-- Fact-Check Verdict Selector -->
            <div id="pcVerdictBox" hidden class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5">
              <span class="block text-[11px] font-extrabold text-rose-700 dark:text-rose-300" data-i18n-bn="ফ্যাক্ট-চেক সিলমোহর রায়:" data-i18n-en="Fact-Check Stamp Verdict:">ফ্যাক্ট-চেক সিলমোহর রায়:</span>
              <div class="grid grid-cols-2 gap-1.5" id="pcVerdictGroup">
                <button type="button" data-pc-verdict="false" aria-pressed="true" class="h-8 px-2 rounded-lg text-[11px] font-bold bg-white dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 aria-pressed:bg-red-600 aria-pressed:text-white cursor-pointer" data-i18n-bn="✕ ভুয়া / মিথ্যা" data-i18n-en="✕ Fake / False">✕ ভুয়া / মিথ্যা</button>
                <button type="button" data-pc-verdict="altered" aria-pressed="false" class="h-8 px-2 rounded-lg text-[11px] font-bold bg-white dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 aria-pressed:bg-amber-600 aria-pressed:text-white cursor-pointer" data-i18n-bn="▲ সম্পাদিত" data-i18n-en="▲ Altered">▲ সম্পাদিত</button>
                <button type="button" data-pc-verdict="misleading" aria-pressed="false" class="h-8 px-2 rounded-lg text-[11px] font-bold bg-white dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 aria-pressed:bg-orange-600 aria-pressed:text-white cursor-pointer" data-i18n-bn="! বিভ্রান্তিকর" data-i18n-en="! Misleading">! বিভ্রান্তিকর</button>
                <button type="button" data-pc-verdict="true" aria-pressed="false" class="h-8 px-2 rounded-lg text-[11px] font-bold bg-white dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 aria-pressed:bg-green-600 aria-pressed:text-white cursor-pointer" data-i18n-bn="✓ সত্য / সঠিক" data-i18n-en="✓ True / Verified">✓ সত্য / সঠিক</button>
              </div>
            </div>

            <!-- Dual Comparison Labels -->
            <div id="pcDualLabelsBox" hidden class="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10">
              <div>
                <label for="pcLeftLabelInput" class="block text-[10px] font-bold text-red-600 dark:text-red-400 mb-1" data-i18n-bn="বাম ব্যাজ (✕):" data-i18n-en="Left Badge (✕):">বাম ব্যাজ (✕):</label>
                <input type="text" id="pcLeftLabelInput" value="সম্পাদিত ভুয়া কার্ড" class="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1d222d] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-900 dark:text-white" />
              </div>
              <div>
                <label for="pcRightLabelInput" class="block text-[10px] font-bold text-green-600 dark:text-green-400 mb-1" data-i18n-bn="ডান ব্যাজ (✓):" data-i18n-en="Right Badge (✓):">ডান ব্যাজ (✓):</label>
                <input type="text" id="pcRightLabelInput" value="মূল সংবাদ কার্ড" class="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1d222d] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-900 dark:text-white" />
              </div>
            </div>

            <!-- Badge -->
            <div>
              <label for="pcBadgeText" id="pcBadgeFieldLabel" class="block text-[11px] font-extrabold text-slate-700 dark:text-slate-200 mb-1">ব্যাজ / ক্যাটাগরি (Badge):</label>
              <input
                type="text"
                id="pcBadgeText"
                value="O+ (পজিটিভ)"
                class="w-full h-8.5 px-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[12px] font-bold text-slate-900 dark:text-white mb-1.5 outline-none focus:border-[#2563eb]"
              />
              <div class="flex items-center gap-1 flex-wrap" id="pcQuickBadges"></div>
            </div>

            <!-- Headline -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-1">
                <label for="pcHeadlineText" id="pcHeadlineFieldLabel" class="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">মূল শিরোনাম (Headline):</label>
                <button
                  type="button"
                  id="pcHighlightSelectionBtn"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[10px] font-bold cursor-pointer transition"
                >
                  <Icon name="lucide:highlighter" class="w-3 h-3" />
                  <span data-i18n-bn="*শব্দ* হাইলাইট" data-i18n-en="*Word* Highlight">*শব্দ* হাইলাইট</span>
                </button>
              </div>
              <textarea
                id="pcHeadlineText"
                rows="2"
                class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[12.5px] font-bold text-slate-900 dark:text-white leading-relaxed resize-y outline-none focus:border-[#2563eb]"
              ></textarea>
            </div>

            <!-- Tagline -->
            <div>
              <label for="pcTaglineText" id="pcTaglineFieldLabel" class="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">সাব-হেডলাইন / বক্তা (Subheading):</label>
              <input
                type="text"
                id="pcTaglineText"
                class="w-full h-8.5 px-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[12px] font-semibold text-slate-800 dark:text-white outline-none focus:border-[#2563eb]"
              />
            </div>

            <!-- Detail / Bkash / Contact -->
            <div id="pcDetailFieldWrap">
              <label for="pcDetailText" id="pcDetailFieldLabel" class="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">বিস্তারিত / যোগাযোগ বক্স (Details):</label>
              <textarea
                id="pcDetailText"
                rows="2"
                class="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[11.5px] font-medium text-slate-800 dark:text-white leading-relaxed resize-y outline-none focus:border-[#2563eb]"
              ></textarea>
            </div>

            <!-- Footer & Date -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="pcFooterUrl" class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1" data-i18n-bn="ওয়েবসাইট / হটলাইন:" data-i18n-en="Website / Hotline:">ওয়েবসাইট / হটলাইন:</label>
                <input type="text" id="pcFooterUrl" class="w-full h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-800 dark:text-white" />
              </div>
              <div>
                <label for="pcDateText" class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1" data-i18n-bn="তারিখ (Date):" data-i18n-en="Date:">তারিখ (Date):</label>
                <input type="text" id="pcDateText" class="w-full h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          <!-- Hidden mirror controls kept synced with floating toolbar -->
          <div hidden>
            <input type="range" id="pcTitleSize" min="26" max="110" value="44" />
            <span id="pcTitleSizeVal">44px</span>
            <span id="pcTextAlignLabel">বাম</span>
            <div id="pcTextAlignGroup">
              <button type="button" data-pc-align="left">বাম</button>
              <button type="button" data-pc-align="center">মাঝে</button>
              <button type="button" data-pc-align="right">ডান</button>
            </div>
          </div>
        </div>

        <!-- ===============================================================
             DRAWER 3B: CANVA-STYLE FONT PICKER & CUSTOM FONT UPLOAD DRAWER
             Opened when clicking the Font button in top toolbar or Text drawer!
             =============================================================== -->
        <div data-pc-drawer="fonts" hidden class="space-y-3">
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200 dark:border-white/10">
            <div class="flex items-center gap-1.5">
              <Icon name="lucide:type" class="w-4 h-4 text-[#2563eb]" />
              <strong class="text-[13px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="ফন্ট লাইব্রেরি ও আপলোড" data-i18n-en="Fonts & Custom Upload">ফন্ট লাইব্রেরি ও আপলোড</strong>
            </div>
            <button
              type="button"
              id="pcCloseFontDrawerBtn"
              class="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
              title="ফিরে যান"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Search Fonts -->
          <div class="relative flex items-center">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="pcFontSearchInput"
              placeholder="ফন্ট খুঁজুন (Kalpurush, SolaimanLipi, Anton, Inter...)"
              data-i18n-placeholder-bn="ফন্ট খুঁজুন (কালপুরুষ, সোলাইমানলিপি, Anton...)"
              data-i18n-placeholder-en="Search fonts (Kalpurush, Anton, Poppins...)"
              class="w-full h-9.5 pl-9.5 pr-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-300/90 dark:border-white/15 text-[12px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#2563eb]"
            />
          </div>

          <!-- Upload Custom Font CTA (.ttf, .otf, .woff, .woff2) -->
          <label
            for="pcFontUploadInput"
            id="pcFontDropzone"
            class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white cursor-pointer shadow-xs transition"
          >
            <div class="flex items-center gap-2 min-w-0">
              <Icon name="lucide:upload-cloud" class="w-4 h-4 shrink-0 [&_*]:!stroke-white" />
              <div class="min-w-0">
                <span class="block text-[12px] font-extrabold leading-tight" data-i18n-bn="+ কাস্টম ফন্ট আপলোড করুন" data-i18n-en="+ Upload a custom font">+ কাস্টম ফন্ট আপলোড করুন</span>
                <span class="block text-[9.5px] text-sky-100 leading-tight truncate">.TTF, .OTF, .WOFF, .WOFF2 (স্থায়ীভাবে সেভ থাকবে)</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-md bg-white/18 text-[10px] font-extrabold shrink-0">Upload</span>
          </label>

          <!-- Language / Type Filter Chips + Apply to All Button -->
          <div class="flex flex-wrap items-center justify-between gap-1.5">
            <div class="inline-flex flex-wrap items-center gap-1" id="pcFontFilterGroup">
              <button type="button" data-font-filter="all" aria-pressed="true" class="h-7 px-2.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-[#1f2633] text-slate-700 dark:text-slate-200 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer" data-i18n-bn="সব" data-i18n-en="All">সব</button>
              <button type="button" data-font-filter="bn" aria-pressed="false" class="h-7 px-2.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-[#1f2633] text-slate-700 dark:text-slate-200 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer">বাংলা</button>
              <button type="button" data-font-filter="en" aria-pressed="false" class="h-7 px-2.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-[#1f2633] text-slate-700 dark:text-slate-200 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer">English</button>
              <button type="button" data-font-filter="uploaded" aria-pressed="false" class="h-7 px-2.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-[#1f2633] text-slate-700 dark:text-slate-200 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer" data-i18n-bn="আপলোডেড" data-i18n-en="Uploaded">আপলোডেড</button>
            </div>

            <button
              type="button"
              id="pcApplyFontAllBtn"
              class="h-7 px-2 rounded-lg bg-blue-500/12 hover:bg-blue-500/20 text-[#1d4ed8] dark:text-sky-300 text-[10px] font-extrabold cursor-pointer transition"
              title="বর্তমান ফন্টটি কার্ডের সব লেখায় একসাথে প্রয়োগ করুন"
            >
              <span data-i18n-bn="সব লেখায় প্রয়োগ" data-i18n-en="Apply to all">সব লেখায় প্রয়োগ</span>
            </button>
          </div>

          <!-- Dynamic Font Lists Populated by Engine (Uploaded + Recent + Bangla + English) -->
          <div id="pcFontsDrawerBody" class="space-y-3"></div>
        </div>

        <!-- ===============================================================
             DRAWER 4: BRAND KIT (Foundation / News Portal Logos)
             =============================================================== -->
        <div data-pc-drawer="brand" hidden class="space-y-3.5">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-3">
            <div class="flex items-center justify-between">
              <strong class="text-[12.5px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="ফাউন্ডেশন / পোর্টাল ব্র্যান্ড কিট" data-i18n-en="Organization / Portal Brand Kit">ফাউন্ডেশন / পোর্টাল ব্র্যান্ড কিট</strong>
              <button type="button" id="pcClearLogoBtn" hidden class="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer" data-i18n-bn="লোগো সরান" data-i18n-en="Remove logo">লোগো সরান</button>
            </div>

            <div class="flex items-center gap-2.5">
              <div class="w-14 h-14 rounded-xl bg-white dark:bg-[#1c212c] border border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                <img id="pcActiveLogoThumb" src="" alt="Logo" hidden class="w-full h-full object-contain p-1.5" />
                <span id="pcActiveLogoEmptyIcon" class="text-[10px] font-extrabold text-slate-400">LOGO</span>
              </div>

              <label
                for="pcLogoInput"
                id="pcLogoDropzone"
                class="flex-1 flex flex-col justify-center px-3 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white cursor-pointer transition"
              >
                <span class="text-[12px] font-extrabold" data-i18n-bn="+ ব্র্যান্ড লোগো আপলোড করুন" data-i18n-en="+ Upload Brand Logo">+ ব্র্যান্ড লোগো আপলোড করুন</span>
                <span class="text-[10px] text-white/85" data-i18n-bn="কর্নার টেনে লোগো ছোট-বড় ও রোটেট করতে পারবেন" data-i18n-en="Drag corners on canvas to resize or rotate logo">কর্নার টেনে লোগো ছোট-বড় ও রোটেট করতে পারবেন</span>
              </label>
            </div>

            <div>
              <label for="pcBrandName" class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1" data-i18n-bn="সংগঠন বা পোর্টালের নাম:" data-i18n-en="Brand / Portal Name:">সংগঠন বা পোর্টালের নাম:</label>
              <input
                type="text"
                id="pcBrandName"
                value="মানবিক ব্লাড ব্যাংক ফাউন্ডেশন"
                placeholder="সংগঠন বা নিউজ পোর্টালের নাম"
                class="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[12px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="pcLogoPos" class="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1" data-i18n-bn="লোগোর অবস্থান:" data-i18n-en="Logo Position:">লোগোর অবস্থান:</label>
                <select id="pcLogoPos" class="w-full h-8.5 px-2 rounded-lg bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11.5px] font-bold text-slate-800 dark:text-white">
                  <option value="top-right">উপরে ডানে (Top Right)</option>
                  <option value="top-left">উপরে বামে (Top Left)</option>
                  <option value="top-center">উপরে মাঝে (Top Center)</option>
                  <option value="bottom-right">নিচে ডানে (Bottom Right)</option>
                  <option value="custom">কাস্টম (Custom Drag)</option>
                  <option value="hidden">লুকানো (Hidden)</option>
                </select>
              </div>
              <div>
                <label for="pcLogoBgStyle" class="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1" data-i18n-bn="পিল স্টাইল:" data-i18n-en="Badge Style:">পিল স্টাইল:</label>
                <select id="pcLogoBgStyle" class="w-full h-8.5 px-2 rounded-lg bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11.5px] font-bold text-slate-800 dark:text-white">
                  <option value="light">সাদা পিল (White Pill)</option>
                  <option value="dark">ডার্ক পিল (Dark Glass)</option>
                  <option value="none">স্বচ্ছ (Transparent)</option>
                </select>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span data-i18n-bn="লোগোর সাইজ" data-i18n-en="Logo Scale">লোগোর সাইজ</span>
                <strong id="pcLogoSizeVal" class="font-mono text-slate-900 dark:text-white">100%</strong>
              </div>
              <input type="range" id="pcLogoSize" min="40" max="240" value="100" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
            </div>
          </div>

          <div>
            <strong class="block text-[11.5px] font-extrabold text-slate-800 dark:text-white mb-1.5" data-i18n-bn="সংরক্ষিত ব্র্যান্ড লোগোসমূহ (১-ক্লিকে বসবে):" data-i18n-en="Saved Brand Logos (1-Click Apply):">সংরক্ষিত ব্র্যান্ড লোগোসমূহ (১-ক্লিকে বসবে):</strong>
            <div
              id="pcBrandLogosMirror"
              class="grid grid-cols-3 gap-2 min-h-[72px] p-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/80 dark:border-white/10"
            >
              <span class="col-span-3 text-[11px] text-slate-400 py-4 text-center">আপলোড করা সব লোগো এখানে সেভ থাকবে</span>
            </div>
          </div>
        </div>

        <!-- ===============================================================
             DRAWER 5: UPLOADS VAULT (Main Photo, Floating Image Layer & Logos)
             =============================================================== -->
        <div data-pc-drawer="uploads" hidden class="space-y-3">
          <div class="relative flex items-center">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="pcUploadSearchInput"
              placeholder="আপলোড করা ছবি বা লোগো খুঁজুন..."
              data-i18n-placeholder-bn="আপলোড করা ছবি বা লোগো খুঁজুন..."
              data-i18n-placeholder-en="Search uploaded images or logos..."
              class="w-full h-9.5 pl-9.5 pr-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-300/90 dark:border-white/15 text-[12px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#2563eb]"
            />
          </div>

          <div class="flex items-center gap-1.5">
            <label
              for="pcMultiAssetInput"
              id="pcPhotoDropzone"
              class="flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12.5px] font-extrabold cursor-pointer shadow-xs transition"
            >
              <Icon name="lucide:upload-cloud" class="w-4 h-4 [&_*]:!stroke-white" />
              <span data-i18n-bn="ছবি আপলোড করুন" data-i18n-en="Upload Images">ছবি আপলোড করুন</span>
            </label>
            <label
              for="pcFloatingImgInput"
              class="h-10 px-2.5 rounded-xl bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer transition shrink-0"
              title="কার্ডের যেকোনো স্থানে বসানোর জন্য আলাদা ভাসমান ছবি যোগ করুন"
            >
              <Icon name="lucide:image-plus" class="w-3.5 h-3.5" />
              <span data-i18n-bn="ভাসমান ছবি" data-i18n-en="Layer Img">ভাসমান ছবি</span>
            </label>
            <label
              for="pcLogoInput"
              class="h-10 px-2.5 rounded-xl bg-blue-500/12 hover:bg-blue-500/20 text-[#1d4ed8] dark:text-sky-300 text-[11px] font-extrabold inline-flex items-center justify-center cursor-pointer transition shrink-0"
              title="সরাসরি লোগো হিসেবে আপলোড করুন"
            >
              <span data-i18n-bn="+ লোগো" data-i18n-en="+ Logo">+ লোগো</span>
            </label>
          </div>

          <!-- 2nd Comparison Photo (Shown on FactCheck Dual) -->
          <div id="pcSecondPhotoWrap" hidden class="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-1.5">
            <div class="flex items-center justify-between">
              <strong class="text-[11px] font-extrabold text-sky-700 dark:text-sky-300" data-i18n-bn="ডান পাশের তুলনা ছবি (২য় কার্ড):" data-i18n-en="2nd Comparison Photo (Right):">ডান পাশের তুলনা ছবি (২য় কার্ড):</strong>
              <button type="button" id="pcClearPhoto2Btn" hidden class="text-[10.5px] font-bold text-rose-500 hover:underline cursor-pointer">মুছুন</button>
            </div>
            <label
              for="pcSecondPhotoInput"
              class="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-sky-600 text-white text-[11.5px] font-bold cursor-pointer hover:opacity-90 transition"
            >
              <Icon name="lucide:images" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="২য় ছবি আপলোড করুন" data-i18n-en="Upload 2nd Photo">২য় ছবি আপলোড করুন</span>
            </label>
          </div>

          <!-- Sub-Tabs: Images | Logos -->
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-white/10 text-[12px] font-extrabold" id="pcUploadsSubTabs">
            <div class="flex items-center gap-4">
              <button
                type="button"
                data-upload-tab="photos"
                aria-pressed="true"
                class="pb-2 border-b-2 border-transparent text-slate-500 aria-pressed:border-[#2563eb] aria-pressed:text-slate-900 dark:aria-pressed:text-white cursor-pointer transition"
              >
                <span data-i18n-bn="ছবি (Images)" data-i18n-en="Images">ছবি (Images)</span>
              </button>
              <button
                type="button"
                data-upload-tab="logos"
                aria-pressed="false"
                class="pb-2 border-b-2 border-transparent text-slate-500 aria-pressed:border-[#2563eb] aria-pressed:text-slate-900 dark:aria-pressed:text-white cursor-pointer transition"
              >
                <span data-i18n-bn="লোগো (Logos)" data-i18n-en="Logos">লোগো (Logos)</span>
              </button>
            </div>
            <button type="button" id="pcClearPhotoBtn" hidden class="pb-1.5 text-[10.5px] font-bold text-rose-500 hover:underline cursor-pointer" data-i18n-bn="ছবি সরান" data-i18n-en="Clear photo">ছবি সরান</button>
          </div>

          <!-- 2-Column Visual Images Grid -->
          <div id="pcUploadsPhotosPane">
            <div id="pcSavedPhotosGrid" class="grid grid-cols-2 gap-2 min-h-[120px]">
              <div class="col-span-2 p-5 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-center text-[11.5px] text-slate-400">
                আপনার আপলোড করা সব ছবি এখানে জমা থাকবে। ক্লিক করুন অথবা টেনে কার্ডে ছেড়ে দিন!
              </div>
            </div>
          </div>

          <!-- 2-Column Visual Logos Grid -->
          <div id="pcUploadsLogosPane" hidden>
            <div id="pcSavedLogosGrid" class="grid grid-cols-2 gap-2 min-h-[100px]">
              <div class="col-span-2 p-5 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-center text-[11.5px] text-slate-400">
                আপনার ফাউন্ডেশন বা পোর্টালের লোগো এখানে সেভ থাকবে
              </div>
            </div>
          </div>

          <!-- Photo Adjust Sliders -->
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/80 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200" data-i18n-bn="ছবির জুম, মাস্ক ও উজ্জ্বলতা" data-i18n-en="Photo Zoom, Crop & Brightness">ছবির জুম, মাস্ক ও উজ্জ্বলতা</span>
              <button type="button" id="pcResetPhotoPosBtn" class="text-[10.5px] font-bold text-[#2563eb] hover:underline cursor-pointer" data-i18n-bn="রিসেট" data-i18n-en="Reset">রিসেট</button>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                  <span data-i18n-bn="জুম" data-i18n-en="Zoom">জুম</span><strong id="pcPhotoZoomVal" class="font-mono text-slate-800 dark:text-white">100%</strong>
                </div>
                <input type="range" id="pcPhotoZoom" min="40" max="260" value="100" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
              </div>
              <div>
                <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                  <span data-i18n-bn="উজ্জ্বলতা" data-i18n-en="Brightness">উজ্জ্বলতা</span><strong id="pcPhotoBrightVal" class="font-mono text-slate-800 dark:text-white">100%</strong>
                </div>
                <input type="range" id="pcPhotoBright" min="55" max="155" value="100" class="w-full h-1.5 accent-amber-500 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <!-- ===============================================================
             DRAWER 6: PROJECTS (Saved Designs with Live Thumbnails)
             =============================================================== -->
        <div data-pc-drawer="projects" hidden class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <strong class="block text-[12.5px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="আমার প্রজেক্টস (Projects)" data-i18n-en="My Saved Projects">আমার প্রজেক্টস (Projects)</strong>
              <span class="text-[10.5px] text-slate-500 dark:text-slate-400" data-i18n-bn="ক্লিক করলেই ক্যানভাসে পুনরায় এডিট শুরু হবে" data-i18n-en="Click any project to reopen & edit">ক্লিক করলেই ক্যানভাসে পুনরায় এডিট শুরু হবে</span>
            </div>
            <button
              type="button"
              id="pcSaveNewCopyBtn"
              class="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
            >
              <Icon name="lucide:copy" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="নতুন কপি" data-i18n-en="Save Copy">নতুন কপি</span>
            </button>
          </div>

          <div id="pcSavedProjectsGrid" class="grid grid-cols-2 gap-2.5 min-h-[160px]">
            <div class="col-span-2 p-5 rounded-xl border border-dashed border-slate-300 dark:border-white/15 text-center text-[11.5px] text-slate-500 dark:text-slate-400">
              আপনার তৈরি করা ডিজাইন এখানে অটো-সেভ হয়ে থাকবে।
            </div>
          </div>
        </div>

      </div>
    </aside>

    <!-- =======================================================================
         C. INTERACTIVE WORKSPACE STAGE
         [Floating Contextual Toolbar] + [Artboard + Full Transform Handles] + [Footer]
         ======================================================================= -->
    <div
      id="pcWorkspaceColumn"
      class="order-1 lg:order-3 flex-1 min-w-0 flex flex-col justify-between bg-[#e8edf5] dark:bg-[#0d121d] relative overflow-hidden"
    >
      <!-- Re-open drawer pill when collapsed on desktop -->
      <button
        type="button"
        id="pcDeskExpandBtn"
        class="hidden group-data-[desk-drawer=closed]/pc:lg:inline-flex absolute left-3 top-3 z-20 items-center gap-1 h-8 px-2.5 rounded-xl bg-white dark:bg-[#1b2130] shadow-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-[11.5px] font-extrabold cursor-pointer hover:border-[#2563eb]"
      >
        <Icon name="lucide:panel-left" class="w-3.5 h-3.5" />
        <span data-i18n-bn="প্যানেল খুলুন" data-i18n-en="Open Panel">প্যানেল খুলুন</span>
      </button>

      <!-- 1. CENTERED FLOATING CONTEXTUAL TOOLBAR (Canva-Rich Formatting + TechHat Brand Colors) -->
      <div class="w-full pt-2 pb-1 px-2.5 flex items-center justify-center shrink-0 z-20">
        <div
          id="pcContextToolbar"
          class="inline-flex items-center gap-1.5 min-h-[42px] px-2.5 py-1 rounded-xl bg-white dark:bg-[#191f2c] shadow-md border border-slate-200/95 dark:border-white/12 max-w-full overflow-x-auto no-scrollbar"
        >
          <!-- Selected Element Badge -->
          <span
            id="pcSelectedElChip"
            class="inline-flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg bg-blue-500/10 text-[#1d4ed8] dark:text-sky-300 text-[11px] font-extrabold shrink-0"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-[#2563eb]"></span>
            <span id="pcSelectedElName">ক্যানভাস</span>
          </span>

          <!-- CONTEXT: RICH TEXT FORMATTING BAR (Font Drawer Trigger | Size | Color | B I U S aA | Align | Spacing | Effects) -->
          <div data-ctx-panel="text" hidden class="inline-flex items-center gap-1 shrink-0">
            <!-- Canva-Style Font Picker Button (Opens Left Font Drawer + Custom Font Upload!) -->
            <button
              type="button"
              id="pcCtxFontPickerBtn"
              class="inline-flex items-center justify-between gap-1.5 h-8 px-2.5 min-w-[126px] max-w-[168px] rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/90 dark:border-white/12 text-[11.5px] font-bold text-slate-800 dark:text-white cursor-pointer transition"
              title="ফন্ট পরিবর্তন বা নতুন ফন্ট আপলোড করতে ক্লিক করুন"
            >
              <span id="pcCtxFontLabel" class="truncate">Hind Siliguri</span>
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5 shrink-0 opacity-70" />
            </button>

            <!-- Hidden select mirror for legacy sync -->
            <select id="pcCtxFontSelect" hidden aria-hidden="true">
              {#each fontFamilies as ff}
                <option value={ff.id}>{ff.label}</option>
              {/each}
            </select>

            <!-- Editable Font Size Stepper [ - | 44 | + ] -->
            <div class="inline-flex items-center h-8 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200/90 dark:border-white/12 px-0.5">
              <button type="button" id="pcCtxFontDec" class="w-6.5 h-6.5 rounded hover:bg-white dark:hover:bg-white/10 text-[14px] font-black text-slate-700 dark:text-white cursor-pointer" title="ফন্ট ছোট করুন">−</button>
              <input
                type="number"
                id="pcCtxFontSizeInput"
                min="14"
                max="160"
                value="44"
                aria-label="Font size"
                class="w-10 text-center bg-transparent border-0 font-mono text-[11.5px] font-extrabold text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span id="pcCtxFontSizeLabel" hidden>44</span>
              <button type="button" id="pcCtxFontInc" class="w-6.5 h-6.5 rounded hover:bg-white dark:hover:bg-white/10 text-[14px] font-black text-slate-700 dark:text-white cursor-pointer" title="ফন্ট বড় করুন">+</button>
            </div>

            <!-- Text / Highlight Color ('A' with Color Bar) -->
            <label
              class="inline-flex flex-col items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer relative"
              title="লেখা বা হাইলাইট রঙ পরিবর্তন"
            >
              <span class="text-[12.5px] font-black text-slate-800 dark:text-white leading-none">A</span>
              <span id="pcCtxColorBar" class="w-4.5 h-1 rounded-full mt-0.5" style="background:#fde047;"></span>
              <input type="color" id="pcCtxTextColorInput" value="#fde047" class="sr-only" />
            </label>

            <!-- Sticker / Text Background Pill Color Tint -->
            <label
              id="pcCtxTextBgWrapper"
              class="inline-flex flex-col items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer relative"
              title="স্টিকারের ব্যাকগ্রাউন্ড রঙ পরিবর্তন করুন"
              hidden
            >
              <span class="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 leading-none">BG</span>
              <span id="pcCtxTextBgBar" class="w-4.5 h-1 rounded-full mt-0.5" style="background:#b91c1c;"></span>
              <input type="color" id="pcCtxTextBgColorInput" value="#b91c1c" class="sr-only" />
            </label>

            <!-- Style Toggles: Bold | Italic | Underline | Strike | Uppercase -->
            <div class="inline-flex items-center h-8 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200/90 dark:border-white/12 p-0.5 gap-0.5">
              <button type="button" id="pcCtxBoldBtn" aria-pressed="true" class="w-7 h-7 rounded text-[12px] font-black text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer transition" title="বোল্ড (Bold)">B</button>
              <button type="button" id="pcCtxItalicBtn" aria-pressed="false" class="w-7 h-7 rounded text-[12px] italic font-serif font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer transition" title="ইটালিক (Italic)">I</button>
              <button type="button" id="pcCtxUnderlineBtn" aria-pressed="false" class="w-7 h-7 rounded text-[12px] underline font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer transition" title="আন্ডারলাইন (Underline)">U</button>
              <button type="button" id="pcCtxStrikeBtn" aria-pressed="false" class="w-7 h-7 rounded text-[12px] line-through font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer transition" title="স্ট্রাইকথ্রু (Strikethrough)">S</button>
              <button type="button" id="pcCtxUpperBtn" aria-pressed="false" class="w-7.5 h-7 rounded text-[11px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 aria-pressed:bg-[#2563eb] aria-pressed:text-white cursor-pointer transition" title="বড় হাতের অক্ষর (Uppercase)">aA</button>
            </div>

            <!-- Alignment Buttons -->
            <div class="inline-flex items-center h-8 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200/90 dark:border-white/12 p-0.5 gap-0.5">
              <button type="button" data-ctx-align="left" class="w-6.5 h-6.5 rounded inline-flex items-center justify-center hover:bg-white dark:hover:bg-white/10 cursor-pointer" title="বাম অ্যালাইন"><Icon name="lucide:align-left" class="w-3.5 h-3.5" /></button>
              <button type="button" data-ctx-align="center" class="w-6.5 h-6.5 rounded inline-flex items-center justify-center hover:bg-white dark:hover:bg-white/10 cursor-pointer" title="মাঝে অ্যালাইন"><Icon name="lucide:align-center" class="w-3.5 h-3.5" /></button>
              <button type="button" data-ctx-align="right" class="w-6.5 h-6.5 rounded inline-flex items-center justify-center hover:bg-white dark:hover:bg-white/10 cursor-pointer" title="ডান অ্যালাইন"><Icon name="lucide:align-right" class="w-3.5 h-3.5" /></button>
            </div>

            <!-- Line Spacing Cycle & Text Shadow/Outline Effects Cycle -->
            <button
              type="button"
              id="pcCtxLineSpacingBtn"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/12 text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="লাইন স্পেসিং পরিবর্তন করুন (Line Spacing)"
            >
              <Icon name="lucide:arrow-up-down" class="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="pcCtxEffectBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/12 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="টেক্সট শ্যাডো / গ্লো / ব্যাকগ্রাউন্ড ইফেক্ট পরিবর্তন"
            >
              <span data-i18n-bn="ইফেক্ট" data-i18n-en="Effects">ইফেক্ট</span>
            </button>

            <button
              type="button"
              id="pcCtxInlineEditBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
            >
              <Icon name="lucide:pencil" class="w-3 h-3 [&_*]:!stroke-white" />
              <span data-i18n-bn="এডিট" data-i18n-en="Edit">এডিট</span>
            </button>

            <button
              type="button"
              id="pcCtxResetTextPosBtn"
              hidden
              class="inline-flex items-center gap-1 h-8 px-2 rounded-lg bg-slate-100 dark:bg-[#10141d] text-slate-700 dark:text-slate-200 text-[10.5px] font-bold cursor-pointer"
              title="পজিশন, সাইজ ও রোটেশন রিসেট করুন"
            >
              ↺
            </button>
          </div>

          <!-- CONTEXT: PHOTO TOOLS -->
          <div data-ctx-panel="photo" hidden class="inline-flex items-center gap-1.5 shrink-0">
            <label
              for="pcPhotoInput"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
            >
              <Icon name="lucide:camera" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="ছবি বদলান" data-i18n-en="Replace">ছবি বদলান</span>
            </label>

            <label
              id="pcQuickPhoto2Label"
              hidden
              for="pcSecondPhotoInput"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-sky-600 text-white text-[11px] font-extrabold cursor-pointer"
            >
              <Icon name="lucide:images" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="২য় ছবি" data-i18n-en="2nd Photo">২য় ছবি</span>
            </label>

            <div class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10">
              <span class="text-[10.5px] font-bold text-slate-500" data-i18n-bn="জুম" data-i18n-en="Zoom">জুম</span>
              <input type="range" id="pcCtxPhotoZoom" min="40" max="260" value="100" class="w-20 h-1.5 accent-[#2563eb] cursor-pointer" />
            </div>

            <span class="hidden sm:inline-flex items-center gap-1 px-2 h-8 rounded-lg bg-blue-500/8 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
              <Icon name="lucide:crop" class="w-3.5 h-3.5 text-[#2563eb]" />
              <span data-i18n-bn="কর্নার=সাইজ, পাশ=ক্রপ/মাস্ক" data-i18n-en="Corners=Resize, Sides=Mask">কর্নার=সাইজ, পাশ=ক্রপ/মাস্ক</span>
            </span>

            <button
              type="button"
              id="pcCtxResetPhotoBtn"
              class="inline-flex items-center h-8 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <span data-i18n-bn="↺ রিসেট" data-i18n-en="↺ Reset">↺ রিসেট</span>
            </button>
          </div>

          <!-- CONTEXT: SHAPE TOOLS -->
          <div data-ctx-panel="shape" hidden class="inline-flex items-center gap-1.5 shrink-0">
            <label class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
              <span data-i18n-bn="শেপ রঙ" data-i18n-en="Fill">শেপ রঙ</span>
              <input type="color" id="pcCtxShapeFillInput" value="#dc2626" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent" />
            </label>
            <label class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
              <span data-i18n-bn="বর্ডার" data-i18n-en="Border">বর্ডার</span>
              <input type="color" id="pcCtxShapeStrokeInput" value="#ffffff" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent" />
            </label>
            <button
              type="button"
              id="pcCtxShapeEditTextBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
              title="শেপ বা ব্যাজের ভেতরের লেখা এডিট করুন (Double-click or click Edit)"
            >
              <Icon name="lucide:pencil" class="w-3 h-3 [&_*]:!stroke-white" />
              <span data-i18n-bn="লেখা এডিট" data-i18n-en="Edit Text">লেখা এডিট</span>
            </button>
            <button
              type="button"
              id="pcCtxResetShapeBtn"
              class="inline-flex items-center h-8 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <span data-i18n-bn="↺ রিসেট" data-i18n-en="↺ Reset">↺ রিসেট</span>
            </button>
          </div>

          <!-- CONTEXT: LOGO TOOLS -->
          <div data-ctx-panel="logo" hidden class="inline-flex items-center gap-1.5 shrink-0">
            <label
              for="pcLogoInput"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer"
            >
              <Icon name="lucide:shield-plus" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="লোগো বদলান" data-i18n-en="Replace Logo">লোগো বদলান</span>
            </label>

            <select
              id="pcCtxLogoBgSelect"
              aria-label="লোগো পিল স্টাইল"
              class="h-8 px-2 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-800 dark:text-white cursor-pointer"
            >
              <option value="light">সাদা পিল</option>
              <option value="dark">ডার্ক পিল</option>
              <option value="none">স্বচ্ছ</option>
            </select>

            <div class="inline-flex items-center gap-1.5 h-8 px-2 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10">
              <span class="text-[10.5px] font-bold text-slate-500" data-i18n-bn="সাইজ" data-i18n-en="Size">সাইজ</span>
              <input type="range" id="pcCtxLogoSize" min="40" max="240" value="100" class="w-16 h-1.5 accent-[#2563eb] cursor-pointer" />
            </div>

            <button
              type="button"
              id="pcCtxResetLogoPosBtn"
              class="inline-flex items-center h-8 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <span data-i18n-bn="↺ কোণায় বসান" data-i18n-en="↺ Reset">↺ কোণায় বসান</span>
            </button>
          </div>

          <!-- CONTEXT: DEFAULT CARD TOOLS -->
          <div data-ctx-panel="card" class="inline-flex items-center gap-1.5 shrink-0">
            <div class="inline-flex items-center gap-1 px-1.5 h-8 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10">
              <label class="w-5 h-5 rounded-md overflow-hidden border border-black/15 cursor-pointer" title="প্রাইমারি রঙ">
                <input type="color" id="pcCtxPrimaryColor" value="#dc2626" class="w-7 h-7 -m-1 cursor-pointer border-0 p-0" />
              </label>
              <label class="w-5 h-5 rounded-md overflow-hidden border border-black/15 cursor-pointer" title="হাইলাইট রঙ">
                <input type="color" id="pcCtxAccentColor" value="#fde047" class="w-7 h-7 -m-1 cursor-pointer border-0 p-0" />
              </label>
              <label class="w-5 h-5 rounded-md overflow-hidden border border-black/15 cursor-pointer" title="ব্যাকগ্রাউন্ড রঙ">
                <input type="color" id="pcCtxBgColor" value="#1c080b" class="w-7 h-7 -m-1 cursor-pointer border-0 p-0" />
              </label>
            </div>

            <label
              for="pcPhotoInput"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11.5px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
            >
              <Icon name="lucide:camera" class="w-3.5 h-3.5" />
              <span data-i18n-bn="ছবি যুক্ত করুন" data-i18n-en="Add Photo">ছবি যুক্ত করুন</span>
            </label>

            <label
              for="pcLogoInput"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11.5px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
            >
              <Icon name="lucide:shield-plus" class="w-3.5 h-3.5" />
              <span data-i18n-bn="লোগো" data-i18n-en="Logo">লোগো</span>
            </label>

            <button
              type="button"
              id="pcQuickAddTextBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-blue-500/12 hover:bg-blue-500/20 text-[#1d4ed8] dark:text-sky-300 text-[11.5px] font-extrabold cursor-pointer transition"
            >
              <Icon name="lucide:plus" class="w-3.5 h-3.5" />
              <span data-i18n-bn="টেক্সট বক্স" data-i18n-en="Text Box">টেক্সট বক্স</span>
            </button>

            <button
              type="button"
              id="pcQuickOpenFontsBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11.5px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
            >
              <Icon name="lucide:type" class="w-3.5 h-3.5 text-[#2563eb]" />
              <span data-i18n-bn="ফন্ট" data-i18n-en="Fonts">ফন্ট</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 2. SCROLLABLE / ZOOMABLE ARTBOARD STAGE -->
      <div
        id="pcStageScrollArea"
        class="flex-1 min-h-[300px] sm:min-h-[380px] overflow-auto flex flex-col items-center justify-start px-3 sm:px-6 py-4 sm:py-6 relative overscroll-contain"
      >
        <div id="pcArtboardColumn" class="flex flex-col items-center gap-7 w-full max-w-full my-auto pb-8">
          <!-- Initial Page 1 Card Container -->
          <div class="pc-page-container w-full flex flex-col items-center" data-page-index="0" data-page-id="page_1">
            <!-- 1. Canva-Style Inline Header Bar -->
            <div class="pc-page-header w-full max-w-[620px] lg:max-w-[700px] flex items-center justify-between gap-2 pb-1.5 px-0.5 text-slate-500 dark:text-slate-400">
              <!-- Left: Page Number + Editable Title -->
              <div class="inline-flex items-center gap-1.5 min-w-0">
                <span class="pc-page-num-lbl text-[12px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                  পেজ ১
                </span>
                <span class="text-slate-400 dark:text-slate-500 text-[11px]">-</span>
                <input
                  type="text"
                  class="pc-page-title-input bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#2563eb] text-[12px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-1 py-0.5 outline-none rounded-none transition font-medium truncate max-w-[180px] sm:max-w-[280px]"
                  placeholder="পেজের শিরোনাম লিখুন"
                  value=""
                  data-page-index="0"
                  title="পেজের শিরোনাম এডিট করতে ক্লিক করুন"
                />
              </div>

              <!-- Right: Page Action Controls -->
              <div class="inline-flex items-center gap-0.5 shrink-0">
                <!-- Move Up -->
                <button
                  type="button"
                  class="pc-page-action-btn w-6.5 h-6.5 rounded-md hover:bg-black/8 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer transition text-slate-600 dark:text-slate-300 disabled:opacity-25 disabled:pointer-events-none"
                  title="পেজ উপরে নিন"
                  data-page-action="move-up"
                  data-page-index="0"
                  disabled
                >
                  <Icon name="lucide:chevron-up" class="w-3.5 h-3.5" />
                </button>

                <!-- Move Down -->
                <button
                  type="button"
                  class="pc-page-action-btn w-6.5 h-6.5 rounded-md hover:bg-black/8 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer transition text-slate-600 dark:text-slate-300 disabled:opacity-25 disabled:pointer-events-none"
                  title="পেজ নিচে নিন"
                  data-page-action="move-down"
                  data-page-index="0"
                  disabled
                >
                  <Icon name="lucide:chevron-down" class="w-3.5 h-3.5" />
                </button>

                <!-- Lock / Unlock -->
                <button
                  type="button"
                  class="pc-page-action-btn w-6.5 h-6.5 rounded-md hover:bg-black/8 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer transition text-slate-600 dark:text-slate-300"
                  title="পেজ লক / আনলক করুন"
                  data-page-action="lock"
                  data-page-index="0"
                  aria-pressed="false"
                >
                  <Icon name="lucide:lock-open" class="w-3.5 h-3.5" />
                </button>

                <!-- Duplicate Page -->
                <button
                  type="button"
                  class="pc-page-action-btn w-6.5 h-6.5 rounded-md hover:bg-black/8 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer transition text-slate-600 dark:text-slate-300"
                  title="পেজ ডুপ্লিকেট করুন"
                  data-page-action="duplicate"
                  data-page-index="0"
                >
                  <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                </button>

                <!-- Delete Page -->
                <button
                  type="button"
                  class="pc-page-action-btn w-6.5 h-6.5 rounded-md hover:bg-rose-500/15 text-rose-500 inline-flex items-center justify-center cursor-pointer transition disabled:opacity-20 disabled:pointer-events-none"
                  title="পেজ মুছে ফেলুন"
                  data-page-action="delete"
                  data-page-index="0"
                  disabled
                >
                  <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                </button>

                <!-- Add Page Below -->
                <button
                  type="button"
                  class="pc-page-action-btn w-6.5 h-6.5 rounded-md hover:bg-black/8 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer transition text-slate-600 dark:text-slate-300"
                  title="নিচে নতুন পেজ যোগ করুন"
                  data-page-action="add-after"
                  data-page-index="0"
                >
                  <Icon name="lucide:plus-square" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 2. Interactive Canvas Artboard Wrapper -->
            <div
              id="pcArtboardWrap"
              class="pc-artboard-wrap relative shadow-[0_14px_40px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.58)] bg-slate-900 transition-shadow rounded-sm ring-2 ring-[#2563eb]/60"
              data-page-index="0"
            >
              <canvas
                id="pcCanvas"
                width="1080"
                height="1080"
                class="pc-page-canvas block max-w-full max-h-[55dvh] sm:max-h-[65dvh] lg:max-h-[calc(100dvh-14.6rem)] w-auto h-auto touch-none cursor-default"
                data-page-index="0"
                style="transform-origin: center center;"
              ></canvas>

              <!-- Single Shared Interactive Overlay Group (Reparented to Active Page Artboard) -->
              <div id="pcInteractiveOverlayGroup" class="contents">
                <!-- Alignment Snap Guides -->
                <div id="pcSnapGuideV" hidden class="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[#2563eb] z-20"></div>
                <div id="pcSnapGuideH" hidden class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#2563eb] z-20"></div>

                <!-- Hover Bounding Box (#2563eb TechHat Royal Blue outline) -->
                <div
                  id="pcHoverBox"
                  hidden
                  class="pointer-events-none absolute border-[1.5px] border-[#3b82f6] rounded-xs z-10 transition-[left,top,width,height] duration-75"
                ></div>

                <!-- =============================================================
                     ACTIVE SELECTION BOX WITH FULL INTERACTIVE TRANSFORM HANDLES
                     4 Corner Scale Handles + 4 Side Crop/Mask/Width Handles + Rotate (↻) + Move (✥)
                     ============================================================= -->
                <div
                  id="pcSelectionBox"
                  hidden
                  class="pointer-events-none absolute border-2 border-[#2563eb] z-20"
                  style="transform-origin: center center;"
                >
                  <!-- 4 Interactive Corner Scale Handles -->
                  <button
                    type="button"
                    data-pc-handle="nw"
                    aria-label="Resize top-left"
                    title="কর্নার টেনে সাইজ বড়-ছোট করুন"
                    class="pointer-events-auto absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white border-2 border-[#2563eb] shadow-md hover:scale-125 hover:bg-[#2563eb] transition-transform cursor-nwse-resize touch-none p-0"
                  ></button>
                  <button
                    type="button"
                    data-pc-handle="ne"
                    aria-label="Resize top-right"
                    title="কর্নার টেনে সাইজ বড়-ছোট করুন"
                    class="pointer-events-auto absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-[#2563eb] shadow-md hover:scale-125 hover:bg-[#2563eb] transition-transform cursor-nesw-resize touch-none p-0"
                  ></button>
                  <button
                    type="button"
                    data-pc-handle="sw"
                    aria-label="Resize bottom-left"
                    title="কর্নার টেনে সাইজ বড়-ছোট করুন"
                    class="pointer-events-auto absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-white border-2 border-[#2563eb] shadow-md hover:scale-125 hover:bg-[#2563eb] transition-transform cursor-nesw-resize touch-none p-0"
                  ></button>
                  <button
                    type="button"
                    data-pc-handle="se"
                    aria-label="Resize bottom-right"
                    title="কর্নার টেনে সাইজ বড়-ছোট করুন"
                    class="pointer-events-auto absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-[#2563eb] shadow-md hover:scale-125 hover:bg-[#2563eb] transition-transform cursor-nwse-resize touch-none p-0"
                  ></button>

                  <!-- 4 Interactive Side Pill Handles (Canva Photo Crop/Mask & Text/Shape Width/Height!) -->
                  <button
                    type="button"
                    data-pc-handle="n"
                    aria-label="Crop or resize top"
                    title="উপরের প্রান্ত টেনে ছবি মাস্ক/ক্রপ বা উচ্চতা পরিবর্তন করুন"
                    class="pointer-events-auto absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full bg-white border-[1.5px] border-[#2563eb] shadow-sm hover:scale-110 hover:bg-[#2563eb] transition-transform cursor-ns-resize touch-none p-0"
                  ></button>
                  <button
                    type="button"
                    data-pc-handle="s"
                    aria-label="Crop or resize bottom"
                    title="নিচের প্রান্ত টেনে ছবি মাস্ক/ক্রপ বা উচ্চতা পরিবর্তন করুন"
                    class="pointer-events-auto absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full bg-white border-[1.5px] border-[#2563eb] shadow-sm hover:scale-110 hover:bg-[#2563eb] transition-transform cursor-ns-resize touch-none p-0"
                  ></button>
                  <button
                    type="button"
                    data-pc-handle="w"
                    aria-label="Crop or resize left"
                    title="বাম প্রান্ত টেনে প্রস্থ বা ছবি মাস্ক পরিবর্তন করুন"
                    class="pointer-events-auto absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-6 rounded-full bg-white border-[1.5px] border-[#2563eb] shadow-sm hover:scale-110 hover:bg-[#2563eb] transition-transform cursor-ew-resize touch-none p-0"
                  ></button>
                  <button
                    type="button"
                    data-pc-handle="e"
                    aria-label="Crop or resize right"
                    title="ডান প্রান্ত টেনে প্রস্থ বা ছবি মাস্ক পরিবর্তন করুন"
                    class="pointer-events-auto absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-6 rounded-full bg-white border-[1.5px] border-[#2563eb] shadow-sm hover:scale-110 hover:bg-[#2563eb] transition-transform cursor-ew-resize touch-none p-0"
                  ></button>

                  <!-- Live Transform Readout Pill (Shows Size / Crop / Angle while dragging handles) -->
                  <span
                    id="pcTransformReadout"
                    hidden
                    class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-950/90 text-white font-mono text-[10.5px] font-bold shadow-md whitespace-nowrap z-30"
                  >
                    100%
                  </span>

                  <!-- Floating White Mini Action Pill Above Selected Element -->
                  <div
                    id="pcSelectionToolbar"
                    class="pointer-events-auto absolute -top-10 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-white dark:bg-[#1e2433] text-slate-700 dark:text-slate-100 shadow-lg border border-slate-200 dark:border-white/15 whitespace-nowrap"
                  >
                    <button
                      type="button"
                      id="pcMiniEditBtn"
                      class="inline-flex items-center gap-1 px-2 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-300 cursor-pointer"
                      title="সরাসরি এডিট করুন"
                    >
                      <Icon name="lucide:pencil" class="w-3 h-3" />
                      <span data-i18n-bn="এডিট" data-i18n-en="Edit">এডিট</span>
                    </button>
                    <button
                      type="button"
                      id="pcMiniDupBtn"
                      class="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer"
                      title="ডুপ্লিকেট করুন"
                    >
                      <Icon name="lucide:copy" class="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      id="pcMiniLockBtn"
                      class="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer"
                      title="লক / আনলক"
                    >
                      <Icon name="lucide:lock" class="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      id="pcMiniDelBtn"
                      class="w-6 h-6 rounded-full hover:bg-rose-500/15 text-rose-600 inline-flex items-center justify-center cursor-pointer"
                      title="মুছে ফেলুন / রিসেট"
                    >
                      <Icon name="lucide:trash-2" class="w-3 h-3" />
                    </button>

                    <!-- Quick Color Tinting Indicators for Selected Badges / Text -->
                    <div id="pcMiniTintGroup" class="inline-flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-white/15" hidden>
                      <label
                        class="w-5.5 h-5.5 rounded-full border border-slate-300 dark:border-white/20 cursor-pointer inline-flex items-center justify-center relative overflow-hidden"
                        title="রঙ (BG Color)"
                      >
                        <span id="pcMiniBgIndicator" class="w-full h-full rounded-full" style="background:#dc2626;"></span>
                        <input type="color" id="pcMiniBgColorInput" class="sr-only" />
                      </label>
                      <label
                        class="w-5.5 h-5.5 rounded-full border border-slate-300 dark:border-white/20 cursor-pointer inline-flex items-center justify-center relative overflow-hidden"
                        title="টেক্সট রঙ (Text Color)"
                      >
                        <span id="pcMiniFgIndicator" class="w-full h-full rounded-full" style="background:#ffffff;"></span>
                        <input type="color" id="pcMiniFgColorInput" class="sr-only" />
                      </label>
                    </div>

                    <!-- Canva-style More (...) Button triggering Context Menu -->
                    <button
                      type="button"
                      id="pcMiniMoreBtn"
                      class="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer text-slate-700 dark:text-slate-100"
                      title="আরও অপশন (...)"
                      aria-label="আরও অপশন"
                    >
                      <Icon name="lucide:more-horizontal" class="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <!-- Bottom Pair of Canva Handles: Rotate (↻) + Move (✥) -->
                  <div class="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 inline-flex items-center gap-2">
                    <button
                      type="button"
                      id="pcRotateHandle"
                      aria-label="Rotate element"
                      title="ঘোরান / রোটেট করুন (Rotate)"
                      class="pointer-events-auto w-6.5 h-6.5 rounded-full bg-white dark:bg-[#1e2433] hover:bg-blue-50 text-slate-700 dark:text-white shadow-md border border-slate-300 dark:border-white/20 inline-flex items-center justify-center cursor-grab active:cursor-grabbing touch-none p-0"
                    >
                      <Icon name="lucide:rotate-cw" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id="pcMoveHandle"
                      aria-label="Move element"
                      title="টেনে স্থান পরিবর্তন করুন (Move)"
                      class="pointer-events-auto w-6.5 h-6.5 rounded-full bg-white dark:bg-[#1e2433] hover:bg-blue-50 text-slate-700 dark:text-white shadow-md border border-slate-300 dark:border-white/20 inline-flex items-center justify-center cursor-grab active:cursor-grabbing touch-none p-0"
                    >
                      <Icon name="lucide:move" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Direct On-Canvas Inline Textarea Editor -->
                <textarea
                  id="pcInlineEditor"
                  hidden
                  rows="2"
                  class="absolute z-30 p-2 rounded-lg bg-slate-950/92 text-white border-2 border-[#2563eb] shadow-2xl font-bold outline-none resize-none leading-snug"
                  placeholder="এখানে লিখুন..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- "+ Add page" Button Directly Below Artboard Stack -->
          <button
            type="button"
            id="pcAddPageBtn"
            class="mt-2 w-full max-w-[440px] h-10 px-5 rounded-xl bg-white dark:bg-[#191f2c] hover:bg-slate-50 dark:hover:bg-[#222a3b] border border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-100 text-[12.5px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow transition shrink-0"
          >
            <Icon name="lucide:plus" class="w-4 h-4 text-[#2563eb]" />
            <span data-i18n-bn="নতুন পেজ যোগ করুন (+ Add page)" data-i18n-en="+ Add page">নতুন পেজ যোগ করুন (+ Add page)</span>
          </button>

          <!-- Multi-Page Quick Thumbnail Switcher Strip -->
          <div
            id="pcPagesStrip"
            hidden
            class="mt-2 flex items-center gap-2 overflow-x-auto max-w-full py-1 px-1"
          ></div>
        </div>
      </div>

      <!-- 3. BOTTOM STATUS & ZOOM FOOTER BAR -->
      <footer
        class="h-9 px-3 bg-white dark:bg-[#121620] border-t border-slate-200/90 dark:border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300 shrink-0 z-20"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="inline-flex items-center gap-1 font-extrabold text-slate-800 dark:text-white shrink-0">
            <Icon name="lucide:layout-template" class="w-3.5 h-3.5 text-[#2563eb]" />
            <span id="pcActiveTplTitle">জরুরি রক্তের প্রয়োজন</span>
          </span>
          <span class="hidden sm:inline text-slate-300 dark:text-white/20">•</span>
          <span id="pcTemplateHintText" class="hidden sm:inline truncate text-slate-500 dark:text-slate-400">
            উপযোগী: মুমূর্ষু রোগীর জন্য জরুরি রক্তদাতা খুঁজতে
          </span>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <span id="pcCanvasDimBadge" class="hidden md:inline font-mono text-[10.5px] text-slate-400">1080 × 1080 px</span>

          <div class="inline-flex items-center gap-1.5">
            <input
              type="range"
              id="pcCanvasZoomSlider"
              min="50"
              max="150"
              value="100"
              aria-label="ক্যানভাস জুম"
              class="max-sm:hidden w-20 sm:w-24 h-1 accent-[#2563eb] cursor-pointer"
            />
            <button
              type="button"
              id="pcCanvasZoomFitBtn"
              class="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              title="১০০% ফিট ভিউতে ফিরুন"
            >
              <span id="pcCanvasZoomVal">100%</span>
            </button>
          </div>

          <button
            type="button"
            id="pcPagesCountBtn"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            title="সকল পেজ দেখুন / পরিবর্তন করুন"
          >
            <Icon name="lucide:files" class="w-3.5 h-3.5" />
            <span id="pcPagesCountLabel">পেজ ১ / ১</span>
          </button>

          <button
            type="button"
            id="pcFullscreenBtn"
            class="w-6.5 h-6.5 rounded hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center cursor-pointer"
            title="ফুলস্ক্রিন ভিউ"
            aria-label="ফুলস্ক্রিন"
          >
            <Icon name="lucide:maximize-2" class="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  </div>

  <!-- =========================================================================
       CANVAS CUSTOM RIGHT-CLICK CONTEXT MENU (R4)
       Canva-style sleek popover with keyboard shortcut tags & submenus
       ========================================================================= -->
  <div
    id="pcContextMenu"
    hidden
    class="fixed z-[9999] min-w-[220px] rounded-xl bg-white dark:bg-[#1a202c] shadow-[0_18px_50px_rgba(0,0,0,0.28)] border border-slate-200 dark:border-white/12 p-1.5 text-slate-700 dark:text-slate-200 text-[12px] font-semibold select-none animate-in fade-in zoom-in-95 duration-100"
    style="left: 0px; top: 0px;"
    role="menu"
    aria-orientation="vertical"
  >
    <!-- SECTION 1: Clipboard & Primary Element Operations -->
    <div class="space-y-0.5">
      <button
        type="button"
        id="pcCtxCopyBtn"
        class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
        role="menuitem"
      >
        <span class="inline-flex items-center gap-2">
          <Icon name="lucide:copy" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span data-i18n-bn="কপি" data-i18n-en="Copy">কপি</span>
        </span>
        <kbd class="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">Ctrl+C</kbd>
      </button>

      <button
        type="button"
        id="pcCtxPasteBtn"
        class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
        role="menuitem"
      >
        <span class="inline-flex items-center gap-2">
          <Icon name="lucide:clipboard-paste" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span data-i18n-bn="পেস্ট" data-i18n-en="Paste">পেস্ট</span>
        </span>
        <kbd class="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">Ctrl+V</kbd>
      </button>

      <button
        type="button"
        id="pcCtxCopyStyleBtn"
        class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
        role="menuitem"
      >
        <span class="inline-flex items-center gap-2">
          <Icon name="lucide:paintbrush" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span data-i18n-bn="স্টাইল কপি (Copy style)" data-i18n-en="Copy style">স্টাইল কপি (Copy style)</span>
        </span>
        <kbd class="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">Ctrl+Alt+C</kbd>
      </button>

      <button
        type="button"
        id="pcCtxPasteStyleBtn"
        class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
        role="menuitem"
      >
        <span class="inline-flex items-center gap-2">
          <Icon name="lucide:paint-bucket" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span data-i18n-bn="স্টাইল পেস্ট (Paste style)" data-i18n-en="Paste style">স্টাইল পেস্ট (Paste style)</span>
        </span>
        <kbd class="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">Ctrl+Alt+V</kbd>
      </button>

      <button
        type="button"
        id="pcCtxDupBtn"
        class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
        role="menuitem"
      >
        <span class="inline-flex items-center gap-2">
          <Icon name="lucide:copy-plus" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span data-i18n-bn="ডুপ্লিকেট" data-i18n-en="Duplicate">ডুপ্লিকেট</span>
        </span>
        <kbd class="font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">Ctrl+D</kbd>
      </button>

      <button
        type="button"
        id="pcCtxDelBtn"
        class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition cursor-pointer"
        role="menuitem"
      >
        <span class="inline-flex items-center gap-2">
          <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
          <span data-i18n-bn="মুছে ফেলুন" data-i18n-en="Delete">মুছে ফেলুন</span>
        </span>
        <kbd class="font-mono text-[10px] text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">DEL</kbd>
      </button>
    </div>

    <div class="h-px my-1 bg-slate-200/80 dark:bg-white/10"></div>

    <!-- SECTION 2: Layer & Alignment Submenus -->
    <div class="space-y-0.5">
      <!-- Layer Submenu Item -->
      <div class="relative group/layer">
        <button
          type="button"
          id="pcCtxLayerParentBtn"
          class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          aria-haspopup="true"
        >
          <span class="inline-flex items-center gap-2">
            <Icon name="lucide:layers" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="লেয়ার" data-i18n-en="Layer">লেয়ার</span>
          </span>
          <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <!-- Layer Flyout Menu -->
        <div
          id="pcCtxLayerSubmenu"
          class="hidden group-hover/layer:block hover:block absolute left-full top-0 ml-1 min-w-[190px] rounded-xl bg-white dark:bg-[#1a202c] shadow-[0_14px_40px_rgba(0,0,0,0.28)] border border-slate-200 dark:border-white/12 p-1.5 space-y-0.5 z-[10000]"
        >
          <button
            type="button"
            data-layer-action="front"
            class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <span class="inline-flex items-center gap-2">
              <Icon name="lucide:chevrons-up" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span data-i18n-bn="সবার উপরে আনুন" data-i18n-en="Bring to front">সবার উপরে আনুন</span>
            </span>
            <kbd class="font-mono text-[9.5px] text-slate-400 bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">Ctrl+]</kbd>
          </button>
          <button
            type="button"
            data-layer-action="forward"
            class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <span class="inline-flex items-center gap-2">
              <Icon name="lucide:chevron-up" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span data-i18n-bn="এক ধাপ উপরে" data-i18n-en="Bring forward">এক ধাপ উপরে</span>
            </span>
          </button>
          <button
            type="button"
            data-layer-action="backward"
            class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <span class="inline-flex items-center gap-2">
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span data-i18n-bn="এক ধাপ নিচে" data-i18n-en="Send backward">এক ধাপ নিচে</span>
            </span>
          </button>
          <button
            type="button"
            data-layer-action="back"
            class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <span class="inline-flex items-center gap-2">
              <Icon name="lucide:chevrons-down" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span data-i18n-bn="সবার নিচে নিন" data-i18n-en="Send to back">সবার নিচে নিন</span>
            </span>
            <kbd class="font-mono text-[9.5px] text-slate-400 bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">Ctrl+[</kbd>
          </button>
        </div>
      </div>

      <!-- Align to Page Submenu Item -->
      <div class="relative group/align">
        <button
          type="button"
          id="pcCtxAlignParentBtn"
          class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          aria-haspopup="true"
        >
          <span class="inline-flex items-center gap-2">
            <Icon name="lucide:layout-grid" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="পেজে সাজান" data-i18n-en="Align to page">পেজে সাজান</span>
          </span>
          <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <!-- Align Flyout Menu -->
        <div
          id="pcCtxAlignSubmenu"
          class="hidden group-hover/align:block hover:block absolute left-full top-0 ml-1 min-w-[170px] rounded-xl bg-white dark:bg-[#1a202c] shadow-[0_14px_40px_rgba(0,0,0,0.28)] border border-slate-200 dark:border-white/12 p-1.5 space-y-0.5 z-[10000]"
        >
          <button
            type="button"
            data-align-action="top"
            class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <Icon name="lucide:align-start-vertical" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="উপরে (Top)" data-i18n-en="Top">উপরে (Top)</span>
          </button>
          <button
            type="button"
            data-align-action="middle"
            class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <Icon name="lucide:align-center-vertical" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="মাঝামাঝি (Middle)" data-i18n-en="Middle">মাঝামাঝি (Middle)</span>
          </button>
          <button
            type="button"
            data-align-action="bottom"
            class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <Icon name="lucide:align-end-vertical" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="নিচে (Bottom)" data-i18n-en="Bottom">নিচে (Bottom)</span>
          </button>
          <div class="h-px my-1 bg-slate-200/80 dark:bg-white/10"></div>
          <button
            type="button"
            data-align-action="left"
            class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <Icon name="lucide:align-start-horizontal" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="বামে (Left)" data-i18n-en="Left">বামে (Left)</span>
          </button>
          <button
            type="button"
            data-align-action="center"
            class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <Icon name="lucide:align-center-horizontal" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="কেন্দ্রে (Center)" data-i18n-en="Center">কেন্দ্রে (Center)</span>
          </button>
          <button
            type="button"
            data-align-action="right"
            class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer text-left"
          >
            <Icon name="lucide:align-end-horizontal" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span data-i18n-bn="ডানে (Right)" data-i18n-en="Right">ডানে (Right)</span>
          </button>
        </div>
      </div>
    </div>

    <div class="h-px my-1 bg-slate-200/80 dark:bg-white/10"></div>

    <!-- SECTION 3: Lock / Unlock -->
    <button
      type="button"
      id="pcCtxLockBtn"
      class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
      role="menuitem"
    >
      <span class="inline-flex items-center gap-2">
        <Icon name="lucide:lock" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" id="pcCtxLockIcon" />
        <span id="pcCtxLockLabel" data-i18n-bn="লক করুন" data-i18n-en="Lock">লক করুন</span>
      </span>
    </button>
  </div>
</div>

<style>
  @font-face {
    font-family: 'Kalpurush';
    src: url('/fonts/Kalpurush.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'SolaimanLipi';
    src: url('/fonts/SolaimanLipi.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'Nikosh';
    src: local('Nikosh'), url('/fonts/Kalpurush.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'Siyam Rupali';
    src: url('/fonts/SiyamRupali.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'AdorshoLipi';
    src: url('/fonts/AdorshoLipi.ttf') format('truetype');
    font-display: swap;
  }
  @font-face {
    font-family: 'BenSen Handwriting';
    src: url('/fonts/BenSenHandwriting.ttf') format('truetype');
    font-display: swap;
  }

  #img-pane-photo-card[hidden] {
    display: none !important;
  }
  /* Lock outer html/body scroll & remove scrollbar gutter whenever full-screen Photo Card Studio is active */
  :global(html:has(#img-pane-photo-card:not([hidden]))),
  :global(body:has(#img-pane-photo-card:not([hidden]))) {
    overflow: hidden !important;
    scrollbar-gutter: auto !important;
  }
  @media (max-width: 1023.98px) {
    :global(body:has(#img-pane-photo-card:not([hidden])) #mobTabBar) {
      display: none !important;
    }
  }
</style>

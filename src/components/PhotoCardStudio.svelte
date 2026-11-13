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

  const elementsCategories = [
    { id: 'all', labelBn: 'সব', labelEn: 'All', icon: 'lucide:layout-grid' },
    { id: 'icons', labelBn: 'আইকন', labelEn: 'Icons', icon: 'lucide:phone-call' },
    { id: 'social', labelBn: 'সোশ্যাল লোগো', labelEn: 'Social', icon: 'lucide:globe' },
    { id: 'payment', labelBn: 'পেমেন্ট', labelEn: 'Payment', icon: 'lucide:wallet' },
    { id: 'shapes', labelBn: 'শেপ ও লাইন', labelEn: 'Shapes', icon: 'lucide:shapes' },
    { id: 'graphics', labelBn: 'গ্রাফিক্স', labelEn: 'Graphics', icon: 'lucide:sparkles' },
    { id: 'badges', labelBn: 'ব্যাজ স্টিকার', labelEn: 'Badges', icon: 'lucide:award' },
    { id: 'colors', labelBn: 'কালার থিম', labelEn: 'Colors', icon: 'lucide:palette' }
  ];

  const brandSections = [
    { id: 'all', labelBn: 'সব অ্যাসেট (All assets)', labelEn: 'All assets', icon: 'lucide:layers' },
    { id: 'logos', labelBn: 'লোগো (Logos)', labelEn: 'Logos', icon: 'lucide:shield-check' },
    { id: 'colors', labelBn: 'কালার প্যালেট (Colors)', labelEn: 'Colors', icon: 'lucide:palette' },
    { id: 'fonts', labelBn: 'ফন্ট (Fonts)', labelEn: 'Fonts', icon: 'lucide:type' },
    { id: 'info', labelBn: 'ব্র্যান্ড তথ্য (Brand info)', labelEn: 'Brand info', icon: 'lucide:building-2' },
    { id: 'graphics', labelBn: 'গ্রাফিক্স ও আইকন (Graphics)', labelEn: 'Graphics & Icons', icon: 'lucide:sparkles' }
  ];

  const uiIconItems = [
    { key: 'phone', labelBn: 'কল / হটলাইন', labelEn: 'Call / Phone', bg: '#16a34a', keywords: 'call phone hotline কল ফোন মোবাইল নাম্বার হটলাইন' },
    { key: 'location', labelBn: 'লোকেশন পিন', labelEn: 'Location', bg: '#dc2626', keywords: 'location map pin ঠিকানা স্থান ম্যাপ' },
    { key: 'globe', labelBn: 'ওয়েবসাইট', labelEn: 'Website', bg: '#2563eb', keywords: 'globe web internet ওয়েবসাইট ইন্টারনেট' },
    { key: 'mail', labelBn: 'ইমেইল / বার্তা', labelEn: 'Email / Mail', bg: '#0284c7', keywords: 'mail email message ইমেইল চিঠি মেসেজ' },
    { key: 'verified', labelBn: 'ভেরিফায়েড টিক', labelEn: 'Verified', bg: '#1d4ed8', keywords: 'verified check tick সত্য যাচাই ভেরিফায়েড' },
    { key: 'megaphone', labelBn: 'ঘোষণা মাইক', labelEn: 'Announcement', bg: '#e11d48', keywords: 'megaphone announce notice ঘোষণা বিজ্ঞপ্তি প্রচার' },
    { key: 'blood', labelBn: 'রক্তদান ড্রপ', labelEn: 'Blood Drop', bg: '#b91c1c', keywords: 'blood drop donor রক্ত রক্তদান ব্লাড' },
    { key: 'hospital', labelBn: 'হাসপাতাল / প্লাস', labelEn: 'Medical Plus', bg: '#059669', keywords: 'hospital medical clinic স্বাস্থ্য চিকিৎসা হাসপাতাল' },
    { key: 'heart', labelBn: 'মানবিক ভালোবাসা', labelEn: 'Charity Heart', bg: '#db2777', keywords: 'heart love charity মানবিক দান সেবা' },
    { key: 'gift', labelBn: 'উপহার / ঈদ গিফট', labelEn: 'Gift Box', bg: '#d97706', keywords: 'gift box eid upohar উপহার ঈদ ত্রাণ' },
    { key: 'mosque', labelBn: 'মসজিদ ডোম', labelEn: 'Mosque', bg: '#047857', keywords: 'mosque masjid islamic মসজিদ যাকাত জুমুআ' },
    { key: 'crescent', labelBn: 'চাঁদ ও তারা', labelEn: 'Crescent Moon', bg: '#0f766e', keywords: 'crescent moon eid ramadan চাঁদ রমজান ঈদ' },
    { key: 'mic', labelBn: 'পডকাস্ট মাইক', labelEn: 'Podcast Mic', bg: '#7c3aed', keywords: 'mic podcast audio মাইক পডকাস্ট কণ্ঠ' },
    { key: 'camera', labelBn: 'ফটো / ক্যামেরা', labelEn: 'Camera', bg: '#334155', keywords: 'camera photo media ক্যামেরা ছবি ফটো' },
    { key: 'play', labelBn: 'ভিডিও প্লে', labelEn: 'Video Play', bg: '#dc2626', keywords: 'play video live ভিডিও প্লে লাইভ' },
    { key: 'quote', labelBn: 'উদ্ধৃতি চিহ্ন', labelEn: 'Quote Mark', bg: '#b45309', keywords: 'quote speech উক্তি উদ্ধৃতি বক্তব্য' },
    { key: 'calendar', labelBn: 'তারিখ / ক্যালেন্ডার', labelEn: 'Calendar', bg: '#4f46e5', keywords: 'calendar date event তারিখ ক্যালেন্ডার সময়সূচি' },
    { key: 'clock', labelBn: 'সময় / ঘড়ি', labelEn: 'Clock / Time', bg: '#0369a1', keywords: 'clock time live ঘড়ি সময়' },
    { key: 'leaf', labelBn: 'বৃক্ষ / পরিবেশ', labelEn: 'Eco Leaf', bg: '#15803d', keywords: 'leaf tree green বৃক্ষ গাছ পরিবেশ' },
    { key: 'shield', labelBn: 'সুরক্ষা শিল্ড', labelEn: 'Shield', bg: '#1e40af', keywords: 'shield security safe সুরক্ষা ফ্যাক্টচেক' },
    { key: 'alert', labelBn: 'সতর্কতা সংকেত', labelEn: 'Warning', bg: '#c2410c', keywords: 'alert warning danger সতর্কতা বিপদ জরুরি' },
    { key: 'bolt', labelBn: 'ব্রেকিং বোল্ট', labelEn: 'Flash Bolt', bg: '#ca8a04', keywords: 'bolt flash breaking ব্রেকিং ফ্ল্যাশ বিদ্যুৎ' },
    { key: 'sparkle', labelBn: 'স্পার্কল স্টার', labelEn: 'Sparkle', bg: '#9333ea', keywords: 'sparkle star modern স্পার্কল তারা নতুন' },
    { key: 'users', labelBn: 'টিম / মানুষ', labelEn: 'Community', bg: '#0d9488', keywords: 'users people community volunteer স্বেচ্ছাসেবক মানুষ দল' }
  ];

  const socialLogoItems = [
    { key: 'facebook', nameBn: 'Facebook', nameEn: 'Facebook', color: '#1877F2', keywords: 'facebook fb ফেসবুক পেজ social' },
    { key: 'youtube', nameBn: 'YouTube', nameEn: 'YouTube', color: '#FF0000', keywords: 'youtube yt ইউটিউব চ্যানেল ভিডিও social' },
    { key: 'whatsapp', nameBn: 'WhatsApp', nameEn: 'WhatsApp', color: '#25D366', keywords: 'whatsapp wa হোয়াটসঅ্যাপ মেসেজ social' },
    { key: 'instagram', nameBn: 'Instagram', nameEn: 'Instagram', color: '#E4405F', keywords: 'instagram ig ইনস্টাগ্রাম রিলস social' },
    { key: 'x', nameBn: 'X (Twitter)', nameEn: 'X (Twitter)', color: '#0f172a', keywords: 'x twitter টুইটার এক্স social' },
    { key: 'tiktok', nameBn: 'TikTok', nameEn: 'TikTok', color: '#111827', keywords: 'tiktok টিকটক ভিডিও social' },
    { key: 'messenger', nameBn: 'Messenger', nameEn: 'Messenger', color: '#0084FF', keywords: 'messenger মেসেঞ্জার চ্যাট social' },
    { key: 'telegram', nameBn: 'Telegram', nameEn: 'Telegram', color: '#26A5E4', keywords: 'telegram টেলিগ্রাম চ্যানেল social' },
    { key: 'linkedin', nameBn: 'LinkedIn', nameEn: 'LinkedIn', color: '#0A66C2', keywords: 'linkedin লিংকডইন কর্পোরেট social' },
    { key: 'threads', nameBn: 'Threads', nameEn: 'Threads', color: '#18181b', keywords: 'threads থ্রেডস social' },
    { key: 'pinterest', nameBn: 'Pinterest', nameEn: 'Pinterest', color: '#E60023', keywords: 'pinterest পিন্টারেস্ট social' },
    { key: 'discord', nameBn: 'Discord', nameEn: 'Discord', color: '#5865F2', keywords: 'discord ডিসকর্ড কমিউনিটি social' },
    { key: 'globe', nameBn: 'Website', nameEn: 'Website', color: '#2563eb', keywords: 'website web ওয়েবসাইট পোর্টাল লিংক social' }
  ];

  const shapeElements = [
    { kind: 'rect', labelBn: 'সলিড বক্স', labelEn: 'Solid Box', fill: '#dc2626', stroke: '#ffffff', w: 380, h: 110, radius: 0, keywords: 'rect rectangle box বক্স ব্যানার শেপ' },
    { kind: 'rounded', labelBn: 'রাউন্ডেড বক্স', labelEn: 'Rounded Box', fill: '#dc2626', stroke: '#ffffff', w: 380, h: 110, radius: 20, keywords: 'rounded box রাউন্ডেড বক্স ব্যানার' },
    { kind: 'pill', labelBn: 'ক্যাপসুল পিল', labelEn: 'Capsule Pill', fill: '#2563eb', stroke: '#ffffff', w: 320, h: 84, radius: 999, keywords: 'pill capsule রাউন্ডেড পিল বাটন' },
    { kind: 'circle', labelBn: 'বৃত্তাকার ব্যাজ', labelEn: 'Circle', fill: '#f59e0b', stroke: '#ffffff', w: 180, h: 180, radius: 999, keywords: 'circle round বৃত্ত গোল ব্যাজ' },
    { kind: 'ring', labelBn: 'হলো রিং', labelEn: 'Hollow Ring', fill: '#38bdf8', stroke: '#38bdf8', w: 190, h: 190, radius: 999, keywords: 'ring circle frame রিং বর্ডার গোল' },
    { kind: 'glass', labelBn: 'গ্লাস কার্ড', labelEn: 'Glass Card', fill: 'rgba(15,23,42,0.74)', stroke: '#38bdf8', w: 420, h: 150, radius: 22, keywords: 'glass card blur গ্লাস কার্ড ফ্রেম' },
    { kind: 'outline', labelBn: 'বর্ডার ফ্রেম', labelEn: 'Outline Frame', fill: 'transparent', stroke: '#fde047', w: 380, h: 220, radius: 18, keywords: 'outline border frame বর্ডার ফ্রেম' },
    { kind: 'triangle', labelBn: 'ত্রিভুজ', labelEn: 'Triangle', fill: '#e11d48', stroke: '#ffffff', w: 190, h: 170, radius: 0, keywords: 'triangle ত্রিভুজ শেপ' },
    { kind: 'diamond', labelBn: 'ডায়মন্ড', labelEn: 'Diamond', fill: '#7c3aed', stroke: '#ffffff', w: 185, h: 185, radius: 0, keywords: 'diamond rhombus ডায়মন্ড বরফি' },
    { kind: 'pentagon', labelBn: 'পঞ্চভুজ', labelEn: 'Pentagon', fill: '#059669', stroke: '#ffffff', w: 185, h: 185, radius: 0, keywords: 'pentagon পঞ্চভুজ' },
    { kind: 'hexagon', labelBn: 'ষড়ভুজ', labelEn: 'Hexagon', fill: '#0284c7', stroke: '#ffffff', w: 190, h: 185, radius: 0, keywords: 'hexagon ষড়ভুজ হেক্সাগন' },
    { kind: 'octagon', labelBn: 'অষ্টভুজ', labelEn: 'Octagon', fill: '#b91c1c', stroke: '#fde047', w: 190, h: 190, radius: 0, keywords: 'octagon stop অষ্টভুজ' },
    { kind: 'star', labelBn: '৫-কোনা তারা', labelEn: '5-Point Star', fill: '#f59e0b', stroke: '#ffffff', w: 190, h: 190, radius: 0, keywords: 'star rating তারা স্টার' },
    { kind: 'starburst', labelBn: 'অফার স্টারবার্স্ট', labelEn: 'Starburst Seal', fill: '#dc2626', stroke: '#fde047', w: 210, h: 210, radius: 0, keywords: 'starburst seal badge অফার স্টিকার সিল' },
    { kind: 'shield', labelBn: 'শিল্ড ব্যাজ', labelEn: 'Shield Crest', fill: '#1e40af', stroke: '#fde047', w: 185, h: 210, radius: 0, keywords: 'shield crest শিল্ড ক্রেস্ট লোগো' },
    { kind: 'ribbon', labelBn: 'রিবন ব্যানার', labelEn: 'Ribbon Banner', fill: '#b91c1c', stroke: '#fde047', w: 400, h: 96, radius: 0, keywords: 'ribbon banner ফিতা রিবন ব্যানার' },
    { kind: 'speech', labelBn: 'স্পিচ বাবল', labelEn: 'Speech Bubble', fill: '#ffffff', stroke: '#2563eb', w: 320, h: 160, radius: 18, keywords: 'speech bubble quote স্পিচ কমেন্ট উক্তি' },
    { kind: 'arrow-right', labelBn: 'অ্যারো ব্যানার', labelEn: 'Arrow Pointer', fill: '#ea580c', stroke: '#ffffff', w: 300, h: 96, radius: 0, keywords: 'arrow right pointer তীর অ্যারো' },
    { kind: 'arch', labelBn: 'আর্চ উইন্ডো', labelEn: 'Arch Frame', fill: '#047857', stroke: '#fde047', w: 240, h: 290, radius: 0, keywords: 'arch dome window আর্চ মেহরাব ফ্রেম' },
    { kind: 'line', labelBn: 'সলিড লাইন', labelEn: 'Solid Line', fill: '#fde047', stroke: '#fde047', w: 420, h: 12, radius: 999, keywords: 'line divider সলিড লাইন ডিভাইডার' },
    { kind: 'dashed-line', labelBn: 'ড্যাশড লাইন', labelEn: 'Dashed Line', fill: '#38bdf8', stroke: '#38bdf8', w: 420, h: 8, radius: 0, keywords: 'dashed line divider ড্যাশড লাইন' }
  ];

  const graphicElementItems = [
    { kind: 'breaking-frame', labelBn: 'ব্রেকিং টিভি ফ্রেম', labelEn: 'Breaking Frame', fill: '#dc2626', accent: '#fde047', w: 360, h: 220, keywords: 'breaking tv frame ব্রেকিং টিভি বর্ডার' },
    { kind: 'corner-brackets', labelBn: 'কর্নার ব্র্যাকেট', labelEn: 'Corner Brackets', fill: '#fde047', accent: '#ffffff', w: 340, h: 240, keywords: 'corner bracket frame কোণা ফ্রেম' },
    { kind: 'live-banner', labelBn: 'LIVE ব্যানার পিল', labelEn: 'LIVE Broadcast Bar', fill: '#dc2626', accent: '#1e293b', w: 340, h: 74, keywords: 'live tv broadcast লাইভ ব্যানার' },
    { kind: 'quote-frame', labelBn: 'ডাবল কোট ফ্রেম', labelEn: 'Quote Box Frame', fill: '#f59e0b', accent: '#fde047', w: 340, h: 210, keywords: 'quote frame উক্তি ফ্রেম কোটেশন' },
    { kind: 'award-seal', labelBn: 'গোল্ডেন সিলমোহর', labelEn: 'Award Rosette Seal', fill: '#d97706', accent: '#fef08a', w: 200, h: 200, keywords: 'award seal rosette সম্মাননা সিলমোহর' },
    { kind: 'verified-stamp', labelBn: 'ভেরিফায়েড স্ট্যাম্প', labelEn: 'Verified Stamp', fill: '#16a34a', accent: '#bbf7d0', w: 190, h: 190, keywords: 'verified stamp check যাচাই স্ট্যাম্প' },
    { kind: 'islamic-arch', labelBn: 'ইসলামিক মেহরাব', labelEn: 'Islamic Arch Frame', fill: '#059669', accent: '#fbbf24', w: 280, h: 340, keywords: 'islamic arch mihrab ইসলামিক মেহরাব হাদিস' },
    { kind: 'paper-strip', labelBn: 'হাইলাইটার স্ট্রিপ', labelEn: 'Paper Highlight Strip', fill: '#fde047', accent: '#ca8a04', w: 360, h: 86, keywords: 'paper tape marker মার্কার স্ট্রিপ কাগজ' },
    { kind: 'dots-grid', labelBn: 'মডার্ন ডট গ্রিড', labelEn: 'Tech Dots Pattern', fill: '#38bdf8', accent: '#2563eb', w: 220, h: 160, keywords: 'dots grid pattern ডট গ্রিড প্যাটার্ন' },
    { kind: 'hazard-stripe', labelBn: 'অ্যালার্ট স্ট্রাইপ', labelEn: 'Alert Hazard Bar', fill: '#facc15', accent: '#0f172a', w: 420, h: 48, keywords: 'hazard alert stripe সতর্কতা স্ট্রাইপ' },
    { kind: 'curved-arrow', labelBn: 'কার্ভড অ্যারো', labelEn: 'Curved Pointer', fill: '#fbbf24', accent: '#ffffff', w: 220, h: 140, keywords: 'curved arrow pointer বাঁকা তীর' },
    { kind: 'glow-orb', labelBn: 'নিয়ন গ্লো স্পট', labelEn: 'Soft Glow Orb', fill: '#38bdf8', accent: '#818cf8', w: 280, h: 280, keywords: 'glow light gradient আলো গ্লো' }
  ];

  interface StickerElementItem {
    text: string;
    bg: string;
    fg: string;
    size: number;
    cat: 'news' | 'factcheck' | 'charity' | 'payment' | 'social';
    labelBn: string;
    labelEn: string;
    icon?: 'bolt' | 'live' | 'alert' | 'blood' | 'handheart' | 'chat' | 'check' | 'cross' | 'shield' | 'phone';
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
      class="order-3 lg:order-1 grid grid-cols-7 lg:flex lg:flex-col items-center gap-0.5 lg:gap-1 px-1 py-1.5 lg:py-2.5 lg:w-[74px] bg-[#0f172a] dark:bg-[#0b1120] text-slate-300 border-t lg:border-t-0 lg:border-r border-slate-800 shrink-0 z-30"
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
        data-pc-nav="position"
        aria-pressed="false"
        class="relative flex flex-col items-center justify-center gap-1 w-full py-1.5 lg:py-2.5 px-1 rounded-xl text-[10.5px] font-bold cursor-pointer transition hover:text-white hover:bg-white/8 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:shadow-xs"
      >
        <Icon name="lucide:layers" class="w-5 h-5" />
        <span data-i18n-bn="লেয়ার" data-i18n-en="Layers">লেয়ার</span>
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
             DRAWER 2: CANVA-STYLE ORGANIZED ELEMENTS HUB
             (Search + Category Chips + Icons, Social Logos, Payment, Shapes, Graphics, Badges, Colors)
             =============================================================== -->
        <div data-pc-drawer="elements" hidden class="space-y-3.5">
          <!-- 1. Canva Elements Search Bar -->
          <div class="relative flex items-center">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="pcElementsSearchInput"
              placeholder="আইকন, সোশ্যাল লোগো, বিকাশ/নগদ, শেপ বা গ্রাফিক্স খুঁজুন..."
              data-i18n-placeholder-bn="আইকন, সোশ্যাল লোগো, বিকাশ/নগদ, শেপ বা গ্রাফিক্স খুঁজুন..."
              data-i18n-placeholder-en="Search icons, social logos, shapes, graphics, badges..."
              class="w-full h-9.5 pl-9.5 pr-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-300/90 dark:border-white/15 text-[12px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#2563eb]"
            />
          </div>

          <!-- 2. Canva Category Chips -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5" id="pcElementsCatChips">
            {#each elementsCategories as elCat, idx}
              <button
                type="button"
                data-el-cat={elCat.id}
                aria-pressed={idx === 0 ? 'true' : 'false'}
                class="shrink-0 inline-flex items-center gap-1 h-7.5 px-2.5 rounded-full text-[11px] font-bold border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#0f131b] text-slate-600 dark:text-slate-300 hover:border-[#2563eb] aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:border-[#2563eb] cursor-pointer transition"
              >
                <Icon name={elCat.icon} class="w-3.5 h-3.5 shrink-0" />
                <span data-i18n-bn={elCat.labelBn} data-i18n-en={elCat.labelEn}>{elCat.labelBn}</span>
              </button>
            {/each}
          </div>

          <!-- Drill-down Back Header (Visible when a single category or search query is active) -->
          <div id="pcElementsDrillHeader" hidden class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <button
              type="button"
              id="pcElementsBackBtn"
              class="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1d4ed8] dark:text-sky-300 hover:underline cursor-pointer"
            >
              <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
              <span data-i18n-bn="সব এলিমেন্টে ফিরুন" data-i18n-en="Back to All">সব এলিমেন্টে ফিরুন</span>
            </button>
            <strong id="pcElementsDrillTitle" class="text-[11px] font-extrabold text-slate-800 dark:text-white truncate"></strong>
          </div>

          <!-- SHELF 1: UI & CONTACT ICONS (Call/Hotline Fixed + 24 Tintable Vector Icons) -->
          <div data-el-shelf="icons" class="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="আইকন কালেকশন (কল, লোকেশন, মাইক, হাসপাতাল)" data-i18n-en="Icons (Call, Location, Web, Medical)">আইকন কালেকশন (কল, লোকেশন, মাইক, হাসপাতাল)</strong>
              <button type="button" data-el-see-all="icons" class="text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0" data-i18n-bn="সব দেখুন (২৪)" data-i18n-en="See all (24)">সব দেখুন (২৪)</button>
            </div>
            <div class="grid grid-cols-4 gap-1.5" id="pcUiIconsGrid">
              {#each uiIconItems as ic, idx}
                <button
                  type="button"
                  data-el-item="1"
                  data-el-overflow={idx >= 8 ? '1' : '0'}
                  data-el-keywords="{ic.key} {ic.labelBn} {ic.labelEn} {ic.keywords}"
                  hidden={idx >= 8}
                  data-add-ui-icon={ic.key}
                  data-bg={ic.bg}
                  data-fill="#ffffff"
                  class="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white dark:bg-[#171c26] hover:bg-blue-50/70 dark:hover:bg-white/8 border border-slate-200/90 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition group"
                  title="{ic.labelBn} ({ic.labelEn})"
                >
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-2xs group-hover:scale-108 transition" style="background:{ic.bg};">
                    {#if ic.key === 'phone'}
                      <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z"/></svg>
                    {:else if ic.key === 'location'}
                      <Icon name="lucide:map-pin" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'globe'}
                      <Icon name="lucide:globe" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'mail'}
                      <Icon name="lucide:mail" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'verified'}
                      <Icon name="lucide:badge-check" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'megaphone'}
                      <Icon name="lucide:megaphone" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'blood'}
                      <Icon name="lucide:droplet" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'hospital'}
                      <Icon name="lucide:plus" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'heart'}
                      <Icon name="lucide:heart" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'gift'}
                      <Icon name="lucide:gift" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'mosque'}
                      <Icon name="lucide:landmark" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'crescent'}
                      <Icon name="lucide:moon-star" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'mic'}
                      <Icon name="lucide:mic" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'camera'}
                      <Icon name="lucide:camera" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'play'}
                      <Icon name="lucide:play" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'quote'}
                      <Icon name="lucide:quote" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'calendar'}
                      <Icon name="lucide:calendar" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'clock'}
                      <Icon name="lucide:clock" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'leaf'}
                      <Icon name="lucide:leaf" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'shield'}
                      <Icon name="lucide:shield-check" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'alert'}
                      <Icon name="lucide:triangle-alert" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'bolt'}
                      <Icon name="lucide:zap" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else if ic.key === 'sparkle'}
                      <Icon name="lucide:sparkles" class="w-4 h-4 [&_*]:!stroke-white" />
                    {:else}
                      <Icon name="lucide:users" class="w-4 h-4 [&_*]:!stroke-white" />
                    {/if}
                  </span>
                  <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full" data-i18n-bn={ic.labelBn} data-i18n-en={ic.labelEn}>{ic.labelBn}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- SHELF 2: ALL SOCIAL MEDIA LOGOS (13 Authentic Vectors + Editable @Handle Pills) -->
          <div data-el-shelf="social" class="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="অল সোশ্যাল লোগো (All Social Logos)" data-i18n-en="All Social Logos">অল সোশ্যাল লোগো (All Social Logos)</strong>
              <button type="button" data-el-see-all="social" class="text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0" data-i18n-bn="সব দেখুন (১৩+)" data-i18n-en="See all (13+)">সব দেখুন (১৩+)</button>
            </div>
            <div class="grid grid-cols-4 gap-1.5" id="pcSocialLogosGrid">
              {#each socialLogoItems as soc, idx}
                <button
                  type="button"
                  data-el-item="1"
                  data-el-overflow={idx >= 8 ? '1' : '0'}
                  data-el-keywords="{soc.key} {soc.nameBn} {soc.nameEn} {soc.keywords}"
                  hidden={idx >= 8}
                  data-add-social={soc.key}
                  class="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white dark:bg-[#171c26] hover:bg-blue-50/70 dark:hover:bg-white/8 border border-slate-200/90 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition group"
                  title="{soc.nameEn} লোগো যুক্ত করুন"
                >
                  <span
                    class="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs group-hover:scale-108 transition"
                    style={soc.key === 'instagram'
                      ? 'background:radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);'
                      : 'background:' + soc.color + ';'}
                  >
                    <svg viewBox="0 0 64 64" class="w-6 h-6" aria-hidden="true">
                      {#if soc.key === 'facebook'}
                        <path fill="#ffffff" d="M 36.5 34.5 L 37.8 26.2 L 29.8 26.2 L 29.8 20.8 C 29.8 18.5 30.9 16.3 34.5 16.3 L 38.2 16.3 L 38.2 9.2 C 38.2 9.2 34.9 8.6 31.7 8.6 C 25.1 8.6 20.8 12.6 20.8 19.9 L 20.8 26.2 L 13.5 26.2 L 13.5 34.5 L 20.8 34.5 L 20.8 54.0 L 29.8 54.0 L 29.8 34.5 L 36.5 34.5 Z"/>
                      {:else if soc.key === 'youtube'}
                        <path fill="#ffffff" d="M 25.0 21.0 L 43.0 32.0 L 25.0 43.0 L 25.0 21.0 Z"/>
                      {:else if soc.key === 'whatsapp'}
                        <path fill="#ffffff" d="M 32.0 13.0 C 21.5 13.0 13.0 21.3 13.0 31.6 C 13.0 35.1 14.0 38.4 15.8 41.3 L 13.2 50.8 L 23.0 48.2 C 25.7 49.6 28.8 50.4 32.0 50.4 C 42.5 50.4 51.0 42.0 51.0 31.7 C 51.0 21.3 42.5 13.0 32.0 13.0 Z M 41.8 38.9 C 41.3 40.2 39.2 41.4 37.9 41.6 C 36.8 41.8 35.4 41.9 31.2 40.2 C 25.5 37.9 21.9 32.1 21.6 31.7 C 21.3 31.3 19.3 28.7 19.3 26.0 C 19.3 23.3 20.7 22.0 21.3 21.4 L 24.1 20.7 C 24.5 20.7 25.0 20.6 25.4 21.7 C 25.9 22.9 27.0 25.6 27.1 25.9 C 27.4 26.6 26.3 28.3 25.6 30.3 C 26.1 31.1 27.6 33.6 30.0 35.7 C 33.1 38.4 35.6 39.2 36.4 39.6 C 37.7 39.9 39.9 37.3 40.4 36.6 C 41.4 36.0 45.3 37.8 45.9 38.1 C 46.8 38.5 46.6 40.3 41.8 38.9 Z"/>
                      {:else if soc.key === 'instagram'}
                        <path fill="#ffffff" d="M 22.0 13.0 L 42.0 13.0 C 47.0 13.0 51.0 17.0 51.0 22.0 L 51.0 42.0 C 51.0 47.0 47.0 51.0 42.0 51.0 L 22.0 51.0 C 17.0 51.0 13.0 47.0 13.0 42.0 L 13.0 22.0 C 13.0 17.0 17.0 13.0 22.0 13.0 Z M 22.2 16.8 C 19.2 16.8 16.8 19.2 16.8 22.2 L 16.8 41.8 C 16.8 44.8 19.2 47.2 22.2 47.2 L 41.8 47.2 C 44.8 47.2 47.2 44.8 47.2 41.8 L 47.2 22.2 C 47.2 19.2 44.8 16.8 41.8 16.8 L 22.2 16.8 Z M 32.0 22.2 C 37.4 22.2 41.8 26.6 41.8 32.0 C 41.8 37.4 37.4 41.8 32.0 41.8 C 26.6 41.8 22.2 37.4 22.2 32.0 C 22.2 26.6 26.6 22.2 32.0 22.2 Z M 32.0 26.0 C 28.7 26.0 26.0 28.7 26.0 32.0 C 26.0 35.3 28.7 38.0 32.0 38.0 C 35.3 38.0 38.0 35.3 38.0 32.0 C 38.0 28.7 35.3 26.0 32.0 26.0 Z M 42.2 19.5 C 43.5 19.5 44.5 20.5 44.5 21.8 C 44.5 23.1 43.5 24.1 42.2 24.1 C 40.9 24.1 39.9 23.1 39.9 21.8 C 39.9 20.5 40.9 19.5 42.2 19.5 Z"/>
                      {:else if soc.key === 'x'}
                        <path fill="#ffffff" d="M 36.1 28.6 L 49.4 13.5 L 46.2 13.5 L 34.7 26.6 L 25.5 13.5 L 14.8 13.5 L 28.8 33.5 L 14.8 49.5 L 18.0 49.5 L 30.1 35.6 L 39.8 49.5 L 50.5 49.5 L 36.1 28.6 Z"/>
                      {:else if soc.key === 'tiktok'}
                        <path fill="#25F4EE" d="M 39.5 13.5 L 33.2 13.5 L 33.2 37.2 C 33.2 40.3 30.7 42.8 27.6 42.8 C 24.5 42.8 22.0 40.3 22.0 37.2 C 22.0 34.2 24.4 31.7 27.4 31.6 L 27.4 25.2 C 20.8 25.3 15.5 30.6 15.5 37.2 C 15.5 43.9 20.9 49.3 27.6 49.3 C 34.3 49.3 39.7 43.9 39.7 37.2 L 39.7 24.5 C 42.2 26.3 45.2 27.4 48.5 27.5 L 48.5 21.2 C 43.7 20.9 39.8 17.6 39.5 13.5 Z"/>
                        <path fill="#FE2C55" d="M 41.2 15.0 L 35.0 15.0 L 35.0 38.6 C 35.0 41.7 32.5 44.2 29.4 44.2 C 26.3 44.2 23.8 41.7 23.8 38.6 L 17.5 38.6 C 17.5 45.2 22.8 50.6 29.4 50.6 C 36.1 50.6 41.5 45.2 41.5 38.6 L 41.5 25.9 C 44.0 27.7 47.0 28.8 50.2 28.9 L 50.2 22.6 C 45.4 22.3 41.5 19.0 41.2 15.0 Z"/>
                        <path fill="#ffffff" d="M 40.2 14.2 L 34.1 14.2 L 34.1 37.9 C 34.1 41.0 31.6 43.5 28.5 43.5 C 25.4 43.5 22.9 41.0 22.9 37.9 C 22.9 34.9 25.3 32.4 28.3 32.3 L 28.3 26.1 C 21.8 26.2 16.5 31.4 16.5 37.9 C 16.5 44.5 21.9 49.9 28.5 49.9 C 35.1 49.9 40.5 44.5 40.5 37.9 L 40.5 25.2 C 43.0 27.0 46.0 28.1 49.3 28.2 L 49.3 21.9 C 44.5 21.6 40.6 18.3 40.2 14.2 Z"/>
                      {:else if soc.key === 'messenger'}
                        <path fill="#ffffff" d="M 32.0 13.0 C 21.0 13.0 12.5 20.8 12.5 31.0 C 12.5 36.5 15.2 41.3 19.5 44.5 L 19.5 51.5 L 26.1 47.9 C 28.0 48.4 30.0 48.7 32.0 48.7 C 43.0 48.7 51.5 40.9 51.5 30.7 C 51.5 20.8 43.0 13.0 32.0 13.0 Z M 34.1 36.9 L 29.0 31.5 L 19.2 36.9 L 30.0 25.4 L 35.2 30.8 L 44.8 25.4 L 34.1 36.9 Z"/>
                      {:else if soc.key === 'telegram'}
                        <path fill="#ffffff" d="M 47.2 18.2 L 41.2 46.4 C 40.7 48.4 39.5 48.9 37.8 48.0 L 28.4 41.1 L 23.9 45.4 C 23.4 45.9 23.0 46.3 22.0 46.3 L 22.7 36.7 L 40.1 21.0 C 40.9 20.3 39.9 19.9 38.9 20.6 L 17.4 34.1 L 8.1 31.2 C 6.1 30.6 6.1 29.2 8.5 28.2 L 44.7 14.3 C 46.4 13.7 47.8 14.7 47.2 18.2 Z"/>
                      {:else if soc.key === 'linkedin'}
                        <path fill="#ffffff" d="M 16.5 25.5 L 22.8 25.5 L 22.8 47.5 L 16.5 47.5 L 16.5 25.5 Z M 19.6 15.5 C 21.7 15.5 23.3 17.2 23.3 19.2 C 23.3 21.2 21.7 22.9 19.6 22.9 C 17.6 22.9 16.0 21.2 16.0 19.2 C 16.0 17.2 17.6 15.5 19.6 15.5 Z M 27.0 25.5 L 33.0 25.5 L 33.0 28.5 C 34.0 26.7 36.2 25.0 39.6 25.0 C 46.0 25.0 47.5 29.2 47.5 34.8 L 47.5 47.5 L 41.2 47.5 L 41.2 36.2 C 41.2 33.5 40.7 30.2 37.5 30.2 C 34.2 30.2 33.3 32.8 33.3 36.0 L 33.3 47.5 L 27.0 47.5 L 27.0 25.5 Z"/>
                      {:else if soc.key === 'threads'}
                        <path fill="#ffffff" d="M 32.6 13.0 C 42.8 13.0 49.5 19.8 49.8 29.8 C 50.1 39.2 44.5 45.2 36.5 45.2 C 32.2 45.2 29.0 43.2 27.8 40.2 C 26.2 42.5 23.6 43.8 20.6 43.4 C 16.2 42.8 13.5 39.4 13.8 35.2 C 14.2 30.4 18.6 27.6 25.4 27.8 L 28.2 27.9 C 28.0 24.4 26.0 22.6 22.6 22.6 C 20.2 22.6 18.2 23.6 16.8 25.2 L 13.8 22.4 C 16.0 19.8 19.2 18.4 23.2 18.4 C 29.2 18.4 32.6 21.8 32.6 28.4 L 32.6 34.8 C 32.6 38.6 34.2 40.8 37.0 40.8 C 41.8 40.8 45.2 36.6 45.0 29.8 C 44.8 22.2 39.8 17.4 32.2 17.4 C 23.8 17.4 18.2 22.8 18.2 31.8 C 18.2 41.2 24.0 46.8 33.2 46.8 C 36.8 46.8 40.0 45.8 42.8 43.8 L 45.2 47.4 C 41.6 49.8 37.6 51.0 33.0 51.0 C 21.2 51.0 13.6 43.4 13.6 31.8 C 13.6 20.4 21.2 13.0 32.6 13.0 Z"/>
                      {:else if soc.key === 'pinterest'}
                        <path fill="#ffffff" d="M 32.4 13.5 C 21.8 13.5 15.5 20.6 15.5 28.8 C 15.5 32.6 17.5 36.0 20.6 37.3 L 22.4 33.5 C 21.0 31.0 20.3 29.3 20.3 27.2 C 20.3 21.6 24.5 17.4 31.6 17.4 C 37.6 17.4 41.6 21.1 41.6 26.6 C 41.6 33.0 38.5 37.8 34.4 37.8 C 32.2 37.8 30.5 36.0 31.0 33.8 L 32.8 26.5 C 33.3 24.4 32.0 22.6 29.8 22.6 C 27.2 22.6 25.1 25.3 25.1 28.8 C 25.1 31.0 25.9 32.5 25.9 32.5 L 22.6 46.4 L 26.8 52.0 L 30.8 38.0 C 32.0 40.0 34.8 41.5 37.8 41.5 C 45.2 41.5 50.2 34.8 50.2 26.4 C 50.2 18.8 43.6 13.5 32.4 13.5 Z"/>
                      {:else if soc.key === 'discord'}
                        <path fill="#ffffff" d="M 44.6 19.6 C 42.1 18.4 39.4 17.6 36.6 17.1 L 35.5 19.4 C 33.2 19.1 30.8 19.1 28.5 19.4 L 27.4 17.1 C 24.6 17.6 21.9 18.4 19.4 19.6 C 14.3 27.2 12.9 34.6 13.6 41.9 C 17.0 44.4 20.3 45.9 23.5 46.9 L 25.6 43.5 L 23.0 41.0 C 28.8 43.7 35.2 43.7 41.0 41.0 L 38.4 43.5 L 40.5 46.9 C 43.7 45.9 47.0 44.4 50.4 41.9 C 51.2 33.4 49.0 26.1 44.6 19.6 Z M 25.8 36.8 C 23.8 36.8 22.2 35.0 22.2 32.8 C 22.2 30.6 23.8 28.8 25.8 28.8 C 27.8 28.8 29.4 30.6 29.4 32.8 C 29.4 35.0 27.8 36.8 25.8 36.8 Z M 38.2 36.8 C 36.2 36.8 34.6 35.0 34.6 32.8 C 34.6 30.6 36.2 28.8 38.2 28.8 C 40.2 28.8 41.8 30.6 41.8 32.8 C 41.8 35.0 40.2 36.8 38.2 36.8 Z"/>
                      {:else}
                        <path fill="#ffffff" d="M 32.0 13.0 C 21.5 13.0 13.0 21.5 13.0 32.0 C 13.0 42.5 21.5 51.0 32.0 51.0 C 42.5 51.0 51.0 42.5 51.0 32.0 C 51.0 21.5 42.5 13.0 32.0 13.0 Z M 32.0 16.9 C 34.3 20.0 35.8 24.0 36.3 28.5 L 27.7 28.5 C 28.2 24.0 29.7 20.0 32.0 16.9 Z M 32.0 47.1 C 29.7 44.0 28.2 40.0 27.7 35.5 L 36.3 35.5 C 35.8 40.0 34.3 44.0 32.0 47.1 Z"/>
                      {/if}
                    </svg>
                  </span>
                  <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">{soc.nameEn}</span>
                </button>
              {/each}
            </div>

            <!-- Social @Handle Pill Presets (Visible in Social drill-down or search) -->
            <div class="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="1"
                data-el-keywords="facebook handle page pill ফেসবুক পেজ হ্যান্ডেল"
                hidden
                data-add-social="facebook"
                data-with-handle="1"
                class="h-8 px-2.5 rounded-full bg-[#1877F2]/12 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[10.5px] font-extrabold text-[#1877F2] dark:text-sky-300 inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <span class="font-black">f</span>
                <span>fb.com/page পিল</span>
              </button>
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="1"
                data-el-keywords="youtube channel subscribe pill ইউটিউব চ্যানেল হ্যান্ডেল"
                hidden
                data-add-social="youtube"
                data-with-handle="1"
                class="h-8 px-2.5 rounded-full bg-red-500/12 hover:bg-red-500/20 border border-red-500/30 text-[10.5px] font-extrabold text-red-600 dark:text-red-400 inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <span>▶</span>
                <span>@youtube চ্যানেল</span>
              </button>
            </div>
          </div>

          <!-- SHELF 3: NATIVE SVG PAYMENT & BANKING VECTORS (bKash, Fixed Nagad, Fixed Rocket, Upay, Bank, Card) -->
          <div data-el-shelf="payment" class="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="পেমেন্ট ও ব্যাংকিং ভেক্টর (SVG)" data-i18n-en="Payment & Banking Vectors (SVG)">পেমেন্ট ও ব্যাংকিং ভেক্টর (SVG)</strong>
              <button type="button" data-el-see-all="payment" class="text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0" data-i18n-bn="সব দেখুন (৬)" data-i18n-en="See all (6)">সব দেখুন (৬)</button>
            </div>

            <div class="grid grid-cols-3 gap-1.5" id="pcPaymentVectorsGrid">
              <!-- 1. bKash Authentic Vector -->
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="0"
                data-el-keywords="bkash বিকাশ payment পেমেন্ট mobile banking"
                data-add-vector="bkash"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#e2136e] bg-white dark:bg-[#171c26] hover:bg-pink-500/5 transition cursor-pointer group"
                title="bKash (বিকাশ) ভেক্টর লোগো যুক্ত করুন"
              >
                <span class="w-8.5 h-8.5 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center p-1 group-hover:scale-108 transition">
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
                <span class="mt-1 text-[10px] font-extrabold text-[#e2136e]">bKash বিকাশ</span>
              </button>

              <!-- 2. Nagad Fixed Crisp Vector -->
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="0"
                data-el-keywords="nagad নগদ payment পেমেন্ট mobile banking"
                data-add-vector="nagad"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#f16522] bg-white dark:bg-[#171c26] hover:bg-orange-500/5 transition cursor-pointer group"
                title="Nagad (নগদ) ভেক্টর লোগো যুক্ত করুন"
              >
                <span class="w-8.5 h-8.5 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center p-1 group-hover:scale-108 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" class="w-6 h-6">
                    <path fill="#f7941d" d="M 16.5 11.2 C 8.2 15.6 4.0 25.4 6.2 35.0 C 8.5 45.2 17.6 52.0 27.8 51.8 C 38.4 51.6 47.2 44.0 48.6 33.4 C 49.7 24.6 45.4 15.8 37.6 11.4 C 42.6 16.8 44.6 24.6 43.0 32.0 C 41.0 40.8 33.4 46.8 24.6 46.2 C 15.8 45.6 9.4 38.4 9.6 29.4 C 9.8 21.8 12.6 15.6 16.5 11.2 Z"/>
                    <path fill="#f15a22" d="M 12.2 23.0 C 10.4 31.4 14.8 40.2 23.0 43.0 C 31.4 45.8 40.4 41.2 43.2 32.8 C 44.8 28.0 44.2 22.6 41.6 18.2 C 42.4 23.2 41.0 28.6 37.6 32.6 C 32.6 38.4 23.8 39.4 17.6 34.8 C 13.8 32.0 11.8 27.6 12.2 23.0 Z"/>
                    <path fill="#fbb03b" d="M 21.2 16.8 C 18.6 13.6 18.2 8.8 20.8 4.4 C 21.4 7.6 23.2 10.2 24.6 12.8 C 25.4 14.4 25.0 16.4 23.4 17.4 C 22.6 17.8 21.8 17.5 21.2 16.8 Z"/>
                    <path fill="#ed1c24" d="M 26.2 15.6 C 24.4 11.2 25.2 5.4 28.6 1.2 C 29.0 5.2 31.4 8.6 32.0 12.4 C 32.4 14.8 30.8 16.8 28.6 17.0 C 27.4 17.1 26.6 16.5 26.2 15.6 Z"/>
                    <path fill="#f15a22" d="M 32.4 17.6 C 32.2 14.0 33.8 9.8 37.2 6.8 C 36.8 10.2 37.8 13.4 37.0 16.4 C 36.4 18.2 34.6 19.0 33.2 18.4 C 32.7 18.2 32.5 17.9 32.4 17.6 Z"/>
                    <path fill="#ed1c24" d="M 27.0 18.0 C 29.1 18.0 30.8 19.7 30.8 21.8 C 30.8 23.9 29.1 25.6 27.0 25.6 C 24.9 25.6 23.2 23.9 23.2 21.8 C 23.2 19.7 24.9 18.0 27.0 18.0 Z M 14.6 22.2 C 18.6 25.6 22.8 27.8 27.0 27.8 C 31.2 27.8 35.4 25.6 39.4 22.2 C 40.4 21.4 41.4 22.6 40.4 23.8 C 36.8 27.8 32.8 30.4 30.2 32.4 C 29.4 36.6 28.6 40.8 27.0 44.2 C 25.4 40.8 24.6 36.6 23.8 32.4 C 21.2 30.4 17.2 27.8 13.6 23.8 C 12.6 22.6 13.6 21.4 14.6 22.2 Z"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10px] font-extrabold text-[#f16522]">Nagad নগদ</span>
              </button>

              <!-- 3. Rocket Fixed Crisp DBBL Emblem -->
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="0"
                data-el-keywords="rocket রকেট dbbl dutch bangla payment পেমেন্ট"
                data-add-vector="rocket"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#8c3494] bg-white dark:bg-[#171c26] hover:bg-purple-500/5 transition cursor-pointer group"
                title="Rocket (রকেট) ভেক্টর লোগো যুক্ত করুন"
              >
                <span class="w-8.5 h-8.5 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center p-1 group-hover:scale-108 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="46 6 116 114" class="w-6 h-6">
                    <path fill="#8c3494" d="M 74.0 11.0 L 134.0 11.0 C 147.2 11.0 156.0 19.8 156.0 33.0 L 156.0 93.0 C 156.0 106.2 147.2 115.0 134.0 115.0 L 74.0 115.0 C 60.8 115.0 52.0 106.2 52.0 93.0 L 52.0 33.0 C 52.0 19.8 60.8 11.0 74.0 11.0 Z"/>
                    <path fill="#6d2077" d="M 58.0 82.0 C 68.0 98.0 92.0 106.0 118.0 98.0 C 136.0 92.0 148.0 76.0 150.0 56.0 C 151.0 82.0 134.0 106.0 106.0 109.0 C 82.0 111.0 64.0 98.0 58.0 82.0 Z"/>
                    <path fill="#fbbf24" d="M 85.0 74.0 C 77.0 78.0 68.0 88.0 64.0 101.0 C 77.0 97.0 87.0 88.0 91.0 80.0 L 85.0 74.0 Z"/>
                    <path fill="#f3e8ff" d="M 86.0 61.0 L 66.0 66.0 L 62.0 78.0 L 81.0 76.0 L 89.0 84.0 L 87.0 103.0 L 99.0 99.0 L 104.0 79.0 L 86.0 61.0 Z"/>
                    <path fill="#ffffff" d="M 142.0 23.0 C 126.0 25.0 106.0 37.0 90.0 53.0 L 79.0 64.0 L 101.0 86.0 L 112.0 75.0 C 128.0 59.0 140.0 39.0 142.0 23.0 Z"/>
                    <path fill="#8c3494" d="M 115.0 42.5 C 119.2 42.5 122.5 45.8 122.5 50.0 C 122.5 54.2 119.2 57.5 115.0 57.5 C 110.8 57.5 107.5 54.2 107.5 50.0 C 107.5 45.8 110.8 42.5 115.0 42.5 Z"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10px] font-extrabold text-[#8c3494]">Rocket রকেট</span>
              </button>

              <!-- 4. Upay Vector -->
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="1"
                hidden
                data-el-keywords="upay উপায় payment পেমেন্ট mobile banking"
                data-add-vector="upay"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#0054a6] bg-white dark:bg-[#171c26] transition cursor-pointer group"
                title="Upay (উপায়) ভেক্টর লোগো যুক্ত করুন"
              >
                <span class="w-8.5 h-8.5 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center p-1 group-hover:scale-108 transition">
                  <svg viewBox="0 0 64 64" class="w-6 h-6">
                    <path fill="#ffd200" d="M 14.0 6.0 L 50.0 6.0 C 55.5 6.0 58.0 8.5 58.0 14.0 L 58.0 50.0 C 58.0 55.5 55.5 58.0 50.0 58.0 L 14.0 58.0 C 8.5 58.0 6.0 55.5 6.0 50.0 L 6.0 14.0 C 6.0 8.5 8.5 6.0 14.0 6.0 Z"/>
                    <path fill="#0054a6" d="M 19.0 18.0 L 27.0 18.0 L 27.0 35.0 C 27.0 39.5 29.2 42.0 33.0 42.0 C 36.8 42.0 39.0 39.5 39.0 35.0 L 39.0 18.0 L 47.0 18.0 L 47.0 35.5 C 47.0 44.5 41.4 49.5 33.0 49.5 C 24.6 49.5 19.0 44.5 19.0 35.5 L 19.0 18.0 Z"/>
                    <path fill="#ed1c24" d="M 33.0 12.0 L 39.0 18.0 L 35.0 18.0 L 33.0 15.8 L 31.0 18.0 L 27.0 18.0 L 33.0 12.0 Z"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10px] font-extrabold text-[#0054a6]">Upay উপায়</span>
              </button>

              <!-- 5. Bank Transfer Vector -->
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="1"
                hidden
                data-el-keywords="bank account ব্যাংক একাউন্ট হিসাব অনুদান"
                data-add-vector="bank"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#0f766e] bg-white dark:bg-[#171c26] transition cursor-pointer group"
                title="Bank Account (ব্যাংক একাউন্ট) আইকন যুক্ত করুন"
              >
                <span class="w-8.5 h-8.5 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center p-1 group-hover:scale-108 transition">
                  <svg viewBox="0 0 64 64" class="w-6 h-6">
                    <path fill="#0f766e" d="M 12.0 6.0 L 52.0 6.0 C 55.3 6.0 58.0 8.7 58.0 12.0 L 58.0 52.0 C 58.0 55.3 55.3 58.0 52.0 58.0 L 12.0 58.0 C 8.7 58.0 6.0 55.3 6.0 52.0 L 6.0 12.0 C 6.0 8.7 8.7 6.0 12.0 6.0 Z"/>
                    <path fill="#ffffff" d="M 32.0 13.0 L 50.0 23.0 L 50.0 26.5 L 14.0 26.5 L 14.0 23.0 L 32.0 13.0 Z M 18.0 29.5 L 22.5 29.5 L 22.5 43.5 L 18.0 43.5 L 18.0 29.5 Z M 29.8 29.5 L 34.2 29.5 L 34.2 43.5 L 29.8 43.5 L 29.8 29.5 Z M 41.5 29.5 L 46.0 29.5 L 46.0 43.5 L 41.5 43.5 L 41.5 29.5 Z M 14.0 46.0 L 50.0 46.0 L 50.0 50.5 L 14.0 50.5 L 14.0 46.0 Z"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10px] font-extrabold text-[#0f766e]">ব্যাংক হিসাব</span>
              </button>

              <!-- 6. Visa / Card Vector -->
              <button
                type="button"
                data-el-item="1"
                data-el-overflow="1"
                hidden
                data-el-keywords="card visa mastercard কার্ড পেমেন্ট ভিসা"
                data-add-vector="card"
                class="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#1d4ed8] bg-white dark:bg-[#171c26] transition cursor-pointer group"
                title="Card Payment (কার্ড পেমেন্ট) আইকন যুক্ত করুন"
              >
                <span class="w-8.5 h-8.5 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center p-1 group-hover:scale-108 transition">
                  <svg viewBox="0 0 64 64" class="w-6 h-6">
                    <path fill="#1d4ed8" d="M 10.0 13.0 L 54.0 13.0 C 57.3 13.0 60.0 15.7 60.0 19.0 L 60.0 45.0 C 60.0 48.3 57.3 51.0 54.0 51.0 L 10.0 51.0 C 6.7 51.0 4.0 48.3 4.0 45.0 L 4.0 19.0 C 4.0 15.7 6.7 13.0 10.0 13.0 Z"/>
                    <path fill="#93c5fd" d="M 4.0 22.0 L 60.0 22.0 L 60.0 29.0 L 4.0 29.0 L 4.0 22.0 Z"/>
                    <path fill="#fbbf24" d="M 11.0 34.0 L 21.0 34.0 L 21.0 44.0 L 11.0 44.0 Z"/>
                  </svg>
                </span>
                <span class="mt-1 text-[10px] font-extrabold text-[#1d4ed8]">কার্ড পেমেন্ট</span>
              </button>
            </div>
          </div>

          <!-- SHELF 4: VARIOUS SHAPES & LINES (21 Geometric & Banner Shapes) -->
          <div data-el-shelf="shapes" class="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="শেপ, লাইন ও ফ্রেম (Shapes)" data-i18n-en="Shapes & Lines">শেপ, লাইন ও ফ্রেম (Shapes)</strong>
              <button type="button" data-el-see-all="shapes" class="text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0" data-i18n-bn="সব দেখুন (২১)" data-i18n-en="See all (21)">সব দেখুন (২১)</button>
            </div>

            <div class="grid grid-cols-3 gap-1.5" id="pcShapeElementsGrid">
              {#each shapeElements as sh, idx}
                <button
                  type="button"
                  data-el-item="1"
                  data-el-overflow={idx >= 6 ? '1' : '0'}
                  data-el-keywords="{sh.kind} {sh.labelBn} {sh.labelEn} {sh.keywords}"
                  hidden={idx >= 6}
                  data-add-shape={sh.kind}
                  data-fill={sh.fill}
                  data-stroke={sh.stroke}
                  data-w={sh.w}
                  data-h={sh.h}
                  data-radius={sh.radius}
                  class="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-[#171c26] hover:bg-blue-50/70 dark:hover:bg-white/8 border border-slate-200/90 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition"
                >
                  <span class="w-10 h-6 flex items-center justify-center">
                    {#if sh.kind === 'rect'}
                      <span class="w-8.5 h-5 bg-red-600 block"></span>
                    {:else if sh.kind === 'rounded'}
                      <span class="w-8.5 h-5 rounded-md bg-red-600 block"></span>
                    {:else if sh.kind === 'pill'}
                      <span class="w-9 h-4.5 rounded-full bg-[#2563eb] block"></span>
                    {:else if sh.kind === 'circle'}
                      <span class="w-5.5 h-5.5 rounded-full bg-amber-500 block"></span>
                    {:else if sh.kind === 'ring'}
                      <span class="w-5.5 h-5.5 rounded-full border-2 border-sky-400 block"></span>
                    {:else if sh.kind === 'glass'}
                      <span class="w-9 h-5 rounded-md bg-slate-800/80 border border-sky-400 block"></span>
                    {:else if sh.kind === 'outline'}
                      <span class="w-9 h-5 rounded-sm border-2 border-amber-400 block"></span>
                    {:else if sh.kind === 'line'}
                      <span class="w-9 h-1 rounded-full bg-amber-400 block"></span>
                    {:else if sh.kind === 'dashed-line'}
                      <span class="w-9 border-t-2 border-dashed border-sky-400 block"></span>
                    {:else}
                      <svg viewBox="0 0 32 24" class="w-7 h-5" aria-hidden="true">
                        {#if sh.kind === 'triangle'}
                          <polygon points="16,2 30,22 2,22" fill="#e11d48" />
                        {:else if sh.kind === 'diamond'}
                          <polygon points="16,1 30,12 16,23 2,12" fill="#7c3aed" />
                        {:else if sh.kind === 'pentagon'}
                          <polygon points="16,1 29,10 24,23 8,23 3,10" fill="#059669" />
                        {:else if sh.kind === 'hexagon'}
                          <polygon points="16,1 28,7 28,17 16,23 4,17 4,7" fill="#0284c7" />
                        {:else if sh.kind === 'octagon'}
                          <polygon points="11,1 21,1 29,8 29,16 21,23 11,23 3,16 3,8" fill="#b91c1c" />
                        {:else if sh.kind === 'star'}
                          <polygon points="16,1 19.8,8.8 28.5,10 22,16 23.6,23.5 16,19.5 8.4,23.5 10,16 3.5,10 12.2,8.8" fill="#f59e0b" />
                        {:else if sh.kind === 'starburst'}
                          <circle cx="16" cy="12" r="10" fill="#dc2626" stroke="#fde047" stroke-width="1.8" stroke-dasharray="2 1.5" />
                        {:else if sh.kind === 'shield'}
                          <path d="M16 1L27 5v7c0 6-5 10-11 11C10 22 5 18 5 12V5l11-4z" fill="#1e40af" />
                        {:else if sh.kind === 'ribbon'}
                          <polygon points="1,5 31,5 27,12 31,19 1,19 5,12" fill="#b91c1c" />
                        {:else if sh.kind === 'speech'}
                          <path d="M4 3h24a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H13l-5 5v-5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#2563eb" />
                        {:else if sh.kind === 'arrow-right'}
                          <polygon points="2,8 20,8 20,3 30,12 20,21 20,16 2,16" fill="#ea580c" />
                        {:else}
                          <path d="M6 23V11a10 10 0 0 1 20 0v12H6z" fill="#047857" />
                        {/if}
                      </svg>
                    {/if}
                  </span>
                  <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full" data-i18n-bn={sh.labelBn} data-i18n-en={sh.labelEn}>{sh.labelBn}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- SHELF 5: GRAPHICS ELEMENTS (12 Decorative Frames, Stamps, Islamic Arch, Broadcast Bars) -->
          <div data-el-shelf="graphics" class="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="গ্রাফিক্স এলিমেন্টস (Graphics)" data-i18n-en="Graphics Elements">গ্রাফিক্স এলিমেন্টস (Graphics)</strong>
              <button type="button" data-el-see-all="graphics" class="text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0" data-i18n-bn="সব দেখুন (১২)" data-i18n-en="See all (12)">সব দেখুন (১২)</button>
            </div>
            <div class="grid grid-cols-3 gap-1.5" id="pcGraphicsElementsGrid">
              {#each graphicElementItems as grp, idx}
                <button
                  type="button"
                  data-el-item="1"
                  data-el-overflow={idx >= 6 ? '1' : '0'}
                  data-el-keywords="{grp.kind} {grp.labelBn} {grp.labelEn} {grp.keywords}"
                  hidden={idx >= 6}
                  data-add-graphic={grp.kind}
                  data-fill={grp.fill}
                  data-accent={grp.accent}
                  data-w={grp.w}
                  data-h={grp.h}
                  class="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white dark:bg-[#171c26] hover:bg-blue-50/70 dark:hover:bg-white/8 border border-slate-200/90 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition"
                >
                  <span class="w-10 h-6 rounded flex items-center justify-center" style="color:{grp.fill};">
                    {#if grp.kind === 'breaking-frame'}
                      <span class="w-9 h-5 rounded-xs border-2 border-red-600 flex items-start justify-start p-0.5"><span class="px-1 bg-red-600 text-[6px] font-black text-white leading-tight">TV</span></span>
                    {:else if grp.kind === 'corner-brackets'}
                      <Icon name="lucide:scan" class="w-5 h-5 text-amber-500" />
                    {:else if grp.kind === 'live-banner'}
                      <span class="px-1.5 py-0.5 rounded bg-red-600 text-white text-[8px] font-black">● LIVE</span>
                    {:else if grp.kind === 'quote-frame'}
                      <Icon name="lucide:message-square-quote" class="w-5 h-5 text-amber-500" />
                    {:else if grp.kind === 'award-seal'}
                      <Icon name="lucide:award" class="w-5 h-5 text-amber-600" />
                    {:else if grp.kind === 'verified-stamp'}
                      <Icon name="lucide:shield-check" class="w-5 h-5 text-emerald-600" />
                    {:else if grp.kind === 'islamic-arch'}
                      <Icon name="lucide:landmark" class="w-5 h-5 text-emerald-600" />
                    {:else if grp.kind === 'paper-strip'}
                      <span class="w-8 h-3.5 bg-amber-300 border-l-3 border-amber-600 block"></span>
                    {:else if grp.kind === 'dots-grid'}
                      <Icon name="lucide:grip" class="w-5 h-5 text-sky-500" />
                    {:else if grp.kind === 'hazard-stripe'}
                      <span class="w-9 h-3 rounded-xs bg-amber-400 border border-slate-900 block"></span>
                    {:else if grp.kind === 'curved-arrow'}
                      <Icon name="lucide:redo-2" class="w-5 h-5 text-amber-500" />
                    {:else}
                      <span class="w-5 h-5 rounded-full bg-sky-400/50 blur-[1px] ring-2 ring-sky-400 block"></span>
                    {/if}
                  </span>
                  <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full" data-i18n-bn={grp.labelBn} data-i18n-en={grp.labelEn}>{grp.labelBn}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- SHELF 6: BILINGUAL STICKERS & BADGES (38 Editable Items + Category Filter) -->
          <div data-el-shelf="badges" class="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="বাংলা ও ইংরেজি ব্যাজ স্টিকার (৩৮টি)" data-i18n-en="Badge Stickers (38)">বাংলা ও ইংরেজি ব্যাজ স্টিকার (৩৮টি)</strong>
              <button type="button" data-el-see-all="badges" class="text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0" data-i18n-bn="সব দেখুন (৩৮)" data-i18n-en="See all (38)">সব দেখুন (৩৮)</button>
            </div>

            <!-- Category Filter Pills (R9 Contract: keep flex-wrap & id="pcStickerCatFilter") -->
            <div class="flex flex-wrap items-center gap-1.5 mb-2" id="pcStickerCatFilter">
              {#each stickerCategories as cat}
                <button
                  type="button"
                  data-sticker-cat={cat.id}
                  aria-pressed={activeStickerCat === cat.id ? 'true' : 'false'}
                  onclick={() => { activeStickerCat = cat.id; }}
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 aria-pressed:bg-[#2563eb] aria-pressed:text-white aria-pressed:border-[#2563eb]"
                  data-i18n-bn={cat.labelBn}
                  data-i18n-en={cat.labelEn}
                >
                  {cat.labelBn}
                </button>
              {/each}
            </div>

            <div id="pcBadgesOverviewClamp" style="max-height: 210px; overflow: hidden;">
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
                    {:else if st.icon === 'phone'}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z"/></svg>
                    {:else if st.icon === 'chat'}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 shrink-0" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {/if}
                    <span class="truncate">{st.text}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <!-- SHELF 7: CARD COLOR PALETTES & GRADIENT DENSITY -->
          <div data-el-shelf="colors" class="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2.5">
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="কার্ডের কালার থিম (১২টি প্যালেট)" data-i18n-en="Card Color Palettes (12)">কার্ডের কালার থিম (১২টি প্যালেট)</strong>
              <button type="button" data-el-see-all="colors" class="text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0" data-i18n-bn="সব দেখুন" data-i18n-en="See all">সব দেখুন</button>
            </div>
            <div class="grid grid-cols-2 gap-1.5" id="pcThemePills">
              {#each themePalettes as th, i}
                <button
                  type="button"
                  data-el-item="1"
                  data-el-overflow={i >= 6 ? '1' : '0'}
                  data-el-keywords="{th.id} {th.nameBn} {th.nameEn} theme color কালার থিম"
                  hidden={i >= 6}
                  data-pc-theme={th.id}
                  data-primary={th.primary}
                  data-accent={th.accent}
                  data-bg={th.bg}
                  aria-pressed={i === 1 ? 'true' : 'false'}
                  class="flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer transition bg-white dark:bg-[#171c26] border-slate-200 dark:border-white/10 hover:border-[#2563eb] aria-pressed:border-[#2563eb] aria-pressed:ring-2 aria-pressed:ring-[#2563eb]/25"
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

            <div class="grid grid-cols-3 gap-1.5">
              <label class="relative flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 cursor-pointer text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcPrimaryColor" value="#dc2626" class="w-4.5 h-4.5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate" data-i18n-bn="প্রাইমারি" data-i18n-en="Primary">প্রাইমারি</span>
              </label>
              <label class="relative flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 cursor-pointer text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcAccentColor" value="#fde047" class="w-4.5 h-4.5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate" data-i18n-bn="হাইলাইট" data-i18n-en="Accent">হাইলাইট</span>
              </label>
              <label class="relative flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 cursor-pointer text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcBgColor" value="#1c080b" class="w-4.5 h-4.5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate" data-i18n-bn="ব্যাকগ্রাউন্ড" data-i18n-en="Background">ব্যাকগ্রাউন্ড</span>
              </label>
            </div>

            <div hidden>
              <select id="pcFontFamily">
                {#each fontFamilies as ff}
                  <option value={ff.id}>{ff.label}</option>
                {/each}
              </select>
            </div>

            <div class="p-2.5 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10">
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
            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-1">
                <label for="pcHeadlineText" id="pcHeadlineFieldLabel" class="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">মূল শিরোনাম (Headline):</label>
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    id="pcHighlightSelectionBtn"
                    title="যেকোনো শব্দ মাউস দিয়ে সিলেক্ট করে হাইলাইট রঙ দিন"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    <Icon name="lucide:highlighter" class="w-3 h-3" />
                    <span data-i18n-bn="নির্বাচিত অংশ হাইলাইট" data-i18n-en="Highlight Selection">নির্বাচিত অংশ হাইলাইট</span>
                  </button>
                  <button
                    type="button"
                    id="pcClearHighlightBtn"
                    title="নির্বাচিত অংশ বা পুরো লেখার হাইলাইট মুছুন"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 hover:bg-rose-500/15 hover:text-rose-600 text-slate-600 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    <span data-i18n-bn="মুছুন" data-i18n-en="Clear">মুছুন</span>
                  </button>
                </div>
              </div>
              <textarea
                id="pcHeadlineText"
                rows="2"
                class="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/10 text-[12.5px] font-bold text-slate-900 dark:text-white leading-relaxed resize-y outline-none focus:border-[#2563eb]"
              ></textarea>

              <!-- Direct Selection Highlight Color & Mode Bar -->
              <div class="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10.5px] font-extrabold text-slate-600 dark:text-slate-300" data-i18n-bn="হাইলাইট রঙ:" data-i18n-en="Highlight:">হাইলাইট রঙ:</span>
                  <div class="inline-flex items-center gap-1" id="pcHeadlineHighlightPresets">
                    {#each [
                      { hex: '#fde047', label: 'হলুদ (Yellow)' },
                      { hex: '#ef4444', label: 'লাল (Red)' },
                      { hex: '#22c55e', label: 'সবুজ (Green)' },
                      { hex: '#38bdf8', label: 'আকাশি (Sky)' },
                      { hex: '#fb923c', label: 'কমলা (Orange)' },
                      { hex: '#ffffff', label: 'সাদা (White)' }
                    ] as hiPreset}
                      <button
                        type="button"
                        data-pc-hi-preset={hiPreset.hex}
                        title={`হাইলাইট রঙ: ${hiPreset.label}`}
                        class="w-4 h-4 rounded-full border border-slate-300 dark:border-white/25 cursor-pointer hover:scale-110 transition shrink-0"
                        style="background:{hiPreset.hex};"
                      ></button>
                    {/each}
                  </div>
                  <button
                    type="button"
                    id="pcHeadlineHighlightColorBtn"
                    class="inline-flex items-center gap-1 h-6 px-1.5 rounded-md bg-white dark:bg-[#1c212c] border border-slate-300/90 dark:border-white/20 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 hover:border-[#2563eb] cursor-pointer transition"
                    title="কাস্টম হাইলাইট রঙ নির্বাচন করুন"
                  >
                    <span id="pcHeadlineHighlightColorDot" class="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0" style="background:#fde047;"></span>
                    <span data-i18n-bn="কাস্টম" data-i18n-en="Custom">কাস্টম</span>
                  </button>
                </div>
                <button
                  type="button"
                  id="pcHighlightModeBtn"
                  data-hi-mode=""
                  class="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold cursor-pointer transition shrink-0"
                  title="হাইলাইট স্টাইল পরিবর্তন (অটো / লেখা / মার্কার বক্স)"
                >
                  <span id="pcHighlightModeLabel" data-i18n-bn="অটো" data-i18n-en="Auto">অটো</span>
                </button>
              </div>
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
                <div class="flex items-center justify-between gap-1 mb-1">
                  <label for="pcFooterUrl" class="block text-[10px] font-bold text-slate-500 dark:text-slate-400" data-i18n-bn="ওয়েবসাইট / হটলাইন:" data-i18n-en="Website / Hotline:">ওয়েবসাইট / হটলাইন:</label>
                  <button
                    type="button"
                    id="pcSyncFooterToBrandBtn"
                    class="text-[9.5px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer shrink-0"
                    title="এই তথ্য বর্তমান ব্র্যান্ড প্রোফাইলে সেভ করুন"
                    data-i18n-bn="ব্র্যান্ডে সেভ করুন"
                    data-i18n-en="Save to Brand"
                  >ব্র্যান্ডে সেভ করুন</button>
                </div>
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
             DRAWER 4: CANVA-STYLE BRAND KIT HUB
             (Search + Brand Kit Switcher + Section Nav + Logos, Colors, Fonts, Info, Graphics)
             =============================================================== -->
        <div data-pc-drawer="brand" hidden class="space-y-3">
          <!-- 1. Canva Search Bar -->
          <div class="relative flex items-center">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="pcBrandSearchInput"
              placeholder="ব্র্যান্ড লোগো, কালার বা অ্যাসেট খুঁজুন..."
              data-i18n-placeholder-bn="ব্র্যান্ড লোগো, কালার বা অ্যাসেট খুঁজুন..."
              data-i18n-placeholder-en="Search brand logos, colors or assets..."
              class="w-full h-9.5 pl-9.5 pr-3 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-300/90 dark:border-white/15 text-[12px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#2563eb]"
            />
          </div>

          <!-- 2. Active Brand Kit Switcher Pill + Dropdown Menu -->
          <div class="relative">
            <button
              type="button"
              id="pcBrandKitDropdownBtn"
              aria-expanded="false"
              class="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-white dark:bg-[#0f131b] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200/95 dark:border-white/15 shadow-2xs cursor-pointer transition"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <span
                  id="pcBrandKitDropdownAvatar"
                  class="w-7.5 h-7.5 rounded-full bg-blue-500/12 border border-slate-200 dark:border-white/15 flex items-center justify-center overflow-hidden shrink-0"
                >
                  <span class="text-[10px] font-black text-[#2563eb] dark:text-sky-300">BK</span>
                </span>
                <span class="min-w-0 text-left">
                  <span id="pcBrandKitDropdownLabel" class="block text-[12px] font-extrabold text-slate-900 dark:text-white truncate">ব্র্যান্ড কিট (Brand Kit)</span>
                  <span class="block text-[9.5px] font-semibold text-slate-400" data-i18n-bn="সক্রিয় ব্র্যান্ড প্রোফাইল পরিবর্তন করুন" data-i18n-en="Switch active Brand Kit">সক্রিয় ব্র্যান্ড প্রোফাইল পরিবর্তন করুন</span>
                </span>
              </span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            <div
              id="pcBrandKitDropdownMenu"
              hidden
              class="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-white/15 shadow-xl p-2 space-y-1.5"
            >
              <div id="pcBrandKitDropdownList" class="space-y-1 max-h-44 overflow-y-auto pr-0.5"></div>
              <div class="pt-1.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  id="pcBrandDropdownNewBtn"
                  class="flex-1 h-8 px-2.5 rounded-xl bg-[#2563eb]/12 hover:bg-[#2563eb]/20 text-[#2563eb] dark:text-sky-300 text-[11px] font-extrabold cursor-pointer transition"
                  data-i18n-bn="+ নতুন ব্র্যান্ড কিট"
                  data-i18n-en="+ New Brand Kit"
                >+ নতুন ব্র্যান্ড কিট</button>
                <button
                  type="button"
                  id="pcBrandDropdownDeactivateBtn"
                  class="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 text-[10.5px] font-bold cursor-pointer transition"
                  data-i18n-bn="ডিফল্ট রিসেট"
                  data-i18n-en="Reset"
                >ডিফল্ট রিসেট</button>
              </div>
            </div>
          </div>

          <!-- 3. Canva Section Navigation Pills (All assets | Logos | Colors | Fonts | Info | Graphics) -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5" id="pcBrandSectionNav">
            {#each brandSections as bSec, idx}
              <button
                type="button"
                data-brand-sec={bSec.id}
                aria-pressed={idx === 0 ? 'true' : 'false'}
                class="shrink-0 inline-flex items-center gap-1.5 h-7.5 px-2.5 rounded-full text-[11px] font-bold border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#0f131b] text-slate-600 dark:text-slate-300 hover:border-[#2563eb] aria-pressed:bg-[#2563eb]/12 aria-pressed:text-[#1d4ed8] dark:aria-pressed:text-sky-300 aria-pressed:border-[#2563eb] cursor-pointer transition"
              >
                <Icon name={bSec.icon} class="w-3.5 h-3.5 shrink-0" />
                <span data-i18n-bn={bSec.labelBn} data-i18n-en={bSec.labelEn}>{bSec.labelBn}</span>
              </button>
            {/each}
          </div>

          <button
            type="button"
            id="pcBrandBackToAllBtn"
            hidden
            class="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer"
          >
            <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
            <span data-i18n-bn="সব ব্র্যান্ড অ্যাসেটে ফিরে যান" data-i18n-en="Back to All Brand Assets">সব ব্র্যান্ড অ্যাসেটে ফিরে যান</span>
          </button>

          <!-- CARD 1: LOGOS (Canva Logos Section + Saved Logos 1-Click Grid) -->
          <div
            data-brand-card="logos"
            data-brand-keywords="logo logos brand emblem লোগো ব্র্যান্ড চিহ্ন পিল"
            class="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2.5"
          >
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="লোগোসমূহ (Logos)" data-i18n-en="Logos">লোগোসমূহ (Logos)</strong>
              <div class="inline-flex items-center gap-2">
                <button type="button" id="pcClearLogoBtn" hidden class="text-[10.5px] font-bold text-rose-500 hover:underline cursor-pointer" data-i18n-bn="লোগো সরান" data-i18n-en="Remove">লোগো সরান</button>
                <button type="button" data-brand-see-all="logos" class="text-[10.5px] font-bold text-[#2563eb] dark:text-sky-400 hover:underline cursor-pointer" data-i18n-bn="সব দেখুন" data-i18n-en="See all">সব দেখুন</button>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <div class="w-14 h-14 rounded-2xl bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                <img id="pcActiveLogoThumb" src="" alt="Logo" hidden class="w-full h-full object-contain p-1.5" />
                <span id="pcActiveLogoEmptyIcon" class="text-[10px] font-extrabold text-slate-400">LOGO</span>
              </div>

              <label
                for="pcLogoInput"
                id="pcLogoDropzone"
                class="flex-1 flex flex-col justify-center px-3 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white cursor-pointer transition shadow-2xs"
              >
                <span class="text-[11.5px] font-extrabold" data-i18n-bn="+ ব্র্যান্ড লোগো আপলোড" data-i18n-en="+ Upload Brand Logo">+ ব্র্যান্ড লোগো আপলোড</span>
                <span class="text-[9.5px] text-white/85" data-i18n-bn="PNG / SVG স্বচ্ছ লোগো এক ক্লিকে বসবে" data-i18n-en="Crisp PNG / SVG logo on canvas">PNG / SVG স্বচ্ছ লোগো এক ক্লিকে বসবে</span>
              </label>
            </div>

            <div
              id="pcBrandLogosMirror"
              class="grid grid-cols-3 gap-2 min-h-[64px] p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200/80 dark:border-white/10"
            >
              <span class="col-span-3 text-[11px] text-slate-400 py-3 text-center">আপলোড করা লোগো এখানে সেভ থাকবে</span>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-0.5">
              <div>
                <label for="pcLogoPos" class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1" data-i18n-bn="লোগোর অবস্থান:" data-i18n-en="Position:">লোগোর অবস্থান:</label>
                <select id="pcLogoPos" class="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-800 dark:text-white">
                  <option value="top-right">উপরে ডানে (Top Right)</option>
                  <option value="top-left">উপরে বামে (Top Left)</option>
                  <option value="top-center">উপরে মাঝে (Top Center)</option>
                  <option value="bottom-right">নিচে ডানে (Bottom Right)</option>
                  <option value="custom">কাস্টম (Custom Drag)</option>
                  <option value="hidden">লুকানো (Hidden)</option>
                </select>
              </div>
              <div>
                <label for="pcLogoBgStyle" class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1" data-i18n-bn="পিল স্টাইল:" data-i18n-en="Pill Style:">পিল স্টাইল:</label>
                <select id="pcLogoBgStyle" class="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-800 dark:text-white">
                  <option value="light">সাদা পিল (White Pill)</option>
                  <option value="dark">ডার্ক পিল (Dark Glass)</option>
                  <option value="none">স্বচ্ছ (Transparent)</option>
                </select>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span data-i18n-bn="লোগোর সাইজ" data-i18n-en="Logo Scale">লোগোর সাইজ</span>
                <strong id="pcLogoSizeVal" class="font-mono text-slate-900 dark:text-white">100%</strong>
              </div>
              <input type="range" id="pcLogoSize" min="40" max="240" value="100" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
            </div>
          </div>

          <!-- CARD 2: COLORS (Canva Brand Color Swatches + Custom Pickers) -->
          <div
            data-brand-card="colors"
            data-brand-keywords="color colors palette swatch কালার রঙ প্যালেট প্রাইমারি অ্যাকসেন্ট ব্যাকগ্রাউন্ড"
            class="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2.5"
          >
            <div class="flex items-center justify-between gap-1.5">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="ব্র্যান্ড কালার প্যালেট (Colors)" data-i18n-en="Colors">ব্র্যান্ড কালার প্যালেট (Colors)</strong>
              <button
                type="button"
                id="pcBrandGrabCurrentColorsBtn"
                class="px-2 py-0.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
                data-i18n-bn="কার্ডের রঙ নিন"
                data-i18n-en="Grab Card Colors"
              >কার্ডের রঙ নিন</button>
            </div>

            <!-- Live 1-Click Swatch Pills Populated by syncCanvaBrandKitHeaderUi -->
            <div id="pcBrandPaletteSwatchesRow" class="flex items-center gap-2 flex-wrap"></div>

            <div class="grid grid-cols-3 gap-1.5">
              <label class="relative flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 cursor-pointer text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcBrandPrimaryColor" value="#dc2626" class="w-4.5 h-4.5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate">প্রাইমারি</span>
              </label>
              <label class="relative flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 cursor-pointer text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcBrandAccentColor" value="#fde047" class="w-4.5 h-4.5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate">অ্যাকসেন্ট</span>
              </label>
              <label class="relative flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 cursor-pointer text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
                <input type="color" id="pcBrandBgColor" value="#1c080b" class="w-4.5 h-4.5 rounded border-0 cursor-pointer bg-transparent shrink-0" />
                <span class="truncate">ব্যাকগ্রাউন্ড</span>
              </label>
            </div>

            <label class="flex items-start gap-2 pt-0.5 cursor-pointer select-none">
              <input type="checkbox" id="pcBrandApplyColorsToggle" checked class="mt-0.5 accent-[#2563eb] cursor-pointer" />
              <span class="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 leading-snug" data-i18n-bn="ব্র্যান্ড সিলেক্ট করলে এই কালার প্যালেট অটো সেট করুন" data-i18n-en="Auto-apply palette on brand select">ব্র্যান্ড সিলেক্ট করলে এই কালার প্যালেট অটো সেট করুন</span>
            </label>
          </div>

          <!-- CARD 3: FONTS (Canva Brand Typography Card) -->
          <div
            data-brand-card="fonts"
            data-brand-keywords="font fonts typography ফন্ট টাইপোগ্রাফি বাংলা ইংরেজি"
            class="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2"
          >
            <div class="flex items-center justify-between">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="ব্র্যান্ড ফন্ট (Fonts)" data-i18n-en="Fonts">ব্র্যান্ড ফন্ট (Fonts)</strong>
              <span id="pcBrandActiveFontName" class="text-[10px] font-bold text-[#2563eb] dark:text-sky-400">Hind Siliguri</span>
            </div>
            <button
              type="button"
              id="pcBrandFontActiveCard"
              class="w-full p-2.5 rounded-xl bg-white dark:bg-[#171c26] hover:border-[#2563eb] border border-slate-200 dark:border-white/10 text-left cursor-pointer transition"
            >
              <span id="pcBrandActiveFontSample" class="block text-[13px] font-extrabold text-slate-900 dark:text-white">Hind Siliguri — শিরোনাম ও মূল ফন্ট</span>
              <span class="block text-[10px] text-slate-400 mt-0.5" data-i18n-bn="ক্লিক করে ব্র্যান্ড ফন্ট পরিবর্তন বা কাস্টম ফন্ট আপলোড করুন" data-i18n-en="Click to change brand font or upload .TTF/.OTF">ক্লিক করে ব্র্যান্ড ফন্ট পরিবর্তন বা কাস্টম ফন্ট আপলোড করুন</span>
            </button>
          </div>

          <!-- CARD 4: BRAND VOICE / ORGANIZATION CONTACT DETAILS -->
          <div
            data-brand-card="info"
            data-brand-keywords="brand info name website phone hotline footer ব্র্যান্ড নাম ওয়েবসাইট মোবাইল হটলাইন ঠিকানা"
            class="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2.5"
          >
            <strong class="block text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="ব্র্যান্ড পরিচয় ও যোগাযোগ (Brand Info)" data-i18n-en="Brand Identity & Contact">ব্র্যান্ড পরিচয় ও যোগাযোগ (Brand Info)</strong>

            <div>
              <label for="pcBrandName" class="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1" data-i18n-bn="সংগঠন / ব্র্যান্ডের নাম:" data-i18n-en="Brand / Organization Name:">সংগঠন / ব্র্যান্ডের নাম:</label>
              <input
                type="text"
                id="pcBrandName"
                value="মানবিক ব্লাড ব্যাংক ফাউন্ডেশন"
                placeholder="সংগঠন বা নিউজ পোর্টালের নাম"
                class="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[12px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label for="pcBrandWebsite" class="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1" data-i18n-bn="ওয়েবসাইট / পেজ লিংক:" data-i18n-en="Website / Page Link:">ওয়েবসাইট / পেজ লিংক:</label>
                <input
                  type="text"
                  id="pcBrandWebsite"
                  placeholder="যেমন: www.techhat.com.bd"
                  class="w-full h-8.5 px-2.5 rounded-xl bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11.5px] font-semibold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
                />
              </div>
              <div>
                <label for="pcBrandPhone" class="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1" data-i18n-bn="মোবাইল / হটলাইন নাম্বার:" data-i18n-en="Mobile / Hotline:">মোবাইল / হটলাইন নাম্বার:</label>
                <input
                  type="text"
                  id="pcBrandPhone"
                  placeholder="যেমন: ০১৭০০-০০০০০০"
                  class="w-full h-8.5 px-2.5 rounded-xl bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11.5px] font-semibold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <div>
              <label for="pcBrandFooterFormat" class="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1" data-i18n-bn="ফুটারে প্রদর্শন ফরম্যাট:" data-i18n-en="Footer Display Format:">ফুটারে প্রদর্শন ফরম্যাট:</label>
              <select id="pcBrandFooterFormat" class="w-full h-8.5 px-2.5 rounded-xl bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11.5px] font-bold text-slate-800 dark:text-white">
                <option value="both">ওয়েবসাইট ও মোবাইল উভয়ই</option>
                <option value="website">শুধু ওয়েবসাইট</option>
                <option value="phone">শুধু মোবাইল নাম্বার</option>
              </select>
            </div>

            <div>
              <label for="pcBrandExtraInfo" class="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1" data-i18n-bn="বিকাশ/নগদ বা অতিরিক্ত তথ্য (ঐচ্ছিক):" data-i18n-en="bKash/Nagad or Extra Info:">বিকাশ/নগদ বা অতিরিক্ত তথ্য (ঐচ্ছিক):</label>
              <input
                type="text"
                id="pcBrandExtraInfo"
                placeholder="যেমন: বিকাশ/নগদ: ০১৭০০-০০০০০০"
                class="w-full h-8.5 px-2.5 rounded-xl bg-white dark:bg-[#1c212c] border border-slate-200 dark:border-white/10 text-[11.5px] font-medium text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
              />
            </div>

            <div class="flex flex-col gap-1.5 pt-1">
              <button
                type="button"
                id="pcSaveBrandProfileBtn"
                class="w-full h-9.5 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-extrabold shadow-xs cursor-pointer transition inline-flex items-center justify-center gap-1.5"
              >
                <Icon name="lucide:check-circle-2" class="w-4 h-4 [&_*]:!stroke-white" />
                <span data-i18n-bn="ব্র্যান্ড কিট সেভ ও প্রয়োগ করুন" data-i18n-en="Save & Apply Brand Kit">ব্র্যান্ড কিট সেভ ও প্রয়োগ করুন</span>
              </button>
              <button
                type="button"
                id="pcSaveAsNewBrandBtn"
                class="w-full h-8.5 px-3 rounded-xl bg-white dark:bg-[#1c212c] hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/12 text-slate-700 dark:text-slate-200 text-[11px] font-extrabold cursor-pointer transition"
                data-i18n-bn="+ নতুন ব্র্যান্ড কিট হিসেবে সেভ"
                data-i18n-en="+ Save as New Brand Kit"
              >+ নতুন ব্র্যান্ড কিট হিসেবে সেভ</button>
            </div>
          </div>

          <!-- CARD 5: BRAND GRAPHICS & QUICK SOCIAL/CONTACT STAMPS -->
          <div
            data-brand-card="graphics"
            data-brand-keywords="graphics icons social call website গ্রাফিক্স আইকন সোশ্যাল কল ওয়েবসাইট ভেরিফায়েড"
            class="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2"
          >
            <strong class="block text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="ব্র্যান্ড আইকন ও সোশ্যাল স্ট্যাম্প (Graphics)" data-i18n-en="Brand Icons & Social Stamps">ব্র্যান্ড আইকন ও সোশ্যাল স্ট্যাম্প (Graphics)</strong>
            <div class="grid grid-cols-4 gap-1.5">
              <button type="button" data-add-ui-icon="phone" data-bg="#16a34a" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition" title="হটলাইন কল আইকন">
                <span class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z"/></svg>
                </span>
                <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200">কল</span>
              </button>
              <button type="button" data-add-ui-icon="globe" data-bg="#2563eb" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition" title="ওয়েবসাইট আইকন">
                <span class="w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center">
                  <Icon name="lucide:globe" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
                </span>
                <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200">ওয়েব</span>
              </button>
              <button type="button" data-add-social="facebook" data-with-handle="1" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition" title="ফেসবুক হ্যান্ডেল পিল">
                <span class="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-black text-[12px]">f</span>
                <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200">FB পেজ</span>
              </button>
              <button type="button" data-add-ui-icon="verified" data-bg="#1d4ed8" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-[#171c26] border border-slate-200 dark:border-white/10 hover:border-[#2563eb] cursor-pointer transition" title="ভেরিফায়েড ব্যাজ">
                <span class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Icon name="lucide:badge-check" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
                </span>
                <span class="text-[9.5px] font-bold text-slate-700 dark:text-slate-200">ভেরিফায়েড</span>
              </button>
            </div>
          </div>

          <!-- CARD 6: SAVED BRAND KITS LIST -->
          <div
            data-brand-card="saved"
            data-brand-keywords="saved brand kits profiles সংরক্ষিত ব্র্যান্ড প্রোফাইল কিট"
            class="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200/90 dark:border-white/10 space-y-2.5"
          >
            <div class="flex items-center justify-between gap-2">
              <strong class="text-[12px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="সংরক্ষিত ব্র্যান্ড কিটসমূহ" data-i18n-en="Saved Brand Kits">সংরক্ষিত ব্র্যান্ড কিটসমূহ</strong>
              <div class="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  id="pcDeactivateBrandBtn"
                  hidden
                  class="px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/70 dark:hover:bg-white/15 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer transition"
                  data-i18n-bn="ডিফল্ট রিসেট"
                  data-i18n-en="Reset"
                >ডিফল্ট রিসেট</button>
                <button
                  type="button"
                  id="pcNewBrandProfileBtn"
                  class="px-2.5 py-1 rounded-lg bg-[#2563eb]/12 hover:bg-[#2563eb]/20 text-[10.5px] font-extrabold text-[#2563eb] dark:text-sky-300 cursor-pointer transition"
                  data-i18n-bn="+ নতুন ব্র্যান্ড"
                  data-i18n-en="+ New Brand"
                >+ নতুন ব্র্যান্ড</button>
              </div>
            </div>

            <div id="pcSavedBrandProfilesList" class="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              <div class="text-[11px] text-slate-400 py-2.5 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                কোনো ব্র্যান্ড সেভ করা নেই — উপরে তথ্য দিয়ে সেভ করুন
              </div>
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

        <!-- ===============================================================
             DRAWER 7: CANVA-STYLE POSITION & LAYERS PANEL (Arrange | Layers)
             =============================================================== -->
        <div data-pc-drawer="position" hidden class="space-y-3">
          <!-- Header + Close -->
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80 dark:border-white/10">
            <strong class="text-[13.5px] font-extrabold text-slate-900 dark:text-white" data-i18n-bn="পজিশন ও লেয়ার (Position)" data-i18n-en="Position">পজিশন ও লেয়ার (Position)</strong>
            <button
              type="button"
              id="pcClosePositionDrawerBtn"
              aria-label="বন্ধ করুন"
              class="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Top Tabs: Arrange | Layers -->
          <div class="grid grid-cols-2 border-b border-slate-200 dark:border-white/10 text-[12px] font-extrabold">
            <button
              type="button"
              data-pos-tab="arrange"
              aria-pressed="true"
              class="pb-2 border-b-2 border-transparent text-slate-500 aria-pressed:border-[#2563eb] aria-pressed:text-slate-900 dark:aria-pressed:text-white cursor-pointer transition"
              data-i18n-bn="সাজান (Arrange)"
              data-i18n-en="Arrange"
            >সাজান (Arrange)</button>
            <button
              type="button"
              data-pos-tab="layers"
              aria-pressed="false"
              class="pb-2 border-b-2 border-transparent text-slate-500 aria-pressed:border-[#2563eb] aria-pressed:text-slate-900 dark:aria-pressed:text-white cursor-pointer transition"
              data-i18n-bn="লেয়ারসমূহ (Layers)"
              data-i18n-en="Layers"
            >লেয়ারসমূহ (Layers)</button>
          </div>

          <!-- TAB PANE 1: ARRANGE (Order + Align to Page + Advanced X/Y/W/H/Rotate) -->
          <div id="pcPosArrangePane" class="space-y-3.5">
            <!-- Layer Order -->
            <div class="space-y-1.5">
              <span class="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300" data-i18n-bn="লেয়ার অর্ডার (Layer Order)" data-i18n-en="Layer Order">লেয়ার অর্ডার (Layer Order)</span>
              <div class="grid grid-cols-2 gap-1.5">
                <button type="button" data-pos-order="forward" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:chevron-up" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="এক ধাপ উপরে" data-i18n-en="Forward">এক ধাপ উপরে</span>
                </button>
                <button type="button" data-pos-order="backward" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:chevron-down" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="এক ধাপ নিচে" data-i18n-en="Backward">এক ধাপ নিচে</span>
                </button>
                <button type="button" data-pos-order="front" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:chevrons-up" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="সবার উপরে" data-i18n-en="To front">সবার উপরে</span>
                </button>
                <button type="button" data-pos-order="back" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:chevrons-down" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="সবার নিচে" data-i18n-en="To back">সবার নিচে</span>
                </button>
              </div>
            </div>

            <!-- Align to Page -->
            <div class="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
              <span class="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300" data-i18n-bn="পেজে অ্যালাইন করুন (Align to page)" data-i18n-en="Align to page">পেজে অ্যালাইন করুন (Align to page)</span>
              <div class="grid grid-cols-2 gap-1.5">
                <button type="button" data-pos-align="top" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:align-start-vertical" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="উপরে (Top)" data-i18n-en="Top">উপরে (Top)</span>
                </button>
                <button type="button" data-pos-align="left" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:align-start-horizontal" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="বামে (Left)" data-i18n-en="Left">বামে (Left)</span>
                </button>
                <button type="button" data-pos-align="middle" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:align-center-vertical" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="মাঝামাঝি (Middle)" data-i18n-en="Middle">মাঝামাঝি (Middle)</span>
                </button>
                <button type="button" data-pos-align="center" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:align-center-horizontal" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="কেন্দ্রে (Center)" data-i18n-en="Center">কেন্দ্রে (Center)</span>
                </button>
                <button type="button" data-pos-align="bottom" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:align-end-vertical" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="নিচে (Bottom)" data-i18n-en="Bottom">নিচে (Bottom)</span>
                </button>
                <button type="button" data-pos-align="right" class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 inline-flex items-center gap-2 text-[11.5px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition">
                  <Icon name="lucide:align-end-horizontal" class="w-4 h-4 text-slate-500" />
                  <span data-i18n-bn="ডানে (Right)" data-i18n-en="Right">ডানে (Right)</span>
                </button>
              </div>
            </div>

            <!-- Advanced Exact Geometry (Width, Height, Ratio, X, Y, Rotate) -->
            <div class="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
              <span class="block text-[11px] font-extrabold text-slate-600 dark:text-slate-300" data-i18n-bn="অ্যাডভান্সড মাপ ও অবস্থান (Advanced)" data-i18n-en="Advanced">অ্যাডভান্সড মাপ ও অবস্থান (Advanced)</span>
              <div class="grid grid-cols-3 gap-1.5">
                <div>
                  <label for="pcPosAdvW" class="block text-[10px] font-bold text-slate-500 mb-1">Width</label>
                  <div class="relative flex items-center">
                    <input type="number" id="pcPosAdvW" value="300" class="w-full h-8.5 pl-2.5 pr-6 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/12 font-mono text-[11.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]" />
                    <span class="absolute right-2 text-[9.5px] font-bold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                <div>
                  <label for="pcPosAdvH" class="block text-[10px] font-bold text-slate-500 mb-1">Height</label>
                  <div class="relative flex items-center">
                    <input type="number" id="pcPosAdvH" value="100" class="w-full h-8.5 pl-2.5 pr-6 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/12 font-mono text-[11.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]" />
                    <span class="absolute right-2 text-[9.5px] font-bold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                <div>
                  <span class="block text-[10px] font-bold text-slate-500 mb-1">Ratio</span>
                  <button
                    type="button"
                    id="pcPosRatioLockBtn"
                    aria-pressed="false"
                    title="অনুপাত লক / আনলক (Aspect Ratio Lock)"
                    class="w-full h-8.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/12 aria-pressed:border-[#2563eb] aria-pressed:bg-blue-500/10 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-1.5">
                <div>
                  <label for="pcPosAdvX" class="block text-[10px] font-bold text-slate-500 mb-1">X</label>
                  <div class="relative flex items-center">
                    <input type="number" id="pcPosAdvX" value="0" class="w-full h-8.5 pl-2.5 pr-6 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/12 font-mono text-[11.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]" />
                    <span class="absolute right-2 text-[9.5px] font-bold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                <div>
                  <label for="pcPosAdvY" class="block text-[10px] font-bold text-slate-500 mb-1">Y</label>
                  <div class="relative flex items-center">
                    <input type="number" id="pcPosAdvY" value="0" class="w-full h-8.5 pl-2.5 pr-6 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/12 font-mono text-[11.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]" />
                    <span class="absolute right-2 text-[9.5px] font-bold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                <div>
                  <label for="pcPosAdvRot" class="block text-[10px] font-bold text-slate-500 mb-1">Rotate</label>
                  <div class="relative flex items-center">
                    <input type="number" id="pcPosAdvRot" value="0" class="w-full h-8.5 pl-2.5 pr-5 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/12 font-mono text-[11.5px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]" />
                    <span class="absolute right-2 text-[11px] font-bold text-slate-400 pointer-events-none">°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB PANE 2: LAYERS (Canva Visual Layer Stack: All | Overlapping + Drag Reorder + Lock + Hide) -->
          <div id="pcPosLayersPane" hidden class="space-y-2.5">
            <div class="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0f131b] border border-slate-200/80 dark:border-white/10 text-[11px] font-extrabold">
              <button
                type="button"
                data-layers-filter="all"
                aria-pressed="true"
                class="h-7 rounded-lg text-slate-600 dark:text-slate-300 aria-pressed:bg-white dark:aria-pressed:bg-[#1e2534] aria-pressed:text-slate-900 dark:aria-pressed:text-white aria-pressed:shadow-2xs cursor-pointer transition"
                data-i18n-bn="সব লেয়ার (All)"
                data-i18n-en="All"
              >সব লেয়ার (All)</button>
              <button
                type="button"
                data-layers-filter="overlapping"
                aria-pressed="false"
                class="h-7 rounded-lg text-slate-600 dark:text-slate-300 aria-pressed:bg-white dark:aria-pressed:bg-[#1e2534] aria-pressed:text-slate-900 dark:aria-pressed:text-white aria-pressed:shadow-2xs cursor-pointer transition"
                data-i18n-bn="ওভারল্যাপিং (Overlapping)"
                data-i18n-en="Overlapping"
              >ওভারল্যাপিং (Overlapping)</button>
            </div>

            <p class="text-[10px] text-slate-400 px-0.5" data-i18n-bn="বাম পাশের ডট ধরে টেনে লেয়ার উপর-নিচ করুন, অথবা তালা ও চোখ আইকনে ক্লিক করুন" data-i18n-en="Drag 6-dot handle to reorder layers, or toggle lock & visibility">
              বাম পাশের ডট ধরে টেনে লেয়ার উপর-নিচ করুন, অথবা তালা ও চোখ আইকনে ক্লিক করুন
            </p>

            <div id="pcLayersStackList" class="space-y-1.5 max-h-[58dvh] overflow-y-auto pr-0.5"></div>
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

            <!-- Text Color ('A' with Color Bar) — Opens Anchored #pcColorPopover -->
            <button
              type="button"
              id="pcCtxTextColorBtn"
              class="inline-flex flex-col items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer relative"
              title="লেখার রঙ পরিবর্তন (Text Color)"
            >
              <span class="text-[12.5px] font-black text-slate-800 dark:text-white leading-none">A</span>
              <span id="pcCtxColorBar" class="w-4.5 h-1 rounded-full mt-0.5 border border-black/10" style="background:#fde047;"></span>
              <input type="color" id="pcCtxTextColorInput" value="#fde047" tabindex="-1" aria-hidden="true" class="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
            </button>

            <!-- Direct Selection Highlight Color Button — Opens Anchored #pcColorPopover -->
            <button
              type="button"
              id="pcCtxHighlightColorBtn"
              class="inline-flex flex-col items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer relative"
              title="নির্বাচিত শব্দের হাইলাইট রঙ পরিবর্তন"
            >
              <Icon name="lucide:highlighter" class="w-3.5 h-3.5 text-slate-700 dark:text-slate-100" />
              <span id="pcCtxHighlightColorBar" class="w-4.5 h-1 rounded-full mt-0.5 border border-black/10" style="background:#fde047;"></span>
            </button>

            <!-- Badge / Sticker Background Pill Color Tint — Opens Anchored #pcColorPopover -->
            <div id="pcCtxTextBgWrapper" class="inline-flex items-center" hidden>
              <button
                type="button"
                id="pcCtxTextBgBtn"
                class="inline-flex flex-col items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer relative"
                title="ব্যাজ বা স্টিকারের ব্যাকগ্রাউন্ড রঙ পরিবর্তন করুন"
              >
                <span class="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 leading-none">BG</span>
                <span id="pcCtxTextBgBar" class="w-4.5 h-1 rounded-full mt-0.5 border border-black/10" style="background:#b91c1c;"></span>
                <input type="color" id="pcCtxTextBgColorInput" value="#b91c1c" tabindex="-1" aria-hidden="true" class="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
              </button>
            </div>

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
            <button
              type="button"
              id="pcCtxPhotoReplaceBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
            >
              <Icon name="lucide:camera" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="ছবি বদলান" data-i18n-en="Replace">ছবি বদলান</span>
            </button>

            <label
              id="pcQuickPhoto2Label"
              hidden
              for="pcSecondPhotoInput"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-sky-600 text-white text-[11px] font-extrabold cursor-pointer"
            >
              <Icon name="lucide:images" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="২য় ছবি" data-i18n-en="2nd Photo">২য় ছবি</span>
            </label>

            <button
              type="button"
              id="pcCtxPhotoAdjustBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="ছবির উজ্জ্বলতা, কনট্রাস্ট, স্যাচুরেশন ও ব্লার অ্যাডজাস্ট করুন"
            >
              <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5" />
              <span data-i18n-bn="অ্যাডজাস্ট" data-i18n-en="Adjust">অ্যাডজাস্ট</span>
            </button>

            <button
              type="button"
              id="pcCtxPhotoBorderBtn"
              hidden
              class="inline-flex items-center gap-1 h-8 px-2 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="ভাসমান ছবির কর্নার রেডিয়াস ও বর্ডার"
            >
              <Icon name="lucide:square-round-corner" class="w-3.5 h-3.5" />
            </button>

            <div class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10">
              <span class="text-[10.5px] font-bold text-slate-500" data-i18n-bn="জুম" data-i18n-en="Zoom">জুম</span>
              <input type="range" id="pcCtxPhotoZoom" min="40" max="260" value="100" class="w-20 h-1.5 accent-[#2563eb] cursor-pointer" />
            </div>

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
            <label class="relative inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
              <span id="pcCtxShapeFillSwatch" class="w-4 h-4 rounded-full border border-black/15 shrink-0" style="background:#dc2626;"></span>
              <span data-i18n-bn="শেপ রঙ" data-i18n-en="Fill">শেপ রঙ</span>
              <input type="color" id="pcCtxShapeFillInput" value="#dc2626" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </label>
            <label class="relative inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10 cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200">
              <span id="pcCtxShapeStrokeSwatch" class="w-4 h-4 rounded-full border border-black/15 shrink-0" style="background:#ffffff;"></span>
              <span data-i18n-bn="বর্ডার রঙ" data-i18n-en="Border">বর্ডার রঙ</span>
              <input type="color" id="pcCtxShapeStrokeInput" value="#ffffff" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </label>
            <button
              type="button"
              id="pcCtxShapeBorderBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="বর্ডার পুরুত্ব, ড্যাশ স্টাইল ও কর্নার রেডিয়াস"
            >
              <Icon name="lucide:sliders-horizontal" class="w-3.5 h-3.5" />
              <span data-i18n-bn="বর্ডার ও কর্নার" data-i18n-en="Stroke & Corner">বর্ডার ও কর্নার</span>
            </button>
            <button
              type="button"
              id="pcCtxShapeEditTextBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
              title="শেপ বা ব্যাজের ভেতরের লেখা এডিট করুন"
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

          <!-- CONTEXT: VECTOR / ICON / SOCIAL / GRAPHIC TOOLS -->
          <div data-ctx-panel="vector" hidden class="inline-flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="pcCtxVectorFillBtn"
              class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="আইকন বা গ্রাফিক্সের মূল রঙ পরিবর্তন করুন"
            >
              <span id="pcCtxVectorFillSwatch" class="w-4 h-4 rounded-full border border-black/15 shrink-0" style="background:#2563eb;"></span>
              <span data-i18n-bn="রঙ ১" data-i18n-en="Color 1">রঙ ১</span>
            </button>
            <button
              type="button"
              id="pcCtxVectorStrokeBtn"
              class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="ব্যাকগ্রাউন্ড বা সেকেন্ডারি রঙ পরিবর্তন করুন"
            >
              <span id="pcCtxVectorStrokeSwatch" class="w-4 h-4 rounded-full border border-black/15 shrink-0" style="background:#ffffff;"></span>
              <span data-i18n-bn="রঙ ২ / BG" data-i18n-en="Color 2">রঙ ২ / BG</span>
            </button>
            <button
              type="button"
              id="pcCtxVectorEditTextBtn"
              hidden
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
              title="সোশ্যাল হ্যান্ডেল বা লেবেল এডিট করুন"
            >
              <Icon name="lucide:pencil" class="w-3 h-3 [&_*]:!stroke-white" />
              <span data-i18n-bn="হ্যান্ডেল এডিট" data-i18n-en="Edit Handle">হ্যান্ডেল এডিট</span>
            </button>
          </div>

          <!-- CONTEXT: LOGO TOOLS -->
          <div data-ctx-panel="logo" hidden class="inline-flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="pcCtxLogoChangeBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer"
            >
              <Icon name="lucide:shield-plus" class="w-3.5 h-3.5 [&_*]:!stroke-white" />
              <span data-i18n-bn="লোগো বদলান" data-i18n-en="Replace Logo">লোগো বদলান</span>
            </button>

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

          <!-- CONTEXT: LOCKED LAYER BANNER -->
          <div data-ctx-panel="locked" hidden class="inline-flex items-center gap-2 shrink-0">
            <span class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-amber-500/12 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span data-i18n-bn="এই লেয়ারটি লক করা আছে" data-i18n-en="Layer is locked">এই লেয়ারটি লক করা আছে</span>
            </span>
            <button
              type="button"
              id="pcCtxUnlockBannerBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-extrabold cursor-pointer transition"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
              <span data-i18n-bn="আনলক করুন" data-i18n-en="Unlock">আনলক করুন</span>
            </button>
          </div>

          <!-- CONTEXT: DEFAULT CARD TOOLS -->
          <div data-ctx-panel="card" class="inline-flex items-center gap-1.5 shrink-0">
            <div class="inline-flex items-center gap-1 px-1.5 h-8 rounded-lg bg-slate-100 dark:bg-[#10141d] border border-slate-200 dark:border-white/10">
              <label class="relative w-5 h-5 rounded-md overflow-hidden border border-black/15 cursor-pointer" title="প্রাইমারি রঙ">
                <input type="color" id="pcCtxPrimaryColor" value="#dc2626" class="w-7 h-7 -m-1 cursor-pointer border-0 p-0" />
              </label>
              <label class="relative w-5 h-5 rounded-md overflow-hidden border border-black/15 cursor-pointer" title="হাইলাইট রঙ">
                <input type="color" id="pcCtxAccentColor" value="#fde047" class="w-7 h-7 -m-1 cursor-pointer border-0 p-0" />
              </label>
              <label class="relative w-5 h-5 rounded-md overflow-hidden border border-black/15 cursor-pointer" title="ব্যাকগ্রাউন্ড রঙ">
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

          <!-- UNIVERSAL CANVA RIGHT-SIDE ACTION CONTROLS (Flip | Transparency | Position | Layers | Copy Style | Duplicate | Padlock | Delete) -->
          <div class="inline-flex items-center gap-1 pl-1.5 border-l border-slate-200/90 dark:border-white/12 shrink-0">
            <button
              type="button"
              id="pcTopFlipBtn"
              hidden
              class="inline-flex items-center gap-1 h-8 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="লেয়ার ফ্লিপ / মিরর করুন (Flip)"
            >
              <Icon name="lucide:flip-horizontal-2" class="w-3.5 h-3.5" />
              <span class="hidden xl:inline" data-i18n-bn="ফ্লিপ" data-i18n-en="Flip">ফ্লিপ</span>
            </button>

            <!-- Canva Checkerboard Transparency Button -->
            <button
              type="button"
              id="pcTopTransparencyBtn"
              class="inline-flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="ট্রান্সপারেন্সি / স্বচ্ছতা (Transparency 0–100%)"
            >
              <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-200" aria-hidden="true">
                <rect x="1" y="1" width="3.5" height="3.5" fill="currentColor" />
                <rect x="8" y="1" width="3.5" height="3.5" fill="currentColor" opacity="0.55" />
                <rect x="4.5" y="4.5" width="3.5" height="3.5" fill="currentColor" opacity="0.85" />
                <rect x="11.5" y="4.5" width="3.5" height="3.5" fill="currentColor" opacity="0.3" />
                <rect x="1" y="8" width="3.5" height="3.5" fill="currentColor" opacity="0.7" />
                <rect x="8" y="8" width="3.5" height="3.5" fill="currentColor" opacity="0.4" />
                <rect x="4.5" y="11.5" width="3.5" height="3.5" fill="currentColor" opacity="0.55" />
                <rect x="11.5" y="11.5" width="3.5" height="3.5" fill="currentColor" opacity="0.2" />
              </svg>
              <span id="pcTopTransparencyVal" class="font-mono text-[10.5px] font-extrabold">100%</span>
            </button>

            <!-- Canva Position Button -->
            <button
              type="button"
              id="pcTopPositionBtn"
              class="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#10141d] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/90 dark:border-white/12 text-[11px] font-extrabold text-slate-800 dark:text-white cursor-pointer transition"
              title="পজিশন, অ্যালাইনমেন্ট ও অর্ডার (Position)"
            >
              <span data-i18n-bn="পজিশন" data-i18n-en="Position">পজিশন</span>
            </button>

            <!-- Quick Layers Stack Button -->
            <button
              type="button"
              id="pcTopLayersBtn"
              class="inline-flex items-center gap-1 h-8 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="লেয়ার প্যানেল খুলুন (Layers)"
            >
              <Icon name="lucide:layers" class="w-3.5 h-3.5" />
              <span class="hidden md:inline" data-i18n-bn="লেয়ার" data-i18n-en="Layers">লেয়ার</span>
            </button>

            <!-- Paint Roller Copy Style -->
            <button
              type="button"
              id="pcTopCopyStyleBtn"
              hidden
              aria-pressed="false"
              class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 aria-pressed:bg-[#2563eb] aria-pressed:text-white inline-flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="স্টাইল কপি করুন (Copy Style)"
            >
              <Icon name="lucide:paint-roller" class="w-3.5 h-3.5" />
            </button>

            <!-- Duplicate -->
            <button
              type="button"
              id="pcTopDuplicateBtn"
              hidden
              class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer transition"
              title="ডুপ্লিকেট করুন (Duplicate)"
            >
              <Icon name="lucide:copy" class="w-3.5 h-3.5" />
            </button>

            <!-- Dynamic Open/Closed Padlock Button -->
            <button
              type="button"
              id="pcTopLockBtn"
              hidden
              aria-pressed="false"
              class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition"
              title="লক করুন (Lock)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 pointer-events-none"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            </button>

            <!-- Delete -->
            <button
              type="button"
              id="pcTopDeleteBtn"
              hidden
              class="w-8 h-8 rounded-lg hover:bg-rose-500/15 text-rose-600 inline-flex items-center justify-center cursor-pointer transition"
              title="মুছে ফেলুন (Delete)"
            >
              <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
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
                      aria-pressed="false"
                      class="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition"
                      title="লক করুন (Lock)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 pointer-events-none"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
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
                      <button
                        type="button"
                        id="pcMiniBgColorBtn"
                        class="w-5.5 h-5.5 rounded-full border border-slate-300 dark:border-white/20 cursor-pointer inline-flex items-center justify-center relative overflow-hidden"
                        title="রঙ (BG Color)"
                      >
                        <span id="pcMiniBgIndicator" class="w-full h-full rounded-full" style="background:#dc2626;"></span>
                        <input type="color" id="pcMiniBgColorInput" value="#dc2626" tabindex="-1" aria-hidden="true" class="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
                      </button>
                      <button
                        type="button"
                        id="pcMiniFgColorBtn"
                        class="w-5.5 h-5.5 rounded-full border border-slate-300 dark:border-white/20 cursor-pointer inline-flex items-center justify-center relative overflow-hidden"
                        title="টেক্সট রঙ (Text Color)"
                      >
                        <span id="pcMiniFgIndicator" class="w-full h-full rounded-full" style="background:#ffffff;"></span>
                        <input type="color" id="pcMiniFgColorInput" value="#ffffff" tabindex="-1" aria-hidden="true" class="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
                      </button>
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

                <!-- Invisible Backing Textarea + Live WYSIWYG On-Canvas Rich Text Editor + Floating Selection Highlight Pill -->
                <textarea
                  id="pcInlineEditor"
                  hidden
                  rows="2"
                  tabindex="-1"
                  aria-hidden="true"
                  class="absolute opacity-0 pointer-events-none w-px h-px overflow-hidden resize-none border-0 p-0"
                  placeholder="এখানে লিখুন..."
                ></textarea>

                <div
                  id="pcInlineRichEditor"
                  contenteditable="true"
                  spellcheck="false"
                  hidden
                  role="textbox"
                  aria-multiline="true"
                  aria-label="লাইভ টেক্সট এডিটর"
                  class="absolute z-30 outline-none ring-2 ring-[#2563eb] rounded-xs cursor-text select-text whitespace-pre-wrap break-words bg-transparent"
                ></div>

                <div
                  id="pcSelectionQuickBar"
                  hidden
                  class="pointer-events-auto absolute z-40 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/95 text-white shadow-xl border border-white/15 whitespace-nowrap"
                >
                  <span class="text-[9.5px] font-extrabold text-slate-300 pr-0.5" data-i18n-bn="হাইলাইট:" data-i18n-en="Highlight:">হাইলাইট:</span>
                  {#each ['#fde047', '#ef4444', '#22c55e', '#38bdf8', '#fb923c', '#ffffff'] as qHex}
                    <button
                      type="button"
                      data-quick-hi-swatch={qHex}
                      title={`হাইলাইট রঙ ${qHex}`}
                      class="w-4.5 h-4.5 rounded-full border border-white/35 cursor-pointer hover:scale-115 transition shrink-0"
                      style="background:{qHex};"
                    ></button>
                  {/each}
                  <button
                    type="button"
                    id="pcQuickMoreColorBtn"
                    title="কাস্টম হাইলাইট রঙ"
                    class="px-1.5 h-5 rounded-full bg-white/12 hover:bg-white/22 text-[9.5px] font-extrabold text-white cursor-pointer transition"
                  >+</button>
                  <button
                    type="button"
                    id="pcQuickHighlightModeBtn"
                    title="লেখা বনাম মার্কার বক্স স্টাইল পরিবর্তন"
                    class="px-1.5 h-5 rounded-full bg-amber-500/25 hover:bg-amber-500/40 text-[9.5px] font-extrabold text-amber-200 cursor-pointer transition"
                    data-i18n-bn="মার্কার"
                    data-i18n-en="Mode"
                  >মার্কার</button>
                  <button
                    type="button"
                    id="pcQuickClearHighlightBtn"
                    title="হাইলাইট মুছুন"
                    class="px-1.5 h-5 rounded-full bg-rose-500/25 hover:bg-rose-500/45 text-[9.5px] font-extrabold text-rose-200 cursor-pointer transition"
                  >✕</button>
                </div>
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
          <div class="h-px my-1 bg-slate-200/80 dark:bg-white/10"></div>
          <button
            type="button"
            data-open-layers-panel="1"
            class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-white/10 text-[#2563eb] dark:text-sky-300 font-extrabold transition cursor-pointer text-left"
          >
            <span class="inline-flex items-center gap-2">
              <Icon name="lucide:layers" class="w-3.5 h-3.5" />
              <span data-i18n-bn="সব লেয়ার দেখুন (Show layers)" data-i18n-en="Show layers">সব লেয়ার দেখুন (Show layers)</span>
            </span>
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

  <!-- ===============================================================
       ANCHORED CANVA-STYLE COLOR POPOVER (#pcColorPopover)
       Opens directly below whichever color trigger button was clicked,
       with viewport edge clamping — NEVER opens at (0, 0) corner!
       =============================================================== -->
  <div
    id="pcColorPopover"
    hidden
    role="dialog"
    aria-label="রঙ নির্বাচন করুন"
    style="position: fixed; z-index: 90;"
    class="w-[276px] p-3 rounded-2xl bg-white dark:bg-[#161b24] border border-slate-200/90 dark:border-white/15 shadow-2xl space-y-2.5 select-none"
  >
    <!-- 1. Header: Active Target Label + Reset + Close -->
    <div class="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/80 dark:border-white/10">
      <strong id="pcColorPopoverTitle" class="text-[12px] font-extrabold text-slate-900 dark:text-white">টেক্সট রঙ</strong>
      <div class="inline-flex items-center gap-1">
        <button
          type="button"
          id="pcColorPopoverResetBtn"
          class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer transition"
          title="ম্যানুয়াল রঙ মুছে টেমপ্লেটের ডিফল্ট অটো রঙে ফিরে যান"
        >↺ অটো / রিসেট</button>
        <button
          type="button"
          id="pcColorPopoverCloseBtn"
          class="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center text-[12px] font-bold text-slate-500 dark:text-slate-300 cursor-pointer"
          aria-label="বন্ধ করুন"
        >✕</button>
      </div>
    </div>

    <!-- 2. Active Brand Palette Row (shown when saved/active brand colors exist) -->
    <div id="pcColorPopoverBrandRow" hidden class="space-y-1">
      <span class="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400">ব্র্যান্ড প্যালেট:</span>
      <div id="pcColorPopoverBrandSwatches" class="flex items-center gap-1.5 flex-wrap"></div>
    </div>

    <!-- 3. 28-Color Curated Swatch Grid (White/Black + Pastels/Low-Sat + Editorial) -->
    <div id="pcColorPopoverSwatches" class="grid grid-cols-7 gap-1.5">
      {#each [
        '#ffffff', '#000000', '#e2e8f0', '#94a3b8', '#1e293b', '#0f172a', '#dcfce7',
        '#86efac', '#a7f3d0', '#bae6fd', '#c7d2fe', '#e9d5ff', '#fbcfe8', '#fecdd3',
        '#fed7aa', '#fef08a', '#00bd74', '#10b981', '#059669', '#0ea5e9', '#2563eb',
        '#7c3aed', '#ef4444', '#dc2626', '#991b1b', '#f97316', '#facc15', '#eab308'
      ] as swatchHex}
        <button
          type="button"
          data-pc-pop-swatch={swatchHex}
          title={swatchHex}
          class="w-7.5 h-7.5 rounded-lg border border-slate-300/90 dark:border-white/20 cursor-pointer hover:scale-110 transition shadow-2xs"
          style="background:{swatchHex};"
        ></button>
      {/each}
    </div>

    <!-- 4. Custom Color Spectrum + Live #RRGGBB Hex Input Row -->
    <div class="pt-1.5 border-t border-slate-200/80 dark:border-white/10 space-y-2">
      <div class="flex items-center gap-1.5">
        <span id="pcColorPopoverLivePreview" class="w-7 h-8 rounded-lg border border-slate-300 dark:border-white/20 shrink-0" style="background:#00bd74;"></span>
        <input
          type="text"
          id="pcColorPopoverHexInput"
          value="#00BD74"
          maxlength="7"
          spellcheck="false"
          placeholder="#00BD74"
          aria-label="Hex color code"
          class="w-24 h-8 px-2 rounded-lg bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/15 font-mono text-[11.5px] font-bold text-slate-900 dark:text-white uppercase outline-none focus:border-[#2563eb]"
        />
        <label
          class="relative overflow-hidden flex-1 h-8 px-2 rounded-lg text-white text-[10.5px] font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs"
          style="background: linear-gradient(90deg, #ef4444 0%, #f59e0b 22%, #10b981 48%, #0ea5e9 74%, #8b5cf6 100%);"
          title="যেকোনো কাস্টম রঙ (RGB / HSL Spectrum) বেছে নিন"
        >
          <span class="drop-shadow-xs truncate">+ কাস্টম রঙ (Spectrum)</span>
          <input
            type="color"
            id="pcColorPopoverNativeInput"
            value="#00bd74"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  </div>

  <!-- ===============================================================
       ANCHORED CANVA-STYLE MULTI-TOOL POPOVER (#pcToolPopover)
       Transparency (0–100%) | Spacing | Effects | Border & Corner | Photo Adjust | Flip
       =============================================================== -->
  <div
    id="pcToolPopover"
    hidden
    role="dialog"
    aria-label="লেয়ার টুল কন্ট্রোল"
    style="position: fixed; z-index: 90;"
    class="w-[272px] p-3 rounded-2xl bg-white dark:bg-[#161b24] border border-slate-200/90 dark:border-white/15 shadow-2xl space-y-2.5 select-none"
  >
    <div class="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/80 dark:border-white/10">
      <strong id="pcToolPopoverTitle" class="text-[12px] font-extrabold text-slate-900 dark:text-white">ট্রান্সপারেন্সি (স্বচ্ছতা)</strong>
      <button
        type="button"
        id="pcToolPopoverCloseBtn"
        class="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center justify-center text-[12px] font-bold text-slate-500 dark:text-slate-300 cursor-pointer"
        aria-label="বন্ধ করুন"
      >✕</button>
    </div>

    <!-- 1. TRANSPARENCY (0–100% Opacity Slider + Number Box) -->
    <div data-tool-pop-sec="transparency" class="space-y-2">
      <div class="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
        <span data-i18n-bn="স্বচ্ছতা (Transparency)" data-i18n-en="Transparency">স্বচ্ছতা (Transparency)</span>
      </div>
      <div class="flex items-center gap-2.5">
        <input type="range" id="pcPopOpacityRange" min="0" max="100" value="100" class="flex-1 h-1.5 accent-[#2563eb] cursor-pointer" />
        <div class="relative flex items-center w-16 shrink-0">
          <input
            type="number"
            id="pcPopOpacityInput"
            min="0"
            max="100"
            value="100"
            class="w-full h-8 pl-2 pr-5 rounded-lg bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/15 font-mono text-[11.5px] font-extrabold text-slate-900 dark:text-white outline-none focus:border-[#2563eb]"
          />
          <span class="absolute right-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">%</span>
        </div>
      </div>
    </div>

    <!-- 2. LINE SPACING -->
    <div data-tool-pop-sec="spacing" hidden class="space-y-2">
      <div class="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
        <span data-i18n-bn="লাইন উচ্চতা (Line spacing)" data-i18n-en="Line spacing">লাইন উচ্চতা (Line spacing)</span>
        <strong id="pcPopLineHeightVal" class="font-mono text-slate-900 dark:text-white">1.32</strong>
      </div>
      <input type="range" id="pcPopLineHeightRange" min="0.95" max="2.10" step="0.03" value="1.32" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
    </div>

    <!-- 3. TEXT EFFECTS -->
    <div data-tool-pop-sec="effects" hidden class="space-y-1.5">
      <span class="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400" data-i18n-bn="টেক্সট স্টাইল ইফেক্ট বেছে নিন:" data-i18n-en="Choose text effect:">টেক্সট স্টাইল ইফেক্ট বেছে নিন:</span>
      <div class="grid grid-cols-3 gap-1.5">
        {#each [
          { id: 'default', bn: 'ডিফল্ট', en: 'Default' },
          { id: 'shadow', bn: 'শ্যাডো', en: 'Shadow' },
          { id: 'lift', bn: 'লিফট', en: 'Lift' },
          { id: 'glow', bn: 'নিয়ন গ্লো', en: 'Glow' },
          { id: 'outline', bn: 'আউটলাইন', en: 'Outline' },
          { id: 'none', bn: 'সাধারণ', en: 'None' }
        ] as fx}
          <button
            type="button"
            data-pop-fx={fx.id}
            aria-pressed={fx.id === 'default' ? 'true' : 'false'}
            class="h-8.5 px-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 aria-pressed:border-[#2563eb] aria-pressed:bg-blue-500/12 aria-pressed:text-[#1d4ed8] dark:aria-pressed:text-sky-300 text-[10.5px] font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer transition"
            data-i18n-bn={fx.bn}
            data-i18n-en={fx.en}
          >{fx.bn}</button>
        {/each}
      </div>
    </div>

    <!-- 4. BORDER WEIGHT, DASH STYLE & CORNER ROUNDING -->
    <div data-tool-pop-sec="border" hidden class="space-y-2.5">
      <div class="grid grid-cols-3 gap-1.5">
        {#each [
          { id: 'solid', bn: 'সলিড', en: 'Solid' },
          { id: 'dashed', bn: 'ড্যাশড', en: 'Dashed' },
          { id: 'dotted', bn: 'ডটেড', en: 'Dotted' }
        ] as dsh}
          <button
            type="button"
            data-pop-dash={dsh.id}
            aria-pressed={dsh.id === 'solid' ? 'true' : 'false'}
            class="h-8 px-2 rounded-xl bg-slate-50 dark:bg-[#0f131b] border border-slate-200 dark:border-white/12 aria-pressed:border-[#2563eb] aria-pressed:bg-blue-500/12 text-[10.5px] font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer transition"
            data-i18n-bn={dsh.bn}
            data-i18n-en={dsh.en}
          >{dsh.bn}</button>
        {/each}
      </div>
      <div>
        <div class="flex justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
          <span data-i18n-bn="বর্ডার পুরুত্ব (Weight)" data-i18n-en="Border weight">বর্ডার পুরুত্ব (Weight)</span>
          <strong id="pcPopStrokeWidthVal" class="font-mono text-slate-900 dark:text-white">3px</strong>
        </div>
        <input type="range" id="pcPopStrokeWidthRange" min="0" max="20" value="3" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
      </div>
      <div>
        <div class="flex justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
          <span data-i18n-bn="কর্নার রাউন্ডিং (Corner)" data-i18n-en="Corner rounding">কর্নার রাউন্ডিং (Corner)</span>
          <strong id="pcPopRadiusVal" class="font-mono text-slate-900 dark:text-white">16px</strong>
        </div>
        <input type="range" id="pcPopRadiusRange" min="0" max="100" value="16" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
      </div>
    </div>

    <!-- 5. PHOTO ADJUSTMENTS (Brightness, Contrast, Saturation, Blur) -->
    <div data-tool-pop-sec="adjust" hidden class="space-y-2">
      <div>
        <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
          <span data-i18n-bn="উজ্জ্বলতা (Brightness)" data-i18n-en="Brightness">উজ্জ্বলতা (Brightness)</span>
          <strong id="pcPopBrightVal" class="font-mono text-slate-800 dark:text-white">100%</strong>
        </div>
        <input type="range" id="pcPopBrightRange" min="50" max="160" value="100" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
      </div>
      <div>
        <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
          <span data-i18n-bn="কনট্রাস্ট (Contrast)" data-i18n-en="Contrast">কনট্রাস্ট (Contrast)</span>
          <strong id="pcPopContrastVal" class="font-mono text-slate-800 dark:text-white">100%</strong>
        </div>
        <input type="range" id="pcPopContrastRange" min="50" max="170" value="100" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
      </div>
      <div>
        <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
          <span data-i18n-bn="রঙের ঘনত্ব (Saturation)" data-i18n-en="Saturation">রঙের ঘনত্ব (Saturation)</span>
          <strong id="pcPopSaturateVal" class="font-mono text-slate-800 dark:text-white">100%</strong>
        </div>
        <input type="range" id="pcPopSaturateRange" min="0" max="200" value="100" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
      </div>
      <div>
        <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-0.5">
          <span data-i18n-bn="ব্লার (Blur)" data-i18n-en="Blur">ব্লার (Blur)</span>
          <strong id="pcPopBlurVal" class="font-mono text-slate-800 dark:text-white">0px</strong>
        </div>
        <input type="range" id="pcPopBlurRange" min="0" max="16" value="0" class="w-full h-1.5 accent-[#2563eb] cursor-pointer" />
      </div>
      <button
        type="button"
        id="pcPopResetAdjustBtn"
        class="w-full h-7.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-[10.5px] font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer transition"
        data-i18n-bn="↺ অ্যাডজাস্টমেন্ট রিসেট"
        data-i18n-en="↺ Reset Adjustments"
      >↺ অ্যাডজাস্টমেন্ট রিসেট</button>
    </div>

    <!-- 6. FLIP LAYER (Horizontal / Vertical) -->
    <div data-tool-pop-sec="flip" hidden class="grid grid-cols-2 gap-1.5">
      <button
        type="button"
        id="pcPopFlipHBtn"
        aria-pressed="false"
        class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 aria-pressed:border-[#2563eb] aria-pressed:bg-blue-500/12 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition"
      >
        <Icon name="lucide:flip-horizontal-2" class="w-3.5 h-3.5" />
        <span data-i18n-bn="পাশাপাশি ফ্লিপ" data-i18n-en="Flip horizontal">পাশাপাশি ফ্লিপ</span>
      </button>
      <button
        type="button"
        id="pcPopFlipVBtn"
        aria-pressed="false"
        class="h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-[#0f131b] hover:border-[#2563eb] border border-slate-200 dark:border-white/12 aria-pressed:border-[#2563eb] aria-pressed:bg-blue-500/12 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition"
      >
        <Icon name="lucide:flip-vertical-2" class="w-3.5 h-3.5" />
        <span data-i18n-bn="উপর-নিচ ফ্লিপ" data-i18n-en="Flip vertical">উপর-নিচ ফ্লিপ</span>
      </button>
    </div>
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

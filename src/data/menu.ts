import { TOOLS, PDF_SUBTOOLS, IMAGE_SUBTOOLS, type ToolMeta } from './tools';

/**
 * Data model for the unified "টুলস" cascading menu (same on every page).
 * Icons are Lucide icon names rendered at build time through astro-icon.
 */
export interface MenuLeaf {
  id: string;
  href: string;
  title: string;
  desc?: string;
  icon: string;
  keywords: string;
  /** Tab id inside the parent studio (lets us switch in-page without a reload). */
  subTab?: string;
}

export interface MenuNode {
  id: ToolMeta['id'];
  title: string;
  desc: string;
  icon: string;
  color: ToolMeta['color'];
  keywords: string;
  href: string;
  /** Present only for studios that contain several sub-tools. */
  children?: MenuLeaf[];
}

const ROOT_ICONS: Record<ToolMeta['id'], string> = {
  bijoy: 'lucide:languages',
  pdf: 'lucide:file-text',
  image: 'lucide:image',
  calendar: 'lucide:calendar-days',
  age: 'lucide:cake',
  datecalc: 'lucide:calendar-clock',
  invoice: 'lucide:receipt',
};

const PDF_ICONS: Record<string, string> = {
  hub: 'lucide:layout-grid',
  merge: 'lucide:merge',
  split: 'lucide:split',
  compress: 'lucide:file-archive',
  organize: 'lucide:files',
  pdf2other: 'lucide:file-output',
  other2pdf: 'lucide:file-input',
};

const IMAGE_ICONS: Record<string, string> = {
  hub: 'lucide:layout-grid',
  resize: 'lucide:scaling',
  compress: 'lucide:file-down',
  crop: 'lucide:crop',
  convert: 'lucide:refresh-cw',
  combine: 'lucide:id-card',
  scan: 'lucide:scan-line',
  colors: 'lucide:palette',
};

export const MENU_TREE: MenuNode[] = TOOLS.map((t) => {
  const node: MenuNode = {
    id: t.id,
    title: t.title,
    desc: t.desc,
    icon: ROOT_ICONS[t.id],
    color: t.color,
    keywords: `${t.keywords} ${t.badge}`,
    href: t.href,
  };

  if (t.id === 'pdf') {
    node.children = [
      { id: 'pdf-hub', href: '/pdf', title: 'সব পিডিএফ টুলস', icon: PDF_ICONS.hub, keywords: 'home hub all হোম সব টুলস', subTab: 'hub' },
      ...PDF_SUBTOOLS.map((s) => ({
        id: `pdf-${s.tabId}`,
        href: `/pdf/${s.slug}`,
        title: s.title,
        icon: PDF_ICONS[s.tabId],
        keywords: `${s.seoTitle} ${s.slug}`,
        subTab: s.tabId,
      })),
    ];
  } else if (t.id === 'image') {
    node.children = [
      { id: 'image-hub', href: '/image', title: 'সব ইমেজ টুলস', icon: IMAGE_ICONS.hub, keywords: 'home hub all হোম সব টুলস', subTab: 'hub' },
      ...IMAGE_SUBTOOLS.map((s) => ({
        id: `image-${s.tabId}`,
        href: `/image/${s.slug}`,
        title: s.title,
        icon: IMAGE_ICONS[s.tabId],
        keywords: `${s.seoTitle} ${s.slug}`,
        subTab: s.tabId,
      })),
    ];
  }
  return node;
});

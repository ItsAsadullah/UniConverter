import { CATEGORIES, getToolsByCategory, type CategoryId, type CategoryMeta } from './tools';

export interface MenuLeaf {
  id: string;
  href: string;
  title: string;
  titleEn: string;
  desc?: string;
  descEn?: string;
  icon: string;
  keywords: string;
  subTab?: string;
}

export interface MenuNode {
  id: CategoryId;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  icon: string;
  color: CategoryMeta['color'];
  keywords: string;
  href: string;
  children: MenuLeaf[];
}

export const MENU_TREE: MenuNode[] = CATEGORIES.map((cat) => {
  const catTools = getToolsByCategory(cat.id);
  const children: MenuLeaf[] = [
    {
      id: `${cat.id}-hub`,
      href: cat.href,
      title: `সব ${cat.title}`,
      titleEn: `All ${cat.titleEn}`,
      icon: 'lucide:layout-grid',
      keywords: `home hub all হোম সব টুলস ${cat.title} ${cat.titleEn}`,
      subTab: 'hub'
    },
    ...catTools.map((t) => ({
      id: t.id,
      href: t.href,
      title: t.title,
      titleEn: t.titleEn,
      desc: t.desc,
      descEn: t.descEn,
      icon: t.lucideIcon,
      keywords: `${t.title} ${t.titleEn} ${t.keywords} ${t.badge}`
    }))
  ];

  return {
    id: cat.id,
    title: cat.title,
    titleEn: cat.titleEn,
    desc: cat.desc,
    descEn: cat.descEn,
    icon: cat.lucideIcon,
    color: cat.color,
    keywords: `${cat.title} ${cat.titleEn} ${cat.desc} ${cat.badge}`,
    href: cat.href,
    children
  };
});

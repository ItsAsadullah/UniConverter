<script lang="ts">
  import { LUCIDE_ICONS } from '../../data/lucide-icons';

  interface Props {
    name: string;
    class?: string;
    ariaHidden?: boolean;
  }

  let { name, class: className = 'w-4 h-4 shrink-0 stroke-[1.9]', ariaHidden = true }: Props = $props();
  let key = $derived(name.startsWith('lucide:') ? name.slice(7) : name);
  let svgBody = $derived(LUCIDE_ICONS[key] || '');
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  aria-hidden={ariaHidden ? 'true' : undefined}
>
  {@html svgBody}
</svg>

import type { DesignSystemConfig } from '@/types/design-system';

const HEROUI_COMPONENTS = [
  'Accordion', 'Alert', 'Autocomplete', 'Avatar', 'Badge', 'Breadcrumbs', 'Button',
  'Calendar', 'Card', 'Checkbox', 'Chip', 'Code', 'DateInput', 'DatePicker', 'Divider',
  'Drawer', 'Dropdown', 'Form', 'Image', 'Input', 'InputOTP', 'Kbd', 'Link', 'Listbox',
  'Menu', 'Modal', 'Navbar', 'NumberInput', 'Pagination', 'Popover', 'Progress', 'Radio',
  'ScrollShadow', 'Select', 'Skeleton', 'Slider', 'Snippet', 'Spacer', 'Spinner',
  'Switch', 'Table', 'Tabs', 'Toast', 'Tooltip', 'User',
];

// Full design system derived from Figma tokens (shared by the team)
const HEROUI_PRESET_CONTEXT = `DESIGN SYSTEM CONTEXT: Custom HeroUI-based design system

COMPONENTS (47 total): ${HEROUI_COMPONENTS.join(', ')}

KEY COMPONENT PATTERNS:
- Card: wraps content sections. Use Card > CardHeader / CardBody / CardFooter structure.
- Modal / Drawer: overlays. Modal for blocking dialogs, Drawer for side panels.
- Tabs: in-page navigation between views.
- Navbar: top-level app navigation with NavbarBrand, NavbarContent, NavbarItem.
- Table: structured data with TableHeader, TableColumn, TableBody, TableRow, TableCell.
- Dropdown / Select: choice inputs. Dropdown for actions, Select for form fields.
- Chip: inline tags, status labels, filters.
- Badge: counts and notifications (wraps another component).
- Alert: inline status messages (success/warning/danger/default variants).
- Toast: ephemeral notifications (triggered programmatically).
- Skeleton: loading placeholders — wrap components during loading states.
- Avatar: user profile pictures with fallback initials.
- Autocomplete: searchable Select for large lists.
- Input / NumberInput: form text/number fields. Always use inside Form.
- Switch / Checkbox / Radio: boolean and option inputs.
- Progress: linear progress bars for tasks and loading.
- Spinner: circular loading indicator (small elements).
- Pagination: page navigation for tables and lists.
- Popover / Tooltip: contextual overlays. Tooltip for labels, Popover for interactive content.

SEMANTIC COLOR TOKENS (dark mode — primary theme):
- background: #060607 (near-black)
- surface: #18181b (eclipse — cards, modals, panels)
- surfaceSecondary: #232325
- surfaceTertiary: #262728
- foreground: #fcfcfc (snow — primary text)
- foregroundMuted: #a1a1aa (secondary text)
- accent (primary): #0485f7 (blue)
- accentHover: #3592f9
- border: #28282c
- separator: #1a1a1d
- success: #17c964 (green)
- warning: #f7b750 (amber)
- danger: #db3b3e (red)
- fieldBackground: #18181b (eclipse)
- fieldBorder: transparent (borderless inputs)
- fieldRadius: 12px

LIGHT MODE SEMANTIC TOKENS:
- background: #f5f5f5
- surface: #ffffff (white)
- foreground: #18181b (eclipse)
- foregroundMuted: #71717a

CUSTOM BRAND COLORS (beyond Tailwind base):
- eclipse: #18181b (dark surface/background)
- snow: #fcfcfc (lightest white)
- jade: #3bce76 (custom green, 50–950 scale)
- coral: #ffb22c (custom amber, 50–950 scale)
- ruby: #ef4437 (custom red, 50–950 scale)

TYPOGRAPHY:
- Font: Inter
- Weights: Regular, Medium, SemiBold, Bold, ExtraBold
- Scale: xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30), 4xl(36)
- Letter spacing: 0

BORDER RADIUS:
- xs: 2px, sm: 4px, md: 6px, lg: 8px, xl: 12px, 2xl: 16px, 3xl: 24px, full: 9999px
- Default field radius: 12px (rounded-xl)

IMPORTANT: When naming UI components in screen descriptions, use ONLY component names from the list above. Reference token names (accent, surface, foregroundMuted, etc.) when describing colors.`;

export function buildDesignSystemContext(ds: DesignSystemConfig | undefined): string {
  if (!ds) return '';

  if (ds.type === 'preset' && ds.name === 'heroui') {
    return HEROUI_PRESET_CONTEXT;
  }

  if (ds.type === 'figma-tokens') {
    const components = ds.componentNames.length > 0
      ? `Available components: [${ds.componentNames.join(', ')}]`
      : `Available components: [${HEROUI_COMPONENTS.join(', ')}]`;
    const colors = Object.entries(ds.colorTokens).slice(0, 30)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    return `DESIGN SYSTEM CONTEXT:
${components}
${colors ? `Color tokens: {${colors}}` : ''}

IMPORTANT: When naming UI components in screen descriptions, you MUST use the exact component names listed above.`.trim();
  }

  if (ds.type === 'text') {
    return `DESIGN SYSTEM CONTEXT:
${ds.description}

IMPORTANT: When naming UI components, reference only components described above.`.trim();
  }

  return '';
}

export function parseFigmaTokens(rawJson: string): {
  componentNames: string[];
  colorTokens: Record<string, string>;
  spacingTokens: Record<string, string>;
} {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid JSON');
  }

  const componentNames: string[] = [];
  const colorTokens: Record<string, string> = {};
  const spacingTokens: Record<string, string> = {};

  function traverse(obj: Record<string, unknown>, path: string[] = []) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const v = value as Record<string, unknown>;

        if ('value' in v && 'type' in v) {
          const type = v.type as string;
          const val = v.value as string;

          if (type === 'color') {
            colorTokens[currentPath.join('.')] = val;
          } else if (type === 'spacing' || type === 'dimension') {
            spacingTokens[currentPath.join('.')] = val;
          } else if (type === 'composition' || currentPath[0]?.toLowerCase() === 'components') {
            componentNames.push(currentPath.slice(-1)[0]);
          }
        } else {
          if (key.toLowerCase() === 'components' || key.toLowerCase() === 'component') {
            for (const compName of Object.keys(v)) {
              componentNames.push(compName);
            }
          }
          traverse(v, currentPath);
        }
      }
    }
  }

  traverse(parsed);

  return { componentNames: [...new Set(componentNames)], colorTokens, spacingTokens };
}

// The icons of the tools: Tabler Icons 3.49.0 (outline, from the npm
// package @tabler/icons-react; ui-revise7 8'). The icons are decorative, next
// to a text or in a button with a name, so they are hidden from assistive
// technology (as the Heroicons components used before were).
import {
  IconAlertCircle as AlertCircle,
  IconAlertTriangle as AlertTriangle,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconCircleCheck as CircleCheck,
  IconClipboard as Clipboard,
  IconFilePlus as FilePlus,
  IconInfoCircle as InfoCircle,
  IconPhoto as Photo,
  IconPlus as Plus,
  IconRefresh as Refresh,
  IconShieldCheck as ShieldCheck,
  IconX as X,
  type IconProps,
  type TablerIcon,
} from "@tabler/icons-react";

const decorative = (Icon: TablerIcon) => {
  const Decorative = (props: IconProps) => (
    <Icon aria-hidden="true" {...props} />
  );
  Decorative.displayName = Icon.displayName;
  return Decorative;
};

export const IconAlertCircle = decorative(AlertCircle);
export const IconAlertTriangle = decorative(AlertTriangle);
export const IconCheck = decorative(Check);
export const IconChevronDown = decorative(ChevronDown);
export const IconCircleCheck = decorative(CircleCheck);
export const IconClipboard = decorative(Clipboard);
export const IconFilePlus = decorative(FilePlus);
export const IconInfoCircle = decorative(InfoCircle);
export const IconPhoto = decorative(Photo);
export const IconPlus = decorative(Plus);
export const IconRefresh = decorative(Refresh);
export const IconShieldCheck = decorative(ShieldCheck);
export const IconX = decorative(X);

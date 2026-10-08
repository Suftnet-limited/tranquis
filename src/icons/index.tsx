import React from 'react'
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg'

// ─── Icon set ─────────────────────────────────────────────────────────────────
// Stroke-based outline icons on a 24×24 grid (same style as NailBid/Kronos).
// Size and colour come from the caller; tab bar icons get their active/inactive
// tint from screenOptions in (tabs)/_layout.tsx.

export interface IconProps {
  size?:        number
  color?:       string
  strokeWidth?: number
}

export type IconComponent = React.FC<IconProps>

type Shape = (p: { color: string; strokeWidth: number }) => React.ReactNode

const line = (color: string, strokeWidth: number) =>
  ({ stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' })

function make(shape: Shape): IconComponent {
  return ({ size = 24, color = '#000', strokeWidth = 2 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {shape({ color, strokeWidth })}
    </Svg>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export const TranslateIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M4 5h9M8.5 3v2M11 5c-.6 3.6-3 6.6-6.5 8.2" {...line(color, strokeWidth)} />
    <Path d="M6.5 9c1 1.9 2.7 3.4 4.7 4.2" {...line(color, strokeWidth)} />
    <Path d="M12.5 21l4-9.5 4 9.5M14 17.5h5" {...line(color, strokeWidth)} />
  </>
))

export const MicIcon = make(({ color, strokeWidth }) => (
  <>
    <Rect x="9" y="2.5" width="6" height="12" rx="3" {...line(color, strokeWidth)} />
    <Path d="M19 11a7 7 0 01-14 0M12 18v3.5M8.5 21.5h7" {...line(color, strokeWidth)} />
  </>
))

export const CameraIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M3 8.5A1.5 1.5 0 014.5 7h2.3l1.6-2.4h7.2L17.2 7h2.3A1.5 1.5 0 0121 8.5v10a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5z" {...line(color, strokeWidth)} />
    <Circle cx="12" cy="13" r="3.6" {...line(color, strokeWidth)} />
  </>
))

export const BookIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5z" {...line(color, strokeWidth)} />
    <Path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" {...line(color, strokeWidth)} />
  </>
))

export const ClockIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="9" {...line(color, strokeWidth)} />
    <Polyline points="12 7 12 12 15.5 14" {...line(color, strokeWidth)} />
  </>
))

export const GearIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="3" {...line(color, strokeWidth)} />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...line(color, strokeWidth)} />
  </>
))

// ─── Arrows & chevrons ────────────────────────────────────────────────────────

export const ArrowRightIcon = make(({ color, strokeWidth }) => <Path d="M5 12h14M13 6l6 6-6 6" {...line(color, strokeWidth)} />)
export const ArrowLeftIcon  = make(({ color, strokeWidth }) => <Path d="M19 12H5M11 18l-6-6 6-6" {...line(color, strokeWidth)} />)
export const ArrowDownIcon  = make(({ color, strokeWidth }) => <Path d="M12 5v14M6 13l6 6 6-6" {...line(color, strokeWidth)} />)
export const ChevronDownIcon  = make(({ color, strokeWidth }) => <Path d="M6 9l6 6 6-6" {...line(color, strokeWidth)} />)
export const ChevronUpIcon    = make(({ color, strokeWidth }) => <Path d="M18 15l-6-6-6 6" {...line(color, strokeWidth)} />)
export const ChevronRightIcon = make(({ color, strokeWidth }) => <Path d="M9 18l6-6-6-6" {...line(color, strokeWidth)} />)
export const SwapIcon = make(({ color, strokeWidth }) => (
  <Path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" {...line(color, strokeWidth)} />
))

// ─── Actions ──────────────────────────────────────────────────────────────────

export const XIcon     = make(({ color, strokeWidth }) => <Path d="M18 6L6 18M6 6l12 12" {...line(color, strokeWidth)} />)
export const CheckIcon = make(({ color, strokeWidth }) => <Path d="M20 6L9 17l-5-5" {...line(color, strokeWidth)} />)
export const PlusIcon  = make(({ color, strokeWidth }) => <Path d="M12 5v14M5 12h14" {...line(color, strokeWidth)} />)
export const XCircleIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="9" {...line(color, strokeWidth)} />
    <Path d="M15 9l-6 6M9 9l6 6" {...line(color, strokeWidth)} />
  </>
))
export const CopyIcon = make(({ color, strokeWidth }) => (
  <>
    <Rect x="9" y="9" width="12" height="12" rx="2" {...line(color, strokeWidth)} />
    <Path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" {...line(color, strokeWidth)} />
  </>
))
export const ClipboardIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" {...line(color, strokeWidth)} />
    <Rect x="8" y="2" width="8" height="4" rx="1" {...line(color, strokeWidth)} />
  </>
))
export const BookmarkIcon = make(({ color, strokeWidth }) => (
  <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" {...line(color, strokeWidth)} />
))
export const StarIcon = make(({ color, strokeWidth }) => (
  <Path d="M12 2.8l2.84 5.76 6.36.93-4.6 4.48 1.08 6.33L12 17.31 6.32 20.3l1.08-6.33-4.6-4.48 6.36-.93z" {...line(color, strokeWidth)} />
))
export const SpeakerIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M11 5L6 9H2.5v6H6l5 4z" {...line(color, strokeWidth)} />
    <Path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" {...line(color, strokeWidth)} />
  </>
))
export const TrashIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" {...line(color, strokeWidth)} />
    <Path d="M10 11v6M14 11v6" {...line(color, strokeWidth)} />
  </>
))
export const SearchIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="11" cy="11" r="7" {...line(color, strokeWidth)} />
    <Path d="M21 21l-4.35-4.35" {...line(color, strokeWidth)} />
  </>
))
export const StopIcon = make(({ color, strokeWidth }) => (
  <Rect x="6" y="6" width="12" height="12" rx="2.5" stroke={color} strokeWidth={strokeWidth} fill={color} />
))
export const ImageIcon = make(({ color, strokeWidth }) => (
  <>
    <Rect x="3" y="3" width="18" height="18" rx="2.5" {...line(color, strokeWidth)} />
    <Circle cx="8.5" cy="8.5" r="1.5" {...line(color, strokeWidth)} />
    <Path d="M21 15l-5-5L5 21" {...line(color, strokeWidth)} />
  </>
))
export const CropIcon = make(({ color, strokeWidth }) => (
  <Path d="M6.13 1L6 16a2 2 0 002 2h15M1 6.13L16 6a2 2 0 012 2v15" {...line(color, strokeWidth)} />
))
export const ZapIcon = make(({ color, strokeWidth }) => (
  <Path d="M13 2L3 14h9l-1 8 10-12h-9z" {...line(color, strokeWidth)} />
))
export const SparkleIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" {...line(color, strokeWidth)} />
    <Path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" {...line(color, strokeWidth)} />
  </>
))

// ─── People, places, things ───────────────────────────────────────────────────

export const UserIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="8" r="4" {...line(color, strokeWidth)} />
    <Path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" {...line(color, strokeWidth)} />
  </>
))
export const MailIcon = make(({ color, strokeWidth }) => (
  <>
    <Rect x="2.5" y="4.5" width="19" height="15" rx="2" {...line(color, strokeWidth)} />
    <Path d="M3 6.5l9 6.5 9-6.5" {...line(color, strokeWidth)} />
  </>
))
export const LockIcon = make(({ color, strokeWidth }) => (
  <>
    <Rect x="4" y="10.5" width="16" height="10.5" rx="2" {...line(color, strokeWidth)} />
    <Path d="M8 10.5V7a4 4 0 018 0v3.5" {...line(color, strokeWidth)} />
  </>
))
export const EyeIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" {...line(color, strokeWidth)} />
    <Circle cx="12" cy="12" r="3" {...line(color, strokeWidth)} />
  </>
))
export const EyeOffIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M17.9 17.9A10.1 10.1 0 0112 19.5C5.5 19.5 1.5 12 1.5 12a18.4 18.4 0 015.1-5.9M9.9 4.7A9.6 9.6 0 0112 4.5c6.5 0 10.5 7.5 10.5 7.5a18.6 18.6 0 01-2.2 3.2" {...line(color, strokeWidth)} />
    <Path d="M14.1 14.1a3 3 0 01-4.2-4.2M2 2l20 20" {...line(color, strokeWidth)} />
  </>
))
export const GlobeIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="9" {...line(color, strokeWidth)} />
    <Path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" {...line(color, strokeWidth)} />
  </>
))
export const MapPinIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" {...line(color, strokeWidth)} />
    <Circle cx="12" cy="10" r="3" {...line(color, strokeWidth)} />
  </>
))
export const BriefcaseIcon = make(({ color, strokeWidth }) => (
  <>
    <Rect x="2.5" y="7" width="19" height="13.5" rx="2" {...line(color, strokeWidth)} />
    <Path d="M16 20.5V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v15.5" {...line(color, strokeWidth)} />
  </>
))
export const SmileIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="9" {...line(color, strokeWidth)} />
    <Path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" {...line(color, strokeWidth)} />
  </>
))
export const TrendUpIcon = make(({ color, strokeWidth }) => (
  <Path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" {...line(color, strokeWidth)} />
))
export const TypeIcon = make(({ color, strokeWidth }) => (
  <Path d="M4 7V4h16v3M9 20h6M12 4v16" {...line(color, strokeWidth)} />
))
export const InfoIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="9" {...line(color, strokeWidth)} />
    <Path d="M12 16v-4M12 8h.01" {...line(color, strokeWidth)} />
  </>
))
export const HelpCircleIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="9" {...line(color, strokeWidth)} />
    <Path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" {...line(color, strokeWidth)} />
  </>
))
export const ShieldIcon = make(({ color, strokeWidth }) => (
  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...line(color, strokeWidth)} />
))
export const FileTextIcon = make(({ color, strokeWidth }) => (
  <>
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" {...line(color, strokeWidth)} />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" {...line(color, strokeWidth)} />
  </>
))
export const LogOutIcon = make(({ color, strokeWidth }) => (
  <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" {...line(color, strokeWidth)} />
))
export const SunIcon = make(({ color, strokeWidth }) => (
  <>
    <Circle cx="12" cy="12" r="4" {...line(color, strokeWidth)} />
    <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" {...line(color, strokeWidth)} />
  </>
))
export const DeviceIcon = make(({ color, strokeWidth }) => (
  <>
    <Rect x="6" y="2" width="12" height="20" rx="2.5" {...line(color, strokeWidth)} />
    <Path d="M11 18h2" {...line(color, strokeWidth)} />
  </>
))
export const MoonIcon = make(({ color, strokeWidth }) => (
  <Path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" {...line(color, strokeWidth)} />
))

// Looks up an icon by the short names stored in data (tones, help items…)
export const ICONS = {
  translate: TranslateIcon, mic: MicIcon, camera: CameraIcon, book: BookIcon, clock: ClockIcon,
  gear: GearIcon, 'arrow-right': ArrowRightIcon, 'arrow-left': ArrowLeftIcon, 'arrow-down': ArrowDownIcon,
  'chevron-down': ChevronDownIcon, 'chevron-up': ChevronUpIcon, 'chevron-right': ChevronRightIcon,
  swap: SwapIcon, x: XIcon, check: CheckIcon, plus: PlusIcon, 'x-circle': XCircleIcon, copy: CopyIcon,
  clipboard: ClipboardIcon, bookmark: BookmarkIcon, star: StarIcon, speaker: SpeakerIcon, trash: TrashIcon,
  search: SearchIcon, stop: StopIcon, image: ImageIcon, crop: CropIcon, zap: ZapIcon, sparkle: SparkleIcon,
  user: UserIcon, mail: MailIcon, lock: LockIcon, eye: EyeIcon, 'eye-off': EyeOffIcon, globe: GlobeIcon,
  'map-pin': MapPinIcon, briefcase: BriefcaseIcon, smile: SmileIcon, 'trending-up': TrendUpIcon, type: TypeIcon,
  info: InfoIcon, help: HelpCircleIcon, shield: ShieldIcon, 'file-text': FileTextIcon, 'log-out': LogOutIcon,
  sun: SunIcon, moon: MoonIcon, device: DeviceIcon,
} satisfies Record<string, IconComponent>

export type IconName = keyof typeof ICONS

export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Component = ICONS[name]
  return <Component {...props} />
}

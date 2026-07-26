import type { CSSProperties } from 'react'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
  fill?: string
  style?: CSSProperties
}

const base = (size: number, color: string, sw: number, fill: string, style?: CSSProperties) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill,
  stroke: color,
  strokeWidth: sw,
  style,
})

export const Home = ({ size = 23, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
)

export const Calendar = ({ size = 23, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
)

export const Activity = ({ size = 23, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </svg>
)

export const Book = ({ size = 23, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" />
    <path d="M18 7a3 3 0 0 1 3-3v16" />
  </svg>
)

export const Plus = ({ size = 15, color = 'currentColor', strokeWidth = 2.6 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Minus = ({ size = 20, color = 'currentColor', strokeWidth = 2.6 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M5 12h14" />
  </svg>
)

export const Close = ({ size = 15, color = 'currentColor', strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

export const Check = ({ size = 12, color = '#fff', strokeWidth = 3, style }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none', style)}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

export const ChevronLeft = ({ size = 16, color = 'currentColor', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

export const ChevronRight = ({ size = 18, color = 'currentColor', strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const Search = ({ size = 16, color = '#BDB6A6', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
)

export const Flame = ({ size = 13, color = '#E4572E', strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M12 3s6 5 6 9a6 6 0 0 1-12 0c0-2 1-3 1-3s0 2 2 2c1.5 0 1-3 3-6z" />
  </svg>
)

export const Star = ({ size = 15, color = '#EFA23C', strokeWidth = 2.4 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2-6.3-4.6L5.7 21l2.3-7.2-6-4.4h7.6z" />
  </svg>
)

export const Cart = ({ size = 14, color = '#fff', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M6 6h15l-1.5 9h-12z" />
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M6 6L5 3H2" />
  </svg>
)

export const Utensils = ({ size = 16, color = '#EFA23C', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3c-1.5 0-2 2-2 5s.5 4 2 4 2-1 2-4-.5-5-2-5zM17 12v9" />
  </svg>
)

export const Sparkle = ({ size = 20, color = '#fff', strokeWidth = 1.9 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M5 3v4M3 5h4M6 17v4M4 19h4" />
    <path d="M13 4l2.5 6.5L22 13l-6.5 2.5L13 22l-2.5-6.5L4 13l6.5-2.5z" />
  </svg>
)

export const Barcode = ({ size = 19, color = '#2E9E5B', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14" />
  </svg>
)

export const Grid = ({ size = 19, color = '#2E9E5B', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M4 4h16v5H4zM4 9v11h16V9" />
    <path d="M9 13h6" />
  </svg>
)

export const Pencil = ({ size = 19, color = '#2E9E5B', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M12 20h9M4 20l1-4L16 5l3 3L8 19z" />
  </svg>
)

export const Info = ({ size = 26, color = '#2E9E5B', strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
)

export const Copy = ({ size = 15, color = '#2E9E5B', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
)

export const Download = ({ size = 16, color = '#2E9E5B', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />
  </svg>
)

export const Upload = ({ size = 16, color = '#2E9E5B', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M12 17V5M7 9l5-5 5 5M4 21h16" />
  </svg>
)

export const Share = ({ size = 15, color = '#fff', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
)

export const Refresh = ({ size = 18, color = '#2E9E5B', strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, color, strokeWidth, 'none')}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
)

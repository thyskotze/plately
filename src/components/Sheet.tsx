import type { ReactNode } from 'react'
import { COLORS } from '../tokens'

interface SheetProps {
  zIndex: number
  onScrim?: () => void
  children: ReactNode
  /** When true the sheet body scrolls internally (used by tall sheets). */
  scroll?: boolean
  maxHeight?: string
}

/**
 * Shared bottom-sheet scaffold: full-bleed scrim + slide-up panel with grabber.
 * Replaces the prototype's repeated overlay markup.
 */
export default function Sheet({
  zIndex,
  onScrim,
  children,
  scroll = false,
  maxHeight,
}: SheetProps) {
  return (
    <div
      onClick={onScrim}
      style={{
        position: 'absolute',
        inset: 0,
        background: COLORS.scrim,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fade .2s',
      }}
    >
      <div
        className={scroll ? 'noscroll' : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.appBg,
          borderRadius: '26px 26px 0 0',
          padding: '16px 22px 26px',
          maxHeight: maxHeight ?? (scroll ? '92%' : undefined),
          overflowY: scroll ? 'auto' : undefined,
          animation: 'slideup .28s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            background: '#DDD5C6',
            borderRadius: 99,
            margin: '0 auto 14px',
          }}
        />
        {children}
      </div>
    </div>
  )
}

/** Small round close button used in sheet headers. */
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: '#fff',
        border: `1px solid ${COLORS.cardBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flex: 'none',
      }}
    >
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={COLORS.ink} strokeWidth={2.4}>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </div>
  )
}

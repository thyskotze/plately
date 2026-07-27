import { useRef, useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { Download, Upload, Star, Refresh, Utensils, Share } from '../../icons'
import { forceUpdate } from '../../lib/update'

export default function ProfileSheet() {
  const show = useStore((s) => s.overlay === 'profile')
  const close = useStore((s) => s.closeOverlay)
  const openGoals = useStore((s) => s.openGoals)
  const openSlots = useStore((s) => s.openSlots)
  const openHelp = useStore((s) => s.openHelp)
  const exportBackup = useStore((s) => s.exportBackup)
  const exportLibrary = useStore((s) => s.exportLibrary)
  const importBackup = useStore((s) => s.importBackup)
  const reopenIntro = useStore((s) => s.reopenIntro)
  const checkForUpdate = useStore((s) => s.checkForUpdate)
  const showToast = useStore((s) => s.showToast)

  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  // 'idle' | 'checking' | 'prompt' (new version found, asking to export first)
  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'prompt'>('idle')

  if (!show) return null

  const onCheckUpdate = async () => {
    if (updateState === 'checking') return
    setUpdateState('checking')
    const isNew = await checkForUpdate()
    if (isNew) {
      setUpdateState('prompt')
    } else {
      setUpdateState('idle')
      showToast('You’re on the latest version')
    }
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setErr(null)
      setPending(String(reader.result ?? ''))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const doImport = (mode: 'merge' | 'replace') => {
    if (!pending) return
    const res = importBackup(pending, mode)
    if (!res.ok) {
      setErr(res.msg)
      return
    }
    setPending(null)
  }

  const rowBtn = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onClick: () => void,
  ) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 14,
        padding: '13px 14px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: COLORS.greenTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: '700 13px Figtree, sans-serif', color: COLORS.ink }}>{title}</div>
        <div style={{ font: '500 11px/1.4 Figtree, sans-serif', color: ink(0.55) }}>{subtitle}</div>
      </div>
    </div>
  )

  return (
    <Sheet zIndex={60} onScrim={close} scroll>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque', sans-serif", color: COLORS.ink }}>Profile</div>
          <div style={{ font: '500 11.5px Figtree, sans-serif', color: ink(0.5) }}>
            Everything stays on this device.
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {rowBtn(
          <Star size={18} color={COLORS.green} />,
          'Your goals',
          'Daily calorie & protein targets',
          openGoals,
        )}
        {rowBtn(
          <Utensils size={18} color={COLORS.green} />,
          'Your meals',
          'Add, rename or reorder your meal slots',
          openSlots,
        )}
        {rowBtn(
          <Download size={18} color={COLORS.green} />,
          'Export backup',
          'Save a copy of everything (foods, meals, weight, goals) as a file you can keep or move to another phone.',
          exportBackup,
        )}
        {rowBtn(
          <Share size={18} color={COLORS.green} />,
          'Share your library',
          'Save your foods & your own meals as a file to send a friend. They open Import backup → Merge to add it to theirs.',
          exportLibrary,
        )}
        {rowBtn(
          <Upload size={18} color={COLORS.green} />,
          'Import backup',
          'Restore a backup — or add a library a friend shared. Choose Merge to add to what’s here, or Replace to overwrite.',
          () => fileRef.current?.click(),
        )}
        {rowBtn(
          <span style={{ font: '700 15px Figtree', color: COLORS.green }}>?</span>,
          'Help & how-to',
          'A quick manual for everything in Plately',
          openHelp,
        )}
        {rowBtn(
          <span style={{ font: '700 15px Figtree', color: COLORS.green }}>↻</span>,
          'Replay walkthrough',
          'Show the welcome intro again',
          () => {
            reopenIntro()
            close()
          },
        )}
        {rowBtn(
          <Refresh size={18} color={COLORS.green} />,
          'Check for updates',
          updateState === 'checking'
            ? 'Checking…'
            : 'See if a newer version is available (your data is kept).',
          onCheckUpdate,
        )}
      </div>

      {updateState === 'prompt' && (
        <div
          style={{
            marginTop: 14,
            background: '#fff',
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ font: '700 12.5px Figtree', color: COLORS.ink, marginBottom: 4 }}>
            A new version is available
          </div>
          <div style={{ font: '500 11px/1.5 Figtree', color: ink(0.6), marginBottom: 12 }}>
            Updating keeps your data on this device — but export a backup first, just in case.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              onClick={exportBackup}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: 11,
                borderRadius: 12,
                background: '#fff',
                border: `1px solid ${COLORS.inputBorder}`,
                font: '700 12px Figtree',
                color: COLORS.ink,
                cursor: 'pointer',
              }}
            >
              Export backup
            </div>
            <div
              onClick={() => forceUpdate()}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: 11,
                borderRadius: 12,
                background: COLORS.green,
                font: '700 12px Figtree',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Update now
            </div>
          </div>
          <div
            onClick={() => setUpdateState('idle')}
            style={{
              textAlign: 'center',
              marginTop: 8,
              font: '600 11px Figtree',
              color: ink(0.45),
              cursor: 'pointer',
            }}
          >
            Not now
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} style={{ display: 'none' }} />

      {pending && (
        <div
          style={{
            marginTop: 14,
            background: '#fff',
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ font: '600 12.5px Figtree, sans-serif', color: COLORS.ink, marginBottom: 10 }}>
            Import this backup — how?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              onClick={() => doImport('merge')}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: 12,
                borderRadius: 12,
                background: COLORS.green,
                font: '700 12.5px Figtree, sans-serif',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Merge
            </div>
            <div
              onClick={() => doImport('replace')}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: 12,
                borderRadius: 12,
                background: '#fff',
                border: `1px solid ${COLORS.inputBorder}`,
                font: '700 12.5px Figtree, sans-serif',
                color: COLORS.ink,
                cursor: 'pointer',
              }}
            >
              Replace
            </div>
          </div>
        </div>
      )}

      {err && (
        <div style={{ marginTop: 10, font: '500 11.5px Figtree, sans-serif', color: '#E4572E' }}>{err}</div>
      )}

      <div
        style={{
          marginTop: 16,
          font: '500 11px/1.5 Figtree, sans-serif',
          color: ink(0.45),
          textAlign: 'center',
        }}
      >
        Your data lives only on this device. Export a backup now and then so you don’t lose it.
      </div>
    </Sheet>
  )
}

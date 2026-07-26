import { useStore } from '../store'
import { COLORS } from '../tokens'
import { Home, Calendar, Activity, Book, Plus } from '../icons'

export default function TabBar() {
  const screen = useStore((s) => s.screen)
  const nav = useStore((s) => s.nav)
  const openQuick = useStore((s) => s.openQuick)
  const active = (c: string) => (screen === c ? COLORS.green : '#BDB6A6')

  return (
    <div
      className="app-tabbar"
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '11px 18px 22px',
        background: '#fff',
        borderTop: `1px solid ${COLORS.cardBorder}`,
        flex: 'none',
        zIndex: 20,
      }}
    >
      <div onClick={() => nav('home')} style={{ cursor: 'pointer', padding: 4 }}>
        <Home color={active('home')} />
      </div>
      <div onClick={() => nav('plan')} style={{ cursor: 'pointer', padding: 4 }}>
        <Calendar color={active('plan')} />
      </div>
      <div onClick={openQuick} style={{ cursor: 'pointer' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px -5px rgba(46,158,91,.6)',
          }}
        >
          <Plus size={23} color="#fff" />
        </div>
      </div>
      <div onClick={() => nav('stats')} style={{ cursor: 'pointer', padding: 4 }}>
        <Activity color={active('stats')} />
      </div>
      <div onClick={() => nav('library')} style={{ cursor: 'pointer', padding: 4 }}>
        <Book color={active('library')} />
      </div>
    </div>
  )
}

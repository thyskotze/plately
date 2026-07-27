import { useEffect, useState } from 'react'
import { useStore } from './store'
import { COLORS } from './tokens'
import TabBar from './components/TabBar'
import UpdateBanner from './components/UpdateBanner'
import Intro from './components/Intro'
import Onboarding from './components/Onboarding'
import Home from './components/screens/Home'
import Planner from './components/screens/Planner'
import Shopping from './components/screens/Shopping'
import Stats from './components/screens/Stats'
import Library from './components/screens/Library'
import PickSheet from './components/overlays/PickSheet'
import GramsSheet from './components/overlays/GramsSheet'
import MealAmountSheet from './components/overlays/MealAmountSheet'
import MealDetailSheet from './components/overlays/MealDetailSheet'
import NewFoodSheet from './components/overlays/NewFoodSheet'
import AiImportSheet from './components/overlays/AiImportSheet'
import GoalsSheet from './components/overlays/GoalsSheet'
import ProfileSheet from './components/overlays/ProfileSheet'
import ShareSheet from './components/overlays/ShareSheet'
import CnfSearchSheet from './components/overlays/CnfSearchSheet'
import BarcodeSheet from './components/overlays/BarcodeSheet'
import MealBuilderSheet from './components/overlays/MealBuilderSheet'
import MealSlotsSheet from './components/overlays/MealSlotsSheet'
import HelpSheet from './components/overlays/HelpSheet'
import InfoModal from './components/overlays/InfoModal'
import Toast from './components/overlays/Toast'

export default function App() {
  const screen = useStore((s) => s.screen)
  const seenIntro = useStore((s) => s.seenIntro)
  const onboarded = useStore((s) => s.onboarded)
  const checkForUpdate = useStore((s) => s.checkForUpdate)
  // Bumped on foreground so screens re-derive todayISO() after a midnight rollover.
  const [, setDayTick] = useState(0)

  // On load + whenever the app returns to the foreground: check for a newer
  // deployed build, and re-render so the current date rolls over (installed
  // PWAs can stay open for days).
  useEffect(() => {
    checkForUpdate()
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate()
        setDayTick((n) => n + 1)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkForUpdate])

  return (
    <div className="app-canvas">
      <div
        className="phone-frame"
        style={{
          width: 322,
          height: 696,
          background: COLORS.ink,
          borderRadius: 46,
          padding: 11,
          boxShadow:
            '0 40px 80px -24px rgba(26,26,23,.45),0 10px 24px -10px rgba(26,26,23,.3)',
        }}
      >
        <div
          className="phone-screen"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 36,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            background: COLORS.appBg,
          }}
        >
          <div
            className="phone-notch"
            style={{
              position: 'absolute',
              top: 11,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 96,
              height: 26,
              background: COLORS.ink,
              borderRadius: '0 0 16px 16px',
              zIndex: 40,
            }}
          />
          <div
            className="phone-status"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 26px 4px',
              font: '600 13px "Space Grotesk", sans-serif',
              color: COLORS.ink,
              flex: 'none',
            }}
          >
            <span>9:41</span>
            <span style={{ letterSpacing: 2 }}>● ● ●</span>
          </div>

          <div className="noscroll" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            {screen === 'home' && <Home />}
            {screen === 'plan' && <Planner />}
            {screen === 'shopping' && <Shopping />}
            {screen === 'stats' && <Stats />}
            {screen === 'library' && <Library />}
          </div>

          <TabBar />

          {/* Overlays — each renders null unless its overlay key is active. */}
          <PickSheet />
          <GramsSheet />
          <MealAmountSheet />
          <MealDetailSheet />
          <NewFoodSheet />
          <AiImportSheet />
          <GoalsSheet />
          <ProfileSheet />
          <ShareSheet />
          <CnfSearchSheet />
          <BarcodeSheet />
          <MealBuilderSheet />
          <MealSlotsSheet />
          <HelpSheet />
          <InfoModal />
          <Toast />
          <UpdateBanner />

          {!onboarded ? <Onboarding /> : !seenIntro && <Intro />}
        </div>
      </div>
    </div>
  )
}

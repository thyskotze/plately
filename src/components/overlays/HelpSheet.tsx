import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'

interface Section {
  title: string
  points: string[]
}

const SECTIONS: Section[] = [
  {
    title: 'Getting started',
    points: [
      'On first open you set your name, weight, height, age and goal — Plately works out a daily calorie target for you.',
      'Everything is saved on your phone. No account, no sign-up.',
      'Tip: tap Share → Add to Home Screen (iPhone) or Install app (Android) so it runs like a real app and keeps your data.',
    ],
  },
  {
    title: 'Your goals',
    points: [
      'Open your profile (avatar, top-right) → Your goals.',
      'Set a calorie goal and a protein goal — carbs and fat are worked out for you.',
      'Not sure? Tap Recalculate to use the suggested target from your stats.',
    ],
  },
  {
    title: 'Logging meals',
    points: [
      'On Home, tap ＋ on a meal (Breakfast, Lunch, Coffee…) to add a food or a saved meal.',
      'Choose the amount in grams — type it in for small things like 2 g salt or 5 g oil.',
      'Tick the circle on a meal once you’ve eaten it — the rings fill from what you tick off.',
      'Tap any logged item to change the amount or remove it.',
    ],
  },
  {
    title: 'Your meals (slots)',
    points: [
      'Add your own meal slots — a Coffee slot, extra snacks, or 5 small meals.',
      'Profile → Your meals, or the “Add or edit meals” button under your meals.',
      'Rename, reorder (↑ ↓) or remove slots. They apply to every day.',
    ],
  },
  {
    title: 'Adding foods',
    points: [
      'Library → Foods → ＋ to add a food by hand.',
      'Food search: search the CNF (Canada) and USDA (US) databases and add per-100 g foods.',
      'Scan barcode: point your camera at a packaged product (or type the number).',
      'Bulk import with AI: paste a list from ChatGPT/Claude to add many foods at once.',
    ],
  },
  {
    title: 'Building & reusing meals',
    points: [
      'Library → Meals → Build a meal: combine foods into one meal and save it.',
      'Coach Vicky’s recipes are already in Meals — tap one to see it and add it to a day.',
      'Add any saved meal to a day from the ＋ on a meal (switch to the Meals tab there).',
    ],
  },
  {
    title: 'Planner & shopping',
    points: [
      'Planner: lay out meals for each day of the week ahead of time.',
      'Shopping (from the Planner): an auto list built from the week’s plan — tick items as you shop.',
    ],
  },
  {
    title: 'Progress & sharing',
    points: [
      'The big ring shows calories; the three small rings show protein, carbs and fat vs your goal.',
      'Go over your calorie goal and the ring turns red with a marker showing how far over.',
      'Hit 80%+ of your goal and a Share button appears — post your win to your group.',
      'Stats shows your weight trend, streak and badges.',
    ],
  },
  {
    title: 'Backups & new phone',
    points: [
      'Your data lives only on this device — export a backup now and then.',
      'Profile → Export backup saves a file; Import backup restores it on another phone (Merge or Replace).',
    ],
  },
  {
    title: 'Updating the app',
    points: [
      'Profile → Check for updates fetches the latest version (your data is kept).',
      'Use this if something looks out of date on the home-screen app.',
    ],
  },
]

export default function HelpSheet() {
  const show = useStore((s) => s.overlay === 'help')
  const close = useStore((s) => s.closeOverlay)

  if (!show) return null

  return (
    <Sheet zIndex={70} onScrim={close} scroll maxHeight="94%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Help & how-to</div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>A quick guide to everything in Plately.</div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
        {SECTIONS.map((sec) => (
          <div
            key={sec.title}
            style={{
              background: '#fff',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: '14px 16px',
            }}
          >
            <div style={{ font: "700 14px 'Bricolage Grotesque'", color: COLORS.ink, marginBottom: 10 }}>
              {sec.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {sec.points.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: COLORS.green,
                      marginTop: 6,
                      flex: 'none',
                    }}
                  />
                  <div style={{ font: '500 12.5px/1.5 Figtree', color: ink(0.7) }}>{p}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, font: '500 10.5px/1.5 Figtree', color: ink(0.4), textAlign: 'center' }}>
        Plately keeps everything on your device. Reference only — not medical advice.
      </div>
    </Sheet>
  )
}

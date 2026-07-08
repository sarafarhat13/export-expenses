import { useEffect, useMemo, useState } from 'react'
import {
  ModusWcNavbar,
  ModusWcTabs,
  ModusWcIcon,
  ModusWcButton,
} from '@trimble-oss/moduswebcomponents-react'
import PeriodStrip, {
  type OlderSummary,
  type RecentTile,
} from './components/PeriodStrip'
import ExpensePanel from './components/ExpensePanel'
import OlderMonthsModal from './components/OlderMonthsModal'
import SideNav from './components/SideNav'
import {
  getPeriodSummaries,
  getAllPeriods,
  type ExportStatus,
  type Period,
  type PeriodSummary,
} from './data/expenses'
import './App.css'

// How many of the most recent months get their own tile; everything older is
// bundled into the "Older months" tile.
const RECENT_TILE_COUNT = 3

type Selection =
  | { mode: 'month'; year: number; month: number }
  | { mode: 'older'; periods: Period[] }

const TABS: { status: ExportStatus; label: string }[] = [
  { status: 'ready', label: 'Ready to be Exported' },
  { status: 'exported', label: 'Exported Expenses' },
]

const USER_CARD = {
  name: 'Jordan Pierce',
  email: 'jordan.pierce@traqspera.com',
  avatarAlt: 'Jordan Pierce',
}

const NAV_VISIBILITY = {
  ai: false,
  apps: true,
  help: true,
  logo: false,
  mainMenu: true,
  notifications: true,
  search: false,
  searchInput: false,
  user: true,
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const status = TABS[activeTab].status

  const summaries = useMemo(
    () => ({
      ready: getPeriodSummaries('ready'),
      exported: getPeriodSummaries('exported'),
    }),
    [],
  )
  const allPeriods = useMemo(() => getAllPeriods(), [])

  const [selection, setSelection] = useState<Selection | null>(null)
  const [olderModalOpen, setOlderModalOpen] = useState(false)

  const summaryByKey = useMemo(() => {
    const m = new Map<string, PeriodSummary>()
    for (const s of summaries[status]) m.set(`${s.year}-${s.month}`, s)
    return m
  }, [summaries, status])

  const sortedPending = useMemo(
    () =>
      [...summaries[status]].sort(
        (a, b) => a.year - b.year || a.month - b.month,
      ),
    [summaries, status],
  )

  // Recent tiles: for the Ready tab we show the most recent calendar months so
  // a fully-exported month still appears (as a "completed" tile). For the
  // Exported tab we just show the most recent months with exported records.
  const recentTiles = useMemo<RecentTile[]>(() => {
    if (status === 'ready') {
      return allPeriods.slice(-RECENT_TILE_COUNT).map((p) => ({
        year: p.year,
        month: p.month,
        summary: summaryByKey.get(`${p.year}-${p.month}`),
      }))
    }
    return sortedPending
      .slice(-RECENT_TILE_COUNT)
      .map((s) => ({ year: s.year, month: s.month, summary: s }))
  }, [status, allPeriods, summaryByKey, sortedPending])

  const recentKeys = useMemo(
    () => new Set(recentTiles.map((t) => `${t.year}-${t.month}`)),
    [recentTiles],
  )

  // Older = pending periods for this tab that aren't already shown as a tile,
  // most recent first (for the picker list).
  const olderPeriods = useMemo(
    () =>
      sortedPending
        .filter((s) => !recentKeys.has(`${s.year}-${s.month}`))
        .reverse(),
    [sortedPending, recentKeys],
  )

  const olderSummary = useMemo<OlderSummary | null>(() => {
    if (olderPeriods.length === 0) return null
    return {
      monthCount: olderPeriods.length,
      expenseCount: olderPeriods.reduce((s, p) => s + p.expenseCount, 0),
      employeeCount: 0,
      totalCost: olderPeriods.reduce((s, p) => s + p.totalCost, 0),
    }
  }, [olderPeriods])

  // Default to the most recent period that has pending data for the current tab.
  const defaultSelection = useMemo<Selection | null>(() => {
    const latest = sortedPending[sortedPending.length - 1]
    return latest ? { mode: 'month', year: latest.year, month: latest.month } : null
  }, [sortedPending])

  // Keep the selection valid whenever the tab / data changes.
  useEffect(() => {
    const keys = new Set(summaries[status].map((s) => `${s.year}-${s.month}`))
    let valid = false
    if (selection?.mode === 'month') {
      valid = keys.has(`${selection.year}-${selection.month}`)
    } else if (selection?.mode === 'older') {
      valid =
        selection.periods.length > 0 &&
        selection.periods.every((p) => keys.has(`${p.year}-${p.month}`))
    }
    if (!valid) setSelection(defaultSelection)
  }, [summaries, status, selection, defaultSelection])

  const switchTab = (index: number) => {
    setActiveTab(index)
    setSelection(null)
    setOlderModalOpen(false)
  }

  const panelPeriods = useMemo<Period[]>(() => {
    if (selection?.mode === 'month')
      return [{ year: selection.year, month: selection.month }]
    if (selection?.mode === 'older') return selection.periods
    return []
  }, [selection])

  return (
    <div className="app">
      <ModusWcNavbar
        userCard={USER_CARD as never}
        visibility={NAV_VISIBILITY as never}
      >
        <div slot="start" className="brand">
          <ModusWcIcon decorative name="apps" size="sm" />
          <span className="brand__name">Traqspera</span>
        </div>
      </ModusWcNavbar>

      <div className="app__body">
        <SideNav />

        <main className="page">
          <header className="page__header">
            <div className="page__header-left">
              <ModusWcIcon decorative name="chevron_left" size="md" />
              <h1 className="page__title">Export Expenses</h1>
            </div>
            <ModusWcButton
              color="secondary"
              variant="outlined"
              size="sm"
              customClass="summary-btn"
            >
              <ModusWcIcon decorative name="clipboard" size="sm" />
              Expense Summary
            </ModusWcButton>
          </header>

          <div className="page__content">
            <div className="page__tabs">
              <ModusWcTabs
                tabs={TABS.map((t) => ({ label: t.label }))}
                activeTabIndex={activeTab}
                tabStyle="boxed"
                onTabChange={(e) => switchTab(e.detail.newTab)}
              />
            </div>

            <PeriodStrip
              status={status}
              recent={recentTiles}
              older={olderSummary}
              selectedYear={selection?.mode === 'month' ? selection.year : null}
              selectedMonth={selection?.mode === 'month' ? selection.month : null}
              olderActive={selection?.mode === 'older'}
              onSelectMonth={(year, month) =>
                setSelection({ mode: 'month', year, month })
              }
              onOpenOlder={() => setOlderModalOpen(true)}
            />

            {panelPeriods.length > 0 ? (
              <ExpensePanel status={status} periods={panelPeriods} />
            ) : (
              <div className="overview__empty">
                <ModusWcIcon decorative name="calendar_event" size="lg" />
                <p>Select a month above to review its expenses.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <OlderMonthsModal
        open={olderModalOpen}
        status={status}
        periods={olderPeriods}
        onClose={() => setOlderModalOpen(false)}
        onConfirm={(selected) => {
          if (selected.length > 0) setSelection({ mode: 'older', periods: selected })
          setOlderModalOpen(false)
        }}
      />
    </div>
  )
}

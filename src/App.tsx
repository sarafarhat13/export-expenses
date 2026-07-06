import { useEffect, useMemo, useState } from 'react'
import {
  ModusWcNavbar,
  ModusWcTabs,
  ModusWcIcon,
  ModusWcButton,
} from '@trimble-oss/moduswebcomponents-react'
import PeriodStrip from './components/PeriodStrip'
import ExpensePanel from './components/ExpensePanel'
import SideNav from './components/SideNav'
import { getPeriodSummaries, type ExportStatus } from './data/expenses'
import './App.css'

interface Period {
  year: number
  month: number
}

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

  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)

  // Default to the most recent period that has data for the current tab.
  const defaultPeriod = useMemo<Period | null>(() => {
    const sorted = [...summaries[status]].sort(
      (a, b) => a.year - b.year || a.month - b.month,
    )
    const latest = sorted[sorted.length - 1]
    return latest ? { year: latest.year, month: latest.month } : null
  }, [summaries, status])

  // Keep the selected period valid whenever the tab changes.
  useEffect(() => {
    const valid =
      selectedPeriod &&
      summaries[status].some(
        (s) => s.year === selectedPeriod.year && s.month === selectedPeriod.month,
      )
    if (!valid) setSelectedPeriod(defaultPeriod)
  }, [summaries, status, selectedPeriod, defaultPeriod])

  const switchTab = (index: number) => {
    setActiveTab(index)
    setSelectedPeriod(null)
  }

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
              selectedYear={selectedPeriod?.year ?? null}
              selectedMonth={selectedPeriod?.month ?? null}
              onSelectMonth={(year, month) => setSelectedPeriod({ year, month })}
            />

            {selectedPeriod ? (
              <ExpensePanel
                status={status}
                year={selectedPeriod.year}
                month={selectedPeriod.month}
              />
            ) : (
              <div className="overview__empty">
                <ModusWcIcon decorative name="calendar_event" size="lg" />
                <p>Select a month above to review its expenses.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

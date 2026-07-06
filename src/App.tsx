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
import {
  getAvailableYears,
  getPeriodSummaries,
  type ExportStatus,
} from './data/expenses'
import './App.css'

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

  const yearsByStatus = useMemo(
    () => ({
      ready: getAvailableYears('ready'),
      exported: getAvailableYears('exported'),
    }),
    [],
  )

  const summaries = useMemo(
    () => ({
      ready: getPeriodSummaries('ready'),
      exported: getPeriodSummaries('exported'),
    }),
    [],
  )

  const [selectedYear, setSelectedYear] = useState<number>(
    yearsByStatus.ready[0] ?? new Date().getFullYear(),
  )
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Pick the first month that has data for the current tab + year.
  const firstMonthWithData = useMemo(() => {
    const months = summaries[status]
      .filter((s) => s.year === selectedYear)
      .map((s) => s.month)
      .sort((a, b) => a - b)
    return months[0] ?? null
  }, [summaries, status, selectedYear])

  // Keep the selected month valid whenever the tab/year changes.
  useEffect(() => {
    const valid = summaries[status].some(
      (s) => s.year === selectedYear && s.month === selectedMonth,
    )
    if (!valid) setSelectedMonth(firstMonthWithData)
  }, [summaries, status, selectedYear, selectedMonth, firstMonthWithData])

  const switchTab = (index: number) => {
    setActiveTab(index)
    const nextStatus = TABS[index].status
    const years = yearsByStatus[nextStatus]
    if (!years.includes(selectedYear)) {
      setSelectedYear(years[0] ?? new Date().getFullYear())
    }
    setSelectedMonth(null)
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
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onSelectYear={(year) => {
                setSelectedYear(year)
                setSelectedMonth(null)
              }}
              onSelectMonth={(_year, month) => setSelectedMonth(month)}
            />

            {selectedMonth !== null ? (
              <ExpensePanel
                status={status}
                year={selectedYear}
                month={selectedMonth}
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

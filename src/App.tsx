import { useMemo, useState } from 'react'
import {
  ModusWcNavbar,
  ModusWcTabs,
  ModusWcIcon,
} from '@trimble-oss/moduswebcomponents-react'
import PeriodOverview from './components/PeriodOverview'
import MonthDetail from './components/MonthDetail'
import { getAvailableYears, type ExportStatus } from './data/expenses'
import './App.css'

type View =
  | { name: 'overview' }
  | { name: 'detail'; year: number; month: number }

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
  mainMenu: false,
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

  const [selectedYears, setSelectedYears] = useState<Record<ExportStatus, number>>(
    {
      ready: yearsByStatus.ready[0] ?? new Date().getFullYear(),
      exported: yearsByStatus.exported[0] ?? new Date().getFullYear(),
    },
  )

  const [view, setView] = useState<View>({ name: 'overview' })

  const switchTab = (index: number) => {
    setActiveTab(index)
    setView({ name: 'overview' })
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

      <main className="page">
        <header className="page__header">
          <div>
            <h1 className="page__title">Export Expenses</h1>
            <p className="page__lede">
              Review pending expenses by period, then export them without loading
              everything at once.
            </p>
          </div>
        </header>

        <div className="page__tabs">
          <ModusWcTabs
            tabs={TABS.map((t) => ({ label: t.label }))}
            activeTabIndex={activeTab}
            tabStyle="boxed"
            onTabChange={(e) => switchTab(e.detail.newTab)}
          />
        </div>

        {view.name === 'overview' ? (
          <PeriodOverview
            status={status}
            selectedYear={selectedYears[status]}
            onSelectYear={(year) =>
              setSelectedYears((prev) => ({ ...prev, [status]: year }))
            }
            onOpenPeriod={(year, month) => setView({ name: 'detail', year, month })}
          />
        ) : (
          <MonthDetail
            status={status}
            year={view.year}
            month={view.month}
            onBack={() => setView({ name: 'overview' })}
          />
        )}
      </main>
    </div>
  )
}

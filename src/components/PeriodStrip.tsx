import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react'
import MonthTile from './MonthTile'
import {
  monthLabel,
  type ExportStatus,
  type PeriodSummary,
} from '../data/expenses'

export interface OlderSummary {
  monthCount: number
  expenseCount: number
  employeeCount: number
  totalCost: number
}

export interface RecentTile {
  year: number
  month: number
  /** Figures to display (pending for the tab, or exported when completed). */
  summary?: PeriodSummary
  /** True when this month has no pending expenses left (fully exported). */
  completed?: boolean
}

interface Props {
  status: ExportStatus
  /** The most recent periods shown as individual tiles (ascending order). */
  recent: RecentTile[]
  /** Aggregate of everything older than the recent tiles, or null when none. */
  older: OlderSummary | null
  selectedYear: number | null
  selectedMonth: number | null
  olderActive: boolean
  onSelectMonth: (year: number, month: number) => void
  onOpenOlder: () => void
}

export default function PeriodStrip({
  status,
  recent,
  older,
  selectedYear,
  selectedMonth,
  olderActive,
  onSelectMonth,
  onOpenOlder,
}: Props) {
  const verb = status === 'ready' ? 'ready' : 'exported'

  if (recent.length === 0 && !older) {
    return (
      <div className="period-strip">
        <div className="period-strip__empty">
          No expenses {status === 'ready' ? 'ready to export' : 'exported'} yet.
        </div>
      </div>
    )
  }

  const olderHasExpenses = (older?.expenseCount ?? 0) > 0

  const openOlder = () => {
    if (olderHasExpenses) onOpenOlder()
  }

  return (
    <div className="period-strip">
      <div className="period-strip__tiles">
        {older && (
          <div
            className={`month-tile month-tile--${status} ${
              olderHasExpenses ? 'month-tile--active' : 'month-tile--empty'
            } month-tile--older ${olderActive ? 'month-tile--selected' : ''}`}
            role="button"
            tabIndex={olderHasExpenses ? 0 : -1}
            aria-disabled={!olderHasExpenses}
            aria-pressed={olderActive}
            aria-label={`Older months: ${older.expenseCount} expenses ${verb} across ${older.monthCount} months`}
            onClick={openOlder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openOlder()
              }
            }}
          >
            <div className="month-tile__card">
              <div className="month-tile__head">
                <span className="month-tile__month">
                  <ModusWcIcon decorative name="history" size="sm" />
                  Older months
                </span>
                {status === 'exported' && olderHasExpenses && (
                  <span className="month-tile__badge" aria-hidden="true">
                    <ModusWcIcon decorative name="check" size="xs" />
                  </span>
                )}
              </div>

              {olderHasExpenses ? (
                <>
                  <div className="month-tile__count">
                    <span className="month-tile__count-num">
                      {older.expenseCount}
                    </span>
                    <span className="month-tile__count-lbl">
                      {older.expenseCount === 1
                        ? `expense ${verb}`
                        : `expenses ${verb}`}
                    </span>
                  </div>

                  <div className="month-tile__meta">
                    <span className="month-tile__meta-item">
                      <ModusWcIcon decorative name="calendar_event" size="xs" />
                      {older.monthCount}{' '}
                      {older.monthCount === 1 ? 'month' : 'months'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="month-tile__done">
                  <ModusWcIcon decorative name="check_circle" size="lg" />
                  <span>All exported</span>
                </div>
              )}
            </div>
          </div>
        )}

        {recent.map((t) => (
          <MonthTile
            key={`${t.year}-${t.month}`}
            status={status}
            year={t.year}
            month={t.month}
            monthLabel={monthLabel(t.month)}
            summary={t.summary}
            completed={t.completed}
            selected={t.year === selectedYear && t.month === selectedMonth}
            onOpen={onSelectMonth}
          />
        ))}
      </div>
    </div>
  )
}

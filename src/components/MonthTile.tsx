import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react'
import { type ExportStatus, type PeriodSummary } from '../data/expenses'

interface Props {
  status: ExportStatus
  year: number
  month: number
  monthLabel: string
  summary?: PeriodSummary
  /** True when this month has no pending expenses left (fully exported). */
  completed?: boolean
  selected?: boolean
  onOpen: (year: number, month: number) => void
}

export default function MonthTile({
  status,
  year,
  month,
  monthLabel,
  summary,
  completed,
  selected,
  onOpen,
}: Props) {
  const count = summary?.expenseCount ?? 0
  const hasExpenses = count > 0
  // A tile reads as "done" when it lives in the Exported tab or when a Ready
  // month has already been fully exported.
  const isDone = status === 'exported' || completed
  const verb = isDone ? 'exported' : 'ready'
  // Completed tiles are informational only – there is nothing left to act on.
  const interactive = hasExpenses && !completed

  const open = () => {
    if (interactive) onOpen(year, month)
  }

  return (
    <div
      className={`month-tile month-tile--${status} ${
        hasExpenses ? 'month-tile--active' : 'month-tile--empty'
      } ${isDone ? 'month-tile--done' : ''} ${
        completed ? 'month-tile--completed' : ''
      } ${selected ? 'month-tile--selected' : ''}`}
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-disabled={!interactive}
      aria-pressed={selected}
      aria-label={`${monthLabel} ${year}: ${count} expenses ${verb}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
    >
      <div className="month-tile__card">
        <div className="month-tile__head">
          <span className="month-tile__month">{monthLabel}</span>
          {isDone && hasExpenses && (
            <span className="month-tile__badge" aria-hidden="true">
              <ModusWcIcon decorative name="check" size="xs" />
            </span>
          )}
        </div>

        {hasExpenses ? (
          <>
            <div className="month-tile__count">
              <span className="month-tile__count-num">{count}</span>
              <span className="month-tile__count-lbl">
                {count === 1 ? `expense ${verb}` : `expenses ${verb}`}
              </span>
            </div>

            <div className="month-tile__meta">
              <span className="month-tile__meta-item">
                <ModusWcIcon decorative name="person" size="xs" />
                {summary?.employeeCount}{' '}
                {summary?.employeeCount === 1 ? 'employee' : 'employees'}
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
  )
}

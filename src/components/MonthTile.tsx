import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react'
import { formatCurrency, type ExportStatus, type PeriodSummary } from '../data/expenses'

interface Props {
  status: ExportStatus
  year: number
  month: number
  monthLabel: string
  summary?: PeriodSummary
  selected?: boolean
  onOpen: (year: number, month: number) => void
}

export default function MonthTile({
  status,
  year,
  month,
  monthLabel,
  summary,
  selected,
  onOpen,
}: Props) {
  const count = summary?.expenseCount ?? 0
  const hasExpenses = count > 0
  const isExported = status === 'exported'
  const verb = status === 'ready' ? 'ready' : 'exported'

  const open = () => {
    if (hasExpenses) onOpen(year, month)
  }

  return (
    <div
      className={`month-tile month-tile--${status} ${
        hasExpenses ? 'month-tile--active' : 'month-tile--empty'
      } ${selected ? 'month-tile--selected' : ''}`}
      role="button"
      tabIndex={hasExpenses ? 0 : -1}
      aria-disabled={!hasExpenses}
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
          {isExported && hasExpenses && (
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
                {summary?.employeeCount} {summary?.employeeCount === 1 ? 'employee' : 'employees'}
              </span>
              <span className="month-tile__total">{formatCurrency(summary?.totalCost ?? 0)}</span>
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

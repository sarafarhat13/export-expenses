import { ModusWcCard, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react'
import { formatCurrency, type ExportStatus, type PeriodSummary } from '../data/expenses'

interface Props {
  status: ExportStatus
  year: number
  month: number
  monthLabel: string
  summary?: PeriodSummary
  onOpen: (year: number, month: number) => void
}

export default function MonthTile({ status, year, month, monthLabel, summary, onOpen }: Props) {
  const count = summary?.expenseCount ?? 0
  const hasExpenses = count > 0
  const verb = status === 'ready' ? 'ready' : 'exported'

  const open = () => {
    if (hasExpenses) onOpen(year, month)
  }

  return (
    <div
      className={`month-tile ${hasExpenses ? 'month-tile--active' : 'month-tile--empty'}`}
      role="button"
      tabIndex={hasExpenses ? 0 : -1}
      aria-disabled={!hasExpenses}
      aria-label={`${monthLabel} ${year}: ${count} expenses ${verb}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
    >
      <ModusWcCard bordered customClass="month-tile__card">
        <div className="month-tile__head">
          <span className="month-tile__month">{monthLabel}</span>
          {!hasExpenses && (
            <ModusWcIcon decorative name="check_circle" size="sm" customClass="month-tile__done" />
          )}
        </div>

        <div className="month-tile__count">
          <span className="month-tile__count-num">{count}</span>
          <span className="month-tile__count-lbl">
            {count === 1 ? `expense ${verb}` : `expenses ${verb}`}
          </span>
        </div>

        <div className="month-tile__meta">
          {hasExpenses ? (
            <>
              <span className="month-tile__meta-item">
                <ModusWcIcon decorative name="person" size="xs" />
                {summary?.employeeCount} {summary?.employeeCount === 1 ? 'employee' : 'employees'}
              </span>
              <span className="month-tile__total">{formatCurrency(summary?.totalCost ?? 0)}</span>
            </>
          ) : (
            <span className="month-tile__meta-item month-tile__meta-item--muted">
              Nothing to export
            </span>
          )}
        </div>
      </ModusWcCard>
    </div>
  )
}

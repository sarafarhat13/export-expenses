import { useMemo } from 'react'
import { ModusWcButtonGroup, ModusWcButton, ModusWcIcon } from '@trimble-oss/moduswebcomponents-react'
import MonthTile from './MonthTile'
import {
  getAvailableYears,
  getPeriodSummaries,
  getYearSummary,
  monthLabel,
  formatCurrency,
  type ExportStatus,
} from '../data/expenses'

interface Props {
  status: ExportStatus
  selectedYear: number
  onSelectYear: (year: number) => void
  onOpenPeriod: (year: number, month: number) => void
}

export default function PeriodOverview({
  status,
  selectedYear,
  onSelectYear,
  onOpenPeriod,
}: Props) {
  const years = useMemo(() => getAvailableYears(status), [status])
  const summaries = useMemo(() => getPeriodSummaries(status), [status])
  const yearSummary = useMemo(
    () => getYearSummary(status, selectedYear),
    [status, selectedYear],
  )

  const summaryByMonth = useMemo(() => {
    const map = new Map<number, (typeof summaries)[number]>()
    for (const s of summaries) {
      if (s.year === selectedYear) map.set(s.month, s)
    }
    return map
  }, [summaries, selectedYear])

  const verb = status === 'ready' ? 'ready to export' : 'exported'

  return (
    <div className="overview">
      <div className="overview__toolbar">
        <div className="overview__years" role="group" aria-label="Select year">
          <ModusWcButtonGroup>
            {years.map((year) => {
              const selected = year === selectedYear
              return (
                <ModusWcButton
                  key={year}
                  color={selected ? 'primary' : 'secondary'}
                  variant={selected ? 'filled' : 'outlined'}
                  customClass={selected ? 'year-btn year-btn--selected' : 'year-btn'}
                  onButtonClick={() => onSelectYear(year)}
                >
                  {year}
                </ModusWcButton>
              )
            })}
          </ModusWcButtonGroup>
        </div>

        <div className="overview__stats" aria-label={`${selectedYear} totals`}>
          <div className="stat">
            <span className="stat__value">{yearSummary.expenseCount}</span>
            <span className="stat__label">expenses {verb}</span>
          </div>
          <div className="stat__divider" aria-hidden="true" />
          <div className="stat">
            <span className="stat__value">{yearSummary.employeeCount}</span>
            <span className="stat__label">employees</span>
          </div>
          <div className="stat__divider" aria-hidden="true" />
          <div className="stat">
            <span className="stat__value stat__value--accent">
              {formatCurrency(yearSummary.totalCost)}
            </span>
            <span className="stat__label">total cost</span>
          </div>
        </div>
      </div>

      <p className="overview__hint">
        <ModusWcIcon decorative name="calendar_event" size="sm" />
        Select a month to load and review the expenses {verb} for that period.
      </p>

      {yearSummary.expenseCount === 0 ? (
        <div className="overview__empty">
          <ModusWcIcon decorative name="inbox" size="lg" />
          <p>No expenses {verb} in {selectedYear}.</p>
        </div>
      ) : (
        <div className="tile-grid">
          {Array.from({ length: 12 }, (_, month) => (
            <MonthTile
              key={month}
              status={status}
              year={selectedYear}
              month={month}
              monthLabel={monthLabel(month)}
              summary={summaryByMonth.get(month)}
              onOpen={onOpenPeriod}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useMemo } from 'react'
import { ModusWcButtonGroup, ModusWcButton } from '@trimble-oss/moduswebcomponents-react'
import MonthTile from './MonthTile'
import {
  getAvailableYears,
  getPeriodSummaries,
  monthLabel,
  type ExportStatus,
} from '../data/expenses'

interface Props {
  status: ExportStatus
  selectedYear: number
  selectedMonth: number | null
  onSelectYear: (year: number) => void
  onSelectMonth: (year: number, month: number) => void
}

export default function PeriodStrip({
  status,
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
}: Props) {
  const years = useMemo(() => getAvailableYears(status), [status])
  const summaries = useMemo(() => getPeriodSummaries(status), [status])

  const summaryByMonth = useMemo(() => {
    const map = new Map<number, (typeof summaries)[number]>()
    for (const s of summaries) {
      if (s.year === selectedYear) map.set(s.month, s)
    }
    return map
  }, [summaries, selectedYear])

  // Only show months that actually have expenses for this period/tab.
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) => m).filter((m) =>
        summaryByMonth.has(m),
      ),
    [summaryByMonth],
  )

  return (
    <div className="period-strip">
      <div className="period-strip__years" role="group" aria-label="Select year">
        <ModusWcButtonGroup>
          {years.map((year) => {
            const isSelected = year === selectedYear
            return (
              <ModusWcButton
                key={year}
                color={isSelected ? 'primary' : 'secondary'}
                variant={isSelected ? 'filled' : 'outlined'}
                size="sm"
                customClass={isSelected ? 'year-btn year-btn--selected' : 'year-btn'}
                onButtonClick={() => onSelectYear(year)}
              >
                {year}
              </ModusWcButton>
            )
          })}
        </ModusWcButtonGroup>
      </div>

      {months.length === 0 ? (
        <div className="period-strip__empty">
          No expenses {status === 'ready' ? 'ready to export' : 'exported'} in{' '}
          {selectedYear}.
        </div>
      ) : (
        <div className="period-strip__tiles">
          {months.map((month) => (
            <MonthTile
              key={month}
              status={status}
              year={selectedYear}
              month={month}
              monthLabel={monthLabel(month)}
              summary={summaryByMonth.get(month)}
              selected={month === selectedMonth}
              onOpen={onSelectMonth}
            />
          ))}
        </div>
      )}
    </div>
  )
}

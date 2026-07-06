import { useMemo } from 'react'
import MonthTile from './MonthTile'
import { getPeriodSummaries, monthLabel, type ExportStatus } from '../data/expenses'

interface Props {
  status: ExportStatus
  selectedYear: number | null
  selectedMonth: number | null
  onSelectMonth: (year: number, month: number) => void
}

export default function PeriodStrip({
  status,
  selectedYear,
  selectedMonth,
  onSelectMonth,
}: Props) {
  const summaries = useMemo(() => getPeriodSummaries(status), [status])

  // The four most recent periods that have expenses (across year boundaries).
  const periods = useMemo(
    () =>
      [...summaries]
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .slice(-4),
    [summaries],
  )

  if (periods.length === 0) {
    return (
      <div className="period-strip">
        <div className="period-strip__empty">
          No expenses {status === 'ready' ? 'ready to export' : 'exported'} yet.
        </div>
      </div>
    )
  }

  return (
    <div className="period-strip">
      <div className="period-strip__tiles">
        {periods.map((p) => (
          <MonthTile
            key={`${p.year}-${p.month}`}
            status={status}
            year={p.year}
            month={p.month}
            monthLabel={monthLabel(p.month)}
            summary={p}
            selected={p.year === selectedYear && p.month === selectedMonth}
            onOpen={onSelectMonth}
          />
        ))}
      </div>
    </div>
  )
}

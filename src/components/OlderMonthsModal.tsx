import { useEffect, useMemo, useState } from 'react'
import {
  ModusWcButton,
  ModusWcIcon,
  ModusWcCheckbox,
  ModusWcBadge,
} from '@trimble-oss/moduswebcomponents-react'
import {
  formatCurrency,
  monthLabel,
  type ExportStatus,
  type Period,
  type PeriodSummary,
} from '../data/expenses'

interface Props {
  open: boolean
  status: ExportStatus
  /** Older periods (excludes the recent months shown as tiles), most recent first. */
  periods: PeriodSummary[]
  onClose: () => void
  onConfirm: (selected: Period[]) => void
}

const keyOf = (p: { year: number; month: number }) => `${p.year}-${p.month}`

export default function OlderMonthsModal({
  open,
  status,
  periods,
  onClose,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Start each open with nothing selected so the user makes a deliberate choice.
  useEffect(() => {
    if (open) setSelected(new Set())
  }, [open])

  const verb = status === 'ready' ? 'ready to export' : 'exported'

  const allKeys = useMemo(() => periods.map(keyOf), [periods])
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k))
  const someSelected = allKeys.some((k) => selected.has(k))

  const selectedSummaries = periods.filter((p) => selected.has(keyOf(p)))
  const selectedCount = selectedSummaries.reduce((s, p) => s + p.expenseCount, 0)

  if (!open) return null

  const toggle = (p: PeriodSummary) => {
    const k = keyOf(p)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allKeys))
  }

  const confirm = () => {
    onConfirm(selectedSummaries.map((p) => ({ year: p.year, month: p.month })))
  }

  return (
    <div
      className="omm__overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="omm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="omm-title"
      >
        <div className="omm__header">
          <div>
            <h2 className="omm__title" id="omm-title">
              Load older months
            </h2>
            <p className="omm__subtitle">
              Pick the months you want to review. Loading everything at once can
              be slow, so choose only the months with expenses still {verb}.
            </p>
          </div>
          <button
            type="button"
            className="omm__close"
            aria-label="Close"
            onClick={onClose}
          >
            <ModusWcIcon decorative name="close" size="md" />
          </button>
        </div>

        <div className="omm__selectall">
          <ModusWcCheckbox
            value={allSelected}
            indeterminate={someSelected && !allSelected}
            aria-label="Select all older months"
            onInputChange={toggleAll}
          />
          <span>Select all months ({periods.length})</span>
        </div>

        <ul className="omm__list">
          {periods.map((p) => {
            const k = keyOf(p)
            const isSel = selected.has(k)
            return (
              <li
                key={k}
                className={`omm__item ${isSel ? 'omm__item--selected' : ''}`}
              >
                <label className="omm__item-label">
                  <ModusWcCheckbox
                    value={isSel}
                    aria-label={`Select ${monthLabel(p.month)} ${p.year}`}
                    onInputChange={() => toggle(p)}
                  />
                  <span className="omm__item-month">
                    {monthLabel(p.month)} {p.year}
                  </span>
                </label>
                <span className="omm__item-meta">
                  <span className="omm__item-stat">
                    <ModusWcIcon decorative name="person" size="xs" />
                    {p.employeeCount}
                  </span>
                  <span className="omm__item-stat">
                    <ModusWcBadge color="warning" variant="counter" size="sm">
                      {p.expenseCount}
                    </ModusWcBadge>
                    expenses
                  </span>
                  <span className="omm__item-total">
                    {formatCurrency(p.totalCost)}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="omm__footer">
          <span className="omm__footer-summary">
            {selectedSummaries.length === 0
              ? 'No months selected'
              : `${selectedSummaries.length} ${
                  selectedSummaries.length === 1 ? 'month' : 'months'
                } · ${selectedCount} expenses`}
          </span>
          <div className="omm__footer-actions">
            <ModusWcButton color="secondary" variant="outlined" onButtonClick={onClose}>
              Cancel
            </ModusWcButton>
            <ModusWcButton
              color="primary"
              disabled={selectedSummaries.length === 0}
              onButtonClick={confirm}
            >
              Load selected
            </ModusWcButton>
          </div>
        </div>
      </div>
    </div>
  )
}

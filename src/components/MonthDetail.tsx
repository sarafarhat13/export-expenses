import { useEffect, useMemo, useState } from 'react'
import {
  ModusWcButton,
  ModusWcBadge,
  ModusWcIcon,
  ModusWcSelect,
  ModusWcDate,
  ModusWcTable,
  ModusWcCheckbox,
} from '@trimble-oss/moduswebcomponents-react'
import {
  getExpensesForPeriod,
  monthLabel,
  formatCurrency,
  formatDate,
  type Expense,
  type ExportStatus,
} from '../data/expenses'

interface Props {
  status: ExportStatus
  year: number
  month: number
  onBack: () => void
}

interface SelectOption {
  label: string
  value: string
}

const COLUMNS = [
  { id: 'date', header: 'Invoice Date', accessor: 'date', width: '110px' },
  { id: 'department', header: 'Department', accessor: 'department' },
  { id: 'job', header: 'Job', accessor: 'job', width: '90px' },
  { id: 'phase', header: 'Phase', accessor: 'phase', width: '80px' },
  { id: 'payType', header: 'Pay Type', accessor: 'payType', width: '90px' },
  { id: 'creditCard', header: 'Credit Card', accessor: 'creditCard', width: '110px' },
  { id: 'vendor', header: 'Vendor', accessor: 'vendor' },
  { id: 'category', header: 'Category', accessor: 'category' },
  { id: 'invoiceNumber', header: 'Invoice Number', accessor: 'invoiceNumber' },
  {
    id: 'totalCost',
    header: 'Total Cost',
    accessor: 'totalCost',
    width: '110px',
    cellRenderer: (value: unknown) => formatCurrency(Number(value)),
  },
  { id: 'comment', header: 'Comment', accessor: 'comment' },
]

function toRow(exp: Expense): Record<string, unknown> {
  return {
    id: exp.id,
    date: formatDate(exp.date),
    department: exp.department,
    job: exp.job,
    phase: exp.phase,
    payType: exp.payType,
    creditCard: exp.creditCard ? 'Yes' : 'No',
    vendor: exp.vendor,
    category: `${exp.category} (${exp.glCode})`,
    invoiceNumber: exp.invoiceNumber,
    totalCost: exp.totalCost,
    comment: exp.comment,
  }
}

export default function MonthDetail({ status, year, month, onBack }: Props) {
  const allExpenses = useMemo(
    () => getExpensesForPeriod(status, year, month),
    [status, year, month],
  )

  const [employeeFilter, setEmployeeFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [payTypeFilter, setPayTypeFilter] = useState('')
  const [creditCardFilter, setCreditCardFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Constrain the calendar to the selected month (invoice dates only fall here).
  const monthBounds = useMemo(() => {
    const mm = String(month + 1).padStart(2, '0')
    const lastDay = new Date(year, month + 1, 0).getDate()
    return {
      min: `${year}-${mm}-01`,
      max: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    }
  }, [year, month])

  const buildOptions = (values: string[], placeholder: string): SelectOption[] => [
    { label: placeholder, value: '' },
    ...Array.from(new Set(values))
      .sort()
      .map((v) => ({ label: v, value: v })),
  ]

  const employeeOptions = useMemo(
    () =>
      buildOptions(
        allExpenses.map((e) => `${e.employeeCode} - ${e.employeeName}`),
        'Filter by Employee',
      ),
    [allExpenses],
  )
  const departmentOptions = useMemo(
    () => buildOptions(allExpenses.map((e) => e.department), 'Filter by Department'),
    [allExpenses],
  )
  const categoryOptions = useMemo(
    () =>
      buildOptions(
        allExpenses.map((e) => `${e.category} (${e.glCode})`),
        'Filter by Category / GL Code',
      ),
    [allExpenses],
  )
  const jobOptions = useMemo(
    () => buildOptions(allExpenses.map((e) => e.job), 'Filter by Job'),
    [allExpenses],
  )
  const phaseOptions = useMemo(
    () => buildOptions(allExpenses.map((e) => e.phase), 'Filter by Phase'),
    [allExpenses],
  )
  const payTypeOptions = useMemo(
    () => buildOptions(allExpenses.map((e) => e.payType), 'Filter by Pay Type'),
    [allExpenses],
  )
  const creditCardOptions: SelectOption[] = [
    { label: 'Filter by Credit Card', value: '' },
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ]

  const filtered = useMemo(
    () =>
      allExpenses.filter((e) => {
        if (employeeFilter && `${e.employeeCode} - ${e.employeeName}` !== employeeFilter)
          return false
        if (departmentFilter && e.department !== departmentFilter) return false
        if (categoryFilter && `${e.category} (${e.glCode})` !== categoryFilter) return false
        if (jobFilter && e.job !== jobFilter) return false
        if (phaseFilter && e.phase !== phaseFilter) return false
        if (payTypeFilter && e.payType !== payTypeFilter) return false
        if (creditCardFilter && (e.creditCard ? 'yes' : 'no') !== creditCardFilter)
          return false
        if (dateFilter && e.date !== dateFilter) return false
        return true
      }),
    [
      allExpenses,
      employeeFilter,
      departmentFilter,
      categoryFilter,
      jobFilter,
      phaseFilter,
      payTypeFilter,
      creditCardFilter,
      dateFilter,
    ],
  )

  const groups = useMemo(() => {
    const map = new Map<string, { code: string; name: string; items: Expense[] }>()
    for (const exp of filtered) {
      const key = exp.employeeCode
      let g = map.get(key)
      if (!g) {
        g = { code: exp.employeeCode, name: exp.employeeName, items: [] }
        map.set(key, g)
      }
      g.items.push(exp)
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [filtered])

  const grandTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + e.totalCost, 0),
    [filtered],
  )

  // Row selection. Default to everything selected for the period so the export
  // flow starts "all in", and reset whenever the period changes.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    setSelectedIds(new Set(allExpenses.map((e) => e.id)))
  }, [allExpenses])

  const displayedIds = useMemo(() => filtered.map((e) => e.id), [filtered])
  const allDisplayedSelected =
    displayedIds.length > 0 && displayedIds.every((id) => selectedIds.has(id))
  const someDisplayedSelected = displayedIds.some((id) => selectedIds.has(id))

  const selectedExpenses = useMemo(
    () => filtered.filter((e) => selectedIds.has(e.id)),
    [filtered, selectedIds],
  )
  const selectedEmployeeCount = useMemo(
    () => new Set(selectedExpenses.map((e) => e.employeeCode)).size,
    [selectedExpenses],
  )

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allDisplayedSelected) {
        displayedIds.forEach((id) => next.delete(id))
      } else {
        displayedIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleGroupSelection = (groupItems: Expense[], ids: string[]) => {
    const groupIds = new Set(groupItems.map((e) => e.id))
    const idSet = new Set(ids)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      groupIds.forEach((id) => {
        if (idSet.has(id)) next.add(id)
        else next.delete(id)
      })
      // Avoid a state churn / re-emit loop when nothing actually changed.
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) {
        return prev
      }
      return next
    })
  }

  const hasFilters = Boolean(
    employeeFilter ||
      departmentFilter ||
      categoryFilter ||
      jobFilter ||
      phaseFilter ||
      payTypeFilter ||
      creditCardFilter ||
      dateFilter,
  )

  const clearFilters = () => {
    setEmployeeFilter('')
    setDepartmentFilter('')
    setCategoryFilter('')
    setJobFilter('')
    setPhaseFilter('')
    setPayTypeFilter('')
    setCreditCardFilter('')
    setDateFilter('')
  }
  const isReady = status === 'ready'

  return (
    <div className="detail">
      <nav className="detail__breadcrumb" aria-label="Breadcrumb">
        <button className="linkish" onClick={onBack}>
          <ModusWcIcon decorative name="chevron_left" size="xs" />
          Overview
        </button>
        <span aria-hidden="true">/</span>
        <span className="detail__crumb-current">
          {monthLabel(month)} {year}
        </span>
      </nav>

      <div className="detail__header">
        <div>
          <h2 className="detail__title">
            {monthLabel(month)} {year}
          </h2>
          <p className="detail__subtitle">
            {filtered.length} of {allExpenses.length}{' '}
            {isReady ? 'expenses ready to export' : 'exported expenses'} ·{' '}
            {groups.length} {groups.length === 1 ? 'employee' : 'employees'}
          </p>
        </div>
        {isReady && (
          <div className="detail__actions">
            <ModusWcButton color="primary" variant="outlined">
              <ModusWcIcon decorative name="file_download" size="sm" />
              Export as CSV
            </ModusWcButton>
            <ModusWcButton color="primary" variant="outlined">
              <ModusWcIcon decorative name="sync" size="sm" />
              Send to Spectrum
            </ModusWcButton>
          </div>
        )}
      </div>

      <div className="detail__filters">
        <div className="detail__filter-grid">
          <ModusWcDate
            label="Date"
            size="sm"
            format="yyyy-mm-dd"
            min={monthBounds.min}
            max={monthBounds.max}
            value={dateFilter}
            onInputChange={(e) => {
              // modus-wc-date emits the ISO value on the event detail, not the host.
              const detail = e.detail as unknown as { target?: { value?: string } }
              setDateFilter(detail?.target?.value ?? '')
            }}
          />
          <ModusWcSelect
            label="Employee"
            size="sm"
            options={employeeOptions}
            value={employeeFilter}
            onInputChange={(e) => setEmployeeFilter(e.target.value)}
          />
          <ModusWcSelect
            label="Job"
            size="sm"
            options={jobOptions}
            value={jobFilter}
            onInputChange={(e) => setJobFilter(e.target.value)}
          />
          <ModusWcSelect
            label="Phase"
            size="sm"
            options={phaseOptions}
            value={phaseFilter}
            onInputChange={(e) => setPhaseFilter(e.target.value)}
          />
          <ModusWcSelect
            label="Category / GL Code"
            size="sm"
            options={categoryOptions}
            value={categoryFilter}
            onInputChange={(e) => setCategoryFilter(e.target.value)}
          />
          <ModusWcSelect
            label="Department"
            size="sm"
            options={departmentOptions}
            value={departmentFilter}
            onInputChange={(e) => setDepartmentFilter(e.target.value)}
          />
          <ModusWcSelect
            label="Pay Type"
            size="sm"
            options={payTypeOptions}
            value={payTypeFilter}
            onInputChange={(e) => setPayTypeFilter(e.target.value)}
          />
          <ModusWcSelect
            label="Credit Card"
            size="sm"
            options={creditCardOptions}
            value={creditCardFilter}
            onInputChange={(e) => setCreditCardFilter(e.target.value)}
          />
        </div>
        {hasFilters && (
          <div className="detail__filter-actions">
            <ModusWcButton
              color="secondary"
              variant="borderless"
              size="sm"
              customClass="detail__clear"
              onButtonClick={clearFilters}
            >
              <ModusWcIcon decorative name="close" size="xs" />
              Clear filters
            </ModusWcButton>
          </div>
        )}
      </div>

      {isReady && groups.length > 0 && (
        <div className="export-bar">
          <div className="export-bar__left">
            <ModusWcCheckbox
              value={allDisplayedSelected}
              indeterminate={someDisplayedSelected && !allDisplayedSelected}
              inputTabIndex={0}
              aria-label="Select all displayed expenses"
              onInputChange={toggleSelectAll}
            />
            <span className="export-bar__dot" aria-hidden="true" />
            <span className="export-bar__label">Expenses to be exported</span>
          </div>
          <div className="export-bar__right">
            <span className="export-bar__stat">
              Employees
              <ModusWcBadge color="warning" variant="counter" size="sm">
                {selectedEmployeeCount}
              </ModusWcBadge>
            </span>
            <span className="export-bar__stat">
              Expenses
              <ModusWcBadge color="warning" variant="counter" size="sm">
                {selectedExpenses.length}
              </ModusWcBadge>
            </span>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="overview__empty">
          <ModusWcIcon decorative name="filter" size="lg" />
          <p>No expenses match the current filters.</p>
        </div>
      ) : (
        groups.map((group) => {
          const groupTotal = group.items.reduce((s, e) => s + e.totalCost, 0)
          return (
            <section className="employee-group" key={group.code}>
              <header className="employee-group__header">
                <div className="employee-group__id">
                  <ModusWcIcon decorative name="person" size="sm" />
                  <span className="employee-group__name">
                    {group.code} - {group.name}
                  </span>
                  <ModusWcBadge color="secondary" variant="counter" size="sm">
                    {group.items.length}
                  </ModusWcBadge>
                </div>
                <span className="employee-group__total">
                  Subtotal: {formatCurrency(groupTotal)}
                </span>
              </header>
              <ModusWcTable
                columns={COLUMNS as never}
                data={group.items.map(toRow)}
                density="compact"
                hover
                sortable
                selectable={isReady ? 'multi' : 'none'}
                selectedRowIds={group.items
                  .map((e) => e.id)
                  .filter((id) => selectedIds.has(id))}
                onRowSelectionChange={(e) =>
                  handleGroupSelection(group.items, e.detail.selectedRowIds)
                }
              />
            </section>
          )
        })
      )}

      {groups.length > 0 && (
        <div className="detail__grandtotal">
          <span>Total for {monthLabel(month)} {year}</span>
          <span className="detail__grandtotal-value">{formatCurrency(grandTotal)}</span>
        </div>
      )}
    </div>
  )
}

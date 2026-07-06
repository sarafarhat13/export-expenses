import { useMemo, useState } from 'react'
import {
  ModusWcButton,
  ModusWcBadge,
  ModusWcIcon,
  ModusWcSelect,
  ModusWcTable,
  ModusWcAlert,
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
        'All employees',
      ),
    [allExpenses],
  )
  const departmentOptions = useMemo(
    () => buildOptions(allExpenses.map((e) => e.department), 'All departments'),
    [allExpenses],
  )
  const categoryOptions = useMemo(
    () => buildOptions(allExpenses.map((e) => e.category), 'All categories'),
    [allExpenses],
  )

  const filtered = useMemo(
    () =>
      allExpenses.filter((e) => {
        if (employeeFilter && `${e.employeeCode} - ${e.employeeName}` !== employeeFilter)
          return false
        if (departmentFilter && e.department !== departmentFilter) return false
        if (categoryFilter && e.category !== categoryFilter) return false
        return true
      }),
    [allExpenses, employeeFilter, departmentFilter, categoryFilter],
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

  const hasFilters = Boolean(employeeFilter || departmentFilter || categoryFilter)
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
        <ModusWcSelect
          label="Employee"
          size="sm"
          options={employeeOptions}
          value={employeeFilter}
          onInputChange={(e) => setEmployeeFilter(e.target.value)}
        />
        <ModusWcSelect
          label="Department"
          size="sm"
          options={departmentOptions}
          value={departmentFilter}
          onInputChange={(e) => setDepartmentFilter(e.target.value)}
        />
        <ModusWcSelect
          label="Category"
          size="sm"
          options={categoryOptions}
          value={categoryFilter}
          onInputChange={(e) => setCategoryFilter(e.target.value)}
        />
        {hasFilters && (
          <ModusWcButton
            color="secondary"
            variant="borderless"
            size="sm"
            customClass="detail__clear"
            onButtonClick={() => {
              setEmployeeFilter('')
              setDepartmentFilter('')
              setCategoryFilter('')
            }}
          >
            <ModusWcIcon decorative name="close" size="xs" />
            Clear filters
          </ModusWcButton>
        )}
      </div>

      {isReady && (
        <ModusWcAlert
          variant="info"
          icon="info"
          alertTitle={`${allExpenses.length} expenses to be exported for ${monthLabel(month)} ${year}`}
          customClass="detail__banner"
        />
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

import { useEffect, useMemo, useState } from 'react'
import {
  ModusWcButton,
  ModusWcBadge,
  ModusWcIcon,
  ModusWcSelect,
  ModusWcDate,
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
}

interface SelectOption {
  label: string
  value: string
}

interface SubGroup {
  key: string
  kind: 'individual' | 'report'
  reportId?: string
  title?: string
  items: Expense[]
}

interface EmployeeGroup {
  code: string
  name: string
  items: Expense[]
  subGroups: SubGroup[]
}

const COLUMN_HEADERS = [
  'Invoice Date',
  'Department',
  'Job',
  'Phase',
  'Pay Type',
  'Credit Card',
  'Vendor',
  'Category',
  'Invoice Number',
  'Total Cost',
  'Comment',
]
// One extra leading column for the selection checkbox.
const COL_SPAN = COLUMN_HEADERS.length + 1

export default function ExpensePanel({ status, year, month }: Props) {
  const isReady = status === 'ready'

  const allExpenses = useMemo(
    () => getExpensesForPeriod(status, year, month),
    [status, year, month],
  )

  const [employeeFilter, setEmployeeFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [costCenterFilter, setCostCenterFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')
  const [payTypeFilter, setPayTypeFilter] = useState('')
  const [creditCardFilter, setCreditCardFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Editable invoice numbers + the per-subgroup "apply to all" inputs.
  const [invoiceOverrides, setInvoiceOverrides] = useState<Record<string, string>>({})
  const [applyInputs, setApplyInputs] = useState<Record<string, string>>({})
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Reset editable/selection state whenever the period changes.
  useEffect(() => {
    setSelectedIds(new Set(allExpenses.map((e) => e.id)))
    setInvoiceOverrides({})
    setApplyInputs({})
    setCollapsed(new Set())
  }, [allExpenses])

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
  const costCenterOptions = useMemo(
    () => buildOptions(allExpenses.map((e) => e.costCenter), 'Filter by Cost Center'),
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
        if (costCenterFilter && e.costCenter !== costCenterFilter) return false
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
      costCenterFilter,
      categoryFilter,
      jobFilter,
      phaseFilter,
      payTypeFilter,
      creditCardFilter,
      dateFilter,
    ],
  )

  const groups: EmployeeGroup[] = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const exp of filtered) {
      const arr = map.get(exp.employeeCode)
      if (arr) arr.push(exp)
      else map.set(exp.employeeCode, [exp])
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([code, items]) => {
        const individual = items.filter((e) => !e.reportId)
        const reportMap = new Map<string, SubGroup>()
        for (const e of items) {
          if (!e.reportId) continue
          let sg = reportMap.get(e.reportId)
          if (!sg) {
            sg = {
              key: `${code}-${e.reportId}`,
              kind: 'report',
              reportId: e.reportId,
              title: e.reportTitle,
              items: [],
            }
            reportMap.set(e.reportId, sg)
          }
          sg.items.push(e)
        }

        const subGroups: SubGroup[] = []
        if (individual.length > 0) {
          subGroups.push({
            key: `${code}-individual`,
            kind: 'individual',
            items: individual,
          })
        }
        subGroups.push(...reportMap.values())

        return { code, name: items[0].employeeName, items, subGroups }
      })
  }, [filtered])

  // ---- Selection helpers ----
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

  const setSelection = (ids: string[], value: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (value ? next.add(id) : next.delete(id)))
      return next
    })
  }

  const toggleSelectAll = () => setSelection(displayedIds, !allDisplayedSelected)

  const invoiceValue = (exp: Expense) => invoiceOverrides[exp.id] ?? exp.invoiceNumber

  const applyInvoiceToSub = (sg: SubGroup) => {
    const value = (applyInputs[sg.key] ?? '').trim()
    if (!value) return
    setInvoiceOverrides((prev) => {
      const next = { ...prev }
      sg.items.forEach((e) => (next[e.id] = value))
      return next
    })
  }

  const toggleCollapse = (code: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const hasFilters = Boolean(
    employeeFilter ||
      departmentFilter ||
      costCenterFilter ||
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
    setCostCenterFilter('')
    setCategoryFilter('')
    setJobFilter('')
    setPhaseFilter('')
    setPayTypeFilter('')
    setCreditCardFilter('')
    setDateFilter('')
  }

  const renderRow = (exp: Expense) => (
    <tr key={exp.id} className={selectedIds.has(exp.id) ? 'xrow xrow--selected' : 'xrow'}>
      <td className="xcell xcell--check">
        {isReady && (
          <ModusWcCheckbox
            value={selectedIds.has(exp.id)}
            aria-label={`Select expense ${exp.invoiceNumber}`}
            onInputChange={(e) =>
              setSelection(
                [exp.id],
                (e.target as unknown as HTMLInputElement).checked,
              )
            }
          />
        )}
      </td>
      <td className="xcell">{formatDate(exp.date)}</td>
      <td className="xcell">{exp.department}</td>
      <td className="xcell">{exp.job}</td>
      <td className="xcell">{exp.phase}</td>
      <td className="xcell">{exp.payType}</td>
      <td className="xcell">{exp.creditCard ? 'Yes' : 'No'}</td>
      <td className="xcell">{exp.vendor}</td>
      <td className="xcell">
        {exp.category} ({exp.glCode})
      </td>
      <td className="xcell xcell--invoice">
        {isReady ? (
          <input
            className="invoice-input"
            value={invoiceValue(exp)}
            aria-label="Invoice number"
            onChange={(e) =>
              setInvoiceOverrides((prev) => ({ ...prev, [exp.id]: e.target.value }))
            }
          />
        ) : (
          invoiceValue(exp)
        )}
      </td>
      <td className="xcell xcell--num">{formatCurrency(exp.totalCost)}</td>
      <td className="xcell">{exp.comment}</td>
    </tr>
  )

  const renderSubGroupHeader = (sg: SubGroup) => {
    const ids = sg.items.map((e) => e.id)
    const allSel = ids.every((id) => selectedIds.has(id))
    const someSel = ids.some((id) => selectedIds.has(id))
    const count = sg.items.length
    const label =
      sg.kind === 'individual'
        ? `Individual Expenses (${count} ${count === 1 ? 'Expense' : 'Expenses'})`
        : `Expense Report: ${sg.reportId}${sg.title ? ` - ${sg.title}` : ''} (${count} ${
            count === 1 ? 'Expense' : 'Expenses'
          })`

    return (
      <tr className="subgroup" key={`${sg.key}-header`}>
        <td className="subgroup__cell" colSpan={COL_SPAN}>
          <div className="subgroup__bar">
            <div className="subgroup__label">
              {isReady && (
                <ModusWcCheckbox
                  value={allSel}
                  indeterminate={someSel && !allSel}
                  aria-label={`Select ${label}`}
                  onInputChange={() => setSelection(ids, !allSel)}
                />
              )}
              <ModusWcIcon
                decorative
                name={sg.kind === 'report' ? 'file' : 'receipt'}
                size="xs"
              />
              <span>{label}</span>
            </div>
            {isReady && (
              <div className="subgroup__apply">
                <input
                  className="apply-input"
                  placeholder="Apply Invoice # to all"
                  value={applyInputs[sg.key] ?? ''}
                  aria-label="Apply invoice number to all in group"
                  onChange={(e) =>
                    setApplyInputs((prev) => ({ ...prev, [sg.key]: e.target.value }))
                  }
                />
                <ModusWcButton
                  size="sm"
                  color="primary"
                  variant="outlined"
                  disabled={!(applyInputs[sg.key] ?? '').trim()}
                  onButtonClick={() => applyInvoiceToSub(sg)}
                >
                  Apply
                </ModusWcButton>
              </div>
            )}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="panel">
      <div className="panel__filters">
        <div className="panel__filter-grid">
          <ModusWcDate
            label="Date"
            size="sm"
            format="yyyy-mm-dd"
            min={monthBounds.min}
            max={monthBounds.max}
            value={dateFilter}
            onInputChange={(e) => {
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
            label="Cost Center"
            size="sm"
            options={costCenterOptions}
            value={costCenterFilter}
            onInputChange={(e) => setCostCenterFilter(e.target.value)}
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
        <div className="panel__filter-actions">
          {hasFilters && (
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
          )}
          {isReady && (
            <div className="panel__export-actions">
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
          const total = group.items.reduce((s, e) => s + e.totalCost, 0)
          const isCollapsed = collapsed.has(group.code)
          return (
            <section className="employee-group" key={group.code}>
              <button
                type="button"
                className="employee-group__header"
                aria-expanded={!isCollapsed}
                onClick={() => toggleCollapse(group.code)}
              >
                <span className="employee-group__id">
                  <ModusWcIcon
                    decorative
                    name={isCollapsed ? 'chevron_right' : 'expand_more'}
                    size="sm"
                  />
                  <ModusWcIcon decorative name="person" size="sm" />
                  <span className="employee-group__name">
                    {group.code} - {group.name}
                  </span>
                  <ModusWcBadge color="warning" variant="counter" size="sm">
                    {group.items.length}
                  </ModusWcBadge>
                </span>
              </button>

              {!isCollapsed && (
                <>
                  <div className="table-scroll">
                    <table className="xtable">
                      <thead>
                        <tr>
                          <th className="xcell--check" />
                          {COLUMN_HEADERS.map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      {group.subGroups.map((sg) => (
                        <tbody key={sg.key}>
                          {renderSubGroupHeader(sg)}
                          {sg.items.map(renderRow)}
                        </tbody>
                      ))}
                    </table>
                  </div>
                  <div className="employee-group__total">
                    TOTAL: <span>{formatCurrency(total)}</span>
                  </div>
                </>
              )}
            </section>
          )
        })
      )}

      {groups.length > 0 && (
        <div className="detail__grandtotal">
          <span>
            Total for {monthLabel(month)} {year}
          </span>
          <span className="detail__grandtotal-value">
            {formatCurrency(filtered.reduce((s, e) => s + e.totalCost, 0))}
          </span>
        </div>
      )}
    </div>
  )
}

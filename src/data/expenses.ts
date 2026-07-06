// Mock expense data + aggregation helpers.
//
// In the real Traqspera system these would come from an API. The key idea that
// fixes the "can't load everything at once" problem is that the landing page
// only needs the *aggregate* (counts / totals per month), which is cheap, while
// the full expense rows are fetched lazily one period at a time.

export type ExportStatus = 'ready' | 'exported'

export interface Expense {
  id: string
  /** ISO date string (YYYY-MM-DD) */
  date: string
  employeeCode: string
  employeeName: string
  department: string
  costCenter: string
  job: string
  phase: string
  payType: string
  creditCard: boolean
  vendor: string
  category: string
  glCode: string
  invoiceNumber: string
  totalCost: number
  comment: string
  status: ExportStatus
  /** Present when the expense belongs to a multi-line expense report. */
  reportId?: string
  /** Human-readable title of the parent expense report, when applicable. */
  reportTitle?: string
}

export interface PeriodSummary {
  year: number
  /** 0-11 */
  month: number
  monthLabel: string
  expenseCount: number
  employeeCount: number
  totalCost: number
}

export interface YearSummary {
  year: number
  expenseCount: number
  employeeCount: number
  totalCost: number
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPLOYEES = [
  { code: '053', name: 'Connor McDavid', department: '5050 - Job Cost' },
  { code: '048', name: 'Sidney Crosby', department: '4010 - Admin' },
  { code: '087', name: 'Nathan MacKinnon', department: '3005 - Sales' },
  { code: '029', name: 'Leon Draisaitl', department: '5050 - Job Cost' },
  { code: '091', name: 'John Tavares', department: '4010 - Admin' },
  { code: '016', name: 'Cale Makar', department: '3005 - Sales' },
  { code: '077', name: 'Auston Matthews', department: '5050 - Job Cost' },
  { code: '019', name: 'Jack Hughes', department: '4010 - Admin' },
]

const JOBS = ['CONSTR', 'TRAVEL', 'CLIENT', 'ADMIN', 'SHOP']
const PHASES = ['00100', '02000', '04500', '01000', '03200']
const PAY_TYPES = ['M', 'E', 'C']
const COST_CENTERS = [
  '100 - Operations',
  '200 - Field Services',
  '300 - Office',
  '400 - Fleet',
  '500 - Safety',
]
const REPORT_TITLES = [
  'Q4 Field Operations',
  'Sales & Marketing Q4',
  'Equipment & Tools',
  'Site Travel',
  'Client Onboarding',
  'Monthly Supplies',
  'Winter Maintenance',
  'Project Kickoff',
]
const VENDORS = [
  'TechSupply Co', 'BuildPro Equipment', 'The Oak Restaurant', 'Northgate Fuel',
  'City Hardware', 'Summit Lodging', 'Rapid Rentals', 'Blue Sky Airlines',
]
const CATEGORIES = [
  { name: 'Equipment', gl: '64150' },
  { name: 'Travel', gl: '50020' },
  { name: 'Materials', gl: '72310' },
  { name: 'Meals & Entertainment', gl: '55010' },
  { name: 'Fuel', gl: '61200' },
  { name: 'Lodging', gl: '53400' },
]
const COMMENTS = [
  'Site visit to Northgate', '4-day rental', 'Lunch with ACME corp',
  'Weekly fuel', 'Replacement parts', 'Overnight stay', 'Client demo', '-',
]

// Deterministic pseudo-random generator so the mock data is stable between loads.
function makeRng(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

interface Bucket {
  reportId: string | null
  title: string | null
  size: number
}

function buildExpenses(): Expense[] {
  const rng = makeRng(20250706)
  const expenses: Expense[] = []
  let counter = 0
  let reportCounter = 0

  // Generate across three years so both tabs have realistic content. Older
  // periods are "exported"; recent periods are "ready".
  const years = [2024, 2025, 2026]

  for (const year of years) {
    for (let month = 0; month < 12; month++) {
      // Some months intentionally have zero expenses to be exported.
      const roll = rng()
      let count: number
      if (roll < 0.18) count = 0
      else if (roll < 0.5) count = 2 + Math.floor(rng() * 4)
      else count = 6 + Math.floor(rng() * 12)
      if (count === 0) continue

      const exportedPeriod =
        year < 2025 || (year === 2025 && month < 6)
      const status: ExportStatus = exportedPeriod ? 'exported' : 'ready'

      // Spread the month's expenses across a subset of employees.
      const empPool = [...EMPLOYEES].sort(() => rng() - 0.5)
      const numEmp = Math.max(1, Math.min(empPool.length, Math.min(count, 2 + Math.floor(rng() * 5))))
      const chosen = empPool.slice(0, numEmp)

      const alloc = new Array<number>(numEmp).fill(1)
      let remaining = count - numEmp
      while (remaining > 0) {
        alloc[Math.floor(rng() * numEmp)] += 1
        remaining -= 1
      }

      chosen.forEach((emp, ei) => {
        // Break this employee's expenses into individual lines and 2-3 line
        // expense reports so the UI can group them.
        let left = alloc[ei]
        const buckets: Bucket[] = []
        while (left > 0) {
          if (left >= 2 && rng() < 0.45) {
            const size = Math.min(left, 2 + Math.floor(rng() * 2))
            reportCounter += 1
            buckets.push({
              reportId: `RPT-${4500 + reportCounter}`,
              title: pick(rng, REPORT_TITLES),
              size,
            })
            left -= size
          } else {
            buckets.push({ reportId: null, title: null, size: 1 })
            left -= 1
          }
        }

        for (const bucket of buckets) {
          for (let k = 0; k < bucket.size; k++) {
            const cat = pick(rng, CATEGORIES)
            const day = 1 + Math.floor(rng() * 27)
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            counter += 1
            expenses.push({
              id: `EXP-${counter}`,
              date: dateStr,
              employeeCode: emp.code,
              employeeName: emp.name,
              department: emp.department,
              costCenter: pick(rng, COST_CENTERS),
              job: pick(rng, JOBS),
              phase: pick(rng, PHASES),
              payType: pick(rng, PAY_TYPES),
              creditCard: rng() < 0.5,
              vendor: pick(rng, VENDORS),
              category: cat.name,
              glCode: cat.gl,
              invoiceNumber: bucket.reportId
                ? `${bucket.reportId}-INV`
                : `INV${100000 + Math.floor(rng() * 900000)}`,
              totalCost: Math.round((15 + rng() * 900) * 100) / 100,
              comment: pick(rng, COMMENTS),
              status,
              reportId: bucket.reportId ?? undefined,
              reportTitle: bucket.title ?? undefined,
            })
          }
        }
      })
    }
  }

  return expenses
}

export const ALL_EXPENSES: Expense[] = buildExpenses()

export function monthLabel(month: number): string {
  return MONTH_LABELS[month]
}

export function shortMonthLabel(month: number): string {
  return MONTH_LABELS[month].slice(0, 3)
}

/** Cheap aggregate: how many expenses are ready in each year/month. */
export function getPeriodSummaries(status: ExportStatus): PeriodSummary[] {
  const map = new Map<string, PeriodSummary & { employees: Set<string> }>()

  for (const exp of ALL_EXPENSES) {
    if (exp.status !== status) continue
    const [yearStr, monthStr] = exp.date.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr) - 1
    const key = `${year}-${month}`

    let entry = map.get(key)
    if (!entry) {
      entry = {
        year,
        month,
        monthLabel: MONTH_LABELS[month],
        expenseCount: 0,
        employeeCount: 0,
        totalCost: 0,
        employees: new Set<string>(),
      }
      map.set(key, entry)
    }
    entry.expenseCount += 1
    entry.totalCost += exp.totalCost
    entry.employees.add(exp.employeeCode)
  }

  return Array.from(map.values()).map((e) => ({
    year: e.year,
    month: e.month,
    monthLabel: e.monthLabel,
    expenseCount: e.expenseCount,
    employeeCount: e.employees.size,
    totalCost: Math.round(e.totalCost * 100) / 100,
  }))
}

export function getAvailableYears(status: ExportStatus): number[] {
  const years = new Set<number>()
  for (const exp of ALL_EXPENSES) {
    if (exp.status !== status) continue
    years.add(Number(exp.date.split('-')[0]))
  }
  return Array.from(years).sort((a, b) => b - a)
}

export function getYearSummary(
  status: ExportStatus,
  year: number,
): YearSummary {
  const employees = new Set<string>()
  let expenseCount = 0
  let totalCost = 0
  for (const exp of ALL_EXPENSES) {
    if (exp.status !== status) continue
    if (Number(exp.date.split('-')[0]) !== year) continue
    expenseCount += 1
    totalCost += exp.totalCost
    employees.add(exp.employeeCode)
  }
  return {
    year,
    expenseCount,
    employeeCount: employees.size,
    totalCost: Math.round(totalCost * 100) / 100,
  }
}

/** Lazily fetch the full rows for a single period only. */
export function getExpensesForPeriod(
  status: ExportStatus,
  year: number,
  month: number,
): Expense[] {
  return ALL_EXPENSES.filter((exp) => {
    if (exp.status !== status) return false
    const [y, m] = exp.date.split('-')
    return Number(y) === year && Number(m) - 1 === month
  })
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${MONTH_LABELS[Number(m) - 1].slice(0, 3)} ${Number(d)}, ${y}`
}

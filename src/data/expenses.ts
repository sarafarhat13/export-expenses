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

function buildExpenses(): Expense[] {
  const rng = makeRng(20250706)
  const expenses: Expense[] = []
  let counter = 0

  // Generate across three years. Recent months (current year) are all "ready";
  // older months are mostly "exported" so both tabs have realistic content.
  const years = [2024, 2025, 2026]

  for (const year of years) {
    for (let month = 0; month < 12; month++) {
      // Some months intentionally have zero expenses to be exported.
      const roll = rng()
      let count: number
      if (roll < 0.18) count = 0
      else if (roll < 0.5) count = 2 + Math.floor(rng() * 4)
      else count = 6 + Math.floor(rng() * 12)

      for (let i = 0; i < count; i++) {
        const emp = pick(rng, EMPLOYEES)
        const cat = pick(rng, CATEGORIES)
        const day = 1 + Math.floor(rng() * 27)
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        // Roughly a third of expenses roll up into a shared expense report.
        const inReport = rng() < 0.35
        const reportId = inReport
          ? `RPT-${1000 + Math.floor(rng() * 8000)}`
          : undefined

        const exported =
          year < 2025 || (year === 2025 && month < 9) ? rng() < 0.85 : false

        counter += 1
        expenses.push({
          id: `EXP-${counter}`,
          date: dateStr,
          employeeCode: emp.code,
          employeeName: emp.name,
          department: emp.department,
          job: pick(rng, JOBS),
          phase: pick(rng, PHASES),
          payType: pick(rng, PAY_TYPES),
          creditCard: rng() < 0.5,
          vendor: pick(rng, VENDORS),
          category: cat.name,
          glCode: cat.gl,
          invoiceNumber: reportId
            ? `${reportId}-INV`
            : `INV${100000 + Math.floor(rng() * 900000)}`,
          totalCost: Math.round((15 + rng() * 900) * 100) / 100,
          comment: pick(rng, COMMENTS),
          status: exported ? 'exported' : 'ready',
          reportId,
        })
      }
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

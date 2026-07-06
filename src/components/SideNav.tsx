import { ModusWcIcon } from '@trimble-oss/moduswebcomponents-react'

interface NavItem {
  icon: string
  label: string
  active?: boolean
}

// Mirrors the Traqspera left rail. "Export Expenses" is the active section.
const ITEMS: NavItem[] = [
  { icon: 'person', label: 'Employees' },
  { icon: 'timesheet', label: 'Time' },
  { icon: 'people_group', label: 'Crew' },
  { icon: 'briefcase', label: 'Jobs' },
  { icon: 'submit_expense', label: 'Expenses', active: true },
  { icon: 'invoice', label: 'Invoicing' },
  { icon: 'wrench', label: 'Equipment' },
  { icon: 'document', label: 'Documents' },
  { icon: 'dashboard', label: 'Reports' },
  { icon: 'settings', label: 'Settings' },
  { icon: 'manage_people', label: 'Admin' },
]

export default function SideNav() {
  return (
    <nav className="sidenav" aria-label="Primary">
      {ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`sidenav__item ${item.active ? 'sidenav__item--active' : ''}`}
          aria-label={item.label}
          aria-current={item.active ? 'page' : undefined}
          title={item.label}
        >
          <ModusWcIcon decorative name={item.icon} size="sm" customClass="sidenav__icon" />
          <ModusWcIcon
            decorative
            name="chevron_right"
            size="xs"
            customClass="sidenav__chevron"
          />
        </button>
      ))}
    </nav>
  )
}

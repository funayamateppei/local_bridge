import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export const DropdownMenu = ({ trigger, children, align = 'right' }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      <div
        className={cn(
          'absolute z-50 mt-2 w-56 origin-top-right rounded-md border border-surface bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-out',
          align === 'right' ? 'right-0' : 'left-0',
          isOpen
            ? 'transform opacity-100 scale-100 translate-y-0'
            : 'transform opacity-0 scale-95 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="py-1">{children}</div>
      </div>
    </div>
  )
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
}

export const DropdownMenuItem = ({
  className,
  children,
  icon,
  ...props
}: DropdownMenuItemProps) => {
  return (
    <div
      className={cn(
        'flex cursor-pointer items-center px-4 py-2 text-sm text-text hover:bg-surface',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
      {children}
    </div>
  )
}

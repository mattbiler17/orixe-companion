import type { ButtonHTMLAttributes, ReactNode } from 'react'

type JewelChoiceButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
  children: ReactNode
  className?: string
  isSelected?: boolean
}

export default function JewelChoiceButton({
  children,
  className,
  isSelected = false,
  type = 'button',
  ...props
}: JewelChoiceButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`orixe-jewel-box orixe-jewel-box--interactive${isSelected ? ' is-selected' : ''}${className ? ` ${className}` : ''}`}
    >
      <span className="orixe-jewel-box__content">{children}</span>
    </button>
  )
}

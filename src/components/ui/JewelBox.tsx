import type { HTMLAttributes, ReactNode } from 'react'

type JewelBoxProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  fullWidth?: boolean
}

export default function JewelBox({ className, fullWidth = true, children, ...props }: JewelBoxProps) {
  return (
    <div
      {...props}
      className={`orixe-jewel-box${fullWidth ? ' orixe-jewel-box--full' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="orixe-jewel-box__content">{children}</div>
    </div>
  )
}

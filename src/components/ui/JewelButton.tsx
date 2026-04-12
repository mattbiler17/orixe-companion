import { Link, type LinkProps } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type JewelButtonBaseProps = {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

type JewelLinkButtonProps = JewelButtonBaseProps & LinkProps & { to: LinkProps['to'] }
type JewelActionButtonProps = JewelButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: never }

type JewelButtonProps = JewelLinkButtonProps | JewelActionButtonProps

function isLinkButton(props: JewelButtonProps): props is JewelLinkButtonProps {
  return 'to' in props && props.to !== undefined
}

export default function JewelButton(props: JewelButtonProps) {
  const { className, fullWidth = true, children } = props
  const resolvedClassName = `orixe-jewel-button${fullWidth ? ' orixe-jewel-button--full' : ''}${className ? ` ${className}` : ''}`

  if (isLinkButton(props)) {
    const { className: _className, fullWidth: _fullWidth, children: _children, ...linkProps } = props
    return (
      <Link {...linkProps} className={resolvedClassName}>
        <span className="orixe-jewel-button__label">{children}</span>
      </Link>
    )
  }

  const { className: _className, fullWidth: _fullWidth, children: _children, ...buttonProps } = props

  return (
    <button {...buttonProps} className={resolvedClassName} type={buttonProps.type ?? 'button'}>
      <span className="orixe-jewel-button__label">{children}</span>
    </button>
  )
}

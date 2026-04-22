import { forwardRef, useImperativeHandle, useRef, type InputEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react'

type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'inputMode' | 'pattern' | 'value' | 'onChange'
> & {
  value: string
  onValueChange: (value: string) => void
  normalizeOnBlur?: (value: string) => string
}

function stripToDigits(value: string): string {
  return value.replace(/\D+/g, '')
}

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  { value, onValueChange, normalizeOnBlur, onFocus, onBlur, onKeyDown, onBeforeInput, onPointerUp, ...props },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceOnNextDigitRef = useRef(false)

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  function selectAllText() {
    requestAnimationFrame(() => {
      inputRef.current?.select()
    })
  }

  function commitReplacement(nextDigit: string) {
    onValueChange(nextDigit)
    replaceOnNextDigitRef.current = false
  }

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={value}
      onFocus={(event) => {
        replaceOnNextDigitRef.current = value !== ''
        selectAllText()
        onFocus?.(event)
      }}
      onPointerUp={(event) => {
        if (replaceOnNextDigitRef.current && value !== '') {
          event.preventDefault()
          selectAllText()
        }

        onPointerUp?.(event)
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (replaceOnNextDigitRef.current && !event.metaKey && !event.ctrlKey && !event.altKey) {
          if (/^\d$/.test(event.key)) {
            event.preventDefault()
            commitReplacement(event.key)
          }

          if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault()
            onValueChange('')
            replaceOnNextDigitRef.current = false
          }
        }

        onKeyDown?.(event)
      }}
      onBeforeInput={(event: InputEvent<HTMLInputElement>) => {
        const nativeEvent = event.nativeEvent as globalThis.InputEvent
        const nextData = nativeEvent.data ?? ''

        if (replaceOnNextDigitRef.current && /^\d$/.test(nextData)) {
          event.preventDefault()
          commitReplacement(nextData)
        }

        onBeforeInput?.(event)
      }}
      onChange={(event) => {
        onValueChange(stripToDigits(event.target.value))
        replaceOnNextDigitRef.current = false
      }}
      onBlur={(event) => {
        replaceOnNextDigitRef.current = false

        if (normalizeOnBlur) {
          onValueChange(normalizeOnBlur(value))
        }

        onBlur?.(event)
      }}
    />
  )
})

export default NumericInput

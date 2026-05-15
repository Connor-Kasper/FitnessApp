import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className = '', size = 'md', ...props }: ButtonProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-sm'
      : size === 'lg'
      ? 'px-6 py-3 text-lg'
      : 'px-4 py-2 text-base'

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-blue-600 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${className}`}
      {...props}
    />
  )
}

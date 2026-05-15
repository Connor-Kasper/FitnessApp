import * as React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 placeholder:text-gray-400 focus:ring-2 ${className}`}
      {...props}
    />
  )
}

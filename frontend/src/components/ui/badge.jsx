import React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-input bg-transparent text-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
}

export function Badge({ className, variant = 'default', ...props }) {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                badgeVariants[variant] || badgeVariants.default,
                className
            )}
            {...props}
        />
    )
}

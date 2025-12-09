'use client'

import { useEffect, useState } from 'react'

export function PromotionalBanner() {
    const [timeLeft, setTimeLeft] = useState('')
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const targetDate = new Date('2025-12-31T23:59:59').getTime()

        const updateTimer = () => {
            const now = new Date().getTime()
            const difference = targetDate - now

            if (difference <= 0) {
                setTimeLeft('EXPIRED')
                return
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((difference % (1000 * 60)) / 1000)

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }

        // Initial call
        updateTimer()

        const intervalId = setInterval(updateTimer, 1000)

        return () => clearInterval(intervalId)
    }, [])

    if (!isMounted) return null

    return (
        <div className="bg-primary text-primary-foreground px-4 py-3 text-center text-sm font-medium">
            <p>
                Launch price 60€/year - 50% off - valid until 31st December
                <span className="ml-2 opacity-90 font-bold tabular-nums">({timeLeft})</span>
            </p>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Check } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'

export function PricingModal() {
    const [isYearly, setIsYearly] = useState(false)
    const [loading, setLoading] = useState(false)
    const { user } = useSupabase()

    const handleCheckout = async () => {
        setLoading(true)
        try {
            const priceId = isYearly
                ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY
                : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY

            if (!priceId) {
                alert('Pricing configuration missing. Please check .env.local')
                return
            }

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId }),
            })

            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('No checkout URL returned')
            }
        } catch (error) {
            console.error('Checkout failed:', error)
            alert('Failed to start checkout. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                    Upgrade to Pro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Upgrade to Pro</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    {/* Toggle */}
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>Monthly</span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                        <span className={`text-sm font-medium ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
                            Yearly <span className="text-xs text-green-500 font-bold ml-1">(Save 20%)</span>
                        </span>
                    </div>

                    {/* Price Display */}
                    <div className="text-center">
                        <div className="text-4xl font-bold">
                            {isYearly ? '€100' : '€10'}
                            <span className="text-lg text-muted-foreground font-normal">/{isYearly ? 'yr' : 'mo'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Cancel anytime.</p>
                    </div>

                    {/* Features */}
                    <div className="w-full space-y-3">
                        {[
                            'Unlimited Projects',
                            'Unlimited Google Drive Sync',
                            'Priority Support',
                            'Early Access to Features'
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                    >
                        {loading ? 'Redirecting...' : `Subscribe ${isYearly ? 'Yearly' : 'Monthly'}`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

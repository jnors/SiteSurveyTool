'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'

export function PricingModal() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'promo'>('monthly')
    const [loading, setLoading] = useState(false)
    const { user } = useSupabase()

    const handleCheckout = async () => {
        setLoading(true)
        try {
            let priceId;
            switch (billingCycle) {
                case 'yearly':
                    priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;
                    break;
                case 'promo':
                    priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY_PROMO;
                    break;
                case 'monthly':
                default:
                    priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY;
                    break;
            }

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

    const getPriceDisplay = () => {
        switch (billingCycle) {
            case 'monthly': return { amount: '€10', period: '/mo', label: 'Monthly' }
            case 'yearly': return { amount: '€96', period: '/yr', label: 'Yearly' }
            case 'promo': return { amount: '€60', period: '/yr', label: 'Special' }
        }
    }

    const { amount, period, label } = getPriceDisplay()

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
                    <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">Yearly</TabsTrigger>
                            <TabsTrigger value="promo" className="relative">
                                Special
                                <span className="absolute -top-2 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Price Display */}
                    <div className="text-center">
                        <div className="text-4xl font-bold">
                            {amount}
                            <span className="text-lg text-muted-foreground font-normal">{period}</span>
                        </div>
                        {billingCycle === 'yearly' && <p className="text-sm text-green-500 font-medium mt-2">Save 20%</p>}
                        {billingCycle === 'promo' && <p className="text-sm text-red-500 font-bold mt-2">Limited Time Offer! Save 50%</p>}
                        {billingCycle === 'monthly' && <p className="text-sm text-muted-foreground mt-2">Cancel anytime.</p>}
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
                        {loading ? 'Redirecting...' : `Subscribe ${label}`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

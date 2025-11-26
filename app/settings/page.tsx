"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Loader2, User } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/useAuth"
import { PricingModal } from "@/components/pricing-modal"
import { NavBar } from "@/ui"

export default function SettingsPage() {
    const { user, subscriptionStatus } = useAuth("/settings")
    const [isPortalLoading, setIsPortalLoading] = useState(false)
    const router = useRouter()

    const isPro = subscriptionStatus === "active"

    const handleManageSubscription = async () => {
        setIsPortalLoading(true)
        try {
            const res = await fetch("/api/billing-portal", {
                method: "POST",
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error("No portal URL returned")
            }
        } catch (error) {
            console.error("Failed to open billing portal:", error)
            alert("Failed to load subscription settings. Please try again.")
        } finally {
            setIsPortalLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background">
            <NavBar />
            <main className="mx-auto max-w-4xl px-6 py-8">
                <div className="mb-8">
                    <Link href="/projects">
                        <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Projects
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and subscription.</p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile
                            </CardTitle>
                            <CardDescription>Your personal information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-1">
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <div className="font-medium">{user.email}</div>
                            </div>
                            <div className="grid gap-1">
                                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                                <div className="font-mono text-sm text-muted-foreground">{user.id}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Subscription
                            </CardTitle>
                            <CardDescription>Manage your plan and billing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-1">
                                    <div className="font-medium">Current Plan</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${isPro ? "text-primary" : "text-foreground"}`}>
                                            {isPro ? "Pro Plan" : "Free Plan"}
                                        </span>
                                        {isPro && (
                                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isPro ? (
                                    <Button
                                        variant="outline"
                                        onClick={handleManageSubscription}
                                        disabled={isPortalLoading}
                                    >
                                        {isPortalLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            "Manage Subscription"
                                        )}
                                    </Button>
                                ) : (
                                    <PricingModal />
                                )}
                            </div>

                            {!isPro && (
                                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                                    <p>
                                        Upgrade to Pro for unlimited projects, unlimited floorplans, and priority support.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

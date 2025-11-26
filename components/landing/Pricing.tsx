"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PricingModal } from "@/components/pricing-modal"
import Link from "next/link"

export function Pricing() {
    return (
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background-elevated border-y border-border/40">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Start for free, upgrade when you need more power.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-2 md:gap-8 max-w-4xl mx-auto">
                    {/* Free Tier */}
                    <div className="flex flex-col p-6 bg-background rounded-xl border border-border shadow-sm">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Free</h3>
                            <p className="text-muted-foreground">Perfect for trying out the tool.</p>
                        </div>
                        <div className="mt-4 flex items-baseline text-3xl font-bold">
                            €0
                            <span className="ml-1 text-xl font-normal text-muted-foreground">/mo</span>
                        </div>
                        <ul className="mt-6 space-y-3 flex-1">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">1 Project</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">1 Floorplan per Project</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Unlimited Pins</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Google Drive Sync</span>
                            </li>
                        </ul>
                        <div className="mt-8">
                            <Button asChild className="w-full" variant="outline">
                                <Link href="#cta">Get Started</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Pro Tier */}
                    <div className="flex flex-col p-6 bg-background rounded-xl border-2 border-primary shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                            POPULAR
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Pro</h3>
                            <p className="text-muted-foreground">For serious site surveyors.</p>
                        </div>
                        <div className="mt-4 flex items-baseline text-3xl font-bold">
                            €10
                            <span className="ml-1 text-xl font-normal text-muted-foreground">/mo</span>
                        </div>
                        <ul className="mt-6 space-y-3 flex-1">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Unlimited Projects</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Unlimited Floorplans</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm">Priority Support</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm">Early Access Features</span>
                            </li>
                        </ul>
                        <div className="mt-8">
                            <Button asChild className="w-full bg-primary hover:bg-primary/90">
                                <Link href="#cta">Upgrade Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

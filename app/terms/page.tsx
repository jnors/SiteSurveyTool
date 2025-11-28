import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
                    <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <Image src="/images/favicon.svg" alt="FieldPins logo" width={36} height={36} className="h-9 w-9" />
                        <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">FieldPins</span>
                    </Link>
                    <Button asChild size="sm" variant="ghost">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </header>

            <main className="flex flex-1 flex-col">
                <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
                    <h1 className="mb-8 text-4xl font-bold tracking-tight">Terms and Conditions</h1>
                    <p className="mb-8 text-sm text-muted-foreground">Last Updated: November 28, 2025</p>

                    <div className="prose prose-slate max-w-none dark:prose-invert">
                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                By accessing or using FieldPins ("Service", "Application", "we", "us", "our"), you agree to be bound by
                                these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">2. Description of Service</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                FieldPins is an offline-first Progressive Web Application (PWA) for site surveys and field documentation.
                                The Service allows you to:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Upload and annotate floorplan images</li>
                                <li>Place pins with notes and photos on floorplans</li>
                                <li>Work offline after initial authentication</li>
                                <li>Manually synchronize data to your Google Drive</li>
                                <li>Export project data as JSON files</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">3. Account Registration and Authentication</h2>

                            <h3 className="mb-3 text-xl font-medium">3.1 Google Account Required</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You must have a valid Google account to use FieldPins. By signing in, you authorize us to access your
                                Google Drive for the purpose of storing and retrieving your project data.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">3.2 Account Responsibility</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You are responsible for:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Maintaining the security of your Google account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized use of your account</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">4. Subscription Plans and Billing</h2>

                            <h3 className="mb-3 text-xl font-medium">4.1 Free Tier</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                The free tier includes:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>1 project maximum</li>
                                <li>1 floorplan per project</li>
                                <li>Unlimited pins and photos within limits</li>
                                <li>Full offline functionality</li>
                                <li>Google Drive synchronization</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">4.2 Pro Tier</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                The Pro tier includes:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Unlimited projects</li>
                                <li>Unlimited floorplans per project</li>
                                <li>All features of the free tier</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">4.3 Billing and Payments</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Subscription payments are processed through Stripe. By subscribing, you agree to:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Pay all applicable subscription fees</li>
                                <li>Automatic renewal unless you cancel</li>
                                <li>Potential price changes with 30 days notice</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">4.4 Cancellation and Refunds</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You may cancel your subscription at any time through the billing portal. Cancellations take effect at
                                the end of your current billing period. We do not provide refunds for partial subscription periods except
                                as required by law.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">5. Data Ownership and Storage</h2>

                            <h3 className="mb-3 text-xl font-medium">5.1 Your Data Belongs to You</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                <strong>You retain full ownership</strong> of all data you create and upload to FieldPins, including
                                projects, floorplans, pins, notes, and photos. We claim no ownership rights over your content.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">5.2 Storage Locations</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Your data is stored in two locations:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li><strong>Local Browser Storage:</strong> Data stored in IndexedDB for offline access</li>
                                <li><strong>Google Drive:</strong> Data synced to <code>/My Drive/FieldPins/</code> folder when you trigger manual sync</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">5.3 No Server-Side Data Storage</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We do not store your project data, floorplans, pins, or photos on our servers. We only maintain minimal
                                profile information (user ID, subscription status) necessary to provide the Service.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">5.4 Data Backup Responsibility</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You are responsible for:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Manually syncing your data to Google Drive</li>
                                <li>Maintaining backups of important data</li>
                                <li>Managing your Google Drive storage quota</li>
                            </ul>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Data stored only in your browser's local storage may be lost if you clear browser data or uninstall the application.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">6. User Conduct and Acceptable Use</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You agree not to:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                                <li>Upload malicious code, viruses, or harmful content</li>
                                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                                <li>Reverse engineer, decompile, or disassemble the Service</li>
                                <li>Use automated systems (bots, scrapers) to access the Service</li>
                                <li>Interfere with or disrupt the Service or servers</li>
                                <li>Upload content that infringes on intellectual property rights of others</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">7. Offline Functionality</h2>

                            <h3 className="mb-3 text-xl font-medium">7.1 Offline-First Design</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                After initial authentication, the Service is designed to work offline. Internet connectivity is only
                                required for:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Initial sign-in</li>
                                <li>Manual synchronization to Google Drive</li>
                                <li>Subscription management</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">7.2 Manual Sync</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Synchronization to Google Drive is entirely manual. You must explicitly trigger sync operations.
                                We are not responsible for data loss due to failure to sync.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">8. Service Availability and Modifications</h2>

                            <h3 className="mb-3 text-xl font-medium">8.1 Service Availability</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We strive to maintain high availability but do not guarantee uninterrupted access to the Service.
                                We may suspend or terminate the Service for maintenance, updates, or due to circumstances beyond our control.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">8.2 Modifications to Service</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or
                                without notice. We will not be liable for any modification, suspension, or discontinuation of the Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">9. Intellectual Property</h2>

                            <h3 className="mb-3 text-xl font-medium">9.1 Our Intellectual Property</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                The Service, including its design, features, code, and branding (excluding your user content), is owned by
                                us and protected by copyright, trademark, and other intellectual property laws.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">9.2 License to Use</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We grant you a limited, non-exclusive, non-transferable license to access and use the Service for your
                                personal or business purposes in accordance with these Terms.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">10. Limitation of Liability</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND</li>
                                <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                                <li>WE ARE NOT LIABLE FOR DATA LOSS, including data stored only in browser local storage</li>
                                <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">11. Disclaimer of Warranties</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We make no warranties that:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>The Service will be uninterrupted, secure, or error-free</li>
                                <li>Data will always be accurately synced to Google Drive</li>
                                <li>The Service will meet all your requirements</li>
                                <li>All bugs or errors will be corrected</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">12. Indemnification</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You agree to indemnify and hold harmless FieldPins and its affiliates from any claims, damages, losses,
                                liabilities, and expenses (including legal fees) arising from:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Your use of the Service</li>
                                <li>Your violation of these Terms</li>
                                <li>Your violation of any third-party rights</li>
                                <li>Your content uploaded to the Service</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">13. Third-Party Services</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                The Service integrates with third-party services:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li><strong>Google Drive:</strong> Subject to Google's Terms of Service</li>
                                <li><strong>Supabase:</strong> Subject to Supabase's Terms of Service</li>
                                <li><strong>Stripe:</strong> Subject to Stripe's Terms of Service</li>
                            </ul>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We are not responsible for the actions or policies of these third-party services.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">14. Termination</h2>

                            <h3 className="mb-3 text-xl font-medium">14.1 Termination by You</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You may stop using the Service at any time. To fully terminate your account, contact us to request
                                account deletion.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">14.2 Termination by Us</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We reserve the right to suspend or terminate your access to the Service at any time for:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Violation of these Terms</li>
                                <li>Illegal or fraudulent activity</li>
                                <li>Failure to pay subscription fees</li>
                                <li>Any reason, with or without cause or notice</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">14.3 Effect of Termination</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Upon termination:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Your access to the Service will cease</li>
                                <li>Your data in Google Drive remains under your control</li>
                                <li>We may delete your profile data from our servers</li>
                                <li>Provisions regarding liability, indemnification, and dispute resolution survive termination</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">15. Governing Law and Dispute Resolution</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                                we operate, without regard to conflict of law principles.
                            </p>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Any disputes arising from these Terms or your use of the Service shall be resolved through binding
                                arbitration or in the courts of our jurisdiction, as applicable.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">16. Changes to Terms</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We may modify these Terms at any time. We will notify users of material changes by:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Updating the "Last Updated" date at the top of this page</li>
                                <li>Posting a notice on the Service</li>
                                <li>Sending an email notification (for significant changes)</li>
                            </ul>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Your continued use of the Service after changes constitutes acceptance of the modified Terms. If you do
                                not agree to the changes, you must stop using the Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">17. Severability</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall
                                continue in full force and effect.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">18. Entire Agreement</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                These Terms, together with our Privacy Policy, constitute the entire agreement between you and FieldPins
                                regarding the use of the Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">19. Contact Information</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                For questions or concerns about these Terms, please contact us at:
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>Email:</strong>{" "}
                                <a href="mailto:hello@sitetrace.app" className="text-primary hover:underline">
                                    hello@sitetrace.app
                                </a>
                            </p>
                        </section>

                        <section className="mb-8">
                            <p className="leading-relaxed text-muted-foreground">
                                By using FieldPins, you acknowledge that you have read, understood, and agree to be bound by these
                                Terms and Conditions.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="border-t border-border/40 bg-background/95 px-6 py-8 text-sm text-muted-foreground backdrop-blur-md sm:px-8">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="font-bold tracking-tight text-foreground">FieldPins</span>
                        <span className="text-muted-foreground">Manual sync • Offline after sign-in • JSON export</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/" className="transition-colors hover:text-primary">
                            Home
                        </Link>
                        <Link href="/privacy-policy" className="transition-colors hover:text-primary">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="transition-colors hover:text-primary">
                            Terms & Conditions
                        </Link>
                        <Link href="mailto:hello@sitetrace.app" className="transition-colors hover:text-primary">
                            Contact
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

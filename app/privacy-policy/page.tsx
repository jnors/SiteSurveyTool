import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
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
                    <h1 className="mb-8 text-4xl font-bold tracking-tight">Privacy Policy</h1>
                    <p className="mb-8 text-sm text-muted-foreground">Last Updated: November 28, 2025</p>

                    <div className="prose prose-slate max-w-none dark:prose-invert">
                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Welcome to FieldPins. We are committed to protecting your privacy and ensuring you have control over your data.
                                This Privacy Policy explains how we collect, use, and protect your information when you use our offline-first
                                site survey application.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">2. Information We Collect</h2>

                            <h3 className="mb-3 text-xl font-medium">2.1 Account Information</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                When you sign in with Google, we collect:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Your email address</li>
                                <li>Your Google profile information (name, profile picture)</li>
                                <li>Google OAuth tokens for Drive access</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">2.2 Application Data</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                The data you create within FieldPins (projects, floorplans, pins, notes, and photos) is stored:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li><strong>Locally in your browser</strong> using IndexedDB for offline functionality</li>
                                <li><strong>In your Google Drive</strong> under <code>/My Drive/FieldPins/</code> when you manually sync</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">2.3 Payment Information</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                If you subscribe to a paid plan, payment processing is handled entirely by Stripe. We do not store your
                                credit card information. We only receive and store your subscription status from Stripe.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">3. How We Use Your Information</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We use your information to:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Authenticate your account via Supabase Auth and Google OAuth</li>
                                <li>Enable Google Drive synchronization when you trigger a manual sync</li>
                                <li>Manage your subscription status and feature access</li>
                                <li>Provide customer support when requested</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">4. Data Storage and Ownership</h2>

                            <h3 className="mb-3 text-xl font-medium">4.1 You Own Your Data</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                <strong>All project data you create belongs to you.</strong> Your projects, floorplans, pins, notes, and photos
                                are stored exclusively in your Google Drive and your browser's local storage. We do not maintain copies of your
                                project data on our servers.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">4.2 Local Storage (IndexedDB)</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Data is stored locally in your browser using IndexedDB for offline functionality. This data remains on your
                                device and is only accessible by you. If you clear your browser data or uninstall the app, this local data
                                will be deleted.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">4.3 Google Drive Storage</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                When you manually sync, your project data is uploaded to your Google Drive account under
                                <code>/My Drive/FieldPins/</code>. This data is subject to Google's privacy policy and your Google Drive storage limits.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">4.4 Minimal Backend Storage</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We only store minimal profile information in our Supabase database:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Your user ID</li>
                                <li>Your subscription status (free, pro, etc.)</li>
                                <li>Account creation and update timestamps</li>
                            </ul>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We do not store your project data, floorplans, pins, or photos on our servers.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">5. Third-Party Services</h2>

                            <h3 className="mb-3 text-xl font-medium">5.1 Supabase</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We use Supabase for authentication and minimal user profile storage. Supabase's privacy policy applies to
                                data they process on our behalf.
                            </p>

                            <h3 className="mb-3 text-xl font-medium">5.2 Google OAuth & Drive API</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We use Google OAuth for authentication and the Google Drive API for cloud storage. Google's privacy policy
                                applies to their services. We request the following scopes:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li><code>openid</code> - Identity verification</li>
                                <li><code>email</code> - Your email address</li>
                                <li><code>profile</code> - Basic profile information</li>
                                <li><code>https://www.googleapis.com/auth/drive.file</code> - Limited Google Drive access (only files created by this app)</li>
                            </ul>

                            <h3 className="mb-3 text-xl font-medium">5.3 Stripe</h3>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Payment processing is handled by Stripe. We do not have access to your complete credit card information.
                                Stripe's privacy policy applies to payment data.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">6. Cookies and Local Storage</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We use essential cookies and browser storage to:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>Maintain your login session</li>
                                <li>Store authentication tokens securely</li>
                                <li>Enable offline functionality via IndexedDB and Service Workers</li>
                            </ul>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We do not use tracking cookies or analytics cookies.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">7. Data Security</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We implement industry-standard security measures to protect your information:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li>HTTPS encryption for all data in transit</li>
                                <li>Secure OAuth 2.0 authentication flow</li>
                                <li>HTTP-only cookies for session management</li>
                                <li>No server-side storage of sensitive project data</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">8. Your Rights</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                You have the following rights regarding your data:
                            </p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                                <li><strong>Access:</strong> You can access all your project data in your Google Drive</li>
                                <li><strong>Export:</strong> Download your projects as JSON files directly from Google Drive</li>
                                <li><strong>Delete:</strong> Delete projects from the app (removes from local storage and Google Drive)</li>
                                <li><strong>Account Deletion:</strong> Request account deletion by contacting us</li>
                                <li><strong>Revoke Access:</strong> Revoke FieldPins access to Google Drive from your Google Account settings</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">9. Data Retention</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We retain minimal profile data (user ID, subscription status) for as long as your account is active.
                                Your project data in Google Drive is retained according to your own preferences and Google's policies.
                                Local browser data persists until you clear it or uninstall the app.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">10. Children's Privacy</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                FieldPins is not intended for use by children under 13 years of age. We do not knowingly collect
                                information from children under 13.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">11. International Data Transfers</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                Your data may be processed in various locations depending on where our service providers operate
                                (Supabase, Google, Stripe). We ensure appropriate safeguards are in place for international data transfers.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">12. Changes to This Policy</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                We may update this Privacy Policy from time to time. We will notify you of significant changes by
                                updating the "Last Updated" date at the top of this policy. Continued use of FieldPins after changes
                                constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="mb-4 text-2xl font-semibold">13. Contact Us</h2>
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>Email:</strong>{" "}
                                <a href="mailto:fieldpins@jnors.eu" className="text-primary hover:underline">
                                    fieldpins@jnors.eu
                                </a>
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
                        <Link href="mailto:fieldpins@jnors.eu" className="transition-colors hover:text-primary">
                            Contact
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

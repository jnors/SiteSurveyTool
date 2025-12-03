import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Demo() {
    return (
        <section id="demo" className="w-full py-12 md:py-24 lg:py-32 bg-background">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">See it in Action</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Watch how quickly you can map out a site, add pins, and sync everything to Google Drive.
                        </p>
                    </div>
                </div>
                <div className="mx-auto max-w-4xl mt-12">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted shadow-xl">
                        {/* Loom embed with analytics disabled to prevent SDK initialization errors */}
                        <iframe
                            src="https://www.loom.com/embed/1c4514bdad744388be751bc312e18a77"
                            frameBorder="0"
                            allowFullScreen
                            className="absolute top-0 left-0 h-full w-full"
                            title="SiteSurveyTool Demo"
                        ></iframe>
                    </div>
                </div>
                <div className="flex justify-center mt-12">
                    <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href="#cta">Start Mapping Now</Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}

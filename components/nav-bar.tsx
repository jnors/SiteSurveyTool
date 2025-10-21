import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function NavBar() {
  return (
    <nav className="border-b border-(--color-border) bg-(--color-background-elevated)">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/projects" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-(--color-primary)">
            <span className="font-bold text-white text-sm">SST</span>
          </div>
          <span className="font-semibold text-(--color-foreground) text-lg">Site Survey Tool</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-(--color-foreground-muted) hover:text-(--color-foreground)"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </nav>
  )
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="text-xl font-bold">
                    Link<span className="text-primary">ID</span>
                </Link>

                {/* Center nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                    <a href="#features" className="hover:text-foreground">
                        Features
                    </a>
                    <a href="#how" className="hover:text-foreground">
                        How it works
                    </a>
                    <a href="#demo" className="hover:text-foreground">
                        Demo
                    </a>
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    <Button asChild>
                        <Link href="/login">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
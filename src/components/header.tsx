import Link from 'next/link';
import { Button } from './ui/button';
import { GalleryHorizontal } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
      <Link href="/" className="text-xl font-semibold tracking-tighter text-primary">
        WRDROBE
      </Link>
      <nav className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/gallery">
            <GalleryHorizontal className="mr-2 h-4 w-4" />
            My Outfits
          </Link>
        </Button>
        <ThemeToggle />
      </nav>
    </header>
  );
}

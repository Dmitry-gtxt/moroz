import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Snowflake, User, LogIn } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Snowflake className="h-8 w-8 text-accent transition-transform group-hover:rotate-45 duration-300" />
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            ДедМороз<span className="text-accent">.kg</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/catalog" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Каталог
          </Link>
          <Link 
            to="/how-it-works" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Как это работает
          </Link>
          <Link 
            to="/for-performers" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Исполнителям
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">
              <LogIn className="h-4 w-4 mr-1" />
              Войти
            </Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <Link to="/register">
              Регистрация
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-accent/10 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            <Link 
              to="/catalog" 
              className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Каталог
            </Link>
            <Link 
              to="/how-it-works" 
              className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Как это работает
            </Link>
            <Link 
              to="/for-performers" 
              className="px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Исполнителям
            </Link>
            <div className="border-t border-border my-2" />
            <div className="flex gap-2 px-4">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/login">Войти</Link>
              </Button>
              <Button variant="gold" size="sm" className="flex-1" asChild>
                <Link to="/register">Регистрация</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

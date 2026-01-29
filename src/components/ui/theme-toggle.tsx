import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-muted-foreground hover:text-foreground"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 transition-transform" />
      ) : (
        <Moon className="h-5 w-5 transition-transform" />
      )}
      <span className="sr-only">تبديل الوضع</span>
    </Button>
  );
}

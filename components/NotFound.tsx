import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from './ui/button';

interface NotFoundProps {
  title?: string;
  message?: string;
}

export default function NotFound({
  title = 'Page not found',
  message = "The page you're looking for doesn't exist or has moved.",
}: NotFoundProps) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Rugved Zarkar`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 pt-24 pb-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Compass className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl md:text-4xl mb-3">{title}</h1>
        <p className="text-muted-foreground mb-8">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Back home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/#projects">See all projects</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

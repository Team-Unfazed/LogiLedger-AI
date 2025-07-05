import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { ThemeToggle } from "@/components/ui/theme-toggle.jsx";
import { SplineBackground } from "@/components/ui/spline-background.jsx";
import { Truck, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <SplineBackground />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Truck className="h-12 w-12 text-primary" />
          <span className="text-2xl font-bold text-primary">LogiLedger AI</span>
        </div>

        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          The logistics route you're looking for seems to have taken a detour.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

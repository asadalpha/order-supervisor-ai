import Link from "next/link";
import { Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface">
        <Eye className="h-7 w-7 text-accent" />
      </div>

      <p className="font-mono text-5xl font-semibold text-text">404</p>
      <h1 className="mt-3 text-lg font-medium text-text">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-text-muted">
        The page you are looking for doesn&rsquo;t exist or has been moved.
      </p>

      <Link href="/" className="mt-6">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
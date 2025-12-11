import { Ticket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: "ticket" | "plus";
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon = "ticket",
}: EmptyStateProps) {
  const Icon = icon === "ticket" ? Ticket : Plus;

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold" data-testid="text-empty-title">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground" data-testid="text-empty-description">
        {description}
      </p>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <Button data-testid="button-empty-action">
                <Plus className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction} data-testid="button-empty-action">
              <Plus className="mr-2 h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

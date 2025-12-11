import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = {
    PENDING: {
      icon: Clock,
      label: "Pending",
      className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    },
    CONFIRMED: {
      icon: CheckCircle,
      label: "Confirmed",
      className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    FAILED: {
      icon: XCircle,
      label: "Failed",
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
  };

  const { icon: Icon, label, className: statusClassName } = config[status];

  return (
    <Badge 
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1",
        statusClassName,
        status === "PENDING" && "animate-pulse",
        className
      )}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LinkStatus } from "@/lib/api";

export default function StatusBadge({ status }: { status: LinkStatus }) {
  if (status === "live") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 text-[10px]">
        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Live
      </Badge>
    );
  }
  if (status === "removed") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 text-[10px]">
        <XCircle className="h-2.5 w-2.5 mr-0.5" /> Removed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 text-[10px]">
      <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
    </Badge>
  );
}

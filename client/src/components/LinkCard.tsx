import { useState } from "react";
import { format } from "date-fns";
import {
  Globe,
  ExternalLink,
  Target,
  Tag,
  StickyNote,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StatusBadge from "./StatusBadge";
import { linkApi, ApiError, type TrackedLink, type LinkStatus } from "@/lib/api";

interface Props {
  link: TrackedLink;
  onUpdate: (link: TrackedLink) => void;
  onDelete: (id: number) => void;
}

const linkTypeLabel = (type?: string) => {
  switch (type) {
    case "dofollow":
      return "Do-follow";
    case "nofollow":
      return "No-follow";
    case "sponsored":
      return "Sponsored";
    default:
      return "";
  }
};

const particularLabel = (particular?: string) => {
  switch (particular) {
    case "free":
      return "Free";
    case "exchange":
      return "Exchange";
    case "paid":
      return "Paid";
    default:
      return "";
  }
};

export default function LinkCard({ link, onUpdate, onDelete }: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setStatus = async (status: LinkStatus) => {
    if (status === link.status) return;
    setBusy(true);
    try {
      const res = await linkApi.update(link.id, { status });
      onUpdate(res.link);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  // "Check now" is manual in the open tool: open the page so the user can eyeball
  // it, then nudge them to set the status. (Automated checking lives on swappsy.net.)
  const openPage = () => {
    window.open(link.placementUrl, "_blank", "noopener,noreferrer");
    toast.message("Opened the page — set the status once you've checked it.");
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await linkApi.remove(link.id);
      onDelete(link.id);
      toast.success("Link deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete link");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-card space-y-2 text-xs animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <a
          href={link.placementUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all flex items-start gap-1 font-medium"
        >
          <Globe className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{link.placementUrl}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
        </a>
        <StatusBadge status={link.status} />
      </div>

      {link.targetUrl && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Target className="h-3 w-3 flex-shrink-0" />
          <a href={link.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline break-all line-clamp-1">
            {link.targetUrl}
          </a>
        </div>
      )}
      {link.anchorText && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Tag className="h-3 w-3 flex-shrink-0" /> <span className="font-medium text-foreground">{link.anchorText}</span>
        </div>
      )}
      {link.partnerName && (
        <div className="text-muted-foreground">
          Partner: <span className="text-foreground">{link.partnerName}</span>
        </div>
      )}
      {(link.linkType || link.particular) && (
        <div className="flex flex-wrap gap-1.5">
          {link.linkType && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {linkTypeLabel(link.linkType)}
            </Badge>
          )}
          {link.particular && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background">
              {particularLabel(link.particular)}
              {link.particular === "paid" && link.paidAmount ? ` - ${link.paidAmount}` : ""}
            </Badge>
          )}
        </div>
      )}
      {link.particularDetails && (
        <div className="text-muted-foreground line-clamp-2">
          <span className="font-medium">
            {link.particular === "paid" ? "Payment notes:" : "Exchange details:"}
          </span>{" "}
          {link.particularDetails}
        </div>
      )}
      {link.notes && (
        <div className="flex items-start gap-1 text-muted-foreground">
          <StickyNote className="h-3 w-3 flex-shrink-0 mt-0.5" /> <span className="line-clamp-2">{link.notes}</span>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Added {format(new Date(link.createdAt), "MMM d, yyyy")}
      </p>

      <div className="flex items-center justify-between pt-1 border-t">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Status:</span>
          <Select value={link.status} onValueChange={(v) => setStatus(v as LinkStatus)} disabled={busy}>
            <SelectTrigger className="h-6 w-[108px] text-[10px] px-2 py-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending" className="text-xs">⏳ Pending</SelectItem>
              <SelectItem value="live" className="text-xs">✅ Live</SelectItem>
              <SelectItem value="removed" className="text-xs">❌ Removed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={openPage}
            title="Open the placement page to check manually"
          >
            <ExternalLink className="h-3 w-3" /> Open page
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the tracked link. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

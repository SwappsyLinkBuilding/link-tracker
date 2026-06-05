import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Loader2, Search, CheckCircle2, XCircle, Clock, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddLinkDialog from "./AddLinkDialog";
import LinkCard from "./LinkCard";
import { linkApi, ApiError, type TrackedLink, type LinkStatus } from "@/lib/api";

type Filter = "all" | LinkStatus;

export default function LinkGrid() {
  const [links, setLinks] = useState<TrackedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadLinks = () =>
    linkApi
      .list()
      .then((d) => setLinks(d.links))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load links"))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadLinks();
  }, []);

  const handleExport = async () => {
    try {
      const csv = await linkApi.exportCsv();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "swappsy-links.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export failed");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    setImporting(true);
    try {
      const csv = await file.text();
      const res = await linkApi.importCsv(csv);
      await loadLinks();
      toast.success(`Imported ${res.imported} link(s)${res.skipped ? `, skipped ${res.skipped}` : ""}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const summary = useMemo(
    () => ({
      total: links.length,
      live: links.filter((l) => l.status === "live").length,
      pending: links.filter((l) => l.status === "pending").length,
      removed: links.filter((l) => l.status === "removed").length,
    }),
    [links]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (!q) return true;
      return [
        l.placementUrl,
        l.targetUrl,
        l.anchorText,
        l.partnerName,
        l.linkType,
        l.particular,
        l.particularDetails,
        l.paidAmount,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [links, filter, search]);

  const onCreated = (link: TrackedLink) => setLinks((prev) => [link, ...prev]);
  const onUpdate = (link: TrackedLink) => setLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
  const onDelete = (id: number) => setLinks((prev) => prev.filter((l) => l.id !== id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {summary.total} link{summary.total === 1 ? "" : "s"} monitored
          </span>
          <span className="inline-flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" /> {summary.live} live
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Clock className="h-3 w-3" /> {summary.pending} pending
          </span>
          <span className="inline-flex items-center gap-1 text-red-600">
            <XCircle className="h-3 w-3" /> {summary.removed} removed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={importing}
            title="Import links from a CSV file"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={links.length === 0}
            title="Export links to a CSV file"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <AddLinkDialog onCreated={onCreated} />
        </div>
      </div>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links, partners, anchors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Grid / empty states */}
      {links.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <Link2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">No links yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a link you exchanged with a partner to start tracking it.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center text-sm text-muted-foreground">
          No links match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((link) => (
            <LinkCard key={link.id} link={link} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

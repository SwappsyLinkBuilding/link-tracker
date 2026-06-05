import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkApi, ApiError, type Particular, type TrackedLink, type LinkType } from "@/lib/api";

const empty = {
  placementUrl: "",
  targetUrl: "",
  anchorText: "",
  partnerName: "",
  linkType: "" as LinkType,
  particular: "" as Particular,
  particularDetails: "",
  paidAmount: "",
  notes: "",
};

export default function AddLinkDialog({ onCreated }: { onCreated: (link: TrackedLink) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.placementUrl.trim()) {
      toast.error("Placement URL is required");
      return;
    }
    if (!form.linkType) {
      toast.error("Type is required");
      return;
    }
    if (!form.particular) {
      toast.error("Particular is required");
      return;
    }
    if (form.particular === "exchange" && !form.particularDetails.trim()) {
      toast.error("Exchange details are required");
      return;
    }
    if (form.particular === "paid" && !form.paidAmount.trim()) {
      toast.error("Amount is required");
      return;
    }
    setSaving(true);
    try {
      const { link } = await linkApi.create(form);
      onCreated(link);
      setForm(empty);
      setOpen(false);
      toast.success("Link added");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4" /> Add link
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a link</DialogTitle>
            <DialogDescription>Track a link you exchanged with a partner.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label htmlFor="placementUrl">
                Placement URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="placementUrl"
                placeholder="https://partner-site.com/page-with-your-link"
                value={form.placementUrl}
                onChange={(e) => setForm({ ...form, placementUrl: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">The page where your link was placed.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                placeholder="https://your-site.com"
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">Where the link should point (usually your site).</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="anchorText">Anchor text</Label>
                <Input
                  id="anchorText"
                  placeholder="e.g. best SEO tools"
                  value={form.anchorText}
                  onChange={(e) => setForm({ ...form, anchorText: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="partnerName">Partner</Label>
                <Input
                  id="partnerName"
                  placeholder="Who you exchanged with"
                  value={form.partnerName}
                  onChange={(e) => setForm({ ...form, partnerName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select value={form.linkType} onValueChange={(value) => setForm({ ...form, linkType: value as LinkType })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dofollow">Do-follow</SelectItem>
                    <SelectItem value="nofollow">No-follow</SelectItem>
                    <SelectItem value="sponsored">Sponsored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>
                  Particular <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.particular}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      particular: value as Particular,
                      particularDetails: value === "paid" || value === "free" ? "" : form.particularDetails,
                      paidAmount: value === "paid" ? form.paidAmount : "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select particular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.particular === "exchange" && (
              <div className="space-y-1">
                <Label htmlFor="particularDetails">
                  Exchange details <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="particularDetails"
                  placeholder="e.g. Return link, guest post, homepage placement"
                  value={form.particularDetails}
                  onChange={(e) => setForm({ ...form, particularDetails: e.target.value })}
                />
              </div>
            )}
            {form.particular === "paid" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="paidAmount">
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="paidAmount"
                    placeholder="e.g. $50"
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="particularDetails">Payment notes</Label>
                  <Input
                    id="particularDetails"
                    placeholder="Optional notes"
                    value={form.particularDetails}
                    onChange={(e) => setForm({ ...form, particularDetails: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Anything to remember about this exchange"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

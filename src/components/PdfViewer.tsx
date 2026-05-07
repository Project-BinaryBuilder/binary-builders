import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filePath: string | null;
  title: string;
}

export const PdfViewer = ({ open, onOpenChange, filePath, title }: Props) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !filePath) { setUrl(null); return; }
    setLoading(true);
    supabase.storage.from("pdfs").createSignedUrl(filePath, 60 * 30)
      .then(({ data, error }) => {
        if (error) { toast.error(error.message); onOpenChange(false); return; }
        setUrl(data.signedUrl);
      })
      .finally(() => setLoading(false));
  }, [open, filePath, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="truncate">{title}</DialogTitle>
            {url && (
              <div className="flex gap-2">
                <Button asChild size="sm" variant="ghost" className="rounded-full">
                  <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Open</a>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <a href={url} download><Download className="h-4 w-4 mr-2" />Download</a>
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 bg-muted h-full">
          {loading && <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
          {url && !loading && (
            <iframe src={`${url}#toolbar=1&view=FitH`} title={title} className="w-full h-full border-0" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

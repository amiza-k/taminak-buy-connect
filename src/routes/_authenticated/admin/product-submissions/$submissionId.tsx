import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import {
  productSubmissionAdminQuery,
  useApproveProductSubmission,
  useLinkProductSubmissionToExisting,
  useRejectProductSubmission,
} from "@/lib/admin";
import { canonicalProductSearchQuery } from "@/lib/catalog";
import { formatDate, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/product-submissions/$submissionId")({
  head: () => ({ meta: [{ title: "جزئیات درخواست محصول | پنل مدیریت" }] }),
  component: AdminProductSubmissionDetailPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

function AdminProductSubmissionDetailPage() {
  const { submissionId } = Route.useParams();
  const query = useQuery(productSubmissionAdminQuery(submissionId));
  const approve = useApproveProductSubmission();
  const linkExisting = useLinkProductSubmissionToExisting();
  const reject = useRejectProductSubmission();
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showLinkSearch, setShowLinkSearch] = useState(false);
  const [linkTerm, setLinkTerm] = useState("");
  const linkResults = useQuery({
    ...canonicalProductSearchQuery(linkTerm.trim()),
    enabled: showLinkSearch && linkTerm.trim().length > 0,
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const submission = query.data;
  if (!submission) return <EmptyState label="درخواستی پیدا نشد." />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{submission.proposed_name}</h1>
        <Badge variant="secondary">{STATUS_LABELS[submission.status] ?? submission.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 text-sm shadow-card">
        <div>
          <p className="text-muted-foreground">تأمین‌کننده</p>
          <p className="mt-1 font-medium">{submission.supplierName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">دسته‌بندی</p>
          <p className="mt-1 font-medium">{submission.proposed_category ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">برند</p>
          <p className="mt-1 font-medium">{submission.proposed_brand ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">واحد</p>
          <p className="mt-1 font-medium">{submission.proposed_unit ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">قیمت پیشنهادی</p>
          <p className="mt-1 font-medium">
            {submission.proposed_price === null ? "—" : formatToman(submission.proposed_price)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">SKU</p>
          <p className="mt-1 font-medium" dir="ltr">
            {submission.proposed_sku ?? "—"}
          </p>
        </div>
        {submission.proposed_description ? (
          <div className="col-span-2">
            <p className="text-muted-foreground">توضیحات</p>
            <p className="mt-1 font-medium leading-7">{submission.proposed_description}</p>
          </div>
        ) : null}
        <div className="col-span-2">
          <p className="text-muted-foreground">تاریخ ثبت</p>
          <p className="mt-1 font-medium">{formatDate(submission.created_at)}</p>
        </div>
        {submission.status === "rejected" && submission.rejection_reason ? (
          <div className="col-span-2">
            <p className="text-muted-foreground">دلیل رد</p>
            <p className="mt-1 font-medium text-destructive">{submission.rejection_reason}</p>
          </div>
        ) : null}
      </div>

      {submission.status === "pending" ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={approve.isPending}
              onClick={() =>
                approve.mutate(submission.id, {
                  onSuccess: () => toast.success("محصول تأیید شد"),
                  onError: () => toast.error("تأیید محصول ناموفق بود"),
                })
              }
            >
              تأیید محصول
            </Button>
            <Button
              variant="outline"
              disabled={reject.isPending}
              onClick={() => setShowRejectForm((v) => !v)}
            >
              رد محصول
            </Button>
            <Button
              variant="outline"
              disabled={linkExisting.isPending}
              onClick={() => setShowLinkSearch((v) => !v)}
            >
              اتصال به محصول موجود
            </Button>
          </div>

          {showLinkSearch ? (
            <div className="space-y-2">
              <Label htmlFor="link-search">جست‌وجوی محصول Canonical موجود</Label>
              <Input
                id="link-search"
                value={linkTerm}
                onChange={(e) => setLinkTerm(e.target.value)}
                placeholder="نام محصول را جست‌وجو کنید"
              />
              {linkResults.isPending && linkTerm.trim() ? (
                <p className="text-xs text-muted-foreground">در حال جست‌وجو…</p>
              ) : null}
              {(linkResults.data ?? []).length > 0 ? (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {(linkResults.data ?? []).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                      <span>
                        {p.name}
                        {p.brand ? ` — ${p.brand}` : ""}
                      </span>
                      <Button
                        size="sm"
                        disabled={linkExisting.isPending}
                        onClick={() =>
                          linkExisting.mutate(
                            { submissionId: submission.id, existingProductId: p.id },
                            {
                              onSuccess: () => toast.success("درخواست به محصول موجود متصل شد"),
                              onError: () => toast.error("اتصال ناموفق بود"),
                            },
                          )
                        }
                      >
                        اتصال
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {showRejectForm ? (
            <div className="space-y-2">
              <Label htmlFor="reject-reason">دلیل رد محصول</Label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                variant="destructive"
                disabled={reject.isPending || !reason.trim()}
                onClick={() =>
                  reject.mutate(
                    { submissionId: submission.id, reason: reason.trim() },
                    {
                      onSuccess: () => {
                        toast.success("محصول رد شد");
                        setShowRejectForm(false);
                        setReason("");
                      },
                      onError: () => toast.error("ثبت رد محصول ناموفق بود"),
                    },
                  )
                }
              >
                ثبت رد
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

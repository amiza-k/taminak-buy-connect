import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import {
  supplierApplicationAdminQuery,
  useApproveSupplierApplication,
  useRejectSupplierApplication,
} from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute(
  "/_authenticated/admin/supplier-applications/$applicationId",
)({
  head: () => ({ meta: [{ title: "جزئیات درخواست فروشندگی | پنل مدیریت" }] }),
  component: AdminSupplierApplicationDetailPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

function AdminSupplierApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const query = useQuery(supplierApplicationAdminQuery(applicationId));
  const approve = useApproveSupplierApplication();
  const reject = useRejectSupplierApplication();
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const application = query.data;
  if (!application) return <EmptyState label="درخواستی پیدا نشد." />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{application.business_name}</h1>
        <Badge variant="secondary">{STATUS_LABELS[application.status] ?? application.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 text-sm shadow-card">
        <div>
          <p className="text-muted-foreground">نام مسئول</p>
          <p className="mt-1 font-medium">{application.owner_name ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">تلفن</p>
          <p className="mt-1 font-medium" dir="ltr">{application.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">ایمیل</p>
          <p className="mt-1 font-medium" dir="ltr">{application.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">استان و شهر</p>
          <p className="mt-1 font-medium">{application.province} — {application.city}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">آدرس</p>
          <p className="mt-1 font-medium">{application.address ?? "—"}</p>
        </div>
        {application.description ? (
          <div className="col-span-2">
            <p className="text-muted-foreground">توضیحات</p>
            <p className="mt-1 font-medium leading-7">{application.description}</p>
          </div>
        ) : null}
        <div className="col-span-2">
          <p className="text-muted-foreground">تاریخ ثبت</p>
          <p className="mt-1 font-medium">{formatDate(application.created_at)}</p>
        </div>
        {application.status === "rejected" && application.rejection_reason ? (
          <div className="col-span-2">
            <p className="text-muted-foreground">دلیل رد</p>
            <p className="mt-1 font-medium text-destructive">{application.rejection_reason}</p>
          </div>
        ) : null}
      </div>

      {application.status === "pending" ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={approve.isPending}
              onClick={() =>
                approve.mutate(application.id, {
                  onSuccess: () => toast.success("درخواست تأیید شد"),
                  onError: () => toast.error("تأیید درخواست ناموفق بود"),
                })
              }
            >
              تأیید درخواست
            </Button>
            <Button
              variant="outline"
              disabled={reject.isPending}
              onClick={() => setShowRejectForm((v) => !v)}
            >
              رد درخواست
            </Button>
          </div>

          {showRejectForm ? (
            <div className="space-y-2">
              <Label htmlFor="reject-reason">دلیل رد درخواست</Label>
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
                    { applicationId: application.id, reason: reason.trim() },
                    {
                      onSuccess: () => {
                        toast.success("درخواست رد شد");
                        setShowRejectForm(false);
                        setReason("");
                      },
                      onError: () => toast.error("ثبت رد درخواست ناموفق بود"),
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
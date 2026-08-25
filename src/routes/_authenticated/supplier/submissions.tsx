import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { useSupplierMembership, supplierSubmissionsQuery, SUBMISSION_STATUS_LABELS } from "@/lib/supplier";
import { formatDate, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/supplier/submissions")({
  head: () => ({ meta: [{ title: "درخواست‌های محصول | تأمینک" }] }),
  component: SupplierSubmissionsPage,
});

function SupplierSubmissionsPage() {
  const { organization } = useSupplierMembership();
  const orgId = organization?.id ?? null;
  const query = useQuery({ ...supplierSubmissionsQuery(orgId), enabled: Boolean(orgId) });
  
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  const submissions = query.data ?? [];
  if (submissions.length === 0) {
    return <EmptyState label="هنوز درخواست محصولی ثبت نکرده‌اید." />;
  }

  return (
    <ul className="space-y-3">
      {submissions.map((s) => (
        <li key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{s.proposed_name}</p>
            <Badge variant="secondary">{SUBMISSION_STATUS_LABELS[s.status] ?? s.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {[s.proposed_category, formatDate(s.created_at)].filter(Boolean).join(" — ")}
          </p>
          {s.proposed_price !== null ? (
            <p className="mt-1 text-sm text-primary">{formatToman(s.proposed_price)}</p>
          ) : null}
          {s.status === "rejected" && s.rejection_reason ? (
            <p className="mt-2 text-sm text-destructive">دلیل رد: {s.rejection_reason}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
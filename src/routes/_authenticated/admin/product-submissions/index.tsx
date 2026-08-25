import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { productSubmissionsAdminQuery, type ApplicationStatusFilter } from "@/lib/admin";
import { formatDate, formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/product-submissions/")({
  head: () => ({ meta: [{ title: "درخواست‌های محصول | پنل مدیریت" }] }),
  component: AdminProductSubmissionsPage,
});

const STATUS_LABELS: Record<ApplicationStatusFilter, string> = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

function AdminProductSubmissionsPage() {
  const [status, setStatus] = useState<ApplicationStatusFilter>("pending");
  const query = useQuery(productSubmissionsAdminQuery(status));

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
        {(Object.keys(STATUS_LABELS) as ApplicationStatusFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              status === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {STATUS_LABELS[key]}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState label="درخواستی پیدا نشد." />
      ) : (
        <ul className="space-y-3">
          {(query.data ?? []).map((submission) => (
            <li key={submission.id}>
              <Link
                to="/admin/product-submissions/$submissionId"
                params={{ submissionId: submission.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="font-semibold">{submission.proposed_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {submission.supplierName} — {formatDate(submission.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {submission.proposed_price !== null ? (
                    <p className="text-sm text-primary">{formatToman(submission.proposed_price)}</p>
                  ) : null}
                  <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
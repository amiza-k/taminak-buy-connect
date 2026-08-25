import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/catalog";
import { supplierApplicationsAdminQuery, type ApplicationStatusFilter } from "@/lib/admin";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/supplier-applications/")({
  head: () => ({ meta: [{ title: "درخواست‌های فروشندگی | پنل مدیریت" }] }),
  component: AdminSupplierApplicationsPage,
});

const STATUS_LABELS: Record<ApplicationStatusFilter, string> = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

function AdminSupplierApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatusFilter>("pending");
  const query = useQuery(supplierApplicationsAdminQuery(status));

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
          {(query.data ?? []).map((application) => (
            <li key={application.id}>
              <Link
                to="/admin/supplier-applications/$applicationId"
                params={{ applicationId: application.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="font-semibold">{application.business_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[application.city, application.province].filter(Boolean).join("، ")} —{" "}
                    {formatDate(application.created_at)}
                  </p>
                </div>
                <Badge variant="secondary">{STATUS_LABELS[status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
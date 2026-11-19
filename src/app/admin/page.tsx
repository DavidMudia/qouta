import { requireAdmin } from "@/services/authService";
import {
  getPublishedSnapshot,
  getWorkingSnapshot,
  listVersions,
} from "@/services/pricingService";
import { listSubmissions } from "@/services/submissionService";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();

  if (!admin) {
    return <AdminLogin />;
  }

  const [working, published, versions, submissions] = await Promise.all([
    getWorkingSnapshot(),
    getPublishedSnapshot(),
    listVersions().catch(() => []),
    listSubmissions().catch(() => []),
  ]);

  return (
    <AdminDashboard
      admin={admin}
      working={working}
      published={published}
      versions={versions.map((v) => ({
        version: v.version,
        note: v.note,
        publishedAt: v.publishedAt.toISOString(),
        publishedBy: v.publishedBy,
      }))}
      submissions={submissions.map((s) => ({
        ref: s.ref,
        createdAt: s.createdAt.toISOString(),
        name: s.name,
        email: s.email,
        company: s.company,
        categoryCode: s.categoryCode,
        pages: s.pages,
        subtotal: s.subtotal,
        estimateMin: s.estimateMin,
        estimateMax: s.estimateMax,
        claimedSubtotal: s.claimedSubtotal,
        pricingVersion: s.pricingVersion,
        mismatch: s.mismatch,
        source: s.source,
        status: s.status,
        outcomeCount: Array.isArray((s.answers as { outcomes?: unknown[] }).outcomes)
          ? ((s.answers as { outcomes: unknown[] }).outcomes.length ?? 0)
          : 0,
      }))}
    />
  );
}
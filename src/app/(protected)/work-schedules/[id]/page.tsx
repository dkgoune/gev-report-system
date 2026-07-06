import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkScheduleDetailEditor } from "@/components/work-schedule-management/work-schedule-detail-editor";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { listScopedUsers } from "@/lib/user-scope";
import { hasPermission } from "@/lib/permissions";

type WorkScheduleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkScheduleDetailPage({
  params,
}: WorkScheduleDetailPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (
    !hasPermission(
      session,
      "work_schedule_read",
      "work_schedule_create",
      "work_schedule_update",
      "work_schedule_delete"
    )
  ) {
    redirect("/");
  }

  const { id } = await params;

  const [schedule, users, posts] = await Promise.all([
    prisma.workSchedule.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
        workDate: true,
        status: true,
        createdAt: true,
        service: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignments: {
          orderBy: [{ isLeader: "desc" }, { isSubleader: "desc" }],
          select: {
            id: true,
            userId: true,
            postId: true,
            isLeader: true,
            isSubleader: true,
            attendanceStatus: true,
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
              },
            },
            post: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    }),
    listScopedUsers(session),
    prisma.workPost.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        serviceId: true,
      },
    }),
  ]);

  if (!schedule) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/work-schedules">Vue d'ensemble</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/work-schedules/list">Liste</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/work-schedules/new">Nouveau</Link>
        </Button>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <WorkScheduleDetailEditor
          schedule={{
            id: schedule.id,
            workDate: schedule.workDate.toISOString(),
            status: schedule.status,
            createdAt: schedule.createdAt.toISOString(),
            service: schedule.service,
            assignments: schedule.assignments,
          }}
          users={users}
          posts={posts}
        />
      </section>
    </div>
  );
}

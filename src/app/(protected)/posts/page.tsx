import { redirect } from "next/navigation";
import { WorkPostsManager } from "@/components/work-post-management/work-posts-manager";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export default async function PostsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (
    !hasPermission(
      session,
      "work_schedule_create",
      "work_schedule_update",
      "work_schedule_delete",
      "work_schedule_read"
    )
  ) {
    redirect("/");
  }

  const [posts, services] = await Promise.all([
    prisma.workPost.findMany({
      where: {
        agencyId: session.activeAgencyId,
      },
      orderBy: [{ isActive: "desc" }, { order: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        order: true,
        serviceId: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.serviceDefinition.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <WorkPostsManager
      initialWorkPosts={posts.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      }))}
      services={services}
    />
  );
}

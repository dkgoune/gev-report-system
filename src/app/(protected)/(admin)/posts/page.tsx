import { redirect } from "next/navigation";
import { WorkPostsManager } from "@/components/work-post-management/work-posts-manager";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function PostsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  const posts = await prisma.workPost.findMany({
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
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <WorkPostsManager
      initialWorkPosts={posts.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      }))}
    />
  );
}

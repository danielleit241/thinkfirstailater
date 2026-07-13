import { prisma } from "@/server/db"

/**
 * Admin-facing reads — unlike `learning/queries.ts`/`vouchers/queries.ts`,
 * these intentionally return inactive rows too, so an admin can re-enable
 * something they (or a previous seed) turned off. These are separate
 * functions, not a filter toggle added to the user-facing queries, so the
 * USER-facing catalog/voucher list can never accidentally leak inactive
 * content.
 */

export async function getRewardConfigForAdmin() {
  return prisma.rewardConfig.findFirst({ orderBy: { createdAt: "desc" } })
}

export async function listAllVouchersForAdmin() {
  return prisma.voucher.findMany({ orderBy: { riceCost: "asc" } })
}

export type AdminActivityItem = {
  id: string
  slug: string
  title: string
  active: boolean
  sortOrder: number
}

export type AdminModuleItem = {
  id: string
  slug: string
  title: string
  active: boolean
  sortOrder: number
  activities: AdminActivityItem[]
}

export type AdminTrackItem = {
  id: string
  slug: string
  title: string
  active: boolean
  sortOrder: number
  modules: AdminModuleItem[]
}

export async function listAllTracksForAdmin(): Promise<AdminTrackItem[]> {
  const tracks = await prisma.track.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    include: {
      modules: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        include: {
          activities: {
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "asc" },
              { id: "asc" },
            ],
          },
        },
      },
    },
  })

  return tracks.map((track) => ({
    id: track.id,
    slug: track.slug,
    title: track.title,
    active: track.active,
    sortOrder: track.sortOrder,
    modules: track.modules.map((module) => ({
      id: module.id,
      slug: module.slug,
      title: module.title,
      active: module.active,
      sortOrder: module.sortOrder,
      activities: module.activities.map((activity) => ({
        id: activity.id,
        slug: activity.slug,
        title: activity.title,
        active: activity.active,
        sortOrder: activity.sortOrder,
      })),
    })),
  }))
}

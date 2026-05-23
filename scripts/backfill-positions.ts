import 'dotenv/config'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting backfill: set sequential `position` per user')
  const users = await prisma.user.findMany({ select: { id: true } })
  let updated = 0
  let processedLinks = 0

  for (const u of users) {
        const links = await prisma.link.findMany({
      where: { userId: u.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, position: true }
        })

    const tx: Prisma.PrismaPromise<unknown>[] = []
    for (let i = 0; i < links.length; i++) {
      processedLinks++
      const desired = i + 1
      if (links[i].position !== desired) {
        tx.push(prisma.link.update({ where: { id: links[i].id }, data: { position: desired } }))
        updated++
      }
    }

    if (tx.length) {
      await prisma.$transaction(tx)
    }
  }

  const total = await prisma.link.count()
  const withPosition = await prisma.link.count({ where: { position: { gt: 0 } } })

  console.log(`Done. Total links: ${total}, with position>0: ${withPosition}, updated: ${updated}, processedLinks: ${processedLinks}`)
}

main()
  .catch((e) => {
    console.error('Backfill error', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())


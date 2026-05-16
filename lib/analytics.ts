import prisma from "@/lib/prisma";

type TrackClickInput = {
  linkId: string;
  userId: string;
  headers: Headers;
};

export async function trackLinkClick(input: TrackClickInput): Promise<void> {
  const { linkId, userId } = input;

  try {
    await prisma.link.update({
      where: { id: linkId },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });
  } catch (err) {
    console.error("Click tracking failed:", err);
  }
}
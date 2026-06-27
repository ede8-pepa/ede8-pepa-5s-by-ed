import { NextResponse } from "next/server";
import { deleteAppwritePhoto } from "@/lib/data/appwrite-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteAppwritePhoto(id);

    return NextResponse.json({ message: "Photo supprimée." });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Suppression impossible.",
      },
      { status: 400 },
    );
  }
}

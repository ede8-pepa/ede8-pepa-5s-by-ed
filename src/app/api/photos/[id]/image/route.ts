import {
  readAppwritePhoto,
  readPhotoFileResponse,
} from "@/lib/data/appwrite-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const variant =
      url.searchParams.get("variant") === "full" ? "full" : "thumb";
    const photo = await readAppwritePhoto(id);
    const response = await readPhotoFileResponse(photo.fileId, variant);

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? photo.mimeType,
        "Cache-Control":
          variant === "thumb" ? "private, max-age=300" : "no-store",
      },
    });
  } catch {
    return new Response("Image indisponible.", { status: 404 });
  }
}

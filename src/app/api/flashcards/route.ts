import { NextRequest, NextResponse } from "next/server";
import { flashcards } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get("folderId");
    const starred = searchParams.get("starred");
    const dateFilter = searchParams.get("date");

    const folderIdNum =
      folderId === "null" || folderId === null || folderId === ""
        ? undefined
        : parseInt(folderId, 10);

    const starredBool = starred === "true";
    const dateStr = dateFilter || undefined;

    const cards = flashcards.getAll(folderIdNum, starredBool, dateStr);
    return NextResponse.json({ success: true, flashcards: cards });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, notes, folderId, thumbUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const card = flashcards.create(
      imageUrl,
      notes || "",
      folderId || null,
      thumbUrl
    );

    return NextResponse.json(
      { success: true, flashcard: card },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating flashcard:", error);
    return NextResponse.json(
      { error: "Failed to create flashcard" },
      { status: 500 }
    );
  }
}

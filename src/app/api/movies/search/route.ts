import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await tmdb.searchMovies(query);

    // Return simplified results
    const results = data.results.slice(0, 10).map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.slice(0, 4) : null,
      posterPath: movie.poster_path,
      voteAverage: movie.vote_average,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("TMDB search error:", error);
    return NextResponse.json(
      { error: "Failed to search movies" },
      { status: 500 }
    );
  }
}

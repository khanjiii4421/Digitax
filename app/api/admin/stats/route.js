import db from "@/lib/db";

export async function GET() {
  try {
    const usersRow = await db.get("SELECT COUNT(*) as count FROM users");
    const usersCount = usersRow.count;
    const servicesRow = await db.get("SELECT COUNT(*) as count FROM services");
    const servicesCount = servicesRow.count;
    const queriesRow = await db.get("SELECT COUNT(*) as count FROM queries");
    const queriesCount = queriesRow.count;
    const videosRow = await db.get("SELECT COUNT(*) as count FROM videos");
    const videosCount = videosRow.count;
    const teamRow = await db.get("SELECT COUNT(*) as count FROM team");
    const teamCount = teamRow.count;
    const testimonialsRow = await db.get("SELECT COUNT(*) as count FROM testimonials");
    const testimonialsCount = testimonialsRow.count;
    const slabsRow = await db.get("SELECT COUNT(*) as count FROM tax_slabs");
    const slabsCount = slabsRow.count;

    const recentQueries = await db.all("SELECT * FROM queries ORDER BY created_at DESC LIMIT 5");

    return new Response(
      JSON.stringify({
        usersCount,
        servicesCount,
        queriesCount,
        videosCount,
        teamCount,
        testimonialsCount,
        slabsCount,
        recentQueries,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

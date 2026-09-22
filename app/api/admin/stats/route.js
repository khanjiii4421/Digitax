import db from "@/lib/db";

export async function GET() {
  try {
    const usersRow = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const usersCount = usersRow?.count || 0;
    const servicesRow = await db.get("SELECT COUNT(*) as count FROM services");
    const servicesCount = servicesRow?.count || 0;
    const queriesRow = await db.get("SELECT COUNT(*) as count FROM queries");
    const queriesCount = queriesRow?.count || 0;
    const videosRow = await db.get("SELECT COUNT(*) as count FROM videos");
    const videosCount = videosRow?.count || 0;
    const teamRow = await db.get("SELECT COUNT(*) as count FROM team");
    const teamCount = teamRow?.count || 0;
    const testimonialsRow = await db.get("SELECT COUNT(*) as count FROM testimonials");
    const testimonialsCount = testimonialsRow?.count || 0;
    const slabsRow = await db.get("SELECT COUNT(*) as count FROM tax_slabs");
    const slabsCount = slabsRow?.count || 0;

    // Applications stats
    let ntnCount = 0;
    let familyCount = 0;
    let pendingNtnCount = 0;
    let pendingFamilyCount = 0;
    try {
      const ntnRow = await db.get("SELECT COUNT(*) as count FROM ntn_applications");
      ntnCount = ntnRow?.count || 0;
      const ntnPendingRow = await db.get("SELECT COUNT(*) as count FROM ntn_applications WHERE status = 'pending'");
      pendingNtnCount = ntnPendingRow?.count || 0;

      const familyRow = await db.get("SELECT COUNT(*) as count FROM family_applications WHERE is_draft = 0");
      familyCount = familyRow?.count || 0;
      const familyPendingRow = await db.get("SELECT COUNT(*) as count FROM family_applications WHERE is_draft = 0 AND status IN ('Under Review', 'Payment Pending', 'Processing')");
      pendingFamilyCount = familyPendingRow?.count || 0;
    } catch(e) {}

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
        ntnCount,
        familyCount,
        totalApplications: ntnCount + familyCount,
        pendingApplications: pendingNtnCount + pendingFamilyCount,
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

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "both"; // banners | ad_banners | both
    const days = parseInt(searchParams.get("days") || "30");

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    let bannerStats = null;
    let adBannerStats = null;

    // Fetch banner stats
    if (type === "banners" || type === "both") {
      const { count: impressions } = await supabase
        .from("banner_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "impression")
        .gte("created_at", dateThreshold.toISOString());

      const { count: clicks } = await supabase
        .from("banner_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "click")
        .gte("created_at", dateThreshold.toISOString());

      const { data: uniqueViewersData } = await supabase
        .from("banner_analytics")
        .select("viewer_id")
        .gte("created_at", dateThreshold.toISOString());

      const uniqueViewers = new Set(uniqueViewersData?.map((v) => v.viewer_id) || []).size;

      const totalImpressions = impressions || 0;
      const totalClicks = clicks || 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      bannerStats = {
        totalImpressions,
        totalClicks,
        uniqueViewers,
        ctr,
      };
    }

    // Fetch ad banner stats
    if (type === "ad_banners" || type === "both") {
      const { count: impressions } = await supabase
        .from("ad_banner_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "impression")
        .gte("created_at", dateThreshold.toISOString());

      const { count: clicks } = await supabase
        .from("ad_banner_analytics")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "click")
        .gte("created_at", dateThreshold.toISOString());

      const { data: uniqueViewersData } = await supabase
        .from("ad_banner_analytics")
        .select("viewer_id")
        .gte("created_at", dateThreshold.toISOString());

      const uniqueViewers = new Set(uniqueViewersData?.map((v) => v.viewer_id) || []).size;

      const totalImpressions = impressions || 0;
      const totalClicks = clicks || 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      adBannerStats = {
        totalImpressions,
        totalClicks,
        uniqueViewers,
        ctr,
      };
    }

    return NextResponse.json({
      success: true,
      days,
      bannerStats,
      adBannerStats,
      combined: type === "both" ? {
        totalImpressions: (bannerStats?.totalImpressions || 0) + (adBannerStats?.totalImpressions || 0),
        totalClicks: (bannerStats?.totalClicks || 0) + (adBannerStats?.totalClicks || 0),
        uniqueViewers: (bannerStats?.uniqueViewers || 0) + (adBannerStats?.uniqueViewers || 0),
        avgCtr: type === "both" && bannerStats && adBannerStats
          ? (bannerStats.ctr + adBannerStats.ctr) / 2
          : 0,
      } : null,
    });

  } catch (error) {
    console.error("Error fetching banner stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch banner statistics" },
      { status: 500 }
    );
  }
}

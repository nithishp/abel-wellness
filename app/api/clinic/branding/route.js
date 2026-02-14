import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.config";

/**
 * GET /api/clinic/branding
 * Returns the clinic logo (as base64 data URI) and invoice theme color for PDF generation.
 */
export async function GET() {
  try {
    let clinicLogo = null;
    let themeColor = "#059669";

    // Fetch clinic logo
    try {
      const { data: logoData } = await supabaseAdmin
        .from("clinic_logo")
        .select("img")
        .limit(1)
        .single();

      if (logoData?.img) {
        const logoUrl = logoData.img;

        // If it's already a data URI, use it directly
        if (logoUrl.startsWith("data:")) {
          clinicLogo = logoUrl;
        } else {
          // Fetch the image and convert to base64 data URI for client-side PDF rendering
          try {
            const imgRes = await fetch(logoUrl);
            if (imgRes.ok) {
              const buffer = await imgRes.arrayBuffer();
              const contentType =
                imgRes.headers.get("content-type") || "image/png";
              // Convert webp to png content type for PDF compatibility
              const pdfSafeType = contentType.includes("webp")
                ? "image/png"
                : contentType;
              const base64 = Buffer.from(buffer).toString("base64");
              clinicLogo = `data:${pdfSafeType};base64,${base64}`;
            }
          } catch {
            // If fetch fails, pass the raw URL as fallback
            clinicLogo = logoUrl;
          }
        }
      }
    } catch {
      // No logo found - continue
    }

    // Fetch theme color from billing settings (key-value table)
    try {
      const { data: setting } = await supabaseAdmin
        .from("billing_settings")
        .select("setting_value")
        .eq("setting_key", "invoice_theme_color")
        .single();
      if (setting?.setting_value) {
        themeColor = String(setting.setting_value).replace(/"/g, "");
      }
    } catch {
      // Use default theme color
    }

    return NextResponse.json({ clinicLogo, themeColor });
  } catch (error) {
    console.error("Error fetching clinic branding:", error);
    return NextResponse.json(
      { clinicLogo: null, themeColor: "#059669" },
      { status: 200 },
    );
  }
}

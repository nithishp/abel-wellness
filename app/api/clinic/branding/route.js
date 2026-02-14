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

    // Fetch clinic settings from billing_settings (key-value table)
    let clinicName = "Abel Wellness";
    let clinicAddress = "";
    let clinicPhone = "";
    let clinicEmail = "";

    try {
      const { data: settings } = await supabaseAdmin
        .from("billing_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "invoice_theme_color",
          "clinic_name",
          "clinic_address",
          "clinic_phone",
          "clinic_email",
        ]);

      if (settings) {
        for (const row of settings) {
          const val = String(row.setting_value || "").replace(/"/g, "");
          switch (row.setting_key) {
            case "invoice_theme_color":
              themeColor = val || themeColor;
              break;
            case "clinic_name":
              clinicName = val || clinicName;
              break;
            case "clinic_address":
              clinicAddress = val;
              break;
            case "clinic_phone":
              clinicPhone = val;
              break;
            case "clinic_email":
              clinicEmail = val;
              break;
          }
        }
      }
    } catch {
      // Use defaults
    }

    return NextResponse.json({
      clinicLogo,
      themeColor,
      clinicName,
      clinicAddress,
      clinicPhone,
      clinicEmail,
    });
  } catch (error) {
    console.error("Error fetching clinic branding:", error);
    return NextResponse.json(
      {
        clinicLogo: null,
        themeColor: "#059669",
        clinicName: "Abel Wellness",
        clinicAddress: "",
        clinicPhone: "",
        clinicEmail: "",
      },
      { status: 200 },
    );
  }
}

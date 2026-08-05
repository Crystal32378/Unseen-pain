import { NextRequest, NextResponse } from "next/server";

const DEFAULT_FACILITY_API_URL =
  "https://script.google.com/macros/s/AKfycbyNScLDsLWzOanT632xB0HF13QO8-tEIBYx_pf_wsdk-BUZghwpKb6vMV6fhcfQOU53/exec";

const ALLOWED_ACTIONS = new Set(["health", "cities", "districts", "search"]);
const ALLOWED_PARAMS = new Set([
  "action",
  "specialty",
  "city",
  "district",
  "facilityType",
  "q",
  "limit",
  "offset",
]);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const endpoint = process.env.FACILITY_API_URL || DEFAULT_FACILITY_API_URL;
  const incoming = request.nextUrl.searchParams;
  const action = incoming.get("action") || "search";

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { ok: false, error: "不支援的查詢類型。" },
      { status: 400 }
    );
  }

  let upstream: URL;
  try {
    upstream = new URL(endpoint);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "院所資料服務網址格式錯誤。",
        code: "FACILITY_API_INVALID_URL",
      },
      { status: 500 }
    );
  }

  upstream.searchParams.set("action", action);
  incoming.forEach((value, key) => {
    if (key !== "action" && ALLOWED_PARAMS.has(key) && value) {
      upstream.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(upstream, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "院所資料服務暫時無法使用。",
          upstream_status: response.status,
        },
        { status: 502 }
      );
    }

    const data: unknown = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Facility API proxy error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "目前無法讀取院所資料，請稍後再試。",
      },
      { status: 502 }
    );
  }
}

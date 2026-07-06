import { siteConfig } from "@config/site";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const BG = "#090d14";
const FG = "#f5f5f5";
const MUTED = "#8b93a1";
/** The app's actual theme accent (dark-mode --primary), used unless a page overrides it. */
const BRAND_ACCENT = "#e0af3b";

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const title = searchParams.get("title") ?? siteConfig.name;
  const type = searchParams.get("type") ?? "Page";
  const link = searchParams.get("link") ?? siteConfig.url.base;
  const meta = searchParams.get("meta");
  const image = searchParams.get("image");
  const accentParam = searchParams.get("accent");
  const accent =
    accentParam && HEX_PATTERN.test(accentParam) ? accentParam : BRAND_ACCENT;
  const heading =
    title.length > 90 ? `${title.substring(0, 90).trim()}...` : title;

  const [logoData, subjectImageData] = await Promise.all([
    fetch(new URL("/images/gasak-logo.png", origin)).then((res) =>
      res.arrayBuffer(),
    ),
    image
      ? fetch(image)
          .then((res) => (res.ok ? res.arrayBuffer() : null))
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          backgroundImage: `radial-gradient(circle at 85% 0%, ${accent}2e, transparent 45%)`,
          color: FG,
          padding: "56px 64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "10px",
            background: accent,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoData as unknown as string}
            alt=""
            width={56}
            height={56}
            style={{ borderRadius: "9999px" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {siteConfig.name}
            </div>
            <div
              style={{
                color: MUTED,
                fontSize: "14px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              Esport
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "48px",
          }}
        >
          {subjectImageData ? (
            <div
              style={{
                display: "flex",
                width: "220px",
                height: "220px",
                flexShrink: 0,
                borderRadius: "20px",
                border: `3px solid ${accent}`,
                overflow: "hidden",
                background: "#12161f",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={subjectImageData as unknown as string}
                alt=""
                width={220}
                height={220}
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: "10px",
                padding: "7px 16px",
                borderRadius: "9999px",
                background: `${accent}22`,
                border: `2px solid ${accent}`,
                color: accent,
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {type}
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: subjectImageData ? "760px" : "980px",
                fontSize: subjectImageData ? "54px" : "60px",
                lineHeight: 1.08,
                fontWeight: 900,
              }}
            >
              {heading}
            </div>
            {meta ? (
              <div
                style={{
                  display: "flex",
                  fontSize: "22px",
                  color: MUTED,
                  fontWeight: 600,
                }}
              >
                {meta}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            color: MUTED,
            fontSize: "20px",
          }}
        >
          <div style={{ display: "flex" }}>{link}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{ width: "140px", height: "6px", background: accent }}
            />
            <div style={{ width: "6px", height: "6px", background: accent }} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

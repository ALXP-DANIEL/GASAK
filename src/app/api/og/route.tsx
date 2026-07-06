import { siteConfig } from "@config/site";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const BG = "#06080d";
const PANEL = "#0d111a";
const PANEL_2 = "#111827";
const FG = "#f8fafc";
const MUTED = "#94a3b8";
const SOFT = "#1f2937";
const BRAND_ACCENT = "#e0af3b";

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const IMAGE_BACKED_TYPES = new Set(["Squad", "Product"]);

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function safeDisplayLink(link: string) {
  try {
    const url = new URL(link);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return link;
  }
}

async function fetchImageBuffer(src: string | null, base: string) {
  if (!src) return null;

  try {
    const url = new URL(src, base);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    const res = await fetch(url);
    if (!res.ok) return null;

    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

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

  const heading = truncate(title, 82);
  const eyebrow = truncate(type.toUpperCase(), 28);
  const displayLink = truncate(safeDisplayLink(link), 62);

  const logoData = await fetchImageBuffer("/images/gasak-logo.png", origin);

  const fetchedSubjectImage = await fetchImageBuffer(image, origin);
  const subjectImageData =
    fetchedSubjectImage ??
    (IMAGE_BACKED_TYPES.has(type) && logoData ? logoData : null);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: BG,
        color: FG,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `
              radial-gradient(circle at 80% 18%, ${accent}38 0, transparent 34%),
              radial-gradient(circle at 18% 88%, ${accent}20 0, transparent 30%),
              linear-gradient(135deg, #070a10 0%, #080b12 42%, #101827 100%)
            `,
        }}
      />

      {/* Grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.28,
          backgroundImage: `
              linear-gradient(${SOFT} 1px, transparent 1px),
              linear-gradient(90deg, ${SOFT} 1px, transparent 1px)
            `,
          backgroundSize: "46px 46px",
        }}
      />

      {/* Accent blocks */}
      <div
        style={{
          position: "absolute",
          right: "-120px",
          top: "-90px",
          width: "440px",
          height: "440px",
          display: "flex",
          borderRadius: "9999px",
          border: `34px solid ${accent}2f`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "66px",
          bottom: "58px",
          width: "250px",
          height: "10px",
          display: "flex",
          background: accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "66px",
          bottom: "82px",
          width: "92px",
          height: "10px",
          display: "flex",
          background: `${accent}70`,
        }}
      />

      {/* Main card */}
      <div
        style={{
          position: "absolute",
          inset: "42px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: `1px solid ${accent}55`,
          background: "#070b12cc",
        }}
      >
        {/* Top header */}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "34px 40px 0 40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                width: "64px",
                height: "64px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "18px",
                background: PANEL,
                border: `2px solid ${accent}`,
                overflow: "hidden",
              }}
            >
              {logoData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoData as unknown as string}
                  alt=""
                  width={58}
                  height={58}
                  style={{
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    color: accent,
                    fontSize: "28px",
                    fontWeight: 900,
                  }}
                >
                  G
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "30px",
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                }}
              >
                {siteConfig.name}
              </div>
              <div
                style={{
                  display: "flex",
                  color: MUTED,
                  fontSize: "14px",
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                }}
              >
                Esports Management
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 18px",
              border: `1px solid ${accent}80`,
              background: `${accent}16`,
              color: accent,
              fontSize: "18px",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>{eyebrow}</span>
          </div>
        </div>

        {/* Middle content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "48px",
            padding: "0 40px",
          }}
        >
          {subjectImageData ? (
            <div
              style={{
                display: "flex",
                width: "260px",
                height: "260px",
                flexShrink: 0,
                padding: "10px",
                background: PANEL,
                border: `2px solid ${accent}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  background: PANEL_2,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={subjectImageData as unknown as string}
                  alt=""
                  width={240}
                  height={240}
                  style={{
                    width: "240px",
                    height: "240px",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              gap: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                width: subjectImageData ? "760px" : "980px",
                fontSize: subjectImageData ? "62px" : "70px",
                lineHeight: 0.95,
                fontWeight: 950,
                letterSpacing: "-0.055em",
              }}
            >
              {heading}
            </div>

            {meta ? (
              <div
                style={{
                  display: "flex",
                  maxWidth: subjectImageData ? "720px" : "920px",
                  color: MUTED,
                  fontSize: "25px",
                  lineHeight: 1.25,
                  fontWeight: 700,
                }}
              >
                {truncate(meta, 105)}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  color: MUTED,
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: "54px",
                    height: "6px",
                    background: accent,
                  }}
                />
                <span>Smarter squad operations. Faster match execution.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 40px 34px 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              color: MUTED,
              fontSize: "21px",
              fontWeight: 700,
            }}
          >
            {displayLink}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                color: FG,
                fontSize: "18px",
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              GASAK
            </div>
            <div
              style={{
                display: "flex",
                width: "9px",
                height: "9px",
                background: accent,
              }}
            />
            <div
              style={{
                display: "flex",
                color: accent,
                fontSize: "18px",
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              GG
            </div>
          </div>
        </div>
      </div>

      {/* Left accent rail */}
      <div
        style={{
          position: "absolute",
          left: "42px",
          top: "42px",
          bottom: "42px",
          width: "8px",
          display: "flex",
          background: accent,
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

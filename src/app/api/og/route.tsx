import { siteConfig } from "@config/site";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const BRAND_GOLD = "#e0af3b";
const DARK = "#050506";
const INK = "#0c0d10";
const FG = "#fff7dd";
const MUTED = "#c7c0aa";
const RULE = "#3c3424";

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

function titleFontSize(value: string, hasImage: boolean) {
  if (value.length > 62) return hasImage ? 54 : 62;
  if (value.length > 42) return hasImage ? 62 : 72;
  if (value.length > 20) return hasImage ? 68 : 74;
  return hasImage ? 72 : 86;
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
    accentParam && HEX_PATTERN.test(accentParam) ? accentParam : BRAND_GOLD;

  const heading = truncate(title, 86);
  const eyebrow = truncate(type.toUpperCase(), 30);
  const displayLink = truncate(safeDisplayLink(link), 66);

  const [logoData, fetchedSubjectImage] = await Promise.all([
    fetchImageBuffer("/images/gasak-logo.png", origin),
    fetchImageBuffer(image, origin),
  ]);
  const subjectImageData =
    fetchedSubjectImage ??
    (IMAGE_BACKED_TYPES.has(type) && logoData ? logoData : null);
  const hasSubjectImage = Boolean(subjectImageData);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: DARK,
        color: FG,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "18px",
          display: "flex",
          background: accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "52px",
          top: "42px",
          right: "52px",
          bottom: "42px",
          display: "flex",
          border: `1px solid ${accent}66`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "72px",
          left: "86px",
          right: "86px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "62px",
              height: "62px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: INK,
              border: `2px solid ${accent}`,
            }}
          >
            {logoData ? (
              // biome-ignore lint/performance/noImgElement: ImageResponse renders fetched image buffers with plain img tags.
              <img
                src={logoData as unknown as string}
                alt=""
                width={58}
                height={58}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  color: accent,
                  fontSize: "32px",
                  fontWeight: 900,
                }}
              >
                G
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div
              style={{
                display: "flex",
                fontSize: "28px",
                fontWeight: 900,
                letterSpacing: 0,
                textTransform: "uppercase",
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
                letterSpacing: 0,
                textTransform: "uppercase",
              }}
            >
              Esports management
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 18px",
            background: "#070707d9",
            border: `1px solid ${accent}`,
            color: accent,
            fontSize: "17px",
            fontWeight: 900,
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "86px",
          top: "178px",
          width: hasSubjectImage ? "680px" : "700px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "8px",
            marginBottom: "28px",
            background: `linear-gradient(90deg, ${accent} 0%, ${accent} 38%, transparent 38%, transparent 100%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            color: FG,
            fontSize: `${titleFontSize(heading, hasSubjectImage)}px`,
            lineHeight: 0.96,
            fontWeight: 950,
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          {heading}
        </div>

        <div
          style={{
            display: "flex",
            width: hasSubjectImage ? "620px" : "660px",
            marginTop: "30px",
            color: MUTED,
            fontSize: "25px",
            lineHeight: 1.25,
            fontWeight: 750,
          }}
        >
          {meta
            ? truncate(meta, 108)
            : "Smarter squad operations. Faster match execution. Built for teams that play to win."}
        </div>
      </div>

      {subjectImageData ? (
        <div
          style={{
            position: "absolute",
            right: "94px",
            top: "176px",
            width: "300px",
            height: "300px",
            display: "flex",
            padding: "12px",
            background: "#060606d9",
            border: `2px solid ${accent}`,
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              background: INK,
              border: `1px solid ${RULE}`,
            }}
          >
            {/* biome-ignore lint/performance/noImgElement: ImageResponse renders fetched image buffers with plain img tags. */}
            <img
              src={subjectImageData as unknown as string}
              alt=""
              width={276}
              height={276}
              style={{
                width: "276px",
                height: "276px",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: "86px",
          right: "86px",
          bottom: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: MUTED,
            fontSize: "20px",
            fontWeight: 800,
          }}
        >
          <div
            style={{
              display: "flex",
              width: "78px",
              height: "4px",
              background: accent,
            }}
          />
          {displayLink}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            color: FG,
            fontSize: "19px",
            fontWeight: 900,
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          <span>GASAK</span>
          <span style={{ color: accent }}>GG</span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

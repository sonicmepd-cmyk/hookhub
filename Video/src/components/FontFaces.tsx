import { staticFile } from "remotion";

// Fuentes auto-alojadas (OFL) — render determinista sin CDN.
export const FontFaces: React.FC = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
@font-face {
  font-family: 'Space Grotesk';
  src: url('${staticFile("fonts/SpaceGrotesk-var.woff2")}') format('woff2');
  font-weight: 300 700;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'DM Sans';
  src: url('${staticFile("fonts/DMSans-var.woff2")}') format('woff2');
  font-weight: 100 1000;
  font-style: normal;
  font-display: block;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
`,
    }}
  />
);

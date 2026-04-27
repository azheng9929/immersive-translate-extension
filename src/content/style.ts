const STYLE_ID = "imt-runtime-style";

export function ensureRuntimeStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.setAttribute("data-imt-managed", "true");
  style.textContent = `
    .imt-translation-block {
      display: block;
      margin-block-start: 0.28em;
      color: color-mix(in srgb, currentColor 72%, transparent);
      font: inherit;
      font-size: 0.92em;
      line-height: 1.55;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    .imt-translation-compact {
      display: block;
      margin-block-start: 0.15em;
      color: color-mix(in srgb, currentColor 68%, transparent);
      font: inherit;
      font-size: 0.78em;
      line-height: 1.35;
      font-weight: 400;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
  `;
  document.documentElement.appendChild(style);
}

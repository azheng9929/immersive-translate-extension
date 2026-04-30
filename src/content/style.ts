const STYLE_ID = "imt-runtime-style";

export function ensureRuntimeStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.setAttribute("data-imt-managed", "true");
  style.textContent = `
    .imt-translation-block {
      display: block;
      max-width: 100%;
      margin-block-start: 0.24em;
      color: color-mix(in srgb, currentColor 76%, transparent);
      font: inherit;
      font-size: 0.94em;
      line-height: 1.5;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    .imt-translation-compact {
      display: block;
      margin-block-start: 0.15em;
      color: color-mix(in srgb, currentColor 70%, transparent);
      font: inherit;
      font-size: 0.82em;
      line-height: 1.35;
      font-weight: 400;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    .imt-translation-loading {
      display: inline-flex;
      width: 0.78em;
      height: 0.78em;
      margin-inline-start: 0.38em;
      vertical-align: -0.08em;
      color: color-mix(in srgb, currentColor 68%, transparent);
      opacity: 0.78;
      pointer-events: none;
      contain: layout style paint;
    }
    .imt-translation-loading::before {
      content: "";
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border: 1.5px solid currentColor;
      border-block-start-color: transparent;
      border-radius: 999px;
      animation: imt-loading-spin 760ms linear infinite;
    }
    @keyframes imt-loading-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .imt-translation-loading::before {
        animation: none;
        border-block-start-color: currentColor;
        opacity: 0.72;
      }
    }
  `;
  document.documentElement.appendChild(style);
}

const STYLE_ID = "imt-runtime-style";

export function ensureRuntimeStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.setAttribute("data-imt-managed", "true");
  style.textContent = `
    .imt-translation-block {
      display: block;
      box-sizing: border-box;
      max-width: 100%;
      margin-block-start: 0.3em;
      padding-inline-start: 0.56em;
      border-inline-start: 2px solid currentColor;
      border-inline-start-color: color-mix(in srgb, currentColor 18%, transparent);
      background: transparent;
      color: var(--imt-source-color, currentColor);
      color: color-mix(in srgb, var(--imt-source-color, currentColor) 76%, transparent);
      font: inherit;
      font-size: 0.93em;
      font-weight: 400;
      line-height: 1.48;
      letter-spacing: 0;
      overflow-wrap: anywhere;
      text-wrap: pretty;
    }
    .imt-translation-compact {
      display: block;
      box-sizing: border-box;
      max-width: 100%;
      margin-block-start: 0.12em;
      padding-inline-start: 0;
      border-inline-start: 0;
      background: transparent;
      color: var(--imt-source-color, currentColor);
      color: color-mix(in srgb, var(--imt-source-color, currentColor) 70%, transparent);
      font: inherit;
      font-size: 0.82em;
      line-height: 1.32;
      font-weight: 400;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    .imt-translation-replacement {
      display: inline;
      box-sizing: border-box;
      max-width: 100%;
      color: var(--imt-source-color, currentColor);
      font: inherit;
      line-height: inherit;
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
    .imt-translation-loading {
      display: inline-flex;
      width: 0.78em;
      height: 0.78em;
      margin-inline-start: 0.38em;
      vertical-align: -0.08em;
      color: var(--imt-source-color, currentColor);
      color: color-mix(in srgb, var(--imt-source-color, currentColor) 68%, transparent);
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

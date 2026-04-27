export function mountFixture(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

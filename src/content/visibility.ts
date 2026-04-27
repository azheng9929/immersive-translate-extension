export function isVisibleElement(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  if (htmlElement.hidden) return false;
  const style = window.getComputedStyle(htmlElement);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  return true;
}

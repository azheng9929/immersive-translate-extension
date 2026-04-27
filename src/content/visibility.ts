export function isVisibleElement(element: Element): boolean {
  let current: Element | null = element;

  while (current) {
    const htmlElement = current as HTMLElement;
    if (htmlElement.hidden) return false;
    const style = window.getComputedStyle(htmlElement);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    current = current.parentElement;
  }

  return true;
}

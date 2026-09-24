export const escape = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const $ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T => root.querySelector<T>(selector)!;
export const $$ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] => Array.from(root.querySelectorAll<T>(selector));
export const format = (n: number) => Math.round(n).toLocaleString("en-US");
export const logo = `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M10 37V11l28 26V11" stroke="currentColor" stroke-width="4"/><path d="M6 7h8v8H6zM34 7h8v8h-8zM34 33h8v8h-8z" fill="currentColor"/></svg>`;
export const arrow = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.8"/></svg>`;
export const soundIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5zm4 3c3 2 3 6 0 8m3-11c5 4 5 10 0 14" stroke="currentColor" stroke-width="1.5"/></svg>`;
export function download(blob: Blob, filename: string) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

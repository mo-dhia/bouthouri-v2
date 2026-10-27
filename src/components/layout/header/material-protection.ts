export type MaterialProtection = {
  source: "portrait" | "footer";
  active: boolean;
  pressureScale: number;
  influence: number;
  clientX: number;
  clientY: number;
};

/** Input-only bridge; the scene owner keeps the pressure simulation and RAF. */
export function emitMaterialProtection(value: MaterialProtection): void {
  window.dispatchEvent(new CustomEvent<MaterialProtection>("gazzar:material-protection", { detail: value }));
}

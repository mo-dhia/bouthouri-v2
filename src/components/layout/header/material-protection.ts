export type MaterialProtection = {
  source: "portrait" | "footer";
  active: boolean;
  pressureScale: number;
  influence: number;
  clientX: number;
  clientY: number;
  publisher?: number;
  owner?: HTMLElement;
};

/** Input-only bridge; the scene owner keeps the pressure simulation and RAF. */
export function emitMaterialProtection(value: MaterialProtection): void {
  window.dispatchEvent(new CustomEvent<MaterialProtection>("gazzar:material-protection", { detail: value }));
}

let publisherSequence = 0;

/** Allocate at mount, so late events/cleanup from an older mount stay older. */
export function createMaterialProtectionPublisher(owner: HTMLElement) {
  const publisher = ++publisherSequence;
  return (value: MaterialProtection) => {
    if (value.active && owner.isConnected === false) return;
    emitMaterialProtection({ ...value, publisher, owner });
  };
}

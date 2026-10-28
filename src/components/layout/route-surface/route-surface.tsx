import "server-only";
import RouteSurfaceGate from "./route-surface-gate";
import styles from "./route-surface.module.css";

export default function RouteSurface() {
  return <><div className={styles.surface} data-route-surface aria-hidden="true" popover="manual"><div data-route-field /></div><RouteSurfaceGate /></>;
}

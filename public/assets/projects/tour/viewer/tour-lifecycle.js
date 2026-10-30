// Lifecycle adapter for the pinned Pano2VR 6.1.14 distribution. The generated
// player stays unchanged; these instance hooks own suspension and load health.
window.createTourLifecycle = function createTourLifecycle(player) {
  const state = { suspended: false, frameStopped: false, recoveryStopped: false, error: false, generation: 0, pending: new Set() };
  const frame = player.Eh, recover = player.vn, orientation = player.ir, tileError = player.vj;
  const readConfig = player.readConfigXml;
  if (![frame, recover, orientation, tileError, readConfig].every(value => typeof value === 'function')) throw new Error('Unsupported tour player version');

  player.Eh = function () {
    if (state.suspended) { state.frameStopped = true; return; }
    state.frameStopped = false;
    return frame.apply(this, arguments);
  };
  player.vn = function () {
    if (state.suspended) { state.recoveryStopped = true; return; }
    state.recoveryStopped = false;
    return recover.apply(this, arguments);
  };
  player.ir = function () {
    if (!state.suspended) return orientation.apply(this, arguments);
  };
  const failed = (generation, event) => {
    if (event?.type !== 'error' || generation !== state.generation) return;
    state.error = true;
    player.triggerEvent('tourloaderror', {});
  };
  player.vj = function () {
    const handler = tileError.apply(this, arguments), generation = player.K.Uh ? null : state.generation;
    return function (event) { handler.apply(this, arguments); failed(generation, event); };
  };
  // WebGL tiles have their own manager; its error closure is created on demand.
  const manager = player.Ba, managerError = manager.oo, requestTile = manager.Si;
  if (typeof requestTile !== 'function') throw new Error('Unsupported tour tile loader');
  manager.Si = function (tile) {
    const pending = state.pending, snapshot = player.K.Uh;
    const result = requestTile.apply(this, arguments), image = tile.v;
    if (image && !snapshot) {
      pending.add(image);
      const settle = () => { pending.delete(image); for (const event of ['load', 'error', 'abort']) image.removeEventListener(event, settle); };
      for (const event of ['load', 'error', 'abort']) image.addEventListener(event, settle, { once: true });
    }
    return result;
  };
  manager.oo = function () {
    const handler = managerError.apply(this, arguments), generation = player.K.Uh ? null : state.generation;
    return function (event) { handler.apply(this, arguments); failed(generation, event); };
  };
  player.addListener('beforechangenode', () => { state.generation++; state.error = false; state.pending = new Set(); });
  player.readConfigXml = function (config) {
    // Initial loading is a still preview, including under reduced motion. The
    // host enables authored rotation only after the current room is ready.
    config.querySelectorAll('autorotate').forEach(node => node.setAttribute('enabled', '0'));
    return readConfig.apply(this, arguments);
  };

  const lifecycle = {
    setSuspended(value) {
      if (state.suspended === value) return;
      state.suspended = value;
      if (value) { player.stopAutorotate(); return; }
      // Pending callbacks stop at their next turn without running player work.
      // If a quick resume precedes that turn, the existing callback continues;
      // otherwise restart only the drained owner. This cannot create two loops.
      if (player.getUseGyro()) player.nb.Kh = true;
      if (state.frameStopped) player.Eh();
      if (state.recoveryStopped) player.vn();
      player.requestRedraw();
    },
    getLoadState() {
      if (state.error) return 'failed';
      const images = player.kc.filter(image => image.src && image.src !== player.cm);
      if (images.some(image => image.complete && image.naturalWidth === 0)) return 'failed';
      return images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0) && player.getIsLoaded() && state.pending.size === 0 ? 'ready' : 'loading';
    }
  };
  lifecycle.setSuspended(document.hidden);
  return lifecycle;
};

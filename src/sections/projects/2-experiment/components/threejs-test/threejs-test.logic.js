/** Adapted from Carter Ogunsola's public Lab threejs-test example, inspected 2026-10-29.
 * Renderer math and interaction constants retain the measured source contract.
 * The owning gate supplies native scheduling, width coordinates and cleanup. */
import { setDesignStyle } from '../../experiment-dom';
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
const MODEL = "/assets/projects/experiments/lantern.glb";
const FIT = 2.4;
const SEG_U = 120;
const SEG_V = 72;
const SUBJECTS = [
    { id: "lantern", label: "Lantern", sf: null },
    { id: "orb", label: "Orb", sf: { m1: 6, n11: 2.4, n12: 1.1, n13: 1.1, m2: 6, n21: 2.4, n22: 1.1, n23: 1.1 } },
    { id: "bloom", label: "Bloom", sf: { m1: 8, n11: 0.5, n12: 1.7, n13: 1.7, m2: 8, n21: 0.5, n22: 1.7, n23: 1.7 } },
    { id: "shell", label: "Shell", sf: { m1: 3, n11: 0.7, n12: 0.6, n13: 3.2, m2: 6, n21: 1.6, n22: 0.8, n23: 0.8 } },
    { id: "spike", label: "Spike", sf: { m1: 12, n11: 0.3, n12: 1, n13: 1, m2: 12, n21: 0.3, n22: 1, n23: 1 } }
];
const sfRadius = (angle, m, n1, n2, n3) => {
    const t = m * angle / 4;
    const r = Math.abs(Math.cos(t)) ** n2 + Math.abs(Math.sin(t)) ** n3;
    const out = r === 0 ? 0 : r ** (-1 / n1);
    return Number.isFinite(out) ? Math.min(out, 6) : 0;
};
function sfPositions(sf, out) {
    let i = 0;
    let max = 0;
    for (let v = 0; v <= SEG_V; v++) {
        const lat = -Math.PI / 2 + Math.PI * v / SEG_V;
        const r2 = sfRadius(lat, sf.m2, sf.n21, sf.n22, sf.n23);
        const cy = Math.cos(lat);
        for (let u = 0; u <= SEG_U; u++) {
            const lon = -Math.PI + 2 * Math.PI * u / SEG_U;
            const r1 = sfRadius(lon, sf.m1, sf.n11, sf.n12, sf.n13);
            const x = r1 * Math.cos(lon) * r2 * cy;
            const y = r2 * Math.sin(lat);
            const z = r1 * Math.sin(lon) * r2 * cy;
            out[i++] = x;
            out[i++] = y;
            out[i++] = z;
            max = Math.max(max, Math.abs(x), Math.abs(y), Math.abs(z));
        }
    }
    const row = (SEG_U + 1) * 3;
    for (let v = 0; v <= SEG_V; v++) {
        const a = v * row;
        const b = a + SEG_U * 3;
        out[b] = out[a];
        out[b + 1] = out[a + 1];
        out[b + 2] = out[a + 2];
    }
    const k = max > 0 ? FIT / 2.9 / max : 1;
    for (let j = 0; j < out.length; j++)
        out[j] *= k;
}
function sfIndex() {
    const idx = new Uint32Array(SEG_U * SEG_V * 6);
    let i = 0;
    for (let v = 0; v < SEG_V; v++) {
        for (let u = 0; u < SEG_U; u++) {
            const a = v * (SEG_U + 1) + u;
            const b = a + 1;
            const c = a + SEG_U + 1;
            const d = c + 1;
            idx[i++] = a;
            idx[i++] = c;
            idx[i++] = b;
            idx[i++] = b;
            idx[i++] = c;
            idx[i++] = d;
        }
    }
    return idx;
}
const expoOut = (t) => t >= 1 ? 1 : 1 - 2 ** (-10 * t);
const MODES = [
    { id: "shaded", label: "Shaded" },
    { id: "wire", label: "Wire" },
    { id: "points", label: "Points" }
];
const FINISHES = [
    { id: "studio", label: "Studio", mat: { color: 15921906, roughness: 0.52, metalness: 0.05 } },
    { id: "chrome", label: "Chrome", mat: { color: 16777215, roughness: 0.06, metalness: 1 } },
    { id: "wax", label: "Wax", mat: { color: 15263976, roughness: 0.95, metalness: 0, sheen: 1 } },
    { id: "ink", label: "Ink", mat: { color: 1842204, roughness: 0.22, metalness: 0.55 } }
];
const BAKE = 256;
function makeBaker(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    const scene = new THREE.Scene();
    scene.environment = envRT.texture;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
    camera.position.z = 3;
    const geo = new THREE.SphereGeometry(0.995, 128, 96);
    const mat = new THREE.MeshPhysicalMaterial({ envMapIntensity: 1.1 });
    scene.add(new THREE.Mesh(geo, mat));
    const key = new THREE.DirectionalLight(16777215, 2.4);
    key.position.set(-0.7, 0.85, 1);
    const fill = new THREE.DirectionalLight(16777215, 0.45);
    fill.position.set(0.9, -0.6, 0.7);
    scene.add(key, fill);
    const target = new THREE.WebGLRenderTarget(BAKE, BAKE, {
        depthBuffer: true,
        stencilBuffer: false
    });
    target.texture.colorSpace = THREE.SRGBColorSpace;
    target.texture.generateMipmaps = false;
    target.texture.minFilter = THREE.LinearFilter;
    const bake = (finish, polish = 0) => {
        mat.color.set(finish.color);
        mat.roughness = THREE.MathUtils.clamp(finish.roughness - polish * 0.45, 0.02, 1);
        mat.metalness = THREE.MathUtils.clamp(finish.metalness + Math.max(0, polish) * 0.6, 0, 1);
        mat.sheen = finish.sheen ?? 0;
        mat.needsUpdate = true;
        const prev = renderer.getRenderTarget();
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.setRenderTarget(prev);
        return target.texture;
    };
    const dispose = () => {
        geo.dispose();
        mat.dispose();
        target.dispose();
        envRT.dispose();
        pmrem.dispose();
    };
    return { bake, texture: target.texture, dispose };
}
export const experiment = {
    mount(root, env) {
        const reduced = env.reduced;
        const P = { spin: 0.9, pointSize: 0.02 };
        let accentHex = null;
        const ac = new AbortController();
        const { signal } = ac;
        const wrap = document.createElement("div");
        wrap.className = "tj";
        wrap.innerHTML = `<p class="tj__loading"><span class="spin"></span>Loading model</p>
      <div class="tj__bars">
        <div class="tj__modes" role="group" aria-label="Subject" style="--segs:${SUBJECTS.length}">
          <span class="tj__pill" data-subject-pill aria-hidden="true"></span>
          ${SUBJECTS.map((x, i) => `<button class="tj__seg" type="button" data-subject="${x.id}" aria-pressed="${i === 0}">${x.label}</button>`).join("")}
        </div>
        <div class="tj__modes" role="group" aria-label="Render mode" style="--segs:${MODES.length}">
          <span class="tj__pill" data-mode-pill aria-hidden="true"></span>
          ${MODES.map((m, i) => `<button class="tj__seg" type="button" data-mode="${m.id}" aria-pressed="${i === 0}">${m.label}</button>`).join("")}
        </div>
      </div>`;
        root.appendChild(wrap);
        const pill = wrap.querySelector("[data-mode-pill]");
        const subjectPill = wrap.querySelector("[data-subject-pill]");
        const segs = [...wrap.querySelectorAll("[data-mode]")];
        const subjectSegs = [...wrap.querySelectorAll("[data-subject]")];
        let ink = 1973790;
        const resolveInk = () => {
            const probe = document.createElement("span");
            setDesignStyle(probe, "cssText", "color:var(--ink);position:absolute;visibility:hidden");
            wrap.appendChild(probe);
            const m = getComputedStyle(probe).color.match(/\d+/g);
            probe.remove();
            if (m)
                ink = Number(m[0]) << 16 | Number(m[1]) << 8 | Number(m[2]);
        };
        resolveInk();
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setClearColor(0, 0);
        renderer.setPixelRatio(Math.min(env.pixelRatio || 1, 2));
        wrap.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 0.15, FIT * 2.4);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.minDistance = FIT * 1.4;
        controls.maxDistance = FIT * 4.5;
        controls.minPolarAngle = 0.15;
        controls.maxPolarAngle = Math.PI * 0.9;
        controls.enableDamping = !reduced;
        controls.dampingFactor = 0.08;
        controls.autoRotate = !reduced;
        controls.autoRotateSpeed = P.spin;
        controls.rotateSpeed = 1 / env.scale;
        controls.panSpeed = 1 / env.scale;
        const baker = makeBaker(renderer);
        let finish = "studio";
        let polish = 0;
        const bakeFinish = () => baker.bake(FINISHES.find((f) => f.id === finish).mat, polish);
        bakeFinish();
        const shadedMat = new THREE.MeshMatcapMaterial({ matcap: baker.texture });
        const wireMat = new THREE.MeshBasicMaterial({
            color: ink,
            wireframe: true,
            transparent: true,
            opacity: 0.55
        });
        const pointsMat = new THREE.PointsMaterial({ color: ink, size: P.pointSize });
        const lanternRoot = new THREE.Group();
        const sfRoot = new THREE.Group();
        const SWAP_MIN = 0.02;
        const SWAP_DUR = 0.7;
        sfRoot.visible = false;
        sfRoot.scale.setScalar(SWAP_MIN);
        scene.add(lanternRoot, sfRoot);
        const geoms = new Set();
        const sampledGeoms = new Set();
        const reps = { shaded: null, wire: null, points: null };
        let mode = "shaded";
        let subject = SUBJECTS[0].id;
        let raf = 0;
        let disposed = false;
        const render = () => renderer.render(scene, camera);
        const sfCount = (SEG_U + 1) * (SEG_V + 1);
        const sfPos = new Float32Array(sfCount * 3);
        const sfFrom = new Float32Array(sfCount * 3);
        const sfTo = new Float32Array(sfCount * 3);
        const sfGeo = new THREE.BufferGeometry();
        sfGeo.setIndex(new THREE.BufferAttribute(sfIndex(), 1));
        sfGeo.setAttribute("position", new THREE.BufferAttribute(sfPos, 3));
        const dials = { lobes: 0, sharp: 1 };
        const resolve = (sf) => ({
            ...sf,
            m1: Math.max(1, sf.m1 + dials.lobes),
            m2: Math.max(1, sf.m2 + dials.lobes),
            n12: sf.n12 * dials.sharp,
            n13: sf.n13 * dials.sharp,
            n22: sf.n22 * dials.sharp,
            n23: sf.n23 * dials.sharp
        });
        let sfActive = SUBJECTS.find((x) => x.sf).sf;
        sfPositions(sfActive, sfPos);
        const sfMesh = new THREE.Mesh(sfGeo, shadedMat);
        const sfWire = new THREE.Mesh(sfGeo, wireMat);
        const sfPoints = new THREE.Points(sfGeo, pointsMat);
        sfRoot.add(sfMesh, sfWire, sfPoints);
        const sfReps = { shaded: sfMesh, wire: sfWire, points: sfPoints };
        const flush = () => {
            sfGeo.getAttribute("position").needsUpdate = true;
            sfGeo.computeVertexNormals();
            sfGeo.computeBoundingSphere();
        };
        flush();
        let morphT = 1;
        let morphDur = 0.9;
        const morphTo = (sf, dur = 0.9) => {
            sfActive = sf;
            sfPositions(sf, sfTo);
            if (reduced) {
                sfPos.set(sfTo);
                morphT = 1;
                flush();
                render();
                return;
            }
            sfFrom.set(sfPos);
            morphT = 0;
            morphDur = dur;
        };
        let swap = null;
        const swapNow = (out, into) => {
            out.visible = false;
            out.scale.setScalar(1);
            into.visible = true;
            into.scale.setScalar(1);
        };
        const place = (pill2, btn) => {
            if (!btn || !btn.offsetWidth)
                return;
            setDesignStyle(pill2, "width", `${btn.offsetWidth}px`);
            setDesignStyle(pill2, "transform", `translateX(${btn.offsetLeft - 2}px)`);
        };
        const sync = () => {
            Object.keys(sfReps).forEach((k) => {
                sfReps[k].visible = k === mode;
                if (reps[k])
                    reps[k].visible = k === mode;
            });
            segs.forEach((s) => s.setAttribute("aria-pressed", String(s.dataset.mode === mode)));
            subjectSegs.forEach((s) => s.setAttribute("aria-pressed", String(s.dataset.subject === subject)));
            place(pill, segs.find((s) => s.dataset.mode === mode));
            place(subjectPill, subjectSegs.find((s) => s.dataset.subject === subject));
        };
        const applyMode = (next) => {
            mode = next;
            sync();
            if (reduced)
                render();
        };
        const applySubject = (id) => {
            const next = SUBJECTS.find((x) => x.id === id);
            if (!next || id === subject)
                return;
            const leavingModel = !SUBJECTS.find((x) => x.id === subject)?.sf;
            subject = id;
            sync();
            if (next.sf && !leavingModel) {
                morphTo(resolve(next.sf));
            }
            else if (next.sf) {
                sfPositions(resolve(next.sf), sfPos);
                sfActive = resolve(next.sf);
                morphT = 1;
                flush();
                if (reduced)
                    swapNow(lanternRoot, sfRoot);
                else
                    swap = { out: lanternRoot, in: sfRoot, t: 0 };
            }
            else if (reduced)
                swapNow(sfRoot, lanternRoot);
            else
                swap = { out: sfRoot, in: lanternRoot, t: 0 };
            if (reduced)
                render();
        };
        const tick = (dt) => {
            if (morphT < 1) {
                morphT = Math.min(1, morphT + dt / morphDur);
                const e = expoOut(morphT);
                for (let i = 0; i < sfPos.length; i++)
                    sfPos[i] = sfFrom[i] + (sfTo[i] - sfFrom[i]) * e;
                flush();
            }
            if (swap) {
                swap.t = Math.min(1, swap.t + dt / SWAP_DUR);
                if (swap.t < 0.5) {
                    const e = expoOut(swap.t * 2);
                    swap.out.scale.setScalar(1 + (SWAP_MIN - 1) * e);
                }
                else {
                    if (swap.out.visible) {
                        swap.out.visible = false;
                        swap.in.visible = true;
                    }
                    const e = expoOut((swap.t - 0.5) * 2);
                    swap.in.scale.setScalar(SWAP_MIN + (1 - SWAP_MIN) * e);
                }
                if (swap.t >= 1) {
                    swap.in.scale.setScalar(1);
                    swap = null;
                }
            }
        };
        const loader = new GLTFLoader();
        loader.load(MODEL, (gltf) => {
            if (disposed || env.disposed) {
                gltf.scene.traverse(node => { node.geometry?.dispose(); const materials = Array.isArray(node.material) ? node.material : [node.material]; materials.filter(Boolean).forEach(material => { Object.values(material).filter(value => value?.isTexture).forEach(texture => texture.dispose()); material.dispose(); }); });
                return;
            }
            const model = gltf.scene;
            model.traverse((o) => {
                if (o.isMesh) {
                    const mesh = o;
                    const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    originals.forEach(material => { Object.values(material).filter(value => value?.isTexture).forEach(texture => texture.dispose()); material.dispose(); });
                    mesh.material = shadedMat;
                    geoms.add(mesh.geometry);
                }
            });
            const box = new THREE.Box3().setFromObject(model);
            const size2 = box.getSize(new THREE.Vector3());
            model.scale.multiplyScalar(FIT / Math.max(size2.x, size2.y, size2.z));
            box.setFromObject(model);
            model.position.sub(box.getCenter(new THREE.Vector3()));
            const wire = model.clone();
            wire.traverse((o) => {
                if (o.isMesh)
                    o.material = wireMat;
            });
            const points = model.clone();
            const pMeshes = [];
            points.traverse((o) => {
                if (o.isMesh)
                    pMeshes.push(o);
            });
            const areas = pMeshes.map((m) => {
                m.geometry.computeBoundingBox();
                const s = m.geometry.boundingBox.getSize(new THREE.Vector3());
                return 2 * (s.x * s.y + s.y * s.z + s.z * s.x) || 1;
            });
            const areaSum = areas.reduce((a, b) => a + b, 0) || 1;
            const BUDGET = 2e4;
            const tmp = new THREE.Vector3();
            pMeshes.forEach((mesh, i) => {
                const n = Math.max(400, Math.round(BUDGET * areas[i] / areaSum));
                const sampler = new MeshSurfaceSampler(mesh).build();
                const pos = new Float32Array(n * 3);
                for (let k = 0; k < n; k++) {
                    sampler.sample(tmp);
                    pos[k * 3] = tmp.x;
                    pos[k * 3 + 1] = tmp.y;
                    pos[k * 3 + 2] = tmp.z;
                }
                const geo = new THREE.BufferGeometry();
                geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
                sampledGeoms.add(geo);
                const p = new THREE.Points(geo, pointsMat);
                p.position.copy(mesh.position);
                p.quaternion.copy(mesh.quaternion);
                p.scale.copy(mesh.scale);
                mesh.parent?.add(p);
                mesh.parent?.remove(mesh);
            });
            reps.shaded = model;
            reps.wire = wire;
            reps.points = points;
            lanternRoot.add(model, wire, points);
            sync();
            wrap.dataset.ready = "";
            if (reduced)
                render();
        }, void 0, error => env.fail(error));
        const size = () => {
            const w = wrap.clientWidth;
            const h = wrap.clientHeight;
            if (!w || !h)
                return;
            renderer.setPixelRatio(Math.min(env.pixelRatio || 1, 2));
            renderer.setSize(w, h, false);
            controls.rotateSpeed = 1 / env.scale;
            controls.panSpeed = 1 / env.scale;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            sync();
            if (reduced)
                render();
        };
        const ro = env.resizeObserver(size);
        ro.observe(wrap);
        size();
        const inkColor = () => {
            const c = accentHex ?? ink;
            wireMat.color.set(c);
            pointsMat.color.set(c);
            shadedMat.color.set(accentHex ?? 16777215);
        };
        inkColor();
        const themeObs = new MutationObserver(() => {
            resolveInk();
            inkColor();
            if (reduced)
                render();
        });
        themeObs.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "class"]
        });
        segs.forEach((s) => s.addEventListener("click", () => applyMode(s.dataset.mode), { signal }));
        subjectSegs.forEach((s) => s.addEventListener("click", () => applySubject(s.dataset.subject), { signal }));
        sync();
        if (reduced) {
            controls.addEventListener("change", render);
        }
        else {
            let last = env.now();
            const loop = (now) => {
                raf = env.requestFrame(loop);
                const dt = Math.min(0.1, (now - last) / 1e3);
                last = now;
                tick(dt);
                controls.update();
                render();
            };
            raf = env.requestFrame(loop);
        }
        const set = (key, value) => {
            if (key === "spin") {
                P.spin = Number(value);
                controls.autoRotateSpeed = P.spin;
            }
            else if (key === "pointSize") {
                P.pointSize = Number(value);
                pointsMat.size = P.pointSize;
            }
            else if (key === "finish") {
                finish = String(value);
                bakeFinish();
            }
            else if (key === "polish") {
                polish = Number(value);
                bakeFinish();
            }
            else if (key === "lobes" || key === "sharp") {
                dials[key] = Number(value);
                const sf = SUBJECTS.find((x) => x.id === subject)?.sf;
                if (sf)
                    morphTo(resolve(sf), 0.35);
            }
            else if (key === "accent") {
                accentHex = String(value).startsWith("var(") ? null : String(value);
                inkColor();
            }
            if (reduced)
                render();
        };
        const destroy = () => {
            disposed = true;
            ac.abort();
            env.cancelFrame(raf);
            ro.disconnect();
            themeObs.disconnect();
            controls.dispose();
            geoms.forEach((g) => g.dispose());
            sfGeo.dispose();
            sampledGeoms.forEach((g) => g.dispose());
            shadedMat.dispose();
            wireMat.dispose();
            pointsMat.dispose();
            baker.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
            wrap.remove();
        };
        return { destroy, set };
    }
};

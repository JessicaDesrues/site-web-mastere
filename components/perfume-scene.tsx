"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type PerfumeSceneProps = {
  onReady: () => void;
};

function smoothstep(start: number, end: number, value: number) {
  const t = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
}

function createFlowTube(curve: THREE.CatmullRomCurve3, radius: number, opacity: number) {
  const geometry = new THREE.TubeGeometry(curve, 88, radius, 12, false);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x8f111d,
    emissive: 0x3b0309,
    emissiveIntensity: 0.28,
    metalness: 0.04,
    roughness: 0.2,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return { geometry, material, mesh };
}

export default function PerfumeScene({ onReady }: PerfumeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const targetRotation = useRef(0);
  const scrollProgressRef = useRef(0);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    scrollProgressRef.current = progress;
    targetRotation.current = progress * Math.PI * 3.2;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frame = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 5.15);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentTarget = pmrem.fromScene(environment, 0.04);
    scene.environment = environmentTarget.texture;
    environment.dispose();
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xffd9c9, 0x310609, 2.6));

    const keyLight = new THREE.DirectionalLight(0xffe6d4, 3.6);
    keyLight.position.set(-3.2, 4.2, 4.5);
    scene.add(keyLight);

    const redRim = new THREE.PointLight(0xff243a, 38, 9, 2);
    redRim.position.set(2.4, 0.8, -1.8);
    scene.add(redRim);

    const warmRim = new THREE.PointLight(0xffc98b, 24, 8, 2);
    warmRim.position.set(-2.8, -1.5, 2.6);
    scene.add(warmRim);

    const product = new THREE.Group();
    product.position.set(window.innerWidth < 760 ? 0 : 0.62, 0, 0);
    groupRef.current = product;
    scene.add(product);

    let cap: THREE.Object3D | null = null;
    let liquid: THREE.Object3D | null = null;
    let capHomePosition: THREE.Vector3 | null = null;
    let capHomeRotation: THREE.Euler | null = null;
    let liquidHomeScale: THREE.Vector3 | null = null;
    let pourCurve: THREE.CatmullRomCurve3 | null = null;
    let mainFlow: ReturnType<typeof createFlowTube> | null = null;
    let leftFlow: ReturnType<typeof createFlowTube> | null = null;
    let rightFlow: ReturnType<typeof createFlowTube> | null = null;
    const droplets: Array<{
      mesh: THREE.Mesh;
      material: THREE.MeshPhysicalMaterial;
      offset: number;
    }> = [];

    const loader = new GLTFLoader();
    loader.load(
      "/parfum.glb",
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const desiredHeight = window.innerWidth < 760 ? 2.22 : 2.62;
        model.scale.multiplyScalar(desiredHeight / size.y);

        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshPhysicalMaterial) {
              material.envMapIntensity = 1.15;
              material.needsUpdate = true;
            }
          });
        });

        product.add(model);

        cap = model.getObjectByName("Circle.001") ?? null;
        liquid = model.getObjectByName("Liquid") ?? null;
        if (cap) {
          capHomePosition = cap.position.clone();
          capHomeRotation = cap.rotation.clone();
        }
        if (liquid) {
          liquidHomeScale = liquid.scale.clone();
        }

        if (cap && liquid) {
          product.updateWorldMatrix(true, true);
          const liquidBounds = new THREE.Box3().setFromObject(liquid);
          const mouthWorld = new THREE.Vector3(
            (liquidBounds.min.x + liquidBounds.max.x) / 2,
            liquidBounds.max.y,
            (liquidBounds.min.z + liquidBounds.max.z) / 2,
          );
          const mouth = product.worldToLocal(mouthWorld);
          const point = (x: number, y: number, z: number) =>
            new THREE.Vector3(mouth.x + x, mouth.y + y, mouth.z + z);
          pourCurve = new THREE.CatmullRomCurve3(
            [
              mouth,
              point(0.17, -0.34, 0.1),
              point(0.48, -0.66, 0.2),
              point(0.31, -1.02, 0.28),
              point(0.64, -1.36, 0.22),
              point(1.02, -1.64, 0.08),
              point(0.82, -1.98, -0.04),
            ],
            false,
            "centripetal",
          );

          const leftStart = pourCurve.getPointAt(0.36);
          const leftCurve = new THREE.CatmullRomCurve3(
            [
              leftStart,
              leftStart.clone().add(new THREE.Vector3(-0.2, -0.22, 0.12)),
              leftStart.clone().add(new THREE.Vector3(-0.43, -0.5, 0.22)),
              leftStart.clone().add(new THREE.Vector3(-0.18, -0.82, 0.27)),
            ],
            false,
            "centripetal",
          );
          const rightStart = pourCurve.getPointAt(0.68);
          const rightCurve = new THREE.CatmullRomCurve3(
            [
              rightStart,
              rightStart.clone().add(new THREE.Vector3(0.24, -0.18, -0.12)),
              rightStart.clone().add(new THREE.Vector3(0.52, -0.38, -0.2)),
              rightStart.clone().add(new THREE.Vector3(0.74, -0.16, -0.22)),
            ],
            false,
            "centripetal",
          );

          mainFlow = createFlowTube(pourCurve, 0.045, 0);
          leftFlow = createFlowTube(leftCurve, 0.025, 0);
          rightFlow = createFlowTube(rightCurve, 0.022, 0);
          product.add(mainFlow.mesh, leftFlow.mesh, rightFlow.mesh);

          const dropGeometry = new THREE.SphereGeometry(1, 12, 10);
          const dropMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xb5232b,
            emissive: 0x500811,
            emissiveIntensity: 0.32,
            roughness: 0.16,
            clearcoat: 1,
            transparent: true,
            opacity: 0,
            depthWrite: false,
          });
          for (let index = 0; index < 7; index += 1) {
            const mesh = new THREE.Mesh(dropGeometry, dropMaterial);
            mesh.visible = false;
            mesh.renderOrder = 2;
            product.add(mesh);
            droplets.push({ mesh, material: dropMaterial, offset: index * 0.105 });
          }
        }

        onReady();
      },
      undefined,
      (error) => {
        console.error("Impossible de charger le modèle parfum.glb", error);
        onReady();
      },
    );

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (groupRef.current) {
        groupRef.current.position.x = window.innerWidth < 760 ? 0 : 0.62;
      }
    };

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      if (groupRef.current) {
        groupRef.current.rotation.y += (targetRotation.current - groupRef.current.rotation.y) * 0.075;
        groupRef.current.rotation.x = Math.sin(targetRotation.current * 0.5) * 0.045;
        groupRef.current.position.y = Math.sin(targetRotation.current * 0.65) * 0.035;

        const progress = scrollProgressRef.current;
        const capOpen = smoothstep(0.025, 0.16, progress);
        const pourAmount = smoothstep(0.12, 0.28, progress);
        const streamAmount = smoothstep(0.2, 0.94, progress);

        if (cap && capHomePosition && capHomeRotation) {
          cap.position.z = capHomePosition.z + capOpen * 0.48;
          cap.rotation.x = capHomeRotation.x + capOpen * 0.82;
          cap.rotation.y = capHomeRotation.y - capOpen * 0.12;
        }
        if (liquid && liquidHomeScale) {
          liquid.scale.z = liquidHomeScale.z * (1 - pourAmount * 0.2);
        }

        if (mainFlow && leftFlow && rightFlow && pourCurve) {
          const updateFlow = (
            flow: ReturnType<typeof createFlowTube>,
            amount: number,
            opacity: number,
          ) => {
            const segments = flow.geometry.parameters.tubularSegments;
            const sides = flow.geometry.parameters.radialSegments;
            flow.geometry.setDrawRange(0, Math.floor(amount * segments) * sides * 6);
            flow.material.opacity = opacity;
          };

          updateFlow(mainFlow, streamAmount, pourAmount * 0.38);
          updateFlow(leftFlow, smoothstep(0.28, 0.72, progress), pourAmount * 0.22);
          updateFlow(rightFlow, smoothstep(0.46, 0.82, progress), pourAmount * 0.2);

          droplets.forEach(({ mesh, material, offset }, index) => {
            const travel = streamAmount * 1.24 - offset;
            const visible = pourAmount > 0.04 && travel >= 0 && travel <= 1;
            mesh.visible = visible;
            if (visible) {
              mesh.position.copy(pourCurve!.getPointAt(travel));
              const size = (0.022 + (index % 3) * 0.008) * (0.7 + pourAmount * 0.3);
              mesh.scale.set(size * 0.8, size * 1.25, size * 0.8);
              material.opacity = pourAmount * 0.42;
            }
          });
        }
      }
      renderer.render(scene, camera);
    };

    resize();
    animate();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      environmentTarget.dispose();
    };
  }, [onReady]);

  return (
    <div className="perfume-stage" aria-hidden="true">
      <div className="stage-aura" />
      <div className="stage-orbit stage-orbit-outer" />
      <div className="stage-orbit stage-orbit-inner" />
      <canvas ref={canvasRef} className="perfume-canvas" />
      <div className="stage-floor" />
      <span className="stage-side-label">NUIT ROUGE — N° 01</span>
    </div>
  );
}

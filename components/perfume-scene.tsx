"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

type PerfumeSceneProps = {
  onReady: () => void;
};

export default function PerfumeScene({ onReady }: PerfumeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const targetRotation = useRef(0);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
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

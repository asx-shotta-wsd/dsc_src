import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let isDragging = false;
let previousTouch = { x: 0, y: 0 };
let previousMousePosition = { x: 0, y: 0 };
let animationId = null; // アニメーションIDを保持
let currentUrl = 'assets/3d/shoes1/scene.gltf';
let models = [
  { url: 'assets/3d/cake3/scene.gltf', pos: new THREE.Vector3(0, -3, 15), rot: new THREE.Euler(-0.3, 0, 0), scl: new THREE.Vector3(0.15, 0.15, 0.15) },
  { url: 'assets/3d/shoes1/scene.gltf', pos: new THREE.Vector3(0, 0.2, 0.3), rot: new THREE.Euler(-0.3, 0, 0), scl: new THREE.Vector3(1, 1, 1) }
];

// const url = 'assets/3d/sneakers/scene.gltf';
// camera.position.set(0, 0.1, 0.5); // 少し高めに配置

// const url = 'assets/3d/cake/scene.gltf';
// camera.position.set(0, 0.1, 0.3); // 少し高めに配置

// const url = 'assets/3d/cake2/scene.gltf';
// camera.position.set(0, 0, 0.4); // 少し高めに配置

function init() {
  // シーンの作成
  scene = new THREE.Scene();

  // カメラの設定
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // レンダラーの作成
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff); // 背景をグレーに

  if (document.body.querySelector('canvas')) {
    // 既存のcanvasタグを削除
    const existingCanvas = document.body.querySelector('canvas');
    existingCanvas.remove();
  }

  document.body.appendChild(renderer.domElement);

  // GLTFモデルの読み込み
  const loader = new GLTFLoader();
  const t = models.find(r => r.url === currentUrl);
  camera.position.set(t.pos.x, t.pos.y, t.pos.z); // 少し高めに配置
  camera.rotation.set(t.rot.x, t.rot.y, t.rot.z);

  loader.load(t.url, function (gltf) {
    console.log('GLTF Loaded:', gltf.scene);
    model = gltf.scene;

    // モデルのサイズ調整
    model.scale.set(t.scl.x, t.scl.y, t.scl.z);

    scene.add(model);
  }, undefined, function (error) {
    console.error('GLTFモデルの読み込みに失敗:', error);
  });

  // タッチイベントの設定
  renderer.domElement.addEventListener('touchstart', onTouchStart, false);
  renderer.domElement.addEventListener('touchmove', onTouchMove, false);
  renderer.domElement.addEventListener('touchend', () => { isDragging = false; }, false);
  // マウスイベント (PC用)
  renderer.domElement.addEventListener('mousedown', onMouseDown, false);
  renderer.domElement.addEventListener('mousemove', onMouseMove, false);
  renderer.domElement.addEventListener('mouseup', () => { isDragging = false; }, false);

  stopAnimation(); // 既存のアニメーションを停止
  animate();
}
function onTouchStart(event) {
  if (event.touches.length === 1) {
    isDragging = true;
    previousTouch.x = event.touches[0].clientX;
    previousTouch.y = event.touches[0].clientY;

    // 回転軸をタッチ位置に基づいて変更
    const touchPos = new THREE.Vector2(
      (event.touches[0].clientX / window.innerWidth) * 2 - 1,
      -(event.touches[0].clientY / window.innerHeight) * 2 + 1
    );
    const touchVector = new THREE.Vector3(touchPos.x, touchPos.y, 0.5); // 中心から放射されたベクトル
  }
}

function onTouchMove(event) {
  if (isDragging && event.touches.length === 1) {
    const deltaX = event.touches[0].clientX - previousTouch.x;
    const deltaY = event.touches[0].clientY - previousTouch.y;

    // 回転軸に沿ってモデルを回転
    model.rotateOnAxis(new THREE.Vector3(0, 1, 0), deltaX * 0.01); // 左右の回転
    model.rotateOnAxis(new THREE.Vector3(0, 1, 0), deltaY * 0.01); // 上下の回転

    // タッチ位置を更新
    previousTouch.x = event.touches[0].clientX;
    previousTouch.y = event.touches[0].clientY;
  }
}

// マウス押下時（ドラッグ開始）
function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };

  // マウス位置に基づいて回転軸を変更
  const mousePos = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const mouseVector = new THREE.Vector3(mousePos.x, mousePos.y, 0.5); // 中心から放射されたベクトル
}

// マウス移動時（ドラッグ中）
function onMouseMove(event) {
  if (!isDragging) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  // 回転軸に沿ってモデルを回転
  model.rotateOnAxis(new THREE.Vector3(0, 1, 0), deltaX * 0.01); // 左右の回転
  model.rotateOnAxis(new THREE.Vector3(0, 1, 0), deltaY * 0.01); // 上下の回転

  // マウス位置を更新
  previousMousePosition = { x: event.clientX, y: event.clientY };
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (model) {
    // 回転軸を使って回転を行う
    model.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.005);  // 回転速度は0.01
  }

  renderer.render(scene, camera);
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

const fullscreenBtn = document.getElementById('fullscreen-btn');
// フルスクリーン切り替え
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    // フルスクリーンにする
    const elem = document.documentElement; // `<html>` をフルスクリーン化
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { // Safari対応
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE対応
      elem.msRequestFullscreen();
    }
    fullscreenBtn.textContent = "全画面解除"; // ボタンのテキスト変更
  } else {
    // フルスクリーン解除
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari対応
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE対応
      document.msExitFullscreen();
    }
    fullscreenBtn.textContent = "全画面"; // ボタンのテキスト変更
  }
});

const nextBtn = document.getElementById('next-btn');
// フルスクリーン切り替え
nextBtn.addEventListener('click', () => {
  let nextIdx = models.findIndex(r => r.url === currentUrl);
  if (models.length <= nextIdx + 1) {
    nextIdx = 0;
  } else {
    nextIdx++;
  }

  currentUrl = models[nextIdx].url;

  init();
});

// ウィンドウサイズ変更時にリサイズ処理
window.addEventListener('resize', () => {
  setCanvasSize();
});

// canvasサイズの設定
function setCanvasSize() {
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}

init();

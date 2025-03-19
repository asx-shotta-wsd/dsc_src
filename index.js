// import * as THREE from 'three';
import { Scene, PerspectiveCamera, WebGLRenderer, Vector3, Euler, AmbientLight, DirectionalLight, PlaneGeometry, ShadowMaterial, Mesh, LinearSRGBColorSpace, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './index.css';

const loader = new GLTFLoader();

let scene, camera, renderer, model;
let ambientLight, directionalLight, plane, light;
let isDragging = false;
let previousTouch = { x: 0, y: 0 };
let previousMousePosition = { x: 0, y: 0 };
let animationId = null; // アニメーションIDを保持
let changeModelTimeout = null;
let changeSceneSec = 20;
let ratio = 1;
let ratioBase = 1080;
let currentIndex = 0;
let models = [
  {
    // url: 'assets/3d/cake2/scene.gltf',
    url: 'assets/3d/cake2/scene.glb',
    pos: new Vector3(0, 0.15, 0.27),
    rot: new Euler(-0.3, 0, 0),
    scl: new Vector3(1.7, 1.7, 1.7),
    speed: 0.01,
    colorSpace: LinearSRGBColorSpace
  },
  {
    // url: 'assets/3d/cake5/scene.gltf',
    url: 'assets/3d/cake5/scene.glb',
    pos: new Vector3(0, 0.09, 0.22),
    rot: new Euler(-0.3, 0, 0),
    scl: new Vector3(1.5, 1.5, 1.5),
    speed: 0.01,
    colorSpace: SRGBColorSpace
  },
];

let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

function init() {

  if (model) {
    disposeModel(model);
    model = null;  // 参照を確実に削除
  } else {
    // シーンの作成
    scene = new Scene();

    // カメラの設定
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xffffff); // 背景をグレーに

    document.body.appendChild(renderer.domElement);
    // タッチイベントの設定
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, false);
    renderer.domElement.addEventListener('touchend', () => {
      isDragging = false;
      scheduleNextModelChange();
    }, false);
    // マウスイベント (PC用)
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
      scheduleNextModelChange();
    }, false);

    // 環境光（全体を明るくする）
    ambientLight = new AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    // 方向光（モデルを立体的に照らす）
    directionalLight = new DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 床を追加（影を受ける）
    const planeGeometry = new PlaneGeometry(5, 5);
    const planeMaterial = new ShadowMaterial({ opacity: 0.3 }); // 半透明の影
    plane = new Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = -Math.PI / 2; // 床の角度を設定
    plane.rotation.x = 180;
    plane.position.y = -0.15; // 少し下に配置
    plane.receiveShadow = true; // 影を受ける
    scene.add(plane);

    light = new DirectionalLight(0xffffff, 2);
    light.position.set(0, 1.0, -0.3); // 影を落とす方向
    light.castShadow = true; // シャドウを有効化

    // 影の解像度を上げる（デフォルトは粗いので調整）
    light.shadow.mapSize.width = 8192;
    light.shadow.mapSize.height = 8192;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 5;
    scene.add(light);
  }

  setCanvasSize();

  const t = models[currentIndex];

  // 新しい方法
  renderer.outputColorSpace = t.colorSpace;

  // GLTFモデルの読み込み
  camera.position.set(t.pos.x, t.pos.y, t.pos.z); // 少し高めに配置
  camera.rotation.set(t.rot.x, t.rot.y, t.rot.z);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap; // ソフトな影を作る

  loader.load(t.url, function (gltf) {
    // console.log('GLTF Loaded:', gltf.scene);
    model = gltf.scene;

    const x = ratio * t.scl.x;
    const y = ratio * t.scl.y;
    const z = ratio * t.scl.z;

    // モデルのサイズ調整
    model.scale.set(x, y, z);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true; // 影を落とす
      }
    });


    scene.add(model);
  }, undefined, function (error) {
    console.error('GLTFモデルの読み込みに失敗:', error);
  });

  stopAnimation(); // 既存のアニメーションを停止
  animate();
  renderer.render(scene, camera);
  // 初回のモデル変更をスケジュール
  scheduleNextModelChange();
}
function onTouchStart(event) {
  if (event.touches.length === 1) {
    isDragging = true;
    previousTouch.x = event.touches[0].clientX;
    previousTouch.y = event.touches[0].clientY;
  }
}

function onTouchMove(event) {
  if (isDragging && event.touches.length === 1) {
    const deltaX = event.touches[0].clientX - previousTouch.x;
    const deltaY = event.touches[0].clientY - previousTouch.y;

    // 回転軸に沿ってモデルを回転
    model.rotateOnAxis(new Vector3(0, 1, 0), deltaX * 0.01); // 左右の回転
    model.rotateOnAxis(new Vector3(0, 1, 0), deltaY * 0.01); // 上下の回転

    // タッチ位置を更新
    previousTouch.x = event.touches[0].clientX;
    previousTouch.y = event.touches[0].clientY;
  }
}

// マウス押下時（ドラッグ開始）
function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };

}

// マウス移動時（ドラッグ中）
function onMouseMove(event) {
  if (!isDragging) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  // 回転軸に沿ってモデルを回転
  model.rotateOnAxis(new Vector3(0, 1, 0), deltaX * 0.01); // 左右の回転
  model.rotateOnAxis(new Vector3(0, 1, 0), deltaY * 0.01); // 上下の回転

  // マウス位置を更新
  previousMousePosition = { x: event.clientX, y: event.clientY };
}

function animate(timestamp) {
  // 前回のフレームからの経過時間を確認
  const deltaTime = timestamp - lastFrameTime;

  if (deltaTime >= frameInterval) {
    // アニメーションを更新
    if (model) {
      model.rotateOnAxis(new Vector3(0, 1, 0), models[currentIndex].speed);  // 回転速度
    }

    lastFrameTime = timestamp - (deltaTime % frameInterval); // フレームのタイミングを調整
  }

  // 次のフレームをリクエスト
  animationId = requestAnimationFrame(animate);

  // シーンを再描画
  renderer.render(scene, camera);
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function scheduleNextModelChange() {
  // 既存のタイマーがあればクリア
  if (changeModelTimeout) {
    clearTimeout(changeModelTimeout);
  }

  // 10秒後に nextBtn のクリック処理と同様の動作を実行
  changeModelTimeout = setTimeout(() => {
    let nextIdx = currentIndex + 1;
    if (nextIdx >= models.length) {
      nextIdx = 0;
    }
    currentIndex = nextIdx;
    init();
  }, changeSceneSec * 1000);
}

const fullscreenBtn = document.getElementById('fullscreen-btn');
// フルスクリーン切り替え
fullscreenBtn.addEventListener('click', () => {

  const mx1 = document.getElementById('mx_1');
  const mx2 = document.getElementById('mx_2');

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
    mx1.style.display = 'none';
    mx2.style.display = 'unset';
  } else {
    // フルスクリーン解除
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari対応
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE対応
      document.msExitFullscreen();
    }
    mx1.style.display = 'unset';
    mx2.style.display = 'none';
  }
});

const nextBtn = document.getElementById('next-btn');
// フルスクリーン切り替え
nextBtn.addEventListener('click', () => {
  let nextIdx = currentIndex;
  if (models.length <= nextIdx + 1) {
    nextIdx = 0;
  } else {
    nextIdx++;
  }

  currentIndex = nextIdx;

  init();
});

// ウィンドウサイズ変更時にリサイズ処理
window.addEventListener('resize', () => {
  setCanvasSize();
});

window.addEventListener("beforeunload", () => {
  clearRenderer();
});

// canvasサイズの設定
function setCanvasSize() {
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    // camera.aspect = window.innerWidth / window.innerHeight;
    // camera.updateProjectionMatrix();

    // 375   1080
    const sabun = (ratioBase - window.innerWidth) / 2;
    ratio = (window.innerWidth + sabun) / (ratioBase);
  }
}

function disposeModel(model) {
  if (!model) return;

  model.traverse(child => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(disposeMaterial);
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });

  scene.remove(model);
  model = null;

  // WebGLのバッファを完全に削除
  renderer.renderLists.dispose();
  renderer.info.reset();
  renderer.compile(scene, camera); // シェーダー再コンパイル
}

function disposeMaterial(material) {
  if (!material) return;

  for (const key of Object.keys(material)) {
    const value = material[key];

    // テクスチャがあれば削除
    if (value && value.isTexture) {
      value.dispose();
      renderer.properties.remove(value); // キャッシュから削除
    }
  }

  material.dispose();
}

init();

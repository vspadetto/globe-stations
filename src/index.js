const SCALE_FACTOR = 1.4;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cardElement;
let renderer;
let camera;
let cameraControls;
let scene;
let points3d;
let selectedPoint;

function getCardElement(info) {
    return `
        <div class="card-header">
            <div class="card-title">${info.StationName}</div>
            <div class="card-close-btn">X</div>
        </div>
        <div class="card-content">
            <image class="card-img" src=https://interact-gis.org/Files/StationImages/${info.Image}></image>
            <a href='#' rel='noreferrer noopener'>More information &rarr;</a>
        </div>
    `;
}

function displayCard(e, stationInfo) {
    closeCard(e);

    cardElement = document.createElement('div');

    cardElement.classList.add('card');
    cardElement.innerHTML = getCardElement(stationInfo);
    cardElement.style.left = `${e.clientX}px`;
    cardElement.style.top = `${e.clientY}px`;

    cardElement.addEventListener('click', closeCard);

    document.body.appendChild(cardElement);
}

function showTitle(e, stationInfo) {
    const titleElement = document.getElementsByClassName('title')[0];

    titleElement.innerHTML = stationInfo.StationName;
    titleElement.style.left = `${e.clientX + 20}px`;
    titleElement.style.top = `${e.clientY}px`;
    titleElement.style.display = `block`;
}

function hideTitle() {
    const titleElement = document.getElementsByClassName('title')[0];
    titleElement.style.display = 'none'
}

function closeCard(e) {
    e.stopPropagation();

    if (cardElement) {
        document.body.removeChild(cardElement);
        cardElement = null;
    }
}

function getIntersection() {
    for (let i = 0; i < points3d.length; ++i) {
        if (!points3d[i].__threeObj) {
            continue;
        }
        const { __threeObj: threeObj } = points3d[i];

        const intersections = raycaster.intersectObject(threeObj);
        if (intersections.length > 0) {
            return points3d[i];
        }
    }
}

function bindEvents() {
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
}

function animate(globe) {
    raycaster.setFromCamera(mouse, camera);

    // rotate globe
    globe.rotation.y += 0.0003;

    cameraControls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(() => animate(globe));
};

function initScene(globe) {
    // Setup light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(1, 1, 1);

    // Setup renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('globe-container').appendChild(renderer.domElement);

    // Setup scene
    scene = new THREE.Scene();
    scene.add(globe);
    scene.add(new THREE.AmbientLight(0xbbbbbb));
    scene.add(directionalLight);

    // Setup camera
    const ratio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);
    camera.aspect = ratio;
    camera.updateProjectionMatrix();
    camera.position.z = 200;
    camera.position.y = 200;

    // Setup camera controls
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.enablePan = false;
    cameraControls.zoomSpeed = 0.6;
    cameraControls.maxDistance = 200;
    cameraControls.minDistance = 120;
    cameraControls.rotateSpeed = 0.5;
    cameraControls.maxPolarAngle = Math.PI / 2;
}

function initGlobe() {
    const points = stations.map(station => ({
        lat: station.Latitude,
        lng: station.Longitude,
        size: 0,
        ...station,
    }));

    const globe = new ThreeGlobe()
        .globeImageUrl('./textures/earth-texture.png')
        .bumpImageUrl('./textures/earth-texture.png')
        .pointsData(points)
        .showAtmosphere(false)
        .pointAltitude(0)
        .pointColor(() => '#ff0000')
        .pointResolution(32)
        .showGraticules(true)
        .pointRadius(0.4);

    return globe;
}

(async function start() {
    try {
        const globe = initGlobe();
        points3d = globe.pointsData();

        initScene(globe);
        animate(globe);
        bindEvents();
    } catch(error) {
        console.log(error);
    }
})();


// EVENT HANDLERS

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // reset previous selected object
    if (selectedPoint) {
        selectedPoint.__threeObj.scale.divideScalar(SCALE_FACTOR);
        selectedPoint = null;
        document.body.style.cursor = 'default';
    }

    const intersection = getIntersection();
    if (intersection) {
        intersection.__threeObj.scale.multiplyScalar(SCALE_FACTOR);
        selectedPoint = intersection;
        document.body.style.cursor = 'pointer';
        showTitle(event, selectedPoint);
    } else {
        hideTitle();
    }
}

function onMouseDown(event) {
    if (selectedPoint) {
        displayCard(event, selectedPoint);
    } else {
        closeCard(event);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

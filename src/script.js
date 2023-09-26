import './style.css'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils'
import {
    BufferAttribute,
    BufferGeometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    Points,
    PointsMaterial,
    TriangleStripDrawMode,
    Float32BufferAttribute,
    Raycaster,
    Vector2,
    Vector3,
    BoxGeometry,
    LOD,
    Shape,
    ShapeGeometry,
    ExtrudeGeometry,
    MeshStandardMaterial, LineBasicMaterial, Line, LineSegments, Line3
} from "three";

// ==================================
let _isNoLinesAbove
let _isNoLinesBelow
let _isNoLinesRight
let _isNoLinesLeft
let _skipLineIndex = []

const _center1 = new Vector3()
const _center2 = new Vector3()
// =====================================

const loader = new GLTFLoader();

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// loader.load('/rounds-windows/L-win.glb', obj => {
// loader.load('/rounds-windows/full-round-accent-window-001.glb', obj => {
loader.load('/205.glb', obj => {
    // const window = obj.scene.getObjectByName('Window').clone()
    // const window = obj.scene.children[0].getObjectByName('full_round_accent_window_001_1').clone()
    const hole = obj.scene.children[0].getObjectByName('Box001_1').clone()
    // const window = obj.scene.children[0].getObjectByName('Rectangle007_1').clone()
    hole.geometry.rotateX(Math.PI * -.5)
    console.warn(hole, obj)
    scene.add(hole)
    getContour(hole)
})


const getContour = (hole) => {
    const holeGeometry = hole.geometry
    const geometryPositions = holeGeometry.getAttribute('position')
    const geometryIndices = holeGeometry.getIndex()

    const facesLines = []
    let filteredLines = []

    for (let i = 0; i < geometryIndices.array.length; i += 3) {
        const indices = [
            geometryIndices.array[i],
            geometryIndices.array[i + 1],
            geometryIndices.array[i + 2]
        ]
        const face = {
            a: new Vector3(geometryPositions.getX(indices[0]), geometryPositions.getY(indices[0]), geometryPositions.getZ(indices[0])),
            b: new Vector3(geometryPositions.getX(indices[1]), geometryPositions.getY(indices[1]), geometryPositions.getZ(indices[1])),
            c: new Vector3(geometryPositions.getX(indices[2]), geometryPositions.getY(indices[2]), geometryPositions.getZ(indices[2])),
        }

        if (face.a.z > 0 || face.b.z > 0 || face.c.z > 0) {
            continue
        }

        face.a.z = 0
        face.b.z = 0
        face.c.z = 0

        facesLines.push(
            [face.a, face.b],
            [face.b, face.c],
            [face.c, face.a],
        )
    }

    for (let i = 0; i < facesLines.length; i++) {
        if (_skipLineIndex.includes(i)) continue

        _isNoLinesAbove = _isNoLinesBelow = _isNoLinesRight = _isNoLinesLeft = true
        const line = facesLines[i]
        const lineStart = line[0]
        const lineEnd = line[1]

        // Check if there are lines on the right/left side
        for (let k = 0; k < facesLines.length; k++) {
            if (i === k) continue

            const lineNext = facesLines[k]
            const lineNextStart = lineNext[0]
            const lineNextEnd = lineNext[1]

            const maxLineY = Math.max(lineStart.y, lineEnd.y)
            const minLineY = Math.min(lineStart.y, lineEnd.y)
            const minLineNextY = Math.min(lineNextStart.y, lineNextEnd.y)
            const maxLineNextY = Math.max(lineNextStart.y, lineNextEnd.y)

            // The next line is below, above or has a common vertex
            if ((maxLineY <= minLineNextY) || (minLineY >= maxLineNextY)) { continue }

            _center1.addVectors(lineStart, lineEnd).multiplyScalar(.5)
            _center2.addVectors(lineNextStart, lineNextEnd).multiplyScalar(.5)

            if (_center1.x < _center2.x) { _isNoLinesRight = false }
            if (_center1.x > _center2.x) { _isNoLinesLeft = false }
            if (!_isNoLinesRight && !_isNoLinesLeft) { break }
        }

        // Check if there are lines below/above
        for (let k = 0; k < facesLines.length; k++) {
            if (i === k) continue

            const lineNext = facesLines[k]
            const lineNextStart = lineNext[0]
            const lineNextEnd = lineNext[1]

            const maxLineX = Math.max(lineStart.x, lineEnd.x)
            const minLineX = Math.min(lineStart.x, lineEnd.x)
            const minLineNextX = Math.min(lineNextStart.x, lineNextEnd.x)
            const maxLineNextX = Math.max(lineNextStart.x, lineNextEnd.x)

            if ((maxLineX <= minLineNextX) || (minLineX >= maxLineNextX)) {continue}

            _center1.addVectors(lineStart, lineEnd).multiplyScalar(.5)
            _center2.addVectors(lineNextStart, lineNextEnd).multiplyScalar(.5)

            if (_center1.y > _center2.y) { _isNoLinesBelow = false }
            if (_center1.y < _center2.y) { _isNoLinesAbove = false }
            if (!_isNoLinesAbove && !_isNoLinesBelow) { break }
        }

        if (_isNoLinesRight || _isNoLinesLeft) {
            if ((lineStart.y === lineEnd.y) && !_isNoLinesBelow) { continue }
            filteredLines.push([lineStart, lineEnd])
        }

        if (_isNoLinesBelow || _isNoLinesAbove) {
            if (lineStart.x === lineEnd.x) { continue }
            filteredLines.push([lineStart, lineEnd])
        }

        _skipLineIndex.push(i)
    }

    const lineMaterial = new LineBasicMaterial({color: '#ff0000'})
    for (const line of filteredLines) {
        const lineGeom = new BufferGeometry()
        lineGeom.setFromPoints([line[0], line[1]])
        const line1 = new Line(lineGeom, lineMaterial)
        line1.position.z -= 61
        scene.add(line1)
    }
}


// Lights

const pointLight = new THREE.PointLight(0xffffff, 10)
pointLight.position.x = 2
pointLight.position.y = 100
pointLight.position.z = 4
scene.add(pointLight)
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)
const axesHelper = new THREE.AxesHelper(300)
scene.add(axesHelper)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 0
camera.position.y = 100
camera.position.z = 250
camera.lookAt(0, 100, 0)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const clock = new THREE.Clock()

const tick = () => {

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    // sphere.rotation.y = .5 * elapsedTime

    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
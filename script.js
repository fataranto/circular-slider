class CircularSlider {
    constructor() {
        this.container = document.getElementById('container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.sliderGroup = new THREE.Group();
        this.scene?.add(this.sliderGroup);

        this.images = [];
        this.imageCount = 8;
        this.aspectRatio = 16 / 9;

        // Config inicial
        this.radius = 15;         // 👈 radio del cilindro
        this.imageHeight = 6;
        this.rotationY = 0;
        this.velocity = 0.005;

        // Sizes
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.init();
        this.loadImages();
        this.setupEventListeners();
        this.setupGUI();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        this.camera = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            1000
        );
        this.camera.position.z = 15;
        this.camera.position.y = 0;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);

        this.scene.add(this.sliderGroup);
    }

    loadImages() {
        const imageUrls = [
            '/img/4dfab.png',
            '/img/pwb1.png',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1756129725694-00ae06b62be7?q=80&w=1365&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        ];

        const loader = new THREE.TextureLoader();
        imageUrls.forEach((url, index) => {
            loader.load(url, (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.repeat.x = -1;
                this.createImageSegment(texture, index);
            });
        });
    }

createImageSegment(texture, index) {
    const totalAngle = Math.PI * 2;
    const gap = 0.05;
    const anglePerImage = totalAngle / this.imageCount;
    const angleSize = anglePerImage - gap;
    const startAngle = index * anglePerImage;

    // Calcular altura de la imagen a partir de su proporción real
    const imgAspect = texture.image.width / texture.image.height;
    const targetWidth = this.imageHeight * this.aspectRatio; // puedes jugar con esto
    const imageHeight = targetWidth / imgAspect; // altura real en proporción

    const geometry = new THREE.CylinderGeometry(
        this.radius,
        this.radius,
        imageHeight,  // 👈 ahora altura variable
        32,
        1,
        true,
        startAngle,
        angleSize
    );

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Desplazar el mesh hacia abajo la mitad de su altura
    // así el "techo" queda alineado con las demás
    //mesh.position.y = -(this.imageHeight / 2) + (imageHeight / 2);

    //alinea las imágenes porr el borde superior
    mesh.position.y = -(imageHeight / 2) + 3.5;

    this.sliderGroup.add(mesh);
    this.images.push(mesh);
}


    updateRadius(newRadius) {
        this.radius = newRadius;

        this.images.forEach((mesh, index) => {
            // eliminar geometría vieja
            mesh.geometry.dispose();

            // crear nueva geometría con el nuevo radio
            const angleSize = (Math.PI * 2) / this.imageCount;
            const startAngle = index * angleSize;

            mesh.geometry = new THREE.CylinderGeometry(
                this.radius,
                this.radius,
                this.imageHeight,
                32,
                1,
                true,
                startAngle,
                angleSize
            );
        });
    }

setupEventListeners() {
    this.isLeftMouseDown = false;
    this.startMouseY = 0;
    this.startCameraPitch = 0;

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            this.isLeftMouseDown = true;
            this.startMouseY = e.clientY;
            this.startCameraPitch = Math.atan2(this.camera.position.y, this.camera.position.z);
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.isLeftMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
        // velocidad horizontal (si no presionas botón izquierdo)
        if (!this.isLeftMouseDown) {
            const xNorm = (e.clientX / this.sizes.width) * 2 - 1;
            this.velocity = xNorm * 0.02;
        }

        // inclinación vertical (botón izquierdo)
        if (this.isLeftMouseDown) {
            const deltaY = e.clientY - this.startMouseY;
            const factor = 0.005; // sensibilidad
            let pitch = this.startCameraPitch + deltaY * factor;

            // limitar ángulo máximo
            const maxPitch = 0.1; // ~6° hacia arriba
            const minPitch = -0.1; // ~6° hacia abajo
            if (pitch > maxPitch) pitch = maxPitch;
            if (pitch < minPitch) pitch = minPitch;

            // Y depende de la distancia Z
            this.camera.position.y = Math.tan(pitch) * this.camera.position.z;
            this.camera.lookAt(0, 0, 0);
        }

    });


    // zoom con rueda
    window.addEventListener('wheel', (e) => {
        const delta = e.deltaY * 0.01;
        this.camera.position.z += delta;

        // limitar z
        if (this.camera.position.z < 0.5) this.camera.position.z = 0.5; // mínimo positivo
        if (this.camera.position.z > 15) this.camera.position.z = 15;

        if (this.guiParams) {
            this.guiParams.cameraDistance = this.camera.position.z;
            this.gui.updateDisplay();
        }
    });


    // evitar menú derecho
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // resize
    window.addEventListener('resize', () => {
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    });
}






    setupGUI() {
        this.gui = new dat.GUI();
        this.gui.domElement.style.position = 'fixed';
        this.gui.domElement.style.top = '20px';
        this.gui.domElement.style.right = '20px';

        this.guiParams = {
            cameraDistance: this.camera.position.z,
            radius: this.radius
        };

        this.gui.add(this.guiParams, 'cameraDistance', -50, 50)
            .name('Distancia Cámara')
            .step(0.5)
            .onChange((val) => {
                this.camera.position.z = val;
            });

        this.gui.add(this.guiParams, 'radius', 5, 50)
            .name('Radio Cilindro')
            .step(0.5)
            .onChange((val) => {
                this.updateRadius(val);
            });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.rotationY += this.velocity;
        this.sliderGroup.rotation.y = this.rotationY;

        this.renderer.render(this.scene, this.camera);
    }
}

if (typeof THREE !== 'undefined') {
    new CircularSlider();
} else {
    console.error('THREE.js no está cargado');
}

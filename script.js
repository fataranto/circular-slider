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
        this.velocity = 0;

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
        this.camera.position.z = 20;
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
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=533&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=533&fit=crop&crop=center'
        ];

        const loader = new THREE.TextureLoader();
        imageUrls.forEach((url, index) => {
            loader.load(url, (texture) => {
                this.createImageSegment(texture, index);
            });
        });
    }

    createImageSegment(texture, index) {
        const angleSize = (Math.PI * 2) / this.imageCount;
        const startAngle = index * angleSize;

        const geometry = new THREE.CylinderGeometry(
            this.radius,       // radio superior
            this.radius,       // radio inferior
            this.imageHeight,
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
        mesh.userData = { texture, index };
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
        window.addEventListener('resize', () => {
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;

            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
        });

        window.addEventListener('mousemove', (e) => {
            const xNorm = (e.clientX / this.sizes.width) * 2 - 1;
            this.velocity = xNorm * 0.02;
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

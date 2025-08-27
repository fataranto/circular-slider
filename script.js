class CircularSlider {
    constructor() {
        this.container = document.getElementById('container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.images = [];
        this.imageTextures = [];
        this.currentOffset = 0;
        this.targetOffset = 0;
        this.velocity = 0;
        this.mouse = { x: 0, y: 0 };
        
        // Sizes object
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Configuración del slider
        this.imageCount = 8;
        this.imageSpacing = (Math.PI * 2) / this.imageCount;
        this.aspectRatio = 16/9;
        
        // Inicializar cameraDistance como null para detectar primera vez
        this.cameraDistance = null;
        
        // Calcular valores iniciales basados en viewport
        this.calculateResponsiveSizes();
        
        this.init();
        this.loadImages();
        this.setupEventListeners();
        this.setupControls();
        this.animate();
    }
    
    calculateResponsiveSizes() {
        // Hacer el slider verdaderamente responsive al ancho
        const aspectRatio = this.sizes.width / this.sizes.height;
        
        // Escalar todo basado en el ancho de la pantalla
        const scaleFactor = this.sizes.width / 1920; // Usar 1920px como referencia base
        
        this.radius = 8 * Math.max(scaleFactor, 0.5); // Mínimo 50% del tamaño base
        this.imageWidth = 4.5 * Math.max(scaleFactor, 0.5);
        this.imageHeight = this.imageWidth / this.aspectRatio;
        
        // Determinar si aplicar responsive o usar valor de control
        const controlValue = this.getControlValue('cameraDistance', 0);
        
        // Si es la primera vez (null) o el control está en 0, aplicar responsive
        if (this.cameraDistance === null || controlValue === 0) {
            // Aplicar cálculo responsive
            const baseDistance = 4;
            const responsiveDistance = baseDistance / Math.max(scaleFactor, 0.3);
            this.cameraDistance = responsiveDistance - baseDistance; // Convertir a offset desde base
        } else if (controlValue !== 0) {
            // Si el usuario ha ajustado manualmente a un valor diferente de 0, respetarlo
            this.cameraDistance = controlValue;
        }
        // Si no es primera vez y control está en 0, mantener el valor responsive actual
        
        this.cameraY = 0;
        
        console.log(`Responsive: width=${this.sizes.width}, scale=${scaleFactor.toFixed(2)}, radius=${this.radius.toFixed(1)}, cameraOffset=${this.cameraDistance.toFixed(1)}, finalZ=${(4 + this.cameraDistance).toFixed(1)}`);
    }
    
    setupControls() {
        // Configurar event listeners para los controles
        const controls = ['imageSize', 'radiusBase', 'cameraDistance', 'separation', 'cameraY'];
        
        controls.forEach(controlId => {
            const control = document.getElementById(controlId);
            const valueSpan = document.getElementById(controlId + '-value');
            
            if (control && valueSpan) {
                control.addEventListener('input', (e) => {
                    valueSpan.textContent = e.target.value;
                    this.updateFromControls();
                });
            }
        });
        
        // Botón reset
        const resetBtn = document.getElementById('reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                document.getElementById('imageSize').value = 25;
                document.getElementById('radiusBase').value = 35;
                document.getElementById('cameraDistance').value = 0;
                document.getElementById('separation').value = 1.1;
                document.getElementById('cameraY').value = 0;
                
                // Actualizar displays
                document.getElementById('imageSize-value').textContent = 25;
                document.getElementById('radiusBase-value').textContent = 35;
                document.getElementById('cameraDistance-value').textContent = 0;
                document.getElementById('separation-value').textContent = 1.1;
                document.getElementById('cameraY-value').textContent = 0;
                
                this.updateFromControls();
            });
        }
        
        // Botón ocultar/mostrar
        const toggleBtn = document.getElementById('toggleControls');
        const controlsPanel = document.getElementById('controls');
        if (toggleBtn && controlsPanel) {
            let isVisible = true;
            toggleBtn.addEventListener('click', () => {
                isVisible = !isVisible;
                if (isVisible) {
                    controlsPanel.style.top = '20px';
                    toggleBtn.textContent = 'Ocultar Controles';
                } else {
                    controlsPanel.style.top = '-230px';
                    toggleBtn.textContent = 'Mostrar Controles';
                }
            });
        }
    }
    
    
    updateFromControls() {
        const imageSize = this.getControlValue('imageSize', 25);
        const radiusBase = this.getControlValue('radiusBase', 35);
        const cameraDistance = this.getControlValue('cameraDistance', 0);
        
        // Valores fijos sin responsive
        this.imageWidth = imageSize * 0.2;
        this.imageHeight = this.imageWidth / this.aspectRatio;
        this.radius = radiusBase * 0.3;
        this.cameraDistance = cameraDistance; // Ahora usa el valor directo
        this.cameraY = this.getControlValue('cameraY', 0);
        
        // Actualizar cámara - sumar el valor del control a la distancia base
        this.camera.position.z = 4 + this.cameraDistance;
        this.camera.position.y = this.cameraY;
        
        // Actualizar geometría de todas las imágenes
        this.images.forEach(image => {
            const newGeometry = new THREE.PlaneGeometry(this.imageWidth, this.imageHeight, 1, 1);
            image.geometry.dispose();
            image.geometry = newGeometry;
        });
    }
    
    getControlValue(controlId, defaultValue) {
        const control = document.getElementById(controlId);
        return control ? parseFloat(control.value) : defaultValue;
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.1,
            1000
        );
        this.camera.position.z = 4 + this.cameraDistance;
        this.camera.position.y = this.cameraY;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
    }
    
    loadImages() {
        // URLs de Unsplash con diferentes categorías para variedad
        const imageUrls = [
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=533&fit=crop&crop=center',  // Paisaje montaña
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=533&fit=crop&crop=center',  // Paisaje montaña lago
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=533&fit=crop&crop=center',  // Bosque
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=533&fit=crop&crop=center',  // Océano
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=533&fit=crop&crop=center',  // Lago con montañas
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=533&fit=crop&crop=center',  // Nebula/cielo
            'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=533&fit=crop&crop=center',  // Desierto
            'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=533&fit=crop&crop=center'   // Campo flores
        ];
        
        const loader = new THREE.TextureLoader();
        let loadedCount = 0;
        
        imageUrls.forEach((url, index) => {
            loader.load(
                url,
                (texture) => {
                    this.createImagePlane(texture, index);
                    loadedCount++;
                    if (loadedCount === imageUrls.length) {
                        console.log('Todas las imágenes de Unsplash cargadas');
                    }
                },
                (progress) => {
                    // Progreso de carga (opcional)
                },
                (error) => {
                    console.warn(`Error cargando imagen ${index + 1}, usando fallback`);
                    // Crear imagen de fallback con color
                    this.createFallbackImage(index);
                }
            );
        });
    }
    
    createFallbackImage(index) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#7ea380', '#fea557', '#bb57fe'];
        
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 533;
        const ctx = canvas.getContext('2d');
        
        // Fondo de color
        ctx.fillStyle = colors[index] || '#666';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texto
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Imagen ${index + 1}`, canvas.width / 2, canvas.height / 2);
        
        // Crear textura desde canvas
        const texture = new THREE.CanvasTexture(canvas);
        this.createImagePlane(texture, index);
    }
    
    createImagePlane(texture, index) {
        // Geometría responsive
        const geometry = new THREE.PlaneGeometry(this.imageWidth, this.imageHeight, 1, 1);
        
        // Material con vertex shader personalizado para deformación
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uTime: { value: 0 },
                uPosition: { value: 0 },
                uSpeed: { value: 0 },
                uDeformation: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vec4 texColor = texture2D(uTexture, vUv);
                    gl_FragColor = texColor;
                }
            `
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { 
            originalIndex: index,
            material: material
        };
        
        this.images.push(mesh);
        this.scene.add(mesh);
    }
    
    updateImagePositions() {
        this.images.forEach((image, index) => {
            const angle = (index * this.imageSpacing) + this.currentOffset;
            const x = Math.cos(angle) * this.radius;
            const z = Math.sin(angle) * this.radius;
            
            image.position.x = x;
            image.position.z = z;
            image.position.y = 0;
            
            // Rotación para que estén alineadas como pared circular (perpendicular al radio)
            image.rotation.y = angle + Math.PI / 2;
            
            // Actualizar uniforms del shader
            const material = image.userData.material;
            if (material && material.uniforms) {
                // Posición relativa basada en el ángulo normalizado
                const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                let normalizedX = 0;
                
                // Convertir ángulo a posición X relativa (-1 a 1)
                if (normalizedAngle <= Math.PI) {
                    normalizedX = Math.sin(normalizedAngle);
                } else {
                    normalizedX = -Math.sin(normalizedAngle);
                }
                
                material.uniforms.uPosition.value = normalizedX;
                material.uniforms.uSpeed.value = this.velocity;
                material.uniforms.uTime.value = performance.now() * 0.001;
                
                // Escala basada en la posición (más grande en el centro)
                const scale = 1 + (1 - Math.abs(normalizedX)) * 0.2;
                image.scale.setScalar(scale);
            }
        });
    }
    
    setupEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
            this.mouse.y = -(event.clientY / this.sizes.height) * 2 + 1;
        });
        
        // Window resize usando la técnica recomendada
        window.addEventListener('resize', () => {
            // Update sizes
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;
            
            // Recalcular tamaños responsive
            this.calculateResponsiveSizes();
            
            // Update camera
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.position.z = this.cameraDistance;
            this.camera.position.y = this.cameraY;
            this.camera.updateProjectionMatrix();

            // Update renderer
            this.renderer.setSize(this.sizes.width, this.sizes.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            
            // Actualizar geometrías de las imágenes existentes
            this.images.forEach(image => {
                if (image.geometry) {
                    image.geometry.dispose();
                    image.geometry = new THREE.PlaneGeometry(this.imageWidth, this.imageHeight, 1, 1);
                }
            });
            
            // Forzar actualización de posiciones con el nuevo radio
            this.updateImagePositions();
        });
    }
    
    updateMovement() {
        // Calcular la fuerza basada en la posición del cursor
        const force = this.mouse.x * 0.03;
        this.targetOffset += force;
        
        // Interpolación suave hacia la posición objetivo
        const ease = 0.03;
        const diff = this.targetOffset - this.currentOffset;
        this.currentOffset += diff * ease;
        
        // Calcular velocidad para efectos de deformación (amplificada)
        this.velocity = diff * ease * 10;
        
        // Mantener el offset en un rango manejable (movimiento infinito)
        if (Math.abs(this.currentOffset) > Math.PI * 4) {
            this.currentOffset = this.currentOffset % (Math.PI * 2);
            this.targetOffset = this.targetOffset % (Math.PI * 2);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateMovement();
        this.updateImagePositions();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Verificar que THREE.js esté cargado e inicializar
if (typeof THREE !== 'undefined') {
    new CircularSlider();
} else {
    console.error('THREE.js no está cargado');
}
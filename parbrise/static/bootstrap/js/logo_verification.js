document.addEventListener('DOMContentLoaded', function() {
  // Elements DOM
  const fileInput = document.getElementById('logo_uploaded');
  const video = document.getElementById('video');
  const canvas = document.getElementById('snapshot');
  const cameraContainer = document.getElementById('camera-container');
  const startBtn = document.getElementById('start-camera');
  const captureBtn = document.getElementById('take-photo');
  
  let stream = null;

  // 1. Gestion de l'upload de fichier
  fileInput.addEventListener('change', function(e) {
    if (!e.target.files.length) return;
    
    const file = e.target.files[0];
    const previewZone = document.querySelector('.file-upload-text');
    
    // Nettoyage préalable
    previewZone.querySelector('h5').textContent = file.name;
    const oldPreview = previewZone.querySelector('img');
    if (oldPreview) oldPreview.remove();
    
    // Création de l'aperçu
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.className = 'img-thumbnail mt-2';
     
      previewZone.appendChild(img);
    }
  });

  // 2. Activation de la caméra
  startBtn.addEventListener('click', async function() {
    try {
      // Paramètres optimisés pour mobile
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      };
      
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      
      // UI Updates
      cameraContainer.classList.remove('d-none');
      startBtn.classList.add('d-none');
      captureBtn.disabled = false;
      
      // Rotation automatique pour mobile
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.error("Erreur lecture vidéo:", e));
      });
      
    } catch (err) {
      console.error("Erreur caméra:", err);
      alert(`Erreur caméra: ${err.message}`);
    }
  });

  // 3. Capture de photo
  captureBtn.addEventListener('click', function() {
    if (!stream) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Correction de l'orientation
    ctx.save();
    if (video.videoWidth > video.videoHeight) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Conversion en fichier
    canvas.toBlob(blob => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Simulation de l'input file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      // Déclenche l'événement change manuellement
      const event = new Event('change');
      fileInput.dispatchEvent(event);
      
      // Nettoyage
      stopCamera();
    }, 'image/jpeg', 0.9);
  });

  // 4. Fonction d'arrêt
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    video.srcObject = null;
    cameraContainer.classList.add('d-none');
    startBtn.classList.remove('d-none');
    captureBtn.disabled = true;
  }

  // Nettoyage si la page est quittée
  window.addEventListener('beforeunload', stopCamera);
});

document.addEventListener('DOMContentLoaded', function() {
    // Handle camera button visibility based on device capabilities
    function checkCameraSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            document.getElementById('start-camera').style.display = 'none';
        }
    }

    // Adjust elements based on screen size
    function adjustLayout() {
        const header = document.querySelector('.sg-header');
        const container = document.querySelector('.sg-container');
        
        if (window.innerWidth < 992) {
            // Mobile adjustments
            if (header) header.style.marginLeft = '0';
            if (container) container.style.marginLeft = '0';
            
            // Make file upload area more compact
            const uploadLabel = document.querySelector('.file-upload-label');
            if (uploadLabel) {
                uploadLabel.style.padding = '1rem';
                uploadLabel.querySelector('h5').style.fontSize = '1rem';
            }
        } else {
            // Desktop adjustments
            if (header) header.style.marginLeft = '380px';
            if (container) container.style.marginLeft = '380px';
        }
    }

    // Initialize
    checkCameraSupport();
    adjustLayout();

    // Handle resize
    window.addEventListener('resize', function() {
        adjustLayout();
        
        // Close sidebar when switching to desktop
        if (window.innerWidth >= 992) {
            document.body.classList.remove('sidebar-open');
        }
    });
});
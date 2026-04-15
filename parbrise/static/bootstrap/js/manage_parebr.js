document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const modal = document.getElementById('parebriseModal');
    const confirmModal = document.getElementById('confirmModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModal = document.querySelector('.close');
    const cancelBtn = document.querySelector('.btn-cancel');
    const form = document.getElementById('parebriseForm');
    const modalTitle = document.getElementById('modalTitle');
    const parebriseId = document.getElementById('parebriseId');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    
    // Variables
    let currentDeleteId = null;
    
    // Ouvrir modal pour ajout
    openModalBtn.addEventListener('click', function() {
        modalTitle.textContent = 'Ajouter un Pare-Brise';
        form.reset();
        parebriseId.value = '';
        modal.style.display = 'block';
    });
    
    // Ouvrir modal pour modification
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const id = this.getAttribute('data-id');
            const codeSap = row.cells[0].textContent;
            const version = row.cells[1].textContent;
            
            modalTitle.textContent = 'Modifier le Pare-Brise';
            parebriseId.value = id;
            document.getElementById('code_sap').value = codeSap;
            document.getElementById('version').value = version;
            
            modal.style.display = 'block';
        });
    });
    
    // Gestion suppression
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            currentDeleteId = this.getAttribute('data-id');
            confirmModal.style.display = 'block';
        });
    });
    
    // Confirmer suppression
    confirmDeleteBtn.addEventListener('click', function() {
        if (currentDeleteId) {
            // Créer un formulaire de suppression caché
            const form = document.createElement('form');
            form.method = 'post';
            form.action = '';
            
            const csrf = document.createElement('input');
            csrf.type = 'hidden';
            csrf.name = 'csrfmiddlewaretoken';
            csrf.value = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
            
            const deleteInput = document.createElement('input');
            deleteInput.type = 'hidden';
            deleteInput.name = 'delete_id';
            deleteInput.value = currentDeleteId;
            
            form.appendChild(csrf);
            form.appendChild(deleteInput);
            document.body.appendChild(form);
            form.submit();
        }
    });
    
    // Fermer modals
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    cancelDeleteBtn.addEventListener('click', function() {
        confirmModal.style.display = 'none';
        currentDeleteId = null;
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
            currentDeleteId = null;
        }
    });
    
    // Empêcher la soumission du formulaire si invalide (pour démo)
    form.addEventListener('submit', function(e) {
        const codeSap = document.getElementById('code_sap').value;
        const version = document.getElementById('version').value;
        
        if (!codeSap || !version) {
            e.preventDefault();
            alert('Veuillez remplir tous les champs obligatoires');
        }
    });
});
// Pour ouvrir la modal
function openModal() {
    document.body.classList.add('modal-open');
    document.getElementById('yourModalId').classList.add('show');
    
    // Empêche le scroll du fond
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}

// Pour fermer la modal
function closeModal() {
    document.body.classList.remove('modal-open');
    document.getElementById('yourModalId').classList.remove('show');
    
    // Restaure le scroll
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

// Exemple d'utilisation
document.querySelector('.open-modal').addEventListener('click', openModal);
document.querySelector('.close-modal').addEventListener('click', closeModal);
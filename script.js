document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.getElementById('card-container');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    let gameModesData = [];
    let isScrolling = false;
    // Variáveis para o carrossel de arrastar (touch)
    let isDragging = false;
    let startX;
    let scrollLeftStart;
    let scrollSpeed = 0;

    // --- Carregamento dos Dados e Criação dos Cards ---
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            gameModesData = data;
            createCards(data, true); // Na carga inicial, duplicar para o carrossel
            initializeCarousel();
        });

    function createCards(data, duplicateForCarousel = false) {
        cardContainer.innerHTML = ''; // Limpa o container

        // Duplica os dados para o efeito de carrossel infinito
        const allItems = duplicateForCarousel ? [...data, ...data] : data; 

        allItems.forEach((mode) => {
            const card = document.createElement('div');
            card.className = 'card';
            // Armazena o nome do modo como um identificador no próprio elemento
            card.dataset.modeName = mode.nome;

            card.innerHTML = `
                <img src="${mode.imagens[0]}" alt="Imagem do modo ${mode.nome}">
                <h2>${mode.nome}</h2>
            `;

            // O listener agora busca os dados usando o identificador do card
            card.addEventListener('click', (event) => {
                const modeName = event.currentTarget.dataset.modeName;
                const modeData = gameModesData.find(m => m.nome === modeName);
                if (modeData) {
                    openModal(modeData);
                }
            });
            cardContainer.appendChild(card);
        });
    }

    // --- Lógica do Carrossel ---
    function initializeCarousel() {
        // --- Efeito de hover para Desktop ---
        cardContainer.addEventListener('mousemove', (e) => {
            const containerRect = cardContainer.getBoundingClientRect();
            const mouseX = e.clientX - containerRect.left;
            const hotZone = containerRect.width * 0.2; // 20% da largura em cada lado

            if (mouseX < hotZone) {
                isScrolling = true;
                // Define uma velocidade de rolagem constante para a esquerda
                scrollSpeed = -0.5; 
                smoothScroll();
            } else if (mouseX > containerRect.width - hotZone) {
                isScrolling = true;
                scrollSpeed = 0.5; // Define uma velocidade de rolagem constante para a direita
                smoothScroll();
            } else {
                isScrolling = false;
                scrollSpeed = 0;
            }
        });

        cardContainer.addEventListener('mouseleave', () => {
            isScrolling = false;
            scrollSpeed = 0;
        });

        // --- Efeito de arrastar para Mobile (Touch) ---
        cardContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            isScrolling = false; // Para o scroll automático se estiver ativo
            // Posição inicial do toque
            startX = e.touches[0].pageX - cardContainer.offsetLeft;
            // Posição inicial do scroll
            scrollLeftStart = cardContainer.scrollLeft;
            cardContainer.style.cursor = 'grabbing'; // Muda o cursor para "agarrando"
        });

        cardContainer.addEventListener('touchend', () => {
            isDragging = false;
            cardContainer.style.cursor = 'grab'; // Volta o cursor para o padrão
        });

        cardContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Previne a rolagem vertical da página enquanto arrasta

            const x = e.touches[0].pageX - cardContainer.offsetLeft;
            const walk = (x - startX) * 1.5; // O multiplicador aumenta a "velocidade" do arraste
            cardContainer.scrollLeft = scrollLeftStart - walk;

            // Lógica para o loop infinito durante o arraste
            const scrollWidth = cardContainer.scrollWidth;
            const singleSetWidth = scrollWidth / 2;
            if (cardContainer.scrollLeft >= singleSetWidth) {
                cardContainer.scrollLeft -= singleSetWidth;
            } else if (cardContainer.scrollLeft <= 0) {
                cardContainer.scrollLeft += singleSetWidth;
            }
        });
    }

    function smoothScroll() {
        if (!isScrolling) return;

        const scrollWidth = cardContainer.scrollWidth;
        const singleSetWidth = scrollWidth / 2;

        cardContainer.scrollLeft += scrollSpeed;

        // Lógica do loop infinito corrigida
        if (scrollSpeed > 0 && cardContainer.scrollLeft >= singleSetWidth) {
            cardContainer.scrollLeft -= singleSetWidth;
        } else if (scrollSpeed < 0 && cardContainer.scrollLeft <= 0) {
            // Adiciona singleSetWidth para evitar um salto para 0 antes de reposicionar
            cardContainer.scrollLeft += singleSetWidth;
        }

        requestAnimationFrame(smoothScroll);
    }

    function updateCenteredCard() {
        const containerCenter = cardContainer.getBoundingClientRect().left + cardContainer.offsetWidth / 2;
        let minDistance = Infinity;
        let closestCard = null;
        // Esta função foi deixada caso você queira reativar o efeito de centralização,
        // mas a lógica principal foi removida para melhorar a performance.
    }

    // --- Funcionalidade do Modal ---
    function openModal(modeData) {
        // Popula os detalhes do modal
        modalOverlay.querySelector('.modal-details h2').textContent = modeData.nome;
        modalOverlay.querySelector('.modal-details p').textContent = modeData.descrição;
        modalOverlay.querySelector('.modal-details a').href = modeData.link;

        // Configura a galeria
        setupGallery(modeData.imagens); // Usa o array de imagens

        // Exibe o modal e desfoca o fundo
        modalOverlay.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Listeners para fechar o modal
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.classList.contains('modal-open')) {
            closeModal();
        }
    });

    // --- Lógica da Galeria ---
    function setupGallery(images) {
        const mainImageContainer = modalOverlay.querySelector('.main-image');
        const thumbnailsContainer = modalOverlay.querySelector('.thumbnails');
        const prevBtn = modalOverlay.querySelector('.prev-btn');
        const nextBtn = modalOverlay.querySelector('.next-btn');
        let currentIndex = 0;

        // Limpa galeria anterior
        thumbnailsContainer.innerHTML = '';
        mainImageContainer.innerHTML = ''; // Limpa a imagem principal anterior

        // Cria o elemento da imagem principal
        const mainImage = document.createElement('img');
        mainImage.alt = "Imagem principal";
        mainImageContainer.appendChild(mainImage);
        mainImageContainer.appendChild(prevBtn); // Garante que os botões fiquem sobre a imagem
        mainImageContainer.appendChild(nextBtn);

        // Cria as miniaturas
        images.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.addEventListener('click', () => {
                currentIndex = index;
                updateGallery();
            });
            thumbnailsContainer.appendChild(thumb);
        });

        function updateGallery() {
            // Atualiza a imagem principal
            mainImage.src = images[currentIndex];

            // Atualiza a classe 'active' nas miniaturas
            thumbnailsContainer.querySelectorAll('img').forEach((thumb, index) => {
                thumb.classList.toggle('active', index === currentIndex);
                // Faz a miniatura ativa rolar para a visão
                if (index === currentIndex) {
                    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            });

            // Mostra/esconde as setas
            const showButtons = images.length > 1;
            prevBtn.style.display = showButtons ? 'block' : 'none';
            nextBtn.style.display = showButtons ? 'block' : 'none';
        }

        // Listeners das setas (configurados uma vez por abertura de modal)
        const prevClickHandler = () => {
            currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
            updateGallery();
        };
        const nextClickHandler = () => {
            currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
            updateGallery();
        };

        prevBtn.onclick = prevClickHandler;
        nextBtn.onclick = nextClickHandler;

        // Inicia a galeria
        updateGallery();
    }

    // --- Funcionalidade de Busca ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        const filteredData = gameModesData.filter(mode =>
            mode.nome.toLowerCase().includes(query)
        );
        
        if (query && filteredData.length > 0) {
            createCards(filteredData, false); // Mostra resultados filtrados sem duplicar
        } else {
            createCards(gameModesData, true); // Mostra tudo com efeito de carrossel
        }
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Adiciona um listener para o evento 'input'
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '') {
            createCards(gameModesData, true); // Restaura os cards se a busca for limpa
        }
    });
});
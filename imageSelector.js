// Селектор изображений из локальной папки
class ImageSelector {
    constructor(imageManager) {
        this.imageManager = imageManager || window.imageManager;
        this.categories = ['default', 'people', 'nature', 'animals', 'food'];
        this.currentCategory = 'default';
        this.selectedImage = null;
    }
    
    // Создание модального окна для выбора изображения
    createSelectorModal() {
        const modal = document.createElement('div');
        modal.className = 'image-selector-modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="image-selector-content">
                <div class="image-selector-header">
                    <h3>Выберите изображение</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="image-selector-categories"></div>
                <div class="image-selector-gallery"></div>
                <div class="image-selector-actions">
                    <button class="image-selector-cancel">Отмена</button>
                    <button class="image-selector-select" disabled>Выбрать</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики событий
        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.hideSelector();
        });
        
        modal.querySelector('.image-selector-cancel').addEventListener('click', () => {
            this.hideSelector();
        });
        
        modal.querySelector('.image-selector-select').addEventListener('click', () => {
            this.confirmSelection();
        });
        
        // Создаем категории
        const categoriesContainer = modal.querySelector('.image-selector-categories');
        this.categories.forEach(category => {
            const categoryBtn = document.createElement('button');
            categoryBtn.className = 'category-btn';
            categoryBtn.textContent = this.formatCategoryName(category);
            categoryBtn.dataset.category = category;
            
            categoryBtn.addEventListener('click', () => {
                this.loadCategory(category);
                // Выделяем активную категорию
                categoriesContainer.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                categoryBtn.classList.add('active');
            });
            
            categoriesContainer.appendChild(categoryBtn);
        });
        
        return modal;
    }
    
    // Форматирование имени категории
    formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    // Загрузка изображений категории
    async loadCategory(category) {
        this.currentCategory = category;
        const gallery = document.querySelector('.image-selector-gallery');
        gallery.innerHTML = '<div class="loading">Загрузка изображений...</div>';
        
        try {
            const images = await this.imageManager.getImagesByCategory(category);
            
            if (images.length === 0) {
                gallery.innerHTML = '<div class="no-images">Нет доступных изображений</div>';
                return;
            }
            
            gallery.innerHTML = '';
            
            for (const image of images) {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-item';
                imgContainer.dataset.id = image.id;
                
                const imgElement = document.createElement('img');
                imgElement.src = this.imageManager.getFullPath(image.path);
                imgElement.alt = image.id;
                
                // Проверяем доступность изображения
                const exists = await this.imageManager.checkImageExists(image.path);
                if (!exists) {
                    imgContainer.classList.add('image-missing');
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'error-overlay';
                    errorOverlay.textContent = 'Файл не найден';
                    imgContainer.appendChild(errorOverlay);
                }
                
                imgElement.addEventListener('click', () => {
                    // Выделяем выбранное изображение
                    gallery.querySelectorAll('.image-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    imgContainer.classList.add('selected');
                    this.selectedImage = image;
                    
                    // Включаем кнопку выбора
                    document.querySelector('.image-selector-select').disabled = false;
                });
                
                imgContainer.appendChild(imgElement);
                gallery.appendChild(imgContainer);
            }
        } catch (error) {
            console.error('Ошибка загрузки изображений:', error);
            gallery.innerHTML = '<div class="error">Ошибка загрузки изображений</div>';
        }
    }
    
    // Отображение селектора
    showSelector(callback) {
        this.callback = callback;
        
        // Получаем или создаем модальное окно
        let modal = document.querySelector('.image-selector-modal');
        if (!modal) {
            modal = this.createSelectorModal();
        }
        
        modal.style.display = 'flex';
        
        // Загружаем первую категорию по умолчанию
        const firstCategoryBtn = modal.querySelector('.category-btn');
        if (firstCategoryBtn) {
            firstCategoryBtn.click();
        }
        
        // Сбрасываем выбор
        this.selectedImage = null;
        document.querySelector('.image-selector-select').disabled = true;
    }
    
    // Скрытие селектора
    hideSelector() {
        const modal = document.querySelector('.image-selector-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.callback = null;
    }
    
    // Подтверждение выбора изображения
    confirmSelection() {
        if (this.selectedImage && this.callback) {
            // Просто возвращаем путь к изображению
            this.callback({
                id: this.selectedImage.id,
                path: this.selectedImage.path,
                fullPath: this.imageManager.getFullPath(this.selectedImage.path)
            });
        }
        this.hideSelector();
    }
}

// Создаем глобальный экземпляр селектора изображений
window.imageSelector = new ImageSelector(window.imageManager); 
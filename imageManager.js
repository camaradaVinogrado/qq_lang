// Упрощенный менеджер изображений без отдельной базы данных
window.ImageManager = {
    // Инициализация
    init: function() {
        console.log('Инициализация менеджера изображений');
        // Можно добавить дополнительные действия при инициализации
    },
    
    // Вставка изображения в ячейку
    insertImageToCell: function(cell, imageUrl) {
        if (!imageUrl) return false;
        
        // Удаляем существующие изображения
        const existingImage = cell.querySelector('img');
        if (existingImage) {
            existingImage.remove();
        }
        
        // Создаем новое изображение
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'thumbnail';
        
        // Вставляем перед контейнером кнопок
        const actionsDiv = cell.querySelector('.image-actions');
        cell.insertBefore(img, actionsDiv);
        
        // Обновляем доступные действия
        Items.updateImageActions(cell);
        
        // КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Теперь мы НЕ сохраняем данные в БД при начальной загрузке страницы
        // т.к. это может стереть заголовок, который ещё не вставлен в DOM
        const item = cell.closest('.item');
        if (item && !window.isInitialPageLoad) {
            // Получаем текущий title для отладки
            const titleElement = item.querySelector('.item-title');
            const currentTitle = titleElement ? titleElement.innerHTML : 'none';
            console.log('insertImageToCell сохраняет элемент с title:', currentTitle);
            
            // Сохраняем только если это не начальная загрузка страницы
            const itemData = Items.createItemData(item);
            DB.saveItem(itemData);
            return true;
        }
        
        return false;
    },
    
    // Удаление изображения из ячейки
    removeImageFromCell: function(cell) {
        const img = cell.querySelector('.thumbnail');
        if (img) {
            img.remove();
            Items.updateImageActions(cell);
            
            // Сохраняем данные
            const item = cell.closest('.item');
            if (item) {
                const itemData = Items.createItemData(item);
                DB.saveItem(itemData);
                return true;
            }
        }
        
        return false;
    }
}; 
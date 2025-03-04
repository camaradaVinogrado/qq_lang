// Управление элементами
window.Items = {
    itemCounter: {},
    
    // Инициализация счетчиков
    init: function() {
        // Инициализация счетчиков для каждой колонки
        for (let i = 1; i <= 7; i++) {
            Items.itemCounter[i] = 0;
        }
        
        // Загружаем счетчики из базы данных
        DB.loadCounters(function(counters) {
            if (counters) {
                Items.itemCounter = counters;
            }
        });
    },
    
    // Создание нового элемента с таблицей 2х3 + строка изображений (всего 3 строки)
    createNewItem: function(columnId, itemId, order = 0) {
        const item = document.createElement('div');
        item.className = 'item';
        
        // Форматируем ID элемента
        const properId = itemId.toString().startsWith('item') 
            ? `column${columnId}_${itemId}` 
            : `column${columnId}_item${itemId}`;
        
        item.dataset.itemId = properId;
        item.dataset.columnId = columnId;
        item.dataset.order = order;
        
        // Создаем блок шапки элемента
        const headerBlock = document.createElement('div');
        headerBlock.className = 'item-header';
        
        // Создаем рукоятку для перетаскивания
        const dragHandle = document.createElement('div');
        dragHandle.className = 'item-drag-handle';
        dragHandle.innerHTML = '<span class="drag-icon">⋮⋮</span>';
        
        // Создаем редактируемый заголовок
        const titleDiv = document.createElement('div');
        titleDiv.className = 'item-title';
        titleDiv.contentEditable = true;
        titleDiv.spellcheck = false;
        titleDiv.innerHTML = ''; // Без плейсхолдера, как запрошено
        
        // Создаем кнопку удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-item-btn';
        deleteBtn.title = 'Удалить элемент';
        deleteBtn.textContent = '🗑️';
        
        // Добавляем все элементы в шапку
        headerBlock.appendChild(dragHandle);
        headerBlock.appendChild(titleDiv);
        headerBlock.appendChild(deleteBtn);
        
        // Добавляем шапку к элементу
        item.appendChild(headerBlock);
        
        // Создаем таблицу для размещения содержимого
        const table = document.createElement('table');
        table.className = 'item-table';
        
        // Создаем две строки по три ячейки (матрица 2x3)
        for (let i = 0; i < 2; i++) {
            const row = document.createElement('tr');
            
            // Добавляем по 3 ячейки в каждую строку
            for (let j = 0; j < 3; j++) {
                // Создаем текстовую ячейку
                const textCell = document.createElement('td');
                textCell.className = 'text-cell';
                
                const textDiv = document.createElement('div');
                textDiv.contentEditable = true;
                textDiv.spellcheck = false;
                textCell.appendChild(textDiv);
                
                row.appendChild(textCell);
            }
            
            table.appendChild(row);
        }
        
        // Добавляем нижнюю строку для изображений (3 ячейки с изображениями)
        const imageRow = document.createElement('tr');
        
        // Добавляем 3 ячейки для изображений
        for (let i = 0; i < 3; i++) {
            const imageCell = document.createElement('td');
            imageCell.className = 'image-cell';
            
            // Создаем контейнер для кнопок действий с изображением
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'image-actions';
            actionsDiv.innerHTML = `<button class="image-btn add-url-btn">add</button>`;
            
            imageCell.appendChild(actionsDiv);
            imageRow.appendChild(imageCell);
        }
        
        table.appendChild(imageRow);
        item.appendChild(table);
        
        // Кнопка для добавления элемента после текущего
        const addAfterBtn = document.createElement('div');
        addAfterBtn.className = 'add-after-btn';
        addAfterBtn.innerHTML = '+';
        item.appendChild(addAfterBtn);
        
        return item;
    },
    
    // Создание данных элемента для сохранения с новой структурой (6 текстовых ячеек + 3 изображения)
    createItemData: function(item) {
        const itemId = item.dataset.itemId;
        const columnId = item.dataset.columnId;
        
        // Получаем заголовок и проверяем его наличие
        const titleElement = item.querySelector('.item-title');
        const title = titleElement ? titleElement.innerHTML : '';
        
        // Добавляем дополнительную проверку для отладки
        if (titleElement && titleElement.innerHTML && titleElement.innerHTML.trim() !== '') {
            console.log('createItemData нашел title:', titleElement.innerHTML);
        } else if (titleElement) {
            console.warn('title элемент найден, но содержимое пустое');
        } else {
            console.warn('title элемент не найден!');
        }
        
        // Собираем текстовые поля (все 6)
        const textCells = Array.from(item.querySelectorAll('.text-cell div[contenteditable]'))
            .map(cell => cell.innerHTML);
        
        // Собираем изображения (3 изображения в нижней строке)
        const imageCells = Array.from(item.querySelectorAll('.image-cell'))
            .map(cell => {
                const img = cell.querySelector('.thumbnail');
                return img ? img.src : '';
            });
        
        // Сохраняем порядок элемента
        const order = parseInt(item.dataset.order) || 0;
        
        const result = {
            id: itemId,
            columnId: columnId,
            title: title,
            textCells: textCells,
            imageCells: imageCells,
            order: order,
            timestamp: Date.now()
        };
        
        // Финальная проверка
        if (title && title.trim() !== '' && (!result.title || result.title.trim() === '')) {
            console.error('КРИТИЧЕСКАЯ ОШИБКА: title потерян при формировании объекта данных!');
            result.title = title; // Принудительно восстанавливаем
        }
        
        return result;
    },
    
    // Обработка действий с изображениями
    updateImageActions: function(cell) {
        const actionsDiv = cell.querySelector('.image-actions');
        const img = cell.querySelector('.thumbnail');
        
        if (!img) {
            // Если нет изображения, показываем кнопку вставки URL
            actionsDiv.innerHTML = `
                <button class="image-btn add-url-btn">add</button>
            `;
        } else {
            // Если изображение есть, показываем кнопки управления
            actionsDiv.innerHTML = `
                <button class="image-btn delete-btn">del</button>
                <button class="image-btn edit-url-btn">ch</button>
            `;
        }
    },
    
    // Улучшенная функция добавления изображения по URL с сохранением title
    addImageByUrl: function(cell) {
        const url = prompt('Введите прямой URL изображения:');
        if (!url) return;
        
        const tempImg = new Image();
        
        tempImg.onload = function() {
            // Изображение успешно загружено
            const img = document.createElement('img');
            img.src = url;
            img.className = 'thumbnail';
            
            // Удаляем существующие изображения
            const existingImage = cell.querySelector('img');
            if (existingImage) {
                existingImage.remove();
            }
            
            // Обновляем интерфейс
            const actionsDiv = cell.querySelector('.image-actions');
            cell.insertBefore(img, actionsDiv);
            Items.updateImageActions(cell);
            
            // Сохраняем данные
            const item = cell.closest('.item');
            if (item) {
                // Получаем заголовок ПЕРЕД созданием данных (для отладки)
                const titleElement = item.querySelector('.item-title');
                const titleText = titleElement ? titleElement.innerHTML : '';
                console.log('Заголовок перед сохранением URL:', titleText);
                
                // Создаем и сохраняем данные
                const itemData = Items.createItemData(item);
                
                // Проверяем, что заголовок попал в данные
                console.log('Данные для сохранения. Title:', itemData.title, 'ID:', itemData.id);
                
                // Явно проверяем, что title не пустой
                if (titleText && (!itemData.title || itemData.title.trim() === '')) {
                    console.warn('Title потерян при создании itemData! Восстанавливаем...');
                    itemData.title = titleText;
                }
                
                // Сохраняем в БД с принудительной установкой timestamp
                itemData.timestamp = Date.now();
                DB.saveItem(itemData);
            }
        };
        
        tempImg.onerror = function() {
            alert('Не удалось загрузить изображение по указанному URL. Пожалуйста, убедитесь, что URL правильный и ведет напрямую к изображению.');
        };
        
        tempImg.src = url;
    },
    
    // Обновленный метод для сохранения текстового содержимого (включая заголовки)
    saveTextContent: function(textElement) {
        const item = textElement.closest('.item');
        if (!item) return false;
        
        // Получаем ID и проверяем, что он корректный
        const itemId = item.dataset.itemId;
        if (!itemId || !itemId.includes('_')) {
            console.error('Некорректный ID элемента:', itemId);
            return false;
        }
        
        // Создаем данные элемента
        const itemData = Items.createItemData(item);
        
        // Добавляем уникальный timestamp для предотвращения конфликтов
        itemData.timestamp = Date.now();
        
        // Подробный лог для отладки
        if (textElement.classList.contains('item-title')) {
            console.log('Сохраняем title из saveTextContent:', itemData.title);
        }
        
        // Сохраняем в базу
        DB.saveItem(itemData);
        console.log('Сохранен контент для элемента:', itemId);
        
        return true;
    }
};

// Устанавливаем глобальные методы для совместимости
window._createItemData = function(item) {
    return Items.createItemData(item);
};

window.createNewItem = function(columnId, itemId, order = 0) {
    return Items.createNewItem(columnId, itemId, order);
};

// Добавляем глобальное делегирование событий для contenteditable
document.addEventListener('DOMContentLoaded', function() {
    // При вводе в редактируемый элемент
    document.addEventListener('input', function(e) {
        if (e.target.parentElement && e.target.parentElement.classList.contains('text-cell')) {
            // Сохраняем с задержкой для оптимизации производительности
            clearTimeout(window.textSaveTimeout);
            window.textSaveTimeout = setTimeout(() => {
                Items.saveTextContent(e.target);
            }, 500);
        }
    });
    
    // При потере фокуса сразу сохраняем
    document.addEventListener('blur', function(e) {
        if (e.target.parentElement && e.target.parentElement.classList.contains('text-cell')) {
            Items.saveTextContent(e.target);
        }
    }, true);
});
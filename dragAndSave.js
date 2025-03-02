// Новый файл для обработки drag-n-drop и сохранения
function setupDragAndDrop(item, db) {
    // Убедимся, что перетаскивание работает только от ручки элемента
    const dragHandle = item.querySelector('.item-drag-handle');
    
    dragHandle.addEventListener('mousedown', function(e) {
        // Устанавливаем атрибут draggable только при начале перетаскивания от ручки
        item.draggable = true;
    });
    
    item.addEventListener('dragstart', function(e) {
        // Запоминаем колонку и текущий порядок
        const columnId = item.dataset.columnId;
        item.dataset.originalColumnId = columnId;
        
        // Добавляем класс для визуального эффекта
        setTimeout(() => item.classList.add('dragging'), 0);
        
        // Сохраняем данные для переноса
        e.dataTransfer.setData('text/plain', item.dataset.itemId);
    });
    
    item.addEventListener('dragend', function(e) {
        // Убираем класс визуального эффекта
        item.classList.remove('dragging');
        
        // После завершения перетаскивания убираем атрибут draggable
        item.draggable = false;
        
        // Получаем текущую колонку
        const columnId = item.dataset.columnId;
        
        // Важно: принудительно сохраняем весь порядок в колонке
        saveColumnOrder(columnId, db);
        
        // Выводим сообщение для отладки
        console.log('Перетаскивание завершено, порядок сохранен для колонки', columnId);
    });
}

function initDropZones() {
    const columns = document.querySelectorAll('.column');
    
    columns.forEach(column => {
        const itemsContainer = column.querySelector('.items-container');
        const columnId = column.id.replace('column', '');
        
        // Разрешаем перетаскивание над элементами контейнера
        itemsContainer.addEventListener('dragover', function(e) {
            e.preventDefault(); // Необходимо для разрешения drop
            
            const draggable = document.querySelector('.dragging');
            if (!draggable) return;
            
            // Проверяем, что элемент находится в той же колонке (ограничиваем перетаскивание внутри колонки)
            if (draggable.dataset.columnId === columnId) {
                const afterElement = getDragAfterElement(itemsContainer, e.clientY);
                
                if (afterElement == null) {
                    itemsContainer.appendChild(draggable);
                } else {
                    itemsContainer.insertBefore(draggable, afterElement);
                }
            }
        });
        
        // Завершение перетаскивания
        itemsContainer.addEventListener('drop', function(e) {
            e.preventDefault(); // Предотвращаем стандартное поведение браузера
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveColumnOrder(columnId, db) {
    const column = document.getElementById('column' + columnId);
    if (!column) {
        console.error('Колонка не найдена:', columnId);
        return;
    }
    
    // Используем глобальную DB если db не передана
    const database = db || window.appDB;
    if (!database) {
        console.error('База данных не доступна для сохранения порядка');
        return;
    }
    
    const items = column.querySelectorAll('.item');
    
    console.log(`Сохраняем порядок ${items.length} элементов в колонке ${columnId}`);
    
    // Сохраняем новый порядок
    Array.from(items).forEach((item, index) => {
        // Обновляем атрибут порядка
        item.dataset.order = index;
        
        // Создаем и сохраняем обновленные данные
        const itemData = window._createItemData(item);
        window._saveItem(itemData, database);
        
        console.log(`Элемент ${item.dataset.itemId} сохранен с порядком ${index}`);
    });
    
    console.log(`Порядок элементов в колонке ${columnId} сохранен`);
}

// Функции для drag-and-drop и сохранения порядка элементов
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация drag-and-drop
    initDragAndDrop();
    
    // Инициализация обработчика изображений для модального окна
    initImageModal();
});

// Инициализация drag-and-drop функциональности
function initDragAndDrop() {
    let draggedItem = null;
    let startPosition = null;
    let startColumnId = null;
    
    // Делегируем события на контейнер колонок
    const columnsContainer = document.getElementById('columnsContainer');
    
    // Обработчик начала перетаскивания
    columnsContainer.addEventListener('mousedown', function(e) {
        // Проверяем, что нажатие было на рукоятке перетаскивания
        if (e.target.closest('.item-drag-handle')) {
            e.preventDefault(); // Предотвращаем выделение текста
            
            // Находим элемент, который нужно перетаскивать
            draggedItem = e.target.closest('.item');
            
            if (draggedItem) {
                // Запоминаем начальные позиции
                startColumnId = draggedItem.dataset.columnId;
                startPosition = parseInt(draggedItem.dataset.order) || 0;
                
                // Добавляем класс для визуального отображения перетаскивания
                draggedItem.classList.add('dragging');
                
                // Создаем слушателей для перемещения и отпускания
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        }
    });
    
    // Функция перемещения мыши при перетаскивании
    function onMouseMove(e) {
        if (!draggedItem) return;
        
        // Перемещаем элемент за курсором
        draggedItem.style.position = 'absolute';
        draggedItem.style.zIndex = 1000;
        draggedItem.style.left = e.clientX + 10 + 'px';
        draggedItem.style.top = e.clientY + 10 + 'px';
        
        // Находим элемент под курсором
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        
        // Находим ближайший элемент-контейнер
        const itemBelow = elemBelow ? elemBelow.closest('.item') : null;
        const itemsContainer = elemBelow ? elemBelow.closest('.items-container') : null;
        
        if (itemBelow && itemBelow !== draggedItem) {
            // Определяем, куда вставлять (до или после)
            const rect = itemBelow.getBoundingClientRect();
            const middle = (rect.top + rect.bottom) / 2;
            
            if (e.clientY < middle) {
                // Вставляем до элемента
                itemBelow.parentNode.insertBefore(draggedItem, itemBelow);
            } else {
                // Вставляем после элемента
                itemBelow.parentNode.insertBefore(draggedItem, itemBelow.nextSibling);
            }
        } 
        else if (itemsContainer && itemsContainer.children.length === 0) {
            // Если контейнер пуст, просто добавляем в него
            itemsContainer.appendChild(draggedItem);
        }
    }
    
    // Функция отпускания элемента
    function onMouseUp() {
        if (!draggedItem) return;
        
        // Удаляем слушателей событий
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        // Удаляем стили перетаскивания
        draggedItem.style.position = '';
        draggedItem.style.zIndex = '';
        draggedItem.style.left = '';
        draggedItem.style.top = '';
        draggedItem.classList.remove('dragging');
        
        // Обновляем ID колонки, если элемент был перемещен в другую колонку
        const newColumnId = draggedItem.closest('.column').id.replace('column', '');
        draggedItem.dataset.columnId = newColumnId;
        
        // Обновляем порядки в колонках
        updateItemsOrder(newColumnId);
        if (newColumnId !== startColumnId) {
            updateItemsOrder(startColumnId);
        }
        
        // Обновляем ID элемента с учетом новой колонки
        const itemId = draggedItem.dataset.itemId.split('_')[1];
        draggedItem.dataset.itemId = `column${newColumnId}_${itemId}`;
        
        // Сохраняем данные в БД
        const itemData = window._createItemData(draggedItem);
        window._saveItem(itemData);
        
        // Сбрасываем переменные
        draggedItem = null;
        startPosition = null;
        startColumnId = null;
    }
    
    // Функция обновления порядка элементов в колонке
    function updateItemsOrder(columnId) {
        const column = document.getElementById('column' + columnId);
        const items = column.querySelectorAll('.item');
        
        // Обновляем порядок для всех элементов
        Array.from(items).forEach((item, index) => {
            item.dataset.order = index;
            
            // Сохраняем обновленные данные
            const itemData = window._createItemData(item);
            window._saveItem(itemData);
        });
    }
}

// Упрощенная инициализация модального окна для изображений
function initImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    
    // Удаляем iframe, если он был создан ранее
    const existingIframe = document.getElementById('modalIframe');
    if (existingIframe) {
        existingIframe.remove();
    }
    
    // Делегируем обработку кликов по изображениям
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('thumbnail')) {
            modal.style.display = 'block';
            modalImg.style.display = 'block';
            
            // Показываем индикатор загрузки
            modal.classList.add('loading');
            
            // Устанавливаем изображение
            modalImg.src = e.target.src;
            
            // Убираем индикатор загрузки после загрузки изображения
            modalImg.onload = function() {
                modal.classList.remove('loading');
            };
            
            modalImg.onerror = function() {
                modal.classList.remove('loading');
                alert('Не удалось загрузить полноразмерное изображение.');
            };
        }
    });
    
    // Закрытие модального окна
    modal.addEventListener('click', function() {
        modal.style.display = 'none';
        modalImg.src = ''; // Очищаем src чтобы остановить загрузку
    });
} 
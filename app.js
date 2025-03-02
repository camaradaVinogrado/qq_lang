// Основной файл приложения
window.App = {
    // Инициализация приложения
    init: function() {
        console.log('Инициализация приложения');
        
        // Получаем параметр из URL, если он есть
        const urlParams = new URLSearchParams(window.location.search);
        const forceSelection = urlParams.get('selectDb') === 'true';
        
        // Проверяем, выбрана ли уже база данных
        const savedDb = DB.checkSavedDatabase();
        
        if (savedDb && !forceSelection) {
            // Если база уже выбрана и нет принудительного выбора
            console.log(`Используем сохраненную базу данных: ${savedDb}`);
            
            // Сначала скрываем модальное окно
            const dbSelectionModal = document.getElementById('dbSelectionModal');
            if (dbSelectionModal) {
                dbSelectionModal.style.display = 'none';
            }
            
            // Затем инициализируем базу данных
            DB.setDatabase(savedDb).then(() => {
                this.initializeWithDatabase();
            });
        } else {
            // Показываем диалог выбора базы данных
            this.showDatabaseSelection();
        }
    },
    
    // Добавляем флаг для отслеживания инициализации обработчиков событий
    eventHandlersInitialized: false,
    
    // Инициализация обработчиков событий
    initEventHandlers: function() {
        // Проверяем, были ли уже инициализированы обработчики
        if (this.eventHandlersInitialized) {
            console.log('Обработчики событий уже инициализированы, пропускаем...');
            return;
        }
        
        console.log('Инициализация обработчиков событий...');
        
        // Обработчик для кнопок добавления элементов
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const columnId = this.dataset.column;
                App.addNewItem(columnId);
            });
        });
        
        // Обработчик для действий с изображениями (делегирование событий)
        document.addEventListener('click', function(e) {
            // Обработка кнопки добавления URL изображения
            if (e.target.classList.contains('add-url-btn')) {
                const cell = e.target.closest('.image-cell');
                Items.addImageByUrl(cell);
            }
            
            // Обработка кнопки удаления изображения
            if (e.target.classList.contains('delete-btn')) {
                const cell = e.target.closest('.image-cell');
                ImageManager.removeImageFromCell(cell);
            }
            
            // Обработка кнопки изменения URL изображения
            if (e.target.classList.contains('edit-url-btn')) {
                const cell = e.target.closest('.image-cell');
                Items.addImageByUrl(cell);
            }
            
            // Обработка кнопки добавления элемента после текущего
            if (e.target.classList.contains('add-after-btn')) {
                const item = e.target.closest('.item');
                const columnId = item.dataset.columnId;
                const currentOrder = parseInt(item.dataset.order);
                App.addNewItemAfter(columnId, currentOrder);
            }
            
            // Добавляем обработчик для увеличения изображений при клике
            if (e.target.classList.contains('thumbnail')) {
                e.stopPropagation(); // Предотвращаем дальнейшее распространение
                
                const modal = document.getElementById('imageModal');
                const modalImg = document.getElementById('modalImage');
                
                // Используем существующее модальное окно
                modalImg.src = e.target.src;
                modal.style.display = 'block';
                
                // Фокусируемся на модальном окне для обработки Esc
                modal.focus();
            }
            
            // Добавляем обработчик для кнопки удаления элемента
            if (e.target.classList.contains('delete-item-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Находим элемент, который нужно удалить
                const item = e.target.closest('.item');
                if (!item) return;
                
                // Подтверждаем удаление
                if (confirm('Вы уверены, что хотите удалить этот элемент?')) {
                    App.deleteItem(item);
                }
            }
        });
        
        // Добавляем обработчик для сохранения текста при изменении
        document.addEventListener('input', function(e) {
            // Проверяем, что это редактируемый текстовый элемент
            if (e.target.parentElement && e.target.parentElement.classList.contains('text-cell')) {
                // Находим элемент, к которому относится ячейка
                const item = e.target.closest('.item');
                if (item) {
                    // Небольшая задержка для снижения нагрузки при быстром вводе
                    clearTimeout(window.textSaveTimeout);
                    window.textSaveTimeout = setTimeout(() => {
                        // Создаем и сохраняем данные элемента
                        const itemData = Items.createItemData(item);
                        DB.saveItem(itemData);
                        console.log('Текст сохранен:', itemData.id);
                    }, 500);
                }
            }
        });
        
        // Добавляем обработчик для сохранения при потере фокуса
        document.addEventListener('blur', function(e) {
            if (e.target.parentElement && e.target.parentElement.classList.contains('text-cell')) {
                const item = e.target.closest('.item');
                if (item) {
                    const itemData = Items.createItemData(item);
                    DB.saveItem(itemData);
                    console.log('Текст сохранен при потере фокуса:', itemData.id);
                }
            }
        }, true); // Capture phase для перехвата событий blur
        
        // Обработчик для сохранения заголовка при его изменении
        document.addEventListener('input', function(e) {
            // Проверяем, что это заголовок элемента
            if (e.target.classList.contains('item-title')) {
                const item = e.target.closest('.item');
                if (item) {
                    // Задержка для снижения нагрузки при быстром вводе
                    clearTimeout(window.titleSaveTimeout);
                    window.titleSaveTimeout = setTimeout(() => {
                        const itemData = Items.createItemData(item);
                        DB.saveItem(itemData);
                        console.log('Заголовок сохранен:', itemData.id);
                    }, 500);
                }
            }
        });
        
        // Обработчик для сохранения заголовка при потере фокуса
        document.addEventListener('blur', function(e) {
            if (e.target.classList.contains('item-title')) {
                const item = e.target.closest('.item');
                if (item) {
                    const itemData = Items.createItemData(item);
                    DB.saveItem(itemData);
                    console.log('Заголовок сохранен при потере фокуса:', itemData.id);
                }
            }
        }, true); // Capture phase для перехвата событий blur
        
        // Обработчик для кнопки переключения баз данных
        const switchDbButton = document.getElementById('switchDbButton');
        if (switchDbButton) {
            switchDbButton.addEventListener('click', function() {
                App.showDatabaseSelection();
            });
        }
        
        // Отмечаем, что обработчики инициализированы
        this.eventHandlersInitialized = true;
    },
    
    // Загрузка элементов из базы данных
    loadItems: function() {
        DB.loadItems(function(itemsByColumn) {
            console.log("Загружено элементов из БД:", 
                Object.values(itemsByColumn).reduce((acc, items) => acc + items.length, 0));
            
            // Для каждой колонки загружаем её элементы
            for (const columnId in itemsByColumn) {
                const items = itemsByColumn[columnId];
                const column = document.getElementById('column' + columnId);
                if (!column) continue;
                
                const itemsContainer = column.querySelector('.items-container');
                
                // Сначала очищаем контейнер от существующих элементов
                itemsContainer.innerHTML = '';
                
                // Сначала сортируем элементы по порядку (order)
                items.sort((a, b) => a.order - b.order);
                
                // Проверяем, что у всех элементов разные ID
                const processedIds = new Set();
                
                items.forEach(itemData => {
                    try {
                        // Проверяем валидность данных
                        if (!itemData.id || !itemData.columnId) {
                            console.error('Невалидные данные элемента:', itemData);
                            return;
                        }
                        
                        // Проверяем, что этот ID еще не обработан
                        if (processedIds.has(itemData.id)) {
                            console.warn('Дубликат ID уже обработан:', itemData.id);
                            return;
                        }
                        
                        processedIds.add(itemData.id);
                        
                        const itemIdParts = itemData.id.split('_');
                        if (itemIdParts.length !== 2) {
                            console.error('Неверный формат ID элемента:', itemData.id);
                            return;
                        }
                        
                        // Разбираем ID правильно, убирая возможное дублирование "item"
                        let itemNumber = itemIdParts[1];
                        if (itemNumber.startsWith('item')) {
                            itemNumber = itemNumber.substring(4); // Убираем 'item' из начала
                        }
                        
                        const item = Items.createNewItem(columnId, itemNumber, itemData.order);
                        
                        // Заполняем текстовые ячейки
                        const textCells = item.querySelectorAll('.text-cell div[contenteditable]');
                        if (itemData.textCells) {
                            itemData.textCells.forEach((text, index) => {
                                if (index < textCells.length) {
                                    textCells[index].innerHTML = text;
                                }
                            });
                        }
                        
                        // Заполняем ячейки с изображениями
                        const imageCells = item.querySelectorAll('.image-cell');
                        if (itemData.imageCells) {
                            itemData.imageCells.forEach((imageUrl, index) => {
                                if (index < imageCells.length && imageUrl) {
                                    ImageManager.insertImageToCell(imageCells[index], imageUrl);
                                }
                            });
                        }
                        
                        // Устанавливаем обработчики для drag-and-drop
                        setupDragAndDrop(item, DB.db);
                        
                        // Добавляем элемент в контейнер
                        itemsContainer.appendChild(item);

                        // Добавляем заголовок
                        const titleElement = item.querySelector('.item-title');
                        if (titleElement && itemData.title) {
                            titleElement.innerHTML = itemData.title;
                        }
                    } catch (error) {
                        console.error('Ошибка при создании элемента:', error, itemData);
                    }
                });
            }
        });
    },
    
    // Добавление нового элемента в колонку
    addNewItem: function(columnId) {
        // Получаем контейнер для элементов
        const column = document.getElementById('column' + columnId);
        const itemsContainer = column.querySelector('.items-container');
        
        // Увеличиваем счетчик элементов для этой колонки
        Items.itemCounter[columnId] = (Items.itemCounter[columnId] || 0) + 1;
        const itemId = Items.itemCounter[columnId]; // Только номер без префикса "item"
        
        // Сохраняем обновленные счетчики
        DB.saveCounters(Items.itemCounter);
        
        // Определяем порядок нового элемента (последний в колонке)
        const existingItems = itemsContainer.querySelectorAll('.item');
        const order = existingItems.length;
        
        // Проверяем, существует ли уже элемент с таким ID
        const checkId = `column${columnId}_item${itemId}`;
        if (document.querySelector(`[data-item-id="${checkId}"]`)) {
            console.warn(`Обнаружен дубликат ID ${checkId}, увеличиваем счетчик`);
            Items.itemCounter[columnId]++;
            DB.saveCounters(Items.itemCounter);
            return this.addNewItem(columnId);
        }
        
        // Создаем новый элемент с чистым числовым ID
        const item = Items.createNewItem(columnId, itemId, order);
        
        // Устанавливаем обработчики для drag-and-drop
        setupDragAndDrop(item, DB.db);
        
        // Добавляем элемент в контейнер
        itemsContainer.appendChild(item);
        
        // Прокручиваем к новому элементу
        item.scrollIntoView({ behavior: 'smooth' });
        
        // Сохраняем данные элемента
        const itemData = Items.createItemData(item);
        DB.saveItem(itemData);
        
        return item;
    },
    
    // Добавление нового элемента после указанного порядка
    addNewItemAfter: function(columnId, afterOrder) {
        // Получаем контейнер для элементов
        const column = document.getElementById('column' + columnId);
        const itemsContainer = column.querySelector('.items-container');
        
        // Увеличиваем счетчик элементов для этой колонки
        Items.itemCounter[columnId] = (Items.itemCounter[columnId] || 0) + 1;
        const itemId = Items.itemCounter[columnId];
        
        // Сохраняем обновленные счетчики
        DB.saveCounters(Items.itemCounter);
        
        // Создаем новый элемент
        const item = Items.createNewItem(columnId, itemId, afterOrder + 1);
        
        // Устанавливаем обработчики для drag-and-drop
        setupDragAndDrop(item, DB.db);
        
        // Находим элемент, после которого нужно вставить новый
        const items = Array.from(itemsContainer.querySelectorAll('.item'));
        const afterItem = items.find(item => parseInt(item.dataset.order) === afterOrder);
        
        if (afterItem && afterItem.nextElementSibling) {
            // Вставляем после указанного элемента
            itemsContainer.insertBefore(item, afterItem.nextElementSibling);
        } else {
            // Или в конец, если не нашли или это последний элемент
            itemsContainer.appendChild(item);
        }
        
        // Обновляем порядок элементов
        this.updateItemsOrder(columnId);
        
        // Прокручиваем к новому элементу
        item.scrollIntoView({ behavior: 'smooth' });
        
        // Сохраняем данные элемента
        const itemData = Items.createItemData(item);
        DB.saveItem(itemData);
        
        return item;
    },
    
    // Обновление порядка элементов в колонке
    updateItemsOrder: function(columnId) {
        const column = document.getElementById('column' + columnId);
        const items = column.querySelectorAll('.item');
        
        // Обновляем порядок для всех элементов
        Array.from(items).forEach((item, index) => {
            item.dataset.order = index;
            
            // Сохраняем обновленные данные
            const itemData = Items.createItemData(item);
            DB.saveItem(itemData);
        });
    },
    
    // Вспомогательная функция для отображения изображения в модальном окне
    showImage: function(src, imgElement, modalElement) {
        imgElement.src = src;
        modalElement.style.display = 'block';
    },
    
    // Добавить новый метод для инициализации с выбранной базой
    initializeWithDatabase: function() {
        // Проверяем, выбрана ли база данных
        if (!DB.currentDbName) {
            console.error("База данных не выбрана!");
            this.showDatabaseSelection();
            return;
        }
        
        // Скрываем все модальные окна
        this.hideModals();
        
        // Инициализируем базу данных
        DB.init(() => {
            // После инициализации базы данных загружаем элементы
            this.loadItems();
            
            // Инициализируем обработчики событий
            this.initEventHandlers();
            
            // Инициализируем счетчики элементов
            Items.init();
            
            // Инициализируем менеджер изображений
            ImageManager.init();
        });
    },
    
    // Добавить метод для отображения диалога выбора БД
    showDatabaseSelection: function() {
        const dbSelectionModal = document.getElementById('dbSelectionModal');
        
        // Проверяем, установлены ли уже обработчики
        if (!window._dbSelectionHandlersInitialized) {
            // Настраиваем обработчики кнопок
            document.getElementById('db1Button').addEventListener('click', () => {
                // Сначала скрываем модальное окно
                dbSelectionModal.style.display = 'none';
                
                // Затем устанавливаем базу данных
                DB.setDatabase('Srpski').then(() => {
                    this.initializeWithDatabase();
                });
            });
            
            document.getElementById('db2Button').addEventListener('click', () => {
                dbSelectionModal.style.display = 'none';
                DB.setDatabase('Portuguese').then(() => {
                    this.initializeWithDatabase();
                });
            });
            
            // Отмечаем, что обработчики установлены
            window._dbSelectionHandlersInitialized = true;
        }
        
        // Показываем диалог
        dbSelectionModal.style.display = 'block';
    },
    
    // Добавляем новый метод для скрытия модальных окон
    hideModals: function() {
        // Скрываем модальное окно выбора базы данных
        const dbSelectionModal = document.getElementById('dbSelectionModal');
        if (dbSelectionModal) {
            dbSelectionModal.style.display = 'none';
        }
        
        // Скрываем модальное окно с изображением
        const imageModal = document.getElementById('imageModal');
        if (imageModal) {
            imageModal.style.display = 'none';
        }
    },
    
    // Добавляем метод для удаления элемента
    deleteItem: function(item) {
        if (!item) return;
        
        const itemId = item.dataset.itemId;
        const columnId = item.dataset.columnId;
        
        // Сначала удаляем элемент из DOM
        item.remove();
        
        // Затем удаляем из базы данных
        DB.deleteItem(itemId, (success) => {
            if (success) {
                console.log(`Элемент ${itemId} успешно удален`);
                
                // Обновляем порядок элементов в колонке
                this.updateItemsOrder(columnId);
            } else {
                console.error(`Ошибка при удалении элемента ${itemId}`);
            }
        });
    }
};

// Запускаем приложение после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    App.init();
    
    const modal = document.getElementById('imageModal');
    
    // Закрытие по клику на кнопку закрытия
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            modal.style.display = 'none';
        });
    }
    
    // Закрытие по клику на фоне
    modal.addEventListener('click', function(e) {
        // Закрываем только если клик был на самом модальном окне, а не на изображении
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Закрытие по нажатию Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
    
    // Добавляем обработчик для кнопки экспорта базы данных
    const exportDbButton = document.getElementById('exportDbButton');
    if (exportDbButton) {
        exportDbButton.addEventListener('click', function() {
            DB.downloadDatabaseAsFile();
        });
    }
}); 
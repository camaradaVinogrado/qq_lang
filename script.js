// Файл оставлен для обратной совместимости
// Вся функциональность перемещена в модульные файлы:
// - db.js - работа с базой данных
// - items.js - создание и управление элементами
// - app.js - основная логика приложения

// Обеспечение обратной совместимости для любых внешних вызовов,
// которые могли бы обращаться к функциям из этого файла
if (!window.createNewItem) {
    window.createNewItem = function(columnId, itemId, order = 0) {
        return window.Items ? Items.createNewItem(columnId, itemId, order) : null;
    };
}

if (!window._createItemData) {
    window._createItemData = function(item) {
        return window.Items ? Items.createItemData(item) : {};
    };
}

if (!window._saveItem) {
    window._saveItem = function(itemData, db) {
        if (window.DB) DB.saveItem(itemData);
    };
}

// Перенаправляем обработку всех существующих вызовов в модульные функции
console.log('script.js загружен в режиме обратной совместимости.'); 
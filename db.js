// Переработанная и упрощенная структура базы данных
window.DB = {
    db: null,
    currentDbName: null,
    
    // Установка текущей базы данных
    setDatabase: function(dbName) {
        this.currentDbName = dbName;
        
        // Сохраняем выбор в localStorage
        localStorage.setItem('selectedDatabase', dbName);
        
        // Определяем соответствующий флаг для языка
        let flag = '';
        if (dbName === 'Srpski') {
            flag = '🇷🇸'; // Флаг Сербии
        } else if (dbName === 'Portuguese') {
            flag = '🇧🇷'; // Флаг Бразилии вместо Португалии
        }
        
        // Обновляем отображение текущей базы в интерфейсе (только флаг)
        const dbNameElement = document.getElementById('currentDbName');
        if (dbNameElement) {
            dbNameElement.textContent = flag;
        }
        
        // Закрываем текущую базу, если открыта
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        console.log(`Выбрана база данных: ${dbName}`);
        
        // Инициализируем базу с новым именем
        return new Promise((resolve) => {
            this.init(() => resolve());
        });
    },
    
    // Инициализация базы данных с учетом выбранного имени
    init: function(callback) {
        // Проверяем, задана ли текущая база данных
        if (!this.currentDbName) {
            console.error("Имя базы данных не задано! Используйте setDatabase() перед инициализацией.");
            if (callback) callback();
            return;
        }
        
        // Используем только выбранное имя базы
        const dbName = this.currentDbName;
        
        // Увеличиваем версию базы данных до 4
        const request = indexedDB.open(dbName, 4);
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            const oldVersion = event.oldVersion;
            
            // Создаем новое хранилище с простой структурой
            if (!db.objectStoreNames.contains("items")) {
                const store = db.createObjectStore("items", { keyPath: "id" });
                
                // Добавляем индексы для быстрого поиска по колонке и порядку
                store.createIndex("columnId", "columnId", { unique: false });
                store.createIndex("order", "order", { unique: false });
            }
            
            // Сохраняем счетчики отдельно
            if (!db.objectStoreNames.contains("counters")) {
                db.createObjectStore("counters", { keyPath: "id" });
            }
        };
        
        request.onsuccess = function(event) {
            DB.db = event.target.result;
            console.log(`База данных "${dbName}" успешно открыта`);
            if (callback) callback();
        };
        
        request.onerror = function(event) {
            console.error(`Ошибка открытия базы данных "${dbName}":`, event.target.error);
        };
    },
    
    // Проверка сохраненного выбора базы
    checkSavedDatabase: function() {
        const saved = localStorage.getItem('selectedDatabase');
        // Если сохраненной базы нет или она совпадает с дефолтной, возвращаем null
        // чтобы запросить выбор базы
        if (!saved) {
            return null;
        }
        return saved;
    },
    
    // Сохранение элемента
    saveItem: function(item) {
        const transaction = DB.db.transaction(["items"], "readwrite");
        const store = transaction.objectStore("items");
        
        // Добавляем элемент с уникальным ID
        const request = store.put(item);
        
        request.onsuccess = function() {
            console.log("Элемент сохранен:", item.id);
        };
        
        request.onerror = function(event) {
            console.error("Ошибка сохранения элемента:", event.target.error);
        };
    },
    
    // Загрузка элементов для всех колонок
    loadItems: function(callback) {
        const transaction = DB.db.transaction(["items"], "readonly");
        const store = transaction.objectStore("items");
        const request = store.openCursor();
        
        const items = {};
        
        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                const item = cursor.value;
                const columnId = item.columnId;
                
                if (!items[columnId]) {
                    items[columnId] = [];
                }
                
                items[columnId].push(item);
                cursor.continue();
            } else {
                // Для каждой колонки сортируем элементы по порядку
                for (const columnId in items) {
                    items[columnId].sort((a, b) => a.order - b.order);
                }
                
                callback(items);
            }
        };
        
        request.onerror = function(event) {
            console.error("Ошибка загрузки элементов:", event.target.error);
            callback({});
        };
    },
    
    // Сохранение счетчиков элементов
    saveCounters: function(counters) {
        const transaction = DB.db.transaction(["counters"], "readwrite");
        const store = transaction.objectStore("counters");
        
        // Сохраняем счетчики
        const request = store.put({ id: "itemCounters", counters: counters });
        
        request.onsuccess = function() {
            console.log("Счетчики сохранены");
        };
        
        request.onerror = function(event) {
            console.error("Ошибка сохранения счетчиков:", event.target.error);
        };
    },
    
    // Загрузка счетчиков элементов
    loadCounters: function(callback) {
        const transaction = DB.db.transaction(["counters"], "readonly");
        const store = transaction.objectStore("counters");
        const request = store.get("itemCounters");
        
        request.onsuccess = function(event) {
            const data = event.target.result;
            callback(data ? data.counters : null);
        };
        
        request.onerror = function(event) {
            console.error("Ошибка загрузки счетчиков:", event.target.error);
            callback(null);
        };
    },
    
    // Удаление элемента
    deleteItem: function(itemId, callback) {
        const transaction = DB.db.transaction(["items"], "readwrite");
        const store = transaction.objectStore("items");
        
        const request = store.delete(itemId);
        
        request.onsuccess = function() {
            console.log("Элемент удален:", itemId);
            if (callback) callback(true);
        };
        
        request.onerror = function(event) {
            console.error("Ошибка удаления элемента:", event.target.error);
            if (callback) callback(false);
        };
    },
    
    // Обновленный метод экспорта с сохранением схемы и индексов
    exportDatabase: function() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('База данных не инициализирована');
                return;
            }
            
            // Подготовка объекта для экспорта с метаданными
            const exportData = {
                dbName: this.currentDbName,
                timestamp: new Date().toISOString(),
                version: this.db.version,
                schema: {
                    objectStores: []
                },
                stores: {}
            };
            
            // Получаем список хранилищ объектов
            const storeNames = Array.from(this.db.objectStoreNames);
            let storesProcessed = 0;
            
            // Если хранилищ нет, сразу завершаем
            if (storeNames.length === 0) {
                resolve(exportData);
                return;
            }
            
            // Создаем транзакцию только для чтения для всех хранилищ
            const transaction = this.db.transaction(storeNames, 'readonly');
            
            // Собираем информацию о схеме для каждого хранилища
            storeNames.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                
                // Собираем метаданные о хранилище
                const storeMetadata = {
                    name: storeName,
                    keyPath: store.keyPath,
                    autoIncrement: store.autoIncrement,
                    indexes: []
                };
                
                // Собираем информацию о всех индексах хранилища
                Array.from(store.indexNames).forEach(indexName => {
                    const index = store.index(indexName);
                    storeMetadata.indexes.push({
                        name: indexName,
                        keyPath: index.keyPath,
                        multiEntry: index.multiEntry,
                        unique: index.unique
                    });
                });
                
                // Добавляем информацию о хранилище в схему
                exportData.schema.objectStores.push(storeMetadata);
                
                // Получаем все данные из хранилища
                const request = store.getAll();
                
                request.onsuccess = function() {
                    exportData.stores[storeName] = request.result;
                    storesProcessed++;
                    
                    // Если обработали все хранилища, возвращаем результат
                    if (storesProcessed === storeNames.length) {
                        resolve(exportData);
                    }
                };
                
                request.onerror = function(event) {
                    reject(`Ошибка экспорта хранилища ${storeName}: ${event.target.error}`);
                };
            });
        });
    },
    
    // Метод для скачивания данных в файл
    downloadDatabaseAsFile: function() {
        this.exportDatabase()
            .then(data => {
                // Создаем JSON-строку из данных
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                
                // Создаем URL для Blob
                const url = URL.createObjectURL(blob);
                
                // Создаем временную ссылку для скачивания
                const a = document.createElement('a');
                a.href = url;
                a.download = `${data.dbName}_export_${new Date().toISOString().replace(/:/g, '-')}.json`;
                
                // Добавляем к документу, запускаем скачивание и удаляем
                document.body.appendChild(a);
                a.click();
                
                // Очистка
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            })
            .catch(error => {
                console.error('Ошибка при экспорте базы данных:', error);
                alert('Произошла ошибка при экспорте базы данных. Пожалуйста, проверьте консоль для деталей.');
            });
    },
    
    // Метод для импорта данных в БД с учетом схемы
    importDatabase: function(data) {
        return new Promise((resolve, reject) => {
            if (!data || !data.dbName || !data.schema || !data.stores) {
                reject('Некорректный формат данных для импорта');
                return;
            }
            
            // Закрываем текущую БД, если открыта
            if (this.db) {
                this.db.close();
                this.db = null;
            }
            
            // Используем имя БД из экспортированных данных
            this.currentDbName = data.dbName;
            
            // Обновляем отображение текущей базы
            // ... (ваш код обновления UI)
            
            // Сохраняем выбор в localStorage
            localStorage.setItem('selectedDatabase', data.dbName);
            
            // Открываем БД с увеличенной версией для запуска onupgradeneeded
            const request = indexedDB.open(data.dbName, data.version + 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Создаем хранилища и индексы на основе схемы
                data.schema.objectStores.forEach(storeInfo => {
                    let store;
                    
                    // Удаляем существующее хранилище, если оно есть
                    if (db.objectStoreNames.contains(storeInfo.name)) {
                        db.deleteObjectStore(storeInfo.name);
                    }
                    
                    // Создаем хранилище с оригинальными параметрами
                    store = db.createObjectStore(storeInfo.name, {
                        keyPath: storeInfo.keyPath,
                        autoIncrement: storeInfo.autoIncrement
                    });
                    
                    // Создаем все индексы
                    storeInfo.indexes.forEach(indexInfo => {
                        store.createIndex(indexInfo.name, indexInfo.keyPath, {
                            unique: indexInfo.unique,
                            multiEntry: indexInfo.multiEntry
                        });
                    });
                });
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                
                // Заполняем хранилища данными
                const transaction = this.db.transaction(Object.keys(data.stores), 'readwrite');
                
                transaction.oncomplete = () => {
                    console.log(`Импорт базы данных "${data.dbName}" завершен`);
                    resolve();
                };
                
                transaction.onerror = (error) => {
                    reject(`Ошибка импорта: ${error.target.error}`);
                };
                
                // Импортируем данные в каждое хранилище
                for (const storeName in data.stores) {
                    const store = transaction.objectStore(storeName);
                    const items = data.stores[storeName];
                    
                    // Очищаем хранилище перед импортом
                    store.clear().onsuccess = () => {
                        // Добавляем каждый элемент
                        items.forEach(item => {
                            store.add(item);
                        });
                    };
                }
            };
            
            request.onerror = (event) => {
                reject(`Ошибка открытия базы данных: ${event.target.error}`);
            };
        });
    }
};

// Устанавливаем глобальные методы для совместимости
window._saveItem = function(itemData, db) {
    DB.saveItem(itemData);
}; 
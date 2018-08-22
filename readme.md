# Parallel tasks
Набор классов JavaScript с примером использования для распараллеливания задач. Решение является обходным вместо использования Promises. Возможно использование в версии ES3.

# Использование
```javascript
// Создаем 2 задачи. 
// Класс задачи должны реализовывать интерфейс IParallel
let af1 = new AsyncFetcher(url1);
let af2 = new AsyncFetcher(url2);

// Создаем экземпляр класса распараллеливания
// Задаем функцию, которая будет вызвана после завершения выполнения всех задач
let ll = new ParallelTask(() => {
    console.log('Finished', af1, af2, af3);
})

// Добавляем задачи в список на выполнение
    .addTask(af1)
    .addTask(af2)

// Устанавливаем интервал проверки статуса задач
    .setInterval(500)

// Запускаем все задачи в списке
    .run();
```
# Интерфейс
```typescript
interface IParallel {
    run(): void;
    isReady(): boolean;
    isRunned(): boolean;
    getId(): string;
    setId(id: string): void;
    getResult(): any;
}
```
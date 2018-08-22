/**
 * Интерфейс для задач, которые должны запускаться параллельно
 */
interface IParallel {
    /**
     * Запуск выполнения задачи
     */
    run(): void;

    /**
     * Возвращает статус готовности
     */
    isReady(): boolean;

    /**
     * Возвращает статус запущенности
     */
    isRunned(): boolean;

    /**
     * Возвращает идентификатор задачи
     */
    getId(): string;

    /**
     * Устанавливает иденитификатор задачи
     * @param id 
     */
    setId(id: string): void;

    /**
     * Возвращает результат работы задачи
     */
    getResult(): any;
}

/**
 * Интерфейс ассоциативного массива
 */
interface Map<T> {
    [K: string]: T;
}

/**
 * Отдельный тип для CallBack функции задачи
 */
type AsyncFetcherCallbackFn = (response: any) => void;

/**
 * Класс получения данных по URL адресу
 * 
 * Использован как пример задачи
 */
class AsyncFetcher implements IParallel {
    private _ready: boolean;
    private _runned: boolean;
    private _error: boolean;
    private _errMsg: string;
    private _response: any;
    private _onReadyFn: AsyncFetcherCallbackFn | null = null;

    public constructor(private _url: string, private _id: string = '') {
        this._ready = false;
        this._runned = false;
        this._error = false;
        this._errMsg = '';
        // this._onReadyFn = callbackFn;
    }
    public onReady(callbackFn: AsyncFetcherCallbackFn | null): IParallel {
        if (callbackFn !== null) {
            this._onReadyFn = callbackFn;
        }
        return this;
    }
    public getId(): string {
        return this._id;
    }
    public setId(id: string) {
        this._id = id;
    }
    public run(): void {
        this._runned = true;
        this.fetch();
    }
    public isReady(): boolean {
        return this._ready;
    }
    public isRunned(): boolean {
        return this._runned;
    }
    public getResult(): any {
        return this._response;
    }
    private fetch() {
        console.info('Fetching...');
        let that = this;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', this._url, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // console.log("xhr done successfully");
                    let resp = xhr.responseText;
                    let respJson = JSON.parse(resp);
                    that._response = respJson;
                    that._runned = false;
                    that._ready = true;
                    if (that._onReadyFn) {
                        that._onReadyFn.call(this, respJson);
                    }
                } else {
                    // console.error('Send request error. ID:', id);
                    that._runned = false;
                    that._ready = true;
                    that._error = true;
                    that._errMsg = 'Send request error';
                }
            } else {
                // console.log('Waiting response. ID:', id, '...');
            }
        }
        // console.log('Request sended. ID:', id);
    }
}

/**
 * Класс контроллера параллельных задач
 */
class ParallelTask {
    private _tasks: Array<IParallel> = [];
    private _runned: Array<IParallel> = [];
    private _finished: Array<IParallel> = [];
    private _timer: any = null;
    private _lut: Array<string> = [];
    // private _status: Map<string> = {};
    // private _keys: Array<string> = [];
    private _interval: number = 200;

    public constructor(private _onReadyFn: Function) {
        this._lut = [];
        for (let i = 0; i < 256; i++) {
            this._lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
        }
    }
    public setInterval(interval: number): ParallelTask {
        this._interval = interval;
        return this;
    }
    public addTask(task: IParallel): ParallelTask {
        if (task.getId() == '') {
            task.setId(this.guid());
        }
        this._tasks.push(task);
        // this._status[task.getId()] = 'a';
        // this._keys.push(task.getId());
        return this;
    }
    private guid() {
        let d0 = Math.random() * 0xffffffff | 0;
        let d1 = Math.random() * 0xffffffff | 0;
        let d2 = Math.random() * 0xffffffff | 0;
        let d3 = Math.random() * 0xffffffff | 0;
        return this._lut[d0 & 0xff]
            + this._lut[d0 >> 8 & 0xff]
            + this._lut[d0 >> 16 & 0xff]
            + this._lut[d0 >> 24 & 0xff]
            + '-'
            + this._lut[d1 & 0xff]
            + this._lut[d1 >> 8 & 0xff]
            + '-'
            + this._lut[d1 >> 16 & 0x0f | 0x40]
            + this._lut[d1 >> 24 & 0xff]
            + '-'
            + this._lut[d2 & 0x3f | 0x80]
            + this._lut[d2 >> 8 & 0xff]
            + '-'
            + this._lut[d2 >> 16 & 0xff] + this._lut[d2 >> 24 & 0xff]
            + this._lut[d3 & 0xff]
            + this._lut[d3 >> 8 & 0xff]
            + this._lut[d3 >> 16 & 0xff]
            + this._lut[d3 >> 24 & 0xff];
    }
    public run() {
        // console.log('Running...');
        while (this._tasks.length > 0) {
            let task = this._tasks.shift() as IParallel;
            if (!task.isRunned()) {
                task.run();
                this._runned.push(task);
                // this._status[task.getId()] = 'r';
            }
        }
        let that = this;
        this._timer = setInterval(() => { that.checkFinish(); }, this._interval);
    }

    private checkFinish() {
        let _runned: Array<IParallel> = [];
        while (this._runned.length > 0) {
            let task = this._runned.shift() as IParallel;
            if (task.isReady()) {
                this._finished.push(task);
                // this._status[task.getId()] = 'f';
            } else {
                _runned.push(task);
            }
        }
        while (_runned.length > 0) {
            let task = _runned.shift() as IParallel;
            this._runned.push(task);
        }

        if (this._runned.length === 0) {
            clearInterval(this._timer);
            this._onReadyFn.call(this);
        }

        // let log: string = '';
        // for (let i = 0; i < this._keys.length; i++) {
        //     log += '    ' + this._status[this._keys[i]];
        // }
        // console.log(log);
    }
}

/**
 * URL для тестирования
 */
const url1: string = 'https://my.api.mockaroo.com/timetask.json?key=6cd5c210';
const url2: string = 'https://my.api.mockaroo.com/vacation.json?key=6cd5c210';

/**
 * Создадим 5 задач для 5 потоков
 * У одной задачи будет отдельный CallBack по завершению
 */
let af1 = new AsyncFetcher(url1);
let af2 = new AsyncFetcher(url2);
let af3 = new AsyncFetcher(url1);
let af4 = new AsyncFetcher(url2).onReady((resp: any) => {
    console.log('AF4 finished');
});
let af5 = new AsyncFetcher(url2);

/**
 * Создадим экземпляр класса контроллера параллельных процессов
 * с CallBack функцией, которая отработает по завершению всех процессов
 */
let ll = new ParallelTask(() => {
    console.log('Finished', af1, af2, af3);
})
    .addTask(af1)
    .addTask(af2)
    .addTask(af3)
    .addTask(af4)
    .addTask(af5)
    .setInterval(500)
    .run();
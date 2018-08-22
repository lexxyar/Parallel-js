"use strict";
var url1 = 'https://my.api.mockaroo.com/timetask.json?key=6cd5c210';
var url2 = 'https://my.api.mockaroo.com/vacation.json?key=6cd5c210';
var AsyncFetcher = /** @class */ (function () {
    function AsyncFetcher(_url, _id) {
        if (_id === void 0) { _id = ''; }
        this._url = _url;
        this._id = _id;
        this._onReadyFn = null;
        this._ready = false;
        this._runned = false;
        this._error = false;
        this._errMsg = '';
        // this._onReadyFn = callbackFn;
    }
    AsyncFetcher.prototype.onReady = function (callbackFn) {
        if (callbackFn !== null) {
            this._onReadyFn = callbackFn;
        }
        return this;
    };
    AsyncFetcher.prototype.getId = function () {
        return this._id;
    };
    AsyncFetcher.prototype.setId = function (id) {
        this._id = id;
    };
    AsyncFetcher.prototype.run = function () {
        this._runned = true;
        this.fetch();
    };
    AsyncFetcher.prototype.isReady = function () {
        return this._ready;
    };
    AsyncFetcher.prototype.isRunned = function () {
        return this._runned;
    };
    AsyncFetcher.prototype.getResult = function () {
        return this._response;
    };
    AsyncFetcher.prototype.fetch = function () {
        console.info('Fetching...');
        var that = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this._url, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // console.log("xhr done successfully");
                    var resp = xhr.responseText;
                    var respJson = JSON.parse(resp);
                    that._response = respJson;
                    that._runned = false;
                    that._ready = true;
                    if (that._onReadyFn) {
                        that._onReadyFn.call(this, respJson);
                    }
                }
                else {
                    // console.error('Send request error. ID:', id);
                    that._runned = false;
                    that._ready = true;
                    that._error = true;
                    that._errMsg = 'Send request error';
                }
            }
            else {
                // console.log('Waiting response. ID:', id, '...');
            }
        };
        // console.log('Request sended. ID:', id);
    };
    return AsyncFetcher;
}());
var ParallelTask = /** @class */ (function () {
    function ParallelTask(_onReadyFn) {
        this._onReadyFn = _onReadyFn;
        this._tasks = [];
        this._runned = [];
        this._finished = [];
        this._timer = null;
        this._lut = [];
        // private _status: Map<string> = {};
        // private _keys: Array<string> = [];
        this._interval = 200;
        this._lut = [];
        for (var i = 0; i < 256; i++) {
            this._lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
        }
    }
    ParallelTask.prototype.setInterval = function (interval) {
        this._interval = interval;
        return this;
    };
    ParallelTask.prototype.addTask = function (task) {
        if (task.getId() == '') {
            task.setId(this.guid());
        }
        this._tasks.push(task);
        // this._status[task.getId()] = 'a';
        // this._keys.push(task.getId());
        return this;
    };
    ParallelTask.prototype.guid = function () {
        var d0 = Math.random() * 0xffffffff | 0;
        var d1 = Math.random() * 0xffffffff | 0;
        var d2 = Math.random() * 0xffffffff | 0;
        var d3 = Math.random() * 0xffffffff | 0;
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
    };
    ParallelTask.prototype.run = function () {
        // console.log('Running...');
        while (this._tasks.length > 0) {
            var task = this._tasks.shift();
            if (!task.isRunned()) {
                task.run();
                this._runned.push(task);
                // this._status[task.getId()] = 'r';
            }
        }
        var that = this;
        this._timer = setInterval(function () { that.checkFinish(); }, this._interval);
    };
    ParallelTask.prototype.checkFinish = function () {
        var _runned = [];
        while (this._runned.length > 0) {
            var task = this._runned.shift();
            if (task.isReady()) {
                this._finished.push(task);
                // this._status[task.getId()] = 'f';
            }
            else {
                _runned.push(task);
            }
        }
        while (_runned.length > 0) {
            var task = _runned.shift();
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
    };
    return ParallelTask;
}());
var af1 = new AsyncFetcher(url1);
var af2 = new AsyncFetcher(url2);
var af3 = new AsyncFetcher(url1);
var af4 = new AsyncFetcher(url2).onReady(function (resp) {
    console.log('AF4 finished');
});
var af5 = new AsyncFetcher(url2);
var ll = new ParallelTask(function () {
    console.log('Finished', af1, af2, af3);
})
    .addTask(af1)
    .addTask(af2)
    .addTask(af3)
    .addTask(af4)
    .addTask(af5)
    .setInterval(500)
    .run();

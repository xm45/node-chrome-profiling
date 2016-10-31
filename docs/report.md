# 如何解读report.json文件的格式
首先，report.json遵循json格式，所以你可以使用下面的语句直接将其载入到你的程序中
```
var report = require(path-to-report.json)
```
这个JSON对象的格式定义如下，各个子对象的内容已经标出：
```js
[number] 为数字.
[string] 是字符串对象.  
[unix timestamp] 是一个数字，代表按照unix timestamp的时间戳数字.  
[time] 是一个数字，代表时间长短，单位为ms.
[size] 是一个数字，代表文件的大小，单位为kb  
[Running Object] 是一个对象，内容为
    {
        count : [number], 
        time : [time], 
        data : [Data Object]
    }
    其中：
        count代表对应类型的事件发生的次数
        time代表对应类型的事件总耗时，单位为ms
        data为对应类型事件的所有实例

[Request Object] 是一个对象，内容为
    {
        count : [number], 
        time : [time], 
        size : [size],
        data : [Data Object]
    }
    其中：
        count代表对应类型的请求发生的次数
        time代表对应类型的请求总耗时
        size代表对应类型的请求的总大小
        data为对应类型请求的所有实例

[Data Object] 是一个对象，内容为
    {
        url : [string],
        start : [unix timestamp],
        time : [time],
        id : [number],
        size : [size],
        raw : [raw data]
    }
    其中：
        url如果存在，代表链接地址
        start代表开始的时间
        time代表耗时
        id如果存在，代表事件的唯一标识符
        size如果存在，代表请求传输的大小
        raw为按照时间顺序的该事件相关的每一个原始数据
[raw data]是一个数组，包含的是在trace文件的中原始JSON对象.


下面是report.json的原始定义

var report = {
        url:[string],
        startTime:[unix timestamp],
        endTime:[unix timestamp],
        duration:[time],
        landmark:{
            firstPaint:[time],
            loadTime:[time],
            domContentLoaded:[time]
        },
        running:{
            parseHTMLs: [Running Object],
            script:{
                EvaluateScript: [Running Object],
                GCEvent: [Running Object],
                FunctionCall: [Running Object],
                EventDispatch: [Running Object],
            }
            animation:{
                AnimationFrameFired: [Running Object],
                CancelAnimationFrame: [Running Object],
                RequestAnimationFrame: [Running Object],
            }
            timer:{
                TimerInstall: [Running Object],
                TimerFire: [Running Object],
                TimerRemove: [Running Object],
            }
            ajax:{
                XHRLoad: [Running Object],
                XHRReadyStateChange: [Running Object],
            }
        }
        render:{
            CompositeLayers: [Running Object],
            DecodeImage: [Running Object],
            ResizeImage: [Running Object],
            Paint: [Running Object],
            Layout: [Running Object],
            ScrollLayer: [Running Object],
            reflow:{
                forcedRecalcs: [Running Object],
                forcedLayouts: [Running Object],
            },
        }
        request:{
            html: [Request Object],
            js: [Request Object],
            css: [Request Object],
            img: [Request Object],
            flash: [Request Object],
        }
    };
```
# 如何解读report.json文件的格式
首先，report.json遵循json格式，所以你可以使用下面的语句直接将其载入到你的程序中
```
var report = require(path-to-report.json)
```
这个JSON对象的格式定义如下，各个子对象的内容已经标出：
```js
[number] 为数字
[string] 是字符串对象  
[unix timestamp] 是一个数字，代表按照unix timestamp的时间戳数字  
[time] 是一个数字，代表时间长短，单位为ms
[size] 是一个数字，代表文件的大小，单位为byte  

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
        startTime : [unix timestamp],
        time : [time],
        id : [number],
        size : [size],
        stackTrace:[Object],
        raw : [raw data]
        ...
    }
    其中：
        url如果存在，代表链接地址
        startTime代表开始的时间
        time代表耗时
        id如果存在，代表事件的唯一标识符
        size如果存在，代表请求传输的大小
        stackTrace如果存在，代表触发该事件的js信息
        raw为按照时间顺序的该事件相关的每一个原始数据
        ...为其他属性，视具体事件而定

[raw data]是一个数组，包含的是在trace文件的中原始JSON对象.


下面是report.json的原始定义

var report = {
        url:[string],//网站的url
        time:{
            startTime:[unix timestamp],//开始的时间戳
            endTime:[unix timestamp],//结束的时间戳
            duration:[time],//总耗时
        },
        landmark:{
            firstPaint:[time],//第一次paint是在开始多久后
            domContentLoaded:[time],//dom载入完成是在开始多久后
            loadTime:[time],//load完成是在开始多久后
        },
        counter:{//一些计数器
            drawFrame:[number],//draw发生次数
            last:{//最近一次
                documents: [number],//dom文档数
                jsEventListeners: [number],//js监听器数量
                jsHeapSizeUsed: [number],//js堆大小
                nodes: [number],//dom节点数
            },
            max:{//最大值
                documents: [number],
                jsEventListeners: [number],
                jsHeapSizeUsed: [number],
                nodes: [number],
            },
            raw:[raw Data],//原始数据
        },
        running:{
            ParseHTML: [Running Object],//解析HTML
            ParseCSS: [Running Object],//解析CSS
            EvaluateScript: [Running Object],//执行JS
            EventDispatch: [Running Object],//事件传递
            FunctionCall: [Running Object],//函数调用
            CompileJS: [Running Object],//解析JS
            MinorGC: [Running Object],//GC的一类
            MajorGC: [Running Object],//GC的一类
            TimerInstall: [Running Object],//计时器装载
            TimerFire: [Running Object],//计时器触发
            TimerRemove: [Running Object],//计时器移除
            XHRLoad: [Running Object],//XHR对象载入
            XHRReadyStateChange: [Running Object],//XHR对象状态改变(获取了数据)
        }
        render:{
            CompositeLayers: [Running Object],//合并各个层
            Paint: [Running Object],//绘制
            Layout: [Running Object],//布局
            UpdateLayoutTree: [Running Object],//更新布局树
            Reflow: [Running Object],//回流，由Layout和UpdateLayoutTree中处理出来
            GPUTask: [Running Object],//GPU作业
            RasterTask: [Running Object],//栅化作业
        }
        request:{
            html: [Request Object],//HTML资源
            js: [Request Object],//JS资源
            css: [Request Object],//CSS资源
            img: [Request Object],//各类图像资源
            flash: [Request Object],//FLASH资源
        }
    };
```
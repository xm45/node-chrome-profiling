# 如何分析跟踪文件

需要参考文件[Trace Event Format](https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview)  

主要分为两大类，请求和事件

## 请求
资源请求,以下name均属于资源请求：  
+   ResourceSendRequest
    *   包含了url，priority，requestMethod，以及requestId
+   ResourceReceiveResponse
    *   包含了mimeType，statusCode，以及requestId
+   ResourceReceivedData
    *   包含了encodedDataLength，以及requestId
+   ResourceChangePriority
    *   包含了priority，以及requestId
+   ResourceFinish
    *   包含了didFail和networkTime，以及requestId
+   同一个请求的所有部分都拥有相同的requestId

## 事件
其余基本都是事件类型  
事件类型有两种，一种是点事件，一种是线事件。  
*  标记某一种瞬发情况发生的时间点，或者有dur属性来表示事件时长，则是点事件。
    -  如MarkDOMContent标记事件发生的时间点
    -  点事件遇到的时候直接制成一个对象即可
*  同一事件如果有开始和结束之分，则是线事件。
    -  如一次完整的UpdateLayoutTree有开头结尾两个标记点。
    -  同类线事件不会有交叉部分，只会包含或者不相关
    -  线事件需要一个栈来维护发生顺序，将头尾合并成一个对象

主要分析了以下的事件  
+   标志事件
    *   MarkFirstPaint，很可能已经弃用，用第一个DrawFrame判断
    *   MarkDOMContent
    *   MarkLoad
    *   分别是firstPaint，DOMContent，LoadFinish三个事件发生的标志
+  渲染事件
    *  GPUTask
    *  Paint
    *  Layout
    *  UpdateLayoutTree
    *  CompositeLayers
    *  RasterTask
    *  在程序中分析了可能是Reflow的Layout和UpdateLayoutTree，归为Reflow类
+  解析事件
    *  ParseHTML
    *  ParseAuthorStyleSheet
    *  v8.compile
+  JS运行时事件
    *  EvaluateScript
    *  EventDispatch
    *  FunctionCall
    *  MajorGC
    *  MinorGC
+  计时器事件
    *  TimerFire
    *  TimerInstall
    *  TimerRemove
+  XHR对象事件
    *  XHRLoad
    *  XHRReadyStateChange
+  计数器更新
    *  UpdateCounters
    *  包含了
        - documents，文档(页面)数
        - jsEventListeners，监视器数量
        - jsHeapSizeUsed，JS的堆大小
        - nodes，dom节点数
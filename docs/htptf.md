# 如何分析跟踪文件

需要参考文件[Trace Event Format](https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview)  

主要分为两大类，平铺的和递归的。  

## 平铺类型
比如request请求,以下四类name均属于request请求：  
+   ResourceSendRequest
    *   包含了url，priority，requestMethod，以及一个requestId
+   ResourceReceiveResponse
    *   包含了mimeType，statusCode，以及一个requestId
+   ResourceReceivedData
+   ResourceFinish
+   同一个请求的所有部分都拥有相同的requestId

        "mimeType": "text/html",
        "mimeType": "text/css",
        "mimeType": "application/javascript",
        "mimeType": "application/x-shockwave-flash",
        "mimeType": "image/png",
        "mimeType": "image/svg+xml",
        "mimeType": "image/gif",
        other
        encodedDataLength
        networkTime us = 1/1000ms
# 简介
node-chrome-profiling 可以帮助你做到
通过Chrome的[remote debugging protocol](https://developer.chrome.com/devtools/docs/debugger-protocol)来获取chrome运行时的相关信息,相关接口已经由其他项目封装好，我们只需要获取数据即可

# 环境
你需要环境  
* [ubuntu](https://www.ubuntu.com/)，有的部分在其他环境下不一定能运行.  
* [git](https://git-scm.com/)，用于下载本软件  
* [nodejs](https://nodejs.org/en/)，5.x以上版本,用来运行nodejs的文件.  
* [npm](https://npmjs.com/)，用来管理包.一般为nodejs自带.  
* [Chrome](http://www.google.cn/chrome/browser/desktop/index.html)，软件将通过命令行 $ google-chrome 来调用Chrome，你还可以使用timeline来载入生成的文件.  

# 使用
配置环境
```sh
$ sudo apt-get update  
$ sudo apt-get install git
$ sudo apt-get install nodejs  
$ sudo apt-get install npm
32位:
$ wget https://dl.google.com/linux/direct/google-chrome-stable_current_i386.deb
$ sudo dpkg -i google-chrome-stable_current_i386.deb
64位:
$ wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
$ sudo dpkg -i google-chrome-stable_current_amd64.deb

$ sudo apt-get install google-chrome
```
下载软件
```sh
$ git clone 
$ cd node-chrome-profiling
$ npm install
```
使用
```sh
使用默认网站百度，测试你的网络是否接通
$ node main 

输入-h可以查看命令参数
$ node main -h

常用模式
$ node main --url http://example.com --highlevel
```
你可以在`\trace_file`下找到所有的trace文件夹  

>文件夹默认按照[Unix timestamp](http://www.unixtimestamp.com/)来命名，使用`--name`命令可以设置保存的文件夹名字  

每个文件夹内有两个文件  
* trace.json，从chrome运行数据中导出的原始trace文件
* report.json，经过初步分析的report文件

# 文档
参考文档内容  
*    [Trace Event Format](https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview)  
*    [Timeline Event Reference ](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/performance-reference?hl=en)

参考项目代码  
*    [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)，使用其提供封装的方法来调用chrome  
*    [automated-chrome-profiling](https://github.com/paulirish/automated-chrome-profiling)，参考其调用chrome-remote-interface的方式  
*    [devtools-frontend](https://github.com/ChromeDevTools/devtools-frontend)，参考其解析trace文件时的细节  
*    [devtools-timeline-model](https://github.com/paulirish/devtools-timeline-model)，参考其对某些指标的定义  
*    [node-big-rig](https://github.com/GoogleChrome/node-big-rig)，参考其对某些指标的定义  
*    [lighthouse](https://github.com/GoogleChrome/lighthouse)  
*    [pagetimeline](https://github.com/the1sky/pagetimeline)  
*    [perfjankie](https://github.com/axemclion/perfjankie)  
*    [timeline-viewer](https://github.com/ChromeDevTools/timeline-viewer)  

具体如何分析跟踪文件请参考
* [docs/htptf.md]()

report.json文件的格式请参考
* [docs/report.md]()
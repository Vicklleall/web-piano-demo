# web-piano-demo

在网页上弹钢琴

教程请看原文：https://vicklleall.com/p/a?t1

#### 调试说明

Web Audio API 遵循同源策略，因此你需要搭建一个本地服务器来调试，例如在仓库目录下使用 python 自带的静态服务器：

```shell
python -m http.server 8080
```

随后浏览器访问 http://localhost:8080/ ，打开开发者工具 Console，进行调试

http://localhost:8080/play 为网页钢琴，可使用键盘、鼠标弹奏，F1~F8改变力度


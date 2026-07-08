---
title: '自制一个小 ups, 实现宿舍 WIFI 不间断'
description: '宿舍里有一个设备要24小时不断网，所以萌生出了一个自制ups，给宿舍WiFi不间断供电的想法'
pubDate: '2023-10-27'
# heroImage: '@/assets/blog-placeholder-3.jpg'
---


近日因为个人需要，宿舍里有一个设备要24小时不断网，所以萌生出了一个自制ups，给宿舍WiFi不间断供电的想法。

所有的部件材料，都有现成的，所以diy起来是很简单的。仅仅需要的就是简单烙锡。

各位大佬轻喷。

- 一个ups模块
- 根据需求，18650电池买几块
- 一个输出功率大于充电和供电的电源适配器
- 电线
- 一套烙铁工具

由于我的宿舍内的WiFi设备是光猫路由一体，要求的输入是12v1.5a。虽然实际上功率不会这么大，但是为了不让ups模块负载太高发热，只能购入稍贵一点的24W版本。

普通路由器，其实5w功率都行了，不需要买这么大，根据实际需求，购买一个输出功率小点的，还便宜。

嗯，还有，这个ups模块自带电池保护。

主要部件总共花费我：ups模块24+四块电池36+电池盒10=70，其他的都是有剩余过量。要算的话，QAQ，好多，欺骗一下自己。

![ups 模块](https://blog-img.thricecola.com/diy-ups/ups模块.webp)

这个模块要求两个电池串联，具体可看某宝的介绍图。所以我采用两个并联电池组。

这里提一嘴，电池并联加容量，串联加电压。

![电池组](https://blog-img.thricecola.com/diy-ups/电池组.webp)

焊接

![焊接](https://blog-img.thricecola.com/diy-ups/焊接.webp)

先接上电源适配器和输出，再接电线，最后再接电池，按照说明图烙上去就行。

最后的大功告成。

![成品](https://blog-img.thricecola.com/diy-ups/成品.webp)

等待红灯变绿灯中......

![亮绿灯了](https://blog-img.thricecola.com/diy-ups/亮绿灯了.webp)

总之就是非常简单的东西啦

计算的话，这两个电池组最短可以坚持2.6小时，想要测试的话，目前最好的办法还是实际测。

最近学了rust，所以拿rust来写一个ping，查看这个ups能用多久。

```rust
use chrono::Local;
use rand;
use reqwest::Client;
use std::fs::File;
use std::io::Write;
use std::thread::sleep;
use std::time::Duration;
use tokio;

async fn check_internet_connection() -> bool {
    let client = Client::new();

    let response = client.get("https://www.baidu.com").send().await;
    let foo: bool;
    match response {
        Ok(_response) => foo = true,
        Err(_error) => foo = false,
    }
    foo
}

#[tokio::main]
async fn main() {
    let path = "time_log.txt";
    let mut output = File::create(path).unwrap();
    writeln!(output, "wait start:)").unwrap();

    loop {
        let mut rng = rand::thread_rng();
        let duration = Duration::from_secs(rand::Rng::gen_range(&mut rng, 60..180));
        let local_time = Local::now();
        if check_internet_connection().await {
            let txt = local_time.to_string() + ": true";
            writeln!(output, "{}", txt).unwrap();
        } else {
            let txt = local_time.to_string() + "::false::\n:(";
            writeln!(output, "{}", txt).unwrap();
            break;
        }

        sleep(duration);
    }
}
```

发现完全可以坚持完宿舍人走断电所带来的断网，绰绰有余的电量。

到此，结束。

----

来个酷安老笑话

![自组电池教学meme](https://blog-img.thricecola.com/diy-ups/自组电池教学meme.jpg)

import {Constants} from "../constants";
import {addScript} from "../util/addScript";
import {chartRenderAdapter} from "./adapterRender";

declare const echarts: {
    init(element: HTMLElement, theme?: string, opts?: object): IEChart;
};

export const chartRender = (element: (HTMLElement | Document) = document, cdn = Constants.CDN, theme: string) => {
    const echartsElements = chartRenderAdapter.getElements(element);
    if (echartsElements.length > 0) {
		var echartsUrl = cdn.startsWith('http') ? 'https://fastly.jsdelivr.net/npm/echarts@5.4.1/dist/echarts.min.js' : cdn + '/dist/js/echarts/echarts.min.js';
        addScript(echartsUrl, "vditorEchartsScript").then(() => {
            echartsElements.forEach((e: HTMLDivElement) => {
                if (e.parentElement.classList.contains("vditor-wysiwyg__pre") ||
                    e.parentElement.classList.contains("vditor-ir__marker--pre")) {
                    return;
                }
                
                // 解决getCode(e)方式获取的text无换行的问题，不能使用innerHTML存在转义
                const text = e.textContent; // chartRenderAdapter.getCode(e).trim();
                if (!text) {
                    return;
                }
                try {
                    if (e.getAttribute("data-processed") === "true") {
                        return;
                    }
                                     
                    // const option = JSON.parse(text);
                    // echarts.init(e, theme === "dark" ? "dark" : undefined).setOption(option);
                    // 替换默认逻辑为以下代码，此行删除前后的空白字符
                    const txtStr = text.replace(/^\s+|\s+$/g,''); 
                    const txtBody = 'var option; \n' + (txtStr.startsWith('{') ? 'option = ' : '') + txtStr + '\nreturn option;';
                                       
                    // 输入文本的函数定义，如果有其他参数请加入，https://fuyiyi.imdo.co 
                    var optionFun = new Function('myChart',  'setTimeout', 'setInterval', txtBody);
                    
                    // 解析第一行是否有参数：theme,width,height，如第一行内容：// theme=dark&width=1000&height=618
                    var paramsString = txtStr.split('\n')[0].replace('//', '').trim();
                    var params = new URLSearchParams(paramsString);
                    
                    // 原chartRender中的实例化后直接设置Option，现在拆开
                    var curTheme = params.has('theme') ? params.get('theme') : theme === "dark" ? "dark" : undefined;
                    var curOpts = {'width': params.has('width') ? params.get('width') : null, 'height': params.has('height') ? params.get('height') : null};
                    var myChart = echarts.init(e, curTheme, curOpts);
                    
                    // 通过原 JS 形式配置项 获取最终的option，https://fuyiyi.imdo.co 
                    const option = optionFun(myChart, setTimeout, setInterval);
                    myChart.setOption(option);

                    e.setAttribute("data-processed", "true");
                } catch (error) {
                    e.className = "vditor-reset--error";
                    e.innerHTML = `echarts render error: <br>${error}`;
                }
            });
        });
    }
};

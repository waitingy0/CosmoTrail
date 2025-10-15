// 日期输入框
// “日期输入框 + 显示器”，可输入/更改日期，它会解析并更新系统里的日期，并通知外部

import $ from 'jquery';
import ExportValues from './ExportValues';
import { DATE_ID, DATE_DISPLAY_ID } from './Gui';

let inp;		//用来存放一个输入框（input 元素）
let display;	//用来存放一个“显示用的区域”
let date;		//程序内部记住的「当前日期」

	// 对象字面量 (object literal)，通过 export default 导出
	// export default 是 ES6 模块语法，用来把某个值导出给其他文件使用
	// 模块作用域变量 + 对象字面量导出，达到“单例”效果
export default {

	init(onChange, defaultDate) {

		//如果还没有输入框，就创建一个
		// 用jQuery创建一个<input>标签(用户输入日期的文本框)
		if (!inp) {
			inp = $('<input>');
		}
		
		// 第二步：找到页面上专门显示日期的区域
		display = $(`#${DATE_DISPLAY_ID}`);

		// 记录当前日期
		let curDate;

		// 给输入框绑定“内容变化”的监听
		inp.off('change').on('change.CosmoTrail', () => {

			//拿到用户输入的字符串
			const dStr = inp.val();
			const m = dStr && dStr.trim().match(/(-?\d{1,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
			let newDate;
			if (m) {
				//格式是 2023-05-18T12:30 ，拆分转化为 JS 日期对象。
				newDate = new Date(Date.UTC(
					Number(m[1]), 
					Number(m[2]) - 1, 
					Number(m[3]), 
					Number(m[4]), 
					Number(m[5])));
			} else {
				//直接用浏览器自带的日期解析
				newDate = new Date(dStr);
			}
				//解析失败，用当前时间
			if (isNaN(newDate.getTime())) {
				newDate = new Date();
			}
			if (curDate !== newDate) {
				this.setDate(newDate);
				onChange();
			}
				//如果新日期和旧日期不一样，就更新内部日期，并且调用外部传进来的回调 onChange()
				//更新 curDate
			curDate = newDate;
		});

		//如果外部传了一个默认日期，设好
		if (defaultDate) {
			this.setDate(new Date(defaultDate));
		}

	},

	//外部获取输入框，放到界面上
	getWidget() {
		return inp;
	},
	
	setDate(d) {
		date = d;
		if (d) {
			const dStr = d.toISOString();
			ExportValues.setVal(DATE_ID, dStr);
			if (inp) inp.val(dStr);
			if (display) display.text(dStr);
		}
	},

	getDate() {
		return date;
	},

};

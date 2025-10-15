// 地理坐标输入框
import $ from 'jquery';
import GeoCoord from '../utils/GeoCoord';
import ExportValues from './ExportValues';
import { GEOLOC_ID } from './Gui';

// inp：一个输入框。
// loc：一个用来存放地理位置的对象（经度、纬度）
// loc是 GeoCoord 类做的，专门负责把「经纬度」在不同格式之间转换。
const inp = $('<input>');
let loc;

export default {

	//init 普通方法，初始化内部状态，并没有 new 或 this 绑定实例的行为
	init(defaultVals, onChangeCallback) {
		// 造一个 GeoCoord 对象
		loc = new GeoCoord();

		// 判断数据类型
		// 如果是字符串类型就用字符串解析
		if (typeof defaultVals === 'string') {
			loc.setFromString(defaultVals);			
		} else {
		
			//否则用数值
			loc.setValue(defaultVals);
		}

		//把解析好的坐标写进输入框里
		inp.val(loc.getString());

		// 闭包，定义一个内部函数 onChange，用于响应输入框内容变化
		function onChange() {
			// 从输入框取值，重新更新 loc
			loc.setFromString(inp.val());

			// 再把格式化后的坐标写回输入框（避免乱输导致格式不对）
			inp.val(loc.getString());		

			// 把 loc 的真实坐标对象回传给外部回调
			onChangeCallback(loc.getLoc());

			// 还要存一份到全局的 ExportValues 里（类似缓存）
			ExportValues.setVal(GEOLOC_ID, loc.getString());
		}
		
		// 绑定事件监听：当输入框 change 时执行 onChange()
		// off('change')：jQuery 的事件解绑方法，作用是 “移除输入框上所有已绑定的change事件”，先清空旧的监听，避免混乱
		// on. 链式调用
		inp.off('change').on('change.CosmoTrail', onChange);

		// 主动调用一次 onChange()，确保默认值也被写出去
		// 如果不手动调用，只有在用户修改输入框时才会触发
		// 调用一次，就能立刻把默认值也同步出去，相当于“初始化时也触发一次更新”。
		onChange();
	},

	// 关闭监听
	sleep() {
		if (inp) inp.off('change');
	},

	// 外部拿到输入框
	getWidget() {
		return inp;
	},

	//返回真正的经纬度数值（不是字符串，而是 {lat: xxx, lon: xxx} 这样的对象）。
	getLoc() {
		return loc.getLoc();
	},

};

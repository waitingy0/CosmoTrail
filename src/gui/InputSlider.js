import $ from 'jquery';
import ExportValues from './ExportValues';

export default class InputSlider {

	constructor(id, defaultVal, onChange, { min = 1, max = 100, step = 1 }, gui) {

		// min、max、step：范围和步长
		this.slider = $(`<input type ="range" min="${min}" max="${max}" step="${step}" value ="${defaultVal}"/>`);

		// 当滑条被拖动时，获取当前值，存到 ExportValues，调用外部传进来的 onChange 回调
		this.slider.off('input').on('input.CosmoTrail', () => {
			const val = this.slider.val();
			ExportValues.setVal(id, val);
			onChange(val);
		});


		// 如果有默认值，就注册一个回调，在 GUI 初始化时自动设置它
		if (defaultVal) {
			gui.pushDefaultsCallbacks(() => {
				this.setSlideValue(defaultVal);
				onChange(defaultVal);
			});
		}

		// 一开始就把默认值存进去
		ExportValues.setVal(id, defaultVal);

	}

	// 返回 HTML 元素，放到界面上
	getWidget() {
		return this.slider;
	}

	// 可以在代码里手动修改滑条的值
	setSlideValue(val) {
		this.slider.val(val);
	}
	
}

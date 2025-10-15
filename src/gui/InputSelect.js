import $ from 'jquery';
import ExportValues from './ExportValues';

export default class InputSelect {

	constructor(id, defaultVal, callback, gui) {
		this.id = id;
		this.gui = gui;
		this.input = $(`<input id="${id}_inp">`).on('change.CosmoTrail', callback);
		this.display = $('<div class="display">');
		this.list = $(`<ul id="${id}">`);
		this.options = {};

		this.defaultVal = defaultVal;
	}

	// 控件两个东西组成：显示区 + 下拉菜单
	getWidget() {
		return [this.display, this.list];
	}
	
	// 添加选项
	//label 显示文本  val 实际值  isSelected：标记该选项是否 “默认选中”；
	addOption(label, val, isSelected, isAutoExecute = true) {

		// this指向当前类的实例
		const option = this.options[val] = $(`<li data-value="${val}">${label}</li>`);
		
		// 事件绑定语法，给上面创建的<li>选项绑定click事件
		// click：事件名称（点击事件）
		// .CosmoTrail：事件命名空间 用于后续精准解绑（如option.off('click.CosmoTrail')）
		// this.clickHandler 事件处理函数 —— 点击选项时，会执行当前实例（this）上的clickHandler方法
		option.on('click.CosmoTrail', this.clickHandler);

		if (this.list.children().length === 0) {
			this.input.val(val);
			this.display.html(label);
			ExportValues.setVal(this.id, val);
		}

		option.appendTo(this.list);
		if (isSelected || this.defaultVal === val) {
			this.gui.pushDefaultsCallbacks(() => {
				this.listClicked(option, isAutoExecute);
			});
		}

	}

	toggleOptions(toToggle, isShow) {
		const options = this.options;
		const toggleFcn = isShow ? 'removeClass' : 'addClass';
		const curVal = this.input.val();
		// if (!isShow && ~toToggle.indexOf(curVal)) {
		// 	selects[selectName].input.val('');
		// }
		// toToggle.forEach((optId) => {
		// 	if (options[optId]) options[optId][toggleFcn]('disabled');
		// });
	}

	// 直接拿 <input> 里的值
	getValue() {
		return this.input.val();
	}

	//更新显示区文字
	// 更新 <input> 的值
	// 触发 change，让外部知道值变了，存到全局 ExportValues
	listClicked(clickedOption, triggerEvent = true) {
		const val = clickedOption.data('value');
		this.display.html(clickedOption.html());
		if (triggerEvent) this.input.val(val).trigger('change');
		ExportValues.setVal(this.id, val);
	}

	clickHandler = (e) => {
		this.listClicked($(e.currentTarget));
	}
	
}

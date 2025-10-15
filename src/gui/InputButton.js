import $ from 'jquery';	//给引入的 jQuery 库起一个别名$

const FA = 'fa ';	//Font Awesome 的类名前缀，尾部包含空格
const BTNS_CLASS = {		//按 button 的 id给出初始 CSS 类或切换用的两个类
	share: FA + 'fa-share-alt',
	start: [FA + 'fa-play-circle', FA + 'fa-pause-circle'],
};
//根据传入的 id 决定按钮初始样式 & 切换行为

export default class InputButton {

	// labelTx：按钮显示的文本
	constructor(labelTx, id, onClick, key) {

		const classNames = BTNS_CLASS[id];
		let classOff;
		let classOn;
		if (classNames instanceof Array) {
			classOff = classNames[0];		//按钮的“初始样子”
			classOn = classNames[1];		//按钮切换后的“另一个样子”
		} else {
			classOff = classNames;
		}

		//按钮有图标显示图标，没有图标就显示文字
		const label = classOff ? '&nbsp;' : labelTx;
		let status = false;

		//创建按钮 DOM（jQuery）并设置初始 class / id / label
		this.btn = $(`<button class="${classOff}" id="${id}">${label}</button>`);
		this.btn.on('click.CosmoTrail', (e) => {
			e.stopPropagation();
			onClick();
			status = !status;
			const targetClass = (status && classOn) || classOff;
			this.btn.attr('class', targetClass);
		});

		if (key) {
			const keyCode = key.toUpperCase().charCodeAt(0);
			$(window).on('keyup.CosmoTrail', (e) => {
				// console.log(e.keyCode, keyCode);
				// console.log(String.fromCharCode(e.keyCode), String.fromCharCode(keyCode));
				if (e.keyCode === keyCode) this.btn.trigger('click');
			});
		}

	}

	// 调用 getWidget()，拿到这个按钮的真实元素，然后把它放到页面上
	getWidget() {
		return this.btn;
	}

}

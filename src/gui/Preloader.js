
// 页面加载时的过渡动画（加载遮罩层）
import { TweenMax } from 'gsap';
import Promise from 'bluebird';



export default class Preloader {
	
	//getNode 函数用来缓存并返回这个加载层节点
	constructor(rootElement) {
		let preloader;
		this.getNode = () => {
			if (preloader) return preloader;
			preloader = rootElement.getElementsByClassName('preload');
			preloader = preloader && preloader[0];
			return preloader;
		}
	}

	// remove()：隐藏加载层
	// .preload 元素的透明度在 0.5 秒内变为 0 display，设置为 none，返回一个 Promise
	remove() {
		const node = this.getNode();
		if (!node) return Promise.resolve();
		return new Promise(resolve => {
			TweenMax.to(node, 0.5, {
				opacity: 0,
				onComplete() {
					node.style.display = 'none';
					resolve();
				},
			});
		});
	}

	//show()：显示加载层，先把 .preload 显示出来，再做一个 0.5 秒的淡入动画。
	show() {
		const node = this.getNode();
		if (!node) return;
		TweenMax.killTweensOf(node);
		node.style.display = 'block';
		TweenMax.to(node, 0.5, { opacity: 1 });
	}
};

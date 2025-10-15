
//CosmoTrail 项目 的 入口核心:CosmoTrail 应用壳子
/*
这是顶层入口，负责：
解析 URL 参数
初始化 GUI
管理场景（场景 = 一个 Universe）
切换 Scenario（场景配置）
*/

import $ from 'jquery';
import Gui, { SCENARIO_ID} from '../gui/Gui';
// import Sharer from '../gui/Sharer';
import Universe from './Universe';
import Preloader from '../gui/Preloader';
import ScenarioLoader from '../scenario/Loader';

// 从 window.location.search 里解析 ?param=value 参数
// 转成对象，作为默认配置
// 特别处理了 相机参数（cx, cy, cz, fov） → 可以通过 URL 控制初始相机位置

// 把浏览器地址栏的 ?a=1&b=2 解析成对象，比如 ?scenario=solar → {scenario: "solar"}
// 特别处理 cx,cy,cz,fov：如果 URL 给了相机位置，就把它放到 cameraSettings 中
function getInitialSettings() {
	const parts = window.location.search.substr(1).split('&');
	const qstr = parts.reduce((carry, part) => {
		const pair = part.split('=');
		carry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
		return carry;
	}, (window.CosmoTrail && window.CosmoTrail.defaults) || {});

	if (typeof qstr.cx !== 'undefined') {
		qstr.cameraSettings = {
			x: qstr.cx,
			y: qstr.cy,
			z: qstr.cz,
			fov: qstr.fov,
		};
	} 

	return qstr;
}


export default class CosmoTrail {
	constructor(rootElementId) {
		
		// rootElement：渲染根 DOM。没有 id 就用 document.body
		// Preloader：加载时显示的转圈或遮罩；这里先创建、然后立即 remove()（可能示例里不需要一直显示）。
		this.rootElement = (rootElementId && document.getElementById(rootElementId)) || document.body;
		this.preloader = new Preloader(this.rootElement);

		this.preloader.remove();
		this.gui = new Gui();

		//GUI 的默认值来自 URL 或项目默认值
		const defaultParams = Object.assign({}, getInitialSettings());
		this.gui.setDefaults(defaultParams);

		//从 ScenarioLoader 拿到可用场景（通常是多个 JSON 配置，每个代表一种演示，如“太阳系”）
		// 在 GUI 上增加下拉框（选择场景），并给下拉绑定回调：选择变化时加载相应场景
		const scenarios = ScenarioLoader.getList();
		const scenarioChanger = this.gui.addDropdown(SCENARIO_ID, () => {
			this.preloader.show();
			this.loadScenarioFromName(scenarioChanger.getValue());
			console.log(scenarioChanger)
		}, false);


		//把场景项加入下拉，选中默认项（来自 URL 或第一个场景）
		const defaultScenario = scenarios.reduce((carry, scenario, idx) => {
			//find ID of loaded scenario
			if (defaultParams.scenario && scenario.name === defaultParams.scenario) {
				return idx;
			}
			return carry;
		}, 0);	

		//add scenarios to dropdown. Last param prevents callback from being executed on ready, as we already have the correct scenario loaded as default, we don't need to auto reload it when assets are ready.
		scenarios.forEach((scenario, idx) => {
			scenarioChanger.addOption(scenario.title, scenario.name, idx === defaultScenario, false);
		});



		//暴露一个方法：加载默认场景（页面初始化时会调用）。
		this.loadDefaultScenario = () => {
			this.loadScenarioFromName(scenarios[defaultScenario].name, defaultParams);
		}

		
	}

	// 检查：如果已经加载了相同场景，直接返回
	// 否则从 ScenarioLoader 取出场景配置对象（通常包含天体数据、相机信息、是否使用物理模拟等），交给 loadScenario。
	loadScenarioFromName(name, defaultParams) {
		if (this.activeScenario && name === this.activeScenario.name) {
			this.preloader.remove();
			return;
		}
		const scenarioConfig = ScenarioLoader.get(name);
		this.loadScenario(scenarioConfig, defaultParams);
	}

	loadScenario(scenarioConfig, defaultParams) {

		if (this.activeScenario) {
			this.activeScenario.kill();
		}
		if (!scenarioConfig) return Promise.resolve(null);
		this.activeScenario = new Universe(this.rootElement, scenarioConfig, defaultParams, this.gui);
		return this.activeScenario.onSceneReady.then(() => this.preloader.remove()).catch((e) => {
			console.log(e);	// eslint-disable-line
		}).then(() => {
			return this.activeScenario;
		});
	}
};

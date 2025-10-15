//用于存储和管理应用程序状态的模块
// 主要功能是保存键值对数据和相机信息，并能将这些数据整合为一个对象导出
let vals = {};
let cam;

export default {
	//重置
	reset() {
		vals = {};
	},

	//存储键值对数据
	setVal(k, v) {
		vals[k] = v;
	},

	//保存相机对象引用
	setCamera(camera) {
		cam = camera;
	},

	//返回一个合并对象
	getExport() {
		return Object.assign({}, vals, { cx: cam.position.x, cy: cam.position.y, cz: cam.position.z, fov: cam.fov });
	},
};

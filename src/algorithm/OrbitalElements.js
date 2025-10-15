
//通用轨道计算器
import { Vector3, Euler, Quaternion } from 'three';

import { sinh, sign, cosh } from './Math';
import { getJ2000SecondsFromJD } from '../utils/JD';
import { G, CENTURY, DAY, KM, DEG_TO_RAD, CIRCLE, AU, J2000 } from '../core/constants';

//用开普勒方程迭代法求解偏心近点角E
function solveEccentricAnomaly(f, x0, maxIter) {
		
	let x = 0;
	let x2 = x0;
	
	for (let i = 0; i < maxIter; i++) {
		x = x2;
		x2 = f(x);
	}
	
	return x2;
}

//没有解析解，需要数值迭代 牛顿迭代法
function solveKepler(e, M) {
	return (x) => {
		return x + (M + e * Math.sin(x) - x) / (1 - e * Math.cos(x));
	};
}
/*
Laguerre-Conway 方法：
收敛速度更快
支持高偏心率 (𝑒→1) 的椭圆轨道

Hyp 是双曲轨道（开普勒方程换成双曲函数：sinh,cosh）*/
function solveKeplerLaguerreConway(e, M) {
	return (x) => {
		const s = e * Math.sin(x);
		const c = e * Math.cos(x);
		const f = x - s - M;
		const f1 = 1 - c;
		const f2 = s;

		return x + (-5 * f / (f1 + sign(f1) * Math.sqrt(Math.abs(16 * f1 * f1 - 20 * f * f2))));
	};
}

function solveKeplerLaguerreConwayHyp(e, M) {
	return (x) => {
		const s = e * sinh(x);
		const c = e * cosh(x);
		const f = x - s - M;
		const f1 = c - 1;
		const f2 = s;

		return x + (-5 * f / (f1 + sign(f1) * Math.sqrt(Math.abs(16 * f1 * f1 - 20 * f * f2))));
	};
}
//主模块
//orbitalElements = 轨道六要素（a, e, i, Ω, ω, M）
//calculator = 计算轨道要素随时间变化的函数
//positionCalculator = 直接计算精确位置的函数（慢但精确）
export default {
	setDefaultOrbit(orbitalElements, calculator, positionCalculator) {
		this.orbitalElements = orbitalElements;
		if (orbitalElements && orbitalElements.epoch) {
			this.epochOffsetFromJ2000 = getJ2000SecondsFromJD(orbitalElements.epoch);
		}
		this.calculator = calculator;
		this.positionCalculator = positionCalculator;
	},

	setName(name) {
		this.name = name;
	},

	setRelativeTo(body) {
		this.relativeTo = body;
	},

	//计算天体速度（向量）
	calculateVelocity(jd) {
		if (!this.orbitalElements) return new Vector3(0, 0, 0);

		let eclipticVelocity;
		
		//没有中心天体 → 用两点差分法算速度
		if (!this.relativeTo) {
			const pos1 = this.calculatePosition(jd);
			const pos2 = this.calculatePosition(jd + 60 / DAY);
			eclipticVelocity = pos2.sub(pos1).multiplyScalar(1 / 60);
		
		} else {
			//vis viva to calculate speed (not velocity, i.e not a vector)
			//有中心天体 → 用 vis-viva 方程算速率
			const el = this.calculateElements(jd);
			const speed = Math.sqrt(G * this.relativeTo.mass * ((2 / (el.r)) - (1 / (el.a))));

			//now calculate velocity orientation, that is, a vector tangent to the orbital ellipse
			const k = el.r / el.a;
			let o = ((2 - (2 * el.e * el.e)) / (k * (2 - k))) - 1;
			//floating point imprecision
			o = o > 1 ? 1 : o;
			let alpha = Math.PI - Math.acos(o);
			alpha = el.v < 0 ? (2 * Math.PI) - alpha : alpha;
			const velocityAngle = el.v + (alpha / 2);
			//velocity vector in the plane of the orbit
			const orbitalVelocity = new Vector3(Math.cos(velocityAngle), Math.sin(velocityAngle)).setLength(speed);
			const velocityEls = Object.assign({}, el, { pos: orbitalVelocity, v: null, r: null });
			eclipticVelocity = this.getPositionFromElements(velocityEls);
		}

		//var diff = eclipticVelocityFromDelta.sub(eclipticVelocity);console.log(diff.length());
		return eclipticVelocity;
		
	},

	//计算轨道位置
	calculatePosition(jd, maxPrecision, isDbg) {
		if (!this.orbitalElements) return new Vector3(0, 0, 0);
		//position calculators are very slow, we use them only when requested
		if (this.positionCalculator && maxPrecision) {
			const pos = this.positionCalculator(jd);
			// console.log(this.name, jd, pos.x, pos.y, pos.z);
			return pos;
		}
		const computed = this.calculateElements(jd, isDbg);
		const pos = this.getPositionFromElements(computed);
		if (isDbg) console.log(this.name, pos.x, pos.y, pos.z, jd);		
		return pos;
	},

	//调度不同算法解开普勒方程
	solveEccentricAnomaly(e, M) {
		if (e === 0.0) {
			return M;
		} else if (e < 0.9) {
			return solveEccentricAnomaly(solveKepler(e, M), M, 6);
		} else if (e < 1.0) {
			const E = M + 0.85 * e * ((Math.sin(M) >= 0.0) ? 1 : -1);
			return solveEccentricAnomaly(solveKeplerLaguerreConway(e, M), E, 8);
		} else if (e === 1.0) {
			return M;
		}
		
		const E = Math.log(2 * M / e + 1.85);
		return solveEccentricAnomaly(solveKeplerLaguerreConwayHyp(e, M), E, 30);
	},

	//计算某一时刻的轨道要素
	calculateElements(jd, isDbg) {
		if (!this.orbitalElements) return null;

		const orbitalElements = this.orbitalElements;

		/*

		Epoch : J2000

		a 	Semi-major axis
		e 	Eccentricity
		i 	Inclination
		o 	Longitude of Ascending Node (Ω)
		w 	Argument of periapsis (ω)
		E 	Eccentric Anomaly
		T 	Time at perihelion
		M	Mean anomaly
		l 	Mean Longitude
		lp	longitude of periapsis
		r	distance du centre
		v	true anomaly

		P	Sidereal period (mean value)
		Pw	Argument of periapsis precession period (mean value)
		Pn	Longitude of the ascending node precession period (mean value)

		*/
		if (isDbg) console.log('========================');
		let correctedTimeEpoch = getJ2000SecondsFromJD(jd);
		if (isDbg) console.log(correctedTimeEpoch, this.epochOffsetFromJ2000);
		if (this.epochOffsetFromJ2000) {
			correctedTimeEpoch -= this.epochOffsetFromJ2000;
		}

		const tDays = correctedTimeEpoch / DAY;
		const T = tDays / CENTURY;
		if (isDbg) console.log('jd %s, tDays %s, T %s', jd, tDays, T);
		if (isDbg) console.log('jd epoch %s', orbitalElements.epoch);

		let computed = {
			t: correctedTimeEpoch,
		};

		if (this.calculator) {
			const realorbit = this.calculator(T);
			Object.assign(computed, realorbit);
		} else {

			if (orbitalElements.base) {
				let variation;
				const keys = orbitalElements.keys = orbitalElements.keys || Object.keys(orbitalElements.base);
				computed = keys.reduce((carry, el) => {
					//cy : variation by century.
					//day : variation by day.
					variation = orbitalElements.cy ? orbitalElements.cy[el] : (orbitalElements.day[el] * CENTURY);
					variation = variation || 0;
					carry[el] = orbitalElements.base[el] + (variation * T);
					return carry;
				}, computed);
			} else {
				computed = Object.assign({}, orbitalElements);
			}

			if (undefined === computed.w) {
				computed.w = computed.lp - computed.o;
			}

			if (undefined === computed.M) {
				computed.M = computed.l - computed.lp;
			}

			computed.a *= KM;//was in km, set it in m
		}

		if (isDbg) console.log('M %s, e %s, i %s, o %s, w %s', computed.M, computed.e, computed.i, computed.o, computed.w);
		computed.i *= DEG_TO_RAD;
		computed.o *= DEG_TO_RAD;
		computed.w *= DEG_TO_RAD;
		computed.M *= DEG_TO_RAD;

		computed.E = this.solveEccentricAnomaly(computed.e, computed.M);
		
		computed.E %= CIRCLE;
		computed.i %= CIRCLE;
		computed.o %= CIRCLE;
		computed.w %= CIRCLE;
		computed.M %= CIRCLE;
		
		//in the plane of the orbit
		computed.pos = new Vector3(computed.a * (Math.cos(computed.E) - computed.e), computed.a * (Math.sqrt(1 - (computed.e * computed.e))) * Math.sin(computed.E));
		if (isDbg) console.log('E %s, e %s, M %s, i %s', computed.E, computed.e, computed.M, computed.i);
		if (isDbg) console.log('x %s, y %s, z %s, a %s', computed.pos.x, computed.pos.y, computed.pos.z, computed.a);
		

		computed.isDbg = isDbg;
		computed.r = computed.pos.length();
		computed.v = Math.atan2(computed.pos.y, computed.pos.x);
		//if orbital elements are computed relative to a body, we need to tilt the orbit according to this body's tilt (for example satellites around the earth) Some though are positionned relative to another, but oriented relative to the universe
		if (this.orbitalElements.tilt !== false && this.relativeTo && this.relativeTo.tilt) {
			computed.tilt = -this.relativeTo.tilt * DEG_TO_RAD;
		}
		return computed;
	},

	//把二维轨道平面位置旋转到三维空间：
	// 用 Euler 角和 Quaternion 表示轨道倾角、升交点、近心点参数，最终得到 天球坐标。
	getPositionFromElements(computed) {
		if (computed.x) return computed;
		if (!computed) return new Vector3(0, 0, 0);

		// const a1 = new Euler(0, 0, computed.o, 'XYZ');
		const a1 = new Euler(computed.tilt || 0, 0, computed.o, 'XYZ');
		const q1 = new Quaternion().setFromEuler(a1);
		const a2 = new Euler(computed.i, 0, computed.w, 'XYZ');
		const q2 = new Quaternion().setFromEuler(a2);

		const planeQuat = new Quaternion().multiplyQuaternions(q1, q2);
		computed.pos.applyQuaternion(planeQuat);
		const d = computed.pos.clone().normalize();
		
		return computed.pos;
	},

	//根据开普勒第三定律计算轨道周期
	calculatePeriod(elements) {
		let period;
		if (this.orbitalElements && this.orbitalElements.day && this.orbitalElements.day.M) {
			period = 360 / this.orbitalElements.day.M;
		} else if (this.relativeTo && this.relativeTo.k && elements) {
			period = 2 * Math.PI * Math.sqrt(((elements.a / (AU * 1000)) ** 3)) / this.relativeTo.k;
		}
		period *= DAY;//in seconds
		return period;
	},
};

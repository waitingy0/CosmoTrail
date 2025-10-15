import { Vector3 } from 'three';
import { G } from '../core/constants';

export default {
	/**
	Calculates the forces that are created by each body toward one another
	*/
	calculateGForces(bodies) {
		//创建一个临时向量 workVect，用来存储计算过程中的力
		let workVect = new Vector3();

		for (let i = 0; i < bodies.length; i++) {
			//初始合力为 0，后续叠加计算各个天体的引力
			if (!i) bodies[i].force.x = bodies[i].force.y = bodies[i].force.z = 0;
			for (let j = i + 1; j < bodies.length; j++) {
				
				if (!i) bodies[j].force.x = bodies[j].force.y = bodies[j].force.z = 0;
				//如果两个物体质量都是 1（可能代表“忽略引力”的虚拟物体），skip
				//如果两个物体都标记了 useCustomComputation（可能需要自定义引力逻辑），skip
				const skipComputation = (
					(bodies[i].mass === 1 && bodies[j].mass === 1)
					||
					(bodies[i].useCustomComputation && bodies[j].useCustomComputation) 
				);

				//调用公式函数 计算引力向量，存入 workVect
				if (!skipComputation) {
					workVect = this.getGForceBetween(bodies[i].mass, bodies[j].mass, bodies[i].position, bodies[j].position);
					//add forces (for the first body, it is the reciprocal of the calculated force)
					bodies[i].force.sub(workVect);
					bodies[j].force.add(workVect);
					/*
					i 受到的是 反方向的力（sub 表示减去 workVect）
					j 受到的是 正方向的力（add 表示加上 workVect）
					*/
				}
			}
		}
	},
	/**
	Get the gravitational force in Newtons between two bodies (their distance in m, mass in kg)
	*/

	getGForceBetween(mass1, mass2, pos1, pos2) {
		
		const workVect = new Vector3();
		
		// vector is between positions of body A and body B
		// 计算位置差向量 表示从物体2指向物体1的方向
		workVect.copy(pos1).sub(pos2);
		
		//计算距离平方
		const dstSquared = workVect.lengthSq();

		//质量乘积
		const massPrd = mass1 * mass2;
		
		//in newtons (1 N = 1 kg*m / s^2)
		//计算引力大小
		const Fg = G * (massPrd / dstSquared);

		// 单位化，得到方向向量
		workVect.normalize();
		
		//vector is now force of attraction in newtons
		//方向向量 × 力的大小，得到最终的力向量
		workVect.multiplyScalar(Fg);
		
		return workVect;
	},
};

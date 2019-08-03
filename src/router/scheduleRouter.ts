import * as express from 'express';
import result from '../module/result';
import cityController from '../controller/cityController';
import scheduleController from '../controller/scheduleController';
import util from '../util';
import {
    shortPathByFloyd,
    allocatPathForVehicle,
    calCost,
    minCost,
    combineVehicleOrderOptimizeConsiderHasTask,
    fillOriginOrderForCombine
} from '../arithmetic'

const router = express.Router();

router.get('/schedule',(req: any,res: any) => {
    Promise.all([
        scheduleController.getOrderByStatus(),
        scheduleController.getCanScheduleVehicleList(),
        cityController.getAllCity()
    ]).then((response: any) => {
        let orderList = response[0],
            vehicleList = response[1],
            cityList = response[2],
            vehicleIdToIndex: any = {},
            orderDetail: any = {},
            vehicleDetail: any = {},
            cityIdToIndex: any = {};
        // 整理车辆列表
        vehicleList.map((vehicleItem: any, vehicleIndex: number) => {
            vehicleItem.currentLoad = vehicleItem.currentLoad ? vehicleItem.currentLoad : 0;
            vehicleItem.currentVolume = vehicleItem.currentVolume ? vehicleItem.currentVolume : 0;
            vehicleIdToIndex[vehicleItem.id] = vehicleIndex;
            vehicleDetail[vehicleItem.vehicleId] = {
                oil: vehicleItem.oil,
                speed: vehicleItem.baseSpeed,
                currentAddressCityId: vehicleItem.currentCityId,
                finishAddressCityId: vehicleItem.finishCityId,
                driverCost: 100
            }
            delete vehicleItem.oil;
            delete vehicleItem.baseSpeed;
            delete vehicleItem.currentCityId;
            delete vehicleItem.finishCityId;
        });
        // 整理订单列表
        orderList.map((orderItem: any) => {
            if(orderItem.vehicleId){
                let orderIds = vehicleDetail[orderItem.vehicleId].orderIds ? vehicleDetail[orderItem.vehicleId].orderIds : [],
                    midwayCityIds = vehicleDetail[orderItem.vehicleId].midwayCityIds ? vehicleDetail[orderItem.vehicleId].midwayCityIds : [];
                vehicleDetail[orderItem.vehicleId].orderIds = orderIds.concat(orderItem.orderId);
                vehicleDetail[orderItem.vehicleId].midwayCityIds = midwayCityIds.concat(orderItem.startCityId, orderItem.targetCityId);
            }
            orderDetail[orderItem.orderId] = {
                money: orderItem.money,
                startCityId: orderItem.startCityId,
                targetCityId: orderItem.targetCityId,
                targetDate: orderItem.targetDate
            }
            delete orderItem.money;
            delete orderItem.targetDate;
        })
        // 整理城市点信息
        let {links, nodes} = util.getDistance(cityList);
        nodes.map((item: any, index: number) => {
            cityIdToIndex[item.id] = index;
        })
        // 路径信息 json 化
        let linksJson: any = {};
        links.map((item: any) => {
            let key = `${item.source}-${item.target}`;
            linksJson[key] = item.distance;
        });
        // 城市点路由表
        let { dis, shortPath } = shortPathByFloyd(nodes, linksJson);
        // 数据 深拷贝
        let vehicleListCopy = vehicleList.map((item: any) => {
            let itemCopy = {...item};
            return itemCopy;
        })
        // 车辆与订单的组合
        let combineResult = combineVehicleOrderOptimizeConsiderHasTask(vehicleListCopy, orderList);
        // 填充已有任务的车辆的当前未完成的订单 和 路线
        combineResult = fillOriginOrderForCombine(combineResult, vehicleDetail);
        // 车辆分配路径
        combineResult = allocatPathForVehicle(combineResult, cityIdToIndex, dis, shortPath, vehicleDetail);
        // 计算成本
        let combineCost = calCost(combineResult, vehicleDetail, dis, orderDetail, cityIdToIndex);
        // 成本最小的方案
        let minCostPlan = minCost(combineCost);
        res.send(result(0,'success',minCostPlan));
    }).catch((error: any) => {
        console.log(error);
        res.send(result(1,error,error));
    })
})

export default router;
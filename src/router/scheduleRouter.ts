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

// 已废弃采用websocket实现  订单自动调度
router.get('/autoSchedule',(req: any,res: any) => {
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
                driverCost: vehicleItem.driverPay
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
        // console.log(combineResult.length);
        // 填充已有数据
        combineResult = fillOriginOrderForCombine(combineResult, vehicleDetail);
        // 车辆分配路径
        combineResult = allocatPathForVehicle(combineResult, cityIdToIndex, dis, shortPath, vehicleDetail);
        // 计算成本
        let combineCost = calCost(combineResult, vehicleDetail, dis, orderDetail, cityIdToIndex);;
        // 成本最小的方案
        let minCostPlan = minCost(combineCost);
        res.send(result(0,'success',minCostPlan));
    }).catch((error: any) => {
        console.log(error);
        res.send(result(1,error,error));
    })
})

// 获取调度详情
router.get('/detail', (req: any, res: any) => {
    Promise.all([
        scheduleController.getVehicleUsageRate(),
        scheduleController.getLoadRate(),
        scheduleController.getCostRate(),
        scheduleController.getUndisposedOrder()
    ]).then((response: any) => {
        let detail: any = {};
        let { usedNumber, allCount } = response[0][0];
        if(usedNumber === 0)
            detail.vehicleUsedRate = 0;
        else
            detail.vehicleUsedRate = (usedNumber / allCount * 100).toFixed(1);
        let { maxLoad, currentLoad } = response[1][0];
        if(!maxLoad || !currentLoad)
            detail.notLoadRate = 0;
        else
            detail.notLoadRate = (((maxLoad - currentLoad) / maxLoad) * 100).toFixed(1);
        let oilCost = 0,
            punishCost = 0,
            peopleCost = 0;
        if(response[2][0]){
            oilCost = response[2][0].oilCost;
            punishCost = response[2][0].punishCost;
            peopleCost = response[2][0].peopleCost;
        }
        detail.costRate = {
            oilCost,
            punishCost,
            peopleCost
        }
        let { count } = response[3][0];
        detail.undisposedOrderCount = count;
        res.send(result(0,'success',detail));
    }).catch((error: any) => {
        res.send(result(1,'error',error));
    })
})

// 分页获取调度车辆信息
router.get('/current', (req: any, res: any) => {
    scheduleController.getCurrentSchedulePlan()
        .then((response: any) => {
            res.send(result(0,'success',response));
        })
        .catch((error: any) => {
            console.log(error);
            res.send(result(1,'error',error));
        })
})

// 根据车辆id 获取车辆的调度信息
router.get('/vehicleSchedule/:id', (req: any, res: any) => {
    let id = req.params.id;
    if(!id){
        return res.send(result(1,'error','id 不为空'));
    }
    Promise.all([
        scheduleController.getVehicleDrivers(id),
        scheduleController.getVehicleOrders(id),
        scheduleController.getVehicleRoutes(id)
    ]).then((response: any) => {
        res.send(result(0,'success',{
            drivers: response[0],
            orders: response[1],
            routes: response[2]
        }))
    }).catch((error: any) => {
        res.send(result(1, 'error', error));
    })
})

export default router;
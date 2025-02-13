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
    fillOriginOrderForCombine,
    calDistanceByShortPath
} from '../arithmetic'
import client from '../common/redisClient';

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
        console.log(combineResult.length);
        // 填充已有数据
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

router.get('/test',(req: any,res: any) => {
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
        console.log(combineResult.length);
        // 分批存缓存
        if(combineResult.length > 1000){
            let count: number = 0;
            while(combineResult.length > 1000){
                let item = combineResult.splice(0,1000);
                client.setAsync(`combine${count}`,JSON.stringify(item));
                count++;
            }
            client.setAsync(`combine${count}`,JSON.stringify(combineResult));
            let costPlanList: any = [];
            new Promise((resolve: any) => {
                for(let i = 0; i <= count; i++){
                    new Promise((resolveInner: any, reject: any) => {
                        client.getAsync(`combine${i}`)
                            .then((combineItem: any) => {
                                let childCombineResult = JSON.parse(combineItem);
                                childCombineResult = fillOriginOrderForCombine(childCombineResult, vehicleDetail);
                                childCombineResult = allocatPathForVehicle(childCombineResult, cityIdToIndex, dis, shortPath, vehicleDetail);
                                let combineCost = calCost(childCombineResult, vehicleDetail, dis, orderDetail, cityIdToIndex);
                                let minCostPlan = minCost(combineCost);
                                costPlanList.push(minCostPlan);
                                resolveInner();
                            })
                    }).then(() => {
                        if(i === count){
                            resolve();
                        }
                    })
                }
            }).then(() => {
                let minCostPlan = minCost(costPlanList);
                res.send(result(0, 'success', minCostPlan));
            })
        } else {
            // 填充已有数据
            combineResult = fillOriginOrderForCombine(combineResult, vehicleDetail);
            // 车辆分配路径
            combineResult = allocatPathForVehicle(combineResult, cityIdToIndex, dis, shortPath, vehicleDetail);
            // 计算成本
            let combineCost = calCost(combineResult, vehicleDetail, dis, orderDetail, cityIdToIndex);
            // 成本最小的方案
            let minCostPlan = minCost(combineCost);
            res.send(result(0,'success',minCostPlan));
        }
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

// 手动调度计算成本
router.post('/manual/cost', (req: any, res: any) => {
    let combineResult = JSON.parse(req.body.combineResult);
    // 过滤路径
    combineResult.forEach((combineItem: any) => {
        let shortPath = combineItem.shortPath, filteredPath: any = [];
        shortPath.forEach((pathItem: number, pathIndex: number) => {
            if(pathIndex === 0)
                filteredPath.push(pathItem);
            else{
                if(pathItem !== filteredPath[filteredPath.length - 1]){
                    filteredPath.push(pathItem);
                }
            }
        });
        combineItem.shortPath = filteredPath;
    });
    Promise.all([
        scheduleController.getOrderByStatus(true),
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
        // 计算路径
        combineResult = calDistanceByShortPath(combineResult,cityIdToIndex,dis);
        // 计算成本
        let combineCost = calCost([combineResult], vehicleDetail, dis, orderDetail, cityIdToIndex);
        res.send(result(0, 'success', combineCost));
    }).catch((error: any) => {
        console.log(error);
        res.send(result(1,'error',error));
    })
});

// 确认手动调度
router.post('/manual', (req: any, res: any) => {
    let minCostPlan = JSON.parse(req.body.minCostPlan);
    scheduleController.addSchedule({
        scheduleTime: new Date(),
        scheduleType: 'artificial',
        schedulePeople: 1,
        oilCost: minCostPlan.oilCost,
        punishCost: minCostPlan.timePunish,
        peopleCost: minCostPlan.driverCost,
        createTime: new Date(),
        updateTime: new Date()
    }).then((response: any) => {
        util.createTimeSchedule(minCostPlan);
        res.send(result(0,'调度成功',null));
    }).catch((error: any) => {
        console.log(error);
        res.send(result(1, 'error', error));
    })
})

export default router;
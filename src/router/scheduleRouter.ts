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
import { updateSchedule, scheduleList } from '../util/scheduleCommon';

const router = express.Router();

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

// 初始化用于调度的车辆、订单、城市点等信息
router.post('/initScheduleResource', (req: any, res: any) => {
    Promise.all([
        scheduleController.getOrderByStatus(),
        scheduleController.getCanScheduleVehicleList(),
        cityController.getAllCity()
    ]).then((response: any) => {
        let orderList = response[0],
            vehicleList = response[1],
            cityList = response[2];
        res.send(result(0,'successs',{
            orderList,
            vehicleList,
            cityList
        }))
    }).catch((error: any) => {
        res.send(result(1,'error',error));
    })
})

// 计算车辆与订单的组合
router.post('/combineVehicleOrder', (req: any, res: any) => {
    let { vehicleListCopy, orderList } = req.body;
    if(!vehicleListCopy)
        return res.send(result(1,'error','vehicleListCopy不为空'));
    if(!orderList)
        return res.send(result(1,'error','orderList不为空'));
    let combineResult = combineVehicleOrderOptimizeConsiderHasTask(JSON.parse(vehicleListCopy), JSON.parse(orderList));
    res.send(result(0,'success',combineResult));
})

// 填充已有任务的车辆的当前未完成的订单 和 路线
router.post('/fillOrginSchedule', (req: any, res: any) => {
    let { combineResult, vehicleDetail } = req.body;
    if(!combineResult)
        return res.send(result(1,'error','combineResult不为空'));
    if(!vehicleDetail)
        return res.send(result(1,'error','vehicleDetail不为空'));
    let combineResultFillOrgin = fillOriginOrderForCombine(
        JSON.parse(combineResult),
        JSON.parse(vehicleDetail)
    );
    res.send(result(0,'success',combineResultFillOrgin));
})

// 车辆分配路径
router.post('/allocatPath', (req: any, res: any) => {
    let {
        combineResult,
        cityIdToIndex,
        dis,
        shortPath,
        vehicleDetail
    } = req.body;
    const checkNotNullFields = ['combineResult','cityIdToIndex','dis','shortPath','vehicleDetail'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!req.body[item]){
            error.push(`${item} 不为空`);
        }
    });
    if(error.length !== 0)
        return res.send(result(1, 'error', error));
    let allocatRes = allocatPathForVehicle(
        JSON.parse(combineResult),
        JSON.parse(cityIdToIndex),
        JSON.parse(dis),
        JSON.parse(shortPath),
        JSON.parse(vehicleDetail)
    );
    res.send(result(0,'success',allocatRes));
})

// 计算成本
router.post('/calCost', (req: any, res: any) => {
    let {
        combineResult,
        cityIdToIndex,
        dis,
        vehicleDetail,
        orderDetail
    } = req.body;
    const checkNotNullFields = ['combineResult','cityIdToIndex','dis','vehicleDetail','orderDetail'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!req.body[item]){
            error.push(`${item} 不为空`);
        }
    });
    if(error.length !== 0)
        return res.send(result(1, 'error', error));
    let combineCost = calCost(
        JSON.parse(combineResult),
        JSON.parse(vehicleDetail),
        JSON.parse(dis),
        JSON.parse(orderDetail),
        JSON.parse(cityIdToIndex)
    );
    res.send(result(0,'success', combineCost));
})

// 成本最小的方案
router.post('/getMinCostPlan', (req: any, res: any) => {
    let { combineCost } = req.body;
    if(!combineCost)
        return res.send(result(1,'error','combineCost不为空'));
    let minCostPlan = minCost(JSON.parse(combineCost));
    res.send(result(0,'success',minCostPlan));
})

export default router;
import scheduleController from '../controller/scheduleController';
import cityController from '../controller/cityController';
import util from '../util';
import {
    shortPathByFloyd,
    allocatPathForVehicle,
    calCost,
    minCost,
    combineVehicleOrderOptimizeConsiderHasTask,
    fillOriginOrderForCombine
} from '../arithmetic';
import { updateSchedule } from './scheduleCommon';

export default (ws: any) => {
    ws.send(JSON.stringify({
        code: 0,
        msg: '开始调度'
    }));
    let minCostPlan: any = {};
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
        ws.send(JSON.stringify({
            code: 0,
            msg: '整理车辆列表'
        }));
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
        ws.send(JSON.stringify({
            code: 0,
            msg: '整理订单列表'
        }));
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
        ws.send(JSON.stringify({
            code: 0,
            msg: '整理城市点信息'
        }));
        // 整理城市点信息
        let {links, nodes} = util.getDistance(cityList);
        nodes.map((item: any, index: number) => {
            cityIdToIndex[item.id] = index;
        })
        ws.send(JSON.stringify({
            code: 0,
            msg: '格式化路径信息'
        }));
        // 路径信息 json 化
        let linksJson: any = {};
        links.map((item: any) => {
            let key = `${item.source}-${item.target}`;
            linksJson[key] = item.distance;
        });
        ws.send(JSON.stringify({
            code: 0,
            msg: '获取路由表'
        }));
        // 城市点路由表
        let { dis, shortPath } = shortPathByFloyd(nodes, linksJson);
        // 数据 深拷贝
        let vehicleListCopy = vehicleList.map((item: any) => {
            let itemCopy = {...item};
            return itemCopy;
        })
        ws.send(JSON.stringify({
            code: 0,
            msg: '组合车辆与订单'
        }));
        // 车辆与订单的组合
        let combineResult = combineVehicleOrderOptimizeConsiderHasTask(vehicleListCopy, orderList);
        ws.send(JSON.stringify({
            code: 0,
            msg: '填充未完成的订单'
        }));
        // 填充已有任务的车辆的当前未完成的订单 和 路线
        combineResult = fillOriginOrderForCombine(combineResult, vehicleDetail);
        ws.send(JSON.stringify({
            code: 0,
            msg: '车辆分配路线'
        }));
        // 车辆分配路径
        combineResult = allocatPathForVehicle(combineResult, cityIdToIndex, dis, shortPath, vehicleDetail);
        ws.send(JSON.stringify({
            code: 0,
            msg: '计算各方案成本'
        }));
        // 计算成本
        let combineCost = calCost(combineResult, vehicleDetail, dis, orderDetail, cityIdToIndex);
        ws.send(JSON.stringify({
            code: 0,
            msg: '选择最优方案'
        }));
        // 成本最小的方案
        minCostPlan = minCost(combineCost);
        ws.send(JSON.stringify({
            code: 0,
            msg: '存储调度计划'
        }));
        return scheduleController.addSchedule({
            scheduleTime: new Date(),
            scheduleType: 'auto',
            oilCost: minCostPlan.oilCost,
            punishCost: minCostPlan.timePunish,
            peopleCost: minCostPlan.driverCost,
            createTime: new Date(),
            updateTime: new Date()
        })
    })
    .then((res: any) => {
        let scheduleId = res.insertId;
        let scheduleVehciles: any = [],
            scheduleOrders: any = [],
            scheduleRoutes: any = [];
        minCostPlan.vehicleOrder.map((item: any) => {
            let scheduleVehicleItem = [item.vehicleId, scheduleId, new Date(), new Date()];
            scheduleVehciles.push(scheduleVehicleItem);
            item.orderIds.map((orderItem: any) => {
                let scheduleOrderItem = [orderItem, item.vehicleId, scheduleId, new Date(), new Date()];
                scheduleOrders.push(scheduleOrderItem);
            });
            item.shortPath.map((routeItem: any) => {
                let scheduleRouteItem = [item.vehicleId, routeItem, scheduleId, new Date(), new Date()];
                scheduleRoutes.push(scheduleRouteItem);
            })
        })
        return Promise.all([
            scheduleController.addScheduleVehciles(scheduleVehciles),
            scheduleController.addScheduleOrders(scheduleOrders),
            scheduleController.addScheduleRoutes(scheduleRoutes)
        ])
    }).then((res: any) => {
        ws.send(JSON.stringify({
            code: 0,
            msg: '创建定时任务'
        }));
        let scheduleList: any = [];
        minCostPlan.vehicleOrder.forEach((vehicleItem: any) => {
            Object.keys(vehicleItem.timeTable).forEach((timeKey: string) => {
                let scheduleItem: any = {
                    vehicleId: vehicleItem.vehicleId,
                    targetTime: timeKey,
                    cityId: vehicleItem.timeTable[timeKey].cityId,
                    upOrderIds: vehicleItem.timeTable[timeKey].upOrderIds,
                };
                scheduleList.push(scheduleItem);
            })
        })
        updateSchedule(scheduleList);
        ws.send(JSON.stringify({
            code: 2,
            msg: '调度成功'
        }));
    })
    .catch((error: any) => {
        ws.send(JSON.stringify({
            code: 1,
            msg: error
        }));
    })
}
import util from '../util';

// 计算两点之间路径组合
const calShortestPath = (
    startCity: any,
    targetCity: any,
    midwayCity: any,
    linksJson: any,
    nodes: any,
) => {
    // 获取全排列
    let fullPermutation = util.filterCityPermutation(midwayCity.slice(0),[]);
    // startCity 为起点的路由表
    let startCityRouteTable = util.calShortRouter(linksJson, nodes, startCity);
    // 递归结束条件
    if(midwayCity.length === 0){
        let route = util.searchShortDistance(startCityRouteTable, startCity, targetCity);
        return [route];
    }
    // targetCIty 为起点的路由表
    let targetCityRouteTable = util.calShortRouter(linksJson, nodes, targetCity);
    let routes: any = [];
    // 遍历所有的中间节点组合
    for(let i = 0; i < fullPermutation.length; i++){
        let item = fullPermutation[i];
        // 中间城市的起始节点 目标节点
        let midwayStartCity = item[0],
            midwayTargetCity = item[item.length - 1];
        // 开始节点到第一个中间节点的距离及路线
        let startCityToMidwayFirst = util.searchShortDistance(startCityRouteTable, startCity, midwayStartCity);
        // 目标节点到最后一个中间节点的距离及路线
        let targetCityToMidwayLast = util.searchShortDistance(targetCityRouteTable, targetCity, midwayTargetCity);
        // 中间路线
        let midwayRoutes: any = [];
        if(item.length === 1){
            let route: any = [], distance: number = 0;
            route  = [startCityToMidwayFirst.route.concat(targetCityToMidwayLast.route[0])];
            distance = startCityToMidwayFirst.distance + targetCityToMidwayLast.distance;
            midwayRoutes.push({
                route,
                distance
            })
            return midwayRoutes;
        }else{
            let midwayOtherCity = item.slice(1,item.length - 1);
            midwayRoutes = calShortestPath(midwayStartCity,midwayTargetCity,midwayOtherCity,linksJson,nodes);
            midwayRoutes.forEach((item: any) => {
                let route: any = [], distance: number = 0;
                route  = [startCityToMidwayFirst.route[0]].concat(...(item.route),targetCityToMidwayLast.route[0]);
                distance = startCityToMidwayFirst.distance + item.distance + targetCityToMidwayLast.distance;
                routes.push({
                    route,
                    distance
                })
            })
        }
    }
    return routes;
}

// 车辆与订单组合
const combineVehicleOrder = (vehicleList: any, orderList: any): any => {
    if(orderList.length === 0)
        return [];
    let res: any = [],
        currentOrder: any = orderList[0],
        orderListCopy: any = orderList.slice(0);
    orderListCopy.shift();
    for(let i = 0; i < vehicleList.length; i++){
        let currentVehicle = vehicleList[i];
        if(currentVehicle.currentLoad + currentOrder.load > currentVehicle.maxLoad ||
            currentVehicle.currentVolume + currentOrder.volume > currentVehicle.maxVolume){
                continue;
        }
        let combineItem = {
            vehicle: currentVehicle,
            orders: [currentOrder],
            shouldPassCitys: [currentOrder.startCity, currentOrder.targetCity],
        }
        currentVehicle.currentLoad += currentOrder.load;
        currentVehicle.currentVolume += currentOrder.volume;
        let vehicleListCopy = vehicleList.map((item: any) => {
            return {...item}
        })
        let nextCombine = combineVehicleOrder(vehicleListCopy, orderListCopy);
        if(nextCombine.length === 0){
            res.push([combineItem]);
        }else{
            nextCombine.forEach((item: any) => {
                let combineItemCopy = JSON.parse(JSON.stringify(combineItem));
                let resItem = [combineItemCopy];
                item.forEach((itemm: any) => {
                    if(itemm.vehicle.vehicleId === combineItem.vehicle.vehicleId){
                        resItem[0].vehicle = {...(itemm.vehicle)};
                        resItem[0].orders.push(...(itemm.orders));
                        resItem[0].shouldPassCitys.push(...(itemm.shouldPassCitys));
                    } else {
                        resItem.push(itemm);
                    }
                });
                res.push(resItem);
            });
        }
    }
    return res;
}

// 根据组合选择车辆的最短路径
// 首先过滤掉 路径取货点在送货点后面的
const calStartEndCityOrder = (
    vehicleOrderCombine: any,
    startCity: any,
    targetCity: any,
    linksJson: any,
    nodes: any
) => {
    let maxDistance: number = 0,
        maxCombineIndex: number = 0;
    let combineRoutes = [];
    /* for(let i = 0; i < vehicleOrderCombine.length; i++){
        let combineItem = vehicleOrderCombine[i];
        for(let j = 0; j < combineItem.length; j++){
            let combineVehicleItem = combineItem[j];
            let midwayCity = combineVehicleItem.shouldPassCitys;
            calShortestPath(startCity, targetCity, midwayCity, linksJson, nodes);
        }
    } */

    /* vehicleOrderCombine.forEach((combineItem: any, combineIndex: number) => {
        let distance: number = 0;
        combineItem.forEach((vehicleItem: any) => {
            let midwayCity = vehicleItem.shouldPassCitys;
            let routes = calShortestPath(startCity, targetCity, midwayCity, linksJson, nodes);
            vehicleItem.routes = routes;
            // let validRoutes: any = [];
            // routes.forEach((routeItem: any) => {

            // })
        })
    }); */
    return vehicleOrderCombine;
}

// floyd 算法
// 不断的更新 dis 数组 shortPath 数组存放最短路径
// dis(i,j) = min{ dis(i,j), dis(i,k) + dis(k,j) }
const shortPathByFloyd = (cityList: any, linksJson: any) => {
    let dis: any = [], shortPath: any = [];
    //  初始化
    for(let i = 0; i < cityList.length; i++){
        shortPath[i] = [];
        dis[i] = [];
        for(let j = 0; j < cityList.length; j++){
            let key = `${cityList[i].id}-${cityList[j].id}`;
            let reverseKey = `${cityList[j].id}-${cityList[i].id}`;
            dis[i][j] = i === j ? 0 : (linksJson[key] ? linksJson[key] : linksJson[reverseKey]);
            shortPath[i][j] = [cityList[i].id, cityList[j].id];
        }
    }
    // floyd 核心代码
    for(let i = 0; i < dis.length; i++){
        for(let j = 0; j< dis.length; j++){
            let min = dis[i][j], minPath = [cityList[i].id,cityList[j].id];
            for(let k = 0; k < dis.length; k++){
                let disPass = dis[i][k] + dis[k][j];
                if(disPass < min){
                    min = disPass;
                    minPath = shortPath[i][k].concat(shortPath[k][j].slice(1));
                }
            }
            dis[i][j] = min;
            shortPath[i][j] = minPath;
        }
    }
    return {
        dis,
        shortPath
    }
}

//  车辆与订单的组合 优化
const combineVehicleOrderOptimize = (vehicleList: any, orderList: any): any => {
    if(orderList.length === 0)
        return [];
    let res: any = [],
        currentOrder: any = orderList[0],
        orderListCopy: any = orderList.slice(0);
    orderListCopy.shift();
    // 对车辆进行循环
    for(let i = 0; i < vehicleList.length; i++){
        let currentVehicle = vehicleList[i];
        // 判断车辆能否装载订单
        if(currentVehicle.currentLoad + currentOrder.load > currentVehicle.maxLoad ||
            currentVehicle.currentVolume + currentOrder.volume > currentVehicle.maxVolume){
                continue;
        }
        // 组合 item项
        let combineItem = {
            vehicleId: currentVehicle.vehicleId,
            orderIds: [currentOrder.orderId],
            midwayCityIds: [currentOrder.startCityId, currentOrder.targetCityId],
        }
        // 订单装载在 该车辆
        // 更新车辆的现有装载空间
        currentVehicle.currentLoad += currentOrder.load;
        currentVehicle.currentVolume += currentOrder.volume;
        let vehicleListCopy = vehicleList.map((item: any) => {
            return {...item}
        })
        // 当前订单装载在当前车辆的情况下，其余订单的组合情况
        let nextCombine = combineVehicleOrderOptimize(vehicleListCopy, orderListCopy);
        // 其余组合情况为空
        if(nextCombine.length === 0){
            res.push([combineItem]);
        }else{
            // 其余订单的组合情况 与 当前组合进行 整合 数据合并
            nextCombine.forEach((item: any) => {
                let combineItemCopy = JSON.parse(JSON.stringify(combineItem));
                let resItem = [combineItemCopy];
                item.forEach((itemm: any) => {
                    if(itemm.vehicleId === combineItem.vehicleId){
                        resItem[0].orderIds.push(...(itemm.orderIds));
                        resItem[0].midwayCityIds.push(...(itemm.midwayCityIds));
                    } else {
                        resItem.push(itemm);
                    }
                });
                res.push(resItem);
            });
        }
    }
    return res;
}

// 车辆与订单的组合 考虑已有任务的车辆的当前载重和体积 redis 优化
/* export const combineVehicleOrderOptimizeConsiderHasTask2 = (vehicleList: any, orderList: any): any => {
    if (orderList.length === 0)
        return [];
    for (let i = 0; i < orderList.length; i++) {

    }
} */


// 车辆与订单的组合 考虑已有任务的车辆的当前载重和体积
const combineVehicleOrderOptimizeConsiderHasTask = (vehicleList: any, orderList: any): any => {
    if(orderList.length === 0)
        return [];
    let res: any = [],
        currentOrder: any = orderList[0],
        orderListCopy: any = orderList.slice(0);
    orderListCopy.shift();
    // 对车辆进行循环
    for(let i = 0; i < vehicleList.length; i++){
        let currentVehicle = vehicleList[i];
        // 判断车辆能否装载订单
        if(currentVehicle.currentLoad + currentOrder.load > currentVehicle.maxLoad ||
            currentVehicle.currentVolume + currentOrder.volume > currentVehicle.maxVolume){
                continue;
        }
        // 组合 item项
        let combineItem = {
            vehicleId: currentVehicle.vehicleId,
            orderIds: [currentOrder.orderId],
            midwayCityIds: [currentOrder.startCityId, currentOrder.targetCityId],
        }
        // 订单装载在 该车辆
        // 更新车辆的现有装载空间
        currentVehicle.currentLoad += currentOrder.load;
        currentVehicle.currentVolume += currentOrder.volume;
        let vehicleListCopy = vehicleList.map((item: any) => {
            return {...item}
        })
        // 当前订单装载在当前车辆的情况下，其余订单的组合情况
        let nextCombine = combineVehicleOrderOptimizeConsiderHasTask(vehicleListCopy, orderListCopy);
        // 其余组合情况为空
        if(nextCombine.length === 0){
            res.push([combineItem]);
        }else{
            // 其余订单的组合情况 与 当前组合进行 整合 数据合并
            nextCombine.map((item: any) => {
                let combineItemCopy = JSON.parse(JSON.stringify(combineItem));
                let resItem = [combineItemCopy];
                item.forEach((itemm: any) => {
                    if(itemm.vehicleId === combineItem.vehicleId){
                        resItem[0].orderIds.push(...(itemm.orderIds));
                        resItem[0].midwayCityIds.push(...(itemm.midwayCityIds));
                    } else {
                        resItem.push(itemm);
                    }
                });
                res.push(resItem);
            });
        }
    }
    return res;
}

// 遍历当前组合为已有任务的车辆填充初始的订单列表 和 途经城市
const fillOriginOrderForCombine = (combineResult: any, vehicleDetail: any) => {
    combineResult = combineResult.map((combineItem: any) => {
        combineItem.map((vehicleItem: any) => {
            if(vehicleDetail[vehicleItem.vehicleId].orderIds){
                vehicleItem.orderIds = vehicleDetail[vehicleItem.vehicleId].orderIds.concat(vehicleItem.orderIds);
                vehicleItem.midwayCityIds = vehicleDetail[vehicleItem.vehicleId].midwayCityIds.concat(vehicleItem.midwayCityIds);
            }
        })
        return combineItem;
    })
    return combineResult;
}

// 手动调度根据 shortPath 计算距离
const calDistanceByShortPath = (
    combineResult: any,
    cityIdToIndex: any,
    dis: any,
) => {
    combineResult.map((combineItem: any) => {
        let minDistance: number = 0,
            shortPath = combineItem.shortPath;
        for(let i = 0; i < shortPath.length - 1; i++){
            let start = cityIdToIndex[shortPath[i]],
                target = cityIdToIndex[shortPath[i + 1]];
            minDistance += dis[start][target];
        };
        combineItem.minDistance = minDistance;
    });
    return combineResult;
}

// 根据组合为车辆分配最短的路径
const allocatPathForVehicle = (
    combineResult: any,
    cityIdToIndex: any,
    dis: any,
    shortPath: any,
    vehicleDetail: any
) => {
    // 所有的组合方案
    combineResult.map((combineResultItem: any) => {
        // 某一个方案 vehicleItem 该方案中的每一辆车辆
        combineResultItem = combineResultItem.map((vehicleItem: any) => {
            let midwayCityIds: any = vehicleItem.midwayCityIds,
                startCityId: number = vehicleDetail[vehicleItem.vehicleId].currentAddressCityId,
                finishCityId: number = vehicleDetail[vehicleItem.vehicleId].finishAddressCityId;
            // 中间节点的组合数
            let midwayCityIdPermutation: any = util.filterCityPermutation(midwayCityIds);
            let minDistance: number = 0, minPath: any = [];
            // 计算该车的最短路径
            // 每一个路径组合 比较最短路径
            midwayCityIdPermutation.map((permutationItem: any) => {
                let tempDistance: number = 0;
                // 计算该组合的距离
                for(let i = 0; i < permutationItem.length - 1; i++){
                    let row: number = cityIdToIndex[permutationItem[i]],
                        col: number = cityIdToIndex[permutationItem[i+1]];
                    tempDistance += dis[row][col];
                }
                let startCityIndex: number = cityIdToIndex[startCityId],
                    finishCityIndex: number = cityIdToIndex[finishCityId];
                let lastCombineCityIndex: number = cityIdToIndex[permutationItem[permutationItem.length - 1]];
                // 起始城市到组合第一个点
                tempDistance += dis[startCityIndex][cityIdToIndex[permutationItem[0]]];
                // 组合最后一个点到物流中心
                tempDistance += dis[lastCombineCityIndex][finishCityIndex];
                // 最小值比较赋值
                if(minDistance === 0 || minDistance > tempDistance){
                    minDistance = tempDistance;
                    minPath = [startCityId];
                    for(let i = 0; i < permutationItem.length - 1; i++){
                        let row: number = cityIdToIndex[permutationItem[i]],
                            col: number = cityIdToIndex[permutationItem[i+1]];
                        minPath = minPath.concat(shortPath[row][col]);
                    }
                    minPath.push(startCityId);
                }
            })
            // 过滤连续重复值
            let filteredRepetitionMinPath: any = [minPath[0]];
            for(let i = 0; i < minPath.length - 1; i++){
                if(minPath[i + 1] !== minPath[i]){
                    filteredRepetitionMinPath.push(minPath[i + 1]);
                }
            }
            vehicleItem.minDistance = minDistance;
            vehicleItem.shortPath = filteredRepetitionMinPath;
            return vehicleItem;
        });
        return combineResultItem;
    })
    return combineResult;
}

// 计算油耗
// 时间惩罚成本 超时 赔付 订单的 0.1 乘以超时天数
// 时间惩罚成本 提前完成 获得 订单的 0.2 乘以提前天数
// 计算人工成本
const calCost = (
    combineResult: any,
    vehicleDetail: any,
    dis: any,
    orderDetail: any,
    citys: any,
) => {
    combineResult = combineResult.map((combineItem: any) => {
        let combineResItem: any = {};
        combineResItem.vehicleOrder = combineItem;
        combineResItem.oilWear = 0;
        combineResItem.timePunish = 0;
        combineResItem.driverCost = 0;
        combineItem.map((vehicleItem: any) => {
            let vehicleDetailItem = vehicleDetail[vehicleItem.vehicleId];
            // 计算司机成本
            combineResItem.driverCost += vehicleDetailItem.driverCost * 2;
            // 计算油耗
            combineResItem.oilWear += vehicleItem.minDistance / 100 * vehicleDetailItem.oil;
            // 计算惩罚成本
            vehicleItem.orderIds.map((orderId: number) => {
                let orderItem = orderDetail[orderId];
                let startCityId = orderItem.startCityId,
                    targetCityId = orderItem.targetCityId;
                let startPathIndex = vehicleItem.shortPath.indexOf(startCityId);
                let targetPathIndex = vehicleItem.shortPath.slice(startPathIndex).indexOf(targetCityId);
                let needDate = 0;
                // 等待距离
                let waitDistance = dis[citys[vehicleDetailItem.currentAddressCityId]][citys[startCityId]];
                // 配送距离
                let transportDistance = 0;
                for(let i = startPathIndex; i < targetPathIndex; i++){
                    transportDistance += dis[citys[vehicleItem.shortPath[i]]][citys[vehicleItem.shortPath[i + 1]]];
                }
                needDate = (waitDistance + transportDistance) / vehicleDetailItem.speed;
                let dispatchDay = Math.floor((
                    util.transformDate(util.getCurrentDate(Math.ceil(needDate))).getTime() -
                    util.transformDate(orderItem.targetDate).getTime())/(24*3600*1000));
                if(dispatchDay > 0){
                    combineResItem.timePunish -= dispatchDay * 0.01 * orderItem.money;
                }else{
                    combineResItem.timePunish += Math.abs(dispatchDay) * 0.20 * orderItem.money;
                }
            })
            // 计算时间表
            vehicleItem.timeTable = {};
            let shortPath = vehicleItem.shortPath,
                preDistance: number = 0,
                orderIds: any = vehicleItem.orderIds;
            // 当前位置
            for(let i = 0; i < shortPath.length; i++){
                let currentDate = new Date(),
                    timeTableKey: string = '',
                    upOrderIds: any = [];
                currentDate.setMinutes(currentDate.getMinutes() + 1);
                if(i === 0){
                    preDistance = 0;
                }else{
                    preDistance += dis[citys[shortPath[i - 1]]][citys[shortPath[i]]];
                    let needTime = Math.ceil(preDistance / vehicleDetailItem.speed);
                    currentDate.setHours(currentDate.getHours() + needTime);
                }
                timeTableKey = `${currentDate.getSeconds()} ${currentDate.getMinutes()} ${currentDate.getHours()} ${currentDate.getDate()} ${currentDate.getMonth() + 1} *`;
                upOrderIds = [];
                orderIds.forEach((orderItem: number) => {
                    if(orderDetail[orderItem].startCityId === shortPath[i]){
                        upOrderIds.push(orderItem);
                    }
                })
                vehicleItem.timeTable[timeTableKey] = {
                    cityId: shortPath[i],
                    upOrderIds,
                };
            }
        })
        combineResItem.oilCost = combineResItem.oilWear * 6.37;
        // 油耗 0.5 时间惩罚成本 0.3 人工成本 0.2
        combineResItem.cost = combineResItem.oilCost * 0.5 + combineResItem.timePunish * 0.3 + combineResItem.driverCost * 0.2;
        return combineResItem;
    })
    return combineResult;
}

// 找出最小值
const minCost = (combineCost: any) => {
    let minCost = combineCost[0].cost, minIndex = 0;
    combineCost.map((item: any, index: number) => {
        if(item.cost < minCost){
            minCost = item.cost;
            minIndex = index;
        }
    })
    return combineCost[minIndex];
}

export {
    calShortestPath,
    combineVehicleOrder,
    calStartEndCityOrder,
    shortPathByFloyd,
    combineVehicleOrderOptimize,
    allocatPathForVehicle,
    calCost,
    minCost,
    combineVehicleOrderOptimizeConsiderHasTask,
    fillOriginOrderForCombine,
    calDistanceByShortPath
}
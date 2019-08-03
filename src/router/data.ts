// 城市点的 id - index
const citys: any = {
    10: 0,
    11: 1,
    12: 2,
    13: 3,
    14: 4
}

// 车辆的详细信息 包含 油耗，速度，司机薪资，车内已有订单数组，当前路线安排
const vehicleDetail: any = {
    1: {
        oil: 4, // 车辆id 为 1 的百公里油耗 4
        speed: 20, // 80 公里每小时
        driverCost: 100, // 驾驶员的薪资
        orderIds: [4], // 车内未完成的订单
        midwayCityIds: [11, 14], // 车辆当前行驶路线
        currentAddressCityId: 11, // 当前城市Id
        finishAddressCityId: 10 // 任务结束后的回到的城市点Id
    },
    2: {
        oil: 12,
        speed: 20,
        driverCost: 200,
        currentAddressCityId: 10,
        finishAddressCityId: 10
    },
    3: {
        oil: 4,
        speed: 20,
        driverCost: 100,
        currentAddressCityId: 10,
        finishAddressCityId: 10
    }
}

// 订单详情，包含订单的截止日期， 订单金额， 起始城市， 目的城市
const orderDetail: any = {
    1: {
        targetDate: '2019-7-31',
        money: 120,
        startCityId: 10,
        targetCityId: 11
    },
    2: {
        targetDate: '2019-7-31',
        money: 240,
        startCityId: 12,
        targetCityId: 13
    },
    3: {
        targetDate: '2019-7-30',
        money: 80,
        startCityId: 11,
        targetCityId: 14
    },
    4: {
        targetDate: '2019-8-2',
        money: 110,
        startCityId: 11,
        targetCityId: 14
    }
}

// 车辆列表
const vehicleList = [{
    vehicleId: 1,
    name: '车辆一',
    maxVolume: 12, // 立方米
    maxLoad: 1000,
    currentLoad: 300,
    currentVolume: 4,
},{
    vehicleId: 2,
    name: '车辆二',
    maxVolume: 30,
    maxLoad: 5000,
    currentLoad: 0,
    currentVolume: 0,
},{
    vehicleId: 3,
    name: '车辆三',
    maxVolume: 12,
    maxLoad: 1000,
    currentLoad: 0,
    currentVolume: 0,
}]

// 订单数组
const orderList = [{
    orderId: 1,
    name: '订单一',
    volume: 4,
    load: 400,
    startCityId: 10,
    targetCityId: 11
},{
    orderId: 2,
    name: '订单二',
    volume: 2,
    load: 300,
    startCityId: 12,
    targetCityId: 11
},{
    orderId: 3,
    name: '订单三',
    volume: 9,
    load: 800,
    startCityId: 11,
    targetCityId: 14
},{
    orderId: 4,
    name: '订单四',
    volume: 2,
    load: 300,
    startCityId: 11,
    targetCityId: 14
}]

export default {
    vehicleList,
    orderList,
    citys,
    orderDetail,
    vehicleDetail
}
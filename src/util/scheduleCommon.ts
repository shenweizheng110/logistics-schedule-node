import * as schedule from 'node-schedule';
import scheduleController from '../controller/scheduleController';

export let scheduleList: any = [];
type scheduleItemProps = {
    targetTime: string,
    cityId: number,
    vehicleId: number,
    upOrderIds: [] // 应该处理的订单
}

export const updateSchedule = (currentSchedule: any) => {
    scheduleList.forEach((scheduleItem: any) => {
        scheduleItem.cancel();
    });
    scheduleList = [];
    currentSchedule.forEach((scheduleItem: scheduleItemProps) => {
        let taskItem = schedule.scheduleJob(scheduleItem.targetTime, () => {
            let currentCityId = scheduleItem.cityId;
            let transistOrders: any = [],
                finishedOrders: any = [];
            // 获取车内当前订单
            scheduleController.getOrderByVehicleId(scheduleItem.vehicleId)
                .then((res: any) => {
                    let currentOrders = res ? res : [];
                    // 筛选到达终点的订单
                    currentOrders.forEach((orderItem: any) => {
                        if(orderItem.targetCityId === currentCityId){
                            finishedOrders.push(orderItem);
                            // finishedOrders.push(['finished',scheduleItem.vehicleId, orderItem]);
                        }
                    })
                    // 起点为当前城市点的订单
                    scheduleItem.upOrderIds.forEach((orderItem: number) => {
                        transistOrders.push(orderItem);
                        // transistOrders.push(['in_transit',scheduleItem.vehicleId, orderItem]);
                    });
                    console.log('finishedOrders: ', finishedOrders);
                    console.log('transistOrders: ', transistOrders);
                    return Promise.all([
                        scheduleController.updateVehicleBySchedule({
                            status: 'out',
                            currentCityId,
                            vehicleId: scheduleItem.vehicleId
                        }),
                        transistOrders.length !== 0
                        ?scheduleController.updateOrderListBySchedule(
                            scheduleItem.vehicleId,
                            transistOrders,
                            'in_transit'
                        )
                        : null,
                        finishedOrders.length !== 0
                        ? scheduleController.updateOrderListBySchedule(
                            scheduleItem.vehicleId,
                            finishedOrders,
                            'finished')
                        : null,
                        // scheduleController.flagFinishedOrders(finishedOrders)
                    ])
                })
                .then((res: any) => {})
                .catch((error: any) => {
                    console.log(error);
                })
        });
        scheduleList.push(taskItem);
    });
    /* scheduleList.push(schedule.scheduleJob('5 * * * * *', () => {
        console.log('执行调度');
    })) */
}

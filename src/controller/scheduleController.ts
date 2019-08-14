import pool from '../mysql/sqlConnect';
import util from '../util';

type scheduleIntroProps = {
    scheduleTime: Date,
    oilCost: number,
    peopleCost: number,
    punishCost: number,
    scheduleType: 'auto' | 'artificial',
    schedulePeople?:number,
    createTime: Date,
    updateTime: Date
}

export default {
    // 获取可以投入调度的车辆
    getCanScheduleVehicleList: () => {
        let sql = `
        select vehicle.id as vehicleId,vehicle_license as vehicleLicense,
        max_load as maxLoad,max_volume as maxVolume,oil,
        current_city_id as currentCityId,finish_city_id as finishCityId,base_speed as baseSpeed,
        (select sum(order_load)
                from ${'`order`'}
                where ${'`order`'}.is_delete = 0
                    and ${'`order`'}.order_status <> 'finished'
                    and ${'`order`'}.vehicle_id = vehicle.id
        ) as currentLoad,
        (select sum(order_volume)
            from ${'`order`'}
            where ${'`order`'}.is_delete = 0
                and ${'`order`'}.order_status <> 'finished'
                and ${'`order`'}.vehicle_id = vehicle.id
        ) as currentVolume,
        (select sum(pay)
            from driver d
            where d.vehicle_id = vehicle.id and d.is_delete = 0
        ) as driverPay
        from vehicle
        where (${'`status`'} = 'unused' or ${'`status`'} = 'out') and vehicle.is_delete = 0
        `;
        return pool.query(sql,null);
    },

    // 获取当前 未处理
    getOrderByStatus: (isManual?: boolean) => {
        let sql = `
            select ${'`order`'}.id as orderId,number,order_load as ${"'load'"},order_volume as volume,
            vehicle_id as vehicleId,start_city_id as startCityId,target_city_id as targetCityId,
            money,target_date as targetDate
            from ${'`order`'}
        `;
        sql = isManual
            ? `${sql} where is_delete = 0 and (order_status = 'undisposed' or order_status = 'in_transit')`
            : `${sql} where is_delete = 0 and order_status = 'undisposed'`;
        return pool.query(sql, null);
    },

    // 获取车辆使用率
    getVehicleUsageRate: () => {
        let sql = `
        select count(v.id) as usedNumber,
            (
                select count(v.id) as allCount
                from vehicle v
                where v.is_delete = 0 and v.${'`status`'} <> 'scrap'
            ) as allCount
        from vehicle v
        where v.is_delete = 0 and v.${'`status`'} = 'out'
        `;
        return pool.query(sql ,null);
    },

    // 获取车辆空载率
    getLoadRate: () => {
        let sql = `
            select sum(max_load) as maxLoad, sum(order_load) as currentLoad
            from vehicle v inner join ${'`order`'} o
            on v.id = o.vehicle_id
            where v.${'`status`'} = 'out' and v.is_delete = 0 and o.order_status <> 'finished' and o.is_delete = 0
        `;
        return pool.query(sql, null);
    },

    // 获取成本占比
    getCostRate: () => {
        let sql = `
            select oil_cost as oilCost, punish_cost as punishCost, people_cost as peopleCost
            from ${'`schedule`'}
            order by create_time
            limit 0,1
        `;
        return pool.query(sql, null);
    },

    // 获取未处理订单数量
    getUndisposedOrder: () => {
        let sql = `
            select count(id) as count
            from ${'`order`'} o
            where o.order_status = 'undisposed' and o.is_delete = 0
        `;
        return pool.query(sql, null);
    },

    // 添加调度计划
    addSchedule: (scheduleIntro: scheduleIntroProps) => {
        let columns = ['schedule_time','oil_cost','punish_cost','people_cost','schedule_type',
            'create_time','update_time'];
        if(scheduleIntro.schedulePeople){
            columns.push('schedule_people');
        }
        let { sql, sqlData } = util.createInsertSql('schedule',columns,scheduleIntro);
        return pool.query(sql,sqlData);
    },

    // 添加调度车辆
    addScheduleVehciles: (vehicleIds: any) => {
        let sql = `
            insert into schedule_vehicle_detail(vehicle_id,schedule_id,create_time,update_time)
            values ?
        `;
        return pool.query(sql, [vehicleIds]);
    },

    // 添加调度订单
    addScheduleOrders: (orderIds: any) => {
        let sql = `
            insert into schedule_order_detail(order_id,vehicle_id,schedule_id,create_time,update_time)
            values ?
        `;
        return pool.query(sql, [orderIds]);
    },

    // 添加调度路线
    addScheduleRoutes: (vehicleRoutes: any) => {
        let sql = `
            insert into schedule_route_detail(vehicle_id,city_id,schedule_id,create_time,update_time)
            values ?
        `;
        return pool.query(sql, [vehicleRoutes]);
    },

    // 批量更新车辆位置和状态
    updateVehicleListBySchedule: (vehicleList: any) => {
        let sql = `
            update vehicle set status = ?, current_city_id = ? where id = ?
        `;
        return pool.query(sql, [vehicleList]);
    },

    // 更新车辆位置和状态
    updateVehicleBySchedule: ({
        status,
        currentCityId,
        vehicleId
    }: {
        status: string,
        currentCityId: number,
        vehicleId: number
    }) => {
        let sql = `
            update vehicle set status = ?, current_city_id = ? where id = ?
        `;
        return pool.query(sql, [status, currentCityId, vehicleId]);
    },

    // 更新订单状态
    updateOrderListBySchedule: (vehicleId: number, orderIds: any, type: string) => {
        let sql = `update ${'`order`'} set vehicle_id = ?,order_status = case id`;
        orderIds.forEach((idItem: number) => {
            sql = `${sql} when ? then ${pool.escape(type)}`
        });
        sql = `${sql} end where id in ?`
        return pool.query(sql, [vehicleId, ...orderIds, [orderIds]]);
    },

    // 批量标记完成
    /* flagFinishedOrders: (orderList: any) => {
        let sql = `
            update order set(order_status = 'finished') where id = ?
        `;
        return pool.query(sql, [orderList]);
    }, */

    // 获取当前车辆的订单
    getOrderByVehicleId: (vehicleId: number) => {
        let sql = `
            select id as orderId, target_city_id as targetCityId
            from ${'`order`'} o
            where o.vehicle_id = ?
        `;
        return pool.query(sql, [vehicleId]);
    },

    // 获取当前调度安排
    getCurrentSchedulePlan: () => {
        let sql = `
        select sv.vehicle_id as vehicleId,v.vehicle_license as vehicleLicense,v.current_city_id as currentCityId,
            c.city_name as currentCityName,sum(order_load) as currentLoad,sum(order_volume) as currentVolume
        from schedule_vehicle_detail sv left join vehicle v
        on sv.vehicle_id = v.id
        left join city c
        on v.current_city_id = c.id
        left join ${'`order`'} o
        on o.vehicle_id = sv.vehicle_id
        where sv.schedule_id = (
            select max(id)
            from ${'`schedule`'}
        )
        group by sv.vehicle_id
        `;
        return pool.query(sql, null);
    },

    // 根据id 获取车辆调度计划
    getVehicleRoutes: (vehicleId: number) => {
        let sql = `
            select city_name as cityName
            from schedule_route_detail sr left join city c
            on sr.city_id = c.id
            where sr.vehicle_id = ? and sr.schedule_id = (
                select max(id)
                from ${'`schedule`'}
            )
        `;
        return pool.query(sql, [vehicleId]);
    },

    // 获取车辆的驾驶员
    getVehicleDrivers: (vehicleId: number) => {
        let sql = `
            select name
            from driver
            where vehicle_id = ?
        `;
        return pool.query(sql, [vehicleId]);
    },

    // 获取车辆预处理的订单
    getVehicleOrders: (vehicleId: number) => {
        let sql = `
        select so.order_id as orderId,number,o.order_load as orderLoad,o.order_volume as orderVolume,
            c1.city_name as startCityName,c2.city_name as targetCityName
        from schedule_order_detail so left join ${'`order`'} o
        on so.order_id = o.id
        left join city c1
        on o.start_city_id = c1.id
        left join city c2
        on o.target_city_id = c2.id
        where so.vehicle_id = ? and so.schedule_id = (
            select max(id)
            from ${'`schedule`'}
        )
        `;
        return pool.query(sql, [vehicleId]);
    },

    // 根据车辆ID 获取城市点
    getMidwayCity: (vehicleIds: number[]) => {
        let sql = `
            select vehicle_id as vehicleId, c1.id as startCityId, c1.city_name as startCityName, 
                c2.id as targetCityId, c2.city_name as targetCityName
            from ${'`order`'} o left join city c1
            on o.start_city_id = c1.id
            left join city c2
            on o.target_city_id = c2.id
            where o.vehicle_id in ?
        `;
        return pool.query(sql, [[vehicleIds]]);
    }
}
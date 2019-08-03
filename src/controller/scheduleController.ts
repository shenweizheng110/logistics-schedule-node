import pool from '../mysql/sqlConnect';

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
        ) as currentVolume
        from vehicle
        where (${'`status`'} = 'unused' or ${'`status`'} = 'out') and vehicle.is_delete = 0
        `;
        return pool.query(sql,null);
    },

    // 获取当前 为处理 和 运输中的订单
    getOrderByStatus: () => {
        let sql = `
            select ${'`order`'}.id as orderId,number,order_load as ${"'load'"},order_volume as volume,
            vehicle_id as vehicleId,start_city_id as startCityId,target_city_id as targetCityId,
            money,target_date as targetDate
            from ${'`order`'}
            where is_delete = 0 and order_status = 'undisposed' or order_status = 'in_transit'
        `;
        return pool.query(sql, null);
    }
}
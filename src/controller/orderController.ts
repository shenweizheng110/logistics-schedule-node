import pool from '../mysql/sqlConnect';
import util from '../util';

type listType = {
    page: number,
    pageSize: number,
    filterData: any
}

export default {
    // 分页获取订单列表
    getOrderList: ({page, pageSize, filterData}: listType) => {
        let sql: string = `
            select o.id,number,order_load as orderLoad,order_volume as orderVolume,title,vehicle_license as vehicleLicense,
                consignee_name as consigneeName,consignee_phone as consigneePhone,
                consignee_address as consigneeAddress,start_city_id as startCityId,
                target_city_id as targetCityId,order_status as orderStatus
            from ${'`order`'} o left join vehicle
            on o.vehicle_id = vehicle.id
            where o.is_delete = 0
        `;
        let columns: string[] = ['number','title','order_status','consignee_name','consignee_phone'];
        sql = util.concatSqlByFilterData(sql,filterData = filterData ? filterData : {},columns);
        sql = `${sql} order by o.create_time desc limit ${pool.escape((page - 1) * pageSize)},${pool.escape(pageSize)}`;
        return pool.query(sql,null);
    },

    // 根据 id 获取对应的订单
    getOrder: (id: number) => {
        let sql: string = `
            select o.id,number,order_load as orderLoad,order_volume as orderVolume,title,vehicle_license as vehicleLicense,
                consignee_name as consigneeName,consignee_phone as consigneePhone,
                consignee_address as consigneeAddress,start_city_id as startCityId,
                target_city_id as targetCityId,order_status as orderStatus
            from ${'`order`'} o left join vehicle
            on o.vehicle_id = vehicle.id
            where o.id = ?
        `;
        return pool.query(sql,[id]);
    },

    // 添加订单信息
    addOrder: (orderInfo: any) => {
        let columns = ['number','order_load','order_volume','title','order_status','vehicle_id',
        'consignee_name','consignee_phone','consignee_address','start_city_id',
        'target_city_id','is_delete','create_time','update_time'];
        let { sql, sqlData } = util.createInsertSql('order',columns,orderInfo);
        return pool.query(sql,sqlData);
    },

    // 修改订单
    updateOrder: (orderInfo: any) => {
        let columns = ['load','volume','title','status','consignee_name','consignee_address',
        'consignee_phone','start_city_id','target_city_id','update_time'];
        let { sql, sqlData } = util.createUpdateSql('order', columns, orderInfo);
        return pool.query(sql,sqlData);
    },

    //查看单个订单的状态
    getOrderStatusById: (id: number) => {
        let sql = 'select order_status as orderStatus from' + '`order`' + ' where id = ?';
        return pool.query(sql,[id]);
    },

    // 删除订单
    deleteOrder: (id: number) => {
        let sql = 'update `order` set is_delete = 1 where id = ?';
        return pool.query(sql,[id]);
    },

    // 获取未处理的订单
    getUndisposedOrder: () => {
        let sql = `
            select id as orderId, number, order_load as orderLoad, order_volume as orderVolume, title,
            start_city_id as startCityId,target_city_id as targetCityId
            from order
            where order_status = undisposed
        `;
        return pool.query(sql, null);
    }
}
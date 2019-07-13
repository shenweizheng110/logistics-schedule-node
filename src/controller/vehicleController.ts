import pool from '../mysql/sqlConnect';
import util from '../util';

type listType = {
    page: number,
    pageSize: number,
    filterData: any
}

export default {
    // 分页获取车辆列表
    getVehicleList: ({page, pageSize, filterData}: listType) => {
        let sql: string = `
            select id,vehicle_license as vehicleLicense,max_load as maxLoad,max_volume as maxVolume,
                vehicle_type as vehicleType,status,max_day_distance as maxDayDistance
            from vehicle
            where status != 'scrap'
        `;
        let columns: string[] = ['vehicle_license','vehicle_type','status'];
        sql = util.concatSqlByFilterData(sql,filterData = filterData ? filterData : {},columns);
        sql = util.concatSqlByLimit(sql,filterData = filterData ? filterData : {}, ['max_load','max_volume']);
        sql = `${sql} order by create_time desc limit ${pool.escape((page - 1) * pageSize)},${pool.escape(pageSize)}`;
        return pool.query(sql,null);
    },

    // 添加车辆
    addVehicle: (vehicleInfo: any) => {
        let columns = ['vehicle_license','max_load','max_volume','max_day_distance','vehicle_type','status',
        'create_time','update_time'];
        let { sql, sqlData } = util.createInsertSql('vehicle',columns,vehicleInfo);
        return pool.query(sql,sqlData);
    },

    // 删除车辆
    deleteVehicle: (id: number) => {
        let sql = `update vehicle set status = 'scrap',is_delete = 1 where id = ?`;
        return pool.query(sql,[id]);
    },

    //  更新车辆
    updateVehicle: (vehicleInfo: any) => {
        let columns = ['vehicle_license','max_load','max_volume','max_day_distance','vehicle_type','status',
        'update_time'];
        let { sql, sqlData } = util.createUpdateSql('vehicle', columns, vehicleInfo);
        return pool.query(sql,sqlData);
    },

    //  获取单个车辆信息
    getVehcile: (id: number) => {
        let sql = `
            select id,vehicle_license as vehicleLicense,max_load as maxLoad,max_volume as maxVolume,
                vehicle_type as vehicleType,status,max_day_distance as maxDayDistance
            from vehicle
            where id = ?
        `;
        return pool.query(sql,[id]);
    }
}
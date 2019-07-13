import pool from '../mysql/sqlConnect';
import util from '../util';

type listType = {
    page: number,
    pageSize: number,
    filterData: any
}

export default {
    // 分页获取列表
    getDriverList: ({page, pageSize, filterData}: listType) => {
        let sql = `
            select id,name,age,sex,pay,is_medical_history as isMedicalHistory,health_status as healthStatus
            from driver
            where is_delete = 0
        `;
        let columns: string[] = ['name','sex','is_medical_history','health_status'];
        sql = util.concatSqlByFilterData(sql,filterData = filterData ? filterData : {},columns);
        sql = `${sql} order by create_time desc limit ${pool.escape((page - 1) * pageSize)},${pool.escape(pageSize)}`;
        return pool.query(sql, null);
    },

    // 获取单条记录
    getDriverById: (id: number) => {
        let sql = `
            select id,name,age,sex,pay,is_medical_history as isMedicalHistory,health_status as healthStatus
            from driver
            where id = ?
        `
        return pool.query(sql,[id]);
    },

    // 添加司机
    addDriver: (driverInfo: any) => {
        let columns = ['name','age','sex','pay','is_medical_history','health_status','is_delete',
            'create_time','update_time'];
        let { sql, sqlData } = util.createInsertSql('driver',columns,driverInfo);
        return pool.query(sql,sqlData);
    },

    // 更新司机
    updateDriver: (driverInfo: any) => {
        let columns = ['name','age','sex','pay','is_medical_history','health_status','update_time'];
        let { sql, sqlData } = util.createUpdateSql('driver', columns, driverInfo);
        return pool.query(sql,sqlData);
    },

    // 删除司机
    deleteDriver: (id: number) => {
        let sql = 'update driver set is_delete = 1 where id = ?';
        return pool.query(sql,[id]);
    }
}
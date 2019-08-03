import pool from '../mysql/sqlConnect';
import util from '../util';

type listType = {
    page: number,
    pageSize: number,
    filterData: any
}

export default {
    // 分页获取城市列表
    getCityList: ({page, pageSize, filterData}: listType) => {
        let sql = `
            select id,city_name as cityName,longitude,latitude
            from city
            where is_delete = 0
        `;
        let columns: string[] = ['city_name','longitude','latitude'];
        sql = util.concatSqlByFilterData(sql,filterData = filterData ? filterData : {},columns);
        sql = `${sql} order by create_time desc limit ${pool.escape((page - 1) * pageSize)},${pool.escape(pageSize)}`;
        return pool.query(sql, null);
    },

    // 获取单条记录
    getCityById: (id: number) => {
        let sql = `
            select id,city_name as cityName,longitude,latitude
            from city
            where id = ?
        `
        return pool.query(sql,[id]);
    },

    // 添加城市点
    addCity: (cityInfo: any) => {
        let columns = ['city_name','longitude','latitude','is_delete',
            'create_time','update_time'];
        let { sql, sqlData } = util.createInsertSql('city',columns,cityInfo);
        return pool.query(sql,sqlData);
    },

    // 更新城市点
    updateCity: (cityInfo: any) => {
        let columns = ['city_name','longitude','latitude','update_time'];
        let { sql, sqlData } = util.createUpdateSql('city', columns, cityInfo);
        return pool.query(sql,sqlData);
    },

    // 删除城市
    deleteCity: (id: number) => {
        let sql = 'update city set is_delete = 1 where id = ?';
        return pool.query(sql,[id]);
    },

    // 获取所有的城市 计算距离
    getAllCity: () => {
        let sql = 'select id,city_name as cityName,longitude,latitude from city where is_delete = 0';
        return pool.query(sql,null);
    }
}
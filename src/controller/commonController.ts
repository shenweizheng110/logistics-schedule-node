import pool from '../mysql/sqlConnect';
import * as http from 'http';

export default {
    // 获取表格数据总数
    getCountByTable: (tableName: string) => {
        return pool.getCount(tableName);
    },

}
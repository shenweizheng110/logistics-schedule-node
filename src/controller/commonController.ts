import pool from '../mysql/sqlConnect';

export default {
    getCountByTable: (tableName: string) => {
        return pool.getCount(tableName);
    }
}
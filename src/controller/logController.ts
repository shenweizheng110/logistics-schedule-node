import pool from '../mysql/sqlConnect';
import util from '../util';

type listType = {
    page: number,
    pageSize: number,
    filterData: any
}

export default {
    // 插入日志返回自增主键
    addLog: (logInfo: any) => {
        let sql = `
            insert into log(log_type,log_content,create_time)
            value(?,?,?)
        `;
        return pool.query(sql,[logInfo.logType, logInfo.logContent, logInfo.createTime]);
    },
    // 分页获取系统日志
    getLogList: ({page, pageSize, filterData}: listType) => {
        let sql = `
            select id, log_type as logType, log_content as logContent, create_time as createTime
            from log
            where 1 = 1
        `;
        let columns: string[] = ['log_type'];
        sql = util.concatSqlByFilterData(sql,filterData = filterData ? filterData : {},columns);
        sql = `${sql} order by create_time desc limit ${pool.escape((page - 1) * pageSize)},${pool.escape(pageSize)}`;
        return pool.query(sql, null);
    }
}
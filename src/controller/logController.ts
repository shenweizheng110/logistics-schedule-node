import pool from '../mysql/sqlConnect';

export default {
    // 插入日志返回自增主键
    addLog: (logInfo: any) => {
        let sql = `
            insert into log(log_type,log_content,create_time,update_time)
            value(?,?,?,?)
        `;
        return pool.query(sql,logInfo);
    }
}

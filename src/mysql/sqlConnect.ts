import * as mysql from 'mysql';

// 定义一个连接池
const pool: any = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'logistics_schedule',
    port: 3306,
    connectionLimit: 10
});

// promise封装query
// @params sql:执行的sql语句
// @Params sqlData: sql中占位符的数据
pool.query = (sql: string, sqlData: any) => {
    return new Promise((resolve,reject) => {
        // 建立链接
        pool.getConnection((err: any, connection: any) => {
            if (err)
                reject(err);
            // 执行sql
            connection.query(sql, sqlData, (error: any, results: any) => {
                if (error) {
                    // 回滚数据
                    connection.rollback(() => {
                        reject(error);
                    })
                } else {
                    // 返回数据
                    resolve(results);
                }
                // 释放链接
                connection.release();
            })
        })
    })
};

// 根据表名 查询数据总数
// @params tableName: 表名
pool.getCount = (tableName: string) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(function(err: any, connection: any) {
            if (err)
                reject(err);
            connection.query('select count(*) from vehicle', function(error: any, results: any) {
                if (error)
                    reject(error);
                resolve(results[0]['count(*)']);
                connection.release();
            })
        })
    })
};

export default pool;
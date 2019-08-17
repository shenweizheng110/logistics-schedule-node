import pool from '../mysql/sqlConnect';

export default {
    // 用户登录
    login: (phone: string) => {
        let sql = `
            select * from user where phone = ?
        `;
        return pool.query(sql, [phone]);
    }
}
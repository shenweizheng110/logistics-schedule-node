import pool from '../mysql/sqlConnect';
import util from '../util';

export default {
    getUserById: (userId: number) => {
        let sql = `
            select id, username, age, gender
            from user
            where id = ?
        `;
        return pool.query(sql, [userId]);
    },
    updateUserById: (userInfo: any) => {
        let columns = ['username','age','gender','phone','password'];
        let {sql, sqlData} = util.createUpdateSql('user',columns,userInfo);
        return pool.query(sql, sqlData);
    }
}
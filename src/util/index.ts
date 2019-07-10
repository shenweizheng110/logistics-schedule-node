import pool from '../mysql/sqlConnect';

const util: any = {
    concatSqlByFilterData: (sql:string, filterData: any, columns: string[]): string => {
        columns.map(item => {
            let humpShape = util.transformHump(item);
            if(filterData[humpShape])
                sql = `${sql} and ${item} = ${pool.escape(filterData[humpShape])}`
        });
        return sql;
    },

    concatSqlByLimit: (sql: string, filterData: any, columns: string[]): string => {
        columns.map(item => {
            let humpShape = util.transformHump(item);
            if(filterData[humpShape]){
                let limit = filterData[humpShape].split('-');
                sql = `${sql} and ${item} >= ${limit[0]}`;
                if(limit[1] !== '~')
                    sql = `${sql} and ${item} <= ${limit[1]}`;
            }
        });
        return sql;
    },

    transformHump: (param: string): string => {
        let paramArr: string[] = param.split('');
        let res: string[] = [];
        for(let i = 0; i < paramArr.length; i++){
            if(paramArr[i] !== '_')
                res.push(paramArr[i]);
            else{
                res.push(paramArr[i + 1].toUpperCase());
                i = i + 1;
            }
        }
        return res.join('');
    },

    createInsertSql: (tableName: string, columns: string[], info: any): any => {
        let sql:string = '',
            sqlData: any = [];
        sql = `insert into ${tableName}(`;
        columns.map((item: string, index: number) => {
            let humpShape = util.transformHump(item);
            sqlData.push(info[humpShape]);
            if(index === 0)
                sql += item
            else
                sql += ',' + item;
        });
        sql += ') value(?';
        for(let i = 1; i < columns.length; i++)
            sql += ',?';
        sql += ')';
        return {
            sql,
            sqlData
        }
    },

    createUpdateSql: (tableName: string, columns: [], info: any) => {
        let sql:string = `update ${tableName} set`,
            sqlData: any = [],
            flag:boolean = false;
        columns.map((item: any, index: number) => {
            let humpShape = util.transformHump(item);
            if(info[humpShape]){
                sqlData.push(info[humpShape]);
                if(!flag){
                    sql = `${sql} ${item} = ?`;
                    flag = true;
                }else{
                    sql = `${sql},${item} = ?`;
                }
            }
        })
        sql = `${sql} where id = ?`;
        sqlData.push(info.id);
        return {
            sql,
            sqlData
        }
    },

    getDateNow: () => {
        let date = new Date();
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
                date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    }
}

export default util;
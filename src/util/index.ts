import pool from '../mysql/sqlConnect';

const util: any = {
    concatSqlByFilterData: (sql:string, filterData: any, columns: string[]): string => {
        columns.map(item => {
            let humpShape = util.transformHump(item);
            if(filterData[humpShape] !== undefined)
                sql = `${sql} and ${item} = ${pool.escape(filterData[humpShape])}`
        });
        return sql;
    },

    concatSqlByLimit: (sql: string, filterData: any, columns: string[]): string => {
        columns.map(item => {
            let humpShape = util.transformHump(item);
            if(filterData[humpShape] !== undefined){
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
            sqlData: any = [],
            flag: boolean = false,
            endSql: string = sql += ') value(';
        sql = 'insert into' + ' `' + tableName + '` (';
        columns.map((item: string) => {
            let humpShape = util.transformHump(item);
            if(info[humpShape] !== undefined){
                sqlData.push(info[humpShape]);
                if(!flag){
                    flag = true;
                    sql += item;
                    endSql += '?';
                }else{
                    sql += ',' + item;
                    endSql += ',?';
                }
            }
        });
        sql = `${sql}${endSql})`;
        return {
            sql,
            sqlData
        }
    },

    createUpdateSql: (tableName: string, columns: [], info: any) => {
        let sql:string = 'update' + ' `' + tableName + '` set',
            sqlData: any = [],
            flag:boolean = false;
        columns.map((item: any, index: number) => {
            let humpShape = util.transformHump(item);
            if(info[humpShape] !== undefined){
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
    },

    randOrderNumber: () => {
        let date = new Date(),
            res = '';
        res = date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString() +
            date.getHours().toString() + date.getMinutes().toString() + date.getSeconds().toString() +
            date.getMilliseconds().toString();
        for(let i = 0; i < 3; i++){
            let rand: number = Math.ceil((Math.random() * 10));
            res += rand.toString();
        }
        return res;
    }
}

export default util;
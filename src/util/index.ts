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

    getDateNow: (day: number = 0) => {
        let date = new Date();
        if(day !== 0)
            date.setDate(date.getDate() + day);
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
    },

    getDistance: (cityList: any) => {
        let res: {nodes: any, links: any} = {nodes: [],links: []};
        for(let i = 0; i < cityList.length - 1; i++){
            if(i === 0){
                res.nodes.push({
                    id: cityList[i].id,
                    name: cityList[i].cityName
                })
            }
            for(let j = i + 1; j < cityList.length; j++){
                if(i === 0){
                    res.nodes.push({
                        id: cityList[j].id,
                        name: cityList[j].cityName
                    })
                }
                let startCity = cityList[i], targetCity = cityList[j];
                res.links.push({
                    source: startCity.id,
                    sourceName: startCity.cityName,
                    target: targetCity.id,
                    targetName: targetCity.cityName,
                    distance: util.calDistanceByCoords(
                        startCity.longitude,
                        startCity.latitude,
                        targetCity.longitude,
                        targetCity.latitude
                    )
                })
            }
        }
        return res;
    },

    // 根据坐标计算两点之间的距离
    calDistanceByCoords: (long1: number, lati1: number, long2: number, lati2: number) => {
        let radlati1 = lati1 * Math.PI / 180.0;
        let radlati2 = lati2 * Math.PI / 180.0;
        let a = radlati1 - radlati2;
        let  b = long1 * Math.PI / 180.0 - long2 * Math.PI / 180.0;
        let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
        Math.cos(radlati1) * Math.cos(radlati2) * Math.pow(Math.sin(b/2),2)));
        s = s * 6378.137 ;// EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000;
        return s;
    },

    // 计算 以 startCity 为起点的最短路径
    calShortRouter: (linksJson: any, cityList: any, startCity: any) => {
        let visited: any = [];
        let currentValue = 0;
        let routes: any = [];
        while(visited.length !== cityList.length){
            // 扩展节点
            cityList.forEach((item: any) => {
                if(item.id !== startCity.id){
                    let distanceKey = `${startCity.id}-${item.id}`;
                    let distanceReverseKey = `${item.id}-${startCity.id}`;
                    let distance = linksJson[distanceKey] || linksJson[distanceReverseKey];
                    let existRouteItem: any = {}, existRouteIndex = -1;
                    if(!visited.includes(item.id)){
                        // 是否已存在
                        routes.some((item: any,index: number) => {
                            if(item.target === item.id){
                                existRouteIndex = index;
                                existRouteItem = item;
                                return true;
                            }
                        });
                        let routerItem = {
                            source: startCity.id,
                            sourceName: startCity.name,
                            target: item.id,
                            targetName: item.name,
                            distance: distance + currentValue
                        }
                        // 判断添加 更新
                        if(existRouteIndex !== -1){
                            if(distance < existRouteItem.distance){
                                routes[existRouteIndex] = routerItem;
                            }
                        }else{
                            routes.push(routerItem);
                        }
                    }
                }
            });
            visited.push(startCity.id);
            let minDistanceItem = routes[util.findMinItemByDistance(routes)];
            currentValue = minDistanceItem.distance;
            startCity = {
                id: minDistanceItem.target,
                name: minDistanceItem.targetName,
            }
        }
        return routes;
    },

    // 寻找最小值
    findMinItemByDistance: (targetArr: any) => {
        let min = targetArr[0].distance, minIndex = 0;
        targetArr.forEach((item: any,index: number) => {
            if(item.distance < min){
                min = item.distance;
                minIndex = index;
            }
        });
        return minIndex;
    },

    // 回溯最短路径
    searchShortDistance: (routes: any,startCity: any, targetCity: any) => {
        let currentRoute: any = {
            source: targetCity.id,
        },
            route: any = [],
            distance: number = 0;
        route.push(targetCity);
        while(currentRoute.source !== startCity.id){
            // 找出上一个节点
            routes.forEach((item: any, index: any) => {
                if(item.target === currentRoute.source){
                    currentRoute = item;
                    if(item.target === targetCity.id){
                        distance = item.distance;
                    }
                    return true;
                }
            });
            route.push({
                id: currentRoute.source,
                name: currentRoute.sourceName
            });
        }
        return {
            route: route.reverse(),
            distance
        };
    },

    // 生成城市点全排列
    generateFullPermutation: (cityList: any, res: any) => {
        if(cityList.length === 0)
            return res;
        let currentRes: any = [],
            currentCity: any = cityList.shift();
        if(res.length === 0){
            currentRes = [[currentCity]];
        }else{
            res.forEach((item: any) => {
                for(let i = 0; i <= item.length; i++){
                    let itemCopy = JSON.parse(JSON.stringify(item));
                    itemCopy.splice(i,0,currentCity);
                    currentRes.push(itemCopy);
                }
            });
        }
        return util.generateFullPermutation(cityList,currentRes);
    },

    // 按照中间节点的进行组合 过滤掉不合理的组合
    filterCityPermutation: (cityList: any) => {
        let startCitys = [], endCitys = [];
        for(let i = 0; i < cityList.length; i++){
            if(i % 2 === 0)
                startCitys.push(cityList[i]);
            else
                endCitys.push(cityList[i]);
        }
        let startPermutation = util.generateFullPermutation(startCitys, []);
        let endPermutation = util.generateFullPermutation(endCitys, []);
        let res: any = [];
        for(let i = 0; i < startPermutation.length; i++){
            for(let j = 0; j < endPermutation.length; j++){
                let resItem = [...(startPermutation[i])];
                resItem.push(...(endPermutation[j]));
                res.push(resItem);
            }
        }
        return res;
    },

    // 获取当前日期
    getCurrentDate: (needDate: number) => {
        let year = new Date().getFullYear(),
            month = new Date().getMonth() + 1,
            day = new Date().getDate(),
            hour = new Date().getHours();
        while(needDate >=0){
            if(hour + needDate >= 24){
                needDate = needDate - ( 24 - hour );
                hour = 0;
                day ++;
            }else{
                hour += needDate;
                break;
            }
        }
        let maxDay = new Date(year, month, 0).getDate();
        if(day > maxDay){
            month ++;
            day = day - maxDay;
        }
        return `${year}-${month}-${day}-${hour}`;
    },

    // 转换日期
    transformDate: (dateString: any) => {
        if(dateString instanceof Date)
            return dateString;
        let dateArr = dateString.split('-');
        let date = new Date();
        date.setFullYear(parseInt(dateArr[0]));
        date.setMonth(parseInt(dateArr[1]) - 1);
        date.setDate(parseInt(dateArr[2]));
        if(dateArr.length > 3)
            date.setHours(parseInt(dateArr[3]));
        else
            date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        return date;
    }
}

export default util;
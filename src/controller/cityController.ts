import pool from '../mysql/sqlConnect';
import util from '../util';

type listType = {
    page: number,
    pageSize: number,
    filterData: any
}

export default {
    // 分页获取城市列表
    getCityList: ({page, pageSize, filterData}: listType) => {
        let sql = `
            select id,city_name as cityName,longitude,latitude
            from city
            where is_delete = 0
        `;
        let columns: string[] = ['city_name','longitude','latitude'];
        sql = util.concatSqlByFilterData(sql,filterData = filterData ? filterData : {},columns);
        sql = `${sql} order by create_time desc limit ${pool.escape((page - 1) * pageSize)},${pool.escape(pageSize)}`;
        return pool.query(sql, null);
    },

    // 获取单条记录
    getCityById: (id: number) => {
        let sql = `
            select id,city_name as cityName,longitude,latitude
            from city
            where id = ?
        `
        return pool.query(sql,[id]);
    },

    // 添加城市点
    addCity: (cityInfo: any) => {
        let columns = ['city_name','longitude','latitude','is_delete',
            'create_time','update_time'];
        let { sql, sqlData } = util.createInsertSql('city',columns,cityInfo);
        return pool.query(sql,sqlData);
    },

    // 更新城市点
    updateCity: (cityInfo: any) => {
        let columns = ['city_name','longitude','latitude','update_time'];
        let { sql, sqlData } = util.createUpdateSql('city', columns, cityInfo);
        return pool.query(sql,sqlData);
    },

    // 删除城市
    deleteCity: (id: number) => {
        let sql = 'update city set is_delete = 1 where id = ?';
        return pool.query(sql,[id]);
    },

    // 获取所有的城市 计算距离
    getAllCity: (startCityName?: string, targetCityName?: string) => {
        if(!startCityName && !targetCityName){
            let sql = 'select id,city_name as cityName,longitude,latitude from city where is_delete = 0';
            return pool.query(sql,null);
        }else{
            let sql = `
                select id,city_name as cityName,longitude,latitude
                from city
                where is_delete = 0 and (city_name = ? or city_name = ? )
            `;
            return pool.query(sql,[startCityName, targetCityName]);
        }
    },

    // 检查城市状态
    checkCityStatus: (cityId: number) => {
        let sql = `
        select o.id
        from city inner join ${'`order`'} o
        on o.start_city_id = city.id
        where city.id = ? and (o.order_status = 'undisposed' or o.order_status = 'in_transit') and city.is_delete = 0
        union
        select o.id
        from city inner join ${'`order`'} o
        on o.target_city_id = city.id
        where city.id = ? and (o.order_status = 'undisposed' or o.order_status = 'in_transit') and city.is_delete = 0
        `;
        return pool.query(sql, [cityId, cityId]);
    },

    // 列表添加城市
    addCityList: () => {
        let places = [
            {name:'海门', geoCoord:[121.15, 31.89]},
            {name:'鄂尔多斯', geoCoord:[109.781327, 39.608266]},
            {name:'招远', geoCoord:[120.38, 37.35]},
            {name:'舟山', geoCoord:[122.207216, 29.985295]},
            {name:'齐齐哈尔', geoCoord:[123.97, 47.33]},
            {name:'盐城', geoCoord:[120.13, 33.38]},
            {name:'赤峰', geoCoord:[118.87, 42.28]},
            {name:'青岛', geoCoord:[120.33, 36.07]},
            {name:'乳山', geoCoord:[121.52, 36.89]},
            {name:'金昌', geoCoord:[102.188043, 38.520089]},
            {name:'泉州', geoCoord:[118.58, 24.93]},
            {name:'莱西', geoCoord:[120.53, 36.86]},
            {name:'日照', geoCoord:[119.46, 35.42]},
            {name:'胶南', geoCoord:[119.97, 35.88]},
            {name:'南通', geoCoord:[121.05, 32.08]},
            {name:'拉萨', geoCoord:[91.11, 29.97]},
            {name:'云浮', geoCoord:[112.02, 22.93]},
            {name:'梅州', geoCoord:[116.1, 24.55]},
            {name:'文登', geoCoord:[122.05, 37.2]},
            {name:'上海', geoCoord:[121.48, 31.22]},
            {name:'攀枝花', geoCoord:[101.718637, 26.582347]},
            {name:'威海', geoCoord:[122.1, 37.5]},
            {name:'承德', geoCoord:[117.93, 40.97]},
            {name:'厦门', geoCoord:[118.1, 24.46]},
            {name:'汕尾', geoCoord:[115.375279, 22.786211]},
            {name:'潮州', geoCoord:[116.63, 23.68]},
            {name:'丹东', geoCoord:[124.37, 40.13]},
            {name:'太仓', geoCoord:[121.1, 31.45]},
            {name:'曲靖', geoCoord:[103.79, 25.51]},
            {name:'烟台', geoCoord:[121.39, 37.52]},
            {name:'福州', geoCoord:[119.3, 26.08]},
            {name:'瓦房店', geoCoord:[121.979603, 39.627114]},
            {name:'即墨', geoCoord:[120.45, 36.38]},
            {name:'抚顺', geoCoord:[123.97, 41.97]},
            {name:'玉溪', geoCoord:[102.52, 24.35]},
            {name:'张家口', geoCoord:[114.87, 40.82]},
            {name:'阳泉', geoCoord:[113.57, 37.85]},
            {name:'莱州', geoCoord:[119.942327, 37.177017]},
            {name:'湖州', geoCoord:[120.1, 30.86]},
            {name:'汕头', geoCoord:[116.69, 23.39]},
            {name:'昆山', geoCoord:[120.95, 31.39]},
            {name:'宁波', geoCoord:[121.56, 29.86]},
            {name:'湛江', geoCoord:[110.359377, 21.270708]},
            {name:'揭阳', geoCoord:[116.35, 23.55]},
            {name:'荣成', geoCoord:[122.41, 37.16]},
            {name:'连云港', geoCoord:[119.16, 34.59]},
            {name:'葫芦岛', geoCoord:[120.836932, 40.711052]},
            {name:'常熟', geoCoord:[120.74, 31.64]},
            {name:'东莞', geoCoord:[113.75, 23.04]},
            {name:'河源', geoCoord:[114.68, 23.73]},
            {name:'淮安', geoCoord:[119.15, 33.5]},
            {name:'泰州', geoCoord:[119.9, 32.49]},
            {name:'南宁', geoCoord:[108.33, 22.84]},
            {name:'营口', geoCoord:[122.18, 40.65]},
            {name:'惠州', geoCoord:[114.4, 23.09]},
            {name:'江阴', geoCoord:[120.26, 31.91]},
            {name:'蓬莱', geoCoord:[120.75, 37.8]},
            {name:'韶关', geoCoord:[113.62, 24.84]},
            {name:'嘉峪关', geoCoord:[98.289152, 39.77313]},
            {name:'广州', geoCoord:[113.23, 23.16]},
            {name:'延安', geoCoord:[109.47, 36.6]},
            {name:'太原', geoCoord:[112.53, 37.87]},
            {name:'清远', geoCoord:[113.01, 23.7]},
            {name:'中山', geoCoord:[113.38, 22.52]},
            {name:'昆明', geoCoord:[102.73, 25.04]},
            {name:'寿光', geoCoord:[118.73, 36.86]},
            {name:'盘锦', geoCoord:[122.070714, 41.119997]},
            {name:'长治', geoCoord:[113.08, 36.18]},
            {name:'深圳', geoCoord:[114.07, 22.62]},
            {name:'德州', geoCoord:[116.29, 37.45]},
            {name:'济宁', geoCoord:[116.59, 35.38]},
            {name:'荆州', geoCoord:[112.239741, 30.335165]},
            {name:'宜昌', geoCoord:[111.3, 30.7]},
            {name:'义乌', geoCoord:[120.06, 29.32]},
            {name:'丽水', geoCoord:[119.92, 28.45]},
            {name:'洛阳', geoCoord:[112.44, 34.7]},
            {name:'秦皇岛', geoCoord:[119.57, 39.95]},
            {name:'株洲', geoCoord:[113.16, 27.83]},
            {name:'石家庄', geoCoord:[114.48, 38.03]},
            {name:'莱芜', geoCoord:[117.67, 36.19]},
            {name:'常德', geoCoord:[111.69, 29.05]},
            {name:'保定', geoCoord:[115.48, 38.85]},
            {name:'湘潭', geoCoord:[112.91, 27.87]},
            {name:'金华', geoCoord:[119.64, 29.12]},
            {name:'岳阳', geoCoord:[113.09, 29.37]},
            {name:'长沙', geoCoord:[113, 28.21]},
            {name:'衢州', geoCoord:[118.88, 28.97]},
            {name:'廊坊', geoCoord:[116.7, 39.53]},
            {name:'菏泽', geoCoord:[115.480656, 35.23375]},
            {name:'合肥', geoCoord:[117.27, 31.86]},
            {name:'武汉', geoCoord:[114.31, 30.52]},
            {name:'大庆', geoCoord:[125.03, 46.58]}
        ]
        let data: any = [];
        places.forEach((item: any) => {
            let dataItem: any = [];
            dataItem = dataItem.concat(
                item.name,
                item.geoCoord[0],
                item.geoCoord[1],
                0,
                new Date(),
                new Date()
            );
            data.push(dataItem);
        });
        let sql = `
            insert into city(city_name,longitude,latitude,is_delete,create_time,update_time)
            values ?
        `;
        return pool.query(sql, [data]);
    }
}
import * as express from 'express';
import cityController from '../controller/cityController';
import commonController from '../controller/commonController';
import result from '../module/result';
import util from '../util';

const router = express.Router();

// 分页获取城市记录
router.get('/list',(req: any,res: any) => {
    let {page, pageSize, filterData} = req.query;
    if(!page)
        return res.send(result(1,'page不为空',{}));
    if(!pageSize)
        return res.send(result(1,'pageSize不为空',{}));
    Promise.all([
        commonController.getCountByTable('city'),
        cityController.getCityList({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            filterData
        })
    ]).then(response => {
        let resParam = {
            total: response[0],
            dataSource: response[1]
        };
        res.send(result(0,'success',resParam));
    }).catch(error => {
        res.send(result(1,'error',error));
    })
})

// 根据 id 获取单条记录
router.get('/info/:id',(req,res) => {
    let id = req.params.id;
    if(!id)
        return res.send(result(1,'id 不为空', null));
    cityController.getCityById(id)
        .then((response: any) => {
            res.send(result(0,'success',response[0]));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 添加城市
router.post('/info',(req, res) => {
    let cityInfo: any = {...req.body};
    const checkNotNullFields = ['cityName','longitude','latitude'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!cityInfo[item]){
            error.push(`${item} 不为空`);
        }
    });
    cityInfo.isDelete = 0;
    cityInfo.createTime = util.getDateNow();
    cityInfo.updateTime = util.getDateNow();
    if(error.length !== 0)
        return res.send(result(1, 'error', error));
    cityController.addCity(cityInfo)
        .then((response: any) => {
            res.send(result(0,'添加成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,error,null));
        })
})

// 修改单条城市数据
router.put('/info',(req,res) => {
    let cityInfo = {...req.body};
    if(!cityInfo.id)
        return res.send(result(1,'id 不为空',null));
        cityInfo.updateTime = util.getDateNow();
    cityController.updateCity(cityInfo)
        .then((response: any) => {
            return res.send(result(0,'修改成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,error,null));
        })
})

// 删除单条数据
router.delete('/delete/:id',(req,res) => {
    let id = req.params.id;
    if(!id)
        return res.send(result(1,'id 不为空',null));
    cityController.deleteCity(id)
        .then((response: any) => {
            res.send(result(0,'删除成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,error,null));
        })
})

// 获取城市距离
router.get('/distance',(req,res) => {
    cityController.getAllCity(req.query.startCityName,req.query.targetCityName)
        .then((response: any) => {
            res.send(result(0,'success',util.getDistance(response)));
        })
        .catch((error: any) => {
            res.send(result(1,error,null));
        })
})

// 获取所有的城市
router.get('/all',(req,res) => {
    cityController.getAllCity(null,null)
        .then((response: any) => {
            res.send(result(0,'success',response));
        })
        .catch((error: any) => {
            res.send(result(1,error,null));
        })
})

// 检查城市状态
// 0 表示 可以删 1 表示不可以删
router.get('/checkCityStatus', (req,res) => {
    if(!req.query.cityId)
        return res.send(result(1,'cityId 不为空',null));
    cityController.checkCityStatus(req.query.cityId)
        .then((response: any) => {
            res.send(result(0,'success',response.length > 0 ? 1 : 0));
        })
        .catch((error: any) => {
            res.send(result(1,error,null));
        })
})

export default router;
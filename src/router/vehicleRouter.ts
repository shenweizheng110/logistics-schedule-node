import * as express from 'express';
import vehicleController from '../controller/vehicleController';
import commonController from '../controller/commonController';
import result from '../module/result';
import util from '../util';
import { vehicleLoadVolume } from '../config';

const router = express.Router();

// 分页获取车辆列表
router.get('/list',(req: any,res: any) => {
    let {page, pageSize, filterData} = req.query;
    if(!page)
        return res.send(result(1,'page不为空',{}));
    if(!pageSize)
        return res.send(result(1,'pageSize不为空',{}));
    Promise.all([
        commonController.getCountByTable('vehicle'),
        vehicleController.getVehicleList({
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

// 添加车辆
router.post('/info',(req: any, res: any) => {
    let vehicleInfo = {...req.body};
    const checkNotNullFields = ['vehicleLicense','vehicleType','oil','baseSpeed'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!vehicleInfo[item]){
            error.push(`${item} 不为空`);
        }
    });
    if(error.length !== 0)
        return res.send(result(1, 'error', error));
    vehicleInfo.isDelete = 0;
    vehicleInfo.status = 'unused';
    vehicleInfo.maxLoad = vehicleLoadVolume[vehicleInfo.vehicleType].maxLoad;
    vehicleInfo.maxVolume = vehicleLoadVolume[vehicleInfo.vehicleType].maxVolume;
    vehicleInfo.currentCityId = 1;
    vehicleInfo.finishCityId = 1;
    vehicleInfo.createTime = util.getDateNow();
    vehicleInfo.updateTime = util.getDateNow();
    vehicleController.addVehicle(vehicleInfo)
        .then((response: any) => {
            res.send(result(0,'添加成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 根据 id 标记车辆报废
router.delete('/delete/:id',(req,res,next) => {
    let id = req.params.id;
    if(!id)
        return res.send(result(1,'id不为空',null));
    vehicleController.deleteVehicle(id)
        .then((response: any) => {
            res.send(result(0,'删除成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 根据 id 修改车辆信息
router.put('/info',(req,res,next) => {
    let vehicleInfo = {...req.body};
    const checkNotNullFields = ['id','vehicleLicense','vehicleType','oil','baseSpeed','currentCityId','status'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!vehicleInfo[item]){
            error.push(`${item} 不为空`);
        }
    });
    if(error.length !== 0)
        return res.send(result(1, 'error', error));
    vehicleInfo.maxLoad = vehicleLoadVolume[vehicleInfo.vehicleType].maxLoad;
    vehicleInfo.maxVolume = vehicleLoadVolume[vehicleInfo.vehicleType].maxVolume;
    vehicleInfo.updateTime = util.getDateNow();
    vehicleController.updateVehicle(vehicleInfo)
        .then((response:any) => {
            res.send(result(0,'修改成功',null));
        })
        .catch((error:any) => {
            res.send(result(1,'error',error));
        })
})

// 根据 id 获取单个车辆信息
router.get('/info/:id',(req,res,next) => {
    let id = req.params.id;
    if(!id)
        return res.send(result(1,'id不为空',null));
    vehicleController.getVehcile(id)
        .then((response: any) => {
            res.send(result(0,'success',response[0]));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

export default router;
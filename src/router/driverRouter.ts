import * as express from 'express';
import driverController from '../controller/driverController';
import commonController from '../controller/commonController';
import result from '../module/result';
import util from '../util';

const router = express.Router();

// 分页获取司机记录
router.get('/list',(req: any,res: any) => {
    let {page, pageSize, filterData} = req.query;
    if(!page)
        return res.send(result(1,'page不为空',{}));
    if(!pageSize)
        return res.send(result(1,'pageSize不为空',{}));
    Promise.all([
        commonController.getCountByTable('driver'),
        driverController.getDriverList({
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
    driverController.getDriverById(id)
        .then((response: any) => {
            res.send(result(0,'success',response[0]));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 添加司机
router.post('/info',(req, res) => {
    let driverInfo: any = {...req.body};
    const checkNotNullFields = ['name','age','sex','pay','isMedicalHistory','healthStatus'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!driverInfo[item]){
            error.push(`${item} 不为空`);
        }
    });
    driverInfo.isDelete = 0;
    driverInfo.createTime = util.getDateNow();
    driverInfo.updateTime = util.getDateNow();
    if(error.length !== 0)
        return res.send(result(1, 'error', error));
    driverController.addDriver(driverInfo)
        .then((response: any) => {
            res.send(result(0,'添加成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 修改单条司机数据
router.put('/info',(req,res) => {
    let driverInfo = {...req.body};
    if(!driverInfo.id)
        return res.send(result(1,'id 不为空',null));
    driverInfo.updateTime = util.getDateNow();
    driverController.updateDriver(driverInfo)
        .then((response: any) => {
            return res.send(result(0,'修改成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 删除单条数据
router.delete('/info/:id',(req,res) => {
    let id = req.params.id;
    if(!id)
        return res.send(result(1,'id 不为空',null));
    driverController.deleteDriver(id)
        .then((response: any) => {
            res.send(result(0,'删除成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

export default router;
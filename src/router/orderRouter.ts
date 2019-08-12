import * as express from 'express';
import orderController from '../controller/orderController';
import commonController from '../controller/commonController';
import result from '../module/result';
import util from '../util';

const router = express.Router();

// 分页获取订单列表
router.get('/list',(req, res) => {
    let {page, pageSize, filterData} = req.query;
    if(!page)
        return res.send(result(1,'page不为空',{}));
    if(!pageSize)
        return res.send(result(1,'pageSize不为空',{}));
    Promise.all([
        commonController.getCountByTable('order'),
        orderController.getOrderList({
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
    orderController.getOrder(id)
        .then((response: any) => {
            res.send(result(0,'success',response[0]));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 添加订单
router.post('/info',(req, res) => {
    let orderInfo: any = {...req.body};
    const checkNotNullFields = ['orderLoad','orderVolume','title','orderStatus','consigneeName','consigneePhone',
        'consigneeAddress','startCityId','targetCityId','money'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!orderInfo[item]){
            error.push(`${item} 不为空`);
        }
    });
    orderInfo.number = util.randOrderNumber();
    orderInfo.isDelete = 0;
    orderInfo.createTime = util.getDateNow();
    orderInfo.updateTime = util.getDateNow();
    orderInfo.targetDate = util.getDateNow(3);
    if(error.length !== 0)
        return res.send(result(1, 'error', error));
    orderController.addOrder(orderInfo)
        .then((response: any) => {
            res.send(result(0,'添加成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 修改单条订单数据
router.put('/info',(req,res) => {
    let orderInfo = {...req.body};
    if(!orderInfo.id)
        return res.send(result(1,'id 不为空',null));
    orderInfo.updateTime = util.getDateNow();
    orderController.getOrderStatusById(orderInfo.id)
        .then((response: any) => {
            let orderStatus = response[0].orderStatus;
            if(orderStatus === 'in_transit')
                return res.send(result(1,'订单运输中',null));
            else
                return orderController.updateOrder(orderInfo);
        })
        .then((response: any) => {
            return res.send(result(0,'修改成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 删除单挑数据
router.delete('/delete/:id',(req,res) => {
    let id = req.params.id;
    if(!id)
        return res.send(result(1,'id 不为空',null));
    orderController.deleteOrder(id)
        .then((response: any) => {
            res.send(result(0,'删除成功',null));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

// 获取所有的为处理的订单
router.get('/undisposed',(req,res) => {
    orderController.getUndisposedOrder()
        .then((response: any) => {
            res.send(result(0,'获取成功',response));
        })
        .catch((error: any) => {
            res.send(result(1,'error',error));
        })
})

export default router;
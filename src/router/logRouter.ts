import * as express from 'express';
import result from '../module/result';
import logController from '../controller/logController';
import commonController from '../controller/commonController';
import util from '../util';

const router = express.Router();

router.get('/list', (req: any, res: any) => {
    let {page, pageSize, filterData} = req.query;
    if(!page)
        return res.send(result(1,'page不为空',{}));
    if(!pageSize)
        return res.send(result(1,'pageSize不为空',{}));
    Promise.all([
        commonController.getCountByTable('log'),
        logController.getLogList({
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

router.post('/info', (req: any, res: any) => {
    let logInfo: any = req.body;
    const checkNotNullFields = ['logType','logContent'];
    let error: any = [];
    checkNotNullFields.map(item => {
        if(!logInfo[item]){
            error.push(`${item} 不为空`);
        }
    });
    if(error.length > 0){
        return res.send(result(1, error.toString(), null));
    }else{
        logInfo.createTime = new Date();
        logController.addLog(logInfo)
            .then((response: any) => {
                res.send(result(0, 'success', response.insertId));
            })
            .catch((error: any) => {
                res.send(result(1, error, null));
            })
    }
})

export default router;
import * as express from 'express';
import result from '../module/result';
import userController from '../controller/userController';
import { codeConfig } from '../config';
// import QcloudSms from 'qcloudsms_js';
import client from '../common/redisClient';

const QcloudSms = require('qcloudsms_js');
const router = express.Router();

router.get('/checkLogin', (req: any, res: any) => {
    let userId = req.session.user_id;
    userController.getUserById(userId)
        .then((response: any) => {
            res.send(result(0, 'success', response[0]));
        })
        .catch((error: any) => {
            res.send(result(1, error, null));
        })
})

router.get('/code', (req: any, res: any) => {
    let phone = req.session.phone,
        type = req.query.type;
    // 实例化
    const qcloudsms = QcloudSms(codeConfig.appid, codeConfig.appkey);
    // 创建单发短信对象
    const ssender = qcloudsms.SmsSingleSender();
    let randomCode: string = '';
    for(let i = 0; i < 4; i++){
        randomCode = `${randomCode}${Math.floor(Math.random() * 10)}`
    }
    client.setAsync(`${type}_code`,randomCode, 'EX', 5 * 60)
        .then((val: any) => {
            ssender.sendWithParam(86, phone, codeConfig.templateId,
                [randomCode], codeConfig.smsSign, "", "",
                    (err: any, codeRes: any, resData: any) => {
                        res.send(result(0, `短信已发送至${phone}`, resData));
                });
        })
        .catch((err: any) => {
            res.send(result(1, err, null));
        })
})

export default router;
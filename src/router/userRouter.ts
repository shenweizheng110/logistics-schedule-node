import * as express from 'express';
import result from '../module/result';
import userController from '../controller/userController';
import client from '../common/redisClient';

const router = express.Router();

router.put('/info/:type',(req: any, res: any) => {
    let userInfo = req.body,
        type = req.params.type;
    userInfo.id = req.session.user_id;
    if(type !== 'base'){
        client.getAsync(`${type}_code`)
            .then((response: any) => {
                if(!response || response !== userInfo.code){
                    return res.send(result(1, '验证码错误', null));
                }else{
                    userController.updateUserById(userInfo)
                    .then((response: any) => {
                        client.delAsync(`${type}_code`);
                        res.send(result(0, '修改成功', null));
                    })
                    .catch((error: any) => {
                        res.send(result(1, error, null));
                    })
                }
            })
    }else{
        userController.updateUserById(userInfo)
        .then((response: any) => {
            res.send(result(0, '修改成功', null));
        })
        .catch((error: any) => {
            res.send(result(1, error, null));
        })
    }
})

export default router;
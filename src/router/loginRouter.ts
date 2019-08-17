import * as express from 'express';
import result from '../module/result';
import loginController from '../controller/loginController';

const router = express.Router();

router.post('/login', (req: any, res: any) => {
    let { phone, password } = req.body;
    if(!phone || !password){
        return res.send(result(1,'手机号或密码不为空',null));
    }else{
        loginController.login(phone)
            .then((response: any) => {
                let val: any = response ? response[0] : null;
                if(!val || val.password !== password){
                    res.send(result(1, '手机号或密码错误', null));
                }else{
                    delete val.password;
                    req.session.user_id = val.id;
                    req.session.phone = val.phone;
                    req.session.save((err: any) => {
                        res.send(result(0, '登录成功', val));
                    })
                }
            })
    }
})

router.get('/logout', (req: any, res: any) => {
    req.session.user_id = null;
    res.send(result(0, 'success', null));
})

export default router;
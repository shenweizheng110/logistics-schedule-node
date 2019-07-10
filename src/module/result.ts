// @params code: 操作码  0: 成功 1:失败
// @parmas msg: 返回消息
// @params data: 返回数据
export default function(code: number, msg: string, data: any) {
    return {
        code: code,
        msg: msg,
        data: data
    }
}
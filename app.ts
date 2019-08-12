import * as express from 'express';
import * as morgan from 'morgan';
import * as path from 'path';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import vehicleRouter from './src/router/vehicleRouter';
import orderRouter from './src/router/orderRouter';
import driverRouter from './src/router/driverRouter';
import cityRouter from './src/router/cityRouter';
import scheduleRouter from './src/router/scheduleRouter';
import * as expressWs from 'express-ws';
import scheduleWs from './src/util/autoSchedule';
// import scheduleList from './src/util/scheduleCommon';

const appBase = express();
const connectMultiparty = require('connect-multiparty');
const FileStreamRotator = require('file-stream-rotator');
const logDirectory = path.join(__dirname, 'log');

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daliy',
    verbose: false
});

// 引入 websocket
let wsInstance = expressWs(appBase);

let { app } = wsInstance;

app.ws('/autoSchedule', (ws: any, req: any) => {
    scheduleWs(ws);
})

// 跨域
app.all('*', function(req: any, res: any, next: any) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    res.header('X-Powered-By', '3.2.1');
    res.header('Content-Type', 'application/json;charest=utf-8');
    next();
});

// morgan 日志中间件
app.use(morgan('combined', {stream: accessLogStream}));

// 解析 application/x-www-form-urlencoded格式
app.use(bodyParser.urlencoded({
    extended: false
}));

// 解析 application/json
app.use(bodyParser.json());

// 处理文件传输
app.use(connectMultiparty());

// 分发路由
app.use('/api/vehicle',vehicleRouter);
app.use('/api/order',orderRouter);
app.use('/api/driver',driverRouter);
app.use('/api/city',cityRouter);
app.use('/api/schedule',scheduleRouter);

// 设定端口
app.listen(3000);
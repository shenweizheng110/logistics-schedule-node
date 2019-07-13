import * as express from 'express';
import * as morgan from 'morgan';
import * as path from 'path';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import vehicleRouter from './src/router/vehicleRouter';
import orderRouter from './src/router/orderRouter';
import driverRouter from './src/router/driverRouter';

const connectMultiparty = require('connect-multiparty');
const FileStreamRotator = require('file-stream-rotator');
const app = express();
const logDirectory = path.join(__dirname, 'log');

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daliy',
    verbose: false
});

// 跨域
app.all('*', function(req, res, next) {
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

// 设定端口
app.listen(3000);
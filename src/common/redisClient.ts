// import * as redis from 'redis';
import * as bluebird from 'bluebird';
import redisConfig from '../config/redisConfig';

const redis = require('redis');

bluebird.promisifyAll(redis);

const client = redis.createClient(redisConfig);

// client.set('foo', 'test', redis.print);

client.on('error', (err:any) => {
    console.log(err);
})

export default client;
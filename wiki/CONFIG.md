# Config Object

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```server``` | ```object``` | | |
| &nbsp;&nbsp;&nbsp;&nbsp;```host``` | ```string``` | ```127.0.0.1``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;```port``` | ```number``` | ```7777``` | |
| ```factory``` | ```object``` | | [Fastify Server](https://fastify.dev/docs/latest/Reference/Server) factory options |
| &nbsp;&nbsp;&nbsp;&nbsp;```trustProxy``` | ```boolean``` | ```true``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;```bodyLimit``` | ```number``` | ```10485760``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;```pluginTimeout``` | ```number``` | ```30000``` | |
| ```deferLog``` | ```boolean``` | ```false``` | Set ```true``` to defer log at Fastify onResponse |
| ```prefixVirtual``` | ```string``` | ```~``` | Virtual route prefix to use |
| ```printRoutes``` | ```boolean``` | ```true``` | Print routes on startup |
| ```cors``` | ```object``` | | Defaults to [Fastify Cors](https://github.com/fastify/fastify-cors) options |
| ```compress``` | ```object``` | | Defaults to [Fastify Compress](https://github.com/fastify/fastify-compress) options |
| ```helmet``` | ```object``` | | Defaults to [Fastify Helmet](https://github.com/fastify/fastify-helmet) options |
| ```rateLimit``` | ```object``` | | Defaults to [Fastify Rate Limit](https://github.com/fastify/fastify-rate-limit) options |
| ```multipart``` | ```object``` | | Defaults to [Fastify Multipart](https://github.com/fastify/fastify-multipart) options |
| &nbsp;&nbsp;&nbsp;&nbsp;```attachFieldsToBody``` | ```boolean``` | ```true``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;```limits``` | ```object``` | | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```parts``` | ```number``` | ```100``` | |
| ```noIcon``` | ```boolean``` | ```true``` | |
| ```underPressure``` | ```object``` | | Defaults to [Fastify Under Pressure](https://github.com/fastify/fastify-under-pressure) options |
| ```forwardOpts``` | ```object``` | | Options for route forward |
| &nbsp;&nbsp;&nbsp;&nbsp;```disableRequestLogging``` | ```boolean``` | ```true``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;```undici``` | ```object``` | | Defaults to [Undici](https://github.com/nodejs/undici) options |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```connections``` | ```number``` | ```128``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```pipelining``` | ```number``` | ```1``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```keepAliveTimeout``` | ```number``` | ```60000``` | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```tls``` | ```object``` | | |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;```rejectUnauthorized``` | ```boolean``` | ```false``` | |
| ```qsKey``` | ```object``` | | Query string keys used to build model/database filter |
| &nbsp;&nbsp;&nbsp;&nbsp;```bbox``` | ```string``` | ```bbox``` | Key to use for bbox setting |
| &nbsp;&nbsp;&nbsp;&nbsp;```bboxLatField``` | ```string``` | ```bboxLatField``` | Key to use to determine bbox's latitude |
| &nbsp;&nbsp;&nbsp;&nbsp;```bboxLngField``` | ```string``` | ```bboxLngField``` | Key to use to determine bbox's longitude |
| &nbsp;&nbsp;&nbsp;&nbsp;```query``` | ```string``` | ```query``` | Key to use for query |
| &nbsp;&nbsp;&nbsp;&nbsp;```match``` | ```string``` | ```match``` | Key to enter fulltext matching |
| &nbsp;&nbsp;&nbsp;&nbsp;```skip``` | ```string``` | ```skip``` | Key to skip page |
| &nbsp;&nbsp;&nbsp;&nbsp;```page``` | ```string``` | ```page``` | Key to go to page number |
| &nbsp;&nbsp;&nbsp;&nbsp;```limit``` | ```string``` | ```limit``` | Key to limit model per page |
| &nbsp;&nbsp;&nbsp;&nbsp;```sort``` | ```string``` | ```sort``` | Key to sort model |
| &nbsp;&nbsp;&nbsp;&nbsp;```fields``` | ```string``` | ```fields``` | Key to show model fields |
| &nbsp;&nbsp;&nbsp;&nbsp;```lang``` | ```string``` | ```lang``` | Key for language setting |


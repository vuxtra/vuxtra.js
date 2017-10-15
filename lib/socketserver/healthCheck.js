module.exports.attach = (worker, router) => {
    // This will be executed on every broker
    const healthCheckQueryFn = () => {
        return 1;
    };
    healthCheckQueryFn.mapIndex = '*';
    router.get('/health-check', ctx => {
        worker.exchange.run(healthCheckQueryFn, (err, data) => {
            if (err) {
                ctx.status = 500;
                ctx.body = 'Failed';
            } else {
                ctx.status = 200;
                ctx.body = 'OK';
            }
        });
    });
};
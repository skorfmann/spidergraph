"use strict";
exports.__esModule = true;
var iterall_1 = require("iterall");
exports.withDirectivePublish = function (asyncIteratorFn) {
    return function (rootValue, args, context, info) {
        var asyncIterator = asyncIteratorFn(rootValue, args, context, info);
        return _a = { next: function () {
                    return asyncIterator.next().then(function (payload) {
                        if (context.publish) {
                            context.publish(payload);
                        }
                        return payload;
                    });
                }, "return": function () {
                    return Promise.resolve({ value: undefined, done: true });
                }, "throw": function (error) {
                    return Promise.reject(error);
                } }, _a[iterall_1.$$asyncIterator] = function () {
            return this;
        }, _a;
        var _a;
    };
};

function Event(){
    var _message = {};
    return {
        /**
         * 订阅消息
         * type:消息类型， callback:消息回调函数， context:回调函数执行时的作用域
         * return 当前对象，方便链式调用
         */
        on: function(type, callback, context){
            if (_message[type]) {
                // 加入新的回调函数
                _message[type].push({
                    callback: callback || function(){},
                    context: context || null
                })
            } else {
                _message[type] = [];
                this.on(type, callback, context);
            }
            return this;
        },
        /**
         * 单次订阅消息
         * type:消息类型， callback:消息回调函数， context:回调函数执行时的作用域
         * return 当前对象，方便链式调用
         */
        once: function(type, callback, context){
            context = context || null;
            // 在触发前将它销毁，因此我们要将回调函数装饰城一个新的函数，从而提供销毁该回调函数的机会
            var fn = function(){
                this.removeListener(type, {callback: fn, context: context});
                callback.apply(context, arguments);
            }.bind(this);
            this.on(type, fn, context);
        },
        /**
         * 发布消息
         * type:消息类型
         * return 返回每个回调函数执行时的结果以及传递的数据
         */
        emit: function(type){
            var arg = [].slice.call(arguments, 1);  // 第二个开始的所有参数
            var result = [];
            if (_message[type]) {
                _message[type].forEach(function(obj){
                    result.push(obj.callback.apply(obj.context, arg));    
                });
            // 如果没有该订阅，返回null
            } else {
                return null;
            }
            return result.concat(arg);
        },
        /**
         * 注销消息
         * type:消息类型，messageObject：消息成员对象或回调函数， 
         * return 当前对象，方便链式调用
         */
        removeListener: function(type, messageObject){
            if (!type) {
                _message = {};
                return this;
            }
            if (_message[type]) {
                if (messageObject) {
                    // array.filter()方法返回一个新的数组，保留回调函数中返回true的那项。该方法不会改变原始数组
                    _message[type] = _message[type].filter(function(msgObj){
                        return typeof messageObject === 'function' ? msgObj.callback !== messageObject : 
                            (msgObj.callback !== messageObject.callback || msgObj.context !== messageObject.context);
                    })
                } else {
                    _message[type] = [];
                }
            }
            return this;
        }
    }
};
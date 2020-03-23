var Class = function(parent){
    var klass = function(){
        this.init.apply(this, arguments);
    }

    // 改变klass的原型(给类库添加继承,通过可选的父类parent构造函数)
    if (parent) {
        var subclass = function(){};
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
    }

    klass.prototype.init = function(){};

    klass.fn = klass.prototype;         // 定义prototype的别名
    klass.fn.parent = klass;            // 定义类的别名
    klass._super = klass.__proto__;     // __proto__是隐式原型

    // extend方法，给类添加属性
    klass.extend = function(obj){
        var extended = obj.extended;
        for (var i in obj) {
            klass[i] = obj[i];
        }
        if (extended) { extended(klass); }
    }
    
    // inckude方法，给实例添加属性
    klass.include = function(obj){
        var included = obj.included;
        for (var i in obj) {
            klass.fn[i] = obj[i];
        }
        if (included) { included(klass); }
    }

    // proxy函数，用于改变作用域为当前实例对象。也可以使用$.proxy(fn, context) 和 bind()
    klass.proxy = function(func){
        var selft = this;
        return (function(){
            return func.apply(self, arguments);
        });
    }
    klass.fn.proxy = klass.proxy;

    return klass;
}

// Model对象用于创建新模型和实例
var Model = {
    inherited: function(){},
    created: function(){},
    prototype: {
        init: function(){}
    },

    // create()返回一个对象，这个对象继承自Model对象，我们使用它来创建新模型
    create: function(){
        var object = Object.create(this);
        object.parent = this;
        object.prototype = object.fn = Object.create(this.prototype);
        
        object.created();
        this.inherited(object);
        return object;
    },

    // init()函数返回一个新对象，它继承自Model.prototype,如Model对象的一个实例
    init: function(){
        var instance = Object.create(this.prototype);
        instance.parent = this;
        instance.init.apply(instance, arguments);
        return instance;
    },

    extend: function(o){
        var extended = o.extended;
        for(var i in o) {
            this[i] = o[i];
        }
        if (extended) { extended(this); }
    },

    include: function(o){
        var included = o.included;
        for (var i in o) {
            this.prototype[i] = o[i];
        }
        if (included) { included(this); }
    },
    // 生成128位全局唯一标识符guid(默认第一位是字母G).
    generateGUID: function( preStr ){
        var guid = 'gxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); // Math.random()*16|0获取0~15的整数
            return v.toString(16);  // toString(16)将数字转换为16进制的字符串
        }).toUpperCase();
        return typeof preStr === 'string' ? preStr + guid : guid;
    }
};

Model.records = {};

// 添加对象属性
Model.extend({
    // 通过id查找，找不到则抛出异常
    find: function(id){
        var record = this.records[id];
        // 因为是保存的是实例对象，所以这儿可以这么判断是否存在
        if (!record) { throw new Error("Unknown record"); }
        return record.dup();
    },
    
    created: function(){
        // 用来保存资源的对象,创建新的模型时设置一个新的records对象，避免被所有模型所共享的副作用
        this.records = {}; 
        this.attributes = [];   // 判断哪些属性需要序列化
    },

    // populate()函数对任何给定的值做遍历、创建实例并更新records对象
    populate: function(values){
        // 重置model和records
        this.records = {};

        for (var i=0, il=values.length; i<il; i++) {
            var record = this.init(values[i]);
            record.newRecord = false;
            this.records[record.id] = record;
        }
    }
});

// 添加实例属性
Model.include({
    newRecord: true,

    init: function(atts){
        if (atts) { this.load(atts); }
    },

    load: function(attributes){
        for (var name in attributes) {
            this.name = attributes[name];
        }
    },

    // 这儿的create添加到prototype上，实例对象能用，且不会和Model.create()混淆
    create: function(){
        if (!this.id) { this.id = Model.generateGUId(); }
        this.newRecord = false;
        this.parent.records[this.id] = this.dup();
    },

    destroy: function(){
        delete this.parent.records[this.id];
    },

    // （只有该方法）更新一个已存在的实例,其他方法都是对象的拷贝
    update: function(){
        this.parent.records[this.id] = this.dup();
    },

    // 保存实例
    save: function(){
        this.newRecord ? this.create() : this.update();
    },

    // 深拷贝
    dup: function(){
        return jQuery.extend(true, {}, this);
    },

    // attributes()函数，用以返回包含属性到值的映射的对象
    attributes: function(){
        var result = {};
        for (var i in this.parent.attributes) {
            var attr = this.parent.attributes[i];
            result[attr] = this[attr];
        }
        result.id = this.id;
        return result;
    },

    toJSON: function(){
        return this.attributes();
    },

    // 保存数据到localStorage
    saveLocal: function(name){
        // 将记录转换为数组
        var result = [];
        for (var i in this.records) {
            result.push(this.records[i]);
        }
        localStorage[name] = JSON.stringify(result);
    },

    // 从localStorage中读取数据 
    loadLocal: function(name){
        var result = JSON.parse( localStorage[name] );
        this.populate(result);
    },

    // 创建记录到服务器（POST）。REST约定
    createRemote: function(url, callback){
        $.post(url, this.attributes(), callback);
    },

    // 更新记录到服务器(PUT)。REST约定
    updateRemote: function(url, callback){
        $.ajax({
            url:        url,
            data:       this.attributes(),
            success:    callback,
            type:       "PUT"
        });
    }
});


/**
 * 使用方法
 * var Asset = Model.create();
 * var User = Model.create();
 * var user = User.init();
 * user.name = 'xiaoming';
 * user.save();
 * user.id;     // “xxxxx...xxxx”
 * user.destroy();
 */
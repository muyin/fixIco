// todo：返回的位置参数{left:xx,top:xx,width:xx, height:xx}是缩放前的还是缩放后的，旋转后的还是旋转前的应该明确
// 相对于当时的div左上角。是缩放后的
// big通过元素获取的是未旋转前的位置参数，width,height也是未旋转前的宽高。
// 所以big存储的也应该是未旋转前的位置参数。计算时需要先计算旋转后的big位置参数
// 而tiny没有旋转，位置参数是相对于旋转后的big的正确偏移。所以tiny的位置在big旋转后需要从新计算。
;(function(window, document, $, undefined){
    // 发布订阅模式
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
    var DragDrop = (function(){
        var dragdrop = Event(),
            dragging = null, mdragging = null, diffX = 0, diffY = 0;
        function handleEvent(event){
            event = event || window.event;
            var target = event.target || event.srcElement;
            // 确定事件类型
            switch(event.type){
                case 'mousedown':
                    // event.clientX是事件发生时鼠标到视口左边的距离， target.offsetLeft是目标元素到父元素左边的距离
                    diffX = event.clientX - target.offsetLeft;      // 鼠标到元素左边界的距离
                    diffY = event.clientY - target.offsetTop;       // 鼠标到元素上边界的距离
                    if (target.className.indexOf('mdraggable') > -1) {
                        mdragging = target;
                        dragdrop.emit('dragstart', {type:"dragstart", target:mdragging, x:event.clientX, y:event.clientY, origEvent:event,
                                diffX:diffX, diffY:diffY});
                    } else if (target.className.indexOf('draggable') > -1) {
                        dragging = target;
                        dragdrop.emit('dragstart', {type:"dragstart", target:dragging, x:event.clientX, y:event.clientY, origEvent:event,
                                diffX:diffX, diffY:diffY});
                    }
                    break;
                case 'mousemove':
                    if (dragging !== null) {
                        // 指定位置，修护拖动时鼠标跑到目标元素左上角的bug
                        dragging.style.left = (event.clientX - diffX) + 'px';
                        dragging.style.top = (event.clientY - diffY) + 'px';
                        dragdrop.emit('drag',  {type:"drag", target:dragging, x:event.clientX, y:event.clientY, origEvent:event});
                    } else if (mdragging !== null) {
                        dragdrop.emit('drag', {type:"drag", target:mdragging, x:event.clientX, y:event.clientY, origEvent:event});
                    }
                    break;
                case 'mouseup':
                    if (dragging !== null) {
                        dragdrop.emit('dragend', {type:"dragend", target:dragging, x:event.clientX, y:event.clientY, origEvent:event});
                    } else if (mdragging !== null) {
                        dragdrop.emit('dragend', {type:"dragend", target:mdragging, x:event.clientX, y:event.clientY, origEvent:event});
                    }
                    mdragging = null;
                    dragging = null;
                    break;
            }
        }
        dragdrop.enable = function(){
            document.addEventListener('mousedown', handleEvent);
            document.addEventListener('mousemove', handleEvent);
            document.addEventListener('mouseup', handleEvent);
        }
        dragdrop.disable = function(){
            document.removeListener('mousedown', handleEvent);
            document.removeListener('mousemove', handleEvent);
            document.removeListener('mouseup', handleEvent);
        }
        return dragdrop;
    })();

    // 工具方法
    var u = {
        // 是否是数字
        isNumber: function isNumber(value) {
            return typeof value === 'number' && !isNaN(value);
        },
        // 是否是函数
        isFunction: function isFunction(value) {
            return typeof value === 'function';
        },
        // 是否是对象
        isObject: function isObject(value) {
            return typeof(value) === 'object' && value !== null;
        },
        // 是否是字符串
        isString: function isString(value){
            return typeof value === 'string';
        },
    };

    // bigDiv的背景图片是bg, FixIcoDiv的背景图片是ico
    var FixIco = function(conf){
        this.init(conf);
    }
    // 定义别名
    _f = FixIco;
    FixIco.fn = FixIco.prototype;

    // 给类添加属性方法
    FixIco.extend = function(obj){
        var extended = obj.extend;
        for (var i in obj) {
            FixIco[i] = obj[i];
        }
        if (extended) { extended(FixIco); }
    };
    // 给实例添加属性方法
    FixIco.include = function(obj){
        var included = obj.included;
        for (var i in obj) {
            FixIco.prototype[i] = obj[i];
        }
        if (included) { included(FixIco); }
    };

    // 给类添加方法
    FixIco.extend({
        // 生成全局唯一标识符guid(默认第一位是字母G,128位)
        generateGUID: function generateGUID(preStr){
            var guid = 'gxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); // Math.random()*16|0获取0~15的整数
                return v.toString(16);
            }).toUpperCase();
            return typeof preStr === 'string' ? preStr + guid : guid;
        },
        // 创建新的样式表。 css是css样式字符串
        loadStyleString: function(css){
            var style = document.createElement('style');
            style.type = 'text/css';
            try {
                style.appendChild( document.createTextNode(css) );
            } catch (ex) {
                // 对于IE
                style.styleSheet.cssText = css;
            }
            document.getElementsByTagName('head')[0].appendChild(style);
        },
        // 获取图片的真实尺寸大小
        getImgRealSize: function(imgsrc, cb){
            var img = new Image();
            img.src = imgsrc;
            img.onload = function(){
                cb(img.width, img.height);
            }
        },
        // 加上单位。 obj: {string|number|object}
        addpx: function(obj){
            if ( u.isNumber(obj) ) {
                return obj + 'px';
            } else if ( u.isString(obj) ) {
                return obj.slice(-2) === 'px' ? obj : obj + 'px';
            } else if ( u.isObject(obj) ) {
                for (var i in obj) {
                    if ( obj.hasOwnProperty(i) ) {
                        obj[i] = this.addpx( obj[i] );
                    }
                }
                return obj;
            } else {
                return obj;
            }
        },
        // 去掉单位px  obj: {string|number|object}
        rmpx: function(obj){
            if ( u.isString(obj) ) {
                return obj.slice(-2) === 'px' ? +obj.slice(0, -2) : +obj;
            } else if ( u.isObject(obj) ) {
                for (var i in obj) {
                    if ( obj.hasOwnProperty(i) ) {
                        obj[i] = this.rmpx( obj[i] );
                    }
                }
                return obj;
            } else {
                return obj;
            }
        },
        // 获取鼠标到finalTarget对象的距离（在缩放图片中就是缩放距离）
        getCursorPosition: function(event, finalTarget){
            finalTarget = finalTarget ? finalTarget : null; // 当为null时，取到body边界的距离
            var styleLeft = event.offsetX,  // 事件点到元素左上角参考点的横向长度(chrome下包含边框border)
                styleTop = event.offsetY,
                current = event.target;
            while (current !== finalTarget) {
                styleLeft += current.offsetLeft;        // 当前元素到定位父元素的横向偏移
                styleTop += current.offsetTop;
                current = current.offsetParent;         // 定位父元素
            }
            return {left: styleLeft, top:styleTop};
        }
    });

    // 给实例添加方法
    FixIco.include({
        init: function(conf){
            var me = this;
            var defconf = {     // 默认配置
                width: '600px',     // 指定元素的宽。todo:可去掉单位
                height: '500px',
                pattern: 'bg',      // 展示模式。 bg:图片作为div的背景展示(默认)， img:图片直接展示（客户端支持）
                tinys: {},          // 用于存放tinydiv
                bigId: _f.generateGUID(),   // 大Div的id
                defTinyWidth: '50px',       // 小tiny的默认宽
                defTinyHeight: '50px',
                format: 'image/png',
                zIndex: 1000,
                rotateAngle: 0,     // 背景选择角度
                scale: 1,           // 缩放比例。todo:可改为zoom
                allowDrawOutBig: true,      // 允许手绘tinyDiv时超出big的范围
                allowMoveOutBig: false,     // 允许拖动tinyDiv时超出big的范围
                dragendFn: function(){},    // dragend触发的函数 todo:可添加更多函数和设置参数 
            };
            me.records = {};    // 存储对象
            me.original = {};   // 存储所有bg和tiny的原始参数
            me.ids = {};
            me.conf = $.extend(true, {}, defconf, conf);    // extend会复制原型
            me.pattern = me.conf.pattern;       // 展示模式。bg,img
            me.ids.out = _f.generateGUID();     // todo:可改名为outId,直接放在FixIco下
            me.ids.big = _f.generateGUID();     // todo:可改名为bigId,可直接放在FixIco下
            me.domId = me.conf.dom;               // 根对象的id
            me.bigId = me.ids.big;              // big的id
            me.outId = me.ids.out;              // out的id
            me.el = document.getElementById(me.domId);    // 根元素对象
            me.class = {};
            me.initStyles();
            me.initHtml();
            DragDrop.enable();          // 开启拖动功能
            me.bindEvents();            // 绑定事件
        },
        initStyles: function(){
            var me = this, styles = {};
            styles[ me.outId ] = { position:"relative", width:"100%", height:"100%", margin:0, padding:0, border:0,
                                    outline:"2px solid #c5c5c5", overflow:"hidden", zIndex: me.conf.zIndex++ };
            styles[ me.bigId ] = { position:"absolute", left:"10%", top:"10%", width:"80%", height:"80%", 
                                    margin:0, padding:0, border:0, zIndex: me.conf.zIndex++ };
            styles[ me.domId ] = { width:me.conf.width, height:me.conf.height, padding:"10px" };
            me.conf.styles = styles;
        },
        // 初始化页面
        initHtml: function(){
            var me = this,
                divStr = '<div id="' + me.ids.big + '" class="mdraggable"></div>',
                imgStr = '<img id="' + me.ids.big + '" class="mdraggable" draggable="false" src="">';
            var big = me.conf.pattern === 'bg' ? divStr : imgStr;
            var html = '<div id="' + me.ids.out +'">' + big + '</div>';
            me.el.innerHTML = html;
            $('#'+me.domId).css( me.conf.styles[me.domId] );
            $('#'+me.ids.out).css( me.conf.styles[me.ids.out] );
            $('#'+me.ids.big).css( me.conf.styles[me.ids.big] );
        },
        // 获取所有的数据。偏移相当于out的左上角。 isOrigin:换算为缩放前的偏移和位置 todo:应该同时输出缩放和未缩放前的位置
        getAllData: function(isOrigin){
            var me = this,
                obj = {
                    tinysPst: {},                       // tiny的位置参数（相对于out）
                    tinysPstAboutBig: {},               // tiny的位置参数（相对于big）
                    overTinys: {},                      // tiny相对于big的位置
                    scale: me.conf.scale,               // 缩放比例
                    rotateAngle: me.conf.rotateAngle    // 旋转角度
                },
                bigPst = me.getPst( me.readInfo(me.ids.big) ),  // 获取big不带单位的位置参数。应该是未旋转时的位置
                newBigPst = me.calcBigRange(bigPst, me.conf.rotateAngle),   // 当前旋转角度下big的位置
                getOrigin = function(pst, scale){
                    return { left: pst.left/scale, top: pst.top/scale, width: pst.width/scale, height: pst.height/scale };
                };
            obj.bigPst = isOrigin ? getOrigin(newBigPst, obj.scale) : newBigPst;    // big的位置
            for (var id in me.conf.tinys) {
                var tinyPst = me.getPst( me.readInfo(id) ),
                    state = me.checkTinyPstAboutBigDiv(tinyPst, newBigPst); // 获取tiny相对于当前旋转角度下big的位置
                obj.overTinys[id] = state;
                obj.tinysPst[id] = isOrigin ? getOrigin(tinyPst, obj.scale) : tinyPst;
            }
            return obj;
        },
        // 替换big图片或bigDiv的背景图片，并使图片在out中尽量展示更多
        replaceBigImg: function(newImg){
            var me = this;
            // 取消big图片并隐藏
            if (!newImg) {
                if (me.conf.pattern === 'bg') {
                    me.replaceBg( me.bigId, '');
                } else if (me.conf.pattern === 'img') {
                    me.replaceImgSrc(me.bigId, '')
                }
                $('#'+me.bigId).css({visibility: "hidden"});    // 隐藏
                me.storeInfo(me.bigId, {width: 0, height: 0});
                return me;
            }
            // 更换big图片
            _f.getImgRealSize(newImg, function(imgWidth, imgHeight){
                // 根据背景图片大小更改big的大小和位置
                var out = $('#'+me.outId)[0],
                    outWidth = out.clientWidth,     // out的宽度，只包括content+padding
                    outHeight = out.clientHeight;     // out的高度，只包括content+padding
                var info = me.calcInitPstAndScale(outWidth, outHeight, imgWidth, imgHeight);
                me.original[me.bigId] = { width:imgWidth, height:imgHeight };
                me.conf.scale = info.scale;
                delete info.scale;
                $('#'+me.bigId).css({visibility: "inherit"});   // 取消隐藏
                $('#'+me.bigId).css(info);
                if (me.pattern === 'bg') {
                    me.replaceBg(me.bigId, newImg);
                } else if (me.pattern === 'img') {
                    me.replaceImgSrc(me.bigId, newImg)      // todo:更换个图片用了三个api,也许可以合并一下
                }
                me.storeInfo(me.bigId, info);
                me.resizeWidthAndHeight();
            });
        },
        // 更换tiny的背景图片或其内的图片. id:tiny的id值(string)或位置值(number) newIco:新图片的src
        replaceTinyImg: function(id, newIco){
            var me = this;
            if ( u.isNumber(id) ) { id = Object.keys(me.conf.tinys)[id] }
            if ( !me.conf.tinys[id] ) { return false; }     // 输入的id不存在
            _f.getImgRealSize(newIco, function(imgWidth, imgHeight){
                var scaleWidth = imgWidth * me.conf.scale,
                    scaleHeight = imgHeight * me.conf.scale;    // todo:应该存储tiny的真实宽高
                me.original[id] = { width: imgWidth, height: imgHeight };
                $('#'+id).css( _f.addpx({width: scaleWidth, height: scaleHeight}) );
                if (me.pattern === 'img') {
                    me.replaceImgSrc(id, newIco);
                } else if (me.pattern === 'bg') {
                    me.replaceBg(id, newIco);
                }
                me.storeInfo(id, {width: scaleWidth, height: scaleHeight});
            });
        },
        // 替换图片的src  el:图片的id或图片对象
        replaceImgSrc: function(el, newImg){
            if ( u.isString(el) ) {
                // 取消图片可拖动，即取消drop拖放事件，不然无法连续触发mousemove事件
                $('#'+el).attr( {'src': newImg, 'draggable': 'false'} );
            } else {
                $(el).attr( {'src': newImg, 'draggable': 'false'} );
            }
        },
        // 替换div显示的背景图片  newImg:新图片的路径，string
        replaceBg: function(id, newImg){
            // 背景颜色，图片地址，图片定位，图片宽高，图片不重复
            var style = 'transparent url("' + newImg + '") left top / 100% 100% no-repeat';
            $('#'+id).css( {background: style} );
        },
        // 获取旋转后的角度。 isClockwise: 是否是顺时针变化
        getRotateDeg: function(oldRotateDeg, isClockwise){
            var angles = [0, 90, 180, 270],
                i = angles.indexOf(oldRotateDeg);
            return isClockwise ? angles[ (i+1) % 4 ] : angles[ (i+4-1) % 4 ];
        },
        // 标准计算公式。计算一点的位置(x0,yo)在相对于中心点(rx0,ry0)顺时针旋转a幅度后的位置
        calcRotatePoint: function(x0, y0, rx0, ry0, a){
            var pst1 = {};
            pst1.x = (x0-rx0) * Math.cos(a) + (y0-ry0) * Math.sin(a) + rx0;
            pst1.y = (y0-ry0) * Math.cos(a) - (x0-rx0) * Math.sin(a) + ry0;
        },
        // 计算一个点旋转变换后的偏移
        // left0,top0:变换前 点 的偏移， rleft0, rtop0:旋转中心点的偏移。相当于div坐标系原点（out左上角）的偏移
        // deg0,deg1: 旋转前后的旋转角度
        calcPointPstWhenRotate: function(left0, top0, rleft0, rtop0, deg0, deg1){
            // 将div坐标系变换为数学坐标系(如果以out的左上角为坐标原点，则x0=left, y0=-top)
            var x0 = left0, y0 = -top0,
                rx0 = rleft0, ry0 = -rtop0,
                a = (deg1 - deg0) * (Math.PI / 180);    // 旋转幅度. 算是顺时针旋转
            var pst1 = this.calcRotatePoint(x0, y0, rx0, ry0, a);
            return { left: pst1.x, top: -pst1.y };      // 将数学坐标系变换成div坐标系
        },
        // 旋转一个元素。newRotateDeg:现在的旋转角度 isClockwise:是否顺时针旋转
        // todo:可以写为rotate和rotateTo，更好理解。这儿相当于rotateTo
        rotateOne: function(id, newRotateDeg, cb){  
            var rp = "rotate(" + newRotateDeg + "deg)";
            // css前缀 -ms-:IE9, -webkit-:Safari和chrome
            $('#'+id).css( {transform:rp, '-ms-transform':rp, "-webkit-transform":rp, "-o-transform":rp, "-moz-transform":rp} );
            if ( u.isFunction(cb) ) { cb(); }
        },
        // 旋转所有元素
        rotateAll: function(isClockwise, cb){
            var me = this,
                oldDeg = me.conf.rotateAngle,   // 旋转前的角度
                newDeg = me.getRotateDeg(oldDeg, isClockwise);  // 旋转后的角度
            me.conf.rotateAngle = newDeg;
            // 旋转big(以big的中心点旋转)
            me.rotateOne(me.bigId, newDeg, function(){
                // 修正tiny的位置，使其中心点相对于旋转后的big位置不变
                var bigPst = me.getPst(me.bigId);
                    bigCenterX = bigPst.left + bigPst.width/2,  // big中心点X坐标(相对于out)
                    bigCenterY = bigPst.top + bigPst.height/2;  // big中心点Y坐标
                for (var id in me.conf.tinys) {
                    var tinyPst = me.getPst( me.record[id] ),
                        x0 = tinyPst.left + tinyPst.width/2,    // 一个tiny中心点X坐标(相对于out)
                        y0 = tinypst.top + tinyPst.height/2;    // 一个tiny中心点Y坐标
                    var newPoint = me.calcPointPstWhenRotate(x0, y0, bigCenterX, bigCenterY, oldDeg, newDeg);
                    newPoint.left -= tinyPst.width/2;           // 恢复为中心点不变的偏移
                    newPoint.top -= tinyPst.height/2;           // 恢复为中心点不变的偏移
                    $('#'+id).css( _f.addpx(newPoint) );        // todo:可以将tiny变成一个对象，存储常用变量，方法
                    me.storeInfo(id, _f.addpx(newPoint));       // 存储big旋转后，该tiny新的位置
                }
            });
        },
        // 放大缩小一个元素 isZoomIn:是否放大， centerPst:缩放中心点位置
        zoomOne: function(event, id, isZoomIn, centerPst, cb){
            var me = this,
                idPst = me.getPst( me.records[id] ),    // 缩放时位置参数从存储对象中获得，这样精度更高，防止误差累计
                zoomInfo = me.calcNewPstWhenZoom(idPst, isZoomIn, centerPst);
            $('#'+id).css( me.getPst(zoomInfo, true) );
            if ( u.isFunction(cb) ) { cb(zoomInfo, event, id, isZoomIn, centerPst); }
        },
        // 放大缩小所有的元素。isZoomIn:是否放大
        zoomAll: function(event, isZoomIn, cb){
            var me = this,
                oldscale = me.conf.scale,
                newscale,
                cursorPst,      // 鼠标在out中的偏移位置{left:xx, top:xx}
                ids = Object.keys(me.records);
            // 缩放每一个元素，所有元素相对于光标位置缩放
            cursorPst = _f.getCursorPosition(event, $('#'+me.out)[0]);
            for (var i=0, len=ids.length; i<len; i++) {
                if (ids[i] === me.bigId) {
                    // 缩放big图片
                    me.zoomOne(event, me.bigId, isZoomIn, cursorPst, function(zoomInfo){
                        me.storeInfo(me.bigId, me.getPst(zoomInfo));
                        newscale = oldscale * zoomInfo.scaleZoom;
                    });
                } else if ( me.conf.tinys[ids[i]] ) {
                    // 缩放tiny
                    me.zoomOne(event, ids[i], isZoomIn, cursorPst, function(zoomInfo){
                        me.storeInfo(ids[i], me.getPst(zoomInfo));
                    });
                } else if (ids[i] === me.ids.out) {
                    continue;
                }
            }
            me.conf.scale = newscale;
        },
        // 计算div放大缩小后的位置信息。
        // divPst: div现在的位置参数{left:xx, top:xx, width:xx, height:xx}，
        // isZoomIn:是否放大。true-放大. 
        // centerPst:光标的位置{left:xx, top:xx}。有该值以光标缩放，没有该值以div中心点缩放
        // todo:存储div四个角的坐标，这样换算是不是会好一些
        calcNewPstWhenZoom: function(divPst, isZoomIn, centerPst){
            var level = 1.25,
                zoom = isZoomIn ? level : 1/level,  // 缩放比例（zoomIn放大，zoomOut缩小）
                obj = {};
            obj.scaleZoom = zoom;
            obj.width = divPst.width * zoom;        // div缩放后的宽度
            obj.height = divPst.height * zoom;      // div缩放后的高度
            // todo:可以改为 缩放后宽(高) = 自然宽(高) * 缩放值
            // 以光标点为中心缩放
            if (centerPst) {
                var ratioX = (centerPst.left - divPst.left) / divPst.width,     // 光标在图中横坐标的比例
                    ratioY = (centerPst.top - divPst.top) / divPst.height;      // 光标在图中纵坐标的比例
                obj.left = centerPst.left - obj.width * ratioX;
                obj.top = centerPst.top - obj.height * ratioY;
            // 以div中心点为中心缩放
            } else {
                obj.left = divPst.left + (divPst.width * 0.5 - divPst.width * zoom * 0.5);  // left + 缩放后的偏移
                obj.top = divPst.top + (divPst.height * 0.5 - divPst.height * zoom * 0.5);  // top + 缩放后的偏移
            }
            return obj;
        },
        // 修改有背景图片的div的缩放比例    // todo:这个方法可改名为zoomTo,可缓存图片的真实宽高
        modifyScale: function(id, setScale){
            var $el = $('#'+id),
                // backgroundImage返回值如 url:("base64")，只截取图片的base64出来
                imgsrc = $el.css('backgroundImage').slice(5, -2);
            _f.getImgRealSize(imgsrc, function(realWidth, realHeight){
                var nowWidth = realWidth * setScale,
                    nowHeight = realHeight * setScale;
                $el.css( {width: nowWidth, height: nowHeight} );
            });
        },
        // 重置某id的宽高。
        // scale:缩放比例(可不传) ids: 要重置的id,数组或字符串(可不传，此时重置big和所有tiny的宽高)。
        resizeWidthAndHeight: function(scale, ids){
            var me = this;
            scale = scale ? scale : me.conf.scale;  // 缩放比例
            ids = ids ? ids : Object.keys(me.original);     // 要重置宽高的id,数组或字符串
            if ( u.isString(ids) ) {
                var originalStyle = me.original[ids];       // img或div的原始宽高
                var newStyle = {width: originalStyle.width * scale, height: originalStyle.height * scale};
                $('#'+ids).css( _f.addpx(newStyle) );
                me.storeInfo(ids, newStyle);
            } else if ( u.isObject(ids) ) {
                for (var i in ids) {
                    var originalStyle = me.original[ids[i]];    // img或div的原始宽高
                    var newStyle = {width: originalStyle.width * scale, height: originalStyle.height * scale};
                    $('#'+ids[i]).css( _f.addpx(newStyle) );
                    me.storeInfo(ids[i], newStyle);
                }
            }
        },
        // 计算某图片在div中初始化时的宽高、偏移及缩放比例。要求div能最大限度完全显示图片
        calcInitPstAndScale: function(divWidth, divHeight, imgWidth, imgHeight){
            var imgInfo = {};
            if (imgWidth < divWidth && imgHeight < divHeight) {
                // 图片比div框小：图片大小不变，居中显示
                imgInfo = {
                    scale: 1,
                    width: imgWidth,
                    height: imgHeight,
                    left: (divWidth - imgWidth) / 2,
                    top: (divHeight - imgHeight) / 2
                }
            } else {
                // 图片比div框小：图片宽高比例>=div宽高比例，则以div宽为标准缩放。反之以div高为标准缩放
                // 以宽为标准缩放
                if (imgWidth/imgHeight >= divWidth/divHeight) {
                    imgInfo.scale = divWidth / imgWidth;
                    imgInfo.width = divWidth;
                    imgInfo.height = imgHeight * imgInfo.scale;
                    imgInfo.left = 0;
                    imgInfo.top = (divHeight - imgInfo.height) / 2;
                // 以高为标准缩放
                } else {
                    imgInfo.scale = divHeight / imgHeight;
                    imgInfo.width = imgWidth * imgInfo.scale;
                    imgInfo.height = divHeight;
                    imgInfo.left = ( divWidth - imgInfo.width) / 2;
                    imgInfo.top = 0;
                }
            }
            return imgInfo;
        },
        // 开启拖拽生成tinyDiv。    divId:开启拖拽功能的div容器
        openDrawTinyDiv: function(divId){
            $('#'+divId).addClass('canDrawTinyDiv');    // todo:可以使用h5的data-*属性
            return this;
        },
        // 关闭拖拽生成tinyDiv
        closeDrawTinyDiv: function(divId){
            $('#'+divId).removeClass('canDrawTinyDiv');
            return this;
        },
        // 检测某div是否开启拖拽生成tinyDiv
        checkDrawTinyDivState: function(divId){
            return $('#'+divId)[0].className.indexOf('canDrawTinyDiv') > -1;
        },
        // 添加一个tinyDiv. 带单位。 mycss:css样式{left:xx,top:xx, width:xx, height:xx} hasDel:右上角是否有删除标志
        addTiny: function(mycss, hasDel){

        },
        // 添加一个简单的tinyDiv
        addSimpleTiny: function(mycss){
            var me = this,
                bigPst = me.getPst(me.bigId),
                bigCenterX = (bigPst.left + bigPst.width / 2) + 'px',
                bigCenterY = (bigPst.top + bigPst.height / 2) + 'px',
                $tiny,
                tinyId = _f.generateGUID(),
                tinycss = {position:'absolute', left:bigCenterX, top:bigCenterY, outline:'1px dash #f00', 
                            display:'block', padding:0, margin:0, zIndex:me.conf.zIndex++, 
                            width:me.conf.defTinyWidth, height:me.conf.defTinyHeight},
                tinystr = me.pattern === 'bg' ? '<div id="' + tinyId + '" class="mdraggable"></div>' :
                            '<img id="' + tinyId + '" class="mdraggable" draggable="false" src="">';
            $.extend(true, tinycss, mycss);
            $tiny = $(tinystr);
            $tiny.css(tinycss);
            $('#'+me.outId).append($tiny);
            me.storeInfo(tinyId, tinycss);
            return tinyId;
        },
        // 删除一个tinyDiv. id:要删除的tinyDiv的id值
        delTiny: function(id){
            var me = this, out, tiny;
            if (me.conf.tinys[id]) {
                out = document.getElementById(me.outId);  // todo:out对象可以初始化时存下来。
                tiny = document.getElementById(id);       // todo: 每个对象都在初始化时存下来
                out.removeChild(tiny);
                me.delInfo(id);
            }
        },
        // 删除所有的tinys
        clearTinys: function(){
            for (var id in this.conf.tinys) {
                this.delTiny(id);
            }
        },
        // 获取方位left,top,width,height对象。obj:id值，元素对象或普通对象。 hasPx:true,有单位
        // obj是id和jquery,dom对象，通过查询元素获得位置参数；如果元素css旋转后(big)，获取的仍是未旋转时的缩放位置
        // obj是位置对象，返回提取的值
        // todo:
        getPst: function(obj, hasPx){
            var pst = {}, $el;
            if ( u.isString(obj) ) {
                // obj是元素的id,通过元素查询获取方位用于计算。无论设置的是什么，$(xx).css获取的值单位都是px
                // todo:应该优先通过查询存储的位置参数，直到传入明确通过元素查询位置（多穿一个参数指明）。
                $el = $('#'+obj);
                pst = {left:$el.css('left'), top:$el.css('top'), width:$el.css('width'), height:$el.css('height')};
            } else if ( u.isObject(obj) ) {
                if (obj instanceof jQuery || obj instanceof HTMLElement) {
                    // obj是jquery对象或者是dom对象
                    $el = $(obj);
                    pst = {left:$el.css('left'), top:$el.css('top'), width:$el.css('width'), height:$el.css('height')};
                } else {
                    pst = {left:obj.left, top:obj.top, width:obj.width, height:obj.height};
                }
            }
            return hasPx ? _f.addpx(pst) : _f.rmpx(pst);
        },
        // 设置参数left,top,width,height并保存，相对于out左上角的偏移，旋转后big应该设置为未旋转前的偏移。
        setPst: function(){
        
        },
        // 设置tiny的坐标并保存。 tiny:tiny的id(字符串)或序号(number) x,y:tiny相对于big的偏移（未缩放）
        // todo：不知道有直接设置tiny位置的函数不
        setTinyPstAboutBig: function(tiny, x, y){
            var me = this, 
                lt = {},    // tiny的左上角坐标(相对于out)
                tinyId = u.isNumber(tiny) ? Object.keys(me.conf.tinys)[tiny] : tiny;
            if ( !me.conf.tinys[tinyId] ) { console.warn('tiny的id不正确'); return false; }
            var bigPst = me.getPst(me.bigId),                               // big未旋转的缩放位置（相对于out）
                rBigPst = me.calcBigRange(bigPst, me.conf.rotateAngle);     // big旋转后的缩放位置（相对于out）
            lt.left = rBigPst.left + x * me.conf.scale;     // tiny的左缩放偏移
            lt.top = rBigPst.top + y * me.conf.scale;       // tiny的上缩放偏移
            $('#'+tinyId).css( _f.addpx(lt) );
            me.storeInfo(tinyId, lt);       // 保存
        },
        // 获取当前旋转角度下，tiny相对于big的偏移。 isOrigin：是否换算成缩放前的偏移和位置 
        // tiny:tiny的id或序号,不存在就返回所有的偏移
        getTinyPstAboutBig: function(tiny, isOrigin){
            var me = this,
                scale = me.conf.scale;
            // todo:写一个根据序号返回tinyId或对象的函数
            var tinyId = u.isNumber(tiny) ? Object.keys(me.conf.tinys)[tiny] : 
                            u.isString(tiny) ? tiny : '';
            var result = {},
                bigPst = me.getPst( me.readInfo(me.bigId) ),            // big未旋转时的缩放位置
                rBigPst = me.calcBigRange(bigPst, me.conf.rotateAngle); // big旋转后的缩放位置（相对于out）
            // 查询某一个tiny的偏移
            if (tinyId) {
                var rTinyPst = me.getPst( me.readInfo(tinyId) );        // tiny旋转后的缩放位置（相对于out）
                result.x = isOrigin ? (rTinyPst.left - rBigPst.left) / scale : (rTinyPst.left - rBigPst.left);
                result.y = isOrigin ? (rTinyPst.top - rBigPst.top) / scale : (rTinyPst.top - rBigPst.top);
                result[tinyId] = {
                    x: result.x,
                    y: result.y
                }
            // 查询所有tiny的偏移
            } else {
                for (var id in me.conf.tinys) {
                    var rTinyPst = me.getPst( me.readInfo(id) );    // tiny旋转后的缩放位置（相对于out）
                    result[id] = {
                        x: isOrigin ? (rTinyPst.left - rBigPst.left) / scale : (rTinyPst.left - rBigPst.left),
                        y: isOrigin ? (rTinyPst.top - rBigPst.top) / scale : (rTinyPst.top - rBigPst.top)
                    }
                }
            }
            return result;
        },
        // 存储相关信息。如果是tinyDiv，则在额外存一份位置(left,top,width,height)到me.conf.tinys里
        storeInfo: function( id , info ){
            var me = this,
                oldInfo = me.records[id] || ( me.records[id] = {} ),
                newInfo = $.extend( true, oldInfo, info );
            if ( me.ids.out !== id && me.ids.big !== id ) {
                // id是tinyDiv的id。即使info中不包含完left,top,width,height,也不会影响以前的值，因为newInfo做了extend
                me.conf.tinys[ id ] = _f.rmpx( {left:newInfo.left, top:newInfo.top, width:newInfo.width, height:newInfo.height} );
            }
            me.records[id] = newInfo;
        },
        // todo:无法删除out和big的消息
        delInfo: function( id ){
            if ( this.ids.out !== id || this.ids.big !== id ) {
                delete this.conf.tinys[ id ];
            }
            delete this.records[id];
        },
        // isPst：是否读取方位
        readInfo: function( id, isPst ){
            return isPst ? this.conf.tinys[ id ] : this.records[ id ];
        },
        // 计算某个旋转角度时div的边界范围。
        // divPst:未旋转时(旋转0度)div的位置{left:xx, top:xx, width:xx, top:xx};  rotateAngle: 旋转角度
        // todo：应该再加上一个函数，返回在某个旋转角度下的位置参数。
        // todo: 传tinyId就返回该big旋转角度下tiny的位置参数（因为tiny没有旋转，只是移动了位置）；
        calcBigRange: function( divPst, rotateAngle ){
            var me = this,
                newDivPst = {},
                // todo:写一个获取某div中心点的方法
                bigPst = me.getPst( me.ids.big ),   // bigDiv的位置
                bigCenterX = bigPst.left + bigPst.width/2,  // bigDiv的中心点X
                bigCenterY = bigPst.top + bigPst.height/2,  // bigDiv的中心点Y
                // 未旋转前div左下角(lb)的坐标
                lbX0 = divPst.left, 
                lbY0 = divPst.top + divPst.height, 
                // 未旋转前div右上角(rt)的坐标 
                rtX0 = divPst.left + divPst.width,  
                rtY0 = divPst.top,   
                // 未旋转前div‘左下角的点’和‘右上角的点’旋转rotateAngle角度后的位置{left:xx, top:xx}
                lbRotate = me.calcPointPstWhenRotate( lbX0, lbY0, bigCenterX, bigCenterY, 0, rotateAngle ),
                rtRotate = me.calcPointPstWhenRotate( rtX0, rtY0, bigCenterX, bigCenterY, 0, rotateAngle );
                // console.log('calcBigRange:',lbX0,lbY0, rtX0,rtY0, lbRotate, rtRotate);
            newDivPst.left = Math.min( lbRotate.left, rtRotate.left );
            newDivPst.top = Math.min( lbRotate.top, rtRotate.top );
            newDivPst.width = Math.abs( rtRotate.left - lbRotate.left );
            newDivPst.height = Math.abs( rtRotate.top - lbRotate.top );
            return newDivPst;
        },
        // 当tinyDiv越过bigDiv的边界时计算其修正位置，使其始终在bigPst的范围内
        calcTinyRepairPstWhenOverBig: function( tinyPst, bigPst ){
            var me = this,
                newTinyPst = tinyPst,
                // todo:这儿bigPst是big未旋转时的偏移位置（相对于out）,tinypst是big旋转后，tiny的偏移位置
                newBigPst = me.calcBigRange( bigPst, me.conf.rotateAngle ), // 当前旋转角度下bigDiv的位置
                state = me.checkTinyPstAboutBigDiv( tinyPst, newBigPst );   // 获取tinyDiv相对于当前旋转角度下bigDiv的位置
            if ( !state.inDiv ) {
                // 当tinyDiv拖出big边界时，计算新的tinyDiv的偏移，使其在bigPst范围内
                newTinyPst.left = state.overRight ? newBigPst.left + newBigPst.width - tinyPst.width :
                                        state.overLeft ? newBigPst.left : tinyPst.left;
                newTinyPst.top = state.overBottom ? newBigPst.top + newBigPst.height - tinyPst.height :
                                        state.overTop ? newBigPst.top : tinyPst.top;
            }
            return newTinyPst;
        },
        // 当drawDiv越过bigDiv边界时计算其修正位置，使其始终在bigDiv的范围内
        calcDrawRepairPstWhenOverBig: function( drawPst, bigPst, drawOrigPst ){
            var me = this,
                newDrawPst = drawPst,
                newBigPst = me.calcBigRange( bigPst, me.conf.rotateAngle ), // 当前旋转角度下bigDiv的位置
                state = me.checkTinyPstAboutBigDiv( drawPst, newBigPst );   // 获取drawDiv相对于当前旋转角度下bigDiv的位置
            if ( !state.inDiv ) {
                // 当drawDiv不全在bigDiv内时,修正drawPst的位置，使其始终在bigDiv范围内 
                // 绘制起点到bigDiv的四个边界的最长距离
                var maxWidthRight = Math.abs( newBigPst.left + newBigPst.width - drawOrigPst.left ),
                    maxWidthLeft = Math.abs( newBigPst.left - drawOrigPst.left ),
                    maxHeightTop = Math.abs( newBigPst.top - drawOrigPst.top ),
                    maxHeightBottom = Math.abs( newBigPst.top + newBigPst.height - drawOrigPst.top );
                newDrawPst.left = state.overLeft ? newBigPst.left : drawPst.left;
                newDrawPst.top = state.overTop ? newBigPst.top : drawPst.top;
                newDrawPst.width = state.overLeft ? maxWidthLeft : 
                                        state.overRight ? maxWidthRight : drawPst.width;
                newDrawPst.height = state.overTop ? maxHeightTop : 
                                        state.overBottom ? maxHeightBottom : drawPst.height;
            }
            return newDrawPst;
        },
        // 判断一个点相对于大Div的位置。返回[在div中?, 位于div的左边?， 位于div的右边?, 位于div的上边?, 位于div的下边?]
        // pleft,ptop:点的left和top偏移, bigPst:大div的位置{left:xx, top:xx, width:xx, height:xx}
        checkPointPstaboutBigDiv: function( pleft, ptop, bigPst ) {
            var state = {
                overLeft: pleft < bigPst.left,
                overRight: pleft > bigPst.left + bigPst.width,
                overTop: ptop < bigPst.top,
                overBottom: ptop > bigPst.top + bigPst.height,
            }
            state.inDiv = !overLeft && !overRight && !overTop && !overBottom;
            return state;
        },
        // 判断一个小Div相对于大div的位置。tinyPst:小div的位置，bigPst:大div的位置
        checkTinyPstAboutBigDiv: function( tinyPst, bigPst ) {
            var state = {
                overLeft: tinyPst.left < bigPst.left,  // tinyDiv左边界小于bigDiv左边界
                overRight: tinyPst.left + tinyPst.width > bigPst.left + bigPst.width,  // tinyDiv右边界大于bigDiv右边界
                overTop: tinyPst.top < bigPst.top, // tinyDiv上边界小于bigDiv上边界
                overBottom: tinyPst.top + tinyPst.height > bigPst.top + bigPst.height // tinyDiv下边界大于bigDiv下边界
            };
            state.inDiv = !state.overLeft && !state.overRight && !state.overTop && !state.overBottom;   // tinyDiv是否全部在bigDiv内
            return state;
        },
        // 以out为左上角为原点，相对于big中心点旋转到newAngle后的点坐标

        // 绑定事件:旋转,拖动,拖动选框
        bindEvents: function(){
            var me = this,
                oldX = 0, oldY = 0, // 鼠标在视口的初始位置
                diffX = 0, diffY = 0,   // 光标到元素的偏移
                drawDivId,         
                drawOrigPst = null, // 拖动绘制tinyDiv时，起始光标到out边界的偏移
                isDrawTiny = false, // 是否处于绘制tinyDiv状态中
                isMoveAll = false, 
                isMoveTiny = false;
                isMoveImgTiny = false;  // this.conf.pattern === img时，用这个
            // 拖动时触发的自定义事件
            DragDrop.on('dragstart', function(event){
                console.log('dragstart触发', event);
                var target = event.target;
                diffX = event.diffX;
                diffY = event.diffY;
                oldX = event.x;
                oldY = event.y;
                console.warn('dragstart1：', diffX, diffY, oldX, oldY);
                if ( target.className.indexOf('canDrawTinyDiv') > -1 ) {
                    // 手绘tinyDiv开始
                    isDrawTiny = true;
                    // 获取的是光标在big未旋转前的该位置到out左上角的偏移
                    drawOrigPst = _f.getCursorPosition( event.origEvent, $('#'+me.outId)[0] );  
                    var bigPst = me.getPst( me.ids.big ),   // bigDiv的位置
                        bigCenterX = bigPst.left + bigPst.width/2,  // bigDiv的中心点X
                        bigCenterY = bigPst.top + bigPst.height/2;  // bigDiv的中心点Y
                    // 手绘起点旋转后的点坐标
                    drawOrigPst = me.calcPointPstWhenRotate( drawOrigPst.left, drawOrigPst.top, bigCenterX, bigCenterY, 0, me.conf.rotateAngle );
                    var drawPst = {width:0, height:0, left: drawOrigPst.left, top: drawOrigPst.top};
                    drawDivId = me.addTinyDiv( _f.addpx(drawPst) );
                    me.storeInfo( drawDivId, _f.addpx(drawPst) );
                } else {
                    // 拖动div开始
                    if ( target.id === me.ids.big ) {
                        // 如果拖动big
                        isMoveAll = true;
                    } else if ( me.conf.tinys[ target.id ] ) {
                        // 如果拖动tinyDiv
                        isMoveTiny = true;    
                    }
                }
            });
            DragDrop.on('drag', function(event){
                console.log('drag触发', event);
                var target = event.target;
                if ( isDrawTiny ) {
                    var drawPst = me.getPst( me.records[ drawDivId ] ),
                        bigPst = me.getPst( me.records[ me.ids.big ] ),
                        width = event.x - oldX,     // 现在鼠标的位置 - 起点鼠标的位置
                        height = event.y - oldY;
                    // 计算drawDiv的宽高及位置。如果拖动使边界小于起始边界(width<0和height<0)，则更新起始边界
                    drawPst.left = width < 0 ? drawOrigPst.left + width : drawOrigPst.left; // 不要用drawPst.left,会引起累计误差
                    drawPst.top = height < 0 ? drawOrigPst.top + height : drawOrigPst.top;
                    drawPst.width = Math.abs( width );  
                    drawPst.height = Math.abs( height );
                    // 如果只允许drawDiv在bigDiv范围内，则鼠标超出bigDiv的边界时修正drawDiv的宽高及位置
                    if ( !me.conf.allowDrawOutBig ) {
                        drawPst = me.calcDrawRepairPstWhenOverBig( drawPst, bigPst, drawOrigPst );
                    }
                    $("#" + drawDivId).css( _f.addpx( drawPst ) );
                    me.storeInfo( drawDivId, _f.addpx( drawPst ) );
                } else if ( isMoveAll ) {
                    // 如果拖动big,则所有的tinyDiv也跟着big一起拖动，改变位置
                    // 改变bigDiv的位置
                    var bigPst = _f.addpx( {left: event.x-diffX, top: event.y-diffY} );
                    $('#'+ me.ids.big).css( bigPst );
                    me.storeInfo( me.ids.big, bigPst );
                    // 改变所有tinyDiv的位置
                    for ( var id in me.conf.tinys ) {
                        var tinyPst = me.getPst( me.records[ id ] );
                        tinyPst.left += event.x - oldX;     // left + x向偏移
                        tinyPst.top  += event.y -oldY;      // top + y向偏移
                        $('#'+id).css( _f.addpx(tinyPst) );
                        me.storeInfo( id, _f.addpx(tinyPst) );
                    }
                    oldX = event.x;
                    oldY = event.y;
                } else if ( isMoveTiny ) {
                    // 如果拖动tinyDiv，则只改变拖动tinyDiv的位置
                    var tinyPst = me.getPst( target.id );
                        bigPst = me.getPst( me.records[ me.ids.big ] );
                    tinyPst.left = event.x - diffX;
                    tinyPst.top = event.y - diffY;
                    // 如果只允许在bigDiv范围内拖动tinyDiv，则当拖动超出bigDiv边界时修正tinyPst的位置
                    if ( !me.conf.allowMoveOutBig ) {
                        tinyPst = me.calcTinyRepairPstWhenOverBig(tinyPst, bigPst);
                    }
                    $( target ).css( _f.addpx(tinyPst) );
                    me.storeInfo( target.id, _f.addpx(tinyPst) );
                }
            });
            DragDrop.on('dragend', function(event){
                console.log('dragend触发', event);
                var target = event.target;
                // 修正tinyDiv的位置
                if ( isDrawTiny ) {

                } else if ( isMoveAll ) {

                } else if ( isMoveTiny ) {
                    me.conf.dragendFn();        // 设置的dragend触发的函数
                    // 如果只允许在bigDiv范围内拖动tinyDiv，则当拖动超出bigDiv边界时修正tinyPst的位置
                    if ( !me.conf.allowMoveOutBig ) {
                        var tinyPst = me.getPst( target.id ),
                            bigPst = me.getPst( me.records[ me.ids.big ] ),
                            newTinyPst = _f.addpx( me.calcTinyRepairPstWhenOverBig(tinyPst, bigPst) );
                        $( target ).css( newTinyPst );
                        me.storeInfo( target.id, newTinyPst );
                    }
                }
                oldX = oldY = 0;
                isMoveAll = isMoveTiny = isDrawTiny = false;
            });
            // 放大缩小功能
            $( '#' + me.ids.out )[0].addEventListener('mousewheel', function(event){
                event = event || window.event;
                var target = event.target || event.srcElement,
                    // 获取滚轮值。向前滚是120的倍数，向后滚是-120的倍数。忽略opera9.5版本以前的浏览器。
                    // firefox滚轮信息保存在detail属性中，且向前滚值是-3，向后滚值是3。
                    wheelDelta =  event.wheelDelta || -event.detail*40,
                    isZoomIn = wheelDelta > 0 ? true : false;   // 向前滚放大，向后滚缩小
               me.zoomAll( event, isZoomIn );
               event.preventDefault();
               return false;
            });
        }
    }); 
    // 暴露FixIco
    window.FixIco = FixIco;
})(window, document, jQuery)

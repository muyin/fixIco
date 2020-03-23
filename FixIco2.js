;(function(window, document, $, undefined){
    // 常量
    var BRIGHT_OTLINE = '#f00 dashed 2px';  // 亮的outline线，用于tiny被选中时
    var BLANK_FN = function(){};                 // 空白函数

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
                    // event.clientX是事件发生时鼠标到视口左边的距离， target.offsetLeft是目标元素到视口左边的距离
                    diffX = event.clientX - target.offsetLeft;      // 鼠标到元素左边界的距离
                    diffY = event.clientY - target.offsetTop;       // 鼠标到元素上边界的距离
                    console.log('',event.pageX,event.x, target);
                    console.log('diffX,Y',diffX,diffY, event.clientX, event.clientY, target.offsetLeft, target.offsetTop);
                    if (target.className.indexOf('mdraggable') > -1) {
                        mdragging = target;
                        dragdrop.emit('dragstart', event, {target:mdragging, origEvent:event, diffX:diffX, diffY:diffY});
                    } else if (target.className.indexOf('draggable') > -1) {
                        dragging = target;
                        dragdrop.emit('dragstart', event, {target:dragging, origEvent:event, diffX:diffX, diffY:diffY});
                    }
                    break;
                case 'mousemove':
                    if (dragging !== null) {
                        // 指定位置，修护拖动时鼠标跑到目标元素左上角的bug
                        dragging.style.left = (event.clientX - diffX) + 'px';
                        dragging.style.top = (event.clientY - diffY) + 'px';
                        dragdrop.emit('drag', event, {target:dragging, origEvent:event});
                    } else if (mdragging !== null) {
                        dragdrop.emit('drag', event, {target:mdragging, origEvent:event});
                    }
                    break;
                case 'mouseup':
                    if (dragging !== null) {
                        dragdrop.emit('dragend', event, {target:dragging, origEvent:event});
                    } else if (mdragging !== null) {
                        dragdrop.emit('dragend', event, {target:mdragging, origEvent:event});
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
    // 是否是数字
    function isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }
    // 是否是函数
    function isFunction(value) {
        return typeof value === 'function';
    }
    // 是否是对象
    function isObject(value) {
        return _typeof(value) === 'object' && value !== null;
    }
    // 是否是字符串
    function isString(value){
        return typeof value === 'string';
    }
    /**
     * 拷贝源对象自身的并且可枚举的属性到目标对象
     * @param {*} obj - The object to be extended.
     * @param {*} args - The rest objects which will be merged to the first object.
     * @returns {Object} The extended object.
     */
    var assign = Object.assign || function assign(obj) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }
        if (isObject(obj) && args.length > 0) {
            args.forEach(function (arg) {
                if (isObject(arg)) {
                Object.keys(arg).forEach(function (key) {
                    obj[key] = arg[key];
                });
                }
            });
        }
        return obj;
    };
    var REGEXP_SUFFIX = /^(?:width|height|left|top|marginLeft|marginTop)$/;
    /**
     * Apply styles to the given element.
     * @param {Element} element - The target element.
     * @param {Object} styles - The styles for applying.
     */
    function setStyle(element, styles) {
        var style = element.style;
        $.each(styles, function (property, value) {
            if (REGEXP_SUFFIX.test(property) && isNumber(value)) {
                value += 'px';
            }
            style[property] = value;
        });
    }
    function getTransforms(_ref) {
        var rotate = _ref.rotate;
        var values = [];
        // Rotate should come first before scale to match orientation transform
        if (isNumber(rotate) && rotate !== 0) {
            values.push("rotate(".concat(rotate, "deg)"));
        }
        var transform = values.length ? values.join(' ') : 'none';
        return {
            WebkitTransform: transform,
            msTransform: transform,
            transform: transform
        };
    }

    var REGEXP_HYPHENATE = /([a-z\d])([A-Z])/g;
    /**
     * Transform the given string from camelCase to kebab-case
     * @param {string} value - The value to transform.
     * @returns {string} The transformed value.
     */
    function hyphenate(value) {
      return value.replace(REGEXP_HYPHENATE, '$1-$2').toLowerCase();
    }
    /**
     * Get data from the given element.
     * @param {Element} element - The target element.
     * @param {string} name - The data key to get.
     * @returns {string} The data value.
     */
    function getData(element, name) {
      if (isObject(element[name])) {
        return element[name];
      }
      if (element.dataset) {
        return element.dataset[name];
      }
      return element.getAttribute("data-".concat(hyphenate(name)));
    }
    /**
     * Set data to the given element.
     * @param {Element} element - The target element.
     * @param {string} name - The data key to set.
     * @param {string} data - The data value.
     */
    function setData(element, name, data) {
      if (isObject(data)) {
        element[name] = data;
      } else if (element.dataset) {
        element.dataset[name] = data;
      } else {
        element.setAttribute("data-".concat(hyphenate(name)), data);
      }
    }

    var tinyUtils = {
        // 生成全局唯一标识符guid(默认第一位是字母G,128位)
        generateGUID: function generateGUID(preStr){
            var guid = 'gxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); // Math.random()*16|0获取0~15的整数
                return v.toString(16);
            }).toUpperCase();
            return typeof preStr === 'string' ? preStr + guid : guid;
        }
    };
    var tinyRender = {
        init: function(op){
            op = typeof op === 'object' ? op : {};
            this.id = op.id || this.generateGUID(),             // id
            this.element = document.getElementById( this.id );  // 元素对象
            this.parent = typeof op.parent==='string' ? document.querySelector(op.parent) : op.parent;   // Tiny元素的包含元素对象
            this.title = op.tiny || '';         // 图片的名字
            this.index = op.index || 0;         // 图片的序号
            this.isZooming = false;             // 是否正在缩放
            this.isWheeling = false;            // 是否正在滚轮中
            this.isHiding = false;              // 是否正在隐藏中
            this.initialshowData = null;         // 初始状态参数对象,属性值同this.showData
            this.pattern = op.pattern || 'img'; // 模式 img或div
            this.src = op.src || '';
            this.group = [];
            this.bindEvents = op.bindEvents || BLANK_FN;    // 自己的绑定事件方法

            this.showData = {
                display: op.display || 'block',          // 显隐状态
                left: op.left || 0,
                top: op.top || 0,
                width: op.width || 80,                  // 目前宽度
                height: op.height || 80,                // 目前高度
                naturalWidth: op.naturalWidth || op.width || 80,        // 对象的原始宽度
                naturalHeight: op.naturalHeight || op.height || 80,     // 对象的原始高度
                aspectRatio: undefined,                 // 纵横比，用于确认哪个作为长边。naturalWidth / naturalHeight
                zIndex: op.zIndex || 1000,
                rotate: op.rotate || 0,                 // 旋转角度
                ratio: op.ratio || 1,                   // 缩放比例。oldRatio通过计算获得，即oldRatio = width / naturalWidth
                outline: "#c5c5c5 dashed 1px",          // 边框
                overflow:"hidden",
                position: "absolute",

                clickable: op.clickable || true,        // 是否可单击选中
                draggable: op.draggable || true,        // 是否可拖动
                movable: op.movable || true,            // 能否可移动
                rotatable: op.rotatable || true,        // 能否可旋转
                zoomable: op.zoomable || true,          // 能否可缩放图片
                zoomOnWheel: op.zoomOnWheel || true,    // 能否可鼠标滚轮缩放图片
                // scalable: true,                      // 是否可扩展(即上下翻转，左右翻转)
            };
            console.log('tiny', op);
            this.initHtml();
            this.renderImage();
            
            this.enableDrag(true);      // 开启拖放功能
            this.bindDefEvents();      // 绑定默认事件
            this.bindEvents.call(this, DragDrop);      // 绑定自己的事件方法
        },
        initHtml: function(){
            var me = this,
                imgStr = '<img id="' + me.id + '" class="mdraggable" draggable="false" src="' + me.src+ '">',
                divStr = '<div id="' + me.id + '" class="mdraggable"></div>',
                tinyStr = me.pattern === 'img' ?  imgStr : divStr;
            $tiny = $( tinyStr );
            me.element = $tiny[0];  // 元素对象
            me.parent.appendChild( me.element );
        },
        // 渲染元素方法. done：回调函数
        renderImage: function renderImage(done) {
            var me = this,
                showData = me.showData;
            setStyle( me.element, assign({
                width: showData.width,
                height: showData.height,
                left: showData.left,
                top: showData.top,
                zIndex: showData.zIndex,
                display: showData.display,
                outline: showData.outline,
                position: showData.position
            }, getTransforms(showData)));
        
            if (done) { done(); }
        },
    };

    var handlers = {
        dragFn: function(event){
            event = event || window.event;
            var target = event.target || event.srcElement;
            // 确定事件类型
            switch(event.type){
                case 'mousedown':
                    me.emit('dragstart', event, {target:target, origEvent:event});
                    me.dragging = true;
                    me.dragData = {
                        diffX = 
                    };
                    break;
                case 'mousemove':
                    me.emit('drag', event, {target:target, origEvent:event});
                    break;
                case 'mouseup':
                    dragdrop.emit('dragend', event, {target:target, origEvent:event});
                    break;
            }
        },
        clickFn: function(event){
            console.log('click事件', event);
            event = event || window.event;
            var target = event.target || event.srcElement;
            me.showData.outline = BRIGHT_OTLINE;
            me.renderImage();
            me.on('click', function(event){
                console.log('click事件', event);
            });
        },
        bindDefEvents: function(){
            var me = this;
            document.addEventListener('mousedown', me.dragFn.bind(me));
            document.addEventListener('mousemove', me.dragFn.bind(me));
            document.addEventListener('mouseup', me.dragFn.bind(me));
            // 单击方法
            me.enableClick = function(){
                me.showData.clickable = true;
                me.element.addEventListener('click', me.clickFn.bind(me));
            };
            me.disableClick = function(){
                me.element.removeListener('click', me.clickFn.bind(me));
            };
            // 拖动方法
            me.enableDrag = function(){
                me.showData.draggable = true;

            };
            me.disableDrag = function(){
                me.showData.draggable = false;
            };
        },
    };
    var tinyMethods = {
        enableDrag: function(state){
            if (arguments.length === 0) {
                return this.showData.draggable;
            }
            this.showData.draggable = state ? true : false;
            if (state) {
                DragDrop.enable();  // 开启拖放功能
            } else {
                DragDrop.disable(); // 关闭拖放功能
            }
        },
        enableMove: function(state){
            if (arguments.length === 0) {
                return this.showData.movable;
            }
            this.showData.movable = state ? true : false;
            this.group.forEach(function(item){
                item.enableMove(state);
            });
        },
        enableZoom: function(state){
            if (arguments.length === 0) {
                return this.showData.zoomable;
            }
            this.showData.zoomable = state;
            this.group.forEach(function(item){
                item.enableZoom(state);
            });
        },
        // 移动元素对象。 offsetX,offsetY {number} 移动偏移。 returns当前对象
        move: function move(offsetX, offsetY) {
            var x = this.showData.left + Number(offsetX),
                y = this.showData.top + Number(offsetY);
            this.moveTo(x, y);
            return this;
        },
        // 移动元素对象至某个指定位置。 x, [y=x] {number} 位置坐标。 return当前对象
        moveTo: function moveTo(x, y) {
            x = Number(x);
            y = arguments.length > 1 && arguments[1] !== undefined ? Number(arguments[1]) : x;
            if (this.showData.movable) {
                if (isNumber(x) && isNumber(y)) {
                    this.showData.left = x;
                    this.showData.top = y;
                    this.renderImage();
                }
            }
            return this;
        },
        // 缩放元素对象。 ratio：缩放比例， hasTooltip：{booldean} 是否显示缩放比例,可选，默认false, return当前对象
        zoom: function zoom(ratio, hasTooltip, _originalEvent) {
            ratio = Number(ratio);
            ratio = ratio < 0 ? 1 / (1 - ratio) : 1 + ratio;
            var newRatio = (this.showData.width * ratio) / this.showData.naturalWidth;
            this.zoomTo(newRatio, hasTooltip, _originalEvent);
            return this;
        },
        // 缩放元素对象至指定比例。 ratio:缩放比例， hasTooltip：是否显示缩放比例,可选，默认false
        zoomTo: function zoomTo(ratio, hasTooltip, _originalEvent) {
            var me = this;
            var showData = this.showData;
            var width = showData.width,
                height = showData.height,
                left = showData.left,
                top = showData.top,
                naturalWidth = showData.naturalWidth,
                naturalHeight = showData.naturalHeight;

            ratio = Number(ratio);
            hasTooltip = hasTooltip ? true : false;
            _originalEvent = _originalEvent ? _originalEvent : null;

            if (!me.showData.zoomable) { return this; }
            if (!isNumber(ratio)) { return this; }
            if (ratio > 0.95 && ratio < 1.05) { ratio = 1; }
            ratio = Math.max(0, ratio);
    
            var newWidth = naturalWidth * ratio;    // 缩放后的宽度
            var newHeight = naturalHeight * ratio;  // 缩放后的高度
            var offsetWidth = newWidth - width;     // 补偿宽度
            var offsetHeight = newHeight - height;  // 补偿高度
            var oldRatio = width / naturalWidth;    // 老缩放值

            me.emit('zoom', {ratio: ratio, oldRatio: oldRatio, originalEvent: _originalEvent});
            // 如果zoom触发事件中，阻止继续缩放，则返回
            // if (me.abort('zoom')) {
            //     me.recover('zoom');
            //     return this; 
            // }
            if (this.abortZoom === true) {
                this.abortZoom = false;
                return this;
            }

            this.zooming = true;
            // 以鼠标位置缩放
            if (_originalEvent) {
                var offset = getOffset(me.element);
                // event.pageX 和 event.pageY获取到的是触发点相对文档区域左上角距离，会随着页面滚动而改变。IE9+支持
                var center = {
                    pageX: _originalEvent.pageX,   
                    pageY: _originalEvent.pageY
                }; // Zoom from the triggering point of the event      
                showData.left -= offsetWidth * ((center.pageX - offset.left - left) / width);
                showData.top -= offsetHeight * ((center.pageY - offset.top - top) / height);
            // 以元素中心点缩放
            } else {
                showData.left -= offsetWidth / 2;
                showData.top -= offsetHeight / 2;
            }
            showData.width = newWidth;
            showData.height = newHeight;
            showData.ratio = ratio;

            this.renderImage(function () {
                me.zooming = false;
                me.emit('zoomed', {ratio: ratio, oldRatio: oldRatio, originalEvent: _originalEvent});
            });

            if (hasTooltip) { this.tooltip(); }
            return this;
        },
        rotate: function(){

        },
        rotateTo: function(){

        },
        
    };
    var BgMethods = {
        addInGroup: function(tiny){
            this.group.push(tiny);
        },
        move: function(){
            Tiny.prototype.move.apply(this, arguments);
        },
        moveTo: function(){
            Tiny.prototype.moveTo.apply(this, arguments);
        },
        zoom: function(){
            Tiny.prototype.zoom.apply(this, arguments);
        },
        zoomTo: function(){
            Tiny.prototype.zoomTo.apply(this, arguments);
        },

    };
    var fixIcoRender = {
        init: function(conf){
            var me = this;
            var defconf = { // 默认配置
                pattern: 'img',     // 模式：'div','img'
                tinys: {},  // 用来存放tinyDiv
                tinyWidth: 50,
                tinyHeight: 50,
                format: 'image/png',
                zIndex: 1000,
                rotate: 0,
                zoomRatio: 0.1,     // 默认缩放比例
                // styles: {}    // 存放样式
            }
            me.conf = $.extend( true, {}, defconf, conf);
            console.log('fixIco', me.conf);

            me.domStyles = {
                width: me.conf.width || 600,
                height: me.conf.height || 500,
                padding: '10px'
            };
            me.outStyles = {
                position:"relative", 
                width:me.domStyles.width, 
                height:me.domStyles.height, 
                margin:0, 
                padding:0, 
                border:0, 
                outline:"#c5c5c5 solid 1px", 
                overflow:"hidden", 
                zIndex: me.conf.zIndex++ 
            };
            me.domId = me.conf.dom;           // 关联的元素
            me.outId = me.generateGUID();
            me.bigId = me.generateGUID();
            me.tinys = {};
            me.records = {};        // 存储所有的对象
            me.big = null;
            me.domElement = document.getElementById( me.domId );
            me.bindEvents = me.conf.bindEvents || BLANK_FN;

            me.initStyles();
            me.initHtml();
            DragDrop.enable();  // 开启拖放功能
            me.bindEvents();    // 绑定事件
        },
        initStyles: function(){
            var me = this, 
                styles = me.conf.styles;
            // styles[me.outId] = {position:"relative", width:"100%", height:"100%", margin:0, padding:0, border:0, 
            //                     outline:"#c5c5c5 solid 1px", overflow:"hidden", zIndex: me.conf.zIndex++ };
            // styles[me.bigId] = {position:"absolute", display:"block", visibility:"hidden", left:"10%", top:"10%",
            //                     width:"80%", height:"80%", margin:0, padding:0, bordre:0, zIndex:me.conf.zIndex++, outline:"1px dashed #f00"};
        },
        initHtml: function(){
            var me = this,
                outHtml = '<div id="' + me.outId + '"></div>';
            me.domElement.innerHTML = outHtml;
            me.outElement = document.getElementById(me.outId);
            setStyle(me.domElement, me.domStyles);
            setStyle(me.outElement, me.outStyles);

            // 生成背景big
            me.addBg();
            // bigImgStr = '<img id="' + me.big + '" class="mdraggable" draggable="false" src="">',
            // bigDivStr = '<div id="' + me.big + '" class="mdraggable"></div>',
            // var bigHtml = me.conf.pattern === 'img' ? bigImgStr : bigDivStr,
            //     outHtml = '<div id="' + me.out + '">' + big + '</div>';
            // $('#'+me.dom).html( outHtml );
        },
        
    };
    var fixIcoMethods = {
        // 能否移动。true:能移动， false:不能移动
        enableMove: function(tinyId, state){
            if ( this.records[tinyId] ) {
                this.records[tinyId].enableMove(state);
            }
            return this;
        },
        enableZoom: function(tinyId, state){
            if ( this.records[tinyId] ) {
                this.records[tinyId].zoomable(state);
            }
            return this;
        },
        // 滚轮缩放事件方法。向下滚动缩小，向上滚动放大
        wheel: function wheel(event) {
            var me = this;
            event.preventDefault(); 
            // Limit wheel speed to prevent zoom too fast
            if (this.wheeling) { return; }
            this.wheeling = true;
            setTimeout(function () {
                me.wheeling = false;
            }, 50);
            var ratio = Number(this.conf.zoomRatio) || 0.1;
            var delta = 1;
            // 1.deltaY属性在向下滚动时返回正值，向上滚动时返回负值，否则为0。只读。
            //   deltaX属性在向右滚动时返回正值，向左滚动时返回负值，否则为0。只读。大多数鼠标设备无法向左和向右滚动，并且始终返回0
            // 2.IE、chrome监听的是wheelDelta,向下滚动其值为-120；向上滚动其值为120
            //   FF监听的是detail,向下滚动其值为3；向上滚动其值为-3
            // 在滚轮滚动时mousewheel是一次次触发的。这儿，向下滚动时delta=1，向上滚动时delta=-1
            if (event.deltaY) {
                delta = event.deltaY > 0 ? 1 : -1;
            } else if (event.wheelDelta) {
                delta = -event.wheelDelta / 120;
            } else if (event.detail) {
                delta = event.detail > 0 ? 1 : -1;
            }
            this.zoom(-delta * ratio, true, event); // 向下滚动时缩小，因传入负值
        },
        addBg: function(){
            var me = this;
            var bigOptions = {
                pattern: 'img',
                type: 'bg',
                parent: me.outElement,
                id: me.bigId,
                index: me.conf.zIndex++,
                left: 0,
                top: 0,
                width: me.domStyles.width,
                height: me.domStyles.height,
                outline:"1px dashed #f00",
                // visibility:"hidden"
                display: me.conf.display,
                src: me.conf.src
            };
            console.log("bigOptions",bigOptions);
            me.big = new Bg(bigOptions);  // big实例对象。注：element里存元素对象
        },
        addInGroup: function(groupName){
            
        },
        addSimpleTiny: function(options){
            var tiny = new Tiny(options);
            this.tinys[tiny.id] = tiny;
            return tiny;
        },
        // 移动元素对象。 offsetX,offsetY {number} 移动偏移。 returns当前对象
        move: function move(offsetX, offsetY) {
            this.big.move(offsetX, offsetY);
        },
          // 移动元素对象至某个指定位置。 x, [y=x] {number} 位置坐标。 return当前对象
        moveTo: function(x, y){
            this.big.moveTo(x, y);
        },
        zoom: function zoom(ratio, hasTooltip, _originalEvent) {       
            this.big.zoom(ratio, hasTooltip, _originalEvent);
        },
        zoomTo: function zoomTo(ratio, hasTooltip, _originalEvent) {
            this.big.zoomTo(ratio, hasTooltip, _originalEvent);
        }
    };
    // Tiny类
    function Tiny(op){
        this.init(op);
    }
    // 给类添加属性方法
    Tiny.extend = function(obj){
        var extended = obj.extend;
        for (var i in obj) {
            Tiny[i] = obj[i];
        }
        if (extended) { extended(Tiny); }
    };
    // 给实例添加属性方法
    Tiny.include = function(obj){
        var included = obj.included;
        for (var i in obj) {
            Tiny.prototype[i] = obj[i];
        }
        if (included) { included(Tiny); }
    };
    // Tiny.extend(  );
    Tiny.include( assign({}, Event(), tinyUtils, tinyRender, tinyMethods, handlers) );

    // 背景类
    function Bg(op){
        Tiny.call(this, op);
    }
    Bg.prototype = Object.create(Tiny.prototype);
    Bg.prototype.constructor = Tiny;
    Bg.include = function(obj){
        var included = obj.included;
        for (var i in obj) {
            Bg.prototype[i] = obj[i];
        }
        if (included) { included(Bg); }
    };
    Bg.include( assign({}, BgMethods) );

    // FixIco类,继承Tiny类
    function FixIco(conf){
        this.init(conf);
    }
    FixIco.prototype = Object.create(Bg.prototype);
    FixIco.prototype.constructor = Bg;

    FixIco.include = function(obj){
        var included = obj.included;
        for (var i in obj) {
            FixIco.prototype[i] = obj[i];
        }
        if (included) { included(FixIco); }
    };

    FixIco.include( assign({}, fixIcoRender, fixIcoMethods) );

    window.FixIco = FixIco;
})(window, document, jQuery)